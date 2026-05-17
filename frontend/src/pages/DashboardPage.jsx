import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { inquiriesAPI } from '../api/inquiries'
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

export default function DashboardPage() {
  const { currentUser } = useUser()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [filters, setFilters] = useState({
    search: '',
    logged_by: '',
    urgency: '',
    status: '',
  })

  const [showAddModal, setShowAddModal] = useState(false)
  const [newInquiry, setNewInquiry] = useState({
    requested_by: '',
    notes: '',
    urgency: 3,
    status: 'Pending',
    parts: [emptyPart()],
  })

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['inquiries', filters],
    queryFn: () => inquiriesAPI.list(filters),
    select: (res) => res.data,
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

  const resetForm = () => {
    setNewInquiry({
      requested_by: '',
      notes: '',
      urgency: 3,
      status: 'Pending',
      parts: [emptyPart()],
    })
  }

  const updatePartField = (idx, field, value) => {
    setNewInquiry((prev) => {
      const parts = prev.parts.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
      return { ...prev, parts }
    })
  }

  const addPartRow = () => {
    setNewInquiry((prev) => ({ ...prev, parts: [...prev.parts, emptyPart()] }))
  }

  const removePartRow = (idx) => {
    setNewInquiry((prev) => ({
      ...prev,
      parts: prev.parts.length === 1 ? prev.parts : prev.parts.filter((_, i) => i !== idx),
    }))
  }

  const handleCreate = async () => {
    if (!newInquiry.requested_by.trim()) {
      alert('Client name is required')
      return
    }
    const cleanParts = newInquiry.parts
      .filter((p) => p.part_number.trim() && p.description.trim())
      .map((p) => ({
        ...p,
        part_number: p.part_number.trim(),
        description: p.description.trim(),
        quantity: p.quantity ? parseInt(p.quantity) : null,
        urgency: parseInt(p.urgency),
      }))

    if (cleanParts.length === 0) {
      alert('Add at least one part with a part number and description')
      return
    }

    try {
      await inquiriesAPI.create({
        requested_by: newInquiry.requested_by.trim(),
        notes: newInquiry.notes.trim() || null,
        urgency: parseInt(newInquiry.urgency),
        status: newInquiry.status,
        logged_by: currentUser,
        parts: cleanParts,
      })
      queryClient.invalidateQueries(['inquiries'])
      setShowAddModal(false)
      resetForm()
    } catch (error) {
      alert('Error creating inquiry: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Inquiries</h1>
            <p className="text-slate-600 text-sm mt-1">Track customer inquiries and the parts they need</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium"
          >
            New Inquiry
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-900 mb-4">Filters</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search client, part number, or description..."
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
              {config.users?.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
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
              {inquiryStatuses.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : inquiries.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No inquiries found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Client</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Parts</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Logged By</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Urgency</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {inquiries.map((inq) => (
                  <tr
                    key={inq.id}
                    onClick={() => navigate(`/inquiries/${inq.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{inq.requested_by}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded font-semibold">
                          {inq.part_count} part{inq.part_count === 1 ? '' : 's'}
                        </span>
                        {inq.part_numbers.slice(0, 3).map((pn) => (
                          <span key={pn} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            {pn}
                          </span>
                        ))}
                        {inq.part_numbers.length > 3 && (
                          <span className="text-xs text-slate-500 px-2 py-1">
                            +{inq.part_numbers.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{inq.logged_by}</td>
                    <td className="px-6 py-4 text-sm"><UrgencyBadge urgency={inq.urgency} /></td>
                    <td className="px-6 py-4 text-sm"><StatusBadge status={inq.status} /></td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(inq.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* New Inquiry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">New Inquiry</h2>
              <p className="text-sm text-slate-500 mt-1">
                One inquiry per customer request — add all the parts they're asking about.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Client / Customer *</label>
                <input
                  type="text"
                  value={newInquiry.requested_by}
                  onChange={(e) => setNewInquiry({ ...newInquiry, requested_by: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="Customer name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Urgency (1-5)</label>
                  <select
                    value={newInquiry.urgency}
                    onChange={(e) => setNewInquiry({ ...newInquiry, urgency: e.target.value })}
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
                    value={newInquiry.status}
                    onChange={(e) => setNewInquiry({ ...newInquiry, status: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    {inquiryStatuses.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Notes (optional)</label>
                <textarea
                  value={newInquiry.notes}
                  onChange={(e) => setNewInquiry({ ...newInquiry, notes: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="Anything to remember about this inquiry..."
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">Parts in this inquiry</h3>
                  <button
                    onClick={addPartRow}
                    className="text-sm px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded font-medium text-slate-700"
                  >
                    + Add another part
                  </button>
                </div>

                <div className="space-y-4">
                  {newInquiry.parts.map((part, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase">
                          Part #{idx + 1}
                        </span>
                        {newInquiry.parts.length > 1 && (
                          <button
                            onClick={() => removePartRow(idx)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={part.part_number}
                          onChange={(e) => updatePartField(idx, 'part_number', e.target.value)}
                          placeholder="Part number *"
                          className="px-3 py-2 border border-slate-300 rounded text-sm"
                        />
                        <input
                          type="text"
                          value={part.description}
                          onChange={(e) => updatePartField(idx, 'description', e.target.value)}
                          placeholder="Description *"
                          className="px-3 py-2 border border-slate-300 rounded text-sm"
                        />
                        <input
                          type="number"
                          value={part.quantity}
                          onChange={(e) => updatePartField(idx, 'quantity', e.target.value)}
                          placeholder="Quantity"
                          className="px-3 py-2 border border-slate-300 rounded text-sm"
                        />
                        <input
                          type="text"
                          value={part.used_in}
                          onChange={(e) => updatePartField(idx, 'used_in', e.target.value)}
                          placeholder="Used in"
                          className="px-3 py-2 border border-slate-300 rounded text-sm"
                        />
                        <select
                          value={part.urgency}
                          onChange={(e) => updatePartField(idx, 'urgency', e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded text-sm"
                        >
                          <option value="1">Urgency: Low (1)</option>
                          <option value="2">Urgency: Medium (2)</option>
                          <option value="3">Urgency: High (3)</option>
                          <option value="4">Urgency: Urgent (4)</option>
                          <option value="5">Urgency: Critical (5)</option>
                        </select>
                        <select
                          value={part.status}
                          onChange={(e) => updatePartField(idx, 'status', e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded text-sm"
                        >
                          {partStatuses.map((s) => (
                            <option key={s.id} value={s.name}>Status: {s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-4">
              <button
                onClick={() => { setShowAddModal(false); resetForm() }}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium"
              >
                Create Inquiry
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
