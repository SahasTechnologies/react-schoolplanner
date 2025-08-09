import React from 'react'
import ReactDOM from 'react-dom/client'
import SchoolPlanner from './schoolplanner';
// Load Red Hat Text font via Fontsource (weights 300-700)
import '@fontsource/red-hat-text/300.css';
import '@fontsource/red-hat-text/400.css';
import '@fontsource/red-hat-text/500.css';
import '@fontsource/red-hat-text/600.css';
import '@fontsource/red-hat-text/700.css';
import './index.css' // Ensure this matches your CSS filename (it might be index.css in a new sandbox)
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SchoolPlanner />
    </BrowserRouter>
  </React.StrictMode>,
)