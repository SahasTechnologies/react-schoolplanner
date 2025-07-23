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

// Helper to convert hex color to rgba with alpha
export function hexToRgba(hex: string, alpha: number) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

export const parseICS = (icsContent: string): CalendarEvent[] => {
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
      if (currentEvent.dtstart && currentEvent.summary) { // dtend is optional
        const baseEvent = currentEvent as CalendarEvent & { rrule?: string };

        // Helper to clone an event with a date offset
        const cloneWithOffset = (offsetDays: number) => {
          const newStart = new Date(baseEvent.dtstart);
          newStart.setDate(newStart.getDate() + offsetDays);
          let newEnd: Date | undefined = undefined;
          if (baseEvent.dtend) {
            newEnd = new Date(baseEvent.dtend);
            newEnd.setDate(newEnd.getDate() + offsetDays);
          }
          return {
            dtstart: newStart,
            dtend: newEnd,
            summary: baseEvent.summary,
            location: baseEvent.location,
            description: baseEvent.description,
          } as CalendarEvent;
        };

        // Always add the original event first
        events.push({
          dtstart: baseEvent.dtstart,
          dtend: baseEvent.dtend,
          summary: baseEvent.summary,
          location: baseEvent.location,
          description: baseEvent.description,
        });

        // Expand RRULE with BYDAY if present (simple weekly expansion within the same week)
        if (baseEvent.rrule && baseEvent.rrule.includes('BYDAY=')) {
          // Extract BYDAY list
          const match = baseEvent.rrule.match(/BYDAY=([^;]+)/);
          if (match) {
            const byDays = match[1].split(',');
            const dayMap: Record<string, number> = {
              SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
            };
            const baseDay = baseEvent.dtstart.getDay();
            byDays.forEach(symbol => {
              const targetDay = dayMap[symbol.trim().toUpperCase()];
              if (targetDay === undefined) return; // Unknown symbol
              let offset = targetDay - baseDay;
              if (offset < 0) offset += 7; // Handle wrap-around to later in the same week
              if (offset === 0) return; // Skip the original day (already added)

              events.push(cloneWithOffset(offset));
            });
          }
        }

        console.log('Added event(s):', baseEvent.summary);
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
      } else if (key.startsWith('RRULE')) {
        // Capture the full RRULE string (everything after the colon)
        (currentEvent as any).rrule = value;
      }
    }
  }

  console.log('Total events parsed:', events.length);
  return events;
};

export const parseDateTime = (dateStr: string): Date => {
  // console.log('Parsing datetime:', dateStr); // Commented out to reduce console noise

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
    // console.log('Parsed date (YYYYMMDD):', date); // Commented out
    return date;
  } else if (cleanDateStr.length >= 15) { // Handle YYYYMMDDTHHMMSS and longer with TZID
    // YYYYMMDDTHHMMSS format
    const year = parseInt(cleanDateStr.substring(0, 4));
    const month = parseInt(cleanDateStr.substring(4, 6)) - 1;
    const day = parseInt(cleanDateStr.substring(6, 8));
    const hour = parseInt(cleanDateStr.substring(9, 11));
    const minute = parseInt(cleanDateStr.substring(11, 13));
    const second = parseInt(cleanDateStr.substring(13, 15) || '0'); // Seconds might be optional

    const date = isUTC ?
      new Date(Date.UTC(year, month, day, hour, minute, second)) :
      new Date(year, month, day, hour, minute, second);
    // console.log('Parsed datetime:', date, isUTC ? '(UTC)' : '(local)'); // Commented out
    return date;
  } else {
    // Try to parse as-is
    const date = new Date(cleanDateStr);
    // console.log('Parsed datetime (fallback):', date); // Commented out
    return date;
  }
};

// Helper to get the Monday of a given date's week (use UTC)
export const getMonday = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay(); // Use local time
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Groups all events into their actual Monday-Friday weeks
export const groupAllEventsIntoActualWeeks = (allEvents: CalendarEvent[]): WeekData[] => {
  const weeksMap = new Map<string, CalendarEvent[]>(); // Key: 'YYYY-MM-DD' (Monday's date)

  allEvents.forEach(event => {
    const eventDate = new Date(event.dtstart);
    if (isNaN(eventDate.getTime())) {
      console.warn('Skipping event with invalid date:', event);
      return;
    }

    const mondayOfWeek = getMonday(eventDate);
    // Use local date for key
    const mondayKey = mondayOfWeek.getFullYear() + '-' + String(mondayOfWeek.getMonth() + 1).padStart(2, '0') + '-' + String(mondayOfWeek.getDate()).padStart(2, '0');

    if (!weeksMap.has(mondayKey)) {
      weeksMap.set(mondayKey, []);
    }
    weeksMap.get(mondayKey)?.push(event);
  });

  const actualWeeks: WeekData[] = [];
  const sortedMondayKeys = Array.from(weeksMap.keys()).sort();

  sortedMondayKeys.forEach(mondayKey => {
    const mondayDate = new Date(mondayKey);
    // Use local time for week range
    const localMonday = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate(), 0, 0, 0, 0);
    // Calculate localFriday as the same week Friday at 23:59:59.999
    const localFriday = new Date(localMonday);
    localFriday.setDate(localMonday.getDate() + 4);
    localFriday.setHours(23, 59, 59, 999);

    const eventsInThisWeek = weeksMap.get(mondayKey) || [];
    // Filter to only include events within the Mon-Fri range for this specific week (local time)
    const filteredEvents = eventsInThisWeek.filter(event => {
      const eventDtstart = new Date(event.dtstart);
      return eventDtstart.getTime() >= localMonday.getTime() && eventDtstart.getTime() <= localFriday.getTime();
    });

    // Only add weeks that have at least one event
    if (filteredEvents.length > 0) {
      actualWeeks.push({
        monday: localMonday,
        friday: localFriday,
        events: filteredEvents
      });
    }
  });

  return actualWeeks;
};

// Helper to insert break events between events with >1min gap
export function insertBreaksBetweenEvents(events: CalendarEvent[]): (CalendarEvent & { isBreak?: boolean })[] {
  if (!events || events.length === 0) return [];
  const result: (CalendarEvent & { isBreak?: boolean })[] = [];
  for (let i = 0; i < events.length; i++) {
    result.push(events[i]);
    if (i < events.length - 1) {
      // Always use a Date, fallback to dtstart if dtend is undefined
      const currEnd = events[i].dtend ? new Date(events[i].dtend as Date) : new Date(events[i].dtstart);
      const nextStart = new Date(events[i + 1].dtstart);
      const gapMs = nextStart.getTime() - currEnd.getTime();
      if (gapMs > 60 * 1000) {
        result.push({
          dtstart: new Date(currEnd.getTime() + 1),
          dtend: new Date(nextStart.getTime() - 1),
          summary: 'Break',
          isBreak: true,
        });
      }
    }
  }
  return result;
}

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// Helper to get events for today or next day with events (if today's events are over)
export function getTodayOrNextEvents(weekData: WeekData | null): { dayLabel: string, events: CalendarEvent[] } {
  if (!weekData) return { dayLabel: '', events: [] };
  const now = new Date();
  console.log('Current time:', now.toLocaleString());
  
  // Get local day index (0=Sunday, 1=Monday, ..., 6=Saturday)
  let dayIdx = now.getDay();
  // Only consider Mon-Fri (1-5)
  const isWeekday = (d: number) => d >= 1 && d <= 5;
  // Build a map: dayIdx (1-5) -> events[]
  const dayEvents: CalendarEvent[][] = [[], [], [], [], []];
  
  // Helper to check if a date is today
  const isToday = (date: Date) => {
    return date.getDate() === now.getDate() &&
           date.getMonth() === now.getMonth() &&
           date.getFullYear() === now.getFullYear();
  };
  
  weekData.events.forEach((event: CalendarEvent) => {
    const eventDate = new Date(event.dtstart);
    // Only add events that are today or in the future
    if (eventDate >= now || isToday(eventDate)) {
      const eventDay = eventDate.getDay();
      if (eventDay >= 1 && eventDay <= 5) {
        dayEvents[eventDay - 1].push(event);
      }
    }
  });
  
  // Sort events for each day
  dayEvents.forEach(list => list.sort((a, b) => new Date(a.dtstart).getTime() - new Date(b.dtstart).getTime()));
  
  // Check today first if it's a weekday
  if (isWeekday(dayIdx)) {
    const todayEvents = dayEvents[dayIdx - 1].filter(event => isToday(new Date(event.dtstart)));
    if (todayEvents.length > 0) {
      // Check if all today's events are over
      const allEventsOver = todayEvents.every(event => {
        // Ensure we're working with Date objects
        const endTime = event.dtend ? new Date(event.dtend) : new Date(new Date(event.dtstart).getTime() + 3600000); // Default 1 hour if no end time
        const isOver = endTime.getTime() < now.getTime();
        console.log('Event:', event.summary, 'End time:', endTime.toLocaleString(), 'Is over?', isOver);
        return isOver;
      });
      
      console.log('All events over?', allEventsOver);
      
      if (!allEventsOver) {
        // Still have events today that haven't ended
        return { dayLabel: 'Today', events: todayEvents };
      }
      
      console.log('All today\'s events are over, looking for next day');
    }
  }
  
  // If today's events are over or there are none, show next day with events
  // Start from tomorrow's index
  const tomorrowIdx = dayIdx % 5;
  for (let i = 0; i < 5; i++) {
    const nextIdx = (tomorrowIdx + i) % 5;
    if (dayEvents[nextIdx].length > 0) {
      // Get the actual day name
      const nextDate = new Date(dayEvents[nextIdx][0].dtstart);
      const isNextDayTomorrow = nextDate.getDate() === now.getDate() + 1 &&
                               nextDate.getMonth() === now.getMonth() &&
                               nextDate.getFullYear() === now.getFullYear();
      
      const label = isNextDayTomorrow ? 'Tomorrow' : ['Monday','Tuesday','Wednesday','Thursday','Friday'][nextIdx];
      console.log('Found next day with events:', label);
      return { dayLabel: `${label}'s Schedule`, events: dayEvents[nextIdx] };
    }
  }
  
  // Fallback: no events
  console.log('No events found for any day');
  return { dayLabel: '', events: [] };
}

// Add a type guard for isBreak
export function isBreakEvent(event: CalendarEvent | (CalendarEvent & { isBreak?: boolean })): event is CalendarEvent & { isBreak: true } {
  return (event as any).isBreak === true;
} 

// Returns the next upcoming event (not a break) from weekData.events, or null if none
export function getNextUpcomingEvent(weekData: WeekData | null): CalendarEvent | null {
if (!weekData || !weekData.events || weekData.events.length === 0) return null;
const now = new Date();
// Only consider events that are not breaks and start after now
const upcoming = weekData.events
  .filter(e => !isBreakEvent(e) && new Date(e.dtstart) > now)
  .sort((a, b) => new Date(a.dtstart).getTime() - new Date(b.dtstart).getTime());
return upcoming.length > 0 ? upcoming[0] : null;
} 