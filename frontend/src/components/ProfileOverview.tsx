import { useEffect, useState } from 'react'
import { api } from '../api'

interface OverviewData {
  user: { id:number; telegram_id:string; goal?:string; gender?:string }
  today: any
  weight?: any
  streak: { current_days:number; longest_days:number }
  achievements: any[]
  recent_meals: { id:number; food_name:string; calories:number }[]
  macros?: {
    protein: { value:number; target:number; percent:number|null }
    carbs: { value:number; target:number; percent:number|null }
    fat: { value:number; target:number; percent:number|null }
  }
  next_tip?: string | null
  day_score?: number | null
  meals_grouped?: Record<string, { count:number; calories:number; protein:number; carbs:number; fat:number }>
}

interface WeightHistoryPoint { date: string; weight_kg: number }

export default function ProfileOverview() {
  const [data,setData] = useState<OverviewData|null>(null)
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState<string|null>(null)
  const [adding,setAdding] = useState(false)
  const [history,setHistory] = useState<WeightHistoryPoint[]>([])
  const [historyLoading,setHistoryLoading] = useState(false)
  const [weight,setWeight] = useState('')
  const [water,setWater] = useState('')
  const [sleep,setSleep] = useState('')

  async function load() {
    try {
      setLoading(true); setError(null)
      const d = await api.profileOverview();
      setData(d)
      // Параллельно загрузим историю веса
      setHistoryLoading(true)
      try {
        const wh = await api.weightHistory(30)
        setHistory(Array.isArray(wh)? wh : [])
      } finally { setHistoryLoading(false) }
    } catch(e:any){
      setError(e.message)
    } finally {
      setLoading(false)
    }
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
  const suggestion = data.next_tip || null

  // Подготовка данных спарклайна
  let sparkPath = ''
  if (history.length >= 2) {
    const values = history.map(h=>h.weight_kg)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const w = 120
    const h = 32
    sparkPath = history.map((pt,idx)=>{
      const x = (idx/(history.length-1))*w
      const y = h - ((pt.weight_kg - min)/range)*h
      return `${idx===0?'M':'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
  }
  return (
    <div className="card fade-in profile-overview">
      <h2>Профиль</h2>
      <div className="kpi kpi-compact">
        <div className="k-row"><span>Калории</span><strong>{cal.value} / {cal.target || '—'} ({cal.percent}%)</strong></div>
        <div className="k-row"><span>Стрик</span><strong>{data.streak.current_days} дн</strong></div>
        {weightBlock && <div className="k-row"><span>Вес</span><strong>{weightBlock.current} кг {weightBlock.diff_from_prev!=null && <em className={weightBlock.diff_from_prev<0?'delta-neg':'delta-pos'}>{weightBlock.diff_from_prev>0?'+':''}{weightBlock.diff_from_prev.toFixed(1)}</em>}</strong></div>}
        <div className="k-row"><span>Вода</span><strong>{data.today.water_l.value || 0} / {data.today.water_l.target || '—'} л</strong></div>
        <div className="k-row"><span>Сон</span><strong>{data.today.sleep_h.value || '—'} ч</strong></div>
        {typeof data.day_score === 'number' && <div className="k-row"><span>Оценка</span><strong>{data.day_score}</strong></div>}
      </div>
      {typeof data.day_score === 'number' && (
        <div className="score-section">
          {(() => {
            const score = data.day_score || 0
            const r = 50
            const stroke = 8
            const normR = r - stroke/2
            const circ = 2 * Math.PI * normR
            const offset = circ - (score/100)*circ
            const cls = score>=80? 'good' : score>=55? 'mid' : 'low'
            return (
              <div className={`score-gauge ${cls}`}>
                <svg viewBox={`0 0 ${r*2} ${r*2}`}> 
                  <circle cx={r} cy={r} r={normR} stroke="rgba(255,255,255,.1)" strokeWidth={stroke} fill="none" />
                  <circle cx={r} cy={r} r={normR} stroke="url(#gradScore)" strokeWidth={stroke} fill="none" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="sg-progress" />
                  <defs>
                    <linearGradient id="gradScore" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="50%" stopColor="#2dd4bf" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="sg-label"><div>День</div><div className="sg-value">{score}</div></div>
              </div>
            )
          })()}
          {data.macros && (
            <div className="macro-rings">
              {(['protein','carbs','fat'] as const).map(key => {
                const m = (data.macros as any)[key]
                const pct = Math.min(100, Math.max(0, m.percent || 0))
                const r = 34
                const stroke = 7
                const normR = r - stroke/2
                const circ = 2 * Math.PI * normR
                const offset = circ - (pct/100)*circ
                const label = key==='protein'? 'Белок' : key==='carbs'? 'Угл' : 'Жир'
                return (
                  <div key={key} className={`macro-ring ${key}`}>
                    <svg viewBox={`0 0 ${r*2} ${r*2}`}>
                      <circle cx={r} cy={r} r={normR} stroke="rgba(255,255,255,.08)" strokeWidth={stroke} fill="none" />
                      <circle cx={r} cy={r} r={normR} stroke={key==='protein'? '#34d399': key==='carbs'? '#60a5fa':'#fbbf24'} strokeWidth={stroke} fill="none" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="mr-progress" />
                    </svg>
                    <div className="mr-label"><span>{label}</span><span className="mr-value">{pct.toFixed(0)}%</span></div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
  {suggestion && <div className="mini-msg suggest-tip mt-04">{suggestion}</div>}
      {data.meals_grouped && (
        <div className="macro-mini mt-04">
          {Object.entries(data.meals_grouped).map(([mt,g])=> (
            <div key={mt} className="macro-mini-row meal-group-row">
              <span className="mm-label">{mt}</span>
              <div className="mm-bar"><span className="mm-fill group"></span></div>
              <strong className="mm-val">{g.calories}ккал ({g.count})</strong>
            </div>
          ))}
        </div>
      )}
      {data.macros && (
        <div className="macro-mini">
          {(['protein','carbs','fat'] as const).map(key=>{
            const m = (data.macros as any)[key]
            const pctRaw = typeof m.percent==='number'? Math.min(100, Math.max(0, m.percent)) : 0
            const pct = Math.round(pctRaw/5)*5
            const title = key==='protein'? 'Белок' : key==='carbs'? 'Углеводы' : 'Жиры'
            return (
              <div key={key} className="macro-mini-row" data-pct={pct}>
                <span className="mm-label">{title}</span>
                <div className="mm-bar"><span className={`mm-fill ${key} p${pct}`}></span></div>
                <strong className="mm-val">{m.value}/{m.target}</strong>
              </div>
            )
          })}
        </div>
      )}
      {data.achievements && data.achievements.length>0 && (
        <div className="ach-block">
          <div className="ach-title">Достижения</div>
          <div className="ach-list">
            {data.achievements.map(a=> <span key={a.id} className="ach-badge done">{a.title}</span>)}
          </div>
        </div>
      )}
      <div className="spark-wrap mt-04">
        <div className="spark-head">
          <span className="spark-label">Вес 30д</span>
          {history.length>0 && !historyLoading && <span className="spark-range">{history[0].weight_kg.toFixed(1)} → {history[history.length-1].weight_kg.toFixed(1)}</span>}
        </div>
        {historyLoading && <div className="skeleton sk-line spark-loading" />}
        {!historyLoading && history.length>=2 && (
          <svg className="sparkline" width={120} height={32} viewBox="0 0 120 32" preserveAspectRatio="none">
            <path d={sparkPath} fill="none" stroke="#34d399" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        )}
        {!historyLoading && history.length<2 && <div className="spark-empty">Недостаточно данных</div>}
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
