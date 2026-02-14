'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { PixelBarChart, PixelDeptChart, PixelEfficiencyBoard } from '@/components/PixelCharts'
import { useAuth } from '@/lib/auth-context'
import {
  PRODUCTION_LINES,
  FINISHING_LINES,
  calculateActualRate,
  getEfficiencyStatus,
  type WorkEntry,
} from '@/lib/constants'

interface ChartLine {
  id: string
  name: string
  type: 'production' | 'finishing'
  current: number
  target: number
  status: 'running' | 'completed' | 'idle'
}

export default function AnalyticsPage() {
  const supabase = createClient()
  const router = useRouter()
  const { user, loading: authLoading, canAccessLine } = useAuth()
  const [lines, setLines] = useState<ChartLine[]>([])
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    setTime(new Date())
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const formattedTime = time ? time.toTimeString().slice(0, 8) : '--:--:--'
  const formattedDate = time ? time.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr)
    const today = new Date()
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  }

  const fetchData = async () => {
    const { data: prodData } = await supabase.from('production_entries').select('*').order('created_at', { ascending: false })
    const { data: finishData } = await supabase.from('finishing_entries').select('*').order('created_at', { ascending: false })

    const buildLine = (lineDef: { id: string; name: string }, type: 'production' | 'finishing', entry: WorkEntry | undefined): ChartLine => {
      if (entry && isToday(entry.created_at)) {
        return {
          id: lineDef.id, name: lineDef.name, type,
          target: entry.target_qty, current: entry.completed_qty,
          status: entry.status,
        }
      }
      return { id: lineDef.id, name: lineDef.name, type, target: 0, current: 0, status: 'idle' }
    }

    const mapped: ChartLine[] = []
    PRODUCTION_LINES.forEach(l => {
      const entry = (prodData as WorkEntry[] | null)?.find(d => d.line_id === l.id)
      mapped.push(buildLine(l, 'production', entry))
    })
    FINISHING_LINES.forEach(l => {
      const entry = (finishData as WorkEntry[] | null)?.find(d => d.line_id === l.id)
      mapped.push(buildLine(l, 'finishing', entry))
    })
    setLines(mapped)
  }

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 5000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visibleLines = user ? lines.filter(l => canAccessLine(l.id)) : lines

  // Summary stats
  const totalOutput = visibleLines.reduce((s, l) => s + l.current, 0)
  const totalTarget = visibleLines.reduce((s, l) => s + l.target, 0)
  const overallRate = totalTarget > 0 ? Math.round((totalOutput / totalTarget) * 100) : 0
  const activeLines = visibleLines.filter(l => l.status !== 'idle').length
  const completedLines = visibleLines.filter(l => l.status === 'completed').length

  // Top / Bottom performers
  const ranked = [...visibleLines]
    .filter(l => l.status !== 'idle')
    .map(l => ({ ...l, pct: l.target > 0 ? Math.round((l.current / l.target) * 100) : 0 }))
    .sort((a, b) => b.pct - a.pct)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)' }}>
      <Navbar />

      <div className="pixel-container">
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '20px', paddingBottom: '16px', borderBottom: '3px solid #1E3A5F',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#3B82F6', fontFamily: "'Press Start 2P', monospace" }}>
              📊 ANALYTICS
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748B' }}>
              {formattedDate}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F1F5F9', fontFamily: "'Press Start 2P', monospace" }}>
              {formattedTime}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <span style={{ width: '10px', height: '10px', background: '#3B82F6', borderRadius: '50%', animation: 'pulse 1s infinite', display: 'inline-block' }} />
              <span style={{ fontSize: '10px', color: '#3B82F6', fontWeight: 'bold', fontFamily: "'Press Start 2P', monospace" }}>LIVE</span>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="pixel-stats-grid" style={{ marginBottom: '20px' }}>
          {[
            { icon: '📦', label: 'TOTAL OUTPUT', value: totalOutput.toLocaleString(), color: '#3B82F6' },
            { icon: '🎯', label: 'TOTAL TARGET', value: totalTarget.toLocaleString(), color: '#8B5CF6' },
            { icon: '📊', label: 'OVERALL', value: `${overallRate}%`, color: overallRate >= 80 ? '#10B981' : '#F59E0B' },
            { icon: '⚡', label: 'ACTIVE', value: `${activeLines}/${visibleLines.length}`, color: '#06B6D4' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: '#0F172A', border: `3px solid ${stat.color}`,
              boxShadow: '4px 4px 0 0 rgba(0,0,0,0.4)', padding: '16px', textAlign: 'center',
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

        {/* Charts Row 1: Bar + Dept */}
        <div className="pixel-charts-grid">
          <PixelBarChart lines={visibleLines} />
          <PixelDeptChart lines={visibleLines} />
        </div>

        {/* Efficiency Board */}
        <div style={{ marginBottom: '20px' }}>
          <PixelEfficiencyBoard lines={visibleLines} />
        </div>

        {/* Ranking Table */}
        <div style={{
          background: '#1E293B', border: '3px solid #334155',
          boxShadow: '4px 4px 0 0 rgba(0,0,0,0.4)', padding: '20px', marginBottom: '20px',
        }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#F59E0B', fontFamily: "'Press Start 2P', monospace", marginBottom: '16px' }}>
            🏆 LINE RANKING
          </div>

          {ranked.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#475569', fontSize: '10px', fontFamily: "'Press Start 2P', monospace" }}>
              NO DATA TODAY
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {ranked.map((line, idx) => {
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`
                const pctColor = line.pct >= 100 ? '#10B981' : line.pct >= 80 ? '#3B82F6' : line.pct >= 50 ? '#F59E0B' : '#EF4444'
                const typeColor = line.type === 'production' ? '#F59E0B' : '#8B5CF6'

                return (
                  <div key={line.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 14px', background: idx < 3 ? '#0F172A' : 'transparent',
                    border: idx < 3 ? `2px solid ${pctColor}33` : '1px solid #334155',
                  }}>
                    {/* Rank */}
                    <div style={{ width: '36px', textAlign: 'center', fontSize: idx < 3 ? '18px' : '12px', color: '#94A3B8', fontFamily: 'monospace' }}>
                      {medal}
                    </div>

                    {/* Line info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '9px', color: typeColor, fontFamily: "'Press Start 2P', monospace" }}>{line.id}</span>
                        <span style={{ fontSize: '12px', color: '#F1F5F9', fontWeight: '600' }}>{line.name}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ width: '120px' }}>
                      <div style={{ height: '10px', background: '#0F172A', border: '1px solid #334155' }}>
                        <div style={{
                          height: '100%', width: `${Math.min(line.pct, 100)}%`, background: pctColor,
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>

                    {/* Output */}
                    <div style={{ width: '100px', textAlign: 'right', fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>
                      {line.current.toLocaleString()} / {line.target.toLocaleString()}
                    </div>

                    {/* Percentage */}
                    <div style={{ width: '60px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold', color: pctColor, fontFamily: "'Press Start 2P', monospace" }}>
                      {line.pct}%
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
