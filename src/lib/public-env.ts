function sanitizeEnvValue(value?: string | null) {
  if (!value) {
    return null
  }

  const firstLine = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean)

  if (!firstLine) {
    return null
  }

  if (/^[A-Z0-9_]+=/.test(firstLine)) {
    const separatorIndex = firstLine.indexOf('=')
    return firstLine.slice(separatorIndex + 1).trim() || null
  }

  return firstLine
}

function sanitizeUrl(value?: string | null) {
  const sanitized = sanitizeEnvValue(value)

  if (!sanitized) {
    return null
  }

  try {
    return new URL(sanitized).toString()
  } catch {
    return null
  }
}

export function getSupabaseEnv() {
  return {
    supabaseUrl: sanitizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseKey: sanitizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  }
}

export function getHubUrl() {
  return sanitizeUrl(process.env.NEXT_PUBLIC_HUB_URL) || 'https://polyfoampfs-hub.vercel.app/'
}
