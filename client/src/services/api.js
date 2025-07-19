import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  telegramLogin: async (initData) => {
    const response = await api.post('/auth/telegram', { initData });
    return response.data;
  },
  
  verify: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },
};

// Food API
export const foodAPI = {
  recognize: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await api.post('/food/recognize', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  search: async (query) => {
    const response = await api.get('/food/search', { params: { q: query } });
    return response.data;
  },
  
  getPopular: async () => {
    const response = await api.get('/food/popular');
    return response.data;
  },
};

// Meals API
export const mealsAPI = {
  addMeal: async (mealData) => {
    const response = await api.post('/meals', mealData);
    return response.data;
  },
  
  getTodayMeals: async () => {
    const response = await api.get('/meals/today');
    return response.data;
  },
  
  getHistory: async (days = 7) => {
    const response = await api.get('/meals/history', { params: { days } });
    return response.data;
  },
  
  deleteMeal: async (mealId) => {
    const response = await api.delete(`/meals/${mealId}`);
    return response.data;
  },
};

// Stats API
export const statsAPI = {
  getDaily: async (date) => {
    const response = await api.get('/stats/daily', { params: { date } });
    return response.data;
  },
  
  getWeekly: async (weeks = 4) => {
    const response = await api.get('/stats/weekly', { params: { weeks } });
    return response.data;
  },
  
  getAchievements: async () => {
    const response = await api.get('/stats/achievements');
    return response.data;
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },
  
  updateProfile: async (profileData) => {
    const response = await api.put('/user/profile', profileData);
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/user/stats');
    return response.data;
  },
};

export default api;