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
        <div style={{
          background: '#1E293B', border: '3px solid #10B981',
          boxShadow: '6px 6px 0 0 rgba(0,0,0,0.5)',
          padding: '40px', maxWidth: '420px', width: '100%', textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ margin: '0 0 8px', color: '#10B981', fontFamily: "'Press Start 2P', monospace", fontSize: '14px' }}>SETUP COMPLETE!</h2>
          <p style={{ color: '#94A3B8', marginBottom: '8px' }}>รหัสพนักงาน: <strong style={{ color: '#F59E0B' }}>{form.employee_code.toUpperCase()}</strong></p>
          <p style={{ color: '#64748B', marginBottom: '24px', fontSize: '14px' }}>ใช้รหัสนี้กับรหัสผ่านที่ตั้งไว้เพื่อเข้าสู่ระบบ</p>
          <button onClick={() => router.push('/login')} style={{
            padding: '14px 28px',
            background: 'linear-gradient(90deg, #F59E0B, #10B981)',
            color: '#000', border: 'none', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
            fontFamily: "'Press Start 2P', monospace",
            boxShadow: '4px 4px 0 0 rgba(0,0,0,0.3)',
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
      background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)', padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
          <h1 style={{ margin: '0 0 8px', fontSize: '16px', color: '#10B981', fontFamily: "'Press Start 2P', monospace" }}>
            SETUP
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>สร้าง Admin เพื่อเริ่มใช้งาน</p>
        </div>

        {/* Form Card */}
        <div style={{
          background: '#1E293B', border: '3px solid #334155',
          boxShadow: '6px 6px 0 0 rgba(0,0,0,0.5)', padding: '28px',
        }}>
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
                marginTop: '16px', padding: '12px 16px',
                background: '#7F1D1D', border: '2px solid #EF4444',
                color: '#FCA5A5', fontSize: '14px',
              }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={saving} style={{
              width: '100%', marginTop: '24px', padding: '16px',
              fontSize: '14px', fontWeight: 'bold',
              color: saving ? '#94A3B8' : '#000',
              background: saving ? '#475569' : 'linear-gradient(90deg, #10B981, #059669)',
              border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: "'Press Start 2P', monospace",
              boxShadow: saving ? 'none' : '4px 4px 0 0 rgba(0,0,0,0.3)',
            }}>
              {saving ? '⏳ CREATING...' : '🚀 CREATE ADMIN'}
            </button>
          </form>

          <div style={{
            marginTop: '24px', padding: '14px',
            background: '#10B98115', border: '2px solid #10B98130',
          }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#10B981', lineHeight: '1.6' }}>
              💡 ก่อนสร้าง Admin ต้องรัน SQL จากไฟล์ <code style={{ background: '#0F172A', padding: '2px 6px', color: '#F59E0B' }}>database/add_user_permissions.sql</code> ใน Supabase SQL Editor ก่อน 1 ครั้ง
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
