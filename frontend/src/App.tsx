import { useState, useEffect } from 'react'
import OnboardingIntro from './components/OnboardingIntro'
import PersonalDataStep from './components/PersonalDataStep'
import GoalStep from './components/GoalStep'
import ActivityStep from './components/ActivityStep'
import HealthStep from './components/HealthStep'
import EmptyState from './components/EmptyState'
import BottomNavigation from './components/BottomNavigation'
import HomeTab from './components/HomeTab'
import CameraTab from './components/CameraTab'
import AnalyticsTab from './components/AnalyticsTab'
import ProgressTab from './components/ProgressTab'
import ProfileTab from './components/ProfileTab'

// Типы для онбординга
type AppScreen = 'welcome' | 'intro' | 'onboarding' | 'dashboard'
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
  const [hasProfile, setHasProfile] = useState(false)
  const [activeTab, setActiveTab] = useState('home')

  useEffect(() => {
    console.log('App: Starting initialization...')
    setIsLoaded(true)
    // Проверяем, есть ли сохраненный профиль
    const savedProfile = localStorage.getItem('userProfile')
    console.log('App: Saved profile in localStorage:', savedProfile)
    
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile)
        console.log('App: Parsed profile:', profile)
        
        // Проверяем, что профиль полностью заполнен
        const isComplete = profile && 
          profile.gender && 
          profile.age && 
          profile.height && 
          profile.weight && 
          profile.goal &&
          profile.activityLevel &&
          profile.healthConditions &&
          profile.dietaryRestrictions
        
        console.log('App: Profile is complete:', isComplete)
        
        if (isComplete) {
          setUserProfile(profile)
          setHasProfile(true)
          setCurrentScreen('dashboard')
          console.log('App: Redirecting to dashboard')
        } else {
          // Если профиль неполный, очищаем localStorage
          console.log('App: Profile incomplete, clearing localStorage')
          localStorage.removeItem('userProfile')
          setCurrentScreen('welcome')
        }
      } catch (e) {
        console.error('App: Error loading saved profile:', e)
        localStorage.removeItem('userProfile')
        setCurrentScreen('welcome')
      }
    } else {
      console.log('App: No saved profile, showing welcome screen')
      setCurrentScreen('welcome')
    }
  }, [])

  const startOnboardingIntro = () => {
    setCurrentScreen('intro')
  }

  const startOnboarding = () => {
    setCurrentScreen('onboarding')
    setOnboardingStep('personal')
  }

  const skipOnboarding = () => {
    setCurrentScreen('dashboard')
  }

  const handleOnboardingComplete = () => {
    setHasProfile(true)
    setCurrentScreen('dashboard')
    // Сохраняем профиль в localStorage
    localStorage.setItem('userProfile', JSON.stringify(userProfile))
  }

  const handleResetProfile = () => {
    setUserProfile({})
    setHasProfile(false)
    setCurrentScreen('welcome')
    setActiveTab('home')
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

  // Экран знакомства с онбордингом
  if (currentScreen === 'intro') {
    return (
      <OnboardingIntro
        onStartOnboarding={startOnboarding}
        onSkipOnboarding={skipOnboarding}
      />
    )
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
            onNext={(data) => {
              setUserProfile(prev => ({
                ...prev,
                goal: data.goalType,
                targetWeight: data.targetWeight
              }))
              setOnboardingStep('activity')
            }}
            onBack={goBackToPersonal}
            currentWeight={userProfile.weight || 70}
          />
        )
      case 'activity':
        return (
          <ActivityStep
            profile={userProfile}
            onUpdate={(profile) => {
              setUserProfile(profile)
              setOnboardingStep('health')
            }}
            onNext={() => setOnboardingStep('health')}
            onBack={goBackToGoal}
          />
        )
      case 'health':
        return (
          <HealthStep
            profile={userProfile}
            onUpdate={(profile) => {
              setUserProfile(profile)
              setOnboardingStep('complete')
            }}
            onComplete={handleOnboardingComplete}
            onBack={goBackToActivity}
          />
        )
      case 'complete':
        return (
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 text-white flex items-center justify-center p-2 relative overflow-hidden">
            {/* Анимированные частицы */}
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-emerald-400/30 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 4}s`,
                  animationDuration: `${4 + Math.random() * 2}s`
                }}
              />
            ))}
            
            <div className="text-center relative z-10 bg-gray-800/50 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700/50 p-6 max-w-xs mx-auto">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-3">
                Профиль создан!
              </h2>
              <p className="text-gray-300 mb-6 leading-relaxed text-sm">
                Теперь вы получите персональные рекомендации по питанию
              </p>
              <button
                onClick={handleOnboardingComplete}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl
                         active:from-emerald-600 active:to-teal-600 transition-all duration-200 active:scale-95 
                         shadow-lg"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>🚀</span>
                  <span className="text-sm">Перейти к приложению</span>
                </span>
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
    // Если профиль не заполнен, показываем экран с предложением заполнить
    if (!hasProfile || Object.keys(userProfile).length === 0) {
      return (
        <EmptyState
          onStartOnboarding={startOnboardingIntro}
        />
      )
    }

    const renderTabContent = () => {
      switch (activeTab) {
        case 'home':
          return <HomeTab userProfile={userProfile} />
        case 'camera':
          return <CameraTab userProfile={userProfile} />
        case 'analytics':
          return <AnalyticsTab userProfile={userProfile} />
        case 'progress':
          return <ProgressTab userProfile={userProfile} />
        case 'profile':
          return <ProfileTab 
            userProfile={userProfile} 
            onStartOnboarding={startOnboardingIntro}
            onResetProfile={handleResetProfile}
          />
        default:
          return <HomeTab userProfile={userProfile} />
      }
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 text-white relative overflow-hidden">
        {/* Анимированные частицы на главном экране */}
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-emerald-400/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${4 + Math.random() * 2}s`
            }}
          />
        ))}
        
        <div className="relative z-10 min-h-screen pb-16">
          <div className="pt-4 px-3">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                NutriAI
              </h1>
              <div className="text-xs text-gray-400">
                {new Date().toLocaleDateString('ru-RU', { 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short' 
                })}
              </div>
            </div>
          </div>
          
          {/* Контент вкладки */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            {renderTabContent()}
          </div>
        </div>

        {/* Нижняя навигация */}
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative overflow-hidden">
      {/* Упрощенные анимированные элементы фона для мобильных */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-600/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-600/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Упрощенные частицы */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-cyan-400/40 rounded-full animate-ping" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400/50 rounded-full animate-ping" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
          <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-emerald-400/45 rounded-full animate-ping" style={{ animationDelay: '2s', animationDuration: '3.5s' }}></div>
          <div className="absolute top-1/6 right-1/3 w-1 h-1 bg-pink-400/40 rounded-full animate-ping" style={{ animationDelay: '0.5s', animationDuration: '2.8s' }}></div>
        </div>
      </div>

      <div className={`relative z-10 min-h-screen flex flex-col items-center justify-center p-3 pt-4 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Logo section - компактная версия для мобильных */}
        <div className="text-center mb-6">
          <div className="mb-4 relative">
            {/* Main logo - уменьшен для мобильных */}
            <div className="relative w-16 h-16 mx-auto mb-3">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-xl transform rotate-6 animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-xl">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.54 0 3-.35 4.29-.99.36-.18.49-.63.31-.99-.18-.36-.63-.49-.99-.31C14.74 20.35 13.42 20 12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8c0 1.42-.35 2.74-.99 3.71-.18.36-.05.81.31.99.36.18.81.05.99-.31C21.65 15 22 13.54 22 12c0-5.52-4.48-10-10-10zm0 6c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                </svg>
              </div>
              {/* Маленькие частицы */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
              <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>
          
          <h1 className="text-2xl font-black mb-2 tracking-tight">
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Nutri
            </span>
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
              AI
            </span>
          </h1>
          
          <p className="text-sm text-gray-300 font-light mb-1 max-w-xs mx-auto leading-relaxed">
            Революционный подход к учету питания
          </p>
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
            Powered by AI
          </p>
        </div>

        {/* Features grid - компактная сетка для мобильных */}
        <div className="grid grid-cols-1 gap-3 mb-6 max-w-xs w-full">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 active:bg-white/10 transition-all duration-200 active:scale-95">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-md flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-xs mb-1">Фото → Анализ</h3>
                <p className="text-gray-400 text-xs leading-tight">Мгновенное распознавание блюд</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 active:bg-white/10 transition-all duration-200 active:scale-95">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-xs mb-1">Умные цели</h3>
                <p className="text-gray-400 text-xs leading-tight">Персональные рекомендации</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 active:bg-white/10 transition-all duration-200 active:scale-95">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-md flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-xs mb-1">ИИ-прогнозы</h3>
                <p className="text-gray-400 text-xs leading-tight">Прогнозирование достижения целей</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA section - компактная версия */}
        <div className="w-full max-w-xs space-y-2">
          <button
            onClick={startOnboardingIntro}
            className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 active:from-emerald-600 active:via-teal-600 active:to-cyan-600 text-white font-bold py-3 px-4 rounded-xl transform transition-all duration-200 active:scale-95 shadow-xl"
          >
            <span className="text-sm">Начать сейчас</span>
          </button>
          
          <div className="text-center space-y-1">
            <p className="text-gray-400 text-xs">
              <span className="inline-flex items-center">
                <svg className="w-3 h-3 text-green-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Бесплатно 3 анализа в день
              </span>
            </p>
            <p className="text-gray-500 text-xs">
              Никаких обязательств
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
