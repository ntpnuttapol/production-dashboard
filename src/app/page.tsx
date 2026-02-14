'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PixelDinosaur from '@/components/PixelDinosaur'
import QuickEntryModal from '@/components/QuickEntryModal'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/lib/auth-context'
import {
  PRODUCTION_LINES,
  FINISHING_LINES,
  PRODUCTION_STATUS_CONFIG,
  FINISHING_STATUS_CONFIG,
  calculateActualRate,
  calculateProductionRate,
  getEfficiencyStatus,
  type WorkEntry,
} from '@/lib/constants'

/* ═══════════════════════════════════════
   PRODUCTION DASHBOARD - Pixel Art Style
   ═══════════════════════════════════════ */

interface DashboardLine {
  id: string
  name: string
  type: 'production' | 'finishing'
  entryId: string | null
  product: string
  target: number
  current: number
  status: 'running' | 'completed' | 'idle'
  startTime: string
  endTime: string
  operator: string
  stdQty?: number
  actualRate?: {
    perMinute: number
    per10Minutes: number
    perHour: number
    totalMinutes: number
  }
  efficiency?: {
    status: 'excellent' | 'good' | 'normal' | 'slow'
    color: string
    bg: string
    percentage: number
  }
}

function Card({ line, onEdit }: { line: DashboardLine; onEdit: (line: DashboardLine) => void }) {
  const statusConfig = line.type === 'production' ? PRODUCTION_STATUS_CONFIG : FINISHING_STATUS_CONFIG
  const config = statusConfig[line.status] || statusConfig['idle']

  const borderColor = line.status === 'running'
    ? (line.type === 'production' ? '#F59E0B' : '#8B5CF6')
    : (line.status === 'completed' ? '#10B981' : '#334155')

  const progress = line.target > 0 ? Math.round((line.current / line.target) * 100) : 0

  return (
    <div
      style={{
        background: '#1E293B',
        border: `3px solid ${borderColor}`,
        boxShadow: '4px 4px 0 0 rgba(0,0,0,0.4)',
        overflow: 'hidden',
        opacity: line.status === 'idle' ? 0.65 : 1,
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 14px',
        background: '#0F172A',
        borderBottom: `2px solid ${borderColor}`,
      }}>
        <div>
          <div style={{ fontSize: '9px', color: '#64748B', fontWeight: 'bold', letterSpacing: '1px', fontFamily: "'Press Start 2P', monospace" }}>{line.id}</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#F1F5F9', marginTop: '2px' }}>{line.name}</div>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={() => onEdit(line)}
            style={{
              padding: '5px 10px',
              background: 'transparent',
              color: config.color,
              border: `2px solid ${config.color}`,
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '2px 2px 0 0 rgba(0,0,0,0.2)',
            }}
          >
            ✏️ {line.entryId ? 'แก้ไข' : 'เพิ่ม'}
          </button>
          <div style={{
            padding: '5px 10px',
            background: config.color,
            color: '#000',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'bold',
            fontFamily: "'Press Start 2P', monospace",
          }}>
            {config.label}
          </div>
        </div>
      </div>

      {/* Pixel Worker */}
      <div style={{ background: '#0F172A', height: '70px', position: 'relative' }}>
        <PixelDinosaur status={line.status} />
        <div style={{
          position: 'absolute', top: '4px', right: '4px',
          padding: '2px 6px', background: 'rgba(255,255,255,0.1)',
          borderRadius: '4px', fontSize: '9px', color: '#94A3B8',
          border: '1px solid rgba(255,255,255,0.15)',
          fontFamily: "'Press Start 2P', monospace",
        }}>
          {line.type === 'production' ? '🏭 PROD' : '🔧 FIN'}
        </div>
      </div>

      {/* Info Section */}
      <div style={{ padding: '12px 14px' }}>
        {/* Product Name */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          marginBottom: '10px', padding: '8px 10px',
          background: '#0F172A', border: '1px solid #334155',
        }}>
          <span style={{ fontSize: '10px', color: '#F59E0B', fontWeight: 'bold' }}>ITEM</span>
          <span style={{ fontSize: '13px', color: '#F1F5F9', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {line.product || '-'}
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>
              {line.current.toLocaleString()} / {line.target.toLocaleString()}
            </span>
            <span style={{ fontSize: '14px', color: config.color, fontWeight: 'bold', fontFamily: "'Press Start 2P', monospace" }}>{progress}%</span>
          </div>
          <div style={{ display: 'flex', gap: '2px', height: '12px' }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: i < Math.round(progress / 5) ? config.color : '#334155',
                }}
              />
            ))}
          </div>
        </div>

        {/* Time & Operator */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '11px', color: '#64748B',
          paddingTop: '8px', borderTop: '1px dashed #334155',
        }}>
          <span>⏱ {line.startTime || '--:--'} → {line.endTime || '--:--'}</span>
          <span>👷 {line.operator || '-'}</span>
        </div>

        {/* Production Rate */}
        {line.stdQty && line.stdQty > 0 && (
          <div style={{
            marginTop: '10px', padding: '8px 10px',
            background: '#0F172A', border: '1px solid #334155',
          }}>
            <div style={{
              fontSize: '10px', color: '#64748B', fontWeight: 'bold', marginBottom: '8px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span>📊 อัตราการผลิต</span>
              {line.efficiency && (
                <span style={{
                  padding: '2px 6px',
                  background: `${line.efficiency.color}20`,
                  color: line.efficiency.color,
                  fontSize: '9px', fontWeight: '600',
                  border: `1px solid ${line.efficiency.color}40`,
                }}>
                  {line.efficiency.percentage}%
                </span>
              )}
            </div>

            {/* Column Headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: '55px repeat(3, 1fr)', gap: '4px',
              fontSize: '9px', color: '#64748B', marginBottom: '4px', textAlign: 'center'
            }}>
              <div></div>
              <div>ต่อนาที</div>
              <div>ต่อ10นาที</div>
              <div>ต่อชม.</div>
            </div>

            {/* Std Row */}
            {(() => {
              const stdRate = calculateProductionRate(line.stdQty!)
              return (
                <div style={{
                  display: 'grid', gridTemplateColumns: '55px repeat(3, 1fr)', gap: '4px',
                  fontSize: '11px', textAlign: 'center', padding: '4px 0',
                  borderBottom: '1px dashed #334155',
                }}>
                  <div style={{ fontSize: '9px', color: '#64748B', fontWeight: '600', textAlign: 'left' }}>🎯 Std</div>
                  <div style={{ fontWeight: 'bold', color: '#64748B', fontFamily: 'monospace' }}>{stdRate.perMinute}</div>
                  <div style={{ fontWeight: 'bold', color: '#64748B', fontFamily: 'monospace' }}>{stdRate.per10Minutes}</div>
                  <div style={{ fontWeight: 'bold', color: '#64748B', fontFamily: 'monospace' }}>{stdRate.perHour}</div>
                </div>
              )
            })()}

            {/* Actual Row */}
            {line.actualRate && line.actualRate.totalMinutes > 0 && (
              <div style={{
                display: 'grid', gridTemplateColumns: '55px repeat(3, 1fr)', gap: '4px',
                fontSize: '11px', textAlign: 'center', padding: '4px 0',
              }}>
                <div style={{ fontSize: '9px', color: line.efficiency?.color || '#F1F5F9', fontWeight: '600', textAlign: 'left' }}>⚡ จริง</div>
                <div style={{ fontWeight: 'bold', color: line.efficiency?.color || '#F1F5F9', fontFamily: 'monospace' }}>{line.actualRate.perMinute}</div>
                <div style={{ fontWeight: 'bold', color: line.efficiency?.color || '#F1F5F9', fontFamily: 'monospace' }}>{line.actualRate.per10Minutes}</div>
                <div style={{ fontWeight: 'bold', color: line.efficiency?.color || '#F1F5F9', fontFamily: 'monospace' }}>{line.actualRate.perHour}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const supabase = createClient()
  const [lines, setLines] = useState<DashboardLine[]>([])
  const [time, setTime] = useState<Date | null>(null)

  // Clock (Client-side only)
  useEffect(() => {
    setTime(new Date())
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const formattedTime = time ? time.toTimeString().slice(0, 8) : '--:--:--'

  // Fetch Data
  const fetchData = async () => {
    const { data: prodData } = await supabase
      .from('production_entries')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: finishData } = await supabase
      .from('finishing_entries')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: partsData } = await supabase
      .from('part_numbers')
      .select('id, std_qty')
      .eq('is_active', true)

    const partStdMap = new Map<string, number>()
    partsData?.forEach(part => {
      partStdMap.set(part.id, part.std_qty)
    })

    const buildLine = (
      lineDef: { id: string; name: string },
      type: 'production' | 'finishing',
      entry: WorkEntry | undefined
    ): DashboardLine => {
      if (entry && isToday(entry.created_at)) {
        const stdQty = entry.part_number_id ? (partStdMap.get(entry.part_number_id) || 0) : 0
        const isRunning = entry.status === 'running'
        const actualRate = calculateActualRate(entry.completed_qty, entry.start_time, entry.end_time, isRunning)
        const efficiency = stdQty > 0 ? getEfficiencyStatus(actualRate.perHour, stdQty) : undefined

        return {
          id: lineDef.id, name: lineDef.name, type,
          entryId: entry.id, product: entry.product_name,
          target: entry.target_qty, current: entry.completed_qty,
          status: entry.status,
          startTime: entry.start_time?.slice(0, 5),
          endTime: entry.end_time?.slice(0, 5),
          operator: entry.operator,
          stdQty, actualRate, efficiency,
        }
      }
      return {
        id: lineDef.id, name: lineDef.name, type,
        entryId: null, product: '', target: 0, current: 0,
        status: 'idle', startTime: '', endTime: '', operator: '',
      }
    }

    const mappedLines: DashboardLine[] = []
    PRODUCTION_LINES.forEach(lineDef => {
      const entries = prodData as WorkEntry[] | null
      const entry = entries?.find(d => d.line_id === lineDef.id)
      mappedLines.push(buildLine(lineDef, 'production', entry))
    })
    FINISHING_LINES.forEach(lineDef => {
      const entries = finishData as WorkEntry[] | null
      const entry = entries?.find(d => d.line_id === lineDef.id)
      mappedLines.push(buildLine(lineDef, 'finishing', entry))
    })
    setLines(mappedLines)
  }

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr)
    const today = new Date()
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
  }

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 5000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [modalOpen, setModalOpen] = useState(false)
  const [modalLine, setModalLine] = useState<DashboardLine | null>(null)

  const handleEdit = (line: DashboardLine) => {
    setModalLine(line)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setModalLine(null)
  }

  const handleModalSuccess = () => {
    fetchData()
  }

  const { user, loading: authLoading, canAccessLine } = useAuth()
  const routerNav = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      routerNav.push('/login')
    }
  }, [authLoading, user, routerNav])

  const visibleLines = user ? lines.filter(l => canAccessLine(l.id)) : lines
  const running = visibleLines.filter(l => l.status === 'running').length
  const completed = visibleLines.filter(l => l.status === 'completed').length
  const totalOutput = visibleLines.reduce((s, l) => s + l.current, 0)
  const totalTarget = visibleLines.reduce((s, l) => s + l.target, 0)
  const rate = totalTarget > 0 ? Math.round((totalOutput / totalTarget) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)' }}>
      <Navbar />

      <div className="pixel-container">
        {/* Sub-header: Clock + Live indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '3px solid #1E3A5F',
        }}>
          <div>
            <h2 style={{
              margin: 0, fontSize: '14px', fontWeight: 'bold',
              color: '#F59E0B',
              fontFamily: "'Press Start 2P', monospace",
            }}>
              🖥️ DASHBOARD
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748B' }}>
              ระบบติดตามสายการผลิตแบบ Real-time
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F1F5F9', fontFamily: "'Press Start 2P', monospace" }}>
              {formattedTime}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <span style={{ width: '10px', height: '10px', background: '#EF4444', borderRadius: '50%', animation: 'pulse 1s infinite', display: 'inline-block' }} />
              <span style={{ fontSize: '10px', color: '#EF4444', fontWeight: 'bold', fontFamily: "'Press Start 2P', monospace" }}>LIVE</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="pixel-stats-grid" style={{ marginBottom: '20px' }}>
          {[
            { icon: '▶', label: 'RUNNING', value: running, color: '#F59E0B' },
            { icon: '✓', label: 'COMPLETED', value: completed, color: '#10B981' },
            { icon: '📦', label: 'OUTPUT', value: totalOutput.toLocaleString(), color: '#3B82F6' },
            { icon: '📊', label: 'EFFICIENCY', value: `${rate}%`, color: rate > 80 ? '#10B981' : '#F59E0B' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: '#0F172A',
              border: `3px solid ${stat.color}`,
              boxShadow: '4px 4px 0 0 rgba(0,0,0,0.4)',
              padding: '16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 'bold', marginBottom: '8px', fontFamily: "'Press Start 2P', monospace" }}>
                {stat.icon} {stat.label}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: stat.color, fontFamily: "'Press Start 2P', monospace" }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="pixel-cards-grid">
          {visibleLines.map((line) => (
            <Card key={`${line.type}-${line.id}`} line={line} onEdit={handleEdit} />
          ))}
        </div>
      </div>

      {/* Quick Entry Modal */}
      {modalLine && (
        <QuickEntryModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          lineId={modalLine.id}
          lineType={modalLine.type}
          existingEntryId={modalLine.entryId}
        />
      )}
    </div>
  )
}
