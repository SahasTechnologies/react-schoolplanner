import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { CalendarEvent } from '../utils/calendarUtils';

interface EventDetailsOverlayProps {
  event: CalendarEvent;
  onClose: () => void;
  colors: any;
  effectiveMode: 'light' | 'dark';
}

const getNoteKey = (event: CalendarEvent) => {
  // Use summary + start time as a unique key
  return `event_note_${event.summary}_${event.dtstart?.toISOString?.()}`;
};

const EventDetailsOverlay: React.FC<EventDetailsOverlayProps> = ({ event, onClose, colors, effectiveMode }) => {
  const [note, setNote] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(getNoteKey(event));
    if (saved !== null) setNote(saved);
  }, [event]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
    localStorage.setItem(getNoteKey(event), e.target.value);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black bg-opacity-40"
      style={{ transition: 'background 0.3s' }}
    >
      <div
        className={`h-full w-full max-w-sm p-6 flex flex-col shadow-2xl ${colors.container} ${colors.border}`}
        style={{ minWidth: 340, maxWidth: 400, borderLeft: '2px solid', borderColor: colors.border }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-2xl font-bold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Details</h2>
          <button onClick={onClose} className="text-2xl opacity-70 hover:opacity-100 transition"><X /></button>
        </div>
        <div className={`rounded-2xl mb-4 p-4 flex items-center justify-between ${colors.button}`}> 
          <span className="text-2xl font-bold">{event.summary}</span>
        </div>
        <div className={`mb-6 p-4 rounded-2xl ${colors.background}`}> 
          {/* You can add more event details here if desired */}
        </div>
        <div className="mb-2 mt-2 text-lg font-semibold">Note</div>
        <textarea
          className={`w-full min-h-[100px] rounded-lg p-3 resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500 ${effectiveMode === 'light' ? 'bg-gray-100 text-black border-gray-300' : 'bg-gray-700 text-white border-gray-600'}`}
          value={note}
          onChange={handleNoteChange}
          placeholder="Start writing here"
        />
      </div>
    </div>
  );
};

export default EventDetailsOverlay; 