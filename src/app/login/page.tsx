'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

function LoginContent() {
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ssoLoading, setSsoLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, loginWithSso } = useAuth()

  // Handle SSO token from Hub
  useEffect(() => {
    const ssoToken = searchParams.get('sso_token')
    const hubOrigin = searchParams.get('hub_origin')
    if (ssoToken) {
      setSsoLoading(true)
      loginWithSso(ssoToken, hubOrigin)
        .then((result) => {
          if (result.error) {
            setError(result.error)
            setSsoLoading(false)
          } else {
            router.push('/')
          }
        })
        .catch((err) => {
          console.error('SSO login failed:', err)
          setError('SSO login failed - please try manual login')
          setSsoLoading(false)
        })
    }
  }, [searchParams, router, loginWithSso])

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
      background: 'var(--color-bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
      }}>
        {/* Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px', animation: 'float 3s ease-in-out infinite' }}>🏭</div>
          <h1 className="cartoon-font" style={{
            fontSize: '28px',
            color: 'var(--color-text-primary)',
            margin: '0 0 8px',
          }}>
            PRODUCTION
          </h1>
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: '14px',
            fontWeight: '700',
            color: 'var(--color-text-secondary)',
            margin: 0,
            letterSpacing: '1px',
          }}>
            FINISHING DASHBOARD
          </p>
        </div>

        {/* SSO Loading State */}
        {ssoLoading && (
          <div className="cartoon-card" style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--color-border)',
              borderTop: '3px solid var(--color-blue)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{
              fontSize: '16px',
              fontWeight: '700',
              color: 'var(--color-text-primary)',
              marginBottom: '8px'
            }}>
              🔐 กำลังเข้าสู่ระบบผ่าน Hub...
            </p>
            <p style={{
              fontSize: '13px',
              color: 'var(--color-text-secondary)'
            }}>
              SSO Authenticating
            </p>
          </div>
        )}

        {/* Login Card - hidden during SSO loading */}
        {!ssoLoading && (
          <div className="cartoon-card" style={{ padding: '32px' }}>
          <h2 className="cartoon-font" style={{
            fontSize: '20px',
            color: 'var(--color-blue)',
            margin: '0 0 24px',
            textAlign: 'center',
            borderBottom: '2px dashed var(--color-border)',
            paddingBottom: '16px'
          }}>
            🔐 LOGIN
          </h2>

          {error && (
            <div style={{
              padding: '14px',
              background: '#FEE2E2',
              border: '2px solid #F87171',
              borderRadius: '16px',
              color: '#B91C1C',
              marginBottom: '20px',
              fontSize: '14px',
              fontWeight: '700',
              textAlign: 'center',
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--color-text-secondary)',
                marginBottom: '8px',
                fontFamily: "'Nunito', sans-serif"
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
                  padding: '14px 16px',
                  fontSize: '15px',
                  border: '2px solid var(--color-border)',
                  background: 'var(--color-bg-input)',
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                  borderRadius: '16px',
                  fontFamily: "'Nunito', 'Kanit', sans-serif",
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                }}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--color-text-secondary)',
                marginBottom: '8px',
                fontFamily: "'Nunito', sans-serif"
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
                  padding: '14px 16px',
                  fontSize: '15px',
                  border: '2px solid var(--color-border)',
                  background: 'var(--color-bg-input)',
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                  borderRadius: '16px',
                  fontFamily: "'Nunito', 'Kanit', sans-serif",
                  fontWeight: '600',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cartoon-btn"
              style={{
                width: '100%',
                padding: '16px',
                background: loading ? 'var(--color-border-accent)' : 'var(--color-completed)',
                color: '#FFFFFF',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 6px 16px rgba(52, 211, 153, 0.4)',
              }}
            >
              {loading ? '⏳ LOADING...' : '▶ ENTER'}
            </button>
          </form>
        </div>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: 'var(--color-bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px', animation: 'float 3s ease-in-out infinite' }}>🏭</div>
          <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
