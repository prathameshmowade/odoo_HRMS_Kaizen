import api from './client'

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  registerCompany: (data) => api.post('/auth/register/company', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  getMe: () => api.get('/auth/me'),
}

export const employeesApi = {
  list: (params) => api.get('/employees/', { params }),
  get: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees/', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  updateProfile: (id, data) => api.put(`/employees/${id}/profile`, data),
  uploadAvatar: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/employees/${id}/avatar`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  addSkill: (id, data) => api.post(`/employees/${id}/skills`, data),
  deleteSkill: (id, skillId) => api.delete(`/employees/${id}/skills/${skillId}`),
  addCert: (id, data) => api.post(`/employees/${id}/certifications`, data),
}

export const attendanceApi = {
  clockIn: () => api.post('/attendance/clock-in'),
  clockOut: () => api.post('/attendance/clock-out'),
  getStatus: () => api.get('/attendance/status'),
  getMy: (params) => api.get('/attendance/my', { params }),
  getAll: (params) => api.get('/attendance/', { params }),
  getSummary: () => api.get('/attendance/summary'),
}

export const leavesApi = {
  getTypes: () => api.get('/leaves/types'),
  getBalances: () => api.get('/leaves/balances/my'),
  apply: (data) => api.post('/leaves/apply', data),
  getMy: () => api.get('/leaves/my'),
  getAll: (params) => api.get('/leaves/', { params }),
  approve: (id) => api.put(`/leaves/${id}/approve`),
  reject: (id, data) => api.put(`/leaves/${id}/reject`, data),
  cancel: (id) => api.put(`/leaves/${id}/cancel`),
  getCalendar: (params) => api.get('/leaves/calendar', { params }),
  uploadCert: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/leaves/${id}/upload-certificate`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

export const salaryApi = {
  get: (empId) => api.get(`/salary/${empId}`),
  update: (empId, data) => api.put(`/salary/${empId}`, data),
  addComponent: (empId, data) => api.post(`/salary/${empId}/components`, data),
  updateComponent: (empId, compId, data) => api.put(`/salary/${empId}/components/${compId}`, data),
  deleteComponent: (empId, compId) => api.delete(`/salary/${empId}/components/${compId}`),
}

export const payrollApi = {
  generate: (data) => api.post('/payroll/generate', data),
  getMy: () => api.get('/payroll/my'),
  getAll: (params) => api.get('/payroll/', { params }),
  getSlip: (id) => api.get(`/payroll/${id}`),
}

export const companyApi = {
  get: () => api.get('/company/'),
  update: (data) => api.put('/company/', data),
  uploadLogo: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/company/logo', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  getDepts: () => api.get('/company/departments'),
  createDept: (data) => api.post('/company/departments', data),
  updateDept: (id, data) => api.put(`/company/departments/${id}`, data),
  deleteDept: (id) => api.delete(`/company/departments/${id}`),
  getDashboardStats: () => api.get('/company/dashboard-stats'),
}
