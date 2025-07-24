import React from 'react';
import { 
  Settings as SettingsIcon, 
  Edit2, 
  X, 
  Palette, 
  User, 
  Trash2, 
  Smartphone, 
  Calendar,
  FileText,
  Wifi,
  WifiOff,
  Home,
  Shield,
  BadgeCheck,
  LoaderCircle,
  GripVertical,
  BarChart3
} from 'lucide-react';
import { ThemeKey } from '../utils/themeUtils';
import { isServiceWorkerSupported, forceCacheUpdate } from '../utils/cacheUtils';
import { showSuccess, showError } from '../utils/notificationUtils';
import bcrypt from 'bcryptjs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState, useEffect } from 'react';

interface ExportModalState {
  show: boolean;
  options: {
    subjects: boolean;
    subjectInfo: boolean;
    subjectNotes: boolean;
    subjectColours: boolean;
    subjectIcons: boolean;
    name: boolean;
  };
}

interface SettingsProps {
  userName: string;
  setUserName: (name: string) => void;
  clearData: () => void;
  autoNamingEnabled: boolean;
  setAutoNamingEnabled: (enabled: boolean) => void;
  showThemeModal: boolean;
  setShowThemeModal: (show: boolean) => void;
  theme: ThemeKey;
  themeType: 'normal' | 'extreme';
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  handleThemeChange: (key: string, type: 'normal' | 'extreme') => void;
  effectiveMode: 'light' | 'dark';
  colors: any;
  infoOrder: { key: string; label: string }[];
  infoShown: Record<string, boolean>;

  draggedIdx: number | null;
  handleDragStart: (idx: number) => void;
  handleInfoDragOver: (idx: number) => void;
  handleDragEnd: () => void;
  handleToggleInfoShown: (key: string) => void;
  showFirstInfoBeside: boolean;
  setShowFirstInfoBeside: (show: boolean) => void;
  isCalendarPage?: boolean;
  countdownInTitle: boolean;
  setCountdownInTitle: (val: boolean) => void;
  exportModalState: ExportModalState;
  setExportModalState: React.Dispatch<React.SetStateAction<ExportModalState>>;
  handleExport: () => void;
  handleFileInput: (e: React.ChangeEvent<HTMLInputElement> | File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  offlineCachingEnabled: boolean;
  setOfflineCachingEnabled: (enabled: boolean) => Promise<void>;
  // Add new password protection props
  markbookPasswordEnabled: boolean;
  setMarkbookPasswordEnabled: (enabled: boolean) => void;
  markbookPassword: string;
  setMarkbookPassword: (password: string) => void;
  showPasswordModal: boolean;
  setShowPasswordModal: (show: boolean) => void;
  newPassword: string;
  setNewPassword: (password: string) => void;
  // New: whether the markbook is currently locked
  isMarkbookLocked: boolean;
}

const Settings: React.FC<SettingsProps> = ({
  userName,
  setUserName,
  clearData,
  autoNamingEnabled,
  setAutoNamingEnabled,
  setShowThemeModal,
  effectiveMode,
  colors,
  exportModalState,
  setExportModalState,
  handleExport,
  handleFileInput,
  fileInputRef,
  offlineCachingEnabled,
  countdownInTitle,
  setCountdownInTitle,
  setOfflineCachingEnabled,
  showFirstInfoBeside,
  setShowFirstInfoBeside,
  infoOrder,
  infoShown,
  handleDragStart,
  handleInfoDragOver,
  handleDragEnd,
  handleToggleInfoShown,
  draggedIdx,
  markbookPasswordEnabled,
  setMarkbookPasswordEnabled,
  setMarkbookPassword,
  showPasswordModal,
  setShowPasswordModal,
  newPassword,
  setNewPassword,
  
}) => {

  const [showNameEditModal, setShowNameEditModal] = React.useState(false);
  const [showInfoBlocksModal, setShowInfoBlocksModal] = React.useState(false);
  const [editUserName, setEditUserName] = React.useState(userName);
  const [serviceWorkerSupported] = React.useState(isServiceWorkerSupported());
  const [isUpdatingCache, setIsUpdatingCache] = React.useState(false);
  const [isToggleLoading, setIsToggleLoading] = React.useState(false);

  const [showTerms, setShowTerms] = React.useState(false);
  const [showPrivacy, setShowPrivacy] = React.useState(false);
  const [showLicensing, setShowLicensing] = React.useState(false);
  const [termsContent, setTermsContent] = useState<string>('');
  const [privacyContent, setPrivacyContent] = useState<string>('');
  const [licenseContent, setLicenseContent] = useState<string>('');
  const [loadingMarkdown, setLoadingMarkdown] = useState<string | null>(null);
  const [markdownError, setMarkdownError] = useState<string | null>(null);

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

  /* --------------------------------- Local state -------------------------------- */
  const [oldPasswordInput, setOldPasswordInput] = useState('');

  return (
    <div className={`space-y-6 ${colors.background}`}>
       <style>{`
        .markdown-content h1, .markdown-content h2, .markdown-content h3 {
          text-align: left; margin-bottom: 0.5em; margin-top: 1.5em; padding-left: 0; margin-left: 0; font-weight: 600;
        }
        .markdown-content p, .markdown-content ul, .markdown-content ol, .markdown-content blockquote {
          text-align: left; margin-left: 1rem; margin-top: 0; font-weight: 400;
        }
        .markdown-content p { margin-bottom: 1em; line-height: 1.6; }
        .markdown-content ul, .markdown-content ol { padding-left: 1.5rem; }
        .custom-scrollbar-light::-webkit-scrollbar, .custom-scrollbar-dark::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar-light::-webkit-scrollbar-track, .custom-scrollbar-dark::-webkit-scrollbar-track {
          background: ${colors.container}; border-radius: 4px;
        }
        .custom-scrollbar-light::-webkit-scrollbar-thumb, .custom-scrollbar-dark::-webkit-scrollbar-thumb {
          background: ${colors.buttonAccent}; border-radius: 4px;
        }
        .custom-scrollbar-light::-webkit-scrollbar-thumb:hover, .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
          background: ${colors.buttonAccentHover};
        }
        .custom-scrollbar-light, .custom-scrollbar-dark {
          scrollbar-width: thin; scrollbar-color: ${colors.buttonAccent} ${colors.container};
        }
      `}</style>
      
      <div className="flex items-center gap-3">
        <SettingsIcon className={colors.text} size={24} />
        <h2 className={`text-2xl font-semibold ${colors.text}`}>Settings</h2>
      </div>

      {/* Data Section */}
      <div className={`${colors.container} rounded-lg ${colors.border} border p-6 mb-4`}>
        <div className="flex items-center gap-2 mb-4">
          <User className={colors.containerText} size={20} />
          <h3 className={`text-lg font-medium ${colors.containerText}`}>Data</h3>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className={`font-medium ${colors.containerText}`}>Name</p>
            <p className={`text-sm ${colors.containerText} opacity-80`}>{userName || <span className="italic">(not set)</span>}</p>
          </div>
          <button
            onClick={() => { setEditUserName(userName); setShowNameEditModal(true); }}
            className={`${colors.buttonAccent} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2`}
          >
            <Edit2 size={16} />
            Change Name
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-medium ${colors.containerText}`}>Export Data</p>
            <p className={`text-sm ${colors.containerText} opacity-80`}>Export your calendar and subject data as a .school file</p>
          </div>
          <button
            onClick={() => setExportModalState((prev) => ({ ...prev, show: true }))}
            className={`${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2`}
          >
            <FileText size={16} />
            Export
          </button>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div>
            <p className={`font-medium ${colors.containerText}`}>Import Data</p>
            <p className={`text-sm ${colors.containerText} opacity-80`}>Import your .ics or .school file</p>
          </div>
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2`}
            >
              <FileText size={16} />
              Import
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
        <hr className={`my-6 border-t ${colors.border}`} />
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            {isToggleLoading ? <LoaderCircle className="animate-spin text-blue-500" size={18} /> : offlineCachingEnabled ? <Wifi className={effectiveMode === 'light' ? 'text-green-600' : 'text-green-400'} size={18} /> : <WifiOff className={effectiveMode === 'light' ? 'text-gray-600' : 'text-gray-400'} size={18} />}
            <div>
              <p className={`font-medium ${colors.containerText}`}>Save Site for Offline Use</p>
              <p className={`text-sm ${colors.containerText} opacity-80`}>{serviceWorkerSupported ? 'Cache the site so it works without internet connection' : 'Service Worker not supported in this browser'}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={offlineCachingEnabled} onChange={async (e) => { const checked = e.target.checked; setIsToggleLoading(true); await setOfflineCachingEnabled(checked); setIsToggleLoading(false); }} className="sr-only peer" disabled={!serviceWorkerSupported || isToggleLoading} />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all" style={offlineCachingEnabled ? { backgroundColor: colors.buttonAccent } : {}}></div>
          </label>
        </div>
        
        {offlineCachingEnabled && serviceWorkerSupported && (
          <div className="flex items-center justify-between mt-4 border-t border-gray-700 pt-4">
            <div className="flex items-center gap-3">
              <div>
                <p className={`font-medium ${colors.containerText}`}>Update Cache</p>
                <p className={`text-sm ${colors.containerText} opacity-80`}>
                  Manually update the cached files to the latest version
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                setIsUpdatingCache(true);
                const success = await forceCacheUpdate();
                if (success) {
                  showSuccess('Cache Update', 'Cache updated successfully!', { effectiveMode, colors });
                } else {
                  showError('Cache Update', 'Failed to update cache. Please try again.', { effectiveMode, colors });
                }
                setIsUpdatingCache(false);
              }}
              className="bg-primary hover:bg-primary-dark text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              disabled={isUpdatingCache}
            >
              {isUpdatingCache ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <FileText size={16} />
              )}
              {isUpdatingCache ? 'Updating...' : 'Update Cache'}
            </button>
          </div>
        )}
      </div>

      {/* Home Settings Section */}
      <div className={`${colors.container} rounded-lg ${colors.border} border p-6 mb-4`}>
        <div className="flex items-center gap-2 mb-4">
          <Home className={colors.text} size={20} />
          <h3 className={`text-lg font-medium ${colors.text}`}>Home Settings</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${colors.containerText}`}>Show Countdown on Home</p>
              <p className={`text-sm ${colors.containerText} opacity-80`}>Display the countdown timer on the home screen</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={countdownInTitle} onChange={e => setCountdownInTitle(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all" style={countdownInTitle ? { backgroundColor: colors.buttonAccent } : {}}></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${colors.containerText}`}>Event Info Display</p>
              <p className={`text-sm ${colors.containerText} opacity-80`}>Configure how event information is shown</p>
            </div>
            <button
              onClick={() => setShowInfoBlocksModal(true)}
              className={`${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2`}
            >
              <FileText size={16} />
              Configure
            </button>
          </div>
        </div>
      </div>

      {/* Info Blocks Modal */}
      {showInfoBlocksModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className={`${colors.container} rounded-lg p-6 shadow-xl border border-gray-700 w-full max-w-md`}>
            <h3 className={`text-xl font-semibold ${colors.buttonText} mb-2`}>Event Info Display</h3>
            <p className={`text-sm ${colors.containerText} opacity-80 mb-6`}>
              Configure which information is shown for each event. Drag items to reorder them.
            </p>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className={`font-medium ${colors.containerText}`}>Show First Info Beside Name</p>
                <p className={`text-sm ${colors.containerText} opacity-80`}>Display the first enabled info next to the event name</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={showFirstInfoBeside} onChange={e => setShowFirstInfoBeside(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all" style={showFirstInfoBeside ? { backgroundColor: colors.buttonAccent } : {}}></div>
              </label>
            </div>
            <div className={`p-4 rounded-lg ${colors.background} space-y-2 mb-6`}>
              {infoOrder.map((item, idx) => (
                <div
                  key={item.key}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    handleInfoDragOver(idx);
                  }}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between p-2 rounded ${colors.container} cursor-grab ${draggedIdx === idx ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className={colors.text} size={20} />
                    <span className={`text-sm font-medium ${colors.containerText}`}>{item.label}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={infoShown[item.key]} onChange={() => handleToggleInfoShown(item.key)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all" style={infoShown[item.key] ? { backgroundColor: colors.buttonAccent } : {}}></div>
                  </label>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowInfoBlocksModal(false)}
                className={`${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Name Edit Modal */}
      {showNameEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className={`${colors.container} rounded-lg p-6 shadow-xl border border-gray-700 w-full max-w-md`}>
            <h3 className={`text-xl font-semibold ${colors.buttonText} mb-4`}>Edit Name</h3>
            <input
              type="text"
              value={editUserName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditUserName(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6 text-lg ${colors.inputBackground} ${colors.inputBorder} ${colors.buttonText}`}
              placeholder="Enter your name"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNameEditModal(false)}
                className="bg-secondary hover:bg-secondary-dark text-secondary-foreground px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >Cancel</button>
              <button
                onClick={() => { 
                  setUserName(editUserName); 
                  setShowNameEditModal(false);
                  showSuccess('Name Updated', 'Your name has been updated successfully!', { effectiveMode, colors });
                }}
                className={`${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200`}
              >Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportModalState.show && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className={`${colors.container} rounded-lg p-6 shadow-xl border border-gray-700 w-full max-w-md`}>
            <h3 className={`text-xl font-semibold ${colors.buttonText} mb-4`}>Export Data</h3>
            <div className="space-y-4 mb-6">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={exportModalState.options.subjects} onChange={e => setExportModalState(s => ({ ...s, options: { ...s.options, subjects: e.target.checked } }))} />
                <span>Subjects (with timing, original/edited names)</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={exportModalState.options.subjectInfo} onChange={e => setExportModalState(s => ({ ...s, options: { ...s.options, subjectInfo: e.target.checked } }))} />
                <span>Subject Information</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={exportModalState.options.subjectNotes} onChange={e => setExportModalState(s => ({ ...s, options: { ...s.options, subjectNotes: e.target.checked } }))} />
                <span>Subject Notes</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={exportModalState.options.subjectColours} onChange={e => setExportModalState(s => ({ ...s, options: { ...s.options, subjectColours: e.target.checked } }))} />
                <span>Subject Colours</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={exportModalState.options.subjectIcons} onChange={e => setExportModalState(s => ({ ...s, options: { ...s.options, subjectIcons: e.target.checked } }))} />
                <span>Subject Icons</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={exportModalState.options.name} onChange={e => setExportModalState(s => ({ ...s, options: { ...s.options, name: e.target.checked } }))} />
                <span>Name</span>
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setExportModalState(s => ({ ...s, show: false }))}
                className="bg-secondary hover:bg-secondary-dark text-secondary-foreground px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >Cancel</button>
              <button
                onClick={handleExport}
                className="bg-primary hover:bg-primary-dark text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >Export</button>
            </div>
          </div>
        </div>
      )}

      {/* Legal Section */}
      <div className={`${colors.container} rounded-lg ${colors.border} border p-6 mb-4`}>
        <div className="flex items-center gap-2 mb-4">
          <FileText className={colors.text} size={20} />
          <h3 className={`text-lg font-medium ${colors.text}`}>Legal</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className={colors.text} size={18} />
              <span className={`font-medium ${colors.text}`}>Terms and Conditions</span>
            </div>
            <button
              onClick={() => setShowTerms(true)}
              className={`${colors.buttonAccent} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2`}
            >
              <FileText size={16} />
              Read
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className={colors.text} size={18} />
              <span className={`font-medium ${colors.text}`}>Privacy Policy</span>
            </div>
            <button
              onClick={() => setShowPrivacy(true)}
              className={`${colors.buttonAccent} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2`}
            >
              <FileText size={16} />
              Read
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BadgeCheck className={colors.text} size={18} />
              <span className={`font-medium ${colors.text}`}>Licensing</span>
            </div>
            <button
              onClick={() => setShowLicensing(true)}
              className={`${colors.buttonAccent} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2`}
            >
              <FileText size={16} />
              Read
            </button>
          </div>
        </div>
      </div>
      
      {/* Legal Modals */}
      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className={`bg-gray-50 dark:bg-gray-900 rounded-lg p-6 shadow-xl border border-gray-700 w-full max-w-lg relative max-h-[80vh] overflow-y-auto custom-scrollbar-${effectiveMode}`}> 
            <button 
              onClick={() => { setShowTerms(false); setMarkdownError(null); }} 
              className="absolute top-4 right-4 opacity-70 hover:opacity-100 transition"
            >
              <X className={effectiveMode === 'light' ? 'text-gray-600' : 'text-gray-400'} size={24} />
            </button>
            {loadingMarkdown === 'terms' ? (
              <div className="py-8 text-gray-800 dark:text-gray-100">Loading...</div>
            ) : markdownError ? (
              <div className="text-red-500 py-8">{markdownError}</div>
            ) : (
              <div className="markdown-content text-gray-800 dark:text-gray-100">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{termsContent}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className={`bg-gray-50 dark:bg-gray-900 rounded-lg p-6 shadow-xl border border-gray-700 w-full max-w-lg relative max-h-[80vh] overflow-y-auto custom-scrollbar-${effectiveMode}`}> 
            <button onClick={() => { setShowPrivacy(false); setMarkdownError(null); }} className="absolute top-4 right-4 opacity-70 hover:opacity-100 transition">
              <X className={effectiveMode === 'light' ? 'text-gray-600' : 'text-gray-400'} size={24} />
            </button>
            {loadingMarkdown === 'privacy' ? (
              <div className="py-8 text-gray-800 dark:text-gray-100">Loading...</div>
            ) : markdownError ? (
              <div className="text-red-500 py-8">{markdownError}</div>
            ) : (
              <div className="markdown-content text-gray-800 dark:text-gray-100">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{privacyContent}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
      {showLicensing && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className={`bg-gray-50 dark:bg-gray-900 rounded-lg p-6 shadow-xl border border-gray-700 w-full max-w-lg relative max-h-[80vh] overflow-y-auto custom-scrollbar-${effectiveMode}`}>
            <button onClick={() => { setShowLicensing(false); setMarkdownError(null); }} className="absolute top-4 right-4 opacity-70 hover:opacity-100 transition">
              <X className={effectiveMode === 'light' ? 'text-gray-600' : 'text-gray-400'} size={24} />
            </button>
            {loadingMarkdown === 'license' ? (
              <div className="py-8 text-gray-800 dark:text-gray-100">Loading...</div>
            ) : markdownError ? (
              <div className="text-red-500 py-8">{markdownError}</div>
            ) : (
              <div className="markdown-content text-gray-800 dark:text-gray-100">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{licenseContent}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Markbook Settings */}
      <div className={`${colors.container} rounded-lg ${colors.border} border p-6 mb-4`}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className={colors.text} size={20} />
          <h3 className={`text-lg font-medium ${colors.text}`}>Markbook Settings</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className={effectiveMode === 'light' ? 'text-blue-600' : 'text-blue-400'} size={18} />
              <div>
                <p className={`font-medium ${colors.containerText}`}>Password Protection</p>
                <p className={`text-sm ${colors.containerText} opacity-80`}>Require a password to view marks</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={markbookPasswordEnabled} onChange={(e) => { setMarkbookPasswordEnabled(e.target.checked); if (!e.target.checked) setMarkbookPassword(''); }} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all" style={markbookPasswordEnabled ? { backgroundColor: colors.buttonAccent } : {}}></div>
            </label>
          </div>
          {markbookPasswordEnabled && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <p className={`font-medium ${colors.containerText}`}>Markbook Password</p>
                  <p className={`text-sm ${colors.containerText} opacity-80`}>Set a password to protect your marks</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className={`${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2`}
              >
                <Edit2 size={16} />
                Set Password
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className={`${colors.container} rounded-lg p-6 shadow-xl border border-gray-700 w-full max-w-md`}>
            <h3 className={`text-xl font-semibold ${colors.buttonText} mb-4`}>Set Markbook Password</h3>

            {/* If a password already exists, ask for the current password first */}
            {localStorage.getItem('markbookPassword') && (
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-1 ${colors.containerText}`}>Current Password</label>
                <input
                  type="password"
                  value={oldPasswordInput}
                  onChange={(e)=>setOldPasswordInput(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg mb-2 ${colors.inputBackground} ${colors.inputBorder} ${colors.buttonText}`}
                  placeholder="Enter current password"
                />
              </div>
            )}
            
            <label className={`block text-sm font-medium mb-1 ${colors.containerText}`}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6 text-lg ${colors.inputBackground} ${colors.inputBorder} ${colors.buttonText}`}
              placeholder="Enter new password"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowPasswordModal(false); setNewPassword(''); setOldPasswordInput(''); }}
                className="bg-secondary hover:bg-secondary-dark text-secondary-foreground px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >Cancel</button>
              <button
                onClick={() => { 
                  const storedHash = localStorage.getItem('markbookPassword');
                  if (storedHash) {
                    // Password already set – verify old password first
                    if (!bcrypt.compareSync(oldPasswordInput, storedHash)) {
                      showError('Incorrect Current Password', 'Please try again', { effectiveMode, colors });
                      return;
                    }
                  }
                  if (newPassword.trim() === '') {
                    showError('Invalid Password', 'Password cannot be empty', { effectiveMode, colors });
                    return;
                  }
                  setMarkbookPassword(newPassword);
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setOldPasswordInput('');
                  showSuccess('Password Updated', 'Your markbook password has been updated successfully!', { effectiveMode, colors });
                }}
                className={`${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200`}
              >Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Timetable Settings */}
      <div className={`${colors.container} rounded-lg ${colors.border} border p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className={colors.text} size={20} />
          <h3 className={`text-lg font-medium ${colors.text}`}>Timetable Settings</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trash2 className={effectiveMode === 'light' ? 'text-red-600' : 'text-red-400'} size={18} />
              <div>
                <p className={`font-medium ${colors.containerText}`}>Clear Timetable Data</p>
                <p className={`text-sm ${colors.containerText} opacity-80`}>This will remove all uploaded calendar data and subjects</p>
              </div>
            </div>
            <button
              onClick={clearData}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <X size={16} />
              Clear Data
            </button>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <Smartphone className={effectiveMode === 'light' ? 'text-blue-600' : 'text-blue-400'} size={18} />
              <div>
                <p className={`font-medium ${colors.containerText}`}>Enable Auto-Naming</p>
                <p className={`text-sm ${colors.containerText} opacity-80`}>Automatically rename subjects based on keywords</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={autoNamingEnabled} onChange={(e) => { setAutoNamingEnabled(e.target.checked); showSuccess( 'Auto-Naming Updated', `Auto-naming has been ${e.target.checked ? 'enabled' : 'disabled'} successfully!`, { effectiveMode, colors } ); }} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all" style={autoNamingEnabled ? { backgroundColor: colors.buttonAccent } : {}}></div>
            </label>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <Calendar className={colors.containerText} size={18} />
              <div>
                <p className={`font-medium ${colors.containerText}`}>Show Countdown in Browser Tab</p>
                <p className={`text-sm ${colors.containerText} opacity-80`}>Display the countdown timer in the browser tab title</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={countdownInTitle} onChange={(e) => { setCountdownInTitle(e.target.checked); showSuccess( 'Countdown Setting Updated', `Countdown in browser tab has been ${e.target.checked ? 'enabled' : 'disabled'} successfully!`, { effectiveMode, colors } ); }} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all" style={countdownInTitle ? { backgroundColor: colors.buttonAccent } : {}}></div>
            </label>
          </div>
        </div>
      </div>

      {/* Customise Section */}
      <div className={`${colors.container} rounded-lg ${colors.border} border p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <Palette className={colors.text} size={20} />
          <h3 className={`text-lg font-medium ${colors.text}`}>Customise</h3>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
            </div>
            <div>
              <p className={`font-medium ${colors.containerText}`}>Theme</p>
              <p className={`text-sm ${colors.containerText} opacity-80`}>Change the color theme of the app</p>
            </div>
          </div>
          <button
            onClick={() => setShowThemeModal(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText}`}
          >
            <Palette size={18} />
            Change Theme
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
