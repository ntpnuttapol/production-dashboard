'use client'

import { useState, useEffect } from 'react'
import PixelDinosaur from './PixelDinosaur'
import Fireworks from './Fireworks'

export interface ProductionLineData {
  id: string
  lineName: string
  lineLabel: string
  department: string
  itemName: string
  quantityTarget: number
  quantityCompleted: number
  status: 'working' | 'completed' | 'not-working' | 'inactive'
  timeRange: string
  assignedTo: string
}

interface ProductionLineProps {
  line: ProductionLineData
  onStatusChange?: (lineId: string, newStatus: ProductionLineData['status']) => void
}

export default function ProductionLine({ line, onStatusChange }: ProductionLineProps) {
  const [showFireworks, setShowFireworks] = useState(false)
  const [prevStatus, setPrevStatus] = useState(line.status)
  
  const progress = line.quantityTarget > 0 
    ? Math.round((line.quantityCompleted / line.quantityTarget) * 100) 
    : 0

  // Trigger fireworks when status changes to completed
  useEffect(() => {
    if (line.status === 'completed' && prevStatus !== 'completed') {
      setShowFireworks(true)
    }
    setPrevStatus(line.status)
  }, [line.status, prevStatus])

  const handleStatusClick = (newStatus: ProductionLineData['status']) => {
    if (newStatus === 'completed' && line.status !== 'completed') {
      setShowFireworks(true)
    }
    onStatusChange?.(line.id, newStatus)
  }

  const getStatusButton = () => {
    const baseClass = "px-4 py-2 text-sm font-bold border-2 transition-all"
    switch (line.status) {
      case 'working':
        return (
          <button 
            onClick={() => handleStatusClick('completed')}
            className={`${baseClass} bg-yellow-500 text-black border-yellow-300 hover:bg-yellow-400 animate-pulse`}
          >
            ⚙️ กำลังผลิต
          </button>
        )
      case 'completed':
        return (
          <button 
            className={`${baseClass} bg-green-500 text-black border-green-300`}
          >
            ✅ เสร็จสิ้น
          </button>
        )
      case 'not-working':
        return (
          <button 
            onClick={() => handleStatusClick('working')}
            className={`${baseClass} bg-red-500 text-white border-red-300 hover:bg-red-400`}
          >
            ⛔ หยุดทำงาน
          </button>
        )
      default:
        return (
          <button 
            onClick={() => handleStatusClick('working')}
            className={`${baseClass} bg-gray-600 text-gray-300 border-gray-500 hover:bg-gray-500`}
          >
            💤 ไม่มีงาน
          </button>
        )
    }
  }

  const getBorderColor = () => {
    switch (line.status) {
      case 'working': return 'border-yellow-500 shadow-yellow-500/30'
      case 'completed': return 'border-green-500 shadow-green-500/30'
      case 'not-working': return 'border-red-500 shadow-red-500/30'
      default: return 'border-gray-600'
    }
  }

  // Generate progress blocks
  const totalBlocks = 25
  const filledBlocks = Math.round((progress / 100) * totalBlocks)

  return (
    <div className={`bg-[#0d2137] border-2 ${getBorderColor()} shadow-lg p-5 relative overflow-hidden`}>
      {/* Fireworks Effect */}
      {showFireworks && (
        <Fireworks trigger={showFireworks} onComplete={() => setShowFireworks(false)} />
      )}

      {/* Confetti particles for completed status */}
      {line.status === 'completed' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'][i % 6],
                animation: `particle-float ${2 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Header Row */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="pixel-font text-cyan-400 text-xl tracking-wider">{line.lineName}</div>
          <div className="text-cyan-600 text-sm mt-1">
            {line.department} <span className="text-white font-bold text-lg">{line.lineLabel}</span>
          </div>
        </div>
        {getStatusButton()}
      </div>

      {/* Pixel Character Animation Area */}
      <div className="h-28 relative mb-4 bg-gradient-to-b from-[#0a1628] to-[#0d2137] border border-cyan-900 overflow-hidden">
        {/* Ground line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-800"></div>
        
        {/* Pixel Dinosaur */}
        <PixelDinosaur status={line.status === 'working' ? 'running' : line.status === 'completed' ? 'completed' : 'idle'} />
      </div>

      {/* Item Info */}
      <div className="border-t border-cyan-800 pt-4">
        <div className="text-cyan-600 text-sm mb-2">
          ITEM <span className="text-white font-semibold">{line.itemName}</span>
        </div>

        {/* Progress */}
        <div className="flex justify-between items-center mb-3">
          <div className="text-white">
            <span className="text-3xl font-bold">{line.quantityCompleted.toLocaleString()}</span>
            <span className="text-cyan-600"> / {line.quantityTarget.toLocaleString()} ชิ้น</span>
          </div>
          <div className={`text-2xl font-bold ${progress >= 100 ? 'text-green-400' : progress > 50 ? 'text-yellow-400' : 'text-cyan-400'}`}>
            {progress}%
          </div>
        </div>

        {/* Progress Bar - Pixel Style */}
        <div className="flex gap-[3px] mb-4">
          {[...Array(totalBlocks)].map((_, i) => (
            <div
              key={i}
              className={`h-5 flex-1 transition-all duration-300 ${
                i < filledBlocks 
                  ? line.status === 'completed' 
                    ? 'bg-green-400 shadow-green-400/50 shadow-sm' 
                    : line.status === 'working'
                    ? 'bg-yellow-400 shadow-yellow-400/50 shadow-sm'
                    : line.status === 'not-working'
                    ? 'bg-red-400'
                    : 'bg-cyan-500'
                  : 'bg-cyan-900/50'
              }`}
            />
          ))}
        </div>

        {/* Time and Assigned */}
        <div className="flex justify-between text-cyan-500 text-sm">
          <span>⏰ {line.timeRange}</span>
          <span>👷 {line.assignedTo}</span>
        </div>

        {/* Quick Status Buttons */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-cyan-800/50">
          {(['working', 'completed', 'not-working', 'inactive'] as const).map((status) => (
            <button
              key={status}
              onClick={() => handleStatusClick(status)}
              className={`
                flex-1 py-2 text-xs font-bold transition-all
                ${line.status === status 
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0d2137]' 
                  : 'opacity-60 hover:opacity-100'}
                ${status === 'working' ? 'bg-yellow-500 text-black' : ''}
                ${status === 'completed' ? 'bg-green-500 text-black' : ''}
                ${status === 'not-working' ? 'bg-red-500 text-white' : ''}
                ${status === 'inactive' ? 'bg-gray-600 text-white' : ''}
              `}
            >
              {status === 'working' && '⚙️'}
              {status === 'completed' && '✅'}
              {status === 'not-working' && '⛔'}
              {status === 'inactive' && '💤'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
