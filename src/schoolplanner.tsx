// NOTE: This file requires the following dependencies to be present in your package.json for deployment:
//   react, react-dom, lucide-react, @types/react, @types/react-dom
// Favicon and title are set in index.html, see instructions below.
import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { 
  Calendar, FileText, Clock, MapPin, X, Home, BarChart3, Edit2, User,
  Sun, Moon, Monitor, GripVertical, Palette,
  Utensils // <-- Add Utensils icon
} from 'lucide-react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ThemeKey, colorVars, themeColors, getColors } from './theme';
import { normalizeSubjectName, getSubjectIcon } from './subjectUtils';
import { 
  CalendarEvent, 
  WeekData, 
  hexToRgba, 
  parseICS, 
  groupAllEventsIntoActualWeeks, 
  insertBreaksBetweenEvents, 
  formatTime, 
  getTodayOrNextEvents, 
  isBreakEvent 
} from './calendarUtils';
import WelcomeScreen from './components/WelcomeScreen';
import Settings from './components/Settings';



interface Subject {
  id: string; // Unique ID for the subject
  name: string; // Display name, can be edited
  originalName?: string; // Original name from ICS file
  colour: string; // Changed to Australian English 'colour'
}



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
                  dayEventsWithBreaks[index].map((event, eventIndex) => {
                    if (event.isBreak) {
                      return (
                        <div
                          key={`break-${eventIndex}`}
                          className="rounded-lg p-3 flex items-center justify-between text-sm font-semibold opacity-80"
                          style={{ 
                            backgroundColor: effectiveMode === 'light' ? 'transparent' : 'transparent', 
                            color: effectiveMode === 'light' ? '#000' : '#fff',
                            border: '1px dashed #888',
                            borderWidth: 1,
                            minHeight: 40
                          }}
                        >
                          <div className="flex-1 text-left flex items-center" style={{justifyContent: 'flex-start'}}>
                            Break
                            <span className="text-xs ml-2 opacity-60">{formatTime(event.dtstart)} - {formatTime(event.dtend ?? event.dtstart)}</span>
                          </div>
                          <Utensils size={20} className={effectiveMode === 'light' ? 'text-black' : 'text-white'} />
                        </div>
                      );
                    }
                    // ... existing code for normal event ...
                    let teacherName = '';
                    let periodInfo = '';
                    if (event.description) {
                      const teacherMatch = event.description.match(/Teacher:\s*([^\n\r]+?)(?:\s*Period:|$)/i);
                      if (teacherMatch) {
                        teacherName = teacherMatch[1].trim();
                      }
                      const periodMatch = event.description.match(/Period:\s*([^\n\r]+?)(?:\s*$|\s*Teacher:|$)/i);
                      if (periodMatch) {
                        periodInfo = periodMatch[1].trim();
                      }
                    }
                    const infoFields: Record<string, React.ReactNode> = {
                      time: (
                        <div key="time" className="flex items-center gap-1 text-xs opacity-80 mb-1">
                          <Clock size={12} />
                          <span>{formatTime(event.dtstart)}{event.dtend && !isNaN(new Date(event.dtend).getTime()) ? ` - ${formatTime(event.dtend ?? event.dtstart)}` : ''}</span>
                        </div>
                      ),
                      location: event.location ? (
                        <div key="location" className="flex items-center gap-1 text-xs opacity-80 mb-1">
                          <MapPin size={12} />
                          <span>{event.location}</span>
                        </div>
                      ) : null,
                      teacher: teacherName ? (
                        <div key="teacher" className="flex items-center gap-1 text-xs opacity-80 mb-1">
                          <User size={12} />
                          <span>{teacherName}</span>
                        </div>
                      ) : null,
                      period: periodInfo ? (
                        <div key="period" className="flex items-center gap-1 text-xs opacity-80 mb-1">
                          <span>Period: {periodInfo}</span>
                        </div>
                      ) : null,
                    };
                    const enabledFields = infoOrder.filter((o: { key: string; label: string }) => infoShown[o.key]);
                    const getFirstEnabledField = () => {
                      if (!showFirstInfoBeside) return null;
                      const firstField = infoOrder.find((item: { key: string; label: string }) => infoShown[item.key]);
                      if (!firstField) return null;
                      return infoFields[firstField.key];
                    };
                    return (
                      <div
                        key={eventIndex}
                        className="rounded-lg p-3 text-white text-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                        style={{ backgroundColor: getEventColour(event.summary) }}
                        onMouseEnter={() => setHoveredEventIdx(eventIndex)}
                        onMouseLeave={() => setHoveredEventIdx(null)}
                      >
                        <div className="flex items-center justify-between" style={{ minHeight: 40, alignItems: 'center' }}>
                          <div className="flex items-center">
                          <span className="font-medium leading-tight" style={{ fontSize: '1.1rem' }}>
                            {normalizeSubjectName(event.summary, autoNamingEnabled)}
                          </span>
                            {getFirstEnabledField()}
                          </div>
                          <span style={{ opacity: 0.35, display: 'flex', alignItems: 'center' }} className="text-black">
                            {getSubjectIcon(event.summary, 24, effectiveMode)}
                          </span>
                        </div>
                        {/* Info fields, only show enabled by default, all on hover */}
                        {(hoveredEventIdx === eventIndex ? infoOrder : enabledFields).map((item: { key: string; label: string }) => infoFields[item.key]).filter(Boolean)}
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
                      style={{ backgroundColor: hexToRgba(subject.colour, 0.95) }}
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
              <p className={`text-gray-400 text-sm mb-4 ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>Original Name: <span className={`font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>{selectedSubjectForEdit.originalName || selectedSubjectForEdit.name}</span></p> {/* Changed original name */}
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
      />
    );
  };



  // Add state to track which event is hovered for expand/collapse
  const [hoveredEventIdx, setHoveredEventIdx] = useState<number | null>(null);

  // In renderHome, insert breaks for the day's events
  const renderHome = () => {
    const { dayLabel, events } = getTodayOrNextEvents(weekData);
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
            {events.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                <p>No events</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event, idx) => {
                  if (isBreakEvent(event)) {
                    return (
                      <div
                        key={`break-${idx}`}
                        className="rounded-lg p-3 flex items-center justify-between text-sm font-semibold opacity-80"
                        style={{ 
                          backgroundColor: effectiveMode === 'light' ? 'transparent' : 'transparent', 
                          color: effectiveMode === 'light' ? '#000' : '#fff',
                          border: '1px dashed #888',
                          borderWidth: 1,
                          minHeight: 40
                        }}
                      >
                        <div className="flex-1 text-left flex items-center" style={{justifyContent: 'flex-start'}}>
                          Break
                          <span className="text-xs ml-2 opacity-60">{formatTime(event.dtstart)} - {formatTime(event.dtend ?? event.dtstart)}</span>
                        </div>
                        <Utensils size={20} className={effectiveMode === 'light' ? 'text-black' : 'text-white'} />
                      </div>
                    );
                  }
                  // ... existing code for normal event ...
                  let teacherName = '';
                  let periodInfo = '';
                  if (event.description) {
                    const teacherMatch = event.description.match(/Teacher:\s*([^\n\r]+?)(?:\s*Period:|$)/i);
                    if (teacherMatch) {
                      teacherName = teacherMatch[1].trim();
                    }
                    const periodMatch = event.description.match(/Period:\s*([^\n\r]+?)(?:\s*$|\s*Teacher:|$)/i);
                    if (periodMatch) {
                      periodInfo = periodMatch[1].trim();
                    }
                  }
                  const infoFields: Record<string, React.ReactNode> = {
                    time: (
                      <div key="time" className="flex items-center gap-1 text-xs opacity-80 mb-1">
                        <Clock size={12} />
                        <span>{formatTime(event.dtstart)}{event.dtend && !isNaN(new Date(event.dtend).getTime()) ? ` - ${formatTime(event.dtend ?? event.dtstart)}` : ''}</span>
                      </div>
                    ),
                    location: event.location ? (
                      <div key="location" className="flex items-center gap-1 text-xs opacity-80 mb-1">
                        <MapPin size={12} />
                        <span>{event.location}</span>
                      </div>
                    ) : null,
                    teacher: teacherName ? (
                      <div key="teacher" className="flex items-center gap-1 text-xs opacity-80 mb-1">
                        <User size={12} />
                        <span>{teacherName}</span>
                      </div>
                    ) : null,
                    period: periodInfo ? (
                      <div key="period" className="flex items-center gap-1 text-xs opacity-80 mb-1">
                        <span>Period: {periodInfo}</span>
                      </div>
                    ) : null,
                  };
                  const enabledFields = infoOrder.filter((o: { key: string; label: string }) => infoShown[o.key]);
                  const getFirstEnabledField = () => {
                    if (!showFirstInfoBeside) return null;
                    const firstField = infoOrder.find((item: { key: string; label: string }) => infoShown[item.key]);
                    if (!firstField) return null;
                    return infoFields[firstField.key];
                  };
                  return (
                    <div
                      key={idx}
                      className="rounded-lg p-3 text-white text-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                      style={{ backgroundColor: getEventColour(event.summary) }}
                      onMouseEnter={() => setHoveredEventIdx(idx)}
                      onMouseLeave={() => setHoveredEventIdx(null)}
                    >
                      <div className="flex items-center justify-between" style={{ minHeight: 40, alignItems: 'center' }}>
                        <div className="flex items-center">
                        <span className="font-medium leading-tight" style={{ fontSize: '1.1rem' }}>
                          {normalizeSubjectName(event.summary, autoNamingEnabled)}
                        </span>
                          {getFirstEnabledField()}
                        </div>
                        <span style={{ opacity: 0.35, display: 'flex', alignItems: 'center' }} className="text-black">
                          {getSubjectIcon(event.summary, 24, effectiveMode)}
                        </span>
                      </div>
                      {/* Info fields, only show enabled by default, all on hover */}
                      {(hoveredEventIdx === idx ? infoOrder : enabledFields).map((item: { key: string; label: string }) => infoFields[item.key]).filter(Boolean)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* Right half intentionally left empty for now, or you can add a placeholder */}
        </div>
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
      <div className={`w-16 ${colors.container} ${colors.border} border-r flex flex-col items-center py-4 fixed top-0 left-0 h-full z-40`}>
        <div className="space-y-4 w-full flex-1"> {/* Added w-full here for centering */}
          {/* Sidebar buttons here */}
          <button
            onClick={() => navigate('/home')}
            className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${location.pathname === '/home' ? `${colors.button} text-white` : `text-white opacity-70 hover:opacity-100 hover:bg-gray-700`}`}
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
    </div>
  );
};

export default SchoolPlanner;
// To set the favicon and page title:
// 1. Edit public/index.html
// 2. Set <title>School Planner</title>
// 3. For favicon, export the Lucide 'School' icon as SVG and set as <link rel="icon" href="/school.svg"> in index.html.

