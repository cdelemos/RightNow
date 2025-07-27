import React, { useState, useEffect } from 'react';

const UnlockNotification = ({ unlock, onClose }) => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    if (unlock) {
      setVisible(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [unlock]);
  
  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };
  
  if (!unlock) return null;
  
  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
      visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-white rounded-lg shadow-lg border-l-4 border-green-500 p-4 max-w-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🎉</div>
            <div>
              <h3 className="font-semibold text-gray-800">Protection Unlocked!</h3>
              <p className="text-sm text-gray-600 mt-1">
                {unlock.protection?.statute_title}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {unlock.protection?.state} • {unlock.protection?.statute_code}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>
        
        {unlock.celebration && (
          <div className="mt-3 p-2 bg-green-50 rounded text-xs text-green-700">
            {unlock.celebration.message}
          </div>
        )}
        
        <div className="mt-3 flex space-x-2">
          <button
            onClick={handleClose}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-3 rounded transition-colors"
          >
            View Details
          </button>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-sm py-1 px-3 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnlockNotification;