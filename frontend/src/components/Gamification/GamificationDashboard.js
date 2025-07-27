import React, { useState, useEffect } from 'react';
import { useGamification } from '../../context/GamificationContext';
import { useAuth } from '../../context/AuthContext';
import JusticeMeter from './JusticeMeter';

const GamificationDashboard = () => {
  const { user } = useAuth();
  const {
    userStats,
    levelProgress,
    badges,
    achievements,
    streaks,
    recentXP,
    leaderboardPosition,
    loading,
    error,
    fetchLeaderboard,
    fetchXPHistory,
    formatXP,
    getLevelTitle,
    getBadgeRarityColor
  } = useGamification();

  const [activeTab, setActiveTab] = useState('overview');
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [xpHistory, setXPHistory] = useState(null);

  // Fallback data if API fails
  const fallbackData = {
    userStats: {
      total_xp: user?.xp || 0,
      current_level: user?.level || 1,
      badges_earned: user?.badges?.length || 0,
      achievements_unlocked: 5,
      streak_days: user?.streak_days || 0,
      justice_meter_score: 75
    },
    levelProgress: {
      current_level: user?.level || 1,
      current_xp: user?.xp || 0,
      xp_for_next_level: ((user?.level || 1) + 1) * 100,
      progress_percentage: ((user?.xp || 0) % 100)
    },
    badges: [
      { id: 1, name: 'First Steps', description: 'Started your legal journey', rarity: 'common', earned_date: new Date() },
      { id: 2, name: 'Knowledge Seeker', description: 'Completed 5 lessons', rarity: 'uncommon', earned_date: new Date() },
      { id: 3, name: 'Rights Defender', description: 'Mastered constitutional rights', rarity: 'rare', earned_date: new Date() }
    ],
    achievements: [
      { id: 1, title: 'Legal Scholar', description: 'Reached level 5', unlocked: true, icon: '🎓' },
      { id: 2, title: 'Myth Buster', description: 'Debunked 10 legal myths', unlocked: true, icon: '🎯' },
      { id: 3, title: 'Helper', description: 'Answered 5 community questions', unlocked: false, icon: '💬' }
    ]
  };

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard().then(setLeaderboardData).catch(() => setLeaderboardData([]));
    } else if (activeTab === 'xp-history') {
      fetchXPHistory().then(setXPHistory).catch(() => setXPHistory([]));
    }
  }, [activeTab]);

  // Use fallback data if loading fails
  const stats = userStats || fallbackData.userStats;
  const progress = levelProgress || fallbackData.levelProgress;
  const userBadges = badges || fallbackData.badges;
  const userAchievements = achievements || fallbackData.achievements;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600 mx-auto mb-4"></div>
          <p className="text-forest-600">Loading your achievements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">Failed to load gamification data</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-forest-600 text-white px-4 py-2 rounded-lg hover:bg-forest-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Level Progress Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 col-span-full lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-book-leather">Level Progress</h3>
          <div className="text-forest-600 font-bold">
            Level {levelProgress?.current_level || 1}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              {getLevelTitle(levelProgress?.current_level || 1)}
            </span>
            <span className="text-sm text-gray-600">
              {formatXP(levelProgress?.current_xp || 0)} / {formatXP(levelProgress?.next_level_xp || 100)} XP
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-gold-400 to-gold-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${levelProgress?.progress_percentage || 0}%` }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-sage-50 rounded-lg">
            <div className="text-2xl font-bold text-sage-600">
              {formatXP(user?.xp || 0)}
            </div>
            <div className="text-sm text-gray-600">Total XP</div>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {badges?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Badges</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {achievements?.filter(a => a.is_completed).length || 0}
            </div>
            <div className="text-sm text-gray-600">Achievements</div>
          </div>
        </div>
      </div>

      {/* Streaks Card */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">🔥 Streaks</h3>
        <div className="space-y-3">
          {streaks?.length > 0 ? (
            streaks.map((streak, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{streak.icon}</span>
                  <div>
                    <div className="font-medium text-gray-800">{streak.display_name}</div>
                    <div className="text-sm text-gray-600">{streak.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-orange-600">
                    {streak.current_count}
                  </div>
                  <div className="text-xs text-gray-500">
                    Best: {streak.best_count}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              <span className="text-4xl mb-2 block">🎯</span>
              <p>Start your learning streaks!</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Badges */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">🏆 Recent Badges</h3>
        <div className="space-y-3">
          {badges?.slice(0, 5).map((badgeData, index) => (
            <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
              <span className="text-2xl">{badgeData.badge.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-800 text-sm">{badgeData.badge.name}</div>
                <div className="text-xs text-gray-600">{badgeData.badge.description}</div>
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${getBadgeRarityColor(badgeData.badge.rarity)}`}>
                {badgeData.badge.rarity}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent XP */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">⭐ Recent XP</h3>
        <div className="space-y-3">
          {recentXP?.slice(0, 5).map((xp, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-gray-800 text-sm">{xp.description}</div>
                <div className="text-xs text-gray-600">
                  {new Date(xp.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="text-green-600 font-bold">
                +{xp.xp_amount}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard Position */}
      {leaderboardPosition && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">🏅 Weekly Ranking</h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              #{leaderboardPosition.rank}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              out of {leaderboardPosition.total_players} players
            </div>
            <div className="text-lg font-medium text-gray-800">
              {formatXP(leaderboardPosition.score)} XP this week
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderLeaderboard = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">🏆 Weekly Leaderboard</h3>
      
      {leaderboardData ? (
        <div className="space-y-3">
          {leaderboardData.rankings.map((entry, index) => (
            <div
              key={entry.user.id}
              className={`flex items-center justify-between p-4 rounded-lg ${
                entry.user.id === user?.id ? 'bg-sage-50 border-2 border-sage-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  entry.rank === 1 ? 'bg-yellow-500 text-white' :
                  entry.rank === 2 ? 'bg-gray-400 text-white' :
                  entry.rank === 3 ? 'bg-amber-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {entry.rank}
                </div>
                <div>
                  <div className="font-medium text-gray-800">
                    {entry.user.username}
                    {entry.user.id === user?.id && (
                      <span className="ml-2 text-sm text-sage-600">(You)</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    Level {entry.user.level} • {entry.user.badges?.length || 0} badges
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-purple-600">
                  {formatXP(entry.score)}
                </div>
                <div className="text-sm text-gray-600">XP</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      )}
    </div>
  );

  const renderXPHistory = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">📈 XP History</h3>
      
      {xpHistory ? (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatXP(xpHistory.total_xp_period)}
              </div>
              <div className="text-sm text-gray-600">Total XP (30 days)</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatXP(Math.round(xpHistory.average_daily_xp))}
              </div>
              <div className="text-sm text-gray-600">Daily Average</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {xpHistory.recent_transactions.length}
              </div>
              <div className="text-sm text-gray-600">Recent Actions</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">Recent Transactions</h4>
            {xpHistory.recent_transactions.slice(0, 10).map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-800 text-sm">{transaction.description}</div>
                  <div className="text-xs text-gray-600">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-green-600 font-bold">
                  +{transaction.xp_amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading XP history...</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-6 bg-gradient-to-br from-forest-50 to-green-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-book-leather mb-2">
            🏆 Your Justice Journey
          </h1>
          <p className="text-forest-600">
            Track your progress, achievements, and legal knowledge mastery
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl shadow-lg p-1">
            <div className="flex space-x-1">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'justice-meter', label: 'Justice Meter', icon: '⚖️' },
                { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
                { id: 'xp-history', label: 'XP History', icon: '📈' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-forest-600 text-white'
                      : 'text-forest-600 hover:text-forest-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'justice-meter' && (
          <div className="flex justify-center">
            <JusticeMeter compact={false} showDetails={true} />
          </div>
        )}
        {activeTab === 'leaderboard' && renderLeaderboard()}
        {activeTab === 'xp-history' && renderXPHistory()}
      </div>
    </div>
  );
};

export default GamificationDashboard;