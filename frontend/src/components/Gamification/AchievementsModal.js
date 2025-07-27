import React, { useState, useEffect } from 'react';
import { useGamification } from '../../context/GamificationContext';
import ProgressBar from './ProgressBar';

const AchievementsModal = ({ isOpen, onClose }) => {
  const { fetchAchievements, formatXP } = useGamification();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, completed, in-progress

  useEffect(() => {
    if (isOpen) {
      loadAchievements();
    }
  }, [isOpen]);

  const loadAchievements = async () => {
    setLoading(true);
    try {
      const data = await fetchAchievements();
      if (data) {
        setAchievements(data.achievements || []);
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAchievements = (achievements, filter) => {
    switch (filter) {
      case 'completed':
        return achievements.filter(a => a.is_completed);
      case 'in-progress':
        return achievements.filter(a => !a.is_completed && a.current_progress > 0);
      default:
        return achievements;
    }
  };

  const filteredAchievements = filterAchievements(achievements, filter);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🏆</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Achievements</h2>
                <p className="text-gray-600">
                  {achievements.filter(a => a.is_completed).length} of {achievements.length} completed
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'all', label: 'All', count: achievements.length },
              { id: 'completed', label: 'Completed', count: achievements.filter(a => a.is_completed).length },
              { id: 'in-progress', label: 'In Progress', count: achievements.filter(a => !a.is_completed && a.current_progress > 0).length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.id
                    ? 'bg-white text-sage-600 shadow-sm'
                    : 'text-gray-600 hover:text-sage-600'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading achievements...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    achievement.is_completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:border-sage-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className={`text-3xl ${achievement.is_completed ? 'grayscale-0' : 'grayscale'}`}>
                      {achievement.icon}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className={`font-bold ${
                          achievement.is_completed ? 'text-green-800' : 'text-gray-800'
                        }`}>
                          {achievement.name}
                        </h3>
                        {achievement.is_completed && (
                          <span className="text-green-600 text-sm">✓</span>
                        )}
                      </div>
                      
                      <p className={`text-sm mb-3 ${
                        achievement.is_completed ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {achievement.description}
                      </p>
                      
                      {/* Progress */}
                      <div className="mb-3">
                        <ProgressBar
                          current={achievement.current_progress}
                          total={achievement.target}
                          color={achievement.is_completed ? 'green' : 'sage'}
                          height="h-2"
                          showNumbers={true}
                          showPercentage={false}
                        />
                      </div>
                      
                      {/* Reward */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Reward: {formatXP(achievement.xp_reward)} XP
                        </span>
                        {achievement.is_completed && achievement.completed_at && (
                          <span className="text-xs text-green-600">
                            Completed {new Date(achievement.completed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loading && filteredAchievements.length === 0 && (
            <div className="text-center py-8">
              <span className="text-6xl mb-4 block">🎯</span>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No achievements found</h3>
              <p className="text-gray-600">
                {filter === 'completed' 
                  ? "You haven't completed any achievements yet. Keep learning!"
                  : filter === 'in-progress'
                  ? "No achievements in progress. Start exploring the platform!"
                  : "No achievements available."}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">
                {achievements.filter(a => a.is_completed).length}
              </span> of <span className="font-medium">{achievements.length}</span> achievements completed
            </div>
            <div className="text-sm text-gray-600">
              Total XP from achievements: {formatXP(
                achievements
                  .filter(a => a.is_completed)
                  .reduce((sum, a) => sum + a.xp_reward, 0)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementsModal;