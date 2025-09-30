import React from 'react';
import { Calendar, Home, BarChart3, Clock } from 'lucide-react';

interface SidebarProps {
  navigate: (path: string) => void;
  location: { pathname: string };
  colors: any;
  SettingsIcon: React.ElementType;
  showCountdownInSidebar: boolean;
  onCountdownClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ navigate, location, colors, SettingsIcon, showCountdownInSidebar, onCountdownClick }) => {

  // Determine overlay for hover based on mode
  // Use theme accent for active and hover backgrounds
  const accentBg = colors.buttonAccent;
  // Use the new sidebarHover color for hover effect
  const sidebarHover = colors.sidebarHover;
  const iconInactive = colors.effectiveMode === 'dark' ? 'text-gray-400' : colors.text;
  const iconActive = 'text-white';
  return (
    <div className={`w-16 ${colors.container} ${colors.border} border-r flex flex-col items-center py-4 fixed top-0 left-0 h-full z-40`}>
      <div className="space-y-4 w-full flex-1 flex flex-col">
        <button
          onClick={() => navigate('/home')}
          className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${location.pathname === '/home' ? `${accentBg} ${iconActive}` : `hover:${sidebarHover}`}`}
          title="Home"
        >
          <Home size={20} className={location.pathname === '/home' ? iconActive : iconInactive} />
        </button>
        <button
          onClick={() => navigate('/calendar')}
          className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${location.pathname === '/calendar' ? `${accentBg} ${iconActive}` : `hover:${sidebarHover}`}`}
          title="Calendar"
        >
          <Calendar size={20} className={location.pathname === '/calendar' ? iconActive : iconInactive} />
        </button>
        <button
          onClick={() => navigate('/markbook')}
          className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${location.pathname === '/markbook' ? `${accentBg} ${iconActive}` : `hover:${sidebarHover}`}`}
          title="Markbook"
        >
          <BarChart3 size={20} className={location.pathname === '/markbook' ? iconActive : iconInactive} />
        </button>
        <button
          onClick={() => navigate('/settings')}
          className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${location.pathname === '/settings' ? `${accentBg} ${iconActive}` : `hover:${sidebarHover}`}`}
          title="Settings"
        >
          <SettingsIcon size={20} className={location.pathname === '/settings' ? iconActive : iconInactive} />
        </button>
      </div>
      {showCountdownInSidebar && (
        <div className="w-full pb-2">
          <button
            onClick={onCountdownClick}
            className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${location.pathname === '/countdown' ? `${accentBg} ${iconActive}` : `hover:${sidebarHover}`}`}
            title="Countdown"
          >
            <Clock size={20} className={location.pathname === '/countdown' ? iconActive : iconInactive} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar; 