'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { INPUT_STYLE, LABEL_STYLE } from '@/lib/constants'

interface Customer {
  id: string
  customer_code: string
  customer_name: string
  is_active: boolean
  created_at: string
}

const EMPTY_FORM = {
  customer_code: '',
  customer_name: '',
  is_active: true,
}

export default function CustomersPage() {
  const supabase = createClient()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [editData, setEditData] = useState<Customer | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('customer_code', { ascending: true })

    if (error) console.error('Fetch error:', error)
    else setCustomers(data || [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchCustomers() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (editData) {
        const { error } = await supabase.from('customers').update(formData).eq('id', editData.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('customers').insert([formData])
        if (error) throw error
      }

      setShowForm(false)
      setEditData(null)
      setFormData(EMPTY_FORM)
      fetchCustomers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditData(customer)
    setFormData({
      customer_code: customer.customer_code,
      customer_name: customer.customer_name,
      is_active: customer.is_active,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบลูกค้านี้?')) return
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) alert('เกิดข้อผิดพลาด: ' + error.message)
    else fetchCustomers()
  }

  const openNewForm = () => {
    setEditData(null)
    
    // Auto-generate next CUS-XXX code
    let nextCode = 'CUS-001'
    if (customers.length > 0) {
      // Find the highest number in existing CUS-XXX codes
      const codes = customers
        .map(c => c.customer_code)
        .filter(code => code.startsWith('CUS-'))
        .map(code => {
          const numStr = code.replace('CUS-', '')
          return parseInt(numStr, 10)
        })
        .filter(num => !isNaN(num))
      
      if (codes.length > 0) {
        const maxNum = Math.max(...codes)
        nextCode = `CUS-${String(maxNum + 1).padStart(3, '0')}`
      }
    }

    setFormData({ ...EMPTY_FORM, customer_code: nextCode })
    setError(null)
    setShowForm(true)
  }

  const filteredCustomers = showInactive ? customers : customers.filter(c => c.is_active)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      <Navbar />
      <div className="cartoon-container">
        {/* Page Title */}
        <div className="cartoon-page-title">
          <div>
            <h1 className="cartoon-font" style={{ margin: 0, fontSize: '20px', color: 'var(--color-green)' }}>
              👥 CUSTOMERS
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              จัดการข้อมูลรายชื่อลูกค้า
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {!showForm && (
              <button
                className="cartoon-btn"
                onClick={openNewForm}
                style={{
                  padding: '10px 20px',
                  background: '#10B981',
                  color: '#FFFFFF',
                  fontSize: '14px',
                }}
              >
                ➕ เพิ่มลูกค้า
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="cartoon-card" style={{ marginBottom: '24px', borderTopColor: '#10B981', borderTopWidth: '6px' }}>
            <h2 className="cartoon-font" style={{ margin: '0 0 24px', fontSize: '18px', color: '#10B981' }}>
              {editData ? `✏️ EDIT CUSTOMER` : `➕ NEW CUSTOMER`}
            </h2>

            {error && (
              <div style={{ padding: '14px', background: '#FEE2E2', border: '2px solid #F87171', borderRadius: '12px', color: '#B91C1C', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={LABEL_STYLE}>รหัสลูกค้า *</label>
                  <input
                    type="text"
                    value={formData.customer_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_code: e.target.value }))}
                    placeholder="เช่น C-001"
                    style={{ ...INPUT_STYLE, background: 'var(--color-bg-secondary)', cursor: 'not-allowed', color: 'var(--color-text-muted)' }}
                    required
                    readOnly
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>ชื่อลูกค้า *</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    placeholder="ชื่อบริษัทลูกค้า"
                    style={INPUT_STYLE}
                    required
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>สถานะ</label>
                  <select
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                    style={INPUT_STYLE}
                  >
                    <option value="true">✅ ใช้งาน</option>
                    <option value="false">❌ ไม่ใช้งาน</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
                <button type="submit" disabled={saving} className="cartoon-btn" style={{
                  flex: 1, padding: '14px',
                  background: saving ? 'var(--color-border-accent)' : '#10B981',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: saving ? 'none' : `0 6px 16px #10B98140`,
                }}>
                  {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditData(null) }} className="cartoon-btn" style={{
                  padding: '14px 24px', background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)',
                  fontSize: '15px',
                }}>ยกเลิก</button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="cartoon-card" style={{ borderTopColor: '#10B981', borderTopWidth: '6px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px dashed var(--color-border)',
          }}>
            <h2 className="cartoon-font" style={{ margin: 0, fontSize: '18px', color: '#10B981' }}>
              👥 CUSTOMERS LIST
            </h2>
            <button
              onClick={() => setShowInactive(!showInactive)}
              className="cartoon-btn"
              style={{
                padding: '8px 16px',
                background: showInactive ? 'var(--color-bg-input)' : 'transparent',
                color: showInactive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                border: '2px solid var(--color-border)',
                fontSize: '13px',
              }}
            >
              {showInactive ? '👁️ แสดงทั้งหมด' : '👁️‍🗨️ ซ่อนที่ปิดใช้งาน'}
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>⏳ กำลังโหลด...</div>
          ) : filteredCustomers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              📭 ไม่พบข้อมูลลูกค้า
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="cartoon-table">
                <thead>
                  <tr>
                    <th>รหัสลูกค้า</th>
                    <th>ชื่อลูกค้า</th>
                    <th style={{ textAlign: 'center' }}>สถานะ</th>
                    <th style={{ textAlign: 'center' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td style={{ fontWeight: '800', fontFamily: "'Nunito', sans-serif", color: 'var(--color-text-primary)' }}>{customer.customer_code}</td>
                      <td style={{ fontWeight: '600' }}>{customer.customer_name}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="cartoon-badge" style={{
                          background: customer.is_active ? '#D1FAE5' : '#FEE2E2',
                          color: customer.is_active ? '#047857' : '#B91C1C',
                        }}>
                          {customer.is_active ? '✅ ใช้งาน' : '❌ ไม่ใช้งาน'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={() => handleEdit(customer)} className="cartoon-btn" style={{ padding: '6px 12px', background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)', fontSize: '13px' }}>✏️</button>
                          <button onClick={() => handleDelete(customer.id)} className="cartoon-btn" style={{ padding: '6px 12px', background: '#FEE2E2', color: '#EF4444', fontSize: '13px' }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ marginTop: '16px', fontSize: '12px', color: '#64748B', textAlign: 'right' }}>
            แสดง {filteredCustomers.length} จากทั้งหมด {customers.length} รายการ
          </div>
        </div>
      </div>
    </div>
  )
}
