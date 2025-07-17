// NOTE: This file requires the following dependencies to be present in your package.json for deployment:
//   react, react-dom, lucide-react, @types/react, @types/react-dom
// Favicon and title are set in index.html, see instructions below.
import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { 
  Calendar, FileText, Home, BarChart3,
  Settings as SettingsIcon, LoaderCircle
} from 'lucide-react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ThemeKey, getColors } from './utils/theme';
import { normalizeSubjectName } from './utils/subjectUtils';
import { getSubjectIcon } from './utils/subjectUtils';
import { 
  CalendarEvent, 
  WeekData, 
  parseICS, 
  groupAllEventsIntoActualWeeks, 
  insertBreaksBetweenEvents, 
  getTodayOrNextEvents, 
  isBreakEvent 
} from './utils/calendarUtils';
import WelcomeScreen from './components/WelcomeScreen';
import Settings from './components/Settings';
import EventCard from './components/EventCard';
import SubjectEditModal from './components/SubjectEditModal';
import ThemeModal from './components/ThemeModal';
import { Subject } from './types';
import Sidebar from './components/Sidebar';
import SubjectCard from './components/SubjectCard';
import EventDetailsOverlay from './components/EventDetailsOverlay';
import { saveAs } from 'file-saver'; // If not present, fallback to manual download







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



  const getEventColour = (title: string): string => { // Changed to 'getEventColour'
    const normalizedTitle = normalizeSubjectName(title, autoNamingEnabled);
    const subject = subjects.find((s: Subject) => normalizeSubjectName(s.name, autoNamingEnabled) === normalizedTitle);
    return subject ? subject.colour : generateRandomColour(); // Changed to 'subject.colour'
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
          const normalizedName = normalizeSubjectName(event.summary, autoNamingEnabled);
          if (normalizedName) {
            if (!subjectMap.has(normalizedName)) {
              subjectMap.set(normalizedName, {
                id: crypto.randomUUID(),
                name: normalizedName,
                originalName: event.summary,
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

  // Clear all localStorage and reset state
  const clearData = () => {
    localStorage.clear(); // Clear everything including theme
    setWeekData(null);
    setError('');
    setSubjects([]);
    setWelcomeStep('welcome'); // Reset to welcome screen
    setUserName(''); // Clear user name
    setAutoNamingEnabled(true); // Reset auto-naming to default
    // Remove any now-unused state or props
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
        (s: Subject) => normalizeSubjectName(s.name, autoNamingEnabled) === normalizeSubjectName(editName, autoNamingEnabled) && s.id !== selectedSubjectForEdit.id
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



  const renderWeekView = () => {
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
                      infoOrder={infoOrder}
                      infoShown={infoShown}
                      showFirstInfoBeside={false} // Always false on calendar page
                      onClick={() => setSelectedEvent(event)}
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
              <SubjectCard
                key={subject.id}
                subject={subject}
                effectiveMode={effectiveMode}
                colors={colors}
                onEdit={startEditingSubject}
              />
            ))
          )}
        </div>

        <SubjectEditModal
          showSubjectEditModal={showSubjectEditModal}
          selectedSubjectForEdit={selectedSubjectForEdit}
          editName={editName}
          setEditName={setEditName}
          editColour={editColour}
          setEditColour={setEditColour}
          saveSubjectEdit={saveSubjectEdit}
          cancelSubjectEdit={cancelSubjectEdit}
          effectiveMode={effectiveMode}
          colors={colors}
          defaultColours={defaultColours}
        />
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <Settings
        userName={userName}
        setUserName={setUserName}
        clearData={clearData}
        autoNamingEnabled={autoNamingEnabled}
        setAutoNamingEnabled={setAutoNamingEnabled}
        showThemeModal={showThemeModal}
        setShowThemeModal={setShowThemeModal}
        theme={theme}
        themeType={themeType}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        handleThemeChange={handleThemeChange}
        effectiveMode={effectiveMode}
        colors={colors}
        infoOrder={infoOrder}
        infoShown={infoShown}
        showInfoPopup={showInfoPopup}
        setShowInfoPopup={setShowInfoPopup}
        draggedIdx={draggedIdx}
        handleDragStart={handleDragStart}
        handleInfoDragOver={handleInfoDragOver}
        handleDragEnd={handleDragEnd}
        handleToggleInfoShown={handleToggleInfoShown}
        showFirstInfoBeside={showFirstInfoBeside}
        setShowFirstInfoBeside={setShowFirstInfoBeside}
        isCalendarPage={location.pathname === '/calendar'}
        countdownInTitle={countdownInTitle}
        setCountdownInTitle={setCountdownInTitle}
        exportModalState={exportModalState}
        setExportModalState={setExportModalState}
        handleExport={handleExport}
      />
    );
  };



  // Add state to track which event is hovered for expand/collapse
  // In renderHome, insert breaks for the day's events
  const renderHome = () => {
    const { dayLabel, events } = getTodayOrNextEvents(weekData);
    // Insert breaks between events for home screen too
    const eventsWithBreaks = insertBreaksBetweenEvents(events);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Home className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={24} />
          <h2 className={`text-2xl font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Home</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${colors.container} rounded-lg ${colors.border} border p-6 col-span-1`}>
            <div className="flex items-center gap-3 mb-4">
              <Calendar className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={20} />
              <h3 className={`text-lg font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>{dayLabel ? `${dayLabel}'s Schedule` : 'No Schedule'}</h3>
            </div>
            {eventsWithBreaks.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                <p>No events</p>
              </div>
            ) : (
              <div className="space-y-3">
                {eventsWithBreaks.map((event, idx) => (
                  <EventCard
                    key={idx}
                    event={event}
                    index={idx}
                    isBreakEvent={isBreakEvent}
                    getEventColour={getEventColour}
                    autoNamingEnabled={autoNamingEnabled}
                    effectiveMode={effectiveMode}
                    infoOrder={infoOrder}
                    infoShown={infoShown}
                    showFirstInfoBeside={showFirstInfoBeside}
                    onClick={() => setSelectedEvent(event)}
                  />
                ))}
              </div>
            )}
          </div>
          {/* Countdown box on the right */}
          <CountdownBox
            searching={countdownSearching}
            nextEvent={nextEvent}
            nextEventDate={nextEventDate}
            timeLeft={timeLeft}
            formatCountdown={formatCountdownForTab}
            getEventColour={getEventColour}
            effectiveMode={effectiveMode}
            colors={colors}
          />
        </div>
      </div>
    );
  };

  // --- Top-level countdown state ---
  const [nextEvent, setNextEvent] = useState<CalendarEvent | null>(null);
  const [nextEventDate, setNextEventDate] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [countdownSearching, setCountdownSearching] = useState(true);

  // Helper: get next occurrence of an event after now, treating week as repeating
  function getNextOccurrence(event: CalendarEvent, now: Date): Date {
    const eventDay = event.dtstart.getDay(); // 0=Sun, 1=Mon, ...
    const eventHour = event.dtstart.getHours();
    const eventMinute = event.dtstart.getMinutes();
    const eventSecond = event.dtstart.getSeconds();
    let daysUntil = eventDay - now.getDay();
    if (
      daysUntil < 0 ||
      (daysUntil === 0 && (
        eventHour < now.getHours() ||
        (eventHour === now.getHours() && eventMinute < now.getMinutes()) ||
        (eventHour === now.getHours() && eventMinute === now.getMinutes() && eventSecond <= now.getSeconds())
      ))
    ) {
      daysUntil += 7;
    }
    const next = new Date(now);
    next.setDate(now.getDate() + daysUntil);
    next.setHours(eventHour, eventMinute, eventSecond, 0);
    return next;
  }

  function findNextRepeatingEvent(now: Date): { event: CalendarEvent; date: Date } | null {
    if (!weekData || !weekData.events || weekData.events.length === 0) return null;
    const nexts = weekData.events.map((e: CalendarEvent) => ({ event: e, date: getNextOccurrence(e, now) }));
    const soonest = nexts.reduce((min, curr) => (min === null || curr.date < min.date ? curr : min), null as { event: CalendarEvent; date: Date } | null);
    return soonest;
  }

  // --- Unified countdown effect ---
  useEffect(() => {
    if (!weekData || !weekData.events || weekData.events.length === 0) {
      setNextEvent(null);
      setNextEventDate(null);
      setTimeLeft(null);
      setCountdownSearching(false);
      setTabCountdown(null);
      return;
    }
    setCountdownSearching(true);
    const interval = setInterval(() => {
      const now = new Date();
      const soonest = findNextRepeatingEvent(now);
      if (soonest) {
        setNextEvent(soonest.event);
        setNextEventDate(soonest.date);
        const diff = soonest.date.getTime() - now.getTime();
        setTimeLeft(diff > 0 ? diff : 0);
        setCountdownSearching(false);
        const info = {
          time: formatCountdownForTab(diff > 0 ? diff : 0),
          event: normalizeSubjectName(soonest.event.summary, true),
        };
        setTabCountdown(info);
      } else {
        setNextEvent(null);
        setNextEventDate(null);
        setTimeLeft(null);
        setCountdownSearching(false);
        setTabCountdown(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [weekData]);

  // Format time left as HH:MM:SS for tab and widget
  function formatCountdownForTab(ms: number | null): string {
    if (ms === null) return '';
    if (ms <= 0) return 'Now!';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Make CountdownBox a pure display component
  type CountdownBoxProps = {
    searching: boolean;
    nextEvent: CalendarEvent | null;
    nextEventDate: Date | null;
    timeLeft: number | null;
    formatCountdown: (ms: number | null) => string;
    getEventColour: (title: string) => string;
    effectiveMode: 'light' | 'dark';
    colors: any;
  };
  const CountdownBox: React.FC<CountdownBoxProps> = ({ searching, nextEvent, nextEventDate, timeLeft, formatCountdown, getEventColour, effectiveMode, colors }) => {
    // Custom colored icon
    function ColoredSubjectIcon({ summary }: { summary: string }) {
      const color = getEventColour(summary);
      const icon = getSubjectIcon(summary, 24, effectiveMode);
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
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return (
      <div className={`${colors.container} rounded-lg ${colors.border} border p-6 flex flex-col items-center justify-center h-fit`}>
        <div className="flex items-center gap-2 mb-2">
          <Calendar className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={20} />
          <span className={`text-lg font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Next Event Countdown</span>
        </div>
        {searching ? (
          <div className="flex flex-col items-center justify-center py-6">
            <LoaderCircle className="animate-spin mb-2" size={32} />
            <span className="text-gray-400">Searching...</span>
          </div>
        ) : nextEvent && nextEventDate ? (
          <>
            <div className="text-3xl font-bold mb-2" style={{ color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>{formatCountdown(timeLeft)}</div>
            <div className="flex items-center gap-2 mb-1">
              <ColoredSubjectIcon summary={nextEvent.summary} />
              <span className="text-base font-medium" style={{ color: getEventColour(nextEvent.summary) }}>{normalizeSubjectName(nextEvent.summary, true)}</span>
            </div>
            <div className="text-sm opacity-80">
              {(() => {
                const now = new Date();
                const daysDiff = Math.floor((nextEventDate.setHours(0,0,0,0) - now.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
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
          </>
        ) : (
          <div className="text-lg text-gray-400">No upcoming events</div>
        )}
      </div>
    );
  };

  const renderWelcomeScreen = () => {
    return (
      <WelcomeScreen
        welcomeStep={welcomeStep}
        userName={userName}
        setUserName={setUserName}
        setWelcomeStep={setWelcomeStep}
        loading={loading}
        error={error}
        dragOver={dragOver}
        handleDragOver={handleDragOver}
        handleDragLeave={handleDragLeave}
        handleDrop={handleDrop}
        handleFileChange={handleFileChange}
        fileInputRef={fileInputRef}
        effectiveMode={effectiveMode}
        navigate={navigate}
      />
    );
  };





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
  const colors = getColors(theme, themeType, effectiveMode);

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



  // --- Persist userName to localStorage on change ---
  React.useEffect(() => {
    if (welcomeStep === 'completed') {
      console.log('[SaveEffect] Saving userName:', userName);
      if (userName !== undefined) {
        localStorage.setItem('userName', userName);
      }
    } else {
      console.log('[SaveEffect] Not saving userName because welcomeStep is', welcomeStep);
    }
  }, [userName, welcomeStep]);

  // --- Load userName from localStorage on mount ---
  React.useEffect(() => {
    const savedName = localStorage.getItem('userName');
    if (savedName && !userName) {
      setUserName(savedName);
    }
  }, []);

  // --- On mount, if userName, weekData, and subjects exist in localStorage, skip welcome screen ---
  React.useEffect(() => {
    if (welcomeStep === 'welcome') {
      const savedWeekData = localStorage.getItem('weekData');
      const savedSubjects = localStorage.getItem('subjects');
      const savedName = localStorage.getItem('userName');
      if (savedWeekData && savedSubjects && savedName) {
        setUserName(savedName);
        setWelcomeStep('completed');
      }
    }
  }, [welcomeStep]);

  // --- Atomic localStorage check on first mount ---
  const [isInitializing, setIsInitializing] = useState(true);
  React.useEffect(() => {
    // Only run on first mount
    const savedWeekData = localStorage.getItem('weekData');
    const savedSubjects = localStorage.getItem('subjects');
    const savedName = localStorage.getItem('userName');
    console.log('[AtomicCheck] weekData:', savedWeekData);
    console.log('[AtomicCheck] subjects:', savedSubjects);
    console.log('[AtomicCheck] userName:', savedName);
    if (savedWeekData && savedSubjects && savedName) {
      try {
        // Parse and set weekData
        const parsedWeek = JSON.parse(savedWeekData);
        parsedWeek.monday = new Date(parsedWeek.monday);
        parsedWeek.friday = new Date(parsedWeek.friday);
        parsedWeek.events = parsedWeek.events.map((e: any) => ({ ...e, dtstart: new Date(e.dtstart), dtend: e.dtend ? new Date(e.dtend) : undefined }));
        setWeekData(parsedWeek);
        // Parse and set subjects
        setSubjects(JSON.parse(savedSubjects));
        // Set userName
        setUserName(savedName);
        // Skip welcome
        setWelcomeStep('completed');
        console.log('[AtomicCheck] All data found, setting welcomeStep to completed');
      } catch (err) {
        console.log('[AtomicCheck] Error parsing localStorage data:', err);
        // If any error, do not skip welcome
      }
    } else {
      console.log('[AtomicCheck] Not all data found, staying on welcome');
    }
    setIsInitializing(false);
  }, []);

  // --- Welcome screen URL logic ---
  React.useEffect(() => {
    if (isInitializing) return;
    console.log('[NavEffect] welcomeStep:', welcomeStep, 'location.pathname:', location.pathname);
    if (welcomeStep !== 'completed' && location.pathname !== '/welcome') {
      navigate('/welcome', { replace: true });
    }
    if (welcomeStep === 'completed' && location.pathname === '/welcome') {
      navigate('/home', { replace: true });
    }
  }, [welcomeStep, location.pathname, navigate, isInitializing]);

  // --- Save weekData to localStorage ---
  React.useEffect(() => {
    if (welcomeStep === 'completed') {
      console.log('[SaveEffect] Saving weekData:', weekData);
      console.log('[SaveEffect] Saving subjects:', subjects);
      if (weekData) {
        localStorage.setItem('weekData', JSON.stringify(weekData));
      } else {
        localStorage.removeItem('weekData');
      }
      if (subjects) {
        localStorage.setItem('subjects', JSON.stringify(subjects));
      } else {
        localStorage.removeItem('subjects');
      }
    } else {
      console.log('[SaveEffect] Not saving weekData/subjects because welcomeStep is', welcomeStep);
    }
  }, [weekData, subjects, welcomeStep]);

  // --- Load weekData from localStorage on mount ---
  React.useEffect(() => {
    if (!weekData && welcomeStep === 'completed') {
      const saved = localStorage.getItem('weekData');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          parsed.monday = new Date(parsed.monday);
          parsed.friday = new Date(parsed.friday);
          parsed.events = parsed.events.map((e: any) => ({ ...e, dtstart: new Date(e.dtstart), dtend: e.dtend ? new Date(e.dtend) : undefined }));
          setWeekData(parsed);
        } catch {}
      }
    }
    if ((!subjects || subjects.length === 0) && welcomeStep === 'completed') {
      const savedSubjects = localStorage.getItem('subjects');
      if (savedSubjects) {
        try {
          setSubjects(JSON.parse(savedSubjects));
        } catch {}
      }
    }
  }, [weekData, subjects, welcomeStep]);

  // --- On mount, if weekData and subjects exist in localStorage, skip welcome screen ---
  React.useEffect(() => {
    if (welcomeStep === 'welcome') {
      const savedWeekData = localStorage.getItem('weekData');
      const savedSubjects = localStorage.getItem('subjects');
      if (savedWeekData && savedSubjects) {
        setWelcomeStep('completed');
      }
    }
  }, [welcomeStep]);

  // Add state for info shown at start and popup/modal
  const defaultInfoOrder = [
    { key: 'time', label: 'Time' },
    { key: 'location', label: 'Location' },
    { key: 'teacher', label: 'Teacher' },
    { key: 'period', label: 'Period' }, // NEW
  ];
  const [infoOrder, setInfoOrder] = useState(() => {
    const saved = localStorage.getItem('eventInfoOrder');
    return saved ? JSON.parse(saved) : defaultInfoOrder;
  });
  const [infoShown, setInfoShown] = useState(() => {
    const saved = localStorage.getItem('eventInfoShown');
    return saved ? JSON.parse(saved) : { time: false, location: false, teacher: false };
  });
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // State for event details overlay
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Add state for tab countdown info (for tab title)
  const [tabCountdown, setTabCountdown] = useState<{ time: string; event: string } | null>(null);

  // Save infoOrder and infoShown to localStorage
  useEffect(() => {
    localStorage.setItem('eventInfoOrder', JSON.stringify(infoOrder));
  }, [infoOrder]);
  useEffect(() => {
    localStorage.setItem('eventInfoShown', JSON.stringify(infoShown));
  }, [infoShown]);

  // Drag and drop handlers
  const handleDragStart = (idx: number) => setDraggedIdx(idx);
  const handleInfoDragOver = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) return;
    const newOrder = [...infoOrder];
    const [removed] = newOrder.splice(draggedIdx, 1);
    newOrder.splice(idx, 0, removed);
    setInfoOrder(newOrder);
    setDraggedIdx(idx);
  };
  const handleDragEnd = () => setDraggedIdx(null);

  // When a field is toggled on, move it to the top of infoOrder
  const handleToggleInfoShown = (key: string) => {
    setInfoShown((prev: Record<string, boolean>) => {
      const newShown = { ...prev, [key]: !prev[key] };
        // Move to top if toggled on
      if (newShown[key]) {
        setInfoOrder((prevOrder: { key: string; label: string }[]) => {
          const idx = prevOrder.findIndex(i => i.key === key);
          if (idx > 0) {
            const newOrder = [...prevOrder];
            const [item] = newOrder.splice(idx, 1);
            newOrder.unshift(item);
            return newOrder;
          }
          return prevOrder;
        });
      }
      return newShown;
    });
  };

  // Add state for showFirstInfoBeside
  const [showFirstInfoBeside, setShowFirstInfoBeside] = useState(() => {
    const saved = localStorage.getItem('showFirstInfoBeside');
    return saved === null ? true : saved === 'true';
  });
  // Persist showFirstInfoBeside
  useEffect(() => {
    localStorage.setItem('showFirstInfoBeside', showFirstInfoBeside ? 'true' : 'false');
  }, [showFirstInfoBeside]);

  // Add state for countdown in tab title
  const [countdownInTitle, setCountdownInTitle] = useState(() => {
    const saved = localStorage.getItem('countdownInTitle');
    return saved === 'true';
  });
  // Persist countdownInTitle
  useEffect(() => {
    localStorage.setItem('countdownInTitle', countdownInTitle ? 'true' : 'false');
  }, [countdownInTitle]);

  // Update document.title for countdown in tab title
  useEffect(() => {
    if (countdownInTitle && tabCountdown && tabCountdown.time && tabCountdown.event) {
      document.title = `${tabCountdown.time} until ${tabCountdown.event}`;
    } else {
      document.title = 'School Planner';
    }
  }, [countdownInTitle, tabCountdown]);

  // --- Load tabCountdown from localStorage on mount ---
  useEffect(() => {
    const saved = localStorage.getItem('tabCountdown');
    if (saved) {
      try {
        setTabCountdown(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Add state for export modal
  const [exportModalState, setExportModalState] = useState({
    show: false,
    options: {
      subjects: true,
      subjectInfo: true,
      subjectNotes: true,
      subjectColours: true,
      subjectIcons: true,
      name: false,
    },
  });

  const handleExport = () => {
    // Gather export data based on toggles
    const data: any = {};
    if (exportModalState.options.subjects) {
      data.subjects = subjects.map(subject => {
        const timings = weekData?.events
          .filter(e => normalizeSubjectName(e.summary, autoNamingEnabled) === normalizeSubjectName(subject.name, autoNamingEnabled))
          .map(e => ({
            start: e.dtstart,
            end: e.dtend,
            location: e.location,
            description: e.description,
          })) || [];
        return {
          id: subject.id,
          name: subject.name,
          originalName: subject.originalName,
          timings,
        };
      });
    }
    if (exportModalState.options.subjectInfo) {
      data.subjectInfo = subjects.map(subject => ({
        id: subject.id,
        name: subject.name,
        originalName: subject.originalName,
      }));
    }
    if (exportModalState.options.subjectNotes) {
      data.subjectNotes = {};
      subjects.forEach(subject => {
        const key = `subject_note_${normalizeSubjectName(subject.name, true)}`;
        const note = localStorage.getItem(key);
        if (note) data.subjectNotes[subject.name] = note;
      });
    }
    if (exportModalState.options.subjectColours) {
      data.subjectColours = subjects.map(subject => ({
        name: subject.name,
        colour: subject.colour,
      }));
    }
    if (exportModalState.options.subjectIcons) {
      data.subjectIcons = subjects.map(subject => ({
        name: subject.name,
        icon: normalizeSubjectName(subject.name, true),
      }));
    }
    if (exportModalState.options.name) {
      data.name = userName;
    }
    // Obfuscate: encode JSON as Base64
    const json = JSON.stringify(data, null, 2);
    const base64 = btoa(unescape(encodeURIComponent(json)));
    const blob = new Blob([base64], { type: 'text/plain' });
    const fileName = `${userName || 'schoolplanner'}-export.school`;
    if (typeof saveAs === 'function') {
      saveAs(blob, fileName);
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    }
    setExportModalState(s => ({ ...s, show: false }));
  };

  // Main content routes
  // Only show welcome screen if not completed
  let mainContent = null;
  if (welcomeStep !== 'completed') {
    mainContent = (
      <Routes>
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route path="/welcome" element={renderWelcomeScreen()} />
      </Routes>
    );
  } else {
    mainContent = (
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={renderHome()} />
        <Route path="/calendar" element={renderWeekView()} />
        <Route path="/markbook" element={renderMarkbook()} />
        <Route path="/settings" element={renderSettings()} />
      </Routes>
    );
  }

  // Main render logic
  if (isInitializing) {
    return null; // Or a spinner if you want
  }
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
      <Sidebar
        navigate={navigate}
        location={location}
        colors={colors}
        SettingsIcon={SettingsIcon}
      />
      <ThemeModal
        showThemeModal={showThemeModal}
        setShowThemeModal={setShowThemeModal}
        theme={theme}
        themeType={themeType}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        handleThemeChange={handleThemeChange}
        effectiveMode={effectiveMode}
        colors={colors}
      />
      {/* Main Content */}
      <div className="flex-1 ml-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header - Conditional based on route */}
            {location.pathname === '/home' && (
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
      {/* Event Details Overlay */}
      {selectedEvent && (
        <EventDetailsOverlay
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          colors={colors}
          effectiveMode={effectiveMode}
          subjects={subjects}
        />
      )}
    </div>
  );
};

export default SchoolPlanner;
// To set the favicon and page title:
// 1. Edit public/index.html
// 2. Set <title>School Planner</title>
// 3. For favicon, export the Lucide 'School' icon as SVG and set as <link rel="icon" href="/school.svg"> in index.html.

