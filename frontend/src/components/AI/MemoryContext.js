import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const MemoryContext = ({ sessionId, onMemoryUpdate }) => {
  const { user } = useAuth();
  const [memoryContexts, setMemoryContexts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  useEffect(() => {
    if (user) {
      loadMemoryContext();
    }
  }, [user, sessionId]);

  const loadMemoryContext = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const params = sessionId ? `?session_id=${sessionId}` : '';
      const response = await axios.get(`${API}/ai/memory/context${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setMemoryContexts(response.data.data.contexts || []);
      }
    } catch (error) {
      console.error('Failed to load memory context:', error);
    } finally {
      setLoading(false);
    }
  };

  const storeMemoryContext = async (contextData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/ai/memory/context`, contextData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh memory contexts
      await loadMemoryContext();
      
      if (onMemoryUpdate) {
        onMemoryUpdate();
      }
    } catch (error) {
      console.error('Failed to store memory context:', error);
    }
  };

  const getContextIcon = (type) => {
    switch (type) {
      case 'legal_concept': return '⚖️';
      case 'personal_situation': return '👤';
      case 'recurring_question': return '🔄';
      case 'learning_preference': return '📚';
      case 'protection_need': return '🛡️';
      default: return '🧠';
    }
  };

  const getImportanceColor = (score) => {
    if (score >= 0.8) return 'bg-red-100 border-red-300';
    if (score >= 0.6) return 'bg-yellow-100 border-yellow-300';
    return 'bg-forest-100 border-forest-300';
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Recently';
  };

  // No need for forwardRef imperative handle since we're not using it
  // React.useImperativeHandle(React.forwardRef(() => ({
  //   storeMemoryContext
  // })), []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 border border-forest-100">
        <div className="animate-pulse">
          <div className="h-4 bg-forest-200 rounded w-2/3 mb-2"></div>
          <div className="h-3 bg-forest-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (memoryContexts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 border border-forest-100">
        <div className="text-center text-forest-600">
          <span className="text-2xl block mb-2">🧠</span>
          <p className="text-sm">No memory context yet</p>
          <p className="text-xs text-forest-500 mt-1">
            As you chat, I'll remember important details about your legal interests
          </p>
        </div>
      </div>
    );
  }

  const visibleContexts = expanded ? memoryContexts : memoryContexts.slice(0, 4);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 border border-forest-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-forest-800 flex items-center">
          <span className="mr-2">🧠</span>
          AI Memory
        </h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-forest-600 hover:text-forest-700 text-sm"
        >
          {expanded ? 'Show Less' : 'Show All'}
        </button>
      </div>

      <div className="space-y-2">
        {visibleContexts.map((context) => (
          <div
            key={context.id}
            className={`p-3 rounded-lg border ${getImportanceColor(context.importance_score)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <span className="text-sm mr-2">{getContextIcon(context.context_type)}</span>
                  <h4 className="font-medium text-forest-800 text-sm">{context.context_key}</h4>
                </div>
                <p className="text-forest-600 text-xs mb-2">{context.context_value}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-forest-500">
                    {formatTimeAgo(context.last_referenced)} • Referenced {context.reference_count}x
                  </span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-forest-400 rounded-full mr-1"></div>
                    <span className="text-xs text-forest-500">
                      {Math.round(context.importance_score * 100)}% important
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {memoryContexts.length > 4 && !expanded && (
        <div className="mt-3 text-center">
          <button
            onClick={() => setExpanded(true)}
            className="text-forest-600 hover:text-forest-700 text-sm underline"
          >
            +{memoryContexts.length - 4} more memories
          </button>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-forest-100">
        <div className="flex items-center text-xs text-forest-500">
          <span className="mr-2">💡</span>
          <span>I remember your interests to provide better legal guidance</span>
        </div>
      </div>
    </div>
  );
};

export default MemoryContext;