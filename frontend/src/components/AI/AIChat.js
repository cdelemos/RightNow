import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import UPLRiskWarning, { useUPLRiskDetection } from '../UPL/UPLRiskWarning';
import SuggestionEngine from './SuggestionEngine';
import MemoryContext from './MemoryContext';
import axios from 'axios';

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [userState, setUserState] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [suggestedScripts, setSuggestedScripts] = useState([]);
  const [xpGained, setXpGained] = useState(0);
  const [uplRiskWarning, setUplRiskWarning] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const messagesEndRef = useRef(null);
  const memoryContextRef = useRef(null);
  const { user } = useAuth();
  const { analyzeQuery } = useUPLRiskDetection();

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 
    'Wisconsin', 'Wyoming'
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    setMessages([{
      id: 'welcome',
      type: 'assistant',
      content: `👋 Hi ${user?.username}! I'm RightNow, your AI legal education assistant. I'm here to help you understand your legal rights and provide general legal information.\n\n⚖️ **Important**: I provide educational information only, not legal advice. For specific legal matters, please consult with a qualified attorney.\n\nWhat would you like to learn about today?`,
      timestamp: new Date(),
      xp_awarded: 0
    }]);
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const trackInteraction = async (message, response) => {
    try {
      const token = localStorage.getItem('token');
      
      // Determine topic category from message content
      const topicCategory = detectTopicCategory(message);
      
      // Calculate engagement level based on response quality
      const engagementLevel = response.confidence_score || 0.5;
      
      await axios.post(`${API}/ai/memory/track`, {
        interaction_type: 'ai_chat',
        topic_category: topicCategory,
        legal_concept: extractLegalConcept(message, response),
        engagement_level: engagementLevel
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  };

  const storeMemoryContext = async (message, response) => {
    try {
      const token = localStorage.getItem('token');
      
      // Extract important context from the conversation
      const contextKey = extractContextKey(message);
      const contextValue = extractContextValue(message, response);
      
      if (contextKey && contextValue) {
        await axios.post(`${API}/ai/memory/context`, {
          session_id: sessionId,
          context_type: 'legal_concept',
          context_key: contextKey,
          context_value: contextValue,
          importance_score: response.confidence_score || 0.5
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update memory display
        if (memoryContextRef.current) {
          memoryContextRef.current.loadMemoryContext();
        }
      }
    } catch (error) {
      console.error('Failed to store memory context:', error);
    }
  };

  const detectTopicCategory = (message) => {
    const categories = {
      'housing': ['rent', 'landlord', 'eviction', 'lease', 'apartment', 'tenant'],
      'employment': ['job', 'work', 'boss', 'fired', 'workplace', 'salary', 'overtime'],
      'criminal': ['police', 'arrest', 'charged', 'court', 'lawyer', 'rights'],
      'immigration': ['visa', 'citizen', 'deport', 'green card', 'immigration', 'border'],
      'family': ['divorce', 'custody', 'child support', 'marriage', 'family court'],
      'consumer': ['debt', 'credit', 'scam', 'contract', 'purchase', 'refund']
    };
    
    const messageLower = message.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => messageLower.includes(keyword))) {
        return category;
      }
    }
    return 'general';
  };

  const extractLegalConcept = (message, response) => {
    // Extract main legal concepts from the message and response
    const concepts = [];
    
    // Common legal terms
    const legalTerms = [
      'rights', 'constitutional', 'amendment', 'statute', 'law', 'legal',
      'court', 'judge', 'lawsuit', 'contract', 'liability', 'damages',
      'defendant', 'plaintiff', 'evidence', 'testimony', 'jurisdiction'
    ];
    
    const combinedText = (message + ' ' + response.response).toLowerCase();
    legalTerms.forEach(term => {
      if (combinedText.includes(term)) {
        concepts.push(term);
      }
    });
    
    return concepts.join(', ') || 'general inquiry';
  };

  const extractContextKey = (message) => {
    // Extract key context from user message
    const questionWords = ['what', 'how', 'when', 'where', 'why', 'can', 'should', 'is', 'are'];
    const words = message.toLowerCase().split(' ');
    
    // Find the main topic by removing question words
    const mainTopic = words.filter(word => !questionWords.includes(word)).slice(0, 3).join(' ');
    return mainTopic || 'user inquiry';
  };

  const extractContextValue = (message, response) => {
    // Extract valuable context from the exchange
    if (response.suggested_scripts && response.suggested_scripts.length > 0) {
      return `User interested in scripts: ${response.suggested_scripts.map(s => s.title).join(', ')}`;
    }
    
    if (response.upl_risk_flagged) {
      return `User query flagged for UPL risk: ${message}`;
    }
    
    return `User asked: ${message}`;
  };

  const handleSuggestionClick = (suggestion) => {
    // Handle suggestion clicks - navigate to relevant content
    const suggestionMessage = `Tell me more about: ${suggestion.title}`;
    setInputMessage(suggestionMessage);
    
    // Auto-send the suggestion as a message
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Check for UPL risk before sending
    const riskAnalysis = analyzeQuery(inputMessage);
    if (riskAnalysis) {
      setUplRiskWarning({
        ...riskAnalysis,
        query: inputMessage
      });
      
      // For high risk queries, don't send immediately
      if (riskAnalysis.severity === 'high') {
        return;
      }
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    const currentMessage = inputMessage;
    setInputMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/ai/chat`, {
        message: currentMessage,
        session_id: sessionId,
        user_state: userState
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data.data;
      
      // Set session ID if new
      if (!sessionId) {
        setSessionId(data.session_id);
      }

      // Create assistant message
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        confidence_score: data.confidence_score,
        upl_risk_flagged: data.upl_risk_flagged,
        upl_warning: data.upl_warning,
        suggested_scripts: data.suggested_scripts,
        xp_awarded: data.xp_awarded,
        requires_state: data.requires_state
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Handle XP gain animation
      if (data.xp_awarded > 0) {
        setXpGained(data.xp_awarded);
        setTimeout(() => setXpGained(0), 3000);
      }

      // Set suggested scripts
      if (data.suggested_scripts && data.suggested_scripts.length > 0) {
        setSuggestedScripts(data.suggested_scripts);
      }

      // Show state modal if required
      if (data.requires_state && !userState) {
        setShowStateModal(true);
      }

      // Show UPL warning if flagged by backend
      if (data.upl_risk_flagged) {
        setUplRiskWarning({
          severity: data.upl_warning?.severity || 'medium',
          query: currentMessage
        });
      }

      // Track interaction for memory and suggestions
      await trackInteraction(currentMessage, data);

      // Store memory context if valuable information is exchanged
      if (data.confidence_score > 0.7) {
        await storeMemoryContext(currentMessage, data);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStateSelect = (state) => {
    setUserState(state);
    setShowStateModal(false);
    
    // Add system message
    const stateMessage = {
      id: Date.now(),
      type: 'system',
      content: `📍 Location set to ${state}. I'll now provide information relevant to ${state} laws when applicable.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, stateMessage]);
  };

  const insertScript = (script) => {
    const scriptMessage = {
      id: Date.now(),
      type: 'script',
      content: script,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, scriptMessage]);
    setSuggestedScripts([]);
  };

  const formatMessage = (content) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
  };

  const handleUPLWarningDismiss = () => {
    setUplRiskWarning(null);
  };

  const handleSeekLegalAdvice = () => {
    // Add system message about seeking legal advice
    const adviceMessage = {
      id: Date.now(),
      type: 'system',
      content: '📞 For legal advice, consider contacting:\n\n• Local bar association referral services\n• Legal aid organizations\n• Private attorneys in your area\n\nRemember: This platform provides educational information only.',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, adviceMessage]);
    setUplRiskWarning(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-emerald-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sage-lg mb-6 border border-sage-100">
          <div className="p-6 border-b border-sage-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg mr-4">
                  🤖
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-sage-800">AI Legal Assistant</h1>
                  <p className="text-sage-600">Get instant legal education and guidance</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {userState && (
                  <div className="bg-sage-100 text-sage-700 px-3 py-1 rounded-full text-sm font-medium">
                    📍 {userState}
                  </div>
                )}
                <button
                  onClick={() => setShowStateModal(true)}
                  className="bg-sage-100 hover:bg-sage-200 text-sage-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {userState ? 'Change State' : 'Set State'}
                </button>
              </div>
            </div>
          </div>

          {/* XP Gain Animation */}
          {xpGained > 0 && (
            <div className="absolute top-4 right-4 z-50">
              <div className="bg-gold-500 text-white rounded-full px-4 py-2 font-bold shadow-lg animate-bounce">
                +{xpGained} XP! 🌟
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-sage-600 text-white'
                      : message.type === 'error'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : message.type === 'system'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : message.type === 'script'
                      ? 'bg-gold-100 text-gold-800 border border-gold-200'
                      : 'bg-white text-sage-800 border border-sage-200 shadow-sm'
                  }`}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: formatMessage(message.content)
                    }}
                  />
                  
                  {/* UPL Warning */}
                  {message.upl_warning && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-yellow-800 text-sm">
                        {message.upl_warning}
                      </div>
                    </div>
                  )}

                  {/* XP Award */}
                  {message.xp_awarded > 0 && (
                    <div className="mt-2 text-xs text-gold-600 font-medium">
                      +{message.xp_awarded} XP earned! 🏆
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-sage-800 border border-sage-200 shadow-sm px-4 py-3 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <div className="animate-bounce w-2 h-2 bg-sage-400 rounded-full"></div>
                    <div className="animate-bounce w-2 h-2 bg-sage-400 rounded-full" style={{ animationDelay: '0.1s' }}></div>
                    <div className="animate-bounce w-2 h-2 bg-sage-400 rounded-full" style={{ animationDelay: '0.2s' }}></div>
                    <span className="ml-2 text-sm text-sage-600">RightNow is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Scripts */}
          {suggestedScripts.length > 0 && (
            <div className="px-6 py-4 bg-sage-50 border-t border-sage-100">
              <h3 className="text-sm font-medium text-sage-800 mb-3">📝 Suggested Scripts:</h3>
              <div className="space-y-2">
                {suggestedScripts.map((script, index) => (
                  <div
                    key={index}
                    className="bg-white p-3 rounded-lg border border-sage-200 cursor-pointer hover:bg-sage-50 transition-colors"
                    onClick={() => insertScript(script)}
                  >
                    <div className="font-medium text-sage-800 text-sm">{script.title}</div>
                    <div className="text-sage-600 text-xs mt-1">{script.scenario}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-6 border-t border-sage-100">
            <div className="flex space-x-4">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask about your legal rights... (e.g., 'What should I do if stopped by police?')"
                className="flex-1 px-4 py-3 border border-sage-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-sage-600 hover:bg-sage-700 disabled:bg-sage-300 text-white px-6 py-3 rounded-2xl font-medium transition-colors"
              >
                Send
              </button>
            </div>
            <div className="mt-3 text-xs text-sage-500 text-center">
              💡 Try asking: "What are my rights during a traffic stop?" or "What should I say to ICE?"
            </div>
          </div>
        </div>
      </div>

      {/* State Selection Modal */}
      {showStateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-96 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-sage-800">Select Your State</h2>
              <p className="text-sage-600 text-sm mt-1">
                This helps me provide more relevant legal information.
              </p>
            </div>
            <div className="p-6 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-1 gap-2">
                {US_STATES.map((state) => (
                  <button
                    key={state}
                    onClick={() => handleStateSelect(state)}
                    className="text-left px-4 py-2 rounded-lg hover:bg-sage-50 transition-colors"
                  >
                    {state}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowStateModal(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Memory and Suggestions Sidebar */}
      <div className="flex gap-4 mt-6">
        {/* Suggestions Panel */}
        {showSuggestions && (
          <div className="w-80">
            <SuggestionEngine onSuggestionClick={handleSuggestionClick} />
          </div>
        )}
        
        {/* Memory Panel */}
        {showMemory && (
          <div className="w-80">
            <MemoryContext 
              sessionId={sessionId}
              onMemoryUpdate={() => {
                // Refresh suggestions when memory is updated
                window.location.reload();
              }}
            />
          </div>
        )}
      </div>

      {/* Toggle buttons for mobile */}
      <div className="fixed bottom-4 right-4 flex space-x-2">
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          className={`p-3 rounded-full shadow-lg transition-colors ${
            showSuggestions 
              ? 'bg-forest-600 text-white' 
              : 'bg-white text-forest-600 border border-forest-300'
          }`}
          title="Toggle suggestions"
        >
          <span className="text-lg">💡</span>
        </button>
        <button
          onClick={() => setShowMemory(!showMemory)}
          className={`p-3 rounded-full shadow-lg transition-colors ${
            showMemory 
              ? 'bg-forest-600 text-white' 
              : 'bg-white text-forest-600 border border-forest-300'
          }`}
          title="Toggle memory"
        >
          <span className="text-lg">🧠</span>
        </button>
      </div>

      {/* UPL Risk Warning */}
      {uplRiskWarning && (
        <UPLRiskWarning
          query={uplRiskWarning.query}
          severity={uplRiskWarning.severity}
          onDismiss={handleUPLWarningDismiss}
          onSeekAdvice={handleSeekLegalAdvice}
        />
      )}
    </div>
  );
};

export default AIChat;