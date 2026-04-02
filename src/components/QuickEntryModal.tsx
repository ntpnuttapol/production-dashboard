'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  INPUT_STYLE,
  LABEL_STYLE,
} from '@/lib/constants'
import { useLines } from '@/lib/lines-context'

interface PartNumberOption {
  id: string
  part_number: string
  part_name: string
  customers?: { customer_name: string } | { customer_name: string }[] | null
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
    table: 'production_entries',
    department: 'production',
    usesShiftTracking: true,
    usesTimeTracking: true,
    title: 'ข้อมูลการผลิต',
    lineLabel: 'สายการผลิต',
    completedLabel: 'ผลิตแล้ว (ชิ้น)',
    statusLabels: { running: '🟡 กำลังผลิต', completed: '🟢 เสร็จสิ้น', idle: '⚫ รอดำเนินการ' },
    gradient: 'linear-gradient(90deg, #F59E0B, #10B981)',
    accentColor: '#F59E0B',
    accentBg: '#F59E0B20',
  },
  finishing: {
    table: 'finishing_entries',
    department: 'finishing',
    usesShiftTracking: false,
    usesTimeTracking: false,
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
  const { getLineName } = useLines()

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
    part_number_id: null as string | null,
  })

  // Fetch part numbers and existing entry data
  useEffect(() => {
    if (!isOpen) return

    const fetchPartNumbers = async () => {
      // Primary: simple query that always works
      const { data, error } = await supabase
        .from('part_numbers')
        .select('id, part_number, part_name, customer_id, std_qty, unit')
        .eq('is_active', true)
        .eq('department', lineType)
        .order('part_number', { ascending: true })
      
      console.log('[QuickEntryModal] fetchPartNumbers:', { lineType, data: data?.length, error })
      if (data) setPartNumbers(data as PartNumberOption[])
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
          shift: config.usesShiftTracking ? data.shift : 'morning',
          start_time: config.usesTimeTracking ? (data.start_time || '06:00') : '06:00',
          end_time: config.usesTimeTracking ? (data.end_time || '') : '',
          operator: data.operator || '',
          remarks: data.remarks || '',
          image_url: data.image_url || '',
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
        shift: config.usesShiftTracking
          ? ((typeof window !== 'undefined' ? localStorage.getItem('pf_default_shift') as 'morning' | 'night' : null) || 'morning')
          : 'morning',
        start_time: '06:00',
        end_time: '',
        operator: typeof window !== 'undefined' ? localStorage.getItem('pf_default_operator_quick') || '' : '',
        remarks: '',
        image_url: '',
        part_number_id: null,
      })
    }

    fetchPartNumbers()
    fetchExistingEntry()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.usesShiftTracking, config.usesTimeTracking, existingEntryId, getLineName, isOpen, lineId])

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
        shift: config.usesShiftTracking ? formData.shift : 'morning',
        start_time: config.usesTimeTracking ? formData.start_time : '06:00',
        end_time: config.usesTimeTracking ? (formData.end_time || null) : null,
        part_number_id: formData.part_number_id || null,
      }

      if (existingEntryId) {
        const { error } = await supabase.from(config.table).update(payload).eq('id', existingEntryId)
        if (error) throw error
      } else {
        const { error } = await supabase.from(config.table).insert([payload])
        if (error) throw error
      }

      // Save defaults for next time
      if (typeof window !== 'undefined' && config.usesShiftTracking) {
        localStorage.setItem('pf_default_shift', formData.shift)
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('pf_default_operator_quick', formData.operator)
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
      className="cartoon-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="cartoon-modal-content"
        style={{
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '0',
          border: `4px solid ${config.accentColor}`,
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: config.accentBg,
          color: 'var(--color-text-primary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `2px dashed ${config.accentColor}`,
        }}>
          <div>
            <div className="cartoon-font" style={{ fontSize: '18px', color: config.accentColor }}>
              {existingEntryId ? '✏️ EDIT ENTRY' : '➕ ADD ENTRY'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '600', marginTop: '4px' }}>
              {lineId} — {getLineName(lineId)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="cartoon-btn"
            style={{
              background: '#FFFFFF',
              color: 'var(--color-text-primary)',
              width: '40px',
              height: '40px',
              fontSize: '18px',
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
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)', fontWeight: '600', fontSize: '16px' }}>
            ⏳ กำลังโหลดข้อมูล...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
            {error && (
              <div style={{ padding: '12px 16px', background: '#FEE2E2', border: '2px solid #F87171', borderRadius: '12px', color: '#B91C1C', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div style={{ padding: '12px 16px', background: '#D1FAE5', border: '2px solid #34D399', borderRadius: '12px', color: '#047857', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold' }}>
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
                  {partNumbers.map(pn => {
                    const customerName = Array.isArray(pn.customers) ? pn.customers[0]?.customer_name : pn.customers?.customer_name;
                    return (
                      <option key={pn.id} value={pn.id}>
                        {pn.part_number} — {pn.part_name} {customerName ? `(${customerName})` : ''} (Std: {pn.std_qty}/{pn.unit}/ชม.)
                      </option>
                    )
                  })}
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
                <label style={LABEL_STYLE}>👨‍🔧 ผู้รับผิดชอบ *</label>
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
                  onChange={(e) => {
                    let val = parseInt(e.target.value) || 0;
                    if (formData.target_qty > 0) {
                      val = Math.min(val, formData.target_qty);
                    }
                    setFormData(prev => ({
                      ...prev,
                      completed_qty: val,
                      status: val >= prev.target_qty && prev.target_qty > 0 ? 'completed' : prev.status === 'completed' && val < prev.target_qty ? 'running' : prev.status
                    }))
                  }}
                  min="0"
                  max={formData.target_qty > 0 ? formData.target_qty : undefined}
                  style={{ ...INPUT_STYLE, borderColor: config.accentColor, background: config.accentBg, fontWeight: 'bold', fontSize: '16px', color: config.accentColor }}
                  required
                />
              </div>

              {config.usesShiftTracking && (
                <div>
                  <label style={LABEL_STYLE}>กะ</label>
                  <div style={{ display: 'flex', gap: '16px', paddingTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                      <input type="radio" name="modal-shift" value="morning" checked={formData.shift === 'morning'} onChange={() => setFormData(prev => ({ ...prev, shift: 'morning' }))} />
                      ☀️ เช้า
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                      <input type="radio" name="modal-shift" value="night" checked={formData.shift === 'night'} onChange={() => setFormData(prev => ({ ...prev, shift: 'night' }))} />
                      🌙 กลางคืน
                    </label>
                  </div>
                </div>
              )}

              {config.usesTimeTracking && (
                <>
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

                  <div>
                    <label style={LABEL_STYLE}>⏱ เวลาสิ้นสุด</label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      style={INPUT_STYLE}
                    />
                  </div>
                </>
              )}

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
            <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
              <button
                type="button"
                onClick={onClose}
                className="cartoon-btn"
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'var(--color-bg-input)',
                  color: 'var(--color-text-secondary)',
                  fontSize: '15px',
                }}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading || success}
                className="cartoon-btn"
                style={{
                  flex: 2,
                  padding: '14px',
                  background: loading || success ? 'var(--color-border-accent)' : config.accentColor,
                  color: '#FFFFFF',
                  fontSize: '15px',
                  cursor: loading || success ? 'not-allowed' : 'pointer',
                  boxShadow: loading || success ? 'none' : `0 6px 16px ${config.accentColor}40`,
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
