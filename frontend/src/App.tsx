import { useState, useEffect, useMemo } from 'react'
import './App.css'
import { OnboardingModal } from './components/OnboardingModal'
import { MealFormModal } from './components/MealFormModal'
import { Sparkline } from './components/Sparkline'
import { Toasts } from './components/Toasts'
import { useUIStore, useDataStore } from './store'
import { api, logout } from './api'
import { NavLink, Routes, Route, useNavigate } from 'react-router-dom'

interface Summary { calories_target: number | null; calories_consumed: number; calories_remaining: number | null; progress_percent: number; protein_total: number; carbs_total: number; fat_total: number; message: string; meals_count: number }

function App() {
  const [apiMessage, setApiMessage] = useState('')
  const [health, setHealth] = useState('')
  const navigate = useNavigate()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingMeals, setLoadingMeals] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyDays, setHistoryDays] = useState(14)
  const [mealModalOpen, setMealModalOpen] = useState(false)
  const [macroGoals, setMacroGoals] = useState<any | null>(null)
  const [loadingMacros, setLoadingMacros] = useState(false)
  const [forecast, setForecast] = useState<any | null>(null)
  const [loadingForecast, setLoadingForecast] = useState(false)
  const [forecastDays, setForecastDays] = useState(30)
  const photoInputId = 'photo-upload-hidden'
  const toggleTheme = useUIStore(s => s.toggleTheme)
  const theme = useUIStore(s => s.theme)
  const userProfile = useDataStore(s => s.user)
  const meals = useDataStore(s => s.meals)
  const setMeals = useDataStore(s => s.setMeals)
  const updateMealState = useDataStore(s => s.updateMeal)
  const removeMeal = useDataStore(s => s.removeMeal)
  const history = useDataStore(s => s.history)
  const setHistory = useDataStore(s => s.setHistory)
  const pushToast = useDataStore(s => s.pushToast)

  useEffect(() => { document.documentElement.classList.toggle('light', theme==='light') }, [theme])
  useEffect(() => {
    // @ts-ignore
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initData && !userProfile) api.authTelegram(tg.initData).catch(()=>{})
  }, [userProfile])

  useEffect(() => {
    fetch('http://localhost:8000/')
      .then(res => res.json())
      .then(data => setApiMessage(data.message))
      .catch(() => setApiMessage('Ошибка подключения'))
    fetch('http://localhost:8000/health')
      .then(res => res.json())
      .then(data => setHealth(data.status === 'healthy' ? 'OK' : 'Проблема'))
      .catch(() => setHealth('Ошибка'))
  }, [])

  const fetchSummary = () => {
    if(!userProfile) return
    setLoadingSummary(true)
    api.summary(userProfile.telegram_id)
      .then((data: any) => setSummary(data as Summary))
      .catch(()=> setSummary(null))
      .finally(()=> setLoadingSummary(false))
  }
  const loadMeals = () => { setLoadingMeals(true); api.listMeals().then((data:any)=> setMeals(data)).catch(()=> pushToast('Ошибка загрузки блюд','error')).finally(()=> setLoadingMeals(false)) }
  const loadHistory = (days=historyDays) => { setLoadingHistory(true); api.history(days).then((d:any)=> setHistory(d.days || [])).catch(()=> pushToast('Ошибка истории','error')).finally(()=> setLoadingHistory(false)) }
  useEffect(()=>{ if(userProfile){ fetchSummary(); loadMeals(); loadHistory(historyDays); } }, [userProfile, historyDays])
  useEffect(()=>{ if(userProfile){
    setLoadingMacros(true); api.macroGoals().then(setMacroGoals).catch(()=> setMacroGoals(null)).finally(()=> setLoadingMacros(false))
  } }, [userProfile])
  useEffect(()=>{ if(userProfile){
    setLoadingForecast(true); api.forecastWeight(forecastDays).then(setForecast).catch(()=> setForecast(null)).finally(()=> setLoadingForecast(false))
  } }, [userProfile, forecastDays])

  const progressCircle = (percent:number) => {
    const radius = 54; const circ = 2 * Math.PI * radius; const offset = circ - (percent/100)*circ
    return (
      <svg width={130} height={130} className="progress-ring">
        <defs>
          <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="60%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
        <circle cx={65} cy={65} r={radius} className="track" />
        <circle cx={65} cy={65} r={radius} className="progress" style={{stroke:"url(#ring)", strokeDasharray:circ, strokeDashoffset: offset}} />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="progress-text">{Math.round(percent)}%</text>
      </svg>
    )
  }

  const MealsList = () => (
    <div className="card glass">
      <div className="card-header">
        <h2>Блюда</h2>
        <div style={{display:'flex', gap:'.4rem'}}>
          <button className="btn small" onClick={()=> document.getElementById(photoInputId)?.click()} title="Фото">📷</button>
          <button className="btn small" onClick={()=> setMealModalOpen(true)}>+</button>
        </div>
        <input id={photoInputId} type="file" accept="image/*" style={{display:'none'}} onChange={async e=> {
          const file = e.target.files?.[0]; if(!file) return; pushToast('Загрузка фото','info');
          try { const res = await api.analyzePhoto(file); if(res?.meal){ setMeals([res.meal, ...meals]); pushToast('Фото добавлено (заглушка)','success'); fetchSummary(); }
          } catch { pushToast('Ошибка анализа фото','error') }
          e.target.value='';
        }} />
      </div>
      <ul className="meal-list">
        {loadingMeals && !meals.length && (
          <>
            {Array.from({length:5}).map((_,i)=>(<li key={i} className="meal-item skeleton" style={{height:'62px'}} />))}
          </>
        )}
        {meals.map(m => (
          <li key={m.id} className="meal-item">
            <div className="mi-head"><strong>{m.food_name}</strong><span className="mi-cal">{m.calories} ккал</span></div>
            <div className="mi-macros">B:{m.protein} У:{m.carbs} Ж:{m.fat}</div>
            <div className="mi-actions">
              <button className="btn xsmall ghost" onClick={()=>{ const name = prompt('Название', m.food_name) || m.food_name; api.updateMeal(m.id!, { food_name: name }).then((upd:any)=> { updateMealState(upd); pushToast('Блюдо обновлено','success') }).catch(()=> pushToast('Ошибка обновления','error')) }}>✏️</button>
              <button className="btn xsmall ghost" onClick={()=>{ if(confirm('Удалить?')) api.deleteMeal(m.id!).then(()=> { removeMeal(m.id!); pushToast('Удалено','info') }).catch(()=> pushToast('Ошибка удаления','error')) }}>🗑</button>
            </div>
          </li>
        ))}
        {!loadingMeals && !meals.length && <li className="empty">Нет блюд</li>}
      </ul>
    </div>
  )

  const Dashboard = () => (
    <div className="grid">
      <section className="card summary-card glass">
        <h2>День</h2>
        {loadingSummary && !summary && (
          <div className="daily-grid">
            <div className="ring-wrap skeleton sk-ring" />
            <div className="kpi" style={{gap:'.55rem'}}>
              {Array.from({length:5}).map((_,i)=>(<div key={i} className="skeleton" style={{height:'22px', borderRadius:'8px'}} />))}
            </div>
          </div>
        )}
        {summary && !loadingSummary && (
          <div className="daily-grid">
            <div className="ring-wrap">{progressCircle(summary.progress_percent)}</div>
            <div className="kpi">
              <div className="k-row"><span>Потреблено</span><strong>{summary.calories_consumed.toFixed(0)}</strong></div>
              <div className="k-row"><span>Цель</span><strong>{summary.calories_target ?? '—'}</strong></div>
              <div className="k-row"><span>Осталось</span><strong>{summary.calories_remaining !== null ? Math.max(summary.calories_remaining,0).toFixed(0): '—'}</strong></div>
              <div className="macro-bar">
                <div className="macro p" style={{width: Math.min(100, summary.protein_total) + '%'}} title={`Белок ${summary.protein_total.toFixed(1)} г`}></div>
                <div className="macro c" style={{width: Math.min(100, summary.carbs_total) + '%'}} title={`Углеводы ${summary.carbs_total.toFixed(1)} г`}></div>
                <div className="macro f" style={{width: Math.min(100, summary.fat_total) + '%'}} title={`Жиры ${summary.fat_total.toFixed(1)} г`}></div>
              </div>
              <div className="mini-msg">{summary.message}</div>
            </div>
          </div>
        )}
        {!loadingSummary && !summary && <div className="placeholder">Нет данных</div>}
      </section>
      <MealsList />
      <section className="card glass">
        <h2>Макро цели</h2>
        {loadingMacros && <div className="skeleton" style={{height:'60px', borderRadius:'12px'}} />}
        {!loadingMacros && macroGoals && (
          <div className="macro-goals">
            <div className="mg-row"><span>Ккал</span><strong>{macroGoals.calories}</strong></div>
            <div className="mg-row"><span>Белок</span><strong>{macroGoals.protein_g} г ({macroGoals.protein_pct}%)</strong></div>
            <div className="mg-row"><span>Жиры</span><strong>{macroGoals.fat_g} г ({macroGoals.fat_pct}%)</strong></div>
            <div className="mg-row"><span>Углеводы</span><strong>{macroGoals.carbs_g} г ({macroGoals.carbs_pct}%)</strong></div>
            <div className="mini-msg">Метод: {macroGoals.method}</div>
          </div>
        )}
        {!loadingMacros && !macroGoals && <div className="placeholder">Нет данных</div>}
      </section>
      <section className="card glass">
        <h2>Прогноз веса</h2>
        <div style={{display:'flex', gap:'.4rem', marginBottom:'.5rem'}}>
          {[14,30,60,90].map(d=> <button key={d} className={`btn xsmall ghost ${forecastDays===d? 'active':''}`} onClick={()=> setForecastDays(d)}>{d}д</button>)}
        </div>
        {loadingForecast && <div className="skeleton" style={{height:'80px', borderRadius:'12px'}} />}
        {!loadingForecast && forecast && (
          <div className="forecast-block">
            <div className="mg-row"><span>Старт</span><strong>{forecast.start_weight.toFixed(1)} кг</strong></div>
            {forecast.target_weight && <div className="mg-row"><span>Цель</span><strong>{forecast.target_weight} кг</strong></div>}
            <div className="mg-row"><span>Δ нед</span><strong>{forecast.weekly_change_kg.toFixed(3)} кг</strong></div>
            <div className="spark-wrap" style={{marginTop:'.4rem'}}>
              <Sparkline values={forecast.points.map((p:any)=> p.est_weight)} />
            </div>
          </div>
        )}
        {!loadingForecast && !forecast && <div className="placeholder">Недостаточно данных</div>}
      </section>
    </div>
  )

  const deficitSeries = useMemo(()=> history.map((h:any)=> h.deficit ?? 0), [history])
  const avgDeficit = useMemo(()=> deficitSeries.length? Math.round(deficitSeries.reduce((a:number,b:number)=>a+b,0)/deficitSeries.length): 0, [deficitSeries])
  const trend = useMemo(()=> {
    if(deficitSeries.length < 2) return 0
    return deficitSeries[deficitSeries.length-1] - deficitSeries[0]
  }, [deficitSeries])
  const HistoryPage = () => (
    <div className="grid">
      <div className="card glass">
        <h2>История дефицита</h2>
        <div className="history-meta">
          <div className="filters">
            {[7,14,30,90].map(d=> <button key={d} className={`btn xsmall ghost ${historyDays===d? 'active':''}`} onClick={()=> setHistoryDays(d)} disabled={historyDays===d}>{d}д</button>)}
          </div>
          <div className="stats">
            <span>Средн: <strong className={avgDeficit<0?'bad':'good'}>{avgDeficit}</strong></span>
            <span>Тренд: <strong className={trend<0?'bad':'good'}>{trend>0? '+'+trend: trend}</strong></span>
          </div>
        </div>
        <div className="spark-wrap"><Sparkline values={deficitSeries} /></div>
        <div className="history-list">
          {loadingHistory && !history.length && Array.from({length:6}).map((_,i)=> <div key={i} className="history-row skeleton" style={{height:'34px'}} />)}
          {history.slice().reverse().map((d:any,i:number)=>(
            <div key={i} className="history-row">
              <span>{d.date}</span>
              <span className={d.deficit < 0 ? 'bad' : 'good'}>{d.deficit}</span>
              <span>{d.calories_consumed} / {d.calories_target ?? '—'}</span>
            </div>
          ))}
          {!loadingHistory && !history.length && <div className="placeholder">Нет данных</div>}
        </div>
      </div>
    </div>
  )

  const ProfilePage = () => {
    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState(()=> userProfile ? {
      telegram_id: userProfile.telegram_id,
      username: userProfile.username || '',
      age: userProfile.age || '',
      gender: userProfile.gender || 'male',
      height: userProfile.height || '',
      weight: userProfile.weight || '',
      target_weight: userProfile.target_weight || '',
      activity_level: userProfile.activity_level || 'moderate',
      goal: userProfile.goal || 'maintain'
    } : null)
    const setUser = useDataStore(s=>s.setUser)
    const onChange = (k:string,v:any)=> setForm(f=> ({...f!, [k]: v}))
    const save = async () => {
      if(!form) return
      try {
        const payload = { ...form,
          age: form.age? Number(form.age): null,
          height: form.height? Number(form.height): null,
          weight: form.weight? Number(form.weight): null,
          target_weight: form.target_weight? Number(form.target_weight): null,
        }
        const data = await api.createOrUpdateUser(payload)
        setUser(data)
        pushToast('Профиль сохранён','success')
        setEditing(false)
      } catch { pushToast('Ошибка сохранения','error') }
    }
    return (
      <div className="grid">
        <div className="card glass">
          <h2>Профиль</h2>
          {!userProfile && <div className="placeholder">Нет профиля</div>}
          {userProfile && !editing && (
            <div className="profile-block">
              <div>ID: {userProfile.telegram_id}</div>
              <div>Ник: {userProfile.username || '—'}</div>
              <div>Ккал/день: {userProfile.daily_calories || '—'}</div>
              <div className="row-btns">
                <button className="btn" onClick={()=> setEditing(true)}>Редактировать</button>
              </div>
            </div>
          )}
          {userProfile && editing && form && (
            <div className="edit-form">
              <div className="ef-grid">
                <label>Ник<input value={form.username} onChange={e=>onChange('username', e.target.value)} /></label>
                <label>Возраст<input value={form.age} onChange={e=>onChange('age', e.target.value)} type="number" /></label>
                <label>Рост<input value={form.height} onChange={e=>onChange('height', e.target.value)} type="number" /></label>
                <label>Вес<input value={form.weight} onChange={e=>onChange('weight', e.target.value)} type="number" /></label>
                <label>Целевой<input value={form.target_weight} onChange={e=>onChange('target_weight', e.target.value)} type="number" /></label>
                <label>Пол<select value={form.gender} onChange={e=>onChange('gender', e.target.value)}><option value="male">Муж</option><option value="female">Жен</option></select></label>
                <label>Активность<select value={form.activity_level} onChange={e=>onChange('activity_level', e.target.value)}><option value="sedentary">Мин</option><option value="light">Лёгкая</option><option value="moderate">Средняя</option><option value="active">Высокая</option><option value="very_active">Очень высокая</option></select></label>
                <label>Цель<select value={form.goal} onChange={e=>onChange('goal', e.target.value)}><option value="lose_weight">Снижение</option><option value="maintain">Поддержание</option><option value="gain_weight">Набор</option></select></label>
              </div>
              <div className="ef-actions">
                <button className="btn ghost" onClick={()=> setEditing(false)}>Отмена</button>
                <button className="btn" onClick={save}>Сохранить</button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="topbar">
        <div className="logo" onClick={()=> navigate('/')}>🍎 NutriAI</div>
        <nav>
          <NavLink to="/" end>Дашборд</NavLink>
          <NavLink to="/history">История</NavLink>
          <NavLink to="/profile">Профиль</NavLink>
        </nav>
        <div className="actions">
          <span className="status-chip">API: {apiMessage || '…'} | {health || '…'}</span>
            <button className="btn ghost" onClick={toggleTheme}>{theme==='light'? '🌙' : '🌞'}</button>
            <button className="btn ghost" onClick={()=> { logout(); navigate('/') }}>Выйти</button>
            <button className="btn" onClick={()=> setMealModalOpen(true)}>+</button>
        </div>
      </div>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      <footer><span className="hint">vMVP • Local • SQLite</span></footer>
      <OnboardingModal />
      <MealFormModal open={mealModalOpen} onClose={()=> setMealModalOpen(false)} />
      <Toasts />
    </div>
  )
}

export default App
