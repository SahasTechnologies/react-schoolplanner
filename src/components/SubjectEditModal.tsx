import React, { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as LucideIcons from 'lucide-react';
import { Edit2, Check } from 'lucide-react';
import { Subject } from '../types';
import { colourPaletteGroups } from '../utils/fileUtils';

interface SubjectEditModalProps {
  showSubjectEditModal: boolean;
  selectedSubjectForEdit: Subject | null;
  editName: string;
  setEditName: (name: string) => void;
  editColour: string;
  setEditColour: (colour: string) => void;
  editIcon: string;
  setEditIcon: (icon: string) => void;
  saveSubjectEdit: () => void;
  cancelSubjectEdit: () => void;
  effectiveMode: 'light' | 'dark';
  colors: any;
  defaultColours: string[];
}

// Curated default icon list without duplicates
const DEFAULT_ICON_NAMES = [
  'Book', 'Calculator', 'FlaskConical', 'Palette', 'Music', 'Globe', 'Dumbbell', 'Languages',
  'Code2', 'Brain', 'Mic2', 'Users', 'Heart', 'Star', 'Zap', 'Rocket',
  'Camera', 'Coffee', 'Gamepad2', 'Headphones', 'Lightbulb', 'Paintbrush', 'Trophy', 'Crown',
  'Sun', 'Moon', 'Flame', 'Flower2', 'Apple', 'Pizza', 'Car', 'Plane', 'Home',
  'School', 'Laptop', 'Smartphone', 'Atom', 'Bike', 'Cloud', 'Compass', 'Cpu', 'Database',
  'Dices', 'Eye', 'FileText', 'Landmark', 'Map', 'MessageCircle', 'Microscope', 'Mountain',
  'NotebookPen', 'Orbit', 'PawPrint', 'Puzzle', 'Sigma', 'Telescope',
  'Timer', 'TreePine', 'WandSparkles', 'Waves', 'Workflow', 'GraduationCap', 'ShieldCheck', 'Sparkles'
];

export const renderLucideIconByName = (name: string, size = 18, className = '') => {
  if (!name) return null;
  // Try exact match, then capitalized match
  const cleanName = name.trim();
  const IconComponent = (LucideIcons as any)[cleanName] || (LucideIcons as any)[cleanName.charAt(0).toUpperCase() + cleanName.slice(1)];
  if (IconComponent && typeof IconComponent === 'object' || typeof IconComponent === 'function') {
    const Component = IconComponent;
    return <Component size={size} className={className} />;
  }
  return null;
};

const SubjectEditModal: React.FC<SubjectEditModalProps> = ({
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
  effectiveMode,
  colors
}) => {
  const customColourInputRef = useRef<HTMLInputElement>(null);
  const allPaletteColours = [
    ...colourPaletteGroups.normal,
    ...colourPaletteGroups.naturals,
    ...colourPaletteGroups.dark,
  ];
  const groupContaining = (colour: string): 'normal' | 'naturals' | 'dark' => {
    if (colourPaletteGroups.dark.includes(colour)) return 'dark';
    if (colourPaletteGroups.naturals.includes(colour)) return 'naturals';
    return 'normal';
  };
  const [paletteGroup, setPaletteGroup] = React.useState<'normal' | 'naturals' | 'dark'>(() => groupContaining(editColour));
  const [iconSearch, setIconSearch] = useState('');
  const [customIconInput, setCustomIconInput] = useState('');

  React.useEffect(() => {
    if (selectedSubjectForEdit) {
      setPaletteGroup(groupContaining(editColour));
      setIconSearch('');
      setCustomIconInput('');
    }
  }, [selectedSubjectForEdit?.id]);

  const activeColours = colourPaletteGroups[paletteGroup];

  // All valid Lucide icon names from library
  const allLucideIconNames = useMemo(() => {
    return Object.keys(LucideIcons).filter(key => {
      if (key === 'createLucideIcon' || key === 'default' || key.endsWith('Icon')) return false;
      const item = (LucideIcons as any)[key];
      return typeof item === 'function' || (typeof item === 'object' && item !== null);
    });
  }, []);

  const filteredIcons = useMemo(() => {
    const query = iconSearch.trim().toLowerCase();
    if (!query) {
      return DEFAULT_ICON_NAMES;
    }
    // Search across ALL Lucide icons
    return allLucideIconNames.filter(name => name.toLowerCase().includes(query)).slice(0, 72);
  }, [iconSearch, allLucideIconNames]);

  const customIconPreview = useMemo(() => {
    if (!customIconInput.trim()) return null;
    return renderLucideIconByName(customIconInput, 20);
  }, [customIconInput]);

  if (!showSubjectEditModal || !selectedSubjectForEdit) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" style={{ zIndex: 9999 }} onClick={cancelSubjectEdit}>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div 
        onClick={(e) => e.stopPropagation()} 
        className={`${colors.container} rounded-2xl p-6 sm:p-7 shadow-2xl border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar animate-fadeIn`}
      >
        <div className="flex items-center gap-3 mb-4">
          <Edit2 className={colors.containerText} size={26} />
          <h3 className={`text-2xl font-bold ${colors.containerText}`}>Edit Subject</h3>
        </div>
        <p className={`text-gray-400 text-sm mb-4 ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>
          Original Name: <span className={`font-medium ${colors.containerText}`}>
            {selectedSubjectForEdit.originalName || selectedSubjectForEdit.name}
          </span>
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="subjectName" className={`block ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-1`}>
              Subject Name
            </label>
            <input
              id="subjectName"
              type="text"
              value={editName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                effectiveMode === 'light' 
                  ? 'bg-white text-black border-gray-300' 
                  : 'bg-gray-700 text-white border-gray-600'
              }`}
            />
          </div>
          <div>
            <label htmlFor="subjectColour" className={`block ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>
              Subject Colour
            </label>
            {/* Palette group tabs */}
            <div className="flex gap-2 mb-3">
              {(['normal', 'naturals', 'dark'] as const).map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setPaletteGroup(group)}
                  className={`flex-1 px-3 py-1.5 rounded-xl text-sm font-medium capitalize transition-all duration-150 active:scale-95 ${
                    paletteGroup === group
                      ? `${colors.buttonAccent} ${colors.buttonText}`
                      : `${colors.buttonSecondary} ${colors.buttonSecondaryHover}`
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-6 gap-2 mb-3">
              {activeColours.map((colour, index) => (
                <button
                  key={index}
                  className={`w-8 h-8 rounded-full border-2 ${editColour === colour ? 'border-blue-400 scale-110' : 'border-gray-600'} transition-all duration-200 hover:scale-110 active:scale-95`}
                  style={{ backgroundColor: colour }}
                  onClick={() => setEditColour(colour)}
                  title={colour}
                  type="button"
                />
              ))}
              {/* Custom Colour Button */}
              <button
                className={`w-8 h-8 rounded-full border-2 ${editColour && !allPaletteColours.includes(editColour) ? 'border-blue-400 scale-110' : 'border-gray-600'} flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95`}
                style={{ background: 'linear-gradient(to right, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3)' }}
                onClick={() => customColourInputRef.current?.click()}
                title="Choose Custom Colour"
                type="button"
              >
                <span className="w-5 h-5 rounded-full bg-black/55 flex items-center justify-center">
                  <Edit2 size={12} className="text-white" />
                </span>
              </button>
              <input
                ref={customColourInputRef}
                type="color"
                value={editColour}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditColour(e.target.value)}
                className="hidden"
              />
            </div>
            {!allPaletteColours.includes(editColour) && (
              <div className="flex items-center gap-2 text-gray-300 text-sm mt-1">
                Selected: <div className="w-4 h-4 rounded-full border border-gray-600" style={{ backgroundColor: editColour }}></div> {editColour}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`block ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium`}>
                Subject Icon
              </label>
              {editIcon && (
                <div className="flex items-center gap-1 text-xs opacity-80">
                  <span>Selected:</span>
                  <span className="font-semibold">{editIcon}</span>
                </div>
              )}
            </div>

            <input
              type="search"
              value={iconSearch}
              onChange={(e) => setIconSearch(e.target.value)}
              placeholder="Search all Lucide icons…"
              aria-label="Search subject icons"
              className={`w-full mb-3 px-3 py-2 rounded-xl border ${colors.border} ${colors.input} ${colors.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />

            {/* Custom Icon Name Input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={customIconInput}
                onChange={(e) => setCustomIconInput(e.target.value)}
                placeholder="Or type any Lucide icon name (e.g. Shield, Cpu, Binary)..."
                className={`flex-1 px-3 py-1.5 text-xs rounded-xl border ${colors.border} ${colors.input} ${colors.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <button
                type="button"
                disabled={!customIconPreview}
                onClick={() => {
                  if (customIconInput.trim()) {
                    setEditIcon(customIconInput.trim());
                    setCustomIconInput('');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${colors.buttonAccent} ${colors.buttonText}`}
              >
                {customIconPreview && <span className="flex-shrink-0">{customIconPreview}</span>}
                <span>Use Icon</span>
              </button>
            </div>

            <div className="grid grid-cols-6 gap-2 mb-2 max-h-52 overflow-y-auto custom-scrollbar p-1">
              {filteredIcons.map((iconName) => {
                const iconElement = renderLucideIconByName(iconName, 18, colors.containerText);
                if (!iconElement) return null;
                const isSelected = editIcon === iconName;
                return (
                  <button
                    key={iconName}
                    className={`w-10 h-10 rounded-xl border-2 ${
                      isSelected ? 'border-blue-400 bg-blue-500/20 scale-105' : 'border-gray-600 hover:border-gray-400'
                    } flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95`}
                    onClick={() => setEditIcon(iconName)}
                    title={iconName}
                    type="button"
                  >
                    {iconElement}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={cancelSubjectEdit}
            type="button"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-150 hover:scale-105 active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={saveSubjectEdit}
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-150 hover:scale-105 active:scale-95 flex items-center gap-1.5"
          >
            <Check size={16} />
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SubjectEditModal;
 