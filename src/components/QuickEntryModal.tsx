'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  PRODUCTION_LINES,
  FINISHING_LINES,
  getLineName,
  INPUT_STYLE,
  LABEL_STYLE,
} from '@/lib/constants'

interface PartNumberOption {
  id: string
  part_number: string
  part_name: string
  std_qty: number
  unit: string
}

interface QuickEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  lineId: string
  lineType: 'production' | 'finishing'
  /** If provided, we're editing an existing entry */
  existingEntryId?: string | null
}

const MODE_CONFIG = {
  production: {
    lines: PRODUCTION_LINES,
    table: 'production_entries',
    department: 'production',
    title: 'ข้อมูลการผลิต',
    lineLabel: 'สายการผลิต',
    completedLabel: 'ผลิตแล้ว (ชิ้น)',
    statusLabels: { running: '🟡 กำลังผลิต', completed: '🟢 เสร็จสิ้น', idle: '⚫ รอดำเนินการ' },
    gradient: 'linear-gradient(90deg, #F59E0B, #10B981)',
    accentColor: '#F59E0B',
    accentBg: '#F59E0B20',
  },
  finishing: {
    lines: FINISHING_LINES,
    table: 'finishing_entries',
    department: 'finishing',
    title: 'ข้อมูลการประกอบ',
    lineLabel: 'สายประกอบ',
    completedLabel: 'ประกอบแล้ว (ชิ้น)',
    statusLabels: { running: '🟣 กำลังประกอบ', completed: '🟢 เสร็จสิ้น', idle: '⚫ รอดำเนินการ' },
    gradient: 'linear-gradient(90deg, #8B5CF6, #6366F1)',
    accentColor: '#8B5CF6',
    accentBg: '#8B5CF620',
  },
} as const

export default function QuickEntryModal({ isOpen, onClose, onSuccess, lineId, lineType, existingEntryId }: QuickEntryModalProps) {
  const supabase = createClient()
  const config = MODE_CONFIG[lineType]

  const [loading, setLoading] = useState(false)
  const [loadingEntry, setLoadingEntry] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [partNumbers, setPartNumbers] = useState<PartNumberOption[]>([])

  const [formData, setFormData] = useState({
    line_id: lineId,
    line_name: getLineName(lineId),
    product_name: '',
    lot_number: '',
    target_qty: 0,
    completed_qty: 0,
    status: 'running' as 'running' | 'completed' | 'idle',
    shift: 'morning' as 'morning' | 'night',
    start_time: '06:00',
    end_time: '',
    operator: '',
    remarks: '',
    image_url: '',
    plan_id: null as string | null,
    part_number_id: null as string | null,
  })

  // Fetch part numbers and existing entry data
  useEffect(() => {
    if (!isOpen) return

    const fetchPartNumbers = async () => {
      const { data } = await supabase
        .from('part_numbers')
        .select('id, part_number, part_name, std_qty, unit')
        .eq('is_active', true)
        .order('part_number', { ascending: true })
      if (data) setPartNumbers(data)
    }

    const fetchExistingEntry = async () => {
      if (!existingEntryId) return
      setLoadingEntry(true)
      const { data } = await supabase
        .from(config.table)
        .select('*')
        .eq('id', existingEntryId)
        .single()
      if (data) {
        setFormData({
          line_id: data.line_id,
          line_name: data.line_name,
          product_name: data.product_name,
          lot_number: data.lot_number,
          target_qty: data.target_qty,
          completed_qty: data.completed_qty,
          status: data.status,
          shift: data.shift,
          start_time: data.start_time || '06:00',
          end_time: data.end_time || '',
          operator: data.operator || '',
          remarks: data.remarks || '',
          image_url: data.image_url || '',
          plan_id: data.plan_id || null,
          part_number_id: data.part_number_id || null,
        })
      }
      setLoadingEntry(false)
    }

    // Reset state
    setError(null)
    setSuccess(false)
    if (!existingEntryId) {
      setFormData({
        line_id: lineId,
        line_name: getLineName(lineId),
        product_name: '',
        lot_number: '',
        target_qty: 0,
        completed_qty: 0,
        status: 'running',
        shift: 'morning',
        start_time: '06:00',
        end_time: '',
        operator: '',
        remarks: '',
        image_url: '',
        plan_id: null,
        part_number_id: null,
      })
    }

    fetchPartNumbers()
    fetchExistingEntry()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, lineId, existingEntryId])

  const handlePartNumberSelect = (partId: string) => {
    if (!partId) {
      setFormData(prev => ({ ...prev, part_number_id: null }))
      return
    }
    const part = partNumbers.find(p => p.id === partId)
    if (part) {
      setFormData(prev => ({
        ...prev,
        part_number_id: partId,
        product_name: part.part_name,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload = {
        ...formData,
        end_time: formData.end_time || null,
        plan_id: formData.plan_id || null,
        part_number_id: formData.part_number_id || null,
      }

      if (existingEntryId) {
        const { error } = await supabase.from(config.table).update(payload).eq('id', existingEntryId)
        if (error) throw error
      } else {
        const { error } = await supabase.from(config.table).insert([payload])
        if (error) throw error
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        padding: '20px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: '#1E293B',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '8px 8px 0 0 rgba(0,0,0,0.5)',
          border: `3px solid ${config.accentColor}`,
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          background: config.gradient,
          color: '#000',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: "'Press Start 2P', monospace" }}>
              {existingEntryId ? '✏️ EDIT' : '➕ ADD'}
            </div>
            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
              {lineId} — {getLineName(lineId)}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,0.2)',
              border: 'none',
              color: '#000',
              width: '32px',
              height: '32px',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        {loadingEntry ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            ⏳ กำลังโหลดข้อมูล...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
            {error && (
              <div style={{ padding: '10px 14px', background: '#7F1D1D', border: '2px solid #EF4444', color: '#FCA5A5', marginBottom: '16px', fontSize: '13px' }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div style={{ padding: '10px 14px', background: '#10B98120', border: '2px solid #10B981', color: '#10B981', marginBottom: '16px', fontSize: '13px' }}>
                ✅ บันทึกสำเร็จ!
              </div>
            )}

            <div className="modal-form-grid">
              {/* Part Number */}
              <div className="modal-form-full">
                <label style={LABEL_STYLE}>📦 Part Number</label>
                <select
                  value={formData.part_number_id || ''}
                  onChange={(e) => handlePartNumberSelect(e.target.value)}
                  style={{ ...INPUT_STYLE, borderColor: config.accentColor }}
                >
                  <option value="">-- ไม่เลือก (กรอกชื่อเอง) --</option>
                  {partNumbers.map(pn => (
                    <option key={pn.id} value={pn.id}>
                      {pn.part_number} — {pn.part_name} (Std: {pn.std_qty}/{pn.unit}/ชม.)
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Name */}
              <div>
                <label style={LABEL_STYLE}>ชื่อผลิตภัณฑ์ *</label>
                <input
                  type="text"
                  value={formData.product_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                  placeholder="เช่น PCB Board v2.1"
                  style={INPUT_STYLE}
                  required
                  readOnly={!!formData.part_number_id}
                />
              </div>

              {/* Lot Number */}
              <div>
                <label style={LABEL_STYLE}>หมายเลขล็อต *</label>
                <input
                  type="text"
                  value={formData.lot_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, lot_number: e.target.value }))}
                  placeholder="เช่น LOT-2024-001"
                  style={INPUT_STYLE}
                  required
                />
              </div>

              {/* Operator */}
              <div>
                <label style={LABEL_STYLE}>👷 ผู้รับผิดชอบ *</label>
                <input
                  type="text"
                  value={formData.operator}
                  onChange={(e) => setFormData(prev => ({ ...prev, operator: e.target.value }))}
                  placeholder="ชื่อพนักงาน"
                  style={INPUT_STYLE}
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label style={LABEL_STYLE}>สถานะ *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'running' | 'completed' | 'idle' }))}
                  style={INPUT_STYLE}
                  required
                >
                  <option value="running">{config.statusLabels.running}</option>
                  <option value="completed">{config.statusLabels.completed}</option>
                  <option value="idle">{config.statusLabels.idle}</option>
                </select>
              </div>

              {/* Target Qty */}
              <div>
                <label style={LABEL_STYLE}>🎯 เป้าหมาย (ชิ้น) *</label>
                <input
                  type="number"
                  value={formData.target_qty}
                  onChange={(e) => { const val = parseInt(e.target.value) || 0; setFormData(prev => ({ ...prev, target_qty: val, status: prev.completed_qty >= val && val > 0 ? 'completed' : prev.status === 'completed' && prev.completed_qty < val ? 'running' : prev.status })) }}
                  min="0"
                  style={INPUT_STYLE}
                  required
                />
              </div>

              {/* Completed Qty */}
              <div>
                <label style={{ ...LABEL_STYLE, color: config.accentColor }}>⚡ {config.completedLabel} *</label>
                <input
                  type="number"
                  value={formData.completed_qty}
                  onChange={(e) => { const val = parseInt(e.target.value) || 0; setFormData(prev => ({ ...prev, completed_qty: val, status: val >= prev.target_qty && prev.target_qty > 0 ? 'completed' : prev.status === 'completed' && val < prev.target_qty ? 'running' : prev.status })) }}
                  min="0"
                  style={{ ...INPUT_STYLE, borderColor: config.accentColor, background: config.accentBg, fontWeight: 'bold', fontSize: '16px', color: '#F1F5F9' }}
                  required
                />
              </div>

              {/* Shift */}
              <div>
                <label style={LABEL_STYLE}>กะ</label>
                <div style={{ display: 'flex', gap: '12px', paddingTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#F1F5F9' }}>
                    <input type="radio" name="modal-shift" value="morning" checked={formData.shift === 'morning'} onChange={() => setFormData(prev => ({ ...prev, shift: 'morning' }))} />
                    ☀️ เช้า
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#F1F5F9' }}>
                    <input type="radio" name="modal-shift" value="night" checked={formData.shift === 'night'} onChange={() => setFormData(prev => ({ ...prev, shift: 'night' }))} />
                    🌙 กลางคืน
                  </label>
                </div>
              </div>

              {/* Start Time */}
              <div>
                <label style={LABEL_STYLE}>⏱ เวลาเริ่ม *</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  style={INPUT_STYLE}
                  required
                />
              </div>

              {/* End Time */}
              <div>
                <label style={LABEL_STYLE}>⏱ เวลาสิ้นสุด</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  style={INPUT_STYLE}
                />
              </div>

              {/* Remarks */}
              <div className="modal-form-full">
                <label style={LABEL_STYLE}>📝 หมายเหตุ</label>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                  style={INPUT_STYLE}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'transparent',
                  color: '#94A3B8',
                  border: '2px solid #334155',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading || success}
                style={{
                  flex: 2,
                  padding: '12px',
                  background: loading || success ? '#475569' : config.gradient,
                  color: loading || success ? '#94A3B8' : '#000',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: loading || success ? 'not-allowed' : 'pointer',
                  fontFamily: "'Press Start 2P', monospace",
                  boxShadow: loading || success ? 'none' : '4px 4px 0 0 rgba(0,0,0,0.3)',
                }}
              >
                {loading ? '⏳ SAVING...' : success ? '✅ DONE!' : existingEntryId ? '💾 SAVE' : '✅ SUBMIT'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
