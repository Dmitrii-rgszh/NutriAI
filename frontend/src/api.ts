import { useDataStore } from './store'

const API_BASE = 'http://localhost:8000'

let isRefreshing = false
let queue: (()=>void)[] = []

async function refresh() {
  if (isRefreshing) return new Promise<void>(res=>queue.push(res))
  const { refreshToken, setTokens } = useDataStore.getState()
  if (!refreshToken) throw new Error('No refresh token')
  isRefreshing = true
  try {
    const r = await fetch(`${API_BASE}/auth/refresh`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ refresh_token: refreshToken }) })
    if (!r.ok) throw new Error('Refresh failed')
    const data = await r.json()
    setTokens(data.access_token, data.refresh_token)
    queue.forEach(fn=>fn()); queue=[]
  } finally { isRefreshing=false }
}

async function apiFetch(path: string, options: RequestInit = {}, auth = true, retry = true) {
  const { accessToken, setTokens } = useDataStore.getState()
  const headers: Record<string,string> = { 'Content-Type': 'application/json', ...(options.headers as any || {}) }
  if (auth && accessToken) headers['Authorization'] = `Bearer ${accessToken}`
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (res.status === 401 && retry) {
    try {
      await refresh()
      return apiFetch(path, options, auth, false)
    } catch {
      setTokens(null, null)
      throw new Error('Unauthorized')
    }
  }
  if (!res.ok) throw new Error(await res.text())
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  health: () => apiFetch('/health', {}, false),
  authTelegram: async (init_data: string) => {
    const res = await fetch(`${API_BASE}/auth/telegram`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ init_data }) })
    if (!res.ok) throw new Error('Auth failed')
    const data = await res.json()
    useDataStore.getState().setTokens(data.access_token, data.refresh_token)
    useDataStore.getState().setUser(data.user)
    return data
  },
  createOrUpdateUser: (payload: any) => apiFetch('/users', { method:'POST', body: JSON.stringify(payload) }),
  summary: (tg_id: string) => apiFetch(`/summary/${tg_id}`, {}, false),
  listMeals: () => apiFetch('/meals'),
  createMeal: (payload: any) => apiFetch('/meals', { method:'POST', body: JSON.stringify(payload) }),
  updateMeal: (id: number, payload: any) => apiFetch(`/meals/${id}`, { method:'PATCH', body: JSON.stringify(payload) }),
  deleteMeal: (id: number) => apiFetch(`/meals/${id}`, { method:'DELETE' }),
  history: (days: number) => apiFetch(`/history/${days}`),
  forecastWeight: (days: number = 30) => apiFetch(`/forecast/weight?days=${days}`),
  macroGoals: () => apiFetch('/goals/macros'),
  profileOverview: () => apiFetch('/profile/overview'),
  addWeight: (weight_kg: number, date?: string) => apiFetch('/profile/weight', { method:'POST', body: JSON.stringify({ weight_kg, date }) }),
  weightHistory: (days: number = 30) => apiFetch(`/profile/weight/history?days=${days}`),
  addWater: (amount_l: number, date?: string) => apiFetch('/profile/water', { method:'POST', body: JSON.stringify({ amount_l, date }) }),
  setSleep: (hours: number, date?: string) => apiFetch('/profile/sleep', { method:'POST', body: JSON.stringify({ hours, date }) }),
  analyzePhoto: async (file: File) => {
    const { accessToken } = useDataStore.getState()
    if (!accessToken) throw new Error('No auth')
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${API_BASE}/analyze/photo`, { method:'POST', headers:{ 'Authorization': `Bearer ${accessToken}` }, body: form })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

export function logout() {
  const { setTokens, setUser, setMeals, setHistory } = useDataStore.getState()
  setTokens(null, null)
  setUser(null)
  setMeals([])
  setHistory([])
}
