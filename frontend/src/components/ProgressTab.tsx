import React from 'react'

interface ProgressTabProps {
  userProfile: any
}

const ProgressTab: React.FC<ProgressTabProps> = ({ userProfile }) => {
  const currentWeight = userProfile.weight || 70
  const targetWeight = userProfile.targetWeight || 65
  const weightDiff = currentWeight - targetWeight
  const progressPercent = Math.max(0, Math.min(100, ((5 - Math.abs(weightDiff)) / 5) * 100))

  return (
    <div className="p-4 space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-2">📈 Прогресс</h2>
        <p className="text-gray-300 text-sm">Отслеживайте достижение ваших целей</p>
      </div>

      {/* Цель по весу */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50">
        <h3 className="text-white font-medium mb-4 text-sm">🎯 Цель по весу</h3>
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-white mb-1">{currentWeight} кг</div>
          <div className="text-gray-400 text-sm">цель: {targetWeight} кг</div>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Старт</span>
          <span className="text-purple-400 font-medium">{progressPercent.toFixed(0)}%</span>
          <span className="text-gray-400">Цель</span>
        </div>
      </div>

      {/* Еженедельная статистика */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50">
        <h3 className="text-white font-medium mb-4 text-sm">📊 Эта неделя</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400 mb-1">5</div>
            <div className="text-gray-400 text-xs">дней соблюдения</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">-0.3</div>
            <div className="text-gray-400 text-xs">кг за неделю</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">1.8</div>
            <div className="text-gray-400 text-xs">л воды в день</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400 mb-1">92%</div>
            <div className="text-gray-400 text-xs">соблюдение БЖУ</div>
          </div>
        </div>
      </div>

      {/* График прогресса */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50">
        <h3 className="text-white font-medium mb-4 text-sm">📈 Динамика веса</h3>
        <div className="space-y-2">
          {[
            { date: 'Пн', weight: 70.5, target: true },
            { date: 'Вт', weight: 70.2, target: true },
            { date: 'Ср', weight: 70.0, target: true },
            { date: 'Чт', weight: 69.8, target: true },
            { date: 'Пт', weight: 69.9, target: false },
            { date: 'Сб', weight: 69.7, target: true },
            { date: 'Вс', weight: 69.5, target: true }
          ].map((day, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-8 text-gray-400 text-xs">{day.date}</div>
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${day.target ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-orange-500 to-red-500'}`}
                  style={{ width: `${((72 - day.weight) / 2) * 100}%` }}
                ></div>
              </div>
              <div className="w-12 text-white text-xs text-right">{day.weight}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Достижения */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50">
        <h3 className="text-white font-medium mb-4 text-sm">🏆 Достижения</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-gray-700/30 rounded-lg">
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-white text-xs font-medium">Неделя</div>
            <div className="text-gray-400 text-xs">соблюдения</div>
          </div>
          <div className="text-center p-3 bg-gray-700/30 rounded-lg">
            <div className="text-2xl mb-1">💧</div>
            <div className="text-white text-xs font-medium">Гидратация</div>
            <div className="text-gray-400 text-xs">7 дней</div>
          </div>
          <div className="text-center p-3 bg-gray-700/30 rounded-lg">
            <div className="text-2xl mb-1">📸</div>
            <div className="text-white text-xs font-medium">Фотограф</div>
            <div className="text-gray-400 text-xs">50 фото</div>
          </div>
        </div>
      </div>

      {/* Мотивационная карточка */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-xl p-4 border border-purple-500/30">
        <div className="text-center">
          <div className="text-2xl mb-2">💪</div>
          <h3 className="text-white font-medium mb-2 text-sm">Отличная работа!</h3>
          <p className="text-gray-300 text-xs mb-3">
            Вы на правильном пути. Еще {Math.abs(weightDiff).toFixed(1)} кг до цели!
          </p>
          <div className="text-purple-400 text-xs font-medium">
            При таких темпах цель будет достигнута через {Math.ceil(Math.abs(weightDiff) / 0.3)} недель
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProgressTab
