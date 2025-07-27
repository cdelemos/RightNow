import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import Logo from './Logo';
import NotificationPanel from '../Notifications/NotificationPanel';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠', color: 'bg-sage-100 text-sage-700' },
    { name: 'Statute Lookup', href: '/statutes', icon: '📚', color: 'bg-blue-100 text-blue-700' },
    { name: 'Q&A Community', href: '/questions', icon: '💬', color: 'bg-purple-100 text-purple-700' },
    { name: 'Legal Myths', href: '/myths', icon: '🎯', color: 'bg-red-100 text-red-700' },
    { name: 'Simulations', href: '/simulations', icon: '🎮', color: 'bg-yellow-100 text-yellow-700' },
    { name: 'Learning Paths', href: '/learning-paths', icon: '🎓', color: 'bg-emerald-100 text-emerald-700' },
    { name: 'AI Assistant', href: '/ai-chat', icon: '🤖', color: 'bg-indigo-100 text-indigo-700' },
    { name: 'Emergency SOS', href: '/emergency-contacts', icon: '🚨', color: 'bg-red-100 text-red-700' },
    { name: 'Gamification', href: '/gamification', icon: '🎮', color: 'bg-purple-100 text-purple-700' },
  ];

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  const getXPProgress = () => {
    const nextLevelXP = user?.level * 100;
    const currentLevelXP = (user?.level - 1) * 100;
    const progress = ((user?.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  return (
    <nav className="bg-sage-600 shadow-sage-lg relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex-shrink-0">
              <Logo size="md" showText={true} className="text-white" />
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  location.pathname === item.href
                    ? 'bg-white/20 text-white shadow-sage backdrop-blur-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="mr-2 text-base">{item.icon}</span>
                <span className="hidden lg:inline">{item.name}</span>
              </Link>
            ))}
          </div>

          {/* User progress and menu */}
          <div className="flex items-center space-x-4">
            {/* User XP Progress */}
            <div className="hidden md:flex items-center space-x-3 bg-white/10 rounded-xl px-4 py-2 backdrop-blur-sm">
              <div className="text-right">
                <div className="text-white font-bold text-sm">{user?.username}</div>
                <div className="text-sage-100 text-xs">Level {user?.level}</div>
              </div>
              <div className="w-16">
                <div className="text-xs text-sage-100 mb-1">{user?.xp} XP</div>
                <div className="w-full bg-sage-800 rounded-full h-2">
                  <div 
                    className="bg-gold-400 h-2 rounded-full transition-all duration-500 shadow-sm" 
                    style={{ width: `${getXPProgress()}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Streak indicator */}
              <div className="flex items-center space-x-1 bg-gold-500 rounded-lg px-2 py-1">
                <span className="text-xs">🔥</span>
                <span className="text-white text-xs font-bold">{user?.streak_days || 0}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 backdrop-blur-sm shadow-sage"
            >
              Logout
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-xl text-white hover:bg-white/10 focus:outline-none transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-sage-700 shadow-sage-lg backdrop-blur-sm border-t border-sage-500 z-50">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Mobile user progress */}
            <div className="px-3 py-4 border-b border-sage-600 mb-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{user?.username}</div>
                  <div className="text-sage-200 text-sm">Level {user?.level} • {user?.xp} XP</div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="bg-gold-500 rounded-lg px-2 py-1 flex items-center space-x-1">
                    <span className="text-xs">🔥</span>
                    <span className="text-white text-xs font-bold">{user?.streak_days || 0}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-sage-800 rounded-full h-2">
                  <div 
                    className="bg-gold-400 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${getXPProgress()}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-3 rounded-xl text-base font-medium transition-all ${
                  location.pathname === item.href
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
            
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-3 rounded-xl text-base font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all mt-4 border-t border-sage-600 pt-4"
            >
              <span className="mr-3 text-lg">👋</span>
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;