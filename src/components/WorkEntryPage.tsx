'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import WorkEntryForm from '@/components/WorkEntryForm'
import WorkEntryTable from '@/components/WorkEntryTable'
import { type WorkEntry } from '@/lib/constants'
import { WORK_MODE_META, type WorkMode } from '@/lib/work-modes'

interface WorkEntryPageProps {
  mode: WorkMode
}

export default function WorkEntryPage({ mode }: WorkEntryPageProps) {
  const config = WORK_MODE_META[mode]
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [editData, setEditData] = useState<WorkEntry | undefined>(undefined)
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
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      <Navbar />
      <div className="cartoon-container">
        <div className="cartoon-page-title">
          <div>
            <h1 className="cartoon-font" style={{ margin: 0, fontSize: '20px', color: config.pageAccentColor }}>
              {config.pageTitle}
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              {config.pageDescription}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {!showForm && (
              <button
                className="cartoon-btn"
                onClick={() => { setEditData(undefined); setShowForm(true) }}
                style={{
                  padding: '10px 20px',
                  background: config.accentColor,
                  color: '#FFFFFF',
                  fontSize: '14px',
                }}
              >
                {config.createButtonLabel}
              </button>
            )}
          </div>
        </div>

        {showForm && (
          <div style={{ marginBottom: '24px' }}>
            <WorkEntryForm mode={mode} onSuccess={handleSuccess} editData={editData} />
            <button
              className="cartoon-btn"
              onClick={() => { setShowForm(false); setEditData(undefined) }}
              style={{
                marginTop: '16px',
                padding: '12px 24px',
                width: '100%',
                background: 'var(--color-bg-input)',
                color: 'var(--color-text-secondary)',
                fontSize: '15px',
              }}
            >
              ❌ ยกเลิก
            </button>
          </div>
        )}

        <WorkEntryTable mode={mode} refreshTrigger={refreshTrigger} onEdit={handleEdit} />
      </div>
    </div>
  )
}
