import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

const USERS = ['Simos', 'Lenia', 'Dimitris']

export default function UserSelectPage() {
  const navigate = useNavigate()
  const { setCurrentUser } = useUser()

  const handleSelectUser = (user) => {
    setCurrentUser(user)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-slate-900 mb-3">
            Part Numbers Monitor
          </h1>
          <p className="text-slate-600 text-lg">
            Track inventory requests and compare supplier prices
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {USERS.map((user) => (
            <button
              key={user}
              onClick={() => handleSelectUser(user)}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-8 border border-slate-200 hover:border-slate-300 cursor-pointer group"
            >
              <div className="text-5xl font-bold text-slate-400 mb-4 group-hover:text-slate-600 transition-colors">
                {user.charAt(0)}
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">
                {user}
              </h2>
              <p className="text-slate-500 text-sm">Sign in as this user</p>
            </button>
          ))}
        </div>

        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
          <p className="text-slate-600">
            No password required. Select your user account to continue.
          </p>
        </div>
      </div>
    </div>
  )
}
