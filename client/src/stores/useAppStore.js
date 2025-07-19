import { create } from 'zustand';
import { authAPI, userAPI } from '../services/api';

const useAppStore = create((set, get) => ({
  // User state
  user: null,
  isAuthenticated: false,
  isLoading: true,
  
  // Nutrition profile
  nutritionProfile: null,
  
  // Daily stats
  todayStats: null,
  
  // UI state
  isMenuOpen: false,
  activeTab: 'dashboard',
  
  // Auth actions
  login: async (initData) => {
    try {
      set({ isLoading: true });
      const { user, token } = await authAPI.telegramLogin(initData);
      
      localStorage.setItem('token', token);
      set({ 
        user, 
        isAuthenticated: true,
        isLoading: false 
      });
      
      // Load user profile
      await get().loadUserProfile();
      
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ 
      user: null, 
      isAuthenticated: false,
      nutritionProfile: null,
      todayStats: null
    });
  },
  
  // Load user profile and nutrition settings
  loadUserProfile: async () => {
    try {
      const { user, nutrition_profile } = await userAPI.getProfile();
      set({ 
        user,
        nutritionProfile: nutrition_profile 
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  },
  
  // Update nutrition profile
  updateNutritionProfile: async (profileData) => {
    try {
      const { nutrition_profile } = await userAPI.updateProfile(profileData);
      set({ nutritionProfile: nutrition_profile });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Check auth status
  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    
    try {
      const { user } = await authAPI.verify();
      set({ 
        user, 
        isAuthenticated: true,
        isLoading: false 
      });
      
      // Load profile
      await get().loadUserProfile();
    } catch (error) {
      localStorage.removeItem('token');
      set({ 
        isAuthenticated: false,
        isLoading: false 
      });
    }
  },
  
  // UI actions
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  // Stats actions
  updateTodayStats: (stats) => set({ todayStats: stats }),
}));

export default useAppStore;