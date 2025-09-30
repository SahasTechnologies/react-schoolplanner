import { BarChart3, Shield } from 'lucide-react';
import { Subject, Exam } from '../types';
import SubjectCard from '../components/SubjectCard';
import SubjectEditModal from '../components/SubjectEditModal';
import ExamPanel from '../components/ExamPanel';
import { normalizeSubjectName } from '../utils/subjectUtils';
import { memoizedComparePassword } from '../utils/passwordUtils';
import { showError } from '../utils/notificationUtils';
import { defaultColours } from '../utils/fileUtils';

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

  // Always render markbook content with subjects list visible
  return (
    <div className="space-y-6 pt-3">
      <div className="flex items-center gap-3">
        <BarChart3 className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={28} />
        <h2 className={`text-3xl font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Markbook</h2>
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
