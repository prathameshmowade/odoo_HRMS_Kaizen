import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import logo from '../assets/logo.jpg'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Zap, LogIn } from 'lucide-react'
import { authApi } from '../api'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await authApi.login(data)
      setAuth(res.data.user, res.data.access_token, res.data.refresh_token)
      toast.success(`Welcome back, ${res.data.user.first_name}!`)
      navigate('/dashboard')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background blobs */}
      <div style={{
        position: 'absolute', top: '20%', left: '10%', width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(108,99,255,0.15), transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)'
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '10%', width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(167,139,250,0.1), transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 420, padding: 20, position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            style={{
              width: 60, height: 60, borderRadius: 16,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16, boxShadow: '0 0 40px rgba(108,99,255,0.4)',
              overflow: 'hidden'
            }}
          >
            <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Logo" />
          </motion.div>
          <h1 style={{ fontWeight: 800, fontSize: 22, margin: 0, letterSpacing: '-0.5px' }}>
            Welcome to <span className="gradient-text">GLOBAL HR SOLUTIONS</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 8, fontSize: 14 }}>
            Sign in to your account to continue
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Employee ID / Login ID
              </label>
              <input
                {...register('login_id', { required: 'Login ID is required' })}
                className="input-field"
                placeholder="e.g. JODO20250001"
                autoComplete="username"
              />
              {errors.login_id && <span style={{ color: '#EF4444', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.login_id.message}</span>}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPw ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{ paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)'
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span style={{ color: '#EF4444', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.password.message}</span>}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%', padding: '13px',
                background: loading ? 'rgba(108,99,255,0.5)' : 'linear-gradient(135deg, #6C63FF, #5348E0)',
                color: 'white', border: 'none', borderRadius: 12,
                fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.3s ease',
                boxShadow: loading ? 'none' : '0 8px 20px rgba(108,99,255,0.4)'
              }}
            >
              {loading ? (
                <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In
                </>
              )}
            </motion.button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--color-text-muted)' }}>
          New company?{' '}
          <Link to="/register" style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>
            Register here
          </Link>
        </div>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
