import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdvancedSearchFilters = ({ 
  searchType = 'all', // 'all', 'statutes', 'myths', 'simulations', 'learning_paths', 'community'
  onFiltersChange,
  initialFilters = {}
}) => {
  const [filters, setFilters] = useState({
    query: '',
    category: '',
    state: '',
    difficulty: '',
    protection_type: '',
    user_type: '',
    date_range: '',
    sort_by: 'relevance',
    ...initialFilters
  });

  const [savedFilters, setSavedFilters] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  // Protection types for filtering
  const protectionTypes = [
    { value: 'RENTER', label: '🏠 Renter Protection', color: 'bg-blue-100 text-blue-800' },
    { value: 'WORKER', label: '👷 Worker Protection', color: 'bg-green-100 text-green-800' },
    { value: 'STUDENT', label: '🎓 Student Protection', color: 'bg-purple-100 text-purple-800' },
    { value: 'UNDOCUMENTED', label: '🛡️ Immigration Protection', color: 'bg-red-100 text-red-800' },
    { value: 'PROTESTER', label: '✊ Protest Rights', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'DISABLED', label: '♿ Disability Rights', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'GENERAL', label: '⚖️ General Legal', color: 'bg-gray-100 text-gray-800' }
  ];

  // Categories based on search type
  const getCategories = () => {
    const categories = {
      statutes: [
        { value: 'criminal_law', label: 'Criminal Law' },
        { value: 'civil_rights', label: 'Civil Rights' },
        { value: 'housing', label: 'Housing' },
        { value: 'employment', label: 'Employment' },
        { value: 'consumer_protection', label: 'Consumer Protection' },
        { value: 'education', label: 'Education' },
        { value: 'traffic', label: 'Traffic' },
        { value: 'family_law', label: 'Family Law' }
      ],
      myths: [
        { value: 'criminal_law', label: 'Criminal Law' },
        { value: 'civil_rights', label: 'Civil Rights' },
        { value: 'housing', label: 'Housing' },
        { value: 'employment', label: 'Employment' },
        { value: 'education', label: 'Education' }
      ],
      simulations: [
        { value: 'police_encounter', label: 'Police Encounter' },
        { value: 'housing_dispute', label: 'Housing Dispute' },
        { value: 'ice_encounter', label: 'ICE Encounter' },
        { value: 'traffic_stop', label: 'Traffic Stop' },
        { value: 'workplace_harassment', label: 'Workplace Issues' }
      ],
      community: [
        { value: 'general', label: 'General Discussion' },
        { value: 'housing', label: 'Housing Issues' },
        { value: 'employment', label: 'Employment' },
        { value: 'immigration', label: 'Immigration' },
        { value: 'education', label: 'Education' }
      ]
    };
    return categories[searchType] || categories.statutes;
  };

  // US States for filtering
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  // Difficulty levels
  const difficultyLevels = [
    { value: '1', label: 'Beginner' },
    { value: '2', label: 'Intermediate' },
    { value: '3', label: 'Advanced' },
    { value: '4', label: 'Expert' },
    { value: '5', label: 'Professional' }
  ];

  // Sort options
  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'date_desc', label: 'Newest First' },
    { value: 'date_asc', label: 'Oldest First' },
    { value: 'title_asc', label: 'Title A-Z' },
    { value: 'title_desc', label: 'Title Z-A' },
    { value: 'popular', label: 'Most Popular' }
  ];

  // Load saved filters on component mount
  useEffect(() => {
    loadSavedFilters();
  }, []);

  // Notify parent component when filters change
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  const loadSavedFilters = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API}/search/filters`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSavedFilters(response.data.data.filter(f => f.filter_type === searchType));
      }
    } catch (error) {
      console.error('Failed to load saved filters:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      category: '',
      state: '',
      difficulty: '',
      protection_type: '',
      user_type: '',
      date_range: '',
      sort_by: 'relevance'
    });
  };

  const saveCurrentFilters = async () => {
    if (!filterName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.post(`${API}/search/filters`, {
        filter_name: filterName,
        filter_type: searchType,
        filter_criteria: filters
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFilterName('');
      setShowSaveDialog(false);
      loadSavedFilters();
    } catch (error) {
      console.error('Failed to save filter:', error);
    }
  };

  const loadSavedFilter = (savedFilter) => {
    setFilters({ ...filters, ...savedFilter.filter_criteria });
  };

  const hasActiveFilters = () => {
    return Object.entries(filters).some(([key, value]) => 
      key !== 'sort_by' && value && value !== ''
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-forest-200 overflow-hidden">
      {/* Header */}
      <div className="bg-forest-50 px-6 py-4 border-b border-forest-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-forest-800">Advanced Search</h3>
            {hasActiveFilters() && (
              <span className="bg-forest-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                {Object.values(filters).filter(v => v && v !== 'relevance').length} active
              </span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-forest-600 hover:text-forest-800 transition-colors"
          >
            <svg 
              className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters Content */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Search Query */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Query
            </label>
            <input
              type="text"
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              placeholder="Enter keywords..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
              >
                <option value="">All categories</option>
                {getCategories().map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* State Filter */}
            {(searchType === 'statutes' || searchType === 'all') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <select
                  value={filters.state}
                  onChange={(e) => handleFilterChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                >
                  <option value="">All states</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Difficulty Filter */}
            {(searchType === 'simulations' || searchType === 'learning_paths' || searchType === 'all') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                >
                  <option value="">All levels</option>
                  {difficultyLevels.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sort_by}
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Protection Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Protection Type
            </label>
            <div className="flex flex-wrap gap-2">
              {protectionTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => handleFilterChange('protection_type', 
                    filters.protection_type === type.value ? '' : type.value
                  )}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${filters.protection_type === type.value 
                      ? 'bg-forest-600 text-white ring-2 ring-forest-400' 
                      : `${type.color} hover:scale-105`
                    }
                  `}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex space-x-3">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
              >
                Clear All
              </button>
              {hasActiveFilters() && (
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="px-4 py-2 bg-forest-100 text-forest-700 hover:bg-forest-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Save Filter
                </button>
              )}
            </div>

            {/* Saved Filters Dropdown */}
            {savedFilters.length > 0 && (
              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      const savedFilter = savedFilters.find(f => f.id === e.target.value);
                      if (savedFilter) loadSavedFilter(savedFilter);
                    }
                  }}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
                >
                  <option value="">Load Saved Filter...</option>
                  {savedFilters.map(filter => (
                    <option key={filter.id} value={filter.id}>
                      {filter.filter_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Save Filter</h4>
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Enter filter name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={saveCurrentFilters}
                disabled={!filterName.trim()}
                className="flex-1 bg-forest-600 text-white px-4 py-2 rounded-lg hover:bg-forest-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchFilters;