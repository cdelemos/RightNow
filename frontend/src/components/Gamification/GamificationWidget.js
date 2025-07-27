import React, { useState } from 'react';
import { useGamification } from '../../context/GamificationContext';
import { useAuth } from '../../context/AuthContext';

const GamificationWidget = ({ position = 'top-right', compact = false }) => {
  const { user } = useAuth();
  const {
    levelProgress,
    userStats,
    badges,
    streaks,
    formatXP,
    getLevelTitle
  } = useGamification();
  
  const [isExpanded, setIsExpanded] = useState(false);

  if (!user || !levelProgress) return null;

  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-40',
    'top-left': 'fixed top-4 left-4 z-40',
    'bottom-right': 'fixed bottom-4 right-4 z-40',
    'bottom-left': 'fixed bottom-4 left-4 z-40'
  };

  const renderCompactWidget = () => (
    <div className={`${positionClasses[position]} ${compact ? 'w-16' : 'w-64'}`}>
      <div 
        className="bg-white rounded-lg shadow-lg p-3 cursor-pointer hover:shadow-xl transition-shadow"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {compact ? (
          <div className="text-center">
            <div className="text-sm font-bold text-sage-600">
              {levelProgress.current_level}
            </div>
            <div className="text-xs text-gray-600">
              {formatXP(user.xp)}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-800">
                Level {levelProgress.current_level}
              </div>
              <div className="text-sm text-sage-600 font-bold">
                {formatXP(user.xp)} XP
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-sage-500 to-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${levelProgress.progress_percentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {getLevelTitle(levelProgress.current_level)}
            </div>
          </div>
        )}
        
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="space-y-2">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center p-2 bg-sage-50 rounded">
                  <div className="font-bold text-sage-600">{badges?.length || 0}</div>
                  <div className="text-gray-600">Badges</div>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded">
                  <div className="font-bold text-yellow-600">
                    {streaks?.find(s => s.streak_type === 'daily_login')?.current_count || 0}
                  </div>
                  <div className="text-gray-600">Streak</div>
                </div>
              </div>
              
              {/* Recent Badge */}
              {badges && badges.length > 0 && (
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600 mb-1">Latest Badge:</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{badges[0].badge.icon}</span>
                    <span className="text-xs font-medium">{badges[0].badge.name}</span>
                  </div>
                </div>
              )}
              
              {/* Navigation Link */}
              <a 
                href="/gamification"
                className="block w-full text-center py-2 bg-sage-600 text-white rounded text-xs hover:bg-sage-700 transition-colors"
              >
                View Full Dashboard
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return renderCompactWidget();
};

export default GamificationWidget;