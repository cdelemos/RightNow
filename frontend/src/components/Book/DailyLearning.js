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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyContent();
  }, []);

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
    <div className="h-full p-8 overflow-y-auto">
      {/* Header with Date and Welcome */}
      <div className="text-center mb-8">
        <div className="text-sm text-forest-600 mb-2">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <h1 className="text-2xl font-bold text-book-leather mb-4">
          Daily Learning
        </h1>
        <div className="w-16 h-1 bg-gradient-to-r from-gold-400 to-gold-600 mx-auto rounded-full"></div>
      </div>

      {/* Progress Ribbon */}
      <div className="bg-gradient-to-r from-gold-50 to-amber-50 border border-gold-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className="text-2xl mr-2">🎯</span>
            <div>
              <div className="font-bold text-book-leather">Level {user?.level} Progress</div>
              <div className="text-sm text-forest-600">{user?.xp || 0} XP earned</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-gold-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              🔥 {user?.streak_days || 0} days
            </div>
            <div className="bg-forest-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              🏆 {user?.badges?.length || 0} badges
            </div>
          </div>
        </div>
        <div className="w-full bg-gold-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-gold-400 to-gold-600 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${getProgressRibbon()}%` }}
          ></div>
        </div>
      </div>

      {/* Lesson of the Day */}
      <div className="bg-white border border-forest-200 rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex items-center mb-4">
          <div className="bg-forest-600 text-white p-2 rounded-lg mr-3">
            <span className="text-xl">💡</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-book-leather">Lesson of the Day</h2>
            <div className="flex items-center space-x-2 text-sm text-forest-600">
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{dailyLesson.category}</span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded">{dailyLesson.difficulty}</span>
              <span className="bg-gold-100 text-gold-700 px-2 py-1 rounded">+{dailyLesson.xp} XP</span>
            </div>
          </div>
        </div>
        
        <div className="bg-forest-50 p-4 rounded-lg border-l-4 border-forest-600 mb-4">
          <h3 className="font-bold text-book-leather mb-2">{dailyLesson.title}</h3>
          <p className="text-forest-700 leading-relaxed">{dailyLesson.content}</p>
        </div>
        
        <button
          onClick={() => navigate('/learning-paths')}
          className="bg-forest-600 text-white px-4 py-2 rounded-lg hover:bg-forest-700 transition-colors"
        >
          Continue Learning →
        </button>
      </div>

      {/* Bottom Section: Myth and Script */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Myth of the Day */}
        <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="bg-red-500 text-white p-2 rounded-lg mr-3">
              <span className="text-xl">🎯</span>
            </div>
            <h3 className="text-lg font-bold text-book-leather">Myth of the Day</h3>
          </div>
          
          <div className="space-y-3">
            <div className="bg-red-100 border border-red-300 rounded-lg p-3">
              <div className="text-sm font-medium text-red-800 mb-1">❌ MYTH</div>
              <p className="text-red-700">{dailyMyth.myth}</p>
            </div>
            
            <div className="bg-green-100 border border-green-300 rounded-lg p-3">
              <div className="text-sm font-medium text-green-800 mb-1">✅ FACT</div>
              <p className="text-green-700">{dailyMyth.fact}</p>
            </div>
            
            <div className="text-xs text-forest-600">
              <strong>Source:</strong> {dailyMyth.source}
            </div>
          </div>
          
          <button
            onClick={() => navigate('/myths')}
            className="w-full mt-4 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Explore More Myths
          </button>
        </div>

        {/* Quick Script */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="bg-purple-500 text-white p-2 rounded-lg mr-3">
              <span className="text-xl">📝</span>
            </div>
            <h3 className="text-lg font-bold text-book-leather">Quick Script</h3>
          </div>
          
          <div className="space-y-3">
            <div className="bg-purple-100 border border-purple-300 rounded-lg p-3">
              <div className="text-sm font-medium text-purple-800 mb-1">
                📋 {quickScript.title}
              </div>
              <p className="text-purple-700 text-sm">{quickScript.scenario}</p>
            </div>
            
            <div className="bg-white border border-purple-200 rounded-lg p-3">
              <div className="text-sm font-medium text-book-leather mb-2">💬 What to say:</div>
              <p className="text-forest-700 italic">"{quickScript.script}"</p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/simulations')}
            className="w-full mt-4 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors"
          >
            Practice Scenarios
          </button>
        </div>
      </div>

      {/* Gavvy the Gavel in margin */}
      <div className="fixed bottom-20 right-8 z-10">
        <MascotWidget position="margin" />
      </div>
    </div>
  );
};

export default DailyLearning;