import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getHubUrl, getSupabaseEnv, getSupabaseServiceEnv } from '@/lib/public-env'

const DEFAULT_HUB_ORIGINS = [
  getHubUrl(),
  'https://polyfoampfs-hub.vercel.app',
  'https://pfs-portal.vercel.app',
  'http://localhost:3000',
].filter(Boolean) as string[]

function normalizeOrigin(value?: string | null) {
  if (!value) {
    return null
  }

  try {
    const url = new URL(value)
    return url.origin
  } catch {
    return null
  }
}

function resolveHubValidateUrl(hubOrigin?: string | null) {
  const allowedOrigins = new Set(
    DEFAULT_HUB_ORIGINS.map((origin) => normalizeOrigin(origin)).filter(Boolean) as string[]
  )

  const requestedOrigin = normalizeOrigin(hubOrigin)
  const origin = requestedOrigin && allowedOrigins.has(requestedOrigin)
    ? requestedOrigin
    : normalizeOrigin(getHubUrl()) || 'https://polyfoampfs-hub.vercel.app'

  return `${origin}/api/sso/validate`
}

type LocalProfile = {
  id: string
  employee_code: string | null
  full_name: string | null
  role: 'admin' | 'user' | null
  department: 'production' | 'finishing' | 'all' | null
  allowed_lines: string[] | null
}

function resolveEmployeeCode(
  hubEmail: string,
  hubMetadata: Record<string, unknown>
) {
  const rawCode =
    hubMetadata.employee_code ||
    hubMetadata.employeeId ||
    hubMetadata.employee_id ||
    hubMetadata.username ||
    hubEmail.split('@')[0]

  if (!rawCode || typeof rawCode !== 'string') {
    return null
  }

  return rawCode.trim().toUpperCase()
}

function resolveFullName(
  hubEmail: string,
  hubMetadata: Record<string, unknown>
) {
  const rawName =
    hubMetadata.full_name ||
    hubMetadata.name ||
    hubMetadata.username ||
    hubEmail.split('@')[0] ||
    'Hub User'

  return typeof rawName === 'string' && rawName.trim()
    ? rawName.trim()
    : 'Hub User'
}

function mapLocalUser(profile: LocalProfile) {
  return {
    id: profile.id,
    employeeId: profile.employee_code || '',
    fullName: profile.full_name || '',
    role: profile.role === 'admin' ? 'admin' : 'user',
    department: profile.department || 'all',
    allowedLines: profile.allowed_lines || [],
  }
}

async function findOrProvisionLocalUser(
  employeeCode: string,
  fullName: string
) {
  const { supabaseUrl: serviceSupabaseUrl, serviceRoleKey } = getSupabaseServiceEnv()
  const { supabaseUrl: anonSupabaseUrl, supabaseKey } = getSupabaseEnv()
  const supabaseUrl = serviceSupabaseUrl || anonSupabaseUrl
  const supabaseAccessKey = serviceRoleKey || supabaseKey

  if (!supabaseUrl || !supabaseAccessKey) {
    throw new Error('Missing Supabase environment variables for SSO provisioning')
  }

  const supabase = createClient(supabaseUrl, supabaseAccessKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const selectFields = 'id, employee_code, full_name, role, department, allowed_lines'
  const normalizedCode = employeeCode.trim().toUpperCase()

  const { data: existingUser, error: lookupError } = await supabase
    .from('profiles')
    .select(selectFields)
    .eq('employee_code', normalizedCode)
    .maybeSingle<LocalProfile>()

  if (lookupError) {
    throw new Error(lookupError.message)
  }

  if (existingUser) {
    if (existingUser.department) {
      return { localUser: mapLocalUser(existingUser), autoProvisioned: false }
    }

    const { data: repairedUser, error: repairError } = await supabase
      .from('profiles')
      .update({
        full_name: existingUser.full_name || fullName,
        department: 'all',
        allowed_lines: existingUser.allowed_lines || [],
      })
      .eq('id', existingUser.id)
      .select(selectFields)
      .single<LocalProfile>()

    if (repairError || !repairedUser) {
      throw new Error(repairError?.message || 'Unable to repair local profile')
    }

    return { localUser: mapLocalUser(repairedUser), autoProvisioned: false }
  }

  const { data: insertedUser, error: insertError } = await supabase
    .from('profiles')
    .insert({
      employee_code: normalizedCode,
      full_name: fullName,
      role: 'user',
      department: 'all',
      allowed_lines: [],
    })
    .select(selectFields)
    .single<LocalProfile>()

  if (insertError || !insertedUser) {
    throw new Error(insertError?.message || 'Unable to create local profile')
  }

  return { localUser: mapLocalUser(insertedUser), autoProvisioned: true }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sso_token, hub_origin } = body

    if (!sso_token) {
      return NextResponse.json(
        { error: 'Missing sso_token' },
        { status: 400 }
      )
    }

    const validateUrl = resolveHubValidateUrl(hub_origin)

    // Validate token with Hub
    const validateRes = await fetch(validateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: sso_token,
        systemId: 'project-finishing'
      })
    })

    const validateData = await validateRes.json()

    if (!validateRes.ok || validateData.error) {
      return NextResponse.json(
        { error: validateData.error || 'Invalid token' },
        { status: validateRes.status || 401 }
      )
    }

    const hubEmail = validateData.user.hubEmail || ''
    const hubUserMetadata = validateData.user.hubUserMetadata || {}
    const employeeCode = resolveEmployeeCode(hubEmail, hubUserMetadata)

    if (!employeeCode) {
      return NextResponse.json(
        { error: 'Missing employee code for SSO mapping' },
        { status: 400 }
      )
    }

    const fullName = resolveFullName(hubEmail, hubUserMetadata)
    const { localUser, autoProvisioned } = await findOrProvisionLocalUser(employeeCode, fullName)

    return NextResponse.json({
      success: true,
      hubUser: {
        hubUserId: validateData.user.hubUserId,
        hubEmail,
        hubUserMetadata,
        systemRoles: validateData.user.systemRoles,
        requestedSystemRole: validateData.user.requestedSystemRole
      },
      localUser,
      autoProvisioned,
    })

  } catch (error) {
    console.error('SSO exchange error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
