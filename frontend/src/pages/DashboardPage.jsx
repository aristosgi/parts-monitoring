import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { partsAPI } from '../api/parts'
import client from '../api/client'
import AppShell from '../components/layout/AppShell'
import UrgencyBadge from '../components/common/UrgencyBadge'
import StatusBadge from '../components/common/StatusBadge'

export default function DashboardPage() {
  const { currentUser } = useUser()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [filters, setFilters] = useState({
    search: '',
    logged_by: '',
    urgency: '',
    status: ''
  })
  const [showAddModal, setShowAddModal] = useState(false)
  const [newPart, setNewPart] = useState({
    part_number: '',
    description: '',
    requested_by: '',
    quantity: '',
    used_in: '',
    urgency: 3,
    status: 'Pending',
    logged_by: currentUser,
  })

  const { data: parts = [], isLoading } = useQuery({
    queryKey: ['parts', filters],
    queryFn: () => partsAPI.list(filters),
    select: (res) => res.data,
  })

  const { data: config = {} } = useQuery({
    queryKey: ['config'],
    queryFn: () => client.get('/config'),
    select: (res) => res.data,
  })

  const handleAddPart = async () => {
    if (!newPart.part_number || !newPart.description) {
      alert('Part number and description are required')
      return
    }

    try {
      await partsAPI.create({
        ...newPart,
        quantity: newPart.quantity ? parseInt(newPart.quantity) : null,
        urgency: parseInt(newPart.urgency),
        logged_by: currentUser,
      })
      queryClient.invalidateQueries(['parts'])
      setShowAddModal(false)
      setNewPart({
        part_number: '',
        description: '',
        requested_by: '',
        quantity: '',
        used_in: '',
        urgency: 3,
        status: 'Pending',
        logged_by: currentUser,
      })
    } catch (error) {
      alert('Error adding part: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Parts Inventory</h1>
            <p className="text-slate-600 text-sm mt-1">Manage and track part numbers</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium"
          >
            Add Part
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-900 mb-4">Filters</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search part number, description, or client..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
            />

            <select
              value={filters.logged_by}
              onChange={(e) => handleFilterChange('logged_by', e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
            >
              <option value="">All Users</option>
              <option value="Simos">Simos</option>
              <option value="Lenia">Lenia</option>
              <option value="Dimitris">Dimitris</option>
            </select>

            <select
              value={filters.urgency}
              onChange={(e) => handleFilterChange('urgency', e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
            >
              <option value="">All Urgencies</option>
              <option value="1">Low (1)</option>
              <option value="2">Medium (2)</option>
              <option value="3">High (3)</option>
              <option value="4">Urgent (4)</option>
              <option value="5">Critical (5)</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
            >
              <option value="">All Statuses</option>
              {config.statuses?.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : parts.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No parts found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Part Number</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Client</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Logged By</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Urgency</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {parts.map(part => (
                  <tr
                    key={part.id}
                    onClick={() => navigate(`/parts/${part.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{part.part_number}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{part.description}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{part.requested_by}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{part.logged_by}</td>
                    <td className="px-6 py-4 text-sm"><UrgencyBadge urgency={part.urgency} /></td>
                    <td className="px-6 py-4 text-sm"><StatusBadge status={part.status} /></td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(part.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Part Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">Add New Part</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Part Number *</label>
                <input
                  type="text"
                  value={newPart.part_number}
                  onChange={(e) => setNewPart({...newPart, part_number: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="e.g., ABC-123-456"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description *</label>
                <input
                  type="text"
                  value={newPart.description}
                  onChange={(e) => setNewPart({...newPart, description: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="What is this part?"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Requested By (Client) *</label>
                <input
                  type="text"
                  value={newPart.requested_by}
                  onChange={(e) => setNewPart({...newPart, requested_by: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="Client or customer name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Quantity (Optional)</label>
                <input
                  type="number"
                  value={newPart.quantity}
                  onChange={(e) => setNewPart({...newPart, quantity: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="How many?"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Where It's Used</label>
                <input
                  type="text"
                  value={newPart.used_in}
                  onChange={(e) => setNewPart({...newPart, used_in: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="Application or system"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Urgency (1-5)</label>
                  <select
                    value={newPart.urgency}
                    onChange={(e) => setNewPart({...newPart, urgency: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    <option value="1">Low (1)</option>
                    <option value="2">Medium (2)</option>
                    <option value="3">High (3)</option>
                    <option value="4">Urgent (4)</option>
                    <option value="5">Critical (5)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                  <select
                    value={newPart.status}
                    onChange={(e) => setNewPart({...newPart, status: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    {config.statuses?.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPart}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium"
              >
                Add Part
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
