import React, { useMemo } from 'react';
import { Plus, X, FileText, Check, CircleSlash, Scale, Edit2, ArrowLeft } from 'lucide-react';
import { Subject, Exam } from '../types';
// Recharts – beautiful, responsive charting library
// @ts-ignore - types provided by the library once installed
// eslint-disable-next-line import/no-unresolved
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { getSubjectIcon } from '../utils/subjectUtils.ts';

interface ExamPanelProps {
  subject: Subject | null;
  exams: Exam[];
  onAddExam: () => void;
  onUpdateExam: (examId: string, field: keyof Exam, value: string) => void;
  onRemoveExam: (examId: string) => void;
  effectiveMode: 'light' | 'dark';
  allSubjects: Subject[];
  examsBySubject: Record<string, Exam[]>;
  onBack: () => void;
}

const ExamPanel: React.FC<ExamPanelProps> = ({ subject, exams, onAddExam, onUpdateExam, onRemoveExam, effectiveMode, allSubjects, examsBySubject, onBack }) => {

  /* --------------------------------------------------
   *  Helper functions shared by both views
   * -------------------------------------------------- */

  const getPercent = (e: Exam) => {
    if (e.mark === null || e.total === null || e.total === 0) return null;
    return (e.mark / e.total) * 100;
  };

  const getAverageForSubject = (s: Subject): number | null => {
    const list = examsBySubject[s.id] || [];
    const valid = list.map(getPercent).filter((p): p is number => p !== null);
    if (valid.length === 0) return null;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  };

  const getLetter = (pct: number | null) => {
    if (pct === null) return 'E';
    if (pct >= 80) return 'A';
    if (pct >= 65) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 25) return 'D';
    return 'E';
  };

  /* --------------------------------------------------
   *  Overview screen (no subject selected)
   * -------------------------------------------------- */

  if (!subject) {
    // Build bar chart data (subjects with averages)
    const barData = allSubjects
      .map((s) => {
        const avg = getAverageForSubject(s);
        return avg === null ? null : { name: s.name, avg };
      })
      .filter(Boolean) as { name: string; avg: number }[];

    // Sort ascending by average
    barData.sort((a, b) => a.avg - b.avg);

    // Grade distribution counts
    const gradeCounts: Record<'A'|'B'|'C'|'D'|'E', number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    barData.forEach((d) => {
      gradeCounts[getLetter(d.avg) as keyof typeof gradeCounts]++;
    });

    const axisColor = effectiveMode === 'light' ? '#000' : '#fff';

    return (
      <div className="space-y-8">
        <div className="text-center text-gray-400">Select a subject to view exams</div>

        {/* Bar chart of subject averages */}
        {barData.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={effectiveMode==='light' ? '#e5e7eb' : '#374151'} />
              <XAxis dataKey="name" stroke={axisColor} angle={-45} textAnchor="end" interval={0} height={60} />
              <YAxis domain={[0, 100]} stroke={axisColor} tickFormatter={(v:number)=>`${v}%`} />
              <Tooltip formatter={(v:number)=>`${v.toFixed(2)}%`} contentStyle={{backgroundColor:effectiveMode==='light'?'#ffffff':'#1f2937', borderRadius:'8px', borderColor:effectiveMode==='light'?'#e5e7eb':'#374151', color: axisColor}}/>
              <Bar dataKey="avg" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Grade distribution summary */}
        <div className="grid grid-cols-5 gap-2 text-sm mt-4">
          {(['A','B','C','D','E'] as const).map((g)=> (
            <div key={g} className="flex flex-col items-center bg-gray-700/40 rounded-lg py-2">
              <span className="font-semibold text-white text-lg">{g}</span>
              <span className="text-white/80">{gradeCounts[g]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* --------------------------------------------------
   *  Render
   * -------------------------------------------------- */

  const SubjectHeading: React.FC = () => (
    <div className="flex items-center justify-center gap-2">
      {getSubjectIcon(subject, 24, effectiveMode)}
      <h2 className={`text-2xl font-semibold mb-2 text-center ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>{subject.name}</h2>
    </div>
  );

  // Helper percentage (already defined above for both views)

  const getColourByPercent = (pct: number | null) => {
    if (pct === null) return '#374151';
    const clamp = Math.max(0, Math.min(100, pct));
    // 0 => red (0deg), 100 => green (120deg)
    const hue = (clamp / 100) * 120; // 0-120
    return `hsl(${hue}, 85%, 45%)`;
  };

  // Memoised line graph to avoid unnecessary re-draws every second
  const LineGraph: React.FC = React.memo(() => {
    const data = useMemo(() => (
      exams
        .map((e, idx) => {
          const pct = getPercent(e);
          if (pct === null) return null;
          return {
            name: e.name?.trim() || `E${idx + 1}`,
            percent: pct,
          };
        })
        .filter(Boolean) as { name: string; percent: number }[]
    ), [exams]);

    if (data.length < 2) return null;

    const axisColor = effectiveMode === 'light' ? '#000' : '#fff';

    return (
      <div className="mt-10" style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={effectiveMode === 'light' ? '#e5e7eb' : '#374151'} />
            <XAxis dataKey="name" stroke={axisColor} />
            <YAxis domain={[0, 100]} stroke={axisColor} tickFormatter={(v: number)=>`${v}%`} />
            <Tooltip formatter={(value:number)=>`${(value as number).toFixed(2)}%`} 
                     contentStyle={{backgroundColor:effectiveMode==='light'?'#ffffff':'#1f2937', borderRadius:'8px', borderColor:effectiveMode==='light'?'#e5e7eb':'#374151', color: axisColor}}/>
            {/* Smooth curved line with disabled animation to avoid flicker */}
            <Line
              type="monotone"
              dataKey="percent"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 1, fill: '#3b82f6' }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  });

  const inputClass = `w-full bg-gray-800 text-white px-2 py-1 rounded-md border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500`;

  // Weighted & simple averages
  const weightSum = exams.reduce((a, e) => a + (e.weighting ?? 0), 0);
  const weightedAvg = exams.length > 0 ? exams.reduce((a, e) => a + ((getPercent(e) ?? 0) * (e.weighting ?? 0)), 0) / (weightSum || exams.length) : null;

  // Grade thresholds state (persisted)
  const [gradeThresholds, setGradeThresholds] = React.useState<{A:number;B:number;C:number;D:number;E:number}>(()=>{
    const saved = localStorage.getItem('gradeThresholds');
    return saved ? JSON.parse(saved) : {A:80,B:65,C:50,D:25,E:0};
  });

  React.useEffect(()=>{
    localStorage.setItem('gradeThresholds', JSON.stringify(gradeThresholds));
  },[gradeThresholds]);

  // Needed percentage in final exam to reach A
  const remainingWeight = Math.max(0, 100 - weightSum);
  const neededForA = remainingWeight > 0 && weightedAvg !== null
    ? (gradeThresholds.A * 100 - (weightedAvg * weightSum)) / remainingWeight
    : null;

  const summaryBox = (label: string, value: number | null, color: string) => (
    <div className={`rounded-xl p-6 flex flex-col items-center justify-center`} style={{ backgroundColor: color }}>
      <div className="text-4xl font-bold text-white">{value !== null ? `${value.toFixed(2)}%` : '--'}</div>
      <div className="mt-1 text-white opacity-80 text-sm">{label}</div>
    </div>
  );

  const getLetterGrade = (pct:number|null)=>{
    if(pct===null) return '-';
    if(pct>=gradeThresholds.A) return 'A';
    if(pct>=gradeThresholds.B) return 'B';
    if(pct>=gradeThresholds.C) return 'C';
    if(pct>=gradeThresholds.D) return 'D';
    return 'E';
  };

  const [editGrades, setEditGrades] = React.useState(false);

  return (
    <div className={`space-y-6 ${effectiveMode==='light'?'bg-white':'bg-gray-800'} rounded-lg border ${effectiveMode==='light'?'border-gray-300':'border-gray-700'} p-4`}>
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-2">
        <ArrowLeft size={14}/> Back
      </button>
      <SubjectHeading />
      {/* Summary & Grade boxes */}
      <div className="grid grid-cols-2 gap-4">
        {summaryBox('Weighted', weightedAvg, '#06b6d4')}
        <div className="relative">
          <div className="rounded-xl p-6 flex flex-col items-center justify-center bg-gray-600">
            <div className="text-4xl font-bold text-white">{getLetterGrade(weightedAvg)}</div>
            <div className="mt-1 text-white opacity-80 text-sm">Grade</div>
          </div>
          <button onClick={()=>setEditGrades(true)} className="absolute top-2 right-2 text-white/80 hover:text-white"><Edit2 size={14}/></button>
        </div>
      </div>
      {neededForA !== null && remainingWeight > 0 && (
        <div className="text-white/80 text-sm pt-2">{neededForA > 100 ? 'N/A' : `${neededForA.toFixed(2)}%`} needed in final exam for A</div>
      )}

      {/* Edit Grade Modal */}
      {editGrades && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-sm space-y-4 text-white">
            <h3 className="text-lg font-semibold">Edit Grade Thresholds (%)</h3>
            {(['A','B','C','D'] as const).map((g)=> (
              <div key={g} className="flex items-center justify-between">
                <label className="mr-2">{g} &ge;</label>
                <input type="number" value={gradeThresholds[g]} min={0} max={100} className="w-24 bg-gray-700 px-2 py-1 rounded" onChange={(e)=> setGradeThresholds({...gradeThresholds, [g]: parseFloat(e.target.value)})}/>
                <span>%</span>
              </div>
            ))}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={()=>setEditGrades(false)} className="bg-gray-600 px-4 py-1 rounded">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={onAddExam}
          className="flex items-center gap-1 bg-transparent text-white border border-gray-600 px-2 py-1 rounded-md hover:bg-gray-700 transition-colors text-sm"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {/* Exam cards */}
      <div className="space-y-4">
        {exams.map((exam) => {
          const pct = getPercent(exam);
          return (
            <div key={exam.id} className="flex items-center gap-4 bg-opacity-20 bg-gray-700 rounded-xl p-4">
              {/* Percentage badge */}
              <div
                className="min-w-[120px] h-28 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: getColourByPercent(pct) }}
              >
                {pct !== null ? pct.toFixed(2) : '--'}%
              </div>

              {/* Editable fields */}
              <div className="flex-1 space-y-2">
                {/* Name field */}
                <div>
                  <label className="flex items-center gap-1 text-xs text-gray-400 mb-1"><FileText size={12}/>Name</label>
                  <input
                     value={exam.name ?? ''}
                     onChange={(e) => onUpdateExam(exam.id, 'name', e.target.value)}
                     className={inputClass}
                   />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="flex items-center gap-1 text-xs text-gray-400 mb-1"><Check size={12}/>Mark</label>
                    <input
                      value={exam.mark ?? ''}
                      onChange={(e) => onUpdateExam(exam.id, 'mark', e.target.value)}
                      className={inputClass}
                      type="number"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-xs text-gray-400 mb-1"><CircleSlash size={12}/>Total</label>
                    <input
                      value={exam.total ?? ''}
                      onChange={(e) => onUpdateExam(exam.id, 'total', e.target.value)}
                      className={inputClass}
                      type="number"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-xs text-gray-400 mb-1"><Scale size={12}/>Weight %</label>
                    <input
                      value={exam.weighting ?? ''}
                      onChange={(e) => onUpdateExam(exam.id, 'weighting', e.target.value)}
                      className={inputClass}
                      type="number"
                    />
                  </div>
                </div>
              </div>

              {/* delete */}
              <button onClick={() => onRemoveExam(exam.id)} className="text-gray-400 hover:text-red-400">
                <X size={18} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Graph */}
      <LineGraph />
    </div>
  );
};

export default ExamPanel; 