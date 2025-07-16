import React from 'react';
import { Upload, FileText, User } from 'lucide-react';

interface WelcomeScreenProps {
  welcomeStep: 'welcome' | 'name_input' | 'upload_ics' | 'completed';
  userName: string;
  setUserName: (name: string) => void;
  setWelcomeStep: (step: 'welcome' | 'name_input' | 'upload_ics' | 'completed') => void;
  loading: boolean;
  error: string;
  dragOver: boolean;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  effectiveMode: 'light' | 'dark';
  navigate: (path: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  welcomeStep,
  userName,
  setUserName,
  setWelcomeStep,
  loading,
  error,
  dragOver,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileChange,
  fileInputRef,
  effectiveMode,
  navigate
}) => {
  if (welcomeStep === 'completed') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h2 className={`text-3xl font-bold mb-4 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Setup Complete</h2>
        <p className={`${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'} mb-6`}>You have already uploaded your timetable and name. To change them, go to Settings.</p>
        <button
          onClick={() => navigate('/settings')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Go to Settings
        </button>
      </div>
    );
  }

  switch (welcomeStep) {
    case 'welcome':
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <h1 className={`text-5xl font-bold mb-4 animate-fade-in-down ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Welcome!</h1>
          <p className={`text-xl mb-8 animate-fade-in-up ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Your personal school planner.</p>
          <button
            onClick={() => setWelcomeStep('name_input')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Get Started
          </button>
        </div>
      );
    case 'name_input':
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <User size={64} className="text-blue-400 mb-6 animate-bounce-in" />
          <h2 className={`text-3xl font-bold mb-4 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>What's your name? (Optional)</h2>
          <p className={`${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-300'} mb-6`}>We'll use this to greet you!</p>
          <input
            type="text"
            value={userName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserName(e.target.value)}
            placeholder="Enter your name"
            className={`w-full max-w-sm px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6 text-lg ${effectiveMode === 'light' ? 'bg-gray-100 text-black border-gray-300' : 'bg-gray-700 text-white border-gray-600'}`}
          />
          <button
            onClick={() => setWelcomeStep('upload_ics')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Next
          </button>
        </div>
      );
    case 'upload_ics':
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <h2 className={`text-3xl font-bold mb-6 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Upload Your Timetable</h2>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 w-full max-w-lg ${
              dragOver
                ? 'border-blue-400 bg-blue-400/10'
                : effectiveMode === 'light'
                  ? 'border-gray-300 hover:border-gray-400 bg-white'
                  : 'border-gray-600 hover:border-gray-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4">
              <Upload size={48} className={effectiveMode === 'light' ? 'text-gray-400' : 'text-gray-400'} />
              <div>
                <p className={`text-lg font-medium mb-2 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Upload ICS Calendar File</p>
                <p className={`text-sm mb-4 ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>
                  Drag and drop your .ics file here or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 mx-auto"
                >
                  <FileText size={20} />
                  Choose File
                </button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ics"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className={effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}>Processing your calendar...</p>
            </div>
          )}
          {error && (
            <div className={`border rounded-lg p-4 mt-6 w-full max-w-lg ${effectiveMode === 'light' ? 'bg-red-100 border-red-400' : 'bg-red-900/20 border-red-500'}`}>
              <div className={`flex items-center gap-2 ${effectiveMode === 'light' ? 'text-red-600' : 'text-red-400'}`}>
                <FileText size={20} />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}
        </div>
      );
    default:
      return null;
  }
};

export default WelcomeScreen; 