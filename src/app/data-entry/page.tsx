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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)' }}>
      <Navbar />
      <div className="pixel-container" style={{ maxWidth: '700px' }}>
        {/* Page Title */}
        <div className="pixel-page-title">
          <div>
            <h1 style={{ margin: 0, fontSize: '14px', color: '#F59E0B', fontFamily: "'Press Start 2P', monospace" }}>
              📝 DATA ENTRY
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748B' }}>บันทึกข้อมูล Order ใหม่</p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div style={{
            ...PIXEL_CARD_STYLE,
            border: '3px solid #10B981',
            textAlign: 'center',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎉</div>
            <div style={{ color: '#10B981', fontWeight: 'bold', fontSize: '14px', fontFamily: "'Press Start 2P', monospace" }}>ORDER SAVED!</div>
            <div style={{ color: '#64748B', fontSize: '13px', marginTop: '8px' }}>Redirecting to dashboard...</div>
          </div>
        )}

        {/* Form */}
        {!success && (
          <div style={PIXEL_CARD_STYLE}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '20px' }}>
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
                      style={{
                        padding: '10px 14px',
                        background: '#3B82F6',
                        color: '#fff',
                        border: 'none',
                        fontSize: '16px',
                        cursor: 'pointer',
                        boxShadow: '3px 3px 0 0 rgba(0,0,0,0.3)',
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
                            padding: '10px',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            cursor: 'pointer',
                            background: selected ? `${status.color}20` : 'transparent',
                            color: selected ? status.color : '#64748B',
                            border: `2px solid ${selected ? status.color : '#334155'}`,
                            boxShadow: selected ? '2px 2px 0 0 rgba(0,0,0,0.2)' : 'none',
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
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: loading ? '#475569' : 'linear-gradient(90deg, #10B981, #059669)',
                    color: loading ? '#94A3B8' : '#000',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: "'Press Start 2P', monospace",
                    boxShadow: loading ? 'none' : '4px 4px 0 0 rgba(0,0,0,0.3)',
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
