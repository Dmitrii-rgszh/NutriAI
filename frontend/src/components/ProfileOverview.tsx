import { useEffect, useState } from 'react'
import { api } from '../api'

interface OverviewData {
  user: { id:number; telegram_id:string; goal?:string; gender?:string }
  today: any
  weight?: any
  streak: { current_days:number; longest_days:number }
  achievements: any[]
  recent_meals: { id:number; food_name:string; calories:number }[]
}

export default function ProfileOverview() {
  const [data,setData] = useState<OverviewData|null>(null)
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState<string|null>(null)
  const [adding,setAdding] = useState(false)
  const [weight,setWeight] = useState('')
  const [water,setWater] = useState('')
  const [sleep,setSleep] = useState('')

  async function load() {
    try { setLoading(true); setError(null); const d = await api.profileOverview(); setData(d) } catch(e:any){ setError(e.message) } finally { setLoading(false) }
  }
  useEffect(()=>{ load() },[])

  async function submitWeight() {
    if(!weight) return; setAdding(true); try { await api.addWeight(parseFloat(weight)); setWeight(''); await load() } finally { setAdding(false) }
  }
  async function submitWater() {
    if(!water) return; setAdding(true); try { await api.addWater(parseFloat(water)); setWater(''); await load() } finally { setAdding(false) }
  }
  async function submitSleep() {
    if(!sleep) return; setAdding(true); try { await api.setSleep(parseFloat(sleep)); setSleep(''); await load() } finally { setAdding(false) }
  }

  if (loading) return <div className="placeholder">Загрузка профиля...</div>
  if (error) return <div className="placeholder">Ошибка: {error}</div>
  if (!data) return <div className="placeholder">Нет данных</div>

  const cal = data.today.calories
  const weightBlock = data.weight
  return (
    <div className="card fade-in profile-overview">
      <h2>Профиль</h2>
      <div className="kpi kpi-compact">
        <div className="k-row"><span>Калории</span><strong>{cal.value} / {cal.target || '—'} ({cal.percent}%)</strong></div>
        <div className="k-row"><span>Стрик</span><strong>{data.streak.current_days} дн</strong></div>
        {weightBlock && <div className="k-row"><span>Вес</span><strong>{weightBlock.current} кг {weightBlock.diff_from_prev!=null && <em className={weightBlock.diff_from_prev<0?'delta-neg':'delta-pos'}>{weightBlock.diff_from_prev>0?'+':''}{weightBlock.diff_from_prev.toFixed(1)}</em>}</strong></div>}
        <div className="k-row"><span>Вода</span><strong>{data.today.water_l.value || 0} / {data.today.water_l.target || '—'} л</strong></div>
        <div className="k-row"><span>Сон</span><strong>{data.today.sleep_h.value || '—'} ч</strong></div>
      </div>
      <div className="controls-row mt-1">
        <input className="select" placeholder="Вес кг" value={weight} onChange={e=>setWeight(e.target.value)} />
        <button className="btn ghost" disabled={adding} onClick={submitWeight}>Вес</button>
      </div>
      <div className="controls-row">
        <input className="select" placeholder="Вода л" value={water} onChange={e=>setWater(e.target.value)} />
        <button className="btn ghost" disabled={adding} onClick={submitWater}>Вода</button>
      </div>
      <div className="controls-row">
        <input className="select" placeholder="Сон ч" value={sleep} onChange={e=>setSleep(e.target.value)} />
        <button className="btn ghost" disabled={adding} onClick={submitSleep}>Сон</button>
      </div>
      <div className="mini-msg">Недавние блюда:</div>
      <ul className="meal-list meal-list-compact">
        {data.recent_meals.length === 0 && <li className="empty">Нет блюд</li>}
        {data.recent_meals.map(m=> <li key={m.id} className="meal-item meal-item-compact"><div className="mi-head"><span>{m.food_name}</span><span className="mi-cal">{m.calories}</span></div></li> )}
      </ul>
    </div>
  )
}
