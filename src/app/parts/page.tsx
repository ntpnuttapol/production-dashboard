'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { INPUT_STYLE, LABEL_STYLE, PIXEL_CARD_STYLE } from '@/lib/constants'

interface PartNumber {
  id: string
  part_number: string
  part_name: string
  std_qty: number
  unit: string
  description: string
  is_active: boolean
  created_at: string
}

export default function PartsPage() {
  const supabase = createClient()
  const [parts, setParts] = useState<PartNumber[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState<PartNumber | null>(null)
  const [formData, setFormData] = useState({
    part_number: '',
    part_name: '',
    std_qty: 0,
    unit: 'pcs',
    description: '',
    is_active: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchParts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('part_numbers')
      .select('*')
      .order('part_number', { ascending: true })

    if (error) console.error('Fetch error:', error)
    else setParts(data || [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchParts() }, [])

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
      setFormData({ part_number: '', part_name: '', std_qty: 0, unit: 'pcs', description: '', is_active: true })
      fetchParts()
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
      std_qty: part.std_qty,
      unit: part.unit,
      description: part.description || '',
      is_active: part.is_active,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบ Part Number นี้?')) return
    const { error } = await supabase.from('part_numbers').delete().eq('id', id)
    if (error) alert('เกิดข้อผิดพลาด: ' + error.message)
    else fetchParts()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)' }}>
      <Navbar />
      <div className="pixel-container">
        {/* Page Title */}
        <div className="pixel-page-title">
          <div>
            <h1 style={{ margin: 0, fontSize: '14px', color: '#22C55E', fontFamily: "'Press Start 2P', monospace" }}>
              📦 PARTS
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748B' }}>กำหนดรหัสชิ้นส่วนและค่า Standard</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {!showForm && (
              <button
                onClick={() => { setEditData(null); setFormData({ part_number: '', part_name: '', std_qty: 0, unit: 'pcs', description: '', is_active: true }); setShowForm(true) }}
                style={{
                  padding: '10px 18px',
                  background: 'linear-gradient(90deg, #22C55E, #16A34A)',
                  color: '#000',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '3px 3px 0 0 rgba(0,0,0,0.3)',
                }}
              >
                ➕ เพิ่ม Part Number
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ ...PIXEL_CARD_STYLE, marginBottom: '20px' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '12px', fontWeight: 'bold', color: '#22C55E', fontFamily: "'Press Start 2P', monospace" }}>
              {editData ? '✏️ EDIT PART' : '➕ NEW PART'}
            </h2>

            {error && <div style={{ padding: '12px', background: '#7F1D1D', border: '2px solid #EF4444', color: '#FCA5A5', marginBottom: '16px', fontSize: '14px' }}>⚠️ {error}</div>}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={LABEL_STYLE}>รหัส Part Number *</label>
                  <input type="text" value={formData.part_number} onChange={(e) => setFormData(prev => ({ ...prev, part_number: e.target.value }))} placeholder="เช่น PN-001" style={INPUT_STYLE} required />
                </div>
                <div>
                  <label style={LABEL_STYLE}>ชื่อ Part *</label>
                  <input type="text" value={formData.part_name} onChange={(e) => setFormData(prev => ({ ...prev, part_name: e.target.value }))} placeholder="ชื่อชิ้นส่วน" style={INPUT_STYLE} required />
                </div>
                <div>
                  <label style={LABEL_STYLE}>ค่า Std (ต่อชั่วโมง) *</label>
                  <input type="number" value={formData.std_qty} onChange={(e) => setFormData(prev => ({ ...prev, std_qty: parseInt(e.target.value) || 0 }))} min="0" style={INPUT_STYLE} required />
                </div>
                <div>
                  <label style={LABEL_STYLE}>หน่วย *</label>
                  <select value={formData.unit} onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))} style={INPUT_STYLE}>
                    <option value="pcs">ชิ้น (pcs)</option>
                    <option value="set">ชุด (set)</option>
                    <option value="unit">หน่วย (unit)</option>
                    <option value="kg">กิโลกรัม (kg)</option>
                  </select>
                </div>
                <div>
                  <label style={LABEL_STYLE}>สถานะ</label>
                  <select value={formData.is_active ? 'true' : 'false'} onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))} style={INPUT_STYLE}>
                    <option value="true">✅ ใช้งาน</option>
                    <option value="false">❌ ไม่ใช้งาน</option>
                  </select>
                </div>
                <div>
                  <label style={LABEL_STYLE}>รายละเอียด</label>
                  <input type="text" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="รายละเอียดเพิ่มเติม" style={INPUT_STYLE} />
                </div>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                <button type="submit" disabled={saving} style={{
                  flex: 1, padding: '14px',
                  background: saving ? '#475569' : 'linear-gradient(90deg, #22C55E, #16A34A)',
                  color: saving ? '#94A3B8' : '#000',
                  border: 'none', fontSize: '16px', fontWeight: 'bold',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '3px 3px 0 0 rgba(0,0,0,0.3)',
                }}>
                  {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditData(null) }} style={{
                  padding: '14px 24px', background: '#0F172A', color: '#94A3B8',
                  border: '2px solid #334155', fontSize: '16px', cursor: 'pointer',
                  boxShadow: '3px 3px 0 0 rgba(0,0,0,0.3)',
                }}>ยกเลิก</button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div style={PIXEL_CARD_STYLE}>
          <h2 style={{ margin: '0 0 20px', fontSize: '12px', fontWeight: 'bold', color: '#22C55E', fontFamily: "'Press Start 2P', monospace" }}>📋 PART LIST</h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>⏳ กำลังโหลด...</div>
          ) : parts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>📭 ยังไม่มี Part Number</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="pixel-table">
                <thead>
                  <tr>
                    <th>รหัส Part</th>
                    <th>ชื่อ Part</th>
                    <th style={{ textAlign: 'center' }}>ค่า Std/ชม.</th>
                    <th style={{ textAlign: 'center' }}>หน่วย</th>
                    <th style={{ textAlign: 'center' }}>สถานะ</th>
                    <th>รายละเอียด</th>
                    <th style={{ textAlign: 'center' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map((part) => (
                    <tr key={part.id}>
                      <td style={{ fontWeight: '600', fontFamily: 'monospace', color: '#F59E0B' }}>{part.part_number}</td>
                      <td>{part.part_name}</td>
                      <td style={{ textAlign: 'center', fontWeight: '700', color: '#22C55E', fontSize: '16px', fontFamily: "'Press Start 2P', monospace" }}>{part.std_qty.toLocaleString()}</td>
                      <td style={{ textAlign: 'center', color: '#94A3B8' }}>{part.unit}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          background: part.is_active ? '#10B98120' : '#EF444420',
                          color: part.is_active ? '#10B981' : '#EF4444',
                          border: `1px solid ${part.is_active ? '#10B98140' : '#EF444440'}`,
                          fontSize: '11px', fontWeight: '600',
                        }}>
                          {part.is_active ? '✅ ใช้งาน' : '❌ ไม่ใช้งาน'}
                        </span>
                      </td>
                      <td style={{ color: '#94A3B8' }}>{part.description || '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => handleEdit(part)} style={{ padding: '5px 10px', background: '#1E3A5F', color: '#3B82F6', border: '2px solid #3B82F640', cursor: 'pointer', fontSize: '12px', boxShadow: '2px 2px 0 0 rgba(0,0,0,0.2)' }}>✏️</button>
                          <button onClick={() => handleDelete(part.id)} style={{ padding: '5px 10px', background: '#7F1D1D40', color: '#EF4444', border: '2px solid #EF444440', cursor: 'pointer', fontSize: '12px', boxShadow: '2px 2px 0 0 rgba(0,0,0,0.2)' }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ marginTop: '16px', fontSize: '12px', color: '#64748B', textAlign: 'right' }}>แสดง {parts.length} รายการ</div>
        </div>
      </div>
    </div>
  )
}
