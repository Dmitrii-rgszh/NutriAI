import { useState, useMemo } from 'react'

interface GoalStepProps {
  onNext: (data: {
    goalType: 'lose' | 'maintain' | 'gain'
    targetWeight?: number
  }) => void
  onBack: () => void
  currentWeight: number
}

export default function GoalStep({ onNext, onBack, currentWeight }: GoalStepProps) {
  const [goalType, setGoalType] = useState<'lose' | 'maintain' | 'gain' | null>(null)
  const [targetWeight, setTargetWeight] = useState<number>(currentWeight - 5)

  // Фиксированные частицы
  const particles = useMemo(() => 
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 2
    })), []
  )

  const needsTargetWeight = goalType === 'lose' || goalType === 'gain'
  const canProceed = goalType !== null && (!needsTargetWeight || targetWeight > 0)

  const handleNext = () => {
    if (canProceed && goalType) {
      onNext({ 
        goalType, 
        targetWeight: needsTargetWeight ? targetWeight : undefined 
      })
    }
  }

  const goals = [
    {
      value: 'lose',
      title: 'Похудеть',
      description: 'Снизить вес безопасно',
      icon: '📉'
    },
    {
      value: 'maintain',
      title: 'Поддерживать',
      description: 'Оставаться в форме',
      icon: '📊'
    },
    {
      value: 'gain',
      title: 'Набрать массу',
      description: 'Увеличить мышечную массу',
      icon: '📈'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
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

      <div className="relative z-10 p-6 pb-safe">
        {/* Заголовок */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">
            Ваша цель
          </h2>
        </div>

        {/* Прогресс */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Шаг 2 из 4</span>
            <span>50%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500" style={{ width: '50%' }}></div>
          </div>
        </div>

        {/* Выбор цели */}
        <div className="space-y-4 mb-8">
          {goals.map((goal) => (
            <button
              key={goal.value}
              onClick={() => setGoalType(goal.value as 'lose' | 'maintain' | 'gain')}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                goalType === goal.value
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                  : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{goal.icon}</div>
                  <div>
                    <div className="font-semibold text-white">{goal.title}</div>
                    <div className="text-sm text-gray-400">{goal.description}</div>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                  goalType === goal.value
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-gray-400'
                }`}>
                  {goalType === goal.value && (
                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Целевой вес */}
        {needsTargetWeight && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">
              {goalType === 'lose' ? 'Желаемый вес' : 'Целевой вес'}
            </h3>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                value={targetWeight}
                onChange={(e) => setTargetWeight(Number(e.target.value))}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
                placeholder="Вес в кг"
                min="30"
                max="200"
              />
              <span className="text-gray-400">кг</span>
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Текущий вес: {currentWeight} кг
            </div>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 py-4 px-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300"
          >
            Назад
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`flex-2 py-4 px-6 font-semibold rounded-xl transition-all duration-300 ${
              canProceed
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Далее
          </button>
        </div>
      </div>
    </div>
  )
}
