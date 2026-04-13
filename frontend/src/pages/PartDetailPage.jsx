import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '../context/UserContext'
import { partsAPI } from '../api/parts'
import { pricesAPI } from '../api/prices'
import client from '../api/client'
import AppShell from '../components/layout/AppShell'
import UrgencyBadge from '../components/common/UrgencyBadge'
import StatusBadge from '../components/common/StatusBadge'

export default function PartDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useUser()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({})
  const [showAddPriceModal, setShowAddPriceModal] = useState(false)
  const [priceModalCategory, setPriceModalCategory] = useState(null) // 'A' or 'B'
  const [editingPriceId, setEditingPriceId] = useState(null)
  const [newPrice, setNewPrice] = useState({
    supplier_name: '',
    supplier_category: '',
    price: '',
    currency: 'EUR',
    notes: '',
    date_checked: '',
    checked_by: currentUser,
  })

  const openPriceModalA = () => { setPriceModalCategory('A'); setShowAddPriceModal(true) }
  const openPriceModalB = () => { setPriceModalCategory('B'); setShowAddPriceModal(true) }

  const { data: part, isLoading } = useQuery({
    queryKey: ['parts', id],
    queryFn: () => partsAPI.get(id),
    select: (res) => res.data,
  })

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => client.get('/suppliers'),
    select: (res) => res.data || [],
    staleTime: 10000, // Cache for 10 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
  })

  const { data: config = {} } = useQuery({
    queryKey: ['config'],
    queryFn: () => client.get('/config'),
    select: (res) => res.data,
  })

  const { data: prices = [] } = useQuery({
    queryKey: ['prices', id],
    queryFn: () => pricesAPI.getForPart(id),
    select: (res) => res.data || [],
    enabled: !!part,
  })

  const { data: activities = [] } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => client.get(`/activity/part/${id}`),
    select: (res) => res.data || [],
    enabled: !!part,
  })

  const handleStatusChange = async (newStatus) => {
    try {
      await partsAPI.updateStatus(id, newStatus, currentUser)
      queryClient.invalidateQueries(['parts', id])
      queryClient.invalidateQueries(['activity', id])
    } catch (error) {
      alert('Error updating status: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleSaveEdit = async () => {
    try {
      await partsAPI.update(id, editData, currentUser)
      queryClient.invalidateQueries(['parts', id])
      queryClient.invalidateQueries(['activity', id])
      setIsEditing(false)
    } catch (error) {
      alert('Error updating part: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleAddPrice = async () => {
    if (!newPrice.supplier_name) {
      alert('Please select a supplier')
      return
    }

    try {
      if (editingPriceId) {
        // Update existing price
        await pricesAPI.update(editingPriceId, {
          price: newPrice.price ? parseFloat(newPrice.price) : null,
          currency: newPrice.currency,
          notes: newPrice.notes,
          date_checked: newPrice.date_checked,
        }, currentUser)
      } else {
        // Add new price
        await pricesAPI.add(id, {
          ...newPrice,
          price: newPrice.price ? parseFloat(newPrice.price) : null,
          checked_by: currentUser,
        }, currentUser)
      }
      queryClient.invalidateQueries(['prices', id])
      queryClient.invalidateQueries(['activity', id])
      queryClient.invalidateQueries(['suppliers'])
      setShowAddPriceModal(false)
      setPriceModalCategory(null)
      setEditingPriceId(null)
      setNewPrice({
        supplier_name: '',
        supplier_category: '',
        price: '',
        currency: 'EUR',
        notes: '',
        date_checked: '',
        checked_by: currentUser,
      })
    } catch (error) {
      alert('Error: ' + (error.response?.data?.detail || error.message))
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="text-center py-8">Loading...</div>
      </AppShell>
    )
  }

  if (!part) {
    return (
      <AppShell>
        <div className="text-center py-8 text-red-600">Part not found</div>
      </AppShell>
    )
  }

  const inCountryPrices = prices.filter(p => p.supplier_category === 'A')
  const webPrices = prices.filter(p => p.supplier_category === 'B')

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:text-blue-800 mb-2"
            >
              ← Back to Parts
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{part.part_number}</h1>
            <p className="text-gray-600 mt-1">{part.description}</p>
          </div>
        </div>

        {/* Part Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Part Information</h3>
              <div className="space-y-3">
                {!isEditing ? (
                  <>
                    <div>
                      <p className="text-xs text-gray-500">Requested By (Client)</p>
                      <p className="text-gray-900 font-semibold">{part.requested_by}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Logged By</p>
                      <p className="text-gray-900">{part.logged_by}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Quantity</p>
                      <p className="text-gray-900">{part.quantity || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Used In</p>
                      <p className="text-gray-900">{part.used_in || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Urgency</p>
                      <div className="mt-1">
                        <UrgencyBadge urgency={part.urgency} />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditData({
                          description: part.description,
                          requested_by: part.requested_by,
                          quantity: part.quantity,
                          used_in: part.used_in,
                          urgency: part.urgency,
                        })
                        setIsEditing(true)
                      }}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      Edit
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-xs text-gray-500">Requested By</label>
                      <input
                        type="text"
                        value={editData.requested_by || ''}
                        onChange={(e) => setEditData({...editData, requested_by: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Description</label>
                      <input
                        type="text"
                        value={editData.description || ''}
                        onChange={(e) => setEditData({...editData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Quantity</label>
                      <input
                        type="number"
                        value={editData.quantity || ''}
                        onChange={(e) => setEditData({...editData, quantity: e.target.value ? parseInt(e.target.value) : null})}
                        className="w-full px-3 py-2 border border-gray-300 rounded mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Used In</label>
                      <input
                        type="text"
                        value={editData.used_in || ''}
                        onChange={(e) => setEditData({...editData, used_in: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Urgency</label>
                      <select
                        value={editData.urgency || 3}
                        onChange={(e) => setEditData({...editData, urgency: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded mt-1"
                      >
                        <option value="1">Low (1)</option>
                        <option value="2">Medium (2)</option>
                        <option value="3">High (3)</option>
                        <option value="4">Urgent (4)</option>
                        <option value="5">Critical (5)</option>
                      </select>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Status & Timeline</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Current Status</p>
                  <select
                    value={part.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {config.statuses?.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <StatusBadge status={part.status} />
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-gray-900">{new Date(part.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Updated</p>
                  <p className="text-gray-900">{new Date(part.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Price Comparison */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Price Comparison</h2>

          {/* In-Country Suppliers */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">In-Country Suppliers (Category A)</h3>
              <button
                onClick={openPriceModalA}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Add Price
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Supplier</th>
                    <th className="px-4 py-2 text-left">Price</th>
                    <th className="px-4 py-2 text-left">Currency</th>
                    <th className="px-4 py-2 text-left">Checked By</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Notes</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {inCountryPrices.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-4 text-center text-gray-500">No prices entered</td>
                    </tr>
                  ) : (
                    inCountryPrices.map(price => (
                      <tr key={price.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold">{price.supplier_name}</td>
                        <td className="px-4 py-3">{price.price ? parseFloat(price.price).toFixed(2) : 'N/A'}</td>
                        <td className="px-4 py-3">{price.currency}</td>
                        <td className="px-4 py-3">{price.checked_by}</td>
                        <td className="px-4 py-3">{price.date_checked || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-600">{price.notes || '-'}</td>
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            onClick={() => {
                              setNewPrice({
                                supplier_name: price.supplier_name,
                                supplier_category: price.supplier_category,
                                price: price.price || '',
                                currency: price.currency,
                                notes: price.notes || '',
                                date_checked: price.date_checked || '',
                                checked_by: currentUser,
                              })
                              setEditingPriceId(price.id)
                              setPriceModalCategory(price.supplier_category)
                              setShowAddPriceModal(true)
                            }}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete price for ${price.supplier_name}?`)) {
                                pricesAPI.delete(price.id, currentUser).then(() => {
                                  queryClient.invalidateQueries(['prices', id])
                                }).catch(err => alert('Error: ' + (err.response?.data?.detail || err.message)))
                              }
                            }}
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Web/Import Suppliers */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Web/Import Suppliers (Category B)</h3>
              <button
                onClick={openPriceModalB}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Add Price
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Supplier</th>
                    <th className="px-4 py-2 text-left">Price</th>
                    <th className="px-4 py-2 text-left">Currency</th>
                    <th className="px-4 py-2 text-left">Checked By</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Notes</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {webPrices.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-4 text-center text-gray-500">No prices entered</td>
                    </tr>
                  ) : (
                    webPrices.map(price => (
                      <tr key={price.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold">{price.supplier_name}</td>
                        <td className="px-4 py-3">{price.price ? parseFloat(price.price).toFixed(2) : 'N/A'}</td>
                        <td className="px-4 py-3">{price.currency}</td>
                        <td className="px-4 py-3">{price.checked_by}</td>
                        <td className="px-4 py-3">{price.date_checked || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-600">{price.notes || '-'}</td>
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            onClick={() => {
                              setNewPrice({
                                supplier_name: price.supplier_name,
                                supplier_category: price.supplier_category,
                                price: price.price || '',
                                currency: price.currency,
                                notes: price.notes || '',
                                date_checked: price.date_checked || '',
                                checked_by: currentUser,
                              })
                              setEditingPriceId(price.id)
                              setPriceModalCategory(price.supplier_category)
                              setShowAddPriceModal(true)
                            }}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete price for ${price.supplier_name}?`)) {
                                pricesAPI.delete(price.id, currentUser).then(() => {
                                  queryClient.invalidateQueries(['prices', id])
                                }).catch(err => alert('Error: ' + (err.response?.data?.detail || err.message)))
                              }
                            }}
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Log</h2>
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No activity yet</p>
            ) : (
              activities.map(log => (
                <div key={log.id} className="flex items-start gap-4 pb-3 border-b last:border-b-0">
                  <div className="text-sm text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{log.action_type}</p>
                    <p className="text-sm text-gray-600">{log.action_detail}</p>
                  </div>
                  <div className="text-sm text-gray-700 font-semibold">
                    {log.performed_by}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Price Modal */}
      {showAddPriceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingPriceId ? 'Edit' : 'Add'} Price - {priceModalCategory === 'A' ? 'In-Country' : 'Web/Import'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier *</label>
                <select
                  value={newPrice.supplier_name}
                  onChange={(e) => {
                    const supplier = suppliers.find(s => s.name === e.target.value)
                    setNewPrice({
                      ...newPrice,
                      supplier_name: e.target.value,
                      supplier_category: supplier?.category || ''
                    })
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select supplier...</option>
                  {suppliers
                    .filter(s => s.category === priceModalCategory)
                    .map(supplier => (
                      <option key={supplier.name} value={supplier.name}>
                        {supplier.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPrice.price}
                  onChange={(e) => setNewPrice({...newPrice, price: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
                <select
                  value={newPrice.currency}
                  onChange={(e) => setNewPrice({...newPrice, currency: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="CHF">CHF</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date Checked</label>
                <input
                  type="date"
                  value={newPrice.date_checked}
                  onChange={(e) => setNewPrice({...newPrice, date_checked: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={newPrice.notes}
                  onChange={(e) => setNewPrice({...newPrice, notes: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any notes about this price..."
                  rows="3"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowAddPriceModal(false)
                  setPriceModalCategory(null)
                  setEditingPriceId(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPrice}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {editingPriceId ? 'Update' : 'Add'} Price
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
