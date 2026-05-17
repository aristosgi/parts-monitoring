import React, { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { suppliersAPI } from '../api/suppliers'
import { statusesAPI } from '../api/statuses'
import AppShell from '../components/layout/AppShell'

export default function AdminPage() {
  const queryClient = useQueryClient()

  const [isAdmin, setIsAdmin] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setPasswordError('')
    try {
      await suppliersAPI.login(password)
      setIsAdmin(true)
    } catch (error) {
      setPasswordError('Invalid password')
      setPassword('')
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Panel</h1>
          <p className="text-slate-600 text-sm mb-6">Enter admin password to manage suppliers and statuses</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="Enter password"
                autoFocus
              />
              {passwordError && <p className="text-red-600 text-xs mt-2">{passwordError}</p>}
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <AppShell>
      <div className="space-y-8 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
            <p className="text-slate-600 text-sm mt-1">Manage suppliers and configurable statuses</p>
          </div>
          <button
            onClick={() => setIsAdmin(false)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition text-sm font-medium"
          >
            Sign Out
          </button>
        </div>

        <SuppliersSection password={password} category="A" title="In-Country Suppliers (Category A)" queryClient={queryClient} />
        <SuppliersSection password={password} category="B" title="Web/Import Suppliers (Category B)" queryClient={queryClient} />

        <StatusesSection password={password} scope="inquiry" title="Inquiry Statuses" queryClient={queryClient} />
        <StatusesSection password={password} scope="part" title="Part Statuses" queryClient={queryClient} />
      </div>
    </AppShell>
  )
}


// ============ Suppliers ============

function SuppliersSection({ password, category, title, queryClient }) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  const { data: suppliers = [] } = useQuery({
    queryKey: ['adminSuppliers'],
    queryFn: () => suppliersAPI.adminList(password),
    select: (res) => res?.data || [],
    enabled: !!password,
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: (data) => suppliersAPI.create(data, password),
    onSuccess: () => { queryClient.invalidateQueries(['adminSuppliers']); setNewName('') },
    onError: (e) => alert('Error: ' + (e.response?.data?.detail || e.message)),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => suppliersAPI.update(id, data, password),
    onSuccess: () => { queryClient.invalidateQueries(['adminSuppliers']); setEditingId(null); setEditingName('') },
    onError: (e) => alert('Error: ' + (e.response?.data?.detail || e.message)),
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => suppliersAPI.delete(id, password),
    onSuccess: () => queryClient.invalidateQueries(['adminSuppliers']),
    onError: (e) => alert('Error: ' + (e.response?.data?.detail || e.message)),
  })

  const filtered = suppliers.filter((s) => s.category === category)

  const handleAdd = () => {
    if (!newName.trim()) { alert('Enter a supplier name'); return }
    createMutation.mutate({ name: newName.trim(), category })
  }

  return (
    <Section title={title}>
      {filtered.length > 0 && (
        <div className="mb-6 space-y-2">
          {filtered.map((s) => (
            <Row
              key={s.id}
              isEditing={editingId === s.id}
              editingValue={editingName}
              onEditChange={setEditingName}
              displayContent={
                <>
                  <p className="font-semibold text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.is_active ? 'Active' : 'Inactive'}</p>
                </>
              }
              isActive={s.is_active}
              onToggle={() => updateMutation.mutate({ id: s.id, data: { is_active: !s.is_active } })}
              onStartEdit={() => { setEditingId(s.id); setEditingName(s.name) }}
              onCancelEdit={() => setEditingId(null)}
              onSave={() => {
                if (!editingName.trim()) { alert('Enter a name'); return }
                updateMutation.mutate({ id: s.id, data: { name: editingName.trim() } })
              }}
              onDelete={() => {
                if (window.confirm(`Delete supplier ${s.name}?`)) deleteMutation.mutate(s.id)
              }}
            />
          ))}
        </div>
      )}
      <AddRow
        value={newName}
        onChange={setNewName}
        onAdd={handleAdd}
        placeholder="New supplier name..."
        disabled={createMutation.isPending}
      />
    </Section>
  )
}


// ============ Statuses ============

function StatusesSection({ password, scope, title, queryClient }) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  const { data: statuses = [] } = useQuery({
    queryKey: ['adminStatuses', scope],
    queryFn: () => statusesAPI.adminList(password, scope),
    select: (res) => res?.data || [],
    enabled: !!password,
    retry: false,
  })

  const invalidate = () => {
    queryClient.invalidateQueries(['adminStatuses', scope])
    queryClient.invalidateQueries(['statuses', scope])
    queryClient.invalidateQueries(['inquiries']) // statuses may have been reset
    queryClient.invalidateQueries(['inquiry'])
  }

  const createMutation = useMutation({
    mutationFn: (data) => statusesAPI.create(data, password),
    onSuccess: () => { invalidate(); setNewName('') },
    onError: (e) => alert('Error: ' + (e.response?.data?.detail || e.message)),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => statusesAPI.update(id, data, password),
    onSuccess: () => { invalidate(); setEditingId(null); setEditingName('') },
    onError: (e) => alert('Error: ' + (e.response?.data?.detail || e.message)),
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => statusesAPI.delete(id, password),
    onSuccess: (res) => {
      invalidate()
      const n = res?.data?.reset_count ?? 0
      if (n > 0) {
        alert(`Status deleted. ${n} ${scope === 'inquiry' ? 'inquiries' : 'parts'} reset to "Pending".`)
      }
    },
    onError: (e) => alert('Error: ' + (e.response?.data?.detail || e.message)),
  })

  const handleAdd = () => {
    if (!newName.trim()) { alert('Enter a status name'); return }
    createMutation.mutate({ name: newName.trim(), scope, display_order: statuses.length })
  }

  return (
    <Section title={title}>
      <p className="text-xs text-slate-500 mb-3">
        Deleting a status will reset any {scope === 'inquiry' ? 'inquiries' : 'parts'} using it back to <strong>Pending</strong>.
        The <strong>Pending</strong> status cannot be deleted.
      </p>
      {statuses.length > 0 && (
        <div className="mb-6 space-y-2">
          {statuses.map((s) => {
            const isPending = s.name === 'Pending'
            return (
              <Row
                key={s.id}
                isEditing={editingId === s.id}
                editingValue={editingName}
                onEditChange={setEditingName}
                displayContent={
                  <>
                    <p className="font-semibold text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.is_active ? 'Active' : 'Inactive'}{isPending && ' · protected'}</p>
                  </>
                }
                isActive={s.is_active}
                onToggle={() => updateMutation.mutate({ id: s.id, data: { is_active: !s.is_active } })}
                onStartEdit={() => { setEditingId(s.id); setEditingName(s.name) }}
                onCancelEdit={() => setEditingId(null)}
                onSave={() => {
                  if (!editingName.trim()) { alert('Enter a name'); return }
                  updateMutation.mutate({ id: s.id, data: { name: editingName.trim() } })
                }}
                onDelete={
                  isPending
                    ? null
                    : () => {
                        if (window.confirm(
                          `Delete status "${s.name}"?\n\nAny ${scope === 'inquiry' ? 'inquiries' : 'parts'} currently in this status will be reset to "Pending".`
                        )) deleteMutation.mutate(s.id)
                      }
                }
              />
            )
          })}
        </div>
      )}
      <AddRow
        value={newName}
        onChange={setNewName}
        onAdd={handleAdd}
        placeholder="New status name..."
        disabled={createMutation.isPending}
      />
    </Section>
  )
}


// ============ Reusable bits ============

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">{title}</h2>
      {children}
    </div>
  )
}

function Row({
  isEditing, editingValue, onEditChange, displayContent,
  isActive, onToggle, onStartEdit, onCancelEdit, onSave, onDelete,
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
      {isEditing ? (
        <input
          type="text"
          value={editingValue}
          onChange={(e) => onEditChange(e.target.value)}
          className="flex-1 px-3 py-1 border border-slate-300 rounded text-sm"
          autoFocus
        />
      ) : (
        <div className="flex-1">{displayContent}</div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className={`px-3 py-1 rounded text-xs font-medium transition ${
            isActive
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isActive ? 'Active' : 'Inactive'}
        </button>

        {isEditing ? (
          <>
            <button onClick={onSave} className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition">Save</button>
            <button onClick={onCancelEdit} className="px-3 py-1 bg-slate-300 text-slate-900 rounded text-xs font-medium hover:bg-slate-400 transition">Cancel</button>
          </>
        ) : (
          <>
            <button onClick={onStartEdit} className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition">Edit</button>
            {onDelete ? (
              <button onClick={onDelete} className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition">Delete</button>
            ) : (
              <button disabled className="px-3 py-1 bg-slate-200 text-slate-400 rounded text-xs font-medium cursor-not-allowed" title="Protected">Delete</button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function AddRow({ value, onChange, onAdd, placeholder, disabled }) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
        onKeyDown={(e) => e.key === 'Enter' && onAdd()}
      />
      <button
        onClick={onAdd}
        disabled={disabled}
        className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-sm font-medium disabled:opacity-50"
      >
        Add
      </button>
    </div>
  )
}
