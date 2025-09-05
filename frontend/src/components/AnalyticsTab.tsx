import React from 'react'

interface AnalyticsTabProps {
  userProfile: any
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ userProfile }) => {
  // Расчет базовых показателей
  const bmr = userProfile.gender === 'male' 
    ? 88.362 + (13.397 * (userProfile.weight || 70)) + (4.799 * (userProfile.height || 170)) - (5.677 * (userProfile.age || 25))
    : 447.593 + (9.247 * (userProfile.weight || 60)) + (3.098 * (userProfile.height || 160)) - (4.330 * (userProfile.age || 25))
  
  const dailyCalories = Math.round(bmr * (userProfile.activityMultiplier || 1.4))
  const consumedToday = 1450 // Пример
  const remaining = dailyCalories - consumedToday

  return (
    <div className="p-4 space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-2">📊 Анализ питания</h2>
        <p className="text-gray-300 text-sm">Ваша статистика за сегодня</p>
      </div>

      {/* Калории */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50">
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-white mb-1">{consumedToday}</div>
          <div className="text-gray-400 text-sm">из {dailyCalories} ккал</div>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
            style={{ width: `${Math.min((consumedToday / dailyCalories) * 100, 100)}%` }}
          ></div>
        </div>
        
        <div className="text-center">
          <span className={`text-sm font-medium ${remaining > 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
            {remaining > 0 ? `Осталось ${remaining} ккал` : `Превышение на ${Math.abs(remaining)} ккал`}
          </span>
        </div>
      </div>

      {/* Макронутриенты */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50">
        <h3 className="text-white font-medium mb-4 text-sm">Макронутриенты</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">B</span>
            </div>
            <div className="text-white text-sm font-medium">Белки</div>
            <div className="text-gray-400 text-xs">89г / 120г</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">Ж</span>
            </div>
            <div className="text-white text-sm font-medium">Жиры</div>
            <div className="text-gray-400 text-xs">45г / 60г</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">У</span>
            </div>
            <div className="text-white text-sm font-medium">Углеводы</div>
            <div className="text-gray-400 text-xs">180г / 220г</div>
          </div>
        </div>
      </div>

      {/* Активность */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50">
        <h3 className="text-white font-medium mb-4 text-sm">Сегодняшняя активность</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs">🚶</span>
              </div>
              <div>
                <div className="text-white text-sm font-medium">Шаги</div>
                <div className="text-gray-400 text-xs">7,842 / 10,000</div>
              </div>
            </div>
            <div className="text-emerald-400 text-sm font-medium">78%</div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs">💧</span>
              </div>
              <div>
                <div className="text-white text-sm font-medium">Вода</div>
                <div className="text-gray-400 text-xs">1.5л / 2.5л</div>
              </div>
            </div>
            <div className="text-orange-400 text-sm font-medium">60%</div>
          </div>
        </div>
      </div>

      {/* Сегодняшние приемы пищи */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50">
        <h3 className="text-white font-medium mb-4 text-sm">Приемы пищи</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-700/30">
            <div className="flex items-center space-x-3">
              <div className="text-lg">🌅</div>
              <div>
                <div className="text-white text-sm font-medium">Завтрак</div>
                <div className="text-gray-400 text-xs">2 блюда</div>
              </div>
            </div>
            <div className="text-emerald-400 text-sm font-medium">420 ккал</div>
          </div>
          
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-700/30">
            <div className="flex items-center space-x-3">
              <div className="text-lg">☀️</div>
              <div>
                <div className="text-white text-sm font-medium">Обед</div>
                <div className="text-gray-400 text-xs">3 блюда</div>
              </div>
            </div>
            <div className="text-emerald-400 text-sm font-medium">680 ккал</div>
          </div>
          
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-700/30">
            <div className="flex items-center space-x-3">
              <div className="text-lg">🌙</div>
              <div>
                <div className="text-white text-sm font-medium">Ужин</div>
                <div className="text-gray-400 text-xs">1 блюдо</div>
              </div>
            </div>
            <div className="text-emerald-400 text-sm font-medium">350 ккал</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsTab
