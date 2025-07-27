import React from 'react';
import { useNavigate } from 'react-router-dom';

const TableOfContents = ({ onNavigate }) => {
  const navigate = useNavigate();

  const chapters = [
    {
      title: 'Learn Your Rights',
      icon: '⚖️',
      description: 'Master fundamental legal concepts',
      pages: [
        { title: 'Legal Statutes', href: '/statutes', icon: '📚' },
        { title: 'Learning Paths', href: '/learning-paths', icon: '🎓' },
        { title: 'Legal Myths', href: '/myths', icon: '🎯' },
      ]
    },
    {
      title: 'Emergency Toolkit',
      icon: '🛡️',
      description: 'Critical safety tools and resources',
      pages: [
        { title: 'SOS Tools', href: '/emergency-contacts', icon: '🚨' },
        { title: 'Know Your Scripts', href: '/scripts', icon: '📝' },
        { title: 'Emergency Contacts', href: '/contacts', icon: '📞' },
      ]
    },
    {
      title: 'Ask the AI',
      icon: '🤖',
      description: 'Get instant legal guidance',
      pages: [
        { title: 'AI Assistant', href: '/ai-chat', icon: '💬' },
        { title: 'Legal Q&A', href: '/questions', icon: '❓' },
        { title: 'Case Studies', href: '/cases', icon: '📋' },
      ]
    },
    {
      title: 'Your Justice Journey',
      icon: '🏆',
      description: 'Track progress and achievements',
      pages: [
        { title: 'Justice Meter', href: '/justice-meter', icon: '📊' },
        { title: 'Achievements', href: '/achievements', icon: '🏅' },
        { title: 'Profile', href: '/profile', icon: '👤' },
      ]
    },
    {
      title: 'Daily Myths & Scripts',
      icon: '📰',
      description: 'Daily learning and practice',
      pages: [
        { title: 'Daily Learning', href: '/dashboard', icon: '📖' },
        { title: 'Simulations', href: '/simulations', icon: '🎮' },
        { title: 'Practice Arena', href: '/practice', icon: '🥊' },
      ]
    }
  ];

  const handleChapterClick = (href) => {
    onNavigate();
    navigate(href);
  };

  return (
    <div className="h-full p-8 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-book-leather mb-2">
          Table of Contents
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-gold-400 to-gold-600 mx-auto rounded-full"></div>
      </div>

      {/* Chapters */}
      <div className="space-y-6">
        {chapters.map((chapter, index) => (
          <div key={index} className="group">
            {/* Chapter Title */}
            <div className="flex items-center mb-3 p-3 rounded-lg hover:bg-forest-50 transition-colors cursor-pointer">
              <div className="text-2xl mr-3">{chapter.icon}</div>
              <div>
                <h3 className="text-lg font-bold text-book-leather group-hover:text-forest-700">
                  {chapter.title}
                </h3>
                <p className="text-sm text-forest-600">{chapter.description}</p>
              </div>
            </div>

            {/* Chapter Pages */}
            <div className="ml-10 space-y-2">
              {chapter.pages.map((page, pageIndex) => (
                <button
                  key={pageIndex}
                  onClick={() => handleChapterClick(page.href)}
                  className="flex items-center w-full text-left p-2 rounded-lg hover:bg-gold-50 hover:shadow-md transition-all duration-200 group"
                >
                  <span className="text-lg mr-3">{page.icon}</span>
                  <span className="text-forest-700 group-hover:text-book-leather font-medium">
                    {page.title}
                  </span>
                  
                  {/* Page corner hover effect */}
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-forest-200 text-center">
        <p className="text-forest-500 text-sm italic">
          "Knowledge is power, but knowledge of your rights is protection."
        </p>
      </div>
    </div>
  );
};

export default TableOfContents;