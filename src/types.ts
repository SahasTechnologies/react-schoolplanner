export interface Subject {
  id: string; // Unique ID for the subject
  name: string; // Display name, can be edited
  originalName?: string; // Original name from ICS file
  colour: string; // Changed to Australian English 'colour'
  icon?: string; // Optional custom icon name
}

export interface Exam {
  id: string;
  name?: string;
  mark: number | null;
  total: number | null;
  weighting: number | null;
} 