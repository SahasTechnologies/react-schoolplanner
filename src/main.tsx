import React from 'react'
import ReactDOM from 'react-dom/client'
import SchoolPlanner from './schoolplanner';
// Load Red Hat Text via @fontsource with display=block to avoid fallback showing
import '@fontsource/red-hat-text/300.css?display=block';
import '@fontsource/red-hat-text/400.css?display=block';
import '@fontsource/red-hat-text/500.css?display=block';
import '@fontsource/red-hat-text/600.css?display=block';
import '@fontsource/red-hat-text/700.css?display=block';
import './index.css' // Keep base styles
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SchoolPlanner />
    </BrowserRouter>
  </React.StrictMode>,
)