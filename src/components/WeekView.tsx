import React from 'react';
import { Calendar, User, Clock, MapPin } from 'lucide-react';
import { CalendarEvent, WeekData } from '../types';

interface WeekViewProps {
  weekData: WeekData | null;
  getEventColour: (summary: string) => string;
  formatTime: (date: Date) => string;
}

const WeekView: React.FC<WeekViewProps> = ({ weekData, getEventColour, formatTime }) => {
  if (!weekData) return null;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dayEvents: CalendarEvent[][] = [[], [], [], [], []];

  if (weekData) {
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
  }

  dayEvents.forEach((dayEventList: CalendarEvent[]) => {
    dayEventList.sort((a: CalendarEvent, b: CalendarEvent) => a.dtstart.getTime() - b.dtstart.getTime());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="text-blue-400" size={24} />
        <h2 className="text-2xl font-semibold text-white">Weekly Schedule</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {days.map((day, index) => (
          <div key={day} className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold text-white text-center">{day}</h3>
            </div>
            <div className="p-3 space-y-2 min-h-[400px]">
              {dayEvents[index].length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No events</p>
                </div>
              ) : (
                dayEvents[index].map((event: CalendarEvent, eventIndex: number) => {
                  let teacherName = '';
                  if (event.description) {
                    const match = event.description.match(/Teacher:\s*([^\n\r]+?)(?:\s*Period:|$)/i);
                    if (match) {
                      teacherName = match[1].trim();
                    }
                  }
                  return (
                    <div
                      key={eventIndex}
                      className="rounded-lg p-3 text-white text-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                      style={{ backgroundColor: getEventColour(event.summary) }}
                    >
                      <div className="font-medium mb-1 leading-tight">
                        {event.summary}
                      </div>
                      {teacherName && (
                        <div className="flex items-center gap-1 text-xs opacity-90 mb-1">
                          <User size={12} />
                          <span>{teacherName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs opacity-90 mb-1">
                        <Clock size={12} />
                        <span>{formatTime(event.dtstart)}</span>
                        {event.dtend && !isNaN(new Date(event.dtend).getTime()) && (
                          <>
                            <span> - {formatTime(event.dtend)}</span>
                          </>
                        )}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1 text-xs opacity-75">
                          <MapPin size={12} />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekView; 