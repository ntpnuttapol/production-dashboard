'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { INPUT_STYLE, LABEL_STYLE, PIXEL_CARD_STYLE } from '@/lib/constants'

export default function DataEntryPage() {
  const [formData, setFormData] = useState({
    order_number: '',
    product_name: '',
    department: 'Production',
    quantity_target: '',
    quantity_completed: '0',
    status: 'inactive',
    due_date: '',
    remarks: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('Order data:', formData)
      setSuccess(true)
      setTimeout(() => { router.push('/') }, 2000)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateOrderNumber = () => {
    const deptPrefix: Record<string, string> = {
      'Production': 'PRD',
      'Finishing': 'FIN',
      'Assembly': 'ASM'
    }
    const prefix = deptPrefix[formData.department] || 'ORD'
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    setFormData(prev => ({ ...prev, order_number: `${prefix}-${year}-${random}` }))
  }

  const STATUS_OPTIONS = [
    { value: 'working', label: '🟡 Working', color: '#F59E0B' },
    { value: 'completed', label: '🟢 Completed', color: '#10B981' },
    { value: 'not-working', label: '🔴 Not Working', color: '#EF4444' },
    { value: 'inactive', label: '⚫ Inactive', color: '#6B7280' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', paddingBottom: '40px' }}>
      <Navbar />
      <div className="cartoon-container" style={{ maxWidth: '700px' }}>
        {/* Page Title */}
        <div className="cartoon-page-title">
          <div>
            <h1 className="cartoon-font" style={{ margin: 0, fontSize: '20px', color: 'var(--color-running)' }}>
              📝 DATA ENTRY
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>บันทึกข้อมูล Order ใหม่</p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="cartoon-card" style={{
            border: '3px solid var(--color-green)',
            textAlign: 'center',
            marginBottom: '24px',
            background: '#D1FAE5'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'float 2s infinite ease-in-out' }}>🎉</div>
            <div className="cartoon-font" style={{ color: '#047857', fontSize: '20px' }}>ORDER SAVED!</div>
            <div style={{ color: '#065F46', fontSize: '15px', marginTop: '8px', fontWeight: 600 }}>Redirecting to dashboard...</div>
          </div>
        )}

        {/* Form */}
        {!success && (
          <div className="cartoon-card" style={{ padding: '32px', background: 'var(--color-bg-card)' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '24px' }}>
                {/* Order Number */}
                <div>
                  <label style={LABEL_STYLE}>📋 Order Number</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      name="order_number"
                      value={formData.order_number}
                      onChange={handleChange}
                      style={{ ...INPUT_STYLE, flex: 1 }}
                      placeholder="PRD-2024-001"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateOrderNumber}
                      className="cartoon-btn"
                      style={{
                        padding: '12px 16px',
                        background: 'var(--color-blue)',
                        color: '#fff',
                        fontSize: '18px',
                      }}
                    >
                      🎲
                    </button>
                  </div>
                </div>

                {/* Product Name */}
                <div>
                  <label style={LABEL_STYLE}>📦 Product Name</label>
                  <input
                    type="text"
                    name="product_name"
                    value={formData.product_name}
                    onChange={handleChange}
                    style={INPUT_STYLE}
                    placeholder="Enter product name"
                    required
                  />
                </div>

                {/* Department */}
                <div>
                  <label style={LABEL_STYLE}>🏭 Department</label>
                  <select name="department" value={formData.department} onChange={handleChange} style={INPUT_STYLE}>
                    <option value="Production">🔧 Production - งานผลิต</option>
                    <option value="Finishing">✨ Finishing - งาน Finishing</option>
                    <option value="Assembly">🔩 Assembly - งานประกอบ</option>
                  </select>
                </div>

                {/* Quantities */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={LABEL_STYLE}>🎯 Target Quantity</label>
                    <input type="number" name="quantity_target" value={formData.quantity_target} onChange={handleChange} style={INPUT_STYLE} placeholder="0" min="0" required />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>✅ Completed</label>
                    <input type="number" name="quantity_completed" value={formData.quantity_completed} onChange={handleChange} style={INPUT_STYLE} placeholder="0" min="0" />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label style={LABEL_STYLE}>📊 Status</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {STATUS_OPTIONS.map((status) => {
                      const selected = formData.status === status.value
                      return (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, status: status.value }))}
                          style={{
                            padding: '12px',
                            fontWeight: '700',
                            fontSize: '14px',
                            cursor: 'pointer',
                            background: selected ? `${status.color}20` : 'var(--color-bg-input)',
                            color: selected ? status.color : 'var(--color-text-secondary)',
                            border: `2px solid ${selected ? status.color : 'var(--color-border)'}`,
                            borderRadius: '12px',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {status.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label style={LABEL_STYLE}>📅 Due Date</label>
                  <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} style={INPUT_STYLE} />
                </div>

                {/* Remarks */}
                <div>
                  <label style={LABEL_STYLE}>💬 Remarks</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    rows={3}
                    style={{ ...INPUT_STYLE, resize: 'none' }}
                    placeholder="Additional notes..."
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="cartoon-btn"
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: loading ? 'var(--color-border-accent)' : 'var(--color-green)',
                    color: '#FFFFFF',
                    fontSize: '16px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 6px 16px rgba(34, 197, 94, 0.4)',
                    marginTop: '8px'
                  }}
                >
                  {loading ? '⏳ SAVING...' : '💾 SAVE ORDER'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
