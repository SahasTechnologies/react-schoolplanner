import React from 'react'
import ReactDOM from 'react-dom/client'
import SchoolPlanner from './schoolplanner';
import './index.css' // Fonts are now loaded here to avoid flash
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SchoolPlanner />
    </BrowserRouter>
  </React.StrictMode>,
)