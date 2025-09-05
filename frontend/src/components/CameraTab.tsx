import React from 'react'

interface CameraTabProps {
  userProfile?: any
}

const CameraTab: React.FC<CameraTabProps> = () => {
  return (
    <div className="p-4 space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-2">📸 Анализ питания</h2>
        <p className="text-gray-300 text-sm">Сфотографируйте блюдо для подсчета калорий</p>
      </div>

      {/* Кнопка камеры */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50 text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl active:from-emerald-600 active:to-teal-600 transition-all duration-200 active:scale-95">
          Сделать фото
        </button>
      </div>

      {/* Быстрые действия */}
      <div className="grid grid-cols-2 gap-3">
        <button className="bg-gray-800/50 backdrop-blur-xl rounded-lg p-4 border border-gray-700/50 text-left active:bg-gray-700/50 transition-all duration-200">
          <div className="text-2xl mb-2">🥗</div>
          <div className="text-white font-medium text-sm">Добавить салат</div>
          <div className="text-gray-400 text-xs">Быстрый ввод</div>
        </button>
        <button className="bg-gray-800/50 backdrop-blur-xl rounded-lg p-4 border border-gray-700/50 text-left active:bg-gray-700/50 transition-all duration-200">
          <div className="text-2xl mb-2">💧</div>
          <div className="text-white font-medium text-sm">Вода</div>
          <div className="text-gray-400 text-xs">+250 мл</div>
        </button>
      </div>

      {/* История */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-lg p-4 border border-gray-700/50">
        <h3 className="text-white font-medium mb-3 text-sm">Недавние блюда</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-700/30">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
              🍝
            </div>
            <div className="flex-1">
              <div className="text-white text-sm font-medium">Паста Болоньезе</div>
              <div className="text-gray-400 text-xs">520 ккал</div>
            </div>
            <button className="text-emerald-400 text-xs">+</button>
          </div>
          <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-700/30">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
              🥙
            </div>
            <div className="flex-1">
              <div className="text-white text-sm font-medium">Куриная шаурма</div>
              <div className="text-gray-400 text-xs">680 ккал</div>
            </div>
            <button className="text-emerald-400 text-xs">+</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CameraTab
