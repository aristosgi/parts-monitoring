import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { suppliersAPI } from '../api/suppliers'
import AppShell from '../components/layout/AppShell'

export default function AdminPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isAdmin, setIsAdmin] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [newSupplierA, setNewSupplierA] = useState('')
  const [newSupplierB, setNewSupplierB] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ['adminSuppliers', isAdmin],
    queryFn: () => {
      if (!isAdmin || !password) return Promise.resolve({ data: [] })
      return suppliersAPI.adminList(password)
    },
    select: (res) => res?.data || [],
    enabled: isAdmin && !!password,
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: (data) => suppliersAPI.create(data, password),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminSuppliers'])
      setNewSupplierA('')
      setNewSupplierB('')
    },
    onError: (error) => {
      alert('Error: ' + (error.response?.data?.detail || error.message))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => suppliersAPI.update(id, data, password),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminSuppliers'])
      setEditingId(null)
      setEditingName('')
    },
    onError: (error) => {
      alert('Error: ' + (error.response?.data?.detail || error.message))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => suppliersAPI.delete(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminSuppliers'])
    },
    onError: (error) => {
      alert('Error: ' + (error.response?.data?.detail || error.message))
    },
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    setPasswordError('')

    try {
      await suppliersAPI.login(password)
      setIsAdmin(true)
      // Keep password in state for API calls, don't clear it
    } catch (error) {
      setPasswordError('Invalid password')
      setPassword('')
    }
  }

  const handleAddSupplier = (category) => {
    const name = category === 'A' ? newSupplierA : newSupplierB
    if (!name.trim()) {
      alert('Please enter a supplier name')
      return
    }

    createMutation.mutate({
      name: name.trim(),
      category: category,
    })
  }

  const handleToggleActive = (supplier) => {
    updateMutation.mutate({
      id: supplier.id,
      data: { is_active: !supplier.is_active },
    })
  }

  const handleStartEdit = (supplier) => {
    setEditingId(supplier.id)
    setEditingName(supplier.name)
  }

  const handleSaveEdit = () => {
    if (!editingName.trim()) {
      alert('Please enter a supplier name')
      return
    }

    updateMutation.mutate({
      id: editingId,
      data: { name: editingName.trim() },
    })
  }

  const handleDeleteSupplier = (supplier) => {
    if (window.confirm(`Delete ${supplier.name}?`)) {
      deleteMutation.mutate(supplier.id)
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Panel</h1>
          <p className="text-slate-600 text-sm mb-6">Enter admin password to manage suppliers</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
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

  const categoryASuppliers = suppliers.filter((s) => s.category === 'A')
  const categoryBSuppliers = suppliers.filter((s) => s.category === 'B')

  return (
    <AppShell>
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Manage Suppliers</h1>
            <p className="text-slate-600 text-sm mt-1">Add, edit, or disable suppliers</p>
          </div>
          <button
            onClick={() => setIsAdmin(false)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition text-sm font-medium"
          >
            Sign Out
          </button>
        </div>

        {/* Category A: In-Country */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">In-Country Suppliers (Category A)</h2>

          {/* Suppliers List */}
          {categoryASuppliers.length > 0 && (
            <div className="mb-6 space-y-2">
              {categoryASuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  {editingId === supplier.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 px-3 py-1 border border-slate-300 rounded text-sm"
                      autoFocus
                    />
                  ) : (
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{supplier.name}</p>
                      <p className="text-xs text-slate-500">
                        {supplier.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(supplier)}
                      className={`px-3 py-1 rounded text-xs font-medium transition ${
                        supplier.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {supplier.is_active ? 'Active' : 'Inactive'}
                    </button>

                    {editingId === supplier.id ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 bg-slate-300 text-slate-900 rounded text-xs font-medium hover:bg-slate-400 transition"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(supplier)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(supplier)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add New */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newSupplierA}
              onChange={(e) => setNewSupplierA(e.target.value)}
              placeholder="New supplier name..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
            />
            <button
              onClick={() => handleAddSupplier('A')}
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-sm font-medium disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        {/* Category B: Web/Import */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Web/Import Suppliers (Category B)</h2>

          {/* Suppliers List */}
          {categoryBSuppliers.length > 0 && (
            <div className="mb-6 space-y-2">
              {categoryBSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  {editingId === supplier.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 px-3 py-1 border border-slate-300 rounded text-sm"
                      autoFocus
                    />
                  ) : (
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{supplier.name}</p>
                      <p className="text-xs text-slate-500">
                        {supplier.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(supplier)}
                      className={`px-3 py-1 rounded text-xs font-medium transition ${
                        supplier.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {supplier.is_active ? 'Active' : 'Inactive'}
                    </button>

                    {editingId === supplier.id ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 bg-slate-300 text-slate-900 rounded text-xs font-medium hover:bg-slate-400 transition"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(supplier)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(supplier)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add New */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newSupplierB}
              onChange={(e) => setNewSupplierB(e.target.value)}
              placeholder="New supplier name..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
            />
            <button
              onClick={() => handleAddSupplier('B')}
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-sm font-medium disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
