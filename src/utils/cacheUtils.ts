// Service Worker Registration and Cache Management

export const registerServiceWorker = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }
  return false;
};

export const unregisterServiceWorker = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
        console.log('Service Worker unregistered successfully');
        return true;
      }
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
    }
  }
  return false;
};

export const clearAllCaches = async (): Promise<boolean> => {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear caches:', error);
      return false;
    }
  }
  return false;
};

export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};

export const getServiceWorkerStatus = async (): Promise<'registered' | 'not-registered' | 'not-supported'> => {
  if (!isServiceWorkerSupported()) {
    return 'not-supported';
  }
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration ? 'registered' : 'not-registered';
  } catch (error) {
    console.error('Error checking service worker status:', error);
    return 'not-registered';
  }
}; 