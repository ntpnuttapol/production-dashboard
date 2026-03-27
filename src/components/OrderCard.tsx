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
    <div className="relative cartoon-card" style={{ background: 'var(--color-bg-primary)', overflow: 'hidden' }}>

      {/* Fireworks Effect */}
      {showFireworks && (
        <Fireworks trigger={showFireworks} onComplete={() => setShowFireworks(false)} />
      )}

      {/* Department Header */}
      <div className={`bg-gradient-to-r ${departmentColors[order.department] || 'from-slate-600 to-slate-700'} px-4 py-3 border-b border-black/10`}>
        <span className="cartoon-font text-sm text-white tracking-wider font-bold">
          🏭 {order.department?.toUpperCase()}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Order Number & Product */}
        <div>
          <div className="cartoon-font text-[var(--color-running)] text-sm mb-1">ORDER #</div>
          <div className="text-[var(--color-text-primary)] font-bold text-xl">{order.order_number}</div>
          <div className="text-[var(--color-text-secondary)] text-md mt-1 font-semibold">{order.product_name}</div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2 font-bold">
            <span className="text-[var(--color-text-secondary)]">PROGRESS</span>
            <span className="text-[var(--color-green)]">{progress}%</span>
          </div>
          <div className="h-4 bg-[var(--color-bg-input)] rounded-full overflow-hidden border border-[var(--color-border)]">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{ width: `${progress}%`, background: 'var(--color-green)' }}
            />
          </div>
          <div className="flex justify-between text-xs mt-2 text-[var(--color-text-secondary)] font-bold">
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
                px-2 py-3 text-xs font-bold border-2 transition-all rounded-[12px]
                ${order.status === status
                  ? 'border-[var(--color-running)] bg-[var(--color-running)]/10 text-white'
                  : 'border-[var(--color-border)] hover:border-white/50 text-[var(--color-text-secondary)] bg-[var(--color-bg-input)]'}
              `}
              style={{
                boxShadow: order.status === status ? '0 4px 8px rgba(0,0,0,0.1)' : 'none',
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
