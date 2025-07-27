import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';
import axios from 'axios';

const TrophyWall = () => {
  const { user } = useAuth();
  const { userStats, levelProgress, refreshGamificationData } = useGamification();
  const [trophyData, setTrophyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkingUnlock, setCheckingUnlock] = useState(null);
  const [unlockModal, setUnlockModal] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  // Mock data for demonstration
  const mockTrophyData = {
    total_unlocks: 12,
    available_unlocks: 8,
    user_level: user?.level || 1,
    user_xp: user?.xp || 0,
    unlocks: [
      {
        id: 1,
        title: "Constitutional Scholar",
        description: "Master all constitutional rights and amendments",
        category: "constitutional",
        icon: "📜",
        color: "from-blue-500 to-blue-700",
        xp_required: 500,
        current_xp: user?.xp || 0,
        unlocked: (user?.xp || 0) >= 500,
        unlock_date: (user?.xp || 0) >= 500 ? new Date() : null,
        protection_type: "constitutional_rights",
        requirements: ["Complete 5 constitutional lessons", "Score 80% on constitutional quiz"],
        rewards: ["Access to advanced constitutional content", "Constitutional badge", "50 XP bonus"]
      },
      {
        id: 2,
        title: "Tenant Rights Champion",
        description: "Become an expert in housing and tenant rights",
        category: "housing",
        icon: "🏠",
        color: "from-green-500 to-green-700",
        xp_required: 300,
        current_xp: user?.xp || 0,
        unlocked: (user?.xp || 0) >= 300,
        unlock_date: (user?.xp || 0) >= 300 ? new Date() : null,
        protection_type: "housing_rights",
        requirements: ["Complete tenant rights course", "Practice 3 housing scenarios"],
        rewards: ["Tenant rights toolkit", "Housing law reference", "30 XP bonus"]
      },
      {
        id: 3,
        title: "Immigration Advocate",
        description: "Understand immigration law and defend rights",
        category: "immigration",
        icon: "🌎",
        color: "from-purple-500 to-purple-700",
        xp_required: 400,
        current_xp: user?.xp || 0,
        unlocked: (user?.xp || 0) >= 400,
        unlock_date: (user?.xp || 0) >= 400 ? new Date() : null,
        protection_type: "immigration_rights",
        requirements: ["Complete immigration course", "Pass immigration quiz"],
        rewards: ["Immigration law handbook", "Know Your Rights cards", "40 XP bonus"]
      },
      {
        id: 4,
        title: "Criminal Justice Guardian",
        description: "Protect yourself and others in the criminal justice system",
        category: "criminal",
        icon: "⚖️",
        color: "from-red-500 to-red-700",
        xp_required: 600,
        current_xp: user?.xp || 0,
        unlocked: (user?.xp || 0) >= 600,
        unlock_date: (user?.xp || 0) >= 600 ? new Date() : null,
        protection_type: "criminal_justice",
        requirements: ["Complete criminal justice course", "Master police encounter scenarios"],
        rewards: ["Criminal defense guide", "Police encounter scripts", "60 XP bonus"]
      },
      {
        id: 5,
        title: "Workers' Rights Defender",
        description: "Champion workplace rights and labor protections",
        category: "employment",
        icon: "👔",
        color: "from-yellow-500 to-orange-600",
        xp_required: 350,
        current_xp: user?.xp || 0,
        unlocked: (user?.xp || 0) >= 350,
        unlock_date: (user?.xp || 0) >= 350 ? new Date() : null,
        protection_type: "employment_rights",
        requirements: ["Complete employment law course", "Practice workplace scenarios"],
        rewards: ["Workers' rights handbook", "Employment law reference", "35 XP bonus"]
      },
      {
        id: 6,
        title: "Digital Privacy Protector",
        description: "Master digital rights and privacy protections",
        category: "privacy",
        icon: "🔒",
        color: "from-indigo-500 to-indigo-700",
        xp_required: 450,
        current_xp: user?.xp || 0,
        unlocked: (user?.xp || 0) >= 450,
        unlock_date: (user?.xp || 0) >= 450 ? new Date() : null,
        protection_type: "digital_privacy",
        requirements: ["Complete privacy course", "Master digital rights scenarios"],
        rewards: ["Privacy protection guide", "Digital security toolkit", "45 XP bonus"]
      }
    ]
  };

  useEffect(() => {
    if (user) {
      loadTrophyWall();
    }
  }, [user]);

  const loadTrophyWall = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/unlocks/trophy-wall`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setTrophyData(response.data.data);
      } else {
        setError('Failed to load trophy wall data');
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load trophy wall:', error);
      setError('Failed to load trophy wall data');
      setLoading(false);
    }
  };

  const attemptUnlock = async (protectionId) => {
    try {
      setCheckingUnlock(protectionId);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/unlocks/check-unlock`, 
        { protection_id: protectionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const result = response.data.data;
        
        if (result.can_unlock) {
          // Show unlock celebration modal
          setUnlockModal({
            protection: result.protection,
            celebration: result.celebration
          });
          
          // Refresh trophy wall and gamification data
          await loadTrophyWall();
          refreshGamificationData();
          
          // Trigger mascot celebration if available
          if (window.mascotWidget) {
            window.mascotWidget.triggerCelebration('rights_unlocked', {
              right_name: result.protection.statute_title,
              state: result.protection.state
            });
          }
        } else {
          // Show requirements modal
          setUnlockModal({
            canUnlock: false,
            missingRequirements: result.missing_requirements,
            alreadyUnlocked: result.already_unlocked
          });
        }
      }
    } catch (error) {
      console.error('Failed to check unlock:', error);
      setError('Failed to check unlock requirements');
    } finally {
      setCheckingUnlock(null);
    }
  };

  const getProtectionTypeColor = (type) => {
    switch (type) {
      case 'undocumented': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'renter': return 'bg-green-100 text-green-800 border-green-300';
      case 'protester': return 'bg-red-100 text-red-800 border-red-300';
      case 'student': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'worker': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'lgbtq': return 'bg-pink-100 text-pink-800 border-pink-300';
      case 'disabled': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'parent': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'senior': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-sage-100 text-sage-800 border-sage-300';
    }
  };

  const getProtectionTypeIcon = (type) => {
    switch (type) {
      case 'undocumented': return '📄';
      case 'renter': return '🏠';
      case 'protester': return '✊';
      case 'student': return '🎓';
      case 'worker': return '👷';
      case 'lgbtq': return '🏳️‍🌈';
      case 'disabled': return '♿';
      case 'parent': return '👨‍👩‍👧‍👦';
      case 'senior': return '👴';
      default: return '⚖️';
    }
  };

  const renderUnlockModal = () => {
    if (!unlockModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          {unlockModal.canUnlock === false ? (
            // Requirements not met
            <div className="text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {unlockModal.alreadyUnlocked ? 'Already Unlocked' : 'Requirements Not Met'}
              </h3>
              
              {unlockModal.alreadyUnlocked ? (
                <p className="text-gray-600 mb-4">You've already unlocked this protection.</p>
              ) : (
                <div className="mb-4">
                  <p className="text-gray-600 mb-2">To unlock this protection, you need to:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {unlockModal.missingRequirements?.map((req, index) => (
                      <li key={index} className="flex items-center">
                        <span className="mr-2">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <button
                onClick={() => setUnlockModal(null)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg py-2 px-4 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            // Successfully unlocked
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Protection Unlocked!</h3>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h4 className="font-bold text-green-800 mb-2">
                  {unlockModal.protection?.statute_title}
                </h4>
                <p className="text-sm text-green-700 mb-2">
                  {unlockModal.protection?.protection_description}
                </p>
                <div className="text-xs text-green-600">
                  {unlockModal.protection?.state && `${unlockModal.protection.state} • `}
                  {unlockModal.protection?.statute_code}
                </div>
              </div>
              
              {unlockModal.celebration && (
                <div className="bg-sage-50 border border-sage-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-sage-700">
                    {unlockModal.celebration.message}
                  </p>
                </div>
              )}
              
              <button
                onClick={() => setUnlockModal(null)}
                className="bg-sage-600 hover:bg-sage-700 text-white rounded-lg py-2 px-4 transition-colors"
              >
                Awesome!
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your trophy wall...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={loadTrophyWall}
              className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg py-2 px-4 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <span className="text-4xl">🏆</span>
            <h1 className="text-4xl font-bold text-gray-800">Trophy Wall</h1>
          </div>
          <p className="text-gray-600">
            Unlock real legal protections by completing lessons and earning XP
          </p>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {trophyData?.unlocked_protections?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Protections Unlocked</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {Math.round(trophyData?.trophy_wall?.completion_percentage || 0)}%
              </div>
              <div className="text-sm text-gray-600">Knowledge Vault Complete</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {trophyData?.trophy_wall?.total_protections_available || 0}
              </div>
              <div className="text-sm text-gray-600">Total Protections Available</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Knowledge Vault Progress</span>
              <span>{Math.round(trophyData?.trophy_wall?.completion_percentage || 0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-yellow-500 to-amber-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${trophyData?.trophy_wall?.completion_percentage || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Unlocked Protections */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🔓 Unlocked Protections</h2>
          
          {trophyData?.unlocked_protections?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trophyData.unlocked_protections.map((item, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getProtectionTypeIcon(item.protection.protection_type)}</span>
                      <span className="text-green-600 text-xl">✓</span>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs ${getProtectionTypeColor(item.protection.protection_type)}`}>
                      {item.protection.protection_type}
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-gray-800 mb-2">{item.protection.statute_title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{item.protection.protection_description}</p>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{item.protection.state}</span>
                    <span>{item.protection.statute_code}</span>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500">
                    Unlocked: {new Date(item.unlocked_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Protections Unlocked Yet</h3>
              <p className="text-gray-600">
                Complete lessons and earn XP to unlock real legal protections in your area!
              </p>
            </div>
          )}
        </div>

        {/* Available Protections to Unlock */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🎯 Available to Unlock</h2>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-600 mb-4">
              Complete more lessons and earn XP to unlock additional protections. Here are some examples:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sample protections - in real app, these would come from backend */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">🏠</span>
                  <span className="text-gray-400">🔒</span>
                </div>
                <h4 className="font-medium text-gray-700">Tenant Right to Repair</h4>
                <p className="text-sm text-gray-500 mb-2">
                  California Civil Code §1942 - Right to withhold rent for repairs
                </p>
                <div className="text-xs text-gray-400">
                  Requirements: Complete 3 housing lessons • Earn 150 XP
                </div>
                <button
                  onClick={() => attemptUnlock('sample-protection-1')}
                  disabled={checkingUnlock === 'sample-protection-1'}
                  className="mt-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg py-1 px-3 text-sm transition-colors disabled:opacity-50"
                >
                  {checkingUnlock === 'sample-protection-1' ? 'Checking...' : 'Check Requirements'}
                </button>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">✊</span>
                  <span className="text-gray-400">🔒</span>
                </div>
                <h4 className="font-medium text-gray-700">Protest Assembly Rights</h4>
                <p className="text-sm text-gray-500 mb-2">
                  1st Amendment - Right to peaceful assembly and protest
                </p>
                <div className="text-xs text-gray-400">
                  Requirements: Complete 2 protest lessons • Earn 100 XP
                </div>
                <button
                  onClick={() => attemptUnlock('sample-protection-2')}
                  disabled={checkingUnlock === 'sample-protection-2'}
                  className="mt-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg py-1 px-3 text-sm transition-colors disabled:opacity-50"
                >
                  {checkingUnlock === 'sample-protection-2' ? 'Checking...' : 'Check Requirements'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* User Progress */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Progress</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-sage-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">🎓</span>
                <span className="font-medium text-sage-800">Learning Progress</span>
              </div>
              <div className="text-sm text-sage-700">
                Level {levelProgress?.current_level || 1} • {user?.xp || 0} XP
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">📚</span>
                <span className="font-medium text-blue-800">Lessons Completed</span>
              </div>
              <div className="text-sm text-blue-700">
                {userStats?.learning_paths_completed || 0} learning paths completed
              </div>
            </div>
          </div>
        </div>

        {/* Unlock Modal */}
        {renderUnlockModal()}
      </div>
    </div>
  );
};

export default TrophyWall;