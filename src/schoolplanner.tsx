import { useState, useRef } from 'react';
import { Upload, Calendar, FileText, Clock, MapPin } from 'lucide-react';

interface CalendarEvent {
  dtstart: Date;
  dtend?: Date;
  summary: string;
  location?: string;
  description?: string;
}

interface WeekData {
  monday: Date;
  friday: Date;
  events: CalendarEvent[];
}

const CorporateICSScheduleViewer = () => {
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subjectColors = {
    'mathematics': '#8B5CF6',
    'science': '#06B6D4',
    'history': '#EF4444',
    'english': '#F59E0B',
    'technology': '#10B981',
    'music': '#059669',
    'art': '#F97316',
    'visual': '#F97316',
    'pd': '#3B82F6',
    'physical': '#3B82F6',
    'japanese': '#EC4899',
    'macdougall': '#64748B',
    'break': '#374151',
    'lunch': '#374151',
    'rockclimbing': '#EC4899',
    'climbing': '#EC4899'
  };

  const getEventColor = (title: string): string => {
    const titleLower = title.toLowerCase();
    for (const [key, color] of Object.entries(subjectColors)) {
      if (titleLower.includes(key)) {
        return color;
      }
    }
    return '#64748B';
  };

  const parseICS = (icsContent: string): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const lines = icsContent.split(/\r?\n/);
    let currentEvent: Partial<CalendarEvent> | null = null;
    
    console.log('Parsing ICS content, total lines:', lines.length);
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // Handle line folding (lines that start with space or tab are continuations)
      while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
        i++;
        line += lines[i].substring(1);
      }
      
      if (line === 'BEGIN:VEVENT') {
        currentEvent = {} as Partial<CalendarEvent>;
      } else if (line === 'END:VEVENT' && currentEvent) {
        if (currentEvent.dtstart && currentEvent.dtend && currentEvent.summary) {
          events.push(currentEvent as CalendarEvent);
          console.log('Added event:', currentEvent.summary, 'from', currentEvent.dtstart, 'to', currentEvent.dtend);
        }
        currentEvent = null;
      } else if (currentEvent && line.includes(':')) {
        const colonIndex = line.indexOf(':');
        const key = line.substring(0, colonIndex);
        const value = line.substring(colonIndex + 1);
        
        if (key.startsWith('DTSTART')) {
          currentEvent.dtstart = parseDateTime(value);
        } else if (key.startsWith('DTEND')) {
          currentEvent.dtend = parseDateTime(value);
        } else if (key === 'SUMMARY') {
          currentEvent.summary = value.replace(/\\n/g, ' ').replace(/\\,/g, ',').replace(/\\\\/g, '\\');
        } else if (key === 'LOCATION') {
          currentEvent.location = value.replace(/\\n/g, ' ').replace(/\\,/g, ',').replace(/\\\\/g, '\\');
        } else if (key === 'DESCRIPTION') {
          currentEvent.description = value.replace(/\\n/g, ' ').replace(/\\,/g, ',').replace(/\\\\/g, '\\');
        }
      }
    }
    
    console.log('Total events parsed:', events.length);
    return events;
  };

  const parseDateTime = (dateStr: string): Date => {
    console.log('Parsing datetime:', dateStr);
    
    // Handle timezone parameters
    let cleanDateStr = dateStr;
    let isUTC = false;
    
    if (dateStr.includes(';')) {
      const parts = dateStr.split(';');
      cleanDateStr = parts[parts.length - 1];
      // Check for timezone info
      if (parts.some((part: string) => part.includes('TZID'))) {
        // Handle timezone - for now we'll treat as local time
        isUTC = false;
      }
    }
    
    cleanDateStr = cleanDateStr.trim();
    
    if (cleanDateStr.endsWith('Z')) {
      isUTC = true;
      cleanDateStr = cleanDateStr.slice(0, -1);
    }
    
    if (cleanDateStr.length === 8) {
      // YYYYMMDD format
      const year = parseInt(cleanDateStr.substring(0, 4));
      const month = parseInt(cleanDateStr.substring(4, 6)) - 1;
      const day = parseInt(cleanDateStr.substring(6, 8));
      const date = new Date(year, month, day);
      console.log('Parsed date (YYYYMMDD):', date);
      return date;
    } else if (cleanDateStr.length === 15) {
      // YYYYMMDDTHHMMSS format
      const year = parseInt(cleanDateStr.substring(0, 4));
      const month = parseInt(cleanDateStr.substring(4, 6)) - 1;
      const day = parseInt(cleanDateStr.substring(6, 8));
      const hour = parseInt(cleanDateStr.substring(9, 11));
      const minute = parseInt(cleanDateStr.substring(11, 13));
      const second = parseInt(cleanDateStr.substring(13, 15));
      
      const date = isUTC ? 
        new Date(Date.UTC(year, month, day, hour, minute, second)) :
        new Date(year, month, day, hour, minute, second);
      console.log('Parsed datetime:', date, isUTC ? '(UTC)' : '(local)');
      return date;
    } else if (cleanDateStr.length === 13) {
      // YYYYMMDDTHHMMSS format without seconds
      const year = parseInt(cleanDateStr.substring(0, 4));
      const month = parseInt(cleanDateStr.substring(4, 6)) - 1;
      const day = parseInt(cleanDateStr.substring(6, 8));
      const hour = parseInt(cleanDateStr.substring(9, 11));
      const minute = parseInt(cleanDateStr.substring(11, 13));
      
      const date = isUTC ? 
        new Date(Date.UTC(year, month, day, hour, minute, 0)) :
        new Date(year, month, day, hour, minute, 0);
      console.log('Parsed datetime (no seconds):', date, isUTC ? '(UTC)' : '(local)');
      return date;
    } else {
      // Try to parse as-is
      const date = new Date(cleanDateStr);
      console.log('Parsed datetime (fallback):', date);
      return date;
    }
  };

  const findFirstMondayWeek = (events: CalendarEvent[]): WeekData => {
    if (events.length === 0) {
      throw new Error('No events found in the calendar file');
    }
    
    events.sort((a: CalendarEvent, b: CalendarEvent) => a.dtstart.getTime() - b.dtstart.getTime());
    
    // Find the first Monday that has events in the week
    let firstMonday = null;
    let weekEvents: CalendarEvent[] = [];
    
    // Start from the first event and look for the first complete week (Mon-Fri)
    for (const event of events) {
      const eventDate = new Date(event.dtstart);
      
      // Skip invalid dates
      if (isNaN(eventDate.getTime())) {
        console.log('Skipping event with invalid date:', event);
        continue;
      }
      
      // Calculate the Monday of this event's week
      const dayOfWeek = eventDate.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday is 0, so subtract 6
      
      const mondayOfWeek = new Date(eventDate);
      mondayOfWeek.setDate(eventDate.getDate() - daysToSubtract);
      mondayOfWeek.setHours(0, 0, 0, 0);
      
      const fridayOfWeek = new Date(mondayOfWeek);
      fridayOfWeek.setDate(mondayOfWeek.getDate() + 4);
      fridayOfWeek.setHours(23, 59, 59, 999);
      
      // Check if this week has any events
      const eventsInWeek = events.filter((e: CalendarEvent) => {
        const eDate = new Date(e.dtstart);
        return !isNaN(eDate.getTime()) && eDate >= mondayOfWeek && eDate <= fridayOfWeek;
      });
      
      if (eventsInWeek.length > 0) {
        firstMonday = mondayOfWeek;
        weekEvents = eventsInWeek;
        break;
      }
    }
    
    if (!firstMonday) {
      throw new Error('No complete week found in the calendar events');
    }
    
    const firstFriday = new Date(firstMonday);
    firstFriday.setDate(firstMonday.getDate() + 4);
    firstFriday.setHours(23, 59, 59, 999);
    
    console.log('First Monday:', firstMonday);
    console.log('First Friday:', firstFriday);
    console.log('Week events:', weekEvents);
    
    return {
      monday: firstMonday,
      friday: firstFriday,
      events: weekEvents
    };
  };

  const processFile = (file: File) => {
    setLoading(true);
    setError('');
    
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const icsContent = e.target?.result as string;
        const events = parseICS(icsContent);
        const firstMondayWeek = findFirstMondayWeek(events);
        setWeekData(firstMondayWeek);
      } catch (err) {
        setError('Error processing file: ' + (err as Error).message);
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
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const renderWeekView = () => {
    if (!weekData) return null;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dayEvents: CalendarEvent[][] = [[], [], [], [], []];
    
    weekData.events.forEach((event: CalendarEvent) => {
      const eventDate = new Date(event.dtstart);
      
      // Skip invalid dates
      if (isNaN(eventDate.getTime())) {
        console.log('Skipping event with invalid date in render:', event);
        return;
      }
      
      const dayIndex = eventDate.getDay() - 1;
      if (dayIndex >= 0 && dayIndex < 5) {
        dayEvents[dayIndex].push(event);
      }
    });
    
    dayEvents.forEach((dayEventList: CalendarEvent[]) => {
      dayEventList.sort((a: CalendarEvent, b: CalendarEvent) => a.dtstart.getTime() - b.dtstart.getTime());
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="text-blue-400" size={24} />
            <h2 className="text-2xl font-semibold text-white">Weekly Schedule</h2>
          </div>
          <div className="text-sm text-gray-400">
            {formatDate(weekData.monday)} - {formatDate(weekData.friday)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {days.map((day, index) => {
            const dayDate = new Date(weekData.monday);
            dayDate.setDate(weekData.monday.getDate() + index);
            
            return (
              <div key={day} className="bg-gray-800 rounded-lg border border-gray-700">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="font-semibold text-white text-center">{day}</h3>
                  <p className="text-sm text-gray-400 text-center">{dayDate.getDate()} {dayDate.toLocaleDateString('en-US', { month: 'long' })}</p>
                </div>
                
                <div className="p-3 space-y-2 min-h-[400px]">
                  {dayEvents[index].length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                      <p>No events</p>
                    </div>
                  ) : (
                    dayEvents[index].map((event: CalendarEvent, eventIndex: number) => (
                      <div
                        key={eventIndex}
                        className="rounded-lg p-3 text-white text-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                        style={{ backgroundColor: getEventColor(event.summary) }}
                      >
                        <div className="font-medium mb-1 leading-tight">
                          {event.summary}
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs opacity-90 mb-1">
                          <Clock size={12} />
                          <span>{formatTime(event.dtstart)}</span>
                          {event.dtend && !isNaN(new Date(event.dtend).getTime()) && (
                            <>
                              <span> - {formatTime(event.dtend)}</span>
                            </>
                          )}
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center gap-1 text-xs opacity-75">
                            <MapPin size={12} />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 text-white">
              School Planner
            </h1>
            <p className="text-gray-400">Upload your ICS calendar to view your weekly schedule</p>
          </div>

          {/* Upload Section */}
          <div className="mb-8">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                dragOver
                  ? 'border-blue-400 bg-blue-400/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-4">
                <Upload size={48} className="text-gray-400" />
                <div>
                  <p className="text-lg font-medium mb-2">Upload ICS Calendar File</p>
                  <p className="text-gray-400 text-sm mb-4">
                    Drag and drop your .ics file here or click to browse
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 mx-auto"
                  >
                    <FileText size={20} />
                    Choose File
                  </button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".ics"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Processing your calendar...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-400">
                <FileText size={20} />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Week View */}
          {weekData && renderWeekView()}

          {/* Empty State */}
          {!loading && !error && !weekData && (
            <div className="text-center py-16">
              <Calendar size={64} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg">No calendar data loaded yet</p>
              <p className="text-gray-500 text-sm">Upload an ICS file to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CorporateICSScheduleViewer;