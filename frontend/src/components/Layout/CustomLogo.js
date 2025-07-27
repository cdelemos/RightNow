import React from 'react';

const CustomLogo = ({ size = 'md', showText = true, className = '', logoUrl = null }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center relative overflow-hidden`}>
        {logoUrl ? (
          // Custom logo image
          <img 
            src={logoUrl} 
            alt="RightNow Logo" 
            className="w-full h-full object-contain"
          />
        ) : (
          // Default logo with forest green theme
          <div className="w-full h-full bg-forest-600 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-lg shadow-forest-200/50">
            {/* Clock Background */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg 
                className="w-2/3 h-2/3 text-white/20" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
              </svg>
            </div>
            
            {/* Gavel Overlay */}
            <div className="relative z-10">
              <svg 
                className="w-1/2 h-1/2 text-white" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M1.4 15.5l1.9 1.9 9.1-9.1-1.9-1.9-9.1 9.1zm8.1 2l1.9 1.9 2.1-2.1-1.9-1.9-2.1 2.1zm2.1-8.1l1.9-1.9L11.6 5.6 9.7 7.5l1.9 1.9zm8.1 8.1l-2.1 2.1 1.9 1.9L21.3 19.6l-1.9-1.9zm-6.2-6.2l2.1-2.1-1.9-1.9-2.1 2.1 1.9 1.9z"/>
                <path d="M2 21h20v2H2v-2z"/>
              </svg>
            </div>
          </div>
        )}
      </div>
      
      {/* Logo Text */}
      {showText && (
        <div className={`font-display font-bold text-forest-800 ${textSizes[size]}`}>
          RightNow
        </div>
      )}
    </div>
  );
};

export default CustomLogo;