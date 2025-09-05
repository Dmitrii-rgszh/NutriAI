import { useState, useEffect } from 'react';

interface UserProfile {
  telegram_id: string
  username?: string | null
  age?: number | null
  gender?: string | null
  height?: number | null
  weight?: number | null
  target_weight?: number | null
  activity_level?: string | null
  goal?: string | null
  daily_calories?: number | null
  // Расширенные поля для здоровья
  healthConditions?: string[]
  dietaryRestrictions?: string[]
  allergens?: string[]
  sleepHours?: number
  waterIntake?: number
}

interface HealthStepProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
  onComplete: () => void;
  onBack: () => void;
}

interface HealthCondition {
  id: string;
  name: string;
  description: string;
}

interface DietaryRestriction {
  id: string;
  name: string;
  description: string;
}

interface Allergen {
  id: string;
  name: string;
  description: string;
}

interface Particle {
  id: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
}

const healthConditions: HealthCondition[] = [
  { id: 'diabetes', name: 'Диабет', description: 'Требует контроля сахара' },
  { id: 'hypertension', name: 'Гипертония', description: 'Повышенное давление' },
  { id: 'heart_disease', name: 'Заболевания сердца', description: 'Сердечно-сосудистые проблемы' },
  { id: 'kidney_disease', name: 'Заболевания почек', description: 'Проблемы с почками' },
  { id: 'liver_disease', name: 'Заболевания печени', description: 'Проблемы с печенью' },
  { id: 'gastritis', name: 'Гастрит', description: 'Воспаление желудка' },
  { id: 'food_allergy', name: 'Пищевая аллергия', description: 'Аллергия на продукты' },
];

const dietaryRestrictions: DietaryRestriction[] = [
  { id: 'vegetarian', name: 'Вегетарианство', description: 'Без мяса и рыбы' },
  { id: 'vegan', name: 'Веганство', description: 'Только растительная пища' },
  { id: 'keto', name: 'Кето-диета', description: 'Низкоуглеводная диета' },
  { id: 'paleo', name: 'Палео-диета', description: 'Естественные продукты' },
  { id: 'gluten_free', name: 'Без глютена', description: 'Исключение глютена' },
];

const allergens: Allergen[] = [
  { id: 'nuts', name: 'Орехи', description: 'Все виды орехов' },
  { id: 'dairy', name: 'Молочные продукты', description: 'Лактоза и казеин' },
  { id: 'eggs', name: 'Яйца', description: 'Куриные и другие яйца' },
  { id: 'seafood', name: 'Морепродукты', description: 'Рыба и моллюски' },
  { id: 'soy', name: 'Соя', description: 'Соевые продукты' },
  { id: 'wheat', name: 'Пшеница', description: 'Глютен и пшеничные продукты' },
];

export default function HealthStep({ profile, onUpdate, onComplete, onBack }: HealthStepProps) {
  const [selectedConditions, setSelectedConditions] = useState<string[]>(
    profile.healthConditions || []
  );
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>(
    profile.dietaryRestrictions || []
  );
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(
    profile.allergens || []
  );
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Генерация анимированных частиц
  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 3 + Math.random() * 2
      });
    }
    setParticles(newParticles);
  }, []);

  const toggleCondition = (conditionId: string) => {
    setSelectedConditions(prev => {
      if (prev.includes(conditionId)) {
        return prev.filter(id => id !== conditionId);
      } else {
        return [...prev, conditionId];
      }
    });
  };

  const toggleRestriction = (restrictionId: string) => {
    setSelectedRestrictions(prev => {
      if (prev.includes(restrictionId)) {
        return prev.filter(id => id !== restrictionId);
      } else {
        return [...prev, restrictionId];
      }
    });
  };

  const toggleAllergen = (allergenId: string) => {
    setSelectedAllergens(prev => {
      if (prev.includes(allergenId)) {
        return prev.filter(id => id !== allergenId);
      } else {
        return [...prev, allergenId];
      }
    });
  };

  const showAllergens = selectedConditions.includes('food_allergy');

  const handleShowModal = () => {
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    const updatedProfile = {
      ...profile,
      healthConditions: selectedConditions.length > 0 ? selectedConditions : ['none'],
      dietaryRestrictions: selectedRestrictions.length > 0 ? selectedRestrictions : ['none'],
      allergens: selectedAllergens,
    };
    onUpdate(updatedProfile);
    onComplete();
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
              animationDuration: `${particle.duration}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-3 pb-safe max-w-sm mx-auto">
        {/* Прогресс */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Шаг 4 из 4</span>
            <span>100%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Общий контейнер-карточка */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-4 max-h-[calc(100vh-120px)] overflow-y-auto">
          {/* Заголовок */}
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-1">
              Здоровье и образ жизни
            </h2>
            <p className="text-gray-300 text-xs">
              Расскажите о своем здоровье и привычках
            </p>
          </div>

          <div className="space-y-6">
            {/* Состояние здоровья */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Состояние здоровья</h3>
              <div className="grid grid-cols-1 gap-2">
                {healthConditions.map((condition) => (
                  <button
                    key={condition.id}
                    onClick={() => toggleCondition(condition.id)}
                    className={`w-full p-3 rounded-xl border-2 transition-all duration-300 text-left ${
                      selectedConditions.includes(condition.id)
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                        : 'border-gray-600 bg-gray-800/50 active:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white text-xs">{condition.name}</div>
                        <div className="text-xs text-gray-400">{condition.description}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                        selectedConditions.includes(condition.id)
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-gray-400'
                      }`}>
                        {selectedConditions.includes(condition.id) && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Диетические ограничения */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Диетические ограничения</h3>
              <div className="grid grid-cols-1 gap-2">
                {dietaryRestrictions.map((restriction) => (
                  <button
                    key={restriction.id}
                    onClick={() => toggleRestriction(restriction.id)}
                    className={`w-full p-3 rounded-xl border-2 transition-all duration-300 text-left ${
                      selectedRestrictions.includes(restriction.id)
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                        : 'border-gray-600 bg-gray-800/50 active:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white text-xs">{restriction.name}</div>
                        <div className="text-xs text-gray-400">{restriction.description}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                        selectedRestrictions.includes(restriction.id)
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-gray-400'
                      }`}>
                        {selectedRestrictions.includes(restriction.id) && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Аллергены - показываем только если выбрана пищевая аллергия */}
            {showAllergens && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Аллергены</h3>
                <div className="grid grid-cols-2 gap-2">
                  {allergens.map((allergen) => (
                    <button
                      key={allergen.id}
                      onClick={() => toggleAllergen(allergen.id)}
                      className={`p-3 rounded-xl border-2 transition-all duration-300 text-left ${
                        selectedAllergens.includes(allergen.id)
                          ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20'
                          : 'border-gray-600 bg-gray-800/50 active:border-gray-500'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-semibold text-white text-xs">{allergen.name}</div>
                        <div className="text-xs text-gray-400 mt-1">{allergen.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onBack}
              className="flex-1 py-3 px-4 bg-gray-700 active:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300 text-sm"
            >
              Назад
            </button>
            <button
              onClick={handleShowModal}
              className="flex-2 py-3 px-4 font-semibold rounded-xl transition-all duration-300 text-sm bg-gradient-to-r from-emerald-500 to-teal-500 active:from-emerald-600 active:to-teal-600 text-white shadow-lg shadow-emerald-500/25"
            >
              Завершить настройку
            </button>
          </div>
        </div>
      </div>

      {/* Модальное окно подтверждения */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="text-6xl mb-4">🤔</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Секундочку!
              </h3>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Вы точно ничего не забыли указать? Может, есть какие-то особенности здоровья или предпочтения в питании, о которых стоит упомянуть? 🍎
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 text-sm hover:bg-gray-300"
                >
                  Вернуться
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl transition-all duration-300 text-sm hover:from-emerald-600 hover:to-teal-600"
                >
                  Всё верно!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}