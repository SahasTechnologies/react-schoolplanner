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
  hoveredEventIdx: number | null;
  setHoveredEventIdx: (index: number | null) => void;
  infoOrder: { key: string; label: string }[];
  infoShown: Record<string, boolean>;
  showFirstInfoBeside: boolean;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  index,
  isBreakEvent,
  getEventColour,
  autoNamingEnabled,
  effectiveMode,
  hoveredEventIdx,
  setHoveredEventIdx,
  infoOrder,
  infoShown,
  showFirstInfoBeside
}) => {
  if (isBreakEvent(event)) {
    return (
      <div
        key={`break-${index}`}
        className="rounded-lg p-3 flex items-center justify-between text-sm font-semibold opacity-80"
        style={{ 
          backgroundColor: effectiveMode === 'light' ? 'transparent' : 'transparent', 
          color: effectiveMode === 'light' ? '#000' : '#fff',
          border: '1px dashed #888',
          borderWidth: 1,
          minHeight: 40
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
      <div key="time" className="flex items-center gap-1 text-xs opacity-80 mb-1">
        <Clock size={12} />
        <span>{formatTime(event.dtstart)}{event.dtend && !isNaN(new Date(event.dtend).getTime()) ? ` - ${formatTime(event.dtend ?? event.dtstart)}` : ''}</span>
      </div>
    ),
    location: event.location ? (
      <div key="location" className="flex items-center gap-1 text-xs opacity-80 mb-1">
        <MapPin size={12} />
        <span>{event.location}</span>
      </div>
    ) : null,
    teacher: teacherName ? (
      <div key="teacher" className="flex items-center gap-1 text-xs opacity-80 mb-1">
        <User size={12} />
        <span>{teacherName}</span>
      </div>
    ) : null,
    period: periodInfo ? (
      <div key="period" className="flex items-center gap-1 text-xs opacity-80 mb-1">
        <CalendarRange size={12} />
        <span>Period: {periodInfo}</span>
      </div>
    ) : null,
  };

  const enabledFields = infoOrder.filter((o: { key: string; label: string }) => infoShown[o.key]);
  // If showing beside name, remove from below
  const firstEnabledKey = showFirstInfoBeside ? (infoOrder.find((item: { key: string; label: string }) => infoShown[item.key])?.key) : null;
  const enabledFieldsBelow = enabledFields.filter((item: { key: string; label: string }) => item.key !== firstEnabledKey);

  const getFirstEnabledField = () => {
    if (!showFirstInfoBeside) return null;
    const firstField = infoOrder.find((item: { key: string; label: string }) => infoShown[item.key]);
    if (!firstField) return null;
    const field = infoFields[firstField.key];
    if (!field) return null;
    // Add left margin for clarity, center vertically
    return <span className="ml-3 flex items-center">{field}</span>;
  };

  return (
    <div
      key={index}
      className={`rounded-lg p-3 text-white text-sm transition-all duration-300 cursor-pointer ${showFirstInfoBeside ? 'hover:shadow-2xl hover:scale-105' : ''}`}
      style={{ backgroundColor: getEventColour(event.summary) }}
      onMouseEnter={() => setHoveredEventIdx(index)}
      onMouseLeave={() => setHoveredEventIdx(null)}
    >
      <div className="flex items-center justify-between" style={{ minHeight: 40, alignItems: 'center' }}>
        <div className="flex items-center">
          <span className="font-medium leading-tight flex items-center" style={{ fontSize: '1.1rem' }}>
            {normalizeSubjectName(event.summary, autoNamingEnabled)}
            {getFirstEnabledField()}
          </span>
        </div>
        <span style={{ opacity: 0.35, display: 'flex', alignItems: 'center' }} className="text-black">
          {getSubjectIcon(event.summary, 24, effectiveMode)}
        </span>
      </div>
      {/* Info fields, only show enabled by default, all on hover */}
      {(hoveredEventIdx === index ? infoOrder : enabledFieldsBelow).map((item: { key: string; label: string }) => infoFields[item.key]).filter(Boolean)}
    </div>
  );
};

export default EventCard; 