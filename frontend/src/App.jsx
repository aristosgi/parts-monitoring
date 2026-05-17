import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider, useUser } from './context/UserContext'
import UserSelectPage from './pages/UserSelectPage'
import DashboardPage from './pages/DashboardPage'
import InquiryDetailPage from './pages/InquiryDetailPage'
import ActivityLogPage from './pages/ActivityLogPage'
import AdminPage from './pages/AdminPage'

function ProtectedRoutes() {
  const { currentUser } = useUser()

  if (!currentUser) {
    return <Navigate to="/" replace />
  }

  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/inquiries/:id" element={<InquiryDetailPage />} />
      <Route path="/activity" element={<ActivityLogPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<UserSelectPage />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  )
}
