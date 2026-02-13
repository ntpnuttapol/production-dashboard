'use client'

import { useState } from 'react'
import Fireworks from './Fireworks'

interface StatusBadgeProps {
  status: 'working' | 'completed' | 'not-working' | 'inactive'
  statusTh?: string
  showFireworks?: boolean
}

const statusConfig = {
  'working': {
    color: 'bg-yellow-400',
    text: 'WORKING',
    textTh: 'กำลังทำงาน',
    emoji: '⚙️',
    animation: 'animate-bounce-horizontal',
    glow: 'shadow-yellow-400/50'
  },
  'completed': {
    color: 'bg-green-500',
    text: 'COMPLETED',
    textTh: 'เสร็จสิ้น',
    emoji: '✅',
    animation: '',
    glow: 'shadow-green-500/50'
  },
  'not-working': {
    color: 'bg-red-500',
    text: 'NOT WORKING',
    textTh: 'ไม่ได้ทำ',
    emoji: '❌',
    animation: '',
    glow: ''
  },
  'inactive': {
    color: 'bg-gray-600',
    text: 'INACTIVE',
    textTh: 'ไม่มีงาน',
    emoji: '💤',
    animation: '',
    glow: ''
  }
}

export default function StatusBadge({ status, statusTh, showFireworks = false }: StatusBadgeProps) {
  const [triggerFireworks, setTriggerFireworks] = useState(showFireworks)
  const config = statusConfig[status]

  return (
    <div className="relative inline-flex items-center">
      <div 
        className={`
          px-4 py-2 font-bold text-slate-900 text-sm
          ${config.color}
          ${status === 'working' ? 'status-working' : ''}
          ${config.glow ? `shadow-lg ${config.glow}` : ''}
          border-2 border-black/20
        `}
        style={{
          boxShadow: '3px 3px 0 0 rgba(0,0,0,0.3)',
        }}
      >
        <span className="mr-2">{config.emoji}</span>
        <span className="pixel-font text-xs">{statusTh || config.textTh}</span>
      </div>
      
      {status === 'completed' && (
        <Fireworks trigger={triggerFireworks} onComplete={() => setTriggerFireworks(false)} />
      )}
    </div>
  )
}
