import { create } from 'zustand'

// LocalStorage helpers
const LS = {
  theme: 'nutri_theme',
  user: 'nutri_user',
  access: 'nutri_access',
  refresh: 'nutri_refresh',
  meals: 'nutri_meals',
  history: 'nutri_history'
}
const loadJSON = <T,>(key: string): T | null => {
  try { const v = localStorage.getItem(key); return v? JSON.parse(v) as T : null } catch { return null }
}
const saveJSON = (key: string, v: any) => { try { localStorage.setItem(key, JSON.stringify(v)) } catch {} }

interface UserProfile {
  telegram_id: string
  username?: string | null
  age?: number | null
  gender?: string | null
  height?: number | null
  weight?: number | null
  target_weight?: number | null
  activity_level?: string | null
  goal?: string | null
  daily_calories?: number | null
}

interface Meal {
  id?: number
  food_name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  meal_type: string
  created_at?: string
}

interface UIState {
  theme: 'dark' | 'light'
  onboardingOpen: boolean
  toggleTheme: () => void
  openOnboarding: () => void
  closeOnboarding: () => void
}

interface Toast { id: string; msg: string; type?: 'info'|'error'|'success'; }

interface DataState {
  user?: UserProfile | null
  meals: Meal[]
  accessToken: string | null
  refreshToken: string | null
  history: any[]
  toasts: Toast[]
  setUser: (u: UserProfile | null) => void
  setMeals: (m: Meal[]) => void
  addMeal: (m: Meal) => void
  updateMeal: (m: Meal) => void
  removeMeal: (id: number) => void
  setTokens: (a: string | null, r: string | null) => void
  setHistory: (h: any[]) => void
  pushToast: (msg: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

const initialTheme = (loadJSON<string>(LS.theme) as 'dark' | 'light') || 'dark'
const initialUser = loadJSON<UserProfile>(LS.user)
const initialMeals = loadJSON<Meal[]>(LS.meals) || []
const initialHistory = loadJSON<any[]>(LS.history) || []
const initialAccess = localStorage.getItem(LS.access)
const initialRefresh = localStorage.getItem(LS.refresh)

export const useUIStore = create<UIState>((set) => ({
  theme: initialTheme,
  onboardingOpen: !initialUser, // откроем онбординг если пользователя нет
  toggleTheme: () => set(s => { const next = s.theme === 'dark' ? 'light' : 'dark'; saveJSON(LS.theme, next); return { theme: next } }),
  openOnboarding: () => set({ onboardingOpen: true }),
  closeOnboarding: () => set({ onboardingOpen: false })
}))

export const useDataStore = create<DataState>((set) => ({
  user: initialUser,
  meals: initialMeals,
  accessToken: initialAccess,
  refreshToken: initialRefresh,
  history: initialHistory,
  toasts: [],
  setUser: (u) => { saveJSON(LS.user, u); set({ user: u }) },
  setMeals: (m) => { saveJSON(LS.meals, m); set({ meals: m }) },
  addMeal: (m) => set(state => { const meals=[m, ...state.meals]; saveJSON(LS.meals, meals); return { meals } }),
  updateMeal: (m) => set(state => { const meals=state.meals.map(x => x.id === m.id ? m : x); saveJSON(LS.meals, meals); return { meals } }),
  removeMeal: (id) => set(state => { const meals=state.meals.filter(x => x.id !== id); saveJSON(LS.meals, meals); return { meals } }),
  setTokens: (a, r) => { if(a) localStorage.setItem(LS.access,a); else localStorage.removeItem(LS.access); if(r) localStorage.setItem(LS.refresh,r); else localStorage.removeItem(LS.refresh); set({ accessToken: a, refreshToken: r }) },
  setHistory: (h) => { saveJSON(LS.history, h); set({ history: h }) },
  pushToast: (msg, type='info') => set(state => ({ toasts: [...state.toasts, { id: crypto.randomUUID(), msg, type }] })),
  removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t=> t.id !== id) }))
}))
