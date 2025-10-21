import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Subject, Exam } from '../types';

function percent(mark: number | null, total: number | null): number | null {
  if (mark === null || total === null || total === 0) return null;
  return (mark / total) * 100;
}

function averagePercent(exams: Exam[]): number | null {
  const vals = exams
    .map((e) => percent(e.mark, e.total))
    .filter((v): v is number => v !== null);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function gradeFromThresholds(pct: number | null, thresholds: {A:number;B:number;C:number;D:number;E:number}) {
  if (pct === null) return '-';
  if (pct >= thresholds.A) return 'A';
  if (pct >= thresholds.B) return 'B';
  if (pct >= thresholds.C) return 'C';
  if (pct >= thresholds.D) return 'D';
  return 'E';
}

async function loadFaviconPng(size = 16): Promise<string | null> {
  try {
    const res = await fetch('/school.svg');
    if (!res.ok) return null;
    const svgText = await res.text();
    const svg64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgText)));
    const dataUrl: string | null = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0, size, size);
        try {
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = svg64;
    });
    return dataUrl;
  } catch {
    return null;
  }
}

// Disabled - TTF files have unicode cmap issues
// @ts-ignore - Kept for future use
async function tryLoadRedHatFont(doc: jsPDF) {
  const regularCandidates = [
    '/fonts/RedHatText-Regular.ttf',
    'https://raw.githubusercontent.com/RedHatOfficial/RedHatFont/main/fonts/ttf/RedHatText-Regular.ttf'
  ];
  const boldCandidates = [
    '/fonts/RedHatText-Bold.ttf',
    'https://raw.githubusercontent.com/RedHatOfficial/RedHatFont/main/fonts/ttf/RedHatText-Bold.ttf'
  ];

  async function fetchWithTimeout(url: string, timeoutMs: number): Promise<ArrayBuffer | null> {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { mode: 'cors' as RequestMode, signal: controller.signal });
      if (res.ok) return await res.arrayBuffer();
      return null;
    } catch {
      return null;
    } finally {
      clearTimeout(t);
    }
  }

  async function firstOk(urls: string[], timeoutMs: number): Promise<ArrayBuffer | null> {
    for (const url of urls) {
      const buf = await fetchWithTimeout(url, timeoutMs);
      if (buf) return buf;
    }
    return null;
  }

  try {
    const [regBuf, boldBuf] = await Promise.all([
      firstOk(regularCandidates, 800),
      firstOk(boldCandidates, 800)
    ]);
    if (regBuf) {
      const regB64 = arrayBufferToBase64(regBuf);
      (doc as any).addFileToVFS('RedHatText-Regular.ttf', regB64);
      (doc as any).addFont('RedHatText-Regular.ttf', 'RedHatText', 'normal');
    }
    if (boldBuf) {
      const boldB64 = arrayBufferToBase64(boldBuf);
      (doc as any).addFileToVFS('RedHatText-Bold.ttf', boldB64);
      (doc as any).addFont('RedHatText-Bold.ttf', 'RedHatText', 'bold');
    }
  } catch {}
}

function getPreferredFont(doc: jsPDF): 'RedHatText' | 'helvetica' {
  try {
    const list = (doc as any).getFontList?.();
    if (list && typeof list === 'object' && 'RedHatText' in list) return 'RedHatText';
  } catch {}
  return 'helvetica';
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function safeAutoTable(doc: jsPDF, options: any) {
  // Prefer the method attached to the doc instance if available
  const anyDoc = doc as any;
  if (typeof anyDoc.autoTable === 'function') {
    return anyDoc.autoTable(options);
  }
  // Fallback to the imported function
  return (autoTable as unknown as (doc: jsPDF, options: any) => void)(doc, options);
}

function drawFooter(doc: jsPDF, faviconPngDataUrl: string | null) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    const margin = 24;

    // Divider above footer
    doc.setDrawColor(220);
    doc.line(margin, h - margin - 18, w - margin, h - margin - 18);

    // Left: logo + label (icon centered with text baseline)
    if (faviconPngDataUrl) {
      try { doc.addImage(faviconPngDataUrl, 'PNG', margin, h - margin - 9.5, 14, 14); } catch {}
    }
    // Use helvetica font
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('School Planner', margin + (faviconPngDataUrl ? 18 : 0), h - margin + 2);

    // Right: page number
    doc.setFont('helvetica', 'normal');
    const pageText = String(i);
    doc.text(pageText, w - margin, h - margin + 2, { align: 'right' });
  }
}

function drawSubjectBarsPage(doc: jsPDF, items: { name: string; avg: number }[], title: string) {
  const w = doc.internal.pageSize.getWidth();
  const marginX = 40;
  const top = 64;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, marginX, top);

  const chartTop = top + 20;
  const chartHeight = 260;
  const chartLeft = marginX;
  const chartWidth = w - marginX * 2;

  // Chart container (rounded outline)
  doc.setDrawColor(210);
  doc.roundedRect(chartLeft - 10, chartTop - 10, chartWidth + 20, chartHeight + 20, 8, 8, 'S');

  // axes
  doc.setDrawColor(180);
  doc.line(chartLeft, chartTop, chartLeft, chartTop + chartHeight);
  doc.line(chartLeft, chartTop + chartHeight, chartLeft + chartWidth, chartTop + chartHeight);

  // y ticks 0..100 step 20
  doc.setFontSize(8);
  for (let t = 0; t <= 100; t += 20) {
    const y = chartTop + chartHeight - (t / 100) * chartHeight;
    doc.setDrawColor(220);
    doc.line(chartLeft, y, chartLeft + chartWidth, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text(`${t}%`, chartLeft - 22, y + 2);
  }

  if (items.length === 0) return;

  const barGap = 8;
  const barWidth = Math.max(8, Math.min(40, (chartWidth - (items.length - 1) * barGap) / items.length));
  let x = chartLeft + (chartWidth - (barWidth * items.length + barGap * (items.length - 1))) / 2;

  items.forEach((it) => {
    const hPct = (it.avg / 100) * chartHeight;
    const y = chartTop + chartHeight - hPct;

    // bar color
    doc.setFillColor(59, 130, 246); // blue-500
    doc.rect(x, y, barWidth, hPct, 'F');

    // name rotated or small text below
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    doc.setFontSize(8);
    doc.text(it.name, x + barWidth / 2, chartTop + chartHeight + 10, { align: 'center' });

    // value label
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20);
    doc.setFontSize(9);
    doc.text(`${it.avg.toFixed(1)}%`, x + barWidth / 2, y - 4, { align: 'center' });

    x += barWidth + barGap;
  });
}

export async function exportMarkbookPdf(args: {
  subjects: Subject[];
  examsBySubject: Record<string, Exam[]>;
  includeBarChart?: boolean;
  includeSubjectsTable?: boolean;
  includeSubjectPages?: boolean;
}) {
  console.log('[PDF Export] Starting export...', args);
  const {
    subjects,
    examsBySubject,
    includeBarChart = true,
    includeSubjectsTable = true,
    includeSubjectPages = true,
  } = args;
  console.log('[PDF Export] Options:', { includeBarChart, includeSubjectsTable, includeSubjectPages });

  // Prepare averages
  const withAvgs = subjects.map((s) => ({
    subject: s,
    avg: averagePercent(examsBySubject[s.id] || []),
  }));

  const barData = withAvgs
    .filter((s) => s.avg !== null)
    .map((s) => ({ name: s.subject.name, avg: s.avg as number }))
    .sort((a, b) => a.avg - b.avg);

  // Load thresholds
  let thresholds = { A: 80, B: 65, C: 50, D: 25, E: 0 };
  try {
    const saved = localStorage.getItem('gradeThresholds');
    if (saved) thresholds = JSON.parse(saved);
  } catch {}

  // Build doc
  console.log('[PDF Export] Creating jsPDF instance...');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  console.log('[PDF Export] jsPDF created:', doc);
  
  // CRITICAL: Set default font immediately to avoid widths errors
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // Skip Red Hat font loading - TTF files have unicode cmap issues
  console.log('[PDF Export] Using helvetica font (Red Hat disabled due to TTF issues)');
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const footerReserve = 48; // space above footer divider to avoid collisions

  let hasDrawnContent = false;
  if (includeBarChart && barData.length > 0) {
    if (barData.length <= 12) {
      drawSubjectBarsPage(doc, barData, 'Subject Averages (Ascending)');
      hasDrawnContent = true;
    } else {
      const half = Math.ceil(barData.length / 2);
      drawSubjectBarsPage(doc, barData.slice(0, half), 'Subject Averages (Ascending) • Part 1');
      doc.addPage();
      drawSubjectBarsPage(doc, barData.slice(half), 'Subject Averages (Ascending) • Part 2');
      hasDrawnContent = true;
    }
  }

  // List page: subjects + marks
  if (includeSubjectsTable) {
    if (hasDrawnContent) doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Subjects and Marks', 40, 64);

    const head = [['', 'Subject', 'Average', 'Grade']];
    const body = withAvgs.map((s) => {
      const avg = s.avg;
      const grade = gradeFromThresholds(avg, thresholds);
      return [
        '•',
        s.subject.name,
        avg === null ? '-' : `${avg.toFixed(2)}%`,
        grade,
      ];
    });

    // Rounded frame for table area
    const tableX = 30;
    const tableW = w - 60;
    const tableStartY = 80;
    doc.setDrawColor(210);
    doc.roundedRect(tableX, tableStartY - 14, tableW, 24, 8, 8, 'S');

    let __listEndY: number | null = null;
    try {
      safeAutoTable(doc, {
        head,
        body,
        startY: tableStartY,
        styles: { font: getPreferredFont(doc), fontSize: 10 },
        headStyles: { fillColor: [59, 130, 246] },
        margin: { bottom: footerReserve },
        didDrawCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 0) {
            const subj = withAvgs[data.row.index].subject;
            const colour = subj.colour || '#9ca3af';
            const { x, y, height } = data.cell;
            const r = Math.min(6, height / 2 - 2);
            const cx = x + 9;
            const cy = y + height / 2;
            try {
              const c = hexToRgb(colour);
              if (c) {
                doc.setFillColor(c.r, c.g, c.b);
              } else {
                doc.setFillColor(156, 163, 175);
              }
              doc.circle(cx, cy, r, 'F');
            } catch {}
          }
        },
      });
      // @ts-ignore
      __listEndY = (doc as any).lastAutoTable?.finalY ?? null;
    } catch {
      let yAlt = tableStartY + 20;
      try { doc.setFont(getPreferredFont(doc), 'normal'); } catch { doc.setFont('helvetica', 'normal'); }
      doc.setFontSize(10);
      const lh = 16;
      body.forEach((row: any[]) => {
        doc.setFont('helvetica', 'normal');
        const text = `${row[1]}  ${row[2]}  ${row[3]}`;
        doc.text(text, tableX + 12, yAlt);
        yAlt += lh;
      });
      __listEndY = yAlt;
    }

    // Draw outer rounded border after table renders
    // @ts-ignore
    const listEndY = (__listEndY ?? (doc as any).lastAutoTable?.finalY) ?? tableStartY + 100;
    doc.setDrawColor(210);
    doc.roundedRect(tableX, tableStartY - 14, tableW, Math.max(40, listEndY - tableStartY + 28), 12, 12, 'S');
  }

  hasDrawnContent = hasDrawnContent || includeSubjectsTable;
  // Per-subject pages
  if (includeSubjectPages) for (const s of subjects) {
    const exams = examsBySubject[s.id] || [];
    const haveAny = exams.some((e) => percent(e.mark, e.total) !== null);
    if (!haveAny) continue; // skip subjects without any marks
    const rows = exams.map((e, idx) => {
      const p = percent(e.mark, e.total);
      return [
        e.name || `Exam ${idx + 1}`,
        e.mark == null ? '-' : String(e.mark),
        e.total == null ? '-' : String(e.total),
        p == null ? '-' : `${p.toFixed(2)}%`,
        e.weighting == null ? '-' : `${e.weighting}%`,
      ];
    });

    if (hasDrawnContent) {
      doc.addPage();
    }
    hasDrawnContent = true;
    // Header with color chip and subject name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(s.name, 40, 64);
    // color chip
    try {
      const c = hexToRgb(s.colour);
      if (c) {
        doc.setFillColor(c.r, c.g, c.b);
        doc.circle(20, 60, 6, 'F');
      }
    } catch {}

    let y = 80;
    // Table rounded frame
    const subTableX = 30;
    const subTableW = w - 60;
    doc.setDrawColor(210);
    doc.roundedRect(subTableX, y - 14, subTableW, 24, 8, 8, 'S');

    let endY: number = 140;
    try {
      safeAutoTable(doc, {
        head: [['Exam', 'Mark', 'Total', 'Percent', 'Weight %']],
        body: rows,
        startY: y,
        styles: { font: getPreferredFont(doc), fontSize: 10 },
        headStyles: { fillColor: [31, 41, 55] },
        margin: { bottom: footerReserve },
      });
      // @ts-ignore
      endY = (doc as any).lastAutoTable?.finalY ?? 140;
    } catch {
      // Manual simple fallback in case autotable is unavailable
      let yAlt = y + 16;
      try { doc.setFont(getPreferredFont(doc), 'normal'); } catch { doc.setFont('helvetica', 'normal'); }
      doc.setFontSize(10);
      const lh = 16;
      // Header
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80);
      doc.text('Exam    Mark   Total   Percent   Weight %', 40, yAlt);
      yAlt += lh;
      doc.setTextColor(20);
      rows.forEach((r) => {
        doc.setFont('helvetica', 'normal');
        const txt = `${r[0]}   ${r[1]}   ${r[2]}   ${r[3]}   ${r[4]}`;
        doc.text(txt, 40, yAlt);
        yAlt += lh;
      });
      endY = yAlt;
    }

    // Draw border around the table area
    doc.setDrawColor(210);
    doc.roundedRect(subTableX, y - 14, subTableW, Math.max(40, endY - y + 28), 12, 12, 'S');

    // Draw line chart of percents at the bottom
    let chartTop = endY + 24;
    const chartWidth = w - 80;
    const chartHeight = 140;

    // If not enough space above footer, add a page and move chart to top area
    if (chartTop + chartHeight > h - footerReserve) {
      doc.addPage();
      chartTop = 100;
    }

    // Chart rounded outline
    doc.setDrawColor(210);
    doc.roundedRect(40 - 10, chartTop - 10, chartWidth + 20, chartHeight + 20, 8, 8, 'S');
    try { drawLineChart(doc, exams, 40, chartTop, chartWidth, chartHeight); } catch {}
  }

  console.log('[PDF Export] Loading favicon...');
  const favicon = await loadFaviconPng(64); // high-res rasterization for crisp footer icon
  console.log('[PDF Export] Drawing footer...');
  drawFooter(doc, favicon);

  console.log('[PDF Export] Saving PDF...');
  doc.save('Markbook.pdf');
  console.log('[PDF Export] PDF saved successfully!');
}

function drawLineChart(doc: jsPDF, exams: Exam[], left: number, top: number, width: number, height: number) {
  // Build data
  const data = exams
    .map((e, i) => ({ name: e.name?.trim() || `E${i + 1}`, pct: percent(e.mark, e.total) }))
    .filter((d) => d.pct !== null) as { name: string; pct: number }[];
  if (data.length < 2) {
    // no chart
    return;
  }

  // axes
  doc.setDrawColor(180);
  doc.line(left, top, left, top + height);
  doc.line(left, top + height, left + width, top + height);

  // y ticks
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  for (let t = 0; t <= 100; t += 20) {
    const y = top + height - (t / 100) * height;
    doc.setDrawColor(220);
    doc.line(left, y, left + width, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text(`${t}%`, left - 22, y + 2);
  }

  // x positions
  const xs: number[] = [];
  for (let i = 0; i < data.length; i++) {
    xs.push(left + (i / (data.length - 1)) * width);
  }

  // draw lines
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(2);
  for (let i = 1; i < data.length; i++) {
    const x1 = xs[i - 1];
    const y1 = top + height - (data[i - 1].pct / 100) * height;
    const x2 = xs[i];
    const y2 = top + height - (data[i].pct / 100) * height;
    doc.line(x1, y1, x2, y2);
  }

  // points and labels
  doc.setFillColor(59, 130, 246);
  doc.setTextColor(20);
  doc.setFontSize(8);
  data.forEach((d, i) => {
    const x = xs[i];
    const y = top + height - (d.pct / 100) * height;
    doc.circle(x, y, 2.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.text(`${d.pct.toFixed(1)}%`, x, y - 6, { align: 'center' });
    // names on x axis
    doc.setFont('helvetica', 'normal');
    doc.text(d.name, x, top + height + 12, { align: 'center' });
  });
}

function hexToRgb(hex: string | undefined): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('');
  }
  if (h.length !== 6) return null;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return { r, g, b };
}
