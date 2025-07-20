import React, { useState, useEffect } from 'react';
import { Upload, FileText, User } from 'lucide-react';
import Markdown from 'markdown-to-jsx';

interface WelcomeScreenProps {
  welcomeStep: 'upload' | 'name_input' | 'legal' | 'completed';
  userName: string;
  setUserName: (name: string) => void;
  setWelcomeStep: (step: 'upload' | 'name_input' | 'legal' | 'completed') => void;
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
  colors: any;
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
    navigate,
    colors,
  } = props;

  const [agreeLegal, setAgreeLegal] = useState(false);
  const [agreeLicense, setAgreeLicense] = useState(false);
  // Add props for modal openers
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showLicensing, setShowLicensing] = useState(false);
  const [termsContent, setTermsContent] = useState('');
  const [privacyContent, setPrivacyContent] = useState('');
  const [licenseContent, setLicenseContent] = useState('');
  const [loadingMarkdown, setLoadingMarkdown] = useState<string | null>(null);
  const [markdownError, setMarkdownError] = useState<string | null>(null);

  // Fetch markdown when modal opens
  useEffect(() => {
    if (showTerms && !termsContent) {
      setLoadingMarkdown('terms');
      fetch('/terms.md')
        .then(res => res.ok ? res.text() : Promise.reject('Failed to load Terms and Conditions'))
        .then(setTermsContent)
        .catch(() => setMarkdownError('Failed to load Terms and Conditions'))
        .finally(() => setLoadingMarkdown(null));
    }
    if (showPrivacy && !privacyContent) {
      setLoadingMarkdown('privacy');
      fetch('/privacy.md')
        .then(res => res.ok ? res.text() : Promise.reject('Failed to load Privacy Policy'))
        .then(setPrivacyContent)
        .catch(() => setMarkdownError('Failed to load Privacy Policy'))
        .finally(() => setLoadingMarkdown(null));
    }
    if (showLicensing && !licenseContent) {
      setLoadingMarkdown('license');
      fetch('/license.md')
        .then(res => res.ok ? res.text() : Promise.reject('Failed to load Licensing'))
        .then(setLicenseContent)
        .catch(() => setMarkdownError('Failed to load Licensing'))
        .finally(() => setLoadingMarkdown(null));
    }
  }, [showTerms, showPrivacy, showLicensing]);

  if (welcomeStep === 'completed') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h2 className={`text-3xl font-bold mb-4 ${colors.buttonText}`}>Setup Complete</h2>
        <p className={`${colors.buttonText} opacity-80 mb-6`}>You have already uploaded your timetable and name. To change them, go to Settings.</p>
        <button
          onClick={() => navigate('/settings')}
          className={`${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105`}
        >
          Go to Settings
        </button>
      </div>
    );
  }

  // Add step order and helper
  const stepOrder = ['legal', 'upload', 'name_input'];
  const stepIndex = stepOrder.indexOf(welcomeStep);

  // Add step circles at the top
  const StepCircles = () => (
    <div className="flex justify-center items-center gap-4 mb-8 mt-2">
      {stepOrder.map((step, idx) => {
        const isActive = stepIndex === idx;
        const isCompleted = idx < stepIndex;
        const isUpcoming = idx > stepIndex;
        return (
          <button
            key={step}
            type="button"
            disabled={isUpcoming}
            onClick={() => isCompleted && setWelcomeStep(step as typeof welcomeStep)}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 focus:outline-none border-2
              ${isActive ? `${colors.buttonAccent} shadow-lg` : 'bg-transparent border-gray-300'}
              ${isCompleted ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
            `}
            aria-label={`Step ${idx + 1}`}
            tabIndex={isCompleted ? 0 : -1}
          >
            <span className={isActive ? 'text-white' : 'text-gray-400'}>{idx + 1}</span>
          </button>
        );
      })}
    </div>
  );

  // For the main container, add bg-gray-50 in light mode
  const containerBg = effectiveMode === 'light' ? 'bg-gray-50' : '';

  switch (welcomeStep) {
    case 'legal':
      return (
        <div className={`flex flex-col items-center justify-center h-full text-center p-8 relative ${containerBg}`}>
          <div className="fixed top-0 left-0 w-full flex justify-center z-50 pt-8 pointer-events-none">
            <StepCircles />
          </div>
          <h1 className={`text-5xl font-bold mb-4 animate-fade-in-down ${colors.buttonText}`}>Welcome to School Planner!</h1>
          <p className={`text-xl mb-8 animate-fade-in-up ${colors.buttonText} opacity-80`}>Your personal school planner.</p>
          <div className="mb-6 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
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
              <span className={`text-base ${colors.text}`}>I agree to the <span className="underline hover:text-primary transition-colors duration-200 cursor-pointer" onClick={e => {e.stopPropagation(); setShowTerms(true);}}>Terms & Conditions</span> and <span className="underline hover:text-primary transition-colors duration-200 cursor-pointer" onClick={e => {e.stopPropagation(); setShowPrivacy(true);}}>Privacy Policy</span></span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
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
              <span className={`text-base ${colors.text}`}>I agree to be bound by <span className="underline hover:text-primary transition-colors duration-200 cursor-pointer" onClick={e => {e.stopPropagation(); setShowLicensing(true);}}>Licensing</span></span>
            </label>
          </div>
          <button
            onClick={() => setWelcomeStep('upload')}
            className={`${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${!(agreeLegal && agreeLicense) ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!(agreeLegal && agreeLicense)}
          >
            Next
          </button>
          {showTerms && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className={`bg-gray-50 dark:bg-gray-900 rounded-lg p-6 shadow-xl border border-gray-700 w-full max-w-lg relative max-h-[80vh] overflow-y-auto custom-scrollbar-${effectiveMode}`}>
                <button onClick={() => { setShowTerms(false); setMarkdownError(null); }} className="absolute top-4 right-4 text-2xl opacity-70 hover:opacity-100 transition text-gray-400">&times;</button>
                {loadingMarkdown === 'terms' ? (
                  <div className="py-8 text-gray-800 dark:text-gray-100">Loading...</div>
                ) : markdownError ? (
                  <div className="text-red-500 py-8">{markdownError}</div>
                ) : (
                  <Markdown className="prose dark:prose-invert max-w-none text-left text-gray-800 dark:text-gray-100">{termsContent}</Markdown>
                )}
              </div>
            </div>
          )}
          {showPrivacy && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className={`bg-gray-50 dark:bg-gray-900 rounded-lg p-6 shadow-xl border border-gray-700 w-full max-w-lg relative max-h-[80vh] overflow-y-auto custom-scrollbar-${effectiveMode}`}>
                <button onClick={() => { setShowPrivacy(false); setMarkdownError(null); }} className="absolute top-4 right-4 text-2xl opacity-70 hover:opacity-100 transition text-gray-400">&times;</button>
                {loadingMarkdown === 'privacy' ? (
                  <div className="py-8 text-gray-800 dark:text-gray-100">Loading...</div>
                ) : markdownError ? (
                  <div className="text-red-500 py-8">{markdownError}</div>
                ) : (
                  <Markdown className="prose dark:prose-invert max-w-none text-left text-gray-800 dark:text-gray-100">{privacyContent}</Markdown>
                )}
              </div>
            </div>
          )}
          {showLicensing && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className={`bg-gray-50 dark:bg-gray-900 rounded-lg p-6 shadow-xl border border-gray-700 w-full max-w-lg relative max-h-[80vh] overflow-y-auto custom-scrollbar-${effectiveMode}`}>
                <button onClick={() => { setShowLicensing(false); setMarkdownError(null); }} className="absolute top-4 right-4 text-2xl opacity-70 hover:opacity-100 transition text-gray-400">&times;</button>
                {loadingMarkdown === 'license' ? (
                  <div className="py-8 text-gray-800 dark:text-gray-100">Loading...</div>
                ) : markdownError ? (
                  <div className="text-red-500 py-8">{markdownError}</div>
                ) : (
                  <Markdown className="prose dark:prose-invert max-w-none text-left text-gray-800 dark:text-gray-100">{licenseContent}</Markdown>
                )}
              </div>
            </div>
          )}
          <style>{`
          /* Set theme variables for checkbox for better light mode visibility */
          .checkbox-wrapper-30 {
            --color-bg: ${colors.container ? (colors.effectiveMode === 'light' ? '#fff' : '#232323') : '#fff'};
            --color-bg-dark: ${colors.container ? (colors.effectiveMode === 'dark' ? '#232323' : '#fff') : '#232323'};
            --color-border: ${colors.border ? (colors.effectiveMode === 'light' ? '#d1d5db' : '#444') : '#d1d5db'};
            --color-primary: ${colors.buttonAccent ? (colors.effectiveMode === 'light' ? '#2563eb' : '#60a5fa') : '#2563eb'};
            --color-primary-light: ${colors.buttonAccentHover ? (colors.effectiveMode === 'light' ? '#93c5fd' : '#2563eb') : '#93c5fd'};
          }
          /* Checkbox CSS by Saeed Alipoor */
          .checkbox-wrapper-30 .checkbox {
            --bg: var(--color-bg);
            --brdr: var(--color-border);
            --brdr-actv: var(--color-primary);
            --brdr-hovr: var(--color-primary-light);
            --tick: ${effectiveMode === 'light' ? '#1e2235' : '#fff'};
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
            stroke: var(--tick);
          }
          .checkbox-wrapper-30 .checkbox svg {
            fill: none;
            left: 0;
            pointer-events: none;
            stroke: var(--tick, var(--border-active));
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
          .custom-scrollbar-light::-webkit-scrollbar {
            width: 10px;
            background: #f1f1f1;
          }
          .custom-scrollbar-light::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 6px;
          }
          .custom-scrollbar-dark::-webkit-scrollbar {
            width: 10px;
            background: #222;
          }
          .custom-scrollbar-dark::-webkit-scrollbar-thumb {
            background: #444;
            border-radius: 6px;
          }
          /* Firefox support */
          .custom-scrollbar-light {
            scrollbar-color: #cbd5e1 #f1f1f1;
            scrollbar-width: thin;
          }
          .custom-scrollbar-dark {
            scrollbar-color: #444 #222;
            scrollbar-width: thin;
          }
          `}</style>
        </div>
      );
    case 'upload':
      return (
        <div className={`flex flex-col items-center justify-center h-full text-center p-8 relative ${containerBg}`}>
          <div className="absolute top-0 left-0 w-full flex justify-center z-10">
            <StepCircles />
          </div>
          <h2 className={`text-3xl font-bold mb-6 ${colors.buttonText}`}>Upload or Import Your Timetable</h2>
          <p className={`mb-4 text-base ${colors.buttonText} opacity-80`}>Upload an ICS calendar or import your .school file.</p>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 w-full max-w-lg ${
              dragOver
                ? 'border-primary/20 bg-primary/5'
                : effectiveMode === 'light'
                  ? 'border-gray-300 hover:border-gray-400 bg-white'
                  : 'border-gray-600 hover:border-gray-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={e => {
              handleDrop(e);
              // If .school file and has name, skip name step
              const file = e.dataTransfer?.files?.[0];
              if (file && file.name.endsWith('.school')) {
                const reader = new FileReader();
                reader.onload = ev => {
                  try {
                    const data = JSON.parse(ev.target?.result as string);
                    if (data && data.userName) {
                      setUserName(data.userName);
                      setWelcomeStep('completed');
                    } else {
                      setWelcomeStep('name_input');
                    }
                  } catch {
                    setWelcomeStep('name_input');
                  }
                };
                reader.readAsText(file);
              } else {
                setWelcomeStep('name_input');
              }
            }}
          >
            <div className="flex flex-col items-center gap-4">
              <Upload size={48} className={effectiveMode === 'light' ? 'text-gray-400' : 'text-gray-400'} />
              <div>
                <p className={`text-lg font-medium mb-2 ${colors.buttonText}`}>Upload or Import File</p>
                <p className={`text-sm mb-4 ${colors.buttonText} opacity-80`}>
                  Drag and drop your <b>.ics</b> or <b>.school</b> file here or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-primary hover:bg-primary-dark text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 mx-auto"
                >
                  <FileText size={20} />
                  Upload or Import
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".ics,.school"
                  onChange={e => {
                    handleFileInput(e);
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file && file.name.endsWith('.school')) {
                      const reader = new FileReader();
                      reader.onload = ev => {
                        try {
                          const data = JSON.parse(ev.target?.result as string);
                          if (data && data.userName) {
                            setUserName(data.userName);
                            setWelcomeStep('completed');
                          } else {
                            setWelcomeStep('name_input');
                          }
                        } catch {
                          setWelcomeStep('name_input');
                        }
                      };
                      reader.readAsText(file);
                    } else {
                      setWelcomeStep('name_input');
                    }
                  }}
                  className="hidden"
                />
              </div>
            </div>
          </div>
          {loading && (
            <div className="text-center py-8">
              <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${effectiveMode === 'light' ? 'border-black' : 'border-primary'} mx-auto mb-4`}></div>
              <p className={`${colors.buttonText} opacity-80`}>Processing your calendar...</p>
            </div>
          )}
          {error && (
            <div className={`border rounded-lg p-4 mt-6 w-full max-w-lg ${effectiveMode === 'light' ? 'bg-red-100 border-red-400' : 'bg-red-900/20 border-red-500'}`}>
              <div className={`flex items-center gap-2 ${colors.buttonText}`}>
                <FileText size={20} />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}
        </div>
      );
    case 'name_input':
      return (
        <div className={`flex flex-col items-center justify-center h-full text-center p-8 relative ${containerBg}`}>
          <div className="absolute top-0 left-0 w-full flex justify-center z-10">
            <StepCircles />
          </div>
          <User size={64} className="text-primary mb-6 animate-bounce-in" />
          <h2 className={`text-3xl font-bold mb-4 ${colors.buttonText}`}>What's your name? (Optional)</h2>
          <p className={`${colors.buttonText} opacity-80 mb-6`}>We'll use this to greet you!</p>
          <input
            type="text"
            value={userName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserName(e.target.value)}
            placeholder="Enter your name"
            className={`w-full max-w-sm px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary mb-6 text-lg ${effectiveMode === 'light' ? 'bg-gray-100 text-black border-gray-300' : 'bg-gray-700 text-white border-gray-600'}`}
          />
          <button
            onClick={() => setWelcomeStep('completed')}
            className="bg-primary hover:bg-primary-dark text-primary-foreground px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Next
          </button>
        </div>
      );
    default:
      return null;
  }
};

export default WelcomeScreen; 