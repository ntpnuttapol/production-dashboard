'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  PLANNING_PRIORITY_CONFIG,
  PLANNING_STATUS_CONFIG,
  DEPT_CONFIG,
  type PlanningEntry,
} from '@/lib/constants'

interface PlanningTableProps {
  refreshTrigger?: number
  onEdit?: (entry: PlanningEntry) => void
  onStartProduction?: (entry: PlanningEntry) => void
}

export default function PlanningTable({ refreshTrigger, onEdit, onStartProduction }: PlanningTableProps) {
  const supabase = createClient()
  const [entries, setEntries] = useState<PlanningEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ department: 'all', priority: 'all', status: 'all', date: '' })

  const fetchEntries = async () => {
    setLoading(true)
    let query = supabase.from('planning_entries').select('*').order('plan_date', { ascending: false })

    if (filter.department !== 'all') query = query.eq('department', filter.department)
    if (filter.priority !== 'all') query = query.eq('priority', filter.priority)
    if (filter.status !== 'all') query = query.eq('status', filter.status)
    if (filter.date) query = query.eq('plan_date', filter.date)

    const { data, error } = await query
    if (error) console.error('Fetch error:', error)
    else setEntries(data || [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchEntries() }, [filter, refreshTrigger])

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบแผนนี้?')) return
    const { error } = await supabase.from('planning_entries').delete().eq('id', id)
    if (error) alert('เกิดข้อผิดพลาด: ' + error.message)
    else fetchEntries()
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 'bold', color: '#1E293B' }}>📋 แผนการผลิต</h2>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <select value={filter.department} onChange={(e) => setFilter(prev => ({ ...prev, department: e.target.value }))} style={{ padding: '8px 12px', border: '2px solid #E2E8F0', borderRadius: '6px', fontSize: '13px' }}>
          <option value="all">ทุกแผนก</option>
          <option value="production">🏭 Production</option>
          <option value="finishing">🔧 Finishing</option>
        </select>
        <select value={filter.priority} onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))} style={{ padding: '8px 12px', border: '2px solid #E2E8F0', borderRadius: '6px', fontSize: '13px' }}>
          <option value="all">ทุกความสำคัญ</option>
          <option value="high">🔴 สูง</option>
          <option value="medium">🟡 กลาง</option>
          <option value="low">🟢 ต่ำ</option>
        </select>
        <select value={filter.status} onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))} style={{ padding: '8px 12px', border: '2px solid #E2E8F0', borderRadius: '6px', fontSize: '13px' }}>
          <option value="all">ทุกสถานะ</option>
          <option value="pending">⏳ รอดำเนินการ</option>
          <option value="in_progress">🔄 กำลังดำเนินการ</option>
          <option value="completed">✅ เสร็จสิ้น</option>
          <option value="cancelled">❌ ยกเลิก</option>
        </select>
        <input type="date" value={filter.date} onChange={(e) => setFilter(prev => ({ ...prev, date: e.target.value }))} style={{ padding: '8px 12px', border: '2px solid #E2E8F0', borderRadius: '6px', fontSize: '13px' }} />
        {(filter.department !== 'all' || filter.priority !== 'all' || filter.status !== 'all' || filter.date) && (
          <button onClick={() => setFilter({ department: 'all', priority: 'all', status: 'all', date: '' })} style={{ padding: '8px 12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>✕ ล้าง</button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>⏳ กำลังโหลด...</div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>📭 ไม่พบข้อมูล</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>วันที่แผน</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>แผนก</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>สาย</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>ผลิตภัณฑ์</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>ล็อต</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>จำนวน</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>ความสำคัญ</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>สถานะ</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>ผู้วางแผน</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const deptConfig = DEPT_CONFIG[entry.department]
                const priorityConfig = PLANNING_PRIORITY_CONFIG[entry.priority]
                const statusConfig = PLANNING_STATUS_CONFIG[entry.status]
                const canStart = entry.status === 'pending' || entry.status === 'in_progress'

                return (
                  <tr key={entry.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '12px', fontWeight: '600', color: '#1E293B' }}>{formatDate(entry.plan_date)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}><span style={{ padding: '4px 8px', background: deptConfig.bg, color: deptConfig.color, borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>{deptConfig.icon} {deptConfig.label}</span></td>
                    <td style={{ padding: '12px', color: '#1E293B' }}>{entry.line_id}</td>
                    <td style={{ padding: '12px', color: '#1E293B' }}>{entry.product_name}</td>
                    <td style={{ padding: '12px', color: '#64748B', fontFamily: 'monospace' }}>{entry.lot_number}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#1E293B' }}>{entry.target_qty.toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}><span style={{ padding: '4px 8px', background: priorityConfig.bg, color: priorityConfig.color, borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>{priorityConfig.icon} {priorityConfig.label}</span></td>
                    <td style={{ padding: '12px', textAlign: 'center' }}><span style={{ padding: '4px 8px', background: statusConfig.bg, color: statusConfig.color, borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>{statusConfig.label}</span></td>
                    <td style={{ padding: '12px', color: '#1E293B' }}>{entry.created_by}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {/* Start Production Button */}
                        {canStart && (
                          <button
                            onClick={() => onStartProduction?.(entry)}
                            style={{
                              padding: '6px 10px',
                              background: entry.department === 'production'
                                ? 'linear-gradient(90deg, #F59E0B, #10B981)'
                                : 'linear-gradient(90deg, #8B5CF6, #6366F1)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '600',
                            }}
                            title="เปิดการผลิต"
                          >
                            ▶ เปิดผลิต
                          </button>
                        )}
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
