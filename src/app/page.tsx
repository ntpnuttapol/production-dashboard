'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PixelDinosaur from '@/components/PixelDinosaur'
import DashboardMascot from '@/components/DashboardMascot'
import QuickEntryModal from '@/components/QuickEntryModal'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/lib/auth-context'
import {
  PRODUCTION_STATUS_CONFIG,
  FINISHING_STATUS_CONFIG,
  calculateActualRate,
  calculateProductionRate,
  getEfficiencyStatus,
  type WorkEntry,
} from '@/lib/constants'
import { useLines } from '@/lib/lines-context'

/* ═══════════════════════════════════════
   PRODUCTION DASHBOARD - Pixel Art Style
   ═══════════════════════════════════════ */

interface DashboardLine {
  id: string
  name: string
  type: 'production' | 'finishing'
  entryId: string | null
  product: string
  partNumber: string
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

function Card({ line, onEdit, onQuickAdd }: { line: DashboardLine; onEdit: (line: DashboardLine) => void; onQuickAdd?: (line: DashboardLine, qty: number) => void }) {
  const statusConfig = line.type === 'production' ? PRODUCTION_STATUS_CONFIG : FINISHING_STATUS_CONFIG
  const config = statusConfig[line.status] || statusConfig['idle']

  const borderColor = line.status === 'running'
    ? (line.type === 'production' ? 'var(--color-running)' : 'var(--color-purple)')
    : (line.status === 'completed' ? 'var(--color-completed)' : 'var(--color-border)')

  const progress = line.target > 0 ? Math.round((line.current / line.target) * 100) : 0

  return (
    <div
      className="cartoon-card"
      style={{
        padding: '0',
        borderColor: borderColor,
        overflow: 'hidden',
        opacity: line.status === 'running' ? 1 : 0.65,
        transform: line.status === 'running' ? 'none' : 'scale(0.98)',
        filter: line.status === 'running' ? 'none' : 'grayscale(30%)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        background: line.status === 'running' ? 'var(--color-bg-primary)' : 'var(--color-bg-input)',
        borderBottom: `2px dashed ${borderColor}`,
      }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '700', letterSpacing: '0.5px' }}>{line.id}</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-text-primary)' }}>{line.name}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {line.status === 'running' && onQuickAdd && line.entryId && (
            <div style={{ display: 'flex', gap: '4px', marginRight: '6px' }}>
              <button
                onClick={() => onQuickAdd(line, 1)}
                className="cartoon-btn"
                style={{ padding: '4px 10px', background: 'var(--color-bg-input)', color: config.color, border: `2px solid ${config.color}`, fontSize: '13px', fontWeight: 'bold' }}
              >
                +1
              </button>
              <button
                onClick={() => onQuickAdd(line, 10)}
                className="cartoon-btn"
                style={{ padding: '4px 10px', background: 'var(--color-bg-input)', color: config.color, border: `2px solid ${config.color}`, fontSize: '13px', fontWeight: 'bold' }}
              >
                +10
              </button>
            </div>
          )}
          <button
            onClick={() => onEdit(line)}
            className="cartoon-btn"
            style={{
              padding: '6px 14px',
              background: '#FFFFFF',
              color: config.color,
              border: `2px solid ${config.color}`,
              fontSize: '13px',
            }}
          >
            ✏️ {line.entryId ? 'แก้ไข' : 'เพิ่ม'}
          </button>
          <div className="cartoon-badge" style={{
            background: config.color,
            color: '#FFFFFF',
          }}>
            {config.label}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div style={{ padding: '20px' }}>
        {/* Part Number + Product Name */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '6px',
          marginBottom: '16px', padding: '12px 16px',
          background: 'var(--color-bg-input)', borderRadius: '16px',
        }}>
          {line.partNumber ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: line.type === 'production' ? '#F59E0B' : '#8B5CF6', fontWeight: '800', padding: '2px 8px', background: line.type === 'production' ? '#F59E0B15' : '#8B5CF615', borderRadius: '8px' }}>P/N</span>
                <span style={{ fontSize: '15px', color: 'var(--color-text-primary)', fontWeight: '800', fontFamily: "'Nunito', monospace" }}>
                  {line.partNumber}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '600', paddingLeft: '4px' }}>
                {line.product}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-amber)', fontWeight: '800' }}>ITEM</span>
              <span style={{ fontSize: '15px', color: 'var(--color-text-primary)', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {line.product || '-'}
              </span>
            </div>
          )}
        </div>

        {/* Pixel Dino Animation + Progress Bar */}
        <div style={{ marginBottom: '16px' }}>
          {/* Counter row & ETA */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'baseline' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>
                {line.current.toLocaleString()} / {line.target.toLocaleString()}
              </span>
              {line.status === 'running' && line.target > 0 && line.current < line.target && line.actualRate && line.actualRate.perHour > 0 && (
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 'bold', background: 'var(--color-bg-primary)', padding: '2px 8px', borderRadius: '10px' }}>
                  ⏱️ คาดว่าจะเสร็จ: {(() => {
                    const remaining = line.target - line.current
                    const perMinute = line.actualRate.perHour / 60
                    const minutesLeft = Math.ceil(remaining / perMinute)
                    const now = new Date()
                    now.setMinutes(now.getMinutes() + minutesLeft)
                    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
                  })()}
                </span>
              )}
            </div>
            <span className="cartoon-font" style={{ fontSize: '16px', color: config.color }}>{progress}%</span>
          </div>

          {/* Dino canvas — full card width */}
          <div style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            background: line.status === 'running'
              ? (line.efficiency && line.efficiency.percentage < 90 ? 'rgba(245,158,11,0.1)' : line.type === 'production' ? 'rgba(251,191,36,0.06)' : 'rgba(167,139,250,0.06)')
              : line.status === 'completed' ? 'rgba(52,211,153,0.06)' : 'var(--color-bg-input)',
            border: `2px solid ${line.status === 'running' && line.efficiency && line.efficiency.percentage < 90 ? '#F59E0B' : borderColor}20`,
            marginBottom: '10px',
            transition: 'all 0.3s ease',
          }}>
            {/* Speed Warning Visual Cue */}
            {line.status === 'running' && line.efficiency && line.efficiency.percentage < 90 && (
              <div className="sweat-drop" style={{ position: 'absolute', top: '10px', right: '20px', fontSize: '24px', zIndex: 10 }}>💧</div>
            )}
            <PixelDinosaur status={line.status} />
          </div>

          {/* Progress bar track */}
          <div style={{ background: 'var(--color-border)', height: '14px', borderRadius: '100px', overflow: 'hidden' }}>
            <div
              className="cartoon-progress-bar-overlay"
              style={{
                height: '100%',
                backgroundColor: progress >= 100 ? 'var(--color-completed)' : config.color,
                width: `${Math.min(progress, 100)}%`,
                borderRadius: '100px',
                transition: 'width 0.5s ease, background-color 0.5s ease',
              }}
            />
          </div>
        </div>

        {/* Time & Operator */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '600',
          paddingTop: '12px', borderTop: '2px dashed var(--color-border)',
        }}>
          <span>⏱ {line.startTime || '--:--'} → {line.endTime || '--:--'}</span>
          <span>👷 {line.operator || '-'}</span>
        </div>

        {/* Production Rate */}
        {line.stdQty && line.stdQty > 0 && (
          <div style={{
            marginTop: '16px', padding: '12px 16px',
            background: 'var(--color-bg-input)', borderRadius: '16px',
          }}>
            <div style={{
              fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '800', marginBottom: '12px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span>📊 อัตราการผลิต</span>
              {line.efficiency && (
                <span className="cartoon-badge" style={{
                  background: `${line.efficiency.color}20`,
                  color: line.efficiency.color,
                }}>
                  {line.efficiency.percentage}%
                </span>
              )}
            </div>

            {/* Column Headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: '60px repeat(3, 1fr)', gap: '6px',
              fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '6px', textAlign: 'center', fontWeight: '700'
            }}>
              <div></div>
              <div>/นาที</div>
              <div>/10นาที</div>
              <div>/ชม.</div>
            </div>

            {/* Std Row */}
            {(() => {
              const stdRate = calculateProductionRate(line.stdQty!)
              return (
                <div style={{
                  display: 'grid', gridTemplateColumns: '60px repeat(3, 1fr)', gap: '6px',
                  fontSize: '13px', textAlign: 'center', padding: '6px 0',
                  borderBottom: '2px dashed var(--color-border)',
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: '800', textAlign: 'left' }}>🎯 Std</div>
                  <div style={{ fontWeight: '700', color: 'var(--color-text-secondary)' }}>{stdRate.perMinute}</div>
                  <div style={{ fontWeight: '700', color: 'var(--color-text-secondary)' }}>{stdRate.per10Minutes}</div>
                  <div style={{ fontWeight: '700', color: 'var(--color-text-secondary)' }}>{stdRate.perHour}</div>
                </div>
              )
            })()}

            {/* Actual Row */}
            {line.actualRate && line.actualRate.totalMinutes > 0 && (
              <div style={{
                display: 'grid', gridTemplateColumns: '60px repeat(3, 1fr)', gap: '6px',
                fontSize: '13px', textAlign: 'center', padding: '6px 0', marginTop: '4px'
              }}>
                <div style={{ fontSize: '11px', color: line.efficiency?.color || 'var(--color-text-primary)', fontWeight: '800', textAlign: 'left' }}>⚡ จริง</div>
                <div style={{ fontWeight: '800', color: line.efficiency?.color || 'var(--color-text-primary)' }}>{line.actualRate.perMinute}</div>
                <div style={{ fontWeight: '800', color: line.efficiency?.color || 'var(--color-text-primary)' }}>{line.actualRate.per10Minutes}</div>
                <div style={{ fontWeight: '800', color: line.efficiency?.color || 'var(--color-text-primary)' }}>{line.actualRate.perHour}</div>
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
  const { productionLines, finishingLines } = useLines()
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
      .select('id, part_number, std_qty')
      .eq('is_active', true)

    const partStdMap = new Map<string, number>()
    const partNumberMap = new Map<string, string>()
    partsData?.forEach(part => {
      partStdMap.set(part.id, part.std_qty)
      partNumberMap.set(part.id, part.part_number)
    })

    const buildLine = (
      lineDef: { id: string; name: string },
      type: 'production' | 'finishing',
      entry: WorkEntry | undefined
    ): DashboardLine => {
      if (entry && isToday(entry.created_at)) {
        const stdQty = entry.part_number_id ? (partStdMap.get(entry.part_number_id) || 0) : 0
        const partNum = entry.part_number_id ? (partNumberMap.get(entry.part_number_id) || '') : ''
        const isRunning = entry.status === 'running'
        const actualRate = calculateActualRate(entry.completed_qty, entry.start_time, entry.end_time, isRunning)
        const efficiency = stdQty > 0 ? getEfficiencyStatus(actualRate.perHour, stdQty) : undefined

        return {
          id: lineDef.id, name: lineDef.name, type,
          entryId: entry.id, product: entry.product_name, partNumber: partNum,
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
        entryId: null, product: '', partNumber: '', target: 0, current: 0,
        status: 'idle', startTime: '', endTime: '', operator: '',
      }
    }

    const mappedLines: DashboardLine[] = []
    productionLines.forEach(lineDef => {
      const entries = prodData as WorkEntry[] | null
      const entry = entries?.find(d => d.line_id === lineDef.id)
      mappedLines.push(buildLine(lineDef, 'production', entry))
    })
    finishingLines.forEach(lineDef => {
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
  }, [productionLines, finishingLines])

  const [modalOpen, setModalOpen] = useState(false)
  const [modalLine, setModalLine] = useState<DashboardLine | null>(null)
  const [deptView, setDeptView] = useState<'all' | 'production' | 'finishing'>('all')

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

  const handleQuickAdd = async (line: DashboardLine, qty: number) => {
    if (!line.entryId) return

    const table = line.type === 'production' ? 'production_entries' : 'finishing_entries'
    const newQty = line.current + qty
    const newStatus = line.target > 0 && newQty >= line.target ? 'completed' : 'running'

    // Optimistic UI update
    setLines(prev => prev.map(l =>
      l.entryId === line.entryId ? { ...l, current: newQty, status: newStatus } : l
    ))

    const { error } = await supabase
      .from(table)
      .update({ completed_qty: newQty, status: newStatus })
      .eq('id', line.entryId)

    if (error) {
      console.error('Quick add error:', error)
      fetchData() // revert optimistic update
    } else if (newStatus === 'completed') {
      // Refresh to ensure all logic (endTime, etc.) applies correctly if needed, though simple update is enough here
      fetchData()
    }
  }

  const { user, loading: authLoading, canAccessLine } = useAuth()
  const routerNav = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      routerNav.push('/login')
    }
  }, [authLoading, user, routerNav])

  const visibleLines = (user ? lines.filter(l => canAccessLine(l.id)) : lines)
    .filter(l => deptView === 'all' ? true : l.type === deptView)
  const running = visibleLines.filter(l => l.status === 'running').length
  const completed = visibleLines.filter(l => l.status === 'completed').length
  const totalOutput = visibleLines.reduce((s, l) => s + l.current, 0)
  const totalTarget = visibleLines.reduce((s, l) => s + l.target, 0)
  const rate = totalTarget > 0 ? Math.round((totalOutput / totalTarget) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      <Navbar />

      <div className="cartoon-container">
        {/* Sub-header: Clock + Live indicator */}
        <div className="cartoon-page-title">
          <div>
            <h2 className="cartoon-font" style={{
              margin: 0, fontSize: '20px', color: 'var(--color-amber)', letterSpacing: '1px'
            }}>
              🖥️ DASHBOARD
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              ระบบติดตามสายการผลิตแบบ Real-time
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="cartoon-font" style={{ fontSize: '28px', color: 'var(--color-text-primary)' }}>
              {formattedTime}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <span style={{ width: '12px', height: '12px', background: 'var(--color-red)', borderRadius: '50%', animation: 'pulseSoft 2s infinite', display: 'inline-block' }} />
              <span style={{ fontSize: '13px', color: 'var(--color-red)', fontWeight: '700', letterSpacing: '0.5px' }}>LIVE</span>
            </div>
          </div>
        </div>

        {/* Department Tabs */}
        <div style={{
          display: 'flex', gap: '8px', marginBottom: '24px',
          padding: '6px', background: 'var(--color-bg-card)',
          borderRadius: '20px', border: '2px solid var(--color-border)',
        }}>
          {[
            { key: 'all' as const, label: '📊 ทั้งหมด', color: 'var(--color-amber)' },
            { key: 'production' as const, label: '🏭 เครื่องจักร', color: '#F59E0B' },
            { key: 'finishing' as const, label: '🔧 ไลน์ประกอบ', color: '#8B5CF6' },
          ].map(tab => {
            const isActive = deptView === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setDeptView(tab.key)}
                className="cartoon-btn"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '800',
                  background: isActive ? tab.color : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--color-text-secondary)',
                  border: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
                  boxShadow: isActive ? `0 4px 12px ${tab.color}40` : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Stats Row */}
        <div className="cartoon-stats-grid" style={{ marginBottom: '24px' }}>
          {[
            { icon: '▶', label: 'RUNNING', value: running, color: 'var(--color-running)' },
            { icon: '✓', label: 'COMPLETED', value: completed, color: 'var(--color-completed)' },
            { icon: '📦', label: 'OUTPUT', value: totalOutput.toLocaleString(), color: 'var(--color-blue)' },
            { icon: '📊', label: 'EFFICIENCY', value: `${rate}%`, color: rate > 80 ? 'var(--color-completed)' : 'var(--color-running)' },
          ].map((stat, i) => (
            <div key={i} className="cartoon-card" style={{
              textAlign: 'center',
              padding: '20px',
              borderTopWidth: '8px',
              borderTopColor: stat.color,
            }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '700', marginBottom: '8px' }}>
                {stat.icon} {stat.label}
              </div>
              <div className="cartoon-font" style={{ fontSize: '32px', color: stat.color }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Mascot */}
        <DashboardMascot
          running={running}
          completed={completed}
          rate={rate}
          totalOutput={totalOutput}
          totalLines={visibleLines.length}
        />

        {/* ═══ Production Section ═══ */}
        {(() => {
          const prodLines = visibleLines.filter(l => l.type === 'production')
          const prodRunning = prodLines.filter(l => l.status === 'running').length
          const prodCompleted = prodLines.filter(l => l.status === 'completed').length
          const prodOutput = prodLines.reduce((s, l) => s + l.current, 0)
          return prodLines.length > 0 ? (
            <div style={{ marginBottom: '40px' }}>
              {/* Section Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '20px', padding: '16px 24px',
                background: 'linear-gradient(135deg, #F59E0B10, #F59E0B05)',
                border: '2px solid #F59E0B30',
                borderRadius: '20px',
                borderLeft: '6px solid #F59E0B',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '28px' }}>🏭</span>
                  <div>
                    <h2 className="cartoon-font" style={{ margin: 0, fontSize: '18px', color: '#F59E0B' }}>
                      เครื่องจักร (Production)
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                      สายการผลิตชิ้นงาน
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', fontWeight: '700' }}>
                  <span style={{ color: '#F59E0B' }}>▶ {prodRunning} Running</span>
                  <span style={{ color: '#10B981' }}>✓ {prodCompleted} Done</span>
                  <span style={{ color: 'var(--color-blue)' }}>📦 {prodOutput.toLocaleString()}</span>
                </div>
              </div>
              {/* Production Cards */}
              <div className="cartoon-cards-grid">
                {prodLines.map((line) => (
                  <Card key={`${line.type}-${line.id}`} line={line} onEdit={handleEdit} onQuickAdd={handleQuickAdd} />
                ))}
              </div>
            </div>
          ) : null
        })()}

        {/* ═══ Finishing Section ═══ */}
        {(() => {
          const finLines = visibleLines.filter(l => l.type === 'finishing')
          const finRunning = finLines.filter(l => l.status === 'running').length
          const finCompleted = finLines.filter(l => l.status === 'completed').length
          const finOutput = finLines.reduce((s, l) => s + l.current, 0)
          return finLines.length > 0 ? (
            <div style={{ marginBottom: '40px' }}>
              {/* Section Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '20px', padding: '16px 24px',
                background: 'linear-gradient(135deg, #8B5CF610, #8B5CF605)',
                border: '2px solid #8B5CF630',
                borderRadius: '20px',
                borderLeft: '6px solid #8B5CF6',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '28px' }}>🔧</span>
                  <div>
                    <h2 className="cartoon-font" style={{ margin: 0, fontSize: '18px', color: '#8B5CF6' }}>
                      ไลน์ประกอบ (Finishing)
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                      สายการประกอบชิ้นงาน
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', fontWeight: '700' }}>
                  <span style={{ color: '#8B5CF6' }}>▶ {finRunning} Running</span>
                  <span style={{ color: '#10B981' }}>✓ {finCompleted} Done</span>
                  <span style={{ color: 'var(--color-blue)' }}>📦 {finOutput.toLocaleString()}</span>
                </div>
              </div>
              {/* Finishing Cards */}
              <div className="cartoon-cards-grid">
                {finLines.map((line) => (
                  <Card key={`${line.type}-${line.id}`} line={line} onEdit={handleEdit} onQuickAdd={handleQuickAdd} />
                ))}
              </div>
            </div>
          ) : null
        })()}
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
