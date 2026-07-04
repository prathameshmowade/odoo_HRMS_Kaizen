import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Search, Plus, Filter, UserCircle, Mail, Phone, Building2 } from 'lucide-react'
import Layout from '../components/Layout'
import { employeesApi, companyApi } from '../api'
import { useAuthStore } from '../store/authStore'
import AddEmployeeModal from '../components/AddEmployeeModal'
import toast from 'react-hot-toast'

const roleColors = { admin: '#EF4444', hr_officer: '#F59E0B', employee: '#10B981' }

export default function Employees() {
  const { isHROrAdmin } = useAuthStore()
  const [employees, setEmployees] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [depts, setDepts] = useState([])
  const [selectedDept, setSelectedDept] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [empRes, deptRes] = await Promise.all([employeesApi.list(), companyApi.getDepts()])
      setEmployees(empRes.data)
      setFiltered(empRes.data)
      setDepts(deptRes.data)
    } catch (e) {
      toast.error('Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let data = employees
    if (search) data = data.filter(e =>
      `${e.first_name} ${e.last_name} ${e.login_id} ${e.email}`.toLowerCase().includes(search.toLowerCase())
    )
    if (selectedDept) data = data.filter(e => e.department?.id === parseInt(selectedDept))
    setFiltered(data)
  }, [search, selectedDept, employees])

  return (
    <Layout title="Employees">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 20, margin: 0 }}>All Employees</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 4 }}>{filtered.length} members</p>
        </div>
        {isHROrAdmin() && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary"
            onClick={() => setShowAdd(true)}
          >
            <Plus size={16} /> Add Employee
          </motion.button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: 40 }}
            placeholder="Search by name, ID, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input-field" style={{ width: 180 }} value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
          <option value="">All Departments</option>
          {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Employee Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />)}
        </div>
      ) : (
        <motion.div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AnimatePresence>
            {filtered.map((emp, i) => (
              <motion.div
                key={emp.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -4 }}
              >
                <Link to={`/employees/${emp.id}`} style={{ textDecoration: 'none' }}>
                  <div className="glass-card" style={{ padding: 20, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      {emp.avatar_path ? (
                        <img src={emp.avatar_path} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-accent)', flexShrink: 0 }} />
                      ) : (
                        <div className="avatar-placeholder" style={{ width: 52, height: 52, fontSize: 16, flexShrink: 0 }}>
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </div>
                      )}
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)' }}>
                          {emp.first_name} {emp.last_name}
                        </div>
                        <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--color-accent)', marginTop: 2 }}>{emp.login_id}</div>
                        <span className="badge" style={{ marginTop: 6, fontSize: 10, background: `${roleColors[emp.role]}15`, color: roleColors[emp.role] }}>
                          {emp.role?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
                        <Mail size={12} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.email}</span>
                      </div>
                      {emp.department && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
                          <Building2 size={12} />
                          <span>{emp.department.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
          <UserCircle size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p>No employees found</p>
        </div>
      )}

      <AnimatePresence>
        {showAdd && <AddEmployeeModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); load() }} depts={depts} />}
      </AnimatePresence>
    </Layout>
  )
}
