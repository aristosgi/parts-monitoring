import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { activityAPI } from '../api/activity'
import client from '../api/client'
import AppShell from '../components/layout/AppShell'

const ACTION_TYPES = [
  'INQUIRY_ADDED',
  'INQUIRY_EDITED',
  'INQUIRY_STATUS_CHANGED',
  'INQUIRY_DELETED',
  'PART_ADDED',
  'PART_EDITED',
  'PART_STATUS_CHANGED',
  'PART_DELETED',
  'PRICE_ADDED',
  'PRICE_EDITED',
  'PRICE_DELETED',
]

export default function ActivityLogPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ performed_by: '', action_type: '' })

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activity', filters],
    queryFn: () => activityAPI.global({ ...filters, limit: 1000 }),
    select: (res) => res.data,
  })

  const { data: config = {} } = useQuery({
    queryKey: ['config'],
    queryFn: () => client.get('/config'),
    select: (res) => res.data,
  })

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Activity Log</h1>
          <p className="text-slate-600 text-sm mt-1">Track all actions performed in the system</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-900 mb-4">Filters</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <select
              value={filters.performed_by}
              onChange={(e) => handleFilterChange('performed_by', e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
            >
              <option value="">All Users</option>
              {config.users?.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <select
              value={filters.action_type}
              onChange={(e) => handleFilterChange('action_type', e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
            >
              <option value="">All Actions</option>
              {ACTION_TYPES.map((a) => (
                <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : activities.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No activities found</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {activities.map((log) => (
                <div
                  key={log.id}
                  className={`p-6 transition ${log.inquiry_id ? 'hover:bg-slate-50 cursor-pointer' : ''}`}
                  onClick={() => log.inquiry_id && navigate(`/inquiries/${log.inquiry_id}`)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                      {log.action_type.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900">{log.action_type.replace(/_/g, ' ')}</span>
                            {log.part_number && (
                              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                {log.part_number}
                              </span>
                            )}
                            {log.inquiry_id && (
                              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                                Inquiry #{log.inquiry_id}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 text-sm mt-1">{log.action_detail}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-slate-900 text-sm">{log.performed_by}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-3xl font-bold text-slate-900">
              {activities.filter((a) => a.action_type === 'INQUIRY_ADDED').length}
            </div>
            <p className="text-slate-600 text-sm mt-2">Inquiries Created</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-3xl font-bold text-slate-900">
              {activities.filter((a) => a.action_type.includes('STATUS')).length}
            </div>
            <p className="text-slate-600 text-sm mt-2">Status Changes</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-3xl font-bold text-slate-900">
              {activities.filter((a) => a.action_type.includes('PRICE')).length}
            </div>
            <p className="text-slate-600 text-sm mt-2">Price Entries</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-3xl font-bold text-slate-900">{activities.length}</div>
            <p className="text-slate-600 text-sm mt-2">Total Actions</p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
