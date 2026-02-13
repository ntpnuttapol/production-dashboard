'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import PixelDinosaur from '@/components/PixelDinosaur'
import QuickEntryModal from '@/components/QuickEntryModal'
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
   PRODUCTION DASHBOARD - Real-time Data
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
  // No changes needed for logic, just removing the comment
  const config = statusConfig[line.status] || statusConfig['idle']
  
  const borderColor = line.status === 'running' 
    ? (line.type === 'production' ? '#F59E0B' : '#8B5CF6')
    : (line.status === 'completed' ? '#10B981' : '#E2E8F0')

  const progress = line.target > 0 ? Math.round((line.current / line.target) * 100) : 0

  return (
    <div 
      style={{
        background: '#fff',
        borderRadius: '12px',
        border: `3px solid ${borderColor}`,
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        opacity: line.status === 'idle' ? 0.7 : 1,
      }}
    >
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '12px 16px',
        background: config.bg,
        borderBottom: `2px solid ${borderColor}`,
      }}>
        <div>
          <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: 'bold', letterSpacing: '1px' }}>{line.id}</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937' }}>{line.name}</div>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={() => onEdit(line)}
            style={{
              padding: '6px 10px',
              background: '#fff',
              color: config.color,
              border: `2px solid ${config.color}`,
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ✏️ {line.entryId ? 'แก้ไข' : 'เพิ่ม'}
          </button>
          <div style={{
            padding: '6px 12px',
            background: config.color,
            color: '#fff',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 'bold',
          }}>
            {config.label}
          </div>
        </div>
      </div>

      {/* Pixel Worker */}
      <div style={{ background: '#0F172A', height: '70px', position: 'relative' }}>
        <PixelDinosaur status={line.status} />
        {/* Type Badge */}
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          padding: '2px 6px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '4px',
          fontSize: '9px',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          {line.type === 'production' ? '🏭 PROD' : '🔧 FINISH'}
        </div>
      </div>

      {/* Info Section */}
      <div style={{ padding: '12px 16px' }}>
        {/* Product Name */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '10px',
          padding: '8px 12px',
          background: '#F8FAFC',
          borderRadius: '6px',
          border: '1px solid #E2E8F0',
        }}>
          <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 'bold' }}>ITEM</span>
          <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {line.product || '-'}
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>
              {line.current.toLocaleString()} / {line.target.toLocaleString()}
            </span>
            <span style={{ fontSize: '14px', color: config.color, fontWeight: 'bold' }}>{progress}%</span>
          </div>
          <div style={{ display: 'flex', gap: '2px', height: '12px' }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: i < Math.round(progress / 5) ? config.color : '#E2E8F0',
                  borderRadius: '2px',
                }}
              />
            ))}
          </div>
        </div>

        {/* Time & Operator */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#64748B',
          paddingTop: '8px',
          borderTop: '1px dashed #E2E8F0',
        }}>
          <span>⏱ {line.startTime || '--:--'} → {line.endTime || '--:--'}</span>
          <span>👷 {line.operator || '-'}</span>
        </div>

        {/* Production Rate - เฉพาะเมื่อมีข้อมูล Std */}
        {line.stdQty && line.stdQty > 0 && (
          <div style={{ 
            marginTop: '10px',
            padding: '8px 12px',
            background: '#F8FAFC',
            borderRadius: '6px',
            border: '1px solid #E2E8F0',
          }}>
            <div style={{ 
              fontSize: '10px', 
              color: '#64748B', 
              fontWeight: 'bold', 
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>📊 อัตราการผลิต</span>
              {line.efficiency && (
                <span style={{
                  padding: '2px 6px',
                  background: line.efficiency.bg,
                  color: line.efficiency.color,
                  borderRadius: '4px',
                  fontSize: '9px',
                  fontWeight: '600'
                }}>
                  {line.efficiency.percentage}%
                </span>
              )}
            </div>

            {/* Column Headers */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '55px repeat(3, 1fr)', 
              gap: '4px',
              fontSize: '9px',
              color: '#94A3B8',
              marginBottom: '4px',
              textAlign: 'center'
            }}>
              <div></div>
              <div>ต่อนาที</div>
              <div>ต่อ10นาที</div>
              <div>ต่อชม.</div>
            </div>

            {/* Std Row */}
            {(() => {
              const stdRate = calculateProductionRate(line.stdQty)
              return (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '55px repeat(3, 1fr)', 
                  gap: '4px',
                  fontSize: '11px',
                  textAlign: 'center',
                  padding: '4px 0',
                  borderBottom: '1px dashed #E2E8F0',
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
                display: 'grid', 
                gridTemplateColumns: '55px repeat(3, 1fr)', 
                gap: '4px',
                fontSize: '11px',
                textAlign: 'center',
                padding: '4px 0',
              }}>
                <div style={{ fontSize: '9px', color: line.efficiency?.color || '#1E293B', fontWeight: '600', textAlign: 'left' }}>⚡ จริง</div>
                <div style={{ fontWeight: 'bold', color: line.efficiency?.color || '#1E293B', fontFamily: 'monospace' }}>{line.actualRate.perMinute}</div>
                <div style={{ fontWeight: 'bold', color: line.efficiency?.color || '#1E293B', fontFamily: 'monospace' }}>{line.actualRate.per10Minutes}</div>
                <div style={{ fontWeight: 'bold', color: line.efficiency?.color || '#1E293B', fontFamily: 'monospace' }}>{line.actualRate.perHour}</div>
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

  // Time formatter to prevent hydration mismatch
  const formattedTime = time ? time.toTimeString().slice(0, 8) : '--:--:--'

  // Fetch Data
  const fetchData = async () => {
    // 1. Get latest entry for each line in Production
    const { data: prodData } = await supabase
      .from('production_entries')
      .select('*')
      .order('created_at', { ascending: false })

    // 2. Get latest entry for each line in Finishing
    const { data: finishData } = await supabase
      .from('finishing_entries')
      .select('*')
      .order('created_at', { ascending: false })

    // 3. Get all part numbers for Std calculation (keyed by id)
    const { data: partsData } = await supabase
      .from('part_numbers')
      .select('id, std_qty')
      .eq('is_active', true)

    // Create lookup map: part_number id → std_qty
    const partStdMap = new Map<string, number>()
    partsData?.forEach(part => {
      partStdMap.set(part.id, part.std_qty)
    })

    // Helper: build DashboardLine from entry
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
          id: lineDef.id,
          name: lineDef.name,
          type,
          entryId: entry.id,
          product: entry.product_name,
          target: entry.target_qty,
          current: entry.completed_qty,
          status: entry.status,
          startTime: entry.start_time?.slice(0, 5),
          endTime: entry.end_time?.slice(0, 5),
          operator: entry.operator,
          stdQty,
          actualRate,
          efficiency,
        }
      }
      return {
        id: lineDef.id,
        name: lineDef.name,
        type,
        entryId: null,
        product: '',
        target: 0,
        current: 0,
        status: 'idle',
        startTime: '',
        endTime: '',
        operator: '',
      }
    }

    // Map fixed lines to their latest status
    const mappedLines: DashboardLine[] = []

    // --- Process Production Lines ---
    PRODUCTION_LINES.forEach(lineDef => {
      const entries = prodData as WorkEntry[] | null
      const entry = entries?.find(d => d.line_id === lineDef.id)
      mappedLines.push(buildLine(lineDef, 'production', entry))
    })

    // --- Process Finishing Lines ---
    FINISHING_LINES.forEach(lineDef => {
      const entries = finishData as WorkEntry[] | null
      const entry = entries?.find(d => d.line_id === lineDef.id)
      mappedLines.push(buildLine(lineDef, 'finishing', entry))
    })

    setLines(mappedLines)
  }

  // Helper: Check if date string is today
  const isToday = (dateStr: string) => {
    const d = new Date(dateStr)
    const today = new Date()
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear()
  }

  // Initial fetch and polling
  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 5000) // Poll every 5 sec
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

  const running = lines.filter(l => l.status === 'running').length
  const completed = lines.filter(l => l.status === 'completed').length
  const totalOutput = lines.reduce((s, l) => s + l.current, 0)
  const totalTarget = lines.reduce((s, l) => s + l.target, 0)
  const rate = totalTarget > 0 ? Math.round((totalOutput / totalTarget) * 100) : 0

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
      padding: '20px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fff',
        padding: '16px 24px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '24px', 
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #F59E0B, #10B981)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: "'Press Start 2P', monospace",
          }}>
            PRODUCTION DASHBOARD
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
            ระบบติดตามสายการผลิตแบบ Real-time
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/production" style={{ padding: '10px 14px', background: 'linear-gradient(90deg, #F59E0B, #10B981)', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}>📝 Produce</Link>
          <Link href="/finishing" style={{ padding: '10px 14px', background: 'linear-gradient(90deg, #8B5CF6, #6366F1)', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}>🔧 Finish</Link>
          <Link href="/planning" style={{ padding: '10px 14px', background: 'linear-gradient(90deg, #0EA5E9, #06B6D4)', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}>📋 Plan</Link>
          <Link href="/parts" style={{ padding: '10px 14px', background: 'linear-gradient(90deg, #22C55E, #16A34A)', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}>📦 Parts</Link>
          <div style={{ textAlign: 'right', marginLeft: '8px' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1E293B', fontFamily: "'Press Start 2P', monospace" }}>
              {formattedTime}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <span style={{ width: '10px', height: '10px', background: '#EF4444', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
              <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 'bold' }}>LIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {[
          { icon: '▶', label: 'RUNNING', value: running, color: '#F59E0B', bg: '#FFFBEB' },
          { icon: '✓', label: 'COMPLETED TODAY', value: completed, color: '#10B981', bg: '#ECFDF5' },
          { icon: '📦', label: 'TOTAL OUTPUT', value: totalOutput.toLocaleString(), color: '#3B82F6', bg: '#EFF6FF' },
          { icon: '📊', label: 'EFFICIENCY', value: `${rate}%`, color: rate > 80 ? '#10B981' : '#F59E0B', bg: rate > 80 ? '#ECFDF5' : '#FFFBEB' },
        ].map((stat, i) => (
          <div key={i} style={{ background: stat.bg, border: `2px solid ${stat.color}`, borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 'bold', marginBottom: '6px' }}>{stat.icon} {stat.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: stat.color, fontFamily: "'Press Start 2P', monospace" }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Cards Grid */ }
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {lines.map((line) => (
          <Card key={`${line.type}-${line.id}`} line={line} onEdit={handleEdit} />
        ))}
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
