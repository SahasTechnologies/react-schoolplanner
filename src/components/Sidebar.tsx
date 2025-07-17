import React from 'react';
import { Calendar, Home, BarChart3 } from 'lucide-react';

interface SidebarProps {
  navigate: (path: string) => void;
  location: { pathname: string };
  colors: any;
  SettingsIcon: React.ElementType;
}

const Sidebar: React.FC<SidebarProps> = ({ navigate, location, colors, SettingsIcon }) => {
  return (
    <div className={`w-16 ${colors.container} ${colors.border} border-r flex flex-col items-center py-4 fixed top-0 left-0 h-full z-40`}>
      <div className="space-y-4 w-full flex-1">
        <button
          onClick={() => navigate('/home')}
          className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${location.pathname === '/home' ? `${colors.button} text-white` : `text-white opacity-70 hover:opacity-100 hover:bg-gray-700`}`}
          title="Home"
        >
          <Home size={20} className={colors.icon} />
        </button>
        <button
          onClick={() => navigate('/calendar')}
          className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${location.pathname === '/calendar' ? `${colors.button} text-white` : `text-white opacity-70 hover:opacity-100 hover:bg-gray-700`}`}
          title="Calendar"
        >
          <Calendar size={20} className={colors.icon} />
        </button>
        <button
          onClick={() => navigate('/markbook')}
          className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${location.pathname === '/markbook' ? `${colors.button} text-white` : `text-white opacity-70 hover:opacity-100 hover:bg-gray-700`}`}
          title="Markbook"
        >
          <BarChart3 size={20} className={colors.icon} />
        </button>
        <button
          onClick={() => navigate('/settings')}
          className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${location.pathname === '/settings' ? `${colors.button} text-white` : `text-white opacity-70 hover:opacity-100 hover:bg-gray-700`}`}
          title="Settings"
        >
          <SettingsIcon size={20} className={colors.icon} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 