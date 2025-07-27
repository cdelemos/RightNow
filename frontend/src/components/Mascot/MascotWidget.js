import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const MascotWidget = ({ position = 'bottom-left', size = 'medium' }) => {
  const { user } = useAuth();
  const [mascotState, setMascotState] = useState({
    isVisible: true,
    message: '',
    mood: 'protective',
    appearance: {
      emoji: '🔨',
      expression: '🛡️',
      color: '#2B4C7E',
      animation: 'steady'
    },
    isAnimating: false,
    showMessage: false,
    lastInteraction: null
  });

  const [settings, setSettings] = useState({
    mascot_enabled: true,
    show_daily_tips: true,
    show_achievements: true,
    show_streaks: true,
    show_encouragement: true,
    notification_frequency: 'normal'
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  useEffect(() => {
    if (user && settings.mascot_enabled) {
      loadMascotSettings();
      loadMascotGreeting();
    }
  }, [user]);

  const loadMascotSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/mascot/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load mascot settings:', error);
    }
  };

  const loadMascotGreeting = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/mascot/greeting`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const greeting = response.data.data;
        setMascotState(prev => ({
          ...prev,
          message: greeting.message,
          mood: greeting.mood,
          appearance: greeting.appearance,
          showMessage: true,
          lastInteraction: greeting
        }));
        
        // Auto-hide message after 10 seconds
        setTimeout(() => {
          setMascotState(prev => ({ ...prev, showMessage: false }));
        }, 10000);
      }
    } catch (error) {
      console.error('Failed to load mascot greeting:', error);
    }
  };

  const getStudyTip = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/mascot/study-tip`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const tip = response.data.data;
        setMascotState(prev => ({
          ...prev,
          message: tip.message,
          mood: tip.mood,
          appearance: tip.appearance,
          showMessage: true,
          lastInteraction: tip
        }));
        
        // Auto-hide message after 15 seconds
        setTimeout(() => {
          setMascotState(prev => ({ ...prev, showMessage: false }));
        }, 15000);
      }
    } catch (error) {
      console.error('Failed to get study tip:', error);
    }
  };

  const triggerCelebration = async (achievementType, context = {}) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/mascot/celebrate`, {
        type: achievementType,
        ...context
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const celebration = response.data.data;
        setMascotState(prev => ({
          ...prev,
          message: celebration.message,
          mood: celebration.mood,
          appearance: celebration.appearance,
          showMessage: true,
          isAnimating: true,
          lastInteraction: celebration
        }));
        
        // Stop animation after 3 seconds
        setTimeout(() => {
          setMascotState(prev => ({ ...prev, isAnimating: false }));
        }, 3000);
        
        // Auto-hide message after 12 seconds
        setTimeout(() => {
          setMascotState(prev => ({ ...prev, showMessage: false }));
        }, 12000);
      }
    } catch (error) {
      console.error('Failed to trigger celebration:', error);
    }
  };

  const handleMascotClick = () => {
    if (mascotState.showMessage) {
      // Hide message if showing
      setMascotState(prev => ({ ...prev, showMessage: false }));
    } else {
      // Show random study tip
      getStudyTip();
    }
  };

  const positionClasses = {
    'bottom-left': 'fixed bottom-6 left-6 z-40',
    'bottom-right': 'fixed bottom-6 right-6 z-40',
    'top-left': 'fixed top-20 left-6 z-40',
    'top-right': 'fixed top-20 right-6 z-40'
  };

  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-20 h-20'
  };

  const getAnimationClass = () => {
    if (mascotState.isAnimating) {
      switch (mascotState.appearance.animation) {
        case 'steady': return 'animate-none';
        case 'focus': return 'animate-pulse';
        case 'strength': return 'animate-bounce';
        case 'alert': return 'animate-pulse';
        case 'urgent': return 'animate-bounce';
        default: return 'animate-pulse';
      }
    }
    return '';
  };

  // Make available globally for other components to trigger celebrations
  window.mascotWidget = {
    triggerCelebration,
    getStudyTip,
    loadMascotGreeting
  };

  if (!user || !settings.mascot_enabled || !mascotState.isVisible) {
    return null;
  }

  return (
    <div className={`${positionClasses[position]} flex flex-col items-center`}>
      {/* Message Bubble */}
      {mascotState.showMessage && mascotState.message && (
        <div className="mb-4 max-w-xs">
          <div className="bg-white rounded-lg shadow-lg p-4 relative">
            <div className="text-sm text-gray-800 leading-relaxed">
              {mascotState.message}
            </div>
            
            {/* Speech bubble tail */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
            </div>
            
            {/* Close button */}
            <button
              onClick={() => setMascotState(prev => ({ ...prev, showMessage: false }))}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-sm"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Mascot */}
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-sage-100 to-sage-200 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 flex items-center justify-center relative ${getAnimationClass()}`}
        onClick={handleMascotClick}
        style={{ 
          backgroundColor: mascotState.appearance.color,
          borderColor: mascotState.appearance.color
        }}
      >
        <div className="text-3xl relative">
          {mascotState.appearance.emoji}
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
            {mascotState.appearance.expression}
          </div>
        </div>
        
        {/* Mood indicator */}
        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${
          mascotState.mood === 'protective' ? 'bg-blue-500' :
          mascotState.mood === 'clear' ? 'bg-cyan-400' :
          mascotState.mood === 'empowering' ? 'bg-green-500' :
          mascotState.mood === 'serious' ? 'bg-red-500' :
          mascotState.mood === 'focused' ? 'bg-purple-500' :
          mascotState.mood === 'alert' ? 'bg-orange-500' :
          mascotState.mood === 'supportive' ? 'bg-teal-500' :
          mascotState.mood === 'vigilant' ? 'bg-brown-500' :
          'bg-gray-400'
        }`}></div>
        
        {/* Pulse ring for notifications */}
        {mascotState.isAnimating && (
          <div className="absolute inset-0 rounded-full animate-ping bg-yellow-400 opacity-30"></div>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="mt-2 flex space-x-1">
        <button
          onClick={getStudyTip}
          className="bg-sage-600 hover:bg-sage-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs transition-colors"
          title="Get Study Tip"
        >
          💡
        </button>
        <button
          onClick={loadMascotGreeting}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs transition-colors"
          title="Say Hello"
        >
          👋
        </button>
      </div>
    </div>
  );
};

export default MascotWidget;