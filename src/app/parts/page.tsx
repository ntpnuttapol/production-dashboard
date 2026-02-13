'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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

  const inputStyle = { width: '100%', padding: '10px 14px', fontSize: '14px', border: '2px solid #E2E8F0', borderRadius: '8px', background: '#F8FAFC', outline: 'none' }
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600' as const, color: '#475569', marginBottom: '6px' }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #166534 0%, #15803D 100%)', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '16px 24px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1E293B' }}>📦 จัดการ Part Number</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>กำหนดรหัสชิ้นส่วนและค่า Standard</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/" style={{ padding: '10px 20px', background: '#F1F5F9', color: '#475569', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>← กลับหน้า Dashboard</Link>
          {!showForm && (
            <button onClick={() => { setEditData(null); setFormData({ part_number: '', part_name: '', std_qty: 0, unit: 'pcs', description: '', is_active: true }); setShowForm(true) }} style={{ padding: '10px 20px', background: 'linear-gradient(90deg, #22C55E, #16A34A)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>➕ เพิ่ม Part Number</button>
          )}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 'bold', color: '#1E293B' }}>
            {editData ? '✏️ แก้ไข Part Number' : '➕ เพิ่ม Part Number ใหม่'}
          </h2>
          
          {error && <div style={{ padding: '12px', background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: '8px', color: '#DC2626', marginBottom: '16px', fontSize: '14px' }}>⚠️ {error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div>
                <label style={labelStyle}>รหัส Part Number *</label>
                <input type="text" value={formData.part_number} onChange={(e) => setFormData(prev => ({ ...prev, part_number: e.target.value }))} placeholder="เช่น PN-001" style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>ชื่อ Part *</label>
                <input type="text" value={formData.part_name} onChange={(e) => setFormData(prev => ({ ...prev, part_name: e.target.value }))} placeholder="ชื่อชิ้นส่วน" style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>ค่า Std (ต่อชั่วโมง) *</label>
                <input type="number" value={formData.std_qty} onChange={(e) => setFormData(prev => ({ ...prev, std_qty: parseInt(e.target.value) || 0 }))} min="0" style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>หน่วย *</label>
                <select value={formData.unit} onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))} style={inputStyle}>
                  <option value="pcs">ชิ้น (pcs)</option>
                  <option value="set">ชุด (set)</option>
                  <option value="unit">หน่วย (unit)</option>
                  <option value="kg">กิโลกรัม (kg)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>สถานะ</label>
                <select value={formData.is_active ? 'true' : 'false'} onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))} style={inputStyle}>
                  <option value="true">✅ ใช้งาน</option>
                  <option value="false">❌ ไม่ใช้งาน</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>รายละเอียด</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="รายละเอียดเพิ่มเติม" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: '14px', background: saving ? '#94A3B8' : 'linear-gradient(90deg, #22C55E, #16A34A)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditData(null) }} style={{ padding: '14px 24px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>ยกเลิก</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 'bold', color: '#1E293B' }}>📋 รายการ Part Number</h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>⏳ กำลังโหลด...</div>
        ) : parts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>📭 ยังไม่มี Part Number</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>รหัส Part</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>ชื่อ Part</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>ค่า Std/ชม.</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>หน่วย</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>สถานะ</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>รายละเอียด</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((part) => (
                  <tr key={part.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '12px', fontWeight: '600', color: '#1E293B', fontFamily: 'monospace' }}>{part.part_number}</td>
                    <td style={{ padding: '12px', color: '#1E293B' }}>{part.part_name}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#16A34A', fontSize: '16px' }}>{part.std_qty.toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#64748B' }}>{part.unit}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ padding: '4px 8px', background: part.is_active ? '#D1FAE5' : '#FEE2E2', color: part.is_active ? '#16A34A' : '#DC2626', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                        {part.is_active ? '✅ ใช้งาน' : '❌ ไม่ใช้งาน'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#64748B' }}>{part.description || '-'}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => handleEdit(part)} style={{ padding: '6px 10px', background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✏️</button>
                        <button onClick={() => handleDelete(part.id)} style={{ padding: '6px 10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ marginTop: '16px', fontSize: '13px', color: '#64748B', textAlign: 'right' }}>แสดง {parts.length} รายการ</div>
      </div>
    </div>
  )
}
