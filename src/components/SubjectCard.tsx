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
  <div
    className={`${colors.container} rounded-lg ${colors.border} border p-4 cursor-pointer`} // Make cursor pointer
    onClick={() => onSelect && onSelect(subject)} // Trigger onSelect when provided
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {getSubjectIcon(subject.name, 20, effectiveMode)}
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: hexToRgba(subject.colour, 0.95) }}
        />
        <span className={`font-medium capitalize ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>{subject.name}</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent parent click
          onEdit(subject);
        }}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <Edit2 size={16} />
      </button>
    </div>
  </div>
);

export default SubjectCard; 