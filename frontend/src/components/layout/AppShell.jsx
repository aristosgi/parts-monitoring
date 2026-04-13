import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '../../context/UserContext'

export default function AppShell({ children }) {
  const { currentUser, setCurrentUser } = useUser()
  const navigate = useNavigate()

  const handleLogout = () => {
    setCurrentUser(null)
    navigate('/')
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-lg font-semibold">Part Monitor</h1>
        </div>
        <nav className="flex-1 mt-6 space-y-1 px-4">
          <Link
            to="/dashboard"
            className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Parts List
          </Link>
          <Link
            to="/activity"
            className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Activity Log
          </Link>
        </nav>

        {/* Admin Link */}
        <div className="px-4 pb-4 border-t border-slate-800">
          <Link
            to="/admin"
            className="block px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            Admin Panel
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 px-8 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">Part Numbers Monitoring</h2>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{currentUser}</p>
                <p className="text-xs text-slate-500">Active user</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition text-sm font-medium"
              >
                Switch User
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
