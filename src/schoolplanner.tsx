// NOTE: This file requires the following dependencies to be present in your package.json for deployment:
//   react, react-dom, lucide-react, @types/react, @types/react-dom
// Favicon and title are set in index.html, see instructions below.
import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { 
  Calendar, FileText, Home, BarChart3,
  Settings as SettingsIcon, LoaderCircle, Shield
} from 'lucide-react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ThemeKey, getColors } from './utils/themeUtils';
import { ThemeModal } from './components/ThemeModal';
import { normalizeSubjectName } from './utils/subjectUtils.ts';
import { getSubjectIcon } from './utils/subjectUtils.ts';
import { 
  CalendarEvent, 
  WeekData, 
  insertBreaksBetweenEvents, 
  getTodayOrNextEvents, 
  isBreakEvent 
} from './utils/calendarUtils.ts';
import WelcomeScreen from './components/WelcomeScreen';
import Settings from './components/Settings';
import EventCard from './components/EventCard';
import SubjectEditModal from './components/SubjectEditModal';

import { Subject } from './types';
import Sidebar from './components/Sidebar';
import SubjectCard from './components/SubjectCard';
import EventDetailsOverlay from './components/EventDetailsOverlay';
import { createOfflineIndicatorElement } from './utils/offlineIndicatorUtils';
import { processFile, exportData, defaultColours } from './utils/fileUtils.ts';
import { getQuoteOfTheDayUrl } from './utils/quoteUtils.ts';
import { registerServiceWorker, unregisterServiceWorker, clearAllCaches, isServiceWorkerSupported } from './utils/cacheUtils.ts';
import { showSuccess, showError, showInfo, removeNotification } from './utils/notificationUtils';
import NotFound from './components/NotFound';
import ExamPanel from './components/ExamPanel';
import { Exam } from './types';
import bcrypt from 'bcryptjs';

// Add password hashing function using bcrypt with fewer rounds for better performance
const hashPassword = (password: string): string => {
  const salt = bcrypt.genSaltSync(5); // Reduced from 10 to 5 rounds for better performance
  return bcrypt.hashSync(password, salt);
};

// Memoize password comparison to avoid repeated hashing
const memoizedComparePassword = (() => {
  let lastPassword = '';
  let lastHash = '';
  let lastResult = false;

  return (password: string, hash: string): boolean => {
    if (password === lastPassword && hash === lastHash) {
      return lastResult;
    }
    lastPassword = password;
    lastHash = hash;
    lastResult = bcrypt.compareSync(password, hash);
    return lastResult;
  };
})();

const SchoolPlanner = () => {
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  // Remove currentPage state, use router location instead
  const navigate = useNavigate();
  const location = useLocation();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  // NEW: State for exam side panel
  const [selectedSubjectForExam, setSelectedSubjectForExam] = useState<Subject | null>(null);

  // Exams by subject id
  const [examsBySubject, setExamsBySubject] = useState<Record<string, Exam[]>>(() => {
    const saved = localStorage.getItem('examsBySubject');
    return saved ? JSON.parse(saved) : {};
  });

  // NEW: Sort option for subjects in Markbook
  const [subjectSortOption, setSubjectSortOption] = useState<'alphabetical-asc' | 'alphabetical-desc' | 'marks-asc' | 'marks-desc'>('alphabetical-asc');
  
  // Persist examsBySubject
  useEffect(() => {
    localStorage.setItem('examsBySubject', JSON.stringify(examsBySubject));
  }, [examsBySubject]);

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubjectForExam(subject);
  };

  const addExam = () => {
    if (!selectedSubjectForExam) return;
    const newExam: Exam = {
      id: Date.now().toString(),
      name: '',
      mark: null,
      total: null,
      weighting: null,
    };
    setExamsBySubject((prev) => {
      const arr = prev[selectedSubjectForExam.id] ? [...prev[selectedSubjectForExam.id]] : [];
      return { ...prev, [selectedSubjectForExam.id]: [...arr, newExam] };
    });
  };

  const updateExam = (examId: string, field: keyof Exam, value: string) => {
    if (!selectedSubjectForExam) return;
    setExamsBySubject((prev) => {
      const list = prev[selectedSubjectForExam.id] || [];
      const updated = list.map((e) =>
        e.id === examId ? { ...e, [field]: field === 'name' ? value : value === '' ? null : parseFloat(value) } : e
      );
      return { ...prev, [selectedSubjectForExam.id]: updated };
    });
  };

  const removeExam = (examId: string) => {
    if (!selectedSubjectForExam) return;
    setExamsBySubject((prev) => {
      const list = (prev[selectedSubjectForExam.id] || []).filter((e) => e.id !== examId);
      return { ...prev, [selectedSubjectForExam.id]: list };
    });
  };

  // State for subject editing modal
  const [showSubjectEditModal, setShowSubjectEditModal] = useState(false);
  const [selectedSubjectForEdit, setSelectedSubjectForEdit] = useState<Subject | null>(null);
  const [editName, setEditName] = useState('');
  const [editColour, setEditColour] = useState(''); // Changed to 'editColour'

  // Welcome screen states
  const [welcomeStep, setWelcomeStep] = useState<'legal' | 'upload' | 'name_input' | 'completed'>('legal');
  const [userName, setUserName] = useState('');

  // New state for auto-naming toggle
  const [autoNamingEnabled, setAutoNamingEnabled] = useState(() => {
    const saved = localStorage.getItem('autoNamingEnabled');
    return saved === null ? true : saved === 'true';
  });

  // Add state for offline caching
  const [offlineCachingEnabled, setOfflineCachingEnabled] = useState(() => {
    const saved = localStorage.getItem('offlineCachingEnabled');
    return saved === null ? false : saved === 'true';
  });

  const handleOfflineCachingToggle = async (enabled: boolean) => {
    setOfflineCachingEnabled(enabled);
    if (enabled) {
      await registerServiceWorker();
    } else {
      await unregisterServiceWorker();
      await clearAllCaches();
    }
  };

  // Remove enhanced biweekly schedule and pattern logic

  // Remove old .ics and .school handlers, use one for both
  const fileInputRef = useRef<HTMLInputElement>(null);



  // Determine greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    if (hour < 20) return 'Good evening';
    return 'Good night';
  };



  // Deterministic color fallback for unknown subjects
  function getDeterministicColour(subjectName: string): string {
    // Simple hash function (djb2)
    let hash = 5381;
    for (let i = 0; i < subjectName.length; i++) {
      hash = ((hash << 5) + hash) + subjectName.charCodeAt(i);
    }
    const idx = Math.abs(hash) % defaultColours.length;
    return defaultColours[idx];
  }


  const getEventColour = (title: string): string => { // Changed to 'getEventColour'
    // Handle break events specially
    if (title === 'Break') {
      return effectiveMode === 'light' ? '#6b7280' : '#9ca3af'; // Gray color for breaks
    }
    const normalizedTitle = normalizeSubjectName(title, autoNamingEnabled);
    const subject = subjects.find((s: Subject) => normalizeSubjectName(s.name, autoNamingEnabled) === normalizedTitle);
    return subject ? subject.colour : getDeterministicColour(normalizedTitle); // Use deterministic fallback
  };









  // Centralized file handler for both .ics and .school
  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement> | File | null) => {
    let file: File | null = null;
    if ('target' in (e as any) && (e as React.ChangeEvent<HTMLInputElement>).target.files) {
      file = (e as React.ChangeEvent<HTMLInputElement>).target.files?.[0] || null;
    } else if (e instanceof File) {
      file = e;
    }
    if (!file) return;
    
    setLoading(true);
    setError('');
    
    // Show loading notification
    const loadingNotificationId = showInfo('Uploading File', `Processing ${file.name}...`, { effectiveMode, colors, duration: 0 });
    
    try {
      const result = await processFile(file, autoNamingEnabled);
      
      if (result.error) {
        setError(result.error);
        setWelcomeStep('upload');
        setLoading(false);
        removeNotification(loadingNotificationId);
        showError('Upload Failed', result.error, { effectiveMode, colors });
        return;
      }
      
      if (result.weekData) {
        setWeekData(result.weekData);
        localStorage.setItem('weekData', JSON.stringify({
          ...result.weekData,
          monday: result.weekData.monday.toISOString(),
          friday: result.weekData.friday.toISOString(),
          events: result.weekData.events.map((e: any) => ({ 
            ...e, 
            dtstart: e.dtstart.toISOString(), 
            dtend: e.dtend ? e.dtend.toISOString() : undefined 
          }))
        }));
      }
      
      if (result.subjects.length > 0) {
        setSubjects(result.subjects);
        localStorage.setItem('subjects', JSON.stringify(result.subjects));
      }
      
      // Update userName if it exists in the imported data
      if (result.userName && result.userName !== userName) {
        setUserName(result.userName);
        localStorage.setItem('userName', result.userName);
      }
      
      setWelcomeStep('name_input');
      setLoading(false);
      
      // Remove loading notification and show success notification
      removeNotification(loadingNotificationId);
      const fileType = file.name.endsWith('.ics') ? 'Calendar' : 'Data';
      showSuccess('Upload Successful', `${fileType} file uploaded successfully! Found ${result.subjects.length} subjects.`, { effectiveMode, colors });
    } catch (err) {
      setError('Failed to import file: ' + err);
      setLoading(false);
      removeNotification(loadingNotificationId);
      showError('Upload Failed', `Failed to import file: ${err}`, { effectiveMode, colors });
    }
  };

  // Drag and drop handler for both file types
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileInput(files[0]);
    } else {
      setError('Please drop a valid .ics or .school file.');
      showError('Invalid File', 'Please drop a valid .ics or .school file.', { effectiveMode, colors });
    }
  };

  // Clear all localStorage and reset state
  const clearData = async () => {
    localStorage.clear(); // Clear everything including theme
    setWeekData(null);
    setError('');
    setSubjects([]);
    setWelcomeStep('legal'); // Reset to welcome screen
    setUserName(''); // Clear user name
    setAutoNamingEnabled(true); // Reset auto-naming to default
    setOfflineCachingEnabled(false); // Reset offline caching to default
    
    // Clear service worker and cache
    const unregisterSuccess = await unregisterServiceWorker();
    const clearSuccess = await clearAllCaches();
    
    if (unregisterSuccess && clearSuccess) {
      showInfo('Data Cleared', 'All data has been cleared and cached files deleted successfully', { effectiveMode, colors });
    } else {
      showError('Data Cleared', 'Data cleared but some cached files may remain', { effectiveMode, colors });
    }
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
        showInfo('Subject Merged', `Subject "${selectedSubjectForEdit.name}" merged with "${editName}"`, { effectiveMode, colors });
      } else {
        // No conflict, just update the subject
        setSubjects((prevSubjects: Subject[]) =>
          prevSubjects.map((subject: Subject) =>
            subject.id === selectedSubjectForEdit.id
              ? { ...subject, name: editName, colour: editColour } // Changed to 'colour'
              : subject
          )
        );
        showSuccess('Subject Updated', `Subject "${selectedSubjectForEdit.name}" updated successfully`, { effectiveMode, colors });
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
      console.log('Debug: All events:', weekData.events);
      weekData.events.forEach((event: CalendarEvent) => {
        // Use the event's local date directly to determine the weekday
        const eventDate = new Date(event.dtstart);
        if (isNaN(eventDate.getTime())) {
          console.warn('Skipping event with invalid date in render:', event);
          return;
        }
        const dayOfWeek = eventDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        console.log(`Debug: Event local date ${eventDate.toLocaleString()}, dayOfWeek=${dayOfWeek}, summary=${event.summary}`);
        
        // Fix: Correctly map Sunday (0) to -1 and Saturday (6) to 5
        const dayIndex = dayOfWeek === 0 ? -1 : dayOfWeek - 1;
        
        // Only skip weekends, allow all weekdays (indexes 0-4)
        if (dayIndex >= 0 && dayIndex < 5) {
          dayEvents[dayIndex].push(event);
          console.log(`Debug: Added event to day ${dayIndex} (${['Mon','Tue','Wed','Thu','Fri'][dayIndex]})`, event);
        } else {
          console.log(`Debug: Skipped event with dayIndex ${dayIndex}, dayOfWeek=${dayOfWeek}`, event);
        }
      });

      // Log the final arrays for each day
      dayEvents.forEach((events, idx) => {
        console.log(`Debug: Day ${idx} (${['Mon','Tue','Wed','Thu','Fri'][idx]}) has ${events.length} events`);
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
    // Helper: calculate average mark percentage for a subject (null if no marks)
    const getAverageMark = (subject: Subject): number | null => {
      const exams = examsBySubject[subject.id] || [];
      const valid = exams.filter(e => e.mark !== null && e.total !== null && e.total !== 0);
      if (valid.length === 0) return null;
      const percentages = valid.map(e => ((e.mark as number) / (e.total as number)) * 100);
      return percentages.reduce((a, b) => a + b, 0) / percentages.length;
    };

    // Apply sorting based on selected option
    const sortedSubjects = [...subjects].sort((a, b) => {
      switch (subjectSortOption) {
        case 'alphabetical-asc':
          return normalizeSubjectName(a.name, autoNamingEnabled).localeCompare(normalizeSubjectName(b.name, autoNamingEnabled));
        case 'alphabetical-desc':
          return normalizeSubjectName(b.name, autoNamingEnabled).localeCompare(normalizeSubjectName(a.name, autoNamingEnabled));
        case 'marks-asc': {
          const avgA = getAverageMark(a);
          const avgB = getAverageMark(b);
          if (avgA === null && avgB === null) return 0;
          if (avgA === null) return 1;
          if (avgB === null) return -1;
          return avgA - avgB;
        }
        case 'marks-desc': {
          const avgA = getAverageMark(a);
          const avgB = getAverageMark(b);
          if (avgA === null && avgB === null) return 0;
          if (avgA === null) return 1;
          if (avgB === null) return -1;
          return avgB - avgA;
        }
        default:
          return 0;
      }
    });

    // If password protection is enabled and markbook is locked, show lock screen
    if (markbookPasswordEnabled && isMarkbookLocked) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <BarChart3 className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={24} />
            <h2 className={`text-2xl font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Markbook</h2>
          </div>
          <div className={`${colors.container} rounded-lg ${colors.border} border p-8 flex flex-col items-center justify-center`}>
            <Shield className={effectiveMode === 'light' ? 'text-blue-600' : 'text-blue-400'} size={48} />
            <h3 className={`text-xl font-semibold ${colors.text} mb-4`}>Password Protected</h3>
            <p className={`text-sm ${colors.containerText} opacity-80 mb-6 text-center`}>
              Enter your password to view your marks
            </p>
            <div className="w-full max-w-sm">
              <input
                type="password"
                value={unlockAttempt}
                onChange={(e) => setUnlockAttempt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const storedHash = localStorage.getItem('markbookPassword');
                    if (storedHash && memoizedComparePassword(unlockAttempt, storedHash)) {
                      setIsMarkbookLocked(false);
                      setUnlockAttempt('');
                    } else {
                      showError('Incorrect Password', 'Please try again', { effectiveMode, colors });
                    }
                  }
                }}
                className={`w-full px-4 py-3 rounded-lg border ${colors.border} focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-lg ${colors.container} ${colors.text}`}
                placeholder="Enter password"
                autoComplete="off"
              />
              <button
                onClick={() => {
                  const storedHash = localStorage.getItem('markbookPassword');
                  if (storedHash && memoizedComparePassword(unlockAttempt, storedHash)) {
                    setIsMarkbookLocked(false);
                    setUnlockAttempt('');
                  } else {
                    showError('Incorrect Password', 'Please try again', { effectiveMode, colors });
                  }
                }}
                className={`w-full ${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-4 py-3 rounded-lg font-medium transition-colors duration-200`}
              >
                Unlock
              </button>
            </div>
            {/* Footer */}
            <p className={`mt-6 text-xs opacity-70 ${colors.containerText}`}>Protected by bcrypt hashing</p>
          </div>
        </div>
      );
    }

    // Only render markbook content when unlocked or password protection is disabled
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={24} />
          <h2 className={`text-2xl font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Markbook</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Subjects list */}
          <div className="space-y-4">
            {/* Sort dropdown */}
            <div className="flex items-center justify-between">
              <label className={`text-sm font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Sort by:</label>
              <select
                value={subjectSortOption}
                onChange={(e) => setSubjectSortOption(e.target.value as any)}
                className={`border ${colors.border} rounded-md px-2 py-1 text-sm ${effectiveMode === 'light' ? 'bg-white text-black' : 'bg-gray-800 text-white'} focus:outline-none`}
              >
                <option value="marks-asc">Marks Ascending</option>
                <option value="marks-desc">Marks Descending</option>
                <option value="alphabetical-asc">Alphabetical Ascending</option>
                <option value="alphabetical-desc">Alphabetical Descending</option>
              </select>
            </div>

            <div className="space-y-4 overflow-y-auto pr-2 max-h-[70vh] h-full">
              {sortedSubjects.length === 0 ? (
                <div className="text-center py-16">
                  <BarChart3 size={64} className="mx-auto mb-4 text-gray-600" />
                  <p className={`text-gray-400 text-lg ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>No subjects found</p>
                  <p className={`text-gray-500 text-sm ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>Upload a calendar file to see your subjects</p>
                </div>
              ) : (
                sortedSubjects.map((subject: Subject) => (
                  <SubjectCard
                    key={subject.id}
                    subject={subject}
                    effectiveMode={effectiveMode}
                    colors={colors}
                    onEdit={startEditingSubject}
                    onSelect={handleSubjectSelect}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right: Exams panel */}
          <div className={`${colors.container} rounded-lg ${colors.border} border p-4`}>
            <ExamPanel
              subject={selectedSubjectForExam}
              exams={selectedSubjectForExam ? examsBySubject[selectedSubjectForExam.id] || [] : []}
              onAddExam={addExam}
              onUpdateExam={updateExam}
              onRemoveExam={removeExam}
              effectiveMode={effectiveMode}
              allSubjects={subjects}
              examsBySubject={examsBySubject}
              onBack={() => setSelectedSubjectForExam(null)}
            />
          </div>
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
        fileInputRef={fileInputRef}
        handleFileInput={handleFileInput}
        offlineCachingEnabled={offlineCachingEnabled}
        setOfflineCachingEnabled={handleOfflineCachingToggle}
        markbookPasswordEnabled={markbookPasswordEnabled}
        setMarkbookPasswordEnabled={handlePasswordProtectionToggle}
        markbookPassword={markbookPassword}
        setMarkbookPassword={setMarkbookPassword}
        showPasswordModal={showPasswordModal}
        setShowPasswordModal={setShowPasswordModal}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        isMarkbookLocked={isMarkbookLocked}
      />
    );
  };
          </div>
          {eventsWithBreaks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Calendar size={32} className="mx-auto mb-2 opacity-50" />
              <p>No events</p>
              el.innerHTML = '';
              const indicator = createOfflineIndicatorElement({
                effectiveMode,
                size: 'medium',
                offlineCachingEnabled,
                onToggleOfflineCaching: () => setOfflineCachingEnabled(!offlineCachingEnabled)
              });
              el.appendChild(indicator);
            }
          }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${colors.container} rounded-lg ${colors.border} border p-6 col-span-1`}>
            <div className="flex items-center gap-3 mb-4">
              <Calendar className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={20} />
              <h3 className={`text-lg font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>
                {dayLabel || 'No Schedule'}
              </h3>
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
          <div className="flex flex-col gap-6">
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
            {/* Quote of the Day Widget below CountdownBox */}
            <QuoteOfTheDayWidget 
              theme={theme} 
              themeType={themeType} 
              effectiveMode={effectiveMode} 
            />
          </div>
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
    
    // Get all events and insert breaks
    const eventsWithBreaks = insertBreaksBetweenEvents(weekData.events);
    
    // Calculate next occurrence for all events (including breaks)
    const nexts = eventsWithBreaks.map((e: CalendarEvent & { isBreak?: boolean }) => ({ 
      event: e, 
      date: getNextOccurrence(e, now) 
    }));
    
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
        console.log('Updated tabCountdown:', info);
      } else {
        setNextEvent(null);
        setNextEventDate(null);
        setTimeLeft(null);
        setCountdownSearching(false);
        setTabCountdown(null);
        console.log('Cleared tabCountdown - no upcoming events');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [weekData]);

  // Format time left as HH:MM:SS or MM:SS for tab and widget (hide hours if 0)
  function formatCountdownForTab(ms: number | null): string {
    if (ms === null) return '';
    if (ms <= 0) return 'Now!';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
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
      // Use the original event time, not the calculated next occurrence date
      return event.dtstart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return (
      <div className={`${colors.container} rounded-lg ${colors.border} border p-6 flex flex-col items-center justify-center h-fit`}>
        <div className="flex items-center gap-2 mb-2">
          <Calendar className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={20} />
          <span className={`text-lg font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Next Event Countdown</span>
        </div>
        {searching ? (
          <div className="flex flex-col items-center justify-center py-6">
            <LoaderCircle className={`animate-spin mb-2 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`} size={32} />
            <span className={`${effectiveMode === 'light' ? 'text-black' : 'text-gray-400'}`}>Searching...</span>
          </div>
        ) : nextEvent && nextEventDate ? (
          <>
            <div className={`text-4xl font-bold mb-2 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`} style={effectiveMode === 'light' ? {} : { textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>{formatCountdown(timeLeft)}</div>
            <div className="flex items-center gap-2 mb-1">
              <ColoredSubjectIcon summary={nextEvent.summary} />
              <span className="text-base font-medium" style={{ color: getEventColour(nextEvent.summary) }}>{normalizeSubjectName(nextEvent.summary, true)}</span>
            </div>
            <div className={`text-sm ${effectiveMode === 'light' ? 'text-black opacity-80' : 'text-white opacity-80'}`}>
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
          <div className={`text-lg ${effectiveMode === 'light' ? 'text-black' : 'text-gray-400'}`}>No upcoming events</div>
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
        handleFileInput={handleFileInput}
        fileInputRef={fileInputRef}
        effectiveMode={effectiveMode}
        navigate={navigate}
        colors={colors}
      />
    );
  };





  // Add a new state to track if the user selected a normal or extreme theme
  const [theme, setTheme] = useState<ThemeKey>(() => {
    // Try to load from localStorage, fallback to 'blue'
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved && ['red','orange','yellow','green','blue','purple','pink','grey'].includes(saved)) {
        return saved as ThemeKey;
      }
    }
    return 'blue';
  });
  const [themeType, setThemeType] = useState<'normal' | 'extreme'>(() => {
    // Try to load from localStorage, fallback to 'normal'
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('themeType');
      if (saved === 'normal' || saved === 'extreme') return saved;
    }
    return 'normal';
  });
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

  // Dynamically set the body background color to match the theme
  React.useEffect(() => {
    // Extract the background color from the colors.background (which may be a Tailwind class or hex)
    let bg = colors.background;
    // If it's a Tailwind class like 'bg-[#151a20]', extract the hex
    const hexMatch = bg.match(/#([0-9a-fA-F]{6,8})/);
    if (hexMatch) {
      bg = `#${hexMatch[1]}`;
    } else if (bg.startsWith('bg-') && bg.includes('-')) {
      // Try to map Tailwind color class to a CSS variable or fallback
      // You can extend this mapping as needed
      const tailwindToHex: Record<string, string> = {
        'bg-red-950': '#450a0a',
        'bg-orange-950': '#431407',
        'bg-yellow-950': '#422006',
        'bg-green-950': '#052e16',
        'bg-blue-950': '#172554',
        'bg-purple-950': '#2e1065',
        'bg-pink-950': '#500724',
        'bg-gray-950': '#0a0a0a',
        'bg-red-100': '#fee2e2',
        'bg-orange-100': '#ffedd5',
        'bg-yellow-100': '#fef9c3',
        'bg-green-100': '#dcfce7',
        'bg-blue-100': '#dbeafe',
        'bg-purple-100': '#ede9fe',
        'bg-pink-100': '#fce7f3',
        'bg-gray-100': '#f3f4f6',
        // Add more as needed
      };
      bg = tailwindToHex[bg] || '#181e29'; // fallback
    } else if (bg.startsWith('bg-[')) {
      // Already handled by hexMatch
    } else {
      // fallback
      bg = '#181e29';
    }
    document.body.style.backgroundColor = bg;
    document.documentElement.style.backgroundColor = bg;
  }, [colors.background]);

  // When setting theme, also set themeType
  function handleThemeChange(key: string, type: 'normal' | 'extreme') {
    setTheme(key as ThemeKey);
    setThemeType(type);
    setShowThemeModal(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', key);
      localStorage.setItem('themeType', type);
    }
    showInfo('Theme Updated', `Theme changed to ${key} (${type})`, { effectiveMode, colors });
  }

  // Persist theme, themeType, and themeMode to localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
      localStorage.setItem('themeType', themeType);
      localStorage.setItem('themeMode', themeMode);
    }
  }, [theme, themeType, themeMode]);





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

  // --- Persist autoNamingEnabled to localStorage on change ---
  React.useEffect(() => {
    localStorage.setItem('autoNamingEnabled', autoNamingEnabled.toString());
  }, [autoNamingEnabled]);

  // --- Load userName from localStorage on mount ---
  React.useEffect(() => {
    const savedName = localStorage.getItem('userName');
    if (savedName && !userName) {
      setUserName(savedName);
    }
  }, []);

  // --- On mount, if userName, weekData, and subjects exist in localStorage, skip welcome screen ---
  React.useEffect(() => {
    if (welcomeStep === 'completed') {
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

  // Register service worker on mount if offline caching is enabled
  React.useEffect(() => {
    if (offlineCachingEnabled && isServiceWorkerSupported()) {
      registerServiceWorker().then(success => {
        if (!success) {
          console.error('Failed to register service worker');
          setOfflineCachingEnabled(false);
        }
      });
    }
  }, [offlineCachingEnabled]);

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
    if (welcomeStep === 'completed') {
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
      
      // Show notification for the change
      const fieldName = infoOrder.find((item: { key: string; label: string }) => item.key === key)?.label || key;
      showInfo('Display Setting', `${fieldName} ${newShown[key] ? 'shown' : 'hidden'}`, { effectiveMode, colors });
      
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
    return saved === null ? true : saved === 'true'; // Default to true if not set
  });
  // Persist countdownInTitle
  useEffect(() => {
    localStorage.setItem('countdownInTitle', countdownInTitle ? 'true' : 'false');
  }, [countdownInTitle]);

  // Persist offlineCachingEnabled
  useEffect(() => {
    localStorage.setItem('offlineCachingEnabled', offlineCachingEnabled ? 'true' : 'false');
  }, [offlineCachingEnabled]);

  // Update document.title for countdown in tab title
  useEffect(() => {
    if (countdownInTitle && tabCountdown && tabCountdown.time && tabCountdown.event) {
      const newTitle = `${tabCountdown.time} until ${tabCountdown.event}`;
      document.title = newTitle;
      console.log('Updated document title:', newTitle);
    } else {
      document.title = 'School Planner';
      console.log('Reset document title to: School Planner');
    }
  }, [countdownInTitle, tabCountdown]);

  // Save tabCountdown to localStorage when it changes
  useEffect(() => {
    if (tabCountdown) {
      localStorage.setItem('tabCountdown', JSON.stringify(tabCountdown));
    } else {
      localStorage.removeItem('tabCountdown');
    }
  }, [tabCountdown]);

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
    const fileName = exportData(subjects, userName, exportModalState.options);
    setExportModalState(s => ({ ...s, show: false }));
    showSuccess('Export Successful', `Data exported to ${fileName}`, { effectiveMode, colors });
  };

  // Add state for markbook password protection
  const [markbookPasswordEnabled, setMarkbookPasswordEnabled] = useState(() => {
    const saved = localStorage.getItem('markbookPasswordEnabled');
    return saved === 'true';
  });
  // Store ONLY the plaintext password entered in the "Set Password" modal.  
  // Never initialise this state with the hashed value from localStorage – otherwise we would end up hashing the hash again on page load.
  const [markbookPassword, setMarkbookPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isMarkbookLocked, setIsMarkbookLocked] = useState(true);
  const [unlockAttempt, setUnlockAttempt] = useState('');

  // Add state for disabling password protection
  const [showDisablePasswordModal, setShowDisablePasswordModal] = useState(false);
  const [disablePasswordAttempt, setDisablePasswordAttempt] = useState('');

  // Handle password protection toggle with confirmation
  const handlePasswordProtectionToggle = (enabled: boolean) => {
    if (!enabled) {
      setShowDisablePasswordModal(true);
    } else {
      setMarkbookPasswordEnabled(true);
    }
  };

  // Anti-inspection measures - only when lock screen is active
  useEffect(() => {
    if (!markbookPasswordEnabled || !isMarkbookLocked || location.pathname !== '/markbook') {
      return;
    }

    // Detect keyboard shortcuts
    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      // Only prevent if we're on the lock screen
      if (markbookPasswordEnabled && isMarkbookLocked && location.pathname === '/markbook') {
        if (
          (e.ctrlKey && e.shiftKey && e.key === 'I') || // Ctrl+Shift+I
          (e.ctrlKey && e.shiftKey && e.key === 'J') || // Ctrl+Shift+J
          (e.ctrlKey && e.shiftKey && e.key === 'C') || // Ctrl+Shift+C
          (e.ctrlKey && e.key === 'U') || // Ctrl+U
          e.key === 'F12' // F12
        ) {
          e.preventDefault();
          navigate('/home');
          showError('Security Alert', 'DevTools shortcut detected while locked. Access denied.', { effectiveMode, colors });
        }
      }
    };

    // Add event listeners
    document.addEventListener('keydown', preventKeyboardShortcuts);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', preventKeyboardShortcuts);
    };
  }, [location.pathname, markbookPasswordEnabled, isMarkbookLocked]);

  // Persist password settings (using hashed password)
  useEffect(() => {
    localStorage.setItem('markbookPasswordEnabled', markbookPasswordEnabled.toString());
  }, [markbookPasswordEnabled]);

  // Persist a NEW password when the user sets one.  
  // If the string is empty we leave the stored hash untouched so that a page refresh doesn't inadvertently remove or double-hash it.
  useEffect(() => {
    if (markbookPassword) {
      localStorage.setItem('markbookPassword', hashPassword(markbookPassword));
      // Clear plaintext from memory immediately after hashing for a tiny bit of extra safety.
      setMarkbookPassword('');
    }
  }, [markbookPassword]);

  // Lock markbook when navigating away
  useEffect(() => {
    if (location.pathname !== '/markbook') {
      setIsMarkbookLocked(true);
      setUnlockAttempt('');
    }
  }, [location.pathname]);

  // Main content routes
  // Only show welcome screen if not completed
  let mainContent = null;
  if (welcomeStep !== 'completed') {
    mainContent = (
      <Routes>
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route path="/welcome" element={renderWelcomeScreen()} />
        <Route path="*" element={<NotFound />} />
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
        <Route path="*" element={<NotFound />} />
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
                  {userName ? `${getGreeting()}, ${userName}!` : `${getGreeting()}!`}
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
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${effectiveMode === 'light' ? 'border-black' : colors.spin} mx-auto mb-4`}></div>
                <p className={`${effectiveMode === 'light' ? 'text-black' : 'text-gray-400'}`}>Processing your calendar...</p>
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
      {/* Exam side panel moved inside markbook grid */}

      {/* Disable Password Modal */}
      {showDisablePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className={`${colors.container} rounded-lg p-6 shadow-xl border border-gray-700 w-full max-w-md`}>
            <h3 className={`text-xl font-semibold ${colors.text} mb-4`}>Confirm Password</h3>
            <p className={`text-sm ${colors.containerText} opacity-80 mb-6`}>
              Enter your current password to disable password protection
            </p>
            <input
              type="password"
              value={disablePasswordAttempt}
              onChange={(e) => setDisablePasswordAttempt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const storedHash = localStorage.getItem('markbookPassword');
                  if (storedHash && memoizedComparePassword(disablePasswordAttempt, storedHash)) {
                    setMarkbookPasswordEnabled(false);
                    setMarkbookPassword('');
                    setShowDisablePasswordModal(false);
                    setDisablePasswordAttempt('');
                    showSuccess('Password Protection Disabled', 'Password protection has been turned off', { effectiveMode, colors });
                  } else {
                    showError('Incorrect Password', 'Please try again', { effectiveMode, colors });
                  }
                }
              }}
              className={`w-full px-4 py-3 rounded-lg border ${colors.border} focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6 text-lg ${colors.container} ${colors.text}`}
              placeholder="Enter current password"
              autoComplete="off"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDisablePasswordModal(false);
                  setDisablePasswordAttempt('');
                  setMarkbookPasswordEnabled(true); // Keep enabled since cancelled
                }}
                className="bg-secondary hover:bg-secondary-dark text-secondary-foreground px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const storedHash = localStorage.getItem('markbookPassword');
                  if (storedHash && memoizedComparePassword(disablePasswordAttempt, storedHash)) {
                    setMarkbookPasswordEnabled(false);
                    setMarkbookPassword('');
                    setShowDisablePasswordModal(false);
                    setDisablePasswordAttempt('');
                    showSuccess('Password Protection Disabled', 'Password protection has been turned off', { effectiveMode, colors });
                  } else {
                    showError('Incorrect Password', 'Please try again', { effectiveMode, colors });
                  }
                }}
                className={`${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200`}
              >
                Disable Protection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Quote of the Day Widget
const QuoteOfTheDayWidget: React.FC<{
  theme: ThemeKey;
  themeType: 'normal' | 'extreme';
  effectiveMode: 'light' | 'dark';
}> = ({ theme, themeType, effectiveMode }) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const url = getQuoteOfTheDayUrl(theme, themeType, effectiveMode);
  const colors = getColors(theme, themeType, effectiveMode);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const mountTimeRef = React.useRef(Date.now());
  const MIN_SPIN_MS = 800; // Increased minimum spinner time for better visibility

  // Helper to stop spinner but keep minimum duration
  const stopSpinner = () => {
    const elapsed = Date.now() - mountTimeRef.current;
    const remaining = MIN_SPIN_MS - elapsed;
    if (remaining > 0) {
      setTimeout(() => setLoading(false), remaining);
    } else {
      setLoading(false);
    }
  };

  // Effect to handle iframe loading state
  React.useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Reset loading state when url changes
    setLoading(true);
    mountTimeRef.current = Date.now();

    const handleLoad = () => {
      stopSpinner();
    };

    const handleError = () => {
      setError(true);
      stopSpinner();
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
    };
  }, [url]); // Re-run when url changes

  return (
    <div className={`${colors.container} rounded-lg ${colors.border} border p-4 mb-4 flex flex-col items-center`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="font-semibold text-lg" style={{ color: colors.text }}>Quote of the Day</div>
      </div>
      <div className="relative w-full h-[120px] flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 flex justify-center items-center">
            <LoaderCircle className={`animate-spin ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`} size={32} />
          </div>
        )}
        {error && (
          <div className="text-center" style={{ color: colors.text }}>
            Could not load quote.
          </div>
        )}
        <iframe
          ref={iframeRef}
          title="Quote of the Day"
          src={url}
          width="100%"
          height="120"
          style={{
            border: 'none',
            borderRadius: '8px',
            opacity: loading || error ? 0 : 1,
            transition: 'opacity 0.5s',
          }}
        ></iframe>
      </div>
    </div>
  );
};

export default SchoolPlanner;
// To set the favicon and page title:
// 1. Edit public/index.html
// 2. Set <title>School Planner</title>
// 3. For favicon, export the Lucide 'School' icon as SVG and set as <link rel="icon" href="/school.svg"> in index.html.

