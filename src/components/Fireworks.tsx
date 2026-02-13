'use client'

import { useEffect, useState } from 'react'

interface FireworksProps {
  trigger: boolean
  onComplete?: () => void
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
}

export default function Fireworks({ trigger, onComplete }: FireworksProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [explosions, setExplosions] = useState<{ x: number; y: number; id: number }[]>([])

  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#FFD700']

  useEffect(() => {
    if (trigger) {
      // Create multiple explosion points
      const newExplosions = [
        { x: 20, y: 30, id: 0 },
        { x: 50, y: 20, id: 1 },
        { x: 80, y: 35, id: 2 },
      ]
      setExplosions(newExplosions)

      // Create particles for each explosion
      const newParticles: Particle[] = []
      newExplosions.forEach((explosion, expIndex) => {
        for (let i = 0; i < 15; i++) {
          const angle = (Math.PI * 2 * i) / 15
          const speed = 2 + Math.random() * 3
          newParticles.push({
            id: expIndex * 15 + i,
            x: explosion.x,
            y: explosion.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 4 + Math.random() * 4,
          })
        }
      })
      setParticles(newParticles)

      // Animate particles
      let frame = 0
      const maxFrames = 30
      const interval = setInterval(() => {
        frame++
        if (frame >= maxFrames) {
          clearInterval(interval)
          setParticles([])
          setExplosions([])
          onComplete?.()
          return
        }

        setParticles(prev => prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy + frame * 0.1, // Add gravity
          vy: p.vy + 0.1, // Gravity effect
          size: p.size * 0.95, // Shrink over time
        })))
      }, 50)

      return () => clearInterval(interval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger])

  if (particles.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Explosion flashes */}
      {explosions.map(exp => (
        <div
          key={`flash-${exp.id}`}
          className="absolute w-8 h-8 rounded-full animate-ping"
          style={{
            left: `${exp.x}%`,
            top: `${exp.y}%`,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute transition-all"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size}px ${particle.color}`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Sparkle text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl animate-bounce">
        🎉
      </div>
    </div>
  )
}
