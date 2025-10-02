import { CalendarEvent, insertBreaksBetweenEvents, isBreakEvent } from './calendarUtils';

/**
 * Get next occurrence of an event after now, treating week as repeating
 */
export function getNextOccurrence(event: CalendarEvent, now: Date): Date {
  const eventDay = event.dtstart.getDay(); // 0=Sun, 1=Mon, ...
  const eventHour = event.dtstart.getHours();
  const eventMinute = event.dtstart.getMinutes();
  const eventSecond = event.dtstart.getSeconds();
  let daysUntil = eventDay - now.getDay();
  if (
    daysUntil < 0 ||
    (daysUntil === 0 && (
      eventHour < now.getHours() ||
      (eventHour === now.getHours() && eventMinute < now.getMinutes()) ||
      (eventHour === now.getHours() && eventMinute === now.getMinutes() && eventSecond <= now.getSeconds())
    ))
  ) {
    daysUntil += 7;
  }
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntil);
  next.setHours(eventHour, eventMinute, eventSecond, 0);
  return next;
}

/**
 * Find the next event (including breaks and End of Day) in repeating weekly schedule
 * Returns current ongoing event if it hasn't ended, next upcoming event today, or next school day's first event
 * Handles Friday -> Monday and weekend -> Monday transitions
 */
export function findNextRepeatingEvent(
  now: Date,
  events: CalendarEvent[]
): { event: CalendarEvent; date: Date } | null {
  if (!events || events.length === 0) return null;

  const eventsWithBreaks = insertBreaksBetweenEvents(events);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayDow = now.getDay();

  // Only today's events (keep order by time)
  const todaysEvents = eventsWithBreaks
    .filter(e => e.dtstart.getDay() === todayDow)
    .map(e => {
      const start = new Date(today);
      start.setHours(e.dtstart.getHours(), e.dtstart.getMinutes(), e.dtstart.getSeconds(), 0);
      const end = e.dtend
        ? new Date(new Date(today).setHours(e.dtend.getHours(), e.dtend.getMinutes(), e.dtend.getSeconds(), 0))
        : null; // End of Day has no end
      return { event: e, start, end };
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  // 1) If currently in an event with an end, countdown to its end but label with the next event (incl. breaks/EOD)
  if (todaysEvents.length > 0) {
    const current = todaysEvents.find(e => e.end && now.getTime() >= e.start.getTime() && now.getTime() < e.end.getTime());
    if (current) {
      const next = todaysEvents.find(e => e.start.getTime() >= (current.end as Date).getTime());
      const labelEvent = next ? next.event : current.event;
      return { event: labelEvent, date: current.end as Date };
    }

    // 2) Otherwise, countdown to the next upcoming event's start (incl. breaks/EOD)
    const upcoming = todaysEvents.find(e => now.getTime() < e.start.getTime());
    if (upcoming) {
      return { event: upcoming.event, date: upcoming.start };
    }
  }

  // 3) All of today's events are over (or no events today), find next school day's first event
  // Calculate next school day (skip weekends)
  let nextDayOffset = 1;
  let nextDow = (todayDow + nextDayOffset) % 7;
  
  // Handle Friday (5) -> Monday (1), Saturday (6) -> Monday (1), Sunday (0) -> Monday (1)
  if (todayDow === 5) {
    // Friday -> Monday
    nextDayOffset = 3;
    nextDow = 1;
  } else if (todayDow === 6) {
    // Saturday -> Monday
    nextDayOffset = 2;
    nextDow = 1;
  } else if (todayDow === 0) {
    // Sunday -> Monday
    nextDayOffset = 1;
    nextDow = 1;
  }
  
  // Get next day's events
  const nextDayEvents = eventsWithBreaks
    .filter(e => e.dtstart.getDay() === nextDow)
    .map(e => {
      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() + nextDayOffset);
      const start = new Date(nextDay);
      start.setHours(e.dtstart.getHours(), e.dtstart.getMinutes(), e.dtstart.getSeconds(), 0);
      return { event: e, start };
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  
  if (nextDayEvents.length > 0) {
    // Return the first event of the next school day
    return { event: nextDayEvents[0].event, date: nextDayEvents[0].start };
  }

  return null;
}

/**
 * Find the next NON-break event (skip breaks) in repeating weekly schedule
 * @deprecated Use findNextRepeatingEvent instead to include breaks
 */
export function findNextNonBreakRepeatingEvent(
  now: Date,
  events: CalendarEvent[]
): { event: CalendarEvent; date: Date } | null {
  if (!events || events.length === 0) return null;

  const eventsWithBreaks = insertBreaksBetweenEvents(events);
  const nexts = eventsWithBreaks
    .filter((e: CalendarEvent & { isBreak?: boolean }) => !isBreakEvent(e))
    .map((e: CalendarEvent & { isBreak?: boolean }) => ({
      event: e,
      date: getNextOccurrence(e, now)
    }));

  const soonest = nexts.reduce((min, curr) => (min === null || curr.date < min.date ? curr : min), null as { event: CalendarEvent; date: Date } | null);
  return soonest;
}

/**
 * Find events based on toggle state (today or next day)
 */
export function findEventsByDayToggle(
  now: Date,
  forceNextDay: boolean,
  events: CalendarEvent[]
): { event: CalendarEvent; date: Date } | null {
  if (!events || events.length === 0) return null;

  const eventsWithBreaks = insertBreaksBetweenEvents(events);
  const currentDay = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  const targetDate = new Date(now);

  if (forceNextDay) {
    // Show next "school day" events (skip weekends appropriately)
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
  }
  // If not forceNextDay, use current date (today)

  // Find events for the target date
  const targetDayOfWeek = targetDate.getDay();
  const dayEvents = eventsWithBreaks.filter(event => {
    const eventDay = event.dtstart.getDay();
    return eventDay === targetDayOfWeek;
  });

  if (dayEvents.length === 0) return null;

  // Sort events by time and find the next one
  const sortedEvents = dayEvents.sort((a, b) => {
    const aTime = a.dtstart.getHours() * 60 + a.dtstart.getMinutes();
    const bTime = b.dtstart.getHours() * 60 + b.dtstart.getMinutes();
    return aTime - bTime;
  });

  // If showing today's events, find next event after current time
  if (!forceNextDay) {
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const upcomingEvent = sortedEvents.find(event => {
      const eventTime = event.dtstart.getHours() * 60 + event.dtstart.getMinutes();
      return eventTime > currentTime;
    });

    if (upcomingEvent) {
      const eventDate = new Date(targetDate);
      eventDate.setHours(upcomingEvent.dtstart.getHours(), upcomingEvent.dtstart.getMinutes(), upcomingEvent.dtstart.getSeconds(), 0);
      return { event: upcomingEvent, date: eventDate };
    }
  } else {
    // For next day, show first event of the day
    const firstEvent = sortedEvents[0];
    const eventDate = new Date(targetDate);
    eventDate.setHours(firstEvent.dtstart.getHours(), firstEvent.dtstart.getMinutes(), firstEvent.dtstart.getSeconds(), 0);
    return { event: firstEvent, date: eventDate };
  }

  return null;
}
