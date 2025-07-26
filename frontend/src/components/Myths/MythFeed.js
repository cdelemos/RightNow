import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const MythFeed = () => {
  const [currentMythIndex, setCurrentMythIndex] = useState(0);
  const [myths, setMyths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dailyMyth, setDailyMyth] = useState(null);
  const [xpGained, setXpGained] = useState(0);
  const [showFactRevealed, setShowFactRevealed] = useState(false);
  const { user } = useAuth();

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  useEffect(() => {
    fetchDailyMyth();
    fetchMythFeed();
  }, []);

  const fetchDailyMyth = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/myths/daily`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setDailyMyth(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch daily myth:', error);
    }
  };

  const fetchMythFeed = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/myths/feed?per_page=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMyths(response.data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch myth feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMythRead = async (mythId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/myths/${mythId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const xpAwarded = response.data.data?.xp_awarded || 15;
        setXpGained(xpAwarded);
        setTimeout(() => setXpGained(0), 3000);
      }
    } catch (error) {
      console.error('Failed to mark myth as read:', error);
    }
  };

  const handleLikeMyth = async (mythId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/myths/${mythId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setMyths(prev => prev.map(myth => 
        myth.id === mythId 
          ? { ...myth, user_liked: !myth.user_liked, likes: myth.user_liked ? myth.likes - 1 : myth.likes + 1 }
          : myth
      ));

      if (dailyMyth && dailyMyth.id === mythId) {
        setDailyMyth(prev => ({
          ...prev,
          user_liked: !prev.user_liked,
          likes: prev.user_liked ? prev.likes - 1 : prev.likes + 1
        }));
      }
    } catch (error) {
      console.error('Failed to like myth:', error);
    }
  };

  const handleShareMyth = async (mythId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/myths/${mythId}/share`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setXpGained(10);
        setTimeout(() => setXpGained(0), 3000);
      }

      // Copy to clipboard for sharing
      const mythToShare = myths.find(m => m.id === mythId) || dailyMyth;
      if (mythToShare) {
        const shareText = `💡 Legal Myth Busted!\n\n"${mythToShare.myth_statement}"\n\n✅ FACT: ${mythToShare.fact_explanation}\n\n🎓 Learn more legal rights at RightNow Legal Education Platform!`;
        await navigator.clipboard.writeText(shareText);
        alert('Myth copied to clipboard! Share it with friends! 📋');
      }
    } catch (error) {
      console.error('Failed to share myth:', error);
    }
  };

  const nextMyth = () => {
    if (currentMythIndex < myths.length - 1) {
      setCurrentMythIndex(currentMythIndex + 1);
      setShowFactRevealed(false);
    }
  };

  const previousMyth = () => {
    if (currentMythIndex > 0) {
      setCurrentMythIndex(currentMythIndex - 1);
      setShowFactRevealed(false);
    }
  };

  const revealFact = (mythId) => {
    setShowFactRevealed(true);
    handleMythRead(mythId);
  };

  const getCategoryEmoji = (category) => {
    const emojiMap = {
      criminal_law: '⚖️',
      civil_rights: '✊',
      housing: '🏠',
      employment: '💼',
      consumer_protection: '🛡️',
      education: '🎓',
      traffic: '🚗',
      family_law: '👨‍👩‍👧‍👦',
      contracts: '📝',
      torts: '⚠️'
    };
    return emojiMap[category] || '📚';
  };

  const getDifficultyColor = (level) => {
    const colors = {
      1: 'bg-green-100 text-green-700',
      2: 'bg-yellow-100 text-yellow-700',
      3: 'bg-red-100 text-red-700'
    };
    return colors[level] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-sage-300 border-t-sage-600 mb-4"></div>
          <p className="text-sage-600 font-medium">Loading myth-busting content...</p>
        </div>
      </div>
    );
  }

  const currentMyth = myths[currentMythIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-emerald-50">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-sage-800 mb-2 flex items-center justify-center">
            <span className="mr-3">🎯</span>
            Myth-Busting Feed
          </h1>
          <p className="text-sage-600">
            Swipe through daily legal myths and discover the facts!
          </p>
          <div className="mt-4 bg-white rounded-2xl p-4 shadow-sage border border-sage-100">
            <div className="text-sm text-sage-600">
              Myth {currentMythIndex + 1} of {myths.length}
            </div>
            <div className="w-full bg-sage-200 rounded-full h-2 mt-2">
              <div 
                className="bg-gradient-to-r from-gold-400 to-gold-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentMythIndex + 1) / myths.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* XP Gain Animation */}
        {xpGained > 0 && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-gold-500 text-white rounded-full px-4 py-2 font-bold shadow-lg animate-bounce">
              +{xpGained} XP! 🌟
            </div>
          </div>
        )}

        {/* Daily Myth Highlight */}
        {dailyMyth && currentMythIndex === 0 && (
          <div className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-1 shadow-lg">
            <div className="bg-white rounded-3xl p-1">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 text-center">
                <div className="text-2xl mb-2">⭐</div>
                <div className="text-purple-700 font-bold text-sm">TODAY'S FEATURED MYTH</div>
                <div className="text-purple-600 text-xs">Extra XP for engaging!</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Myth Card */}
        {currentMyth && (
          <div className="bg-white rounded-3xl shadow-sage-lg border border-sage-100 overflow-hidden mb-6">
            {/* Category Header */}
            <div className="bg-gradient-to-r from-sage-500 to-sage-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getCategoryEmoji(currentMyth.category)}</span>
                  <div>
                    <div className="font-bold text-lg">{currentMyth.title}</div>
                    <div className="text-sage-100 text-sm capitalize">
                      {currentMyth.category.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentMyth.difficulty_level)}`}>
                  Level {currentMyth.difficulty_level}
                </div>
              </div>
            </div>

            {/* Myth Content */}
            <div className="p-6">
              {/* Myth Statement */}
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <span className="text-red-500 text-xl mr-2">❌</span>
                  <span className="text-red-700 font-bold text-sm uppercase tracking-wide">MYTH</span>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <p className="text-red-800 font-medium leading-relaxed">
                    "{currentMyth.myth_statement}"
                  </p>
                </div>
              </div>

              {/* Fact Reveal */}
              {!showFactRevealed ? (
                <button
                  onClick={() => revealFact(currentMyth.id)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <span className="text-lg mr-2">💡</span>
                  Reveal the Truth (+15 XP)
                </button>
              ) : (
                <div className="animate-fade-in">
                  <div className="flex items-center mb-3">
                    <span className="text-green-500 text-xl mr-2">✅</span>
                    <span className="text-green-700 font-bold text-sm uppercase tracking-wide">FACT</span>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
                    <p className="text-green-800 leading-relaxed">
                      {currentMyth.fact_explanation}
                    </p>
                  </div>

                  {/* Sources */}
                  {currentMyth.sources && currentMyth.sources.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
                      <div className="text-blue-700 font-medium text-sm mb-2">📚 Sources:</div>
                      <div className="text-blue-600 text-sm">
                        {currentMyth.sources.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {showFactRevealed && (
              <div className="px-6 pb-6">
                <div className="flex items-center justify-between bg-sage-50 rounded-2xl p-4">
                  <button
                    onClick={() => handleLikeMyth(currentMyth.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      currentMyth.user_liked 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-white text-sage-600 hover:bg-sage-100'
                    }`}
                  >
                    <span>{currentMyth.user_liked ? '❤️' : '🤍'}</span>
                    <span className="text-sm font-medium">{currentMyth.likes}</span>
                  </button>

                  <button
                    onClick={() => handleShareMyth(currentMyth.id)}
                    className="flex items-center space-x-2 bg-white text-sage-600 hover:bg-sage-100 px-4 py-2 rounded-lg transition-colors"
                  >
                    <span>📤</span>
                    <span className="text-sm font-medium">Share</span>
                  </button>

                  <div className="flex items-center space-x-2 text-sage-500 text-sm">
                    <span>👀</span>
                    <span>{currentMyth.views}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-sage border border-sage-100 p-4">
          <button
            onClick={previousMyth}
            disabled={currentMythIndex === 0}
            className="flex items-center space-x-2 bg-sage-100 hover:bg-sage-200 disabled:bg-sage-50 disabled:text-sage-300 text-sage-700 px-4 py-2 rounded-lg transition-colors"
          >
            <span>⬅️</span>
            <span className="text-sm font-medium">Previous</span>
          </button>

          <div className="text-sage-600 text-sm font-medium">
            {currentMythIndex + 1} / {myths.length}
          </div>

          <button
            onClick={nextMyth}
            disabled={currentMythIndex === myths.length - 1}
            className="flex items-center space-x-2 bg-sage-600 hover:bg-sage-700 disabled:bg-sage-300 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <span className="text-sm font-medium">Next</span>
            <span>➡️</span>
          </button>
        </div>

        {/* Learning Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center mb-2">
            <span className="text-blue-500 text-lg mr-2">💡</span>
            <span className="text-blue-700 font-medium text-sm">Pro Tip</span>
          </div>
          <p className="text-blue-600 text-sm">
            Each myth you read earns you XP! Like and share myths to help others learn and earn bonus points. 
            Come back daily for new myth-busting content! 🎯
          </p>
        </div>
      </div>
    </div>
  );
};

export default MythFeed;