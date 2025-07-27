import React, { createContext, useContext, useState, useCallback } from 'react';
import UnlockNotification from '../components/Unlocks/UnlockNotification';

const UnlockContext = createContext();

export const useUnlock = () => {
  const context = useContext(UnlockContext);
  if (!context) {
    throw new Error('useUnlock must be used within an UnlockProvider');
  }
  return context;
};

export const UnlockProvider = ({ children }) => {
  const [currentUnlock, setCurrentUnlock] = useState(null);
  const [unlockQueue, setUnlockQueue] = useState([]);
  
  const showUnlockNotification = useCallback((unlockData) => {
    if (currentUnlock) {
      // If there's already a notification showing, queue this one
      setUnlockQueue(prev => [...prev, unlockData]);
    } else {
      // Show immediately
      setCurrentUnlock(unlockData);
    }
  }, [currentUnlock]);
  
  const hideCurrentUnlock = useCallback(() => {
    setCurrentUnlock(null);
    
    // Show next in queue if any
    if (unlockQueue.length > 0) {
      const nextUnlock = unlockQueue[0];
      setUnlockQueue(prev => prev.slice(1));
      setTimeout(() => {
        setCurrentUnlock(nextUnlock);
      }, 300);
    }
  }, [unlockQueue]);
  
  const value = {
    showUnlockNotification,
    hideCurrentUnlock,
    currentUnlock
  };
  
  return (
    <UnlockContext.Provider value={value}>
      {children}
      <UnlockNotification
        unlock={currentUnlock}
        onClose={hideCurrentUnlock}
      />
    </UnlockContext.Provider>
  );
};

export default UnlockProvider;