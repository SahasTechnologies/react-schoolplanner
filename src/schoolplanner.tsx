// NOTE: This file requires the following dependencies to be present in your package.json for deployment:
//   react, react-dom, lucide-react, @types/react, @types/react-dom
// Favicon and title are set in index.html, see instructions below.
import * as React from 'react';
import { useState, useRef } from 'react';
import { 
  Upload, Calendar, FileText, Clock, MapPin, X, Home, BarChart3, Settings, Edit2, User, Book,
  Calculator, FlaskConical, Palette, Music, Globe, Dumbbell, Languages, Code2, Brain, Mic2, 
  Users, BookOpen, PenLine, BookUser, Briefcase, HeartHandshake, Library, BookMarked, Star, 
  GraduationCap, Bot,
  Sun, Moon, Monitor
} from 'lucide-react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

interface CalendarEvent {
  dtstart: Date;
  dtend?: Date;
  summary: string;
  location?: string;
  description?: string;
}

interface WeekData {
  monday: Date;
  friday: Date;
  events: CalendarEvent[];
}

interface Subject {
  id: string; // Unique ID for the subject
  name: string; // Display name, can be edited
  colour: string; // Changed to Australian English 'colour'
}

type ThemeKey = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'grey';

const SchoolPlanner = () => {
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  // Remove currentPage state, use router location instead
  const navigate = useNavigate();
  const location = useLocation();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  // State for subject editing modal
  const [showSubjectEditModal, setShowSubjectEditModal] = useState(false);
  const [selectedSubjectForEdit, setSelectedSubjectForEdit] = useState<Subject | null>(null);
  const [editName, setEditName] = useState('');
  const [editColour, setEditColour] = useState(''); // Changed to 'editColour'

  // Welcome screen states
  const [welcomeStep, setWelcomeStep] = useState<'welcome' | 'name_input' | 'upload_ics' | 'completed'>('welcome');
  const [userName, setUserName] = useState('');

  // New state for auto-naming toggle
  const [autoNamingEnabled, setAutoNamingEnabled] = useState(true);

  // Remove enhanced biweekly schedule and pattern logic

  const fileInputRef = useRef<HTMLInputElement>(null);
  const customColourInputRef = useRef<HTMLInputElement>(null); // Ref for hidden colour input

  // Default colours for the palette
  const defaultColours = [
    '#7C3AED', '#0891B2', '#DC2626', '#D97706', '#059669',
    '#047857', '#EA580C', '#2563EB', '#DB2777', '#475569',
    '#8B5CF6', '#06B6D4', '#EF4444', '#F59E0B', '#10B981',
    '#14B8A6', '#F97316', '#3B82F6', '#EC4899', '#64748B',
    '#6D28D9', '#0E7490', '#B91C1C', '#B45309', '#065F46'
  ];

  // Generate random colour (now uses defaultColours array)
  const generateRandomColour = () => {
    return defaultColours[Math.floor(Math.random() * defaultColours.length)];
  };

  // Determine greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    if (hour < 22) return 'Good evening';
    return 'Good night';
  };

  // Map for specific subject renames
  const renameMap = new Map<string, string>([
    ['roll', 'Roll Call'],
    ['va', 'Visual Arts'],
    ['art', 'Visual Arts'],
    ['history', 'History'],
    ['math', 'Mathematics'],
    ['tech', 'Technology'],
    ['english', 'English'],
    ['science', 'Science'],
    ['rec', 'Rec Sport'],
    ['pd', 'PD/H/PE'],
    ['japanese', 'Japanese'],
    ['latin', 'Latin'],
    ['french', 'French'],
    ['bhope', 'BHOPE'],
    ['music', 'Music'],
    ['commerce', 'Commerce'],
    ['drama', 'Drama'],
    ['geography', 'Geography'],
    ['design', 'Design & Technology'],
    ['dt', 'Design & Technology'],
    ['sport', 'Sport'],
    ['library', 'Library'],
    ['assembly', 'Assembly'],
    ['chapel', 'Chapel'],
    ['wellbeing', 'Wellbeing'],
    ['pastoral', 'Pastoral Care'],
    ['it', 'Information Technology'],
    ['computing', 'Computing'],
    ['stem', 'STEM'],
    ['coding', 'Coding Club'],
    ['robotics', 'Robotics'],
    ['choir', 'Choir'],
    ['band', 'Band Practice'],
    ['orchestra', 'Orchestra'],
    ['drama club', 'Drama Club'],
    ['debate', 'Debate Club'],
    ['reading', 'Reading Group'],
    ['writing', 'Writing Workshop'],
    ['study', 'Study Hall'],
    ['tutorial', 'Tutorial'],
    ['mentor', 'Mentoring Session'],
    ['career', 'Career Guidance'],
    ['counseling', 'Counseling'],
  ]);

  // Helper to normalize subject names for grouping and renaming
  const normalizeSubjectName = (summary: string): string => {
    let lowerSummary = summary.toLowerCase();

    if (autoNamingEnabled) { // Apply auto-naming only if enabled
      // Apply specific renames based on keywords first
      for (const [key, value] of renameMap.entries()) {
        if (lowerSummary.includes(key)) {
          return value; // Return the renamed value immediately upon first match
        }
      }

      // Then apply general cleaning (removing "period", "lesson", etc.)
      let cleanedName = lowerSummary.replace(/(period|lesson|class|room)\s*\d*/g, '').trim();

      // Capitalize the first letter of each word if it's not a specific rename
      if (cleanedName) {
        return cleanedName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }
    }
    
    return summary.trim(); // Fallback to original if auto-naming is off or no specific rename/cleaning yields a useful name
  };

  const getEventColour = (title: string): string => { // Changed to 'getEventColour'
    const normalizedTitle = normalizeSubjectName(title);
    const subject = subjects.find((s: Subject) => normalizeSubjectName(s.name) === normalizedTitle);
    return subject ? subject.colour : generateRandomColour(); // Changed to 'subject.colour'
  };

  const parseICS = (icsContent: string): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const lines = icsContent.split(/\r?\n/);
    let currentEvent: Partial<CalendarEvent> | null = null;

    console.log('Parsing ICS content, total lines:', lines.length);

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      // Handle line folding (lines that start with space or tab are continuations)
      while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
        i++;
        line += lines[i].substring(1);
      }

      if (line === 'BEGIN:VEVENT') {
        currentEvent = {} as Partial<CalendarEvent>;
      } else if (line === 'END:VEVENT' && currentEvent) {
        if (currentEvent.dtstart && currentEvent.summary) { // dtend is optional
          events.push(currentEvent as CalendarEvent);
          console.log('Added event:', currentEvent.summary, 'from', currentEvent.dtstart, 'to', currentEvent.dtend);
        }
        currentEvent = null;
      } else if (currentEvent && line.includes(':')) {
        const colonIndex = line.indexOf(':');
        const key = line.substring(0, colonIndex);
        const value = line.substring(colonIndex + 1);

        if (key.startsWith('DTSTART')) {
          currentEvent.dtstart = parseDateTime(value);
        } else if (key.startsWith('DTEND')) {
          currentEvent.dtend = parseDateTime(value);
        } else if (key === 'SUMMARY') {
          currentEvent.summary = value.replace(/\\n/g, ' ').replace(/\\,/g, ',').replace(/\\\\/g, '\\');
        } else if (key === 'LOCATION') {
          currentEvent.location = value.replace(/\\n/g, ' ').replace(/\\,/g, ',').replace(/\\\\/g, '\\');
        } else if (key === 'DESCRIPTION') {
          currentEvent.description = value.replace(/\\n/g, ' ').replace(/\\,/g, ',').replace(/\\\\/g, '\\');
        }
      }
    }

    console.log('Total events parsed:', events.length);
    return events;
  };

  const parseDateTime = (dateStr: string): Date => {
    // console.log('Parsing datetime:', dateStr); // Commented out to reduce console noise

    // Handle timezone parameters
    let cleanDateStr = dateStr;
    let isUTC = false;

    if (dateStr.includes(';')) {
      const parts = dateStr.split(';');
      cleanDateStr = parts[parts.length - 1];
      // Check for timezone info
      if (parts.some((part: string) => part.includes('TZID'))) {
        // Handle timezone - for now we'll treat as local time
        isUTC = false;
      }
    }

    cleanDateStr = cleanDateStr.trim();

    if (cleanDateStr.endsWith('Z')) {
      isUTC = true;
      cleanDateStr = cleanDateStr.slice(0, -1);
    }

    if (cleanDateStr.length === 8) {
      // YYYYMMDD format
      const year = parseInt(cleanDateStr.substring(0, 4));
      const month = parseInt(cleanDateStr.substring(4, 6)) - 1;
      const day = parseInt(cleanDateStr.substring(6, 8));
      const date = new Date(year, month, day);
      // console.log('Parsed date (YYYYMMDD):', date); // Commented out
      return date;
    } else if (cleanDateStr.length >= 15) { // Handle YYYYMMDDTHHMMSS and longer with TZID
      // YYYYMMDDTHHMMSS format
      const year = parseInt(cleanDateStr.substring(0, 4));
      const month = parseInt(cleanDateStr.substring(4, 6)) - 1;
      const day = parseInt(cleanDateStr.substring(6, 8));
      const hour = parseInt(cleanDateStr.substring(9, 11));
      const minute = parseInt(cleanDateStr.substring(11, 13));
      const second = parseInt(cleanDateStr.substring(13, 15) || '0'); // Seconds might be optional

      const date = isUTC ?
        new Date(Date.UTC(year, month, day, hour, minute, second)) :
        new Date(year, month, day, hour, minute, second);
      // console.log('Parsed datetime:', date, isUTC ? '(UTC)' : '(local)'); // Commented out
      return date;
    } else {
      // Try to parse as-is
      const date = new Date(cleanDateStr);
      // console.log('Parsed datetime (fallback):', date); // Commented out
      return date;
    }
  };

  // Helper to get the Monday of a given date's week (use UTC)
  const getMonday = (d: Date): Date => {
    const date = new Date(d);
    const day = date.getDay(); // Use local time
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // Groups all events into their actual Monday-Friday weeks
  const groupAllEventsIntoActualWeeks = (allEvents: CalendarEvent[]): WeekData[] => {
    const weeksMap = new Map<string, CalendarEvent[]>(); // Key: 'YYYY-MM-DD' (Monday's date)

    allEvents.forEach(event => {
      const eventDate = new Date(event.dtstart);
      if (isNaN(eventDate.getTime())) {
        console.warn('Skipping event with invalid date:', event);
        return;
      }

      const mondayOfWeek = getMonday(eventDate);
      // Use local date for key
      const mondayKey = mondayOfWeek.getFullYear() + '-' + String(mondayOfWeek.getMonth() + 1).padStart(2, '0') + '-' + String(mondayOfWeek.getDate()).padStart(2, '0');

      if (!weeksMap.has(mondayKey)) {
        weeksMap.set(mondayKey, []);
      }
      weeksMap.get(mondayKey)?.push(event);
    });

    const actualWeeks: WeekData[] = [];
    const sortedMondayKeys = Array.from(weeksMap.keys()).sort();

    sortedMondayKeys.forEach(mondayKey => {
      const mondayDate = new Date(mondayKey);
      // Use local time for week range
      const localMonday = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate(), 0, 0, 0, 0);
      // Calculate localFriday as the same week Friday at 23:59:59.999
      const localFriday = new Date(localMonday);
      localFriday.setDate(localMonday.getDate() + 4);
      localFriday.setHours(23, 59, 59, 999);

      const eventsInThisWeek = weeksMap.get(mondayKey) || [];
      // Filter to only include events within the Mon-Fri range for this specific week (local time)
      const filteredEvents = eventsInThisWeek.filter(event => {
        const eventDtstart = new Date(event.dtstart);
        return eventDtstart.getTime() >= localMonday.getTime() && eventDtstart.getTime() <= localFriday.getTime();
      });

      // Only add weeks that have at least one event
      if (filteredEvents.length > 0) {
        actualWeeks.push({
          monday: localMonday,
          friday: localFriday,
          events: filteredEvents
        });
      }
    });

    return actualWeeks;
  };

  const processFile = (file: File) => {
    setLoading(true);
    setError('');

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const icsContent = e.target?.result as string;
        const allRawEvents = parseICS(icsContent);
        const allActualWeeks = groupAllEventsIntoActualWeeks(allRawEvents);

        if (allActualWeeks.length === 0) {
          setError('No valid Monday-Friday schedules with events found in the calendar file.');
          setWelcomeStep('upload_ics');
          setLoading(false);
          return;
        }

        // Find the week with the most events (instead of the first full week)
        let bestWeek: WeekData | null = null;
        let maxEvents = 0;
        for (const week of allActualWeeks) {
          if (week.events.length > maxEvents) {
            bestWeek = week;
            maxEvents = week.events.length;
          }
        }

        if (bestWeek) {
          setWeekData(bestWeek);
        } else {
          setError('No Monday-Friday week with events found.');
          setWelcomeStep('upload_ics');
          setLoading(false);
          return;
        }

        setWelcomeStep('completed');

        // Extract and combine subjects from ALL events (not just the first week)
        const subjectMap = new Map<string, Subject>();

        allRawEvents.forEach(event => {
          const normalizedName = normalizeSubjectName(event.summary);
          if (normalizedName) {
            if (!subjectMap.has(normalizedName)) {
              subjectMap.set(normalizedName, {
                id: crypto.randomUUID(),
                name: normalizedName,
                colour: generateRandomColour() // Changed to 'colour'
              });
            }
          }
        });

        setSubjects(Array.from(subjectMap.values()));

      } catch (err) {
        setError('Error processing file: ' + (err as Error).message);
        setLoading(false); // Ensure loading is reset on error
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith('.ics')) {
      processFile(files[0]);
    } else {
      setError('Please drop a valid .ics file.');
    }
  };

  const clearData = () => {
    setWeekData(null);
    setError('');
    setSubjects([]);
    setWelcomeStep('welcome'); // Reset to welcome screen
    setUserName(''); // Clear user name
    setAutoNamingEnabled(true); // Reset auto-naming to default
    // Remove any now-unused state or props
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Subject editing modal functions
  const startEditingSubject = (subject: Subject) => {
    setSelectedSubjectForEdit(subject);
    setEditName(subject.name);
    setEditColour(subject.colour); // Changed to 'editColour'
    setShowSubjectEditModal(true);
  };

  const saveSubjectEdit = () => {
    if (selectedSubjectForEdit) {
      // Check if the new name conflicts with an existing subject (to merge)
      const existingSubjectWithNewName = subjects.find(
        (s: Subject) => normalizeSubjectName(s.name) === normalizeSubjectName(editName) && s.id !== selectedSubjectForEdit.id
      );

      if (existingSubjectWithNewName) {
        // Merge: Update events to point to the existing subject's ID
        // This is a simplified merge, actual event re-assignment isn't handled here
        // For now, we'll just remove the old subject and keep the existing one.
        setSubjects((prevSubjects: Subject[]) =>
          prevSubjects.filter((s: Subject) => s.id !== selectedSubjectForEdit.id)
        );
        // The colour of the existing subject might be updated if desired, but for simplicity, we keep its original colour.
      } else {
        // No conflict, just update the subject
        setSubjects((prevSubjects: Subject[]) =>
          prevSubjects.map((subject: Subject) =>
            subject.id === selectedSubjectForEdit.id
              ? { ...subject, name: editName, colour: editColour } // Changed to 'colour'
              : subject
          )
        );
      }
    }
    setShowSubjectEditModal(false);
    setSelectedSubjectForEdit(null);
    setEditName('');
    setEditColour('');
  };

  const cancelSubjectEdit = () => {
    setShowSubjectEditModal(false);
    setSelectedSubjectForEdit(null);
    setEditName('');
    setEditColour('');
  };

  // Remove week navigation logic


  const renderWeekView = () => {
    if (!weekData) return null;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dayEvents: CalendarEvent[][] = [[], [], [], [], []];

    // Repeat the first full week forever: always show the same events for each weekday
    if (weekData) {
      weekData.events.forEach((event: CalendarEvent) => {
        const eventDate = new Date(event.dtstart);
        if (isNaN(eventDate.getTime())) {
          console.warn('Skipping event with invalid date in render:', event);
          return;
        }
        // Use local time for day assignment
        const dayOfWeek = eventDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
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

    // Sort all events for each day by start time
    dayEvents.forEach((dayEventList: CalendarEvent[]) => {
      dayEventList.sort((a: CalendarEvent, b: CalendarEvent) => a.dtstart.getTime() - b.dtstart.getTime());
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
                {dayEvents[index].length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No events</p>
                  </div>
                ) : (
                  dayEvents[index].map((event: CalendarEvent, eventIndex: number) => {
                    // Extract teacher name from description if present
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
                        <div className="flex items-center justify-between" style={{ minHeight: 40, alignItems: 'center' }}>
                          <span className="font-medium leading-tight" style={{ fontSize: '1.1rem' }}>
                            {normalizeSubjectName(event.summary)}
                          </span>
                          <span style={{ opacity: 0.35, display: 'flex', alignItems: 'center' }} className="text-black">
                            {getSubjectIcon(event.summary, 24, effectiveMode)}
                          </span>
                        </div>
                        {/* Teacher name row */}
                        {teacherName && (
                          <div className="flex items-center gap-1 text-xs text-white opacity-80 mb-1">
                            <User size={12} />
                            <span>{teacherName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-white opacity-80 mb-1">
                          <Clock size={12} />
                          <span>{formatTime(event.dtstart)}</span>
                          {event.dtend && !isNaN(new Date(event.dtend).getTime()) && (
                            <>
                              <span> - {formatTime(event.dtend)}</span>
                            </>
                          )}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1 text-xs text-white opacity-80">
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

  // Static icon mapping - only imports the icons we actually need
  const subjectIconMap: Record<string, React.ComponentType<any>> = {
    'Mathematics': Calculator,
    'Science': FlaskConical,
    'Visual Arts': Palette,
    'Music': Music,
    'Geography': Globe,
    'PD/H/PE': Dumbbell,
    'Languages': Languages,
    'Coding Club': Code2,
    'Information Technology': Code2,
    'Computing': Code2,
    'STEM': Brain,
    'Drama': Mic2,
    'Drama Club': Mic2,
    'Debate Club': Users,
    'Reading Group': BookOpen,
    'Writing Workshop': PenLine,
    'Study Hall': BookUser,
    'Tutorial': BookUser,
    'Mentoring Session': Users,
    'Career Guidance': Briefcase,
    'Counseling': HeartHandshake,
    'Wellbeing': HeartHandshake,
    'Pastoral Care': Users,
    'Library': Library,
    'History': BookMarked,
    'English': BookOpen,
    'French': Languages,
    'Japanese': Languages,
    'Latin': Languages,
    'Sport': Dumbbell,
    'Rec Sport': Dumbbell,
    'Roll Call': Users,
    'Band Practice': Music,
    'Choir': Music,
    'Orchestra': Music,
    'Design & Technology': Palette,
    'Technology': Palette,
    'Assembly': Users,
    'Chapel': Star,
    'BHOPE': GraduationCap,
    'Commerce': Briefcase,
    'Robotics': Bot,
  };

  function getSubjectIcon(subjectName: string, size: number = 20, mode: 'light' | 'dark' = 'light') {
    const normalized = normalizeSubjectName(subjectName);
    const IconComponent = subjectIconMap[normalized] || Book;
    return <IconComponent size={size} className={mode === 'light' ? 'text-black' : 'text-white'} />;
  }

  const renderMarkbook = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={24} />
          <h2 className={`text-2xl font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Markbook</h2>
        </div>

        <div className="space-y-4">
          {subjects.length === 0 ? (
            <div className="text-center py-16">
              <BarChart3 size={64} className="mx-auto mb-4 text-gray-600" />
              <p className={`text-gray-400 text-lg ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>No subjects found</p>
              <p className={`text-gray-500 text-sm ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>Upload a calendar file to see your subjects</p>
            </div>
          ) : (
            subjects.map((subject: Subject) => (
              <div key={subject.id} className={`${colors.container} rounded-lg ${colors.border} border p-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getSubjectIcon(subject.name, 20, effectiveMode)}
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: subject.colour }}
                    />
                    <span className={`font-medium capitalize ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>{subject.name}</span>
                  </div>
                  <button
                    onClick={() => startEditingSubject(subject)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Subject Edit Modal */}
        {showSubjectEditModal && selectedSubjectForEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className={`${colors.container} rounded-lg p-6 shadow-xl border border-gray-700 w-full max-w-md`}>
              <h3 className={`text-xl font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'} mb-4`}>Edit Subject</h3>
              <p className={`text-gray-400 text-sm mb-4 ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>Original Name: <span className="font-medium text-white">{selectedSubjectForEdit.name}</span></p> {/* Added original name */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="subjectName" className={`block ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-1`}>Subject Name</label>
                  <input
                    id="subjectName"
                    type="text"
                    value={editName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="subjectColour" className={`block ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>Subject Colour</label> {/* Changed to 'subjectColour' */}
                  <div className="grid grid-cols-6 gap-2 mb-4"> {/* Colour palette */}
                    {defaultColours.map((colour, index) => (
                      <button
                        key={index}
                        className={`w-8 h-8 rounded-full border-2 ${editColour === colour ? 'border-blue-400' : 'border-gray-600'} transition-all duration-200 hover:scale-110`}
                        style={{ backgroundColor: colour }}
                        onClick={() => setEditColour(colour)}
                        title={colour}
                      ></button>
                    ))}
                    {/* Custom Colour Button */}
                    <button
                      className={`w-8 h-8 rounded-full border-2 ${editColour && !defaultColours.includes(editColour) ? 'border-blue-400' : 'border-gray-600'} flex items-center justify-center transition-all duration-200 hover:scale-110`}
                      style={{ background: 'linear-gradient(to right, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3)' }}
                      onClick={() => customColourInputRef.current?.click()}
                      title="Choose Custom Colour"
                    >
                      <Edit2 size={16} className="text-white" />
                    </button>
                    <input
                      ref={customColourInputRef}
                      type="color"
                      value={editColour}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditColour(e.target.value)}
                      className="hidden" // Hide the native input
                    />
                  </div>
                  {/* Display currently selected custom colour if it's not in default palette */}
                  {!defaultColours.includes(editColour) && (
                    <div className="flex items-center gap-2 text-gray-300 text-sm mt-2">
                      Selected: <div className="w-5 h-5 rounded-full border border-gray-600" style={{ backgroundColor: editColour }}></div> {editColour}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={cancelSubjectEdit}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSubjectEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={24} />
          <h2 className={`text-2xl font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Settings</h2>
        </div>
        <div className="space-y-4">
          {/* Timetable Settings */}
          <div className={`${colors.container} rounded-lg ${colors.border} border p-6`}>
            <h3 className={`text-lg font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'} mb-4`}>Timetable Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-white font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Clear Timetable Data</p>
                  <p className={`text-gray-400 text-sm ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>This will remove all uploaded calendar data and subjects</p>
                </div>
                <button
                  onClick={clearData}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <X size={16} />
                  Clear Data
                </button>
              </div>
              <div className="flex items-center justify-between mt-4 border-t border-gray-700 pt-4">
                <div>
                  <p className={`text-white font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Enable Auto-Naming</p>
                  <p className={`text-gray-400 text-sm ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>Automatically rename subjects based on keywords</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoNamingEnabled}
                    onChange={() => setAutoNamingEnabled(!autoNamingEnabled)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
          {/* Customise Section */}
          <div className={`${colors.container} rounded-lg ${colors.border} border p-6`}>
            <h3 className={`text-lg font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'} mb-4`}>Customise</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-white font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Theme</p>
                <p className={`text-gray-400 text-sm ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>Change the color theme of the app</p>
              </div>
              <button
                onClick={() => setShowThemeModal(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${colors.button} text-white`}
              >
                <Palette size={18} />
                Change Theme
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHome = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Home className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={24} />
          <h2 className={`text-2xl font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Home</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${colors.container} rounded-lg ${colors.border} border p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <Calendar className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={20} />
              <h3 className={`text-lg font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Schedule</h3>
            </div>
            <p className={`text-gray-400 mb-4 ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>
              {weekData ? 'View your weekly schedule' : 'Upload your ICS calendar file to get started'}
            </p>
            <button
              onClick={() => navigate('/calendar')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              {weekData ? 'View Schedule' : 'Upload Calendar'}
            </button>
          </div>

          <div className={`${colors.container} rounded-lg ${colors.border} border p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={20} />
              <h3 className={`text-lg font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Markbook</h3>
            </div>
            <p className={`text-gray-400 mb-4 ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>
              {subjects.length > 0 ? `Manage your ${subjects.length} subjects` : 'No subjects available yet'}
            </p>
            <button
              onClick={() => navigate('/markbook')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Open Markbook
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderWelcomeScreen = () => {
    if (welcomeStep === 'completed' && location.pathname === '/welcome') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <h2 className={`text-3xl font-bold mb-4 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Setup Complete</h2>
          <p className={`${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'} mb-6`}>You have already uploaded your timetable and name. To change them, go to Settings.</p>
          <button
            onClick={() => navigate('/settings')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Go to Settings
          </button>
        </div>
      );
    }
    switch (welcomeStep) {
      case 'welcome':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <h1 className="text-5xl font-bold text-white mb-4 animate-fade-in-down">Welcome!</h1>
            <p className="text-xl text-gray-300 mb-8 animate-fade-in-up">Your personal school planner.</p>
            <button
              onClick={() => setWelcomeStep('name_input')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Get Started
            </button>
          </div>
        );
      case 'name_input':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <User size={64} className="text-blue-400 mb-6 animate-bounce-in" />
            <h2 className="text-3xl font-bold text-white mb-4">What's your name? (Optional)</h2>
            <p className="text-gray-300 mb-6">We'll use this to greet you!</p>
            <input
              type="text"
              value={userName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="w-full max-w-sm bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6 text-lg"
            />
            <button
              onClick={() => setWelcomeStep('upload_ics')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Next
            </button>
          </div>
        );
      case 'upload_ics':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <h2 className="text-3xl font-bold text-white mb-6">Upload Your Timetable</h2>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 w-full max-w-lg ${
                dragOver
                  ? 'border-blue-400 bg-blue-400/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-4">
                <Upload size={48} className="text-gray-400" />
                <div>
                  <p className="text-lg font-medium mb-2">Upload ICS Calendar File</p>
                  <p className="text-gray-400 text-sm mb-4">
                    Drag and drop your .ics file here or click to browse
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 mx-auto"
                  >
                    <FileText size={20} />
                    Choose File
                  </button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".ics"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Processing your calendar...</p>
              </div>
            )}
            {error && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mt-6 w-full max-w-lg">
                <div className="flex items-center gap-2 text-red-400">
                  <FileText size={20} />
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null; // Should not happen if logic is correct
    }
  };

  // Define color variables for both normal (muted) and extreme (bright) for each theme, for both dark and light modes
  const colorVars = {
    red: {
      dark: {
        normal: {
          background: 'bg-[#1a1313]',
          container: 'bg-[#231616]',
          border: 'border-[#3a2323]',
          swatch: 'bg-[#231616]',
        },
        extreme: {
          background: 'bg-red-950',
          container: 'bg-red-900',
          border: 'border-red-800',
          swatch: 'bg-red-900',
        },
      },
      light: {
        normal: {
          background: 'bg-[#fff5f5]',
          container: 'bg-[#ffeaea]',
          border: 'border-[#ffd6d6]',
          swatch: 'bg-[#ffeaea]',
        },
        extreme: {
          background: 'bg-red-100',
          container: 'bg-red-200',
          border: 'border-red-300',
          swatch: 'bg-red-200',
        },
      },
    },
    orange: {
      dark: {
        normal: {
          background: 'bg-[#1e1812]',
          container: 'bg-[#2a1f13]',
          border: 'border-[#3a291a]',
          swatch: 'bg-[#2a1f13]',
        },
        extreme: {
          background: 'bg-orange-950',
          container: 'bg-orange-900',
          border: 'border-orange-800',
          swatch: 'bg-orange-900',
        },
      },
      light: {
        normal: {
          background: 'bg-[#fff8f0]',
          container: 'bg-[#fff0d9]',
          border: 'border-[#ffe0b3]',
          swatch: 'bg-[#fff0d9]',
        },
        extreme: {
          background: 'bg-orange-100',
          container: 'bg-orange-200',
          border: 'border-orange-300',
          swatch: 'bg-orange-200',
        },
      },
    },
    yellow: {
      dark: {
        normal: {
          background: 'bg-[#1a1a13]',
          container: 'bg-[#232312]',
          border: 'border-[#39391a]',
          swatch: 'bg-[#232312]',
        },
        extreme: {
          background: 'bg-yellow-950',
          container: 'bg-yellow-900',
          border: 'border-yellow-800',
          swatch: 'bg-yellow-900',
        },
      },
      light: {
        normal: {
          background: 'bg-[#fffae5]',
          container: 'bg-[#fffbe6]',
          border: 'border-[#fff3b3]',
          swatch: 'bg-[#fffbe6]',
        },
        extreme: {
          background: 'bg-yellow-100',
          container: 'bg-yellow-200',
          border: 'border-yellow-300',
          swatch: 'bg-yellow-200',
        },
      },
    },
    green: {
      dark: {
        normal: {
          background: 'bg-[#142017]',
          container: 'bg-[#1b2b15]',
          border: 'border-[#233a23]',
          swatch: 'bg-[#1b2b15]',
        },
        extreme: {
          background: 'bg-green-950',
          container: 'bg-green-900',
          border: 'border-green-800',
          swatch: 'bg-green-900',
        },
      },
      light: {
        normal: {
          background: 'bg-[#f5fff5]',
          container: 'bg-[#eaffea]',
          border: 'border-[#d6ffd6]',
          swatch: 'bg-[#eaffea]',
        },
        extreme: {
          background: 'bg-green-100',
          container: 'bg-green-200',
          border: 'border-green-300',
          swatch: 'bg-green-200',
        },
      },
    },
    blue: {
      dark: {
        normal: {
          background: 'bg-[#151a20]',
          container: 'bg-[#18202b]',
          border: 'border-[#1a233a]',
          swatch: 'bg-[#18202b]',
        },
        extreme: {
          background: 'bg-blue-950',
          container: 'bg-blue-900',
          border: 'border-blue-800',
          swatch: 'bg-blue-900',
        },
      },
      light: {
        normal: {
          background: 'bg-[#f5f8ff]',
          container: 'bg-[#eaf0ff]',
          border: 'border-[#d6e0ff]',
          swatch: 'bg-[#eaf0ff]',
        },
        extreme: {
          background: 'bg-blue-100',
          container: 'bg-blue-200',
          border: 'border-blue-300',
          swatch: 'bg-blue-200',
        },
      },
    },
    purple: {
      dark: {
        normal: {
          background: 'bg-[#1a1620]',
          container: 'bg-[#23182b]',
          border: 'border-[#2f1a3a]',
          swatch: 'bg-[#23182b]',
        },
        extreme: {
          background: 'bg-purple-950',
          container: 'bg-purple-900',
          border: 'border-purple-800',
          swatch: 'bg-purple-900',
        },
      },
      light: {
        normal: {
          background: 'bg-[#faf5ff]',
          container: 'bg-[#f3eaff]',
          border: 'border-[#e0d6ff]',
          swatch: 'bg-[#f3eaff]',
        },
        extreme: {
          background: 'bg-purple-100',
          container: 'bg-purple-200',
          border: 'border-purple-300',
          swatch: 'bg-purple-200',
        },
      },
    },
    pink: {
      dark: {
        normal: {
          background: 'bg-[#20151a]',
          container: 'bg-[#2b1820]',
          border: 'border-[#3a1a23]',
          swatch: 'bg-[#2b1820]',
        },
        extreme: {
          background: 'bg-pink-950',
          container: 'bg-pink-900',
          border: 'border-pink-800',
          swatch: 'bg-pink-900',
        },
      },
      light: {
        normal: {
          background: 'bg-[#fff5fa]',
          container: 'bg-[#ffeaf3]',
          border: 'border-[#ffd6e0]',
          swatch: 'bg-[#ffeaf3]',
        },
        extreme: {
          background: 'bg-pink-100',
          container: 'bg-pink-200',
          border: 'border-pink-300',
          swatch: 'bg-pink-200',
        },
      },
    },
    grey: {
      dark: {
        normal: {
          background: 'bg-[#18191a]',
          container: 'bg-[#232425]',
          border: 'border-[#393a3b]',
          swatch: 'bg-[#232425]',
        },
        extreme: {
          background: 'bg-gray-900',
          container: 'bg-gray-800',
          border: 'border-gray-700',
          swatch: 'bg-gray-800',
        },
      },
      light: {
        normal: {
          background: 'bg-[#f7f7f8]',
          container: 'bg-[#ededed]',
          border: 'border-[#d1d5db]',
          swatch: 'bg-[#ededed]',
        },
        extreme: {
          background: 'bg-gray-100',
          container: 'bg-gray-200',
          border: 'border-gray-300',
          swatch: 'bg-gray-200',
        },
      },
    },
  };

  // themeColors now references colorVars for both normal (muted) and extreme (bright) for both dark and light
  const themeColors = (mode: 'dark' | 'light') => ({
    red: {
      ...colorVars.red[mode].normal,
      icon: mode === 'dark' ? 'text-white' : 'text-red-700',
      button: mode === 'dark' ? 'bg-red-500 hover:bg-red-600' : 'bg-red-400 hover:bg-red-500',
      accent: mode === 'dark' ? 'text-red-400' : 'text-red-600',
      ring: mode === 'dark' ? 'focus:ring-red-400' : 'focus:ring-red-300',
      borderAccent: mode === 'dark' ? 'border-red-400' : 'border-red-300',
      spin: mode === 'dark' ? 'border-red-400' : 'border-red-300',
      settingsContainer: colorVars.red[mode].normal.container,
      swatchExtreme: colorVars.red[mode].extreme.swatch,
      label: 'Red',
    },
    orange: {
      ...colorVars.orange[mode].normal,
      icon: mode === 'dark' ? 'text-white' : 'text-orange-700',
      button: mode === 'dark' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-orange-400 hover:bg-orange-500',
      accent: mode === 'dark' ? 'text-orange-400' : 'text-orange-600',
      ring: mode === 'dark' ? 'focus:ring-orange-400' : 'focus:ring-orange-300',
      borderAccent: mode === 'dark' ? 'border-orange-400' : 'border-orange-300',
      spin: mode === 'dark' ? 'border-orange-400' : 'border-orange-300',
      settingsContainer: colorVars.orange[mode].normal.container,
      swatchExtreme: colorVars.orange[mode].extreme.swatch,
      label: 'Orange',
    },
    yellow: {
      ...colorVars.yellow[mode].normal,
      icon: mode === 'dark' ? 'text-white' : 'text-yellow-700',
      button: mode === 'dark' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-yellow-400 hover:bg-yellow-500',
      accent: mode === 'dark' ? 'text-yellow-400' : 'text-yellow-600',
      ring: mode === 'dark' ? 'focus:ring-yellow-400' : 'focus:ring-yellow-300',
      borderAccent: mode === 'dark' ? 'border-yellow-400' : 'border-yellow-300',
      spin: mode === 'dark' ? 'border-yellow-400' : 'border-yellow-300',
      settingsContainer: colorVars.yellow[mode].normal.container,
      swatchExtreme: colorVars.yellow[mode].extreme.swatch,
      label: 'Yellow',
    },
    green: {
      ...colorVars.green[mode].normal,
      icon: mode === 'dark' ? 'text-white' : 'text-green-700',
      button: mode === 'dark' ? 'bg-green-500 hover:bg-green-600' : 'bg-green-400 hover:bg-green-500',
      accent: mode === 'dark' ? 'text-green-400' : 'text-green-600',
      ring: mode === 'dark' ? 'focus:ring-green-400' : 'focus:ring-green-300',
      borderAccent: mode === 'dark' ? 'border-green-400' : 'border-green-300',
      spin: mode === 'dark' ? 'border-green-400' : 'border-green-300',
      settingsContainer: colorVars.green[mode].normal.container,
      swatchExtreme: colorVars.green[mode].extreme.swatch,
      label: 'Green',
    },
    blue: {
      ...colorVars.blue[mode].normal,
      icon: mode === 'dark' ? 'text-white' : 'text-blue-700',
      button: mode === 'dark' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-400 hover:bg-blue-500',
      accent: mode === 'dark' ? 'text-blue-400' : 'text-blue-600',
      ring: mode === 'dark' ? 'focus:ring-blue-400' : 'focus:ring-blue-300',
      borderAccent: mode === 'dark' ? 'border-blue-400' : 'border-blue-300',
      spin: mode === 'dark' ? 'border-blue-400' : 'border-blue-300',
      settingsContainer: colorVars.blue[mode].normal.container,
      swatchExtreme: colorVars.blue[mode].extreme.swatch,
      label: 'Blue',
    },
    purple: {
      ...colorVars.purple[mode].normal,
      icon: mode === 'dark' ? 'text-white' : 'text-purple-700',
      button: mode === 'dark' ? 'bg-purple-500 hover:bg-purple-600' : 'bg-purple-400 hover:bg-purple-500',
      accent: mode === 'dark' ? 'text-purple-400' : 'text-purple-600',
      ring: mode === 'dark' ? 'focus:ring-purple-400' : 'focus:ring-purple-300',
      borderAccent: mode === 'dark' ? 'border-purple-400' : 'border-purple-300',
      spin: mode === 'dark' ? 'border-purple-400' : 'border-purple-300',
      settingsContainer: colorVars.purple[mode].normal.container,
      swatchExtreme: colorVars.purple[mode].extreme.swatch,
      label: 'Purple',
    },
    pink: {
      ...colorVars.pink[mode].normal,
      icon: mode === 'dark' ? 'text-white' : 'text-pink-700',
      button: mode === 'dark' ? 'bg-pink-500 hover:bg-pink-600' : 'bg-pink-400 hover:bg-pink-500',
      accent: mode === 'dark' ? 'text-pink-400' : 'text-pink-600',
      ring: mode === 'dark' ? 'focus:ring-pink-400' : 'focus:ring-pink-300',
      borderAccent: mode === 'dark' ? 'border-pink-400' : 'border-pink-300',
      spin: mode === 'dark' ? 'border-pink-400' : 'border-pink-300',
      settingsContainer: colorVars.pink[mode].normal.container,
      swatchExtreme: colorVars.pink[mode].extreme.swatch,
      label: 'Pink',
    },
    grey: {
      ...colorVars.grey[mode].normal,
      icon: mode === 'dark' ? 'text-white' : 'text-gray-700',
      button: mode === 'dark' ? 'bg-gray-500 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400',
      accent: mode === 'dark' ? 'text-gray-400' : 'text-gray-600',
      ring: mode === 'dark' ? 'focus:ring-gray-400' : 'focus:ring-gray-300',
      borderAccent: mode === 'dark' ? 'border-gray-400' : 'border-gray-300',
      spin: mode === 'dark' ? 'border-gray-400' : 'border-gray-300',
      settingsContainer: colorVars.grey[mode].normal.container,
      swatchExtreme: colorVars.grey[mode].extreme.swatch,
      label: 'Grey',
    },
  });

  // Add a new state to track if the user selected a normal or extreme theme
  const [theme, setTheme] = useState<ThemeKey>('blue');
  const [themeType, setThemeType] = useState<'normal' | 'extreme'>('normal');
  const [showThemeModal, setShowThemeModal] = useState(false);
  // Add theme mode state: 'light' | 'dark' | 'system'
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    // Try to load from localStorage, fallback to 'system'
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('themeMode');
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    }
    return 'system';
  });

  // System color scheme detection
  const getSystemMode = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Compute the effective mode
  const effectiveMode: 'light' | 'dark' = themeMode === 'system' ? getSystemMode() : themeMode;

  // Helper to get the correct color set for the current theme and type
  const colors = themeType === 'normal'
    ? themeColors(effectiveMode)[theme]
    : {
        ...themeColors(effectiveMode)[theme],
        background: colorVars[theme][effectiveMode].extreme.background,
        container: colorVars[theme][effectiveMode].extreme.container,
        border: colorVars[theme][effectiveMode].extreme.border,
        swatch: colorVars[theme][effectiveMode].extreme.swatch,
        settingsContainer: colorVars[theme][effectiveMode].extreme.container,
      };

  // When setting theme, also set themeType
  function handleThemeChange(key: string, type: 'normal' | 'extreme') {
    setTheme(key as ThemeKey);
    setThemeType(type);
    setShowThemeModal(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', key);
      localStorage.setItem('themeType', type);
    }
  }

  // Persist theme, themeType, and themeMode to localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
      localStorage.setItem('themeType', themeType);
      localStorage.setItem('themeMode', themeMode);
    }
  }, [theme, themeType, themeMode]);

  // Load theme and themeType from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const savedType = localStorage.getItem('themeType');
      if (savedTheme && ['red','orange','yellow','green','blue','purple','pink','grey'].includes(savedTheme)) {
        setTheme(savedTheme as ThemeKey);
      }
      if (savedType && (savedType === 'normal' || savedType === 'extreme')) {
        setThemeType(savedType as 'normal' | 'extreme');
      }
    }
  }, []);

  // --- Welcome screen URL logic ---
  React.useEffect(() => {
    if (welcomeStep !== 'completed' && location.pathname !== '/welcome') {
      navigate('/welcome', { replace: true });
    }
    if (welcomeStep === 'completed' && location.pathname === '/welcome') {
      // If setup is complete but user is on /welcome, show a message (handled in renderWelcomeScreen)
    }
  }, [welcomeStep, location.pathname, navigate]);

  // --- Save weekData to localStorage ---
  React.useEffect(() => {
    if (weekData && welcomeStep === 'completed') {
      localStorage.setItem('weekData', JSON.stringify(weekData));
    }
  }, [weekData, welcomeStep]);

  // --- Load weekData from localStorage on mount ---
  React.useEffect(() => {
    if (!weekData && welcomeStep === 'completed') {
      const saved = localStorage.getItem('weekData');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Convert date strings back to Date objects
          parsed.monday = new Date(parsed.monday);
          parsed.friday = new Date(parsed.friday);
          parsed.events = parsed.events.map((e: any) => ({ ...e, dtstart: new Date(e.dtstart), dtend: e.dtend ? new Date(e.dtend) : undefined }));
          setWeekData(parsed);
        } catch {}
      }
    }
  }, [weekData, welcomeStep]);

  // Main content routes
  // Only show welcome screen if not completed
  let mainContent = null;
  if (welcomeStep !== 'completed') {
    mainContent = renderWelcomeScreen();
  } else {
    mainContent = (
      <Routes>
        <Route path="/" element={renderHome()} />
        <Route path="/calendar" element={renderWeekView()} />
        <Route path="/markbook" element={renderMarkbook()} />
        <Route path="/settings" element={renderSettings()} />
      </Routes>
    );
  }

  // Main render logic
  if (welcomeStep !== 'completed') {
    return (
      <div className={`min-h-screen ${colors.background} text-white flex items-center justify-center font-inter`}>
        {mainContent}
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.background} text-white flex font-inter`}>
      {/* Sidebar */}
      <div className={`w-16 ${colors.container} ${colors.border} border-r flex flex-col items-center py-4`}>
        <div className="space-y-4 w-full flex-1"> {/* Added w-full here for centering */}
          {/* Sidebar buttons here */}
          <button
            onClick={() => navigate('/')}
            className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${location.pathname === '/' ? `${colors.button} text-white` : `text-white opacity-70 hover:opacity-100 hover:bg-gray-700`}`}
            title="Home"
          >
            <Home size={20} className={colors.icon} />
          </button>
          <button
            onClick={() => navigate('/calendar')}
            className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${location.pathname === '/calendar' ? `${colors.button} text-white` : `text-white opacity-70 hover:opacity-100 hover:bg-gray-700`}`}
            title="Calendar"
          >
            <Calendar size={20} className={colors.icon} />
          </button>
          <button
            onClick={() => navigate('/markbook')}
            className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${location.pathname === '/markbook' ? `${colors.button} text-white` : `text-white opacity-70 hover:opacity-100 hover:bg-gray-700`}`}
            title="Markbook"
          >
            <BarChart3 size={20} className={colors.icon} />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${location.pathname === '/settings' ? `${colors.button} text-white` : `text-white opacity-70 hover:opacity-100 hover:bg-gray-700`}`}
            title="Settings"
          >
            <Settings size={20} className={colors.icon} />
          </button>
        </div>
      </div>
      {/* Theme Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30"> {/* Lowered opacity */}
          <div className={`rounded-xl p-8 shadow-2xl border-2 ${colors.container} ${colors.border} w-full max-w-xs mx-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Choose Theme</h3>
              <button onClick={() => setShowThemeModal(false)} className={`${effectiveMode === 'light' ? 'text-black' : 'text-white'} opacity-60 hover:opacity-100`}><X size={20} /></button>
            </div>
            {/* Theme Mode Toggle */}
            <div className="mb-6 flex flex-row items-center justify-center">
              <div className={`relative flex ${effectiveMode === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-full w-44 h-12 px-3 gap-x-2 py-2 transition-colors duration-200`}>
                {/* Toggle thumb */}
                <div
                  className={`absolute top-2 left-3 h-8 w-12 rounded-full transition-all duration-200 shadow-md ${themeMode === 'light' ? 'translate-x-0 bg-white' : themeMode === 'dark' ? 'translate-x-28 bg-gray-900' : 'translate-x-14 bg-gray-300 dark:bg-gray-800'}`}
                  style={{ zIndex: 1 }}
                />
                {/* Light */}
                <button
                  className={`relative flex-1 flex flex-col items-center justify-center z-10 rounded-full transition-colors duration-200 ${themeMode === 'light' ? (effectiveMode === 'light' ? 'text-blue-600' : 'text-blue-400') : (effectiveMode === 'light' ? 'text-black' : 'text-white')} mx-1`}
                  style={{ height: '40px' }}
                  onClick={() => setThemeMode('light')}
                >
                  <Sun size={20} />
                  <span className="text-xs font-medium">Light</span>
                </button>
                {/* System */}
                <button
                  className={`relative flex-1 flex flex-col items-center justify-center z-10 rounded-full transition-colors duration-200 ${themeMode === 'system' ? (effectiveMode === 'light' ? 'text-blue-600' : 'text-blue-400') : (effectiveMode === 'light' ? 'text-black' : 'text-white')} mx-1`}
                  style={{ height: '40px' }}
                  onClick={() => setThemeMode('system')}
                >
                  <Monitor size={20} />
                  <span className="text-xs font-medium">System</span>
                </button>
                {/* Dark */}
                <button
                  className={`relative flex-1 flex flex-col items-center justify-center z-10 rounded-full transition-colors duration-200 ${themeMode === 'dark' ? (effectiveMode === 'light' ? 'text-blue-600' : 'text-blue-400') : (effectiveMode === 'light' ? 'text-black' : 'text-white')} mx-1`}
                  style={{ height: '40px' }}
                  onClick={() => setThemeMode('dark')}
                >
                  <Moon size={20} />
                  <span className="text-xs font-medium">Dark</span>
                </button>
              </div>
            </div>
            {/* Normal Colour */}
            <div className={`mb-2 text-lg font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Normal Colour</div>
            <div className="flex flex-row flex-wrap gap-4 mb-6">
              {(Object.entries(colorVars) as [ThemeKey, typeof colorVars[ThemeKey]][]).map(([key, val]) => (
                <div key={key} className="flex flex-col items-center">
                  <button
                    className={`w-10 h-10 rounded-full border-2 ${(theme === key && themeType === 'normal') ? themeColors(effectiveMode)[key].borderAccent : 'border-gray-600'} ${val[effectiveMode].normal.swatch}`}
                    onClick={() => handleThemeChange(key, 'normal')}
                    title={themeColors(effectiveMode)[key].label}
                  />
                  <span className={`text-sm mt-1 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>{themeColors(effectiveMode)[key].label}</span>
                </div>
              ))}
            </div>
            {/* Extreme Colour */}
            <div className={`mb-2 text-lg font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Extreme Colour</div>
            <div className="flex flex-row flex-wrap gap-4">
              {(Object.entries(colorVars) as [ThemeKey, typeof colorVars[ThemeKey]][]).map(([key, val]) => (
                <div key={key} className="flex flex-col items-center">
                  <button
                    className={`w-10 h-10 rounded-full border-2 ${(theme === key && themeType === 'extreme') ? themeColors(effectiveMode)[key].borderAccent : 'border-gray-600'} ${val[effectiveMode].extreme.swatch}`}
                    onClick={() => handleThemeChange(key, 'extreme')}
                    title={themeColors(effectiveMode)[key].label + ' (Extreme)'}
                  />
                  <span className={`text-sm mt-1 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>{themeColors(effectiveMode)[key].label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header - Conditional based on route */}
            {location.pathname === '/' && (
              <div className="mb-8 flex items-center">
                <h1 className={`text-4xl font-bold mb-2 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}
                  style={{textAlign: 'left', width: '100%'}}>
                  {userName ? `${getGreeting()}, ${userName}!` : 'School Planner'}
                </h1>
              </div>
            )}
            {location.pathname === '/settings' && (
              <div className="mb-8 flex items-center">
                <h1 className={`text-4xl font-bold mb-2 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}
                  style={{textAlign: 'left', width: '100%'}}>
                  School Planner
                </h1>
              </div>
            )}

            {/* Loading State (only for main app after welcome) */}
            {loading && welcomeStep === 'completed' && (
              <div className="text-center py-8">
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${colors.spin} mx-auto mb-4`}></div>
                <p className="text-gray-400">Processing your calendar...</p>
              </div>
            )}

            {/* Error State (only for main app after welcome) */}
            {error && welcomeStep === 'completed' && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-red-400">
                  <FileText size={20} />
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Main Content Routes */}
            {mainContent}

            {/* Empty State for Calendar (only if not loading, no error, no data, and on calendar page) */}
            {!loading && !error && !weekData && location.pathname === '/calendar' && (
              <div className="text-center py-16">
                <Calendar size={64} className="mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 text-lg">No calendar data loaded yet</p>
                <p className="text-gray-500 text-sm">Upload an ICS file to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolPlanner;
// To set the favicon and page title:
// 1. Edit public/index.html
// 2. Set <title>School Planner</title>
// 3. For favicon, export the Lucide 'School' icon as SVG and set as <link rel="icon" href="/school.svg"> in index.html.