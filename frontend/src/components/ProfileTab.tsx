import React from 'react'

interface ProfileTabProps {
  userProfile: any
  onStartOnboarding: () => void
  onResetProfile?: () => void
}

const ProfileTab: React.FC<ProfileTabProps> = ({ userProfile, onStartOnboarding, onResetProfile }) => {
  const handleResetProfile = () => {
    if (window.confirm('Вы уверены, что хотите сбросить все данные профиля? Это действие нельзя отменить.')) {
      localStorage.removeItem('userProfile')
      if (onResetProfile) {
        onResetProfile()
      }
      // Перезагружаем страницу для возврата к welcome screen
      window.location.reload()
    }
  }
  return (
    <div className="p-4 space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-2">👤 Профиль</h2>
        <p className="text-gray-300 text-sm">Управление вашими данными и настройками</p>
      </div>

      {/* Основная информация */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50">
        <h3 className="text-white font-medium mb-4 text-sm">📊 Основная информация</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-gray-400 text-xs mb-1">Пол</div>
            <div className="text-white text-sm">{userProfile.gender === 'male' ? 'Мужской' : userProfile.gender === 'female' ? 'Женский' : 'Другой'}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">Возраст</div>
            <div className="text-white text-sm">{userProfile.age} лет</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">Рост</div>
            <div className="text-white text-sm">{userProfile.height} см</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">Вес</div>
            <div className="text-white text-sm">{userProfile.weight} кг</div>
          </div>
        </div>
        
        <button 
          onClick={onStartOnboarding}
          className="w-full mt-4 py-2 bg-gray-700/50 text-gray-300 rounded-lg active:bg-gray-600/50 transition-all duration-200 text-xs"
        >
          ✏️ Редактировать данные
        </button>
      </div>

      {/* Цели */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50">
        <h3 className="text-white font-medium mb-4 text-sm">🎯 Ваши цели</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">Основная цель</span>
            <span className="text-white text-sm">
              {userProfile.goal === 'lose' ? 'Похудение' : 
               userProfile.goal === 'gain' ? 'Набор веса' : 'Поддержание веса'}
            </span>
          </div>
          {userProfile.targetWeight && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">Целевой вес</span>
              <span className="text-white text-sm">{userProfile.targetWeight} кг</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">Активность</span>
            <span className="text-white text-sm text-xs">{userProfile.activityLevel}</span>
          </div>
        </div>
      </div>

      {/* Здоровье */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50">
        <h3 className="text-white font-medium mb-4 text-sm">🏥 Здоровье</h3>
        <div className="space-y-3">
          <div>
            <div className="text-gray-400 text-xs mb-2">Состояния здоровья</div>
            <div className="flex flex-wrap gap-2">
              {userProfile.healthConditions?.length > 0 ? 
                userProfile.healthConditions.map((condition: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">
                    {condition}
                  </span>
                )) : 
                <span className="text-gray-500 text-xs">Не указаны</span>
              }
            </div>
          </div>
          
          <div>
            <div className="text-gray-400 text-xs mb-2">Диетические ограничения</div>
            <div className="flex flex-wrap gap-2">
              {userProfile.dietaryRestrictions?.length > 0 ? 
                userProfile.dietaryRestrictions.map((restriction: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-orange-600/20 text-orange-400 rounded text-xs">
                    {restriction}
                  </span>
                )) : 
                <span className="text-gray-500 text-xs">Не указаны</span>
              }
            </div>
          </div>
          
          <div>
            <div className="text-gray-400 text-xs mb-2">Аллергены</div>
            <div className="flex flex-wrap gap-2">
              {userProfile.allergens?.length > 0 ? 
                userProfile.allergens.map((allergen: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs">
                    {allergen}
                  </span>
                )) : 
                <span className="text-gray-500 text-xs">Не указаны</span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Настройки */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50">
        <h3 className="text-white font-medium mb-4 text-sm">⚙️ Настройки</h3>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-3 bg-gray-700/30 rounded-lg active:bg-gray-600/30 transition-all duration-200">
            <div className="flex items-center space-x-3">
              <span className="text-lg">🔔</span>
              <span className="text-white text-sm">Уведомления</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>
          
          <button className="w-full flex items-center justify-between p-3 bg-gray-700/30 rounded-lg active:bg-gray-600/30 transition-all duration-200">
            <div className="flex items-center space-x-3">
              <span className="text-lg">🎯</span>
              <span className="text-white text-sm">Цели и напоминания</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>
          
          <button className="w-full flex items-center justify-between p-3 bg-gray-700/30 rounded-lg active:bg-gray-600/30 transition-all duration-200">
            <div className="flex items-center space-x-3">
              <span className="text-lg">📊</span>
              <span className="text-white text-sm">Экспорт данных</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>
          
          <button className="w-full flex items-center justify-between p-3 bg-gray-700/30 rounded-lg active:bg-gray-600/30 transition-all duration-200">
            <div className="flex items-center space-x-3">
              <span className="text-lg">🔒</span>
              <span className="text-white text-sm">Приватность</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>
        </div>
      </div>

      {/* О приложении */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50">
        <h3 className="text-white font-medium mb-4 text-sm">ℹ️ О приложении</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Версия</span>
            <span className="text-white">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Разработчик</span>
            <span className="text-white">NutriAI Team</span>
          </div>
        </div>
        
        <div className="flex space-x-2 mt-4">
          <button className="flex-1 py-2 bg-gray-700/50 text-gray-300 rounded-lg active:bg-gray-600/50 transition-all duration-200 text-xs">
            📞 Поддержка
          </button>
          <button className="flex-1 py-2 bg-gray-700/50 text-gray-300 rounded-lg active:bg-gray-600/50 transition-all duration-200 text-xs">
            ⭐ Оценить
          </button>
        </div>
        
        {/* Кнопка сброса профиля для тестирования */}
        <div className="mt-4">
          <button 
            onClick={handleResetProfile}
            className="w-full py-2 bg-red-600/20 text-red-400 rounded-lg border border-red-600/30 active:bg-red-600/30 transition-all duration-200 text-xs"
          >
            🗑️ Сбросить профиль (для тестирования)
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileTab
