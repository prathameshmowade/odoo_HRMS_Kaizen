import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, Phone, MapPin, Building2, Key, Edit2, Check, X, Shield, Lock } from 'lucide-react'
import Layout from '../components/Layout'
import { authApi, employeesApi } from '../api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, updateUser } = useAuthStore()
  const [emp, setEmp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingBasic, setEditingBasic] = useState(false)
  const [basicForm, setBasicForm] = useState({ first_name: '', last_name: '', mobile: '', location: '' })
  const [editingPrivate, setEditingPrivate] = useState(false)
  const [privateForm, setPrivateForm] = useState({
    dob: '', nationality: '', personal_email: '', gender: '', marital_status: '',
    address: '', bank_name: '', account_number: '', ifsc_code: '', pan_number: '', uan_number: '', hobbies: '', about: ''
  })
  const [editingSecurity, setEditingSecurity] = useState(false)
  const [secForm, setSecForm] = useState({ current_password: '', new_password: '', confirm_password: '' })

  const load = async () => {
    try {
      const res = await employeesApi.get(user.id)
      setEmp(res.data)
      setBasicForm({
        first_name: res.data.first_name,
        last_name: res.data.last_name,
        mobile: res.data.mobile || '',
        location: res.data.location || ''
      })
      if (res.data.profile) {
        setPrivateForm({
          dob: res.data.profile.dob || '',
          nationality: res.data.profile.nationality || '',
          personal_email: res.data.profile.personal_email || '',
          gender: res.data.profile.gender || '',
          marital_status: res.data.profile.marital_status || '',
          address: res.data.profile.address || '',
          bank_name: res.data.profile.bank_name || '',
          account_number: res.data.profile.account_number || '',
          ifsc_code: res.data.profile.ifsc_code || '',
          pan_number: res.data.profile.pan_number || '',
          uan_number: res.data.profile.uan_number || '',
          hobbies: res.data.profile.hobbies || '',
          about: res.data.profile.about || ''
        })
      }
    } catch {
      toast.error('Failed to load profile details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleUpdateBasic = async () => {
    try {
      await employeesApi.update(user.id, basicForm)
      toast.success('Basic information updated!')
      updateUser({ first_name: basicForm.first_name, last_name: basicForm.last_name })
      setEditingBasic(false)
      load()
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleUpdatePrivate = async () => {
    try {
      await employeesApi.updateProfile(user.id, privateForm)
      toast.success('Private profile details updated!')
      setEditingPrivate(false)
      load()
    } catch {
      toast.error('Failed to update details')
    }
  }

  const handleUpdateSecurity = async () => {
    if (secForm.new_password !== secForm.confirm_password) {
      return toast.error('New passwords do not match')
    }
    try {
      await authApi.changePassword({
        current_password: secForm.current_password,
        new_password: secForm.new_password
      })
      toast.success('Password changed successfully!')
      setEditingSecurity(false)
      setSecForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to change password')
    }
  }

  if (loading) return <Layout title="My Profile"><div style={{ padding: 40 }}>Loading...</div></Layout>

  return (
    <Layout title="My Profile Settings">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left: Basic Info & Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Basic Info */}
          <motion.div className="glass-card" style={{ padding: 24 }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>Basic Information</h3>
              {!editingBasic ? (
                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setEditingBasic(true)}>
                  <Edit2 size={13} style={{ marginRight: 4 }} /> Edit
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-success" style={{ padding: '4px 10px', fontSize: 12 }} onClick={handleUpdateBasic}><Check size={12} /></button>
                  <button className="btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setEditingBasic(false)}><X size={12} /></button>
                </div>
              )}
            </div>

            {editingBasic ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>First Name</label>
                    <input className="input-field" value={basicForm.first_name} onChange={e => setBasicForm(p => ({ ...p, first_name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Last Name</label>
                    <input className="input-field" value={basicForm.last_name} onChange={e => setBasicForm(p => ({ ...p, last_name: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Mobile</label>
                  <input className="input-field" value={basicForm.mobile} onChange={e => setBasicForm(p => ({ ...p, mobile: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Location</label>
                  <input className="input-field" value={basicForm.location} onChange={e => setBasicForm(p => ({ ...p, location: e.target.value }))} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Full Name</span>
                  <span style={{ fontWeight: 600 }}>{emp.first_name} {emp.last_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Email Address</span>
                  <span style={{ fontWeight: 600 }}>{emp.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Mobile</span>
                  <span style={{ fontWeight: 600 }}>{emp.mobile || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Work Location</span>
                  <span style={{ fontWeight: 600 }}>{emp.location || '—'}</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Security & Password */}
          <motion.div className="glass-card" style={{ padding: 24 }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>Security Settings</h3>
              {!editingSecurity ? (
                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setEditingSecurity(true)}>
                  <Lock size={13} style={{ marginRight: 4 }} /> Change
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-success" style={{ padding: '4px 10px', fontSize: 12 }} onClick={handleUpdateSecurity}><Check size={12} /></button>
                  <button className="btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setEditingSecurity(false)}><X size={12} /></button>
                </div>
              )}
            </div>

            {editingSecurity ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Current Password</label>
                  <input type="password" className="input-field" value={secForm.current_password} onChange={e => setSecForm(p => ({ ...p, current_password: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>New Password</label>
                  <input type="password" className="input-field" value={secForm.new_password} onChange={e => setSecForm(p => ({ ...p, new_password: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Confirm New Password</label>
                  <input type="password" className="input-field" value={secForm.confirm_password} onChange={e => setSecForm(p => ({ ...p, confirm_password: e.target.value }))} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'rgba(108,99,255,0.05)', borderRadius: 10, border: '1px solid rgba(108,99,255,0.1)' }}>
                <Shield size={20} color="var(--color-accent)" />
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Modify your login credentials and security tokens periodically.</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right: Private info */}
        <motion.div className="glass-card" style={{ padding: 24 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>Private Profile Information</h3>
            {!editingPrivate ? (
              <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setEditingPrivate(true)}>
                <Edit2 size={13} style={{ marginRight: 4 }} /> Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-success" style={{ padding: '4px 10px', fontSize: 12 }} onClick={handleUpdatePrivate}><Check size={12} /></button>
                <button className="btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setEditingPrivate(false)}><X size={12} /></button>
              </div>
            )}
          </div>

          {editingPrivate ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>About/Bio</label>
                <textarea className="input-field" rows={2} value={privateForm.about} onChange={e => setPrivateForm(p => ({ ...p, about: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Date of Birth</label>
                  <input type="date" className="input-field" value={privateForm.dob} onChange={e => setPrivateForm(p => ({ ...p, dob: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Nationality</label>
                  <input className="input-field" value={privateForm.nationality} onChange={e => setPrivateForm(p => ({ ...p, nationality: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Personal Email</label>
                  <input className="input-field" value={privateForm.personal_email} onChange={e => setPrivateForm(p => ({ ...p, personal_email: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Marital Status</label>
                  <select className="input-field" value={privateForm.marital_status} onChange={e => setPrivateForm(p => ({ ...p, marital_status: e.target.value }))}>
                    <option value="">Select status</option>
                    <option>Single</option><option>Married</option><option>Divorced</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Bank Name</label>
                  <input className="input-field" value={privateForm.bank_name} onChange={e => setPrivateForm(p => ({ ...p, bank_name: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Account Number</label>
                  <input className="input-field" value={privateForm.account_number} onChange={e => setPrivateForm(p => ({ ...p, account_number: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>IFSC Code</label>
                  <input className="input-field" value={privateForm.ifsc_code} onChange={e => setPrivateForm(p => ({ ...p, ifsc_code: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>PAN Number</label>
                  <input className="input-field" value={privateForm.pan_number} onChange={e => setPrivateForm(p => ({ ...p, pan_number: e.target.value }))} />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Bio / About</span>
                <div style={{ fontWeight: 500, fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{emp.profile?.about || 'No details provided.'}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Date of Birth</span>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{emp.profile?.dob || '—'}</div>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Nationality</span>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{emp.profile?.nationality || '—'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Personal Email</span>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{emp.profile?.personal_email || '—'}</div>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Marital Status</span>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{emp.profile?.marital_status || '—'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Bank & Branch</span>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{emp.profile?.bank_name || '—'}</div>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Account Number</span>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{emp.profile?.account_number || '—'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>PAN ID Number</span>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{emp.profile?.pan_number || '—'}</div>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>UAN Provident Number</span>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{emp.profile?.uan_number || '—'}</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  )
}
