import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const AchievementStickers = ({ showModal = false, onClose = () => {} }) => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [animatingSticker, setAnimatingSticker] = useState(null);

  useEffect(() => {
    // Mock achievements data - in real app, fetch from backend
    setAchievements([
      {
        id: 1,
        title: "First Amendment Expert",
        description: "Mastered constitutional rights",
        type: "wax_seal",
        icon: "📜",
        color: "from-blue-500 to-blue-700",
        earned: true,
        earnedDate: "2024-01-15",
        category: "constitutional"
      },
      {
        id: 2,
        title: "Housing Rights Champion",
        description: "Completed tenant protection course",
        type: "sticker",
        icon: "🏠",
        color: "from-green-500 to-green-700",
        earned: true,
        earnedDate: "2024-01-10",
        category: "housing"
      },
      {
        id: 3,
        title: "Emergency Preparedness",
        description: "Set up emergency contacts and scripts",
        type: "wax_seal",
        icon: "🚨",
        color: "from-red-500 to-red-700",
        earned: true,
        earnedDate: "2024-01-08",
        category: "emergency"
      },
      {
        id: 4,
        title: "Legal Scholar",
        description: "Reached level 10 in legal knowledge",
        type: "sticker",
        icon: "⚖️",
        color: "from-purple-500 to-purple-700",
        earned: true,
        earnedDate: "2024-01-05",
        category: "progress"
      },
      {
        id: 5,
        title: "Community Helper",
        description: "Answered 50 community questions",
        type: "wax_seal",
        icon: "💬",
        color: "from-yellow-500 to-orange-600",
        earned: true,
        earnedDate: "2024-01-01",
        category: "community"
      },
      {
        id: 6,
        title: "Myth Buster",
        description: "Debunked 25 legal myths",
        type: "sticker",
        icon: "🎯",
        color: "from-pink-500 to-red-600",
        earned: false,
        category: "learning"
      }
    ]);
  }, []);

  const handleStickerClick = (achievement) => {
    setSelectedSticker(achievement);
    setAnimatingSticker(achievement.id);
    
    // Stop animation after 2 seconds
    setTimeout(() => {
      setAnimatingSticker(null);
    }, 2000);
  };

  const renderSticker = (achievement) => {
    const isAnimating = animatingSticker === achievement.id;
    
    return (
      <div
        key={achievement.id}
        className={`relative cursor-pointer transition-all duration-300 ${
          isAnimating ? 'scale-110 z-10' : 'hover:scale-105'
        }`}
        onClick={() => handleStickerClick(achievement)}
      >
        {/* Wax Seal Style */}
        {achievement.type === 'wax_seal' && (
          <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${achievement.color} shadow-lg border-4 border-gold-400 flex items-center justify-center relative ${
            !achievement.earned ? 'opacity-50 grayscale' : ''
          }`}>
            {/* Wax texture */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
            
            {/* Icon */}
            <div className="text-2xl text-white relative z-10">
              {achievement.icon}
            </div>
            
            {/* Seal impression */}
            <div className="absolute inset-2 rounded-full border-2 border-white/30"></div>
            
            {/* Animation effects */}
            {isAnimating && (
              <div className="absolute inset-0 rounded-full bg-gold-400/30 animate-ping"></div>
            )}
          </div>
        )}
        
        {/* Sticker Style */}
        {achievement.type === 'sticker' && (
          <div className={`w-20 h-20 rounded-lg bg-gradient-to-br ${achievement.color} shadow-lg border-2 border-white flex items-center justify-center relative transform rotate-3 ${
            !achievement.earned ? 'opacity-50 grayscale' : ''
          }`}>
            {/* Sticker shine */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/30 to-transparent"></div>
            
            {/* Icon */}
            <div className="text-2xl text-white relative z-10">
              {achievement.icon}
            </div>
            
            {/* Sticker corners */}
            <div className="absolute top-0 left-0 w-2 h-2 bg-white/20 rounded-br-full"></div>
            <div className="absolute top-0 right-0 w-2 h-2 bg-white/20 rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-white/20 rounded-tr-full"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-white/20 rounded-tl-full"></div>
            
            {/* Animation effects */}
            {isAnimating && (
              <div className="absolute inset-0 rounded-lg bg-gold-400/30 animate-pulse"></div>
            )}
          </div>
        )}
        
        {/* Title */}
        <div className="mt-2 text-center">
          <div className="text-xs font-bold text-book-leather">
            {achievement.title}
          </div>
          {achievement.earned && (
            <div className="text-xs text-forest-600">
              {new Date(achievement.earnedDate).toLocaleDateString()}
            </div>
          )}
        </div>
        
        {/* Lock indicator for unearned achievements */}
        {!achievement.earned && (
          <div className="absolute top-0 right-0 bg-gray-600 rounded-full w-6 h-6 flex items-center justify-center">
            <div className="text-white text-xs">🔒</div>
          </div>
        )}
      </div>
    );
  };

  const earnedAchievements = achievements.filter(a => a.earned);
  const unearnedAchievements = achievements.filter(a => !a.earned);

  if (showModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-book-page rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-book-page border-b border-forest-200 p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-book-leather">
                🏆 Achievement Collection
              </h2>
              <p className="text-forest-600">
                Your badges and seals of legal mastery
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-forest-600 hover:text-forest-800 text-2xl"
            >
              ×
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {/* Earned Achievements */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-book-leather mb-4">
                ✅ Earned Achievements ({earnedAchievements.length})
              </h3>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {earnedAchievements.map(renderSticker)}
              </div>
            </div>
            
            {/* Locked Achievements */}
            <div>
              <h3 className="text-lg font-bold text-book-leather mb-4">
                🔒 Locked Achievements ({unearnedAchievements.length})
              </h3>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {unearnedAchievements.map(renderSticker)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compact badge board for page headers
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {earnedAchievements.slice(0, 5).map((achievement) => (
        <div
          key={achievement.id}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white text-sm shadow-lg cursor-pointer hover:scale-110 transition-transform"
          onClick={() => handleStickerClick(achievement)}
          title={achievement.title}
        >
          {achievement.icon}
        </div>
      ))}
      
      {earnedAchievements.length > 5 && (
        <div className="w-8 h-8 rounded-full bg-forest-600 flex items-center justify-center text-white text-xs shadow-lg">
          +{earnedAchievements.length - 5}
        </div>
      )}
    </div>
  );
};

export default AchievementStickers;