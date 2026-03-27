import React from 'react'

// ═══════════════════════════════════════
// SHARED CONSTANTS - Single source of truth
// ═══════════════════════════════════════

// FALLBACK lines for when the DB is not reachable
export const PRODUCTION_LINES = [
  { id: 'LINE-01', name: 'สายการผลิต A' },
  { id: 'LINE-02', name: 'สายการผลิต B' },
  { id: 'LINE-03', name: 'สายการผลิต C' },
  { id: 'LINE-04', name: 'สายการผลิต D' },
  { id: 'LINE-05', name: 'สายการผลิต E' },
  { id: 'LINE-06', name: 'สายการผลิต F' },
]

export const FINISHING_LINES = [
  { id: 'FINISH-01', name: 'สายประกอบ A' },
  { id: 'FINISH-02', name: 'สายประกอบ B' },
  { id: 'FINISH-03', name: 'สายประกอบ C' },
  { id: 'FINISH-04', name: 'สายประกอบ D' },
]

// --- Status Configs ---
export const PRODUCTION_STATUS_CONFIG = {
  running: { label: 'กำลังผลิต', color: '#F59E0B', bg: '#FEF3C7' },
  completed: { label: 'เสร็จสิ้น', color: '#10B981', bg: '#D1FAE5' },
  idle: { label: 'รอดำเนินการ', color: '#6B7280', bg: '#F3F4F6' },
} as const

export const FINISHING_STATUS_CONFIG = {
  running: { label: 'กำลังประกอบ', color: '#8B5CF6', bg: '#EDE9FE' },
  completed: { label: 'เสร็จสิ้น', color: '#10B981', bg: '#D1FAE5' },
  idle: { label: 'รอดำเนินการ', color: '#6B7280', bg: '#F3F4F6' },
} as const

export const SHIFT_CONFIG = {
  morning: { label: 'กะเช้า', icon: '☀️' },
  night: { label: 'กะกลางคืน', icon: '🌙' },
} as const

export const PLANNING_PRIORITY_CONFIG = {
  high: { label: 'สูง', color: '#EF4444', bg: '#FEE2E2', icon: '🔴' },
  medium: { label: 'กลาง', color: '#F59E0B', bg: '#FEF3C7', icon: '🟡' },
  low: { label: 'ต่ำ', color: '#10B981', bg: '#D1FAE5', icon: '🟢' },
} as const

export const PLANNING_STATUS_CONFIG = {
  pending: { label: 'รอดำเนินการ', color: '#6B7280', bg: '#F3F4F6' },
  in_progress: { label: 'กำลังดำเนินการ', color: '#0EA5E9', bg: '#E0F2FE' },
  completed: { label: 'เสร็จสิ้น', color: '#10B981', bg: '#D1FAE5' },
  cancelled: { label: 'ยกเลิก', color: '#EF4444', bg: '#FEE2E2' },
} as const

export const DEPT_CONFIG = {
  production: { label: 'Production', color: '#F59E0B', bg: '#FEF3C7', icon: '🏭' },
  finishing: { label: 'Finishing', color: '#8B5CF6', bg: '#EDE9FE', icon: '🔧' },
} as const

// --- Shared Styles (Minimal Cartoon Theme) ---
export const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  fontSize: '15px',
  border: '2px solid var(--color-border)',
  borderRadius: '16px',
  background: 'var(--color-bg-input)',
  color: 'var(--color-text-primary)',
  outline: 'none',
  boxSizing: 'border-box' as const,
  fontFamily: "'Nunito', 'Kanit', sans-serif",
  fontWeight: '600',
  transition: 'all 0.2s ease',
}

export const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '700',
  color: 'var(--color-text-secondary)',
  marginBottom: '8px',
  fontFamily: "'Nunito', sans-serif",
}

// --- Pixel Art Shared Styles ---
export const PIXEL_CARD_STYLE: React.CSSProperties = {
  background: '#1E293B',
  border: '3px solid #334155',
  boxShadow: '4px 4px 0 0 rgba(0,0,0,0.4)',
  padding: '20px',
}

export const PIXEL_BUTTON_STYLE: React.CSSProperties = {
  fontWeight: 'bold',
  border: 'none',
  cursor: 'pointer',
  boxShadow: '3px 3px 0 0 rgba(0,0,0,0.3)',
  transition: 'all 0.1s',
}

export const PIXEL_TABLE_HEADER_STYLE: React.CSSProperties = {
  background: '#0F172A',
  borderBottom: '3px solid #334155',
}

export const PIXEL_TABLE_CELL_STYLE: React.CSSProperties = {
  padding: '12px 14px',
  color: '#F1F5F9',
  borderBottom: '1px solid #334155',
}

// --- Production Rate Calculations ---
export function calculateProductionRate(stdQtyPerHour: number): {
  perMinute: number
  per10Minutes: number
  perHour: number
} {
  return {
    perMinute: Math.round((stdQtyPerHour / 60) * 10) / 10,
    per10Minutes: Math.round((stdQtyPerHour / 60) * 10 * 10) / 10,
    perHour: stdQtyPerHour
  }
}

export function calculateActualRate(
  completedQty: number,
  startTime: string,
  endTime: string,
  useCurrentTime?: boolean
): {
  perMinute: number
  per10Minutes: number
  perHour: number
  totalMinutes: number
} {
  if (!startTime) {
    return { perMinute: 0, per10Minutes: 0, perHour: 0, totalMinutes: 0 }
  }

  let totalMinutes: number

  if (endTime) {
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)
    totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
  } else if (useCurrentTime) {
    const now = new Date()
    const nowTimeStr = now.toTimeString().slice(0, 5)
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${nowTimeStr}`)
    totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
  } else {
    return { perMinute: 0, per10Minutes: 0, perHour: 0, totalMinutes: 0 }
  }

  if (totalMinutes <= 0) {
    return { perMinute: 0, per10Minutes: 0, perHour: 0, totalMinutes: 0 }
  }

  return {
    perMinute: Math.round((completedQty / totalMinutes) * 10) / 10,
    per10Minutes: Math.round((completedQty / totalMinutes) * 10 * 10) / 10,
    perHour: Math.round((completedQty / totalMinutes) * 60),
    totalMinutes: Math.round(totalMinutes)
  }
}

export function getEfficiencyStatus(actualRate: number, standardRate: number): {
  status: 'excellent' | 'good' | 'normal' | 'slow'
  color: string
  bg: string
  percentage: number
} {
  const percentage = standardRate > 0 ? Math.round((actualRate / standardRate) * 100) : 0

  if (percentage >= 110) {
    return {
      status: 'excellent',
      color: '#16A34A',
      bg: '#DCFCE7',
      percentage
    }
  } else if (percentage >= 95) {
    return {
      status: 'good',
      color: '#10B981',
      bg: '#D1FAE5',
      percentage
    }
  } else if (percentage >= 80) {
    return {
      status: 'normal',
      color: '#F59E0B',
      bg: '#FEF3C7',
      percentage
    }
  } else {
    return {
      status: 'slow',
      color: '#EF4444',
      bg: '#FEE2E2',
      percentage
    }
  }
}

// --- TypeScript Types ---
export interface WorkEntry {
  id: string
  line_id: string
  line_name: string
  product_name: string
  lot_number: string
  target_qty: number
  completed_qty: number
  status: 'running' | 'completed' | 'idle'
  shift: 'morning' | 'night'
  start_time: string
  end_time: string
  operator: string
  remarks: string
  image_url: string
  plan_id: string | null
  part_number_id: string | null
  created_at: string
  updated_at: string
}

export interface PlanningEntry {
  id: string
  plan_date: string
  department: 'production' | 'finishing'
  line_id: string
  part_number_id: string | null
  product_name: string
  lot_number: string
  target_qty: number
  priority: 'high' | 'medium' | 'low'
  notes: string
  created_by: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface PartNumber {
  id: string
  part_number: string
  part_name: string
  customer_id?: string | null
  customers?: { customer_name: string } | null
  std_qty: number
  unit: string
  description: string
  is_active: boolean
  created_at: string
}
