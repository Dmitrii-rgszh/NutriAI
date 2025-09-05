import React, { useState, useMemo } from 'react';
import { UserProfile } from '../App';

interface ActivityStepProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
  onNext: () => void;
  onBack: () => void;
}

interface ActivityLevel {
  level: string;
  title: string;
  description: string;
  friendlyDescription: string;
  multiplier: number;
}

const activityLevels: ActivityLevel[] = [
  {
    level: 'sedentary',
    title: 'Малоподвижный',
    description: 'Офисная работа, нет тренировок',
    friendlyDescription: '🏢 Сидячая работа, мало движения',
    multiplier: 1.2
  },
  {
    level: 'light',
    title: 'Легкая активность',
    description: '1-3 тренировки в неделю',
    friendlyDescription: '🚶‍♀️ Легкие тренировки 1-3 раза в неделю',
    multiplier: 1.375
  },
  {
    level: 'moderate',
    title: 'Умеренная активность',
    description: '3-5 тренировок в неделю',
    friendlyDescription: '🏃‍♂️ Регулярные тренировки 3-5 раз в неделю',
    multiplier: 1.55
  },
  {
    level: 'active',
    title: 'Высокая активность',
    description: '6-7 тренировок в неделю',
    friendlyDescription: '💪 Активные тренировки почти каждый день',
    multiplier: 1.725
  },
  {
    level: 'very_active',
    title: 'Очень высокая',
    description: '2+ тренировки в день',
    friendlyDescription: '🔥 Интенсивные тренировки дважды в день',
    multiplier: 1.9
  }
];

const ActivityStep: React.FC<ActivityStepProps> = ({ profile, onUpdate, onNext, onBack }) => {
  const [activityIndex, setActivityIndex] = useState(
    activityLevels.findIndex(level => level.level === profile.activityLevel) >= 0 
      ? activityLevels.findIndex(level => level.level === profile.activityLevel)
      : 1 // По умолчанию "Легкая активность"
  );
  const [sleepHours, setSleepHours] = useState(profile.sleepHours || 8);
  const [waterIntake, setWaterIntake] = useState(profile.waterIntake || 2000);

  // Фиксированные частицы
  const particles = useMemo(() => 
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 4
    })), []
  )

  const currentActivity = activityLevels[activityIndex];

  const handleNext = () => {
    onUpdate({
      ...profile,
      activityLevel: currentActivity.level,
      activityMultiplier: currentActivity.multiplier,
      sleepHours,
      waterIntake
    });
    onNext();
  };

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
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-3 pb-safe max-w-sm mx-auto">
        {/* Прогресс */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Шаг 3 из 4</span>
            <span>75%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
          </div>
        </div>

        {/* Общий контейнер-карточка */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-4">
          {/* Заголовок */}
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-1">
              Уровень активности
            </h2>
            <p className="text-gray-300 text-xs">
              Выберите ваш обычный уровень физической активности
            </p>
          </div>

          {/* Выбор уровня активности слайдером */}
          <div className="mb-4">
            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 text-xs">Уровень активности:</span>
                <span className="text-emerald-400 font-semibold text-xs">{currentActivity.title}</span>
              </div>
              
              <div className="slider-container mb-2">
                <div 
                  className="slider-progress" 
                  style={{ width: `${(activityIndex / (activityLevels.length - 1)) * 100}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max={activityLevels.length - 1}
                  value={activityIndex}
                  onChange={(e) => setActivityIndex(Number(e.target.value))}
                  className="slider w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Мало</span>
                <span>Средне</span>
                <span>Много</span>
              </div>
            </div>

            {/* Дружелюбное описание */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
              <p className="text-gray-300 text-xs leading-tight">
                {currentActivity.friendlyDescription}
              </p>
            </div>
          </div>

          {/* Сон */}
          <div className="mb-4">
            <div className="mb-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 text-xs">Часов сна в сутки:</span>
                <span className="text-emerald-400 font-semibold text-xs">{sleepHours}ч</span>
              </div>
              
              <div className="slider-container mb-1">
                <div 
                  className="slider-progress" 
                  style={{ width: `${((sleepHours - 4) / (12 - 4)) * 100}%` }}
                />
                <input
                  type="range"
                  min="4"
                  max="12"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="slider w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>4ч</span>
                <span>8ч</span>
                <span>12ч</span>
              </div>
            </div>

            {/* Описание для сна */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
              <p className="text-gray-300 text-xs leading-tight">
                {sleepHours < 6 && '😴 Мало сна!'}
                {sleepHours >= 6 && sleepHours <= 9 && '✅ Отличное количество сна'}
                {sleepHours > 9 && '🛌 Много сна'}
              </p>
            </div>
          </div>

          {/* Потребление воды */}
          <div className="mb-4">
            <div className="mb-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 text-xs">Потребление воды:</span>
                <span className="text-emerald-400 font-semibold text-xs">{(waterIntake / 1000).toFixed(1)}л</span>
              </div>
              
              <div className="slider-container mb-1">
                <div 
                  className="slider-progress" 
                  style={{ width: `${((waterIntake - 1000) / (4000 - 1000)) * 100}%` }}
                />
                <input
                  type="range"
                  min="1000"
                  max="4000"
                  step="250"
                  value={waterIntake}
                  onChange={(e) => setWaterIntake(Number(e.target.value))}
                  className="slider w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>1л</span>
                <span>2.5л</span>
                <span>4л</span>
              </div>
            </div>

            {/* Описание для воды */}
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2">
              <p className="text-gray-300 text-xs leading-tight">
                {waterIntake < 1500 && '💧 Пейте больше!'}
                {waterIntake >= 1500 && waterIntake <= 2500 && '✅ Отличное потребление воды'}
                {waterIntake > 2500 && waterIntake <= 3500 && '🏃‍♂️ Много воды - отлично!'}
                {waterIntake > 3500 && '🌊 Очень много воды'}
              </p>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 py-3 px-4 bg-gray-700 active:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300 text-sm"
            >
              Назад
            </button>
            <button
              onClick={handleNext}
              className="flex-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 active:from-emerald-600 active:to-teal-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg text-sm"
            >
              Далее
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityStep;
