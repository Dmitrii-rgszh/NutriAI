import React, { useMemo, useState, useEffect } from 'react'

interface OnboardingIntroProps {
  onStartOnboarding: () => void
  onSkipOnboarding: () => void
}

const OnboardingIntro: React.FC<OnboardingIntroProps> = ({ onStartOnboarding, onSkipOnboarding }) => {
  // Фиксированные частицы
  const particles = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 4 + Math.random() * 2
    })), []
  )

  const benefits = [
    {
      icon: '🎯',
      title: 'Персональные рекомендации',
      description: 'План питания, идеально подходящий именно вам'
    },
    {
      icon: '📊',
      title: 'Точные расчеты КБЖУ',
      description: 'Цели по калориям с учетом всех особенностей'
    },
    {
      icon: '🏃‍♂️',
      title: 'Учет активности',
      description: 'Корректировка под ваш образ жизни'
    },
    {
      icon: '🩺',
      title: 'Забота о здоровье',
      description: 'Учтем особенности здоровья и диеты'
    }
  ]

  // Состояние для карусели карточек
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Автоматическая смена карточек каждые 5 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)
      
      setTimeout(() => {
        setCurrentCardIndex((prevIndex) => (prevIndex + 1) % benefits.length)
        setIsAnimating(false)
      }, 300) // Время для анимации исчезновения
      
    }, 5000)

    return () => clearInterval(interval)
  }, [benefits.length])

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
      
      {/* Основной контент */}
      <div className="w-full max-w-sm mx-auto bg-gray-800/50 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700/50 p-4 relative z-10">
        
        {/* Заголовок */}
        <div className="text-center mb-4 animate-slide-up">
          <div className="text-5xl mb-3 animate-pulse-soft">👋</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-3">
            Добро пожаловать в NutriAI!
          </h1>
          <p className="text-base text-gray-300 leading-relaxed">
            Расскажите нам о себе для персональных рекомендаций
          </p>
        </div>

        {/* Преимущества - карусель */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white mb-3 text-center">
            ✨ Что вы получите:
          </h2>
          <div className="flex justify-center">
            <div
              className={`benefit-card bg-gray-700/30 backdrop-blur-sm rounded-lg p-4 border border-gray-600/30 transition-all duration-300 w-full max-w-xs h-32 ${
                isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              }`}
            >
              <div className="text-center h-full flex flex-col justify-between">
                <div>
                  <span className="text-2xl block mb-2 animate-pulse-soft">
                    {benefits[currentCardIndex].icon}
                  </span>
                  <h3 className="text-white font-semibold text-sm mb-2">{benefits[currentCardIndex].title}</h3>
                </div>
                <p className="text-gray-400 text-sm leading-tight">{benefits[currentCardIndex].description}</p>
              </div>
            </div>
          </div>
          
          {/* Индикаторы карточек */}
          <div className="flex justify-center space-x-2 mt-3">
            {benefits.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentCardIndex ? 'bg-emerald-400' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Временная информация */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mb-4 animate-slide-left" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-emerald-400 animate-pulse-soft text-lg">⏱️</span>
            <span className="text-emerald-400 font-semibold text-base">Всего 2-3 минуты</span>
          </div>
          <p className="text-gray-300 text-sm text-center">
            4 простых шага для лучших рекомендаций
          </p>
        </div>

        {/* Кнопки действий */}
        <div className="space-y-3 animate-slide-right" style={{ animationDelay: '0.8s' }}>
          <button
            onClick={onStartOnboarding}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl 
                     active:from-emerald-600 active:to-teal-600 transition-all duration-200 active:scale-95 
                     shadow-lg animate-glow"
          >
            <span className="flex items-center justify-center space-x-2">
              <span className="text-lg">🚀</span>
              <span className="text-base">Заполнить профиль</span>
            </span>
          </button>
          
          <button
            onClick={onSkipOnboarding}
            className="w-full py-2 bg-gray-700/50 text-gray-300 font-medium rounded-xl 
                     active:bg-gray-600/50 active:text-white transition-all duration-200 
                     border border-gray-600/30 active:border-gray-500/50"
          >
            <span className="flex items-center justify-center space-x-2">
              <span className="text-base">⏭️</span>
              <span className="text-sm">Пропустить (заполню позже)</span>
            </span>
          </button>
        </div>

        {/* Дополнительная информация */}
        <div className="text-center mt-3">
          <p className="text-gray-500 text-sm">
            💝 Персональные рекомендации сделают питание здоровее!
          </p>
        </div>
      </div>
    </div>
  )
}

export default OnboardingIntro
