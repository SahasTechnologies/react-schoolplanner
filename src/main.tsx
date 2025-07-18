import React from 'react'
import ReactDOM from 'react-dom/client'
import SchoolPlanner from './schoolplanner';
import './index.css' // Ensure this matches your CSS filename (it might be index.css in a new sandbox)
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SchoolPlanner />
    </BrowserRouter>
  </React.StrictMode>,
)