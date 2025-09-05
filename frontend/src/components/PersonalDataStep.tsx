import React, { useMemo } from 'react'

interface PersonalDataStepProps {
  data: {
    gender: string
    age: number
    height: number
    weight: number
  }
  onUpdate: (data: any) => void
  onNext: () => void
}

const PersonalDataStep: React.FC<PersonalDataStepProps> = ({ data, onUpdate, onNext }) => {
  // Фиксированные частицы, не меняющиеся при перерендере
  const particles = useMemo(() => 
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 2
    })), []
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (data.age && data.height && data.weight && data.gender) {
      onNext()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Анимированные частицы */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 bg-emerald-400/30 rounded-full animate-float"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`
          }}
        />
      ))}
      
      {/* Основной контент */}
      <div className="w-full max-w-md mx-auto bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-8 relative z-10">
        
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
            Расскажите о себе
          </h1>
        </div>

        {/* Индикатор прогресса */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Шаг 1 из 4</span>
            <span>25%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-emerald-400 to-teal-400 h-2 rounded-full" style={{ width: '25%' }}></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Пол */}
          <div>
            <label className="block text-gray-300 mb-3">Пол</label>
            <div className="grid grid-cols-2 gap-3">
              {['Мужской', 'Женский'].map((gender) => (
                <button
                  key={gender}
                  type="button"
                  onClick={() => onUpdate({ ...data, gender })}
                  className={`py-3 px-4 rounded-xl border-2 transition-all duration-200 ${
                    data.gender === gender
                      ? 'border-emerald-400 bg-emerald-400/10 text-emerald-400'
                      : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>

          {/* Возраст */}
          <div>
            <label className="block text-gray-300 mb-3">
              Возраст: {data.age} лет
            </label>
            <div className="slider-container">
              <div 
                className="slider-progress" 
                style={{ width: `${((data.age - 18) / (80 - 18)) * 100}%` }}
              />
              <input
                type="range"
                min="18"
                max="80"
                value={data.age}
                onChange={(e) => onUpdate({ ...data, age: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          {/* Рост */}
          <div>
            <label className="block text-gray-300 mb-3">
              Рост: {data.height} см
            </label>
            <div className="slider-container">
              <div 
                className="slider-progress" 
                style={{ width: `${((data.height - 140) / (220 - 140)) * 100}%` }}
              />
              <input
                type="range"
                min="140"
                max="220"
                value={data.height}
                onChange={(e) => onUpdate({ ...data, height: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          {/* Вес */}
          <div>
            <label className="block text-gray-300 mb-3">
              Вес: {data.weight} кг
            </label>
            <div className="slider-container">
              <div 
                className="slider-progress" 
                style={{ width: `${((data.weight - 40) / (150 - 40)) * 100}%` }}
              />
              <input
                type="range"
                min="40"
                max="150"
                value={data.weight}
                onChange={(e) => onUpdate({ ...data, weight: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          {/* Кнопка продолжить */}
          <button
            type="submit"
            disabled={!data.age || !data.height || !data.weight || !data.gender}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl 
                     hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed 
                     transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
          >
            Продолжить
          </button>
        </form>
      </div>
    </div>
  )
}

export default PersonalDataStep
