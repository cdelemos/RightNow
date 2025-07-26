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

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  useEffect(() => {
    fetchDashboardData();
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
        { type: 'question', action: 'Asked about tenant rights', time: '2 hours ago' },
        { type: 'myth', action: 'Read myth about police searches', time: '5 hours ago' },
        { type: 'simulation', action: 'Completed traffic stop simulation', time: '1 day ago' },
        { type: 'statute', action: 'Viewed housing discrimination law', time: '2 days ago' }
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
      description: 'Search legal statutes by state and category',
      icon: '📚',
      href: '/statutes',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'AI Legal Assistant',
      description: 'Get instant answers to your legal questions',
      icon: '🤖',
      href: '/ai-chat',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Q&A Community',
      description: 'Ask questions and help fellow students',
      icon: '💬',
      href: '/questions',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Legal Myths',
      description: 'Learn the truth behind common legal myths',
      icon: '🎯',
      href: '/myths',
      color: 'from-red-500 to-red-600'
    },
    {
      title: 'Simulations',
      description: 'Practice legal scenarios in a safe environment',
      icon: '🎮',
      href: '/simulations',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      title: 'Learning Paths',
      description: 'Structured courses tailored to your level',
      icon: '🎓',
      href: '/learning',
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'question': return '❓';
      case 'myth': return '🎯';
      case 'simulation': return '🎮';
      case 'statute': return '📚';
      default: return '📝';
    }
  };

  const getXPProgress = () => {
    const nextLevelXP = user?.level * 100; // Simple calculation
    const currentLevelXP = (user?.level - 1) * 100;
    const progress = ((user?.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.username}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Continue your legal education journey
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Level {user?.level}</h2>
              <p className="text-blue-100">{user?.xp} XP</p>
            </div>
            <div className="text-right">
              <div className="text-3xl mb-2">🏆</div>
              <p className="text-blue-100 text-sm">{user?.streak_days} Day Streak</p>
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500" 
              style={{ width: `${getXPProgress()}%` }}
            ></div>
          </div>
          <p className="text-blue-100 text-sm mt-2">
            {Math.max(0, (user?.level * 100) - user?.xp)} XP to next level
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl mb-2">❓</div>
            <div className="text-2xl font-bold text-gray-900">{stats.questionsAsked}</div>
            <div className="text-gray-600 text-sm">Questions Asked</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-2xl font-bold text-gray-900">{stats.mythsRead}</div>
            <div className="text-gray-600 text-sm">Myths Read</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl mb-2">🎮</div>
            <div className="text-2xl font-bold text-gray-900">{stats.simulationsCompleted}</div>
            <div className="text-gray-600 text-sm">Simulations Done</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl mb-2">📚</div>
            <div className="text-2xl font-bold text-gray-900">{stats.statutesViewed}</div>
            <div className="text-gray-600 text-sm">Statutes Viewed</div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.href}
              className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group"
            >
              <div className={`bg-gradient-to-r ${feature.color} p-6 text-white`}>
                <div className="text-3xl mb-2">{feature.icon}</div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 group-hover:text-gray-900 transition-colors">
                  {feature.description}
                </p>
                <div className="mt-4 text-blue-600 font-medium group-hover:text-blue-800 transition-colors">
                  Get started →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentActivity.map((activity, index) => (
              <div key={index} className="p-6 flex items-center space-x-4">
                <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                <div className="flex-1">
                  <p className="text-gray-900">{activity.action}</p>
                  <p className="text-gray-500 text-sm">{activity.time}</p>
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