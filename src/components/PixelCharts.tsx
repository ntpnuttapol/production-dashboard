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
    <div style={{
      background: '#1E293B',
      border: '3px solid #334155',
      boxShadow: '4px 4px 0 0 rgba(0,0,0,0.4)',
      padding: '20px',
    }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#F59E0B', fontFamily: "'Press Start 2P', monospace" }}>
          📊 OUTPUT / LINE
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', background: '#3B82F6' }} />
            <span style={{ fontSize: '10px', color: '#94A3B8' }}>ผลิตจริง</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', background: '#334155', border: '1px solid #475569' }} />
            <span style={{ fontSize: '10px', color: '#94A3B8' }}>เป้าหมาย</span>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      {activeLines.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569', fontSize: '10px', fontFamily: "'Press Start 2P', monospace" }}>
          NO DATA TODAY
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activeLines.map((line) => {
            const targetWidth = (line.target / maxValue) * 100
            const currentWidth = (line.current / maxValue) * 100
            const pct = line.target > 0 ? Math.round((line.current / line.target) * 100) : 0
            const barColor = line.type === 'production' ? '#F59E0B' : '#8B5CF6'
            const pctColor = pct >= 100 ? '#10B981' : pct >= 70 ? '#3B82F6' : '#EF4444'

            return (
              <div key={line.id}>
                {/* Line label */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '9px', color: '#94A3B8', fontFamily: "'Press Start 2P', monospace", letterSpacing: '-0.5px' }}>
                    {line.id}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: pctColor, fontFamily: 'monospace' }}>
                    {line.current.toLocaleString()} / {line.target.toLocaleString()} ({pct}%)
                  </span>
                </div>
                {/* Pixel bar */}
                <div style={{ position: 'relative', height: '18px', background: '#0F172A', border: '2px solid #334155' }}>
                  {/* Target ghost bar */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, height: '100%',
                    width: `${targetWidth}%`, background: '#1E293B', borderRight: '2px dashed #475569',
                  }} />
                  {/* Actual bar - pixel blocks */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, height: '100%',
                    width: `${Math.min(currentWidth, 100)}%`,
                    background: `repeating-linear-gradient(90deg, ${barColor} 0px, ${barColor} 6px, ${barColor}CC 6px, ${barColor}CC 8px)`,
                    transition: 'width 0.5s ease',
                    imageRendering: 'pixelated',
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
    <div style={{
      background: '#1E293B',
      border: '3px solid #334155',
      boxShadow: '4px 4px 0 0 rgba(0,0,0,0.4)',
      padding: '20px',
    }}>
      <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#F59E0B', fontFamily: "'Press Start 2P', monospace", marginBottom: '16px' }}>
        🏭 DEPT COMPARISON
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Production */}
        <DeptBlock
          label="PRODUCTION"
          icon="🏭"
          color="#F59E0B"
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
          color="#8B5CF6"
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
    <div style={{ background: '#0F172A', border: `2px solid ${color}`, padding: '14px', position: 'relative', overflow: 'hidden' }}>
      {/* Pixel grid background */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
        backgroundSize: '8px 8px',
      }} />

      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: '9px', fontWeight: 'bold', color, fontFamily: "'Press Start 2P', monospace", marginBottom: '10px' }}>
          {icon} {label}
        </div>

        {/* Big rate number */}
        <div style={{ fontSize: '28px', fontWeight: 'bold', color, fontFamily: "'Press Start 2P', monospace", lineHeight: 1, marginBottom: '8px' }}>
          {rate}%
        </div>

        {/* Output bar */}
        <div style={{ height: '10px', background: '#1E293B', border: `1px solid ${color}44`, marginBottom: '10px' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(rate, 100)}%`,
            background: `repeating-linear-gradient(90deg, ${color} 0px, ${color} 4px, ${color}88 4px, ${color}88 6px)`,
            transition: 'width 0.5s ease',
          }} />
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <div>
            <div style={{ fontSize: '9px', color: '#64748B' }}>OUTPUT</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#F1F5F9', fontFamily: 'monospace' }}>
              {output.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '9px', color: '#64748B' }}>TARGET</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#94A3B8', fontFamily: 'monospace' }}>
              {target.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '9px', color: '#64748B' }}>ACTIVE</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#10B981', fontFamily: 'monospace' }}>
              {running}/{total}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '9px', color: '#64748B' }}>REMAIN</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#EF4444', fontFamily: 'monospace' }}>
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
    <div style={{
      background: '#1E293B',
      border: '3px solid #334155',
      boxShadow: '4px 4px 0 0 rgba(0,0,0,0.4)',
      padding: '20px',
    }}>
      <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#F59E0B', fontFamily: "'Press Start 2P', monospace", marginBottom: '16px' }}>
        ⚡ EFFICIENCY BOARD
      </div>

      {activeLines.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#475569', fontSize: '10px', fontFamily: "'Press Start 2P', monospace" }}>
          NO ACTIVE LINES
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
          {activeLines.map(line => {
            const pct = line.target > 0 ? Math.round((line.current / line.target) * 100) : 0
            const color = pct >= 100 ? '#10B981' : pct >= 80 ? '#3B82F6' : pct >= 50 ? '#F59E0B' : '#EF4444'
            const typeColor = line.type === 'production' ? '#F59E0B' : '#8B5CF6'

            // Pixel art progress blocks (10 blocks)
            const filledBlocks = Math.min(Math.round(pct / 10), 10)

            return (
              <div key={line.id} style={{
                background: '#0F172A',
                border: `2px solid ${color}44`,
                padding: '10px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '8px', color: typeColor, fontFamily: "'Press Start 2P', monospace" }}>
                    {line.id}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color, fontFamily: "'Press Start 2P', monospace" }}>
                    {pct}%
                  </span>
                </div>

                {/* Pixel blocks */}
                <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: '8px',
                        background: i < filledBlocks ? color : '#1E293B',
                        border: `1px solid ${i < filledBlocks ? color : '#334155'}`,
                      }}
                    />
                  ))}
                </div>

                <div style={{ fontSize: '10px', color: '#64748B', textAlign: 'center' }}>
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
