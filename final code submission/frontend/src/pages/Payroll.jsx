import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DollarSign, FileText, Send, Plus, Search, Calendar, ChevronRight, X, Printer } from 'lucide-react'
import Layout from '../components/Layout'
import { payrollApi, employeesApi } from '../api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function Payroll() {
  const { user, isHROrAdmin } = useAuthStore()
  const [payrolls, setPayrolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [showGenerate, setShowGenerate] = useState(false)
  const [employees, setEmployees] = useState([])
  const [genForm, setGenForm] = useState({ employee_id: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() })
  const [generating, setGenerating] = useState(false)
  const [slip, setSlip] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      if (isHROrAdmin()) {
        const [payRes, empRes] = await Promise.all([
          payrollApi.getAll(),
          employeesApi.list()
        ])
        setPayrolls(payRes.data)
        setEmployees(empRes.data)
      } else {
        const payRes = await payrollApi.getMy()
        setPayrolls(payRes.data)
      }
    } catch {
      toast.error('Failed to load payroll details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleGenerate = async () => {
    if (!genForm.employee_id) return toast.error('Please select an employee')
    setGenerating(true)
    try {
      await payrollApi.generate({
        employee_id: parseInt(genForm.employee_id),
        month: parseInt(genForm.month),
        year: parseInt(genForm.year)
      })
      toast.success('Payroll generated successfully!')
      setShowGenerate(false)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to generate payroll')
    } finally {
      setGenerating(false)
    }
  }

  const viewSlip = async (id) => {
    try {
      const res = await payrollApi.getSlip(id)
      setSlip(res.data)
    } catch {
      toast.error('Failed to fetch payslip')
    }
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <Layout title="Payroll & Payslips">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 20, margin: 0 }}>Payroll Statements</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 4 }}>History & calculations</p>
        </div>
        {isHROrAdmin() && (
          <button className="btn-primary" onClick={() => setShowGenerate(true)}>
            <Plus size={16} /> Process Payroll
          </button>
        )}
      </div>

      {/* Payroll Table */}
      <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              {isHROrAdmin() && <th>Employee</th>}
              <th>Period</th>
              <th>Working Days</th>
              <th>Payable Days</th>
              <th>Gross Salary</th>
              <th>Net Payable</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>
                  {[...Array(isHROrAdmin() ? 8 : 7)].map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                  ))}
                </tr>
              ))
            ) : payrolls.map(p => (
              <tr key={p.id}>
                {isHROrAdmin() && (
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.employee?.first_name} {p.employee?.last_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{p.employee?.login_id}</div>
                  </td>
                )}
                <td style={{ fontWeight: 600 }}>{months[p.month - 1]} {p.year}</td>
                <td>{p.working_days} days</td>
                <td>{p.payable_days} days</td>
                <td>₹{p.gross_salary?.toLocaleString('en-IN')}</td>
                <td style={{ color: '#10B981', fontWeight: 700 }}>₹{p.net_salary?.toLocaleString('en-IN')}</td>
                <td>
                  <span className="badge badge-success">Processed</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => viewSlip(p.id)}>
                    <FileText size={13} style={{ marginRight: 4 }} /> Payslip
                  </button>
                </td>
              </tr>
            ))}
            {!loading && payrolls.length === 0 && (
              <tr>
                <td colSpan={isHROrAdmin() ? 8 : 7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
                  No payroll records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>

      {/* Generate Payroll Modal */}
      <AnimatePresence>
        {showGenerate && (
          <div className="modal-overlay" onClick={() => setShowGenerate(false)}>
            <motion.div className="modal-box" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>Process Salary Payroll</h3>
                <button onClick={() => setShowGenerate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Select Employee</label>
                  <select className="input-field" value={genForm.employee_id} onChange={e => setGenForm(p => ({ ...p, employee_id: e.target.value }))}>
                    <option value="">Choose Employee</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.login_id})</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Month</label>
                    <select className="input-field" value={genForm.month} onChange={e => setGenForm(p => ({ ...p, month: parseInt(e.target.value) }))}>
                      {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Year</label>
                    <select className="input-field" value={genForm.year} onChange={e => setGenForm(p => ({ ...p, year: parseInt(e.target.value) }))}>
                      {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowGenerate(false)}>Cancel</button>
                <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleGenerate} disabled={generating}>
                  {generating ? 'Processing...' : 'Generate Statement'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Payslip Modal */}
      <AnimatePresence>
        {slip && (
          <div className="modal-overlay" onClick={() => setSlip(null)}>
            <motion.div className="modal-box" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>Salary Payslip</h3>
                <button onClick={() => setSlip(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
              </div>

              {/* Payslip sheet */}
              <div id="payslip-sheet" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 24, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--color-border)', paddingBottom: 16, marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>GLOBAL HR SOLUTIONS</h2>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Salary Statement</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>Period: {months[slip.month - 1]} {slip.year}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>Generated: {new Date(slip.generated_at).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <div style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>Employee Name</div>
                    <div style={{ fontWeight: 600 }}>{slip.employee?.first_name} {slip.employee?.last_name}</div>
                    <div style={{ fontSize: 11, fontFamily: 'monospace', marginTop: 2 }}>ID: {slip.employee?.login_id}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>Attendance Record</div>
                    <div>Working days: {slip.working_days}</div>
                    <div style={{ fontWeight: 600 }}>Payable days: {slip.payable_days}</div>
                  </div>
                </div>

                {/* Allowances & Deductions grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '16px 0', marginBottom: 16 }}>
                  {/* Allowances */}
                  <div>
                    <h4 style={{ margin: '0 0 10px', color: '#10B981', fontSize: 12, uppercase: true }}>Earnings</h4>
                    {slip.breakdown?.allowances?.map((allow, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span>{allow.name}</span>
                        <span>₹{allow.amount?.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--color-border)', marginTop: 8, paddingTop: 8, fontWeight: 700 }}>
                      <span>Total Earnings</span>
                      <span>₹{slip.total_allowances?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: 20 }}>
                    <h4 style={{ margin: '0 0 10px', color: '#EF4444', fontSize: 12, uppercase: true }}>Deductions</h4>
                    {slip.breakdown?.deductions?.map((ded, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span>{ded.name}</span>
                        <span>₹{ded.amount?.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--color-border)', marginTop: 8, paddingTop: 8, fontWeight: 700 }}>
                      <span>Total Deductions</span>
                      <span>₹{slip.total_deductions?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Final payable */}
                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: 14 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Net Salary Payable</span>
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#10B981' }}>₹{slip.net_salary?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => window.print()}>
                  <Printer size={14} /> Print Payslip
                </button>
                <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setSlip(null)}>Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
