import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CompassRoseEmergency = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [selectedTool, setSelectedTool] = useState(null);
  const [isRotating, setIsRotating] = useState(false);

  const emergencyTools = [
    {
      id: 'statutes',
      title: 'Statute Search',
      description: 'Find relevant laws quickly',
      icon: '📚',
      color: 'bg-blue-600',
      angle: 0, // Top
      action: () => navigate('/statutes')
    },
    {
      id: 'scripts',
      title: 'Emergency Scripts',
      description: 'Know what to say',
      icon: '📝',
      color: 'bg-green-600',
      angle: 120, // Right
      action: () => navigate('/ai-chat')
    },
    {
      id: 'contacts',
      title: 'Alert Contacts',
      description: 'Notify your circle',
      icon: '📞',
      color: 'bg-red-600',
      angle: 240, // Left
      action: () => navigate('/emergency-contacts')
    }
  ];

  const handleToolClick = (tool) => {
    setSelectedTool(tool.id);
    setIsRotating(true);
    
    setTimeout(() => {
      tool.action();
      onClose();
      setIsRotating(false);
      setSelectedTool(null);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-8 -right-8 bg-white rounded-full w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 z-10"
        >
          ×
        </button>
        
        {/* Compass Rose Container */}
        <div className={`relative w-80 h-80 transition-all duration-1000 ${
          isRotating ? 'rotate-180 scale-110' : ''
        }`}>
          {/* Compass Background */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 shadow-2xl border-8 border-amber-700">
            {/* Compass rings */}
            <div className="absolute inset-4 rounded-full border-4 border-amber-800 bg-gradient-to-br from-amber-100 to-amber-200">
              <div className="absolute inset-4 rounded-full border-2 border-amber-700 bg-gradient-to-br from-amber-50 to-amber-100">
                <div className="absolute inset-8 rounded-full border-2 border-amber-600 bg-gradient-to-br from-white to-amber-50">
                  {/* Center emergency icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-4xl animate-pulse">🆘</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Compass directions */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Cardinal directions */}
            <div className="absolute -top-6 text-amber-900 font-bold text-lg">N</div>
            <div className="absolute -right-6 text-amber-900 font-bold text-lg">E</div>
            <div className="absolute -bottom-6 text-amber-900 font-bold text-lg">S</div>
            <div className="absolute -left-6 text-amber-900 font-bold text-lg">W</div>
          </div>
          
          {/* Emergency Tools */}
          {emergencyTools.map((tool, index) => {
            const isSelected = selectedTool === tool.id;
            const angleRad = (tool.angle * Math.PI) / 180;
            const radius = 120;
            const x = Math.sin(angleRad) * radius;
            const y = -Math.cos(angleRad) * radius;
            
            return (
              <div
                key={tool.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `50%`,
                  top: `50%`,
                  transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`
                }}
              >
                <button
                  onClick={() => handleToolClick(tool)}
                  className={`w-20 h-20 rounded-full ${tool.color} shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center text-white group ${
                    isSelected ? 'scale-125 animate-pulse' : 'hover:scale-110'
                  }`}
                >
                  <div className="text-2xl mb-1">{tool.icon}</div>
                  <div className="text-xs font-bold text-center leading-tight">
                    {tool.title.split(' ')[0]}
                  </div>
                  
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
                
                {/* Tool description */}
                <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white rounded-lg px-3 py-2 shadow-lg text-sm text-gray-800 whitespace-nowrap">
                    <div className="font-bold">{tool.title}</div>
                    <div className="text-xs text-gray-600">{tool.description}</div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Compass needle */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
            selectedTool ? 'rotate-12' : ''
          }`}>
            <div className="w-1 h-16 bg-red-600 rounded-full shadow-lg transform -translate-y-4">
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-600 rounded-full"></div>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-400 rounded-full"></div>
            </div>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center text-white">
          <div className="text-lg font-bold mb-2">🧭 Emergency Toolkit</div>
          <div className="text-sm opacity-80">
            Click a tool to navigate quickly
          </div>
        </div>
        
        {/* Loading indicator */}
        {selectedTool && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-lg p-4 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-600 border-t-transparent"></div>
                <div className="text-gray-800">Loading emergency tool...</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompassRoseEmergency;