export interface CalendarEvent {
  dtstart: Date;
  dtend?: Date;
  summary: string;
  location?: string;
  description?: string;
}

export interface WeekData {
  monday: Date;
  friday: Date;
  events: CalendarEvent[];
}

export interface Subject {
  id: string;
  name: string;
  colour: string;
} 