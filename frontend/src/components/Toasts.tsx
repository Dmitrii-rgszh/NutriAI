import { useEffect } from 'react'
import { useDataStore } from '../store'

export const Toasts = () => {
  const toasts = useDataStore(s=>s.toasts)
  const remove = useDataStore(s=>s.removeToast)
  useEffect(()=>{
    const timers = toasts.map(t=> setTimeout(()=> remove(t.id), 4000))
    return ()=> { timers.forEach(clearTimeout) }
  },[toasts])
  if(!toasts.length) return null
  return (
    <div className="toasts">
      {toasts.map(t=> (
        <div key={t.id} className={`toast ${t.type || 'info'}`}>{t.msg}</div>
      ))}
    </div>
  )
}