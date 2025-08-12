import React from 'react';
import { Clock, MapPin, User, Utensils, CalendarRange } from 'lucide-react';
import { CalendarEvent, formatTime } from '../utils/calendarUtils';
import { normalizeSubjectName, getSubjectIcon } from '../utils/subjectUtils';

interface EventCardProps {
  event: CalendarEvent;
  index: number;
  isBreakEvent: (event: CalendarEvent) => boolean;
  getEventColour: (title: string) => string;
  autoNamingEnabled: boolean;
  effectiveMode: 'light' | 'dark';
  infoOrder: { key: string; label: string }[];
  infoShown: Record<string, boolean>;
  showFirstInfoBeside: boolean;
  onClick?: () => void;
  forceTall?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  index,
  isBreakEvent,
  getEventColour,
  autoNamingEnabled,
  effectiveMode,
  infoOrder,
  infoShown,
  showFirstInfoBeside,
  onClick,
  forceTall = false
}) => {
  if (isBreakEvent(event)) {
    return (
      <div
        key={`break-${index}`}
        className="rounded-2xl p-3 flex items-center justify-between text-sm font-semibold transition-all duration-300"
        style={{ 
          backgroundColor: effectiveMode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', 
          color: effectiveMode === 'light' ? '#111827' : '#e5e7eb',
          minHeight: forceTall ? 64 : 40,
          boxShadow: effectiveMode === 'light' ? '0 1px 2px rgba(0,0,0,0.06)' : '0 1px 2px rgba(0,0,0,0.4)'
        }}
      >
        <div className="flex-1 text-left flex items-center" style={{justifyContent: 'flex-start'}}>
          Break
          <span className="text-xs ml-2 opacity-60">{formatTime(event.dtstart)} - {formatTime(event.dtend ?? event.dtstart)}</span>
        </div>
        <Utensils size={20} className={effectiveMode === 'light' ? 'text-black' : 'text-white'} />
      </div>
    );
  }

  // Parse event information
  let teacherName = '';
  let periodInfo = '';
  if (event.description) {
    const teacherMatch = event.description.match(/Teacher:\s*([^\n\r]+?)(?:\s*Period:|$)/i);
    if (teacherMatch) {
      teacherName = teacherMatch[1].trim();
    }
    const periodMatch = event.description.match(/Period:\s*([^\n\r]+?)(?:\s*$|\s*Teacher:|$)/i);
    if (periodMatch) {
      periodInfo = periodMatch[1].trim();
    }
  }

  const infoFields: Record<string, React.ReactNode> = {
    time: (
            <div key="time" className="flex items-center gap-1 text-xs opacity-80">
        <Clock size={12} />
        <span>{formatTime(event.dtstart)}{event.dtend && !isNaN(new Date(event.dtend).getTime()) ? ` - ${formatTime(event.dtend ?? event.dtstart)}` : ''}</span>
      </div>
    ),
    location: event.location ? (
            <div key="location" className="flex items-center gap-1 text-xs opacity-80">
        <MapPin size={12} />
        <span>{event.location}</span>
      </div>
    ) : null,
    teacher: teacherName ? (
            <div key="teacher" className="flex items-center gap-1 text-xs opacity-80">
        <User size={12} />
        <span>{teacherName}</span>
      </div>
    ) : null,
    period: periodInfo ? (
            <div key="period" className="flex items-center gap-1 text-xs opacity-80">
        <CalendarRange size={12} />
        <span>Period: {periodInfo}</span>
      </div>
    ) : null,
  };

  // All possible info fields (in order)
  const allFields = infoOrder.map((item: { key: string; label: string }) => ({ key: item.key, node: infoFields[item.key] })).filter(f => f.node);
  // Enabled info fields (in order)
  const enabledFields = infoOrder.filter((o: { key: string; label: string }) => infoShown[o.key]);
  const firstEnabledKey = showFirstInfoBeside ? (enabledFields[0]?.key) : null;
  const enabledFieldsBelow = enabledFields.filter((item: { key: string; label: string }) => item.key !== firstEnabledKey);
  const allFieldsBelow = infoOrder.filter((item: { key: string; label: string }) => item.key !== firstEnabledKey);

  // Get the first enabled info field node
  const getFirstEnabledFieldNode = () => {
    if (!showFirstInfoBeside || !firstEnabledKey) return null;
    const field = infoFields[firstEnabledKey];
    if (!field) return null;
    return <span className="ml-3 flex items-center font-medium">{field}</span>;
  };

  const [expanded, setExpanded] = React.useState(false);
  const [showAllInfo, setShowAllInfo] = React.useState(false);

  const segmentColor = getEventColour(event.summary);

  // Keep content mounted until animation finishes
  React.useEffect(() => {
    if (expanded) {
      setShowAllInfo(true);
    } else {
      setShowAllInfo(false); // Remove delay - shrink immediately
    }
  }, [expanded]);

  return (
    <div
      onClick={onClick}
      key={index}
      className={`rounded-2xl p-3 text-white text-sm transition-all duration-300 cursor-pointer shadow-sm`}
      style={{ backgroundColor: segmentColor, minHeight: forceTall ? 96 : 56 }}
      onMouseEnter={() => { if (showFirstInfoBeside) setExpanded(true); }}
      onMouseLeave={() => { if (showFirstInfoBeside) setExpanded(false); }}
    >
      <div className="flex items-center justify-between min-h-[40px]">
        <div className="flex items-center min-h-[40px]">
          <span className="font-semibold leading-tight flex items-center min-h-[40px]" style={{ fontSize: '1.1rem' }}>
            {normalizeSubjectName(event.summary, autoNamingEnabled)}
            {getFirstEnabledFieldNode()}
          </span>
        </div>
        <span style={{ opacity: 0.35, display: 'flex', alignItems: 'center' }} className="text-black">
          {getSubjectIcon(event.summary, 24, effectiveMode)}
        </span>
      </div>

      {/* Info fields: on home page, show enabled by default, all on hover; on calendar page, always show all below */}
      {showFirstInfoBeside ? (
        <div
          className="overflow-hidden transition-all duration-300"
          style={{ maxHeight: expanded ? 500 : enabledFieldsBelow.length * 40 }}
        >
          {(expanded || showAllInfo)
            ? allFieldsBelow.map((item: { key: string; label: string }) => infoFields[item.key]).filter(Boolean)
            : enabledFieldsBelow.map((item: { key: string; label: string }) => infoFields[item.key]).filter(Boolean)
          }
        </div>
      ) : (
        <div>
          {allFields.map(f => f.node)}
        </div>
      )}
    </div>
  );
};

export default EventCard; 