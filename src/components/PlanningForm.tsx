'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  INPUT_STYLE,
  LABEL_STYLE,
  type PartNumber,
} from '@/lib/constants'
import { useLines } from '@/lib/lines-context'

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
  defaultDepartment?: 'production' | 'finishing'
}

export default function PlanningForm({ onSuccess, editData, defaultDepartment }: PlanningFormProps) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const { productionLines, finishingLines } = useLines()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [partNumbers, setPartNumbers] = useState<PartNumber[]>([])

  const initialDept = editData?.department || defaultDepartment || 'production'

  // Set default initial line based on department context
  const initialCurrentLines = initialDept === 'production' ? productionLines : finishingLines
  const initialLine = initialCurrentLines.length > 0 ? initialCurrentLines[0].id : ''

  const [formData, setFormData] = useState<PlanningFormData>({
    plan_date: editData?.plan_date || today,
    department: initialDept,
    line_id: editData?.line_id || initialLine,
    part_number_id: editData?.part_number_id || null,
    product_name: editData?.product_name || '',
    lot_number: '',
    target_qty: editData?.target_qty || 0,
    priority: editData?.priority || 'medium',
    notes: editData?.notes || '',
    created_by: editData?.created_by || '',
    status: editData?.status || 'pending',
  })

  // Reset form when defaultDepartment changes (new plan only)
  useEffect(() => {
    if (editData || !defaultDepartment) return
    const currentLines = defaultDepartment === 'production' ? productionLines : finishingLines
    const newLine = currentLines.length > 0 ? currentLines[0].id : ''
    setFormData(prev => ({ ...prev, department: defaultDepartment, line_id: newLine }))
  }, [defaultDepartment, editData, productionLines, finishingLines])

  // Fetch Part Numbers filtered by department
  useEffect(() => {
    const fetchParts = async () => {
      // Primary: simple query that always works
      const { data, error } = await supabase
        .from('part_numbers')
        .select('*')
        .eq('is_active', true)
        .eq('department', formData.department)
        .order('part_number')
      
      console.log('[PlanningForm] fetchParts:', { dept: formData.department, data: data?.length, error })
      if (data) setPartNumbers(data)
    }
    fetchParts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.department])

  const lineOptions = formData.department === 'production' ? productionLines : finishingLines

  const handleDepartmentChange = (dept: 'production' | 'finishing') => {
    const currentLines = dept === 'production' ? productionLines : finishingLines
    const defaultLine = currentLines.length > 0 ? currentLines[0].id : ''
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
          line_id: productionLines.length > 0 ? productionLines[0].id : '',
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
    <form onSubmit={handleSubmit} style={{ background: '#1E293B', border: '3px solid #334155', boxShadow: '4px 4px 0 0 rgba(0,0,0,0.4)', padding: '24px' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '12px', fontWeight: 'bold', color: '#06B6D4', fontFamily: "'Press Start 2P', monospace" }}>
        {editData ? '✏️ EDIT PLAN' : '➕ NEW PLAN'}
      </h2>

      {error && <div style={{ padding: '12px', background: '#7F1D1D', border: '2px solid #EF4444', color: '#FCA5A5', marginBottom: '16px', fontSize: '14px' }}>⚠️ {error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {/* Plan Date */}
        <div>
          <label style={LABEL_STYLE}>วันที่วางแผน *</label>
          <input type="date" value={formData.plan_date} onChange={(e) => setFormData(prev => ({ ...prev, plan_date: e.target.value }))} style={INPUT_STYLE} required />
        </div>

        {/* Department */}
        <div>
          <label style={LABEL_STYLE}>แผนก</label>
          <div style={{
            padding: '10px 16px',
            background: formData.department === 'production' ? '#F59E0B20' : '#8B5CF620',
            border: `2px solid ${formData.department === 'production' ? '#F59E0B' : '#8B5CF6'}`,
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '18px' }}>{formData.department === 'production' ? '🏭' : '🔧'}</span>
            <span style={{ fontWeight: 'bold', color: formData.department === 'production' ? '#F59E0B' : '#8B5CF6', fontSize: '14px' }}>
              {formData.department === 'production' ? 'Production' : 'Finishing'}
            </span>
          </div>
        </div>

        {/* Part Number */}
        <div>
          <label style={LABEL_STYLE}>Part Number *</label>
          <select value={formData.part_number_id || ''} onChange={(e) => handlePartChange(e.target.value)} style={INPUT_STYLE} required>
            <option value="">-- เลือก Part Number --</option>
            {partNumbers.map(part => {
              const customerName = Array.isArray(part.customers) ? part.customers[0]?.customer_name : part.customers?.customer_name;
              return (
                <option key={part.id} value={part.id}>{part.part_number} - {part.part_name} {customerName ? `(${customerName})` : ''} (Std: {part.std_qty}/{part.unit})</option>
              )
            })}
          </select>
          {selectedPart && (
            <div style={{ marginTop: '8px', padding: '8px 12px', background: '#10B98120', border: '1px solid #10B98140', fontSize: '12px', color: '#10B981' }}>
              ⚡ Std: <strong>{selectedPart.std_qty}</strong> {selectedPart.unit}/ชม.
            </div>
          )}
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
              { value: 'high', label: '🔴 สูง', color: '#EF4444' },
              { value: 'medium', label: '🟡 กลาง', color: '#F59E0B' },
              { value: 'low', label: '🟢 ต่ำ', color: '#10B981' },
            ].map(p => (
              <label key={p.value} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', padding: '10px', background: formData.priority === p.value ? `${p.color}20` : 'transparent', border: '2px solid', borderColor: formData.priority === p.value ? p.color : '#334155', fontSize: '13px', color: formData.priority === p.value ? p.color : '#64748B' }}>
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
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? '#475569' : 'linear-gradient(90deg, #0EA5E9, #06B6D4)', color: loading ? '#94A3B8' : '#000', border: 'none', fontSize: '14px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Press Start 2P', monospace", boxShadow: loading ? 'none' : '4px 4px 0 0 rgba(0,0,0,0.3)' }}>
          {loading ? '⏳ SAVING...' : editData ? '💾 SAVE' : '📋 ADD PLAN'}
        </button>
      </div>
    </form>
  )
}
