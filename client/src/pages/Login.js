import React, { useEffect, useState } from 'react';
import { MessageCircle, Camera, BarChart3, Target, Sparkles } from 'lucide-react';
import './Login.css';

const Login = () => {
  const botUsername = process.env.REACT_APP_TELEGRAM_BOT_NAME || 'nutriai_bot';
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="animated-bg">
        <div className="gradient-orb gradient-orb-1"></div>
        <div className="gradient-orb gradient-orb-2"></div>
        <div className="gradient-orb gradient-orb-3"></div>
      </div>
      
      <div className="login-container">
        <div className="login-card">
          {/* Logo section with animation */}
          <div className="logo-section">
            <div className="logo-wrapper">
              <span className="logo-emoji">🥗</span>
              <div className="logo-glow"></div>
            </div>
            <h1 className="logo-text">
              Nutri<span className="logo-ai">AI</span>
            </h1>
            <p className="tagline">Умный подсчет калорий с AI</p>
          </div>
          
          {/* Main content */}
          <div className="login-content">
            <h2 className="welcome-title">Добро пожаловать!</h2>
            <p className="welcome-subtitle">
              Для использования приложения откройте его через Telegram Mini App
            </p>
            
            {/* Features with glassmorphism */}
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <Camera size={24} />
                </div>
                <div className="feature-content">
                  <h4>AI распознавание еды</h4>
                  <p>Мгновенный анализ</p>
                </div>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <BarChart3 size={24} />
                </div>
                <div className="feature-content">
                  <h4>Точный подсчет КБЖУ</h4>
                  <p>Детальная статистика</p>
                </div>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <Target size={24} />
                </div>
                <div className="feature-content">
                  <h4>Личные цели питания</h4>
                  <p>Индивидуальный план</p>
                </div>
              </div>
            </div>
            
            {/* CTA Button */}
            <a 
              href={`https://t.me/${botUsername}`}
              className="telegram-button"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={20} />
              <span>Открыть в Telegram</span>
              <Sparkles size={16} className="button-sparkle" />
            </a>
            
            <p className="security-note">
              Приложение работает только через Telegram для безопасной авторизации
            </p>
          </div>
        </div>
        
        {/* Developer info */}
        <div className="dev-info">
          <p>Для разработки используйте:</p>
          <code className="dev-command">ngrok http 3000</code>
        </div>
      </div>
      
      {/* Floating particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`}></div>
        ))}
      </div>
    </div>
  );
};

export default Login;