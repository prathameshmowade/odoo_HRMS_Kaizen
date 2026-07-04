import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, Search, Clock, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { attendanceApi } from '../api'
import toast from 'react-hot-toast'

export default function Topbar({ title }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [clockStatus, setClockStatus] = useState(null)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    attendanceApi.getStatus().then(r => setClockStatus(r.data)).catch(() => {})
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleClockIn = async () => {
    try {
      await attendanceApi.clockIn()
      toast.success('Clocked in successfully!')
      const r = await attendanceApi.getStatus()
      setClockStatus(r.data)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to clock in')
    }
  }

  const handleClockOut = async () => {
    try {
      await attendanceApi.clockOut()
      toast.success('Clocked out successfully!')
      const r = await attendanceApi.getStatus()
      setClockStatus(r.data)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to clock out')
    }
  }

  const isClockIn = clockStatus?.status === 'not_clocked_in'
  const isWorking = clockStatus?.status === 'clocked_in'

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(13,18,37,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-border)',
        padding: '14px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      {/* Title */}
      <div>
        <h1 style={{ fontWeight: 700, fontSize: 20, margin: 0 }}>{title}</h1>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
          {time.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Live clock */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
          borderRadius: 10, padding: '8px 14px', fontSize: 13,
          fontFamily: 'monospace', color: 'var(--color-text-secondary)'
        }}>
          <Clock size={14} />
          {time.toLocaleTimeString('en-IN', { hour12: false })}
        </div>

        {/* Working status indicator */}
        {clockStatus && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: isWorking ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isWorking ? 'rgba(16,185,129,0.3)' : 'var(--color-border)'}`,
            borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 600
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isWorking ? '#10B981' : '#6B7280',
              boxShadow: isWorking ? '0 0 0 3px rgba(16,185,129,0.2)' : 'none',
              animation: isWorking ? 'pulse-glow 2s infinite' : 'none'
            }} />
            <span style={{ color: isWorking ? '#10B981' : 'var(--color-text-muted)' }}>
              {isWorking ? 'Working' : clockStatus?.status === 'clocked_out' ? 'Done' : 'Not In'}
            </span>
          </div>
        )}

        {/* Clock In/Out */}
        {clockStatus?.status !== 'clocked_out' && (
          <button
            onClick={isWorking ? handleClockOut : handleClockIn}
            style={{
              background: isWorking ? 'rgba(239,68,68,0.1)' : 'linear-gradient(135deg, #6C63FF, #5348E0)',
              color: isWorking ? '#EF4444' : 'white',
              border: isWorking ? '1px solid rgba(239,68,68,0.3)' : 'none',
              padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
              fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s ease'
            }}
          >
            <Clock size={14} />
            {isWorking ? 'Clock Out' : 'Clock In'}
          </button>
        )}
      </div>
    </motion.header>
  )
}
