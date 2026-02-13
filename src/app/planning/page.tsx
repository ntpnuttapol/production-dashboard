'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PlanningForm from '@/components/PlanningForm'
import PlanningTable from '@/components/PlanningTable'
import { type PlanningEntry } from '@/lib/constants'

export default function PlanningPage() {
  const router = useRouter()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [editData, setEditData] = useState<PlanningEntry | undefined>(undefined)
  const [showForm, setShowForm] = useState(false)

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
    setEditData(undefined)
    setShowForm(false)
  }

  const handleEdit = (entry: PlanningEntry) => {
    setEditData(entry)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Navigate to Production/Finishing page with plan data pre-selected
  const handleStartProduction = (entry: PlanningEntry) => {
    const targetPage = entry.department === 'production' ? '/production' : '/finishing'
    // Store plan info in sessionStorage so the target page can pre-fill the form
    sessionStorage.setItem('selectedPlan', JSON.stringify({
      plan_id: entry.id,
      line_id: entry.line_id,
      product_name: entry.product_name,
      lot_number: entry.lot_number,
      target_qty: entry.target_qty,
      part_number_id: entry.part_number_id || null,
    }))
    router.push(targetPage)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0C4A6E 0%, #075985 100%)', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '16px 24px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1E293B' }}>📋 วางแผนการผลิต (Planning)</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>กำหนดแผนการผลิตและการประกอบ</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/" style={{ padding: '10px 20px', background: '#F1F5F9', color: '#475569', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>← กลับหน้า Dashboard</Link>
          {!showForm && (
            <button onClick={() => { setEditData(undefined); setShowForm(true) }} style={{ padding: '10px 20px', background: 'linear-gradient(90deg, #0EA5E9, #06B6D4)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>➕ เพิ่มแผนใหม่</button>
          )}
        </div>
      </div>

      {showForm && (
        <div style={{ marginBottom: '20px' }}>
          <PlanningForm onSuccess={handleSuccess} editData={editData} />
          <button onClick={() => { setShowForm(false); setEditData(undefined) }} style={{ marginTop: '12px', padding: '10px 20px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', width: '100%' }}>❌ ยกเลิก</button>
        </div>
      )}

      <PlanningTable
        refreshTrigger={refreshTrigger}
        onEdit={handleEdit}
        onStartProduction={handleStartProduction}
      />
    </div>
  )
}
