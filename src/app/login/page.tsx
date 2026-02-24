'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await login(employeeId, password)
      if (result.error) {
        setError(result.error)
        return
      }
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เข้าสู่ระบบล้มเหลว')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
      }}>
        {/* Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏭</div>
          <h1 style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '16px',
            background: 'linear-gradient(90deg, #F59E0B, #10B981)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 8px',
          }}>
            PRODUCTION
          </h1>
          <p style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '9px',
            color: '#64748B',
            margin: 0,
          }}>
            FINISHING DASHBOARD
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: '#1E293B',
          border: '3px solid #334155',
          boxShadow: '6px 6px 0 0 rgba(0,0,0,0.5)',
          padding: '28px',
        }}>
          <h2 style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '11px',
            color: '#F59E0B',
            margin: '0 0 24px',
            textAlign: 'center',
          }}>
            🔐 LOGIN
          </h2>

          {error && (
            <div style={{
              padding: '12px',
              background: '#7F1D1D',
              border: '2px solid #EF4444',
              color: '#FCA5A5',
              marginBottom: '16px',
              fontSize: '13px',
              textAlign: 'center',
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#F59E0B',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                🪪 รหัสพนักงาน
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="เช่น PROD001"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '16px',
                  border: '2px solid #334155',
                  background: '#0F172A',
                  color: '#F1F5F9',
                  outline: 'none',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#F59E0B',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                🔒 รหัสผ่าน
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="รหัสผ่าน"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '16px',
                  border: '2px solid #334155',
                  background: '#0F172A',
                  color: '#F1F5F9',
                  outline: 'none',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading
                  ? '#475569'
                  : 'linear-gradient(90deg, #F59E0B, #10B981)',
                color: loading ? '#94A3B8' : '#000',
                border: 'none',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'Press Start 2P', monospace",
                boxShadow: loading ? 'none' : '4px 4px 0 0 rgba(0,0,0,0.3)',
              }}
            >
              {loading ? '⏳ LOADING...' : '▶ ENTER'}
            </button>
          </form>

          {/* Pixel art decorative bottom */}
          <div style={{
            marginTop: '24px',
            display: 'flex',
            justifyContent: 'center',
            gap: '3px',
          }}>
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '6px',
                  height: '6px',
                  background: i % 3 === 0 ? '#F59E0B' : i % 3 === 1 ? '#10B981' : '#3B82F6',
                  opacity: 0.5,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
