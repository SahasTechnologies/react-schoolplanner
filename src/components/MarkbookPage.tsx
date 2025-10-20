import React from 'react';
import { BarChart3, Shield, FileDown } from 'lucide-react';
import { Subject, Exam } from '../types';
import SubjectCard from '../components/SubjectCard';
import SubjectEditModal from '../components/SubjectEditModal';
import ExamPanel from '../components/ExamPanel';
import { normalizeSubjectName } from '../utils/subjectUtils';
import { memoizedComparePassword } from '../utils/passwordUtils';
import { showError } from '../utils/notificationUtils';
import { defaultColours } from '../utils/fileUtils';
import { exportMarkbookPdf } from '../utils/markbookPdf';

interface MarkbookPageProps {
  subjects: Subject[];
  autoNamingEnabled: boolean;
  effectiveMode: 'light' | 'dark';
  colors: any;
  subjectSortOption: 'alphabetical-asc' | 'alphabetical-desc' | 'marks-asc' | 'marks-desc';
  setSubjectSortOption: (value: 'alphabetical-asc' | 'alphabetical-desc' | 'marks-asc' | 'marks-desc') => void;
  selectedSubjectForExam: Subject | null;
  examsBySubject: Record<string, Exam[]>;
  handleSubjectSelect: (subject: Subject) => void;
  addExam: () => void;
  updateExam: (examId: string, field: keyof Exam, value: string) => void;
  removeExam: (examId: string) => void;
  startEditingSubject: (subject: Subject) => void;
  showSubjectEditModal: boolean;
  selectedSubjectForEdit: Subject | null;
  editName: string;
  setEditName: (value: string) => void;
  editColour: string;
  setEditColour: (value: string) => void;
  editIcon: string;
  setEditIcon: (value: string) => void;
  saveSubjectEdit: () => void;
  cancelSubjectEdit: () => void;
  markbookPasswordEnabled: boolean;
  isMarkbookLocked: boolean;
  unlockAttempt: string;
  setUnlockAttempt: (value: string) => void;
  setIsMarkbookLocked: (value: boolean) => void;
}

export default function MarkbookPage({
  subjects,
  autoNamingEnabled,
  effectiveMode,
  colors,
  subjectSortOption,
  setSubjectSortOption,
  selectedSubjectForExam,
  examsBySubject,
  handleSubjectSelect,
  addExam,
  updateExam,
  removeExam,
  startEditingSubject,
  showSubjectEditModal,
  selectedSubjectForEdit,
  editName,
  setEditName,
  editColour,
  setEditColour,
  editIcon,
  setEditIcon,
  saveSubjectEdit,
  cancelSubjectEdit,
  markbookPasswordEnabled,
  isMarkbookLocked,
  unlockAttempt,
  setUnlockAttempt,
  setIsMarkbookLocked
}: MarkbookPageProps) {
  // Helper: calculate average mark percentage for a subject (null if no marks)
  const getAverageMark = (subject: Subject): number | null => {
    const exams = examsBySubject[subject.id] || [];
    const valid = exams.filter(e => e.mark !== null && e.total !== null && e.total !== 0);
    if (valid.length === 0) return null;
    const percentages = valid.map(e => ((e.mark as number) / (e.total as number)) * 100);
    return percentages.reduce((a, b) => a + b, 0) / percentages.length;
  };

  // Apply sorting based on selected option
  const sortedSubjects = [...subjects].sort((a, b) => {
    switch (subjectSortOption) {
      case 'alphabetical-asc':
        return normalizeSubjectName(a.name, autoNamingEnabled).localeCompare(normalizeSubjectName(b.name, autoNamingEnabled));
      case 'alphabetical-desc':
        return normalizeSubjectName(b.name, autoNamingEnabled).localeCompare(normalizeSubjectName(a.name, autoNamingEnabled));
      case 'marks-asc': {
        const avgA = getAverageMark(a);
        const avgB = getAverageMark(b);
        if (avgA === null && avgB === null) return 0;
        if (avgA === null) return 1;
        if (avgB === null) return -1;
        return avgA - avgB;
      }
      case 'marks-desc': {
        const avgA = getAverageMark(a);
        const avgB = getAverageMark(b);
        if (avgA === null && avgB === null) return 0;
        if (avgA === null) return 1;
        if (avgB === null) return -1;
        return avgB - avgA;
      }
      default:
        return 0;
    }
  });

  // Create the exam panel content - either login screen or actual exam panel
  const examPanelContent = (markbookPasswordEnabled && isMarkbookLocked) ? (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
      <Shield className={effectiveMode === 'light' ? 'text-blue-600' : 'text-blue-400'} size={48} />
      <h3 className={`text-xl font-semibold ${colors.text} mb-4`}>Password Protected</h3>
      <p className={`text-sm ${colors.containerText} opacity-80 mb-6 text-center`}>
        Enter your password to view your marks
      </p>
      <div className="w-full max-w-sm">
        <input
          type="password"
          value={unlockAttempt}
          onChange={(e) => setUnlockAttempt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const storedHash = localStorage.getItem('markbookPassword');
              if (storedHash && memoizedComparePassword(unlockAttempt, storedHash)) {
                setIsMarkbookLocked(false);
                setUnlockAttempt('');
              } else {
                showError('Incorrect Password', 'Please try again', { effectiveMode, colors });
              }
            }
          }}
          className={`w-full px-4 py-3 rounded-lg border ${colors.border} focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-lg ${colors.container} ${colors.text}`}
          placeholder="Enter password"
          autoComplete="off"
        />
        <button
          onClick={() => {
            const storedHash = localStorage.getItem('markbookPassword');
            if (storedHash && memoizedComparePassword(unlockAttempt, storedHash)) {
              setIsMarkbookLocked(false);
              setUnlockAttempt('');
            } else {
              showError('Incorrect Password', 'Please try again', { effectiveMode, colors });
            }
          }}
          className={`w-full ${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-4 py-3 rounded-lg font-medium transition-colors duration-200`}
        >
          Unlock
        </button>
      </div>
      {/* Footer */}
      <p className={`mt-6 text-xs opacity-70 ${colors.containerText}`}>Protected by bcrypt hashing</p>
    </div>
  ) : (
    <ExamPanel
      subject={selectedSubjectForExam}
      exams={selectedSubjectForExam ? examsBySubject[selectedSubjectForExam.id] || [] : []}
      onAddExam={addExam}
      onUpdateExam={updateExam}
      onRemoveExam={removeExam}
      effectiveMode={effectiveMode}
      allSubjects={subjects}
      examsBySubject={examsBySubject}
      onBack={() => handleSubjectSelect(null as any)}
    />
  );

  const [showExportModal, setShowExportModal] = React.useState(false);
  const [includeBarChart, setIncludeBarChart] = React.useState(true);
  const [includeSubjectsTable, setIncludeSubjectsTable] = React.useState(true);
  const [includeSubjectPages, setIncludeSubjectPages] = React.useState(true);
  const canExport = includeBarChart || includeSubjectsTable || includeSubjectPages;

  // Always render markbook content with subjects list visible
  return (
    <div className="space-y-6 pt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={28} />
          <h2 className={`text-3xl font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Markbook</h2>
        </div>
        {!(markbookPasswordEnabled && isMarkbookLocked) && (
          <button
            onClick={() => setShowExportModal(true)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border ${colors.border} ${effectiveMode==='light'?'bg-white hover:bg-gray-50 text-black':'bg-gray-800 hover:bg-gray-700 text-white'} transition-colors`}
          >
            <FileDown size={16} />
            <span className="text-sm font-medium">Export PDF</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[calc(100vh-220px)]">
        {/* Left: Subjects list */}
        <div className="space-y-4 flex flex-col">
          {/* Sort dropdown - hide when locked */}
          {!(markbookPasswordEnabled && isMarkbookLocked) && (
          <div className="flex items-center justify-between flex-shrink-0">
            <label className={`text-sm font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Sort by:</label>
            <select
              value={subjectSortOption}
              onChange={(e) => setSubjectSortOption(e.target.value as any)}
              className={`border ${colors.border} rounded-md px-2 py-1 text-sm ${effectiveMode === 'light' ? 'bg-white text-black' : 'bg-gray-800 text-white'} focus:outline-none`}
            >
              <option value="marks-asc">Marks Ascending</option>
              <option value="marks-desc">Marks Descending</option>
              <option value="alphabetical-asc">Alphabetical Ascending</option>
              <option value="alphabetical-desc">Alphabetical Descending</option>
            </select>
          </div>
          )}

          <div className="space-y-4 overflow-y-auto pr-2 flex-1">
            {sortedSubjects.length === 0 ? (
              <div className="text-center py-16">
                <BarChart3 size={64} className="mx-auto mb-4 text-gray-600" />
                <p className={`text-gray-400 text-lg ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>No subjects found</p>
                <p className={`text-gray-500 text-sm ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>Upload a calendar file to see your subjects</p>
              </div>
            ) : (
              sortedSubjects.map((subject: Subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  effectiveMode={effectiveMode}
                  colors={colors}
                  onEdit={startEditingSubject}
                  onSelect={handleSubjectSelect}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: Exams panel */}
        <div className={`${colors.container} rounded-lg ${colors.border} border p-4 flex flex-col`}>
          {examPanelContent}
        </div>
      </div>

      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className={`${effectiveMode==='light'?'bg-white text-black':'bg-gray-800 text-white'} rounded-2xl border ${colors.border} w-full max-w-md p-5`}> 
            <div className="text-lg font-semibold mb-3">Export to PDF</div>
            <p className={`${effectiveMode==='light'?'text-gray-600':'text-gray-300'} text-sm mb-4`}>Only subjects with marks will have their own page.</p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="checkbox-wrapper-30">
                  <span className="checkbox">
                    <input type="checkbox" checked={includeBarChart} onChange={(e)=> setIncludeBarChart(e.target.checked)} />
                    <svg>
                      <use xlinkHref="#checkbox-30" className="checkbox"></use>
                    </svg>
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" style={{display:'none'}}>
                    <symbol id="checkbox-30" viewBox="0 0 22 22">
                      <path fill="none" stroke="currentColor" d="M5.5,11.3L9,14.8L20.2,3.3l0,0c-0.5-1-1.5-1.8-2.7-1.8h-13c-1.7,0-3,1.3-3,3v13c0,1.7,1.3,3,3,3h13 c1.7,0,3-1.3,3-3v-13c0-0.4-0.1-0.8-0.3-1.2"/>
                    </symbol>
                  </svg>
                </div>
                <span>Overall graph of subjects</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="checkbox-wrapper-30">
                  <span className="checkbox">
                    <input type="checkbox" checked={includeSubjectsTable} onChange={(e)=> setIncludeSubjectsTable(e.target.checked)} />
                    <svg>
                      <use xlinkHref="#checkbox-30" className="checkbox"></use>
                    </svg>
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" style={{display:'none'}}>
                    <symbol id="checkbox-30" viewBox="0 0 22 22">
                      <path fill="none" stroke="currentColor" d="M5.5,11.3L9,14.8L20.2,3.3l0,0c-0.5-1-1.5-1.8-2.7-1.8h-13c-1.7,0-3,1.3-3,3v13c0,1.7,1.3,3,3,3h13 c1.7,0,3-1.3,3-3v-13c0-0.4-0.1-0.8-0.3-1.2"/>
                    </symbol>
                  </svg>
                </div>
                <span>Table of subjects</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="checkbox-wrapper-30">
                  <span className="checkbox">
                    <input type="checkbox" checked={includeSubjectPages} onChange={(e)=> setIncludeSubjectPages(e.target.checked)} />
                    <svg>
                      <use xlinkHref="#checkbox-30" className="checkbox"></use>
                    </svg>
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" style={{display:'none'}}>
                    <symbol id="checkbox-30" viewBox="0 0 22 22">
                      <path fill="none" stroke="currentColor" d="M5.5,11.3L9,14.8L20.2,3.3l0,0c-0.5-1-1.5-1.8-2.7-1.8h-13c-1.7,0-3,1.3-3,3v13c0,1.7,1.3,3,3,3h13 c1.7,0,3-1.3,3-3v-13c0-0.4-0.1-0.8-0.3-1.2"/>
                    </symbol>
                  </svg>
                </div>
                <span>Individual subject marks</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={()=> setShowExportModal(false)} className={`${effectiveMode==='light'?'bg-gray-100 hover:bg-gray-200 text-black':'bg-gray-700 hover:bg-gray-600 text-white'} px-3 py-2 rounded-md`}>Cancel</button>
              <button
                disabled={!canExport}
                onClick={async ()=>{
                  try {
                    await exportMarkbookPdf({ subjects, examsBySubject, includeBarChart, includeSubjectsTable, includeSubjectPages });
                    setShowExportModal(false);
                  } catch (e: any) {
                    try { console.error('PDF export failed:', e); } catch {}
                    const msg = e?.message ? String(e.message) : (typeof e === 'string' ? e : 'Please try again');
                    showError('Export failed', msg, { effectiveMode, colors });
                  }
                }}
                className={`${canExport ? (effectiveMode==='light'?'bg-blue-600 hover:bg-blue-700 text-white':'bg-blue-500 hover:bg-blue-600 text-white') : 'bg-gray-500 text-white opacity-60 cursor-not-allowed'} px-3 py-2 rounded-md`}
              >
                Export
              </button>
            </div>
            <style>{`
            .checkbox-wrapper-30 {
              --color-bg: ${effectiveMode === 'light' ? '#f3f4f6' : '#232323'};
              --color-bg-dark: ${effectiveMode === 'dark' ? '#232323' : '#f3f4f6'};
              --color-border: ${colors.border ? (effectiveMode === 'light' ? '#d1d5db' : '#444') : '#d1d5db'};
              --color-primary: ${colors.buttonAccent ? (effectiveMode === 'light' ? '#2563eb' : '#60a5fa') : '#2563eb'};
              --color-primary-light: ${colors.buttonAccentHover ? (effectiveMode === 'light' ? '#93c5fd' : '#2563eb') : '#93c5fd'};
            }
            .checkbox-wrapper-30 .checkbox { 
              --bg: var(--color-bg);
              --brdr: var(--color-border);
              --brdr-actv: var(--color-primary);
              --brdr-hovr: var(--color-primary-light);
              --tick: ${effectiveMode === 'light' ? '#222' : '#fff'};
              --dur: calc((var(--size, 2)/2) * 0.6s);
              display: inline-block; width: calc(var(--size, 1) * 22px); position: relative;
            }
            .checkbox-wrapper-30 .checkbox:after { content: ""; width: 100%; padding-top: 100%; display: block; }
            .checkbox-wrapper-30 .checkbox > * { position: absolute; }
            .checkbox-wrapper-30 .checkbox input {
              -webkit-appearance: none; -moz-appearance: none; -webkit-tap-highlight-color: transparent; cursor: pointer;
              background-color: var(--bg); border-radius: calc(var(--size, 1) * 4px);
              border: calc(var(--newBrdr, var(--size, 1)) * 1px) solid; color: var(--newBrdrClr, var(--brdr));
              outline: none; margin: 0; padding: 0; transition: all calc(var(--dur) / 3) linear;
            }
            .checkbox-wrapper-30 .checkbox input:hover, .checkbox-wrapper-30 .checkbox input:checked { --newBrdr: calc(var(--size, 1) * 2); }
            .checkbox-wrapper-30 .checkbox input:hover { --newBrdrClr: var(--brdr-hovr); }
            .checkbox-wrapper-30 .checkbox input:checked { --newBrdrClr: var(--brdr-actv); transition-delay: calc(var(--dur) /1.3); }
            .checkbox-wrapper-30 .checkbox input:checked + svg { --dashArray: 16 93; --dashOffset: 109; stroke: var(--tick); }
            .checkbox-wrapper-30 .checkbox svg { fill: none; left: 0; pointer-events: none; stroke: var(--tick, var(--border-active)); stroke-dasharray: var(--dashArray, 93); stroke-dashoffset: var(--dashOffset, 94); stroke-linecap: round; stroke-linejoin: round; stroke-width: 2px; top: 0; transition: stroke-dasharray var(--dur), stroke-dashoffset var(--dur); }
            .checkbox-wrapper-30 .checkbox svg, .checkbox-wrapper-30 .checkbox input { display: block; height: 100%; width: 100%; }
            `}</style>
          </div>
        </div>
      )}

      <SubjectEditModal
        showSubjectEditModal={showSubjectEditModal}
        selectedSubjectForEdit={selectedSubjectForEdit}
        editName={editName}
        setEditName={setEditName}
        editColour={editColour}
        setEditColour={setEditColour}
        editIcon={editIcon}
        setEditIcon={setEditIcon}
        saveSubjectEdit={saveSubjectEdit}
        cancelSubjectEdit={cancelSubjectEdit}
        effectiveMode={effectiveMode}
        colors={colors}
        defaultColours={defaultColours}
      />
    </div>
  );
}
