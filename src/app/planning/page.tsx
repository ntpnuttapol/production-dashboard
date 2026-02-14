'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PlanningForm from '@/components/PlanningForm'
import PlanningTable from '@/components/PlanningTable'
import Navbar from '@/components/Navbar'
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

  const handleStartProduction = (entry: PlanningEntry) => {
    const targetPage = entry.department === 'production' ? '/production' : '/finishing'
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0C4A6E 0%, #075985 100%)' }}>
      <Navbar />
      <div className="pixel-container">
        {/* Page Title */}
        <div className="pixel-page-title">
          <div>
            <h1 style={{ margin: 0, fontSize: '14px', color: '#06B6D4', fontFamily: "'Press Start 2P', monospace" }}>
              📋 PLANNING
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748B' }}>กำหนดแผนการผลิตและการประกอบ</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {!showForm && (
              <button
                onClick={() => { setEditData(undefined); setShowForm(true) }}
                style={{
                  padding: '10px 18px',
                  background: 'linear-gradient(90deg, #0EA5E9, #06B6D4)',
                  color: '#000',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '3px 3px 0 0 rgba(0,0,0,0.3)',
                }}
              >
                ➕ เพิ่มแผนใหม่
              </button>
            )}
          </div>
        </div>

        {showForm && (
          <div style={{ marginBottom: '20px' }}>
            <PlanningForm onSuccess={handleSuccess} editData={editData} />
            <button
              onClick={() => { setShowForm(false); setEditData(undefined) }}
              style={{
                marginTop: '12px', padding: '10px 20px', width: '100%',
                background: '#0F172A', color: '#94A3B8', border: '2px solid #334155',
                fontSize: '14px', cursor: 'pointer', fontWeight: '600',
                boxShadow: '3px 3px 0 0 rgba(0,0,0,0.3)',
              }}
            >
              ❌ ยกเลิก
            </button>
          </div>
        )}

        <PlanningTable
          refreshTrigger={refreshTrigger}
          onEdit={handleEdit}
          onStartProduction={handleStartProduction}
        />
      </div>
    </div>
  )
}
