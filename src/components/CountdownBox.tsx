import * as React from 'react';
import { Calendar, LoaderCircle, Maximize } from 'lucide-react';
import { CalendarEvent } from '../utils/calendarUtils';
import { normalizeSubjectName } from '../utils/subjectUtils';
import { getSubjectIcon } from '../utils/subjectUtils';
import { Subject } from '../types';

export interface CountdownBoxProps {
  searching: boolean;
  nextEvent: CalendarEvent | null;
  nextEventDate: Date | null;
  timeLeft: number | null;
  formatCountdown: (ms: number | null) => string;
  getEventColour: (title: string) => string;
  effectiveMode: 'light' | 'dark';
  colors: any;
  onFullscreen?: () => void;
  autoNamingEnabled: boolean;
  subjects: Subject[];
}

export default function CountdownBox({
  searching,
  nextEvent,
  nextEventDate,
  timeLeft,
  formatCountdown,
  getEventColour,
  effectiveMode,
  colors,
  onFullscreen,
  autoNamingEnabled,
  subjects
}: CountdownBoxProps) {
  // Custom colored icon
  function ColoredSubjectIcon({ summary }: { summary: string }) {
    const color = getEventColour(summary);
    const normalizedName = normalizeSubjectName(summary, autoNamingEnabled);
    const subject = subjects.find(s => normalizeSubjectName(s.name, autoNamingEnabled) === normalizedName);
    const icon = getSubjectIcon(subject || summary, 24, effectiveMode);
    return React.cloneElement(icon, { style: { color } });
  }

  // Helper for event time string
  function getEventTimeString(date: Date, event: CalendarEvent) {
    if (!date) return '';
    if (
      event.dtstart.getHours() === 0 &&
      event.dtstart.getMinutes() === 0 &&
      (!event.dtend || (event.dtend.getHours() === 0 && event.dtend.getMinutes() === 0))
    ) {
      return 'All day';
    }
    // Use the original event time, not the calculated next occurrence date
    return event.dtstart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className={`${colors.container} rounded-lg ${colors.border} border p-6 flex flex-col items-center justify-center h-fit`}>
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-2">
          <Calendar className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={20} />
          <span className={`text-lg font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Next Event Countdown</span>
        </div>
        {onFullscreen && (
          <button
            onClick={onFullscreen}
            className={`p-1 rounded hover:bg-opacity-20 hover:bg-gray-500 transition-colors ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}
            title="Fullscreen"
          >
            <Maximize size={18} />
          </button>
        )}
      </div>
      {searching ? (
        <div className="flex flex-col items-center justify-center py-6">
          <LoaderCircle className={`animate-spin mb-2 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`} size={32} />
          <span className={`${effectiveMode === 'light' ? 'text-black' : 'text-gray-400'}`}>Searching...</span>
        </div>
      ) : nextEvent && nextEventDate ? (
        <>
          <div
            className={`text-4xl font-bold mb-2`}
            style={{
              color: nextEvent ? getEventColour(nextEvent.summary) : (effectiveMode === 'light' ? '#000000' : '#ffffff'),
              ...(effectiveMode === 'light' ? {} : { textShadow: '0 1px 4px rgba(0,0,0,0.15)' })
            }}
          >
            {formatCountdown(timeLeft)}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <ColoredSubjectIcon summary={nextEvent.summary} />
            <span className="text-base font-medium" style={{ color: getEventColour(nextEvent.summary) }}>{normalizeSubjectName(nextEvent.summary, true)}</span>
          </div>
          <div className={`text-sm ${effectiveMode === 'light' ? 'text-black opacity-80' : 'text-white opacity-80'}`}>
            {(() => {
              const now = new Date();
              const daysDiff = Math.floor((nextEventDate.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
              const timeStr = getEventTimeString(nextEventDate, nextEvent);
              if (daysDiff === 1) {
                return `Tomorrow at ${timeStr}`;
              } else if (daysDiff > 1) {
                const dayName = nextEventDate.toLocaleDateString(undefined, { weekday: 'long' });
                return `On ${dayName} at ${timeStr}`;
              } else {
                return `at ${timeStr}`;
              }
            })()}
          </div>
        </>
      ) : (
        <div className={`text-lg ${effectiveMode === 'light' ? 'text-black' : 'text-gray-400'}`}>No upcoming events</div>
      )}
    </div>
  );
}
