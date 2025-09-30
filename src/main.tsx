import React from 'react'
import ReactDOM from 'react-dom/client'
import SchoolPlanner from './schoolplanner';
import RedirectPage from './components/RedirectPage';
// Red Hat Text is now loaded via Bunny Fonts in index.html
import './index.css' // Keep base styles
import { BrowserRouter } from 'react-router-dom';

// Check if accessing from pages.dev domain
const isPagesDev = window.location.hostname.endsWith('.pages.dev');

// For non-pages.dev domains, force update cache if service worker is active
if (!isPagesDev && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration().then(registration => {
    if (registration) {
      // Force update check on the new domain
      registration.update();
    }
  });
}

// For pages.dev: Force hard reload to bypass cache and show redirect page
// This ensures users see the new redirect page instead of cached old version
if (isPagesDev) {
  const hasReloaded = sessionStorage.getItem('pagesDevReloaded');
  
  if (!hasReloaded) {
    // Mark that we've reloaded once this session
    sessionStorage.setItem('pagesDevReloaded', 'true');
    
    // Force hard reload to bypass cache
    window.location.reload();
  } else {
    // After reload, clear caches but localStorage remains intact
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Unregister service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      });
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isPagesDev ? (
      <RedirectPage />
    ) : (
      <BrowserRouter>
        <SchoolPlanner />
      </BrowserRouter>
    )}
  </React.StrictMode>
)