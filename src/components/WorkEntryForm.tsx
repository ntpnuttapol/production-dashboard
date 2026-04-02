'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { INPUT_STYLE, LABEL_STYLE } from '@/lib/constants'
import { useLines } from '@/lib/lines-context'
import { getDefaultLineSelection, WORK_MODE_META, type LineOption, type WorkMode } from '@/lib/work-modes'

interface PartNumberOption {
  id: string
  part_number: string
  part_name: string
  customers?: { customer_name: string; customer_code: string } | { customer_name: string; customer_code: string }[] | null
  std_qty: number
  unit: string
}

interface WorkEntryFormData {
  line_id: string
  line_name: string
  product_name: string
  lot_number: string
  target_qty: number
  completed_qty: number
  status: 'running' | 'completed' | 'idle'
  shift: 'morning' | 'night'
  start_time: string
  end_time: string
  operator: string
  remarks: string
  image_url: string
  part_number_id: string | null
}

interface WorkEntryFormProps {
  mode: WorkMode
  onSuccess?: () => void
  editData?: WorkEntryFormData & { id: string }
}

const DEFAULT_START_TIME = '06:00'

function normalizeStoredShift(value: string | null): WorkEntryFormData['shift'] {
  return value === 'night' ? 'night' : 'morning'
}

function createFormData(
  defaultLine: LineOption,
  editData?: WorkEntryFormData & { id: string },
  operator = '',
  shift: WorkEntryFormData['shift'] = 'morning',
): WorkEntryFormData {
  return {
    line_id: editData?.line_id || defaultLine.id,
    line_name: editData?.line_name || defaultLine.name,
    product_name: editData?.product_name || '',
    lot_number: editData?.lot_number || '',
    target_qty: editData?.target_qty || 0,
    completed_qty: editData?.completed_qty || 0,
    status: editData?.status || 'running',
    shift: editData?.shift || shift,
    start_time: editData?.start_time || DEFAULT_START_TIME,
    end_time: editData?.end_time || '',
    operator: editData?.operator || operator,
    remarks: editData?.remarks || '',
    image_url: editData?.image_url || '',
    part_number_id: editData?.part_number_id || null,
  }
}

export default function WorkEntryForm({ mode, onSuccess, editData }: WorkEntryFormProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const config = WORK_MODE_META[mode]
  const { productionLines, finishingLines, getLineName } = useLines()

  const currentLines = mode === 'production' ? productionLines : finishingLines
  const defaultLine = getDefaultLineSelection(mode, currentLines)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(editData?.image_url || null)
  const [partNumbers, setPartNumbers] = useState<PartNumberOption[]>([])

  const [formData, setFormData] = useState<WorkEntryFormData>(() => createFormData(getDefaultLineSelection(mode, []), editData))

  useEffect(() => {
    const fetchPartNumbers = async () => {
      const { data, error } = await supabase
        .from('part_numbers')
        .select('id, part_number, part_name, customer_id, std_qty, unit')
        .eq('is_active', true)
        .eq('department', config.department)
        .order('part_number', { ascending: true })

      if (data) setPartNumbers(data as PartNumberOption[])
      if (error) console.error('Fetch part numbers error:', error)
    }

    fetchPartNumbers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  useEffect(() => {
    setImagePreview(editData?.image_url || null)

    if (editData) {
      setFormData(createFormData({ id: editData.line_id, name: editData.line_name }, editData))
      return
    }

    if (typeof window === 'undefined') return

    const storedOperator = localStorage.getItem('pf_default_operator_full') || ''
    const storedShift = normalizeStoredShift(localStorage.getItem('pf_default_shift_full'))

    setFormData(prev => ({
      ...prev,
      operator: storedOperator || prev.operator,
      shift: storedShift,
    }))
  }, [editData, mode])

  useEffect(() => {
    if (editData || currentLines.length === 0) return

    setFormData(prev => {
      const selectedLine = currentLines.find(line => line.id === prev.line_id)

      if (selectedLine) {
        if (prev.line_name === selectedLine.name) return prev
        return { ...prev, line_name: selectedLine.name }
      }

      return {
        ...prev,
        line_id: defaultLine.id,
        line_name: defaultLine.name,
      }
    })
  }, [currentLines, defaultLine.id, defaultLine.name, editData])

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

  const handleLineChange = (lineId: string) => {
    setFormData(prev => ({
      ...prev,
      line_id: lineId,
      line_name: getLineName(lineId),
    }))
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
    try {
      const fileName = `${config.filePrefix}${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage.from(config.storageBucket).upload(fileName, file)
      if (error) throw error
      const { data: urlData } = supabase.storage.from(config.storageBucket).getPublicUrl(data.path)
      setFormData(prev => ({ ...prev, image_url: urlData.publicUrl }))
    } catch (err) {
      console.error('Upload error:', err)
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
        part_number_id: formData.part_number_id || null,
      }

      if (editData?.id) {
        const { error } = await supabase.from(config.table).update(payload).eq('id', editData.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from(config.table).insert([payload])
        if (error) throw error
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('pf_default_operator_full', formData.operator)
        localStorage.setItem('pf_default_shift_full', formData.shift)
      }

      onSuccess?.()

      if (!editData) {
        setFormData(createFormData(defaultLine, undefined, formData.operator, formData.shift))
        setImagePreview(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="cartoon-card" style={{ padding: '32px' }}>
      <h2 className="cartoon-font" style={{ margin: '0 0 24px', fontSize: '18px', color: config.accentColor }}>
        {editData ? '✏️ EDIT' : `➕ ${config.formTitle.toUpperCase()}`}
      </h2>

      {error && <div style={{ padding: '12px', background: '#7F1D1D', border: '2px solid #EF4444', color: '#FCA5A5', marginBottom: '16px', fontSize: '14px' }}>⚠️ {error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        <div>
          <label style={LABEL_STYLE}>{config.lineLabel} *</label>
          <select value={formData.line_id} onChange={(e) => handleLineChange(e.target.value)} style={INPUT_STYLE} required>
            {currentLines.map(line => (
              <option key={line.id} value={line.id}>{line.id} - {line.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={LABEL_STYLE}>📦 Part Number</label>
          <select
            value={formData.part_number_id || ''}
            onChange={(e) => handlePartNumberSelect(e.target.value)}
            style={INPUT_STYLE}
          >
            <option value="">-- ไม่เลือก (กรอกชื่อเอง) --</option>
            {partNumbers.map(pn => {
              const custRaw = pn.customers
              const cust = Array.isArray(custRaw) ? custRaw[0] : custRaw
              return (
                <option key={pn.id} value={pn.id}>
                  [{pn.part_number}] {pn.part_name}{cust ? ` | ลูกค้า: ${cust.customer_name}` : ''} (Std: {pn.std_qty}/{pn.unit}/ชม.)
                </option>
              )
            })}
          </select>
        </div>

        <div>
          <label style={LABEL_STYLE}>ชื่อผลิตภัณฑ์ *</label>
          <input type="text" value={formData.product_name} onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))} placeholder="เช่น PCB Board v2.1" style={INPUT_STYLE} required readOnly={!!formData.part_number_id} />
        </div>

        <div>
          <label style={LABEL_STYLE}>หมายเลขล็อต *</label>
          <input type="text" value={formData.lot_number} onChange={(e) => setFormData(prev => ({ ...prev, lot_number: e.target.value }))} placeholder="เช่น LOT-2024-001" style={INPUT_STYLE} required />
        </div>

        <div>
          <label style={LABEL_STYLE}>ผู้รับผิดชอบ *</label>
          <input type="text" value={formData.operator} onChange={(e) => setFormData(prev => ({ ...prev, operator: e.target.value }))} placeholder="ชื่อพนักงาน" style={INPUT_STYLE} required />
        </div>

        <div>
          <label style={LABEL_STYLE}>เป้าหมาย (ชิ้น) *</label>
          <input type="number" value={formData.target_qty} onChange={(e) => { const val = parseInt(e.target.value) || 0; setFormData(prev => ({ ...prev, target_qty: val, status: prev.completed_qty >= val && val > 0 ? 'completed' : prev.status === 'completed' && prev.completed_qty < val ? 'running' : prev.status })) }} min="0" style={INPUT_STYLE} required />
        </div>

        <div>
          <label style={LABEL_STYLE}>{config.completedLabel} *</label>
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
            style={{ ...INPUT_STYLE, borderColor: config.completedInputBorder, background: config.completedInputBg, color: 'var(--color-text-primary)', fontWeight: 'bold' }}
            required
          />
        </div>

        <div>
          <label style={LABEL_STYLE}>สถานะ *</label>
          <select value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'running' | 'completed' | 'idle' }))} style={INPUT_STYLE} required>
            <option value="running">{config.statusOptions.running}</option>
            <option value="completed">{config.statusOptions.completed}</option>
            <option value="idle">{config.statusOptions.idle}</option>
          </select>
        </div>

        <div>
          <label style={LABEL_STYLE}>กะการทำงาน *</label>
          <div style={{ display: 'flex', gap: '16px', paddingTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="radio" name={`shift-${mode}`} value="morning" checked={formData.shift === 'morning'} onChange={() => setFormData(prev => ({ ...prev, shift: 'morning' }))} />
              <span style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: '600' }}>☀️ กะเช้า</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="radio" name={`shift-${mode}`} value="night" checked={formData.shift === 'night'} onChange={() => setFormData(prev => ({ ...prev, shift: 'night' }))} />
              <span style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: '600' }}>🌙 กะกลางคืน</span>
            </label>
          </div>
        </div>

        <div>
          <label style={LABEL_STYLE}>เวลาเริ่ม *</label>
          <input type="time" value={formData.start_time} onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))} style={INPUT_STYLE} required />
        </div>

        <div>
          <label style={LABEL_STYLE}>เวลาสิ้นสุด</label>
          <input type="time" value={formData.end_time} onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))} style={INPUT_STYLE} />
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <label style={LABEL_STYLE}>หมายเหตุ</label>
        <textarea value={formData.remarks} onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))} placeholder="รายละเอียดเพิ่มเติม..." rows={3} style={{ ...INPUT_STYLE, resize: 'vertical' }} />
      </div>

      <div style={{ marginTop: '16px' }}>
        <label style={LABEL_STYLE}>รูปภาพงาน</label>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div onClick={() => fileInputRef.current?.click()} style={{ width: '120px', height: '120px', border: '2px dashed var(--color-border)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--color-bg-input)', overflow: 'hidden' }}>
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center', color: '#64748B' }}>
                <div style={{ fontSize: '24px' }}>📷</div>
                <div style={{ fontSize: '11px' }}>คลิกเพื่อเพิ่มรูป</div>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
          {imagePreview && (
            <button type="button" onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, image_url: '' })) }} style={{ padding: '8px 12px', background: '#7F1D1D', color: '#EF4444', border: '2px solid #EF444440', fontSize: '12px', cursor: 'pointer', boxShadow: '2px 2px 0 0 rgba(0,0,0,0.2)' }}>❌ ลบรูป</button>
          )}
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <button type="submit" disabled={loading} className="cartoon-btn" style={{ width: '100%', padding: '16px', background: loading ? 'var(--color-border-accent)' : config.accentColor, color: '#FFFFFF', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : `0 6px 16px ${config.accentColor}40` }}>
          {loading ? '⏳ SAVING...' : editData ? '💾 SAVE' : '✅ SUBMIT'}
        </button>
      </div>
    </form>
  )
}
