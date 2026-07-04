import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, Trash2, Edit2, Check, X, DollarSign } from 'lucide-react'
import Layout from '../components/Layout'
import { salaryApi, employeesApi } from '../api'
import toast from 'react-hot-toast'

export default function Salary() {
  const { id } = useParams()
  const [emp, setEmp] = useState(null)
  const [salary, setSalary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editWage, setEditWage] = useState(false)
  const [wageForm, setWageForm] = useState({ monthly_wage: 0, working_days: 26, break_time: 60 })
  const [showAddComponent, setShowAddComponent] = useState(false)
  const [compForm, setCompForm] = useState({ name: '', component_type: 'allowance', calc_type: 'fixed', value: 0 })

  const load = async () => {
    try {
      const [empRes, salaryRes] = await Promise.all([
        employeesApi.get(id),
        salaryApi.get(id)
      ])
      setEmp(empRes.data)
      setSalary(salaryRes.data)
      if (salaryRes.data?.exists) {
        setWageForm({
          monthly_wage: salaryRes.data.monthly_wage,
          working_days: salaryRes.data.working_days,
          break_time: salaryRes.data.break_time
        })
      }
    } catch (e) {
      toast.error('Failed to load salary structure')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleUpdateWage = async () => {
    try {
      await salaryApi.update(id, wageForm)
      toast.success('Wage structure updated!')
      setEditWage(false)
      load()
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleAddComponent = async () => {
    if (!compForm.name || compForm.value <= 0) return toast.error('Please enter valid name and value')
    try {
      await salaryApi.addComponent(id, compForm)
      toast.success('Salary component added')
      setShowAddComponent(false)
      setCompForm({ name: '', component_type: 'allowance', calc_type: 'fixed', value: 0 })
      load()
    } catch {
      toast.error('Failed to add component')
    }
  }

  const handleDeleteComponent = async (compId) => {
    try {
      await salaryApi.deleteComponent(id, compId)
      toast.success('Component deleted')
      load()
    } catch {
      toast.error('Failed to delete')
    }
  }

  if (loading) return <Layout title="Salary"><div style={{ padding: 40 }}>Loading...</div></Layout>

  return (
    <Layout title={`Salary Structure — ${emp?.first_name} ${emp?.last_name}`}>
      <Link to={`/employees/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: 20, fontSize: 14 }}>
        <ArrowLeft size={16} /> Back to Profile
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20 }}>
        {/* Basic Structure Card */}
        <motion.div className="glass-card" style={{ padding: 24, height: 'fit-content' }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justify: 'center' }}>
              <DollarSign size={20} color="#10B981" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>Base Salary Info</h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>Configured pay grades</p>
            </div>
          </div>

          {editWage ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Monthly Wage (₹)</label>
                <input type="number" className="input-field" value={wageForm.monthly_wage} onChange={e => setWageForm(p => ({ ...p, monthly_wage: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Standard Working Days</label>
                <input type="number" className="input-field" value={wageForm.working_days} onChange={e => setWageForm(p => ({ ...p, working_days: parseInt(e.target.value) || 26 }))} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Daily Break Time (mins)</label>
                <input type="number" className="input-field" value={wageForm.break_time} onChange={e => setWageForm(p => ({ ...p, break_time: parseInt(e.target.value) || 60 }))} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button className="btn-success" onClick={handleUpdateWage} style={{ flex: 1, padding: '8px', justifyContent: 'center' }}><Check size={14} /> Save</button>
                <button className="btn-secondary" onClick={() => setEditWage(false)} style={{ flex: 1, padding: '8px', justifyContent: 'center' }}><X size={14} /> Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Monthly Base</span>
                  <span style={{ fontWeight: 700 }}>₹{salary?.monthly_wage?.toLocaleString('en-IN') || '0'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Yearly CTC</span>
                  <span style={{ fontWeight: 700 }}>₹{salary?.yearly_wage?.toLocaleString('en-IN') || '0'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Working Days</span>
                  <span style={{ fontWeight: 700 }}>{salary?.working_days || '26'} days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Break Time</span>
                  <span style={{ fontWeight: 700 }}>{salary?.break_time || '60'} mins</span>
                </div>
              </div>
              <button className="btn-primary" onClick={() => setEditWage(true)} style={{ width: '100%', justifyContent: 'center' }}>
                <Edit2 size={14} /> Edit Structure
              </button>
            </div>
          )}
        </motion.div>

        {/* Components breakdown */}
        <motion.div className="glass-card" style={{ padding: 24 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>Salary Components Breakdown</h3>
            <button className="btn-primary" onClick={() => setShowAddComponent(true)} style={{ padding: '6px 14px', fontSize: 12 }}>
              <Plus size={14} /> Add Component
            </button>
          </div>

          <AnimatePresence>
            {showAddComponent && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18, marginBottom: 20
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Component Name</label>
                    <input className="input-field" placeholder="e.g. Travel Allowance" value={compForm.name} onChange={e => setCompForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Type</label>
                    <select className="input-field" value={compForm.component_type} onChange={e => setCompForm(p => ({ ...p, component_type: e.target.value }))}>
                      <option value="allowance">Allowance</option>
                      <option value="deduction">Deduction</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Calculation Method</label>
                    <select className="input-field" value={compForm.calc_type} onChange={e => setCompForm(p => ({ ...p, calc_type: e.target.value }))}>
                      <option value="fixed">Fixed Amount (₹)</option>
                      <option value="percentage">Percentage of Base (%)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Value</label>
                    <input type="number" className="input-field" value={compForm.value} onChange={e => setCompForm(p => ({ ...p, value: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-success" onClick={handleAddComponent}><Check size={14} /> Add</button>
                  <button className="btn-secondary" onClick={() => setShowAddComponent(false)}><X size={14} /> Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Calc Method</th>
                <th>Rate / Value</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {salary?.all_components?.map(comp => (
                <tr key={comp.id}>
                  <td style={{ fontWeight: 600 }}>{comp.name}</td>
                  <td>
                    <span className={`badge ${comp.component_type === 'allowance' ? 'badge-success' : 'badge-danger'}`}>
                      {comp.component_type}
                    </span>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{comp.calc_type}</td>
                  <td style={{ fontWeight: 600 }}>{comp.calc_type === 'percentage' ? `${comp.value}%` : `₹${comp.value}`}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-danger" style={{ padding: '6px' }} onClick={() => handleDeleteComponent(comp.id)}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {!salary?.all_components?.length && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-text-muted)' }}>
                    No special salary components configured. Defaults will apply during payroll calculation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
      </div>
    </Layout>
  )
}
