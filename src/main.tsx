import React from 'react'
import ReactDOM from 'react-dom/client'
import SchoolPlanner from './schoolplanner';
// Red Hat Text is now loaded via Bunny Fonts in index.html
import './index.css' // Keep base styles
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SchoolPlanner />
    </BrowserRouter>
  </React.StrictMode>
)