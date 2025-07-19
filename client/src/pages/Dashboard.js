import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Plus, TrendingUp, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import useAppStore from '../stores/useAppStore';
import { statsAPI, mealsAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user, nutritionProfile } = useAppStore();
  
  // Fetch today's stats
  const { data: dailyStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dailyStats', new Date().toISOString().split('T')[0]],
    queryFn: () => statsAPI.getDaily(),
  });
  
  // Fetch today's meals
  const { data: todayMeals, isLoading: mealsLoading } = useQuery({
    queryKey: ['todayMeals'],
    queryFn: () => mealsAPI.getTodayMeals(),
  });
  
  const stats = dailyStats?.stats || {
    calories: { consumed: 0, target: 2000, percentage: 0 },
    proteins: { consumed: 0, target: 150, percentage: 0 },
    fats: { consumed: 0, target: 65, percentage: 0 },
    carbs: { consumed: 0, target: 250, percentage: 0 },
  };
  
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="greeting">
          <h1>Привет, {user?.first_name}! 👋</h1>
          <p>{new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </header>
      
      <main className="dashboard-content">
        {/* Quick Actions */}
        <section className="quick-actions">
          <Link to="/camera" className="action-card primary">
            <Camera size={32} />
            <div>
              <h3>Сфотографировать еду</h3>
              <p>AI распознает и подсчитает калории</p>
            </div>
          </Link>
          
          <Link to="/diary" className="action-card secondary">
            <Plus size={32} />
            <div>
              <h3>Добавить вручную</h3>
              <p>Выберите из базы продуктов</p>
            </div>
          </Link>
        </section>
        
        {/* Today's Progress */}
        <section className="today-progress">
          <h2>Сегодняшний прогресс</h2>
          
          {statsLoading ? (
            <div className="loading">Загрузка...</div>
          ) : (
            <div className="progress-cards">
              {/* Calories Card */}
              <div className="progress-card calories">
                <div className="progress-header">
                  <span className="label">Калории</span>
                  <span className="percentage">{stats.calories.percentage}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${Math.min(stats.calories.percentage, 100)}%` }}
                  />
                </div>
                <div className="progress-values">
                  <span className="consumed">{stats.calories.consumed}</span>
                  <span className="separator">/</span>
                  <span className="target">{stats.calories.target} ккал</span>
                </div>
              </div>
              
              {/* Macros Grid */}
              <div className="macros-grid">
                {/* Proteins */}
                <div className="macro-card">
                  <div className="macro-icon proteins">Б</div>
                  <div className="macro-info">
                    <span className="macro-label">Белки</span>
                    <span className="macro-value">{stats.proteins.consumed}г</span>
                    <div className="macro-progress">
                      <div 
                        className="macro-progress-fill"
                        style={{ width: `${Math.min(stats.proteins.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Fats */}
                <div className="macro-card">
                  <div className="macro-icon fats">Ж</div>
                  <div className="macro-info">
                    <span className="macro-label">Жиры</span>
                    <span className="macro-value">{stats.fats.consumed}г</span>
                    <div className="macro-progress">
                      <div 
                        className="macro-progress-fill"
                        style={{ width: `${Math.min(stats.fats.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Carbs */}
                <div className="macro-card">
                  <div className="macro-icon carbs">У</div>
                  <div className="macro-info">
                    <span className="macro-label">Углеводы</span>
                    <span className="macro-value">{stats.carbs.consumed}г</span>
                    <div className="macro-progress">
                      <div 
                        className="macro-progress-fill"
                        style={{ width: `${Math.min(stats.carbs.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
        
        {/* Recent Meals */}
        <section className="recent-meals">
          <div className="section-header">
            <h2>Последние приемы пищи</h2>
            <Link to="/diary" className="see-all">Все →</Link>
          </div>
          
          {mealsLoading ? (
            <div className="loading">Загрузка...</div>
          ) : todayMeals?.meals?.length > 0 ? (
            <div className="meals-list">
              {todayMeals.meals.slice(0, 3).map((meal) => (
                <div key={meal.id} className="meal-item">
                  <div className="meal-time">
                    {new Date(meal.consumed_at).toLocaleTimeString('ru-RU', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  <div className="meal-info">
                    <h4>{getMealTypeName(meal.meal_type)}</h4>
                    <p>{meal.items.length} блюд</p>
                  </div>
                  <div className="meal-calories">
                    {meal.totals.calories} ккал
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Calendar size={48} />
              <p>Вы еще не добавили приемы пищи сегодня</p>
            </div>
          )}
        </section>
        
        {/* Tips */}
        {!nutritionProfile && (
          <section className="tips-card">
            <TrendingUp size={24} />
            <div>
              <h3>Настройте профиль питания</h3>
              <p>Укажите ваши параметры для точного расчета дневной нормы</p>
            </div>
            <Link to="/profile" className="tips-button">
              Настроить
            </Link>
          </section>
        )}
      </main>
    </div>
  );
};

// Helper function
const getMealTypeName = (type) => {
  const types = {
    breakfast: 'Завтрак',
    lunch: 'Обед',
    dinner: 'Ужин',
    snack: 'Перекус',
  };
  return types[type] || type;
};

export default Dashboard;