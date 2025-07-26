import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const StatuteLookup = () => {
  const { user } = useAuth();
  const [statutes, setStatutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    state: 'all',
    category: 'all',
    sortBy: 'relevance'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });
  const [bookmarkedStatutes, setBookmarkedStatutes] = useState(new Set());
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [stats, setStats] = useState(null);
  const searchInputRef = useRef(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  const categories = [
    { value: 'all', label: 'All Categories', icon: '📚' },
    { value: 'housing', label: 'Housing Rights', icon: '🏠' },
    { value: 'employment', label: 'Employment Law', icon: '💼' },
    { value: 'consumer_protection', label: 'Consumer Protection', icon: '🛡️' },
    { value: 'criminal_law', label: 'Criminal Law', icon: '⚖️' },
    { value: 'civil_rights', label: 'Civil Rights', icon: '✊' },
    { value: 'education', label: 'Education Law', icon: '🎓' },
    { value: 'traffic', label: 'Traffic Law', icon: '🚗' },
    { value: 'contracts', label: 'Contract Law', icon: '📄' }
  ];

  const states = [
    { value: 'all', label: 'All States' },
    { value: 'Federal', label: 'Federal' },
    { value: 'California', label: 'California' },
    { value: 'New York', label: 'New York' },
    { value: 'Texas', label: 'Texas' },
    { value: 'Florida', label: 'Florida' }
  ];

  useEffect(() => {
    fetchStatutes();
    fetchStats();
    fetchBookmarks();
  }, [filters, pagination.page]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery) {
        fetchStatutes();
        fetchSuggestions();
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const fetchStatutes = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        per_page: 8,
        ...(filters.state !== 'all' && { state: filters.state }),
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(searchQuery && { search: searchQuery }),
        sort_by: filters.sortBy
      };

      const response = await axios.get(`${API}/statutes`, { params });
      if (response.data.success) {
        const data = response.data.data;
        setStatutes(data.items);
        setPagination({
          page: data.page,
          totalPages: data.pages,
          total: data.total
        });
      }
    } catch (error) {
      console.error('Error fetching statutes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    if (searchQuery.length < 2) return;
    
    try {
      const response = await axios.get(`${API}/statutes/search/suggestions?q=${searchQuery}`);
      if (response.data.success) {
        setSuggestions(response.data.data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/statutes/stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const response = await axios.get(`${API}/statutes/bookmarks`);
      if (response.data.success) {
        const bookmarkIds = new Set(response.data.data.map(statute => statute.id));
        setBookmarkedStatutes(bookmarkIds);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const handleBookmark = async (statuteId, isBookmarked) => {
    try {
      if (isBookmarked) {
        await axios.delete(`${API}/statutes/${statuteId}/bookmark`);
        setBookmarkedStatutes(prev => {
          const newSet = new Set(prev);
          newSet.delete(statuteId);
          return newSet;
        });
      } else {
        await axios.post(`${API}/statutes/${statuteId}/bookmark`);
        setBookmarkedStatutes(prev => new Set([...prev, statuteId]));
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.text);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    setShowSuggestions(false);
    fetchStatutes();
  };

  const getCategoryIcon = (category) => {
    const categoryObj = categories.find(cat => cat.value === category);
    return categoryObj ? categoryObj.icon : '📚';
  };

  const getCategoryColor = (category) => {
    const colors = {
      housing: 'bg-blue-100 text-blue-700',
      employment: 'bg-purple-100 text-purple-700',
      consumer_protection: 'bg-green-100 text-green-700',
      criminal_law: 'bg-red-100 text-red-700',
      civil_rights: 'bg-yellow-100 text-yellow-700',
      education: 'bg-indigo-100 text-indigo-700',
      traffic: 'bg-pink-100 text-pink-700',
      contracts: 'bg-orange-100 text-orange-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-sage-800 mb-4 flex items-center justify-center">
            <span className="animate-float inline-block mr-4">📚</span>
            Statute Lookup Engine
          </h1>
          <p className="text-sage-600 text-lg max-w-3xl mx-auto">
            Discover legal statutes that impact your daily life. Search by topic, state, or keywords 
            to find relevant laws with practical explanations! 🎯
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-3xl shadow-sage-lg p-6 mb-8 border border-sage-100">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Search for laws about housing, employment, education..."
                  className="w-full px-6 py-4 border border-sage-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent text-lg bg-sage-50/50"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-sage-500 hover:bg-sage-600 text-white p-2 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

                {/* Search Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white rounded-2xl shadow-sage-lg border border-sage-100 mt-2 z-10 max-h-64 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-4 py-3 hover:bg-sage-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{getCategoryIcon(suggestion.category)}</span>
                          <div>
                            <div className="font-medium text-sage-800">{suggestion.text}</div>
                            <div className="text-sm text-sage-500">
                              {suggestion.type === 'statute' ? suggestion.state : `Keyword in ${suggestion.category}`}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mt-6">
              {/* Category Filter */}
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="px-4 py-2 border border-sage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>

              {/* State Filter */}
              <select
                value={filters.state}
                onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                className="px-4 py-2 border border-sage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
              >
                {states.map(state => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>

              {/* Sort Filter */}
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="px-4 py-2 border border-sage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
              >
                <option value="relevance">Most Relevant</option>
                <option value="title">Alphabetical</option>
                <option value="date">Newest First</option>
                <option value="category">By Category</option>
              </select>
            </div>
          </form>
        </div>

        {/* Results Header */}
        {!loading && (
          <div className="flex items-center justify-between mb-6">
            <div className="text-sage-700">
              <span className="font-medium">
                {pagination.total > 0 ? (
                  <>Showing {((pagination.page - 1) * 8) + 1}-{Math.min(pagination.page * 8, pagination.total)} of {pagination.total} statutes</>
                ) : (
                  'No statutes found'
                )}
              </span>
            </div>
            {stats && (
              <div className="text-sm text-sage-600">
                📊 Database: {stats.total_statutes} statutes across {stats.by_state?.length || 0} jurisdictions
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-sage-300 border-t-sage-600 mb-4"></div>
              <p className="text-sage-600">Searching legal database...</p>
            </div>
          </div>
        )}

        {/* Statute Results */}
        {!loading && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {statutes.map((statute) => (
              <StatuteCard
                key={statute.id}
                statute={statute}
                isBookmarked={bookmarkedStatutes.has(statute.id)}
                onBookmarkToggle={handleBookmark}
                getCategoryIcon={getCategoryIcon}
                getCategoryColor={getCategoryColor}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && statutes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-8xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold text-sage-800 mb-4">No statutes found</h3>
            <p className="text-sage-600 mb-6 max-w-md mx-auto">
              Try adjusting your search terms or filters to find relevant legal information.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilters({ state: 'all', category: 'all', sortBy: 'relevance' });
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="bg-sage-500 hover:bg-sage-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-sage-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sage-50 transition-colors"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setPagination(prev => ({ ...prev, page }))}
                  className={`px-4 py-2 rounded-xl transition-colors ${
                    pagination.page === page
                      ? 'bg-sage-500 text-white'
                      : 'border border-sage-200 hover:bg-sage-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 border border-sage-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sage-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Statute Card Component
const StatuteCard = ({ statute, isBookmarked, onBookmarkToggle, getCategoryIcon, getCategoryColor }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-3xl shadow-sage hover:shadow-sage-lg transition-all duration-300 border border-sage-100 overflow-hidden group">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${getCategoryColor(statute.category)}`}>
              {getCategoryIcon(statute.category)}
            </div>
            <div>
              <h3 className="font-bold text-sage-800 text-lg leading-tight">
                {statute.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sage-600 text-sm">{statute.statute_number}</span>
                <span className="text-sage-400">•</span>
                <span className="text-sage-600 text-sm">{statute.state}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => onBookmarkToggle(statute.id, isBookmarked)}
            className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${
              isBookmarked
                ? 'bg-gold-100 text-gold-600'
                : 'bg-sage-50 text-sage-400 hover:text-sage-600'
            }`}
          >
            <svg className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>

        {/* Summary */}
        <p className="text-sage-600 mb-4 leading-relaxed">
          {statute.summary}
        </p>

        {/* Student Relevance */}
        {statute.student_relevance && (
          <div className="bg-sage-50 rounded-2xl p-4 mb-4">
            <div className="flex items-center mb-2">
              <span className="text-lg mr-2">🎓</span>
              <span className="font-medium text-sage-700">Why This Matters to Students:</span>
            </div>
            <p className="text-sage-600 text-sm leading-relaxed">
              {statute.student_relevance}
            </p>
          </div>
        )}

        {/* Keywords */}
        <div className="flex flex-wrap gap-2 mb-4">
          {statute.keywords?.slice(0, 4).map((keyword, index) => (
            <span
              key={index}
              className="bg-sage-100 text-sage-700 px-3 py-1 rounded-lg text-xs font-medium"
            >
              {keyword}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 text-sage-600 hover:text-sage-800 transition-colors font-medium"
          >
            <span>{isExpanded ? 'Show Less' : 'Read Full Text'}</span>
            <svg 
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <div className="text-xs text-sage-500">
            +10 XP for reading
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-sage-100">
          <div className="pt-4">
            <h4 className="font-bold text-sage-800 mb-3">Full Legal Text:</h4>
            <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-700 leading-relaxed max-h-64 overflow-y-auto">
              {statute.full_text}
            </div>
            
            {statute.practical_impact && (
              <div className="mt-4">
                <h4 className="font-bold text-sage-800 mb-2 flex items-center">
                  <span className="mr-2">💡</span>
                  Practical Impact:
                </h4>
                <p className="text-sage-600 text-sm leading-relaxed">
                  {statute.practical_impact}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatuteLookup;