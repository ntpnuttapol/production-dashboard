'use client'

import { useState } from 'react'
import StatusBadge from './StatusBadge'
import Fireworks from './Fireworks'

export interface Order {
  id: string
  order_number: string
  product_name: string
  department: string
  quantity_target: number
  quantity_completed: number
  status: 'working' | 'completed' | 'not-working' | 'inactive'
  assigned_to?: string
  due_date?: string
}

interface OrderCardProps {
  order: Order
  onStatusChange?: (orderId: string, newStatus: Order['status']) => void
}

export default function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const [showFireworks, setShowFireworks] = useState(false)
  const progress = order.quantity_target > 0 
    ? Math.round((order.quantity_completed / order.quantity_target) * 100) 
    : 0

  const departmentColors: Record<string, string> = {
    'Production': 'from-blue-600 to-blue-800',
    'Finishing': 'from-purple-600 to-purple-800',
    'Assembly': 'from-orange-600 to-orange-800'
  }

  const handleStatusChange = (newStatus: Order['status']) => {
    if (newStatus === 'completed') {
      setShowFireworks(true)
    }
    onStatusChange?.(order.id, newStatus)
  }

  return (
    <div className="relative pixel-card bg-slate-800 border-4 border-slate-600 overflow-hidden"
      style={{
        boxShadow: '6px 6px 0 0 rgba(0,0,0,0.4)',
      }}>
      
      {/* Fireworks Effect */}
      {showFireworks && (
        <Fireworks trigger={showFireworks} onComplete={() => setShowFireworks(false)} />
      )}

      {/* Department Header */}
      <div className={`bg-gradient-to-r ${departmentColors[order.department] || 'from-slate-600 to-slate-700'} px-4 py-2 border-b-4 border-black/20`}>
        <span className="pixel-font text-xs text-white tracking-wider">
          🏭 {order.department?.toUpperCase()}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Order Number & Product */}
        <div>
          <div className="text-yellow-400 text-xs mb-1">ORDER #</div>
          <div className="text-white font-bold text-lg">{order.order_number}</div>
          <div className="text-slate-400 text-sm mt-1">{order.product_name}</div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-slate-400">PROGRESS</span>
            <span className="text-green-400 font-bold">{progress}%</span>
          </div>
          <div className="h-4 bg-slate-700 border-2 border-slate-600 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1 text-slate-500">
            <span>{order.quantity_completed.toLocaleString()}</span>
            <span>{order.quantity_target.toLocaleString()}</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center">
          <StatusBadge status={order.status} showFireworks={showFireworks} />
        </div>

        {/* Quick Status Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {(['working', 'completed', 'not-working', 'inactive'] as const).map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`
                px-2 py-2 text-xs font-bold border-2 transition-all
                ${order.status === status 
                  ? 'border-white bg-white/10' 
                  : 'border-slate-500 hover:border-white/50'}
              `}
              style={{
                boxShadow: order.status === status ? '2px 2px 0 0 rgba(255,255,255,0.2)' : 'none',
              }}
            >
              {status === 'working' && '🟡'}
              {status === 'completed' && '🟢'}
              {status === 'not-working' && '🔴'}
              {status === 'inactive' && '⚫'}
            </button>
          ))}
        </div>

        {/* Due Date */}
        {order.due_date && (
          <div className="text-center text-xs text-slate-500">
            📅 Due: {new Date(order.due_date).toLocaleDateString('th-TH')}
          </div>
        )}
      </div>
    </div>
  )
}
