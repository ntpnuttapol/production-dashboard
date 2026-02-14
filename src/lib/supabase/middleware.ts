import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Auth is handled client-side via localStorage
  // Middleware just passes through
  return NextResponse.next({ request })
}

