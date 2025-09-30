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
 * Find the next NON-break event (skip breaks) in repeating weekly schedule
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
      // Saturday -> previous Friday
      targetDate.setDate(now.getDate() - 1);
    } else if (currentDay === 0) {
      // Sunday -> previous Friday
      targetDate.setDate(now.getDate() - 2);
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
