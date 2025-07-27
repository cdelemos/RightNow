import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const BookmarkRibbon = () => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);

  // Sample bookmarks - in real app, fetch from backend
  useEffect(() => {
    setBookmarks([
      {
        id: 1,
        title: 'Tenant Rights Guide',
        color: 'bg-blue-500',
        href: '/learning-paths/tenant-rights',
        progress: 75
      },
      {
        id: 2,
        title: 'Emergency Contacts',
        color: 'bg-red-500',
        href: '/emergency-contacts',
        progress: 100
      },
      {
        id: 3,
        title: 'AI Chat Session',
        color: 'bg-purple-500',
        href: '/ai-chat',
        progress: 50
      }
    ]);
  }, []);

  return (
    <div className="absolute right-0 top-0 bottom-0 w-3 z-20">
      {/* Bookmark Ribbons */}
      <div className="relative h-full">
        {bookmarks.map((bookmark, index) => (
          <div
            key={bookmark.id}
            className={`absolute right-0 w-6 h-20 ${bookmark.color} shadow-lg cursor-pointer transform hover:scale-110 transition-all duration-300`}
            style={{
              top: `${20 + index * 25}%`,
              clipPath: 'polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%)'
            }}
            onClick={() => setShowBookmarks(!showBookmarks)}
          >
            {/* Progress indicator */}
            <div 
              className="absolute bottom-0 left-0 right-0 bg-white/30 transition-all duration-500"
              style={{ height: `${bookmark.progress}%` }}
            ></div>
          </div>
        ))}
      </div>

      {/* Bookmark Index Panel */}
      {showBookmarks && (
        <div className="absolute right-6 top-20 w-72 bg-white rounded-lg shadow-2xl border border-forest-200 z-30">
          <div className="p-4 border-b border-forest-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-book-leather">📑 Saved Bookmarks</h3>
              <button
                onClick={() => setShowBookmarks(false)}
                className="text-forest-600 hover:text-forest-800"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-3">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-forest-50 cursor-pointer group transition-colors"
              >
                <div className="flex items-center">
                  <div className={`w-3 h-3 ${bookmark.color} rounded-full mr-3`}></div>
                  <div>
                    <div className="font-medium text-book-leather group-hover:text-forest-700 text-sm">
                      {bookmark.title}
                    </div>
                    <div className="text-xs text-forest-600">
                      {bookmark.progress}% complete
                    </div>
                  </div>
                </div>
                
                <svg className="w-4 h-4 text-forest-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-forest-200">
            <button className="w-full bg-forest-600 text-white py-2 rounded-lg hover:bg-forest-700 transition-colors text-sm">
              View All Bookmarks
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookmarkRibbon;