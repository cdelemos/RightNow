import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const SuggestionEngine = ({ onSuggestionClick }) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  useEffect(() => {
    if (user) {
      loadSuggestions();
    }
  }, [user]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/ai/suggestions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSuggestions(response.data.data.suggestions || []);
      } else {
        setError('Failed to load suggestions');
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      setError('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const dismissSuggestion = async (suggestionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/ai/suggestions/${suggestionId}/dismiss`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    } catch (error) {
      console.error('Failed to dismiss suggestion:', error);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }
    
    // Track interaction
    trackInteraction(suggestion);
  };

  const trackInteraction = async (suggestion) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/ai/memory/track`, {
        interaction_type: 'suggestion_click',
        topic_category: suggestion.category,
        legal_concept: suggestion.title,
        engagement_level: 0.8
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'protection': return '🛡️';
      case 'learning_path': return '📚';
      case 'myth': return '🔍';
      case 'statute': return '📜';
      case 'simulation': return '🎮';
      default: return '💡';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 3: return 'border-red-300 bg-red-50';
      case 2: return 'border-yellow-300 bg-yellow-50';
      default: return 'border-forest-300 bg-forest-50';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 border border-forest-100">
        <div className="animate-pulse">
          <div className="h-4 bg-forest-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-forest-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 border border-red-200">
        <div className="text-red-600 text-sm flex items-center">
          <span className="mr-2">⚠️</span>
          {error}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 border border-forest-100">
        <div className="text-center text-forest-600">
          <span className="text-2xl block mb-2">✨</span>
          <p className="text-sm">No new suggestions right now</p>
          <p className="text-xs text-forest-500 mt-1">
            Keep learning to get personalized recommendations!
          </p>
        </div>
      </div>
    );
  }

  const visibleSuggestions = expanded ? suggestions : suggestions.slice(0, 3);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 border border-forest-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-forest-800 flex items-center">
          <span className="mr-2">🎯</span>
          Suggestions for You
        </h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-forest-600 hover:text-forest-700 text-sm"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      </div>

      <div className="space-y-3">
        {visibleSuggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${getPriorityColor(suggestion.priority_level)}`}
            onClick={() => handleSuggestionClick(suggestion)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <span className="text-lg mr-2">{getSuggestionIcon(suggestion.suggestion_type)}</span>
                  <h4 className="font-medium text-forest-800 text-sm">{suggestion.title}</h4>
                </div>
                <p className="text-forest-600 text-xs mb-2">{suggestion.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-forest-500 italic">
                    {suggestion.reasoning}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-forest-400 rounded-full mr-1"></div>
                      <span className="text-xs text-forest-500">
                        {Math.round(suggestion.relevance_score * 100)}% match
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissSuggestion(suggestion.id);
                      }}
                      className="text-forest-400 hover:text-red-500 text-xs"
                      title="Dismiss suggestion"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {suggestions.length > 3 && !expanded && (
        <div className="mt-3 text-center">
          <button
            onClick={() => setExpanded(true)}
            className="text-forest-600 hover:text-forest-700 text-sm underline"
          >
            +{suggestions.length - 3} more suggestions
          </button>
        </div>
      )}
    </div>
  );
};

export default SuggestionEngine;