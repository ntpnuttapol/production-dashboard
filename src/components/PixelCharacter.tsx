'use client'

import { useEffect, useState } from 'react'

interface PixelCharacterProps {
  status: 'working' | 'completed' | 'not-working' | 'inactive'
}

export default function PixelCharacter({ status }: PixelCharacterProps) {
  const [frame, setFrame] = useState(0)
  const [position, setPosition] = useState(0)
  const [isJumping, setIsJumping] = useState(false)

  // Walking animation frames
  useEffect(() => {
    if (status === 'working') {
      const interval = setInterval(() => {
        setFrame(prev => (prev + 1) % 4)
        setPosition(prev => (prev + 3) % 400)
      }, 150)
      return () => clearInterval(interval)
    }
  }, [status])

  // Jumping animation for completed
  useEffect(() => {
    if (status === 'completed') {
      const jumpInterval = setInterval(() => {
        setIsJumping(prev => !prev)
      }, 500)
      return () => clearInterval(jumpInterval)
    }
  }, [status])

  const getColor = () => {
    switch (status) {
      case 'working': return { hat: '#fbbf24', shirt: '#22d3ee' }
      case 'completed': return { hat: '#22c55e', shirt: '#86efac' }
      case 'not-working': return { hat: '#ef4444', shirt: '#fca5a5' }
      default: return { hat: '#6b7280', shirt: '#9ca3af' }
    }
  }

  const colors = getColor()

  // Walking sprite frames (legs positions)
  const legFrames = [
    // Frame 0: Standing
    { leftLeg: { x: 2, y: 12 }, rightLeg: { x: 7, y: 12 } },
    // Frame 1: Left leg forward
    { leftLeg: { x: 0, y: 12 }, rightLeg: { x: 7, y: 13 } },
    // Frame 2: Standing
    { leftLeg: { x: 2, y: 12 }, rightLeg: { x: 7, y: 12 } },
    // Frame 3: Right leg forward
    { leftLeg: { x: 2, y: 13 }, rightLeg: { x: 9, y: 12 } },
  ]

  const currentLeg = status === 'working' ? legFrames[frame] : legFrames[0]
  const jumpOffset = (status === 'completed' && isJumping) ? -15 : 0

  return (
    <div 
      className="absolute bottom-4 transition-all duration-150"
      style={{
        left: status === 'working' ? `${position}px` : '50%',
        transform: `translateX(${status === 'working' ? '0' : '-50%'}) translateY(${jumpOffset}px)`,
      }}
    >
      <svg 
        width="48" 
        height="64" 
        viewBox="0 0 12 16" 
        className="pixelated"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Hard Hat */}
        <rect x="2" y="0" width="8" height="1" fill={colors.hat} />
        <rect x="1" y="1" width="10" height="2" fill={colors.hat} />
        
        {/* Face */}
        <rect x="2" y="3" width="8" height="4" fill="#fcd34d" />
        
        {/* Eyes - Blink when completed */}
        {status === 'completed' && isJumping ? (
          <>
            <rect x="3" y="5" width="2" height="1" fill="#1f2937" />
            <rect x="7" y="5" width="2" height="1" fill="#1f2937" />
          </>
        ) : (
          <>
            <rect x="3" y="4" width="2" height="2" fill="#1f2937" />
            <rect x="7" y="4" width="2" height="2" fill="#1f2937" />
            <rect x="3" y="4" width="1" height="1" fill="#ffffff" />
            <rect x="7" y="4" width="1" height="1" fill="#ffffff" />
          </>
        )}
        
        {/* Smile when completed */}
        {status === 'completed' && (
          <rect x="4" y="6" width="4" height="1" fill="#92400e" />
        )}
        
        {/* Body */}
        <rect x="2" y="7" width="8" height="5" fill={colors.shirt} />
        
        {/* Arms - Wave when completed */}
        {status === 'completed' && isJumping ? (
          <>
            <rect x="0" y="6" width="2" height="3" fill={colors.shirt} />
            <rect x="10" y="6" width="2" height="3" fill={colors.shirt} />
            <rect x="0" y="5" width="2" height="1" fill="#fcd34d" />
            <rect x="10" y="5" width="2" height="1" fill="#fcd34d" />
          </>
        ) : (
          <>
            <rect x="0" y="8" width="2" height="3" fill={colors.shirt} />
            <rect x="10" y="8" width="2" height="3" fill={colors.shirt} />
            <rect x="0" y="11" width="2" height="1" fill="#fcd34d" />
            <rect x="10" y="11" width="2" height="1" fill="#fcd34d" />
          </>
        )}
        
        {/* Legs - Animated when walking */}
        <rect 
          x={currentLeg.leftLeg.x} 
          y={currentLeg.leftLeg.y} 
          width="3" 
          height="3" 
          fill="#1e40af" 
        />
        <rect 
          x={currentLeg.rightLeg.x} 
          y={currentLeg.rightLeg.y} 
          width="3" 
          height="3" 
          fill="#1e40af" 
        />
        
        {/* Shoes */}
        <rect x={currentLeg.leftLeg.x - 1} y="15" width="4" height="1" fill="#1f2937" />
        <rect x={currentLeg.rightLeg.x} y="15" width="4" height="1" fill="#1f2937" />
      </svg>

      {/* Sweat drops when working */}
      {status === 'working' && frame % 2 === 0 && (
        <div className="absolute -top-2 -right-1 text-cyan-400 text-xs animate-bounce">💧</div>
      )}

      {/* Stars when completed */}
      {status === 'completed' && (
        <>
          <div className="absolute -top-4 left-0 text-yellow-400 text-xs animate-ping">⭐</div>
          <div className="absolute -top-2 right-0 text-yellow-400 text-xs animate-ping" style={{ animationDelay: '0.3s' }}>✨</div>
        </>
      )}

      {/* Zzz when inactive */}
      {status === 'inactive' && (
        <div className="absolute -top-4 right-0 text-gray-400 text-sm">💤</div>
      )}

      {/* Warning when not working */}
      {status === 'not-working' && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-red-400 text-sm animate-pulse">⚠️</div>
      )}
    </div>
  )
}
