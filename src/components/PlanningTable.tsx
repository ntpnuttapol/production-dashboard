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
    <div style={{ background: '#1E293B', border: '3px solid #334155', boxShadow: '4px 4px 0 0 rgba(0,0,0,0.4)', padding: '24px' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '12px', fontWeight: 'bold', color: '#06B6D4', fontFamily: "'Press Start 2P', monospace" }}>📋 PLANNING</h2>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <select value={filter.department} onChange={(e) => setFilter(prev => ({ ...prev, department: e.target.value }))} style={{ padding: '8px 12px', border: '2px solid #334155', fontSize: '13px', background: '#0F172A', color: '#F1F5F9' }}>
          <option value="all">ทุกแผนก</option>
          <option value="production">🏭 Production</option>
          <option value="finishing">🔧 Finishing</option>
        </select>
        <select value={filter.priority} onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))} style={{ padding: '8px 12px', border: '2px solid #334155', fontSize: '13px', background: '#0F172A', color: '#F1F5F9' }}>
          <option value="all">ทุกความสำคัญ</option>
          <option value="high">🔴 สูง</option>
          <option value="medium">🟡 กลาง</option>
          <option value="low">🟢 ต่ำ</option>
        </select>
        <select value={filter.status} onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))} style={{ padding: '8px 12px', border: '2px solid #334155', fontSize: '13px', background: '#0F172A', color: '#F1F5F9' }}>
          <option value="all">ทุกสถานะ</option>
          <option value="pending">⏳ รอดำเนินการ</option>
          <option value="in_progress">🔄 กำลังดำเนินการ</option>
          <option value="completed">✅ เสร็จสิ้น</option>
          <option value="cancelled">❌ ยกเลิก</option>
        </select>
        <input type="date" value={filter.date} onChange={(e) => setFilter(prev => ({ ...prev, date: e.target.value }))} style={{ padding: '8px 12px', border: '2px solid #334155', fontSize: '13px', background: '#0F172A', color: '#F1F5F9' }} />
        {(filter.department !== 'all' || filter.priority !== 'all' || filter.status !== 'all' || filter.date) && (
          <button onClick={() => setFilter({ department: 'all', priority: 'all', status: 'all', date: '' })} style={{ padding: '8px 12px', background: '#7F1D1D', color: '#EF4444', border: '2px solid #EF444440', fontSize: '13px', cursor: 'pointer', boxShadow: '2px 2px 0 0 rgba(0,0,0,0.2)' }}>✕ ล้าง</button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>⏳ กำลังโหลด...</div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>📭 ไม่พบข้อมูล</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="pixel-table">
            <thead>
              <tr>
                <th>วันที่แผน</th>
                <th style={{ textAlign: 'center' }}>แผนก</th>
                <th>ผลิตภัณฑ์</th>
                <th>ล็อต</th>
                <th style={{ textAlign: 'center' }}>จำนวน</th>
                <th style={{ textAlign: 'center' }}>ความสำคัญ</th>
                <th style={{ textAlign: 'center' }}>สถานะ</th>
                <th>ผู้วางแผน</th>
                <th style={{ textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const deptConfig = DEPT_CONFIG[entry.department]
                const priorityConfig = PLANNING_PRIORITY_CONFIG[entry.priority]
                const statusConfig = PLANNING_STATUS_CONFIG[entry.status]
                const canStart = entry.status === 'pending' || entry.status === 'in_progress'

                return (
                  <tr key={entry.id}>
                    <td style={{ fontWeight: '600', color: '#F59E0B' }}>{formatDate(entry.plan_date)}</td>
                    <td style={{ textAlign: 'center' }}><span style={{ padding: '4px 8px', background: `${deptConfig.color}20`, color: deptConfig.color, border: `1px solid ${deptConfig.color}40`, fontSize: '11px', fontWeight: '600' }}>{deptConfig.icon} {deptConfig.label}</span></td>
                    <td>{entry.product_name}</td>
                    <td style={{ color: '#94A3B8', fontFamily: 'monospace' }}>{entry.lot_number}</td>
                    <td style={{ textAlign: 'center', fontWeight: '600' }}>{entry.target_qty.toLocaleString()}</td>
                    <td style={{ textAlign: 'center' }}><span style={{ padding: '4px 8px', background: `${priorityConfig.color}20`, color: priorityConfig.color, border: `1px solid ${priorityConfig.color}40`, fontSize: '11px', fontWeight: '600' }}>{priorityConfig.icon} {priorityConfig.label}</span></td>
                    <td style={{ textAlign: 'center' }}><span style={{ padding: '4px 8px', background: `${statusConfig.color}20`, color: statusConfig.color, border: `1px solid ${statusConfig.color}40`, fontSize: '11px', fontWeight: '600' }}>{statusConfig.label}</span></td>
                    <td>{entry.created_by}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {canStart && (
                          <button
                            onClick={() => onStartProduction?.(entry)}
                            style={{
                              padding: '5px 10px',
                              background: entry.department === 'production'
                                ? 'linear-gradient(90deg, #F59E0B, #10B981)'
                                : 'linear-gradient(90deg, #8B5CF6, #6366F1)',
                              color: '#000',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '600',
                              boxShadow: '2px 2px 0 0 rgba(0,0,0,0.3)',
                            }}
                            title="เปิดการผลิต"
                          >
                            ▶ เปิดผลิต
                          </button>
                        )}
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
