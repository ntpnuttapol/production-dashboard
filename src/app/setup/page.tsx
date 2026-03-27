'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { INPUT_STYLE, LABEL_STYLE } from '@/lib/constants'

export default function SetupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    employee_code: '',
    full_name: '',
    password: '',
    confirmPassword: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.employee_code || !form.full_name || !form.password) {
      setError('กรุณากรอกข้อมูลให้ครบ')
      return
    }
    if (form.password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      return
    }

    setSaving(true)

    try {
      const { data, error: rpcError } = await supabase.rpc('create_app_user', {
        p_employee_code: form.employee_code.toUpperCase(),
        p_full_name: form.full_name,
        p_password: form.password,
        p_role: 'admin',
        p_department: 'all',
        p_allowed_lines: [],
      })

      if (rpcError) {
        setSaving(false)
        setError(`สร้างไม่สำเร็จ: ${rpcError.message}`)
        return
      }

      if (data?.error) {
        setSaving(false)
        setError(data.error)
        return
      }

      setSaving(false)
      setSuccess(true)
    } catch (err) {
      setSaving(false)
      setError(`เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Success state
  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-primary)' }}>
        <div className="cartoon-card" style={{
          padding: '48px 40px', maxWidth: '420px', width: '100%', textAlign: 'center',
        }}>
          <div style={{ fontSize: '56px', marginBottom: '16px', animation: 'float 3s ease-in-out infinite' }}>🎉</div>
          <h2 className="cartoon-font" style={{ margin: '0 0 12px', color: 'var(--color-green)', fontSize: '20px' }}>SETUP COMPLETE!</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '15px' }}>รหัสพนักงาน: <strong style={{ color: 'var(--color-running)', fontSize: '18px' }}>{form.employee_code.toUpperCase()}</strong></p>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px', fontSize: '14px' }}>ใช้รหัสนี้กับรหัสผ่านที่ตั้งไว้เพื่อเข้าสู่ระบบ</p>
          <button className="cartoon-btn" onClick={() => router.push('/login')} style={{
            padding: '16px 32px',
            background: 'var(--color-green)',
            color: '#FFFFFF', fontSize: '15px',
          }}>
            ▶ GO TO LOGIN
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg-primary)', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px', animation: 'float 3s ease-in-out infinite' }}>⚙️</div>
          <h1 className="cartoon-font" style={{ margin: '0 0 8px', fontSize: '24px', color: 'var(--color-green)' }}>
            SETUP
          </h1>
          <p style={{ margin: 0, fontSize: '15px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>สร้าง Admin เพื่อเริ่มใช้งาน</p>
        </div>

        {/* Form Card */}
        <div className="cartoon-card" style={{ padding: '32px' }}>
          <form onSubmit={handleSetup}>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={LABEL_STYLE}>🪪 รหัสพนักงาน (ใช้สำหรับ Login)</label>
                <input
                  style={{ ...INPUT_STYLE, textTransform: 'uppercase', fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}
                  value={form.employee_code}
                  onChange={(e) => setForm({ ...form, employee_code: e.target.value.toUpperCase() })}
                  placeholder="เช่น ADMIN001"
                  required
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>👤 ชื่อ-นามสกุล</label>
                <input style={INPUT_STYLE} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="ชื่อเต็ม" required />
              </div>
              <div>
                <label style={LABEL_STYLE}>🔒 รหัสผ่าน</label>
                <input type="password" style={INPUT_STYLE} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="อย่างน้อย 6 ตัวอักษร" required />
              </div>
              <div>
                <label style={LABEL_STYLE}>🔒 ยืนยันรหัสผ่าน</label>
                <input type="password" style={INPUT_STYLE} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="พิมพ์รหัสผ่านอีกครั้ง" required />
              </div>
            </div>

            {error && (
              <div style={{
                marginTop: '20px', padding: '14px 16px',
                background: '#FEE2E2', border: '2px solid #F87171', borderRadius: '12px',
                color: '#B91C1C', fontSize: '14px', fontWeight: 'bold'
              }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={saving} className="cartoon-btn" style={{
              width: '100%', marginTop: '32px', padding: '16px',
              fontSize: '15px',
              color: '#FFFFFF',
              background: saving ? 'var(--color-border-accent)' : 'var(--color-green)',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : '0 6px 16px rgba(34, 197, 94, 0.4)',
            }}>
              {saving ? '⏳ CREATING...' : '🚀 CREATE ADMIN'}
            </button>
          </form>

          <div style={{
            marginTop: '32px', padding: '16px',
            background: '#D1FAE5', border: '2px dashed #059669', borderRadius: '16px',
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#047857', lineHeight: '1.6', fontWeight: 600 }}>
              💡 ก่อนสร้าง Admin ต้องรัน SQL จากไฟล์ <code style={{ background: '#FFFFFF', padding: '4px 8px', borderRadius: '6px', color: '#047857' }}>database/add_user_permissions.sql</code> ใน Supabase SQL Editor ก่อน 1 ครั้ง
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
