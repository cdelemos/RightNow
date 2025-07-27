import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PictureFrameScenario from './PictureFrameScenario';
import AchievementStickers from './AchievementStickers';
import MarginScribbles from './MarginScribbles';
import UserSignaturePage from './UserSignaturePage';

const DailyLearning = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dailyLesson, setDailyLesson] = useState(null);
  const [dailyMyth, setDailyMyth] = useState(null);
  const [quickScript, setQuickScript] = useState(null);
  const [showPictureFrames, setShowPictureFrames] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showSignaturePage, setShowSignaturePage] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyContent();
    checkForSignaturePage();
  }, []);

  const checkForSignaturePage = () => {
    const pledge = localStorage.getItem('userPledge');
    if (!pledge && user?.level >= 3) {
      // Show signature page for users who've completed 3+ lessons
      setShowSignaturePage(true);
    }
  };

  const fetchDailyContent = async () => {
    try {
      // Simulate fetching daily content
      setDailyLesson({
        title: "Understanding Your Miranda Rights",
        content: "When you're arrested, you have the right to remain silent. Anything you say can and will be used against you in a court of law. You have the right to an attorney...",
        category: "Criminal Law",
        xp: 25,
        difficulty: "Beginner"
      });

      setDailyMyth({
        myth: "Police must read you your rights immediately upon arrest",
        fact: "Miranda rights only need to be read before custodial interrogation, not immediately upon arrest.",
        source: "Miranda v. Arizona (1966)"
      });

      setQuickScript({
        title: "Traffic Stop Script",
        scenario: "Getting pulled over",
        script: "Good evening, officer. I'm keeping my hands visible. I do not consent to searches. I'm exercising my right to remain silent."
      });
    } catch (error) {
      console.error('Failed to fetch daily content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressRibbon = () => {
    const progress = (user?.xp || 0) / ((user?.level || 1) * 100) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">📚</div>
          <p className="text-forest-600">Loading today's lesson...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto book-texture">
      {/* Header with Date and Welcome */}
      <div className="text-center mb-6">
        <div className="text-sm text-forest-600 mb-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <h1 className="text-xl font-bold text-book-leather mb-3">
          📖 Daily Learning
        </h1>
        <div className="w-12 h-0.5 bg-gradient-to-r from-gold-400 to-gold-600 mx-auto rounded-full animate-gold-glow"></div>
        
        {/* Achievement Stickers - Compact */}
        <div className="mt-3 flex items-center justify-center space-x-2">
          <AchievementStickers />
          <button
            onClick={() => setShowAchievements(true)}
            className="text-forest-600 hover:text-forest-800 text-xs"
          >
            View All →
          </button>
        </div>
      </div>

      {/* Progress Ribbon - Compact */}
      <div className="bg-gradient-to-r from-gold-50 to-amber-50 border border-gold-200 rounded-lg p-3 mb-4 animate-ribbon-float">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className="text-xl mr-2">🎯</span>
            <div>
              <div className="font-bold text-book-leather text-sm">Level {user?.level} Progress</div>
              <div className="text-xs text-forest-600">{user?.xp || 0} XP earned</div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <div className="bg-gold-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              🔥 {user?.streak_days || 0}
            </div>
            <div className="bg-forest-600 text-white px-2 py-1 rounded-full text-xs font-bold">
              🏆 {user?.badges?.length || 0}
            </div>
          </div>
        </div>
        <div className="w-full bg-gold-200 rounded-full h-1.5">
          <div 
            className="bg-gradient-to-r from-gold-400 to-gold-600 h-1.5 rounded-full transition-all duration-1000"
            style={{ width: `${getProgressRibbon()}%` }}
          ></div>
        </div>
      </div>

      {/* Lesson of the Day - Compact */}
      <div className="bg-white border border-forest-200 rounded-lg p-4 mb-4 shadow-sm page-curl">
        <div className="flex items-center mb-3">
          <div className="bg-forest-600 text-white p-2 rounded-lg mr-3">
            <span className="text-lg">💡</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-book-leather">Lesson of the Day</h2>
            <div className="flex items-center space-x-2 text-xs text-forest-600">
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{dailyLesson.category}</span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded">{dailyLesson.difficulty}</span>
              <span className="bg-gold-100 text-gold-700 px-2 py-1 rounded">+{dailyLesson.xp} XP</span>
            </div>
          </div>
        </div>
        
        <div className="bg-forest-50 p-3 rounded-lg border-l-4 border-forest-600 mb-3 parchment-texture">
          <h3 className="font-bold text-book-leather mb-1 text-sm">{dailyLesson.title}</h3>
          <p className="text-forest-700 leading-relaxed text-sm">{dailyLesson.content}</p>
        </div>
        
        <button
          onClick={() => navigate('/learning-paths')}
          className="bg-forest-600 text-white px-3 py-1.5 rounded-lg hover:bg-forest-700 transition-colors text-sm"
        >
          Continue Learning →
        </button>
      </div>

      {/* Picture Frame Scenarios - Compact */}
      <div className="mb-4">
        <button
          onClick={() => setShowPictureFrames(!showPictureFrames)}
          className="w-full bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3 text-left hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-lg mr-2">🖼️</div>
              <div>
                <h3 className="font-bold text-book-leather text-sm">Picture Frame Scenarios</h3>
                <p className="text-forest-600 text-xs">Interactive legal simulations</p>
              </div>
            </div>
            <div className="text-forest-400 text-sm">
              {showPictureFrames ? '↑' : '↓'}
            </div>
          </div>
        </button>
        
        {showPictureFrames && (
          <div className="mt-3 animate-fade-in">
            <div className="max-h-64 overflow-y-auto">
              <PictureFrameScenario />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Myth and Script - Compact */}
      <div className="grid grid-cols-1 gap-3">
        {/* Myth of the Day */}
        <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg p-4 page-curl">
          <div className="flex items-center mb-3">
            <div className="bg-red-500 text-white p-1.5 rounded-lg mr-2">
              <span className="text-sm">🎯</span>
            </div>
            <h3 className="text-sm font-bold text-book-leather">Myth of the Day</h3>
          </div>
          
          <div className="space-y-2">
            <div className="bg-red-100 border border-red-300 rounded-lg p-2">
              <div className="text-xs font-medium text-red-800 mb-1">❌ MYTH</div>
              <p className="text-red-700 text-xs">{dailyMyth.myth}</p>
            </div>
            
            <div className="bg-green-100 border border-green-300 rounded-lg p-2">
              <div className="text-xs font-medium text-green-800 mb-1">✅ FACT</div>
              <p className="text-green-700 text-xs">{dailyMyth.fact}</p>
            </div>
            
            <div className="text-xs text-forest-600">
              <strong>Source:</strong> {dailyMyth.source}
            </div>
          </div>
          
          <button
            onClick={() => navigate('/myths')}
            className="w-full mt-3 bg-red-500 text-white py-1.5 rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            Explore More Myths
          </button>
        </div>

        {/* Quick Script */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 page-curl">
          <div className="flex items-center mb-3">
            <div className="bg-purple-500 text-white p-1.5 rounded-lg mr-2">
              <span className="text-sm">📝</span>
            </div>
            <h3 className="text-sm font-bold text-book-leather">Quick Script</h3>
          </div>
          
          <div className="space-y-2">
            <div className="bg-purple-100 border border-purple-300 rounded-lg p-2">
              <div className="text-xs font-medium text-purple-800 mb-1">
                📋 {quickScript.title}
              </div>
              <p className="text-purple-700 text-xs">{quickScript.scenario}</p>
            </div>
            
            <div className="bg-white border border-purple-200 rounded-lg p-2 parchment-texture">
              <div className="text-xs font-medium text-book-leather mb-1">💬 What to say:</div>
              <p className="text-forest-700 italic text-xs">"{quickScript.script}"</p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/simulations')}
            className="w-full mt-3 bg-purple-500 text-white py-1.5 rounded-lg hover:bg-purple-600 transition-colors text-sm"
          >
            Practice Scenarios
          </button>
        </div>
      </div>

      {/* Margin Scribbles - Positioned better */}
      <div className="absolute top-1/2 -right-4 transform -translate-y-1/2">
        <MarginScribbles position="right" context="general" />
      </div>

      {/* Modals */}
      <AchievementStickers 
        showModal={showAchievements} 
        onClose={() => setShowAchievements(false)} 
      />
      
      <UserSignaturePage 
        isOpen={showSignaturePage} 
        onClose={() => setShowSignaturePage(false)} 
        onSignatureComplete={() => setShowSignaturePage(false)} 
      />
    </div>
  );
};

export default DailyLearning;