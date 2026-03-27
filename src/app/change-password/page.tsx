'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import Navbar from '@/components/Navbar'
import { INPUT_STYLE, LABEL_STYLE } from '@/lib/constants'

export default function ChangePasswordPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const supabase = createClient()

    const [form, setForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [authLoading, user, router])

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)

        if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
            setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลให้ครบ' })
            return
        }
        if (form.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' })
            return
        }
        if (form.newPassword !== form.confirmPassword) {
            setMessage({ type: 'error', text: 'รหัสผ่านใหม่ไม่ตรงกัน' })
            return
        }

        setSaving(true)

        try {
            const { data, error: rpcError } = await supabase.rpc('change_user_password', {
                p_employee_code: user?.employeeId,
                p_old_password: form.oldPassword,
                p_new_password: form.newPassword,
            })

            if (rpcError) {
                setSaving(false)
                setMessage({ type: 'error', text: `แก้ไขไม่สำเร็จ: ${rpcError.message}` })
                return
            }

            if (data?.error) {
                setSaving(false)
                setMessage({ type: 'error', text: data.error })
                return
            }

            setSaving(false)
            setMessage({ type: 'success', text: '✅ เปลี่ยนรหัสผ่านสำเร็จ!' })
            setForm({ oldPassword: '', newPassword: '', confirmPassword: '' })

            // Auto redirect after success maybe? Or let user navigate by themselves.
        } catch (err) {
            setSaving(false)
            setMessage({ type: 'error', text: `เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : String(err)}` })
        }
    }

    if (authLoading || !user) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-primary)' }}>
                <div className="cartoon-font" style={{ color: 'var(--color-blue)', fontSize: '20px', animation: 'pulseSoft 2s infinite' }}>⏳ LOADING...</div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
            <Navbar />
            <div className="cartoon-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '40px' }}>
                <div style={{ width: '100%', maxWidth: '420px' }}>

                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'float 3s ease-in-out infinite' }}>🔑</div>
                        <h1 className="cartoon-font" style={{ margin: '0 0 8px', fontSize: '24px', color: 'var(--color-text-primary)' }}>
                            เปลี่ยนรหัสผ่าน
                        </h1>
                        <p style={{ margin: 0, fontSize: '15px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                            รหัสพนักงาน: <span style={{ color: 'var(--color-running)', fontWeight: 'bold' }}>{user.employeeId}</span>
                        </p>
                    </div>

                    <div className="cartoon-card" style={{ padding: '32px' }}>
                        {message && (
                            <div style={{
                                marginBottom: '20px', padding: '14px 16px',
                                background: message.type === 'success' ? '#D1FAE5' : '#FEE2E2',
                                border: `2px solid ${message.type === 'success' ? '#34D399' : '#F87171'}`,
                                borderRadius: '12px',
                                color: message.type === 'success' ? '#047857' : '#B91C1C',
                                fontSize: '14px', fontWeight: 'bold', textAlign: 'center'
                            }}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleChangePassword}>
                            <div style={{ display: 'grid', gap: '16px' }}>
                                <div>
                                    <label style={LABEL_STYLE}>รหัสผ่านเดิม</label>
                                    <input type="password" style={INPUT_STYLE} value={form.oldPassword} onChange={(e) => setForm({ ...form, oldPassword: e.target.value })} placeholder="รหัสผ่านปัจจุบัน" required />
                                </div>
                                <div>
                                    <label style={LABEL_STYLE}>รหัสผ่านใหม่</label>
                                    <input type="password" style={INPUT_STYLE} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} placeholder="อย่างน้อย 6 ตัวอักษร" required />
                                </div>
                                <div>
                                    <label style={LABEL_STYLE}>ยืนยันรหัสผ่านใหม่</label>
                                    <input type="password" style={INPUT_STYLE} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง" required />
                                </div>
                            </div>

                            <button type="submit" disabled={saving} className="cartoon-btn" style={{
                                width: '100%', marginTop: '32px', padding: '16px',
                                fontSize: '15px', color: '#FFFFFF',
                                background: saving ? 'var(--color-border-accent)' : 'var(--color-blue)',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                boxShadow: saving ? 'none' : '0 6px 16px rgba(59, 130, 246, 0.4)',
                            }}>
                                {saving ? '⏳ กำลังบันทึก...' : '💾 เปลี่ยนรหัสผ่าน'}
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    )
}
