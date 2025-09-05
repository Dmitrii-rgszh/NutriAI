import { useState, useEffect } from 'react'
import PersonalDataStep from './components/PersonalDataStep'
import GoalStep from './components/GoalStep'
import ActivityStep from './components/ActivityStep'
import HealthStep from './components/HealthStep'

// Типы для онбординга
type AppScreen = 'welcome' | 'onboarding' | 'dashboard'
type OnboardingStep = 'personal' | 'goal' | 'activity' | 'health' | 'complete'

export interface UserProfile {
  // Личные данные
  gender?: 'male' | 'female' | 'other';
  age?: number;
  height?: number; // см
  weight?: number; // кг
  
  // Цели
  goal?: 'lose' | 'maintain' | 'gain';
  targetWeight?: number; // кг
  
  // Активность
  activityLevel?: string;
  activityMultiplier?: number;
  sleepHours?: number;
  
  // Здоровье
  healthConditions?: string[];
  dietaryRestrictions?: string[];
  allergens?: string[];
  waterIntake?: number;
}

function App() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('welcome')
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('personal')
  const [userProfile, setUserProfile] = useState<UserProfile>({})

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const startOnboarding = () => {
    setCurrentScreen('onboarding')
    setOnboardingStep('personal')
  }

  const handlePersonalData = (data: {
    gender: 'male' | 'female' | 'other'
    age: number
    height: number
    weight: number
  }) => {
    setUserProfile(prev => ({
      ...prev,
      gender: data.gender,
      age: data.age,
      height: data.height,
      weight: data.weight
    }))
    setOnboardingStep('goal')
  }

  const handleGoalData = (data: {
    goalType: 'lose' | 'maintain' | 'gain'
    targetWeight?: number
  }) => {
    setUserProfile(prev => ({
      ...prev,
      goal: data.goalType,
      targetWeight: data.targetWeight
    }))
    setOnboardingStep('activity')
  }

  const handleActivityData = (profile: UserProfile) => {
    setUserProfile(profile)
    setOnboardingStep('health')
  }

  const handleHealthData = (profile: UserProfile) => {
    setUserProfile(profile)
    setOnboardingStep('complete')
  }

  const handleOnboardingComplete = () => {
    setCurrentScreen('dashboard')
  }

  const goBackToPersonal = () => {
    setOnboardingStep('personal')
  }

  const goBackToGoal = () => {
    setOnboardingStep('goal')
  }

  const goBackToActivity = () => {
    setOnboardingStep('activity')
  }

  // Рендеринг онбординга
  if (currentScreen === 'onboarding') {
    switch (onboardingStep) {
      case 'personal':
        return (
          <PersonalDataStep 
            data={{
              gender: userProfile.gender || '',
              age: userProfile.age || 25,
              height: userProfile.height || 170,
              weight: userProfile.weight || 70
            }}
            onUpdate={(data) => setUserProfile(prev => ({ ...prev, ...data }))}
            onNext={() => setOnboardingStep('goal')}
          />
        )
      case 'goal':
        return (
          <GoalStep 
            onNext={handleGoalData}
            onBack={goBackToPersonal}
            currentWeight={userProfile.weight || 70}
          />
        )
      case 'activity':
        return (
          <ActivityStep
            profile={userProfile}
            onUpdate={handleActivityData}
            onNext={() => setOnboardingStep('health')}
            onBack={goBackToGoal}
          />
        )
      case 'health':
        return (
          <HealthStep
            profile={userProfile}
            onUpdate={handleHealthData}
            onComplete={handleOnboardingComplete}
            onBack={goBackToActivity}
          />
        )
      case 'complete':
        return (
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Профиль создан!</h2>
              <button
                onClick={handleOnboardingComplete}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl"
              >
                Перейти к приложению
              </button>
            </div>
          </div>
        )
      default:
        return <div>Шаг в разработке...</div>
    }
  }

  // Главный экран приложения
  if (currentScreen === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
        <h1 className="text-2xl font-bold mb-4">Добро пожаловать в NutriAI!</h1>
        <div className="bg-gray-800/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-2">Ваш профиль:</h2>
          <pre className="text-sm text-gray-300">{JSON.stringify(userProfile, null, 2)}</pre>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {/* Группа 1 - маленькие быстрые частицы */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400/40 rounded-full animate-ping" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400/50 rounded-full animate-ping" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
          <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-emerald-400/45 rounded-full animate-ping" style={{ animationDelay: '2s', animationDuration: '3.5s' }}></div>
          <div className="absolute top-1/6 right-1/3 w-1 h-1 bg-pink-400/40 rounded-full animate-ping" style={{ animationDelay: '0.5s', animationDuration: '2.8s' }}></div>
          <div className="absolute bottom-1/4 left-1/6 w-2 h-2 bg-blue-400/35 rounded-full animate-ping" style={{ animationDelay: '1.5s', animationDuration: '4.2s' }}></div>
          
          {/* Группа 2 - медленные мерцающие частицы */}
          <div className="absolute top-1/3 right-1/5 w-1 h-1 bg-yellow-400/60 rounded-full animate-pulse" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
          <div className="absolute bottom-1/3 right-2/3 w-1.5 h-1.5 bg-teal-400/50 rounded-full animate-pulse" style={{ animationDelay: '1s', animationDuration: '2.5s' }}></div>
          <div className="absolute top-2/3 left-1/5 w-1 h-1 bg-indigo-400/45 rounded-full animate-pulse" style={{ animationDelay: '2s', animationDuration: '3s' }}></div>
          <div className="absolute top-1/5 left-2/3 w-2 h-2 bg-green-400/40 rounded-full animate-pulse" style={{ animationDelay: '0.8s', animationDuration: '2.8s' }}></div>
          
          {/* Группа 3 - плавающие частицы */}
          <div className="absolute top-1/2 right-1/6 w-1 h-1 bg-rose-400/50 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '6s' }}></div>
          <div className="absolute bottom-1/5 left-1/3 w-1.5 h-1.5 bg-violet-400/45 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>
          <div className="absolute top-4/5 right-1/2 w-1 h-1 bg-orange-400/40 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '7s' }}></div>
          
          {/* Группа 4 - дополнительные мерцающие точки */}
          <div className="absolute top-1/8 left-1/2 w-0.5 h-0.5 bg-cyan-300/60 rounded-full animate-ping" style={{ animationDelay: '3s', animationDuration: '2s' }}></div>
          <div className="absolute bottom-1/8 right-1/4 w-0.5 h-0.5 bg-emerald-300/55 rounded-full animate-ping" style={{ animationDelay: '1.8s', animationDuration: '3.2s' }}></div>
          <div className="absolute top-3/5 left-1/8 w-1 h-1 bg-purple-300/45 rounded-full animate-ping" style={{ animationDelay: '2.5s', animationDuration: '2.7s' }}></div>
          <div className="absolute bottom-2/5 right-1/8 w-0.5 h-0.5 bg-pink-300/50 rounded-full animate-ping" style={{ animationDelay: '0.3s', animationDuration: '4s' }}></div>
          <div className="absolute top-7/8 left-3/4 w-1 h-1 bg-blue-300/40 rounded-full animate-ping" style={{ animationDelay: '2.8s', animationDuration: '3.5s' }}></div>
          
          {/* Группа 5 - очень тонкие мерцающие звездочки */}
          <div className="absolute top-2/5 right-3/4 w-0.5 h-0.5 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '4s', animationDuration: '1.5s' }}></div>
          <div className="absolute bottom-3/5 left-2/5 w-0.5 h-0.5 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '1.2s', animationDuration: '2.2s' }}></div>
          <div className="absolute top-1/7 right-2/5 w-0.5 h-0.5 bg-white/65 rounded-full animate-pulse" style={{ animationDelay: '3.5s', animationDuration: '1.8s' }}></div>
          
          {/* Группа 6 - плавающие частицы с кастомной анимацией */}
          <div className="absolute top-1/3 left-1/7 w-1 h-1 bg-cyan-400/50 rounded-full animate-float" style={{ animationDelay: '0s' }}></div>
          <div className="absolute bottom-1/4 right-1/7 w-1.5 h-1.5 bg-purple-400/40 rounded-full animate-drift" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-emerald-400/45 rounded-full animate-twinkle" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>

      <div className={`relative z-10 min-h-screen flex flex-col items-center justify-center p-4 pt-6 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top) + 0.5rem)' }}>
        {/* Logo section - компактнее для мобильных */}
        <div className="text-center mb-8">
          <div className="mb-6 relative">
            {/* Main logo - уменьшен размер */}
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl transform rotate-6 animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.54 0 3-.35 4.29-.99.36-.18.49-.63.31-.99-.18-.36-.63-.49-.99-.31C14.74 20.35 13.42 20 12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8c0 1.42-.35 2.74-.99 3.71-.18.36-.05.81.31.99.36.18.81.05.99-.31C21.65 15 22 13.54 22 12c0-5.52-4.48-10-10-10zm0 6c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                </svg>
              </div>
              {/* Floating particles - уменьшены */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>
          
          <h1 className="text-4xl font-black mb-3 tracking-tight">
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Nutri
            </span>
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
              AI
            </span>
          </h1>
          
          <p className="text-lg text-gray-300 font-light mb-2 max-w-xs mx-auto leading-relaxed">
            Революционный подход к учету питания
          </p>
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
            Powered by Artificial Intelligence
          </p>
        </div>

        {/* Features grid - компактнее */}
        <div className="grid grid-cols-1 gap-4 mb-8 max-w-sm w-full">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 active:bg-white/10 transition-all duration-200 active:scale-95">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-base mb-1">Фото → Анализ</h3>
                <p className="text-gray-400 text-sm leading-tight">Мгновенное распознавание блюд и точный расчет КБЖУ</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 active:bg-white/10 transition-all duration-200 active:scale-95">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-base mb-1">Умные цели</h3>
                <p className="text-gray-400 text-sm leading-tight">Персонализированные рекомендации на основе ваших данных</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 active:bg-white/10 transition-all duration-200 active:scale-95">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-base mb-1">Прогнозы</h3>
                <p className="text-gray-400 text-sm leading-tight">ИИ-прогнозирование веса и достижения целей</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA section - компактнее */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={startOnboarding}
            className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 active:from-emerald-600 active:via-teal-600 active:to-cyan-600 text-white font-bold py-4 px-6 rounded-xl transform transition-all duration-200 active:scale-95 shadow-xl"
          >
            <span className="text-base">Начать сейчас</span>
          </button>
          
          <div className="text-center space-y-1">
            <p className="text-gray-400 text-sm">
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 text-green-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Бесплатно 3 анализа в день
              </span>
            </p>
            <p className="text-gray-500 text-xs">
              Никаких обязательств • Отмена в любое время
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
