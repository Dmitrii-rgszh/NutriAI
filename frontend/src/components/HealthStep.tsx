import React, { useState, useMemo } from 'react';
import { UserProfile } from '../App';

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

const healthConditions: HealthCondition[] = [
  { id: 'diabetes', name: 'Диабет', description: 'Требует контроля углеводов' },
  { id: 'hypertension', name: 'Гипертония', description: 'Ограничение соли' },
  { id: 'heart_disease', name: 'Болезни сердца', description: 'Контроль холестерина' },
  { id: 'kidney_disease', name: 'Болезни почек', description: 'Ограничение белка' },
  { id: 'allergy', name: 'Пищевая аллергия', description: 'Аллергические реакции на продукты' }
];

const allergens = [
  { id: 'nuts', name: 'Орехи', description: 'Арахис, миндаль, фундук' },
  { id: 'seafood', name: 'Морепродукты', description: 'Рыба, креветки, крабы' },
  { id: 'citrus', name: 'Цитрусовые', description: 'Апельсины, лимоны, грейпфрут' },
  { id: 'honey', name: 'Мед', description: 'Продукты пчеловодства' },
  { id: 'eggs', name: 'Яйца', description: 'Куриные и другие яйца' },
  { id: 'soy', name: 'Соя', description: 'Соевые продукты' }
];

const dietaryRestrictions: DietaryRestriction[] = [
  { id: 'vegetarian', name: 'Вегетарианство', description: 'Без мяса и рыбы' },
  { id: 'vegan', name: 'Веганство', description: 'Без животных продуктов' },
  { id: 'keto', name: 'Кето-диета', description: 'Низкоуглеводная диета' },
  { id: 'gluten_free', name: 'Без глютена', description: 'Исключение глютена' },
  { id: 'lactose_free', name: 'Без лактозы', description: 'Исключение молочных продуктов' },
  { id: 'halal', name: 'Халяль', description: 'Соответствие исламским требованиям' }
];

const HealthStep: React.FC<HealthStepProps> = ({ profile, onUpdate, onComplete, onBack }) => {
  const [selectedConditions, setSelectedConditions] = useState<string[]>(profile.healthConditions || []);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>(profile.dietaryRestrictions || []);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(profile.allergens || []);
  const [waterIntake, setWaterIntake] = useState(profile.waterIntake || 2.0);

  // Фиксированные частицы
  const particles = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 4
    })), []
  )

  const toggleCondition = (conditionId: string) => {
    setSelectedConditions(prev => 
      prev.includes(conditionId)
        ? prev.filter(id => id !== conditionId)
        : [...prev, conditionId]
    );
  };

  const toggleRestriction = (restrictionId: string) => {
    setSelectedRestrictions(prev => 
      prev.includes(restrictionId)
        ? prev.filter(id => id !== restrictionId)
        : [...prev, restrictionId]
    );
  };

  const toggleAllergen = (allergenId: string) => {
    setSelectedAllergens(prev => 
      prev.includes(allergenId)
        ? prev.filter(id => id !== allergenId)
        : [...prev, allergenId]
    );
  };

  const handleComplete = () => {
    onUpdate({
      ...profile,
      healthConditions: selectedConditions,
      dietaryRestrictions: selectedRestrictions,
      allergens: selectedAllergens,
      waterIntake
    });
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
      {/* Анимированные частицы */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-gradient-to-r from-purple-400 to-emerald-400 rounded-full opacity-60 animate-float"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-6 pb-safe max-h-screen overflow-y-auto">
        {/* Прогресс */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Шаг 4 из 4</span>
            <span>100%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-purple-500 to-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Заголовок */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            Здоровье и ограничения
          </h2>
          <p className="text-gray-300 text-sm">
            Расскажите о состоянии здоровья и пищевых предпочтениях
          </p>
        </div>

        {/* Заболевания */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Заболевания (если есть)</h3>
          <div className="space-y-2">
            {healthConditions.map((condition) => (
              <button
                key={condition.id}
                onClick={() => toggleCondition(condition.id)}
                className={`w-full p-3 rounded-lg border-2 transition-all duration-300 text-left ${
                  selectedConditions.includes(condition.id)
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-white text-sm">{condition.name}</div>
                    <div className="text-xs text-gray-400">{condition.description}</div>
                  </div>
                  <div className={`w-4 h-4 rounded border-2 transition-all duration-300 ${
                    selectedConditions.includes(condition.id)
                      ? 'border-red-500 bg-red-500'
                      : 'border-gray-400'
                  }`}>
                    {selectedConditions.includes(condition.id) && (
                      <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Диетические ограничения */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Диетические ограничения</h3>
          <div className="grid grid-cols-2 gap-2">
            {dietaryRestrictions.map((restriction) => (
              <button
                key={restriction.id}
                onClick={() => toggleRestriction(restriction.id)}
                className={`p-3 rounded-lg border-2 transition-all duration-300 text-left ${
                  selectedRestrictions.includes(restriction.id)
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <div className="font-medium text-white text-sm">{restriction.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{restriction.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Пищевые аллергены - показываем только если выбрана аллергия */}
        {selectedConditions.includes('allergy') && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Пищевые аллергии</h3>
            <div className="grid grid-cols-2 gap-2">
              {allergens.map((allergen) => (
                <button
                  key={allergen.id}
                  onClick={() => toggleAllergen(allergen.id)}
                  className={`p-3 rounded-lg border-2 transition-all duration-300 text-left ${
                    selectedAllergens.includes(allergen.id)
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-medium text-white text-sm">{allergen.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{allergen.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Потребление воды */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Потребление воды</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">Литров в день:</span>
              <span className="text-emerald-400 font-semibold">{waterIntake.toFixed(1)}л</span>
            </div>
            <div className="slider-container">
              <div 
                className="slider-progress" 
                style={{ width: `${((waterIntake - 1) / (4 - 1)) * 100}%` }}
              />
              <input
                type="range"
                min="1"
                max="4"
                step="0.1"
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
            onClick={handleComplete}
            className="flex-2 py-4 px-6 bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25"
          >
            Завершить
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthStep;
