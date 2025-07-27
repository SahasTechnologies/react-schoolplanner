import React, { useRef, useState } from 'react';
import { 
  Edit2, 
  Calculator, 
  FlaskConical, 
  Palette, 
  Music, 
  Globe, 
  Dumbbell, 
  Languages, 
  Code2, 
  Brain, 
  Mic2, 
  Users, 
  BookOpen, 
  PenLine, 
  BookUser, 
  Briefcase, 
  HeartHandshake, 
  Library, 
  BookMarked, 
  Star, 
  GraduationCap, 
  Bot, 
  Book, 
  Utensils,
  // Additional icons
  Camera, 
  Gamepad2, 
  Beaker, 
  Microscope, 
  Piano, 
  Guitar, 
  Paintbrush, 
  Scissors, 
  Wrench, 
  Hammer, 
  TreePine, 
  Leaf, 
  Mountain, 
  Waves, 
  Sun, 
  Moon, 
  Zap, 
  Lightbulb, 
  Target, 
  Trophy, 
  Medal, 
  Award, 
  Crown, 
  Gem, 
  Heart, 
  Smile, 
  Coffee, 
  Cookie,
  ExternalLink
} from 'lucide-react';
import { Subject } from '../types';

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

// Available icons for selection
const availableIcons = [
  { name: 'Calculator', component: Calculator, label: 'Calculator' },
  { name: 'FlaskConical', component: FlaskConical, label: 'Science' },
  { name: 'Palette', component: Palette, label: 'Art' },
  { name: 'Music', component: Music, label: 'Music' },
  { name: 'Globe', component: Globe, label: 'Geography' },
  { name: 'Dumbbell', component: Dumbbell, label: 'PE/Sport' },
  { name: 'Languages', component: Languages, label: 'Languages' },
  { name: 'Code2', component: Code2, label: 'Computing' },
  { name: 'Brain', component: Brain, label: 'STEM' },
  { name: 'Mic2', component: Mic2, label: 'Drama' },
  { name: 'Users', component: Users, label: 'Group' },
  { name: 'BookOpen', component: BookOpen, label: 'Reading' },
  { name: 'PenLine', component: PenLine, label: 'Writing' },
  { name: 'BookUser', component: BookUser, label: 'Study' },
  { name: 'Briefcase', component: Briefcase, label: 'Business' },
  { name: 'HeartHandshake', component: HeartHandshake, label: 'Wellbeing' },
  { name: 'Library', component: Library, label: 'Library' },
  { name: 'BookMarked', component: BookMarked, label: 'History' },
  { name: 'Star', component: Star, label: 'Featured' },
  { name: 'GraduationCap', component: GraduationCap, label: 'Academic' },
  { name: 'Bot', component: Bot, label: 'Robotics' },
  { name: 'Book', component: Book, label: 'General' },
  { name: 'Utensils', component: Utensils, label: 'Food/Break' },
  // Additional icons
  { name: 'Camera', component: Camera, label: 'Photography' },
  { name: 'Gamepad2', component: Gamepad2, label: 'Gaming' },
  { name: 'Beaker', component: Beaker, label: 'Chemistry' },
  { name: 'Microscope', component: Microscope, label: 'Biology' },
  { name: 'Piano', component: Piano, label: 'Piano' },
  { name: 'Guitar', component: Guitar, label: 'Guitar' },
  { name: 'Paintbrush', component: Paintbrush, label: 'Painting' },
  { name: 'Scissors', component: Scissors, label: 'Crafts' },
  { name: 'Wrench', component: Wrench, label: 'Engineering' },
  { name: 'Hammer', component: Hammer, label: 'Workshop' },
  { name: 'TreePine', component: TreePine, label: 'Environment' },
  { name: 'Leaf', component: Leaf, label: 'Nature' },
  { name: 'Mountain', component: Mountain, label: 'Outdoor Ed' },
  { name: 'Waves', component: Waves, label: 'Marine' },
  { name: 'Sun', component: Sun, label: 'Solar' },
  { name: 'Moon', component: Moon, label: 'Astronomy' },
  { name: 'Zap', component: Zap, label: 'Energy' },
  { name: 'Lightbulb', component: Lightbulb, label: 'Innovation' },
  { name: 'Target', component: Target, label: 'Goals' },
  { name: 'Trophy', component: Trophy, label: 'Achievement' },
  { name: 'Medal', component: Medal, label: 'Awards' },
  { name: 'Award', component: Award, label: 'Recognition' },
  { name: 'Crown', component: Crown, label: 'Excellence' },
  { name: 'Gem', component: Gem, label: 'Precious' },
  { name: 'Heart', component: Heart, label: 'Care' },
  { name: 'Smile', component: Smile, label: 'Fun' },
  { name: 'Coffee', component: Coffee, label: 'Cafe' },
  { name: 'Cookie', component: Cookie, label: 'Baking' },
];

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
  colors,
  defaultColours
}) => {
  const customColourInputRef = useRef<HTMLInputElement>(null);
  const [customIconName, setCustomIconName] = useState('');
  const [showCustomIconInput, setShowCustomIconInput] = useState(false);

  if (!showSubjectEditModal || !selectedSubjectForEdit) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className={`${colors.container} rounded-lg p-6 shadow-xl border border-gray-700 w-full max-w-md max-h-screen overflow-y-auto`}>
        <h3 className={`text-xl font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'} mb-4`}>Edit Subject</h3>
        <p className={`text-gray-400 text-sm mb-4 ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>
          Original Name: <span className={`font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>
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
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="subjectColour" className={`block ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>
              Subject Colour
            </label>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {defaultColours.map((colour, index) => (
                <button
                  key={index}
                  className={`w-8 h-8 rounded-full border-2 ${editColour === colour ? 'border-blue-400' : 'border-gray-600'} transition-all duration-200 hover:scale-110`}
                  style={{ backgroundColor: colour }}
                  onClick={() => setEditColour(colour)}
                  title={colour}
                />
              ))}
              {/* Custom Colour Button */}
              <button
                className={`w-8 h-8 rounded-full border-2 ${editColour && !defaultColours.includes(editColour) ? 'border-blue-400' : 'border-gray-600'} flex items-center justify-center transition-all duration-200 hover:scale-110`}
                style={{ background: 'linear-gradient(to right, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3)' }}
                onClick={() => customColourInputRef.current?.click()}
                title="Choose Custom Colour"
              >
                <Edit2 size={16} className="text-white" />
              </button>
              <input
                ref={customColourInputRef}
                type="color"
                value={editColour}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditColour(e.target.value)}
                className="hidden"
              />
            </div>
            {/* Display currently selected custom colour if it's not in default palette */}
            {!defaultColours.includes(editColour) && (
              <div className="flex items-center gap-2 text-gray-300 text-sm mt-2">
                Selected: <div className="w-5 h-5 rounded-full border border-gray-600" style={{ backgroundColor: editColour }}></div> {editColour}
              </div>
            )}
          </div>
          <div>
            <label className={`block ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>
              Subject Icon
            </label>
            <div className="grid grid-cols-6 gap-2 mb-2">
              {availableIcons.map((iconData) => {
                const IconComponent = iconData.component;
                const isSelected = editIcon === iconData.name;
                return (
                  <button
                    key={iconData.name}
                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                      isSelected 
                        ? 'border-blue-400 bg-blue-500/20' 
                        : effectiveMode === 'light' 
                          ? 'border-gray-300 hover:border-gray-400' 
                          : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => setEditIcon(iconData.name)}
                    title={iconData.label}
                  >
                    <IconComponent 
                      size={20} 
                      className={effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-300'} 
                    />
                  </button>
                );
              })}
            </div>
            {/* Custom Icon Input */}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowCustomIconInput(!showCustomIconInput)}
                className={`text-sm px-3 py-1 rounded-md border transition-colors ${effectiveMode === 'light' ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}
              >
                {showCustomIconInput ? 'Hide Custom Icon' : 'Use Custom Icon'}
              </button>
              
              {showCustomIconInput && (
                <div className="mt-3 space-y-2">
                  <div className={`text-xs ${effectiveMode === 'light' ? 'text-gray-600' : 'text-gray-400'} flex items-center gap-1`}>
                    <ExternalLink size={12} />
                    Visit <a href="https://lucide.dev/icons" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 underline">lucide.dev/icons</a> and copy an icon name
                  </div>
                  <input
                    type="text"
                    value={customIconName}
                    onChange={(e) => setCustomIconName(e.target.value)}
                    placeholder="e.g., Atom, Rocket, Shield, etc."
                    className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${effectiveMode === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customIconName.trim()) {
                        setEditIcon(customIconName.trim());
                        setCustomIconName('');
                        setShowCustomIconInput(false);
                      }
                    }}
                    disabled={!customIconName.trim()}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Apply Custom Icon
                  </button>
                </div>
              )}
            </div>
            
            {/* Display currently selected icon name */}
            <div className={`text-sm ${effectiveMode === 'light' ? 'text-gray-600' : 'text-gray-400'} mt-3`}>
              Selected: {availableIcons.find(icon => icon.name === editIcon)?.label || editIcon || 'Default'}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={cancelSubjectEdit}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={saveSubjectEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectEditModal; 