import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-logo">
          <span className="logo-emoji">🥗</span>
          <h1>NutriAI</h1>
        </div>
        <div className="loading-spinner"></div>
        <p className="loading-text">Загрузка приложения...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;