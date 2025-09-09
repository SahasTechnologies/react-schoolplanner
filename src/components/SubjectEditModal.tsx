import React, { useRef } from 'react';
import { 
  Edit2, Calculator, FlaskConical, Palette, Music, Globe, Dumbbell, Languages, 
  Code2, Brain, Mic2, Users, Heart, Star, Zap, Rocket, 
  Camera, Coffee, Gamepad2, Headphones, Lightbulb, Paintbrush, Trophy, Crown, 
  Sun, Moon, Flame, Flower2 as Flower, Apple, Pizza, Car, Plane, Home, 
  School, Laptop, Smartphone, Book
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

  // Available icon options - showing most popular ones first
  const iconOptions = [
    { name: 'Book', component: Book, label: 'General' },
    { name: 'Calculator', component: Calculator, label: 'Mathematics' },
    { name: 'FlaskConical', component: FlaskConical, label: 'Science' },
    { name: 'Palette', component: Palette, label: 'Arts' },
    { name: 'Music', component: Music, label: 'Music' },
    { name: 'Globe', component: Globe, label: 'Geography' },
    { name: 'Dumbbell', component: Dumbbell, label: 'Sports' },
    { name: 'Languages', component: Languages, label: 'Languages' },
    { name: 'Code2', component: Code2, label: 'Technology' },
    { name: 'Brain', component: Brain, label: 'STEM' },
    { name: 'Mic2', component: Mic2, label: 'Drama' },
    { name: 'Users', component: Users, label: 'Social' },
    { name: 'Heart', component: Heart, label: 'Love' },
    { name: 'Star', component: Star, label: 'Special' },
    { name: 'Zap', component: Zap, label: 'Energy' },
    { name: 'Rocket', component: Rocket, label: 'Space' },
    { name: 'Camera', component: Camera, label: 'Photography' },
    { name: 'Coffee', component: Coffee, label: 'Coffee' },
    { name: 'Gamepad2', component: Gamepad2, label: 'Gaming' },
    { name: 'Headphones', component: Headphones, label: 'Audio' },
    { name: 'Lightbulb', component: Lightbulb, label: 'Ideas' },
    { name: 'Paintbrush', component: Paintbrush, label: 'Art' },
    { name: 'Trophy', component: Trophy, label: 'Achievement' },
    { name: 'Crown', component: Crown, label: 'Royal' },
    { name: 'Sun', component: Sun, label: 'Sunny' },
    { name: 'Moon', component: Moon, label: 'Night' },
    { name: 'Flame', component: Flame, label: 'Fire' },
    { name: 'Flower', component: Flower, label: 'Nature' },
    { name: 'Apple', component: Apple, label: 'Healthy' },
    { name: 'Pizza', component: Pizza, label: 'Food' },
    { name: 'Car', component: Car, label: 'Transport' },
    { name: 'Plane', component: Plane, label: 'Travel' },
    { name: 'Home', component: Home, label: 'Home' },
    { name: 'School', component: School, label: 'School' },
    { name: 'Laptop', component: Laptop, label: 'Computer' },
    { name: 'Smartphone', component: Smartphone, label: 'Mobile' }
  ];

  if (!showSubjectEditModal || !selectedSubjectForEdit) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className={`${colors.container} rounded-lg p-6 shadow-xl border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto`}>
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
              className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
            <div className="grid grid-cols-6 gap-2 mb-4">
              {iconOptions.map((iconOption) => {
                const IconComponent = iconOption.component;
                return (
                  <button
                    key={iconOption.name}
                    className={`w-10 h-10 rounded-lg border-2 ${
                      editIcon === iconOption.name ? 'border-blue-400 bg-blue-500/20' : 'border-gray-600 hover:border-gray-500'
                    } flex items-center justify-center transition-all duration-200 hover:scale-105`}
                    onClick={() => setEditIcon(iconOption.name)}
                    title={iconOption.label}
                    type="button"
                  >
                    <IconComponent 
                      size={18} 
                      className={effectiveMode === 'light' ? 'text-black' : 'text-white'} 
                    />
                  </button>
                );
              })}
            </div>
            

            
            {editIcon && (
              <div className="flex items-center gap-2 text-gray-300 text-sm mt-2">
                Selected: {iconOptions.find(opt => opt.name === editIcon)?.label || editIcon}
              </div>
            )}
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