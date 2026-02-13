'use client'

import { useEffect, useRef } from 'react'

/* ═══════════════════════════════════════════
   PIXEL ART WORKER - Canvas Animation
   ═══════════════════════════════════════════ */

const PX = 3

const PALETTE = {
  running: { 1: "#FBBF24", 2: "#F59E0B", 3: "#3B82F6", 4: "#1E3A5F", 5: "#4B5563", 6: "#9CA3AF", 7: "#D97706" },
  completed: { 1: "#FBBF24", 2: "#10B981", 3: "#34D399", 4: "#1E3A5F", 5: "#4B5563", 6: "#F59E0B", 7: "#059669" },
  idle: { 1: "#9CA3AF", 2: "#6B7280", 3: "#6B7280", 4: "#4B5563", 5: "#374151", 6: "#6B7280", 7: "#4B5563" },
}

// Walking frames
const W1 = [
  [0,0,0,0,0,2,2,2,2,2,0,0,0,0,0,0],
  [0,0,0,0,2,7,7,7,7,7,2,0,0,0,0,0],
  [0,0,0,0,2,2,2,2,2,2,2,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
  [0,0,0,6,3,3,3,3,3,3,3,0,0,0,0,0],
  [0,0,0,6,0,3,3,3,3,3,0,3,0,0,0,0],
  [0,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0],
  [0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0],
  [0,0,0,0,0,4,4,4,4,4,0,0,0,0,0,0],
  [0,0,0,0,0,4,4,0,4,4,0,0,0,0,0,0],
  [0,0,0,0,0,4,4,0,4,4,0,0,0,0,0,0],
  [0,0,0,0,0,4,0,0,0,4,0,0,0,0,0,0],
  [0,0,0,0,5,5,0,0,0,0,5,5,0,0,0,0],
]
const W2 = [
  [0,0,0,0,0,2,2,2,2,2,0,0,0,0,0,0],
  [0,0,0,0,2,7,7,7,7,7,2,0,0,0,0,0],
  [0,0,0,0,2,2,2,2,2,2,2,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
  [0,0,0,0,3,3,3,3,3,3,6,6,0,0,0,0],
  [0,0,0,3,0,3,3,3,3,3,0,6,0,0,0,0],
  [0,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0],
  [0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0],
  [0,0,0,0,0,4,4,4,4,4,0,0,0,0,0,0],
  [0,0,0,0,4,4,0,0,0,4,4,0,0,0,0,0],
  [0,0,0,0,4,0,0,0,0,0,4,0,0,0,0,0],
  [0,0,0,5,5,0,0,0,0,0,0,5,5,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
]
const W3 = [
  [0,0,0,0,0,2,2,2,2,2,0,0,0,0,0,0],
  [0,0,0,0,2,7,7,7,7,7,2,0,0,0,0,0],
  [0,0,0,0,2,2,2,2,2,2,2,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
  [0,0,0,0,3,3,3,3,3,3,3,6,0,0,0,0],
  [0,0,0,0,0,3,3,3,3,3,6,0,0,0,0,0],
  [0,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0],
  [0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0],
  [0,0,0,0,0,4,4,4,4,4,0,0,0,0,0,0],
  [0,0,0,0,0,4,4,0,4,4,0,0,0,0,0,0],
  [0,0,0,0,0,0,4,0,4,0,0,0,0,0,0,0],
  [0,0,0,0,0,5,5,0,5,5,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
]

// Jump frames
const J1 = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,2,2,2,2,2,0,0,0,0,0,0],
  [0,0,0,0,2,7,7,7,7,7,2,0,0,0,0,0],
  [0,0,0,0,2,2,2,2,2,2,2,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
  [0,0,6,3,3,3,3,3,3,3,3,3,6,0,0,0],
  [0,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0],
  [0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0],
  [0,0,0,0,0,4,4,4,4,4,0,0,0,0,0,0],
  [0,0,0,0,0,4,4,0,4,4,0,0,0,0,0,0],
  [0,0,0,0,0,5,5,0,5,5,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
]
const J2 = [
  [0,0,0,0,0,2,2,2,2,2,0,0,0,0,0,0],
  [0,0,0,0,2,7,7,7,7,7,2,0,0,0,0,0],
  [0,0,0,0,2,2,2,2,2,2,2,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
  [0,0,6,3,3,3,3,3,3,3,3,3,6,0,0,0],
  [0,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0],
  [0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0],
  [0,0,0,0,0,4,4,4,4,4,0,0,0,0,0,0],
  [0,0,0,0,0,4,0,0,0,4,0,0,0,0,0,0],
  [0,0,0,0,4,4,0,0,0,4,4,0,0,0,0,0],
  [0,0,0,0,5,0,0,0,0,0,5,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
]

// Idle frame
const IDLE_F = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,2,2,2,2,2,0,0,0,0,0,0],
  [0,0,0,0,2,7,7,7,7,7,2,0,0,0,0,0],
  [0,0,0,0,2,2,2,2,2,2,2,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
  [0,0,0,0,3,3,3,3,3,3,3,0,0,0,0,0],
  [0,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0],
  [0,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0],
  [0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0],
  [0,0,0,0,0,4,4,4,4,4,0,0,0,0,0,0],
  [0,0,0,0,0,4,4,0,4,4,0,0,0,0,0,0],
  [0,0,0,0,0,4,4,0,4,4,0,0,0,0,0,0],
  [0,0,0,0,0,5,5,0,5,5,0,0,0,0,0,0],
]

const WALK = [W1, W2, W3, W2]
const JUMP = [J1, J2]

function flip(f: number[][]): number[][] {
  return f.map(r => [...r].reverse())
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
  size: number
}

interface Firework {
  x: number
  y: number
  particles: Particle[]
}

function spawnFW(x: number, y: number): Firework {
  const cols = ["#F59E0B","#10B981","#EF4444","#3B82F6","#EC4899","#8B5CF6","#F97316","#FDE68A","#FFFFFF"]
  const ps: Particle[] = []
  for (let i = 0; i < 28; i++) {
    const a = (Math.PI * 2 * i) / 28 + (Math.random() - 0.5) * 0.5
    const sp = 1.2 + Math.random() * 3
    ps.push({ 
      x: 0, 
      y: 0, 
      vx: Math.cos(a) * sp, 
      vy: Math.sin(a) * sp - 1, 
      color: cols[Math.floor(Math.random() * cols.length)], 
      life: 1, 
      size: 1 + Math.floor(Math.random() * 2) 
    })
  }
  return { x, y, particles: ps }
}

interface PixelWorkerProps {
  status: 'running' | 'completed' | 'idle'
}

export default function PixelWorker({ status }: PixelWorkerProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sRef = useRef({ 
    frame: 0, 
    tick: 0, 
    posX: 10, 
    dir: 1, 
    jumpPhase: 0, 
    fireworks: [] as Firework[], 
    cW: 400, 
    cH: 80 
  })

  // Resize canvas to fill container
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const w = Math.floor(e.contentRect.width)
        const h = 80
        sRef.current.cW = w
        sRef.current.cH = h
        if (canvasRef.current) {
          canvasRef.current.width = w
          canvasRef.current.height = h
        }
      }
    })
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    const pal = PALETTE[status] || PALETTE.idle
    const s = sRef.current
    let animId: number
    const sprW = 16 * PX
    const sprH = 16 * PX

    const draw = (frame: number[][], ox: number, oy: number) => {
      frame.forEach((row, y) => row.forEach((c, x) => {
        if (!c) return
        ctx.fillStyle = pal[c as keyof typeof pal] || "#FFF"
        ctx.fillRect(ox + x * PX, oy + y * PX, PX, PX)
      }))
    }

    const drawFW = () => {
      s.fireworks.forEach(fw => fw.particles.forEach(p => {
        if (p.life <= 0) return
        ctx.globalAlpha = p.life
        ctx.fillStyle = p.color
        ctx.fillRect(Math.round(fw.x + p.x), Math.round(fw.y + p.y), p.size * PX, p.size * PX)
      }))
      ctx.globalAlpha = 1
    }
    
    const updateFW = () => {
      s.fireworks.forEach(fw => fw.particles.forEach(p => { 
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.055
        p.life -= 0.014 
      }))
      s.fireworks = s.fireworks.filter(fw => fw.particles.some(p => p.life > 0))
    }

    const drawGround = () => {
      const w = s.cW
      ctx.fillStyle = "rgba(255,255,255,0.05)"
      ctx.fillRect(0, s.cH - 2, w, 2)
      for (let gx = 0; gx < w; gx += 6) {
        ctx.fillStyle = "rgba(255,255,255,0.07)"
        ctx.fillRect(gx, s.cH - 3, 2, 1)
      }
    }

    const drawDust = (x: number, y: number) => {
      ctx.globalAlpha = 0.35
      ctx.fillStyle = "#6B7280"
      for (let i = 0; i < 4; i++) {
        const dx = (s.dir === 1 ? -1 : 1) * (3 + Math.random() * 12)
        const dy = -Math.random() * 5
        ctx.fillRect(x + sprW / 2 + dx, y + sprH + dy - 2, PX, PX)
      }
      ctx.globalAlpha = 1
    }

    const animate = () => {
      const w = s.cW
      const h = s.cH
      ctx.clearRect(0, 0, w, h)
      s.tick++
      drawGround()

      const groundY = h - sprH - 4
      const leftB = 4
      const rightB = w - sprW - 4

      if (status === "running") {
        if (s.tick % 7 === 0) s.frame = (s.frame + 1) % WALK.length
        s.posX += s.dir * 1.0
        if (s.posX >= rightB) { s.posX = rightB; s.dir = -1 }
        if (s.posX <= leftB) { s.posX = leftB; s.dir = 1 }

        let fr = WALK[s.frame]
        if (s.dir === -1) fr = flip(fr)
        const bob = Math.sin(s.tick * 0.18) * 1.5
        draw(fr, Math.round(s.posX), groundY + bob)
        if (s.tick % 5 === 0) drawDust(Math.round(s.posX), groundY + bob)

        // Sweat drops
        if (s.tick % 55 < 7) {
          ctx.fillStyle = "#60A5FA"
          const sx = s.dir === 1 ? Math.round(s.posX) + sprW + 2 : Math.round(s.posX) - 5
          ctx.fillRect(sx, groundY + 8 + (s.tick % 55) * 2, PX, PX)
        }

        // Footstep marks on ground
        if (s.tick % 14 === 0) {
          ctx.fillStyle = "rgba(255,255,255,0.03)"
          ctx.fillRect(Math.round(s.posX) + 12, h - 4, 6, 2)
        }

      } else if (status === "completed") {
        if (s.tick % 5 === 0) s.jumpPhase = (s.jumpPhase + 1) % 30
        s.posX += s.dir * 0.7
        if (s.posX >= rightB) { s.posX = rightB; s.dir = -1 }
        if (s.posX <= leftB) { s.posX = leftB; s.dir = 1 }

        const ph = s.jumpPhase
        const jmpY = ph < 15 ? -Math.sin((ph / 15) * Math.PI) * 20 : 0
        const jF = ph < 15 ? JUMP[ph < 8 ? 0 : 1] : JUMP[1]
        let fr = s.dir === -1 ? flip(jF) : jF
        draw(fr, Math.round(s.posX), groundY + jmpY)

        // Shadow on ground when jumping
        if (jmpY < -2) {
          ctx.globalAlpha = 0.15
          ctx.fillStyle = "#10B981"
          const sw = sprW * (1 + jmpY / 80)
          ctx.fillRect(Math.round(s.posX) + (sprW - sw) / 2, h - 5, sw, 3)
          ctx.globalAlpha = 1
        }

        // Fireworks across full width
        if (s.tick % 30 === 0) {
          s.fireworks.push(spawnFW(15 + Math.random() * (w - 30), 5 + Math.random() * 30))
        }
        updateFW()
        drawFW()

        // Confetti raining
        const confettiColors = ["#FDE68A","#34D399","#F87171","#60A5FA","#C084FC","#FB923C"]
        for (let i = 0; i < 8; i++) {
          const cx = ((s.tick * (1.5 + i * 0.7) + i * 73) % (w + 20)) - 10
          const cy = ((s.tick * (0.8 + i * 0.3) + i * 41) % (h + 10)) - 5
          ctx.globalAlpha = 0.6
          ctx.fillStyle = confettiColors[i % confettiColors.length]
          ctx.fillRect(cx, cy, PX, PX)
        }
        ctx.globalAlpha = 1

        // "DONE!" floating text
        if (ph < 15) {
          ctx.globalAlpha = 0.9
          ctx.fillStyle = "#10B981"
          ctx.font = "bold 9px 'Press Start 2P', monospace"
          ctx.fillText("✓ DONE!", Math.round(s.posX) - 6, groundY - 10 + jmpY)
          ctx.globalAlpha = 1
        }

      } else {
        // Idle
        const br = Math.sin(s.tick * 0.04) * 0.8
        draw(IDLE_F, w / 2 - sprW / 2, groundY + br)
        const za = Math.sin(s.tick * 0.05) * 0.5 + 0.5
        ctx.globalAlpha = za
        ctx.fillStyle = "#6B7280"
        ctx.font = "8px 'Press Start 2P', monospace"
        const zf = Math.sin(s.tick * 0.03) * 3
        ctx.fillText("z", w / 2 + 24 + zf, groundY - 2)
        ctx.fillText("z", w / 2 + 32 + zf, groundY - 10)
        ctx.fillText("Z", w / 2 + 40 + zf, groundY - 18)
        ctx.globalAlpha = 1
      }

      animId = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animId)
  }, [status])

  return (
    <div ref={wrapRef} style={{ width: "100%", height: 80, position: "relative" }}>
      <canvas
        ref={canvasRef}
        width={400}
        height={80}
        style={{
          width: "100%", 
          height: 80,
          imageRendering: "pixelated",
          display: "block",
        }}
      />
    </div>
  )
}
