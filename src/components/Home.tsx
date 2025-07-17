import React from 'react';
import { Calendar, Home as HomeIcon } from 'lucide-react';
import EventCard from './EventCard';
import { CalendarEvent } from '../utils/calendarUtils';

interface HomeProps {
  dayLabel: string;
  events: CalendarEvent[];
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

const Home: React.FC<HomeProps> = ({
  dayLabel,
  events,
  colors,
  effectiveMode,
  isBreakEvent,
  getEventColour,
  autoNamingEnabled,
  hoveredEventIdx,
  setHoveredEventIdx,
  infoOrder,
  infoShown,
  showFirstInfoBeside,
}: HomeProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HomeIcon className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={24} />
        <h2 className={`text-2xl font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Home</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${colors.container} rounded-lg ${colors.border} border p-6 col-span-1`}>
          <div className="flex items-center gap-3 mb-4">
            <Calendar className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={20} />
            <h3 className={`text-lg font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>{dayLabel ? `${dayLabel}'s Schedule` : 'No Schedule'}</h3>
          </div>
          {events.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Calendar size={32} className="mx-auto mb-2 opacity-50" />
              <p>No events</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event, idx) => (
                <EventCard
                  key={idx}
                  event={event}
                  index={idx}
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
              ))}
            </div>
          )}
        </div>
        {/* Right half intentionally left empty for now, or you can add a placeholder */}
      </div>
    </div>
  );
};

export default Home; 