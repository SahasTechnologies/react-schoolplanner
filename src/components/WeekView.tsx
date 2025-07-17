import React from 'react';
import { Calendar } from 'lucide-react';
import EventCard from './EventCard';
import { CalendarEvent, WeekData, insertBreaksBetweenEvents, isBreakEvent as defaultIsBreakEvent } from '../utils/calendarUtils';

interface WeekViewProps {
  weekData: WeekData | null;
  colors: any;
  effectiveMode: 'light' | 'dark';
  isBreakEvent: (event: CalendarEvent) => boolean;
  getEventColour: (title: string) => string;
  autoNamingEnabled: boolean;
  hoveredEventIdx: number | null;
  setHoveredEventIdx: (idx: number | null) => void;
  infoOrder: { key: string; label: string }[];
  infoShown: Record<string, boolean>;
  showFirstInfoBeside: boolean;
}

const WeekView: React.FC<WeekViewProps> = ({
  weekData,
  colors,
  effectiveMode,
  isBreakEvent = defaultIsBreakEvent,
  getEventColour,
  autoNamingEnabled,
  hoveredEventIdx,
  setHoveredEventIdx,
  infoOrder,
  infoShown,
  showFirstInfoBeside,
}: WeekViewProps) => {
  if (!weekData) return null;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dayEvents: CalendarEvent[][] = [[], [], [], [], []];

  weekData.events.forEach((event: CalendarEvent) => {
    const eventDate = new Date(event.dtstart);
    if (isNaN(eventDate.getTime())) {
      console.warn('Skipping event with invalid date in render:', event);
      return;
    }
    const dayOfWeek = eventDate.getDay();
    let dayIndex;
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return;
    } else {
      dayIndex = dayOfWeek - 1;
    }
    if (dayIndex >= 0 && dayIndex < 5) {
      dayEvents[dayIndex].push(event);
    }
  });

  // Sort and insert breaks
  const dayEventsWithBreaks = dayEvents.map(dayList => {
    const sorted = [...dayList].sort((a, b) => a.dtstart.getTime() - b.dtstart.getTime());
    return insertBreaksBetweenEvents(sorted);
  });

  return (
    <div className="space-y-6">
      <div className={`flex items-center gap-3 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}> 
        <Calendar className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={24} />
        <h2 className={`text-2xl font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Weekly Schedule</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {days.map((day, index) => (
          <div key={day} className={`${colors.container} rounded-lg ${colors.border} border`}>
            <div className={`p-4 border-b ${colors.border}`}>
              <h3 className={`font-semibold text-center ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>{day}</h3>
            </div>
            <div className="p-3 space-y-2 min-h-[400px]">
              {dayEventsWithBreaks[index].length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No events</p>
                </div>
              ) : (
                dayEventsWithBreaks[index].map((event, eventIndex) => (
                  <EventCard
                    key={eventIndex}
                    event={event}
                    index={eventIndex}
                    isBreakEvent={isBreakEvent}
                    getEventColour={getEventColour}
                    autoNamingEnabled={autoNamingEnabled}
                    effectiveMode={effectiveMode}
                    hoveredEventIdx={hoveredEventIdx}
                    setHoveredEventIdx={setHoveredEventIdx}
                    infoOrder={infoOrder}
                    infoShown={infoShown}
                    showFirstInfoBeside={showFirstInfoBeside}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekView; 