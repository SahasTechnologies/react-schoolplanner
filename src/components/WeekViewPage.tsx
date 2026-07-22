import { Calendar } from 'lucide-react';
import { CalendarEvent, WeekData, insertBreaksBetweenEvents, isBreakEvent } from '../utils/calendarUtils';
import EventCard from '../components/EventCard';
import { Subject } from '../types';

interface WeekViewPageProps {
  weekData: WeekData | null;
  getEventColour: (title: string) => string;
  autoNamingEnabled: boolean;
  effectiveMode: 'light' | 'dark';
  colors: any;
  infoOrder: any[];
  infoShown: Record<string, boolean>;
  setSelectedEvent: (event: CalendarEvent) => void;
  subjects: Subject[];
}

export default function WeekViewPage({
  weekData,
  getEventColour,
  autoNamingEnabled,
  effectiveMode,
  colors,
  infoOrder,
  infoShown,
  setSelectedEvent,
  subjects
}: WeekViewPageProps) {
  if (!weekData) return null;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dayEvents: CalendarEvent[][] = [[], [], [], [], []];

  // Defensive: weekData.events should always be an array of events with
  // dtstart/dtend as Date objects, but guard against legacy/corrupted
  // localStorage data (e.g. a missing events array, or dates that didn't
  // get rehydrated into Date instances) so a single bad entry can't crash
  // the whole page.
  const rawEvents = Array.isArray(weekData.events) ? weekData.events : [];

  rawEvents.forEach((event: CalendarEvent) => {
    if (!event || !event.dtstart) return;
    // Use the event's local date directly to determine the weekday
    const eventDate = event.dtstart instanceof Date ? event.dtstart : new Date(event.dtstart);
    if (isNaN(eventDate.getTime())) {
      return;
    }
    const dayOfWeek = eventDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    // Fix: Correctly map Sunday (0) to -1 and Saturday (6) to 5
    const dayIndex = dayOfWeek === 0 ? -1 : dayOfWeek - 1;

    // Only skip weekends, allow all weekdays (indexes 0-4)
    if (dayIndex >= 0 && dayIndex < 5) {
      // Normalize dtstart/dtend to real Date instances in case they came
      // through as strings, so downstream sorting/formatting never throws.
      dayEvents[dayIndex].push({
        ...event,
        dtstart: eventDate,
        dtend: event.dtend ? (event.dtend instanceof Date ? event.dtend : new Date(event.dtend)) : event.dtend,
      });
    }
  });

  // Sort and insert breaks
  const dayEventsWithBreaks = dayEvents.map(dayList => {
    const sorted = [...dayList].sort((a, b) => a.dtstart.getTime() - b.dtstart.getTime());
    return insertBreaksBetweenEvents(sorted);
  });

  return (
    <div className="space-y-8 pt-4">
      <div className={`flex items-center gap-3 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>
        <Calendar className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={28} />
        <h2 className={`text-3xl font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Weekly Schedule</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {days.map((day, index) => (
          <div key={day} className={`${colors.container} rounded-lg ${colors.border} border`}>
            <div className={`p-5 border-b ${colors.border}`}>
              <h3 className={`font-semibold text-center ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>{day}</h3>
            </div>
            <div className="p-4 space-y-4 min-h-[400px]">
              {dayEventsWithBreaks[index].length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  <Calendar size={32} className="mx-auto mb-3 opacity-50" />
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
                    infoOrder={infoOrder}
                    infoShown={infoShown}
                    showFirstInfoBeside={false} // Always false on calendar page
                    onClick={() => setSelectedEvent(event)}
                    subjects={subjects}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
