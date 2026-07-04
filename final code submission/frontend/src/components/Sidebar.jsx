import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import logo from '../assets/logo.jpg'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard, Users, Clock, CalendarDays, DollarSign,
  Building2, UserCircle, LogOut, ChevronRight, Zap
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['employee', 'hr_officer', 'admin'] },
  { to: '/employees', icon: Users, label: 'Employees', roles: ['hr_officer', 'admin'] },
  { to: '/attendance', icon: Clock, label: 'Attendance', roles: ['employee', 'hr_officer', 'admin'] },
  { to: '/leaves', icon: CalendarDays, label: 'Time Off', roles: ['employee', 'hr_officer', 'admin'] },
  { to: '/salary', icon: DollarSign, label: 'Salary', roles: ['hr_officer', 'admin'] },
  { to: '/payroll', icon: DollarSign, label: 'Payroll', roles: ['employee', 'hr_officer', 'admin'] },
  { to: '/company', icon: Building2, label: 'Company', roles: ['admin'] },
  { to: '/profile', icon: UserCircle, label: 'My Profile', roles: ['employee', 'hr_officer', 'admin'] },
]

export default function Sidebar() {
  const { user, logout, isHROrAdmin } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const filtered = navItems.filter(item => item.roles.includes(user?.role))

  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Logo */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logo} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.1)' }} alt="Logo" />
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: '-0.3px', color: 'var(--color-text-primary)' }}>GLOBAL HR</div>
            <div style={{ fontSize: 10, color: 'var(--color-accent)', marginTop: 1, fontWeight: 700 }}>SOLUTIONS</div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user?.avatar_path ? (
            <img src={user.avatar_path} className="avatar" alt="avatar" style={{ width: 36, height: 36 }} />
          ) : (
            <div className="avatar-placeholder" style={{ width: 36, height: 36, fontSize: 13 }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
          )}
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.first_name} {user?.last_name}
            </div>
            <div style={{
              fontSize: 11, color: 'var(--color-accent)',
              background: 'rgba(108,99,255,0.1)', borderRadius: 4,
              padding: '1px 6px', display: 'inline-block', marginTop: 2,
              fontWeight: 600, textTransform: 'capitalize'
            }}>
              {user?.role?.replace('_', ' ')}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
          {user?.login_id}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {filtered.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={18} />
            <span style={{ flex: 1 }}>{item.label}</span>
            <ChevronRight size={14} style={{ opacity: 0.4 }} />
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--color-border)' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px', borderRadius: 10, border: 'none',
            background: 'rgba(239,68,68,0.08)', color: '#EF4444',
            cursor: 'pointer', fontWeight: 500, fontSize: 14,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </motion.aside>
  )
}
