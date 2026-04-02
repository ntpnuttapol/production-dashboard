'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  SHIFT_CONFIG,
  INPUT_STYLE,
  type WorkEntry,
} from '@/lib/constants'
import { WORK_MODE_META, type WorkMode, type WorkStatus } from '@/lib/work-modes'

interface WorkEntryTableProps {
  mode: WorkMode
  refreshTrigger?: number
  onEdit?: (entry: WorkEntry) => void
}

interface EntryFilterState {
  status: 'all' | WorkStatus
  shift: 'all' | keyof typeof SHIFT_CONFIG
  date: string
}

export default function WorkEntryTable({ mode, refreshTrigger, onEdit }: WorkEntryTableProps) {
  const supabase = createClient()
  const config = WORK_MODE_META[mode]
  const [entries, setEntries] = useState<WorkEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<EntryFilterState>({ status: 'all', shift: 'all', date: '' })

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

  const filterStyle: React.CSSProperties = {
    ...INPUT_STYLE,
    width: 'auto',
    minWidth: '150px',
    background: 'var(--color-bg-primary)',
  }

  return (
    <div className="cartoon-card" style={{ padding: '32px' }}>
      <h2 className="cartoon-font" style={{ margin: '0 0 24px', fontSize: '18px', color: config.accentColor }}>{config.tableTitle}</h2>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <select value={filter.status} onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value as EntryFilterState['status'] }))} style={filterStyle}>
          <option value="all">ทุกสถานะ</option>
          <option value="running">{config.statusOptions.running}</option>
          <option value="completed">{config.statusOptions.completed}</option>
          <option value="idle">{config.statusOptions.idle}</option>
        </select>
        <select value={filter.shift} onChange={(e) => setFilter(prev => ({ ...prev, shift: e.target.value as EntryFilterState['shift'] }))} style={filterStyle}>
          <option value="all">ทุกกะ</option>
          <option value="morning">☀️ กะเช้า</option>
          <option value="night">🌙 กะกลางคืน</option>
        </select>
        <input type="date" value={filter.date} onChange={(e) => setFilter(prev => ({ ...prev, date: e.target.value }))} style={filterStyle} />
        {(filter.status !== 'all' || filter.shift !== 'all' || filter.date) && (
          <button className="cartoon-btn" onClick={() => setFilter({ status: 'all', shift: 'all', date: '' })} style={{ padding: '10px 16px', background: '#FEE2E2', color: '#EF4444', fontSize: '14px' }}>✕ ล้าง</button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>⏳ กำลังโหลด...</div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>📭 ไม่พบข้อมูล</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="cartoon-table">
            <thead>
              <tr>
                <th>วันที่</th>
                <th>{config.lineTableLabel}</th>
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
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>{formatDate(entry.created_at)}</td>
                    <td>
                      <span className="cartoon-font" style={{ color: config.accentColor }}>{entry.line_id}</span>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600 }}>{entry.line_name}</div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{entry.product_name}</td>
                    <td style={{ color: 'var(--color-text-secondary)', fontFamily: "'Nunito', sans-serif" }}>{entry.lot_number}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="cartoon-font" style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}>{entry.completed_qty}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>/{entry.target_qty}</span>
                      <div style={{ fontSize: '12px', color: statusConfig.color, fontWeight: 'bold' }}>{progress}%</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="cartoon-badge" style={{ background: `${statusConfig.color}20`, color: statusConfig.color }}>{statusConfig.label}</span>
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{shiftConfig.icon} {shiftConfig.label}</td>
                    <td style={{ fontWeight: 600 }}>{entry.operator}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => onEdit?.(entry)} className="cartoon-btn" style={{ padding: '6px 12px', background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)', fontSize: '13px' }}>✏️</button>
                        <button onClick={() => handleDelete(entry.id)} className="cartoon-btn" style={{ padding: '6px 12px', background: '#FEE2E2', color: '#EF4444', fontSize: '13px' }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop: '20px', fontSize: '14px', color: 'var(--color-text-secondary)', textAlign: 'right', fontWeight: 600 }}>แสดง {entries.length} รายการ</div>
    </div>
  )
}
