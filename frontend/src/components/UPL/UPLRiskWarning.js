import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const UPLRiskWarning = ({ query, severity = 'medium', onDismiss, onSeekAdvice }) => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [animationState, setAnimationState] = useState('entering');

  useEffect(() => {
    setAnimationState('visible');
    
    // Auto-dismiss after 10 seconds for low severity
    if (severity === 'low') {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [severity]);

  const handleDismiss = () => {
    setAnimationState('leaving');
    setTimeout(() => {
      setIsVisible(false);
      if (onDismiss) onDismiss();
    }, 300);
  };

  const handleSeekAdvice = () => {
    if (onSeekAdvice) onSeekAdvice();
    handleDismiss();
  };

  const getSeverityConfig = () => {
    switch (severity) {
      case 'high':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-400',
          iconColor: 'text-red-600',
          textColor: 'text-red-800',
          buttonColor: 'bg-red-600 hover:bg-red-700',
          icon: '🚨',
          title: 'HIGH RISK: Potential UPL Violation'
        };
      case 'medium':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-400',
          iconColor: 'text-yellow-600',
          textColor: 'text-yellow-800',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
          icon: '⚠️',
          title: 'CAUTION: Possible Legal Advice Request'
        };
      case 'low':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-400',
          iconColor: 'text-blue-600',
          textColor: 'text-blue-800',
          buttonColor: 'bg-blue-600 hover:bg-blue-700',
          icon: 'ℹ️',
          title: 'NOTICE: Educational Content Only'
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-400',
          iconColor: 'text-gray-600',
          textColor: 'text-gray-800',
          buttonColor: 'bg-gray-600 hover:bg-gray-700',
          icon: '⚠️',
          title: 'Legal Information Notice'
        };
    }
  };

  const getWarningMessage = () => {
    switch (severity) {
      case 'high':
        return {
          message: "Your question appears to be requesting specific legal advice for your situation. This platform provides educational information only and cannot provide legal advice.",
          recommendation: "We strongly recommend consulting with a licensed attorney for your specific legal matter."
        };
      case 'medium':
        return {
          message: "Your question may be seeking specific legal advice. Remember that this platform provides general legal education, not personalized legal counsel.",
          recommendation: "For specific legal matters, please consult with a qualified attorney in your jurisdiction."
        };
      case 'low':
        return {
          message: "This information is for educational purposes only and should not be considered legal advice for your specific situation.",
          recommendation: "Always consult with a licensed attorney for legal advice tailored to your circumstances."
        };
      default:
        return {
          message: "This platform provides general legal information for educational purposes only.",
          recommendation: "For specific legal advice, please consult with a qualified attorney."
        };
    }
  };

  if (!isVisible) return null;

  const config = getSeverityConfig();
  const warningContent = getWarningMessage();

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md transition-all duration-300 ${
      animationState === 'entering' ? 'opacity-0 transform translate-x-full' :
      animationState === 'leaving' ? 'opacity-0 transform translate-x-full' :
      'opacity-100 transform translate-x-0'
    }`}>
      <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-lg p-4 shadow-lg`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <span className={`text-2xl ${config.iconColor} mr-2`}>{config.icon}</span>
            <h3 className={`font-bold ${config.textColor} text-sm`}>{config.title}</h3>
          </div>
          <button
            onClick={handleDismiss}
            className={`${config.textColor} hover:opacity-75 text-xl leading-none`}
          >
            ×
          </button>
        </div>

        {/* Warning Message */}
        <div className="mb-4">
          <p className={`${config.textColor} text-sm mb-2`}>
            {warningContent.message}
          </p>
          <p className={`${config.textColor} text-xs font-medium`}>
            {warningContent.recommendation}
          </p>
        </div>

        {/* User Query Preview */}
        {query && (
          <div className="mb-4 p-3 bg-white/70 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Your question:</div>
            <div className="text-sm text-gray-800 italic">
              "{query.length > 100 ? query.substring(0, 100) + '...' : query}"
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleSeekAdvice}
            className={`${config.buttonColor} text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1`}
          >
            Find Attorney
          </button>
          <button
            onClick={handleDismiss}
            className={`bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors`}
          >
            Continue
          </button>
        </div>

        {/* Gavvy Integration */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center text-xs text-gray-600">
            <span className="mr-2">🔨</span>
            <span>Gavvy says: "Remember, I'm here to educate, not to replace your attorney!"</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for UPL risk detection
export const useUPLRiskDetection = () => {
  const analyzeQuery = (query) => {
    if (!query || query.length < 10) return null;

    const highRiskPatterns = [
      /should i (sue|file|divorce|marry|sign)/i,
      /what should i do (about|with|if)/i,
      /can i (sue|file|get)/i,
      /my (case|situation|divorce|contract)/i,
      /i need to (sue|file|divorce)/i,
      /help me (sue|file|get)/i,
      /in my (case|situation)/i
    ];

    const mediumRiskPatterns = [
      /what are my (rights|options)/i,
      /can (someone|they|i)/i,
      /is (this|it) legal/i,
      /what happens if/i,
      /how do i (file|apply|get)/i,
      /what should (someone|i) do/i
    ];

    const lowRiskPatterns = [
      /what is/i,
      /how does/i,
      /can you explain/i,
      /what does.*mean/i,
      /definition of/i,
      /general information/i
    ];

    // Check for high risk patterns
    for (const pattern of highRiskPatterns) {
      if (pattern.test(query)) {
        return { severity: 'high', trigger: pattern.source };
      }
    }

    // Check for medium risk patterns
    for (const pattern of mediumRiskPatterns) {
      if (pattern.test(query)) {
        return { severity: 'medium', trigger: pattern.source };
      }
    }

    // Check for low risk patterns
    for (const pattern of lowRiskPatterns) {
      if (pattern.test(query)) {
        return { severity: 'low', trigger: pattern.source };
      }
    }

    return null;
  };

  return { analyzeQuery };
};

export default UPLRiskWarning;