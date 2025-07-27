import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const PersonalizedLearning = () => {
  const { user } = useAuth();
  const [protectionProfile, setProtectionProfile] = useState(null);
  const [personalizedContent, setPersonalizedContent] = useState({
    myths: [],
    learningPaths: [],
    statutes: [],
    simulations: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  useEffect(() => {
    if (user) {
      loadPersonalizedContent();
    }
  }, [user]);

  const loadPersonalizedContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      // Get user's protection profile
      const profileResponse = await axios.get(`${API}/user/protection-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (profileResponse.data.success) {
        const profile = profileResponse.data.data;
        setProtectionProfile(profile);
        
        // Load personalized content based on protection type
        await loadContentByProtectionType(profile.protection_type, token);
      }
    } catch (error) {
      console.error('Failed to load personalized content:', error);
      setError('Failed to load personalized content');
    } finally {
      setLoading(false);
    }
  };

  const loadContentByProtectionType = async (protectionType, token) => {
    try {
      // Load myths filtered by protection type
      const mythsResponse = await axios.get(`${API}/myths/feed`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { protection_type: protectionType }
      });
      
      // Load learning paths filtered by protection type
      const pathsResponse = await axios.get(`${API}/learning/paths`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { protection_type: protectionType }
      });
      
      // Load relevant statutes
      const statutesResponse = await axios.get(`${API}/statutes/search`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { protection_type: protectionType }
      });
      
      // Load simulations
      const simulationsResponse = await axios.get(`${API}/simulations/list`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { protection_type: protectionType }
      });
      
      setPersonalizedContent({
        myths: mythsResponse.data.success ? mythsResponse.data.data : [],
        learningPaths: pathsResponse.data.success ? pathsResponse.data.data : [],
        statutes: statutesResponse.data.success ? statutesResponse.data.data : [],
        simulations: simulationsResponse.data.success ? simulationsResponse.data.data : []
      });
    } catch (error) {
      console.error('Failed to load content by protection type:', error);
    }
  };

  const getProtectionTypeInfo = (protectionType) => {
    const protectionInfo = {
      'RENTER': {
        icon: '🏠',
        title: 'Renter Protection',
        description: 'Housing, landlord-tenant, and rental rights',
        color: 'bg-blue-100 text-blue-800'
      },
      'WORKER': {
        icon: '👷',
        title: 'Worker Protection',
        description: 'Employment rights, workplace safety, and labor law',
        color: 'bg-green-100 text-green-800'
      },
      'STUDENT': {
        icon: '🎓',
        title: 'Student Protection',
        description: 'Education rights, campus safety, and academic freedom',
        color: 'bg-purple-100 text-purple-800'
      },
      'UNDOCUMENTED': {
        icon: '🛡️',
        title: 'Immigration Protection',
        description: 'Immigration rights, documentation, and community resources',
        color: 'bg-red-100 text-red-800'
      },
      'PROTESTER': {
        icon: '✊',
        title: 'Protest Rights',
        description: 'First Amendment rights, assembly, and demonstration law',
        color: 'bg-yellow-100 text-yellow-800'
      },
      'DISABLED': {
        icon: '♿',
        title: 'Disability Rights',
        description: 'ADA compliance, accessibility, and discrimination protection',
        color: 'bg-indigo-100 text-indigo-800'
      },
      'GENERAL': {
        icon: '⚖️',
        title: 'General Legal Protection',
        description: 'Constitutional rights and general legal knowledge',
        color: 'bg-gray-100 text-gray-800'
      }
    };
    
    return protectionInfo[protectionType] || protectionInfo['GENERAL'];
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const getFilteredContent = () => {
    if (selectedCategory === 'all') {
      return personalizedContent;
    }
    
    return {
      ...personalizedContent,
      [selectedCategory]: personalizedContent[selectedCategory] || []
    };
  };

  const handleContentClick = (contentType, contentId) => {
    // Track interaction for personalization
    trackInteraction(contentType, contentId);
    
    // Navigate to content (this would be implemented based on routing)
    console.log(`Navigating to ${contentType}:`, contentId);
  };

  const trackInteraction = async (contentType, contentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/ai/memory/track`, {
        interaction_type: contentType,
        topic_category: protectionProfile?.protection_type?.toLowerCase() || 'general',
        legal_concept: `${contentType}_${contentId}`,
        engagement_level: 0.7
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-book-page min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-forest-200">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-forest-200 rounded w-1/3"></div>
              <div className="h-4 bg-forest-200 rounded w-2/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-40 bg-forest-100 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-book-page min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-200">
            <div className="text-center">
              <span className="text-6xl mb-4 block">⚠️</span>
              <h2 className="text-2xl font-bold text-red-800 mb-2">Error Loading Content</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadPersonalizedContent}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredContent = getFilteredContent();
  const protectionInfo = getProtectionTypeInfo(protectionProfile?.protection_type);

  return (
    <div className="bg-book-page min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-forest-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-4xl mr-4">{protectionInfo.icon}</div>
              <div>
                <h1 className="text-3xl font-bold text-forest-800">Personalized Learning</h1>
                <p className="text-forest-600 mt-1">
                  Content tailored for your {protectionInfo.title}
                </p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full ${protectionInfo.color}`}>
              <span className="font-semibold">{protectionInfo.title}</span>
            </div>
          </div>
          <p className="text-forest-600 mt-4">{protectionInfo.description}</p>
        </div>

        {/* Content Categories */}
        <div className="mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {['all', 'myths', 'learningPaths', 'statutes', 'simulations'].map(category => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-forest-600 text-white'
                    : 'bg-white text-forest-600 border border-forest-200 hover:bg-forest-50'
                }`}
              >
                {category === 'all' ? 'All Content' : 
                 category === 'learningPaths' ? 'Learning Paths' :
                 category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          
          {/* Myths Section */}
          {(selectedCategory === 'all' || selectedCategory === 'myths') && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-forest-200">
              <h2 className="text-2xl font-bold text-forest-800 mb-4 flex items-center">
                <span className="mr-2">🔍</span>
                Myth Busting
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContent.myths.slice(0, 6).map((myth, index) => (
                  <div
                    key={index}
                    onClick={() => handleContentClick('myth', myth.id)}
                    className="p-4 rounded-lg border border-forest-200 hover:shadow-md cursor-pointer transition-all"
                  >
                    <h3 className="font-semibold text-forest-800 mb-2">{myth.title}</h3>
                    <p className="text-sm text-forest-600 mb-2">{myth.myth_statement}</p>
                    <div className="flex items-center text-xs text-forest-500">
                      <span className="mr-2">📚</span>
                      {myth.category}
                    </div>
                  </div>
                ))}
              </div>
              {filteredContent.myths.length === 0 && (
                <p className="text-center text-forest-500 py-8">No myths available for your protection type</p>
              )}
            </div>
          )}

          {/* Learning Paths Section */}
          {(selectedCategory === 'all' || selectedCategory === 'learningPaths') && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-forest-200">
              <h2 className="text-2xl font-bold text-forest-800 mb-4 flex items-center">
                <span className="mr-2">📚</span>
                Learning Paths
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredContent.learningPaths.slice(0, 4).map((path, index) => (
                  <div
                    key={index}
                    onClick={() => handleContentClick('learning_path', path.id)}
                    className="p-4 rounded-lg border border-forest-200 hover:shadow-md cursor-pointer transition-all"
                  >
                    <h3 className="font-semibold text-forest-800 mb-2">{path.title}</h3>
                    <p className="text-sm text-forest-600 mb-2">{path.description}</p>
                    <div className="flex items-center justify-between text-xs text-forest-500">
                      <span>{path.difficulty}</span>
                      <span>{path.xp_reward} XP</span>
                    </div>
                  </div>
                ))}
              </div>
              {filteredContent.learningPaths.length === 0 && (
                <p className="text-center text-forest-500 py-8">No learning paths available for your protection type</p>
              )}
            </div>
          )}

          {/* Statutes Section */}
          {(selectedCategory === 'all' || selectedCategory === 'statutes') && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-forest-200">
              <h2 className="text-2xl font-bold text-forest-800 mb-4 flex items-center">
                <span className="mr-2">📜</span>
                Relevant Statutes
              </h2>
              <div className="space-y-3">
                {filteredContent.statutes.slice(0, 5).map((statute, index) => (
                  <div
                    key={index}
                    onClick={() => handleContentClick('statute', statute.id)}
                    className="p-4 rounded-lg border border-forest-200 hover:shadow-md cursor-pointer transition-all"
                  >
                    <h3 className="font-semibold text-forest-800">{statute.title}</h3>
                    <p className="text-sm text-forest-600 mt-1">{statute.description}</p>
                    <div className="flex items-center text-xs text-forest-500 mt-2">
                      <span className="mr-2">🏛️</span>
                      {statute.jurisdiction}
                    </div>
                  </div>
                ))}
              </div>
              {filteredContent.statutes.length === 0 && (
                <p className="text-center text-forest-500 py-8">No statutes available for your protection type</p>
              )}
            </div>
          )}

          {/* Simulations Section */}
          {(selectedCategory === 'all' || selectedCategory === 'simulations') && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-forest-200">
              <h2 className="text-2xl font-bold text-forest-800 mb-4 flex items-center">
                <span className="mr-2">🎮</span>
                Practice Simulations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContent.simulations.slice(0, 6).map((simulation, index) => (
                  <div
                    key={index}
                    onClick={() => handleContentClick('simulation', simulation.id)}
                    className="p-4 rounded-lg border border-forest-200 hover:shadow-md cursor-pointer transition-all"
                  >
                    <h3 className="font-semibold text-forest-800 mb-2">{simulation.title}</h3>
                    <p className="text-sm text-forest-600 mb-2">{simulation.description}</p>
                    <div className="flex items-center justify-between text-xs text-forest-500">
                      <span>{simulation.difficulty}</span>
                      <span>{simulation.estimated_time} min</span>
                    </div>
                  </div>
                ))}
              </div>
              {filteredContent.simulations.length === 0 && (
                <p className="text-center text-forest-500 py-8">No simulations available for your protection type</p>
              )}
            </div>
          )}
        </div>

        {/* Action Center */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-forest-200 mt-6">
          <h2 className="text-2xl font-bold text-forest-800 mb-4 flex items-center">
            <span className="mr-2">🎯</span>
            Take Action
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleContentClick('quiz', 'protection_quiz')}
              className="p-4 bg-forest-50 rounded-lg border border-forest-200 hover:bg-forest-100 transition-colors"
            >
              <div className="text-2xl mb-2">📝</div>
              <h3 className="font-semibold text-forest-800">Take Quiz</h3>
              <p className="text-sm text-forest-600">Test your knowledge</p>
            </button>
            <button
              onClick={() => handleContentClick('community', 'questions')}
              className="p-4 bg-forest-50 rounded-lg border border-forest-200 hover:bg-forest-100 transition-colors"
            >
              <div className="text-2xl mb-2">💬</div>
              <h3 className="font-semibold text-forest-800">Ask Community</h3>
              <p className="text-sm text-forest-600">Get peer support</p>
            </button>
            <button
              onClick={() => handleContentClick('emergency', 'sos')}
              className="p-4 bg-forest-50 rounded-lg border border-forest-200 hover:bg-forest-100 transition-colors"
            >
              <div className="text-2xl mb-2">🚨</div>
              <h3 className="font-semibold text-forest-800">Emergency SOS</h3>
              <p className="text-sm text-forest-600">Get immediate help</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedLearning;