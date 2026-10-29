import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// Global interceptor unwraps AxiosResponse → raw data
client.interceptors.response.use(
  res => res.data,
  err => {
    console.error('API Error:', err)
    return Promise.reject(err)
  }
)

// Explicit Promise<any> so TS stops complaining about AxiosResponse fields
// (runtime interceptor handles unwrapping correctly)

// Dashboard
export const fetchDashboardSummary = (): Promise<any> => client.get('/dashboard/summary')
export const fetchTrend = (days = 7): Promise<any> =>
  client.get(`/dashboard/trend?days=${days}`)

// Logs
export const fetchLogs = (params: Record<string, any>): Promise<any> =>
  client.get('/logs', { params })

export const fetchLogById = (requestId: string): Promise<any> =>
  client.get(`/logs/${requestId}`)

export const fetchSessionLogs = (sessionId: string): Promise<any> =>
  client.get(`/logs/session/${sessionId}`)

// Rules
export const fetchRules = (active?: boolean): Promise<any> =>
  client.get('/rules', { params: active !== undefined ? { active } : {} })

export const createRule = (data: any): Promise<any> => client.post('/rules', data)
export const updateRule = (id: number, data: any): Promise<any> => client.put(`/rules/${id}`, data)
export const deleteRule = (id: number): Promise<any> => client.delete(`/rules/${id}`)
export const toggleRule = (id: number) => client.put(`/rules/${id}/toggle`)
export const fetchRuleHistory = (id: number): Promise<any> =>
  client.get(`/rules/${id}/history`)

// Models
export const fetchModels = (params?: { tier?: number; enabled?: boolean }): Promise<any> =>
  client.get('/models', { params })

export const createModel = (data: any): Promise<any> => client.post('/models', data)
export const updateModel = (id: number, data: any): Promise<any> => client.put(`/models/${id}`, data)
export const deleteModel = (id: number): Promise<any> => client.delete(`/models/${id}`)
export const toggleModel = (id: number): Promise<any> => client.put(`/models/${id}/toggle`)
export const testModel = (id: number): Promise<any> => client.post(`/models/${id}/test`)
export const circuitBreakModel = (id: number): Promise<any> => client.post(`/models/${id}/circuit-break`)

// Alerts
export const fetchAlertRules = (): Promise<any> => client.get('/alerts/rules')
export const createAlertRule = (data: any): Promise<any> => client.post('/alerts/rules', data)
export const updateAlertRule = (id: number, data: any): Promise<any> => client.put(`/alerts/rules/${id}`, data)
export const deleteAlertRule = (id: number): Promise<any> => client.delete(`/alerts/rules/${id}`)
export const fetchAlertHistory = (page = 0, size = 50): Promise<any> =>
  client.get('/alerts/history', { params: { page, size } })

// Settings
export const fetchSettings = (): Promise<any> =>
  client.get('/settings').catch(() => ({}))
export const updateSettings = (data: any) => client.put('/settings', data)
