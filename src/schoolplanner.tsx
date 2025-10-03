
import * as React from 'react';
import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import {
  Calendar,
  Settings as SettingsIcon, ChevronsUpDown,
  Maximize, X, Home
} from 'lucide-react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ThemeKey, getColors } from './utils/themeUtils';
import { normalizeSubjectName, getSubjectIcon } from './utils/subjectUtils.ts';
import { CalendarEvent, WeekData, insertBreaksBetweenEvents, isBreakEvent } from './utils/calendarUtils.ts';
import TodayScheduleTimeline from './components/TodayScheduleTimeline';
import { ThemeModal } from './components/ThemeModal';
import WelcomeScreen from './components/WelcomeScreen';
import Settings from './components/Settings';
import EventCard from './components/EventCard';

import { Subject } from './types';
import Sidebar from './components/Sidebar';
import EventDetailsOverlay from './components/EventDetailsOverlay';
import { createOfflineIndicatorElement } from './utils/offlineIndicatorUtils';
import { processFile, exportData, defaultColours } from './utils/fileUtils.ts';
import { registerServiceWorker, unregisterServiceWorker, clearAllCaches, isServiceWorkerSupported } from './utils/cacheUtils.ts';
import { showSuccess, showError, showInfo, removeNotification } from './utils/notificationUtils';
import NotFound from './components/NotFound';
import { Exam } from './types';
import { hashPassword, memoizedComparePassword } from './utils/passwordUtils';
import LinksWidget from './components/LinksWidget';
import QuoteOfTheDayWidget from './components/QuoteOfTheDayWidget';
import WordOfTheDayWidget from './components/WordOfTheDayWidget';
import CountdownBox from './components/CountdownBox';
import FullscreenCountdown from './components/FullscreenCountdown';
import { getGreeting, getDeterministicColour, formatCountdownForTab } from './utils/helperUtils';
import { getCachedNswTerms, fetchNswTerms, cacheNswTerms, getNswWeekLabelForDate, getCustomWeekLabelForDate } from './utils/nswTermUtils';
import { findNextRepeatingEvent, findEventsByDayToggle } from './utils/eventHelpers';
import WeekViewPage from './components/WeekViewPage';
import MarkbookPage from './components/MarkbookPage';

const SchoolPlanner = () => {
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  // Remove currentPage state, use router location instead
  const navigate = useNavigate();
  const location = useLocation();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  // Re-render bridge for settings that affect week label
  const [weekSettingsVersion, setWeekSettingsVersion] = useState(0);

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

  // Listen for widget visibility changes
  useEffect(() => {
    const handleStorageChange = () => {
      // Trigger re-render when widget visibility changes
    };
    window.addEventListener('storage', handleStorageChange);
    const onWeekSettingsChanged = () => setWeekSettingsVersion(v => v + 1);
    window.addEventListener('weekSettingsChanged', onWeekSettingsChanged as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('weekSettingsChanged', onWeekSettingsChanged as EventListener);
    };
  }, []);

  // Auto-fetch NSW term data if week numbering is enabled and the cache is missing
  useEffect(() => {
    const enabled = localStorage.getItem('weekNumberingEnabled') === 'true';
    const source = (localStorage.getItem('weekSource') as 'nsw' | 'custom') || 'nsw';
    if (!enabled || source !== 'nsw') return;
    const now = new Date();
    const year = now.getFullYear();
    const cached = getCachedNswTerms(year);
    const cachedNext = getCachedNswTerms(year + 1);
    (async () => {
      try {
        if (!cached) {
          const data = await fetchNswTerms(year);
          if (data) {
            cacheNswTerms(data);
            setWeekSettingsVersion(v => v + 1);
          }
        }
        if (!cachedNext) {
          const dataNext = await fetchNswTerms(year + 1);
          if (dataNext) {
            cacheNswTerms(dataNext);
            setWeekSettingsVersion(v => v + 1);
          }
        }
      } catch {}
    })();
  }, [weekSettingsVersion]);

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
  const [editIcon, setEditIcon] = useState('');

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
    return saved === null ? true : saved === 'true';
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

  // Ensure initial preference is applied and persisted
  useEffect(() => {
    localStorage.setItem('offlineCachingEnabled', String(offlineCachingEnabled));
    if (offlineCachingEnabled) {
      registerServiceWorker();
    }
  }, [offlineCachingEnabled]);

  // Known icon names we support in renderIcon
  const knownIcons = React.useMemo(() => new Set<string>([
    'BookOpen','Clock','FileText','User','Printer','Calendar','Folder','CreditCard','Newspaper',
    'Globe','Link','Home','School','Laptop','Smartphone','ExternalLink'
  ]), []);

  const isIconKnown = (name?: string) => (name ? knownIcons.has(name) : false);

  // Remove enhanced biweekly schedule and pattern logic

  // Remove old .ics and .school handlers, use one for both
  const fileInputRef = useRef<HTMLInputElement>(null);








  const getEventColour = (title: string): string => { // Changed to 'getEventColour'
    // Handle break events specially
    if (title === 'Break' || title === 'End of Day') {
      return effectiveMode === 'light' ? '#6b7280' : '#9ca3af'; // Gray color for breaks
    }
    const normalizedTitle = normalizeSubjectName(title, autoNamingEnabled);
    const subject = subjects.find((s: Subject) => normalizeSubjectName(s.name, autoNamingEnabled) === normalizedTitle);
    return subject ? subject.colour : getDeterministicColour(normalizedTitle, defaultColours); // Use deterministic fallback
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
    setEditColour(subject.colour);
    setEditIcon(subject.icon || ''); // Leave empty if no custom icon set
    setShowSubjectEditModal(true);
  };

  const saveSubjectEdit = () => {
    if (selectedSubjectForEdit) {
      // Check if the new name conflicts with an existing subject (to merge)
      const existingSubjectWithNewName = subjects.find(
        (s: Subject) => normalizeSubjectName(s.name, autoNamingEnabled) === normalizeSubjectName(editName, autoNamingEnabled) && s.id !== selectedSubjectForEdit.id
      );

      // Helper: update all event summaries in weekData.events
      const updateEventSummaries = (oldName: string, newName: string) => {
        if (!weekData || !weekData.events) return;
        const oldNorm = normalizeSubjectName(oldName, autoNamingEnabled);
        const updatedEvents = weekData.events.map((event: CalendarEvent) => {
          if (normalizeSubjectName(event.summary, autoNamingEnabled) === oldNorm) {
            // Replace summary with new normalized name
            return { ...event, summary: newName };
          }
          return event;
        });
        setWeekData({ ...weekData, events: updatedEvents });
      };

      if (existingSubjectWithNewName) {
        // Merge: update all events from old subject to merged subject name
        updateEventSummaries(selectedSubjectForEdit.name, existingSubjectWithNewName.name);
        setSubjects((prevSubjects: Subject[]) =>
          prevSubjects.filter((s: Subject) => s.id !== selectedSubjectForEdit.id)
        );
        showInfo('Subject Merged', `Subject "${selectedSubjectForEdit.name}" merged with "${editName}"`, { effectiveMode, colors });
      } else {
        // No conflict, update subject and all events
        updateEventSummaries(selectedSubjectForEdit.name, editName);
        setSubjects((prevSubjects: Subject[]) =>
          prevSubjects.map((subject: Subject) =>
            subject.id === selectedSubjectForEdit.id
              ? { ...subject, name: editName, colour: editColour, icon: isIconKnown(editIcon) ? editIcon : undefined }
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
    setEditIcon('');
  };

  const cancelSubjectEdit = () => {
    setShowSubjectEditModal(false);
    setSelectedSubjectForEdit(null);
    setEditName('');
    setEditColour('');
    setEditIcon('');
  };



  const renderWeekView = () => (
    <WeekViewPage
      weekData={weekData}
      getEventColour={getEventColour}
      autoNamingEnabled={autoNamingEnabled}
      effectiveMode={effectiveMode}
      colors={colors}
      infoOrder={infoOrder}
      infoShown={infoShown}
      setSelectedEvent={setSelectedEvent}
      subjects={subjects}
    />
  );



  const renderMarkbook = () => (
    <MarkbookPage
      subjects={subjects}
      autoNamingEnabled={autoNamingEnabled}
      effectiveMode={effectiveMode}
      colors={colors}
      subjectSortOption={subjectSortOption}
      setSubjectSortOption={setSubjectSortOption}
      selectedSubjectForExam={selectedSubjectForExam}
      examsBySubject={examsBySubject}
      handleSubjectSelect={handleSubjectSelect}
      addExam={addExam}
      updateExam={updateExam}
      removeExam={removeExam}
      startEditingSubject={startEditingSubject}
      showSubjectEditModal={showSubjectEditModal}
      selectedSubjectForEdit={selectedSubjectForEdit}
      editName={editName}
      setEditName={setEditName}
      editColour={editColour}
      setEditColour={setEditColour}
      editIcon={editIcon}
      setEditIcon={setEditIcon}
      saveSubjectEdit={saveSubjectEdit}
      cancelSubjectEdit={cancelSubjectEdit}
      markbookPasswordEnabled={markbookPasswordEnabled}
      isMarkbookLocked={isMarkbookLocked}
      unlockAttempt={unlockAttempt}
      setUnlockAttempt={setUnlockAttempt}
      setIsMarkbookLocked={setIsMarkbookLocked}
    />
  );

  const renderSettings = () => (
    <div className="pt-3">
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
        showCountdownInTimeline={showCountdownInTimeline}
        setShowCountdownInTimeline={setShowCountdownInTimeline}
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
        showCountdownInSidebar={showCountdownInSidebar}
        setShowCountdownInSidebar={setShowCountdownInSidebar}
        use24HourFormat={use24HourFormat}
        setUse24HourFormat={setUse24HourFormat}
      />
    </div>
  );

  // Add state to track which event is hovered for expand/collapse

  // In renderHome, insert breaks for the day's events
  const renderHome = () => {
    const { dayLabel, selectedScheduleDate, eventsWithBreaks, autoSwitchedToNextDay } = dayEventsData;

    // Compute week badge (Week N / Holiday) based on settings (no hooks here)
    const getWeekBadgeText = () => {
      const enabled = localStorage.getItem('weekNumberingEnabled') === 'true';
      if (!enabled) return '';
      const source = (localStorage.getItem('weekSource') as 'nsw' | 'custom') || 'nsw';
      const now = new Date(nowTs);
      if (source === 'nsw') {
        const year = now.getFullYear();
        const div = (localStorage.getItem('weekNswDivision') as 'eastern' | 'western') || 'eastern';
        const terms = getCachedNswTerms(year);
        if (!terms) return '';
        return getNswWeekLabelForDate(now, div, terms).text;
      } else {
        const currentWeek = parseInt(localStorage.getItem('weekCustomCurrentWeek') || '1', 10);
        const refISO = localStorage.getItem('weekCustomReferenceDate') || new Date().toISOString();
        return getCustomWeekLabelForDate(now, isNaN(currentWeek) ? 1 : currentWeek, refISO).text;
      }
    };
    const weekBadgeText = getWeekBadgeText();
    const isHolidayBadge = /holiday/i.test(weekBadgeText);

    // Prep "Days till school" based on NSW term start, not schedule-only next event
    let daysTillSchool: { ms: number; event: string; location: string; when: string; color?: string; target: Date } | null = null;
    if (isHolidayBadge) {
      const source = (localStorage.getItem('weekSource') as 'nsw' | 'custom') || 'nsw';
      const now = new Date(nowTs);
      if (source === 'nsw') {
        const div = (localStorage.getItem('weekNswDivision') as 'eastern' | 'western') || 'eastern';
        const year = now.getFullYear();
        const termsNow = getCachedNswTerms(year);
        const termsNext = getCachedNswTerms(year + 1);
        const termStarts: Date[] = [];
        if (termsNow) {
          termsNow[div].forEach(t => termStarts.push(new Date(t.start)));
        }
        if (termsNext) {
          termsNext[div].forEach(t => termStarts.push(new Date(t.start)));
        }
        const nextStart = termStarts
          .filter(d => d.getTime() > now.getTime())
          .sort((a, b) => a.getTime() - b.getTime())[0];
        if (nextStart) {
          // Find earliest event on that weekday from the timetable
          const dow = nextStart.getDay();
          const todaysEvents = (weekData?.events || [])
            .filter(e => e.dtstart.getDay() === dow)
            .sort((a, b) => {
              const at = a.dtstart.getHours() * 60 + a.dtstart.getMinutes();
              const bt = b.dtstart.getHours() * 60 + b.dtstart.getMinutes();
              return at - bt;
            });
          const first = todaysEvents[0];
          // Use earliest class on that weekday or fallback time from settings (default 09:00)
          const fb = (localStorage.getItem('holidayFallbackTime') || '09:00').match(/^(\d{1,2}):(\d{2})$/);
          const fbH = fb ? Math.min(23, Math.max(0, parseInt(fb[1], 10))) : 9;
          const fbM = fb ? Math.min(59, Math.max(0, parseInt(fb[2], 10))) : 0;
          const target = new Date(nextStart.getFullYear(), nextStart.getMonth(), nextStart.getDate(),
            first ? first.dtstart.getHours() : fbH,
            first ? first.dtstart.getMinutes() : fbM,
            0, 0);
          const diff = Math.max(0, target.getTime() - now.getTime());
          const summary = first ? normalizeSubjectName(first.summary, autoNamingEnabled) : 'school resumes';
          const rawLoc = first?.location || '';
          const cleanedLoc = rawLoc.replace(/^Room:\s*/i, '').trim();
          const when = nextStart.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
          const color = first ? getEventColour(first.summary) : undefined;
          daysTillSchool = {
            ms: diff,
            event: summary,
            location: cleanedLoc,
            when,
            color,
            target
          };
        }
      } else if (nextEventDate && typeof timeLeft === 'number' && nextEvent) {
        // Fallback for Custom source: use next scheduled event
        const total = Math.max(0, timeLeft);
        const summary = normalizeSubjectName(nextEvent.summary, autoNamingEnabled);
        const rawLoc = nextEvent.location || '';
        const cleanedLoc = rawLoc.replace(/^Room:\s*/i, '').trim();
        const when = nextEventDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
        daysTillSchool = {
          ms: total,
          event: summary,
          location: cleanedLoc,
          when,
          color: getEventColour(nextEvent.summary),
          target: nextEventDate
        };
      }
    }

    // Prepare the list of events to show in the compact timeline view so the gradient matches
    const timelineEvents = (() => {
      // Default to all events
      let list = eventsWithBreaks;

      // If forcing to show actual today (after events ended), show ALL events
      if (forceShowActualToday) {
        return eventsWithBreaks;
      }

      // In compact mode (countdown enabled and not expanded), show ALL UPCOMING events (including breaks)
      if (showCountdownInTimeline && !timelineExpanded) {
        const now = new Date(nowTs);
        // Use selectedScheduleDate if available (handles showing next day after events end)
        const baseDate = selectedScheduleDate 
          ? new Date(selectedScheduleDate)
          : new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Find the first event whose end time hasn't passed yet (current or next),
        // then show that event and everything after it for the rest of the day.
        let startIdx = -1;
        for (let i = 0; i < eventsWithBreaks.length; i++) {
          const e = eventsWithBreaks[i];
          if (!e.dtstart || !e.dtend) continue; // require both for precise slicing
          const es = new Date(e.dtstart);
          const ee = new Date(e.dtend);
          const ts = new Date(baseDate);
          ts.setHours(es.getHours(), es.getMinutes(), es.getSeconds());
          const te = new Date(baseDate);
          te.setHours(ee.getHours(), ee.getMinutes(), ee.getSeconds());
          if (nowTs <= te.getTime()) {
            startIdx = i;
            break;
          }
        }
        list = startIdx === -1 ? [] : eventsWithBreaks.slice(startIdx);
      } else if (showCountdownInTimeline && timelineExpanded) {
        // Expanded: show ALL events for the day (past + upcoming)
        list = eventsWithBreaks;
      }

      return list;
    })();

    // Subject icon helper mirroring CountdownBox styling
    const ColoredSubjectIcon = ({ summary, color }: { summary: string; color: string }) => {
      const normalizedName = normalizeSubjectName(summary, autoNamingEnabled);
      const subject = subjects.find(s => normalizeSubjectName(s.name, autoNamingEnabled) === normalizedName);
      const icon = getSubjectIcon(subject || summary, 24, effectiveMode);
      return React.cloneElement(icon, { style: { color } });
    };

    // Determine whether the displayed schedule is today
    const nowLocal = new Date(nowTs);
    const todayLocal = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate());
    const isViewingToday = !selectedScheduleDate || (
      new Date(
        selectedScheduleDate.getFullYear(),
        selectedScheduleDate.getMonth(),
        selectedScheduleDate.getDate()
      ).getTime() === todayLocal.getTime()
    );
    const shouldShowTimelineCountdown = showCountdownInTimeline && isViewingToday && !autoSwitchedToNextDay && !showNextDay;

    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          {/* Offline indicator in top right */}
          <div ref={(el) => {
            if (el) {
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
        {/* Greeting + Week badge */
        }
        <div className="mt-0 mb-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className={`font-bold leading-snug tracking-tight ${effectiveMode === 'light' ? 'text-black' : 'text-white'} text-2xl sm:text-3xl md:text-4xl whitespace-nowrap overflow-hidden text-ellipsis`}>
              {`${getGreeting(userName)}.`}
            </h1>
            {weekBadgeText && (
              <div className="relative group">
                <span className={`inline-flex items-center px-4 py-1.5 rounded-xl border ${colors.border} ${colors.container} ${colors.containerText} text-base sm:text-lg font-semibold whitespace-nowrap cursor-pointer transition-all`}>{weekBadgeText}</span>
                <div className={`absolute right-0 top-full mt-2 p-4 rounded-xl border ${colors.border} ${colors.container} shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[200px]`}>
                  {(() => {
                    const source = (localStorage.getItem('weekSource') as 'nsw' | 'custom') || 'nsw';
                    const now = new Date(nowTs);
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    let percentage = 0;
                    let label = '';
                    let daysRemaining = 0;
                    
                    if (source === 'nsw' && !isHolidayBadge) {
                      const div = (localStorage.getItem('weekNswDivision') as 'eastern' | 'western') || 'eastern';
                      const year = now.getFullYear();
                      const terms = getCachedNswTerms(year);
                      if (terms) {
                        const term = terms[div].find(t => {
                          const start = new Date(t.start);
                          const end = new Date(t.end);
                          return now.getTime() >= start.getTime() && now.getTime() <= end.getTime();
                        });
                        if (term) {
                          const start = new Date(term.start).getTime();
                          const end = new Date(term.end).getTime();
                          const current = now.getTime();
                          percentage = Math.round(((current - start) / (end - start)) * 100);
                          label = `Term ${term.term} Progress`;
                          const endDate = new Date(term.end);
                          const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                          const rawDays = Math.ceil((endDay.getTime() - today.getTime()) / 86400000);
                          daysRemaining = Math.max(1, rawDays);
                        }
                      }
                    } else if (isHolidayBadge && source === 'nsw') {
                      const div = (localStorage.getItem('weekNswDivision') as 'eastern' | 'western') || 'eastern';
                      const year = now.getFullYear();
                      const termsNow = getCachedNswTerms(year);
                      const termsNext = getCachedNswTerms(year + 1);
                      if (termsNow) {
                        const allTerms = [...termsNow[div], ...(termsNext ? termsNext[div] : [])];
                        const sortedTerms = allTerms.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
                        let prevEnd: Date | null = null;
                        let nextStart: Date | null = null;
                        for (let i = 0; i < sortedTerms.length - 1; i++) {
                          const termEnd = new Date(sortedTerms[i].end);
                          const nextTermStart = new Date(sortedTerms[i + 1].start);
                          if (now.getTime() > termEnd.getTime() && now.getTime() < nextTermStart.getTime()) {
                            prevEnd = termEnd;
                            nextStart = nextTermStart;
                            break;
                          }
                        }
                        if (prevEnd && nextStart) {
                          const start = prevEnd.getTime();
                          const end = nextStart.getTime();
                          const current = now.getTime();
                          percentage = Math.round(((current - start) / (end - start)) * 100);
                          label = 'Holiday Progress';
                          const nextStartDay = new Date(nextStart.getFullYear(), nextStart.getMonth(), nextStart.getDate());
                          const rawDays = Math.ceil((nextStartDay.getTime() - today.getTime()) / 86400000);
                          daysRemaining = Math.max(1, rawDays);
                        }
                      }
                    }
                    
                    const radius = 40;
                    const circumference = 2 * Math.PI * radius;
                    const offset = circumference - (percentage / 100) * circumference;
                    const bgCircleColor = effectiveMode === 'light' ? '#e5e7eb' : '#4b5563';
                    
                    return (
                      <div className="flex flex-col items-center gap-3">
                        <div className={`relative ${colors.accentText}`} style={{ width: 100, height: 100 }}>
                          <svg width="100" height="100" className="transform -rotate-90">
                            <circle cx="50" cy="50" r={radius} stroke={bgCircleColor} strokeWidth="8" fill="none" />
                            <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.3s ease' }} />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-xl font-bold ${colors.containerText}`}>{percentage}%</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-sm ${colors.containerText} opacity-80 text-center`}>{label}</span>
                          <span className={`text-lg font-bold ${colors.containerText} opacity-90 text-center`}>{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Days till school widget moved into right column (half width) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className={`${colors.container} rounded-lg ${colors.border} border p-6 col-span-1`}>
            <div className="flex items-center mb-4">
              <div className="flex items-center gap-2">
                <Calendar className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={20} />
                <h3 className={`text-lg font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>
                  {dayLabel || 'No Schedule'}
                </h3>
                <button
                  onClick={handleDayToggle}
                  className={`p-2 rounded hover:bg-opacity-20 transition-colors ${effectiveMode === 'light' ? 'hover:bg-gray-300' : 'hover:bg-gray-600'
                    }`}
                  title={showNextDay || autoSwitchedToNextDay ? 'Show today\'s schedule' : 'Show next day\'s schedule'}
                >
                  <ChevronsUpDown
                    size={18}
                    className={`${effectiveMode === 'light' ? 'text-gray-600' : 'text-gray-400'} hover:${effectiveMode === 'light' ? 'text-black' : 'text-white'} transition-colors`}
                  />
                </button>
              </div>
            </div>
            {/* Notice box when holiday inside the schedule panel */}
            {isHolidayBadge && (
              <div className={`${colors.container} ${colors.border} border rounded-2xl p-4 mb-4`}>
                <div className="flex items-center gap-3">
                  <Home className={`${colors.accentText}`} size={18} />
                  <div>
                    <p className={`font-medium ${colors.containerText}`}>You don't have school right now</p>
                    <p className={`text-sm ${colors.containerText} opacity-80`}>Here's what you have on your first day back</p>
                  </div>
                </div>
              </div>
            )}
            {timelineEvents.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                <p>No events</p>
              </div>
            ) : null}
            
            {timelineEvents.length > 0 && (
              <div
                ref={listRef}
                className="relative space-y-3 pl-10"
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <TodayScheduleTimeline
                  eventsWithBreaks={timelineEvents}
                  measuredHeights={measuredHeights}
                  segments={segments}
                  gapBetweenCards={12} // Default gap, can be measured if needed
                  containerHeight={containerHeight}
                  nowTs={nowTs}
                  selectedScheduleDate={selectedScheduleDate}
                  getEventColour={getEventColour}
                  showCountdownInTimeline={shouldShowTimelineCountdown}
                  onCountdownUpdate={setTimelineCountdownInfo}
                />



                {/* Countdown before first event when viewing future day */}
                {(() => {
                  // Check if we're viewing a future day (auto-switched or weekend showing Monday)
                  const now = new Date(nowTs);
                  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  const isViewingFutureDay = selectedScheduleDate && (
                    new Date(
                      selectedScheduleDate.getFullYear(),
                      selectedScheduleDate.getMonth(),
                      selectedScheduleDate.getDate()
                    ).getTime() > today.getTime()
                  );
                  
                  // Only show countdown if: viewing future day, countdown is enabled, and there are events
                  if (isViewingFutureDay && showCountdownInTimeline && timelineEvents.length > 0 && nextEvent && nextEventDate) {
                    const displayColor = getEventColour(nextEvent.summary);
                    const cleanedLoc = (nextEvent.location || '').replace(/^Room:\s*/i, '').trim();
                    
                    return (
                      <div className="mb-4 relative z-10 w-full">
                        <div className={`mb-2 text-base font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'} pl-0`}>
                          Upcoming
                        </div>
                        <div className={`rounded-2xl px-4 py-3 ${colors.container} border ${colors.border} shadow-md`}>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-base">
                              <span className={`${colors.containerText}`}>to</span>
                              <span className="font-semibold" style={{ color: displayColor }}>
                                {normalizeSubjectName(nextEvent.summary, autoNamingEnabled)}
                              </span>
                              {cleanedLoc ? (
                                <span className={`${colors.containerText}`}>in {cleanedLoc}</span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-2xl md:text-3xl font-semibold" style={{ color: displayColor }}>
                                {formatCountdownForTab(timeLeft || 0)}
                              </span>
                              <button
                                onClick={openCountdownFullscreen}
                                className={`p-2 rounded-md hover:opacity-80 transition-colors ${effectiveMode === 'light' ? 'text-black' : 'text-white'} opacity-80`}
                                title="Fullscreen countdown"
                              >
                                <Maximize size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Event cards */}
                {(() => {
                  // Keep refs array length in sync with rendered cards to avoid stale measurements
                  cardRefs.current.length = timelineEvents.length;
                  // Only one countdown box should render
                  let countdownRendered = false;

                  // Compute the global index of the currently active (non-break) event by time
                  const computeCurrentEventFullIndex = () => {
                    if (!shouldShowTimelineCountdown) return -1;
                    const now = new Date(nowTs);
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    // Do not mark any event as current if viewing a different day's schedule
                    if (selectedScheduleDate) {
                      const sel = new Date(
                        selectedScheduleDate.getFullYear(),
                        selectedScheduleDate.getMonth(),
                        selectedScheduleDate.getDate()
                      );
                      if (sel.getTime() !== today.getTime()) return -1;
                    }
                    for (let i = 0; i < eventsWithBreaks.length; i++) {
                      const e = eventsWithBreaks[i];
                      if (!e.dtstart || !e.dtend) continue; // include breaks too
                      const es = new Date(e.dtstart);
                      const ee = new Date(e.dtend);
                      const ts = new Date(today);
                      ts.setHours(es.getHours(), es.getMinutes(), es.getSeconds());
                      const te = new Date(today);
                      te.setHours(ee.getHours(), ee.getMinutes(), ee.getSeconds());
                      // Half-open interval [start, end)
                      if (nowTs >= ts.getTime() && nowTs < te.getTime()) {
                        return i;
                      }
                    }
                    return -1;
                  };

                  const currentEventFullIndex = computeCurrentEventFullIndex();

                  // Pre-compute event indices to avoid O(n²) complexity
                  const eventToIndexMap = new Map();
                  eventsWithBreaks.forEach((event, index) => {
                    eventToIndexMap.set(event, index);
                  });

                  return timelineEvents.map((event, idx) => {
                    // Anchor countdown to the exact active event by global index
                    const fullIndex = eventToIndexMap.get(event) ?? -1;
                    let isCurrentEvent = shouldShowTimelineCountdown && fullIndex === currentEventFullIndex; // allow breaks to show countdown
                    if (isCurrentEvent && countdownRendered) {
                      isCurrentEvent = false;
                    }

                    return (
                      <div key={idx} className="relative z-10 w-full">
                        {/* 'Now' heading above the current event - NOT included in gradient measurements */}
                        {isCurrentEvent && (
                          <div className={`mb-2 text-base font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'} pl-0`}>
                            Now
                          </div>
                        )}
                        <div
                          ref={el => { cardRefs.current[idx] = el; }}
                          onMouseEnter={() => setHoveredIndex(idx)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          className="relative"
                        >
                          <EventCard
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
                            forceTall={hoveredIndex === idx}
                            subjects={subjects}
                          />
                        </div>

                        {/* Countdown pill under current event */}
                        {isCurrentEvent && (countdownRendered = true) && (() => {
                          // Use the actual countdown event from timeline (includes breaks)
                          const displaySummary = timelineCountdownInfo?.event || event.summary;
                          // Find the actual next event for location info (not just non-break)
                          const globalIdx = currentEventFullIndex;
                          let nextEvent: CalendarEvent | null = null;
                          for (let i = globalIdx + 1; i < eventsWithBreaks.length; i++) {
                            const e = eventsWithBreaks[i];
                            nextEvent = e;
                            break;
                          }
                          const displayLocationRaw = nextEvent ? (nextEvent.location || '') : (event.location || '');
                          const displayColor = getEventColour(displaySummary);
                          const cleanedLoc = displayLocationRaw.replace(/^Room:\s*/i, '').trim();
                          return (
                            <div className={`mt-3 rounded-2xl px-4 py-3 ${colors.container} border ${colors.border} shadow-md`}>
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-base">
                                  <span className={`${colors.containerText}`}>to</span>
                                  <span className="font-semibold" style={{ color: displayColor }}>
                                    {normalizeSubjectName(displaySummary, autoNamingEnabled)}
                                  </span>
                                  {cleanedLoc ? (
                                    <span className={`${colors.containerText}`}>in {cleanedLoc}</span>
                                  ) : null}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl md:text-3xl font-semibold" style={{ color: displayColor }}>
                                    {timelineCountdownInfo?.time ?? ''}
                                  </span>
                                  <button
                                    onClick={openCountdownFullscreen}
                                    className={`p-2 rounded-md hover:opacity-80 transition-colors ${effectiveMode === 'light' ? 'text-black' : 'text-white'} opacity-80`}
                                    title="Fullscreen countdown"
                                  >
                                    <Maximize size={18} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 'Upcoming' heading after current block when there are more */}
                        {isCurrentEvent && idx < timelineEvents.length - 1 && (
                          <div className="mt-4 mb-1 flex items-center gap-2">
                            <span className={`text-base font-semibold ${colors.containerText}`}>Upcoming</span>
                            <ChevronsUpDown size={16} className={colors.containerText} />
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}

                {/* Upcoming button for timeline countdown mode */}
                {(() => {
                  // Calculate if day is over inline
                  let isDayOverInline = true;
                  if (showCountdownInTimeline) {
                    const now = new Date(nowTs);
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                    for (let i = 0; i < eventsWithBreaks.length; i++) {
                      const event = eventsWithBreaks[i];
                      if (!event.dtstart || !event.dtend) continue; // include breaks as valid events

                      const eventStart = new Date(event.dtstart);
                      const eventEnd = new Date(event.dtend);

                      const todayEventStart = new Date(today);
                      todayEventStart.setHours(eventStart.getHours(), eventStart.getMinutes(), eventStart.getSeconds());

                      const todayEventEnd = new Date(today);
                      todayEventEnd.setHours(eventEnd.getHours(), eventEnd.getMinutes(), eventEnd.getSeconds());

                      if (nowTs >= todayEventStart.getTime() && nowTs <= todayEventEnd.getTime()) {
                        isDayOverInline = false;
                        break;
                      } else if (nowTs < todayEventStart.getTime()) {
                        isDayOverInline = false;
                        break;
                      }
                    }
                  }

                  return (
                    <>
                      {showCountdownInTimeline && !timelineExpanded && !isDayOverInline && (
                        <div className="mt-6 text-center">
                          <button
                            onClick={() => setTimelineExpanded(true)}
                            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg ${colors.container} border ${colors.border} hover:opacity-80 transition-colors duration-200`}
                          >
                            <ChevronsUpDown size={20} className={colors.containerText} />
                            <span className={`font-medium ${colors.containerText}`}>Show All</span>
                          </button>
                        </div>
                      )}

                    </>
                  );
                })()}
              </div>
            )}
          </div>
          {/* Countdown box on the right */}
          <div className="flex flex-col gap-6">
            {isHolidayBadge && daysTillSchool && (
              <div className={`${colors.container} rounded-lg ${colors.border} border p-6 flex flex-col items-center justify-center h-fit`}>
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={20} />
                    <span className={`text-lg font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Days till school</span>
                  </div>
                  <button
                    onClick={openCountdownFullscreen}
                    className={`p-1 rounded hover:bg-opacity-20 hover:bg-gray-500 transition-colors ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}
                    title="Fullscreen"
                  >
                    <Maximize size={18} />
                  </button>
                </div>
                <div
                  className={`text-4xl font-bold mb-2`}
                  style={{
                    color: daysTillSchool.color || (effectiveMode === 'light' ? '#000000' : '#ffffff'),
                    ...(effectiveMode === 'light' ? {} : { textShadow: '0 1px 4px rgba(0,0,0,0.15)' })
                  }}
                >
                  {formatCountdownForTab(daysTillSchool.ms)}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  {daysTillSchool.color ? (
                    <ColoredSubjectIcon summary={daysTillSchool.event} color={daysTillSchool.color} />
                  ) : (
                    <Calendar className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={24} />
                  )}
                  <span className="text-base font-medium" style={{ color: daysTillSchool.color || (effectiveMode === 'light' ? '#000000' : '#ffffff') }}>{daysTillSchool.event}</span>
                </div>
                <div>
                  <div className={`text-sm ${effectiveMode === 'light' ? 'text-black opacity-80' : 'text-white opacity-80'}`}>
                    {(() => {
                      const now = new Date(nowTs);
                      const daysDiff = Math.floor((new Date(daysTillSchool.target.getFullYear(), daysTillSchool.target.getMonth(), daysTillSchool.target.getDate()).getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86400000);
                      const use24Hour = localStorage.getItem('use24HourFormat') === 'true';
                      const timeStr = daysTillSchool.target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !use24Hour });
                      if (daysDiff >= 1) {
                        const fullDate = daysTillSchool.target.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
                        return `On ${fullDate} at ${timeStr}`;
                      }
                      return `at ${timeStr}`;
                    })()}
                  </div>
                  <div className={`text-xs ${effectiveMode === 'light' ? 'text-black opacity-60' : 'text-white opacity-60'} mt-1`}>
                    Accounting for daylight saving
                  </div>
                </div>
              </div>
            )}
            {showCountdownInTimeline && !showNextDay && !isHolidayBadge && localStorage.getItem('showCountdownWidget') !== 'false' && (
              <CountdownBox
                searching={countdownSearching}
                nextEvent={nextEvent}
                nextEventDate={nextEventDate}
                timeLeft={timeLeft}
                formatCountdown={formatCountdownForTab}
                getEventColour={getEventColour}
                effectiveMode={effectiveMode}
                colors={colors}
                onFullscreen={openCountdownFullscreen}
                autoNamingEnabled={autoNamingEnabled}
                subjects={subjects}
              />
            )}
            {/* Links Widget above Quote Widget */}
            {localStorage.getItem('showLinksWidget') !== 'false' && (
              <LinksWidget
                effectiveMode={effectiveMode}
                colors={colors}
              />
            )}
            {/* Quote of the Day Widget below CountdownBox */}
            {localStorage.getItem('showQuoteWidget') !== 'false' && (
              <QuoteOfTheDayWidget
                theme={theme}
                themeType={themeType}
                effectiveMode={effectiveMode}
              />
            )}
            {/* Word of the Day Widget below Quote Widget */}
            {localStorage.getItem('showWordWidget') !== 'false' && (
              <WordOfTheDayWidget
                theme={theme}
                themeType={themeType}
                effectiveMode={effectiveMode}
              />
            )}
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
  const [isCountdownFullscreen, setIsCountdownFullscreen] = useState(false);

  // Handle fullscreen countdown state
  const openCountdownFullscreen = () => {
    setIsCountdownFullscreen(true);
  };

  const closeCountdownFullscreen = () => {
    setIsCountdownFullscreen(false);
  };

  // State for toggling between today and next day's schedule
  const [showNextDay, setShowNextDay] = useState(false);
  // State to force showing actual today even when all events have ended
  const [forceShowActualToday, setForceShowActualToday] = useState(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [measuredHeights, setMeasuredHeights] = useState<number[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [segments, setSegments] = useState<{ startPct: number; endPct: number }[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  // Ticking time for progress overlay
  const [nowTs, setNowTs] = useState<number>(Date.now());
  // Actual list container height to convert px -> % precisely
  const [containerHeight, setContainerHeight] = useState<number>(0);

  // Reset refs and measurements on route change to avoid stale elements after navigating away/back
  useEffect(() => {
    cardRefs.current = [];
    setMeasuredHeights([]);
    setSegments([]);
    setContainerHeight(0);
    setHoveredIndex(null);
  }, [location.pathname]);

  // Measure card heights initially and when the list content changes (not on hover).
  useLayoutEffect(() => {
    if (location.pathname !== '/home') {
      return;
    }
    try {
      const container = listRef.current;
      if (!container) {
        setMeasuredHeights([]);
        setSegments([]);
        return;
      }
      const listRect = container.getBoundingClientRect();
      const n = cardRefs.current.length;
      if (!n || listRect.height <= 0) {
        setMeasuredHeights([]);
        setSegments([]);
        return;
      }
      setContainerHeight(Math.max(1, Math.round(listRect.height)));
      const heights: number[] = [];
      const segs: { startPct: number; endPct: number }[] = [];
      for (let i = 0; i < n; i++) {
        const el = cardRefs.current[i];
        const r = el?.getBoundingClientRect();
        if (!r) continue;
        const h = Math.max(1, Math.round(r.height));
        heights.push(h);
        const start = Math.max(0, r.top - listRect.top);
        const end = Math.max(start, r.bottom - listRect.top);
        const startPct = Math.max(0, Math.min(100, (start / listRect.height) * 100));
        const endPct = Math.max(0, Math.min(100, (end / listRect.height) * 100));
        segs.push({ startPct, endPct });
      }
      setMeasuredHeights(heights);
      setSegments(segs);
    } catch {
      // ignore
    }
  }, [location.pathname, showNextDay, cardRefs.current.length]);

  // Note: Hover changes are handled by ResizeObserver below; no extra timers on hover to avoid flicker.

  // Re-measure on window resize to keep alignment accurate
  useEffect(() => {
    const onResize = () => {
      try {
        // Trigger full re-measure via dependency above
        setMeasuredHeights((h) => [...h]);
      } catch { }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);



  // Simple ResizeObserver that only measures on window resize, not during hover animations
  useEffect(() => {
    if (location.pathname !== '/home') return;
    const container = listRef.current;
    if (!container) return;
    if (!('ResizeObserver' in window)) return;

    const measure = () => {
      try {
        const cont = listRef.current;
        if (!cont) return;
        const listRect = cont.getBoundingClientRect();
        const n = cardRefs.current.length;
        if (!n || listRect.height <= 0) return;
        setContainerHeight(Math.max(1, Math.round(listRect.height)));
        const heights: number[] = [];
        const segs: { startPct: number; endPct: number }[] = [];
        for (let i = 0; i < n; i++) {
          const el = cardRefs.current[i];
          const r = el?.getBoundingClientRect();
          if (!r) continue;
          heights.push(Math.max(1, Math.round(r.height)));
          const start = Math.max(0, r.top - listRect.top);
          const end = Math.max(start, r.bottom - listRect.top);
          segs.push({
            startPct: Math.max(0, Math.min(100, (start / listRect.height) * 100)),
            endPct: Math.max(0, Math.min(100, (end / listRect.height) * 100)),
          });
        }
        setMeasuredHeights(heights);
        setSegments(segs);
      } catch { }
    };

    // Initial measurement
    measure();

    // Only observe window resize, not individual element changes
    const handleResize = () => measure();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [showNextDay, location.pathname, cardRefs.current.length]);

  // Re-measure gradient smoothly around hover changes (few lightweight checks)
  useEffect(() => {
    if (location.pathname !== '/home') return;
    const measure = () => {
      try {
        const cont = listRef.current;
        if (!cont) return;
        const listRect = cont.getBoundingClientRect();
        const n = cardRefs.current.length;
        if (!n || listRect.height <= 0) return;
        setContainerHeight(Math.max(1, Math.round(listRect.height)));
        const heights: number[] = [];
        const segs: { startPct: number; endPct: number }[] = [];
        for (let i = 0; i < n; i++) {
          const el = cardRefs.current[i];
          const r = el?.getBoundingClientRect();
          if (!r) continue;
          heights.push(Math.max(1, Math.round(r.height)));
          const start = Math.max(0, r.top - listRect.top);
          const end = Math.max(start, r.bottom - listRect.top);
          segs.push({
            startPct: Math.max(0, Math.min(100, (start / listRect.height) * 100)),
            endPct: Math.max(0, Math.min(100, (end / listRect.height) * 100)),
          });
        }
        setMeasuredHeights(heights);
        setSegments(segs);
      } catch { }
    };

    // Kick a few gentle re-measures to follow the hover animation without heavy cost
    let rafId = 0;
    const timeouts: number[] = [];

    rafId = window.requestAnimationFrame(measure); // next frame
    [120, 240, 360].forEach((ms) => timeouts.push(window.setTimeout(measure, ms)));

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, [hoveredIndex, location.pathname]); // Triggers on hover start and end

  // Toggle handler with weekend logic
  const handleDayToggle = () => {
    const { autoSwitchedToNextDay } = dayEventsData;
    
    if (autoSwitchedToNextDay && !forceShowActualToday && !showNextDay) {
      // Currently auto-showing next day, toggle to force show today
      setForceShowActualToday(true);
    } else if (forceShowActualToday) {
      // Currently forcing today, toggle back to auto mode (which will show next day)
      setForceShowActualToday(false);
    } else if (showNextDay) {
      // Currently manually showing next day, toggle back to auto mode
      setShowNextDay(false);
    } else {
      // Currently showing today normally, toggle to next day
      setShowNextDay(true);
    }
  };

  // Memoize the basic day events calculation to prevent recalculation on every nowTs update
  const dayEventsData = useMemo(() => {
    // Use toggle state to determine which day's events to show
    let dayLabel: string;
    let events: CalendarEvent[];
    // Track which calendar date the displayed schedule belongs to
    let selectedScheduleDate: Date | null = null;
    let autoSwitchedToNextDay = false;
    if (showNextDay) {
      // Determine the next "school day" to show
      const now = new Date();
      const nextDayEvents = findEventsByDayToggle(now, true, weekData?.events || []);
      if (nextDayEvents) {
        const currentDay = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const targetDate = new Date(now);
        if (currentDay === 6) {
          // Saturday -> next Monday
          targetDate.setDate(now.getDate() + 2);
        } else if (currentDay === 0) {
          // Sunday -> next Monday
          targetDate.setDate(now.getDate() + 1);
        } else if (currentDay === 5) {
          // Friday -> next Monday
          targetDate.setDate(now.getDate() + 3);
        } else {
          // Mon-Thu -> next day
          targetDate.setDate(now.getDate() + 1);
        }
        dayLabel = targetDate.toLocaleDateString(undefined, { weekday: 'long' });
        const targetDayOfWeek = targetDate.getDay();
        events = (weekData?.events.filter(event => event.dtstart.getDay() === targetDayOfWeek) || [])
          .sort((a, b) => {
            const aTime = a.dtstart.getHours() * 60 + a.dtstart.getMinutes();
            const bTime = b.dtstart.getHours() * 60 + b.dtstart.getMinutes();
            return aTime - bTime;
          });
        selectedScheduleDate = targetDate;
      } else {
        dayLabel = "No Schedule";
        events = [];
      }
    } else {
      // Always show today's weekday schedule, but if it's weekend/holiday, show next school day's schedule
      const now = new Date();
      const todayDow = now.getDay(); // 0=Sun..6=Sat
      
      let targetDow = todayDow;
      let targetLabel = 'Today';
      let targetDate: Date | null = null;
      
      // Check if we're in a holiday period (NSW terms)
      let isHoliday = false;
      try {
        const weekEnabled = localStorage.getItem('weekNumberingEnabled') === 'true';
        const source = (localStorage.getItem('weekSource') as 'nsw' | 'custom') || 'nsw';
        if (weekEnabled && source === 'nsw') {
          const div = (localStorage.getItem('weekNswDivision') as 'eastern' | 'western') || 'eastern';
          const year = now.getFullYear();
          const termsNow = getCachedNswTerms(year);
          if (termsNow) {
            const label = getNswWeekLabelForDate(now, div, termsNow).text;
            isHoliday = /holiday/i.test(label);
          }
        }
      } catch {}
      
      // If in holiday, show first day back's schedule
      if (isHoliday && !forceShowActualToday) {
        const source = (localStorage.getItem('weekSource') as 'nsw' | 'custom') || 'nsw';
        if (source === 'nsw') {
          const div = (localStorage.getItem('weekNswDivision') as 'eastern' | 'western') || 'eastern';
          const year = now.getFullYear();
          const termsNow = getCachedNswTerms(year);
          const termsNext = getCachedNswTerms(year + 1);
          const starts: Date[] = [];
          if (termsNow) termsNow[div].forEach(t => starts.push(new Date(t.start)));
          if (termsNext) termsNext[div].forEach(t => starts.push(new Date(t.start)));
          const nextStart = starts.filter(d => d.getTime() > now.getTime()).sort((a, b) => a.getTime() - b.getTime())[0];
          if (nextStart) {
            targetDate = nextStart;
            targetDow = nextStart.getDay();
            targetLabel = nextStart.toLocaleDateString(undefined, { weekday: 'long' });
            selectedScheduleDate = targetDate;
          }
        }
      }
      // If it's Saturday (6) or Sunday (0), show Monday's events (1)
      else if (todayDow === 0 || todayDow === 6) {
        targetDow = 1; // Monday
        const nextMonday = new Date(now);
        if (todayDow === 0) {
          // Sunday -> next Monday is +1 day
          nextMonday.setDate(now.getDate() + 1);
        } else {
          // Saturday -> next Monday is +2 days
          nextMonday.setDate(now.getDate() + 2);
        }
        targetLabel = 'Monday';
        selectedScheduleDate = nextMonday;
      } else {
        selectedScheduleDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }
      
      // Get today's events
      events = (weekData?.events.filter(event => event.dtstart.getDay() === targetDow) || [])
        .sort((a, b) => {
          const aTime = a.dtstart.getHours() * 60 + a.dtstart.getMinutes();
          const bTime = b.dtstart.getHours() * 60 + b.dtstart.getMinutes();
          return aTime - bTime;
        });
      
      // Check if all events have ended for today (only on weekdays)
      // Unless user is forcing to see actual today
      if (!forceShowActualToday && todayDow >= 1 && todayDow <= 5 && events.length > 0) {
        const lastEvent = events[events.length - 1];
        if (lastEvent.dtend) {
          const lastEventEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          lastEventEnd.setHours(lastEvent.dtend.getHours(), lastEvent.dtend.getMinutes(), lastEvent.dtend.getSeconds());
          
          // If all events have ended, show next day's schedule
          if (now.getTime() >= lastEventEnd.getTime()) {
            autoSwitchedToNextDay = true;
            // Calculate next day
            const targetDate = new Date(now);
            if (todayDow === 5) {
              // Friday -> next Monday
              targetDate.setDate(now.getDate() + 3);
            } else {
              // Mon-Thu -> next day
              targetDate.setDate(now.getDate() + 1);
            }
            
            dayLabel = targetDate.toLocaleDateString(undefined, { weekday: 'long' });
            const nextDayOfWeek = targetDate.getDay();
            events = (weekData?.events.filter(event => event.dtstart.getDay() === nextDayOfWeek) || [])
              .sort((a, b) => {
                const aTime = a.dtstart.getHours() * 60 + a.dtstart.getMinutes();
                const bTime = b.dtstart.getHours() * 60 + b.dtstart.getMinutes();
                return aTime - bTime;
              });
            selectedScheduleDate = targetDate;
          } else {
            dayLabel = targetLabel;
          }
        } else {
          dayLabel = targetLabel;
        }
      } else {
        // User is forcing to see actual today, or other conditions
        dayLabel = targetLabel;
        // Keep the events array as-is (today's events, even if they've ended)
      }
    }
    // Insert breaks between events for home screen too
    const eventsWithBreaks = insertBreaksBetweenEvents(events);
    
    return { dayLabel, events, selectedScheduleDate, eventsWithBreaks, autoSwitchedToNextDay };
  }, [showNextDay, weekData, nowTs, forceShowActualToday]); // Add nowTs and forceShowActualToday to recalculate when they change



  


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
    
    // Extract countdown calculation into a function
    const updateCountdown = () => {
      const now = new Date();
      // Holiday override: redirect global countdown to next NSW term start when in holiday
      try {
        const weekEnabled = localStorage.getItem('weekNumberingEnabled') === 'true';
        const source = (localStorage.getItem('weekSource') as 'nsw' | 'custom') || 'nsw';
        if (weekEnabled && source === 'nsw') {
          const div = (localStorage.getItem('weekNswDivision') as 'eastern' | 'western') || 'eastern';
          const year = now.getFullYear();
          const termsNow = getCachedNswTerms(year);
          const isHoliday = (() => {
            if (!termsNow) return false;
            const label = getNswWeekLabelForDate(now, div, termsNow).text;
            return /holiday/i.test(label);
          })();
          if (isHoliday) {
            const termsNext = getCachedNswTerms(year + 1);
            const starts: Date[] = [];
            if (termsNow) termsNow[div].forEach(t => starts.push(new Date(t.start)));
            if (termsNext) termsNext[div].forEach(t => starts.push(new Date(t.start)));
            const nextStart = starts.filter(d => d.getTime() > now.getTime()).sort((a, b) => a.getTime() - b.getTime())[0];
            if (nextStart) {
              const dow = nextStart.getDay();
              const dayEvents = (weekData?.events || [])
                .filter(e => e.dtstart.getDay() === dow)
                .sort((a, b) => (a.dtstart.getHours() * 60 + a.dtstart.getMinutes()) - (b.dtstart.getHours() * 60 + b.dtstart.getMinutes()));
              const first = dayEvents[0];
              const fb = (localStorage.getItem('holidayFallbackTime') || '09:00').match(/^(\d{1,2}):(\d{2})$/);
              const fbH = fb ? Math.min(23, Math.max(0, parseInt(fb[1], 10))) : 9;
              const fbM = fb ? Math.min(59, Math.max(0, parseInt(fb[2], 10))) : 0;
              const target = new Date(nextStart.getFullYear(), nextStart.getMonth(), nextStart.getDate(), first ? first.dtstart.getHours() : fbH, first ? first.dtstart.getMinutes() : fbM, 0, 0);
              const diff = Math.max(0, target.getTime() - now.getTime());
              const synthetic: CalendarEvent = {
                dtstart: target,
                dtend: new Date(target.getTime() + 60 * 60 * 1000),
                summary: first ? first.summary : 'School resumes',
                location: first?.location || ''
              };
              setNextEvent(synthetic);
              setNextEventDate(target);
              setTimeLeft(diff);
              setCountdownSearching(false);
              setTabCountdown({
                time: formatCountdownForTab(diff),
                event: normalizeSubjectName(synthetic.summary, true),
                location: synthetic.location || ''
              });
              return; // skip normal countdown while holiday override is active
            }
          }
        }
      } catch {}
      // Use findNextRepeatingEvent which includes breaks and End of Day
      const soonest = findNextRepeatingEvent(now, weekData.events);
      if (soonest) {
        // Show the countdown to whatever event is next (including breaks and End of Day)
        setNextEvent(soonest.event);
        setNextEventDate(soonest.date);
        const diff = soonest.date.getTime() - now.getTime();
        setTimeLeft(diff > 0 ? diff : 0);
        setCountdownSearching(false);
        const info = {
          time: formatCountdownForTab(diff > 0 ? diff : 0),
          event: normalizeSubjectName(soonest.event.summary, true),
          location: soonest.event.location || '',
        };
        setTabCountdown(info);
      } else {
        setNextEvent(null);
        setNextEventDate(null);
        setTimeLeft(null);
        setCountdownSearching(false);
        setTabCountdown(null);
      }
    };
    
    // Run immediately on mount/update
    setCountdownSearching(true);
    updateCountdown();
    
    // Update when nowTs changes (driven by the main interval below)
    // No need for a separate interval here
  }, [weekData, nowTs]);






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
      if (saved && ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'grey'].includes(saved)) {
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
      if (userName !== undefined) {
        localStorage.setItem('userName', userName);
      }
    } else {
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
      } catch (err) {
        // If any error, do not skip welcome
      }
    } else {
    }
    setIsInitializing(false);
  }, []);

  // Register service worker on mount if offline caching is enabled
  React.useEffect(() => {
    if (offlineCachingEnabled && isServiceWorkerSupported()) {
      registerServiceWorker().then(success => {
        if (!success) {
          setOfflineCachingEnabled(false);
        }
      });
    }
  }, [offlineCachingEnabled]);

  // --- Welcome screen URL logic ---
  React.useEffect(() => {
    if (isInitializing) return;
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
        } catch { }
      }
    }
    if ((!subjects || subjects.length === 0) && welcomeStep === 'completed') {
      const savedSubjects = localStorage.getItem('subjects');
      if (savedSubjects) {
        try {
          setSubjects(JSON.parse(savedSubjects));
        } catch { }
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
  const [tabCountdown, setTabCountdown] = useState<{ time: string; event: string; location?: string } | null>(null);

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

  // Add state for countdown in timeline
  const [showCountdownInTimeline, setShowCountdownInTimeline] = useState(() => {
    const saved = localStorage.getItem('showCountdownInTimeline');
    return saved === null ? true : saved === 'true'; // Default to true if not set
  });
  // Persist showCountdownInTimeline
  useEffect(() => {
    localStorage.setItem('showCountdownInTimeline', showCountdownInTimeline ? 'true' : 'false');
  }, [showCountdownInTimeline]);

  // State for timeline countdown info
  const [timelineCountdownInfo, setTimelineCountdownInfo] = useState<{ time: string; event: string; type: 'current' | 'next' } | null>(null);

  // State for expanded timeline view
  const [timelineExpanded, setTimelineExpanded] = useState(false);

  // Add state for countdown in sidebar
  const [showCountdownInSidebar, setShowCountdownInSidebar] = useState(() => {
    const saved = localStorage.getItem('showCountdownInSidebar');
    return saved === null ? true : saved === 'true'; // Default to true if not set
  });
  // Persist showCountdownInSidebar
  useEffect(() => {
    localStorage.setItem('showCountdownInSidebar', showCountdownInSidebar ? 'true' : 'false');
  }, [showCountdownInSidebar]);

  // Add state for 24-hour time format
  const [use24HourFormat, setUse24HourFormat] = useState(() => {
    const saved = localStorage.getItem('use24HourFormat');
    return saved === 'true'; // Default to false (12-hour format)
  });
  // Persist use24HourFormat
  useEffect(() => {
    localStorage.setItem('use24HourFormat', use24HourFormat ? 'true' : 'false');
  }, [use24HourFormat]);

  // Tick every minute to update progress overlay, or every second if timeline countdown is enabled
  useEffect(() => {
    const interval = showCountdownInTimeline ? 1000 : 60000; // 1 second vs 1 minute
    const id = setInterval(() => {
      if (location.pathname === '/home') {
        setNowTs(Date.now());
      }
    }, interval);
    
    // Set initial time immediately if on home page
    if (location.pathname === '/home') {
      setNowTs(Date.now());
    }
    
    return () => clearInterval(id);
  }, [showCountdownInTimeline, location.pathname]);

  // Reset timeline expanded state when countdown timeline is disabled
  useEffect(() => {
    if (!showCountdownInTimeline) {
      setTimelineExpanded(false);
    }
  }, [showCountdownInTimeline]);

  // Persist offlineCachingEnabled
  useEffect(() => {
    localStorage.setItem('offlineCachingEnabled', offlineCachingEnabled ? 'true' : 'false');
  }, [offlineCachingEnabled]);

  // Update document.title for countdown in tab title
  useEffect(() => {
    if (countdownInTitle && tabCountdown && tabCountdown.time && tabCountdown.event) {
      const rawLoc = tabCountdown.location || '';
      const cleanedLoc = rawLoc.replace(/^Room:\s*/i, '').trim();
      const loc = cleanedLoc ? ` in ${cleanedLoc}` : '';
      const newTitle = `${tabCountdown.time} until ${tabCountdown.event}${loc}`;
      document.title = newTitle;
    } else {
      document.title = 'School Planner';
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
      } catch { }
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

  // Reset timeline expanded state when navigating away from home
  useEffect(() => {
    if (location.pathname !== '/home') {
      setTimelineExpanded(false);
    }
  }, [location.pathname]);


  // Main content routes
  // Only show welcome screen if not completed
  const mainContent = (
    <Routes>
      {welcomeStep !== 'completed' ? (
        <>
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          <Route path="/welcome" element={renderWelcomeScreen()} />
        </>
      ) : (
        <>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={renderHome()} />
          <Route path="/calendar" element={renderWeekView()} />
          <Route path="/markbook" element={renderMarkbook()} />
          <Route path="/settings" element={renderSettings()} />
        </>
      )}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );

  // Main render logic
  if (isInitializing) {
    return (
      <div className={`min-h-screen ${colors.background} text-white flex items-center justify-center`}>
        <div className={`${colors.container} ${colors.border} border rounded-xl px-4 py-3`}>Loading…</div>
      </div>
    );
  }
  if (welcomeStep !== 'completed') {
    return (
      <div className={`min-h-screen ${colors.background} text-white flex items-center justify-center`}>
        {mainContent}
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.background} text-white flex flex-col lg:flex-row`}>
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar
          navigate={navigate}
          location={location}
          colors={colors}
          SettingsIcon={SettingsIcon}
          showCountdownInSidebar={showCountdownInSidebar}
          onCountdownClick={openCountdownFullscreen}
        />
      </div>
      
      {/* Main content with proper left margin for sidebar */}
      <div className="flex-1 lg:ml-16 pt-0 px-6 pb-6">
        {mainContent}

        {/* Fullscreen countdown modal */}
        <FullscreenCountdown
          isOpen={isCountdownFullscreen}
          onClose={closeCountdownFullscreen}
          searching={countdownSearching}
          nextEvent={nextEvent}
          nextEventDate={nextEventDate}
          timeLeft={timeLeft}
          formatCountdown={formatCountdownForTab}
          getEventColour={getEventColour}
          colors={colors}
          autoNamingEnabled={autoNamingEnabled}
          subjects={subjects}
        />

        {/* Theme selection modal */}
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

        {/* Event details overlay */}
        {selectedEvent && (
          <EventDetailsOverlay
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            colors={colors}
            effectiveMode={effectiveMode}
            subjects={subjects}
          />
        )}

        {/* Disable password confirmation modal */}
        {showDisablePasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className={`${colors.container} rounded-lg ${colors.border} border p-6 w-full max-w-md`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${colors.buttonText}`}>Disable Password Protection</h3>
                <button
                  onClick={() => { setShowDisablePasswordModal(false); setDisablePasswordAttempt(''); }}
                  className={`${colors.text} opacity-70 hover:opacity-100 transition`}
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <p className={`${colors.containerText} mb-4`}>
                Enter your current password to disable Markbook protection.
              </p>
              <input
                type="password"
                value={disablePasswordAttempt}
                onChange={(e) => setDisablePasswordAttempt(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${colors.border} focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.container} ${colors.text}`}
                placeholder="Enter password"
                autoComplete="off"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => { setShowDisablePasswordModal(false); setDisablePasswordAttempt(''); }}
                  className={`bg-secondary hover:bg-secondary-dark text-secondary-foreground px-4 py-2 rounded-lg font-medium transition-colors duration-200`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const storedHash = localStorage.getItem('markbookPassword');
                    if (!storedHash) {
                      setMarkbookPasswordEnabled(false);
                      setShowDisablePasswordModal(false);
                      setDisablePasswordAttempt('');
                      showSuccess('Protection Disabled', 'No stored password found; protection disabled.', { effectiveMode, colors });
                      return;
                    }
                    if (memoizedComparePassword(disablePasswordAttempt, storedHash)) {
                      setMarkbookPasswordEnabled(false);
                      setShowDisablePasswordModal(false);
                      setDisablePasswordAttempt('');
                      showSuccess('Protection Disabled', 'Markbook password protection turned off.', { effectiveMode, colors });
                    } else {
                      showError('Incorrect Password', 'The password is incorrect.', { effectiveMode, colors });
                    }
                  }}
                  className={`${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200`}
                >
                  Disable
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



export default SchoolPlanner;