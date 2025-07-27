import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const LearningPaths = () => {
  const [learningPaths, setLearningPaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [userProgress, setUserProgress] = useState([]);
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState([]);
  const [personalization, setPersonalization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('overview'); // overview, path-detail, personalization, progress
  const [xpGained, setXpGained] = useState(0);
  const { user } = useAuth();

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  const getPathTypeColorClasses = (pathType) => {
    const colorClasses = {
      tenant_protection: { 
        gradient: 'from-blue-400 to-blue-600',
        bgGradient: 'from-blue-50 to-blue-100',
        progressGradient: 'from-blue-400 to-blue-500',
        buttonGradient: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
      },
      immigration_rights: { 
        gradient: 'from-green-400 to-green-600',
        bgGradient: 'from-green-50 to-green-100',
        progressGradient: 'from-green-400 to-green-500',
        buttonGradient: 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
      },
      student_rights: { 
        gradient: 'from-purple-400 to-purple-600',
        bgGradient: 'from-purple-50 to-purple-100',
        progressGradient: 'from-purple-400 to-purple-500',
        buttonGradient: 'from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
      },
      criminal_defense: { 
        gradient: 'from-red-400 to-red-600',
        bgGradient: 'from-red-50 to-red-100',
        progressGradient: 'from-red-400 to-red-500',
        buttonGradient: 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
      },
      employment_rights: { 
        gradient: 'from-orange-400 to-orange-600',
        bgGradient: 'from-orange-50 to-orange-100',
        progressGradient: 'from-orange-400 to-orange-500',
        buttonGradient: 'from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800'
      },
      consumer_protection: { 
        gradient: 'from-cyan-400 to-cyan-600',
        bgGradient: 'from-cyan-50 to-cyan-100',
        progressGradient: 'from-cyan-400 to-cyan-500',
        buttonGradient: 'from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800'
      },
      protest_rights: { 
        gradient: 'from-pink-400 to-pink-600',
        bgGradient: 'from-pink-50 to-pink-100',
        progressGradient: 'from-pink-400 to-pink-500',
        buttonGradient: 'from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800'
      },
      family_law: { 
        gradient: 'from-emerald-400 to-emerald-600',
        bgGradient: 'from-emerald-50 to-emerald-100',
        progressGradient: 'from-emerald-400 to-emerald-500',
        buttonGradient: 'from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800'
      },
      general_legal_literacy: { 
        gradient: 'from-gray-400 to-gray-600',
        bgGradient: 'from-gray-50 to-gray-100',
        progressGradient: 'from-gray-400 to-gray-500',
        buttonGradient: 'from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800'
      }
    };
    return colorClasses[pathType] || colorClasses.general_legal_literacy;
  };

  const pathTypeLabels = {
    tenant_protection: { label: 'Tenant Rights', emoji: '🏠', color: 'blue' },
    immigration_rights: { label: 'Immigration Rights', emoji: '🛡️', color: 'green' },
    student_rights: { label: 'Student Rights', emoji: '🎓', color: 'purple' },
    criminal_defense: { label: 'Criminal Defense', emoji: '⚖️', color: 'red' },
    employment_rights: { label: 'Employment Rights', emoji: '💼', color: 'orange' },
    consumer_protection: { label: 'Consumer Rights', emoji: '🛡️', color: 'cyan' },
    protest_rights: { label: 'Protest Rights', emoji: '✊', color: 'pink' },
    family_law: { label: 'Family Law', emoji: '👨‍👩‍👧‍👦', color: 'emerald' },
    general_legal_literacy: { label: 'General Legal Knowledge', emoji: '📚', color: 'gray' }
  };

  useEffect(() => {
    if (view === 'overview') {
      fetchLearningPaths();
      fetchUserProgress();
      fetchPersonalization();
      fetchRecommendations();
    }
  }, [view]);

  const fetchLearningPaths = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/learning-paths?personalized=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setLearningPaths(response.data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch learning paths:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/learning-paths/user/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUserProgress(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user progress:', error);
    }
  };

  const fetchPersonalization = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/personalization`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPersonalization(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch personalization:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/recommendations?content_types=learning_paths&limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPersonalizedRecommendations(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    }
  };

  const startLearningPath = async (pathId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/learning-paths/${pathId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const pathData = response.data.data;
        setSelectedPath(pathData.path_info);
        setView('path-detail');
        fetchUserProgress(); // Refresh progress
      }
    } catch (error) {
      console.error('Failed to start learning path:', error);
      alert('Failed to start learning path. Please check prerequisites.');
    }
  };

  const fetchPathDetail = async (pathId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/learning-paths/${pathId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSelectedPath(response.data.data);
        setView('path-detail');
      }
    } catch (error) {
      console.error('Failed to fetch path detail:', error);
    }
  };

  const completeNode = async (pathId, nodeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/learning-paths/${pathId}/nodes/${nodeId}/complete`, {
        completion_data: { timestamp: new Date().toISOString() }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const data = response.data.data;
        
        // Show XP gain
        if (data.xp_earned > 0) {
          setXpGained(data.xp_earned);
          setTimeout(() => setXpGained(0), 3000);
        }

        // Refresh path detail
        fetchPathDetail(pathId);
        
        // Show completion message
        if (data.path_completed) {
          alert(`🎉 Congratulations! You've completed this learning path and earned ${data.total_xp_earned} total XP!`);
        } else if (data.newly_unlocked_nodes.length > 0) {
          alert(`Great job! You've unlocked ${data.newly_unlocked_nodes.length} new learning nodes.`);
        }
      }
    } catch (error) {
      console.error('Failed to complete node:', error);
    }
  };

  const getPathTypeInfo = (pathType) => {
    return pathTypeLabels[pathType] || { label: pathType, emoji: '📚', color: 'gray' };
  };

  const getDifficultyColor = (level) => {
    const colors = {
      1: 'bg-green-100 text-green-700 border-green-200',
      2: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      3: 'bg-orange-100 text-orange-700 border-orange-200',
      4: 'bg-red-100 text-red-700 border-red-200',
      5: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return colors[level] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getNodeTypeIcon = (nodeType) => {
    const icons = {
      myth: '🎯',
      simulation: '🎮',
      qa_topic: '💬',
      ai_session: '🤖',
      assessment: '📝'
    };
    return icons[nodeType] || '📚';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-sage-300 border-t-sage-600 mb-4"></div>
          <p className="text-sage-600 font-medium">Loading learning paths...</p>
        </div>
      </div>
    );
  }

  if (view === 'path-detail' && selectedPath) {
    return (
      <PathDetailView 
        path={selectedPath}
        onBack={() => setView('overview')}
        onCompleteNode={completeNode}
        xpGained={xpGained}
      />
    );
  }

  if (view === 'personalization') {
    return (
      <PersonalizationSetup 
        currentPersonalization={personalization}
        onBack={() => setView('overview')}
        onComplete={() => {
          setView('overview');
          fetchLearningPaths();
          fetchRecommendations();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* XP Gain Animation */}
        {xpGained > 0 && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-gold-500 text-white rounded-full px-4 py-2 font-bold shadow-lg animate-bounce">
              +{xpGained} XP! 🌟
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-sage-800 mb-4 flex items-center justify-center">
            <span className="mr-3">🗺️</span>
            Advanced Learning Paths
          </h1>
          <p className="text-sage-600 text-lg max-w-4xl mx-auto">
            Personalized learning journeys that adapt to your interests and goals. Master legal concepts through structured, 
            gamified paths that integrate myths, simulations, community discussions, and AI assistance.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-sage border border-sage-100 mb-8">
          <div className="flex flex-wrap justify-center p-2">
            <button
              onClick={() => setView('overview')}
              className={`px-6 py-3 rounded-xl font-medium transition-colors mx-2 mb-2 ${
                view === 'overview' 
                  ? 'bg-sage-600 text-white' 
                  : 'text-sage-600 hover:bg-sage-50'
              }`}
            >
              🗺️ Learning Paths
            </button>
            <button
              onClick={() => setView('progress')}
              className={`px-6 py-3 rounded-xl font-medium transition-colors mx-2 mb-2 ${
                view === 'progress' 
                  ? 'bg-sage-600 text-white' 
                  : 'text-sage-600 hover:bg-sage-50'
              }`}
            >
              📊 My Progress
            </button>
            <button
              onClick={() => setView('personalization')}
              className={`px-6 py-3 rounded-xl font-medium transition-colors mx-2 mb-2 ${
                view === 'personalization' 
                  ? 'bg-sage-600 text-white' 
                  : 'text-sage-600 hover:bg-sage-50'
              }`}
            >
              ⚙️ Personalize
            </button>
          </div>
        </div>

        {view === 'overview' && (
          <>
            {/* Personalized Recommendations */}
            {personalizedRecommendations.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-sage-800 mb-4 flex items-center">
                  <span className="mr-2">✨</span>
                  Recommended for You
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {personalizedRecommendations.slice(0, 3).map((rec) => (
                    <div key={rec.content_id} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl shadow-lg border border-purple-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl">🎯</span>
                        <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                          {Math.round(rec.confidence_score * 100)}% match
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-purple-800 mb-2">{rec.title}</h3>
                      <p className="text-purple-600 text-sm mb-3">{rec.description}</p>
                      <div className="text-purple-500 text-xs mb-4">💡 {rec.reason}</div>
                      <div className="flex items-center justify-between text-sm text-purple-600">
                        <span>⏱️ {rec.estimated_time} min</span>
                        <span>🏆 {rec.xp_potential} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Progress */}
            {userProgress.filter(p => !p.is_completed).length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-sage-800 mb-4 flex items-center">
                  <span className="mr-2">🚀</span>
                  Continue Learning
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userProgress.filter(p => !p.is_completed).map((progress) => {
                    const pathTypeInfo = getPathTypeInfo(progress.path_type);
                    return (
                      <div key={progress.learning_path_id} className="bg-white rounded-3xl shadow-sage-lg border border-sage-100 overflow-hidden hover:shadow-sage-xl transition-shadow">
                        <div className={`bg-gradient-to-r from-${pathTypeInfo.color}-400 to-${pathTypeInfo.color}-600 p-6 text-white`}>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-3xl">{pathTypeInfo.emoji}</span>
                            <div className="bg-white bg-opacity-20 rounded-full px-3 py-1 text-xs font-medium">
                              {Math.round(progress.progress_percentage)}% Complete
                            </div>
                          </div>
                          <h3 className="text-xl font-bold">{progress.path_title}</h3>
                        </div>
                        <div className="p-6">
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-sage-600">Progress</span>
                              <span className="text-sm font-medium text-sage-800">{Math.round(progress.progress_percentage)}%</span>
                            </div>
                            <div className="w-full bg-sage-200 rounded-full h-3">
                              <div 
                                className={`bg-gradient-to-r from-${pathTypeInfo.color}-400 to-${pathTypeInfo.color}-500 h-3 rounded-full transition-all duration-500`}
                                style={{ width: `${progress.progress_percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-sage-600 text-sm">
                              🏆 {progress.total_xp_earned} XP earned
                            </div>
                          </div>
                          <button
                            onClick={() => fetchPathDetail(progress.learning_path_id)}
                            className={`w-full bg-gradient-to-r from-${pathTypeInfo.color}-600 to-${pathTypeInfo.color}-700 hover:from-${pathTypeInfo.color}-700 hover:to-${pathTypeInfo.color}-800 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-200`}
                          >
                            Continue Path →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Learning Paths */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-sage-800 mb-4 flex items-center">
                <span className="mr-2">📚</span>
                All Learning Paths
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {learningPaths.map((path) => {
                  const pathTypeInfo = getPathTypeInfo(path.path_type);
                  return (
                    <div key={path.id} className="bg-white rounded-3xl shadow-sage-lg border border-sage-100 overflow-hidden hover:shadow-sage-xl transition-shadow">
                      <div className={`bg-gradient-to-r from-${pathTypeInfo.color}-400 to-${pathTypeInfo.color}-600 p-6 text-white`}>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-3xl">{pathTypeInfo.emoji}</span>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(path.difficulty_level)}`}>
                            Level {path.difficulty_level}
                          </div>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{path.title}</h3>
                        <div className="text-sm opacity-90">
                          {path.estimated_duration} minutes • {pathTypeInfo.label}
                        </div>
                      </div>

                      <div className="p-6">
                        <p className="text-sage-700 mb-4 leading-relaxed">{path.description}</p>

                        {/* Learning Objectives */}
                        {path.learning_objectives && path.learning_objectives.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-sage-800 mb-2">🎯 You'll Learn:</h4>
                            <ul className="text-sm text-sage-600 space-y-1">
                              {path.learning_objectives.slice(0, 2).map((objective, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-sage-400 mr-2">•</span>
                                  {objective}
                                </li>
                              ))}
                              {path.learning_objectives.length > 2 && (
                                <li className="text-sage-500 text-xs">
                                  +{path.learning_objectives.length - 2} more objectives...
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        {/* User Progress */}
                        {path.user_started && (
                          <div className="mb-4 bg-sage-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sage-700 text-sm font-medium">Your Progress</span>
                              <span className="text-sage-600 text-sm">{Math.round(path.user_progress)}%</span>
                            </div>
                            <div className="w-full bg-sage-200 rounded-full h-2">
                              <div 
                                className={`bg-gradient-to-r from-${pathTypeInfo.color}-400 to-${pathTypeInfo.color}-500 h-2 rounded-full`}
                                style={{ width: `${path.user_progress}%` }}
                              ></div>
                            </div>
                            {path.user_completed && (
                              <div className="text-green-600 text-sm mt-2 flex items-center">
                                <span className="mr-1">✅</span>
                                Completed • {path.user_xp_earned} XP earned
                              </div>
                            )}
                          </div>
                        )}

                        {/* Personalization Info */}
                        {path.personalized_reason && (
                          <div className="mb-4 bg-blue-50 rounded-lg p-3">
                            <div className="text-blue-700 text-sm">
                              <span className="font-medium">Why this is recommended:</span><br />
                              {path.personalized_reason}
                            </div>
                          </div>
                        )}

                        {/* Prerequisites */}
                        {!path.prerequisites_met && (
                          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="text-yellow-700 text-sm">
                              🔒 Prerequisites required. Complete other learning paths first.
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <button
                          onClick={() => path.user_started ? fetchPathDetail(path.id) : startLearningPath(path.id)}
                          disabled={!path.prerequisites_met}
                          className={`w-full font-bold py-3 px-6 rounded-2xl transition-all duration-200 ${
                            !path.prerequisites_met
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : path.user_completed
                              ? `bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white`
                              : path.user_started
                              ? `bg-gradient-to-r from-${pathTypeInfo.color}-600 to-${pathTypeInfo.color}-700 hover:from-${pathTypeInfo.color}-700 hover:to-${pathTypeInfo.color}-800 text-white`
                              : `bg-gradient-to-r from-sage-600 to-sage-700 hover:from-sage-700 hover:to-sage-800 text-white`
                          }`}
                        >
                          {!path.prerequisites_met
                            ? '🔒 Prerequisites Required'
                            : path.user_completed
                            ? '✅ Review Path'
                            : path.user_started
                            ? '▶️ Continue Path'
                            : '🚀 Start Learning'
                          }
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {view === 'progress' && <ProgressView userProgress={userProgress} pathTypeLabels={pathTypeLabels} />}
      </div>
    </div>
  );
};

// Path Detail View Component
const PathDetailView = ({ path, onBack, onCompleteNode, xpGained }) => {
  const getNodeTypeIcon = (nodeType) => {
    const icons = {
      myth: '🎯',
      simulation: '🎮',
      qa_topic: '💬',
      ai_session: '🤖',
      assessment: '📝'
    };
    return icons[nodeType] || '📚';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-emerald-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* XP Gain Animation */}
        {xpGained > 0 && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-gold-500 text-white rounded-full px-4 py-2 font-bold shadow-lg animate-bounce">
              +{xpGained} XP! 🌟
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-sage-600 hover:text-sage-800 font-medium transition-colors"
          >
            ← Back to Learning Paths
          </button>
        </div>

        {/* Path Header */}
        <div className="bg-white rounded-3xl shadow-sage-lg border border-sage-100 mb-6">
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-sage-800 mb-4">{path.title}</h1>
                <p className="text-sage-600 text-lg mb-4">{path.description}</p>
                <div className="flex items-center space-x-4 text-sm text-sage-500">
                  <span>⏱️ {path.estimated_duration} minutes</span>
                  <span>📊 Level {path.difficulty_level}</span>
                  <span>🏆 {path.total_xp_reward} XP</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {path.user_progress && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-sage-700">Overall Progress</span>
                  <span className="text-sm text-sage-600">{Math.round(path.user_progress.progress_percentage)}%</span>
                </div>
                <div className="w-full bg-sage-200 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-gold-400 to-gold-500 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${path.user_progress.progress_percentage}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Learning Objectives */}
            {path.learning_objectives && path.learning_objectives.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h3 className="text-blue-800 font-bold mb-3">🎯 Learning Objectives</h3>
                <ul className="text-blue-700 space-y-2">
                  {path.learning_objectives.map((objective, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Learning Nodes */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-sage-800">Learning Journey</h2>
          
          {path.path_nodes && path.path_nodes.map((node, index) => (
            <div
              key={node.id}
              className={`bg-white rounded-3xl shadow-sage border transition-all duration-200 ${
                node.is_unlocked 
                  ? 'border-sage-200 hover:shadow-sage-lg' 
                  : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                      node.is_completed 
                        ? 'bg-green-100 text-green-600' 
                        : node.is_unlocked 
                        ? 'bg-sage-100 text-sage-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {node.is_completed ? '✅' : getNodeTypeIcon(node.node_type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className={`text-xl font-bold ${
                          node.is_unlocked ? 'text-sage-800' : 'text-gray-500'
                        }`}>
                          {node.title}
                        </h3>
                        {node.is_completed && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                            Completed
                          </span>
                        )}
                        {!node.is_unlocked && (
                          <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs font-medium">
                            🔒 Locked
                          </span>
                        )}
                      </div>
                      
                      <p className={`mb-4 ${
                        node.is_unlocked ? 'text-sage-600' : 'text-gray-500'
                      }`}>
                        {node.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm">
                          <span className={node.is_unlocked ? 'text-sage-500' : 'text-gray-400'}>
                            ⏱️ {node.estimated_minutes} min
                          </span>
                          <span className={node.is_unlocked ? 'text-gold-600' : 'text-gray-400'}>
                            🏆 {node.xp_reward} XP
                          </span>
                          {node.xp_required > 0 && (
                            <span className={node.is_unlocked ? 'text-purple-600' : 'text-gray-400'}>
                              🔓 {node.xp_required} XP required
                            </span>
                          )}
                        </div>
                        
                        {node.is_unlocked && !node.is_completed && (
                          <button
                            onClick={() => onCompleteNode(path.id, node.id)}
                            className="bg-sage-600 hover:bg-sage-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                          >
                            Start Node
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Personalization Setup Component
const PersonalizationSetup = ({ currentPersonalization, onBack, onComplete }) => {
  const [formData, setFormData] = useState({
    primary_interests: currentPersonalization?.primary_interests || [],
    user_situation: currentPersonalization?.user_situation || [],
    learning_style: currentPersonalization?.learning_style || 'balanced',
    weekly_time_commitment: currentPersonalization?.weekly_time_commitment || 60,
    preferred_difficulty: currentPersonalization?.preferred_difficulty || 2,
    content_preferences: currentPersonalization?.content_preferences || {
      myths: true,
      simulations: true,
      qa_topics: true,
      ai_sessions: true
    }
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  const interests = [
    { value: 'tenant_protection', label: 'Tenant Rights & Housing', emoji: '🏠' },
    { value: 'immigration_rights', label: 'Immigration Rights', emoji: '🛡️' },
    { value: 'student_rights', label: 'Student Rights', emoji: '🎓' },
    { value: 'criminal_defense', label: 'Criminal Defense', emoji: '⚖️' },
    { value: 'employment_rights', label: 'Employment Rights', emoji: '💼' },
    { value: 'consumer_protection', label: 'Consumer Protection', emoji: '🛡️' },
    { value: 'protest_rights', label: 'Protest Rights', emoji: '✊' },
    { value: 'family_law', label: 'Family Law', emoji: '👨‍👩‍👧‍👦' },
    { value: 'general_legal_literacy', label: 'General Legal Knowledge', emoji: '📚' }
  ];

  const situations = [
    { value: 'renter', label: 'I rent my home', emoji: '🏠' },
    { value: 'student', label: 'I am a student', emoji: '🎓' },
    { value: 'immigrant', label: 'I am an immigrant', emoji: '🌍' },
    { value: 'protester', label: 'I participate in protests', emoji: '✊' },
    { value: 'employee', label: 'I am employed', emoji: '💼' },
    { value: 'parent', label: 'I am a parent', emoji: '👶' },
    { value: 'business_owner', label: 'I own a business', emoji: '🏢' }
  ];

  const learningStyles = [
    { value: 'visual', label: 'Visual', description: 'I prefer charts, diagrams, and visual content' },
    { value: 'interactive', label: 'Interactive', description: 'I learn best through simulations and hands-on practice' },
    { value: 'reading', label: 'Reading', description: 'I prefer text-based content and detailed explanations' },
    { value: 'balanced', label: 'Balanced', description: 'I enjoy a mix of different learning approaches' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/personalization`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onComplete();
    } catch (error) {
      console.error('Failed to update personalization:', error);
    }
  };

  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      primary_interests: prev.primary_interests.includes(interest)
        ? prev.primary_interests.filter(i => i !== interest)
        : [...prev.primary_interests, interest]
    }));
  };

  const handleSituationToggle = (situation) => {
    setFormData(prev => ({
      ...prev,
      user_situation: prev.user_situation.includes(situation)
        ? prev.user_situation.filter(s => s !== situation)
        : [...prev.user_situation, situation]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-emerald-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-sage-lg border border-sage-100">
          <div className="p-6 border-b border-sage-100">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-sage-800">Personalize Your Learning</h1>
              <button
                onClick={onBack}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                ← Back
              </button>
            </div>
            <p className="text-sage-600 mt-2">
              Help us recommend the most relevant content for your legal learning journey.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Primary Interests */}
            <div>
              <h3 className="text-lg font-bold text-sage-800 mb-4">What legal topics interest you most?</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {interests.map((interest) => (
                  <button
                    key={interest.value}
                    type="button"
                    onClick={() => handleInterestToggle(interest.value)}
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                      formData.primary_interests.includes(interest.value)
                        ? 'border-sage-500 bg-sage-50 text-sage-800'
                        : 'border-gray-200 hover:border-sage-300 text-gray-700'
                    }`}
                  >
                    <div className="text-2xl mb-2">{interest.emoji}</div>
                    <div className="font-medium text-sm">{interest.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* User Situation */}
            <div>
              <h3 className="text-lg font-bold text-sage-800 mb-4">Which situations apply to you?</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {situations.map((situation) => (
                  <button
                    key={situation.value}
                    type="button"
                    onClick={() => handleSituationToggle(situation.value)}
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                      formData.user_situation.includes(situation.value)
                        ? 'border-sage-500 bg-sage-50 text-sage-800'
                        : 'border-gray-200 hover:border-sage-300 text-gray-700'
                    }`}
                  >
                    <div className="text-2xl mb-2">{situation.emoji}</div>
                    <div className="font-medium text-sm">{situation.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Learning Style */}
            <div>
              <h3 className="text-lg font-bold text-sage-800 mb-4">How do you prefer to learn?</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {learningStyles.map((style) => (
                  <label
                    key={style.value}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                      formData.learning_style === style.value
                        ? 'border-sage-500 bg-sage-50'
                        : 'border-gray-200 hover:border-sage-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="learning_style"
                      value={style.value}
                      checked={formData.learning_style === style.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, learning_style: e.target.value }))}
                      className="sr-only"
                    />
                    <div className="font-medium text-sage-800 mb-1">{style.label}</div>
                    <div className="text-sm text-sage-600">{style.description}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* Time Commitment */}
            <div>
              <h3 className="text-lg font-bold text-sage-800 mb-4">Weekly Time Commitment</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sage-600">Time per week:</span>
                  <span className="font-medium text-sage-800">{formData.weekly_time_commitment} minutes</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="300"
                  step="15"
                  value={formData.weekly_time_commitment}
                  onChange={(e) => setFormData(prev => ({ ...prev, weekly_time_commitment: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-sage-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-sage-500">
                  <span>15 min</span>
                  <span>2.5 hours</span>
                  <span>5 hours</span>
                </div>
              </div>
            </div>

            {/* Difficulty Preference */}
            <div>
              <h3 className="text-lg font-bold text-sage-800 mb-4">Preferred Difficulty Level</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sage-600">Difficulty:</span>
                  <span className="font-medium text-sage-800">Level {formData.preferred_difficulty}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.preferred_difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferred_difficulty: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-sage-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-sage-500">
                  <span>Beginner</span>
                  <span>Intermediate</span>
                  <span>Advanced</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-sage-600 hover:bg-sage-700 text-white font-bold py-4 px-8 rounded-2xl transition-colors"
            >
              Save Personalization Preferences
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Progress View Component
const ProgressView = ({ userProgress, pathTypeLabels }) => {
  const completedPaths = userProgress.filter(p => p.is_completed);
  const inProgressPaths = userProgress.filter(p => !p.is_completed && p.progress_percentage > 0);
  const totalXp = userProgress.reduce((sum, p) => sum + p.total_xp_earned, 0);

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-gold-50 to-yellow-50 rounded-3xl p-6 border border-gold-200">
          <div className="text-3xl mb-2">🏆</div>
          <div className="text-2xl font-bold text-gold-800">{totalXp}</div>
          <div className="text-gold-600">Total XP Earned</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-6 border border-green-200">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold text-green-800">{completedPaths.length}</div>
          <div className="text-green-600">Paths Completed</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-6 border border-blue-200">
          <div className="text-3xl mb-2">🚀</div>
          <div className="text-2xl font-bold text-blue-800">{inProgressPaths.length}</div>
          <div className="text-blue-600">Paths In Progress</div>
        </div>
      </div>

      {/* Completed Paths */}
      {completedPaths.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-sage-800 mb-4 flex items-center">
            <span className="mr-2">✅</span>
            Completed Learning Paths
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {completedPaths.map((progress) => {
              const pathTypeInfo = pathTypeLabels[progress.path_type] || { label: progress.path_type, emoji: '📚', color: 'gray' };
              return (
                <div key={progress.learning_path_id} className="bg-white rounded-2xl shadow-sage border border-sage-100 p-6">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{pathTypeInfo.emoji}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sage-800">{progress.path_title}</h4>
                      <div className="text-sm text-sage-600">
                        Completed • {progress.total_xp_earned} XP earned
                      </div>
                      <div className="text-xs text-sage-500 mt-1">
                        Finished on {new Date(progress.completed_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-green-600 text-2xl">🏆</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* In Progress Paths */}
      {inProgressPaths.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-sage-800 mb-4 flex items-center">
            <span className="mr-2">🚀</span>
            Paths In Progress
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {inProgressPaths.map((progress) => {
              const pathTypeInfo = pathTypeLabels[progress.path_type] || { label: progress.path_type, emoji: '📚', color: 'gray' };
              return (
                <div key={progress.learning_path_id} className="bg-white rounded-2xl shadow-sage border border-sage-100 p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="text-3xl">{pathTypeInfo.emoji}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sage-800">{progress.path_title}</h4>
                      <div className="text-sm text-sage-600">
                        {Math.round(progress.progress_percentage)}% complete • {progress.total_xp_earned} XP earned
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-sage-200 rounded-full h-3">
                    <div 
                      className={`bg-gradient-to-r from-${pathTypeInfo.color}-400 to-${pathTypeInfo.color}-500 h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${progress.progress_percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {userProgress.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-2xl font-bold text-sage-800 mb-2">Start Your Learning Journey</h3>
          <p className="text-sage-600">
            You haven't started any learning paths yet. Begin with a personalized path to start earning XP!
          </p>
        </div>
      )}
    </div>
  );
};

export default LearningPaths;