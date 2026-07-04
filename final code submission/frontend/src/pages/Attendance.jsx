import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, CheckCircle, XCircle, Calendar, Search, Filter } from 'lucide-react'
import Layout from '../components/Layout'
import { attendanceApi, employeesApi } from '../api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const statusColors = { present: '#10B981', absent: '#EF4444', half_day: '#F59E0B', on_leave: '#6C63FF' }
const statusLabels = { present: 'Present', absent: 'Absent', half_day: 'Half Day', on_leave: 'On Leave' }

export default function Attendance() {
  const { user, isHROrAdmin } = useAuthStore()
  const [myAttendance, setMyAttendance] = useState([])
  const [allAttendance, setAllAttendance] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [search, setSearch] = useState('')
  const [view, setView] = useState('my')

  const load = async () => {
    setLoading(true)
    try {
      const [myRes, summaryRes] = await Promise.all([
        attendanceApi.getMy({ month, year }),
        attendanceApi.getSummary()
      ])
      setMyAttendance(myRes.data)
      setSummary(summaryRes.data)

      if (isHROrAdmin()) {
        const allRes = await attendanceApi.getAll({ month, year, search })
        setAllAttendance(allRes.data)
      }
    } catch (e) {
      toast.error('Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [month, year, search])

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const formatTime = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  return (
    <Layout title="Attendance">
      {/* Summary cards */}
      {summary && (
        <div className="stats-grid-3" style={{ marginBottom: 24 }}>
          {[
            { label: 'Days Present', value: summary.present_days, color: '#10B981', icon: CheckCircle },
            { label: 'Work Hours', value: `${summary.total_work_hours}h`, color: '#6C63FF', icon: Clock },
            { label: 'Extra Hours', value: `${summary.total_extra_hours}h`, color: '#F59E0B', icon: Clock },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{ padding: 20 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <item.icon size={18} color={item.color} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{item.label}</div>
                  <div style={{ fontWeight: 800, fontSize: 22, color: item.color }}>{item.value}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* View toggle (HR/Admin) */}
      {isHROrAdmin() && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--color-bg-card)', borderRadius: 12, padding: 4, width: 'fit-content', border: '1px solid var(--color-border)' }}>
          <button onClick={() => setView('my')} style={{ padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', background: view === 'my' ? 'linear-gradient(135deg, #6C63FF, #5348E0)' : 'transparent', color: view === 'my' ? 'white' : 'var(--color-text-muted)', fontWeight: 600, fontSize: 13 }}>
            My Attendance
          </button>
          <button onClick={() => setView('all')} style={{ padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', background: view === 'all' ? 'linear-gradient(135deg, #6C63FF, #5348E0)' : 'transparent', color: view === 'all' ? 'white' : 'var(--color-text-muted)', fontWeight: 600, fontSize: 13 }}>
            All Employees
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select className="input-field" style={{ width: 140 }} value={month} onChange={e => setMonth(parseInt(e.target.value))}>
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="input-field" style={{ width: 100 }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
          {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {view === 'all' && (
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input className="input-field" style={{ paddingLeft: 38 }} placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        )}
      </div>

      {/* Table */}
      <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                {view === 'all' && <th>Employee</th>}
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Work Hours</th>
                <th>Extra Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(view === 'all' ? 7 : 6)].map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                    ))}
                  </tr>
                ))
              ) : (view === 'my' ? myAttendance : allAttendance).map(record => (
                <tr key={record.id}>
                  {view === 'all' && (
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{record.employee_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{record.employee_login_id}</div>
                    </td>
                  )}
                  <td style={{ fontWeight: 500 }}>{new Date(record.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{formatTime(record.check_in)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{formatTime(record.check_out)}</td>
                  <td style={{ fontWeight: 600 }}>{record.work_hours ? `${record.work_hours}h` : '—'}</td>
                  <td style={{ color: record.extra_hours > 0 ? '#F59E0B' : 'var(--color-text-muted)' }}>
                    {record.extra_hours > 0 ? `+${record.extra_hours}h` : '—'}
                  </td>
                  <td>
                    <span className="badge" style={{ background: `${statusColors[record.status]}18`, color: statusColors[record.status] }}>
                      {statusLabels[record.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && (view === 'my' ? myAttendance : allAttendance).length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>No attendance records found</div>
          )}
        </div>
      </motion.div>
    </Layout>
  )
}
