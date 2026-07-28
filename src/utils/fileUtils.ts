import { parseICS, groupAllEventsIntoActualWeeks, WeekData } from './calendarUtils';
import { normalizeSubjectName, exportSchoolData, importSchoolData } from './subjectUtils';
import { Subject } from '../types';

// Subject colour palette, grouped into three intensity levels so the person
// can pick the vibe that suits them, each still ordered in rainbow (hue)
// order with a neutral grey appended at the end.
export const colourPaletteGroups: { vibrant: string[]; normal: string[]; dark: string[] } = {
  vibrant: [
    '#F42525', '#F46A25', '#F49D25', '#F4D125', '#D1F425',
    '#7BF425', '#25F425', '#25F46A', '#25F4AF', '#25F4E2',
    '#25C0F4', '#2590F4', '#2559F4', '#3625F4', '#7B25F4',
    '#C025F4', '#F425AF',
    '#7B8C9D',
  ],
  normal: [
    '#880707', '#883207', '#885207', '#887207', '#728807',
    '#3D8807', '#078807', '#078832', '#047857', '#07887D',
    '#076888', '#074A88', '#072788', '#120788', '#3D0788',
    '#680788', '#88075D',
    '#454D54',
  ],
  dark: [
    '#431919', '#432719', '#433119', '#433C19', '#3C4319',
    '#2A4319', '#194319', '#194327', '#194335', '#19433F',
    '#193843', '#192F43', '#192443', '#1D1943', '#2A1943',
    '#381943', '#431935',
    '#26292C',
  ],
};

// Kept for backward compatibility with existing auto-assignment code that
// just wants a reasonable default set (the muted/normal group).
export const defaultColours = colourPaletteGroups.normal;

// Generate unique colour that hasn't been used yet
export const generateUniqueColour = (usedColours: Set<string>): string => {
  // If we have more subjects than colors, we'll have to reuse colors
  if (usedColours.size >= defaultColours.length) {
    return defaultColours[Math.floor(Math.random() * defaultColours.length)];
  }
  
  // Find the first unused color
  for (const colour of defaultColours) {
    if (!usedColours.has(colour)) {
      return colour;
    }
  }
  
  // Fallback (shouldn't reach here)
  return defaultColours[0];
};

// Generate random colour (now uses defaultColours array) - kept for backward compatibility
export const generateRandomColour = () => {
  return defaultColours[Math.floor(Math.random() * defaultColours.length)];
};

export interface FileProcessingResult {
  weekData: WeekData | null;
  subjects: Subject[];
  error?: string;
  userName?: string;
  // Present only when importing a "complete backup" .school file (see
  // exportAllData) -- processSchoolFile previously parsed subjects/
  // weekData/name only and silently dropped everything below, even
  // though exportAllData had already written it all out.
  examsBySubject?: unknown;
  markbookPassword?: string;
  markbookPasswordEnabled?: boolean;
  links?: unknown;
  preferences?: Record<string, unknown>;
}

// Process ICS file
export const processICSFile = async (
  file: File, 
  autoNamingEnabled: boolean
): Promise<FileProcessingResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev: ProgressEvent<FileReader>) => {
      try {
        const icsContent = ev.target?.result as string;
        const allRawEvents = parseICS(icsContent);
        const allActualWeeks = groupAllEventsIntoActualWeeks(allRawEvents);
        
        if (allActualWeeks.length === 0) {
          resolve({
            weekData: null,
            subjects: [],
            error: 'No valid Monday-Friday schedules with events found in the calendar file.'
          });
          return;
        }
        
        let bestWeek: WeekData | null = null;
        let maxEvents = 0;
        for (const week of allActualWeeks) {
          if (week.events.length > maxEvents) {
            bestWeek = week;
            maxEvents = week.events.length;
          }
        }
        
        if (!bestWeek) {
          resolve({
            weekData: null,
            subjects: [],
            error: 'No Monday-Friday week with events found.'
          });
          return;
        }
        
        // Extract and combine subjects from ALL events (not just the first week)
        const subjectMap = new Map<string, Subject>();
        const usedColours = new Set<string>();
        
        allRawEvents.forEach(event => {
          const normalizedName = normalizeSubjectName(event.summary, autoNamingEnabled);
          if (normalizedName) {
            if (!subjectMap.has(normalizedName)) {
              const uniqueColour = generateUniqueColour(usedColours);
              usedColours.add(uniqueColour);
              subjectMap.set(normalizedName, {
                id: crypto.randomUUID(),
                name: normalizedName,
                originalName: event.summary,
                colour: uniqueColour
              });
            }
          }
        });
        
        resolve({
          weekData: bestWeek,
          subjects: Array.from(subjectMap.values())
        });
      } catch (err) {
        resolve({
          weekData: null,
          subjects: [],
          error: 'Error processing file: ' + (err as Error).message
        });
      }
    };
    reader.readAsText(file);
  });
};

// Process .school file
export const processSchoolFile = async (
  file: File
): Promise<FileProcessingResult> => {
  try {
    const data = await importSchoolData(file);
    
    if (!data || typeof data !== 'object') {
      return {
        weekData: null,
        subjects: [],
        error: 'Invalid .school file: not a valid object.'
      };
    }
    
    let weekData: WeekData | null = null;
    let subjects: Subject[] = [];
    
    // Process subjects
    if (data.subjects) {
      // Ensure every subject has a colour (assign unique if missing)
      const usedColours = new Set<string>();
      const patchedSubjects = data.subjects.map((subject: any) => {
        let colour = subject.colour || (subject.name && (data.subjectColours || []).find((sc: any) => sc.name === subject.name)?.colour);
        
        // If no colour found, assign a unique one
        if (!colour) {
          colour = generateUniqueColour(usedColours);
          usedColours.add(colour);
        } else {
          // Track used colours even if they were already assigned
          usedColours.add(colour);
        }
        
        return {
          ...subject,
          colour: colour
        };
      });
      subjects = patchedSubjects;
    }
    
    // Process weekData
    if (data.weekData) {
      weekData = {
        ...data.weekData,
        monday: new Date(data.weekData.monday),
        friday: new Date(data.weekData.friday),
        events: data.weekData.events.map((e: any) => ({ 
          ...e, 
          dtstart: new Date(e.dtstart), 
          dtend: e.dtend ? new Date(e.dtend) : undefined 
        }))
      };
    } else if (data.subjects && data.subjects.some((s: any) => Array.isArray(s.timings) && s.timings.length > 0)) {
      // Generate weekData from subjects' timings
      const allEvents = data.subjects.flatMap((subject: any) =>
        (subject.timings || []).map((timing: any) => ({
          summary: subject.name,
          dtstart: new Date(timing.start),
          dtend: timing.end ? new Date(timing.end) : undefined,
          location: timing.location || '',
          description: timing.description || ''
        }))
      );
      
      if (allEvents.length > 0) {
        const allDates = allEvents.map((e: any) => e.dtstart);
        const minDate = new Date(Math.min(...allDates.map((d: any) => d.getTime())));
        const maxDate = new Date(Math.max(...allEvents.map((e: any) => (e.dtend ? e.dtend.getTime() : e.dtstart.getTime()))));
        weekData = {
          monday: minDate,
          friday: maxDate,
          events: allEvents
        };
      }
    }
    
    return {
      weekData,
      subjects,
      userName: data.name || undefined,
      // These are only present in a "complete backup" file (see
      // exportAllData) -- pass them straight through so the caller can
      // restore them. Previously nothing here read these fields at all,
      // so a "complete backup" import silently dropped exams, the
      // markbook password, links, and every preference, even though the
      // export had faithfully written all of it out.
      examsBySubject: data.examsBySubject,
      markbookPassword: typeof data.markbookPassword === 'string' ? data.markbookPassword : undefined,
      markbookPasswordEnabled: typeof data.markbookPasswordEnabled === 'boolean' ? data.markbookPasswordEnabled : undefined,
      links: data.links,
      preferences: data.preferences && typeof data.preferences === 'object' ? data.preferences : undefined,
    };
  } catch (err) {
    return {
      weekData: null,
      subjects: [],
      error: 'Invalid .school file: not valid JSON.'
    };
  }
};

// Main file processing function
export const processFile = async (
  file: File,
  autoNamingEnabled: boolean
): Promise<FileProcessingResult> => {
  if (file.name.endsWith('.ics')) {
    return await processICSFile(file, autoNamingEnabled);
  } else if (file.name.endsWith('.school')) {
    return await processSchoolFile(file);
  } else {
    return {
      weekData: null,
      subjects: [],
      error: 'Unsupported file type. Please upload a .ics or .school file.'
    };
  }
};

// Export data function
export const exportData = (
  subjects: Subject[],
  userName: string,
  exportOptions: {
    subjects: boolean;
    subjectInfo: boolean;
    subjectNotes: boolean;
    subjectColours: boolean;
    subjectIcons: boolean;
    name: boolean;
  }
) => {
  const data: any = {};
  
  if (exportOptions.subjects) {
    data.subjects = subjects.map(subject => {
      // Always include colour in export
      return {
        ...subject,
        colour: subject.colour || generateRandomColour(),
      };
    });

    // Also include the actual weekly timetable -- this is the "timing"
    // the Subjects checkbox label already promises, but it was previously
    // never written out at all, so re-importing a .school file could
    // bring back subject names/colours but silently lost the whole
    // schedule (processSchoolFile has always known how to read
    // data.weekData back in; it just never had anything to read).
    // localStorage's cached copy is already JSON-serialized with dates as
    // ISO strings (JSON.stringify does this for Date objects
    // automatically), which is exactly the shape processSchoolFile
    // expects, so it can be embedded as-is.
    const savedWeekData = localStorage.getItem('weekData');
    if (savedWeekData) {
      try {
        data.weekData = JSON.parse(savedWeekData);
      } catch {
        // Malformed cache -- export the rest of the data without it
        // rather than failing the whole export.
      }
    }
  }
  
  if (exportOptions.subjectInfo) {
    data.subjectInfo = subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      originalName: subject.originalName,
    }));
  }
  
  if (exportOptions.subjectNotes) {
    data.subjectNotes = {};
    subjects.forEach(subject => {
      const key = `subject_note_${normalizeSubjectName(subject.name, true)}`;
      const note = localStorage.getItem(key);
      if (note) data.subjectNotes[subject.name] = note;
    });
  }
  
  if (exportOptions.subjectColours) {
    data.subjectColours = subjects.map(subject => ({
      name: subject.name,
      colour: subject.colour,
    }));
  }
  
  if (exportOptions.subjectIcons) {
    data.subjectIcons = subjects.map(subject => ({
      name: subject.name,
      icon: normalizeSubjectName(subject.name, true),
    }));
  }
  
  if (exportOptions.name) {
    data.name = userName;
  }
  
  const fileName = `${userName || 'schoolplanner'}-export.school`;
  exportSchoolData(data, fileName);
  
  return fileName;
}; 

// Comprehensive export function that exports EVERYTHING in one file
export const exportAllData = (
  subjects: Subject[],
  userName: string,
  includePreferences: boolean = true
) => {
  const data: any = {
    version: '1.0',
    exportDate: new Date().toISOString(),
  };
  
  // Export all subject data
  data.subjects = subjects.map(subject => ({
    ...subject,
    colour: subject.colour || generateRandomColour(),
  }));
  
  data.subjectInfo = subjects.map(subject => ({
    id: subject.id,
    name: subject.name,
    originalName: subject.originalName,
  }));
  
  data.subjectNotes = {};
  subjects.forEach(subject => {
    const key = `subject_note_${normalizeSubjectName(subject.name, true)}`;
    const note = localStorage.getItem(key);
    if (note) data.subjectNotes[subject.name] = note;
  });
  
  data.subjectColours = subjects.map(subject => ({
    name: subject.name,
    colour: subject.colour,
  }));
  
  data.subjectIcons = subjects.map(subject => ({
    name: subject.name,
    icon: normalizeSubjectName(subject.name, true),
  }));
  
  data.name = userName;

  // Timetable/schedule -- see the matching note in exportData() above for
  // why this has to be included explicitly (it's core data, not a
  // "preference", so it's included here unconditionally).
  const savedWeekData = localStorage.getItem('weekData');
  if (savedWeekData) {
    try {
      data.weekData = JSON.parse(savedWeekData);
    } catch {
      // Malformed cache -- export the rest of the data without it.
    }
  }
  
  // Export exams and markbook data
  const examsData = localStorage.getItem('examsBySubject');
  if (examsData) {
    try {
      data.examsBySubject = JSON.parse(examsData);
    } catch {
      data.examsBySubject = examsData;
    }
  }
  
  const markbookPassword = localStorage.getItem('markbookPassword');
  if (markbookPassword) data.markbookPassword = markbookPassword;
  
  const markbookPasswordEnabled = localStorage.getItem('markbookPasswordEnabled');
  if (markbookPasswordEnabled) {
    try {
      data.markbookPasswordEnabled = JSON.parse(markbookPasswordEnabled);
    } catch {
      data.markbookPasswordEnabled = markbookPasswordEnabled;
    }
  }
  
  // Export links
  const linksData = localStorage.getItem('links');
  if (linksData) {
    try {
      data.links = JSON.parse(linksData);
    } catch {
      data.links = linksData;
    }
  }
  
  // Export all preferences if requested
  if (includePreferences) {
    data.preferences = {};
    
    const preferenceKeys = [
      'autoNamingEnabled',
      'theme',
      'themeType',
      'themeMode',
      'offlineCachingEnabled',
      'countdownInTitle',
      'showCountdownInTimeline',
      'showCountdownInSidebar',
      'showFirstInfoBeside',
      'infoOrder',
      'infoShown',
      'weekNumberingEnabled',
      'weekendsInProgressEnabled',
      'use24HourFormat',
      'quoteProvider',
      'jakubPetriskaQuoteRefreshMode',
      'notionQuoteRefreshMode',
      'wordSource',
      'linksView'
    ];
    
    preferenceKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        try {
          data.preferences[key] = JSON.parse(value);
        } catch {
          data.preferences[key] = value;
        }
      }
    });
  }
  
  const fileName = `${userName || 'schoolplanner'}-complete-backup.school`;
  exportSchoolData(data, fileName);
  
  return fileName;
};