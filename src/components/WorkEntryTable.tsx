'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  PRODUCTION_STATUS_CONFIG,
  FINISHING_STATUS_CONFIG,
  SHIFT_CONFIG,
  INPUT_STYLE,
  type WorkEntry,
} from '@/lib/constants'

interface WorkEntryTableProps {
  mode: 'production' | 'finishing'
  refreshTrigger?: number
  onEdit?: (entry: WorkEntry) => void
}

const MODE_CONFIG = {
  production: {
    table: 'production_entries',
    title: '📋 ประวัติการผลิต',
    lineLabel: 'สายผลิต',
    statusConfig: PRODUCTION_STATUS_CONFIG,
  },
  finishing: {
    table: 'finishing_entries',
    title: '📋 ประวัติการประกอบ',
    lineLabel: 'สายประกอบ',
    statusConfig: FINISHING_STATUS_CONFIG,
  },
} as const

export default function WorkEntryTable({ mode, refreshTrigger, onEdit }: WorkEntryTableProps) {
  const supabase = createClient()
  const config = MODE_CONFIG[mode]
  const [entries, setEntries] = useState<WorkEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: 'all', shift: 'all', date: '' })

  const fetchEntries = async () => {
    setLoading(true)
    let query = supabase.from(config.table).select('*').order('created_at', { ascending: false })

    if (filter.status !== 'all') query = query.eq('status', filter.status)
    if (filter.shift !== 'all') query = query.eq('shift', filter.shift)
    if (filter.date) query = query.gte('created_at', `${filter.date}T00:00:00`).lte('created_at', `${filter.date}T23:59:59`)

    const { data, error } = await query
    if (error) console.error('Fetch error:', error)
    else setEntries(data || [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchEntries() }, [filter, refreshTrigger])

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบข้อมูลนี้?')) return
    const { error } = await supabase.from(config.table).delete().eq('id', id)
    if (error) alert('เกิดข้อผิดพลาด: ' + error.message)
    else fetchEntries()
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const statusLabels = mode === 'production'
    ? { running: '🟡 กำลังผลิต', completed: '🟢 เสร็จสิ้น', idle: '⚫ รอดำเนินการ' }
    : { running: '🟣 กำลังประกอบ', completed: '🟢 เสร็จสิ้น', idle: '⚫ รอดำเนินการ' }

  const filterStyle = { padding: '8px 12px', border: '2px solid #E2E8F0', borderRadius: '6px', fontSize: '13px' }

  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 'bold', color: '#1E293B' }}>{config.title}</h2>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <select value={filter.status} onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))} style={filterStyle}>
          <option value="all">ทุกสถานะ</option>
          <option value="running">{statusLabels.running}</option>
          <option value="completed">{statusLabels.completed}</option>
          <option value="idle">{statusLabels.idle}</option>
        </select>
        <select value={filter.shift} onChange={(e) => setFilter(prev => ({ ...prev, shift: e.target.value }))} style={filterStyle}>
          <option value="all">ทุกกะ</option>
          <option value="morning">☀️ กะเช้า</option>
          <option value="night">🌙 กะกลางคืน</option>
        </select>
        <input type="date" value={filter.date} onChange={(e) => setFilter(prev => ({ ...prev, date: e.target.value }))} style={filterStyle} />
        {(filter.status !== 'all' || filter.shift !== 'all' || filter.date) && (
          <button onClick={() => setFilter({ status: 'all', shift: 'all', date: '' })} style={{ padding: '8px 12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>✕ ล้าง</button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>⏳ กำลังโหลด...</div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>📭 ไม่พบข้อมูล</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>วันที่</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>{config.lineLabel}</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>ผลิตภัณฑ์</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>ล็อต</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>จำนวน</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>สถานะ</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>กะ</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>ผู้รับผิดชอบ</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const statusConfig = config.statusConfig[entry.status]
                const shiftConfig = SHIFT_CONFIG[entry.shift]
                const progress = entry.target_qty > 0 ? Math.round((entry.completed_qty / entry.target_qty) * 100) : 0

                return (
                  <tr key={entry.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '12px', color: '#64748B' }}>{formatDate(entry.created_at)}</td>
                    <td style={{ padding: '12px', fontWeight: '600', color: '#1E293B' }}>
                      {entry.line_id}
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>{entry.line_name}</div>
                    </td>
                    <td style={{ padding: '12px', color: '#1E293B' }}>{entry.product_name}</td>
                    <td style={{ padding: '12px', color: '#64748B', fontFamily: 'monospace' }}>{entry.lot_number}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ fontWeight: '600', color: '#1E293B' }}>{entry.completed_qty}</span>
                      <span style={{ color: '#94A3B8' }}>/{entry.target_qty}</span>
                      <div style={{ fontSize: '11px', color: statusConfig.color }}>{progress}%</div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ padding: '4px 8px', background: statusConfig.bg, color: statusConfig.color, borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>{statusConfig.label}</span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{shiftConfig.icon} {shiftConfig.label}</td>
                    <td style={{ padding: '12px', color: '#1E293B' }}>{entry.operator}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => onEdit?.(entry)} style={{ padding: '6px 10px', background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✏️</button>
                        <button onClick={() => handleDelete(entry.id)} style={{ padding: '6px 10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop: '16px', fontSize: '13px', color: '#64748B', textAlign: 'right' }}>แสดง {entries.length} รายการ</div>
    </div>
  )
}
