import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '../context/UserContext'
import { inquiriesAPI, partsAPI } from '../api/inquiries'
import { pricesAPI } from '../api/prices'
import { activityAPI } from '../api/activity'
import { statusesAPI } from '../api/statuses'
import client from '../api/client'
import AppShell from '../components/layout/AppShell'
import UrgencyBadge from '../components/common/UrgencyBadge'
import StatusBadge from '../components/common/StatusBadge'

const emptyPart = () => ({
  part_number: '',
  description: '',
  quantity: '',
  used_in: '',
  urgency: 3,
  status: 'Pending',
})

export default function InquiryDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useUser()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({})

  const [editingPartId, setEditingPartId] = useState(null)
  const [partEditData, setPartEditData] = useState({})

  const [showAddPartModal, setShowAddPartModal] = useState(false)
  const [newPart, setNewPart] = useState(emptyPart())

  const [pricesModal, setPricesModal] = useState(null) // {partId, category}
  const [editingPriceId, setEditingPriceId] = useState(null)
  const [newPrice, setNewPrice] = useState({
    supplier_name: '',
    supplier_category: '',
    price: '',
    currency: 'EUR',
    notes: '',
  })

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: inquiry, isLoading } = useQuery({
    queryKey: ['inquiry', id],
    queryFn: () => inquiriesAPI.get(id),
    select: (res) => res.data,
  })

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => client.get('/suppliers'),
    select: (res) => res.data || [],
    staleTime: 10000,
  })

  const { data: config = {} } = useQuery({
    queryKey: ['config'],
    queryFn: () => client.get('/config'),
    select: (res) => res.data,
  })

  const { data: inquiryStatuses = [] } = useQuery({
    queryKey: ['statuses', 'inquiry'],
    queryFn: () => statusesAPI.list('inquiry'),
    select: (res) => res.data,
  })

  const { data: partStatuses = [] } = useQuery({
    queryKey: ['statuses', 'part'],
    queryFn: () => statusesAPI.list('part'),
    select: (res) => res.data,
  })

  const { data: activities = [] } = useQuery({
    queryKey: ['activity-inquiry', id],
    queryFn: () => activityAPI.forInquiry(id),
    select: (res) => res.data || [],
    enabled: !!inquiry,
  })

  const refreshAll = () => {
    queryClient.invalidateQueries(['inquiry', id])
    queryClient.invalidateQueries(['activity-inquiry', id])
    queryClient.invalidateQueries(['inquiries'])
  }

  // ===== Inquiry actions =====

  const handleStatusChange = async (status) => {
    try {
      await inquiriesAPI.updateStatus(id, status, currentUser)
      refreshAll()
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detail || e.message))
    }
  }

  const handleSaveInquiryEdit = async () => {
    try {
      await inquiriesAPI.update(id, editData, currentUser)
      refreshAll()
      setIsEditing(false)
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detail || e.message))
    }
  }

  const handleDeleteInquiry = async () => {
    try {
      await inquiriesAPI.delete(id, currentUser)
      navigate('/dashboard')
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detail || e.message))
    }
  }

  // ===== Part actions =====

  const handleAddPart = async () => {
    if (!newPart.part_number.trim()) {
      alert('Part number is required')
      return
    }
    try {
      await partsAPI.addToInquiry(
        id,
        {
          ...newPart,
          part_number: newPart.part_number.trim(),
          description: newPart.description.trim() || null,
          used_in: newPart.used_in.trim() || null,
          quantity: newPart.quantity ? parseInt(newPart.quantity) : null,
          urgency: newPart.urgency ? parseInt(newPart.urgency) : null,
        },
        currentUser,
      )
      refreshAll()
      setShowAddPartModal(false)
      setNewPart(emptyPart())
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detail || e.message))
    }
  }

  const handlePartStatusChange = async (partId, status) => {
    try {
      await partsAPI.updateStatus(partId, status, currentUser)
      refreshAll()
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detail || e.message))
    }
  }

  const handleSavePartEdit = async (partId) => {
    try {
      const data = {
        ...partEditData,
        quantity: partEditData.quantity !== '' && partEditData.quantity !== null
          ? parseInt(partEditData.quantity)
          : null,
        urgency: partEditData.urgency ? parseInt(partEditData.urgency) : null,
      }
      await partsAPI.update(partId, data, currentUser)
      refreshAll()
      setEditingPartId(null)
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detail || e.message))
    }
  }

  const handleDeletePart = async (partId, partNumber) => {
    if (!window.confirm(`Delete part ${partNumber} from this inquiry?`)) return
    try {
      await partsAPI.delete(partId, currentUser)
      refreshAll()
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detail || e.message))
    }
  }

  // ===== Price actions =====

  const openAddPrice = (partId, category) => {
    setPricesModal({ partId, category })
    setEditingPriceId(null)
    setNewPrice({
      supplier_name: '',
      supplier_category: category,
      price: '',
      currency: 'EUR',
      notes: '',
    })
  }

  const openEditPrice = (partId, price) => {
    setPricesModal({ partId, category: price.supplier_category })
    setEditingPriceId(price.id)
    setNewPrice({
      supplier_name: price.supplier_name,
      supplier_category: price.supplier_category,
      price: price.price ?? '',
      currency: price.currency,
      notes: price.notes || '',
    })
  }

  const handleSavePrice = async () => {
    if (!newPrice.supplier_name) {
      alert('Select a supplier')
      return
    }
    const partId = pricesModal.partId
    try {
      if (editingPriceId) {
        await pricesAPI.update(
          editingPriceId,
          {
            price: newPrice.price !== '' ? parseFloat(newPrice.price) : null,
            currency: newPrice.currency,
            notes: newPrice.notes,
          },
          currentUser,
        )
      } else {
        await pricesAPI.add(
          partId,
          {
            ...newPrice,
            price: newPrice.price !== '' ? parseFloat(newPrice.price) : null,
            checked_by: currentUser,
          },
          currentUser,
        )
      }
      refreshAll()
      setPricesModal(null)
      setEditingPriceId(null)
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detail || e.message))
    }
  }

  const handleDeletePrice = async (priceId, supplierName) => {
    if (!window.confirm(`Delete price for ${supplierName}?`)) return
    try {
      await pricesAPI.delete(priceId, currentUser)
      refreshAll()
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detail || e.message))
    }
  }

  if (isLoading) {
    return <AppShell><div className="text-center py-8">Loading...</div></AppShell>
  }

  if (!inquiry) {
    return <AppShell><div className="text-center py-8 text-red-600">Inquiry not found</div></AppShell>
  }

  const completedStatuses = config.completed_statuses || ['Delivered', 'Cancelled']
  const isCompleted = completedStatuses.includes(inquiry.status)

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:text-blue-800 mb-2 text-sm"
            >
              ← Back to Inquiries
            </button>
            <h1 className="text-3xl font-bold text-slate-900">{inquiry.requested_by}</h1>
            <p className="text-slate-600 mt-1 text-sm">
              Inquiry #{inquiry.id} · {inquiry.parts.length} part{inquiry.parts.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isCompleted && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm"
                title="Inquiry is completed — safe to delete"
              >
                Delete Inquiry
              </button>
            )}
            {!isCompleted && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition text-sm"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Inquiry info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Inquiry Information</h3>
              {!isEditing ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">Client</p>
                    <p className="text-slate-900 font-semibold">{inquiry.requested_by}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Logged By</p>
                    <p className="text-slate-900">{inquiry.logged_by}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Urgency</p>
                    <div className="mt-1"><UrgencyBadge urgency={inquiry.urgency} /></div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Notes</p>
                    <p className="text-slate-900 text-sm">{inquiry.notes || '—'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditData({
                        requested_by: inquiry.requested_by,
                        urgency: inquiry.urgency,
                        notes: inquiry.notes || '',
                      })
                      setIsEditing(true)
                    }}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500">Client</label>
                    <input
                      type="text"
                      value={editData.requested_by || ''}
                      onChange={(e) => setEditData({ ...editData, requested_by: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Urgency</label>
                    <select
                      value={editData.urgency ?? ''}
                      onChange={(e) => setEditData({ ...editData, urgency: e.target.value === '' ? null : parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                    >
                      <option value="">— None —</option>
                      <option value="1">Low (1)</option>
                      <option value="2">Medium (2)</option>
                      <option value="3">High (3)</option>
                      <option value="4">Urgent (4)</option>
                      <option value="5">Critical (5)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Notes</label>
                    <textarea
                      value={editData.notes || ''}
                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                      rows="2"
                      className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveInquiryEdit}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-slate-300 text-slate-900 rounded-lg hover:bg-slate-400 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Status & Timeline</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 mb-2">Inquiry Status</p>
                  <select
                    value={inquiry.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  >
                    {inquiryStatuses.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div><StatusBadge status={inquiry.status} /></div>
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500">Created</p>
                  <p className="text-slate-900 text-sm">{new Date(inquiry.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last updated</p>
                  <p className="text-slate-900 text-sm">{new Date(inquiry.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Parts */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Parts ({inquiry.parts.length})</h2>
            <button
              onClick={() => setShowAddPartModal(true)}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm"
            >
              + Add Part
            </button>
          </div>

          <div className="space-y-6">
            {inquiry.parts.map((part) => (
              <PartCard
                key={part.id}
                part={part}
                partStatuses={partStatuses}
                suppliers={suppliers}
                isEditing={editingPartId === part.id}
                onStartEdit={() => {
                  setEditingPartId(part.id)
                  setPartEditData({
                    part_number: part.part_number,
                    description: part.description,
                    quantity: part.quantity ?? '',
                    used_in: part.used_in || '',
                    urgency: part.urgency,
                  })
                }}
                onCancelEdit={() => setEditingPartId(null)}
                partEditData={partEditData}
                setPartEditData={setPartEditData}
                onSaveEdit={() => handleSavePartEdit(part.id)}
                onStatusChange={(s) => handlePartStatusChange(part.id, s)}
                onDelete={() => handleDeletePart(part.id, part.part_number)}
                onOpenAddPrice={(cat) => openAddPrice(part.id, cat)}
                onOpenEditPrice={(price) => openEditPrice(part.id, price)}
                onDeletePrice={(priceId, supplierName) => handleDeletePrice(priceId, supplierName)}
              />
            ))}
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Activity Log</h2>
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No activity yet</p>
            ) : (
              activities.map((log) => (
                <div key={log.id} className="flex items-start gap-4 pb-3 border-b last:border-b-0">
                  <div className="text-sm text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 text-sm">{log.action_type.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-slate-600">{log.action_detail}</p>
                  </div>
                  <div className="text-sm text-slate-700 font-semibold">{log.performed_by}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Part Modal */}
      {showAddPartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-xl w-full">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Add Part to Inquiry</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newPart.part_number}
                  onChange={(e) => setNewPart({ ...newPart, part_number: e.target.value })}
                  placeholder="Part number *"
                  className="px-3 py-2 border border-slate-300 rounded text-sm"
                />
                <input
                  type="text"
                  value={newPart.description}
                  onChange={(e) => setNewPart({ ...newPart, description: e.target.value })}
                  placeholder="Description"
                  className="px-3 py-2 border border-slate-300 rounded text-sm"
                />
                <input
                  type="number"
                  value={newPart.quantity}
                  onChange={(e) => setNewPart({ ...newPart, quantity: e.target.value })}
                  placeholder="Quantity"
                  className="px-3 py-2 border border-slate-300 rounded text-sm"
                />
                <input
                  type="text"
                  value={newPart.used_in}
                  onChange={(e) => setNewPart({ ...newPart, used_in: e.target.value })}
                  placeholder="Used in"
                  className="px-3 py-2 border border-slate-300 rounded text-sm"
                />
                <select
                  value={newPart.urgency}
                  onChange={(e) => setNewPart({ ...newPart, urgency: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded text-sm"
                >
                  <option value="">Urgency: — None —</option>
                  <option value="1">Urgency: Low (1)</option>
                  <option value="2">Urgency: Medium (2)</option>
                  <option value="3">Urgency: High (3)</option>
                  <option value="4">Urgency: Urgent (4)</option>
                  <option value="5">Urgency: Critical (5)</option>
                </select>
                <select
                  value={newPart.status}
                  onChange={(e) => setNewPart({ ...newPart, status: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded text-sm"
                >
                  {partStatuses.map((s) => (
                    <option key={s.id} value={s.name}>Status: {s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-4">
              <button
                onClick={() => { setShowAddPartModal(false); setNewPart(emptyPart()) }}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPart}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                Add Part
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Price Modal */}
      {pricesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {editingPriceId ? 'Edit' : 'Add'} Price · {pricesModal.category === 'A' ? 'In-Country' : 'Web/Import'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">Date is set automatically when saved.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Supplier *</label>
                <select
                  value={newPrice.supplier_name}
                  onChange={(e) => {
                    const s = suppliers.find((x) => x.name === e.target.value)
                    setNewPrice({
                      ...newPrice,
                      supplier_name: e.target.value,
                      supplier_category: s?.category || pricesModal.category,
                    })
                  }}
                  disabled={!!editingPriceId}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                >
                  <option value="">Select supplier...</option>
                  {suppliers
                    .filter((s) => s.category === pricesModal.category)
                    .map((s) => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPrice.price}
                  onChange={(e) => setNewPrice({ ...newPrice, price: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Currency</label>
                <select
                  value={newPrice.currency}
                  onChange={(e) => setNewPrice({ ...newPrice, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="CHF">CHF</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                <textarea
                  value={newPrice.notes}
                  onChange={(e) => setNewPrice({ ...newPrice, notes: e.target.value })}
                  rows="2"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-4">
              <button
                onClick={() => { setPricesModal(null); setEditingPriceId(null) }}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrice}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                {editingPriceId ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Delete this inquiry?</h2>
              {!isCompleted && (
                <p className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded p-3 mb-3">
                  ⚠ This inquiry is still <strong>{inquiry.status}</strong>. Are you sure it's completed?
                </p>
              )}
              <p className="text-sm text-slate-600 mb-4">
                This will permanently delete the inquiry, all <strong>{inquiry.parts.length}</strong> part(s),
                and all associated supplier prices. The activity log stays.
              </p>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteInquiry}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}


function PartCard({
  part, partStatuses, suppliers,
  isEditing, onStartEdit, onCancelEdit,
  partEditData, setPartEditData, onSaveEdit,
  onStatusChange, onDelete,
  onOpenAddPrice, onOpenEditPrice, onDeletePrice,
}) {
  const inCountry = part.supplier_prices.filter((p) => p.supplier_category === 'A')
  const web = part.supplier_prices.filter((p) => p.supplier_category === 'B')

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-50 px-5 py-4 flex items-start justify-between border-b border-slate-200">
        <div className="flex-1">
          {isEditing ? (
            <div className="grid grid-cols-2 gap-2">
              <input
                value={partEditData.part_number || ''}
                onChange={(e) => setPartEditData({ ...partEditData, part_number: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded text-sm font-semibold"
                placeholder="Part number"
              />
              <input
                value={partEditData.description || ''}
                onChange={(e) => setPartEditData({ ...partEditData, description: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded text-sm"
                placeholder="Description"
              />
              <input
                type="number"
                value={partEditData.quantity ?? ''}
                onChange={(e) => setPartEditData({ ...partEditData, quantity: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded text-sm"
                placeholder="Quantity"
              />
              <input
                value={partEditData.used_in || ''}
                onChange={(e) => setPartEditData({ ...partEditData, used_in: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded text-sm"
                placeholder="Used in"
              />
              <select
                value={partEditData.urgency ?? ''}
                onChange={(e) => setPartEditData({ ...partEditData, urgency: e.target.value === '' ? null : parseInt(e.target.value) })}
                className="px-3 py-2 border border-slate-300 rounded text-sm"
              >
                <option value="">Urgency: — None —</option>
                <option value="1">Urgency: Low (1)</option>
                <option value="2">Urgency: Medium (2)</option>
                <option value="3">Urgency: High (3)</option>
                <option value="4">Urgency: Urgent (4)</option>
                <option value="5">Urgency: Critical (5)</option>
              </select>
            </div>
          ) : (
            <>
              <p className="font-bold text-lg text-slate-900">{part.part_number}</p>
              {part.description && <p className="text-sm text-slate-700">{part.description}</p>}
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-600">
                {part.quantity != null && <span>Qty: <strong>{part.quantity}</strong></span>}
                {part.used_in && <span>Used in: <strong>{part.used_in}</strong></span>}
              </div>
            </>
          )}
        </div>
        <div className="flex items-start gap-2 ml-4">
          {!isEditing && (
            <>
              <UrgencyBadge urgency={part.urgency} />
              <select
                value={part.status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="px-2 py-1 border border-slate-300 rounded text-xs"
              >
                {partStatuses.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      <div className="px-5 py-3 flex items-center justify-end gap-2 border-b border-slate-200 bg-white">
        {isEditing ? (
          <>
            <button onClick={onSaveEdit} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Save</button>
            <button onClick={onCancelEdit} className="px-3 py-1 bg-slate-300 text-slate-900 rounded text-xs hover:bg-slate-400">Cancel</button>
          </>
        ) : (
          <>
            <button onClick={onStartEdit} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Edit</button>
            <button onClick={onDelete} className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">Delete</button>
          </>
        )}
      </div>

      {part.suggested_price != null ? (
        <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100 text-sm">
          Suggested price: <strong>{part.suggested_price.toFixed(2)} EUR</strong>
          <span className="text-slate-500 ml-2">
            (best {part.best_price?.toFixed(2)} € × {part.applied_multiplier})
          </span>
        </div>
      ) : part.best_price != null ? (
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 text-sm text-amber-800">
          Best EUR price {part.best_price.toFixed(2)} € — no matching pricing band configured.
        </div>
      ) : null}

      <PriceTable
        title="In-Country Suppliers (Category A)"
        category="A"
        prices={inCountry}
        onAdd={() => onOpenAddPrice('A')}
        onEdit={onOpenEditPrice}
        onDelete={onDeletePrice}
      />
      <PriceTable
        title="Web/Import Suppliers (Category B)"
        category="B"
        prices={web}
        onAdd={() => onOpenAddPrice('B')}
        onEdit={onOpenEditPrice}
        onDelete={onDeletePrice}
      />
    </div>
  )
}


function PriceTable({ title, prices, onAdd, onEdit, onDelete }) {
  return (
    <div className="px-5 py-4 border-b border-slate-100 last:border-b-0">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
        <button
          onClick={onAdd}
          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
        >
          + Add Price
        </button>
      </div>
      {prices.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">No prices entered.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Supplier</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Price</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">By</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Date</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Notes</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {prices.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-semibold">{p.supplier_name}</td>
                  <td className="px-3 py-2">
                    {p.price != null ? `${parseFloat(p.price).toFixed(2)} ${p.currency}` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{p.checked_by}</td>
                  <td className="px-3 py-2 text-slate-600">{new Date(p.date_checked).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-slate-600">{p.notes || '—'}</td>
                  <td className="px-3 py-2 flex gap-2">
                    <button onClick={() => onEdit(p)} className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Edit</button>
                    <button onClick={() => onDelete(p.id, p.supplier_name)} className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
