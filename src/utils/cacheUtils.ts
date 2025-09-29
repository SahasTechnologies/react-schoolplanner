// Service Worker Registration and Cache Management

export const registerServiceWorker = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      return true;
    } catch {
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
        return true;
      }
    } catch {
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
      return true;
    } catch {
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
    if (registration) {
      return 'registered';
    }
    return 'not-registered';
  } catch {
    return 'not-registered';
  }
};

// Check for service worker updates
export const checkForUpdates = async (): Promise<boolean> => {
  if (!isServiceWorkerSupported()) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      
      // Listen for new service worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available! (notification removed)
            }
          });
        }
      });
      
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

// Force update the cache
export const forceCacheUpdate = async (): Promise<boolean> => {
  if (!isServiceWorkerSupported()) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration && registration.active) {
      // Send message to service worker to update cache
      registration.active.postMessage({ type: 'UPDATE_CACHE' });
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

export const checkCacheStatus = async (): Promise<{ hasCache: boolean; cacheSize: number }> => {
  if (!('caches' in window)) {
    return { hasCache: false, cacheSize: 0 };
  }
  
  try {
    const cacheNames = await caches.keys();
    const schoolPlannerCache = cacheNames.find(name => name.includes('school-planner'));
    
    if (schoolPlannerCache) {
      const cache = await caches.open(schoolPlannerCache);
      const keys = await cache.keys();
      return { hasCache: true, cacheSize: keys.length };
    }
    
    return { hasCache: false, cacheSize: 0 };
  } catch {
    return { hasCache: false, cacheSize: 0 };
  }
};