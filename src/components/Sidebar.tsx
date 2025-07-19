import React from 'react';
import { Calendar, Home, BarChart3 } from 'lucide-react';

interface SidebarProps {
  navigate: (path: string) => void;
  location: { pathname: string };
  colors: any;
  SettingsIcon: React.ElementType;
}

const Sidebar: React.FC<SidebarProps> = ({ navigate, location, colors, SettingsIcon }) => {
  // Determine overlay for hover based on mode
  const overlayHover = colors.effectiveMode === 'dark' ? 'hover:bg-white/20' : 'hover:bg-black/10';
  // Icon color for inactive state
  const iconInactive = colors.effectiveMode === 'dark' ? 'text-gray-300' : 'text-white';
  // Icon color for active state (theme accent)
  const iconActive = colors.effectiveMode === 'dark' ? 'text-white' : 'text-white';
  return (
    <div className={`w-16 ${colors.container} ${colors.border} border-r flex flex-col items-center py-4 fixed top-0 left-0 h-full z-40`}>
      <div className="space-y-4 w-full flex-1">
        <button
          onClick={() => navigate('/home')}
          className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${location.pathname === '/home' ? `${colors.button} ${colors.buttonText}` : `${colors.buttonText} opacity-70 hover:opacity-100 ${overlayHover}`}`}
          title="Home"
        >
          <Home size={20} className={location.pathname === '/home' ? iconActive : iconInactive} />
        </button>
        <button
          onClick={() => navigate('/calendar')}
          className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${location.pathname === '/calendar' ? `${colors.button} ${colors.buttonText}` : `${colors.buttonText} opacity-70 hover:opacity-100 ${overlayHover}`}`}
          title="Calendar"
        >
          <Calendar size={20} className={location.pathname === '/calendar' ? iconActive : iconInactive} />
        </button>
        <button
          onClick={() => navigate('/markbook')}
          className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${location.pathname === '/markbook' ? `${colors.button} ${colors.buttonText}` : `${colors.buttonText} opacity-70 hover:opacity-100 ${overlayHover}`}`}
          title="Markbook"
        >
          <BarChart3 size={20} className={location.pathname === '/markbook' ? iconActive : iconInactive} />
        </button>
        <button
          onClick={() => navigate('/settings')}
          className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${location.pathname === '/settings' ? `${colors.button} ${colors.buttonText}` : `${colors.buttonText} opacity-70 hover:opacity-100 ${overlayHover}`}`}
          title="Settings"
        >
          <SettingsIcon size={20} className={location.pathname === '/settings' ? iconActive : iconInactive} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 