import React from 'react';
import { Edit2 } from 'lucide-react';
import { Subject } from '../types';
import { getSubjectIcon } from '../utils/subjectUtils';
import { hexToRgba } from '../utils/calendarUtils';

interface SubjectCardProps {
  subject: Subject;
  effectiveMode: 'light' | 'dark';
  colors: any;
  onEdit: (subject: Subject) => void;
  onSelect?: (subject: Subject) => void; // NEW optional prop for selection
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject, effectiveMode, colors, onEdit, onSelect }) => (
  <div className="flex items-stretch gap-2">
    <div
      className={`flex-1 ${colors.container} rounded-l-2xl rounded-r-lg ${colors.border} border p-4 cursor-pointer`}
      onClick={() => onSelect && onSelect(subject)}
    >
      <div className="flex items-center gap-3">
        {getSubjectIcon(subject, 20, effectiveMode)}
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: hexToRgba(subject.colour, 0.95) }}
        />
        <span className={`font-medium capitalize ${colors.containerText}`}>{subject.name}</span>
      </div>
    </div>
    <EditButton onEdit={() => onEdit(subject)} colors={colors} />
  </div>
);

// Separate component so the springy press animation has its own local state
// without re-rendering (or being reset by) the rest of the subject card.
const EditButton: React.FC<{ onEdit: () => void; colors: any }> = ({ onEdit, colors }) => {
  const [isPopping, setIsPopping] = React.useState(false);
  return (
    <button
      onClick={() => {
        setIsPopping(true);
        onEdit();
      }}
      onAnimationEnd={() => setIsPopping(false)}
      className={`${colors.container} bg-white/10 ${colors.border} border rounded-r-2xl rounded-l-lg px-3 flex items-center justify-center ${colors.containerText} opacity-70 hover:opacity-100 active:scale-90 transition-all duration-150 ${isPopping ? 'animate-edit-pop' : ''}`}
      title="Edit subject"
    >
      <Edit2 size={20} />
    </button>
  );
};

export default SubjectCard; 