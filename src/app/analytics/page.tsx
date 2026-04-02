'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { PixelBarChart, PixelDeptChart, PixelEfficiencyBoard } from '@/components/PixelCharts'
import { useAuth } from '@/lib/auth-context'
import {
  calculateActualRate,
  getEfficiencyStatus,
  type WorkEntry,
} from '@/lib/constants'
import { useLines } from '@/lib/lines-context'

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
  const { user, loading: authLoading, canAccessLine, canAccessPage } = useAuth()
  const { productionLines, finishingLines } = useLines()
  const [lines, setLines] = useState<ChartLine[]>([])
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/login')
      return
    }

    if (!canAccessPage('analytics')) {
      router.push('/')
    }
  }, [authLoading, canAccessPage, router, user])

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
    productionLines.forEach(l => {
      const entry = (prodData as WorkEntry[] | null)?.find(d => d.line_id === l.id)
      mapped.push(buildLine(l, 'production', entry))
    })
    finishingLines.forEach(l => {
      const entry = (finishData as WorkEntry[] | null)?.find(d => d.line_id === l.id)
      mapped.push(buildLine(l, 'finishing', entry))
    })
    setLines(mapped)
  }

  useEffect(() => {
    if (authLoading || !user || !canAccessPage('analytics')) return

    fetchData()
    const t = setInterval(fetchData, 5000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, canAccessPage, productionLines, finishingLines, user])

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

  if (authLoading || !user || !canAccessPage('analytics')) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
        <Navbar />
        <div className="cartoon-container">
          <div className="cartoon-card" style={{ padding: '32px', textAlign: 'center' }}>
            <div className="cartoon-font" style={{ fontSize: '18px', color: 'var(--color-blue)', marginBottom: '8px' }}>
              ⏳ กำลังตรวจสอบสิทธิ์
            </div>
            <div style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              กรุณารอสักครู่...
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      <Navbar />

      <div className="cartoon-container">
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px dashed var(--color-border)',
        }}>
          <div>
            <h2 className="cartoon-font" style={{ margin: 0, fontSize: '20px', color: 'var(--color-blue)' }}>
              📊 ANALYTICS
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              {formattedDate}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="cartoon-font" style={{ fontSize: '28px', color: 'var(--color-text-primary)' }}>
              {formattedTime}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <span style={{ width: '12px', height: '12px', background: 'var(--color-blue)', borderRadius: '50%', animation: 'pulse 1.5s infinite', display: 'inline-block', boxShadow: '0 0 8px var(--color-blue)' }} />
              <span style={{ fontSize: '12px', color: 'var(--color-blue)', fontWeight: 'bold', fontFamily: "'Nunito', sans-serif" }}>LIVE</span>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="cartoon-stats-grid" style={{ marginBottom: '24px' }}>
          {[
            { icon: '📦', label: 'TOTAL OUTPUT', value: totalOutput.toLocaleString(), color: 'var(--color-blue)' },
            { icon: '🎯', label: 'TOTAL TARGET', value: totalTarget.toLocaleString(), color: 'var(--color-purple)' },
            { icon: '📊', label: 'OVERALL', value: `${overallRate}%`, color: overallRate >= 80 ? 'var(--color-green)' : 'var(--color-running)' },
            { icon: '⚡', label: 'ACTIVE', value: `${activeLines}/${visibleLines.length}`, color: 'var(--color-cyan)' },
          ].map((stat, i) => (
            <div key={i} className="cartoon-card" style={{
              border: `2px solid ${stat.color}40`,
              padding: '20px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold', marginBottom: '12px', fontFamily: "'Nunito', sans-serif" }}>
                {stat.icon} {stat.label}
              </div>
              <div className="cartoon-font" style={{ fontSize: '28px', color: stat.color }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row 1: Bar + Dept */}
        <div className="cartoon-charts-grid">
          <PixelBarChart lines={visibleLines} />
          <PixelDeptChart lines={visibleLines} />
        </div>

        {/* Efficiency Board */}
        <div style={{ marginBottom: '24px' }}>
          <PixelEfficiencyBoard lines={visibleLines} />
        </div>

        {/* Ranking Table */}
        <div className="cartoon-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div className="cartoon-font" style={{ fontSize: '16px', color: 'var(--color-running)', marginBottom: '20px' }}>
            🏆 LINE RANKING
          </div>

          {ranked.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: 600 }}>
              NO DATA TODAY
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ranked.map((line, idx) => {
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`
                const pctColor = line.pct >= 100 ? 'var(--color-green)' : line.pct >= 80 ? 'var(--color-blue)' : line.pct >= 50 ? 'var(--color-running)' : 'var(--color-red)'
                const typeColor = line.type === 'production' ? 'var(--color-running)' : 'var(--color-purple)'

                return (
                  <div key={line.id} style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '12px 16px', background: idx < 3 ? 'var(--color-bg-primary)' : 'transparent',
                    border: idx < 3 ? `2px solid ${pctColor}33` : '1px solid var(--color-border)',
                    borderRadius: '16px'
                  }}>
                    {/* Rank */}
                    <div style={{ width: '40px', textAlign: 'center', fontSize: idx < 3 ? '24px' : '15px', color: 'var(--color-text-secondary)', fontWeight: 800 }}>
                      {medal}
                    </div>

                    {/* Line info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="cartoon-badge" style={{ background: typeColor + '20', color: typeColor, fontSize: '11px' }}>{line.id}</span>
                        <span style={{ fontSize: '15px', color: 'var(--color-text-primary)', fontWeight: '700' }}>{line.name}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ width: '140px', display: 'flex', alignItems: 'center' }}>
                      <div style={{ height: '12px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '6px', width: '100%', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${Math.min(line.pct, 100)}%`, background: pctColor,
                          transition: 'width 0.5s ease', borderRadius: '5px'
                        }} />
                      </div>
                    </div>

                    {/* Output */}
                    <div style={{ width: '110px', textAlign: 'right', fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                      {line.current.toLocaleString()} / {line.target.toLocaleString()}
                    </div>

                    {/* Percentage */}
                    <div className="cartoon-font" style={{ width: '70px', textAlign: 'right', fontSize: '18px', color: pctColor }}>
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
