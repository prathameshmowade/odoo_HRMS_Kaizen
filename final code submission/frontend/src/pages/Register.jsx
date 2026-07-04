import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import logo from '../assets/logo.jpg'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Zap, Building2, UserCircle, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { authApi } from '../api'

const steps = [
  { id: 1, title: 'Company Info', icon: Building2 },
  { id: 2, title: 'Admin Account', icon: UserCircle },
  { id: 3, title: 'Complete!', icon: CheckCircle },
]

export default function Register() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const { register, handleSubmit, getValues, formState: { errors } } = useForm()
  const navigate = useNavigate()

  const onSubmit = async (data) => {
    if (step === 1) { setStep(2); return }
    setLoading(true)
    try {
      const res = await authApi.registerCompany({
        company_name: data.company_name,
        company_email: data.company_email,
        admin_first_name: data.admin_first_name,
        admin_last_name: data.admin_last_name,
        admin_email: data.admin_email,
        admin_password: data.admin_password,
      })
      setResult(res.data)
      setStep(3)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--color-bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', padding: 20
    }}>
      <div style={{
        position: 'absolute', top: '15%', right: '15%', width: 350, height: 350,
        background: 'radial-gradient(circle, rgba(167,139,250,0.12), transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14, boxShadow: '0 0 30px rgba(108,99,255,0.35)',
            overflow: 'hidden'
          }}>
            <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Logo" />
          </div>
          <h1 style={{ fontWeight: 800, fontSize: 22, margin: 0, letterSpacing: '-0.5px' }}>
            Setup <span className="gradient-text">GLOBAL HR SOLUTIONS</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 6, fontSize: 14 }}>
            Register your company to get started
          </p>
        </div>

        {/* Progress steps */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 0 }}>
          {steps.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step >= s.id ? 'linear-gradient(135deg, #6C63FF, #A78BFA)' : 'rgba(255,255,255,0.05)',
                border: step >= s.id ? 'none' : '1px solid var(--color-border)',
                color: step >= s.id ? 'white' : 'var(--color-text-muted)',
                fontWeight: 700, fontSize: 13, transition: 'all 0.3s ease'
              }}>
                {step > s.id ? <CheckCircle size={16} /> : s.id}
              </div>
              <div style={{ fontSize: 11, color: step >= s.id ? 'var(--color-accent)' : 'var(--color-text-muted)', marginLeft: 6, fontWeight: 500 }}>
                {s.title}
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: 40, height: 1, background: step > s.id ? 'var(--color-accent)' : 'var(--color-border)', margin: '0 12px', transition: 'all 0.3s ease' }} />
              )}
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ padding: 32 }}>
          <AnimatePresence mode="wait">
            {step === 3 ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(16,185,129,0.15)', border: '2px solid #10B981',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20
                }}>
                  <CheckCircle size={32} color="#10B981" />
                </div>
                <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>You're all set!</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: 14 }}>
                  Your company has been registered. Save your login credentials:
                </p>
                <div style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 12, padding: 20, marginBottom: 24, textAlign: 'left' }}>
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Your Login ID</span>
                    <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: 'var(--color-accent)', marginTop: 4 }}>{result?.login_id}</div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                    Use the password you set during registration to login.
                  </p>
                </div>
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13 }} onClick={() => navigate('/login')}>
                  Go to Login <ArrowRight size={16} />
                </button>
              </motion.div>
            ) : (
              <motion.form key={`step-${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSubmit(onSubmit)}>
                {step === 1 && (
                  <>
                    <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: 18 }}>Company Information</h3>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Company Name *</label>
                      <input {...register('company_name', { required: 'Required' })} className="input-field" placeholder="Acme Corp" />
                      {errors.company_name && <span style={{ color: '#EF4444', fontSize: 12 }}>{errors.company_name.message}</span>}
                    </div>
                    <div style={{ marginBottom: 24 }}>
                      <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Company Email</label>
                      <input {...register('company_email')} className="input-field" placeholder="contact@acme.com" />
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: 18 }}>Admin Account</h3>
                    <div className="form-grid-2" style={{ marginBottom: 16 }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>First Name *</label>
                        <input {...register('admin_first_name', { required: 'Required' })} className="input-field" placeholder="John" />
                        {errors.admin_first_name && <span style={{ color: '#EF4444', fontSize: 12 }}>{errors.admin_first_name.message}</span>}
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Last Name *</label>
                        <input {...register('admin_last_name', { required: 'Required' })} className="input-field" placeholder="Doe" />
                        {errors.admin_last_name && <span style={{ color: '#EF4444', fontSize: 12 }}>{errors.admin_last_name.message}</span>}
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Admin Email *</label>
                      <input {...register('admin_email', { required: 'Required' })} type="email" className="input-field" placeholder="admin@acme.com" />
                      {errors.admin_email && <span style={{ color: '#EF4444', fontSize: 12 }}>{errors.admin_email.message}</span>}
                    </div>
                    <div style={{ marginBottom: 24 }}>
                      <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Password *</label>
                      <input {...register('admin_password', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })} type="password" className="input-field" placeholder="Min 6 characters" />
                      {errors.admin_password && <span style={{ color: '#EF4444', fontSize: 12 }}>{errors.admin_password.message}</span>}
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 12 }}>
                  {step === 2 && (
                    <button type="button" className="btn-secondary" onClick={() => setStep(1)} style={{ flex: 1, justifyContent: 'center' }}>
                      <ArrowLeft size={14} /> Back
                    </button>
                  )}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      flex: 1, padding: '12px', justifyContent: 'center',
                      background: 'linear-gradient(135deg, #6C63FF, #5348E0)',
                      color: 'white', border: 'none', borderRadius: 10,
                      fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8
                    }}
                  >
                    {loading ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : step === 1 ? (<>Next <ArrowRight size={14} /></>) : 'Create Account'}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </div>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
