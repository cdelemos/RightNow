import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PictureFrameScenario = ({ scenarios = [] }) => {
  const navigate = useNavigate();
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [animatingFrame, setAnimatingFrame] = useState(null);

  const defaultScenarios = [
    {
      id: 1,
      title: "ICE Encounter",
      description: "Know your rights during an immigration stop",
      image: "🚔", // Using emoji for now
      difficulty: "Advanced",
      color: "from-red-500 to-red-700",
      frameStyle: "ornate-gold",
      tags: ["immigration", "rights", "encounter"]
    },
    {
      id: 2,
      title: "Tenant Dispute",
      description: "Navigate housing conflicts with confidence",
      image: "🏠",
      difficulty: "Intermediate",
      color: "from-blue-500 to-blue-700",
      frameStyle: "classic-wood",
      tags: ["housing", "landlord", "dispute"]
    },
    {
      id: 3,
      title: "Workplace Rights",
      description: "Protect yourself from employment violations",
      image: "👔",
      difficulty: "Beginner",
      color: "from-green-500 to-green-700",
      frameStyle: "modern-silver",
      tags: ["employment", "workplace", "rights"]
    },
    {
      id: 4,
      title: "Police Traffic Stop",
      description: "Handle traffic stops with legal awareness",
      image: "🚗",
      difficulty: "Beginner",
      color: "from-purple-500 to-purple-700",
      frameStyle: "vintage-bronze",
      tags: ["traffic", "police", "stop"]
    }
  ];

  const scenarioData = scenarios.length > 0 ? scenarios : defaultScenarios;

  const getFrameStyle = (frameStyle) => {
    switch (frameStyle) {
      case 'ornate-gold':
        return 'border-8 border-gold-400 shadow-2xl bg-gradient-to-br from-gold-100 to-gold-200';
      case 'classic-wood':
        return 'border-8 border-amber-600 shadow-2xl bg-gradient-to-br from-amber-100 to-amber-200';
      case 'modern-silver':
        return 'border-8 border-gray-400 shadow-2xl bg-gradient-to-br from-gray-100 to-gray-200';
      case 'vintage-bronze':
        return 'border-8 border-amber-700 shadow-2xl bg-gradient-to-br from-amber-200 to-amber-300';
      default:
        return 'border-8 border-forest-600 shadow-2xl bg-gradient-to-br from-forest-100 to-forest-200';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleFrameClick = (scenario) => {
    setAnimatingFrame(scenario.id);
    setSelectedScenario(scenario);
    
    // Simulate frame animation
    setTimeout(() => {
      setAnimatingFrame(null);
      // Navigate to simulation with scenario data
      navigate('/simulations', { state: { scenario } });
    }, 800);
  };

  return (
    <div className="h-full p-8 overflow-y-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-book-leather mb-2">
          🖼️ Picture Frame Scenarios
        </h2>
        <p className="text-forest-600">
          Step into real-world legal situations through interactive story simulations
        </p>
        <div className="w-16 h-1 bg-gradient-to-r from-gold-400 to-gold-600 mx-auto mt-4 rounded-full"></div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {scenarioData.map((scenario) => (
          <div
            key={scenario.id}
            className={`relative group cursor-pointer transition-all duration-500 ${
              animatingFrame === scenario.id ? 'scale-110 z-10' : 'hover:scale-105'
            }`}
            onClick={() => handleFrameClick(scenario)}
          >
            {/* Picture Frame */}
            <div className={`${getFrameStyle(scenario.frameStyle)} rounded-lg p-6 relative overflow-hidden`}>
              {/* Frame shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              {/* Content */}
              <div className={`bg-gradient-to-br ${scenario.color} rounded-lg p-8 min-h-[200px] flex flex-col items-center justify-center text-white relative`}>
                {/* Scenario Image/Icon */}
                <div className="text-6xl mb-4 animate-bounce-soft">
                  {scenario.image}
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-bold mb-2 text-center">
                  {scenario.title}
                </h3>
                
                {/* Description */}
                <p className="text-sm text-center opacity-90 mb-4">
                  {scenario.description}
                </p>
                
                {/* Difficulty Badge */}
                <div className={`${getDifficultyColor(scenario.difficulty)} px-3 py-1 rounded-full text-xs font-bold`}>
                  {scenario.difficulty}
                </div>
                
                {/* Animation overlay */}
                {animatingFrame === scenario.id && (
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                )}
              </div>
              
              {/* Frame nameplate */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gold-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                {scenario.title}
              </div>
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {scenario.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-forest-100 text-forest-700 px-2 py-1 rounded-full text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
            
            {/* Hover instruction */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center mt-2">
              <p className="text-forest-600 text-sm">
                📋 Click to enter simulation
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Scenario Preview */}
      {selectedScenario && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-book-page rounded-lg p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">{selectedScenario.image}</div>
              <h3 className="text-xl font-bold text-book-leather">
                {selectedScenario.title}
              </h3>
              <p className="text-forest-600 mt-2">
                {selectedScenario.description}
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-forest-600 mb-4"></div>
              <p className="text-forest-600">Loading scenario...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PictureFrameScenario;