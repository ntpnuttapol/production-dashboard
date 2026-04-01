import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseEnv } from '@/lib/public-env'

export async function createClient() {
  const cookieStore = await cookies()
  const { supabaseUrl, supabaseKey } = getSupabaseEnv()

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
