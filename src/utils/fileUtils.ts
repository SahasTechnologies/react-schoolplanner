import { parseICS, groupAllEventsIntoActualWeeks, WeekData } from './calendarUtils';
import { normalizeSubjectName, exportSchoolData, importSchoolData } from './subjectUtils';
import { Subject } from '../types';

// Subject colour palette, grouped into three intensity levels so the person
// can pick the vibe that suits them, each still ordered in rainbow (hue)
// order with a neutral grey appended at the end.
export const colourPaletteGroups: { normal: string[]; naturals: string[]; dark: string[] } = {
  normal: [
    '#D91624', '#E8421D', '#B75B00', '#938100', '#6F8500',
    '#4B9000', '#078832', '#00840D', '#008435', '#008571',
    '#007F7F', '#008299', '#0079AD', '#0076D6', '#0065FF',
    '#2559F4', '#4C5EFE', '#675FF7', '#7B25F4', '#8A51F6',
    '#9B38FE', '#B133F4', '#BB00EA', '#D00BC6', '#D100BC',
    '#DB00A4', '#E00065', '#E01867', '#C7144B', '#E50022',
  ],
  naturals: [
    '#8B4513', '#6B4226', '#6F4E37', '#5D4037', '#3E2C23',
    '#8A6844', '#85714E', '#77683F', '#6B7245', '#7C7267',
    '#6E5F4B', '#57534E', '#44403C', '#475569', '#526073',
    '#6B7280', '#374151', '#1E293B',
  ],
  dark: [
    '#7F1D1D', '#7C2D12', '#78350F', '#713F12', '#431407',
    '#3F6212', '#14532D', '#064E3B', '#134E4A', '#155E75',
    '#0C4A6E', '#1E3A8A', '#312E81', '#4C1D95', '#581C87',
    '#701A75', '#831843', '#881337',
  ],
};

// Kept for backward compatibility with existing auto-assignment code that
// just wants a reasonable default set (the everyday/normal group).
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

export const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_IMPORT_EVENTS = 5000;

export const ALLOWED_PREFERENCE_KEYS = [
  'autoNamingEnabled',
  'theme',
  'themeType',
  'themeMode',
  'customThemeColors',
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
  'linksView',
  'linksViewMode',
  'groupDoublePeriods',
  'showCountdownWidget'
] as const;

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
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    return {
      weekData: null,
      subjects: [],
      error: 'File size exceeds the 10MB limit.'
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev: ProgressEvent<FileReader>) => {
      try {
        const icsContent = ev.target?.result as string;
        if (!icsContent || typeof icsContent !== 'string') {
          resolve({ weekData: null, subjects: [], error: 'Could not read calendar file.' });
          return;
        }
        const allRawEvents = parseICS(icsContent);
        if (allRawEvents.length > MAX_IMPORT_EVENTS) {
          resolve({ weekData: null, subjects: [], error: `File contains too many events (max ${MAX_IMPORT_EVENTS}).` });
          return;
        }
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
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    return {
      weekData: null,
      subjects: [],
      error: 'File size exceeds the 10MB limit.'
    };
  }

  try {
    const data = await importSchoolData(file);
    
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return {
        weekData: null,
        subjects: [],
        error: 'Invalid .school file: not a valid object.'
      };
    }
    
    let weekData: WeekData | null = null;
    let subjects: Subject[] = [];
    
    // Process and validate subjects with strict schema
    if (Array.isArray(data.subjects)) {
      const usedColours = new Set<string>();
      const safeSubjects: Subject[] = [];

      for (const item of data.subjects.slice(0, 100)) { // cap at 100 subjects
        if (!item || typeof item !== 'object') continue;
        const name = typeof item.name === 'string' ? item.name.slice(0, 100).trim() : '';
        if (!name) continue;

        let colour = typeof item.colour === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(item.colour) ? item.colour : '';
        if (!colour && Array.isArray(data.subjectColours)) {
          const match = data.subjectColours.find((sc: any) => sc && sc.name === name);
          if (match && typeof match.colour === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(match.colour)) {
            colour = match.colour;
          }
        }
        if (!colour) {
          colour = generateUniqueColour(usedColours);
        }
        usedColours.add(colour);

        safeSubjects.push({
          id: typeof item.id === 'string' && item.id.length < 100 ? item.id : crypto.randomUUID(),
          name,
          originalName: typeof item.originalName === 'string' ? item.originalName.slice(0, 100) : name,
          colour,
          icon: typeof item.icon === 'string' ? item.icon.slice(0, 50) : undefined
        });
      }
      subjects = safeSubjects;
    }
    
    // Process and validate weekData
    if (data.weekData && typeof data.weekData === 'object' && Array.isArray(data.weekData.events)) {
      const safeEvents = data.weekData.events.slice(0, MAX_IMPORT_EVENTS).map((e: any) => ({
        summary: typeof e.summary === 'string' ? e.summary.slice(0, 200) : '',
        location: typeof e.location === 'string' ? e.location.slice(0, 200) : undefined,
        description: typeof e.description === 'string' ? e.description.slice(0, 1000) : undefined,
        dtstart: new Date(e.dtstart),
        dtend: e.dtend ? new Date(e.dtend) : undefined
      })).filter((e: any) => !isNaN(e.dtstart.getTime()));

      weekData = {
        monday: new Date(data.weekData.monday),
        friday: new Date(data.weekData.friday),
        events: safeEvents
      };
    }

    // Filter preferences strictly against allowlist
    let safePreferences: Record<string, unknown> | undefined = undefined;
    if (data.preferences && typeof data.preferences === 'object' && !Array.isArray(data.preferences)) {
      safePreferences = {};
      const allowedSet = new Set<string>(ALLOWED_PREFERENCE_KEYS);
      for (const [key, val] of Object.entries(data.preferences)) {
        if (allowedSet.has(key)) {
          safePreferences[key] = val;
        }
      }
    }
    
    return {
      weekData,
      subjects,
      userName: typeof data.name === 'string' ? data.name.slice(0, 100) : undefined,
      examsBySubject: data.examsBySubject,
      markbookPassword: typeof data.markbookPassword === 'string' && data.markbookPassword.length < 200 ? data.markbookPassword : undefined,
      markbookPasswordEnabled: typeof data.markbookPasswordEnabled === 'boolean' ? data.markbookPasswordEnabled : undefined,
      links: Array.isArray(data.links) ? data.links.slice(0, 50) : undefined,
      preferences: safePreferences,
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
    
    ALLOWED_PREFERENCE_KEYS.forEach(key => {
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