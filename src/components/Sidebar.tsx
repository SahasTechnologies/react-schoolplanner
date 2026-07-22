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

// Sidebar nav button. Previously this used a JS-timed `animate-bounce` on
// every click, which is Tailwind's large notification-style up-down jump —
// too much motion for a nav icon, and it fought visually with the page
// already having changed underneath it. This uses a lightweight CSS-only
// press/hover feel instead: an immediate scale-down on press (active:) and
// a subtle scale-up on hover, both handled purely by the browser with no
// state or setTimeout involved.
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
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        p-3 rounded-lg mx-auto block relative
        transition-[background-color,transform] duration-150 ease-out
        active:scale-90
        ${isActivePath ? `${accentBg} ${iconActive}` : `hover:${sidebarHover} hover:scale-110`}
      `}
    >
      <Icon size={20} className={`${isActivePath ? iconActive : iconInactive} transition-colors duration-150`} />
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