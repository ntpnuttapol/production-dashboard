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

  const filterStyle: React.CSSProperties = { padding: '8px 12px', border: '2px solid #334155', fontSize: '13px', background: '#0F172A', color: '#F1F5F9' }

  return (
    <div style={{ background: '#1E293B', border: '3px solid #334155', boxShadow: '4px 4px 0 0 rgba(0,0,0,0.4)', padding: '24px' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '12px', fontWeight: 'bold', color: '#F59E0B', fontFamily: "'Press Start 2P', monospace" }}>{config.title}</h2>

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
          <button onClick={() => setFilter({ status: 'all', shift: 'all', date: '' })} style={{ padding: '8px 12px', background: '#7F1D1D', color: '#EF4444', border: '2px solid #EF444440', fontSize: '13px', cursor: 'pointer', boxShadow: '2px 2px 0 0 rgba(0,0,0,0.2)' }}>✕ ล้าง</button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>⏳ กำลังโหลด...</div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>📭 ไม่พบข้อมูล</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="pixel-table">
            <thead>
              <tr>
                <th>วันที่</th>
                <th>{config.lineLabel}</th>
                <th>ผลิตภัณฑ์</th>
                <th>ล็อต</th>
                <th style={{ textAlign: 'center' }}>จำนวน</th>
                <th style={{ textAlign: 'center' }}>สถานะ</th>
                <th style={{ textAlign: 'center' }}>กะ</th>
                <th>ผู้รับผิดชอบ</th>
                <th style={{ textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const statusConfig = config.statusConfig[entry.status]
                const shiftConfig = SHIFT_CONFIG[entry.shift]
                const progress = entry.target_qty > 0 ? Math.round((entry.completed_qty / entry.target_qty) * 100) : 0

                return (
                  <tr key={entry.id}>
                    <td style={{ color: '#94A3B8' }}>{formatDate(entry.created_at)}</td>
                    <td>
                      <span style={{ fontWeight: '600', color: '#F59E0B' }}>{entry.line_id}</span>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{entry.line_name}</div>
                    </td>
                    <td>{entry.product_name}</td>
                    <td style={{ color: '#94A3B8', fontFamily: 'monospace' }}>{entry.lot_number}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: '600' }}>{entry.completed_qty}</span>
                      <span style={{ color: '#64748B' }}>/{entry.target_qty}</span>
                      <div style={{ fontSize: '11px', color: statusConfig.color }}>{progress}%</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ padding: '4px 8px', background: `${statusConfig.color}20`, color: statusConfig.color, border: `1px solid ${statusConfig.color}40`, fontSize: '11px', fontWeight: '600' }}>{statusConfig.label}</span>
                    </td>
                    <td style={{ textAlign: 'center', color: '#94A3B8' }}>{shiftConfig.icon} {shiftConfig.label}</td>
                    <td>{entry.operator}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button onClick={() => onEdit?.(entry)} style={{ padding: '5px 10px', background: '#1E3A5F', color: '#3B82F6', border: '2px solid #3B82F640', cursor: 'pointer', fontSize: '12px', boxShadow: '2px 2px 0 0 rgba(0,0,0,0.2)' }}>✏️</button>
                        <button onClick={() => handleDelete(entry.id)} style={{ padding: '5px 10px', background: '#7F1D1D40', color: '#EF4444', border: '2px solid #EF444440', cursor: 'pointer', fontSize: '12px', boxShadow: '2px 2px 0 0 rgba(0,0,0,0.2)' }}>🗑️</button>
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
