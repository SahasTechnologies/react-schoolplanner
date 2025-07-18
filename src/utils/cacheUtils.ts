// Service Worker Registration and Cache Management

export const registerServiceWorker = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator) {
    try {
      console.log('Registering service worker...');
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('Service Worker is ready');
      
      // Proactively cache important files
      await cacheImportantFiles();
      
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }
  console.log('Service Worker not supported in this browser');
  return false;
};

const cacheImportantFiles = async (): Promise<void> => {
  if (!('caches' in window)) return;
  
  try {
    console.log('Proactively caching important files...');
    const cache = await caches.open('school-planner-v1');
    
    // List of important files to cache
    const filesToCache = [
      '/',
      '/index.html',
      '/public/school.svg',
      // Add any other critical assets here
    ];
    
    // Cache each file
    for (const file of filesToCache) {
      try {
        await cache.add(file);
        console.log('Cached:', file);
      } catch (error) {
        console.warn('Failed to cache:', file, error);
      }
    }
    
    console.log('Proactive caching completed');
  } catch (error) {
    console.error('Proactive caching failed:', error);
  }
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
    if (registration) {
      console.log('Service Worker registration found:', registration);
      console.log('Service Worker state:', registration.active?.state);
      return 'registered';
    }
    return 'not-registered';
  } catch (error) {
    console.error('Error checking service worker status:', error);
    return 'not-registered';
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
  } catch (error) {
    console.error('Error checking cache status:', error);
    return { hasCache: false, cacheSize: 0 };
  }
}; 