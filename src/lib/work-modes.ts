import {
  FINISHING_LINES,
  FINISHING_STATUS_CONFIG,
  PRODUCTION_LINES,
  PRODUCTION_STATUS_CONFIG,
} from '@/lib/constants'

export type WorkMode = 'production' | 'finishing'
export type WorkStatus = 'running' | 'completed' | 'idle'

export interface LineOption {
  id: string
  name: string
}

interface WorkModeMeta {
  table: 'production_entries' | 'finishing_entries'
  department: WorkMode
  pageTitle: string
  pageDescription: string
  pageAccentColor: string
  createButtonLabel: string
  formTitle: string
  tableTitle: string
  lineLabel: string
  lineTableLabel: string
  completedLabel: string
  accentColor: string
  completedInputBorder: string
  completedInputBg: string
  storageBucket: string
  filePrefix: string
  statusConfig: Record<WorkStatus, { label: string; color: string; bg: string }>
  statusOptions: Record<WorkStatus, string>
  fallbackLines: LineOption[]
}

export const WORK_MODE_META: Record<WorkMode, WorkModeMeta> = {
  production: {
    table: 'production_entries',
    department: 'production',
    pageTitle: '📝 PRODUCTION',
    pageDescription: 'บันทึกข้อมูลการผลิตประจำวัน',
    pageAccentColor: 'var(--color-running)',
    createButtonLabel: '➕ เพิ่มข้อมูลใหม่',
    formTitle: 'ข้อมูลการผลิต',
    tableTitle: '📋 ประวัติการผลิต',
    lineLabel: 'สายการผลิต',
    lineTableLabel: 'สายผลิต',
    completedLabel: 'ผลิตแล้ว (ชิ้น)',
    accentColor: '#F59E0B',
    completedInputBorder: '#10B981',
    completedInputBg: '#10B98120',
    storageBucket: 'production-images',
    filePrefix: '',
    statusConfig: PRODUCTION_STATUS_CONFIG,
    statusOptions: {
      running: '🟡 กำลังผลิต',
      completed: '🟢 เสร็จสิ้น',
      idle: '⚫ รอดำเนินการ',
    },
    fallbackLines: PRODUCTION_LINES,
  },
  finishing: {
    table: 'finishing_entries',
    department: 'finishing',
    pageTitle: '🔧 FINISHING',
    pageDescription: 'บันทึกข้อมูลการประกอบประจำวัน',
    pageAccentColor: 'var(--color-purple)',
    createButtonLabel: '➕ เพิ่มข้อมูลใหม่',
    formTitle: 'ข้อมูลการประกอบ',
    tableTitle: '📋 ประวัติการประกอบ',
    lineLabel: 'สายประกอบ',
    lineTableLabel: 'สายประกอบ',
    completedLabel: 'ประกอบแล้ว (ชิ้น)',
    accentColor: '#8B5CF6',
    completedInputBorder: '#8B5CF6',
    completedInputBg: '#8B5CF620',
    storageBucket: 'production-images',
    filePrefix: 'finishing-',
    statusConfig: FINISHING_STATUS_CONFIG,
    statusOptions: {
      running: '🟣 กำลังประกอบ',
      completed: '🟢 เสร็จสิ้น',
      idle: '⚫ รอดำเนินการ',
    },
    fallbackLines: FINISHING_LINES,
  },
}

export function getDefaultLineSelection(mode: WorkMode, lines: LineOption[]): LineOption {
  return lines[0] || WORK_MODE_META[mode].fallbackLines[0] || { id: '', name: '' }
}
