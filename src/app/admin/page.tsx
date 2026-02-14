'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { PRODUCTION_LINES, FINISHING_LINES, INPUT_STYLE, LABEL_STYLE } from '@/lib/constants'

interface Profile {
  id: string
  employee_code: string
  full_name: string
  role: 'admin' | 'user'
  department: 'production' | 'finishing' | 'all'
  allowed_lines: string[]
  created_at: string
}

const DEPT_CONFIG = {
  all: { label: '👑 ทั้งหมด (Admin)', color: '#EF4444', bg: '#FEF2F2' },
  production: { label: '🏭 Production', color: '#F59E0B', bg: '#FFFBEB' },
  finishing: { label: '🔧 Finishing', color: '#8B5CF6', bg: '#F5F3FF' },
}

const ALL_LINES = [...PRODUCTION_LINES, ...FINISHING_LINES]

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // New user form
  const [newUser, setNewUser] = useState({
    employee_code: '',
    full_name: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    department: 'production' as 'production' | 'finishing' | 'all',
    allowed_lines: [] as string[],
  })

  const resetNewUser = () => setNewUser({
    employee_code: '', full_name: '', password: '',
    role: 'user', department: 'production', allowed_lines: [],
  })

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/')
    }
  }, [authLoading, user, isAdmin, router])

  // Fetch all profiles
  const fetchProfiles = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })

    if (!error && data) {
      setProfiles(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isAdmin) fetchProfiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  const handleEdit = (profile: Profile) => {
    setEditingProfile({ ...profile })
    setShowModal(true)
    setMessage(null)
  }

  const handleSave = async () => {
    if (!editingProfile) return
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editingProfile.full_name,
        employee_code: editingProfile.employee_code,
        role: editingProfile.role,
        department: editingProfile.department,
        allowed_lines: editingProfile.allowed_lines,
      })
      .eq('id', editingProfile.id)

    setSaving(false)

    if (error) {
      setMessage({ type: 'error', text: `บันทึกไม่สำเร็จ: ${error.message}` })
    } else {
      setMessage({ type: 'success', text: 'บันทึกสำเร็จ!' })
      setShowModal(false)
      fetchProfiles()
    }
  }

  const toggleLine = (lineId: string) => {
    if (!editingProfile) return
    const current = editingProfile.allowed_lines || []
    const updated = current.includes(lineId)
      ? current.filter(l => l !== lineId)
      : [...current, lineId]
    setEditingProfile({ ...editingProfile, allowed_lines: updated })
  }

  const selectAllLines = (type: 'production' | 'finishing' | 'all') => {
    if (!editingProfile) return
    let newLines: string[] = []
    if (type === 'production') newLines = PRODUCTION_LINES.map(l => l.id)
    else if (type === 'finishing') newLines = FINISHING_LINES.map(l => l.id)
    else newLines = ALL_LINES.map(l => l.id)
    setEditingProfile({ ...editingProfile, allowed_lines: newLines })
  }

  const toggleNewLine = (lineId: string) => {
    const current = newUser.allowed_lines
    const updated = current.includes(lineId)
      ? current.filter(l => l !== lineId)
      : [...current, lineId]
    setNewUser({ ...newUser, allowed_lines: updated })
  }

  const selectNewLines = (type: 'production' | 'finishing' | 'all') => {
    let lines: string[] = []
    if (type === 'production') lines = PRODUCTION_LINES.map(l => l.id)
    else if (type === 'finishing') lines = FINISHING_LINES.map(l => l.id)
    else lines = ALL_LINES.map(l => l.id)
    setNewUser({ ...newUser, allowed_lines: lines })
  }

  const handleCreateUser = async () => {
    if (!newUser.employee_code || !newUser.full_name || !newUser.password) {
      setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลให้ครบ' })
      return
    }
    if (newUser.password.length < 6) {
      setMessage({ type: 'error', text: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
      return
    }
    setSaving(true)
    setMessage(null)

    const { data, error: rpcError } = await supabase.rpc('create_app_user', {
      p_employee_code: newUser.employee_code.toUpperCase(),
      p_full_name: newUser.full_name,
      p_password: newUser.password,
      p_role: newUser.role,
      p_department: newUser.department,
      p_allowed_lines: newUser.allowed_lines,
    })

    setSaving(false)

    if (rpcError) {
      setMessage({ type: 'error', text: `สร้างไม่สำเร็จ: ${rpcError.message}` })
      return
    }

    if (data?.error) {
      setMessage({ type: 'error', text: data.error })
      return
    }

    setMessage({ type: 'success', text: `สร้างผู้ใช้ ${newUser.employee_code} สำเร็จ!` })
    setShowCreateModal(false)
    resetNewUser()
    fetchProfiles()
  }

  if (authLoading || !isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A' }}>
        <div style={{ color: '#fff', fontSize: '16px' }}>⏳ กำลังตรวจสอบสิทธิ์...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)', padding: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#fff', padding: '16px 24px', borderRadius: '12px', marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#DC2626', fontFamily: "'Press Start 2P', monospace" }}>
            ⚙️ ADMIN PANEL
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>จัดการผู้ใช้งานและสิทธิ์การเข้าถึง</p>
        </div>
        <Link href="/" style={{ padding: '10px 14px', background: '#1E293B', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}>
          ← กลับ Dashboard
        </Link>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
          background: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          color: message.type === 'success' ? '#059669' : '#DC2626',
          border: `1px solid ${message.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
          fontWeight: '600', fontSize: '14px',
        }}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {[
          { label: 'ผู้ใช้ทั้งหมด', value: profiles.length, color: '#3B82F6', bg: '#EFF6FF' },
          { label: 'Admin', value: profiles.filter(p => p.role === 'admin').length, color: '#EF4444', bg: '#FEF2F2' },
          { label: 'User', value: profiles.filter(p => p.role === 'user').length, color: '#10B981', bg: '#ECFDF5' },
        ].map((stat, i) => (
          <div key={i} style={{ background: stat.bg, border: `2px solid ${stat.color}`, borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 'bold', marginBottom: '6px' }}>{stat.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: stat.color, fontFamily: "'Press Start 2P', monospace" }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '2px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1E293B' }}>👥 รายชื่อผู้ใช้งาน</h2>
          <button onClick={() => { setShowCreateModal(true); setMessage(null); resetNewUser() }} style={{
            padding: '10px 18px', background: 'linear-gradient(90deg, #10B981, #059669)', color: '#fff',
            border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
          }}>
            ➕ เพิ่มผู้ใช้ใหม่
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>⏳ กำลังโหลด...</div>
        ) : profiles.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>ไม่พบข้อมูลผู้ใช้</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748B', fontWeight: '700' }}>รหัสพนักงาน</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748B', fontWeight: '700' }}>ชื่อ</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: '#64748B', fontWeight: '700' }}>บทบาท</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: '#64748B', fontWeight: '700' }}>แผนก</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: '#64748B', fontWeight: '700' }}>สายงานที่เข้าถึง</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: '#64748B', fontWeight: '700' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(profile => {
                const dept = DEPT_CONFIG[profile.department] || DEPT_CONFIG.production
                return (
                  <tr key={profile.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold', fontFamily: 'monospace', color: '#1E293B' }}>{profile.employee_code}</td>
                    <td style={{ padding: '12px 16px', color: '#1E293B' }}>{profile.full_name}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                        background: profile.role === 'admin' ? '#FEF2F2' : '#ECFDF5',
                        color: profile.role === 'admin' ? '#DC2626' : '#059669',
                      }}>
                        {profile.role === 'admin' ? '👑 Admin' : '👤 User'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', background: dept.bg, color: dept.color }}>
                        {dept.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: '#64748B' }}>
                      {profile.allowed_lines?.length || 0} สาย
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleEdit(profile)}
                        style={{
                          padding: '6px 14px', background: '#EFF6FF', color: '#3B82F6', border: '1px solid #BFDBFE',
                          borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                        }}
                      >
                        ✏️ แก้ไข
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '20px' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false) }}
        >
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>➕ เพิ่มผู้ใช้ใหม่</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94A3B8' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={LABEL_STYLE}>🪪 รหัสพนักงาน *</label>
                  <input style={{ ...INPUT_STYLE, textTransform: 'uppercase' }} value={newUser.employee_code} onChange={(e) => setNewUser({ ...newUser, employee_code: e.target.value.toUpperCase() })} placeholder="เช่น PROD001" />
                </div>
                <div>
                  <label style={LABEL_STYLE}>🔒 รหัสผ่าน *</label>
                  <input type="password" style={INPUT_STYLE} value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="อย่างน้อย 6 ตัว" />
                </div>
              </div>

              <div>
                <label style={LABEL_STYLE}>👤 ชื่อ-นามสกุล *</label>
                <input style={INPUT_STYLE} value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} placeholder="ชื่อเต็ม" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={LABEL_STYLE}>บทบาท</label>
                  <select style={INPUT_STYLE} value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'user' })}>
                    <option value="user">👤 User</option>
                    <option value="admin">👑 Admin</option>
                  </select>
                </div>
                <div>
                  <label style={LABEL_STYLE}>แผนก</label>
                  <select style={INPUT_STYLE} value={newUser.department} onChange={(e) => setNewUser({ ...newUser, department: e.target.value as 'production' | 'finishing' | 'all' })}>
                    <option value="production">🏭 Production</option>
                    <option value="finishing">🔧 Finishing</option>
                    <option value="all">👑 ทั้งหมด</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={LABEL_STYLE}>สายงานที่เข้าถึงได้</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <button type="button" onClick={() => selectNewLines('production')} style={{ padding: '4px 10px', background: '#FFFBEB', color: '#F59E0B', border: '1px solid #FCD34D', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Production ทั้งหมด</button>
                  <button type="button" onClick={() => selectNewLines('finishing')} style={{ padding: '4px 10px', background: '#F5F3FF', color: '#8B5CF6', border: '1px solid #C4B5FD', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Finishing ทั้งหมด</button>
                  <button type="button" onClick={() => selectNewLines('all')} style={{ padding: '4px 10px', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>เลือกทั้งหมด</button>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#F59E0B', marginBottom: '4px' }}>🏭 Production</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {PRODUCTION_LINES.map(line => {
                      const sel = newUser.allowed_lines.includes(line.id)
                      return <button key={line.id} type="button" onClick={() => toggleNewLine(line.id)} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', background: sel ? '#F59E0B' : '#F8FAFC', color: sel ? '#fff' : '#64748B', border: `2px solid ${sel ? '#F59E0B' : '#E2E8F0'}` }}>{line.id}</button>
                    })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#8B5CF6', marginBottom: '4px' }}>🔧 Finishing</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {FINISHING_LINES.map(line => {
                      const sel = newUser.allowed_lines.includes(line.id)
                      return <button key={line.id} type="button" onClick={() => toggleNewLine(line.id)} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', background: sel ? '#8B5CF6' : '#F8FAFC', color: sel ? '#fff' : '#64748B', border: `2px solid ${sel ? '#8B5CF6' : '#E2E8F0'}` }}>{line.id}</button>
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '12px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>ยกเลิก</button>
              <button onClick={handleCreateUser} disabled={saving} style={{ flex: 2, padding: '12px', background: saving ? '#94A3B8' : 'linear-gradient(90deg, #10B981, #059669)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? '⏳ กำลังสร้าง...' : '✅ สร้างผู้ใช้'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && editingProfile && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '20px' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1E293B' }}>✏️ แก้ไขผู้ใช้: {editingProfile.employee_code}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94A3B8' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {/* Full Name */}
              <div>
                <label style={LABEL_STYLE}>ชื่อ-นามสกุล</label>
                <input style={INPUT_STYLE} value={editingProfile.full_name} onChange={(e) => setEditingProfile({ ...editingProfile, full_name: e.target.value })} />
              </div>

              {/* Employee ID */}
              <div>
                <label style={LABEL_STYLE}>รหัสพนักงาน</label>
                <input style={{ ...INPUT_STYLE, textTransform: 'uppercase' }} value={editingProfile.employee_code} onChange={(e) => setEditingProfile({ ...editingProfile, employee_code: e.target.value.toUpperCase() })} />
              </div>

              {/* Role */}
              <div>
                <label style={LABEL_STYLE}>บทบาท</label>
                <select style={INPUT_STYLE} value={editingProfile.role} onChange={(e) => setEditingProfile({ ...editingProfile, role: e.target.value as 'admin' | 'user' })}>
                  <option value="user">👤 User</option>
                  <option value="admin">👑 Admin</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label style={LABEL_STYLE}>แผนก</label>
                <select style={INPUT_STYLE} value={editingProfile.department} onChange={(e) => {
                  const dept = e.target.value as 'production' | 'finishing' | 'all'
                  setEditingProfile({ ...editingProfile, department: dept })
                }}>
                  <option value="production">🏭 Production</option>
                  <option value="finishing">🔧 Finishing</option>
                  <option value="all">👑 ทั้งหมด (Admin)</option>
                </select>
              </div>

              {/* Allowed Lines */}
              <div>
                <label style={LABEL_STYLE}>สายงานที่เข้าถึงได้</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <button type="button" onClick={() => selectAllLines('production')} style={{ padding: '4px 10px', background: '#FFFBEB', color: '#F59E0B', border: '1px solid #FCD34D', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                    เลือก Production ทั้งหมด
                  </button>
                  <button type="button" onClick={() => selectAllLines('finishing')} style={{ padding: '4px 10px', background: '#F5F3FF', color: '#8B5CF6', border: '1px solid #C4B5FD', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                    เลือก Finishing ทั้งหมด
                  </button>
                  <button type="button" onClick={() => selectAllLines('all')} style={{ padding: '4px 10px', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                    เลือกทั้งหมด
                  </button>
                </div>

                {/* Production Lines */}
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#F59E0B', marginBottom: '4px' }}>🏭 Production Lines</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {PRODUCTION_LINES.map(line => {
                      const selected = editingProfile.allowed_lines?.includes(line.id)
                      return (
                        <button key={line.id} type="button" onClick={() => toggleLine(line.id)} style={{
                          padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                          background: selected ? '#F59E0B' : '#F8FAFC',
                          color: selected ? '#fff' : '#64748B',
                          border: `2px solid ${selected ? '#F59E0B' : '#E2E8F0'}`,
                        }}>
                          {line.id}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Finishing Lines */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#8B5CF6', marginBottom: '4px' }}>🔧 Finishing Lines</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {FINISHING_LINES.map(line => {
                      const selected = editingProfile.allowed_lines?.includes(line.id)
                      return (
                        <button key={line.id} type="button" onClick={() => toggleLine(line.id)} style={{
                          padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                          background: selected ? '#8B5CF6' : '#F8FAFC',
                          color: selected ? '#fff' : '#64748B',
                          border: `2px solid ${selected ? '#8B5CF6' : '#E2E8F0'}`,
                        }}>
                          {line.id}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>
                ยกเลิก
              </button>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 2, padding: '12px', background: saving ? '#94A3B8' : 'linear-gradient(90deg, #3B82F6, #2563EB)', color: '#fff',
                border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer',
              }}>
                {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
