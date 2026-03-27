import { NextRequest, NextResponse } from 'next/server'

const HUB_VALIDATE_URL = process.env.NEXT_PUBLIC_HUB_URL 
  ? `${process.env.NEXT_PUBLIC_HUB_URL}/api/sso/validate`
  : 'http://localhost:3000/api/sso/validate'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sso_token } = body

    if (!sso_token) {
      return NextResponse.json(
        { error: 'Missing sso_token' },
        { status: 400 }
      )
    }

    // Validate token with Hub
    const validateRes = await fetch(HUB_VALIDATE_URL, {
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
