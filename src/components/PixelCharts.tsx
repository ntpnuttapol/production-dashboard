'use client'

import { useMemo } from 'react'

// ═══════════════════════════════════════
// PIXEL ART CHARTS - Dashboard Analytics
// ═══════════════════════════════════════

interface LineData {
  id: string
  name: string
  type: 'production' | 'finishing'
  current: number
  target: number
  status: 'running' | 'completed' | 'idle'
}

// ─── Pixel Bar Chart: Output per Line ───
export function PixelBarChart({ lines }: { lines: LineData[] }) {
  const activeLines = lines.filter(l => l.status !== 'idle')
  const maxValue = Math.max(...activeLines.map(l => l.target), 1)

  return (
    <div className="cartoon-card" style={{ padding: '24px' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div className="cartoon-font" style={{ fontSize: '16px', color: 'var(--color-running)' }}>
          📊 OUTPUT / LINE
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', background: 'var(--color-blue)', borderRadius: '40%' }} />
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>ผลิตจริง</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', background: 'var(--color-bg-primary)', border: '2px solid var(--color-border)', borderRadius: '40%' }} />
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>เป้าหมาย</span>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      {activeLines.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: 600 }}>
          NO DATA TODAY
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeLines.map((line) => {
            const targetWidth = (line.target / maxValue) * 100
            const currentWidth = (line.current / maxValue) * 100
            const pct = line.target > 0 ? Math.round((line.current / line.target) * 100) : 0
            const barColor = line.type === 'production' ? 'var(--color-running)' : 'var(--color-purple)'
            const pctColor = pct >= 100 ? 'var(--color-green)' : pct >= 70 ? 'var(--color-blue)' : 'var(--color-red)'

            return (
              <div key={line.id}>
                {/* Line label */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span className="cartoon-font" style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {line.id}
                  </span>
                  <span className="cartoon-font" style={{ fontSize: '14px', color: pctColor }}>
                    {line.current.toLocaleString()} / {line.target.toLocaleString()} ({pct}%)
                  </span>
                </div>
                {/* Cartoon bar */}
                <div style={{ position: 'relative', height: '24px', background: 'var(--color-bg-primary)', border: '2px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Target ghost bar */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, height: '100%',
                    width: `${targetWidth}%`, background: 'var(--color-bg-input)', borderRight: '2px dashed var(--color-border)',
                  }} />
                  {/* Actual bar */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, height: '100%',
                    width: `${Math.min(currentWidth, 100)}%`,
                    background: barColor,
                    transition: 'width 0.5s ease',
                    borderRadius: '10px 0 0 10px'
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Pixel Department Comparison ───
export function PixelDeptChart({ lines }: { lines: LineData[] }) {
  const stats = useMemo(() => {
    const prod = lines.filter(l => l.type === 'production')
    const fin = lines.filter(l => l.type === 'finishing')

    const prodOutput = prod.reduce((s, l) => s + l.current, 0)
    const prodTarget = prod.reduce((s, l) => s + l.target, 0)
    const finOutput = fin.reduce((s, l) => s + l.current, 0)
    const finTarget = fin.reduce((s, l) => s + l.target, 0)
    const prodRate = prodTarget > 0 ? Math.round((prodOutput / prodTarget) * 100) : 0
    const finRate = finTarget > 0 ? Math.round((finOutput / finTarget) * 100) : 0
    const prodRunning = prod.filter(l => l.status === 'running').length
    const finRunning = fin.filter(l => l.status === 'running').length

    return { prodOutput, prodTarget, prodRate, finOutput, finTarget, finRate, prodRunning, finRunning, prodTotal: prod.length, finTotal: fin.length }
  }, [lines])

  return (
    <div className="cartoon-card" style={{ padding: '24px' }}>
      <div className="cartoon-font" style={{ fontSize: '16px', color: 'var(--color-running)', marginBottom: '20px' }}>
        🏭 DEPT COMPARISON
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
        {/* Production */}
        <DeptBlock
          label="PRODUCTION"
          icon="🏭"
          color="var(--color-running)"
          output={stats.prodOutput}
          target={stats.prodTarget}
          rate={stats.prodRate}
          running={stats.prodRunning}
          total={stats.prodTotal}
        />
        {/* Finishing */}
        <DeptBlock
          label="FINISHING"
          icon="🔧"
          color="var(--color-purple)"
          output={stats.finOutput}
          target={stats.finTarget}
          rate={stats.finRate}
          running={stats.finRunning}
          total={stats.finTotal}
        />
      </div>
    </div>
  )
}

function DeptBlock({ label, icon, color, output, target, rate, running, total }: {
  label: string; icon: string; color: string
  output: number; target: number; rate: number
  running: number; total: number
}) {
  return (
    <div style={{ background: 'var(--color-bg-primary)', border: `2px solid ${color}`, borderRadius: '16px', padding: '16px', position: 'relative', overflow: 'hidden' }}>

      <div style={{ position: 'relative' }}>
        <div className="cartoon-font" style={{ fontSize: '12px', color, marginBottom: '12px' }}>
          {icon} {label}
        </div>

        {/* Big rate number */}
        <div className="cartoon-font" style={{ fontSize: '32px', color, lineHeight: 1, marginBottom: '12px' }}>
          {rate}%
        </div>

        {/* Output bar */}
        <div style={{ height: '14px', background: 'var(--color-bg-input)', border: `1px solid var(--color-border)`, borderRadius: '7px', marginBottom: '16px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(rate, 100)}%`,
            background: color,
            transition: 'width 0.5s ease',
            borderRadius: '6px 0 0 6px'
          }} />
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 700 }}>OUTPUT</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-text-primary)' }}>
              {output.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 700 }}>TARGET</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-text-secondary)' }}>
              {target.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 700 }}>ACTIVE</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-green)' }}>
              {running}/{total}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 700 }}>REMAIN</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-red)' }}>
              {Math.max(target - output, 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Pixel Mini Sparkline per Line ───
export function PixelEfficiencyBoard({ lines }: { lines: LineData[] }) {
  const activeLines = lines.filter(l => l.status !== 'idle')

  return (
    <div className="cartoon-card" style={{ padding: '24px' }}>
      <div className="cartoon-font" style={{ fontSize: '16px', color: 'var(--color-running)', marginBottom: '20px' }}>
        ⚡ EFFICIENCY BOARD
      </div>

      {activeLines.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: 600 }}>
          NO ACTIVE LINES
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
          {activeLines.map(line => {
            const pct = line.target > 0 ? Math.round((line.current / line.target) * 100) : 0
            const color = pct >= 100 ? 'var(--color-green)' : pct >= 80 ? 'var(--color-blue)' : pct >= 50 ? 'var(--color-running)' : 'var(--color-red)'
            const typeColor = line.type === 'production' ? 'var(--color-running)' : 'var(--color-purple)'

            // Cartoon progress blocks (10 blocks)
            const filledBlocks = Math.min(Math.round(pct / 10), 10)

            return (
              <div key={line.id} style={{
                background: 'var(--color-bg-primary)',
                border: `2px solid ${color}40`,
                borderRadius: '16px',
                padding: '14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="cartoon-font" style={{ fontSize: '12px', color: typeColor }}>
                    {line.id}
                  </span>
                  <span className="cartoon-font" style={{ fontSize: '16px', color }}>
                    {pct}%
                  </span>
                </div>

                {/* Progress blocks */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: '10px',
                        background: i < filledBlocks ? color : 'var(--color-bg-input)',
                        borderRadius: '4px'
                      }}
                    />
                  ))}
                </div>

                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center', fontWeight: 700 }}>
                  {line.current.toLocaleString()} / {line.target.toLocaleString()}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
