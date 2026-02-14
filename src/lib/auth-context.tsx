'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  logout: () => Promise<void>
  canAccessLine: (lineId: string) => boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ error: 'Not initialized' }),
  logout: async () => {},
  canAccessLine: () => false,
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
      // Call RPC function to verify password
      const { data, error: rpcError } = await supabase.rpc('login_app_user', {
        p_employee_code: employeeCode,
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

  const logout = async () => {
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
  }

  const canAccessLine = (lineId: string): boolean => {
    if (!user) return false
    if (user.role === 'admin') return true
    return user.allowedLines.includes(lineId)
  }

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, canAccessLine, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
