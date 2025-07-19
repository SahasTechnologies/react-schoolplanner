import { useState, useEffect } from 'react';

// Hook to detect online/offline status
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Function to check if currently offline
export const isOffline = (): boolean => {
  return !navigator.onLine;
};

// Function to get offline status with additional context
export const getNetworkStatus = () => {
  return {
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
    timestamp: new Date().toISOString()
  };
}; 