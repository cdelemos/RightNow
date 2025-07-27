import React, { useState, useEffect } from 'react';
import { useGamification } from '../../context/GamificationContext';
import { useAuth } from '../../context/AuthContext';

const JusticeMeter = ({ compact = false, showDetails = true }) => {
  const { user } = useAuth();
  const { userStats, levelProgress, fetchUserProgress } = useGamification();
  const [justiceScore, setJusticeScore] = useState(0);
  const [justiceLevel, setJusticeLevel] = useState('Legal Novice');
  const [progressData, setProgressData] = useState(null);

  useEffect(() => {
    if (user) {
      calculateJusticeScore();
      loadProgressData();
    }
  }, [user, userStats, levelProgress]);

  const loadProgressData = async () => {
    try {
      const data = await fetchUserProgress();
      if (data) {
        setProgressData(data);
      }
    } catch (error) {
      console.error('Failed to load progress data:', error);
    }
  };

  const calculateJusticeScore = () => {
    if (!userStats || !levelProgress) return;

    // Justice Score calculation based on multiple factors
    const factors = {
      // Knowledge factors (40% of score)
      knowledge: {
        statutes_read: Math.min((userStats.statutes_read || 0) / 100, 1) * 15,
        myths_read: Math.min((userStats.myths_read || 0) / 50, 1) * 10,
        learning_paths: Math.min((userStats.learning_paths_completed || 0) / 10, 1) * 15
      },
      
      // Engagement factors (30% of score)
      engagement: {
        daily_streak: Math.min((userStats.daily_streak || 0) / 30, 1) * 10,
        ai_chats: Math.min((userStats.ai_chats_initiated || 0) / 50, 1) * 10,
        simulations: Math.min((userStats.simulations_completed || 0) / 20, 1) * 10
      },
      
      // Community factors (20% of score)
      community: {
        questions_asked: Math.min((userStats.questions_asked || 0) / 25, 1) * 7,
        answers_provided: Math.min((userStats.answers_provided || 0) / 25, 1) * 8,
        upvotes_received: Math.min((userStats.upvotes_received || 0) / 50, 1) * 5
      },
      
      // Achievement factors (10% of score)
      achievement: {
        level_bonus: Math.min((levelProgress.current_level || 1) / 25, 1) * 5,
        badges_earned: Math.min((userStats.badges_earned || 0) / 20, 1) * 5
      }
    };

    // Calculate total score
    const totalScore = Object.values(factors).reduce((total, category) => {
      return total + Object.values(category).reduce((sum, score) => sum + score, 0);
    }, 0);

    setJusticeScore(Math.round(totalScore));
    setJusticeLevel(getJusticeLevel(totalScore));
  };

  const getJusticeLevel = (score) => {
    if (score >= 90) return 'Justice Champion';
    if (score >= 80) return 'Rights Defender';
    if (score >= 70) return 'Legal Advocate';
    if (score >= 60) return 'Law Guardian';
    if (score >= 50) return 'Legal Scholar';
    if (score >= 40) return 'Rights Learner';
    if (score >= 30) return 'Legal Student';
    if (score >= 20) return 'Justice Seeker';
    if (score >= 10) return 'Legal Explorer';
    return 'Legal Novice';
  };

  const getJusticeLevelColor = (level) => {
    switch (level) {
      case 'Justice Champion': return 'text-purple-600 bg-purple-100';
      case 'Rights Defender': return 'text-red-600 bg-red-100';
      case 'Legal Advocate': return 'text-blue-600 bg-blue-100';
      case 'Law Guardian': return 'text-green-600 bg-green-100';
      case 'Legal Scholar': return 'text-yellow-600 bg-yellow-100';
      case 'Rights Learner': return 'text-indigo-600 bg-indigo-100';
      case 'Legal Student': return 'text-pink-600 bg-pink-100';
      case 'Justice Seeker': return 'text-orange-600 bg-orange-100';
      case 'Legal Explorer': return 'text-teal-600 bg-teal-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getJusticeIcon = (level) => {
    switch (level) {
      case 'Justice Champion': return '👑';
      case 'Rights Defender': return '🛡️';
      case 'Legal Advocate': return '⚖️';
      case 'Law Guardian': return '🏛️';
      case 'Legal Scholar': return '📚';
      case 'Rights Learner': return '🎓';
      case 'Legal Student': return '📖';
      case 'Justice Seeker': return '🔍';
      case 'Legal Explorer': return '🧭';
      default: return '⚖️';
    }
  };

  const getProgressColor = (score) => {
    if (score >= 80) return 'from-purple-500 to-purple-600';
    if (score >= 60) return 'from-blue-500 to-blue-600';
    if (score >= 40) return 'from-green-500 to-green-600';
    if (score >= 20) return 'from-yellow-500 to-yellow-600';
    return 'from-gray-500 to-gray-600';
  };

  const renderCompactMeter = () => (
    <div className="bg-white rounded-lg shadow-lg p-3 min-w-[200px]">
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{getJusticeIcon(justiceLevel)}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-800">Justice Meter</span>
            <span className="text-sm font-bold text-purple-600">{justiceScore}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`bg-gradient-to-r ${getProgressColor(justiceScore)} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${justiceScore}%` }}
            />
          </div>
          <div className="text-xs text-gray-600 mt-1">{justiceLevel}</div>
        </div>
      </div>
    </div>
  );

  const renderFullMeter = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="text-center mb-6">
        <div className="text-6xl mb-2">{getJusticeIcon(justiceLevel)}</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Justice Meter</h3>
        <div className={`inline-block px-4 py-2 rounded-full ${getJusticeLevelColor(justiceLevel)}`}>
          <span className="font-bold">{justiceLevel}</span>
        </div>
      </div>

      {/* Main Progress Circle */}
      <div className="relative w-48 h-48 mx-auto mb-6">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - justiceScore / 100)}`}
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Center score */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-800">{justiceScore}%</div>
            <div className="text-sm text-gray-600">Justice Score</div>
          </div>
        </div>
      </div>

      {/* Progress Breakdown */}
      {showDetails && progressData && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 text-center">Progress Breakdown</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Knowledge Progress */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h5 className="font-medium text-blue-800 mb-2">📚 Knowledge</h5>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Statutes Read</span>
                  <span>{progressData.features?.statutes?.read || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Myths Explored</span>
                  <span>{progressData.features?.myths?.read || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Learning Paths</span>
                  <span>{progressData.features?.learning_paths?.completed || 0}</span>
                </div>
              </div>
            </div>

            {/* Engagement Progress */}
            <div className="bg-green-50 rounded-lg p-4">
              <h5 className="font-medium text-green-800 mb-2">🎯 Engagement</h5>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Daily Streak</span>
                  <span>{userStats?.daily_streak || 0} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>AI Conversations</span>
                  <span>{progressData.features?.ai_interactions?.conversations || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Simulations</span>
                  <span>{progressData.features?.simulations?.completed || 0}</span>
                </div>
              </div>
            </div>

            {/* Community Progress */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h5 className="font-medium text-purple-800 mb-2">👥 Community</h5>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Questions Asked</span>
                  <span>{progressData.features?.community?.questions_asked || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Answers Provided</span>
                  <span>{progressData.features?.community?.answers_provided || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Upvotes Received</span>
                  <span>{userStats?.upvotes_received || 0}</span>
                </div>
              </div>
            </div>

            {/* Achievement Progress */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h5 className="font-medium text-yellow-800 mb-2">🏆 Achievements</h5>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Level</span>
                  <span>{progressData.user_level || 1}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Badges Earned</span>
                  <span>{progressData.badges_earned || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total XP</span>
                  <span>{progressData.user_xp || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Level Requirements */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h5 className="font-medium text-gray-800 mb-2">Next Level: {getJusticeLevel(justiceScore + 10)}</h5>
        <p className="text-sm text-gray-600">
          Continue learning and engaging with the community to increase your Justice Score!
        </p>
      </div>
    </div>
  );

  if (!user) return null;

  return compact ? renderCompactMeter() : renderFullMeter();
};

export default JusticeMeter;