import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, User, Mail, Phone, MapPin, Briefcase } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { employeesApi } from '../api'
import toast from 'react-hot-toast'

export default function AddEmployeeModal({ onClose, onSuccess, depts }) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        department_id: data.department_id ? parseInt(data.department_id) : null,
        joining_date: data.joining_date || null
      }
      const res = await employeesApi.create(payload)
      toast.success(
        `Employee created! Login ID: ${res.data.login_id}`,
        { duration: 6000 }
      )
      toast(`Default password: ${res.data.default_password}`, { icon: '🔑', duration: 8000 })
      onSuccess()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to create employee')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-box"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 560 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontWeight: 700, fontSize: 20, margin: 0 }}>Add New Employee</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>First Name *</label>
              <input {...register('first_name', { required: 'Required' })} className="input-field" placeholder="John" />
              {errors.first_name && <span style={{ color: '#EF4444', fontSize: 12 }}>{errors.first_name.message}</span>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Last Name *</label>
              <input {...register('last_name', { required: 'Required' })} className="input-field" placeholder="Doe" />
              {errors.last_name && <span style={{ color: '#EF4444', fontSize: 12 }}>{errors.last_name.message}</span>}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Email *</label>
            <input {...register('email', { required: 'Required' })} type="email" className="input-field" placeholder="john.doe@company.com" />
            {errors.email && <span style={{ color: '#EF4444', fontSize: 12 }}>{errors.email.message}</span>}
          </div>

          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Role</label>
              <select {...register('role')} className="input-field">
                <option value="employee">Employee</option>
                <option value="hr_officer">HR Officer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Department</label>
              <select {...register('department_id')} className="input-field">
                <option value="">Select Department</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Mobile</label>
              <input {...register('mobile')} className="input-field" placeholder="+91 98765 43210" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Location</label>
              <input {...register('location')} className="input-field" placeholder="Mumbai, MH" />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Joining Date</label>
            <input {...register('joining_date')} type="date" className="input-field" />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {loading ? 'Creating...' : 'Create Employee'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
