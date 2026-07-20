import React, { useState, useCallback } from 'react';
import { Calendar, Home, BarChart3, Clock } from 'lucide-react';

interface SidebarProps {
  navigate: (path: string) => void;
  location: { pathname: string };
  colors: any;
  SettingsIcon: React.ElementType;
  showCountdownInSidebar: boolean;
  onCountdownClick: () => void;
}

// Simple bounce animation component that animates when active
const BounceButton = ({ 
  onClick, 
  icon: Icon, 
  title, 
  isActivePath,
  accentBg,
  sidebarHover,
  iconActive,
  iconInactive
}: any) => {
  const [isBouncing, setIsBouncing] = useState(false);
  
  const handleClick = useCallback(() => {
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 400); // Duration of bounce
    onClick();
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
      title={title}
      className={`
        p-3 rounded-lg transition-all duration-200 mx-auto block relative
        ${isActivePath ? `${accentBg} ${iconActive}` : `hover:${sidebarHover}`}
        ${isBouncing ? 'animate-bounce' : ''}
      `}
    >
      <Icon size={20} className={isActivePath ? iconActive : iconInactive} />
    </button>
  );
};

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
        <BounceButton
          onClick={() => navigate('/home')}
          title="Home"
          colors={colors}
          pathname={location.pathname}
          isActivePath={location.pathname === '/home'}
          accentBg={accentBg}
          sidebarHover={sidebarHover}
          iconActive={iconActive}
          iconInactive={iconInactive}
          icon={Home}
        />
        <BounceButton
          onClick={() => navigate('/calendar')}
          title="Calendar"
          colors={colors}
          pathname={location.pathname}
          isActivePath={location.pathname === '/calendar'}
          accentBg={accentBg}
          sidebarHover={sidebarHover}
          iconActive={iconActive}
          iconInactive={iconInactive}
          icon={Calendar}
        />
        <BounceButton
          onClick={() => navigate('/markbook')}
          title="Markbook"
          colors={colors}
          pathname={location.pathname}
          isActivePath={location.pathname === '/markbook'}
          accentBg={accentBg}
          sidebarHover={sidebarHover}
          iconActive={iconActive}
          iconInactive={iconInactive}
          icon={BarChart3}
        />
        <BounceButton
          onClick={() => navigate('/settings')}
          title="Settings"
          colors={colors}
          pathname={location.pathname}
          isActivePath={location.pathname === '/settings'}
          accentBg={accentBg}
          sidebarHover={sidebarHover}
          iconActive={iconActive}
          iconInactive={iconInactive}
          icon={SettingsIcon}
        />
      </div>
      {showCountdownInSidebar && (
        <div className="w-full pb-2">
          <BounceButton
            onClick={onCountdownClick}
            title="Countdown"
            colors={colors}
            pathname={location.pathname}
            isActivePath={location.pathname === '/countdown'}
            accentBg={accentBg}
            sidebarHover={sidebarHover}
            iconActive={iconActive}
            iconInactive={iconInactive}
            icon={Clock}
          />
        </div>
      )}
    </div>
  );
};

export default Sidebar; 