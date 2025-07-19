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
  handleFileInput: (e: React.ChangeEvent<HTMLInputElement> | File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  effectiveMode: 'light' | 'dark';
  navigate: (path: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = (props: WelcomeScreenProps) => {
  const {
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
    handleFileInput,
    fileInputRef,
    effectiveMode,
    navigate
  } = props;

  const [agreeLegal, setAgreeLegal] = React.useState(false);
  const [agreeLicense, setAgreeLicense] = React.useState(false);

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
          <div className="mb-6 space-y-4">
            <label className="flex items-center gap-3">
              <div className="checkbox-wrapper-30">
                <span className="checkbox">
                  <input type="checkbox" checked={agreeLegal} onChange={e => setAgreeLegal(e.target.checked)} />
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
              <span className={`text-base ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>I agree to the Terms & Conditions and Privacy Policy</span>
            </label>
            <label className="flex items-center gap-3">
              <div className="checkbox-wrapper-30">
                <span className="checkbox">
                  <input type="checkbox" checked={agreeLicense} onChange={e => setAgreeLicense(e.target.checked)} />
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
              <span className={`text-base ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>I agree to be bound by Licensing</span>
            </label>
          </div>
          <button
            onClick={() => setWelcomeStep('name_input')}
            className={`bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${!(agreeLegal && agreeLicense) ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!(agreeLegal && agreeLicense)}
          >
            Get Started
          </button>
          <style>{`
          /* Checkbox CSS by Saeed Alipoor */
          .checkbox-wrapper-30 .checkbox {
            --bg: #fff;
            --brdr: #d1d6ee;
            --brdr-actv: #1e2235;
            --brdr-hovr: #bbc1e1;
            --dur: calc((var(--size, 2)/2) * 0.6s);
            display: inline-block;
            width: calc(var(--size, 1) * 22px);
            position: relative;
          }
          .checkbox-wrapper-30 .checkbox:after {
            content: "";
            width: 100%;
            padding-top: 100%;
            display: block;
          }
          .checkbox-wrapper-30 .checkbox > * {
            position: absolute;
          }
          .checkbox-wrapper-30 .checkbox input {
            -webkit-appearance: none;
            -moz-appearance: none;
            -webkit-tap-highlight-color: transparent;
            cursor: pointer;
            background-color: var(--bg);
            border-radius: calc(var(--size, 1) * 4px);
            border: calc(var(--newBrdr, var(--size, 1)) * 1px) solid;
            color: var(--newBrdrClr, var(--brdr));
            outline: none;
            margin: 0;
            padding: 0;
            transition: all calc(var(--dur) / 3) linear;
          }
          .checkbox-wrapper-30 .checkbox input:hover,
          .checkbox-wrapper-30 .checkbox input:checked {
            --newBrdr: calc(var(--size, 1) * 2);
          }
          .checkbox-wrapper-30 .checkbox input:hover {
            --newBrdrClr: var(--brdr-hovr);
          }
          .checkbox-wrapper-30 .checkbox input:checked {
            --newBrdrClr: var(--brdr-actv);
            transition-delay: calc(var(--dur) /1.3);
          }
          .checkbox-wrapper-30 .checkbox input:checked + svg {
            --dashArray: 16 93;
            --dashOffset: 109;
          }
          .checkbox-wrapper-30 .checkbox svg {
            fill: none;
            left: 0;
            pointer-events: none;
            stroke: var(--stroke, var(--border-active));
            stroke-dasharray: var(--dashArray, 93);
            stroke-dashoffset: var(--dashOffset, 94);
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-width: 2px;
            top: 0;
            transition: stroke-dasharray var(--dur), stroke-dashoffset var(--dur);
          }
          .checkbox-wrapper-30 .checkbox svg,
          .checkbox-wrapper-30 .checkbox input {
            display: block;
            height: 100%;
            width: 100%;
          }
          `}</style>
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
          <h2 className={`text-3xl font-bold mb-6 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Upload or Import Your Timetable</h2>
          <p className={`mb-4 text-base ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Upload an ICS calendar or import your .school file.</p>
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
                <p className={`text-lg font-medium mb-2 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Upload or Import File</p>
                <p className={`text-sm mb-4 ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>
                  Drag and drop your <b>.ics</b> or <b>.school</b> file here or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 mx-auto"
                >
                  <FileText size={20} />
                  Upload or Import
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".ics,.school"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </div>
          </div>
          {loading && (
            <div className="text-center py-8">
              <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${effectiveMode === 'light' ? 'border-black' : 'border-blue-400'} mx-auto mb-4`}></div>
              <p className={`${effectiveMode === 'light' ? 'text-black' : 'text-gray-400'}`}>Processing your calendar...</p>
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