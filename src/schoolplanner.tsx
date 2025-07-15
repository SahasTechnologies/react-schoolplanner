// NOTE: This file requires the following dependencies to be present in your package.json for deployment:
//   react, react-dom, lucide-react, @types/react, @types/react-dom
import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Upload, Calendar, FileText, Clock, MapPin, X, Home, BarChart3, Settings, Edit2, User, ChevronLeft, ChevronRight } from 'lucide-react';

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

const CorporateICSScheduleViewer = () => {
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showUpload, setShowUpload] = useState(true); // Still used for the specific upload component
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

  // New state for enhanced biweekly schedule toggle, off by default
  const [enhancedBiweeklyScheduleEnabled, setEnhancedBiweeklyScheduleEnabled] = useState(false);

  // New states for week navigation
  const [patternWeekSchedules, setPatternWeekSchedules] = useState<WeekData[]>([]); // Stores the unique repeating pattern
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0); // Index within the repeating pattern

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
    const subject = subjects.find(s => normalizeSubjectName(s.name) === normalizedTitle);
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

  // Helper to get the Monday of a given date's week
  const getMonday = (d: Date): Date => {
    const date = new Date(d);
    const day = date.getDay(); // Sunday - 0, Monday - 1, ..., Saturday - 6
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // Helper to get a canonical string representation of a week's events for comparison
  const getWeekPatternString = (events: CalendarEvent[]): string => {
    // Sort events by start time, then summary, then location, then description
    const sortedEvents = [...events].sort((a, b) => {
      if (a.dtstart.getTime() !== b.dtstart.getTime()) {
        return a.dtstart.getTime() - b.dtstart.getTime();
      }
      if (a.summary !== b.summary) {
        return a.summary.localeCompare(b.summary);
      }
      if (a.location && b.location && a.location !== b.location) {
        return a.location.localeCompare(b.location);
      }
      if (a.description && b.description && a.description !== b.description) {
        return a.description.localeCompare(b.description);
      }
      return 0;
    });

    // Create a string representation for comparison
    return sortedEvents.map(event =>
      `${event.dtstart.getDay()}-${event.dtstart.getHours()}:${event.dtstart.getMinutes()}|${event.dtend?.getHours() || ''}:${event.dtend?.getMinutes() || ''}|${normalizeSubjectName(event.summary)}|${event.location || ''}`
    ).join(';');
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
      const mondayKey = mondayOfWeek.toISOString().split('T')[0]; // Use YYYY-MM-DD as key

      if (!weeksMap.has(mondayKey)) {
        weeksMap.set(mondayKey, []);
      }
      weeksMap.get(mondayKey)?.push(event);
    });

    const actualWeeks: WeekData[] = [];
    const sortedMondayKeys = Array.from(weeksMap.keys()).sort();

    sortedMondayKeys.forEach(mondayKey => {
      const mondayDate = new Date(mondayKey);
      const fridayDate = new Date(mondayDate);
      fridayDate.setDate(mondayDate.getDate() + 4);
      fridayDate.setHours(23, 59, 59, 999);

      const eventsInThisWeek = weeksMap.get(mondayKey) || [];
      
      // Filter to only include events within the Mon-Fri range for this specific week
      const filteredEvents = eventsInThisWeek.filter(event => {
        const eventDtstart = new Date(event.dtstart);
        return eventDtstart >= mondayDate && eventDtstart <= fridayDate;
      });

      // Only add weeks that have at least one event
      if (filteredEvents.length > 0) {
        actualWeeks.push({
          monday: mondayDate,
          friday: fridayDate,
          events: filteredEvents
        });
      }
    });

    return actualWeeks;
  };

  // Identifies the shortest repeating pattern from a list of actual weeks
  const identifyRepeatingPattern = (allActualWeeks: WeekData[]): { patternSequence: WeekData[], cycleLength: number, firstPatternMonday: Date | null } => {
    if (allActualWeeks.length === 0) {
      return { patternSequence: [], cycleLength: 0, firstPatternMonday: null };
    }

    const relevantWeeks = allActualWeeks;
    const firstPatternMonday = relevantWeeks[0].monday;

    for (let cycleLen = 1; cycleLen <= relevantWeeks.length; cycleLen++) {
      const currentPattern = relevantWeeks.slice(0, cycleLen);
      const currentPatternStrings = currentPattern.map(week => getWeekPatternString(week.events));

      let isRepeating = true;
      for (let i = cycleLen; i < relevantWeeks.length; i++) {
        const compareIndex = (i - cycleLen) % cycleLen;
        if (getWeekPatternString(relevantWeeks[i].events) !== currentPatternStrings[compareIndex]) {
          isRepeating = false;
          break;
        }
      }

      if (isRepeating) {
        return {
          patternSequence: currentPattern,
          cycleLength: cycleLen,
          firstPatternMonday: firstPatternMonday
        };
      }
    }

    // Fallback: If no repeating pattern found, treat all actual weeks as unique patterns
    const uniquePatternsFromAllWeeks: WeekData[] = [];
    const seenPatternsFallback = new Set<string>();
    allActualWeeks.forEach(week => {
        const patternString = getWeekPatternString(week.events);
        if (!seenPatternsFallback.has(patternString)) {
            seenPatternsFallback.add(patternString);
            uniquePatternsFromAllWeeks.push(week);
        }
    });

    return {
        patternSequence: uniquePatternsFromAllWeeks,
        cycleLength: uniquePatternsFromAllWeeks.length,
        firstPatternMonday: uniquePatternsFromAllWeeks.length > 0 ? uniquePatternsFromAllWeeks[0].monday : null
    };
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

        if (enhancedBiweeklyScheduleEnabled) {
          const { patternSequence, cycleLength, firstPatternMonday } = identifyRepeatingPattern(allActualWeeks);
          setPatternWeekSchedules(patternSequence);

          if (patternSequence.length === 0 || firstPatternMonday === null) {
              setError('Could not identify a repeating timetable pattern from the provided file.');
              setWelcomeStep('upload_ics');
              setLoading(false);
              return;
          }

          const today = new Date();
          const currentRealMonday = getMonday(today);
          const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;
          const diffMilliseconds = currentRealMonday.getTime() - firstPatternMonday.getTime();
          
          let weeksSinceFirstPatternMonday = 0;
          if (diffMilliseconds >= 0) {
              weeksSinceFirstPatternMonday = Math.floor(diffMilliseconds / millisecondsPerWeek);
          } else {
              weeksSinceFirstPatternMonday = 0; 
          }

          const initialPatternIndex = weeksSinceFirstPatternMonday % cycleLength;
          
          setCurrentPatternIndex(initialPatternIndex);
          setWeekData(patternSequence[initialPatternIndex]);

        } else { // Enhanced Biweekly Schedule is OFF
          // Find the first FULL week (Monday to Friday, all days have at least one event)
          let firstFullWeek: WeekData | null = null;
          for (const week of allActualWeeks) {
            // Check if all days Monday (1) to Friday (5) have at least one event
            const daysWithEvents = [false, false, false, false, false];
            week.events.forEach(event => {
              const day = new Date(event.dtstart).getDay();
              if (day >= 1 && day <= 5) {
                daysWithEvents[day - 1] = true;
              }
            });
            if (daysWithEvents.every(Boolean)) {
              firstFullWeek = week;
              break;
            }
          }

          if (firstFullWeek) {
              setWeekData(firstFullWeek);
              setPatternWeekSchedules([firstFullWeek]); // Only one week in the "pattern" for this mode
              setCurrentPatternIndex(0);
          } else {
              setError('No full Monday-Friday week with events found.');
              setWelcomeStep('upload_ics');
              setLoading(false);
              return;
          }
        }

        setShowUpload(false);
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
    setShowUpload(true);
    setError('');
    setSubjects([]);
    setWelcomeStep('welcome'); // Reset to welcome screen
    setUserName(''); // Clear user name
    setAutoNamingEnabled(true); // Reset auto-naming to default
    setEnhancedBiweeklyScheduleEnabled(false); // Reset enhanced schedule to default off
    setPatternWeekSchedules([]); // Clear unique week schedules
    setCurrentPatternIndex(0); // Reset week index
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
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
        s => normalizeSubjectName(s.name) === normalizeSubjectName(editName) && s.id !== selectedSubjectForEdit.id
      );

      if (existingSubjectWithNewName) {
        // Merge: Update events to point to the existing subject's ID
        // This is a simplified merge, actual event re-assignment isn't handled here
        // For now, we'll just remove the old subject and keep the existing one.
        setSubjects(prevSubjects =>
          prevSubjects.filter(s => s.id !== selectedSubjectForEdit.id)
        );
        // The colour of the existing subject might be updated if desired, but for simplicity, we keep its original colour.
      } else {
        // No conflict, just update the subject
        setSubjects(prevSubjects =>
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

  const goToPreviousWeek = () => {
    setCurrentPatternIndex((prevIndex: number) => {
      const newIndex = (prevIndex > 0 ? prevIndex - 1 : patternWeekSchedules.length - 1);
      setWeekData(patternWeekSchedules[newIndex]);
      return newIndex;
    });
  };

  const goToNextWeek = () => {
    setCurrentPatternIndex((prevIndex: number) => {
      const newIndex = (prevIndex < patternWeekSchedules.length - 1 ? prevIndex + 1 : 0);
      setWeekData(patternWeekSchedules[newIndex]);
      return newIndex;
    });
  };


  const renderWeekView = () => {
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

      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday (0) or Saturday (6) - skip
        return;
      } else {
        dayIndex = dayOfWeek - 1; // Monday (1) -> 0, Friday (5) -> 4
      }

      if (dayIndex >= 0 && dayIndex < 5) {
        dayEvents[dayIndex].push(event);
      }
    });

    dayEvents.forEach((dayEventList: CalendarEvent[]) => {
      dayEventList.sort((a: CalendarEvent, b: CalendarEvent) => a.dtstart.getTime() - b.dtstart.getTime());
    });

    // Only show week navigation if enhancedBiweeklyScheduleEnabled is true and more than one pattern week
    const showWeekNavigation = enhancedBiweeklyScheduleEnabled && patternWeekSchedules.length > 1;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="text-blue-400" size={24} />
            <h2 className="text-2xl font-semibold text-white">Weekly Schedule</h2>
          </div>
          <div className="flex items-center gap-4">
            {showWeekNavigation && (
              <>
                <button
                  onClick={goToPreviousWeek}
                  disabled={patternWeekSchedules.length <= 1}
                  className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="text-sm text-gray-400">
                  {formatDate(weekData.monday)} - {formatDate(weekData.friday)}
                  <span className="ml-2">({currentPatternIndex + 1} of {patternWeekSchedules.length})</span>
                </div>
                <button
                  onClick={goToNextWeek}
                  disabled={patternWeekSchedules.length <= 1}
                  className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            {!showWeekNavigation && (
              <div className="text-sm text-gray-400">
                {formatDate(weekData.monday)} - {formatDate(weekData.friday)}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {days.map((day, index) => {
            return (
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
                    dayEvents[index].map((event: CalendarEvent, eventIndex: number) => (
                      <div
                        key={eventIndex}
                        className="rounded-lg p-3 text-white text-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                        style={{ backgroundColor: getEventColour(event.summary) }} // Changed to 'getEventColour'
                      >
                        <div className="font-medium mb-1 leading-tight">
                          {event.summary}
                        </div>

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
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMarkbook = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-blue-400" size={24} />
          <h2 className="text-2xl font-semibold text-white">Markbook</h2>
        </div>

        <div className="space-y-4">
          {subjects.length === 0 ? (
            <div className="text-center py-16">
              <BarChart3 size={64} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg">No subjects found</p>
              <p className="text-gray-500 text-sm">Upload a calendar file to see your subjects</p>
            </div>
          ) : (
            subjects.map((subject: Subject) => (
              <div key={subject.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: subject.colour }} // Changed to 'subject.colour'
                    />
                    <span className="text-white font-medium capitalize">{subject.name}</span>
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
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700 w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4">Edit Subject</h3>
              <p className="text-gray-400 text-sm mb-4">Original Name: <span className="font-medium text-white">{selectedSubjectForEdit.name}</span></p> {/* Added original name */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="subjectName" className="block text-gray-300 text-sm font-medium mb-1">Subject Name</label>
                  <input
                    id="subjectName"
                    type="text"
                    value={editName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="subjectColour" className="block text-gray-300 text-sm font-medium mb-2">Subject Colour</label> {/* Changed to 'subjectColour' */}
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
          <Settings className="text-blue-400" size={24} />
          <h2 className="text-2xl font-semibold text-white">Settings</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Timetable Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Clear Timetable Data</p>
                  <p className="text-gray-400 text-sm">This will remove all uploaded calendar data and subjects</p>
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
                  <p className="text-white font-medium">Enable Auto-Naming</p>
                  <p className="text-gray-400 text-sm">Automatically rename subjects based on keywords</p>
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
              <div className="flex items-center justify-between mt-4 border-t border-gray-700 pt-4">
                <div>
                  <p className="text-white font-medium">Enhanced Biweekly Schedule</p>
                  <p className="text-gray-400 text-sm">Detect and display repeating biweekly/multi-week timetables <span className="text-blue-400">(Beta)</span></p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enhancedBiweeklyScheduleEnabled}
                    onChange={() => setEnhancedBiweeklyScheduleEnabled(!enhancedBiweeklyScheduleEnabled)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
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
          <Home className="text-blue-400" size={24} />
          <h2 className="text-2xl font-semibold text-white">Home</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="text-blue-400" size={20} />
              <h3 className="text-lg font-medium text-white">Schedule</h3>
            </div>
            <p className="text-gray-400 mb-4">
              {weekData ? 'View your weekly schedule' : 'Upload your ICS calendar file to get started'}
            </p>
            <button
              onClick={() => setCurrentPage('calendar')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              {weekData ? 'View Schedule' : 'Upload Calendar'}
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="text-blue-400" size={20} />
              <h3 className="text-lg font-medium text-white">Markbook</h3>
            </div>
            <p className="text-gray-400 mb-4">
              {subjects.length > 0 ? `Manage your ${subjects.length} subjects` : 'No subjects available yet'}
            </p>
            <button
              onClick={() => setCurrentPage('markbook')}
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

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return renderHome();
      case 'calendar':
        return renderWeekView();
      case 'markbook':
        return renderMarkbook();
      case 'settings':
        return renderSettings();
      default:
        return renderHome();
    }
  };

  // Main render logic based on welcomeStep
  if (welcomeStep !== 'completed') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center font-inter">
        {renderWelcomeScreen()}
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
            <Home size={20} />
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

export default CorporateICSScheduleViewer;

