import React, { useMemo } from 'react';
import { CalendarEvent, isBreakEvent } from '../utils/calendarUtils';

interface TodayScheduleTimelineProps {
  eventsWithBreaks: (CalendarEvent & { isBreak?: boolean })[];
  measuredHeights: number[];
  segments: { startPct: number; endPct: number }[];
  gapBetweenCards: number;
  containerHeight: number;
  hoveredIndex: number | null;
  nowTs: number;
  selectedScheduleDate: Date | null;
  getEventColour: (title: string) => string;
}

const TodayScheduleTimeline: React.FC<TodayScheduleTimelineProps> = ({
  eventsWithBreaks,
  measuredHeights,
  segments,
  gapBetweenCards,
  containerHeight,
  hoveredIndex,
  nowTs,
  selectedScheduleDate,
  getEventColour,
}) => {
  const n = eventsWithBreaks.length;

  const { gradientCSS, progressPctVis } = useMemo(() => {
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
          const nextStartPct = segments[i+1].startPct;
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
          stops.push(`${colorsArr[i+1]} ${blendEndPct}%`);
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
    let progressPct = 0;
    if (minStart !== null && maxEnd !== null && maxEnd > minStart) {
      const pct = ((nowTs - minStart) / (maxEnd - minStart)) * 100;
      progressPct = Math.max(0, Math.min(100, pct));
    }

    const today = new Date();
    const todayY = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const selectedY = selectedScheduleDate ? new Date(selectedScheduleDate.getFullYear(), selectedScheduleDate.getMonth(), selectedScheduleDate.getDate()).getTime() : null;
    const isViewingToday = selectedY !== null && selectedY === todayY;
    const isInActiveWindow = isViewingToday && minStart !== null && maxEnd !== null && nowTs >= minStart && nowTs <= maxEnd;
    const finalProgress = isInActiveWindow ? progressPct : 0;

    return { gradientCSS: finalGradient, progressPctVis: finalProgress };

  }, [eventsWithBreaks, segments, measuredHeights, containerHeight, gapBetweenCards, nowTs, selectedScheduleDate, getEventColour]);

  if (n === 0) return null;

  return (
    <>
      {/* Base translucent gradient */}
      <div
        className="absolute left-3 top-0 bottom-0 rounded-full transition-all duration-300 z-0"
        style={{ width: 10, pointerEvents: 'none', opacity: 0.35, background: gradientCSS }}
      />
      {/* Progress overlay: full-opacity gradient clipped by day progress */}
      <div
        className="absolute left-3 top-0 bottom-0 rounded-full transition-all duration-300 z-[1]"
        style={{
          width: 10,
          pointerEvents: 'none',
          opacity: 1,
          background: gradientCSS,
          clipPath: `inset(-1px 0 ${100 - progressPctVis}% 0)`,
        }}
      />
      {/* Hover overlay: emphasize hovered card region and expand with card height */}
      {hoveredIndex !== null && segments.length === n && segments[hoveredIndex] && (
        <div
          className="absolute top-0 left-[10px] w-[6px] h-full transition-all duration-300 ease-in-out"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            clipPath: `inset(${segments[hoveredIndex].startPct - 0.1}% 0 ${100 - segments[hoveredIndex].endPct - 0.1}% 0)`,
          }}
        />
      )}
    </>
  );
};

export default TodayScheduleTimeline;
