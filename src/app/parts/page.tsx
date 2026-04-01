'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { INPUT_STYLE, LABEL_STYLE } from '@/lib/constants'

interface Customer {
  id: string
  customer_code: string
  customer_name: string
  is_active: boolean
}

interface PartNumber {
  id: string
  part_number: string
  part_name: string
  customer_id?: string | null
  customers?: Customer | null
  std_qty: number
  unit: string
  description: string
  is_active: boolean
  department: 'production' | 'finishing'
  created_at: string
}

type DeptTab = 'production' | 'finishing'

const DEPT_CONFIG: Record<DeptTab, { label: string; icon: string; color: string; bg: string }> = {
  production: { label: 'ผลิต', icon: '🏭', color: 'var(--color-amber)', bg: 'rgba(251,191,36,0.12)' },
  finishing: { label: 'ประกอบ', icon: '🔧', color: 'var(--color-purple)', bg: 'rgba(167,139,250,0.12)' },
}

const EMPTY_FORM = {
  part_number: '',
  part_name: '',
  customer_id: '',
  std_qty: 0,
  unit: 'pcs',
  description: '',
  is_active: true,
  department: 'production' as DeptTab,
}

export default function PartsPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<DeptTab>('production')
  const [parts, setParts] = useState<PartNumber[]>([])
  const [activeCustomers, setActiveCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [editData, setEditData] = useState<PartNumber | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const [partsRes, customersRes] = await Promise.all([
      supabase
        .from('part_numbers')
        .select('*, customers(id, customer_code, customer_name, is_active)')
        .order('part_number', { ascending: true }),
      supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('customer_code', { ascending: true })
    ])

    if (partsRes.error) console.error('Fetch parts error:', partsRes.error)
    else setParts(partsRes.data || [])

    if (customersRes.error) console.error('Fetch customers error:', customersRes.error)
    else setActiveCustomers(customersRes.data || [])

    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (editData) {
        const { error } = await supabase.from('part_numbers').update(formData).eq('id', editData.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('part_numbers').insert([formData])
        if (error) throw error
      }

      setShowForm(false)
      setEditData(null)
      setFormData({ ...EMPTY_FORM, department: activeTab })
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (part: PartNumber) => {
    setEditData(part)
    setFormData({
      part_number: part.part_number,
      part_name: part.part_name,
      customer_id: part.customer_id || '',
      std_qty: part.std_qty,
      unit: part.unit,
      description: part.description || '',
      is_active: part.is_active,
      department: part.department || 'production',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบ Part Number นี้?')) return
    const { error } = await supabase.from('part_numbers').delete().eq('id', id)
    if (error) alert('เกิดข้อผิดพลาด: ' + error.message)
    else fetchData()
  }

  const openNewForm = () => {
    setEditData(null)
    setFormData({ ...EMPTY_FORM, department: activeTab })
    setError(null)
    setShowForm(true)
  }

  const tabConfig = DEPT_CONFIG[activeTab]

  // Filter by active tab + optionally show inactive
  const filteredParts = parts
    .filter(p => (p.department || 'production') === activeTab)
    .filter(p => showInactive || p.is_active)

  const countByDept = (dept: DeptTab) =>
    parts.filter(p => (p.department || 'production') === dept && p.is_active).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      <Navbar />
      <div className="cartoon-container">
        <div className="page-sticky-shell">
          <div className="page-toolbar-card" style={{ marginBottom: '24px' }}>
            {/* Page Title */}
            <div className="cartoon-page-title" style={{ marginBottom: '20px', paddingBottom: '20px' }}>
              <div>
                <h1 className="cartoon-font" style={{ margin: 0, fontSize: '20px', color: 'var(--color-green)' }}>
                  📦 PARTS
                </h1>
                <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                  กำหนดรหัสชิ้นส่วนและค่า Standard แยกตามแผนก
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {!showForm && (
                  <button
                    className="cartoon-btn"
                    onClick={openNewForm}
                    style={{
                      padding: '10px 20px',
                      background: tabConfig.color,
                      color: '#FFFFFF',
                      fontSize: '14px',
                    }}
                  >
                    ➕ เพิ่ม Part ({tabConfig.icon} {tabConfig.label})
                  </button>
                )}
              </div>
            </div>

            {/* Department Tabs */}
            <div className="page-toolbar-tabs">
              {(Object.entries(DEPT_CONFIG) as [DeptTab, typeof DEPT_CONFIG[DeptTab]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); setShowForm(false); setEditData(null) }}
                  className="cartoon-btn"
                  style={{
                    padding: '12px 24px',
                    background: activeTab === key ? cfg.color : 'var(--color-bg-secondary)',
                    color: activeTab === key ? '#FFFFFF' : 'var(--color-text-secondary)',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    border: `3px solid ${activeTab === key ? cfg.color : 'var(--color-border)'}`,
                  }}
                >
                  {cfg.icon} {cfg.label}
                  <span style={{
                    marginLeft: '8px',
                    background: activeTab === key ? 'rgba(255,255,255,0.25)' : cfg.bg,
                    color: activeTab === key ? '#FFFFFF' : cfg.color,
                    borderRadius: '100px',
                    padding: '2px 8px',
                    fontSize: '12px',
                    fontWeight: 800,
                  }}>
                    {countByDept(key)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="cartoon-card" style={{ marginBottom: '24px', borderTopColor: tabConfig.color, borderTopWidth: '6px' }}>
            <h2 className="cartoon-font" style={{ margin: '0 0 24px', fontSize: '18px', color: tabConfig.color }}>
              {editData ? `✏️ EDIT PART` : `➕ NEW PART — ${tabConfig.icon} ${tabConfig.label}`}
            </h2>

            {error && (
              <div style={{ padding: '14px', background: '#FEE2E2', border: '2px solid #F87171', borderRadius: '12px', color: '#B91C1C', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                {/* Department selector (editable) */}
                <div>
                  <label style={LABEL_STYLE}>🏢 แผนก *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value as DeptTab }))}
                    style={{ ...INPUT_STYLE, borderColor: tabConfig.color }}
                  >
                    <option value="production">🏭 ผลิต (Production)</option>
                    <option value="finishing">🔧 ประกอบ (Finishing)</option>
                  </select>
                </div>
                <div>
                  <label style={LABEL_STYLE}>รหัส Part Number *</label>
                  <input
                    type="text"
                    value={formData.part_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, part_number: e.target.value }))}
                    placeholder="เช่น PN-001"
                    style={INPUT_STYLE}
                    required
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>ชื่อ Part *</label>
                  <input
                    type="text"
                    value={formData.part_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, part_name: e.target.value }))}
                    placeholder="ชื่อชิ้นส่วน"
                    style={INPUT_STYLE}
                    required
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>ลูกค้า</label>
                  <select
                    value={formData.customer_id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_id: e.target.value || '' }))}
                    style={INPUT_STYLE}
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {activeCustomers.map(c => (
                      <option key={c.id} value={c.id}>
                        [{c.customer_code}] {c.customer_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={LABEL_STYLE}>ค่า Std (ต่อชั่วโมง) *</label>
                  <input
                    type="number"
                    value={formData.std_qty}
                    onChange={(e) => setFormData(prev => ({ ...prev, std_qty: parseInt(e.target.value) || 0 }))}
                    min="0"
                    style={INPUT_STYLE}
                    required
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>หน่วย *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    style={INPUT_STYLE}
                  >
                    <option value="pcs">ชิ้น (pcs)</option>
                    <option value="set">ชุด (set)</option>
                    <option value="unit">หน่วย (unit)</option>
                    <option value="kg">กิโลกรัม (kg)</option>
                  </select>
                </div>
                <div>
                  <label style={LABEL_STYLE}>สถานะ</label>
                  <select
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                    style={INPUT_STYLE}
                  >
                    <option value="true">✅ ใช้งาน</option>
                    <option value="false">❌ ไม่ใช้งาน</option>
                  </select>
                </div>
                <div>
                  <label style={LABEL_STYLE}>รายละเอียด</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="รายละเอียดเพิ่มเติม"
                    style={INPUT_STYLE}
                  />
                </div>
              </div>
              <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
                <button type="submit" disabled={saving} className="cartoon-btn" style={{
                  flex: 1, padding: '14px',
                  background: saving ? 'var(--color-border-accent)' : tabConfig.color,
                  color: '#FFFFFF',
                  fontSize: '15px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: saving ? 'none' : `0 6px 16px ${tabConfig.color}40`,
                }}>
                  {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditData(null) }} className="cartoon-btn" style={{
                  padding: '14px 24px', background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)',
                  fontSize: '15px',
                }}>ยกเลิก</button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="cartoon-card" style={{ borderTopColor: tabConfig.color, borderTopWidth: '6px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px dashed var(--color-border)',
          }}>
            <h2 className="cartoon-font" style={{ margin: 0, fontSize: '18px', color: tabConfig.color }}>
              {tabConfig.icon} {tabConfig.label.toUpperCase()} — PART LIST
            </h2>
            <button
              onClick={() => setShowInactive(!showInactive)}
              className="cartoon-btn"
              style={{
                padding: '8px 16px',
                background: showInactive ? 'var(--color-bg-input)' : 'transparent',
                color: showInactive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                border: '2px solid var(--color-border)',
                fontSize: '13px',
              }}
            >
              {showInactive ? '👁️ แสดงทั้งหมด' : '👁️‍🗨️ ซ่อนที่ปิดใช้งาน'}
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>⏳ กำลังโหลด...</div>
          ) : filteredParts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              📭 ไม่พบข้อมูล Part Number ของ {tabConfig.icon} {tabConfig.label}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="cartoon-table">
                <thead>
                  <tr>
                    <th>รหัส Part</th>
                    <th>ชื่อ Part</th>
                    <th>ชื่อลูกค้า</th>
                    <th style={{ textAlign: 'center' }}>ค่า Std/ชม.</th>
                    <th style={{ textAlign: 'center' }}>หน่วย</th>
                    <th style={{ textAlign: 'center' }}>สถานะ</th>
                    <th>รายละเอียด</th>
                    <th style={{ textAlign: 'center' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParts.map((part) => (
                    <tr key={part.id}>
                      <td style={{ fontWeight: '800', fontFamily: "'Nunito', sans-serif", color: 'var(--color-text-primary)' }}>{part.part_number}</td>
                      <td style={{ fontWeight: '600' }}>{part.part_name}</td>
                      <td style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>
                        {part.customers ? `[${part.customers.customer_code}] ${part.customers.customer_name}` : '-'}
                      </td>
                      <td className="cartoon-font" style={{ textAlign: 'center', color: tabConfig.color, fontSize: '18px' }}>{part.std_qty.toLocaleString()}</td>
                      <td style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: '600' }}>{part.unit}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="cartoon-badge" style={{
                          background: part.is_active ? '#D1FAE5' : '#FEE2E2',
                          color: part.is_active ? '#047857' : '#B91C1C',
                        }}>
                          {part.is_active ? '✅ ใช้งาน' : '❌ ไม่ใช้งาน'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{part.description || '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={() => handleEdit(part)} className="cartoon-btn" style={{ padding: '6px 12px', background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)', fontSize: '13px' }}>✏️</button>
                          <button onClick={() => handleDelete(part.id)} className="cartoon-btn" style={{ padding: '6px 12px', background: '#FEE2E2', color: '#EF4444', fontSize: '13px' }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ marginTop: '16px', fontSize: '12px', color: '#64748B', textAlign: 'right' }}>
            แสดง {filteredParts.length} จากทั้งหมด {parts.filter(p => (p.department || 'production') === activeTab).length} รายการ ({tabConfig.icon} {tabConfig.label})
          </div>
        </div>
      </div>
    </div>
  )
}
