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
      position: 'top-36'
    },
    {
      id: 'ai',
      title: 'AI',
      icon: '🤖',
      href: '/ai-chat',
      color: 'bg-purple-600',
      position: 'top-52'
    },
    {
      id: 'dashboard',
      title: 'Journey',
      icon: '🏆',
      href: '/gamification',
      color: 'bg-gold-600',
      position: 'top-68'
    },
    {
      id: 'profile',
      title: 'Myths',
      icon: '🎯',
      href: '/myths',
      color: 'bg-green-600',
      position: 'top-84'
    }
  ];

  const handleTabClick = (href) => {
    onPageFlip();
    setTimeout(() => {
      navigate(href);
    }, 300);
  };

  return (
    <div className="relative h-full">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.href;
        
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.href)}
            className={`absolute ${tab.position} w-16 h-12 ${tab.color} ${
              isActive ? 'shadow-lg scale-105 z-10' : 'hover:scale-105'
            } transition-all duration-300 rounded-r-lg flex flex-col items-center justify-center text-white group`}
          >
            <div className="text-lg mb-1">{tab.icon}</div>
            <div className="text-xs font-bold leading-tight">{tab.title}</div>
            
            {/* Active indicator */}
            {isActive && (
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-full"></div>
            )}
            
            {/* Hover tooltip */}
            <div className="absolute left-20 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {tab.title}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ChapterTabs;