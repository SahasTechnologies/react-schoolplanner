import React from 'react'
import ReactDOM from 'react-dom/client'
import SchoolPlanner from './schoolplanner';
import RedirectPage from './components/RedirectPage';
// Red Hat Text is now loaded via Bunny Fonts in index.html
import './index.css' // Keep base styles
import { BrowserRouter } from 'react-router-dom';

// Allow only the primary production domain and local development hosts
const hostname = window.location.hostname;
const isLocalDev = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
const isPrimaryDomain = hostname === 'school.shimpi.link';
const isAllowedHost = isLocalDev || isPrimaryDomain;

// On disallowed hosts: try to clear caches and unregister SW so users see the redirect page fresh
if (!isAllowedHost) {
  if ('caches' in window) {
    caches.keys().then(names => names.forEach(name => caches.delete(name)));
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
  }
}

// On allowed hosts: update SW if present
if (isAllowedHost && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration().then(reg => { if (reg) reg.update(); });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isAllowedHost ? (
      <BrowserRouter>
        <SchoolPlanner />
      </BrowserRouter>
    ) : (
      <RedirectPage />
    )}
  </React.StrictMode>
)