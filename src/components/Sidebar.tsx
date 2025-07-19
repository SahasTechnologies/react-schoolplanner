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
  // Use theme accent for active and hover backgrounds
  const accentBg = colors.buttonAccent;
  const accentBgHover = `${colors.buttonAccent} bg-opacity-80`;
  const iconInactive = colors.effectiveMode === 'dark' ? 'text-gray-400' : colors.text;
  const iconActive = 'text-white';
  return (
    <div className={`w-16 ${colors.container} ${colors.border} border-r flex flex-col items-center py-4 fixed top-0 left-0 h-full z-40`}>
      <div className="space-y-4 w-full flex-1">
        <button
          onClick={() => navigate('/home')}
          className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${location.pathname === '/home' ? `${accentBg} ${iconActive}` : `hover:${accentBgHover}`}`}
          title="Home"
        >
          <Home size={20} className={location.pathname === '/home' ? iconActive : iconInactive} />
        </button>
        <button
          onClick={() => navigate('/calendar')}
          className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${location.pathname === '/calendar' ? `${accentBg} ${iconActive}` : `hover:${accentBgHover}`}`}
          title="Calendar"
        >
          <Calendar size={20} className={location.pathname === '/calendar' ? iconActive : iconInactive} />
        </button>
        <button
          onClick={() => navigate('/markbook')}
          className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${location.pathname === '/markbook' ? `${accentBg} ${iconActive}` : `hover:${accentBgHover}`}`}
          title="Markbook"
        >
          <BarChart3 size={20} className={location.pathname === '/markbook' ? iconActive : iconInactive} />
        </button>
        <button
          onClick={() => navigate('/settings')}
          className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${location.pathname === '/settings' ? `${accentBg} ${iconActive}` : `hover:${accentBgHover}`}`}
          title="Settings"
        >
          <SettingsIcon size={20} className={location.pathname === '/settings' ? iconActive : iconInactive} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 