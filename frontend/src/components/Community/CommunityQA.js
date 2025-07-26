import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const CommunityQA = () => {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('questions'); // questions, detail, ask, my-questions
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [xpGained, setXpGained] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const { user } = useAuth();

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  const categories = [
    { value: 'criminal_law', label: 'Criminal Law', emoji: '⚖️' },
    { value: 'civil_rights', label: 'Civil Rights', emoji: '✊' },
    { value: 'housing', label: 'Housing', emoji: '🏠' },
    { value: 'employment', label: 'Employment', emoji: '💼' },
    { value: 'consumer_protection', label: 'Consumer Rights', emoji: '🛡️' },
    { value: 'education', label: 'Education', emoji: '🎓' },
    { value: 'traffic', label: 'Traffic', emoji: '🚗' },
    { value: 'family_law', label: 'Family Law', emoji: '👨‍👩‍👧‍👦' },
    { value: 'contracts', label: 'Contracts', emoji: '📝' },
    { value: 'torts', label: 'Torts', emoji: '⚠️' }
  ];

  useEffect(() => {
    if (view === 'questions') {
      fetchQuestions();
    } else if (view === 'my-questions') {
      fetchMyQuestions();
    }
  }, [view, searchTerm, selectedCategory, sortBy, pagination.page]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        per_page: '10'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (sortBy) params.append('sort_by', sortBy);

      const response = await axios.get(`${API}/questions?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const data = response.data.data;
        setQuestions(data.items);
        setPagination({
          page: data.page,
          pages: data.pages,
          total: data.total
        });
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyQuestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/questions/user/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setQuestions(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch my questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionDetail = async (questionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/questions/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSelectedQuestion(response.data.data);
        setView('detail');
      }
    } catch (error) {
      console.error('Failed to fetch question detail:', error);
    }
  };

  const handleVote = async (type, id, isAnswer = false) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = isAnswer ? `answers/${id}/vote` : `questions/${id}/vote`;
      
      await axios.post(`${API}/${endpoint}`, {
        vote_type: type
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh current view
      if (view === 'detail') {
        fetchQuestionDetail(selectedQuestion.id);
      } else {
        fetchQuestions();
      }

      // Show XP gain
      setXpGained(2);
      setTimeout(() => setXpGained(0), 2000);
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/answers/${answerId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchQuestionDetail(selectedQuestion.id);
    } catch (error) {
      console.error('Failed to accept answer:', error);
    }
  };

  const getCategoryEmoji = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.emoji : '📚';
  };

  const getCategoryLabel = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category.replace('_', ' ');
  };

  const getUserTypeColor = (userType) => {
    const colors = {
      law_student: 'bg-purple-100 text-purple-700',
      professor: 'bg-blue-100 text-blue-700',
      graduate: 'bg-green-100 text-green-700',
      undergraduate: 'bg-yellow-100 text-yellow-700',
      general: 'bg-gray-100 text-gray-700'
    };
    return colors[userType] || 'bg-gray-100 text-gray-700';
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = (now - date) / 1000;

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (view === 'ask') {
    return <AskQuestionForm onBack={() => setView('questions')} onSubmit={() => { setView('questions'); fetchQuestions(); }} />;
  }

  if (view === 'detail' && selectedQuestion) {
    return (
      <QuestionDetail 
        question={selectedQuestion} 
        onBack={() => setView('questions')}
        onVote={handleVote}
        onAcceptAnswer={handleAcceptAnswer}
        currentUser={user}
        xpGained={xpGained}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-emerald-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
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
            <span className="mr-3">💬</span>
            Community Q&A
          </h1>
          <p className="text-sage-600 text-lg max-w-3xl mx-auto">
            Ask questions, share knowledge, and learn from the legal community. Get help from peers and experts!
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-sage border border-sage-100 mb-6">
          <div className="flex flex-wrap justify-center p-2">
            <button
              onClick={() => setView('questions')}
              className={`px-6 py-3 rounded-xl font-medium transition-colors mx-1 mb-2 ${
                view === 'questions' 
                  ? 'bg-sage-600 text-white' 
                  : 'text-sage-600 hover:bg-sage-50'
              }`}
            >
              🔍 Browse Questions
            </button>
            <button
              onClick={() => setView('ask')}
              className={`px-6 py-3 rounded-xl font-medium transition-colors mx-1 mb-2 ${
                view === 'ask' 
                  ? 'bg-sage-600 text-white' 
                  : 'text-sage-600 hover:bg-sage-50'
              }`}
            >
              ❓ Ask Question
            </button>
            <button
              onClick={() => setView('my-questions')}
              className={`px-6 py-3 rounded-xl font-medium transition-colors mx-1 mb-2 ${
                view === 'my-questions' 
                  ? 'bg-sage-600 text-white' 
                  : 'text-sage-600 hover:bg-sage-50'
              }`}
            >
              📝 My Questions
            </button>
          </div>
        </div>

        {/* Filters */}
        {view === 'questions' && (
          <div className="bg-white rounded-2xl shadow-sage border border-sage-100 p-6 mb-6">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-2">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.emoji} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                  <option value="unanswered">Unanswered</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Questions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-sage-300 border-t-sage-600 mb-4"></div>
            <p className="text-sage-600 font-medium">Loading questions...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sage border border-sage-100">
                <div className="text-6xl mb-4">🤔</div>
                <h2 className="text-2xl font-bold text-sage-800 mb-2">
                  {view === 'my-questions' ? 'No Questions Asked Yet' : 'No Questions Found'}
                </h2>
                <p className="text-sage-600 mb-6">
                  {view === 'my-questions' 
                    ? 'Ask your first question to get help from the community!'
                    : 'Try adjusting your search filters or be the first to ask a question!'
                  }
                </p>
                {view === 'my-questions' && (
                  <button
                    onClick={() => setView('ask')}
                    className="bg-sage-600 hover:bg-sage-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Ask Your First Question
                  </button>
                )}
              </div>
            ) : (
              questions.map((question) => (
                <div 
                  key={question.id} 
                  className="bg-white rounded-2xl shadow-sage border border-sage-100 p-6 hover:shadow-sage-lg transition-shadow cursor-pointer"
                  onClick={() => fetchQuestionDetail(question.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getCategoryEmoji(question.category)}</span>
                      <div>
                        <h3 className="text-xl font-bold text-sage-800 line-clamp-2">
                          {question.title}
                        </h3>
                        <div className="text-sm text-sage-500 mt-1">
                          in {getCategoryLabel(question.category)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center text-sage-600 text-sm">
                        <span className="mr-1">👍</span>
                        {question.upvotes}
                      </div>
                      <div className="flex items-center text-sage-600 text-sm">
                        <span className="mr-1">💬</span>
                        {question.answer_count}
                      </div>
                      <div className="flex items-center text-sage-600 text-sm">
                        <span className="mr-1">👀</span>
                        {question.view_count}
                      </div>
                    </div>
                  </div>

                  <p className="text-sage-700 mb-4 line-clamp-2">
                    {question.content}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getUserTypeColor(question.author_user_type)}`}>
                        {question.author_username}
                      </div>
                      <div className="text-sage-500 text-sm">
                        {formatTimeAgo(question.created_at)}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {question.tags && question.tags.map((tag, index) => (
                        <span key={index} className="bg-sage-100 text-sage-600 px-2 py-1 rounded text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && view === 'questions' && (
          <div className="flex justify-center items-center mt-8 space-x-4">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="bg-white border border-sage-300 text-sage-600 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sage-50"
            >
              ← Previous
            </button>
            
            <span className="text-sage-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
              disabled={pagination.page === pagination.pages}
              className="bg-white border border-sage-300 text-sage-600 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sage-50"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Ask Question Component
const AskQuestionForm = ({ onBack, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  const categories = [
    { value: 'criminal_law', label: 'Criminal Law', emoji: '⚖️' },
    { value: 'civil_rights', label: 'Civil Rights', emoji: '✊' },
    { value: 'housing', label: 'Housing', emoji: '🏠' },
    { value: 'employment', label: 'Employment', emoji: '💼' },
    { value: 'consumer_protection', label: 'Consumer Rights', emoji: '🛡️' },
    { value: 'education', label: 'Education', emoji: '🎓' },
    { value: 'traffic', label: 'Traffic', emoji: '🚗' },
    { value: 'family_law', label: 'Family Law', emoji: '👨‍👩‍👧‍👦' },
    { value: 'contracts', label: 'Contracts', emoji: '📝' },
    { value: 'torts', label: 'Torts', emoji: '⚠️' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.category) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const questionData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag)
      };

      await axios.post(`${API}/questions`, questionData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onSubmit();
    } catch (error) {
      console.error('Failed to create question:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-emerald-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-sage-lg border border-sage-100">
          <div className="p-6 border-b border-sage-100">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-sage-800">Ask a Question</h1>
              <button
                onClick={onBack}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-sage-700 mb-2">
                Question Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What's your legal question?"
                className="w-full px-4 py-3 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sage-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                required
              >
                <option value="">Select a category...</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-sage-700 mb-2">
                Question Details *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Provide more details about your question. Include relevant context and what you've already tried."
                rows={6}
                className="w-full px-4 py-3 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sage-700 mb-2">
                Tags (optional)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="tenant, lease, eviction (comma-separated)"
                className="w-full px-4 py-3 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
              />
              <p className="text-sm text-sage-500 mt-1">
                Add relevant tags to help others find your question
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center text-blue-700 text-sm">
                <span className="mr-2">💡</span>
                <strong>Tips for great questions:</strong>
              </div>
              <ul className="text-blue-600 text-sm mt-2 space-y-1">
                <li>• Be specific about your situation</li>
                <li>• Include relevant details and context</li>
                <li>• Ask one question at a time</li>
                <li>• Remember: answers are for educational purposes only</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.content.trim() || !formData.category}
              className="w-full bg-sage-600 hover:bg-sage-700 disabled:bg-sage-300 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Posting Question...' : 'Post Question (+10 XP)'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Question Detail Component
const QuestionDetail = ({ question, onBack, onVote, onAcceptAnswer, currentUser, xpGained }) => {
  const [newAnswer, setNewAnswer] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;

    try {
      setSubmittingAnswer(true);
      const token = localStorage.getItem('token');
      
      await axios.post(`${API}/questions/${question.id}/answers`, {
        question_id: question.id,
        content: newAnswer.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewAnswer('');
      // Refresh question detail would be handled by parent
      window.location.reload(); // Simple refresh for demo
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = (now - date) / 1000;

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getUserTypeColor = (userType) => {
    const colors = {
      law_student: 'bg-purple-100 text-purple-700',
      professor: 'bg-blue-100 text-blue-700',
      graduate: 'bg-green-100 text-green-700',
      undergraduate: 'bg-yellow-100 text-yellow-700',
      general: 'bg-gray-100 text-gray-700'
    };
    return colors[userType] || 'bg-gray-100 text-gray-700';
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
            ← Back to Questions
          </button>
        </div>

        {/* Question */}
        <div className="bg-white rounded-3xl shadow-sage-lg border border-sage-100 mb-6">
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-sage-800 mb-4">
                  {question.title}
                </h1>
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getUserTypeColor(question.author_user_type)}`}>
                    {question.author_username} • Level {question.author_level}
                  </div>
                  <div className="text-sage-500 text-sm">
                    {formatTimeAgo(question.created_at)}
                  </div>
                  <div className="text-sage-500 text-sm">
                    👀 {question.view_count} views
                  </div>
                </div>
              </div>
              
              {/* Voting */}
              <div className="flex flex-col items-center space-y-2 ml-6">
                <button
                  onClick={() => onVote('upvote', question.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    question.user_vote === 'upvote' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                  }`}
                  disabled={question.author_id === currentUser?.id}
                >
                  👍
                </button>
                <span className="font-bold text-sage-800">{question.upvotes - question.downvotes}</span>
                <button
                  onClick={() => onVote('downvote', question.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    question.user_vote === 'downvote' 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-red-50'
                  }`}
                  disabled={question.author_id === currentUser?.id}
                >
                  👎
                </button>
              </div>
            </div>

            <div className="prose max-w-none text-sage-700 mb-6">
              {question.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">{paragraph}</p>
              ))}
            </div>

            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {question.tags.map((tag, index) => (
                  <span key={index} className="bg-sage-100 text-sage-600 px-3 py-1 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Answers */}
        <div className="bg-white rounded-3xl shadow-sage-lg border border-sage-100 mb-6">
          <div className="p-6 border-b border-sage-100">
            <h2 className="text-xl font-bold text-sage-800">
              {question.answers?.length || 0} Answer{(question.answers?.length || 0) !== 1 ? 's' : ''}
            </h2>
          </div>

          <div className="divide-y divide-sage-100">
            {question.answers && question.answers.length > 0 ? (
              question.answers.map((answer) => (
                <div key={answer.id} className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Voting */}
                    <div className="flex flex-col items-center space-y-2">
                      <button
                        onClick={() => onVote('upvote', answer.id, true)}
                        className={`p-2 rounded-lg transition-colors ${
                          answer.user_vote === 'upvote' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                        }`}
                        disabled={answer.author_id === currentUser?.id}
                      >
                        👍
                      </button>
                      <span className="font-bold text-sage-800">{answer.upvotes - answer.downvotes}</span>
                      <button
                        onClick={() => onVote('downvote', answer.id, true)}
                        className={`p-2 rounded-lg transition-colors ${
                          answer.user_vote === 'downvote' 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-gray-100 text-gray-600 hover:bg-red-50'
                        }`}
                        disabled={answer.author_id === currentUser?.id}
                      >
                        👎
                      </button>
                      {answer.is_accepted && (
                        <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                          ✅
                        </div>
                      )}
                    </div>

                    {/* Answer Content */}
                    <div className="flex-1">
                      <div className="prose max-w-none text-sage-700 mb-4">
                        {answer.content.split('\n').map((paragraph, index) => (
                          <p key={index} className="mb-4">{paragraph}</p>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getUserTypeColor(answer.author_user_type)}`}>
                            {answer.author_username} • Level {answer.author_level}
                          </div>
                          <div className="text-sage-500 text-sm">
                            {formatTimeAgo(answer.created_at)}
                          </div>
                        </div>

                        {/* Accept Answer Button (only for question author) */}
                        {question.author_id === currentUser?.id && !answer.is_accepted && (
                          <button
                            onClick={() => onAcceptAnswer(answer.id)}
                            className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            ✅ Accept Answer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <div className="text-4xl mb-4">💭</div>
                <p className="text-sage-600">No answers yet. Be the first to help!</p>
              </div>
            )}
          </div>
        </div>

        {/* Answer Form */}
        <div className="bg-white rounded-3xl shadow-sage-lg border border-sage-100">
          <div className="p-6 border-b border-sage-100">
            <h3 className="text-lg font-bold text-sage-800">Your Answer</h3>
          </div>
          
          <form onSubmit={handleSubmitAnswer} className="p-6">
            <textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Share your knowledge and help the community..."
              rows={6}
              className="w-full px-4 py-3 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 mb-4"
              required
            />
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-sage-500">
                💡 Remember: Provide helpful, educational information only
              </div>
              <button
                type="submit"
                disabled={submittingAnswer || !newAnswer.trim()}
                className="bg-sage-600 hover:bg-sage-700 disabled:bg-sage-300 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                {submittingAnswer ? 'Posting...' : 'Post Answer (+15 XP)'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommunityQA;