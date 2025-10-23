import React, { useMemo, useRef } from 'react';
import { CalendarEvent, isBreakEvent, isEndOfDayEvent } from '../utils/calendarUtils';

interface TodayScheduleTimelineProps {
  eventsWithBreaks: (CalendarEvent & { isBreak?: boolean; isEndOfDay?: boolean })[];
  measuredHeights: number[];
  segments: { startPct: number; endPct: number }[];
  gapBetweenCards: number;
  containerHeight: number;
  nowTs: number;
  selectedScheduleDate: Date | null;
  getEventColour: (title: string) => string;
  showCountdownInTimeline: boolean;
  onCountdownUpdate?: (countdown: { time: string; event: string; type: 'current' | 'next' } | null) => void;
}

const TodayScheduleTimeline: React.FC<TodayScheduleTimelineProps> = ({
  eventsWithBreaks,
  measuredHeights,
  segments,
  gapBetweenCards,
  containerHeight,
  nowTs,
  selectedScheduleDate,
  getEventColour,
  showCountdownInTimeline,
  onCountdownUpdate,
}) => {
  const n = eventsWithBreaks.length;

  const { gradientCSS, progressPctVis } = useMemo(() => {
    if (n === 0) return { gradientCSS: 'none', progressPctVis: 0 };

    // Filter out End of Day events from gradient calculation
    const nonEODIndices = eventsWithBreaks.map((e, i) => isEndOfDayEvent(e) ? -1 : i).filter(i => i >= 0);
    const nGradient = nonEODIndices.length;
    
    if (nGradient === 0) return { gradientCSS: 'none', progressPctVis: 0 };

    const rawHeights = measuredHeights.length === n ? nonEODIndices.map(i => measuredHeights[i]) : new Array(nGradient).fill(64);
    const weightedHeights = rawHeights.map((h, idx) => {
      const i = nonEODIndices[idx];
      const isBreak = isBreakEvent(eventsWithBreaks[i]);
      // Make breaks smaller in the gradient
      return Math.max(isBreak ? 4 : 10, Math.round(h * (isBreak ? 0.35 : 1)));
    });
    const totalHeightEst = weightedHeights.reduce((a, b) => a + b, 0) + gapBetweenCards * Math.max(0, nGradient - 1);

    const colorsArr = nonEODIndices.map(i => {
      const e = eventsWithBreaks[i];
      if (isBreakEvent(e)) return '#94a3b8';
      return getEventColour(e.summary);
    });
    const blendPx = 10;
    
    // Use segments only for non-EOD events
    const gradientSegments = nonEODIndices.map(i => segments[i]).filter(s => s);
    const totalHeightForPct = containerHeight > 0 && gradientSegments.length === nGradient ? containerHeight : totalHeightEst;
    if (totalHeightForPct <= 0) return { gradientCSS: 'none', progressPctVis: 0 };

    const toPct = (px: number) => Math.max(0, Math.min(100, (px / totalHeightForPct) * 100));
    const stops: string[] = [];
    const hasSegments = gradientSegments.length === nGradient && gradientSegments.every(s => Number.isFinite(s.startPct) && Number.isFinite(s.endPct));

    if (hasSegments) {
      const blendPct = toPct(blendPx);
      // Find the last non-EOD event's end position to cap the gradient
      const lastSegment = gradientSegments[nGradient - 1];
      const gradientEndPct = lastSegment.endPct;
      
      for (let idx = 0; idx < nGradient; idx++) {
        const { startPct, endPct } = gradientSegments[idx];
        stops.push(`${colorsArr[idx]} ${startPct}%`);
        if (idx < nGradient - 1) {
          const nextStartPct = gradientSegments[idx + 1].startPct;
          stops.push(`${colorsArr[idx]} ${Math.min(endPct, nextStartPct - blendPct)}%`);
          stops.push(`${colorsArr[idx + 1]} ${Math.max(startPct, nextStartPct)}%`);
        } else {
          // Last event - cap at its end
          stops.push(`${colorsArr[idx]} ${endPct}%`);
          // Fill rest with transparent or last color faded
          if (gradientEndPct < 100) {
            stops.push(`${colorsArr[idx]} ${gradientEndPct}%`);
            stops.push(`transparent ${gradientEndPct}%`);
            stops.push(`transparent 100%`);
          }
        }
      }
    } else {
      // Fallback: estimate positions when segments not available
      let accPx = 0;
      for (let idx = 0; idx < nGradient; idx++) {
        const startPct = toPct(accPx);
        stops.push(`${colorsArr[idx]} ${startPct}%`);
        accPx += weightedHeights[idx];
        const endPct = toPct(accPx);
        if (idx < nGradient - 1) {
          const blendEndPct = toPct(accPx + gapBetweenCards);
          stops.push(`${colorsArr[idx]} ${endPct}%`);
          stops.push(`${colorsArr[idx + 1]} ${blendEndPct}%`);
          accPx += gapBetweenCards;
        } else {
          stops.push(`${colorsArr[idx]} ${endPct}%`);
        }
      }
    }
    const finalGradient = `linear-gradient(to bottom, ${stops.join(', ')})`;

    const times = eventsWithBreaks
      .filter(e => e.dtstart && (e as any).dtend)
      .map(e => ({ start: e.dtstart.getTime(), end: (e.dtend as Date).getTime() }));
    const minStart = times.length ? Math.min(...times.map(t => t.start)) : null;
    const maxEnd = times.length ? Math.max(...times.map(t => t.end)) : null;



    const today = new Date();
    const todayY = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const selectedY = selectedScheduleDate ? new Date(selectedScheduleDate.getFullYear(), selectedScheduleDate.getMonth(), selectedScheduleDate.getDate()).getTime() : null;
    let finalProgress = 0;


    // Handle different days first
    if (selectedY !== null && selectedY !== todayY) {
      if (selectedY < todayY) {
        // Past day - show full progress (100%)
        finalProgress = 100;
      } else {
        // Future day - show no progress (0%)
        finalProgress = 0;
      }
      return { gradientCSS: finalGradient, progressPctVis: finalProgress };
    }

    // Use actual event times for precise progress calculation
    if (minStart !== null && maxEnd !== null && maxEnd > minStart) {
      // Check if we're viewing today and use real-time progress
      const now = new Date(nowTs);

      // Create today's versions of the event times (in case events are from a different date)
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const originalStart = new Date(minStart);
      const originalEnd = new Date(maxEnd);

      // Set today's start and end times using the original times
      todayStart.setHours(originalStart.getHours(), originalStart.getMinutes(), originalStart.getSeconds());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      todayEnd.setHours(originalEnd.getHours(), originalEnd.getMinutes(), originalEnd.getSeconds());

      const todayStartTs = todayStart.getTime();
      const todayEndTs = todayEnd.getTime();


      if (nowTs <= todayStartTs) {
        finalProgress = 0;
      } else if (nowTs >= todayEndTs) {
        finalProgress = 100;
      } else {
        // Calculate progress using actual event times and segments
        if (hasSegments && segments.length === n) {
          // Use the actual segments to find current position
          let currentEventIndex = -1;

          // Find which event we're currently in
          for (let i = 0; i < eventsWithBreaks.length; i++) {
            const event = eventsWithBreaks[i];
            if (event.dtstart && event.dtend) {
              const eventStart = new Date(event.dtstart);
              const eventEnd = new Date(event.dtend);

              // Convert to today's times
              const todayEventStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              todayEventStart.setHours(eventStart.getHours(), eventStart.getMinutes(), eventStart.getSeconds());

              const todayEventEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              todayEventEnd.setHours(eventEnd.getHours(), eventEnd.getMinutes(), eventEnd.getSeconds());

              if (nowTs >= todayEventStart.getTime() && nowTs <= todayEventEnd.getTime()) {
                currentEventIndex = i;
                // Calculate progress within this event
                const eventDuration = todayEventEnd.getTime() - todayEventStart.getTime();
                const progressInEvent = (nowTs - todayEventStart.getTime()) / eventDuration;

                // Map to the segment percentage
                const segment = segments[i];
                finalProgress = segment.startPct + (progressInEvent * (segment.endPct - segment.startPct));
                break;
              }
            }
          }

          // If not in any event, use overall day progress
          if (currentEventIndex === -1) {
            const totalDayDuration = todayEndTs - todayStartTs;
            const currentProgress = nowTs - todayStartTs;
            finalProgress = (currentProgress / totalDayDuration) * 100;
          }
        } else {
          // Fallback to overall day progress
          const totalDayDuration = todayEndTs - todayStartTs;
          const currentProgress = nowTs - todayStartTs;
          finalProgress = (currentProgress / totalDayDuration) * 100;
        }
      }
    } else {
      // Fallback: use simple time calculation
      const now = new Date(nowTs);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      const schoolStartMinutes = 8 * 60 + 44; // 8:44 AM
      const schoolEndMinutes = 15 * 60 + 30; // 3:30 PM

      if (currentTimeInMinutes < schoolStartMinutes) {
        finalProgress = 0;
      } else if (currentTimeInMinutes > schoolEndMinutes) {
        finalProgress = 100;
      } else {
        finalProgress = ((currentTimeInMinutes - schoolStartMinutes) / (schoolEndMinutes - schoolStartMinutes)) * 100;
      }
    }

    return { gradientCSS: finalGradient, progressPctVis: finalProgress };

  }, [eventsWithBreaks, segments, measuredHeights, containerHeight, gapBetweenCards, nowTs, selectedScheduleDate, getEventColour]);


  if (n === 0) {
    return null;
  }


  const countdownInfo = useMemo(() => {
    if (!showCountdownInTimeline) return null;
    
    const now = new Date(nowTs);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Do not show countdown when viewing a different day's schedule
    const selectedY = selectedScheduleDate
      ? new Date(
          selectedScheduleDate.getFullYear(),
          selectedScheduleDate.getMonth(),
          selectedScheduleDate.getDate()
        ).getTime()
      : null;
    const todayY = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    if (selectedY !== null && selectedY !== todayY) return null;

    // Find current and next events
    let currentEvent: any = null;
    let nextEvent: any = null;

    for (let i = 0; i < eventsWithBreaks.length; i++) {
      const event = eventsWithBreaks[i];
      if (!event.dtstart) continue;

      const eventStart = new Date(event.dtstart);
      const todayEventStart = new Date(today);
      todayEventStart.setHours(eventStart.getHours(), eventStart.getMinutes(), eventStart.getSeconds());

      // Some events (End of Day) have no dtend; only consider them for nextEvent, not currentEvent
      const hasEnd = !!event.dtend;
      const todayEventEnd = hasEnd ? new Date(today) : null;
      if (hasEnd && event.dtend) {
        const eventEnd = new Date(event.dtend);
        todayEventEnd!.setHours(eventEnd.getHours(), eventEnd.getMinutes(), eventEnd.getSeconds());
      }

      // Current event requires an end time window
      if (hasEnd && todayEventEnd && nowTs >= todayEventStart.getTime() && nowTs < todayEventEnd.getTime()) {
        currentEvent = { ...event, todayStart: todayEventStart, todayEnd: todayEventEnd };
        break;
      } else if (nowTs < todayEventStart.getTime() && !nextEvent) {
        nextEvent = { ...event, todayStart: todayEventStart, todayEnd: todayEventEnd ?? undefined } as any;
      }
    }

    if (currentEvent) {
      // Find the next event after the current one
      let actualNextEvent: any = null;
      for (let i = 0; i < eventsWithBreaks.length; i++) {
        const event = eventsWithBreaks[i];
        if (!event.dtstart) continue;

        const eventStart = new Date(event.dtstart);
        const todayEventStart = new Date(today);
        todayEventStart.setHours(eventStart.getHours(), eventStart.getMinutes(), eventStart.getSeconds());

        if (todayEventStart.getTime() >= currentEvent.todayEnd.getTime()) {
          let todayEventEnd: Date | undefined = undefined;
          if (event.dtend) {
            const eventEnd = new Date(event.dtend);
            todayEventEnd = new Date(today);
            todayEventEnd.setHours(eventEnd.getHours(), eventEnd.getMinutes(), eventEnd.getSeconds());
          }
          actualNextEvent = { ...event, todayStart: todayEventStart, todayEnd: todayEventEnd } as any;
          break;
        }
      }
      
      // Show time until current event ends, but display NEXT event's name
      const timeLeft = currentEvent.todayEnd.getTime() - nowTs;
      const minutes = Math.floor(timeLeft / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      return {
        time: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        event: actualNextEvent ? actualNextEvent.summary : currentEvent.summary,
        type: 'current' as const,
      };
    } else if (nextEvent) {
      // Show time until next event starts
      const timeLeft = nextEvent.todayStart.getTime() - nowTs;
      const minutes = Math.floor(timeLeft / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      return {
        time: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        event: nextEvent.summary,
        type: 'next' as const,
      };
    }
    return null;
  }, [showCountdownInTimeline, eventsWithBreaks, nowTs]);

  // Notify parent component of countdown updates, but only when the value actually changes
  const lastSentRef = useRef<string>('__init__');
  React.useEffect(() => {
    if (!onCountdownUpdate) return;
    const nextStr = JSON.stringify(countdownInfo ?? null);
    if (lastSentRef.current === nextStr) return; // no change, avoid extra updates
    lastSentRef.current = nextStr;
    onCountdownUpdate(countdownInfo);
    // Intentionally exclude onCountdownUpdate identity from deps to avoid unnecessary repeats.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdownInfo]);

  // Calculate height percentage for progress overlay to preserve rounded corners
  const progressHeightPct = Math.min(100, Math.max(0, progressPctVis));

  // Find the current event color based on progress position
  const currentProgressColor = useMemo(() => {
    // Filter out End of Day events
    const nonEODIndices = eventsWithBreaks.map((e, i) => isEndOfDayEvent(e) ? -1 : i).filter(i => i >= 0);
    
    // Find which event segment contains the current progress
    for (let idx = 0; idx < nonEODIndices.length; idx++) {
      const i = nonEODIndices[idx];
      const segment = segments[i];
      if (segment && progressPctVis >= segment.startPct && progressPctVis <= segment.endPct) {
        const e = eventsWithBreaks[i];
        if (isBreakEvent(e)) return '#94a3b8'; // Gray for breaks
        return getEventColour(e.summary);
      }
    }
    
    // Fallback: if we're between segments (in gaps), find the nearest event
    for (let idx = 0; idx < nonEODIndices.length - 1; idx++) {
      const i = nonEODIndices[idx];
      const nextI = nonEODIndices[idx + 1];
      const segment = segments[i];
      const nextSegment = segments[nextI];
      
      if (segment && nextSegment && progressPctVis > segment.endPct && progressPctVis < nextSegment.startPct) {
        // We're in a gap - use the next event's color
        const nextE = eventsWithBreaks[nextI];
        if (isBreakEvent(nextE)) return '#94a3b8';
        return getEventColour(nextE.summary);
      }
    }
    
    // Default fallback
    return '#3b82f6';
  }, [progressPctVis, eventsWithBreaks, segments, getEventColour]);

  return (
    <>
      {/* Container controls rounding; children are square and clipped inside to avoid top/bottom gaps */}
      {/* Only spans the height of the event cards, not the "Now" heading or "Show All" button */}
      <div
        className="absolute left-3 w-[10px] rounded-full overflow-hidden pointer-events-none"
        style={{ top: 0, height: '100%' }}
      >
        {/* Base translucent gradient - always visible */}
        <div
          className="absolute inset-0 z-0"
          style={{
            opacity: 0.3,
            background: gradientCSS === 'none' ? 'linear-gradient(to bottom, #3b82f6, #ef4444, #10b981)' : gradientCSS
          }}
        />
        {/* Progress overlay: single color matching current event */}
        <div
          className="absolute top-0 left-0 right-0 z-[1] rounded-full"
          style={{
            height: `${progressHeightPct}%`,
            opacity: 1,
            background: currentProgressColor,
            transition: 'height 220ms ease-out, background 220ms ease-out',
            willChange: 'height',
          }}
        />
        {/* Curved end cap for the progress line */}
        {progressPctVis > 0 && progressPctVis < 100 && (
          <div
            className="absolute left-0 w-[10px] h-[5px] z-[2] rounded-full"
            style={{
              top: `${progressPctVis}%`,
              transform: 'translateY(-50%)',
              background: 'linear-gradient(to right, transparent 0%, currentColor 50%, transparent 100%)',
              color: currentProgressColor,
              opacity: 0.8,
              transition: 'top 220ms ease-out, color 220ms ease-out',
              willChange: 'top',
            }}
          />
        )}
      </div>
      

    </>
  );
};

export default TodayScheduleTimeline;
