import React, { useEffect, useState } from 'react';
import { X, Clock, MapPin, User, CalendarRange } from 'lucide-react';
import { CalendarEvent, formatTime } from '../utils/calendarUtils';
import { getSubjectIcon, normalizeSubjectName } from '../utils/subjectUtils';
import { Subject } from '../types';

interface EventDetailsOverlayProps {
  event: CalendarEvent;
  onClose: () => void;
  colors: any;
  effectiveMode: 'light' | 'dark';
  subjects: Subject[];
}

const getNoteKey = (subjectName: string) => {
  return `subject_note_${subjectName}`;
};

const EventDetailsOverlay: React.FC<EventDetailsOverlayProps> = ({ event, onClose, colors, effectiveMode, subjects }) => {
  const normalizedName = normalizeSubjectName(event.summary, true);
  const subject = subjects.find(s => normalizeSubjectName(s.name, true) === normalizedName);
  const subjectColor = subject ? subject.colour : colors.button;
  const subjectIcon = getSubjectIcon(subject || event.summary, 48, effectiveMode);

  const [note, setNote] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(getNoteKey(normalizedName));
    if (saved !== null) setNote(saved);
    setShow(true);
  }, [normalizedName]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
    localStorage.setItem(getNoteKey(normalizedName), e.target.value);
  };

  // Info fields (same as EventCard)
  let teacherName = '';
  let periodInfo = '';
  if (event.description) {
    const teacherMatch = event.description.match(/Teacher:\s*([^\n\r]+?)(?:\s*Period:|$)/i);
    if (teacherMatch) teacherName = teacherMatch[1].trim();
    const periodMatch = event.description.match(/Period:\s*([^\n\r]+?)(?:\s*$|\s*Teacher:|$)/i);
    if (periodMatch) periodInfo = periodMatch[1].trim();
  }
  const infoFields = [
    { key: 'time', node: (
      <div key="time" className="flex items-center gap-2 text-base mb-1">
        <Clock size={18} />
        <span>{formatTime(event.dtstart)}{event.dtend && !isNaN(new Date(event.dtend).getTime()) ? ` - ${formatTime(event.dtend ?? event.dtstart)}` : ''}</span>
      </div>
    ) },
    { key: 'location', node: event.location ? (
      <div key="location" className="flex items-center gap-2 text-base mb-1">
        <MapPin size={18} />
        <span>{event.location}</span>
      </div>
    ) : null },
    { key: 'teacher', node: teacherName ? (
      <div key="teacher" className="flex items-center gap-2 text-base mb-1">
        <User size={18} />
        <span>{teacherName}</span>
      </div>
    ) : null },
    { key: 'period', node: periodInfo ? (
      <div key="period" className="flex items-center gap-2 text-base mb-1">
        <CalendarRange size={18} />
        <span>Period: {periodInfo}</span>
      </div>
    ) : null },
  ].filter(f => f.node);

  // Slide animation
  const sidebarClass = `h-full w-full max-w-sm p-6 flex flex-col shadow-2xl ${colors.container} ${colors.border} fixed right-0 top-0 transition-transform duration-200 z-50`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black bg-opacity-40"
      style={{ transition: 'background 0.3s' }}
      onClick={onClose}
    >
      <div
        className={sidebarClass}
        style={{
          minWidth: 340,
          maxWidth: 400,
          transform: show ? 'translateX(0)' : 'translateX(100%)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-2xl font-bold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Details</h2>
          <button onClick={onClose} className={`text-2xl opacity-70 hover:opacity-100 transition ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}><X /></button>
        </div>
        <div className="rounded-2xl mb-4 p-4 flex items-center justify-between" style={{ background: subjectColor }}>
          <span className="text-2xl font-bold flex items-center" style={{ fontSize: '1.5rem' }}>
            {normalizeSubjectName(event.summary, true)}
          </span>
          <span style={{ opacity: 0.35, display: 'flex', alignItems: 'center' }}>{subjectIcon}</span>
        </div>
        <div className={`mb-6 p-4 rounded-2xl ${colors.background} ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}> 
          {infoFields.map(f => f.node && React.cloneElement(f.node, { className: (f.node.props.className || '') + (effectiveMode === 'light' ? ' text-black' : ' text-white') }))}
        </div>
        <div className={`mb-2 mt-2 text-lg font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Note</div>
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