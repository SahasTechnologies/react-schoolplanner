import React, { useMemo } from 'react';
import { CalendarEvent, isBreakEvent } from '../utils/calendarUtils';

interface TodayScheduleTimelineProps {
  eventsWithBreaks: (CalendarEvent & { isBreak?: boolean })[];
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
    console.log('TodayScheduleTimeline: n =', n, 'eventsWithBreaks =', eventsWithBreaks);
    if (n === 0) return { gradientCSS: 'none', progressPctVis: 0 };

    const rawHeights = measuredHeights.length === n ? measuredHeights : new Array(n).fill(64);
    const weightedHeights = rawHeights.map((h, i) => {
      const isBreak = isBreakEvent(eventsWithBreaks[i]);
      return Math.max(isBreak ? 4 : 10, Math.round(h * (isBreak ? 0.35 : 1)));
    });
    const totalHeightEst = weightedHeights.reduce((a, b) => a + b, 0) + gapBetweenCards * Math.max(0, n - 1);

    const colorsArr = eventsWithBreaks.map(e => isBreakEvent(e) ? '#94a3b8' : getEventColour(e.summary));
    const blendPx = 10;
    const totalHeightForPct = containerHeight > 0 && segments.length === n ? containerHeight : totalHeightEst;
    if (totalHeightForPct <= 0) return { gradientCSS: 'none', progressPctVis: 0 };

    const toPct = (px: number) => Math.max(0, Math.min(100, (px / totalHeightForPct) * 100));
    const stops: string[] = [];
    const hasSegments = segments.length === n && segments.every(s => Number.isFinite(s.startPct) && Number.isFinite(s.endPct));

    if (hasSegments) {
      const blendPct = toPct(blendPx);
      for (let i = 0; i < n; i++) {
        const { startPct, endPct } = segments[i];
        stops.push(`${colorsArr[i]} ${startPct}%`);
        if (i < n - 1) {
          const nextStartPct = segments[i + 1].startPct;
          stops.push(`${colorsArr[i]} ${Math.min(endPct, nextStartPct - blendPct)}%`);
          stops.push(`${colorsArr[i + 1]} ${Math.max(startPct, nextStartPct)}%`);
        } else {
          stops.push(`${colorsArr[i]} ${endPct}%`);
        }
      }
    } else {
      let accPx = 0;
      for (let i = 0; i < n; i++) {
        const startPct = toPct(accPx);
        stops.push(`${colorsArr[i]} ${startPct}%`);
        accPx += weightedHeights[i];
        const endPct = toPct(accPx);
        if (i < n - 1) {
          const blendEndPct = toPct(accPx + gapBetweenCards);
          stops.push(`${colorsArr[i]} ${endPct}%`);
          stops.push(`${colorsArr[i + 1]} ${blendEndPct}%`);
          accPx += gapBetweenCards;
        } else {
          stops.push(`${colorsArr[i]} ${endPct}%`);
        }
      }
    }
    const finalGradient = `linear-gradient(to bottom, ${stops.join(', ')})`;

    const times = eventsWithBreaks
      .filter(e => e.dtstart && (e as any).dtend)
      .map(e => ({ start: e.dtstart.getTime(), end: (e.dtend as Date).getTime() }));
    const minStart = times.length ? Math.min(...times.map(t => t.start)) : null;
    const maxEnd = times.length ? Math.max(...times.map(t => t.end)) : null;

    console.log('TodayScheduleTimeline: times =', times.map(t => ({
      start: new Date(t.start).toLocaleString(),
      end: new Date(t.end).toLocaleString()
    })));
    console.log('TodayScheduleTimeline: minStart =', minStart ? new Date(minStart).toLocaleString() : null);
    console.log('TodayScheduleTimeline: maxEnd =', maxEnd ? new Date(maxEnd).toLocaleString() : null);
    console.log('TodayScheduleTimeline: nowTs =', new Date(nowTs).toLocaleString());

    let progressPct = 0;
    if (minStart !== null && maxEnd !== null && maxEnd > minStart) {
      const pct = ((nowTs - minStart) / (maxEnd - minStart)) * 100;
      progressPct = Math.max(0, Math.min(100, pct));
      console.log('TodayScheduleTimeline: calculated progressPct =', pct, 'clamped =', progressPct);
    }

    const today = new Date();
    const todayY = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const selectedY = selectedScheduleDate ? new Date(selectedScheduleDate.getFullYear(), selectedScheduleDate.getMonth(), selectedScheduleDate.getDate()).getTime() : null;
    const isViewingToday = selectedY !== null && selectedY === todayY;
    let finalProgress = 0;

    console.log('TodayScheduleTimeline: isViewingToday =', isViewingToday, 'minStart =', minStart, 'maxEnd =', maxEnd, 'nowTs =', nowTs, 'progressPct =', progressPct);
    console.log('TodayScheduleTimeline: today =', today, 'todayY =', todayY, 'selectedY =', selectedY, 'selectedScheduleDate =', selectedScheduleDate);

    // Handle different days first
    if (selectedY !== null && selectedY !== todayY) {
      if (selectedY < todayY) {
        // Past day - show full progress (100%)
        finalProgress = 100;
        console.log('TodayScheduleTimeline: Past day detected, showing 100% progress');
      } else {
        // Future day - show no progress (0%)
        finalProgress = 0;
        console.log('TodayScheduleTimeline: Future day detected, showing 0% progress');
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

      console.log('TodayScheduleTimeline: todayStart =', todayStart.toLocaleTimeString());
      console.log('TodayScheduleTimeline: todayEnd =', todayEnd.toLocaleTimeString());
      console.log('TodayScheduleTimeline: currentTime =', now.toLocaleTimeString());
      console.log('TodayScheduleTimeline: nowTs =', nowTs, 'todayStartTs =', todayStartTs, 'todayEndTs =', todayEndTs);
      console.log('TodayScheduleTimeline: time difference =', (nowTs - todayStartTs) / (1000 * 60), 'minutes into day');
      console.log('TodayScheduleTimeline: total day length =', (todayEndTs - todayStartTs) / (1000 * 60), 'minutes');

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

    console.log('TodayScheduleTimeline: calculated finalProgress =', finalProgress);

    console.log('TodayScheduleTimeline: finalProgress =', finalProgress);
    return { gradientCSS: finalGradient, progressPctVis: finalProgress };

  }, [eventsWithBreaks, segments, measuredHeights, containerHeight, gapBetweenCards, nowTs, selectedScheduleDate, getEventColour]);

  console.log('TodayScheduleTimeline render: n =', n, 'progressPctVis =', progressPctVis, 'gradientCSS =', gradientCSS);

  if (n === 0) {
    console.log('TodayScheduleTimeline: No events, returning null');
    return null;
  }

  // Calculate countdown to next event
  const getCountdownInfo = (): { time: string; event: string; type: 'current' | 'next' } | null => {
    const now = new Date(nowTs);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Find current and next events
    let currentEvent = null;
    let nextEvent = null;
    
    for (let i = 0; i < eventsWithBreaks.length; i++) {
      const event = eventsWithBreaks[i];
      if (!event.dtstart || !event.dtend || isBreakEvent(event)) continue;
      
      const eventStart = new Date(event.dtstart);
      const eventEnd = new Date(event.dtend);
      
      // Convert to today's times
      const todayEventStart = new Date(today);
      todayEventStart.setHours(eventStart.getHours(), eventStart.getMinutes(), eventStart.getSeconds());
      
      const todayEventEnd = new Date(today);
      todayEventEnd.setHours(eventEnd.getHours(), eventEnd.getMinutes(), eventEnd.getSeconds());
      
      if (nowTs >= todayEventStart.getTime() && nowTs <= todayEventEnd.getTime()) {
        currentEvent = { ...event, todayStart: todayEventStart, todayEnd: todayEventEnd };
      } else if (nowTs < todayEventStart.getTime() && !nextEvent) {
        nextEvent = { ...event, todayStart: todayEventStart, todayEnd: todayEventEnd };
      }
    }
    
    if (currentEvent) {
      // Show time until current event ends
      const timeLeft = currentEvent.todayEnd.getTime() - nowTs;
      const minutes = Math.floor(timeLeft / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      return {
        time: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        event: currentEvent.summary,
        type: 'current' as const
      };
    } else if (nextEvent) {
      // Show time until next event starts
      const timeLeft = nextEvent.todayStart.getTime() - nowTs;
      const minutes = Math.floor(timeLeft / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      return {
        time: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        event: nextEvent.summary,
        type: 'next' as const
      };
    }
    
    return null;
  };

  const countdownInfo = showCountdownInTimeline ? getCountdownInfo() : null;
  
  // Notify parent component of countdown updates
  React.useEffect(() => {
    if (onCountdownUpdate) {
      onCountdownUpdate(countdownInfo);
    }
  }, [countdownInfo, onCountdownUpdate]);

  // Compute a stable clip-path so the overlay fills from top downward.
  // Add a small fudge on top when progress > 0 and at 100% on both edges to remove any visible caps.
  const clipBottomPct = Math.max(0, 100 - progressPctVis);
  let clipPathStr: string;
  if (progressPctVis >= 99.9) {
    // Slightly overfill both top and bottom
    clipPathStr = 'inset(-1px 0 -1px 0)';
  } else if (progressPctVis <= 0.0001) {
    // Fully hidden
    clipPathStr = 'inset(0 0 100% 0)';
  } else {
    // Slightly overfill the top edge while clipping the bottom by percentage
    clipPathStr = `inset(-1px 0 ${clipBottomPct}% 0)`;
  }

  return (
    <>
      {/* Container controls rounding; children are square and clipped inside to avoid top/bottom gaps */}
      <div
        className="absolute left-3 top-0 bottom-0 w-[10px] rounded-full overflow-hidden"
        style={{ pointerEvents: 'none' }}
      >
        {/* Base translucent gradient - always visible */}
        <div
          className="absolute inset-0 z-0"
          style={{
            opacity: 0.3,
            background: gradientCSS === 'none' ? 'linear-gradient(to bottom, #3b82f6, #ef4444, #10b981)' : gradientCSS
          }}
        />
        {/* Progress overlay: full-opacity gradient clipped by day progress */}
        <div
          className="absolute inset-0 z-[1] rounded-full"
          style={{
            opacity: 1,
            background: gradientCSS === 'none' ? 'linear-gradient(to bottom, #3b82f6, #ef4444, #10b981)' : gradientCSS,
            clipPath: clipPathStr,
            transition: 'clip-path 220ms ease-out',
            willChange: 'clip-path',
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
              color: (() => {
                // Get the color at the current progress point from the gradient
                const gradientMatch = gradientCSS.match(/linear-gradient\(to bottom, (.+)\)/);
                if (gradientMatch) {
                  const stops = gradientMatch[1].split(', ');
                  // Find the color at the current progress percentage
                  for (const stop of stops) {
                    const match = stop.match(/(.+?)\s+(\d+(?:\.\d+)?)%/);
                    if (match) {
                      const color = match[1].trim();
                      const percentage = parseFloat(match[2]);
                      if (percentage >= progressPctVis) {
                        return color;
                      }
                    }
                  }
                }
                return '#ffffff';
              })(),
              opacity: 0.8,
              transition: 'top 220ms ease-out',
              willChange: 'top',
            }}
          />
        )}
      </div>
      

    </>
  );
};

export default TodayScheduleTimeline;
