import { useState, useEffect, useCallback, useMemo } from 'react';
import FastingRange from './FastingRange';
import { api } from '../api';
import { useDataStore } from '../store';

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
  fasting_start_hour?: number
  fasting_end_hour?: number
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

// Base data (extended with popularity metadata below)
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
  { id: 'vegan', name: 'Веганство', description: 'Всё растительное' },
  { id: 'keto', name: 'Кето', description: 'Низкоуглеводная' },
  { id: 'lowcarb', name: 'Низкоуглеводная', description: 'Сниженное потребление углеводов (не строго кето)' },
  { id: 'paleo', name: 'Палео', description: 'Естественные продукты' },
  { id: 'gluten_free', name: 'Без глютена', description: 'Исключение глютена' },
  { id: 'intermittent_fasting', name: 'Интервальное голодание', description: 'Еда в ограниченном окне времени (например 16/8)' },
];

const allergens: Allergen[] = [
  { id: 'peanuts', name: 'Арахис', description: 'Арахис и продукты из него' },
  { id: 'tree_nuts', name: 'Древесные орехи', description: 'Миндаль, фундук, кешью и др.' },
  { id: 'dairy', name: 'Молочные', description: 'Лактоза и/или белки молока' },
  { id: 'eggs', name: 'Яйца', description: 'Куриные и другие яйца' },
  { id: 'fish', name: 'Рыба', description: 'Все виды рыбы' },
  { id: 'shellfish', name: 'Ракообразные', description: 'Креветки, крабы, омары' },
  { id: 'mollusks', name: 'Моллюски', description: 'Мидии, устрицы и др.' },
  { id: 'soy', name: 'Соя', description: 'Соевые продукты' },
  { id: 'wheat', name: 'Пшеница', description: 'Глютен / пшеница' },
  { id: 'sesame', name: 'Кунжут', description: 'Семена и паста (тахини)' },
  { id: 'mustard', name: 'Горчица', description: 'Семена, порошок, масла' },
  { id: 'celery', name: 'Сельдерей', description: 'Стебли/корень/семена' },
  { id: 'citrus', name: 'Цитрусовые', description: 'Апельсин, лимон, лайм и др.' },
  { id: 'strawberry', name: 'Клубника', description: 'Натуральные ягоды' },
  { id: 'honey', name: 'Мёд', description: 'Продукты пчеловодства (мёд)' },
  { id: 'propolis', name: 'Прополис', description: 'Пчелиный клей (прополис)' },
];

// Группы аллергенов (для визуальной сегрегации)
const allergenGroupMap: Record<string, string> = {
  peanuts: 'Орехи',
  tree_nuts: 'Орехи',
  dairy: 'Животные продукты',
  eggs: 'Животные продукты',
  fish: 'Морепродукты',
  shellfish: 'Морепродукты',
  mollusks: 'Морепродукты',
  soy: 'Растительные',
  wheat: 'Злаки и семена',
  sesame: 'Злаки и семена',
  mustard: 'Пряности',
  celery: 'Овощи',
  citrus: 'Фрукты / ягоды',
  strawberry: 'Фрукты / ягоды',
  honey: 'Продукты пчёл',
  propolis: 'Продукты пчёл'
};

const allergenGroupOrder = [
  'Орехи',
  'Животные продукты',
  'Морепродукты',
  'Растительные',
  'Злаки и семена',
  'Пряности',
  'Овощи',
  'Фрукты / ягоды',
  'Продукты пчёл'
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
  const [showAll, setShowAll] = useState(false); // expand rest after popular
  const [activeTab, setActiveTab] = useState<'conditions' | 'restrictions' | 'allergens'>('conditions');
  // Removed viewMode toggle (tabs/list) after simplified popular/all control
  const [isMobile, setIsMobile] = useState<boolean>(() => (typeof window !== 'undefined' ? window.innerWidth < 640 : false));
  const [focusIndex, setFocusIndex] = useState<number>(-1); // keyboard nav within current list
  const [mobileFilter, setMobileFilter] = useState<'all' | 'conditions' | 'restrictions' | 'allergens'>('all');
  const [allergenGroupFilter, setAllergenGroupFilter] = useState<string>('all');
  // Fasting window (start/end hour of eating window) default 12:00-20:00 (8h fasting = 16h eating? actually fasting=24-eating). We'll default to 12-20 -> 8h eating => 16h fasting typical 16/8.
  const [fastingStart, setFastingStart] = useState<number>(12); // start eating
  const [fastingEnd, setFastingEnd] = useState<number>(20); // end eating (exclusive)
  const fastingRestrictionSelected = selectedRestrictions.includes('intermittent_fasting');

  // Ensure fasting minimum 8h fasting (i.e. eating window <=16h). Eating window hours computed with wrap.
  const eatingWindowHours = useMemo(() => {
    if (fastingEnd >= fastingStart) return fastingEnd - fastingStart; else return (24 - fastingStart) + fastingEnd;
  }, [fastingStart, fastingEnd]);
  const fastingHours = 24 - eatingWindowHours;
  const fastingValid = fastingHours >= 8; // requirement

  // Popular IDs across categories (data-informed guess; can be tuned or loaded from backend later)
  const popularIds = useMemo(() => [
    'diabetes', 'hypertension', 'vegetarian', 'vegan', 'gluten_free', 'dairy', 'peanuts', 'citrus', 'honey'
  ], []);

  // Unified item model for simplified rendering
  interface UnifiedItem { id: string; name: string; description: string; category: 'conditions' | 'restrictions' | 'allergens'; popular: boolean; }

  const unifiedItems: UnifiedItem[] = useMemo(() => {
    const conditionItems = healthConditions.map(h => ({ ...h, category: 'conditions' as const, popular: popularIds.includes(h.id) }));
    const restrictionItems = dietaryRestrictions.map(r => ({ ...r, category: 'restrictions' as const, popular: popularIds.includes(r.id) }));
    const allergenItems = allergens.map(a => ({ ...a, category: 'allergens' as const, popular: popularIds.includes(a.id) }));
    return [...conditionItems, ...restrictionItems, ...allergenItems];
  }, [popularIds]);

  // Category color style helper
  const categoryStyle = (cat: UnifiedItem['category'], selected: boolean) => {
    switch (cat) {
      case 'conditions':
        return selected
          ? 'border-emerald-400 bg-emerald-600/20 text-emerald-100'
          : 'border-emerald-800/40 bg-emerald-900/20 text-emerald-200/80 hover:border-emerald-500/50';
      case 'restrictions':
        return selected
          ? 'border-cyan-400 bg-cyan-600/20 text-cyan-100'
          : 'border-cyan-800/40 bg-cyan-900/20 text-cyan-200/80 hover:border-cyan-500/50';
      case 'allergens':
        return selected
          ? 'border-rose-400 bg-rose-600/25 text-rose-100'
          : 'border-rose-800/40 bg-rose-900/25 text-rose-200/80 hover:border-rose-500/50';
    }
  };

  // Filtered lists by category (allergens conditional)
  const showAllergens = selectedConditions.includes('food_allergy');
  const categoryCounts = {
    conditions: selectedConditions.length,
    restrictions: selectedRestrictions.length,
    allergens: showAllergens ? selectedAllergens.length : 0
  };

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

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

  // Selection helpers unified for keyboard navigation / generic toggles
  const isSelected = useCallback((item: { id: string; category: UnifiedItem['category'] }) => {
    switch (item.category) {
      case 'conditions': return selectedConditions.includes(item.id);
      case 'restrictions': return selectedRestrictions.includes(item.id);
      case 'allergens': return selectedAllergens.includes(item.id);
    }
  }, [selectedConditions, selectedRestrictions, selectedAllergens]);

  const toggleUnified = useCallback((item: UnifiedItem) => {
    if (item.category === 'conditions') toggleCondition(item.id); else if (item.category === 'restrictions') toggleRestriction(item.id); else toggleAllergen(item.id);
  }, [toggleCondition, toggleRestriction, toggleAllergen]);

  // Keyboard navigation inside current visible list (chips/cards)
  const visibleCurrentList: UnifiedItem[] = useMemo(() => {
    // Determine which collection we show (for tabs) or merged list (mobile grid)
    if (isMobile) {
      let filtered = unifiedItems.filter(i => (i.category !== 'allergens' || showAllergens));
      if (mobileFilter !== 'all') filtered = filtered.filter(i => i.category === mobileFilter);
      if (mobileFilter === 'allergens' && allergenGroupFilter !== 'all') {
        filtered = filtered.filter(i => i.category !== 'allergens' || allergenGroupMap[i.id]?.toLowerCase() === allergenGroupFilter);
      }
      // When showing all categories together on mobile we must not mix categories.
      if (mobileFilter === 'all') {
        const order: UnifiedItem['category'][] = ['conditions','restrictions','allergens'];
        const result: UnifiedItem[] = [];
        for (const cat of order) {
          if (cat === 'allergens' && !showAllergens) continue;
          let catItems = filtered.filter(i => i.category === cat);
          if (!showAll) {
            catItems = catItems.filter(i => i.popular);
          } else {
            // Optionally keep popular items first within each category (no mixing between categories)
            const popularInCat = catItems.filter(i => i.popular);
            const restInCat = catItems.filter(i => !i.popular);
            catItems = [...popularInCat, ...restInCat];
          }
            // Apply allergen group filter if relevant and cat is allergens
          if (cat === 'allergens' && allergenGroupFilter !== 'all') {
            catItems = catItems.filter(i => allergenGroupMap[i.id]?.toLowerCase() === allergenGroupFilter);
          }
          result.push(...catItems);
        }
        return result;
      }
      // Single category mobile view keeps original popular + rest ordering
      const popular = filtered.filter(i => i.popular);
      if (!showAll) return popular;
      const rest = filtered.filter(i => !i.popular);
      return [...popular, ...rest];
    }
    // Desktop: show items of activeTab
    let desktop = unifiedItems.filter(i => i.category === activeTab && (i.category !== 'allergens' || showAllergens));
    if (activeTab === 'allergens' && allergenGroupFilter !== 'all') {
      desktop = desktop.filter(i => allergenGroupMap[i.id]?.toLowerCase() === allergenGroupFilter);
    }
    return desktop;
  }, [unifiedItems, isMobile, activeTab, showAll, showAllergens, mobileFilter, allergenGroupFilter]);


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!visibleCurrentList.length) return;
    if (['ArrowRight','ArrowDown'].includes(e.key)) {
      e.preventDefault();
      setFocusIndex(idx => (idx + 1) % visibleCurrentList.length);
    } else if (['ArrowLeft','ArrowUp'].includes(e.key)) {
      e.preventDefault();
      setFocusIndex(idx => (idx - 1 + visibleCurrentList.length) % visibleCurrentList.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const item = visibleCurrentList[focusIndex];
      if (item) toggleUnified(item);
    }
  };

  const handleShowModal = () => {
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
  const pushToast = (useDataStore as any).getState?.().pushToast;
    const payload: any = {
      health_conditions: selectedConditions.length > 0 ? selectedConditions : ['none'],
      dietary_restrictions: selectedRestrictions.length > 0 ? selectedRestrictions : ['none'],
      allergens: selectedAllergens,
      ...(fastingRestrictionSelected ? { fasting_start_hour: fastingStart, fasting_end_hour: fastingEnd } : {})
    };
    // optimistic local update
    onUpdate({
      ...profile,
      healthConditions: payload.health_conditions,
      dietaryRestrictions: payload.dietary_restrictions,
      allergens: payload.allergens,
      ...(fastingRestrictionSelected ? { fasting_start_hour: fastingStart, fasting_end_hour: fastingEnd } : {})
    });
  api.updateProfile(payload).catch(() => { pushToast && pushToast('Ошибка сохранения профиля','error') });
    onComplete();
  };

  return (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 text-white relative overflow-hidden">
      {/* Анимированные частицы */}
      <div className="absolute inset-0 pointer-events-none">
        <style>{particles.map(p => `.particle-${p.id}{left:${p.left}%;top:${p.top}%;animation-delay:${p.delay}s;animation-duration:${p.duration}s;}`).join('')}</style>
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={`absolute w-1 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-60 animate-float particle-${particle.id}`}
            data-left={particle.left}
            data-top={particle.top}
            data-delay={particle.delay}
            data-duration={particle.duration}
          />
        ))}
      </div>

  <div className="relative z-10 p-3 pb-safe max-w-4xl mx-auto health-step-scale">
        {/* Прогресс */}
        <div className="mb-3">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Шаг 4 из 4</span>
            <span>100%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div className="progress-full bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"></div>
          </div>
        </div>
        {/* Фиксированный заголовок шага */}
        <div className="mb-4 sticky top-3 z-20 bg-gradient-to-br from-gray-900/90 via-gray-900/70 to-gray-800/60 backdrop-blur-xl rounded-xl px-4 py-5 border border-gray-700/60 shadow-lg">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2 text-center sm:text-left">Здоровье и образ жизни</h2>
          <p className="text-gray-300 text-sm text-center sm:text-left mb-2">Расскажите о своем здоровье и привычках</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 text-[12px] tracking-wide leading-snug">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-800/45 border border-emerald-500/50 text-emerald-200/95 shadow-sm">Состояния</span>
            <span className="px-3 py-1.5 rounded-lg bg-cyan-800/45 border border-cyan-500/50 text-cyan-200/95 shadow-sm">Диеты</span>
            <span className="px-3 py-1.5 rounded-lg bg-rose-800/45 border border-rose-500/50 text-rose-200/95 shadow-sm">Аллергены</span>
          </div>
        </div>

        {/* Скроллируемый блок контента */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-5 max-h-[calc(100vh-220px)] overflow-y-auto">
          <div className="flex flex-col items-center gap-2 mb-6 w-full">
            <div className="inline-flex rounded-xl overflow-hidden border border-gray-600/60 bg-gray-700/40 mx-auto shadow-sm">
              <button
                type="button"
                data-pressed={!showAll}
                onClick={() => setShowAll(false)}
                className={`px-4 py-2 text-[12px] font-semibold tracking-wide transition-all duration-200 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 ${!showAll ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-900 shadow-lg shadow-emerald-500/30 scale-[1.05]' : 'text-gray-300 hover:text-gray-100'}`}
              >Популярное</button>
              <button
                type="button"
                data-pressed={showAll}
                onClick={() => setShowAll(true)}
                className={`px-4 py-2 text-[12px] font-semibold tracking-wide transition-all duration-200 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 ${showAll ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-900 shadow-lg shadow-emerald-500/30 scale-[1.05]' : 'text-gray-300 hover:text-gray-100'}`}
              >Все варианты</button>
            </div>
            <p className="text-[12px] sm:text-[13px] leading-snug text-center text-gray-300/90 max-w-md font-medium">Просто выбери те пункты, которые относятся к твоему образу жизни и здоровью — ничего лишнего.</p>
          </div>

          {/* Популярные элементы (mobile & desktop) */}
          <div className="mb-5">
            <h3 className="text-sm uppercase tracking-wide text-emerald-300/80 font-semibold mb-2 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Популярные
              <span className="text-[11px] text-gray-400">(быстрый выбор)</span>
            </h3>
            <div className="flex flex-wrap gap-2">
      {unifiedItems.filter(i => i.popular && (i.category !== 'allergens' || showAllergens)).map(item => {
                const selected = isSelected(item);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleUnified(item)}
  className={`px-3 py-2 rounded-full text-[12px] font-medium border transition focus:outline-none focus:ring-2 focus:ring-emerald-500/60 flex items-center gap-1 ${categoryStyle(item.category, selected)}`}
        data-pressed={selected}
                  >
                    <span>{item.name}</span>
                  </button>
                );
              })}
              {!showAll && (
                <button
                  onClick={() => setShowAll(true)}
                    className="px-3 py-2 rounded-full text-[12px] font-medium border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-500">
                  Показать остальные…
                </button>
              )}
            </div>
          </div>

          {/* Desktop layout */}
          {!isMobile && (
            <div className="hidden sm:block">
              {(
                <div className="flex gap-6">
      <div className="w-48 flex-shrink-0" aria-label="Категории">
                    {(['conditions','restrictions', showAllergens ? 'allergens' : null] as const).filter(Boolean).map(cat => (
                      <button
                        key={cat as string}
        data-selected={activeTab === cat}
                        onClick={() => { setActiveTab(cat as any); setFocusIndex(-1); }}
                        className={`w-full text-left px-4 py-2.5 mb-3 rounded-lg text-base border transition ${activeTab === cat ? 'bg-emerald-600/25 border-emerald-400 text-emerald-200' : 'bg-gray-700/40 border-gray-600 text-gray-300 hover:border-gray-500'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{cat === 'conditions' ? 'Состояния' : cat === 'restrictions' ? 'Ограничения' : 'Аллергены'}</span>
                          <span className="text-[10px] px-1.5 rounded bg-gray-600/70">{categoryCounts[cat as keyof typeof categoryCounts]}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="flex-1">
                    {activeTab === 'allergens' && (
                      <div className="mb-4 flex flex-wrap gap-2 text-[11px]">
                        <button onClick={() => setAllergenGroupFilter('all')} className={`px-2 py-1 rounded-md border ${allergenGroupFilter==='all' ? 'bg-rose-600/30 border-rose-400 text-rose-100' : 'bg-gray-700/40 border-gray-600 text-gray-300'}`}>Все группы</button>
                        {allergenGroupOrder.map(gr => (
                          <button key={gr} onClick={() => setAllergenGroupFilter(gr.toLowerCase())} className={`px-2 py-1 rounded-md border ${allergenGroupFilter===gr.toLowerCase() ? 'bg-rose-600/30 border-rose-400 text-rose-100' : 'bg-gray-700/40 border-gray-600 text-gray-300 hover:border-gray-500'}`}>{gr}</button>
                        ))}
                      </div>
                    )}
                    <div
                      onKeyDown={handleKeyDown}
                      className="grid gap-3 grid-cols-2 lg:grid-cols-3"
                    >
          {visibleCurrentList.map((item, idx) => {
                        const selected = isSelected(item);
                        const focused = idx === focusIndex;
                        return (
                          <button
                            key={item.id}
                            data-selected={selected}
                            tabIndex={focused ? 0 : -1}
                            onClick={() => toggleUnified(item)}
                            onFocus={() => setFocusIndex(idx)}
            className={`relative p-4 rounded-xl border-2 text-left transition group focus:outline-none focus:ring-2 focus:ring-emerald-500/60 ${categoryStyle(item.category, selected)}`}
                          >
                            <div className="font-semibold text-white text-sm mb-1.5 flex items-center gap-1">
                              {item.name}
                              {item.popular && <span className="text-[9px] text-emerald-300/80">★</span>}
                            </div>
                            <div className="text-[11px] leading-snug text-gray-400 line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
                              {item.description}
                            </div>
                            <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border-2 transition ${selected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-400'}`}></div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Detail panel */}
                  <div className="w-64 flex-shrink-0 bg-gray-700/30 rounded-xl p-4 border border-gray-600/50">
                    <h4 className="text-base font-semibold mb-3">Описание</h4>
                    {focusIndex >= 0 && visibleCurrentList[focusIndex] ? (
                      <div className="text-sm text-gray-300 space-y-2">
                        <div className="font-medium text-emerald-300 flex items-center gap-1 text-base">{visibleCurrentList[focusIndex].name}{visibleCurrentList[focusIndex].popular && <span className="text-[11px]">★</span>}</div>
                        <p className="leading-snug text-gray-400 text-[0.95rem]">{visibleCurrentList[focusIndex].description}</p>
                        <p className="text-[11px] text-gray-500">Нажмите Enter / Space чтобы {isSelected(visibleCurrentList[focusIndex]) ? 'снять выбор' : 'выбрать'}.</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Выберите элемент, чтобы увидеть детали.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile layout */}
          {isMobile && (
            <div onKeyDown={handleKeyDown} className="sm:hidden">
              <div className="flex gap-1 mb-4 text-[11px] font-medium">
                {['all','conditions','restrictions', showAllergens ? 'allergens' : null].filter(Boolean).map(cat => (
                  <button
                    key={cat as string}
                    onClick={() => setMobileFilter(cat as any)}
                    className={`px-2 py-1 rounded-md border transition ${mobileFilter === cat ? 'bg-emerald-600/30 border-emerald-400 text-emerald-100' : 'bg-gray-700/40 border-gray-600 text-gray-300'}`}
                  >{cat === 'all' ? 'Все' : cat === 'conditions' ? 'Сост.' : cat === 'restrictions' ? 'Диеты' : 'Аллерг.'}</button>
                ))}
              </div>
              {mobileFilter === 'allergens' && (
                <div className="flex gap-1 mb-4 text-[10px] font-medium flex-wrap">
                  <button onClick={() => setAllergenGroupFilter('all')} className={`px-2 py-1 rounded-md border ${allergenGroupFilter==='all' ? 'bg-rose-600/30 border-rose-400 text-rose-100' : 'bg-gray-700/40 border-gray-600 text-gray-300'}`}>Все группы</button>
                  {allergenGroupOrder.map(gr => (
                    <button key={gr} onClick={() => setAllergenGroupFilter(gr.toLowerCase())} className={`px-2 py-1 rounded-md border ${allergenGroupFilter===gr.toLowerCase() ? 'bg-rose-600/30 border-rose-400 text-rose-100' : 'bg-gray-700/40 border-gray-600 text-gray-300'}`}>{gr}</button>
                  ))}
                </div>
              )}
              {/* Компактная сетка 2x для экономии места */}
              <div className="health-items-grid">
                {visibleCurrentList.map((item, idx) => {
                  const selected = isSelected(item);
                  return (
                    <button
                      key={item.id}
                      data-selected={selected}
                      onClick={() => toggleUnified(item)}
                      onFocus={() => setFocusIndex(idx)}
                      className={`relative flex flex-col items-start justify-center min-h-[70px] px-2.5 py-2 rounded-lg border text-left transition text-[13px] leading-tight ${categoryStyle(item.category, selected)}`}
                    >
                      <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold tracking-wide text-gray-300/80">
                        <span className="px-1.5 py-[2px] rounded bg-black/30 border border-white/10 backdrop-blur-[2px]">
                          {item.category === 'conditions' ? 'СОСТ' : item.category === 'restrictions' ? 'ДИЕТА' : 'АЛЛЕРГ'}
                        </span>
                        {item.popular && <span className="text-emerald-300/80 text-[10px]">★</span>}
                      </div>
                      <div className="font-semibold text-white text-[13px] break-words">
                        {item.name}
                      </div>
                      {selected && (
                        <div className="mt-1 text-[11px] text-gray-300 leading-snug line-clamp-3">
                          {item.description}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {showAll && (
                <div className="mt-5 text-[11px] text-gray-500 text-center">Прокрутите для просмотра всех вариантов</div>
              )}
            </div>
          )}

          {/* Summary selections */}
          <div className="mt-6 border-t border-gray-700/60 pt-4">
            <h4 className="text-sm uppercase tracking-wide text-gray-400 mb-3">Ваш выбор</h4>
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {[...selectedConditions, ...selectedRestrictions, ...selectedAllergens].length === 0 && (
                <span className="text-[12px] text-gray-500">ничего не выбрано</span>
              )}
              {selectedConditions.map(id => {
                const item = unifiedItems.find(i => i.id === id);
                if (!item) return null;
                return <span key={id} className="px-2.5 py-1.5 rounded-md bg-emerald-600/25 border border-emerald-500/50 text-[12px]">{item.name}</span>;
              })}
              {selectedRestrictions.map(id => {
                const item = unifiedItems.find(i => i.id === id);
                if (!item) return null;
                return <span key={id} className="px-2.5 py-1.5 rounded-md bg-teal-600/20 border border-teal-500/40 text-[12px]">{item.name}</span>;
              })}
              {selectedAllergens.map(id => {
                const item = unifiedItems.find(i => i.id === id);
                if (!item) return null;
                return <span key={id} className="px-2.5 py-1.5 rounded-md bg-red-600/25 border border-red-500/50 text-[12px]">{item.name}</span>;
              })}
              {fastingRestrictionSelected && (
                <span className={`px-2.5 py-1.5 rounded-md text-[12px] border ${fastingValid ? 'bg-indigo-600/30 border-indigo-400 text-indigo-100' : 'bg-orange-700/30 border-orange-400 text-orange-100'}`}>Окно: {fastingStart}:00–{fastingEnd}:00 (пост {fastingHours}ч)</span>
              )}
            </div>
            {fastingRestrictionSelected && (
              <div className="mt-5 bg-gray-700/40 border border-gray-600 rounded-2xl px-5 pt-5 pb-6">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-semibold tracking-wide text-indigo-300">Интервальное голодание</h5>
                  <span className="text-[11px] text-gray-400">Минимум 8ч поста</span>
                </div>
                <p className="text-[11px] text-gray-400 mb-5 leading-snug">Выберите часы (0–23), в течение которых вы планируете принимать пищу. Остальное время считается периодом голодания.</p>
                <div className="flex flex-col gap-5">
                  <FastingRange
                    startHour={fastingStart}
                    endHour={fastingEnd}
                    onChange={(s,e)=>{ setFastingStart(s); setFastingEnd(e); }}
                  />
                  {/* Убраны поля ручного ввода для минимализма */}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={onBack}
        className="sm:flex-1 py-3.5 px-5 bg-gray-700 active:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300 text-base"
            >
              Назад
            </button>
            <button
              onClick={handleShowModal}
              disabled={fastingRestrictionSelected && !fastingValid}
        className="sm:flex-1 py-3.5 px-5 font-semibold rounded-xl transition-all duration-300 text-base bg-gradient-to-r from-emerald-500 to-teal-500 active:from-emerald-600 active:to-teal-600 text-white shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
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
                  className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 text-sm active:bg-gray-300"
                >
                  Вернуться
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl transition-all duration-300 text-sm active:from-emerald-600 active:to-teal-600"
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