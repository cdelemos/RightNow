import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ChapterTabs = ({ onPageFlip }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      id: 'learn',
      title: 'Learn',
      icon: '📚',
      href: '/dashboard',
      color: 'bg-blue-600',
      position: 'top-20'
    },
    {
      id: 'tools',
      title: 'Tools',
      icon: '🛠️',
      href: '/emergency-contacts',
      color: 'bg-red-600',
      position: 'top-40'
    },
    {
      id: 'ai',
      title: 'AI',
      icon: '🤖',
      href: '/ai-chat',
      color: 'bg-purple-600',
      position: 'top-60'
    },
    {
      id: 'dashboard',
      title: 'Journey',
      icon: '🏆',
      href: '/gamification',
      color: 'bg-gold-600',
      position: 'top-80'
    },
    {
      id: 'profile',
      title: 'Profile',
      icon: '👤',
      href: '/profile',
      color: 'bg-forest-600',
      position: 'top-100'
    }
  ];

  const handleTabClick = (href) => {
    onPageFlip();
    setTimeout(() => {
      navigate(href);
    }, 300);
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 w-16 z-10">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.href;
        
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.href)}
            className={`absolute right-0 ${tab.position} w-20 h-16 ${tab.color} ${
              isActive ? 'shadow-lg scale-110' : 'hover:scale-105'
            } transition-all duration-300 rounded-l-xl flex flex-col items-center justify-center text-white group`}
            style={{
              clipPath: 'polygon(0 0, 80% 0, 100% 50%, 80% 100%, 0 100%)'
            }}
          >
            <div className="text-xl mb-1">{tab.icon}</div>
            <div className="text-xs font-bold">{tab.title}</div>
            
            {/* Active indicator */}
            {isActive && (
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-full"></div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ChapterTabs;