'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import Navbar from '@/components/Navbar'
import { PRODUCTION_LINES, FINISHING_LINES, INPUT_STYLE, LABEL_STYLE, PIXEL_CARD_STYLE } from '@/lib/constants'

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
    if (rpcError) { setMessage({ type: 'error', text: `สร้างไม่สำเร็จ: ${rpcError.message}` }); return }
    if (data?.error) { setMessage({ type: 'error', text: data.error }); return }

    setMessage({ type: 'success', text: `สร้างผู้ใช้ ${newUser.employee_code} สำเร็จ!` })
    setShowCreateModal(false)
    resetNewUser()
    fetchProfiles()
  }

  if (authLoading || !isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A' }}>
        <div style={{ color: '#F59E0B', fontSize: '14px', fontFamily: "'Press Start 2P', monospace" }}>⏳ LOADING...</div>
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
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {['production', 'finishing', 'all'].map(type => (
          <button key={type} type="button" onClick={() => onSelectAll(type as 'production' | 'finishing' | 'all')} style={{
            padding: '4px 10px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer',
            background: 'transparent', border: `2px solid ${type === 'production' ? '#F59E0B' : type === 'finishing' ? '#8B5CF6' : '#EF4444'}`,
            color: type === 'production' ? '#F59E0B' : type === 'finishing' ? '#8B5CF6' : '#EF4444',
            boxShadow: '2px 2px 0 0 rgba(0,0,0,0.2)',
          }}>
            {type === 'production' ? 'Prod ทั้งหมด' : type === 'finishing' ? 'Fin ทั้งหมด' : 'เลือกทั้งหมด'}
          </button>
        ))}
      </div>
      {[
        { label: '🏭 Production', lines: PRODUCTION_LINES, color: '#F59E0B' },
        { label: '🔧 Finishing', lines: FINISHING_LINES, color: '#8B5CF6' },
      ].map(group => (
        <div key={group.label} style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: group.color, marginBottom: '4px' }}>{group.label}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {group.lines.map(line => {
              const sel = selectedLines.includes(line.id)
              return (
                <button key={line.id} type="button" onClick={() => onToggle(line.id)} style={{
                  padding: '5px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer',
                  background: sel ? group.color : 'transparent',
                  color: sel ? '#000' : '#64748B',
                  border: `2px solid ${sel ? group.color : '#334155'}`,
                  boxShadow: sel ? '2px 2px 0 0 rgba(0,0,0,0.3)' : 'none',
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)' }}>
      <Navbar />
      <div className="pixel-container">
        {/* Page Title */}
        <div className="pixel-page-title">
          <div>
            <h1 style={{ margin: 0, fontSize: '14px', color: '#EF4444', fontFamily: "'Press Start 2P', monospace" }}>
              ⚙️ ADMIN PANEL
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748B' }}>จัดการผู้ใช้งานและสิทธิ์การเข้าถึง</p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: '12px 16px', marginBottom: '16px',
            background: message.type === 'success' ? '#10B98120' : '#EF444420',
            color: message.type === 'success' ? '#10B981' : '#EF4444',
            border: `2px solid ${message.type === 'success' ? '#10B98140' : '#EF444440'}`,
            fontWeight: '600', fontSize: '14px',
          }}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'TOTAL', value: profiles.length, color: '#3B82F6' },
            { label: 'ADMIN', value: profiles.filter(p => p.role === 'admin').length, color: '#EF4444' },
            { label: 'USER', value: profiles.filter(p => p.role === 'user').length, color: '#10B981' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: '#0F172A', border: `3px solid ${stat.color}`,
              boxShadow: '4px 4px 0 0 rgba(0,0,0,0.4)', padding: '16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 'bold', marginBottom: '6px', fontFamily: "'Press Start 2P', monospace" }}>{stat.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: stat.color, fontFamily: "'Press Start 2P', monospace" }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Users Table */}
        <div style={PIXEL_CARD_STYLE}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #334155' }}>
            <h2 style={{ margin: 0, fontSize: '12px', color: '#F59E0B', fontFamily: "'Press Start 2P', monospace" }}>👥 USERS</h2>
            <button onClick={() => { setShowCreateModal(true); setMessage(null); resetNewUser() }} style={{
              padding: '8px 16px', background: 'linear-gradient(90deg, #10B981, #059669)', color: '#000',
              border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
              boxShadow: '3px 3px 0 0 rgba(0,0,0,0.3)',
            }}>
              ➕ เพิ่มผู้ใช้ใหม่
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>⏳ กำลังโหลด...</div>
          ) : profiles.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>ไม่พบข้อมูลผู้ใช้</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="pixel-table">
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
                        <td style={{ fontWeight: 'bold', fontFamily: 'monospace', color: '#F59E0B' }}>{profile.employee_code}</td>
                        <td>{profile.full_name}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px', fontSize: '11px', fontWeight: 'bold',
                            background: profile.role === 'admin' ? '#EF444420' : '#10B98120',
                            color: profile.role === 'admin' ? '#EF4444' : '#10B981',
                            border: `1px solid ${profile.role === 'admin' ? '#EF444440' : '#10B98140'}`,
                          }}>
                            {profile.role === 'admin' ? '👑 Admin' : '👤 User'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px', fontSize: '11px', fontWeight: 'bold',
                            background: `${dept.color}20`, color: dept.color,
                            border: `1px solid ${dept.color}40`,
                          }}>
                            {dept.label}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '13px', color: '#94A3B8' }}>
                          {profile.allowed_lines?.length || 0} สาย
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => handleEdit(profile)} style={{
                            padding: '5px 12px', background: '#1E3A5F', color: '#3B82F6',
                            border: '2px solid #3B82F640', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                            boxShadow: '2px 2px 0 0 rgba(0,0,0,0.2)',
                          }}>
                            ✏️ แก้ไข
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="pixel-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false) }}>
          <div className="pixel-modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '12px', color: '#10B981', fontFamily: "'Press Start 2P', monospace" }}>➕ NEW USER</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B' }}>✕</button>
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

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => setShowCreateModal(false)} style={{
                flex: 1, padding: '12px', background: '#0F172A', color: '#94A3B8',
                border: '2px solid #334155', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
                boxShadow: '3px 3px 0 0 rgba(0,0,0,0.3)',
              }}>ยกเลิก</button>
              <button onClick={handleCreateUser} disabled={saving} style={{
                flex: 2, padding: '12px',
                background: saving ? '#475569' : 'linear-gradient(90deg, #10B981, #059669)',
                color: saving ? '#94A3B8' : '#000', border: 'none', fontSize: '14px', fontWeight: 'bold',
                cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '3px 3px 0 0 rgba(0,0,0,0.3)',
              }}>
                {saving ? '⏳ กำลังสร้าง...' : '✅ สร้างผู้ใช้'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && editingProfile && (
        <div className="pixel-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="pixel-modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '12px', color: '#3B82F6', fontFamily: "'Press Start 2P', monospace" }}>✏️ EDIT: {editingProfile.employee_code}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B' }}>✕</button>
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

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => setShowModal(false)} style={{
                flex: 1, padding: '12px', background: '#0F172A', color: '#94A3B8',
                border: '2px solid #334155', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
                boxShadow: '3px 3px 0 0 rgba(0,0,0,0.3)',
              }}>ยกเลิก</button>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 2, padding: '12px',
                background: saving ? '#475569' : 'linear-gradient(90deg, #3B82F6, #2563EB)',
                color: '#fff', border: 'none', fontSize: '14px', fontWeight: 'bold',
                cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '3px 3px 0 0 rgba(0,0,0,0.3)',
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
