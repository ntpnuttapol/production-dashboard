'use client'

import { useState } from 'react'
import Link from 'next/link'
import WorkEntryForm from '@/components/WorkEntryForm'
import WorkEntryTable from '@/components/WorkEntryTable'
import { type WorkEntry } from '@/lib/constants'

export default function ProductionPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [editData, setEditData] = useState<(WorkEntry & { id: string }) | undefined>(undefined)
  const [showForm, setShowForm] = useState(false)

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
    setEditData(undefined)
    setShowForm(false)
  }

  const handleEdit = (entry: WorkEntry) => {
    setEditData(entry)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '16px 24px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1E293B' }}>📝 กรอกข้อมูลการผลิต (Production)</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>บันทึกข้อมูลการผลิตประจำวัน</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/" style={{ padding: '10px 20px', background: '#F1F5F9', color: '#475569', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>← กลับหน้า Dashboard</Link>
          {!showForm && (
            <button onClick={() => { setEditData(undefined); setShowForm(true) }} style={{ padding: '10px 20px', background: 'linear-gradient(90deg, #F59E0B, #10B981)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>➕ เพิ่มข้อมูลใหม่</button>
          )}
        </div>
      </div>

      {showForm && (
        <div style={{ marginBottom: '20px' }}>
          <WorkEntryForm mode="production" onSuccess={handleSuccess} editData={editData} />
          <button onClick={() => { setShowForm(false); setEditData(undefined) }} style={{ marginTop: '12px', padding: '10px 20px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', width: '100%' }}>❌ ยกเลิก</button>
        </div>
      )}

      <WorkEntryTable mode="production" refreshTrigger={refreshTrigger} onEdit={handleEdit} />
    </div>
  )
}
