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
  multiplier: number;
}

const activityLevels: ActivityLevel[] = [
  {
    level: 'sedentary',
    title: 'Малоподвижный',
    description: 'Офисная работа, нет тренировок',
    multiplier: 1.2
  },
  {
    level: 'light',
    title: 'Легкая активность',
    description: '1-3 тренировки в неделю',
    multiplier: 1.375
  },
  {
    level: 'moderate',
    title: 'Умеренная активность',
    description: '3-5 тренировок в неделю',
    multiplier: 1.55
  },
  {
    level: 'active',
    title: 'Высокая активность',
    description: '6-7 тренировок в неделю',
    multiplier: 1.725
  },
  {
    level: 'very_active',
    title: 'Очень высокая',
    description: '2+ тренировки в день',
    multiplier: 1.9
  }
];

const ActivityStep: React.FC<ActivityStepProps> = ({ profile, onUpdate, onNext, onBack }) => {
  const [selectedActivity, setSelectedActivity] = useState(profile.activityLevel || '');
  const [sleepHours, setSleepHours] = useState(profile.sleepHours || 8);

  // Фиксированные частицы
  const particles = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 4
    })), []
  )

  const handleNext = () => {
    const selectedLevel = activityLevels.find(level => level.level === selectedActivity);
    onUpdate({
      ...profile,
      activityLevel: selectedActivity,
      activityMultiplier: selectedLevel?.multiplier || 1.2,
      sleepHours
    });
    onNext();
  };

  const isFormValid = selectedActivity !== '';

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
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-6 pb-safe">
        {/* Прогресс */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Шаг 3 из 4</span>
            <span>75%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
          </div>
        </div>

        {/* Заголовок */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
            Уровень активности
          </h2>
          <p className="text-gray-300 text-sm">
            Выберите ваш обычный уровень физической активности
          </p>
        </div>

        {/* Выбор уровня активности */}
        <div className="space-y-3 mb-8">
          {activityLevels.map((level) => (
            <button
              key={level.level}
              onClick={() => setSelectedActivity(level.level)}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                selectedActivity === level.level
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                  : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-white">{level.title}</div>
                  <div className="text-sm text-gray-400">{level.description}</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                  selectedActivity === level.level
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-gray-400'
                }`}>
                  {selectedActivity === level.level && (
                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Сон */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Сколько часов спите?</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Часов сна в сутки:</span>
              <span className="text-emerald-400 font-semibold text-lg">{sleepHours}ч</span>
            </div>
            <div className="slider-container">
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
        </div>

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
            disabled={!isFormValid}
            className={`flex-2 py-4 px-6 font-semibold rounded-xl transition-all duration-300 ${
              isFormValid
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Далее
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityStep;
