import { parseICS, groupAllEventsIntoActualWeeks, WeekData } from './calendarUtils';
import { normalizeSubjectName, exportSchoolData, importSchoolData } from './subjectUtils';
import { Subject } from '../types';

// Default colours for the palette
export const defaultColours = [
  '#7C3AED', '#0891B2', '#DC2626', '#D97706', '#059669',
  '#047857', '#EA580C', '#2563EB', '#DB2777', '#475569',
  '#8B5CF6', '#06B6D4', '#EF4444', '#F59E0B', '#10B981',
  '#14B8A6', '#F97316', '#3B82F6', '#EC4899', '#64748B',
  '#6D28D9', '#0E7490', '#B91C1C', '#B45309', '#065F46'
];

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
      userName: data.name || undefined
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