'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  PRODUCTION_LINES,
  FINISHING_LINES,
  INPUT_STYLE,
  LABEL_STYLE,
  type PartNumber,
} from '@/lib/constants'

interface PlanningFormData {
  plan_date: string
  department: 'production' | 'finishing'
  line_id: string
  part_number_id: string | null
  product_name: string
  lot_number: string
  target_qty: number
  priority: 'high' | 'medium' | 'low'
  notes: string
  created_by: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
}

interface PlanningFormProps {
  onSuccess?: () => void
  editData?: PlanningFormData & { id: string }
}

export default function PlanningForm({ onSuccess, editData }: PlanningFormProps) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [partNumbers, setPartNumbers] = useState<PartNumber[]>([])

  const [formData, setFormData] = useState<PlanningFormData>({
    plan_date: editData?.plan_date || today,
    department: editData?.department || 'production',
    line_id: editData?.line_id || 'LINE-01',
    part_number_id: editData?.part_number_id || null,
    product_name: editData?.product_name || '',
    lot_number: editData?.lot_number || '',
    target_qty: editData?.target_qty || 0,
    priority: editData?.priority || 'medium',
    notes: editData?.notes || '',
    created_by: editData?.created_by || '',
    status: editData?.status || 'pending',
  })

  // Fetch Part Numbers
  useEffect(() => {
    const fetchParts = async () => {
      const { data } = await supabase.from('part_numbers').select('*').eq('is_active', true).order('part_number')
      if (data) setPartNumbers(data)
    }
    fetchParts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const lineOptions = formData.department === 'production' ? PRODUCTION_LINES : FINISHING_LINES

  const handleDepartmentChange = (dept: 'production' | 'finishing') => {
    const defaultLine = dept === 'production' ? 'LINE-01' : 'FINISH-01'
    setFormData(prev => ({ ...prev, department: dept, line_id: defaultLine }))
  }

  const handlePartChange = (partId: string) => {
    const part = partNumbers.find(p => p.id === partId)
    if (part) {
      setFormData(prev => ({
        ...prev,
        part_number_id: partId,
        product_name: part.part_name,
      }))
    } else {
      setFormData(prev => ({ ...prev, part_number_id: null }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (editData?.id) {
        const { error } = await supabase.from('planning_entries').update(formData).eq('id', editData.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('planning_entries').insert([formData])
        if (error) throw error
      }

      onSuccess?.()

      if (!editData) {
        setFormData({
          plan_date: today,
          department: 'production',
          line_id: 'LINE-01',
          part_number_id: null,
          product_name: '',
          lot_number: '',
          target_qty: 0,
          priority: 'medium',
          notes: '',
          created_by: '',
          status: 'pending',
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const selectedPart = partNumbers.find(p => p.id === formData.part_number_id)

  return (
    <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 'bold', color: '#1E293B' }}>
        {editData ? '✏️ แก้ไขแผน' : '➕ เพิ่มแผนการผลิต'}
      </h2>

      {error && <div style={{ padding: '12px', background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: '8px', color: '#DC2626', marginBottom: '16px', fontSize: '14px' }}>⚠️ {error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {/* Plan Date */}
        <div>
          <label style={LABEL_STYLE}>วันที่วางแผน *</label>
          <input type="date" value={formData.plan_date} onChange={(e) => setFormData(prev => ({ ...prev, plan_date: e.target.value }))} style={INPUT_STYLE} required />
        </div>

        {/* Department */}
        <div>
          <label style={LABEL_STYLE}>แผนก *</label>
          <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 16px', background: formData.department === 'production' ? '#FEF3C7' : '#F1F5F9', borderRadius: '8px', border: '2px solid', borderColor: formData.department === 'production' ? '#F59E0B' : '#E2E8F0' }}>
              <input type="radio" name="department" value="production" checked={formData.department === 'production'} onChange={() => handleDepartmentChange('production')} style={{ display: 'none' }} />
              <span style={{ fontSize: '14px' }}>🏭 Production</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 16px', background: formData.department === 'finishing' ? '#EDE9FE' : '#F1F5F9', borderRadius: '8px', border: '2px solid', borderColor: formData.department === 'finishing' ? '#8B5CF6' : '#E2E8F0' }}>
              <input type="radio" name="department" value="finishing" checked={formData.department === 'finishing'} onChange={() => handleDepartmentChange('finishing')} style={{ display: 'none' }} />
              <span style={{ fontSize: '14px' }}>🔧 Finishing</span>
            </label>
          </div>
        </div>

        {/* Part Number */}
        <div>
          <label style={LABEL_STYLE}>Part Number *</label>
          <select value={formData.part_number_id || ''} onChange={(e) => handlePartChange(e.target.value)} style={INPUT_STYLE} required>
            <option value="">-- เลือก Part Number --</option>
            {partNumbers.map(part => (
              <option key={part.id} value={part.id}>{part.part_number} - {part.part_name} (Std: {part.std_qty}/{part.unit})</option>
            ))}
          </select>
          {selectedPart && (
            <div style={{ marginTop: '8px', padding: '8px 12px', background: '#D1FAE5', borderRadius: '6px', fontSize: '12px', color: '#16A34A' }}>
              ⚡ Std: <strong>{selectedPart.std_qty}</strong> {selectedPart.unit}/ชม.
            </div>
          )}
        </div>

        {/* Line */}
        <div>
          <label style={LABEL_STYLE}>สาย *</label>
          <select value={formData.line_id} onChange={(e) => setFormData(prev => ({ ...prev, line_id: e.target.value }))} style={INPUT_STYLE} required>
            {lineOptions.map(line => <option key={line.id} value={line.id}>{line.id} - {line.name}</option>)}
          </select>
        </div>

        {/* Lot Number */}
        <div>
          <label style={LABEL_STYLE}>หมายเลขล็อต *</label>
          <input type="text" value={formData.lot_number} onChange={(e) => setFormData(prev => ({ ...prev, lot_number: e.target.value }))} placeholder="LOT-2024-001" style={INPUT_STYLE} required />
        </div>

        {/* Target Qty */}
        <div>
          <label style={LABEL_STYLE}>จำนวนเป้าหมาย *</label>
          <input type="number" value={formData.target_qty} onChange={(e) => setFormData(prev => ({ ...prev, target_qty: parseInt(e.target.value) || 0 }))} min="0" style={INPUT_STYLE} required />
        </div>

        {/* Priority */}
        <div>
          <label style={LABEL_STYLE}>ความสำคัญ *</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { value: 'high', label: '🔴 สูง', bg: '#FEE2E2', border: '#EF4444' },
              { value: 'medium', label: '🟡 กลาง', bg: '#FEF3C7', border: '#F59E0B' },
              { value: 'low', label: '🟢 ต่ำ', bg: '#D1FAE5', border: '#10B981' },
            ].map(p => (
              <label key={p.value} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', padding: '10px', background: formData.priority === p.value ? p.bg : '#F8FAFC', borderRadius: '8px', border: '2px solid', borderColor: formData.priority === p.value ? p.border : '#E2E8F0', fontSize: '13px' }}>
                <input type="radio" name="priority" value={p.value} checked={formData.priority === p.value} onChange={() => setFormData(prev => ({ ...prev, priority: p.value as 'high' | 'medium' | 'low' }))} style={{ display: 'none' }} />
                {p.label}
              </label>
            ))}
          </div>
        </div>

        {/* Created By */}
        <div>
          <label style={LABEL_STYLE}>ผู้วางแผน *</label>
          <input type="text" value={formData.created_by} onChange={(e) => setFormData(prev => ({ ...prev, created_by: e.target.value }))} placeholder="ชื่อผู้วางแผน" style={INPUT_STYLE} required />
        </div>

        {/* Status (only show in edit mode) */}
        {editData && (
          <div>
            <label style={LABEL_STYLE}>สถานะ</label>
            <select value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as PlanningFormData['status'] }))} style={INPUT_STYLE}>
              <option value="pending">⏳ รอดำเนินการ</option>
              <option value="in_progress">🔄 กำลังดำเนินการ</option>
              <option value="completed">✅ เสร็จสิ้น</option>
              <option value="cancelled">❌ ยกเลิก</option>
            </select>
          </div>
        )}
      </div>

      {/* Notes */}
      <div style={{ marginTop: '16px' }}>
        <label style={LABEL_STYLE}>หมายเหตุ</label>
        <textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} placeholder="รายละเอียดเพิ่มเติม..." rows={3} style={{ ...INPUT_STYLE, resize: 'vertical' }} />
      </div>

      <div style={{ marginTop: '24px' }}>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? '#94A3B8' : 'linear-gradient(90deg, #0EA5E9, #06B6D4)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? '⏳ กำลังบันทึก...' : editData ? '💾 บันทึกการแก้ไข' : '📋 เพิ่มแผน'}
        </button>
      </div>
    </form>
  )
}
