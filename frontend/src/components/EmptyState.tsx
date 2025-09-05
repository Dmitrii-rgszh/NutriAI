import React, { useMemo } from 'react'

interface EmptyStateProps {
  onStartOnboarding: () => void
}

const EmptyState: React.FC<EmptyStateProps> = ({ onStartOnboarding }) => {
  // Фиксированные частицы
  const particles = useMemo(() => 
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 4 + Math.random() * 2
    })), []
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 flex items-center justify-center p-2 relative overflow-hidden">
      {/* Анимированные частицы */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-emerald-400/30 rounded-full animate-float"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`
          }}
        />
      ))}
      
      <div className="w-full max-w-xs mx-auto bg-gray-800/50 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700/50 p-6 text-center relative z-10 animate-slide-up">
        
        {/* Приветственная иконка */}
        <div className="text-4xl mb-4 animate-pulse-soft">🌟</div>
        
        {/* Заголовок */}
        <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-3 animate-slide-left">
          Добро пожаловать в NutriAI!
        </h1>
        
        {/* Описание */}
        <p className="text-gray-300 mb-6 leading-relaxed text-sm animate-slide-right" style={{ animationDelay: '0.2s' }}>
          Заполните профиль для персональных рекомендаций по питанию
        </p>
        
        {/* Кнопка призыва к действию */}
        <button
          onClick={onStartOnboarding}
          className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl 
                   active:from-emerald-600 active:to-teal-600 transition-all duration-200 active:scale-95 
                   shadow-lg animate-glow animate-slide-up"
          style={{ animationDelay: '0.4s' }}
        >
          <span className="flex items-center justify-center space-x-2">
            <span>✨</span>
            <span className="text-sm">Заполнить профиль</span>
          </span>
        </button>
        
        {/* Дополнительные возможности */}
        <div className="mt-6 space-y-3 animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <div className="text-gray-400 text-xs">
            А пока вы можете:
          </div>
          
          <div className="flex flex-col space-y-2">
            <button className="py-2 px-3 bg-gray-700/50 text-gray-300 rounded-lg active:bg-gray-600/50 transition-all duration-200 text-xs benefit-card">
              📸 Сфотографировать блюдо
            </button>
            <button className="py-2 px-3 bg-gray-700/50 text-gray-300 rounded-lg active:bg-gray-600/50 transition-all duration-200 text-xs benefit-card">
              📝 История питания
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmptyState
