import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const SimulationPlayer = () => {
  const [simulations, setSimulations] = useState([]);
  const [selectedSimulation, setSelectedSimulation] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [currentNode, setCurrentNode] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState('selection'); // selection, playing, completed
  const [xpGained, setXpGained] = useState(0);
  const { user } = useAuth();

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  useEffect(() => {
    fetchSimulations();
  }, []);

  const fetchSimulations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/simulations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSimulations(response.data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch simulations:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSimulation = async (simulationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/simulations/${simulationId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const data = response.data.data;
        setSelectedSimulation(data.scenario);
        setActiveSession(data.progress_id);
        setCurrentNode(data.current_node);
        setProgress({ score: 0, path_taken: [] });
        setGameState('playing');
      }
    } catch (error) {
      console.error('Failed to start simulation:', error);
    }
  };

  const makeChoice = async (choiceIndex) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/simulations/progress/${activeSession}/choice`, {
        choice_index: choiceIndex
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const data = response.data.data;
        
        if (data.completed) {
          // Simulation completed
          setProgress(prev => ({
            ...prev,
            final_score: data.final_score,
            final_score_percentage: data.final_score_percentage,
            completion_time: data.completion_time,
            outcome_message: data.outcome_message,
            legal_explanation: data.legal_explanation
          }));
          setGameState('completed');
          
          if (data.total_xp_earned > 0) {
            setXpGained(data.total_xp_earned);
            setTimeout(() => setXpGained(0), 4000);
          }
        } else {
          // Continue simulation
          setCurrentNode(data.current_node);
          setProgress(prev => ({
            ...prev,
            score: data.current_score,
            last_choice_feedback: data.choice_feedback,
            immediate_consequence: data.immediate_consequence,
            points_earned: data.points_earned
          }));

          if (data.points_earned > 0) {
            setXpGained(data.points_earned);
            setTimeout(() => setXpGained(0), 3000);
          }
        }
      }
    } catch (error) {
      console.error('Failed to make choice:', error);
    }
  };

  const resetSimulation = () => {
    setSelectedSimulation(null);
    setActiveSession(null);
    setCurrentNode(null);
    setProgress(null);
    setGameState('selection');
  };

  const getCategoryEmoji = (category) => {
    const emojiMap = {
      traffic_stop: '🚔',
      police_encounter: '👮‍♂️',
      housing_dispute: '🏠',
      employment_issue: '💼',
      consumer_rights: '🛡️',
      court_appearance: '⚖️'
    };
    return emojiMap[category] || '📚';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-sage-300 border-t-sage-600 mb-4"></div>
          <p className="text-sage-600 font-medium">Loading legal simulations...</p>
        </div>
      </div>
    );
  }

  if (gameState === 'selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-emerald-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-sage-800 mb-4 flex items-center justify-center">
              <span className="mr-3">🎮</span>
              Legal Simulations
            </h1>
            <p className="text-sage-600 text-lg max-w-3xl mx-auto">
              Practice real-world legal scenarios in a safe environment. Make choices, learn from outcomes, 
              and build confidence for actual situations you might face.
            </p>
          </div>

          {/* Simulations Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {simulations.map((simulation) => (
              <div key={simulation.id} className="bg-white rounded-3xl shadow-sage-lg border border-sage-100 overflow-hidden hover:transform hover:scale-105 transition-all duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-sage-500 to-sage-600 p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{getCategoryEmoji(simulation.category)}</span>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(simulation.difficulty_level)}`}>
                      Level {simulation.difficulty_level}
                    </div>
                  </div>
                  <h2 className="text-xl font-bold mb-2">{simulation.title}</h2>
                  <div className="text-sage-100 text-sm">
                    {simulation.estimated_duration} minutes • {simulation.category.replace('_', ' ')}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-sage-700 mb-4 leading-relaxed">
                    {simulation.description}
                  </p>

                  {/* Learning Objectives */}
                  {simulation.learning_objectives && simulation.learning_objectives.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-sage-800 mb-2">🎯 You'll Learn:</h3>
                      <ul className="text-sm text-sage-600 space-y-1">
                        {simulation.learning_objectives.slice(0, 2).map((objective, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-sage-400 mr-2">•</span>
                            {objective}
                          </li>
                        ))}
                        {simulation.learning_objectives.length > 2 && (
                          <li className="text-sage-500 text-xs">
                            +{simulation.learning_objectives.length - 2} more objectives...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* User Progress */}
                  {simulation.user_completed && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center text-green-700 text-sm">
                        <span className="mr-2">✅</span>
                        Completed • Best Score: {simulation.user_best_score}%
                      </div>
                    </div>
                  )}

                  {simulation.user_attempts > 0 && !simulation.user_completed && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="text-blue-700 text-sm">
                        📊 Attempted {simulation.user_attempts} time{simulation.user_attempts !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}

                  {/* Start Button */}
                  <button
                    onClick={() => startSimulation(simulation.id)}
                    className="w-full bg-gradient-to-r from-sage-600 to-sage-700 hover:from-sage-700 hover:to-sage-800 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all duration-200"
                  >
                    {simulation.user_completed ? '🔄 Try Again' : '🚀 Start Simulation'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {simulations.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎭</div>
              <h2 className="text-2xl font-bold text-sage-800 mb-2">No Simulations Available</h2>
              <p className="text-sage-600">
                Legal simulations are being prepared. Check back soon for interactive scenarios!
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'playing' && currentNode) {
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

          {/* Header */}
          <div className="bg-white rounded-3xl shadow-sage-lg mb-6 border border-sage-100">
            <div className="p-6 border-b border-sage-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-3xl mr-4">{getCategoryEmoji(selectedSimulation.category)}</span>
                  <div>
                    <h1 className="text-2xl font-bold text-sage-800">{selectedSimulation.title}</h1>
                    <p className="text-sage-600">Current Score: {progress?.score || 0} points</p>
                  </div>
                </div>
                <button
                  onClick={resetSimulation}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  ← Back to Menu
                </button>
              </div>
            </div>

            {/* Feedback from Previous Choice */}
            {progress?.last_choice_feedback && (
              <div className="p-6 border-b border-sage-100 bg-blue-50">
                <div className="text-blue-800 font-medium mb-2">Feedback:</div>
                <div className="text-blue-700 mb-2">{progress.last_choice_feedback}</div>
                {progress.immediate_consequence && (
                  <div className="text-blue-600 text-sm italic">
                    "{progress.immediate_consequence}"
                  </div>
                )}
              </div>
            )}

            {/* Current Scenario */}
            <div className="p-6">
              <h2 className="text-xl font-bold text-sage-800 mb-4">{currentNode.title}</h2>
              <p className="text-sage-700 text-lg leading-relaxed mb-6">
                {currentNode.description}
              </p>

              {/* Choices */}
              <div className="space-y-4">
                <div className="text-sage-800 font-medium mb-3">What do you do?</div>
                {currentNode.choices.map((choice, index) => (
                  <button
                    key={index}
                    onClick={() => makeChoice(index)}
                    className="w-full text-left bg-sage-50 hover:bg-sage-100 border border-sage-200 hover:border-sage-300 rounded-2xl p-4 transition-all duration-200 group"
                  >
                    <div className="flex items-start">
                      <div className="bg-sage-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 group-hover:bg-sage-700 transition-colors">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sage-800 font-medium">
                          {choice.choice_text}
                        </div>
                        {choice.xp_value > 0 && (
                          <div className="text-gold-600 text-sm mt-1">
                            +{choice.xp_value} XP potential
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Legal Context */}
          {selectedSimulation.legal_context && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-center mb-3">
                <span className="text-blue-500 text-lg mr-2">⚖️</span>
                <span className="text-blue-700 font-medium">Legal Context</span>
              </div>
              <p className="text-blue-600 text-sm">
                {selectedSimulation.legal_context}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'completed') {
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

          {/* Completion Card */}
          <div className="bg-white rounded-3xl shadow-sage-lg border border-sage-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-gold-400 to-gold-500 p-8 text-center text-white">
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-3xl font-bold mb-2">Simulation Complete!</h1>
              <p className="text-gold-100">
                You've completed "{selectedSimulation?.title}"
              </p>
            </div>

            {/* Results */}
            <div className="p-8">
              {/* Score */}
              <div className="text-center mb-8">
                <div className="text-4xl font-bold text-sage-800 mb-2">
                  {progress?.final_score_percentage?.toFixed(0) || 0}%
                </div>
                <div className="text-sage-600">
                  Final Score: {progress?.final_score || 0} points
                </div>
                <div className="w-full bg-sage-200 rounded-full h-4 mt-4 max-w-md mx-auto">
                  <div 
                    className="bg-gradient-to-r from-gold-400 to-gold-500 h-4 rounded-full transition-all duration-1000"
                    style={{ width: `${progress?.final_score_percentage || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Outcome Message */}
              {progress?.outcome_message && (
                <div className="bg-sage-50 border border-sage-200 rounded-2xl p-6 mb-6">
                  <div className="text-sage-800 font-medium mb-2">Your Performance:</div>
                  <p className="text-sage-700">{progress.outcome_message}</p>
                </div>
              )}

              {/* Legal Explanation */}
              {progress?.legal_explanation && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-center mb-3">
                    <span className="text-blue-500 text-lg mr-2">📚</span>
                    <span className="text-blue-700 font-medium">Key Legal Lessons</span>
                  </div>
                  <p className="text-blue-600 leading-relaxed">{progress.legal_explanation}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-700">
                    {Math.floor((progress?.completion_time || 0) / 60)}:{String((progress?.completion_time || 0) % 60).padStart(2, '0')}
                  </div>
                  <div className="text-purple-600 text-sm">Time Taken</div>
                </div>
                <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gold-700">
                    +{xpGained || 0}
                  </div>
                  <div className="text-gold-600 text-sm">XP Earned</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={() => startSimulation(selectedSimulation.id)}
                  className="flex-1 bg-sage-600 hover:bg-sage-700 text-white font-bold py-3 px-6 rounded-2xl transition-colors"
                >
                  🔄 Try Again
                </button>
                <button
                  onClick={resetSimulation}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-2xl transition-colors"
                >
                  📚 More Simulations
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SimulationPlayer;