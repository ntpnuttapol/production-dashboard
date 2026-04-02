'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WorkMode } from '@/lib/work-modes'

const SESSION_KEY = 'app_user_session'

export interface AppUser {
  id: string
  employeeId: string
  fullName: string
  role: 'admin' | 'user'
  department: 'production' | 'finishing' | 'all'
  allowedLines: string[]
}

interface AuthContextType {
  user: AppUser | null
  loading: boolean
  login: (employeeId: string, password: string) => Promise<{ error: string | null }>
  loginWithSso: (ssoToken: string, hubOrigin?: string | null) => Promise<{ error: string | null; user?: AppUser }>
  logout: () => Promise<void>
  canAccessLine: (lineId: string) => boolean
  canAccessDepartment: (department: WorkMode) => boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ error: 'Not initialized' }),
  loginWithSso: async () => ({ error: 'Not initialized' }),
  logout: async () => {},
  canAccessLine: () => false,
  canAccessDepartment: () => false,
  isAdmin: false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as AppUser
        setUser(parsed)
      }
    } catch (err) {
      console.error('Error loading session:', err)
      localStorage.removeItem(SESSION_KEY)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = async (employeeCode: string, password: string): Promise<{ error: string | null }> => {
    try {
      const normalizedEmployeeCode = employeeCode.trim().toUpperCase()
      if (!normalizedEmployeeCode) {
        return { error: 'กรุณากรอกรหัสพนักงาน' }
      }

      // Call RPC function to verify password
      const { data, error: rpcError } = await supabase.rpc('login_app_user', {
        p_employee_code: normalizedEmployeeCode,
        p_password: password,
      })

      if (rpcError) {
        return { error: `เกิดข้อผิดพลาด: ${rpcError.message}` }
      }

      if (data?.error) {
        return { error: data.error }
      }

      if (!data?.id) {
        return { error: 'ไม่สามารถเข้าสู่ระบบได้' }
      }

      // Save user to state + localStorage
      const appUser: AppUser = {
        id: data.id,
        employeeId: data.employee_code || '',
        fullName: data.full_name || '',
        role: data.role === 'admin' ? 'admin' : 'user',
        department: data.department || 'production',
        allowedLines: data.allowed_lines || [],
      }

      setUser(appUser)
      localStorage.setItem(SESSION_KEY, JSON.stringify(appUser))
      return { error: null }
    } catch (err) {
      console.error('Login error:', err)
      return { error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' }
    }
  }

  const loginWithSso = async (ssoToken: string, hubOrigin?: string | null): Promise<{ error: string | null; user?: AppUser }> => {
    try {
      // Validate token with our API
      const res = await fetch('/api/auth/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sso_token: ssoToken,
          hub_origin: hubOrigin || null,
        })
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        return { error: data.error || 'SSO login failed' }
      }

      // For now, create a session from Hub user data
      // In production, you should map Hub user to local user via employee_code or email
      const hubEmail = data.hubUser?.hubEmail || ''
      const hubMetadata = data.hubUser?.hubUserMetadata || {}
      
      // Try to get employee code from metadata or email prefix
      const employeeCode = hubMetadata.employee_code || hubMetadata.employeeId || hubEmail.split('@')[0] || 'HUB_USER'
      
      // Look up local user by employee code
      const { data: localUser, error: lookupError } = await supabase
        .from('profiles')
        .select('id, employee_code, full_name, role, department, allowed_lines')
        .eq('employee_code', employeeCode.toUpperCase())
        .single()

      if (lookupError || !localUser) {
        // If no mapping found, create a temporary session with Hub user info
        // This allows access but with limited permissions
        const tempUser: AppUser = {
          id: data.hubUser.hubUserId,
          employeeId: employeeCode.toUpperCase(),
          fullName: hubMetadata.full_name || hubMetadata.name || hubEmail.split('@')[0] || 'Hub User',
          role: 'user',
          department: 'all',
          allowedLines: []
        }
        
        setUser(tempUser)
        localStorage.setItem(SESSION_KEY, JSON.stringify(tempUser))
        return { error: null, user: tempUser }
      }

      // Use mapped local user
      const appUser: AppUser = {
        id: localUser.id,
        employeeId: localUser.employee_code || '',
        fullName: localUser.full_name || '',
        role: localUser.role === 'admin' ? 'admin' : 'user',
        department: localUser.department || 'production',
        allowedLines: localUser.allowed_lines || []
      }

      setUser(appUser)
      localStorage.setItem(SESSION_KEY, JSON.stringify(appUser))
      return { error: null, user: appUser }

    } catch (err) {
      console.error('SSO login error:', err)
      return { error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบผ่าน SSO' }
    }
  }

  const logout = async () => {
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
  }

  const canAccessLine = (lineId: string): boolean => {
    if (!user) return false
    if (user.role === 'admin') return true

    if (user.allowedLines.includes(lineId)) {
      return true
    }

    // Fallback for users whose profile has department access
    // but no explicit line mapping yet.
    if (user.allowedLines.length === 0) {
      if (user.department === 'all') {
        return true
      }

      if (user.department === 'production') {
        return lineId.startsWith('LINE-')
      }

      if (user.department === 'finishing') {
        return lineId.startsWith('FINISH-')
      }
    }

    return false
  }

  const canAccessDepartment = (department: WorkMode): boolean => {
    if (!user) return false
    if (user.role === 'admin') return true
    if (user.department === 'all') return true
    return user.department === department
  }

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithSso, logout, canAccessLine, canAccessDepartment, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
