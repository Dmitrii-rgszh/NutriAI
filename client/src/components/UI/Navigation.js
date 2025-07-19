import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Camera, Book, User, BarChart3 } from 'lucide-react';
import './Navigation.css';

const Navigation = () => {
  const navItems = [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/camera', icon: Camera, label: 'Камера' },
    { path: '/diary', icon: Book, label: 'Дневник' },
    { path: '/stats', icon: BarChart3, label: 'Статистика' },
    { path: '/profile', icon: User, label: 'Профиль' },
  ];
  
  return (
    <nav className="navigation">
      <div className="nav-container">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={24} />
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;