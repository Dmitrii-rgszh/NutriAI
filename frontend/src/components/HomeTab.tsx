import React from 'react'

interface HomeTabProps {
  userProfile: any
}

const HomeTab: React.FC<HomeTabProps> = ({ userProfile }) => {
  return (
    <div className="p-4 space-y-4">
      {/* Приветствие */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-2">
          Привет{userProfile.gender === 'female' ? ', красотка' : ''}! 👋
        </h2>
        <p className="text-gray-300 text-sm">Готовы к новому дню здорового питания?</p>
      </div>

      {/* Быстрая статистика */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-lg p-3 border border-gray-700/50 text-center">
          <div className="text-lg mb-1">⚡</div>
          <div className="text-white text-sm font-medium">1450</div>
          <div className="text-gray-400 text-xs">ккал сегодня</div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-lg p-3 border border-gray-700/50 text-center">
          <div className="text-lg mb-1">💧</div>
          <div className="text-white text-sm font-medium">1.5л</div>
          <div className="text-gray-400 text-xs">воды выпито</div>
        </div>
      </div>

      {/* Основные действия */}
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-lg p-4 border border-gray-700/50">
          <h3 className="text-sm font-semibold mb-2 text-emerald-400">📸 Анализ питания</h3>
          <p className="text-gray-300 mb-3 text-xs">Сфотографируйте блюдо для подсчета калорий</p>
          <button className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-lg active:from-emerald-600 active:to-teal-600 transition-all duration-200 text-sm">
            Сделать фото
          </button>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-lg p-4 border border-gray-700/50">
          <h3 className="text-sm font-semibold mb-2 text-emerald-400">📈 Прогресс</h3>
          <p className="text-gray-300 mb-3 text-xs">Отслеживайте достижение целей</p>
          <button className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg active:from-purple-600 active:to-pink-600 transition-all duration-200 text-sm">
            Статистика
          </button>
        </div>
      </div>

      {/* Рекомендации на сегодня */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-lg p-4 border border-gray-700/50">
        <h3 className="text-white font-medium mb-3 text-sm">💡 Рекомендации на сегодня</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-emerald-600/10 rounded-lg border border-emerald-600/20">
            <div className="text-lg">🥗</div>
            <div className="flex-1">
              <div className="text-emerald-400 text-sm font-medium">Добавьте больше овощей</div>
              <div className="text-gray-300 text-xs">Вам не хватает клетчатки. Попробуйте салат на обед.</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-blue-600/10 rounded-lg border border-blue-600/20">
            <div className="text-lg">💧</div>
            <div className="flex-1">
              <div className="text-blue-400 text-sm font-medium">Пейте больше воды</div>
              <div className="text-gray-300 text-xs">До нормы осталось 1 литр. Поставьте напоминание!</div>
            </div>
          </div>
        </div>
      </div>

      {/* Последние достижения */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-lg p-4 border border-gray-700/50">
        <h3 className="text-white font-medium mb-3 text-sm">🏆 Последние достижения</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-3 p-2 bg-gray-700/30 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs">🔥</span>
            </div>
            <div className="flex-1">
              <div className="text-white text-sm font-medium">Неделя соблюдения диеты</div>
              <div className="text-gray-400 text-xs">7 дней подряд в рамках калорий</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-2 bg-gray-700/30 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs">💧</span>
            </div>
            <div className="flex-1">
              <div className="text-white text-sm font-medium">Эксперт гидратации</div>
              <div className="text-gray-400 text-xs">5 дней выполнения нормы воды</div>
            </div>
          </div>
        </div>
      </div>

      {/* Мотивационная цитата */}
      <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 backdrop-blur-xl rounded-lg p-4 border border-emerald-500/30">
        <div className="text-center">
          <div className="text-2xl mb-2">✨</div>
          <p className="text-emerald-400 text-sm font-medium mb-1">
            "Каждый прием пищи - это новая возможность"
          </p>
          <p className="text-gray-300 text-xs">
            Делайте правильный выбор уже сегодня!
          </p>
        </div>
      </div>
    </div>
  )
}

export default HomeTab
