'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import Navbar from '@/components/Navbar'
import { INPUT_STYLE, LABEL_STYLE } from '@/lib/constants'
import { useLines, type LineData } from '@/lib/lines-context'

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
  all: { label: '👑 ทั้งหมด', color: '#EF4444' },
  production: { label: '🏭 Production', color: '#F59E0B' },
  finishing: { label: '🔧 Finishing', color: '#8B5CF6' },
}

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const { productionLines, finishingLines, refreshLines } = useLines()
  const ALL_LINES = [...productionLines, ...finishingLines]

  const [activeTab, setActiveTab] = useState<'users' | 'lines'>('users')

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [showResetModal, setShowResetModal] = useState(false)
  const [resettingUser, setResettingUser] = useState<Profile | null>(null)
  const [newPassword, setNewPassword] = useState('')

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

  // Lines Management States
  const [showLineModal, setShowLineModal] = useState(false)
  const [editingLine, setEditingLine] = useState<LineData | null>(null)
  const [newLine, setNewLine] = useState<Partial<LineData>>({
    id: '',
    name: '',
    department: 'production',
    is_active: true,
  })

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/')
    }
  }, [authLoading, user, isAdmin, router])

  const fetchProfiles = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })
    if (!error && data) setProfiles(data)
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
    if (type === 'production') newLines = productionLines.map(l => l.id)
    else if (type === 'finishing') newLines = finishingLines.map(l => l.id)
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
    if (type === 'production') lines = productionLines.map(l => l.id)
    else if (type === 'finishing') lines = finishingLines.map(l => l.id)
    else lines = ALL_LINES.map(l => l.id)
    setNewUser({ ...newUser, allowed_lines: lines })
  }

  const handleOpenReset = (profile: Profile) => {
    setResettingUser(profile)
    setNewPassword('')
    setShowResetModal(true)
    setMessage(null)
  }

  const handleResetPassword = async () => {
    if (!resettingUser) return
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' })
      return
    }

    setSaving(true)
    const { data, error } = await supabase.rpc('admin_reset_password', {
      p_employee_code: resettingUser.employee_code,
      p_new_password: newPassword
    })

    setSaving(false)
    if (error) {
      setMessage({ type: 'error', text: `รีเซ็ตรหัสผ่านไม่สำเร็จ: ${error.message}` })
    } else if (data?.error) {
      setMessage({ type: 'error', text: data.error })
    } else {
      setMessage({ type: 'success', text: `รีเซ็ตรหัสผ่านให้ ${resettingUser.employee_code} สำเร็จ เป็น: ${newPassword}` })
      setShowResetModal(false)
    }
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
    if (rpcError) { setMessage({ type: 'error', text: `สร้างไม่สำเร็จ: ${rpcError.message}` }); return }
    if (data?.error) { setMessage({ type: 'error', text: data.error }); return }

    setMessage({ type: 'success', text: `สร้างผู้ใช้ ${newUser.employee_code} สำเร็จ!` })
    setShowCreateModal(false)
    resetNewUser()
    fetchProfiles()
  }

  const handleSaveLine = async () => {
    const lineToSave = editingLine || newLine
    if (!lineToSave.id || !lineToSave.name || !lineToSave.department) {
      setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
      return
    }

    setSaving(true)
    setMessage(null)

    const { error } = await supabase.rpc('upsert_line', {
      p_id: lineToSave.id,
      p_name: lineToSave.name,
      p_department: lineToSave.department,
      p_is_active: lineToSave.is_active,
    })

    setSaving(false)
    if (error) {
      setMessage({ type: 'error', text: `บันทึกไม่สำเร็จ: ${error.message}` })
    } else {
      setMessage({ type: 'success', text: 'บันทึกสายงานสำเร็จ!' })
      setShowLineModal(false)
      refreshLines() // Refresh lines context
    }
  }

  const toggleLineStatus = async (line: LineData) => {
    setSaving(true)
    const { error } = await supabase.rpc('upsert_line', {
      p_id: line.id,
      p_name: line.name,
      p_department: line.department,
      p_is_active: !line.is_active,
    })
    setSaving(false)
    if (error) {
      setMessage({ type: 'error', text: `อัปเดตสถานะไม่สำเร็จ: ${error.message}` })
    } else {
      setMessage({ type: 'success', text: `อัปเดตสถานะสายงาน ${line.id} แล้ว` })
      refreshLines()
    }
  }

  if (authLoading || !isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-primary)' }}>
        <div className="cartoon-font" style={{ color: 'var(--color-blue)', fontSize: '20px', animation: 'pulseSoft 2s infinite' }}>⏳ LOADING...</div>
      </div>
    )
  }

  // Reusable line selector component
  const LineSelector = ({ selectedLines, onToggle, onSelectAll }: {
    selectedLines: string[]
    onToggle: (lineId: string) => void
    onSelectAll: (type: 'production' | 'finishing' | 'all') => void
  }) => (
    <div>
      <label style={LABEL_STYLE}>สายงานที่เข้าถึงได้</label>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['production', 'finishing', 'all'].map(type => (
          <button key={type} type="button" onClick={() => onSelectAll(type as 'production' | 'finishing' | 'all')} className="cartoon-btn" style={{
            padding: '6px 14px', fontSize: '12px', cursor: 'pointer',
            background: 'var(--color-bg-secondary)', border: `2px solid ${type === 'production' ? 'var(--color-running)' : type === 'finishing' ? 'var(--color-purple)' : 'var(--color-red)'}`,
            color: type === 'production' ? 'var(--color-running)' : type === 'finishing' ? 'var(--color-purple)' : 'var(--color-red)',
          }}>
            {type === 'production' ? 'Prod ทั้งหมด' : type === 'finishing' ? 'Fin ทั้งหมด' : 'เลือกทั้งหมด'}
          </button>
        ))}
      </div>
      {[
        { label: '🏭 Production', lines: productionLines, color: '#F59E0B' },
        { label: '🔧 Finishing', lines: finishingLines, color: '#8B5CF6' },
      ].map(group => (
        <div key={group.label} style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: group.color, marginBottom: '8px', fontFamily: 'Nunito, sans-serif' }}>{group.label}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {group.lines.map(line => {
              const sel = selectedLines.includes(line.id)
              return (
                <button key={line.id} type="button" onClick={() => onToggle(line.id)} className="cartoon-btn" style={{
                  padding: '6px 12px', fontSize: '12px', cursor: 'pointer',
                  background: sel ? group.color : 'var(--color-bg-primary)',
                  color: sel ? '#FFFFFF' : 'var(--color-text-secondary)',
                  border: `2px solid ${sel ? group.color : 'var(--color-border)'}`,
                  boxShadow: sel ? `0 4px 10px ${group.color}40` : 'none',
                  borderRadius: '12px',
                }}>
                  {line.id}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      <Navbar />
      <div className="cartoon-container">
        {/* Page Title */}
        <div className="cartoon-page-title">
          <div>
            <h1 className="cartoon-font" style={{ margin: 0, fontSize: '20px', color: 'var(--color-text-primary)' }}>
              ⚙️ ADMIN PANEL
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>จัดการผู้ใช้งานและสิทธิ์การเข้าถึง</p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: '16px 20px', marginBottom: '24px', borderRadius: '16px',
            background: message.type === 'success' ? '#D1FAE5' : '#FEE2E2',
            color: message.type === 'success' ? '#047857' : '#B91C1C',
            border: `2px solid ${message.type === 'success' ? '#34D399' : '#F87171'}`,
            fontWeight: '700', fontSize: '14px', fontFamily: "'Nunito', sans-serif"
          }}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => setActiveTab('users')} className="cartoon-btn" style={{
            padding: '12px 24px', background: activeTab === 'users' ? 'var(--color-blue)' : 'var(--color-bg-secondary)',
            color: activeTab === 'users' ? '#FFFFFF' : 'var(--color-text-secondary)',
            fontWeight: 'bold', fontSize: '15px',
          }}>
            👥 จัดการผู้ใช้
          </button>
          <button onClick={() => setActiveTab('lines')} className="cartoon-btn" style={{
            padding: '12px 24px', background: activeTab === 'lines' ? 'var(--color-purple)' : 'var(--color-bg-secondary)',
            color: activeTab === 'lines' ? '#FFFFFF' : 'var(--color-text-secondary)',
            fontWeight: 'bold', fontSize: '15px',
          }}>
            🏭 จัดการสายงาน
          </button>
        </div>

        {activeTab === 'users' && (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              {[
                { label: 'TOTAL', value: profiles.length, color: 'var(--color-blue)' },
                { label: 'ADMIN', value: profiles.filter(p => p.role === 'admin').length, color: 'var(--color-amber)' },
                { label: 'USER', value: profiles.filter(p => p.role === 'user').length, color: 'var(--color-completed)' },
              ].map((stat, i) => (
                <div key={i} className="cartoon-card" style={{
                  textAlign: 'center', padding: '24px', borderTopColor: stat.color, borderTopWidth: '8px'
                }}>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '700', marginBottom: '8px', fontFamily: "'Nunito', sans-serif" }}>{stat.label}</div>
                  <div className="cartoon-font" style={{ fontSize: '36px', color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Users Table */}
            <div className="cartoon-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px dashed var(--color-border)' }}>
                <h2 className="cartoon-font" style={{ margin: 0, fontSize: '18px', color: 'var(--color-text-primary)' }}>👥 USERS</h2>
                <button onClick={() => { setShowCreateModal(true); setMessage(null); resetNewUser() }} className="cartoon-btn" style={{
                  padding: '10px 20px', background: 'var(--color-completed)', color: '#FFFFFF',
                  fontSize: '14px',
                }}>
                  ➕ เพิ่มผู้ใช้ใหม่
                </button>
              </div>

              {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)', fontWeight: 600 }}>⏳ กำลังโหลด...</div>
              ) : profiles.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)', fontWeight: 600 }}>ไม่พบข้อมูลผู้ใช้</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="cartoon-table">
                    <thead>
                      <tr>
                        <th>รหัสพนักงาน</th>
                        <th>ชื่อ</th>
                        <th style={{ textAlign: 'center' }}>บทบาท</th>
                        <th style={{ textAlign: 'center' }}>แผนก</th>
                        <th style={{ textAlign: 'center' }}>สายงาน</th>
                        <th style={{ textAlign: 'center' }}>จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.map(profile => {
                        const dept = DEPT_CONFIG[profile.department] || DEPT_CONFIG.production
                        return (
                          <tr key={profile.id}>
                            <td style={{ fontWeight: '800', fontFamily: "'Nunito', sans-serif", color: 'var(--color-text-primary)' }}>{profile.employee_code}</td>
                            <td style={{ fontWeight: '600' }}>{profile.full_name}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="cartoon-badge" style={{
                                background: profile.role === 'admin' ? '#FEE2E2' : '#D1FAE5',
                                color: profile.role === 'admin' ? '#B91C1C' : '#047857',
                              }}>
                                {profile.role === 'admin' ? '👑 Admin' : '👤 User'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="cartoon-badge" style={{
                                background: `${dept.color}20`, color: dept.color,
                              }}>
                                {dept.label}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center', fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>
                              {profile.allowed_lines?.length || 0} สาย
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button onClick={() => handleEdit(profile)} className="cartoon-btn" style={{
                                  padding: '6px 14px', background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)',
                                  fontSize: '13px',
                                }}>
                                  ✏️ แก้ไข
                                </button>
                                <button onClick={() => handleOpenReset(profile)} className="cartoon-btn" style={{
                                  padding: '6px 14px', background: '#FEF3C7', color: '#D97706',
                                  fontSize: '13px',
                                }}>
                                  🔑 รีเซ็ต
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'lines' && (
          <div className="cartoon-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px dashed var(--color-border)' }}>
              <h2 className="cartoon-font" style={{ margin: 0, fontSize: '18px', color: 'var(--color-text-primary)' }}>🏭 LINES</h2>
              <button onClick={() => {
                setEditingLine(null)
                setNewLine({ id: '', name: '', department: 'production', is_active: true })
                setShowLineModal(true)
                setMessage(null)
              }} className="cartoon-btn" style={{
                padding: '10px 20px', background: 'var(--color-purple)', color: '#FFFFFF',
                fontSize: '14px',
              }}>
                ➕ เพิ่มสายงาน
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="cartoon-table">
                <thead>
                  <tr>
                    <th>Line ID</th>
                    <th>ชื่อสายงาน</th>
                    <th style={{ textAlign: 'center' }}>แผนก</th>
                    <th style={{ textAlign: 'center' }}>สถานะ</th>
                    <th style={{ textAlign: 'center' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_LINES.map(line => {
                    const dept = DEPT_CONFIG[line.department] || DEPT_CONFIG.production
                    return (
                      <tr key={line.id} style={{ opacity: line.is_active ? 1 : 0.6 }}>
                        <td style={{ fontWeight: '800', fontFamily: "'Nunito', sans-serif", color: 'var(--color-text-primary)' }}>{line.id}</td>
                        <td style={{ fontWeight: '600' }}>{line.name}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="cartoon-badge" style={{
                            background: `${dept.color}20`, color: dept.color,
                          }}>
                            {dept.label}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="cartoon-badge" style={{
                            background: line.is_active ? '#D1FAE5' : '#FEE2E2',
                            color: line.is_active ? '#047857' : '#B91C1C',
                          }}>
                            {line.is_active ? '✅ ใช้งาน' : '❌ ปิดใช้งาน'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button onClick={() => { setEditingLine(line); setShowLineModal(true); setMessage(null) }} className="cartoon-btn" style={{
                              padding: '6px 14px', background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)',
                              fontSize: '13px',
                            }}>
                              ✏️ แก้ไข
                            </button>
                            <button onClick={() => toggleLineStatus(line)} className="cartoon-btn" style={{
                              padding: '6px 14px', background: line.is_active ? '#FEE2E2' : '#D1FAE5', color: line.is_active ? '#B91C1C' : '#047857',
                              fontSize: '13px',
                            }}>
                              {line.is_active ? 'ปิด' : 'เปิดป'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="cartoon-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false) }}>
          <div className="cartoon-modal-content" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px dashed var(--color-border)' }}>
              <h2 className="cartoon-font" style={{ margin: 0, fontSize: '20px', color: 'var(--color-completed)' }}>➕ NEW USER</h2>
              <button onClick={() => setShowCreateModal(false)} className="cartoon-btn" style={{ background: '#FFFFFF', color: 'var(--color-text-secondary)', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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

              <LineSelector selectedLines={newUser.allowed_lines} onToggle={toggleNewLine} onSelectAll={selectNewLines} />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
              <button onClick={() => setShowCreateModal(false)} className="cartoon-btn" style={{
                flex: 1, padding: '14px', background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)',
                fontSize: '15px'
              }}>ยกเลิก</button>
              <button onClick={handleCreateUser} disabled={saving} className="cartoon-btn" style={{
                flex: 2, padding: '14px',
                background: saving ? 'var(--color-border-accent)' : 'var(--color-completed)',
                color: '#FFFFFF', fontSize: '15px',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 6px 16px rgba(52, 211, 153, 0.4)',
              }}>
                {saving ? '⏳ กำลังสร้าง...' : '✅ สร้างผู้ใช้'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && editingProfile && (
        <div className="cartoon-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="cartoon-modal-content" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px dashed var(--color-border)' }}>
              <h2 className="cartoon-font" style={{ margin: 0, fontSize: '20px', color: 'var(--color-blue)' }}>✏️ EDIT: {editingProfile.employee_code}</h2>
              <button onClick={() => setShowModal(false)} className="cartoon-btn" style={{ background: '#FFFFFF', color: 'var(--color-text-secondary)', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={LABEL_STYLE}>ชื่อ-นามสกุล</label>
                <input style={INPUT_STYLE} value={editingProfile.full_name} onChange={(e) => setEditingProfile({ ...editingProfile, full_name: e.target.value })} />
              </div>
              <div>
                <label style={LABEL_STYLE}>รหัสพนักงาน</label>
                <input style={{ ...INPUT_STYLE, textTransform: 'uppercase' }} value={editingProfile.employee_code} onChange={(e) => setEditingProfile({ ...editingProfile, employee_code: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label style={LABEL_STYLE}>บทบาท</label>
                <select style={INPUT_STYLE} value={editingProfile.role} onChange={(e) => setEditingProfile({ ...editingProfile, role: e.target.value as 'admin' | 'user' })}>
                  <option value="user">👤 User</option>
                  <option value="admin">👑 Admin</option>
                </select>
              </div>
              <div>
                <label style={LABEL_STYLE}>แผนก</label>
                <select style={INPUT_STYLE} value={editingProfile.department} onChange={(e) => setEditingProfile({ ...editingProfile, department: e.target.value as 'production' | 'finishing' | 'all' })}>
                  <option value="production">🏭 Production</option>
                  <option value="finishing">🔧 Finishing</option>
                  <option value="all">👑 ทั้งหมด</option>
                </select>
              </div>

              <LineSelector selectedLines={editingProfile.allowed_lines || []} onToggle={toggleLine} onSelectAll={selectAllLines} />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
              <button onClick={() => setShowModal(false)} className="cartoon-btn" style={{
                flex: 1, padding: '14px', background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)',
                fontSize: '15px'
              }}>ยกเลิก</button>
              <button onClick={handleSave} disabled={saving} className="cartoon-btn" style={{
                flex: 2, padding: '14px',
                background: saving ? 'var(--color-border-accent)' : 'var(--color-blue)',
                color: '#FFFFFF', fontSize: '15px',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 6px 16px rgba(59, 130, 246, 0.4)',
              }}>
                {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && resettingUser && (
        <div className="cartoon-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowResetModal(false) }}>
          <div className="cartoon-modal-content" style={{ padding: '32px', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px dashed var(--color-border)' }}>
              <h2 className="cartoon-font" style={{ margin: 0, fontSize: '20px', color: 'var(--color-amber)' }}>🔑 RESET PASSWORD</h2>
              <button onClick={() => setShowResetModal(false)} className="cartoon-btn" style={{ background: '#FFFFFF', color: 'var(--color-text-secondary)', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                คุณกำลังเปลี่ยนรหัสผ่านของ <strong>{resettingUser.employee_code}</strong> ({resettingUser.full_name})
              </p>
              <label style={LABEL_STYLE}>ตั้งรหัสผ่านใหม่</label>
              <input type="password" style={INPUT_STYLE} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="อย่างน้อย 6 ตัวอักษร" />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
              <button onClick={() => setShowResetModal(false)} className="cartoon-btn" style={{
                flex: 1, padding: '14px', background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)', fontSize: '15px'
              }}>ยกเลิก</button>
              <button onClick={handleResetPassword} disabled={saving} className="cartoon-btn" style={{
                flex: 2, padding: '14px',
                background: saving ? 'var(--color-border-accent)' : 'var(--color-amber)',
                color: '#FFFFFF', fontSize: '15px',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 6px 16px rgba(245, 158, 11, 0.4)',
              }}>
                {saving ? '⏳ กำลังรีเซ็ต...' : '🔑 ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Line Modal */}
      {showLineModal && (
        <div className="cartoon-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowLineModal(false) }}>
          <div className="cartoon-modal-content" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px dashed var(--color-border)' }}>
              <h2 className="cartoon-font" style={{ margin: 0, fontSize: '20px', color: 'var(--color-purple)' }}>
                {editingLine ? `✏️ EDIT LINE: ${editingLine.id}` : '➕ NEW LINE'}
              </h2>
              <button onClick={() => setShowLineModal(false)} className="cartoon-btn" style={{ background: '#FFFFFF', color: 'var(--color-text-secondary)', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={LABEL_STYLE}>Line ID *</label>
                <input
                  style={{ ...INPUT_STYLE, textTransform: 'uppercase' }}
                  value={editingLine ? editingLine.id : newLine.id}
                  onChange={(e) => editingLine ? setEditingLine({ ...editingLine, id: e.target.value.toUpperCase() }) : setNewLine({ ...newLine, id: e.target.value.toUpperCase() })}
                  placeholder="e.g. LINE-08"
                  disabled={!!editingLine}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>ชื่อสายงาน *</label>
                <input
                  style={INPUT_STYLE}
                  value={editingLine ? editingLine.name : newLine.name}
                  onChange={(e) => editingLine ? setEditingLine({ ...editingLine, name: e.target.value }) : setNewLine({ ...newLine, name: e.target.value })}
                  placeholder="e.g. สายการผลิตที่ 8"
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>แผนก *</label>
                <select
                  style={INPUT_STYLE}
                  value={editingLine ? editingLine.department : newLine.department}
                  onChange={(e) => editingLine ? setEditingLine({ ...editingLine, department: e.target.value as any }) : setNewLine({ ...newLine, department: e.target.value as any })}
                >
                  <option value="production">🏭 Production</option>
                  <option value="finishing">🔧 Finishing</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px', fontWeight: 'bold' }}>
                <input
                  type="checkbox"
                  checked={editingLine ? editingLine.is_active : newLine.is_active}
                  onChange={(e) => editingLine ? setEditingLine({ ...editingLine, is_active: e.target.checked }) : setNewLine({ ...newLine, is_active: e.target.checked })}
                />
                ✅ เปิดใช้งาน
              </label>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
              <button onClick={() => setShowLineModal(false)} className="cartoon-btn" style={{
                flex: 1, padding: '14px', background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)',
                fontSize: '15px'
              }}>ยกเลิก</button>
              <button onClick={handleSaveLine} disabled={saving} className="cartoon-btn" style={{
                flex: 2, padding: '14px',
                background: saving ? 'var(--color-border-accent)' : 'var(--color-purple)',
                color: '#FFFFFF', fontSize: '15px',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 6px 16px rgba(139, 92, 246, 0.4)',
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
