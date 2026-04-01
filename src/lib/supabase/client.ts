import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseEnv } from '@/lib/public-env'

export function createClient() {
  const { supabaseUrl, supabaseKey } = getSupabaseEnv()

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
