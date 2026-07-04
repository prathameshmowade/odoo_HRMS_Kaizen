import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Calendar, Check, X, AlertCircle, Search } from 'lucide-react'
import Layout from '../components/Layout'
import { leavesApi } from '../api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const statusColors = { pending: '#F59E0B', approved: '#10B981', rejected: '#EF4444', cancelled: '#6B7280' }
const statusBadge = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger', cancelled: 'badge-muted' }

function ApplyLeaveModal({ onClose, onSuccess }) {
  const [leaveTypes, setLeaveTypes] = useState([])
  const [balances, setBalances] = useState([])
  const [form, setForm] = useState({ leave_type_id: '', start_date: '', end_date: '', reason: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([leavesApi.getTypes(), leavesApi.getBalances()]).then(([t, b]) => {
      setLeaveTypes(t.data)
      setBalances(b.data)
    })
  }, [])

  const selectedBalance = balances.find(b => b.leave_type.id === parseInt(form.leave_type_id))
  const days = form.start_date && form.end_date ? Math.max(0, (new Date(form.end_date) - new Date(form.start_date)) / 86400000 + 1) : 0

  const onSubmit = async () => {
    if (!form.leave_type_id || !form.start_date || !form.end_date) return toast.error('Fill all required fields')
    setLoading(true)
    try {
      await leavesApi.apply({ ...form, leave_type_id: parseInt(form.leave_type_id) })
      toast.success('Leave request submitted!')
      onSuccess()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to submit')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div className="modal-box" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontWeight: 700, fontSize: 20, margin: 0 }}>Apply for Leave</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Leave Type *</label>
          <select className="input-field" value={form.leave_type_id} onChange={e => setForm(p => ({ ...p, leave_type_id: e.target.value }))}>
            <option value="">Select type</option>
            {leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name} {lt.is_paid ? '(Paid)' : '(Unpaid)'}</option>)}
          </select>
        </div>

        {selectedBalance && (
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            Balance: <strong style={{ color: '#10B981' }}>{selectedBalance.remaining} days remaining</strong> (Used {selectedBalance.used}/{selectedBalance.allocated})
          </div>
        )}

        <div className="form-grid-2" style={{ marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Start Date *</label>
            <input type="date" className="input-field" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>End Date *</label>
            <input type="date" className="input-field" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
          </div>
        </div>

        {days > 0 && (
          <div style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            Duration: <strong style={{ color: 'var(--color-accent)' }}>{days} day{days > 1 ? 's' : ''}</strong>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Reason</label>
          <textarea className="input-field" rows={3} placeholder="Reason for leave..." value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} style={{ resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
          <motion.button className="btn-primary" onClick={onSubmit} disabled={loading} style={{ flex: 1, justifyContent: 'center' }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

export default function Leaves() {
  const { user, isHROrAdmin } = useAuthStore()
  const [myLeaves, setMyLeaves] = useState([])
  const [allLeaves, setAllLeaves] = useState([])
  const [balances, setBalances] = useState([])
  const [view, setView] = useState('my')
  const [showApply, setShowApply] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [myRes, balRes] = await Promise.all([leavesApi.getMy(), leavesApi.getBalances()])
      setMyLeaves(myRes.data)
      setBalances(balRes.data)
      if (isHROrAdmin()) {
        const allRes = await leavesApi.getAll({ search, status: statusFilter || undefined })
        setAllLeaves(allRes.data)
      }
    } catch (e) { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search, statusFilter])

  const handleApprove = async (id) => {
    try {
      await leavesApi.approve(id)
      toast.success('Leave approved!')
      load()
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed') }
  }

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason (optional):') || ''
    try {
      await leavesApi.reject(id, { reason })
      toast.success('Leave rejected')
      load()
    } catch (e) { toast.error('Failed') }
  }

  const LeaveRow = ({ leave, showEmployee }) => (
    <tr>
      {showEmployee && (
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar-placeholder" style={{ width: 30, height: 30, fontSize: 11 }}>
              {leave.employee?.first_name?.[0]}{leave.employee?.last_name?.[0]}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{leave.employee?.first_name} {leave.employee?.last_name}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{leave.employee?.login_id}</div>
            </div>
          </div>
        </td>
      )}
      <td>
        <span className="badge" style={{ background: `${leave.leave_type.color}18`, color: leave.leave_type.color }}>{leave.leave_type.name}</span>
      </td>
      <td>{new Date(leave.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(leave.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
      <td style={{ fontWeight: 700 }}>{leave.days}d</td>
      <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontSize: 13 }}>{leave.reason || '—'}</td>
      <td><span className={`badge ${statusBadge[leave.status]}`}>{leave.status}</span></td>
      {showEmployee && leave.status === 'pending' && (
        <td>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-success" onClick={() => handleApprove(leave.id)} style={{ padding: '4px 10px', fontSize: 12 }}><Check size={12} /> Approve</button>
            <button className="btn-danger" onClick={() => handleReject(leave.id)} style={{ padding: '4px 10px', fontSize: 12 }}><X size={12} /> Reject</button>
          </div>
        </td>
      )}
      {showEmployee && leave.status !== 'pending' && <td />}
    </tr>
  )

  return (
    <Layout title="Time Off">
      {/* Leave Balance Cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {balances.map(b => (
          <div key={b.id} style={{
            background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '16px 20px',
            borderTop: `3px solid ${b.leave_type.color}`, minWidth: 160
          }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>{b.leave_type.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: b.leave_type.color }}>{b.remaining}</span>
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>/{b.allocated} days</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{b.used} used</div>
          </div>
        ))}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="btn-primary"
          onClick={() => setShowApply(true)}
          style={{ marginLeft: 'auto', alignSelf: 'center' }}
        >
          <Plus size={16} /> Apply Leave
        </motion.button>
      </div>

      {/* View toggle */}
      {isHROrAdmin() && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--color-bg-card)', borderRadius: 12, padding: 4, width: 'fit-content', border: '1px solid var(--color-border)' }}>
          <button onClick={() => setView('my')} style={{ padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', background: view === 'my' ? 'linear-gradient(135deg, #6C63FF, #5348E0)' : 'transparent', color: view === 'my' ? 'white' : 'var(--color-text-muted)', fontWeight: 600, fontSize: 13 }}>
            My Leaves
          </button>
          <button onClick={() => setView('all')} style={{ padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', background: view === 'all' ? 'linear-gradient(135deg, #6C63FF, #5348E0)' : 'transparent', color: view === 'all' ? 'white' : 'var(--color-text-muted)', fontWeight: 600, fontSize: 13 }}>
            All Requests
          </button>
        </div>
      )}

      {/* Filters */}
      {view === 'all' && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input className="input-field" style={{ paddingLeft: 38 }} placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      )}

      {/* Table */}
      <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                {view === 'all' && <th>Employee</th>}
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                {view === 'all' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(view === 'all' ? 7 : 6)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td>)}</tr>
                ))
              ) : (view === 'my' ? myLeaves : allLeaves).map(leave => (
                <LeaveRow key={leave.id} leave={leave} showEmployee={view === 'all'} />
              ))}
            </tbody>
          </table>
          {!loading && (view === 'my' ? myLeaves : allLeaves).length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>No leave records found</div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showApply && <ApplyLeaveModal onClose={() => setShowApply(false)} onSuccess={() => { setShowApply(false); load() }} />}
      </AnimatePresence>
    </Layout>
  )
}
