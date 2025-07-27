import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import TableOfContents from './TableOfContents';
import ChapterTabs from './ChapterTabs';
import BookmarkRibbon from './BookmarkRibbon';

const BookContainer = ({ children }) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-book-leather via-forest-900 to-book-leather flex items-center justify-center p-4">
      {/* Book Cover/Container */}
      <div className="relative w-full max-w-6xl mx-auto">
        {/* Book Shadow */}
        <div className="absolute inset-0 bg-black/20 blur-xl transform translate-y-4 scale-105 rounded-2xl"></div>
        
        {/* Main Book */}
        <div className="relative bg-book-leather rounded-2xl shadow-2xl overflow-hidden border-4 border-forest-800">
          {/* Book Spine Effect */}
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-forest-900 to-book-leather border-r-2 border-forest-700"></div>
          
          {/* Chapter Tabs */}
          <ChapterTabs onPageFlip={handlePageFlip} />
          
          {/* Main Content Area */}
          <div className="relative ml-6 bg-book-page min-h-[80vh] flex">
            {/* Left Page */}
            <div className="w-1/2 relative">
              {/* Page Texture */}
              <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-amber-50 to-yellow-50 mix-blend-multiply"></div>
              
              {/* Table of Contents Toggle */}
              <button
                onClick={() => setShowTableOfContents(!showTableOfContents)}
                className="absolute top-4 left-4 z-10 bg-forest-700 text-white px-4 py-2 rounded-lg hover:bg-forest-600 transition-colors shadow-lg"
              >
                📖 Contents
              </button>
              
              {/* Table of Contents or Empty Left Page */}
              {showTableOfContents ? (
                <TableOfContents onNavigate={() => setShowTableOfContents(false)} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-forest-600 opacity-50">
                    <div className="text-6xl mb-4">📖</div>
                    <p className="text-lg">RightNow Legal</p>
                    <p className="text-sm">Education Platform</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Page Divider */}
            <div className="w-px bg-gradient-to-b from-transparent via-forest-200 to-transparent"></div>
            
            {/* Right Page - Main Content */}
            <div className="w-1/2 relative">
              {/* Page Texture */}
              <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-amber-50 to-yellow-50 mix-blend-multiply"></div>
              
              {/* Content with flip animation */}
              <div className={`relative h-full transition-all duration-600 transform ${
                isFlipping ? 'rotateY-180 opacity-0' : 'rotateY-0 opacity-100'
              }`}>
                {children}
              </div>
              
              {/* Page Corner Fold Effect */}
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-forest-100 to-transparent transform rotate-45 translate-x-8 translate-y-8 opacity-20"></div>
            </div>
          </div>
          
          {/* Visual Bookmarks */}
          <BookmarkRibbon />
        </div>
      </div>
    </div>
  );
};

export default BookContainer;