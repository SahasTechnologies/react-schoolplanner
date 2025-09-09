import React from 'react';
import {
  Calculator, FlaskConical, Palette, Music, Globe, Dumbbell, Languages, Code2, Brain, Mic2,
  Users, BookOpen, PenLine, BookUser, Briefcase, HeartHandshake, Library, BookMarked, Star,
  GraduationCap, Bot, Book, Utensils, Heart, Zap, Rocket, Camera, Coffee, Gamepad2,
  Headphones, Lightbulb, Paintbrush, Scissors, Wrench, Hammer, Plane, Car, Bike,
  TreePine, Flower2 as Flower, Sun, Moon, Cloud, Umbrella, Snowflake, Flame, Droplets, Wind,
  Apple, Pizza, IceCream2 as IceCream, Cake, Cookie, Fish, Beef, Carrot, Cherry, Grape,
  Trophy, Medal, Target, Sword, Shield, Crown, Diamond, Gem,
  Smartphone, Laptop, Monitor, Keyboard, Mouse, Printer, Tv,
  Home, Building, School, Hospital, Store, Factory, Church, Castle, Tent
} from 'lucide-react';
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
  'Mathematics': Calculator,
  'Science': FlaskConical,
  'Visual Arts': Palette,
  'Music': Music,
  'Geography': Globe,
  'PD/H/PE': Dumbbell,
  'Languages': Languages,
  'Coding Club': Code2,
  'Information Technology': Code2,
  'Computing': Code2,
  'STEM': Brain,
  'Drama': Mic2,
  'Drama Club': Mic2,
  'Debate Club': Users,
  'Reading Group': BookOpen,
  'Writing Workshop': PenLine,
  'Study Hall': BookUser,
  'Tutorial': BookUser,
  'Mentoring Session': Users,
  'Career Guidance': Briefcase,
  'Counseling': HeartHandshake,
  'Wellbeing': HeartHandshake,
  'Pastoral Care': Users,
  'Library': Library,
  'History': BookMarked,
  'English': BookOpen,
  'French': Languages,
  'Japanese': Languages,
  'Latin': Languages,
  'Sport': Dumbbell,
  'Rec Sport': Dumbbell,
  'Roll Call': Users,
  'Band Practice': Music,
  'Choir': Music,
  'Orchestra': Music,
  'Design & Technology': Palette,
  'Technology': Palette,
  'Assembly': Users,
  'Chapel': Star,
  'BHOPE': GraduationCap,
  'Commerce': Briefcase,
  'Robotics': Bot,
  'Break': Utensils,
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

    // Preserve original capitalization by cleaning the original string
    if (cleanedName) {
      // Instead of changing case, clean the original summary while preserving case
      let result = summary.trim().replace(/(period|lesson|class|room)\s*\d*/gi, '').trim();
      // Remove extra spaces
      result = result.replace(/\s+/g, ' ');
      return result || summary.trim();
    }
  }

  return summary.trim(); // Fallback to original if auto-naming is off or no specific rename/cleaning yields a useful name
};

// Icon component mapping for custom icons
const iconComponentMap: Record<string, React.ComponentType<any>> = {
  // Original icons
  Calculator: Calculator,
  FlaskConical: FlaskConical,
  Palette: Palette,
  Music: Music,
  Globe: Globe,
  Dumbbell: Dumbbell,
  Languages: Languages,
  Code2: Code2,
  Brain: Brain,
  Mic2: Mic2,
  Users: Users,
  BookOpen: BookOpen,
  PenLine: PenLine,
  BookUser: BookUser,
  Briefcase: Briefcase,
  HeartHandshake: HeartHandshake,
  Library: Library,
  BookMarked: BookMarked,
  Star: Star,
  GraduationCap: GraduationCap,
  Bot: Bot,
  Book: Book,
  Utensils: Utensils,

  // Additional popular icons
  Heart: Heart,
  Zap: Zap,
  Rocket: Rocket,
  Camera: Camera,
  Coffee: Coffee,
  Gamepad2: Gamepad2,
  Headphones: Headphones,
  Lightbulb: Lightbulb,
  Paintbrush: Paintbrush,
  Scissors: Scissors,
  Wrench: Wrench,
  Hammer: Hammer,
  Plane: Plane,
  Car: Car,
  Bike: Bike,
  TreePine: TreePine,
  Flower: Flower,
  Sun: Sun,
  Moon: Moon,
  Cloud: Cloud,
  Umbrella: Umbrella,
  Snowflake: Snowflake,
  Flame: Flame,
  Droplets: Droplets,
  Wind: Wind,
  Apple: Apple,
  Pizza: Pizza,
  IceCream: IceCream,
  Cake: Cake,
  Cookie: Cookie,
  Fish: Fish,
  Beef: Beef,
  Carrot: Carrot,
  Cherry: Cherry,
  Grape: Grape,
  Trophy: Trophy,
  Medal: Medal,
  Target: Target,
  Sword: Sword,
  Shield: Shield,
  Crown: Crown,
  Diamond: Diamond,
  Gem: Gem,
  Smartphone: Smartphone,
  Laptop: Laptop,
  Monitor: Monitor,
  Keyboard: Keyboard,
  Mouse: Mouse,
  Printer: Printer,
  Tv: Tv,
  Home: Home,
  Building: Building,
  School: School,
  Hospital: Hospital,
  Store: Store,
  Factory: Factory,
  Church: Church,
  Castle: Castle,
  Tent: Tent
};

// Function to get the appropriate icon for a subject
export const getSubjectIcon = (subjectNameOrSubject: string | { name: string; icon?: string }, size: number = 20, mode: 'light' | 'dark' = 'light') => {
  let IconComponent: React.ComponentType<any>;

  if (typeof subjectNameOrSubject === 'string') {
    // Legacy string-based usage
    const normalized = normalizeSubjectName(subjectNameOrSubject);
    IconComponent = subjectIconMap[normalized] || Book;
  } else {
    // New object-based usage with custom icon support
    const subject = subjectNameOrSubject;
    if (subject.icon && iconComponentMap[subject.icon]) {
      IconComponent = iconComponentMap[subject.icon];
    } else {
      // Fallback to default icon mapping based on subject name
      const normalized = normalizeSubjectName(subject.name);
      IconComponent = subjectIconMap[normalized] || Book;
    }
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