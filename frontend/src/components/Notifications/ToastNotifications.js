import React from 'react';
import { useNotifications } from '../../context/NotificationContext';

const ToastNotifications = () => {
  const { toastNotifications, removeToastNotification } = useNotifications();

  if (toastNotifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toastNotifications.map((toast) => (
        <div
          key={toast.id}
          className={`
            max-w-sm bg-white rounded-lg shadow-lg border-l-4 p-4 transform transition-all duration-300 ease-in-out
            animate-slide-in-right
            ${toast.priority === 'high' ? 'border-l-amber-500' : 
              toast.priority === 'urgent' ? 'border-l-red-500' :
              'border-l-green-500'}
          `}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">{toast.icon || '🔔'}</span>
            </div>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-semibold text-gray-900">
                {toast.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToastNotification(toast.id)}
              className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress bar for auto-dismiss */}
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className={`
                  h-1 rounded-full transition-all duration-5000 ease-linear
                  ${toast.priority === 'high' ? 'bg-amber-500' : 
                    toast.priority === 'urgent' ? 'bg-red-500' :
                    'bg-green-500'}
                `}
                style={{
                  width: '100%',
                  animation: 'progress-bar 5s linear forwards'
                }}
              />
            </div>
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes progress-bar {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
        
        .duration-5000 {
          animation-duration: 5s;
        }
      `}</style>
    </div>
  );
};

export default ToastNotifications;