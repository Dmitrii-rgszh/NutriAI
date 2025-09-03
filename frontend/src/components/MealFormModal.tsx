import { useState } from 'react'
import { useDataStore } from '../store'
import { motion, AnimatePresence } from 'framer-motion'

interface MealFormProps {
  onClose: () => void
  open: boolean
}

export function MealFormModal({ open, onClose }: MealFormProps) {
  const addMeal = useDataStore(s => s.addMeal)
  const user = useDataStore(s => s.user)
  const [form, setForm] = useState({
    food_name: '', calories: '', protein: '', carbs: '', fat: '', meal_type: 'breakfast'
  })
  const [saving, setSaving] = useState(false)

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!user) return
    if (!form.food_name || !form.calories) return
    setSaving(true)
    try {
      const payload = {
        user_telegram_id: user.telegram_id,
        food_name: form.food_name,
        calories: Number(form.calories),
        protein: Number(form.protein || 0),
        carbs: Number(form.carbs || 0),
        fat: Number(form.fat || 0),
        meal_type: form.meal_type
      }
      const res = await fetch('http://localhost:8000/meals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      addMeal(data)
      onClose()
    } finally { setSaving(false) }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 140, damping: 18 }}>
            <h2>Приём пищи</h2>
            <div className="form-grid">
              <label>Название<input value={form.food_name} onChange={e=>update('food_name', e.target.value)} /></label>
              <label>Калории<input value={form.calories} onChange={e=>update('calories', e.target.value)} type="number" /></label>
              <label>Белки<input value={form.protein} onChange={e=>update('protein', e.target.value)} type="number" /></label>
              <label>Углеводы<input value={form.carbs} onChange={e=>update('carbs', e.target.value)} type="number" /></label>
              <label>Жиры<input value={form.fat} onChange={e=>update('fat', e.target.value)} type="number" /></label>
              <label>Тип<select value={form.meal_type} onChange={e=>update('meal_type', e.target.value)}>
                <option value="breakfast">Завтрак</option>
                <option value="lunch">Обед</option>
                <option value="dinner">Ужин</option>
                <option value="snack">Перекус</option>
              </select></label>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={onClose}>Отмена</button>
              <button className="btn" onClick={submit} disabled={saving || !user}>{saving? 'Сохранение...' : 'Добавить'}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
