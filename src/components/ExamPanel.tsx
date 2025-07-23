import React from 'react';
import { Plus, X, FileText, Check, CircleSlash, Scale, Edit2 } from 'lucide-react';
import { Subject, Exam } from '../types';

interface ExamPanelProps {
  subject: Subject | null;
  exams: Exam[];
  onAddExam: () => void;
  onUpdateExam: (examId: string, field: keyof Exam, value: string) => void;
  onRemoveExam: (examId: string) => void;
  effectiveMode: 'light' | 'dark';
}

const ExamPanel: React.FC<ExamPanelProps> = ({ subject, exams, onAddExam, onUpdateExam, onRemoveExam, effectiveMode }) => {
  if (!subject) {
    return (
      <div className="p-6 text-center text-gray-400">Select a subject to view exams</div>
    );
  }

  // Helper percentage
  const getPercent = (e: Exam) => {
    if (e.mark === null || e.total === null || e.total === 0) return null;
    return (e.mark / e.total) * 100;
  };

  const getColourByPercent = (pct: number | null) => {
    if (pct === null) return '#374151';
    const clamp = Math.max(0, Math.min(100, pct));
    // 0 => red (0deg), 100 => green (120deg)
    const hue = (clamp / 100) * 120; // 0-120
    return `hsl(${hue}, 85%, 45%)`;
  };

  // Simple line graph SVG with axes
  const LineGraph: React.FC = () => {
    const valid = exams.filter((e) => getPercent(e) !== null);
    if (valid.length < 2) return null;
    const width = 600;
    const height = 200;
    const points = valid
      .map((e, idx) => {
        const pct = getPercent(e)!; // not null
        const x = (idx / (valid.length - 1)) * width;
        const y = height - (pct / 100) * height;
        return `${x},${y}`;
      })
      .join(' ');
    const axisColor = effectiveMode === 'light' ? '#000' : '#fff';
    const tickVals = [0, 25, 50, 75, 100];
    return (
      <svg width="100%" height={height + 60} viewBox={`0 0 ${width + 60} ${height + 60}`} className="mt-10">
        {/* axes */}
        <line x1="40" y1="0" x2="40" y2={height} stroke={axisColor} strokeWidth="1" />
        <line x1="40" y1={height} x2={width + 40} y2={height} stroke={axisColor} strokeWidth="1" />
        {/* y ticks */}
        {tickVals.map((v) => {
          const y = height - (v / 100) * height;
          return (
            <g key={v}>
              <line x1="35" y1={y} x2="40" y2={y} stroke={axisColor} strokeWidth="1" />
              <text x="0" y={y + 4} fontSize="10" fill={axisColor}>{v}%</text>
            </g>
          );
        })}
        {/* line */}
        <polyline points={points.split(' ').map(p=>{
          const [x,y]=p.split(',');
          return `${parseFloat(x)+40},${y}`;
        }).join(' ')} fill="none" stroke="#3b82f6" strokeWidth="2" />
        {/* circles */}
        {valid.map((e, idx) => {
          const pct = getPercent(e)!;
          const cx = 40 + (idx / (valid.length - 1)) * width;
          const cy = height - (pct / 100) * height;
          return <circle key={e.id} cx={cx} cy={cy} r="3" fill="#3b82f6" />;
        })}
      </svg>
    );
  };

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
    <div className="p-4 space-y-6">
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