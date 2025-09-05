import React, { useMemo, useState } from 'react'

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
  // Состояния для отображения шуток
  const [showWeightJoke, setShowWeightJoke] = useState(false)
  const [showAgeJoke, setShowAgeJoke] = useState(false)
  const [showHeightJoke, setShowHeightJoke] = useState(false)

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
      // Скрываем все шутки при продолжении
      setShowWeightJoke(false)
      setShowAgeJoke(false)
      setShowHeightJoke(false)
      onNext()
    }
  }

  // Обработчик изменения веса с показом шутки
  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWeight = parseInt(e.target.value)
    onUpdate({ ...data, weight: newWeight })
    
    // Показываем шутку о весе и скрываем другие
    setShowWeightJoke(true)
    setShowAgeJoke(false)
    setShowHeightJoke(false)
  }

  // Обработчик изменения возраста с показом шутки
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAge = parseInt(e.target.value)
    onUpdate({ ...data, age: newAge })
    
    // Показываем шутку о возрасте и скрываем другие
    setShowAgeJoke(true)
    setShowWeightJoke(false)
    setShowHeightJoke(false)
  }

  // Обработчик изменения роста с показом шутки
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(e.target.value)
    onUpdate({ ...data, height: newHeight })
    
    // Показываем шутку о росте и скрываем другие
    setShowHeightJoke(true)
    setShowWeightJoke(false)
    setShowAgeJoke(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 text-white relative overflow-hidden">
      {/* Анимированные частицы */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-60 animate-float"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 p-3 pb-safe max-w-sm mx-auto">
        {/* Прогресс */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Шаг 1 из 4</span>
            <span>25%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-emerald-400 to-teal-400 h-2 rounded-full transition-all duration-500" style={{ width: '25%' }}></div>
          </div>
        </div>

        {/* Общий контейнер-карточка */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-4">
          {/* Заголовок */}
          <div className="text-center mb-4">
            <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-1">
              Расскажите о себе
            </h1>
            <p className="text-gray-300 text-xs">
              Введите ваши персональные данные
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Пол */}
          <div>
            <label className="block text-gray-300 mb-2 text-sm">Пол</label>
            <div className="grid grid-cols-2 gap-3">
              {['Мужской', 'Женский'].map((gender) => (
                <button
                  key={gender}
                  type="button"
                  onClick={() => onUpdate({ ...data, gender })}
                  className={`py-3 px-4 rounded-xl border-2 transition-all duration-200 text-sm ${
                    data.gender === gender
                      ? 'border-emerald-400 bg-emerald-400/10 text-emerald-400'
                      : 'border-gray-600 bg-gray-700/50 text-gray-300 active:border-gray-500'
                  }`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>

          {/* Возраст */}
          <div>
            <label className="block text-gray-300 mb-2 text-sm">
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
                onChange={handleAgeChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          {/* Рост */}
          <div>
            <label className="block text-gray-300 mb-2 text-sm">
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
                onChange={handleHeightChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          {/* Вес */}
          <div>
            <label className="block text-gray-300 mb-2 text-sm">
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
                onChange={handleWeightChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          {/* Шутки - отодвигают кнопку вниз */}
          {showAgeJoke && (
            <div className="mt-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 backdrop-blur-sm animate-pulse">
              <p className="text-emerald-400 text-sm text-center font-medium">
                😄 А выглядишь на 17!
              </p>
            </div>
          )}

          {showHeightJoke && (
            <div className="mt-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 backdrop-blur-sm animate-pulse">
              <p className="text-emerald-400 text-sm text-center font-medium">
                📏 Отличный рост для модельной карьеры!
              </p>
            </div>
          )}

          {showWeightJoke && (
            <div className="mt-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 backdrop-blur-sm animate-pulse">
              <p className="text-emerald-400 text-sm text-center font-medium">
                😉 Указывай честно - мы никому не расскажем!
              </p>
            </div>
          )}

          {/* Кнопка продолжить */}
          <button
            type="submit"
            disabled={!data.age || !data.height || !data.weight || !data.gender}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl 
                     active:from-emerald-600 active:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed 
                     transition-all duration-200 disabled:hover:scale-100 text-sm"
          >
            Продолжить
          </button>
        </form>
        </div>
      </div>
    </div>
  )
}

export default PersonalDataStep
