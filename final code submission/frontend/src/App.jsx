import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import EmployeeDetail from './pages/EmployeeDetail'
import Attendance from './pages/Attendance'
import Leaves from './pages/Leaves'
import Salary from './pages/Salary'
import Payroll from './pages/Payroll'
import Company from './pages/Company'
import Profile from './pages/Profile'

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#111827',
          color: '#F1F5F9',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }
      }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/employees" element={
          <ProtectedRoute allowedRoles={['hr_officer', 'admin']}>
            <Employees />
          </ProtectedRoute>
        } />
        
        <Route path="/employees/:id" element={
          <ProtectedRoute>
            <EmployeeDetail />
          </ProtectedRoute>
        } />
        
        <Route path="/attendance" element={
          <ProtectedRoute>
            <Attendance />
          </ProtectedRoute>
        } />
        
        <Route path="/leaves" element={
          <ProtectedRoute>
            <Leaves />
          </ProtectedRoute>
        } />
        
        <Route path="/salary" element={
          <ProtectedRoute allowedRoles={['hr_officer', 'admin']}>
            <Navigate to="/employees" replace />
          </ProtectedRoute>
        } />

        <Route path="/salary/:id" element={
          <ProtectedRoute allowedRoles={['hr_officer', 'admin']}>
            <Salary />
          </ProtectedRoute>
        } />
        
        <Route path="/payroll" element={
          <ProtectedRoute>
            <Payroll />
          </ProtectedRoute>
        } />
        
        <Route path="/company" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Company />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}
