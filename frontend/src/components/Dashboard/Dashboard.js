import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    questionsAsked: 0,
    mythsRead: 0,
    simulationsCompleted: 0,
    statutesViewed: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  useEffect(() => {
    fetchDashboardData();
    // Show celebration on first load
    setTimeout(() => setShowCelebration(true), 500);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // In a real app, we'd have a dashboard endpoint
      // For now, we'll simulate some data
      setStats({
        questionsAsked: 12,
        mythsRead: 24,
        simulationsCompleted: 3,
        statutesViewed: 45
      });

      setRecentActivity([
        { type: 'question', action: 'Asked about tenant rights', time: '2 hours ago', xp: 10 },
        { type: 'myth', action: 'Completed myth about police searches', time: '5 hours ago', xp: 15 },
        { type: 'simulation', action: 'Aced traffic stop simulation', time: '1 day ago', xp: 25 },
        { type: 'statute', action: 'Mastered housing discrimination law', time: '2 days ago', xp: 20 },
        { type: 'badge', action: 'Earned "Legal Eagle" badge', time: '3 days ago', xp: 50 }
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      title: 'Statute Lookup',
      description: 'Master legal statutes by state',
      icon: '📚',
      href: '/statutes',
      gradient: 'from-blue-400 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-700',
      available: true
    },
    {
      title: 'AI Legal Assistant',
      description: 'Get instant expert guidance',
      icon: '🤖',
      href: '/ai-chat',
      gradient: 'from-purple-400 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      textColor: 'text-purple-700',
      available: true
    },
    {
      title: 'Q&A Community',
      description: 'Learn from peer discussions',
      icon: '💬',
      href: '/questions',
      gradient: 'from-green-400 to-green-600',
      bgGradient: 'from-green-50 to-green-100',
      textColor: 'text-green-700',
      available: true
    },
    {
      title: 'Legal Myths',
      description: 'Bust common misconceptions',
      icon: '🎯',
      href: '/myths',
      gradient: 'from-red-400 to-red-600',
      bgGradient: 'from-red-50 to-red-100',
      textColor: 'text-red-700',
      available: true
    },
    {
      title: 'Simulations',
      description: 'Practice real-world scenarios',
      icon: '🎮',
      href: '/simulations',
      gradient: 'from-yellow-400 to-orange-500',
      bgGradient: 'from-yellow-50 to-orange-100',
      textColor: 'text-orange-700',
      available: true
    },
    {
      title: 'Learning Paths',
      description: 'Structured learning journeys', 
      icon: '🎓',
      href: '/learning',
      gradient: 'from-sage-400 to-sage-600',
      bgGradient: 'from-sage-50 to-sage-100',
      textColor: 'text-sage-700',
      available: false
    }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'question': return '❓';
      case 'myth': return '🎯';
      case 'simulation': return '🎮';
      case 'statute': return '📚';
      case 'badge': return '🏆';
      default: return '📝';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'question': return 'bg-blue-100 text-blue-700';
      case 'myth': return 'bg-red-100 text-red-700';
      case 'simulation': return 'bg-yellow-100 text-yellow-700';
      case 'statute': return 'bg-purple-100 text-purple-700';
      case 'badge': return 'bg-gold-100 text-gold-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getXPProgress = () => {
    const nextLevelXP = user?.level * 100; // Simple calculation
    const currentLevelXP = (user?.level - 1) * 100;
    const progress = ((user?.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const getUserTypeEmoji = () => {
    switch (user?.user_type) {
      case 'law_student': return '⚖️';
      case 'undergraduate': return '🎓';
      case 'graduate': return '📚';
      case 'professor': return '👨‍🏫';
      default: return '👤';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-sage-300 border-t-sage-600 mb-4"></div>
          <p className="text-sage-600 font-medium">Loading your legal journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section with Gamification */}
        <div className="mb-8">
          <div className={`bg-white rounded-3xl shadow-sage-lg p-8 border border-sage-100 transition-all duration-500 ${showCelebration ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-sage-800 mb-2">
                  <span className="animate-float inline-block mr-3">{getUserTypeEmoji()}</span>
                  Welcome back, {user?.username}!
                </h1>
                <p className="text-sage-600 text-lg">
                  Ready to level up your legal knowledge? 🚀
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-gradient-to-r from-gold-400 to-gold-500 rounded-2xl p-4 text-white text-center min-w-[120px] shadow-lg">
                  <div className="text-2xl font-bold">Level {user?.level}</div>
                  <div className="text-gold-100 text-sm">Legal Scholar</div>
                </div>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="bg-sage-50 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sage-700 font-medium">Progress to Level {user?.level + 1}</span>
                <span className="text-sage-600 text-sm">{user?.xp} / {user?.level * 100} XP</span>
              </div>
              <div className="w-full bg-sage-200 rounded-full h-4 relative overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-gold-400 to-gold-500 h-4 rounded-full transition-all duration-1000 ease-out shadow-inner" 
                  style={{ width: `${getXPProgress()}%` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center bg-gold-100 rounded-lg px-3 py-1">
                  <span className="text-lg mr-2">🔥</span>
                  <span className="text-gold-700 font-bold">{user?.streak_days || 0} day streak</span>
                </div>
                <span className="text-sage-600 text-sm">
                  {Math.max(0, (user?.level * 100) - user?.xp)} XP to next level
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center border border-blue-200">
                <div className="text-3xl mb-2">❓</div>
                <div className="text-2xl font-bold text-blue-700">{stats.questionsAsked}</div>
                <div className="text-blue-600 text-sm font-medium">Questions</div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-4 text-center border border-red-200">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-2xl font-bold text-red-700">{stats.mythsRead}</div>
                <div className="text-red-600 text-sm font-medium">Myths Busted</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-2xl p-4 text-center border border-orange-200">
                <div className="text-3xl mb-2">🎮</div>
                <div className="text-2xl font-bold text-orange-700">{stats.simulationsCompleted}</div>
                <div className="text-orange-600 text-sm font-medium">Simulations</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 text-center border border-purple-200">
                <div className="text-3xl mb-2">📚</div>
                <div className="text-2xl font-bold text-purple-700">{stats.statutesViewed}</div>
                <div className="text-purple-600 text-sm font-medium">Statutes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.href}
              className="group bg-white rounded-3xl shadow-sage hover:shadow-sage-lg transition-all duration-300 overflow-hidden border border-sage-100 hover:scale-105"
            >
              <div className={`bg-gradient-to-br ${feature.bgGradient} p-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg mr-4 group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${feature.textColor} mb-1`}>
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  {feature.available ? (
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                      Available
                    </div>
                  ) : (
                    <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
                      Coming Soon
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6">
                <div className={`text-sm font-medium ${feature.textColor} group-hover:text-opacity-80 transition-colors flex items-center`}>
                  Start learning
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-3xl shadow-sage-lg border border-sage-100">
          <div className="p-6 border-b border-sage-100">
            <h2 className="text-2xl font-bold text-sage-800 flex items-center">
              <span className="mr-3">📈</span>
              Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-sage-100">
            {recentActivity.map((activity, index) => (
              <div key={index} className="p-6 flex items-center space-x-4 hover:bg-sage-50/50 transition-colors">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sage-800 font-medium">{activity.action}</p>
                  <p className="text-sage-500 text-sm">{activity.time}</p>
                </div>
                <div className="bg-gold-100 text-gold-700 rounded-lg px-3 py-1 text-sm font-bold">
                  +{activity.xp} XP
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;