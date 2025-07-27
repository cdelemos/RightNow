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
        { title: 'Personalized Learning', href: '/personalized-learning', icon: '🎯' },
        { title: 'Legal Myths', href: '/myths', icon: '🔍' },
      ]
    },
    {
      title: 'Emergency Toolkit',
      icon: '🛡️',
      description: 'Critical safety tools and resources',
      pages: [
        { title: 'Emergency SOS', href: '/emergency-contacts', icon: '🚨' },
        { title: 'Know Your Scripts', href: '/ai-chat', icon: '📝' },
        { title: 'Simulations', href: '/simulations', icon: '🎮' },
      ]
    },
    {
      title: 'Ask the AI',
      icon: '🤖',
      description: 'Get instant legal guidance',
      pages: [
        { title: 'AI Assistant', href: '/ai-chat', icon: '💬' },
        { title: 'Legal Q&A', href: '/questions', icon: '❓' },
      ]
    },
    {
      title: 'Your Justice Journey',
      icon: '🏆',
      description: 'Track progress and achievements',
      pages: [
        { title: 'Gamification Hub', href: '/gamification', icon: '🎮' },
        { title: 'Trophy Wall', href: '/trophy-wall', icon: '🏆' },
        { title: 'Daily Learning', href: '/dashboard', icon: '📖' },
      ]
    },
    {
      title: 'About RightNow',
      icon: '🌟',
      description: 'Learn about our mission and values',
      pages: [
        { title: 'About Us', href: '/about', icon: '🌟' },
      ]
    }
  ];

  const handleChapterClick = (href) => {
    onNavigate();
    navigate(href);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-20 h-1 bg-gradient-to-r from-gold-400 to-gold-600 mx-auto rounded-full mb-4"></div>
        <p className="text-forest-600">Navigate to any section quickly</p>
      </div>

      {/* Chapters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {chapters.map((chapter, index) => (
          <div key={index} className="bg-gradient-to-br from-forest-50 to-forest-100 rounded-lg p-6 border border-forest-200 hover:shadow-lg transition-shadow">
            {/* Chapter Title */}
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">{chapter.icon}</div>
              <div>
                <h3 className="text-lg font-bold text-book-leather">
                  {chapter.title}
                </h3>
                <p className="text-sm text-forest-600">{chapter.description}</p>
              </div>
            </div>

            {/* Chapter Pages */}
            <div className="space-y-2">
              {chapter.pages.map((page, pageIndex) => (
                <button
                  key={pageIndex}
                  onClick={() => handleChapterClick(page.href)}
                  className="flex items-center w-full text-left p-3 rounded-lg hover:bg-white hover:shadow-md transition-all duration-200 group"
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