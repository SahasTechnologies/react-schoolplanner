import React from 'react'
import ReactDOM from 'react-dom/client'
import SchoolPlanner from './schoolplanner';
import RedirectPage from './components/RedirectPage';
// Red Hat Text is now loaded via Bunny Fonts in index.html
import './index.css' // Keep base styles
import { BrowserRouter } from 'react-router-dom';

// Check if accessing from pages.dev domain
const isPagesDev = window.location.hostname.endsWith('.pages.dev');

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