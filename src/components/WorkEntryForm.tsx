'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  PRODUCTION_LINES,
  FINISHING_LINES,
  INPUT_STYLE,
  LABEL_STYLE,
  getLineName,
} from '@/lib/constants'

interface PartNumberOption {
  id: string
  part_number: string
  part_name: string
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
  plan_id: string | null
  part_number_id: string | null
}

interface PlanEntry {
  id: string
  plan_date: string
  line_id: string
  product_name: string
  lot_number: string
  target_qty: number
  status: string
  part_number_id: string | null
}

interface WorkEntryFormProps {
  mode: 'production' | 'finishing'
  onSuccess?: () => void
  editData?: WorkEntryFormData & { id: string }
}

// Mode-specific config
const MODE_CONFIG = {
  production: {
    lines: PRODUCTION_LINES,
    defaultLine: 'LINE-01',
    defaultLineName: 'สายการผลิต A',
    table: 'production_entries',
    department: 'production',
    title: 'ข้อมูลการผลิต',
    lineLabel: 'สายการผลิต',
    completedLabel: 'ผลิตแล้ว (ชิ้น)',
    statusLabels: { running: '🟡 กำลังผลิต', completed: '🟢 เสร็จสิ้น', idle: '⚫ รอดำเนินการ' },
    gradient: 'linear-gradient(90deg, #F59E0B, #10B981)',
    planBg: '#FEF3C7',
    planBorder: '#F59E0B',
    planLabelColor: '#B45309',
    completedInputBorder: '#10B981',
    completedInputBg: '#D1FAE5',
    storageBucket: 'production-images',
    filePrefix: '',
  },
  finishing: {
    lines: FINISHING_LINES,
    defaultLine: 'FINISH-01',
    defaultLineName: 'สายประกอบ A',
    table: 'finishing_entries',
    department: 'finishing',
    title: 'ข้อมูลการประกอบ',
    lineLabel: 'สายประกอบ',
    completedLabel: 'ประกอบแล้ว (ชิ้น)',
    statusLabels: { running: '🟣 กำลังประกอบ', completed: '🟢 เสร็จสิ้น', idle: '⚫ รอดำเนินการ' },
    gradient: 'linear-gradient(90deg, #8B5CF6, #6366F1)',
    planBg: '#EDE9FE',
    planBorder: '#8B5CF6',
    planLabelColor: '#6D28D9',
    completedInputBorder: '#8B5CF6',
    completedInputBg: '#EDE9FE',
    storageBucket: 'production-images',
    filePrefix: 'finishing-',
  },
} as const

export default function WorkEntryForm({ mode, onSuccess, editData }: WorkEntryFormProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const config = MODE_CONFIG[mode]

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(editData?.image_url || null)
  const [plans, setPlans] = useState<PlanEntry[]>([])
  const [partNumbers, setPartNumbers] = useState<PartNumberOption[]>([])

  const [formData, setFormData] = useState<WorkEntryFormData>({
    line_id: editData?.line_id || config.defaultLine,
    line_name: editData?.line_name || config.defaultLineName,
    product_name: editData?.product_name || '',
    lot_number: editData?.lot_number || '',
    target_qty: editData?.target_qty || 0,
    completed_qty: editData?.completed_qty || 0,
    status: editData?.status || 'running',
    shift: editData?.shift || 'morning',
    start_time: editData?.start_time || '06:00',
    end_time: editData?.end_time || '',
    operator: editData?.operator || '',
    remarks: editData?.remarks || '',
    image_url: editData?.image_url || '',
    plan_id: editData?.plan_id || null,
    part_number_id: editData?.part_number_id || null,
  })

  // Fetch available plans and part numbers
  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from('planning_entries')
        .select('*')
        .eq('department', config.department)
        .in('status', ['pending', 'in_progress'])
        .order('plan_date', { ascending: false })
      if (data) setPlans(data)
    }
    const fetchPartNumbers = async () => {
      const { data } = await supabase
        .from('part_numbers')
        .select('id, part_number, part_name, std_qty, unit')
        .eq('is_active', true)
        .order('part_number', { ascending: true })
      if (data) setPartNumbers(data)
    }
    fetchPlans()
    fetchPartNumbers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Check for selected plan from navigation (sessionStorage)
  useEffect(() => {
    if (!editData) {
      const storedPlan = sessionStorage.getItem('selectedPlan')
      if (storedPlan) {
        try {
          const planData = JSON.parse(storedPlan)
          setFormData(prev => ({
            ...prev,
            plan_id: planData.plan_id,
            line_id: planData.line_id,
            line_name: getLineName(planData.line_id),
            product_name: planData.product_name,
            lot_number: planData.lot_number,
            target_qty: planData.target_qty,
            part_number_id: planData.part_number_id || null,
          }))
          // Clear after use so it doesn't persist on refresh/navigation
          sessionStorage.removeItem('selectedPlan')
        } catch (err) {
          console.error('Failed to parse selected plan:', err)
        }
      }
    }
  }, [editData])

  const handlePlanSelect = (planId: string) => {
    const plan = plans.find(p => p.id === planId)
    if (plan) {
      setFormData(prev => ({
        ...prev,
        plan_id: planId,
        line_id: plan.line_id,
        line_name: getLineName(plan.line_id),
        product_name: plan.product_name,
        lot_number: plan.lot_number,
        target_qty: plan.target_qty,
        part_number_id: plan.part_number_id || null,
      }))
    } else {
      setFormData(prev => ({ ...prev, plan_id: null, part_number_id: null }))
    }
  }

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
      // Sanitize data: Convert empty strings to null for optional fields
      const payload = {
        ...formData,
        end_time: formData.end_time || null,
        plan_id: formData.plan_id || null,
        part_number_id: formData.part_number_id || null,
      }

      if (editData?.id) {
        const { error } = await supabase.from(config.table).update(payload).eq('id', editData.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from(config.table).insert([payload])
        if (error) throw error

        // Update plan status to in_progress if linked
        if (formData.plan_id) {
          await supabase.from('planning_entries').update({ status: 'in_progress' }).eq('id', formData.plan_id)
        }
      }

      onSuccess?.()

      if (!editData) {
        setFormData({
          line_id: config.defaultLine,
          line_name: config.defaultLineName,
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
        setImagePreview(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 'bold', color: '#1E293B' }}>
        {editData ? '✏️ แก้ไขข้อมูล' : `➕ เพิ่ม${config.title}`}
      </h2>

      {error && <div style={{ padding: '12px', background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: '8px', color: '#DC2626', marginBottom: '16px', fontSize: '14px' }}>⚠️ {error}</div>}

      {/* Plan Selector */}
      {plans.length > 0 && !editData && (
        <div style={{ marginBottom: '20px', padding: '16px', background: config.planBg, borderRadius: '10px', border: `2px solid ${config.planBorder}` }}>
          <label style={{ ...LABEL_STYLE, color: config.planLabelColor }}>📋 เลือกจากแผนที่วางไว้</label>
          <select value={formData.plan_id || ''} onChange={(e) => handlePlanSelect(e.target.value)} style={{ ...INPUT_STYLE, borderColor: config.planBorder }}>
            <option value="">-- กรอกข้อมูลเอง (ไม่เลือกแผน) --</option>
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>
                [{plan.plan_date}] {plan.line_id} - {plan.product_name} ({plan.lot_number}) เป้าหมาย: {plan.target_qty}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        <div>
          <label style={LABEL_STYLE}>{config.lineLabel} *</label>
          <select value={formData.line_id} onChange={(e) => handleLineChange(e.target.value)} style={INPUT_STYLE} required disabled={!!formData.plan_id}>
            {config.lines.map(line => (
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
            disabled={!!formData.plan_id}
          >
            <option value="">-- ไม่เลือก (กรอกชื่อเอง) --</option>
            {partNumbers.map(pn => (
              <option key={pn.id} value={pn.id}>
                {pn.part_number} - {pn.part_name} (Std: {pn.std_qty}/{pn.unit}/ชม.)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={LABEL_STYLE}>ชื่อผลิตภัณฑ์ *</label>
          <input type="text" value={formData.product_name} onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))} placeholder="เช่น PCB Board v2.1" style={INPUT_STYLE} required readOnly={!!formData.plan_id || !!formData.part_number_id} />
        </div>

        <div>
          <label style={LABEL_STYLE}>หมายเลขล็อต *</label>
          <input type="text" value={formData.lot_number} onChange={(e) => setFormData(prev => ({ ...prev, lot_number: e.target.value }))} placeholder="เช่น LOT-2024-001" style={INPUT_STYLE} required readOnly={!!formData.plan_id} />
        </div>

        <div>
          <label style={LABEL_STYLE}>ผู้รับผิดชอบ *</label>
          <input type="text" value={formData.operator} onChange={(e) => setFormData(prev => ({ ...prev, operator: e.target.value }))} placeholder="ชื่อพนักงาน" style={INPUT_STYLE} required />
        </div>

        <div>
          <label style={LABEL_STYLE}>เป้าหมาย (ชิ้น) *</label>
          <input type="number" value={formData.target_qty} onChange={(e) => setFormData(prev => ({ ...prev, target_qty: parseInt(e.target.value) || 0 }))} min="0" style={INPUT_STYLE} required readOnly={!!formData.plan_id} />
        </div>

        <div>
          <label style={LABEL_STYLE}>{config.completedLabel} *</label>
          <input type="number" value={formData.completed_qty} onChange={(e) => setFormData(prev => ({ ...prev, completed_qty: parseInt(e.target.value) || 0 }))} min="0" style={{ ...INPUT_STYLE, borderColor: config.completedInputBorder, background: config.completedInputBg }} required />
        </div>

        <div>
          <label style={LABEL_STYLE}>สถานะ *</label>
          <select value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'running' | 'completed' | 'idle' }))} style={INPUT_STYLE} required>
            <option value="running">{config.statusLabels.running}</option>
            <option value="completed">{config.statusLabels.completed}</option>
            <option value="idle">{config.statusLabels.idle}</option>
          </select>
        </div>

        <div>
          <label style={LABEL_STYLE}>กะการทำงาน *</label>
          <div style={{ display: 'flex', gap: '16px', paddingTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="radio" name={`shift-${mode}`} value="morning" checked={formData.shift === 'morning'} onChange={() => setFormData(prev => ({ ...prev, shift: 'morning' }))} />
              <span style={{ fontSize: '14px' }}>☀️ กะเช้า</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="radio" name={`shift-${mode}`} value="night" checked={formData.shift === 'night'} onChange={() => setFormData(prev => ({ ...prev, shift: 'night' }))} />
              <span style={{ fontSize: '14px' }}>🌙 กะกลางคืน</span>
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
          <div onClick={() => fileInputRef.current?.click()} style={{ width: '120px', height: '120px', border: '2px dashed #CBD5E1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#F8FAFC', overflow: 'hidden' }}>
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center', color: '#94A3B8' }}>
                <div style={{ fontSize: '24px' }}>📷</div>
                <div style={{ fontSize: '11px' }}>คลิกเพื่อเพิ่มรูป</div>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
          {imagePreview && (
            <button type="button" onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, image_url: '' })) }} style={{ padding: '8px 12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>❌ ลบรูป</button>
          )}
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? '#94A3B8' : config.gradient, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? '⏳ กำลังบันทึก...' : editData ? '💾 บันทึกการแก้ไข' : '✅ บันทึกข้อมูล'}
        </button>
      </div>
    </form>
  )
}
