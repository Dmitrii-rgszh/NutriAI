import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAppStore from './stores/useAppStore';
import './App.css';

// Pages (создадим их следующими)
import Dashboard from './pages/Dashboard';
import Camera from './pages/Camera';
import FoodDiary from './pages/FoodDiary';
import Profile from './pages/Profile';
import Stats from './pages/Stats';
import Login from './pages/Login';

// Components
import Navigation from './components/UI/Navigation';
import LoadingScreen from './components/UI/LoadingScreen';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAppStore();
  
  useEffect(() => {
    // Check authentication on app start
    checkAuth();
    
    // Initialize Telegram Web App if available
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      // Get init data for authentication
      const initData = tg.initData;
      if (initData && !isAuthenticated) {
        // Auto-login with Telegram data
        useAppStore.getState().login({ initData, user: tg.initDataUnsafe?.user });
      }
    }
  }, []);
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="app">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/" /> : <Login />
            } />
            
            {/* Protected routes */}
            <Route path="/" element={
              isAuthenticated ? (
                <>
                  <Navigation />
                  <Dashboard />
                </>
              ) : (
                <Navigate to="/login" />
              )
            } />
            
            <Route path="/camera" element={
              isAuthenticated ? (
                <>
                  <Navigation />
                  <Camera />
                </>
              ) : (
                <Navigate to="/login" />
              )
            } />
            
            <Route path="/diary" element={
              isAuthenticated ? (
                <>
                  <Navigation />
                  <FoodDiary />
                </>
              ) : (
                <Navigate to="/login" />
              )
            } />
            
            <Route path="/profile" element={
              isAuthenticated ? (
                <>
                  <Navigation />
                  <Profile />
                </>
              ) : (
                <Navigate to="/login" />
              )
            } />
            
            <Route path="/stats" element={
              isAuthenticated ? (
                <>
                  <Navigation />
                  <Stats />
                </>
              ) : (
                <Navigate to="/login" />
              )
            } />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;