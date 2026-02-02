// NSW School Term utilities: fetch, cache, and parse term dates from nswschoolholiday.com.au
import { fetchTextViaCors } from './corsProxy';

export type NswDivision = 'eastern' | 'western';

export interface NswTermRange {
  term: 1 | 2 | 3 | 4;
  start: string; // ISO string (local midnight)
  end: string;   // ISO string (local 23:59:59.999)
}

export interface NswTermsByDivision {
  year: number;
  eastern: NswTermRange[];
  western: NswTermRange[];
}

const CACHE_KEY_PREFIX = 'nswTerms_'; // nswTerms_<year>

function toISODateOnly(d: Date): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  return x.toISOString();
}

function endOfDayISO(d: Date): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return x.toISOString();
}

function parseTablepressTerms(html: string, year: number): NswTermsByDivision | null {
  const results: NswTermsByDivision = { year, eastern: [], western: [] };

  const pushTerm = (division: NswDivision, term: number, startStr: string, endStr: string) => {
    const start = parseAuLongDate(startStr);
    const end = parseAuLongDate(endStr);
    if (!start || !end) return;
    const termRange: NswTermRange = {
      term: term as 1 | 2 | 3 | 4,
      start: toISODateOnly(start),
      end: endOfDayISO(end)
    };
    results[division].push(termRange);
  };

  try {
    const container = document.createElement('div');
    container.innerHTML = html;

    // TablePress tables usually have id="tablepress-<year>"
    const table =
      (container.querySelector(`#tablepress-${year}`) as HTMLTableElement | null) ||
      (container.querySelector('table.tablepress') as HTMLTableElement | null) ||
      (container.querySelector('table') as HTMLTableElement | null);
    if (!table) return null;

    const rows = Array.from(table.querySelectorAll('tbody tr'));
    for (const tr of rows) {
      const tds = Array.from(tr.querySelectorAll('td'));
      if (tds.length < 3) continue;

      const label = (tds[0].textContent || '').replace(/\s+/g, ' ').trim();
      const startStr = (tds[1].textContent || '').trim();
      const endStr = (tds[2].textContent || '').trim();

      // Ignore holiday rows and anything that's not a term row
      const termMatch = label.match(/\bTerm\s*(1|2|3|4)\b/i);
      if (!termMatch) continue;
      if (/School\s*Holidays/i.test(label)) continue;

      const term = parseInt(termMatch[1], 10);
      const hasEastern = /Eastern/i.test(label);
      const hasWestern = /Western/i.test(label);

      if (term === 1) {
        // Term 1 is split into Eastern/Western on this site
        if (hasEastern) pushTerm('eastern', term, startStr, endStr);
        if (hasWestern) pushTerm('western', term, startStr, endStr);
        // If no division is specified, assume both
        if (!hasEastern && !hasWestern) {
          pushTerm('eastern', term, startStr, endStr);
          pushTerm('western', term, startStr, endStr);
        }
      } else {
        // Terms 2-4 apply to both divisions
        pushTerm('eastern', term, startStr, endStr);
        pushTerm('western', term, startStr, endStr);
      }
    }
  } catch {
    return null;
  }

  results.eastern.sort((a, b) => a.term - b.term);
  results.western.sort((a, b) => a.term - b.term);
  if (results.eastern.length === 0 || results.western.length === 0) return null;
  return results;
}

// Robust AU date parser like: "Thursday 6 February 2025"
export function parseAuLongDate(s: string): Date | null {
  // Remove ordinal suffixes and commas
  const cleaned = s
    .replace(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i, '')
    .replace(/,/, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Expect: 6 February 2025
  const m = cleaned.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const monthName = m[2].toLowerCase();
  const year = parseInt(m[3], 10);
  const monthMap: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
  };
  const month = monthMap[monthName];
  if (month === undefined) return null;
  return new Date(year, month, day);
}

// Centralized CORS fetch using the shared helper with timeout and last-good proxy memory
async function fetchViaProxies(url: string): Promise<string | null> {
  try {
    const html = await fetchTextViaCors(url, { cache: 'no-store' }, 8000);
    return html;
  } catch {
    return null;
  }
}

// Extract the section HTML for a given year
function sliceYearSection(html: string, year: number): string | null {
  const headingRe = new RegExp(`${year}\\s*school\\s*term\\s*dates`, 'i');
  const start = html.search(headingRe);
  if (start === -1) return null;
  // End at the next year's heading or end of document
  const nextHeadingRe = new RegExp(`${year + 1}\\s*school\\s*term\\s*dates`, 'i');
  const end = html.search(nextHeadingRe);
  return html.substring(start, end === -1 ? html.length : end);
}

// Parse the term rows from a year section
function parseTermsFromSection(sectionHtml: string, year: number): NswTermsByDivision | null {
  const results: NswTermsByDivision = { year, eastern: [], western: [] };

  const pushTerm = (division: NswDivision, term: number, startStr: string, endStr: string) => {
    const start = parseAuLongDate(startStr);
    const end = parseAuLongDate(endStr);
    if (!start || !end) return;
    const termRange: NswTermRange = {
      term: term as 1 | 2 | 3 | 4,
      start: toISODateOnly(start),
      end: endOfDayISO(end)
    };
    results[division].push(termRange);
  };

  // 1) Preferred: parse table-based markup using a temporary DOM
  try {
    const container = document.createElement('div');
    container.innerHTML = sectionHtml;
    const tables = Array.from(container.querySelectorAll('table'));
    if (tables.length > 0) {
      const table = tables[0];
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      rows.forEach((tr) => {
        const tds = Array.from(tr.querySelectorAll('td'));
        if (tds.length < 3) return;
        const label = (tds[0].textContent || '').replace(/\s+/g, ' ').trim();
        const startStr = (tds[1].textContent || '').trim();
        const endStr = (tds[2].textContent || '').trim();

        const termMatch = label.match(/Term\s*(1|2|3|4)/i);
        if (!termMatch) return;
        const term = parseInt(termMatch[1], 10);
        const hasEastern = /Eastern/i.test(label);
        const hasWestern = /Western/i.test(label);

        if (hasEastern && hasWestern) {
          pushTerm('eastern', term, startStr, endStr);
          pushTerm('western', term, startStr, endStr);
        } else if (hasEastern) {
          pushTerm('eastern', term, startStr, endStr);
        } else if (hasWestern) {
          pushTerm('western', term, startStr, endStr);
        } else {
          // fallback: if division not indicated, assume both
          pushTerm('eastern', term, startStr, endStr);
          pushTerm('western', term, startStr, endStr);
        }
      });
    }
  } catch {}

  // 2) Fallback: regex-based parsing (for non-table variants)
  if (results.eastern.length === 0 && results.western.length === 0) {
    const html = sectionHtml.replace(/\r|\n/g, '\n');
    let m: RegExpExecArray | null;
    const term1RowRe = /Term\s*1[^\n]*?\((Eastern|Western) division\)[\s\S]*?First day for students\s*([^<\n]+)[\s\S]*?Last day for students\s*([^<\n]+)/gi;
    while ((m = term1RowRe.exec(html))) {
      const division = m[1].toLowerCase() as NswDivision;
      pushTerm(division, 1, m[2], m[3]);
    }
    const termNRowRe = /Term\s*(2|3|4)[^\n]*?\((Eastern and Western division)\)[\s\S]*?First day for students\s*([^<\n]+)[\s\S]*?Last day for students\s*([^<\n]+)/gi;
    while ((m = termNRowRe.exec(html))) {
      const term = parseInt(m[1], 10);
      const start = m[2];
      const end = m[3];
      pushTerm('eastern', term, start, end);
      pushTerm('western', term, start, end);
    }
  }

  // Sort by term and validate
  results.eastern.sort((a, b) => a.term - b.term);
  results.western.sort((a, b) => a.term - b.term);
  if (results.eastern.length === 0 || results.western.length === 0) return null;
  return results;
}

export async function fetchNswTerms(year: number): Promise<NswTermsByDivision | null> {
  const url = `https://www.nswschoolholiday.com.au/new-south-wales-${year}/`;
  const html = await fetchViaProxies(url);
  if (!html) return null;
  return parseTablepressTerms(html, year);
}

export function cacheNswTerms(data: NswTermsByDivision): void {
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + data.year, JSON.stringify(data));
  } catch {}
}

export function getCachedNswTerms(year: number): NswTermsByDivision | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + year);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Compute week label for a given date using NSW terms
export function getNswWeekLabelForDate(date: Date, division: NswDivision, terms: NswTermsByDivision): { text: string; week?: number } {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const list = terms[division];

  // Find the term that contains the date
  let term = list.find(t => {
    const start = new Date(t.start);
    const end = new Date(t.end);
    return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
  });

  if (!term) {
    // If date is in the same calendar week as any term start, but before the first day, show "Holiday".
    for (const t of list) {
      const start = new Date(t.start);
      const startSunday = new Date(start);
      startSunday.setDate(start.getDate() - start.getDay()); // previous Sunday
      const weekMonday = new Date(startSunday.getFullYear(), startSunday.getMonth(), startSunday.getDate() + 1); // Monday
      const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      if (d.getTime() >= weekMonday.getTime() && d.getTime() < startMidnight.getTime()) {
        return { text: 'Holiday' };
      }
    }
    return { text: 'School Holiday' };
  }

  // Compute week number within the term. Weeks roll over each Sunday -> weeks are Monday..Sunday blocks.
  const termStart = new Date(term.start);
  // Align both dates to the Sunday-of-week index
  const sundayOf = (day: Date) => {
    const s = new Date(day);
    s.setDate(s.getDate() - s.getDay()); // Sunday
    s.setHours(0, 0, 0, 0);
    return s;
  };
  const s1 = sundayOf(termStart);
  const sD = sundayOf(d);
  const diffWeeks = Math.floor((sD.getTime() - s1.getTime()) / (7 * 24 * 3600 * 1000));
  const week = diffWeeks + 1;
  return { text: `Week ${week}`, week };
}

// Custom week label: given a reference date and the week number on that date,
// compute the week for any other date, incrementing every Sunday.
export function getCustomWeekLabelForDate(
  date: Date,
  currentWeekAtRef: number,
  referenceDateISO: string
): { text: string; week: number } {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const ref = new Date(referenceDateISO);

  const sundayOf = (day: Date) => {
    const s = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    s.setDate(s.getDate() - s.getDay()); // Sunday
    s.setHours(0, 0, 0, 0);
    return s;
  };

  const sD = sundayOf(d).getTime();
  const sR = sundayOf(ref).getTime();
  const diffWeeks = Math.floor((sD - sR) / (7 * 24 * 3600 * 1000));
  const week = currentWeekAtRef + diffWeeks;
  return { text: `Week ${week}`, week };
}
