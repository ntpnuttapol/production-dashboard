'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
      // TODO: Save to Supabase
      // const { error } = await supabase.from('production_orders').insert({
      //   order_number: formData.order_number,
      //   product_name: formData.product_name,
      //   department_id: departmentMap[formData.department],
      //   quantity_target: parseInt(formData.quantity_target),
      //   quantity_completed: parseInt(formData.quantity_completed),
      //   status_id: statusMap[formData.status],
      //   due_date: formData.due_date,
      //   remarks: formData.remarks
      // })

      // Demo success
      console.log('Order data:', formData)
      setSuccess(true)
      setTimeout(() => {
        router.push('/')
      }, 2000)
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
    setFormData(prev => ({
      ...prev,
      order_number: `${prefix}-${year}-${random}`
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="pixel-font text-yellow-400 text-lg">
            📝 DATA ENTRY
          </h1>
          <button
            onClick={() => router.push('/')}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 py-2 text-sm border-2 border-slate-500"
            style={{ boxShadow: '3px 3px 0 0 rgba(0,0,0,0.3)' }}
          >
            ← BACK
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-500/20 border-4 border-green-500 p-6 mb-6 text-center"
            style={{ boxShadow: '4px 4px 0 0 rgba(0,0,0,0.4)' }}>
            <div className="text-4xl mb-2">🎉</div>
            <div className="text-green-400 font-bold">ORDER SAVED SUCCESSFULLY!</div>
            <div className="text-green-400/70 text-sm mt-2">Redirecting to dashboard...</div>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="bg-slate-800 border-4 border-slate-600 p-6"
            style={{ boxShadow: '6px 6px 0 0 rgba(0,0,0,0.4)' }}>
            
            <div className="space-y-6">
              {/* Order Number */}
              <div>
                <label className="block text-yellow-400 text-sm mb-2">📋 ORDER NUMBER</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="order_number"
                    value={formData.order_number}
                    onChange={handleChange}
                    className="flex-1 bg-slate-700 border-2 border-slate-500 text-white px-4 py-3 focus:outline-none focus:border-yellow-400"
                    placeholder="PRD-2024-001"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateOrderNumber}
                    className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-4 border-b-4 border-blue-700"
                    style={{ boxShadow: '2px 2px 0 0 rgba(0,0,0,0.3)' }}
                  >
                    🎲
                  </button>
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-yellow-400 text-sm mb-2">📦 PRODUCT NAME</label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border-2 border-slate-500 text-white px-4 py-3 focus:outline-none focus:border-yellow-400"
                  placeholder="Enter product name"
                  required
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-yellow-400 text-sm mb-2">🏭 DEPARTMENT</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border-2 border-slate-500 text-white px-4 py-3 focus:outline-none focus:border-yellow-400"
                >
                  <option value="Production">🔧 Production - งานผลิต</option>
                  <option value="Finishing">✨ Finishing - งาน Finishing</option>
                  <option value="Assembly">🔩 Assembly - งานประกอบ</option>
                </select>
              </div>

              {/* Quantities */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-yellow-400 text-sm mb-2">🎯 TARGET QUANTITY</label>
                  <input
                    type="number"
                    name="quantity_target"
                    value={formData.quantity_target}
                    onChange={handleChange}
                    className="w-full bg-slate-700 border-2 border-slate-500 text-white px-4 py-3 focus:outline-none focus:border-yellow-400"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-yellow-400 text-sm mb-2">✅ COMPLETED</label>
                  <input
                    type="number"
                    name="quantity_completed"
                    value={formData.quantity_completed}
                    onChange={handleChange}
                    className="w-full bg-slate-700 border-2 border-slate-500 text-white px-4 py-3 focus:outline-none focus:border-yellow-400"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-yellow-400 text-sm mb-2">📊 STATUS</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { value: 'working', label: '🟡 Working', color: 'yellow' },
                    { value: 'completed', label: '🟢 Completed', color: 'green' },
                    { value: 'not-working', label: '🔴 Not Working', color: 'red' },
                    { value: 'inactive', label: '⚫ Inactive', color: 'gray' }
                  ].map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, status: status.value }))}
                      className={`
                        px-3 py-3 font-bold text-xs border-2 transition-all
                        ${formData.status === status.value 
                          ? `border-${status.color}-400 bg-${status.color}-500/20 text-${status.color}-400` 
                          : 'border-slate-500 text-slate-400 hover:border-white/50'}
                      `}
                      style={{
                        boxShadow: formData.status === status.value ? '2px 2px 0 0 rgba(255,255,255,0.2)' : 'none',
                        backgroundColor: formData.status === status.value 
                          ? status.color === 'yellow' ? 'rgba(234, 179, 8, 0.2)'
                          : status.color === 'green' ? 'rgba(34, 197, 94, 0.2)'
                          : status.color === 'red' ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(107, 114, 128, 0.2)'
                          : 'transparent',
                        borderColor: formData.status === status.value
                          ? status.color === 'yellow' ? '#eab308'
                          : status.color === 'green' ? '#22c55e'
                          : status.color === 'red' ? '#ef4444'
                          : '#6b7280'
                          : undefined,
                        color: formData.status === status.value
                          ? status.color === 'yellow' ? '#eab308'
                          : status.color === 'green' ? '#22c55e'
                          : status.color === 'red' ? '#ef4444'
                          : '#9ca3af'
                          : undefined
                      }}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-yellow-400 text-sm mb-2">📅 DUE DATE</label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border-2 border-slate-500 text-white px-4 py-3 focus:outline-none focus:border-yellow-400"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-yellow-400 text-sm mb-2">💬 REMARKS</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-slate-700 border-2 border-slate-500 text-white px-4 py-3 focus:outline-none focus:border-yellow-400 resize-none"
                  placeholder="Additional notes..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-green-400 text-slate-900 font-bold py-4 px-6 
                  hover:from-green-400 hover:to-green-300 transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  border-b-4 border-green-700 hover:border-green-600 active:border-b-0 active:mt-1"
                style={{ boxShadow: '4px 4px 0 0 rgba(0,0,0,0.3)' }}
              >
                {loading ? '⏳ SAVING...' : '💾 SAVE ORDER'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
