import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Plus, Edit2, Trash2, Check, X, Shield, Users } from 'lucide-react'
import Layout from '../components/Layout'
import { companyApi, employeesApi } from '../api'
import toast from 'react-hot-toast'

export default function Company() {
  const [company, setCompany] = useState(null)
  const [depts, setDepts] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddDept, setShowAddDept] = useState(false)
  const [deptForm, setDeptForm] = useState({ name: '', manager_id: '' })
  const [logoFile, setLogoFile] = useState(null)

  const load = async () => {
    try {
      const [compRes, deptRes, empRes] = await Promise.all([
        companyApi.get(),
        companyApi.getDepts(),
        employeesApi.list()
      ])
      setCompany(compRes.data)
      setDepts(deptRes.data)
      setEmployees(empRes.data)
    } catch {
      toast.error('Failed to load company details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const res = await companyApi.uploadLogo(file)
      setCompany(prev => ({ ...prev, logo_path: res.data.logo_path }))
      toast.success('Company logo updated!')
    } catch {
      toast.error('Failed to upload logo')
    }
  }

  const handleAddDept = async () => {
    if (!deptForm.name) return toast.error('Department name is required')
    try {
      await companyApi.createDept({
        name: deptForm.name,
        manager_id: deptForm.manager_id ? parseInt(deptForm.manager_id) : null
      })
      toast.success('Department created!')
      setShowAddDept(false)
      setDeptForm({ name: '', manager_id: '' })
      load()
    } catch {
      toast.error('Failed to create department')
    }
  }

  const handleDeleteDept = async (id) => {
    if (!confirm('Are you sure you want to delete this department?')) return
    try {
      await companyApi.deleteDept(id)
      toast.success('Department deleted')
      load()
    } catch {
      toast.error('Failed to delete department')
    }
  }

  if (loading) return <Layout title="Company Settings"><div style={{ padding: 40 }}>Loading...</div></Layout>

  return (
    <Layout title="Company & Departments">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        {/* Left Side: Company Info & Logo */}
        <motion.div className="glass-card" style={{ padding: 24, height: 'fit-content' }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(108,99,255,0.1)', display: 'flex', alignItems: 'center', justify: 'center' }}>
              <Building2 size={20} color="var(--color-accent)" />
            </div>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>Company Profile</h3>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: 16, display: 'flex', alignItems: 'center', justify: 'center', overflow: 'hidden' }}>
              {company?.logo_path ? (
                <img src={company.logo_path} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <Building2 size={36} color="var(--color-text-muted)" />
              )}
            </div>
            <label className="btn-secondary" style={{ display: 'inline-flex', padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
              Upload Logo
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Company Name</span>
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{company?.name}</div>
            </div>
            <div>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Corporate Email</span>
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{company?.email || '—'}</div>
            </div>
            <div>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Contact Phone</span>
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{company?.phone || '—'}</div>
            </div>
            <div>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Corporate Address</span>
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{company?.address || '—'}</div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Departments management */}
        <motion.div className="glass-card" style={{ padding: 24 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>Departments</h3>
            <button className="btn-primary" onClick={() => setShowAddDept(true)}>
              <Plus size={16} /> Add Department
            </button>
          </div>

          <AnimatePresence>
            {showAddDept && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18, marginBottom: 20
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Department Name</label>
                    <input className="input-field" placeholder="e.g. Engineering" value={deptForm.name} onChange={e => setDeptForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Department Manager</label>
                    <select className="input-field" value={deptForm.manager_id} onChange={e => setDeptForm(p => ({ ...p, manager_id: e.target.value }))}>
                      <option value="">Select Manager</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-success" onClick={handleAddDept}><Check size={14} /> Add</button>
                  <button className="btn-secondary" onClick={() => setShowAddDept(false)}><X size={14} /> Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <table className="data-table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Manager</th>
                <th>Employees Count</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {depts.map(dept => (
                <tr key={dept.id}>
                  <td style={{ fontWeight: 600 }}>{dept.name}</td>
                  <td>
                    {dept.manager ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar-placeholder" style={{ width: 24, height: 24, fontSize: 9 }}>
                          {dept.manager.first_name?.[0]}{dept.manager.last_name?.[0]}
                        </div>
                        <span style={{ fontSize: 13 }}>{dept.manager.first_name} {dept.manager.last_name}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Users size={14} style={{ opacity: 0.5 }} />
                      {dept.employee_count}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-danger" style={{ padding: '6px' }} onClick={() => handleDeleteDept(dept.id)}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {depts.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-text-muted)' }}>No departments configured.</td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
      </div>
    </Layout>
  )
}
