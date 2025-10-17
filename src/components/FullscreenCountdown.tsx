import * as React from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { CalendarEvent, isBreakEvent } from '../utils/calendarUtils';
import { normalizeSubjectName } from '../utils/subjectUtils';
import { getSubjectIcon } from '../utils/subjectUtils';
import { Subject } from '../types';

interface FullscreenCountdownProps {
  isOpen: boolean;
  onClose: () => void;
  searching: boolean;
  nextEvent: CalendarEvent | null;
  nextEventDate: Date | null;
  timeLeft: number | null;
  formatCountdown: (ms: number | null) => string;
  getEventColour: (title: string) => string;
  colors: any;
  autoNamingEnabled: boolean;
  subjects: Subject[];
}

export default function FullscreenCountdown({
  isOpen,
  onClose,
  searching,
  nextEvent,
  nextEventDate,
  timeLeft,
  formatCountdown,
  getEventColour,
  colors,
  autoNamingEnabled,
  subjects
}: FullscreenCountdownProps): React.ReactElement | null {
  if (!isOpen) return null;

  // Custom colored icon for fullscreen
  function ColoredSubjectIcon({ summary }: { summary: string }) {
    const color = getEventColour(summary);
    const normalizedName = normalizeSubjectName(summary, autoNamingEnabled);
    const subject = subjects.find(s => normalizeSubjectName(s.name, autoNamingEnabled) === normalizedName);
    const icon = getSubjectIcon(subject || summary, 32, 'dark');
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
    const use24Hour = localStorage.getItem('use24HourFormat') === 'true';
    return event.dtstart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !use24Hour });
  }

  const eventColor = nextEvent ? getEventColour(nextEvent.summary) : '#94a3b8';
  const isBreak = nextEvent && isBreakEvent(nextEvent);
  const displayColor = isBreak ? '#94a3b8' : eventColor;
  const showDstNotice = nextEventDate ? (new Date().getTimezoneOffset() !== nextEventDate.getTimezoneOffset()) : false;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${colors.background}`}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      {/* Circular glow effect from center */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${displayColor}15 0%, ${displayColor}08 30%, transparent 70%)`
        }}
      />
      {/* Close button */}
      <button
        onClick={onClose}
        className={`absolute top-6 right-6 transition-colors z-10 ${colors.text} hover:opacity-70`}
        title="Close fullscreen"
      >
        <X size={32} />
      </button>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center text-center px-8">
        {searching ? (
          <div className="flex flex-col items-center justify-center">
            <LoaderCircle className={`animate-spin mb-8 ${colors.text}`} size={64} />
            <span
              className={`text-2xl ${colors.text}`}
              style={{
                opacity: 0.8,
                fontWeight: '400',
                fontFamily: "'Red Hat Text', sans-serif"
              }}
            >
              Searching...
            </span>
          </div>
        ) : nextEvent && nextEventDate ? (
          <>
            {/* Large countdown timer */}
            <div
              className="text-8xl md:text-9xl font-bold mb-8"
              style={{
                color: displayColor,
                fontFamily: "'Red Hat Text', sans-serif",
                fontWeight: '700'
              }}
            >
              {formatCountdown(timeLeft)}
            </div>

            {/* "to" text and subject name on same line */}
            <div className="flex items-center gap-3 mb-6">
              <span
                className={`text-2xl md:text-3xl ${colors.text}`}
                style={{
                  opacity: 0.9,
                  fontWeight: '400',
                  fontFamily: "'Red Hat Text', sans-serif"
                }}
              >
                to
              </span>
              <ColoredSubjectIcon summary={nextEvent.summary} />
              <span
                className="text-2xl md:text-3xl"
                style={{
                  color: displayColor,
                  fontWeight: '600',
                  fontFamily: "'Red Hat Text', sans-serif"
                }}
              >
                {normalizeSubjectName(nextEvent.summary, true)}
              </span>
            </div>

            {/* Event details - only time, no location */}
            <div className="flex flex-col items-center gap-2">
              {/* Time info */}
              <div
                className={`text-xl ${colors.text}`}
                style={{
                  opacity: 0.85,
                  fontWeight: '400',
                  fontFamily: "'Red Hat Text', sans-serif"
                }}
              >
                {(() => {
                  const now = new Date();
                  const eventDateCopy = new Date(nextEventDate);
                  const nowCopy = new Date(now);
                  const daysDiff = Math.floor((eventDateCopy.setHours(0, 0, 0, 0) - nowCopy.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
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
              {/* DST notice */}
              {showDstNotice && (
                <div
                  className={`text-sm ${colors.text}`}
                  style={{
                    opacity: 0.6,
                    fontWeight: '400',
                    fontFamily: "'Red Hat Text', sans-serif"
                  }}
                >
                  Accounting for daylight saving
                </div>
              )}
            </div>
          </>
        ) : (
          <div
            className={`text-3xl ${colors.text}`}
            style={{
              opacity: 0.8,
              fontWeight: '400',
              fontFamily: "'Red Hat Text', sans-serif"
            }}
          >
            No upcoming events
          </div>
        )}
      </div>
    </div>
  );
}
