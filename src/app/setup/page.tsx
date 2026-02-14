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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ margin: '0 0 8px', color: '#059669' }}>สร้าง Admin สำเร็จ!</h2>
          <p style={{ color: '#64748B', marginBottom: '8px' }}>รหัสพนักงาน: <strong>{form.employee_code.toUpperCase()}</strong></p>
          <p style={{ color: '#64748B', marginBottom: '24px', fontSize: '14px' }}>ใช้รหัสนี้กับรหัสผ่านที่ตั้งไว้เพื่อเข้าสู่ระบบ</p>
          <button onClick={() => router.push('/login')} style={{
            padding: '14px 28px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff',
            border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
          }}>
            ไปหน้า Login →
          </button>
        </div>
      </div>
    )
  }

  // Setup form
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #059669 0%, #0D9488 100%)', padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: '460px', background: '#fff', borderRadius: '20px', padding: '40px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '70px', height: '70px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #059669, #0D9488)',
            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px',
          }}>⚙️</div>
          <h1 style={{ margin: 0, fontSize: '22px', color: '#1a1a2e' }}>ตั้งค่าระบบ</h1>
          <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#6b7280' }}>สร้าง Admin เพื่อเริ่มใช้งาน</p>
        </div>

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
              <input
                style={INPUT_STYLE}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="ชื่อเต็ม"
                required
              />
            </div>

            <div>
              <label style={LABEL_STYLE}>🔒 รหัสผ่าน</label>
              <input
                type="password"
                style={INPUT_STYLE}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                required
              />
            </div>

            <div>
              <label style={LABEL_STYLE}>🔒 ยืนยันรหัสผ่าน</label>
              <input
                type="password"
                style={INPUT_STYLE}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                required
              />
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: '16px', padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: '10px', color: '#DC2626', fontSize: '14px', whiteSpace: 'pre-line',
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%', marginTop: '24px', padding: '16px', fontSize: '16px', fontWeight: 'bold',
              color: '#fff', background: saving ? '#94A3B8' : 'linear-gradient(135deg, #059669, #0D9488)',
              border: 'none', borderRadius: '12px', cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)',
            }}
          >
            {saving ? '⏳ กำลังสร้าง Admin...' : '🚀 สร้าง Admin และเริ่มใช้งาน'}
          </button>
        </form>

        <div style={{ marginTop: '24px', padding: '16px', background: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#059669', lineHeight: '1.6' }}>
            💡 ก่อนสร้าง Admin ต้องรัน SQL จากไฟล์ <code>database/add_user_permissions.sql</code> ใน Supabase SQL Editor ก่อน 1 ครั้ง
          </p>
        </div>
      </div>
    </div>
  )
}
