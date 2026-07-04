import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Users, UserCheck, UserX, Clock, TrendingUp, Bell, Calendar, ChevronRight } from 'lucide-react'
import Layout from '../components/Layout'
import { companyApi, employeesApi, attendanceApi, leavesApi } from '../api'
import { useAuthStore } from '../store/authStore'

const StatCard = ({ icon: Icon, label, value, color, subtitle, delay }) => (
  <motion.div
    className="stat-card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    style={{ '--accent-color': color }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{label}</p>
        <h2 style={{ fontSize: 36, fontWeight: 800, margin: 0, color }}>{value ?? '—'}</h2>
        {subtitle && <p style={{ color: 'var(--color-text-muted)', fontSize: 12, marginTop: 6 }}>{subtitle}</p>}
      </div>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={22} color={color} />
      </div>
    </div>
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
      background: `linear-gradient(90deg, ${color}, transparent)`,
      borderRadius: '0 0 16px 16px'
    }} />
  </motion.div>
)

export default function Dashboard() {
  const { user, isHROrAdmin } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [employees, setEmployees] = useState([])
  const [pendingLeaves, setPendingLeaves] = useState([])
  const [attendance, setAttendance] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, empRes, attRes] = await Promise.all([
          companyApi.getDashboardStats(),
          employeesApi.list(),
          attendanceApi.getSummary(),
        ])
        setStats(statsRes.data)
        setEmployees(empRes.data.slice(0, 8))
        setAttendance(attRes.data)

        if (isHROrAdmin()) {
          const leavesRes = await leavesApi.getAll({ status: 'pending' })
          setPendingLeaves(leavesRes.data.slice(0, 5))
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getInitials = (e) => `${e.first_name?.[0] || ''}${e.last_name?.[0] || ''}`

  return (
    <Layout title="Dashboard">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(167,139,250,0.08))',
          border: '1px solid rgba(108,99,255,0.2)',
          borderRadius: 16, padding: '20px 28px', marginBottom: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}
      >
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
            <span className="gradient-text">{user?.first_name}! 👋</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 6, fontSize: 14 }}>
            Here's what's happening in your organization today.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Today</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      {isHROrAdmin() && (
        <div className="stats-grid-4" style={{ marginBottom: 28 }}>
          <StatCard icon={Users} label="Total Employees" value={stats?.total_employees} color="#6C63FF" subtitle="Active" delay={0.1} />
          <StatCard icon={UserCheck} label="Present Today" value={stats?.present_today} color="#10B981" subtitle="Clocked in" delay={0.15} />
          <StatCard icon={Calendar} label="On Leave" value={stats?.on_leave} color="#F59E0B" subtitle="Today" delay={0.2} />
          <StatCard icon={Bell} label="Pending Approvals" value={stats?.pending_approvals} color="#EF4444" subtitle="Leaves" delay={0.25} />
        </div>
      )}

      {/* My attendance summary (for employees) */}
      {!isHROrAdmin() && attendance && (
        <div className="stats-grid-3" style={{ marginBottom: 28 }}>
          <StatCard icon={UserCheck} label="Days Present" value={attendance.present_days} color="#10B981" subtitle="This month" delay={0.1} />
          <StatCard icon={Clock} label="Work Hours" value={`${attendance.total_work_hours}h`} color="#6C63FF" subtitle="This month" delay={0.15} />
          <StatCard icon={TrendingUp} label="Extra Hours" value={`${attendance.total_extra_hours}h`} color="#F59E0B" subtitle="Overtime" delay={0.2} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        {/* Employees grid */}
        <motion.div
          className="glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ padding: 24 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Team Members</h3>
            <Link to="/employees" style={{ color: 'var(--color-accent)', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {employees.map((emp, i) => (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)',
                    borderRadius: 12, padding: 16, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease'
                  }}
                >
                  <Link to={`/employees/${emp.id}`} style={{ textDecoration: 'none' }}>
                    {emp.avatar_path ? (
                      <img src={emp.avatar_path} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-accent)' }} />
                    ) : (
                      <div className="avatar-placeholder" style={{ width: 44, height: 44, margin: '0 auto', fontSize: 15 }}>
                        {getInitials(emp)}
                      </div>
                    )}
                    <div style={{ marginTop: 10, fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {emp.first_name} {emp.last_name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {emp.department?.name || emp.role?.replace('_', ' ')}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Pending approvals / Quick info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isHROrAdmin() && pendingLeaves.length > 0 && (
            <motion.div
              className="glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              style={{ padding: 24 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>
                  <Bell size={15} style={{ marginRight: 8, verticalAlign: 'middle', color: '#F59E0B' }} />
                  Pending Leaves
                </h3>
                <span className="badge badge-warning">{stats?.pending_approvals}</span>
              </div>
              {pendingLeaves.map(leave => (
                <div key={leave.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                  borderBottom: '1px solid var(--color-border)'
                }}>
                  <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>
                    {leave.employee?.first_name?.[0]}{leave.employee?.last_name?.[0]}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {leave.employee?.first_name} {leave.employee?.last_name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {leave.leave_type?.name} · {leave.days}d
                    </div>
                  </div>
                  <span className="badge badge-warning" style={{ fontSize: 10, padding: '2px 8px' }}>Pending</span>
                </div>
              ))}
              <Link to="/leaves" style={{ display: 'block', textAlign: 'center', marginTop: 14, color: 'var(--color-accent)', fontSize: 13, textDecoration: 'none' }}>
                View All →
              </Link>
            </motion.div>
          )}

          {/* Quick links */}
          <motion.div
            className="glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ padding: 24 }}
          >
            <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Quick Links</h3>
            {[
              { to: '/attendance', label: 'My Attendance', icon: Clock, color: '#10B981' },
              { to: '/leaves', label: 'Apply Leave', icon: Calendar, color: '#6C63FF' },
              { to: '/payroll', label: 'View Payslips', icon: TrendingUp, color: '#F59E0B' },
              { to: '/profile', label: 'Edit Profile', icon: Users, color: '#A78BFA' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                  textDecoration: 'none', color: 'var(--color-text-primary)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <item.icon size={15} color={item.color} />
                </div>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{item.label}</span>
                <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />
              </Link>
            ))}
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}
