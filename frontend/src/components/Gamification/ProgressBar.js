import React from 'react';

const ProgressBar = ({ 
  current, 
  total, 
  label,
  showPercentage = true,
  showNumbers = true,
  color = 'sage',
  height = 'h-2',
  animated = true,
  className = ''
}) => {
  const percentage = Math.min((current / total) * 100, 100);
  
  const colorClasses = {
    sage: 'from-sage-500 to-green-500',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    green: 'from-green-500 to-green-600'
  };

  const gradientClass = colorClasses[color] || colorClasses.sage;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showNumbers && (
            <span className="text-sm text-gray-600">
              {current} / {total}
              {showPercentage && ` (${Math.round(percentage)}%)`}
            </span>
          )}
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full ${height}`}>
        <div 
          className={`bg-gradient-to-r ${gradientClass} ${height} rounded-full transition-all duration-500 ease-in-out ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {!label && showPercentage && (
        <div className="text-xs text-gray-600 mt-1 text-center">
          {Math.round(percentage)}% Complete
        </div>
      )}
    </div>
  );
};

export default ProgressBar;