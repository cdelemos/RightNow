import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TableOfContents from './TableOfContents';
import ChapterTabs from './ChapterTabs';
import BookmarkRibbon from './BookmarkRibbon';
import MarginScribbles from './MarginScribbles';

const BookContainer = ({ children }) => {
  const { user } = useAuth();
  const [isFlipping, setIsFlipping] = useState(false);
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const location = useLocation();

  // Page flip animation trigger
  useEffect(() => {
    setIsFlipping(true);
    const timer = setTimeout(() => setIsFlipping(false), 600);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handlePageFlip = () => {
    setIsFlipping(true);
    setTimeout(() => setIsFlipping(false), 600);
  };

  const getProgressRibbon = () => {
    const progress = (user?.xp || 0) / ((user?.level || 1) * 100) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-book-leather via-forest-900 to-book-leather flex items-center justify-center p-4">
      {/* Book Cover/Container */}
      <div className="relative w-full max-w-7xl mx-auto">
        {/* Book Shadow */}
        <div className="absolute inset-0 bg-black/20 blur-xl transform translate-y-4 scale-105 rounded-2xl"></div>
        
        {/* Main Book */}
        <div className="relative bg-book-leather rounded-2xl shadow-2xl overflow-hidden border-4 border-forest-800">
          {/* Book Spine Effect */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-forest-900 to-book-leather border-r-2 border-forest-700 z-10"></div>
          
          {/* Chapter Tabs - Moved to left side */}
          <div className="absolute left-8 top-0 bottom-0 w-20 z-20">
            <ChapterTabs onPageFlip={handlePageFlip} />
          </div>
          
          {/* Table of Contents Toggle Button */}
          <button
            onClick={() => setShowTableOfContents(!showTableOfContents)}
            className="absolute top-6 left-32 z-30 bg-forest-700 text-white px-4 py-2 rounded-lg hover:bg-forest-600 transition-colors shadow-lg"
          >
            📖 Contents
          </button>
          
          {/* Level Indicator - Fixed to book */}
          <div className="absolute top-6 right-6 z-30 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-forest-200">
            <div className="text-center">
              <div className="text-sm font-bold text-book-leather">Level {user?.level || 1}</div>
              <div className="text-xs text-forest-600">{user?.xp || 0} XP</div>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="relative ml-28 bg-book-page min-h-[85vh] flex">
            {/* Left Page - Now utilized */}
            <div className="w-1/2 relative p-8">
              {/* Page Texture */}
              <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-amber-50 to-yellow-50 mix-blend-multiply"></div>
              
              {/* Left Page Content */}
              <div className="relative z-10 h-full">
                {/* Page Header */}
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-book-leather mb-2">
                    📚 Quick Access
                  </h2>
                  <div className="w-12 h-0.5 bg-gold-400 mx-auto"></div>
                </div>
                
                {/* Quick Navigation Cards */}
                <div className="space-y-4 mb-8">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-forest-200">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-3">⚖️</span>
                      <div>
                        <h3 className="font-bold text-book-leather">Today's Focus</h3>
                        <p className="text-sm text-forest-600">Your daily legal learning path</p>
                      </div>
                    </div>
                    <div className="text-xs text-forest-500">
                      Miranda Rights • Criminal Law • Level 1
                    </div>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-forest-200">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-3">🎯</span>
                      <div>
                        <h3 className="font-bold text-book-leather">Current Progress</h3>
                        <p className="text-sm text-forest-600">Track your learning journey</p>
                      </div>
                    </div>
                    <div className="w-full bg-gold-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-gradient-to-r from-gold-400 to-gold-600 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${getProgressRibbon()}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-forest-500">
                      Level {user?.level || 1} • {Math.round(getProgressRibbon())}% Complete
                    </div>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-forest-200">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-3">🏆</span>
                      <div>
                        <h3 className="font-bold text-book-leather">Recent Achievements</h3>
                        <p className="text-sm text-forest-600">Your latest legal victories</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-white text-xs">🎓</div>
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs">📚</div>
                      <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xs">⚖️</div>
                    </div>
                  </div>
                </div>
                
                {/* Study Tips Section */}
                <div className="bg-gradient-to-br from-forest-50 to-forest-100 rounded-lg p-4 border border-forest-200 mb-6">
                  <h3 className="font-bold text-book-leather mb-2 flex items-center">
                    <span className="mr-2">💡</span>
                    Study Tip
                  </h3>
                  <p className="text-sm text-forest-700 italic">
                    "The best time to learn your rights is before you need them. Take 10 minutes daily to review one legal concept."
                  </p>
                  <div className="text-xs text-forest-500 mt-2">
                    — Daily Learning Reminder
                  </div>
                </div>
                
                {/* Legal Quotes - Moved from right page */}
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-4 border border-gold-200">
                  <h3 className="font-bold text-book-leather mb-2 flex items-center">
                    <span className="mr-2">📝</span>
                    Legal Wisdom
                  </h3>
                  <MarginScribbles position="embedded" context="general" />
                </div>
              </div>
              
              {/* Page Corner Fold Effect */}
              <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-tl from-forest-100 to-transparent transform rotate-45 translate-x-6 translate-y-6 opacity-20"></div>
            </div>
            
            {/* Page Divider */}
            <div className="w-px bg-gradient-to-b from-transparent via-forest-200 to-transparent"></div>
            
            {/* Right Page - Main Content */}
            <div className="w-1/2 relative p-8">
              {/* Page Texture */}
              <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-amber-50 to-yellow-50 mix-blend-multiply"></div>
              
              {/* Content with flip animation */}
              <div className={`relative h-full transition-all duration-600 transform ${
                isFlipping ? 'rotateY-180 opacity-0' : 'rotateY-0 opacity-100'
              }`}>
                {children}
              </div>
              
              {/* Page Corner Fold Effect */}
              <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-tl from-forest-100 to-transparent transform rotate-45 translate-x-6 translate-y-6 opacity-20"></div>
            </div>
          </div>
          
          {/* Visual Bookmarks */}
          <BookmarkRibbon />
        </div>
        
        {/* Table of Contents Modal */}
        {showTableOfContents && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white rounded-t-2xl border-b border-forest-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-book-leather">
                  📖 Table of Contents
                </h2>
                <button
                  onClick={() => setShowTableOfContents(false)}
                  className="text-forest-600 hover:text-forest-800 text-2xl"
                >
                  ×
                </button>
              </div>
              <TableOfContents onNavigate={() => setShowTableOfContents(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookContainer;