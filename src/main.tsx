import React from 'react'
import ReactDOM from 'react-dom/client'
import SchoolPlanner from './schoolplanner.tsx' // Import your component (lowercase 's')
import './index.css' // Ensure this matches your CSS filename (it might be index.css in a new sandbox)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SchoolPlanner /> {/* Render your component */}
  </React.StrictMode>,
)