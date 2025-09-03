import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useDataStore, useUIStore } from '../store'

const genderOptions = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' }
]
const activityOptions = [
  { value: 'sedentary', label: 'Минимальная' },
  { value: 'light', label: 'Лёгкая' },
  { value: 'moderate', label: 'Средняя' },
  { value: 'active', label: 'Высокая' },
  { value: 'very_active', label: 'Очень высокая' }
]
const goalOptions = [
  { value: 'lose_weight', label: 'Снижение' },
  { value: 'maintain', label: 'Поддержание' },
  { value: 'gain_weight', label: 'Набор' }
]

export function OnboardingModal() {
  const open = useUIStore(s => s.onboardingOpen)
  const close = useUIStore(s => s.closeOnboarding)
  const setUser = useDataStore(s => s.setUser)
  const [form, setForm] = useState({
    telegram_id: '', username: '', age: '', gender: 'male', height: '', weight: '', target_weight: '', activity_level: 'moderate', goal: 'maintain'
  })
  const [saving, setSaving] = useState(false)

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.telegram_id) return
    setSaving(true)
    try {
      const payload = {
        telegram_id: form.telegram_id,
        username: form.username || null,
        age: form.age ? Number(form.age) : null,
        gender: form.gender,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
        target_weight: form.target_weight ? Number(form.target_weight) : null,
        activity_level: form.activity_level,
        goal: form.goal
      }
      const res = await fetch('http://localhost:8000/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      setUser(data)
      close()
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 140, damping: 18 }}>
            <h2>Профиль</h2>
            <div className="form-grid">
              <label>Telegram ID<input value={form.telegram_id} onChange={e=>update('telegram_id', e.target.value)} placeholder="123456789" /></label>
              <label>Ник<input value={form.username} onChange={e=>update('username', e.target.value)} placeholder="username" /></label>
              <label>Возраст<input value={form.age} onChange={e=>update('age', e.target.value)} type="number" /></label>
              <label>Рост (см)<input value={form.height} onChange={e=>update('height', e.target.value)} type="number" /></label>
              <label>Вес (кг)<input value={form.weight} onChange={e=>update('weight', e.target.value)} type="number" /></label>
              <label>Целевой вес<input value={form.target_weight} onChange={e=>update('target_weight', e.target.value)} type="number" /></label>
              <label>Пол<select value={form.gender} onChange={e=>update('gender', e.target.value)}>{genderOptions.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
              <label>Активность<select value={form.activity_level} onChange={e=>update('activity_level', e.target.value)}>{activityOptions.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
              <label>Цель<select value={form.goal} onChange={e=>update('goal', e.target.value)}>{goalOptions.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={close}>Отмена</button>
              <button className="btn" onClick={submit} disabled={saving}>{saving? 'Сохранение...' : 'Сохранить'}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
