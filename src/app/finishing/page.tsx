'use client'

import { useState } from 'react'
import WorkEntryForm from '@/components/WorkEntryForm'
import WorkEntryTable from '@/components/WorkEntryTable'
import Navbar from '@/components/Navbar'
import { type WorkEntry } from '@/lib/constants'

export default function FinishingPage() {
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #1E1B4B 0%, #312E81 100%)' }}>
      <Navbar />
      <div className="pixel-container">
        {/* Page Title */}
        <div className="pixel-page-title">
          <div>
            <h1 style={{ margin: 0, fontSize: '14px', color: '#8B5CF6', fontFamily: "'Press Start 2P', monospace" }}>
              🔧 FINISHING
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748B' }}>บันทึกข้อมูลการประกอบประจำวัน</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {!showForm && (
              <button
                onClick={() => { setEditData(undefined); setShowForm(true) }}
                style={{
                  padding: '10px 18px',
                  background: 'linear-gradient(90deg, #8B5CF6, #6366F1)',
                  color: '#fff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '3px 3px 0 0 rgba(0,0,0,0.3)',
                }}
              >
                ➕ เพิ่มข้อมูลใหม่
              </button>
            )}
          </div>
        </div>

        {showForm && (
          <div style={{ marginBottom: '20px' }}>
            <WorkEntryForm mode="finishing" onSuccess={handleSuccess} editData={editData} />
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

        <WorkEntryTable mode="finishing" refreshTrigger={refreshTrigger} onEdit={handleEdit} />
      </div>
    </div>
  )
}
