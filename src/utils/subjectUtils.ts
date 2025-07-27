import React from 'react';
import * as LucideIcons from 'lucide-react';
import { saveAs } from 'file-saver';

// Map for specific subject renames
export const renameMap = new Map<string, string>([
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

// Static icon mapping - only imports the icons we actually need
export const subjectIconMap: Record<string, React.ComponentType<any>> = {
  'Mathematics': LucideIcons.Calculator,
  'Science': LucideIcons.FlaskConical,
  'Visual Arts': LucideIcons.Palette,
  'Music': LucideIcons.Music,
  'Geography': LucideIcons.Globe,
  'PD/H/PE': LucideIcons.Dumbbell,
  'Languages': LucideIcons.Languages,
  'Coding Club': LucideIcons.Code2,
  'Information Technology': LucideIcons.Code2,
  'Computing': LucideIcons.Code2,
  'STEM': LucideIcons.Brain,
  'Drama': LucideIcons.Mic2,
  'Drama Club': LucideIcons.Mic2,
  'Debate Club': LucideIcons.Users,
  'Reading Group': LucideIcons.BookOpen,
  'Writing Workshop': LucideIcons.PenLine,
  'Study Hall': LucideIcons.BookUser,
  'Tutorial': LucideIcons.BookUser,
  'Mentoring Session': LucideIcons.Users,
  'Career Guidance': LucideIcons.Briefcase,
  'Counseling': LucideIcons.HeartHandshake,
  'Wellbeing': LucideIcons.HeartHandshake,
  'Pastoral Care': LucideIcons.Users,
  'Library': LucideIcons.Library,
  'History': LucideIcons.BookMarked,
  'English': LucideIcons.BookOpen,
  'French': LucideIcons.Languages,
  'Japanese': LucideIcons.Languages,
  'Latin': LucideIcons.Languages,
  'Sport': LucideIcons.Dumbbell,
  'Rec Sport': LucideIcons.Dumbbell,
  'Roll Call': LucideIcons.Users,
  'Band Practice': LucideIcons.Music,
  'Choir': LucideIcons.Music,
  'Orchestra': LucideIcons.Music,
  'Design & Technology': LucideIcons.Palette,
  'Technology': LucideIcons.Palette,
  'Assembly': LucideIcons.Users,
  'Chapel': LucideIcons.Star,
  'BHOPE': LucideIcons.GraduationCap,
  'Commerce': LucideIcons.Briefcase,
  'Robotics': LucideIcons.Bot,
  'Break': LucideIcons.Utensils,
};

// Helper to normalize subject names for grouping and renaming
export const normalizeSubjectName = (summary: string, autoNamingEnabled: boolean = true): string => {
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

// Function to get the appropriate icon for a subject
export const getSubjectIcon = (iconName: string, size: number = 20, mode: 'light' | 'dark' = 'light') => {
  // Try dynamic lookup for custom icon names
  let IconComponent = null;
  
  // Type assertion to safely check if the icon exists in LucideIcons
  const iconExists = iconName && (LucideIcons as { [key: string]: any })[iconName];
  
  if (iconExists) {
    IconComponent = (LucideIcons as { [key: string]: any })[iconName];
  } else {
    // Fallback to subject map for legacy/default icons
    const normalized = normalizeSubjectName(iconName);
    IconComponent = subjectIconMap[normalized] || LucideIcons.Book;
  }
  return React.createElement(IconComponent, {
    size,
    className: mode === 'light' ? 'text-black' : 'text-white'
  });
}; 

// Utility: Export data as Base64-encoded .school file
export function exportSchoolData(data: any, fileName: string) {
  const json = JSON.stringify(data, null, 2);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  const blob = new Blob([base64], { type: 'text/plain' });
  if (typeof window !== 'undefined') {
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
}

// Utility: Import data from a .school file (Base64-encoded JSON)
export function importSchoolData(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const base64 = e.target?.result as string;
        const json = decodeURIComponent(escape(atob(base64)));
        const data = JSON.parse(json);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
} 