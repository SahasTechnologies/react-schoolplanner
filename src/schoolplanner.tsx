// NOTE: This file requires the following dependencies to be present in your package.json for deployment:
//   react, react-dom, lucide-react, @types/react, @types/react-dom
// Favicon and title are set in index.html, see instructions below.
import { useState, useRef } from 'react';
import { Calendar, FileText, BarChart3, Settings, Home as HomeIcon } from 'lucide-react';
import Home from './components/Home';
import WeekView from './components/WeekView';
import Markbook from './components/Markbook';
import SettingsPage from './components/Settings';

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

const SchoolPlanner = () => {
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState('home'); // Initial page
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
    ['pe', 'PD/H/PE'],
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

  // processFile is used internally, so do not remove unless truly unused. If not used, remove it.

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


  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home weekData={weekData} subjects={subjects} setCurrentPage={setCurrentPage} userName={userName} getGreeting={getGreeting} />;
      case 'calendar':
        return <WeekView weekData={weekData} getEventColour={getEventColour} formatTime={formatTime} />;
      case 'markbook':
        return <Markbook
          subjects={subjects}
          startEditingSubject={startEditingSubject}
          showSubjectEditModal={showSubjectEditModal}
          selectedSubjectForEdit={selectedSubjectForEdit}
          editName={editName}
          setEditName={setEditName}
          editColour={editColour}
          setEditColour={setEditColour}
          saveSubjectEdit={saveSubjectEdit}
          cancelSubjectEdit={cancelSubjectEdit}
          defaultColours={defaultColours}
          customColourInputRef={customColourInputRef}
        />;
      case 'settings':
        return <SettingsPage clearData={clearData} />;
      default:
        return <Home weekData={weekData} subjects={subjects} setCurrentPage={setCurrentPage} userName={userName} getGreeting={getGreeting} />;
    }
  };

  // Main render logic based on welcomeStep
  if (welcomeStep !== 'completed') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center font-inter">
        {/* Welcome screen content is now handled by Home component */}
        {renderCurrentPage()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex font-inter">
      {/* Sidebar */}
      <div className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4">
        <div className="space-y-4 w-full"> {/* Added w-full here for centering */}
          <button
            onClick={() => setCurrentPage('home')}
            className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${ // Added mx-auto block
              currentPage === 'home'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <HomeIcon size={20} />
          </button>

          <button
            onClick={() => setCurrentPage('calendar')}
            className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${ // Added mx-auto block
              currentPage === 'calendar'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Calendar size={20} />
          </button>

          <button
            onClick={() => setCurrentPage('markbook')}
            className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${ // Added mx-auto block
              currentPage === 'markbook'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <BarChart3 size={20} />
          </button>

          <button
            onClick={() => setCurrentPage('settings')}
            className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${ // Added mx-auto block
              currentPage === 'settings'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header - Conditional based on page */}
            {currentPage === 'home' && (
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2 text-white">
                  {userName ? `${getGreeting()}, ${userName}!` : 'School Planner'}
                </h1>
                <p className="text-gray-400">Manage your schedule and subjects</p>
              </div>
            )}
            {currentPage === 'settings' && (
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2 text-white">School Planner</h1>
                <p className="text-gray-400">Manage your schedule and subjects</p>
              </div>
            )}


            {/* Loading State (only for main app after welcome) */}
            {loading && welcomeStep === 'completed' && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
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

            {/* Current Page Content */}
            {renderCurrentPage()}

            {/* Empty State for Calendar (only if not loading, no error, no data, and on calendar page) */}
            {!loading && !error && !weekData && currentPage === 'calendar' && (
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

