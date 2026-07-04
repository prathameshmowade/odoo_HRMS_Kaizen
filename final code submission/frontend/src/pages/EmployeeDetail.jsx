import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Camera, Edit2, Plus, Trash2, Mail, Phone, MapPin, Building2, Calendar, User, Award, Book } from 'lucide-react'
import Layout from '../components/Layout'
import { employeesApi } from '../api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function EmployeeDetail() {
  const { id } = useParams()
  const { user, isHROrAdmin } = useAuthStore()
  const [emp, setEmp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('profile')
  const [editMode, setEditMode] = useState(false)
  const [addSkill, setAddSkill] = useState({ show: false, name: '', level: '' })
  const navigate = useNavigate()

  const isSelf = user?.id === parseInt(id)
  const canEdit = isSelf || isHROrAdmin()

  const load = async () => {
    try {
      const res = await employeesApi.get(id)
      setEmp(res.data)
    } catch {
      toast.error('Employee not found')
      navigate('/employees')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const res = await employeesApi.uploadAvatar(id, file)
      setEmp(prev => ({ ...prev, avatar_path: res.data.avatar_path }))
      toast.success('Avatar updated!')
    } catch { toast.error('Upload failed') }
  }

  const handleAddSkill = async () => {
    if (!addSkill.name) return
    try {
      const res = await employeesApi.addSkill(id, { name: addSkill.name, level: addSkill.level })
      setEmp(prev => ({ ...prev, skills: [...(prev.skills || []), res.data] }))
      setAddSkill({ show: false, name: '', level: '' })
      toast.success('Skill added!')
    } catch { toast.error('Failed to add skill') }
  }

  const handleDeleteSkill = async (skillId) => {
    try {
      await employeesApi.deleteSkill(id, skillId)
      setEmp(prev => ({ ...prev, skills: prev.skills.filter(s => s.id !== skillId) }))
      toast.success('Skill removed')
    } catch { toast.error('Failed') }
  }

  if (loading) return <Layout title="Employee"><div style={{ padding: 40 }}>Loading...</div></Layout>
  if (!emp) return null

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'private', label: 'Private Info', show: canEdit },
    { id: 'skills', label: 'Skills & Certs' },
    ...(isHROrAdmin() ? [{ id: 'salary', label: 'Salary', show: true }] : [])
  ].filter(t => t.show !== false)

  return (
    <Layout title="Employee Profile">
      <Link to="/employees" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: 20, fontSize: 14 }}>
        <ArrowLeft size={16} /> Back to Employees
      </Link>

      {/* Profile Header */}
      <motion.div
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: 28, marginBottom: 20 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {emp.avatar_path ? (
              <img src={emp.avatar_path} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-accent)' }} />
            ) : (
              <div className="avatar-placeholder" style={{ width: 80, height: 80, fontSize: 24 }}>
                {emp.first_name?.[0]}{emp.last_name?.[0]}
              </div>
            )}
            {canEdit && (
              <label style={{
                position: 'absolute', bottom: 0, right: 0, width: 26, height: 26,
                background: 'var(--color-accent)', borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-bg-primary)'
              }}>
                <Camera size={12} color="white" />
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
              </label>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <h2 style={{ fontWeight: 800, fontSize: 24, margin: 0 }}>{emp.first_name} {emp.last_name}</h2>
            <div style={{ fontFamily: 'monospace', color: 'var(--color-accent)', fontSize: 13, marginTop: 4 }}>{emp.login_id}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {emp.email && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--color-text-secondary)' }}><Mail size={13} /> {emp.email}</span>}
              {emp.mobile && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--color-text-secondary)' }}><Phone size={13} /> {emp.mobile}</span>}
              {emp.department && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--color-text-secondary)' }}><Building2 size={13} /> {emp.department.name}</span>}
              {emp.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--color-text-secondary)' }}><MapPin size={13} /> {emp.location}</span>}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span className={`badge ${emp.role === 'admin' ? 'badge-danger' : emp.role === 'hr_officer' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: 12 }}>
              {emp.role?.replace('_', ' ')}
            </span>
            {emp.joining_date && (
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
                <Calendar size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Joined {new Date(emp.joining_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--color-bg-card)', borderRadius: 12, padding: 4, width: 'fit-content', border: '1px solid var(--color-border)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: tab === t.id ? 'linear-gradient(135deg, #6C63FF, #5348E0)' : 'transparent',
              color: tab === t.id ? 'white' : 'var(--color-text-muted)',
              fontWeight: 600, fontSize: 13, transition: 'all 0.2s ease'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: 28 }}>
        {tab === 'profile' && (
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>About</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              {emp.profile?.about || 'No bio added yet.'}
            </p>
            <div className="form-grid-2">
              {[
                { label: 'Manager', value: emp.manager ? `${emp.manager.first_name} ${emp.manager.last_name}` : '—' },
                { label: 'Department', value: emp.department?.name || '—' },
                { label: 'Location', value: emp.location || '—' },
                { label: 'Gender', value: emp.profile?.gender || '—' },
              ].map(item => (
                <div key={item.label} style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'private' && emp.profile && (
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Private Information</h3>
            <div className="form-grid-2" style={{ gap: 14 }}>
              {[
                { label: 'Date of Birth', value: emp.profile.dob },
                { label: 'Nationality', value: emp.profile.nationality },
                { label: 'Personal Email', value: emp.profile.personal_email },
                { label: 'Marital Status', value: emp.profile.marital_status },
                { label: 'Bank Name', value: emp.profile.bank_name },
                { label: 'Account Number', value: emp.profile.account_number },
                { label: 'IFSC Code', value: emp.profile.ifsc_code },
                { label: 'PAN Number', value: emp.profile.pan_number },
                { label: 'UAN Number', value: emp.profile.uan_number },
              ].map(item => (
                <div key={item.label} style={{ padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.value || '—'}</div>
                </div>
              ))}
            </div>
            {emp.profile.address && (
              <div style={{ marginTop: 14, padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 3 }}>Address</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{emp.profile.address}</div>
              </div>
            )}
          </div>
        )}

        {tab === 'skills' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Skills</h3>
              {canEdit && (
                <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setAddSkill({ show: true, name: '', level: '' })}>
                  <Plus size={13} /> Add Skill
                </button>
              )}
            </div>

            {addSkill.show && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, padding: 16, background: 'rgba(108,99,255,0.05)', borderRadius: 10, border: '1px solid rgba(108,99,255,0.2)' }}>
                <input className="input-field" style={{ flex: 2 }} placeholder="Skill name" value={addSkill.name} onChange={e => setAddSkill(p => ({ ...p, name: e.target.value }))} />
                <select className="input-field" style={{ flex: 1 }} value={addSkill.level} onChange={e => setAddSkill(p => ({ ...p, level: e.target.value }))}>
                  <option value="">Level</option>
                  <option>Beginner</option><option>Intermediate</option><option>Expert</option>
                </select>
                <button className="btn-primary" style={{ padding: '8px 14px' }} onClick={handleAddSkill}>Save</button>
                <button className="btn-secondary" style={{ padding: '8px 14px' }} onClick={() => setAddSkill({ show: false, name: '', level: '' })}>Cancel</button>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {(emp.skills || []).map(skill => (
                <div key={skill.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)',
                  borderRadius: 20, padding: '6px 14px'
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{skill.name}</span>
                  {skill.level && <span style={{ fontSize: 11, color: 'var(--color-accent)' }}>{skill.level}</span>}
                  {canEdit && (
                    <button onClick={() => handleDeleteSkill(skill.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0 }}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
              {(emp.skills || []).length === 0 && <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>No skills added yet.</p>}
            </div>

            <h3 style={{ fontWeight: 700, fontSize: 16, margin: '28px 0 16px' }}>Certifications</h3>
            {(emp.certifications || []).length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>No certifications added.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {emp.certifications.map(cert => (
                  <div key={cert.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                    <Award size={20} color="var(--color-accent)" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{cert.name}</div>
                      {cert.issuer && <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{cert.issuer}</div>}
                    </div>
                    {cert.issue_date && <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-text-muted)' }}>{cert.issue_date}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'salary' && isHROrAdmin() && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Link to={`/salary/${id}`} className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
              View Salary Structure
            </Link>
          </div>
        )}
      </motion.div>
    </Layout>
  )
}
