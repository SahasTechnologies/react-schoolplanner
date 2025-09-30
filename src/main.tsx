import React from 'react'
import ReactDOM from 'react-dom/client'
import SchoolPlanner from './schoolplanner';
// Red Hat Text is now loaded via Bunny Fonts in index.html
import './index.css' // Keep base styles
import { BrowserRouter } from 'react-router-dom';

// Redirect pages.dev domains to custom domain
if (window.location.hostname.endsWith('.pages.dev')) {
  const newUrl = `https://school.sahas.dpdns.org${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(newUrl);
  // Show error message for debugging
  document.body.innerHTML = `
    <div style="font-family: system-ui; padding: 40px; text-align: center;">
      <h1>301 - Moved Permanently</h1>
      <p>This site has moved to <a href="${newUrl}">${newUrl}</a></p>
      <p>Redirecting...</p>
    </div>
  `;
  throw new Error('Redirecting to new domain');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SchoolPlanner />
    </BrowserRouter>
  </React.StrictMode>
)