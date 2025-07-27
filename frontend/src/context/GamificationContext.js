import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const GamificationContext = createContext();

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

export const GamificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [gamificationData, setGamificationData] = useState({
    userStats: null,
    levelProgress: null,
    badges: [],
    achievements: [],
    streaks: [],
    recentXP: [],
    leaderboardPosition: null,
    loading: true,
    error: null
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  // Fetch gamification dashboard data
  const fetchGamificationData = async () => {
    if (!user) return;
    
    try {
      setGamificationData(prev => ({ ...prev, loading: true, error: null }));
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/gamification/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setGamificationData({
          userStats: response.data.data.user_stats,
          levelProgress: response.data.data.level_progress,
          badges: response.data.data.badges,
          achievements: response.data.data.achievements,
          streaks: response.data.data.streaks,
          recentXP: response.data.data.recent_xp,
          leaderboardPosition: response.data.data.leaderboard_position,
          loading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Failed to fetch gamification data:', error);
      setGamificationData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load gamification data'
      }));
    }
  };

  // Fetch leaderboard data
  const fetchLeaderboard = async (type = 'weekly_xp', limit = 50) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/gamification/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { leaderboard_type: type, limit }
      });
      
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      return null;
    }
  };

  // Fetch badges
  const fetchBadges = async (category = null, earnedOnly = false) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/gamification/badges`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { category, earned_only: earnedOnly }
      });
      
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Failed to fetch badges:', error);
      return null;
    }
  };

  // Fetch achievements
  const fetchAchievements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/gamification/achievements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
      return null;
    }
  };

  // Fetch streaks
  const fetchStreaks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/gamification/streaks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Failed to fetch streaks:', error);
      return null;
    }
  };

  // Fetch XP history
  const fetchXPHistory = async (days = 30) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/gamification/xp-history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { days }
      });
      
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Failed to fetch XP history:', error);
      return null;
    }
  };

  // Fetch user progress
  const fetchUserProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/gamification/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Failed to fetch user progress:', error);
      return null;
    }
  };

  // Refresh gamification data
  const refreshGamificationData = () => {
    fetchGamificationData();
  };

  // Show XP celebration
  const showXPCelebration = (xpAmount, action) => {
    // Create floating XP notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce';
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-xl">⭐</span>
        <span class="font-bold">+${xpAmount} XP</span>
      </div>
      <div class="text-sm opacity-90">${action.replace('_', ' ')}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  };

  // Show level up celebration
  const showLevelUpCelebration = (newLevel) => {
    // Create level up modal/notification
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-xl p-8 max-w-md mx-4 text-center">
        <div class="text-6xl mb-4">🎉</div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Level Up!</h2>
        <p class="text-lg text-gray-600 mb-4">You've reached level ${newLevel}!</p>
        <button class="bg-sage-600 hover:bg-sage-700 text-white px-6 py-2 rounded-lg font-medium" onclick="this.parentElement.parentElement.remove()">
          Awesome!
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 5000);
  };

  // Show badge earned celebration
  const showBadgeEarnedCelebration = (badge) => {
    // Create badge earned notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse';
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-xl">${badge.icon}</span>
        <div>
          <div class="font-bold">Badge Earned!</div>
          <div class="text-sm">${badge.name}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 4000);
  };

  // Format XP number
  const formatXP = (xp) => {
    if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}k`;
    }
    return xp.toString();
  };

  // Get level title
  const getLevelTitle = (level) => {
    if (level >= 50) return 'Legal Deity';
    if (level >= 40) return 'Supreme Jurist';
    if (level >= 30) return 'Legal Legend';
    if (level >= 25) return 'Justice Champion';
    if (level >= 20) return 'Legal Expert';
    if (level >= 15) return 'Rights Advocate';
    if (level >= 10) return 'Statute Master';
    if (level >= 5) return 'Legal Scholar';
    return 'Legal Novice';
  };

  // Get badge rarity color
  const getBadgeRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary': return 'text-purple-600 bg-purple-100';
      case 'epic': return 'text-blue-600 bg-blue-100';
      case 'rare': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Initialize gamification data when user logs in
  useEffect(() => {
    if (user) {
      fetchGamificationData();
    } else {
      setGamificationData({
        userStats: null,
        levelProgress: null,
        badges: [],
        achievements: [],
        streaks: [],
        recentXP: [],
        leaderboardPosition: null,
        loading: false,
        error: null
      });
    }
  }, [user]);

  const value = {
    ...gamificationData,
    fetchGamificationData,
    fetchLeaderboard,
    fetchBadges,
    fetchAchievements,
    fetchStreaks,
    fetchXPHistory,
    fetchUserProgress,
    refreshGamificationData,
    showXPCelebration,
    showLevelUpCelebration,
    showBadgeEarnedCelebration,
    formatXP,
    getLevelTitle,
    getBadgeRarityColor
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};