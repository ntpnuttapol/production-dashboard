import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_HUB_ORIGINS = [
  process.env.NEXT_PUBLIC_HUB_URL,
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
    : normalizeOrigin(process.env.NEXT_PUBLIC_HUB_URL) || 'https://polyfoampfs-hub.vercel.app'

  return `${origin}/api/sso/validate`
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

    // Return Hub user info - Finishing will map this to local user
    return NextResponse.json({
      success: true,
      hubUser: {
        hubUserId: validateData.user.hubUserId,
        hubEmail: validateData.user.hubEmail,
        hubUserMetadata: validateData.user.hubUserMetadata,
        systemRoles: validateData.user.systemRoles,
        requestedSystemRole: validateData.user.requestedSystemRole
      }
    })

  } catch (error) {
    console.error('SSO exchange error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
