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
  BarChart3,
  Github,
  Heart,
  Upload,
  Download,
  RotateCw,
  Clock,
  Timer,
  Sidebar,
  Grid2x2,
  SlidersHorizontal,
  Quote,
  Lock,
  Database,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { ThemeKey } from '../utils/themeUtils';
import { isServiceWorkerSupported, forceCacheUpdate } from '../utils/cacheUtils';
import { showSuccess, showError } from '../utils/notificationUtils';
import bcrypt from 'bcryptjs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState, useEffect } from 'react';
import FeedbackForm from './FeedbackForm';
import WidgetsModal from './WidgetsModal';

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
  showCountdownInTimeline: boolean;
  setShowCountdownInTimeline: (val: boolean) => void;
  showCountdownInSidebar: boolean;
  setShowCountdownInSidebar: (val: boolean) => void;
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
  theme,
  themeType,
  themeMode,
  setThemeMode,
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
  showCountdownInTimeline,
  setShowCountdownInTimeline,
  showCountdownInSidebar,
  setShowCountdownInSidebar,
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
  markbookPassword: _markbookPassword,
  setMarkbookPassword,
  showPasswordModal,
  setShowPasswordModal,
  newPassword,
  setNewPassword,
  isMarkbookLocked: _isMarkbookLocked,
}) => {

  const [showNameEditModal, setShowNameEditModal] = React.useState(false);
  const [showInfoBlocksModal, setShowInfoBlocksModal] = React.useState(false);
  const [showWidgetsModal, setShowWidgetsModal] = React.useState(false);
  const [showClearDataModal, setShowClearDataModal] = React.useState(false);
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
  const [showMarkbookSettings, setShowMarkbookSettings] = useState(false);
  const [markbookPasswordVerification, setMarkbookPasswordVerification] = useState('');
  const [showMarkbookPasswordVerification, setShowMarkbookPasswordVerification] = useState(false);


  return (
    <div className={`space-y-8 ${colors.background}`}>
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
      
      <div className="mx-auto w-full max-w-2xl xl:max-w-3xl px-4">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className={colors.text} size={28} />
          <h2 className={`text-3xl font-semibold ${colors.text}`}>Settings</h2>
        </div>

      {/* Data Section */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className={`p-3 rounded-xl ${colors.containerOverlay}`}>
            <Database size={20} className={`${colors.accentText}`} />
          </div>
          <h3 className={`text-lg font-medium ${colors.text}`}>Data</h3>
        </div>
        <div className="space-y-3">
          <div className={`${colors.container} ${colors.border} border rounded-2xl p-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <User className={`${colors.accentText}`} size={18} />
              <div>
                <p className={`font-medium ${colors.containerText}`}>Name</p>
                <p className={`text-sm ${colors.containerText} opacity-80`}>{userName || <span className="italic">(not set)</span>}</p>
              </div>
            </div>
            <button
              onClick={() => { setEditUserName(userName); setShowNameEditModal(true); }}
              className={`${colors.buttonAccent} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2`}
            >
              <Edit2 size={16} />
              Change Name
            </button>
          </div>
          <div className="space-y-1">
            <div className={`${colors.container} ${colors.border} border rounded-t-2xl rounded-b-lg p-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <Upload className={`${colors.accentText}`} size={18} />
                <div>
                  <p className={`font-medium ${colors.containerText}`}>Export Data</p>
                  <p className={`text-sm ${colors.containerText} opacity-80`}>Export your calendar and subject data as a .school file</p>
                </div>
              </div>
              <button
                onClick={() => setExportModalState((prev) => ({ ...prev, show: true }))}
                className={`${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2`}
              >
                <Upload size={16} />
                Export
              </button>
            </div>
            <div className={`${colors.container} ${colors.border} border rounded-b-2xl rounded-t-lg p-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <Download className={`${colors.accentText}`} size={18} />
                <div>
                  <p className={`font-medium ${colors.containerText}`}>Import Data</p>
                  <p className={`text-sm ${colors.containerText} opacity-80`}>Import your .ics or .school file</p>
                </div>
              </div>
              <div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2`}
                >
                  <Download size={16} />
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
          </div>
          <div className="space-y-1">
            <div className={`${colors.container} ${colors.border} border rounded-t-2xl rounded-b-lg p-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                {isToggleLoading ? <LoaderCircle className={`animate-spin ${colors.accentText}`} size={18} /> : offlineCachingEnabled ? <Wifi className={effectiveMode === 'light' ? 'text-green-600' : 'text-green-400'} size={18} /> : <WifiOff className={effectiveMode === 'light' ? 'text-gray-600' : 'text-gray-400'} size={18} />}
                <div>
                  <p className={`font-medium ${colors.containerText}`}>Save Site for Offline Use</p>
                  <p className={`text-sm ${colors.containerText} opacity-80`}>{serviceWorkerSupported ? 'Cache the site so it works without internet connection' : 'Service Worker not supported in this browser'}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={offlineCachingEnabled} onChange={async (e) => { const checked = e.target.checked; setIsToggleLoading(true); await setOfflineCachingEnabled(checked); setIsToggleLoading(false); }} className="sr-only peer" disabled={!serviceWorkerSupported || isToggleLoading} />
                <div className={`w-14 h-7 rounded-full relative transition-colors ${offlineCachingEnabled ? colors.buttonAccent : 'bg-gray-500'} peer-focus:outline-none peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-white/20 after:rounded-full after:h-6 after:w-6 after:transition-all`}></div>
              </label>
            </div>
            {offlineCachingEnabled && serviceWorkerSupported && (
              <div className={`${colors.container} ${colors.border} border rounded-b-2xl rounded-t-lg p-4 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <RotateCw className={`${colors.accentText}`} size={18} />
                  <div>
                    <p className={`font-medium ${colors.containerText}`}>Update Cache</p>
                    <p className={`text-sm ${colors.containerText} opacity-80`}>Cache auto-updates, but you can manually update if needed</p>
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
                  className={`${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2`}
                  disabled={isUpdatingCache}
                >
                  {isUpdatingCache ? (
                    <LoaderCircle className="animate-spin" size={16} />
                  ) : (
                    <RotateCw size={16} />
                  )}
                  {isUpdatingCache ? 'Updating...' : 'Update Cache'}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Home Settings Section */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className={`p-3 rounded-xl ${colors.containerOverlay}`}>
            <Home size={20} className={`${colors.accentText}`} />
          </div>
          <h3 className={`text-lg font-medium ${colors.text}`}>Home Settings</h3>
        </div>
        <div className="space-y-3">
          <div className={`${colors.container} ${colors.border} border rounded-2xl p-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <Clock className={`${colors.accentText}`} size={18} />
              <div>
                <p className={`font-medium ${colors.containerText}`}>Use 24-Hour Time Format</p>
                <p className={`text-sm ${colors.containerText} opacity-80`}>Display times in 24-hour format (e.g., 14:30) instead of 12-hour format (e.g., 2:30 PM)</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={false} onChange={() => {}} className="sr-only peer" />
              <div className={`w-14 h-7 rounded-full relative transition-colors ${false ? colors.buttonAccent : 'bg-gray-500'} peer-focus:outline-none peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-white/20 after:rounded-full after:h-6 after:w-6 after:transition-all`}></div>
            </label>
          </div>
          <div className="space-y-1">
            <div className={`${colors.container} ${colors.border} border rounded-t-2xl rounded-b-lg p-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <Timer className={`${colors.accentText}`} size={18} />
                <div>
                  <p className={`font-medium ${colors.containerText}`}>Enable Countdown in Schedule</p>
                  <p className={`text-sm ${colors.containerText} opacity-80`}>Show the progress countdown within today's schedule timeline</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={showCountdownInTimeline} onChange={e => setShowCountdownInTimeline(e.target.checked)} className="sr-only peer" />
                <div className={`w-14 h-7 rounded-full relative transition-colors ${showCountdownInTimeline ? colors.buttonAccent : 'bg-gray-500'} peer-focus:outline-none peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-white/20 after:rounded-full after:h-6 after:w-6 after:transition-all`}></div>
              </label>
            </div>
            <div className={`${colors.container} ${colors.border} border rounded-b-2xl rounded-t-lg p-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <Sidebar className={`${colors.accentText}`} size={18} />
                <div>
                  <p className={`font-medium ${colors.containerText}`}>Show Countdown in Sidebar</p>
                  <p className={`text-sm ${colors.containerText} opacity-80`}>Display countdown timer button in the sidebar navigation</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={showCountdownInSidebar} onChange={e => setShowCountdownInSidebar(e.target.checked)} className="sr-only peer" />
                <div className={`w-14 h-7 rounded-full relative transition-colors ${showCountdownInSidebar ? colors.buttonAccent : 'bg-gray-500'} peer-focus:outline-none peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-white/20 after:rounded-full after:h-6 after:w-6 after:transition-all`}></div>
              </label>
            </div>
          </div>
          <div className={`${colors.container} ${colors.border} border rounded-2xl p-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <Quote className={`${colors.accentText}`} size={18} />
              <div>
                <p className={`font-medium ${colors.containerText}`}>Quote Type</p>
                <p className={`text-sm ${colors.containerText} opacity-80`}>Choose which type of quote to display in the Quote of the Day widget</p>
              </div>
            </div>
            <select
              value={localStorage.getItem('quoteType') || 'normal'}
              onChange={(e) => {
                localStorage.setItem('quoteType', e.target.value);
                ['normal', 'love', 'art', 'nature', 'funny'].forEach(type => {
                  localStorage.removeItem(`quoteOfTheDayCache_${type}`);
                  localStorage.removeItem(`quoteOfTheDayCacheDate_${type}`);
                });
                showSuccess('Quote Type Updated', `Quote type changed to ${e.target.value}. Refresh to see the new quote!`, { effectiveMode, colors });
              }}
              className={`px-3 py-2 rounded-lg border ${colors.border} ${colors.container} ${colors.text}`}
            >
              <option value="normal">Quote of the Day</option>
              <option value="love">Love Quote</option>
              <option value="art">Art Quote</option>
              <option value="nature">Nature Quote</option>
              <option value="funny">Funny Quote</option>
            </select>
          </div>
          <div className={`${colors.container} ${colors.border} border rounded-2xl p-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <Grid2x2 className={`${colors.accentText}`} size={18} />
              <div>
                <p className={`font-medium ${colors.containerText}`}>Widgets</p>
                <p className={`text-sm ${colors.containerText} opacity-80`}>Show or hide widgets on the home page</p>
              </div>
            </div>
            <button
              onClick={() => setShowWidgetsModal(true)}
              className={`${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2`}
            >
              <Grid2x2 size={16} />
              Manage
            </button>
          </div>
          <div className={`${colors.container} ${colors.border} border rounded-2xl p-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <SlidersHorizontal className={`${colors.accentText}`} size={18} />
              <div>
                <p className={`font-medium ${colors.containerText}`}>Event Info Display</p>
                <p className={`text-sm ${colors.containerText} opacity-80`}>Configure how event information is shown</p>
              </div>
            </div>
            <button
              onClick={() => setShowInfoBlocksModal(true)}
              className={`${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2`}
            >
              <SlidersHorizontal size={16} />
              Configure
            </button>
          </div>
        </div>
      </section>

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
                <div className={`w-14 h-7 rounded-full relative transition-colors ${showFirstInfoBeside ? colors.buttonAccent : 'bg-gray-500'} peer-focus:outline-none peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-white/20 after:rounded-full after:h-6 after:w-6 after:transition-all`}></div>
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
                    <div className={`w-14 h-7 rounded-full relative transition-colors ${infoShown[item.key] ? colors.buttonAccent : 'bg-gray-500'} peer-focus:outline-none peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-white/20 after:rounded-full after:h-6 after:w-6 after:transition-all`}></div>
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
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6 text-lg ${effectiveMode === 'light' ? 'bg-white text-black' : 'bg-gray-800 text-white'} ${colors.inputBorder}`}
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
            <style>{`
              /* Set theme variables for checkbox for better light mode visibility */
              .checkbox-wrapper-30 {
                --color-bg: ${effectiveMode === 'light' ? '#f3f4f6' : '#232323'};
                --color-bg-dark: ${effectiveMode === 'dark' ? '#232323' : '#f3f4f6'};
                --color-border: ${effectiveMode === 'light' ? '#d1d5db' : '#444'};
                --color-primary: ${colors.accentText};
                --color-primary-light: ${colors.buttonAccentHover};
              }
              /* Checkbox CSS by Saeed Alipoor */
              .checkbox-wrapper-30 .checkbox {
                --bg: var(--color-bg);
                --brdr: var(--color-border);
                --brdr-actv: var(--color-primary);
                --brdr-hovr: var(--color-primary-light);
                --tick: ${effectiveMode === 'light' ? '#222' : '#fff'};
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
            `}</style>
            <h3 className={`text-xl font-semibold ${colors.buttonText} mb-4`}>Export Data</h3>
            <div className="space-y-4 mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="checkbox-wrapper-30">
                  <span className="checkbox">
                    <input type="checkbox" checked={exportModalState.options.subjects} onChange={e => setExportModalState(s => ({ ...s, options: { ...s.options, subjects: e.target.checked } }))} />
                    <svg>
                      <use xlinkHref="#checkbox-30"></use>
                    </svg>
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" style={{display:'none'}}>
                    <symbol id="checkbox-30" viewBox="0 0 22 22">
                      <path fill="none" stroke="currentColor" d="M5.5,11.3L9,14.8L20.2,3.3l0,0c-0.5-1-1.5-1.8-2.7-1.8h-13c-1.7,0-3,1.3-3,3v13c0,1.7,1.3,3,3,3h13 c1.7,0,3-1.3,3-3v-13c0-0.4-0.1-0.8-0.3-1.2"/>
                    </symbol>
                  </svg>
                </div>
                <span className={colors.containerText}>Subjects (with timing, original/edited names)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="checkbox-wrapper-30">
                  <span className="checkbox">
                    <input type="checkbox" checked={exportModalState.options.subjectInfo} onChange={e => setExportModalState(s => ({ ...s, options: { ...s.options, subjectInfo: e.target.checked } }))} />
                    <svg>
                      <use xlinkHref="#checkbox-30"></use>
                    </svg>
                  </span>
                </div>
                <span className={colors.containerText}>Subject Information</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="checkbox-wrapper-30">
                  <span className="checkbox">
                    <input type="checkbox" checked={exportModalState.options.subjectNotes} onChange={e => setExportModalState(s => ({ ...s, options: { ...s.options, subjectNotes: e.target.checked } }))} />
                    <svg>
                      <use xlinkHref="#checkbox-30"></use>
                    </svg>
                  </span>
                </div>
                <span className={colors.containerText}>Subject Notes</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="checkbox-wrapper-30">
                  <span className="checkbox">
                    <input type="checkbox" checked={exportModalState.options.subjectColours} onChange={e => setExportModalState(s => ({ ...s, options: { ...s.options, subjectColours: e.target.checked } }))} />
                    <svg>
                      <use xlinkHref="#checkbox-30"></use>
                    </svg>
                  </span>
                </div>
                <span className={colors.containerText}>Subject Colours</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="checkbox-wrapper-30">
                  <span className="checkbox">
                    <input type="checkbox" checked={exportModalState.options.subjectIcons} onChange={e => setExportModalState(s => ({ ...s, options: { ...s.options, subjectIcons: e.target.checked } }))} />
                    <svg>
                      <use xlinkHref="#checkbox-30"></use>
                    </svg>
                  </span>
                </div>
                <span className={colors.containerText}>Subject Icons</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="checkbox-wrapper-30">
                  <span className="checkbox">
                    <input type="checkbox" checked={exportModalState.options.name} onChange={e => setExportModalState(s => ({ ...s, options: { ...s.options, name: e.target.checked } }))} />
                    <svg>
                      <use xlinkHref="#checkbox-30"></use>
                    </svg>
                  </span>
                </div>
                <span className={colors.containerText}>Name</span>
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setExportModalState(s => ({ ...s, show: false }))}
                className={`${effectiveMode === 'light' ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'} px-4 py-2 rounded-lg font-medium transition-colors duration-200`}
              >Cancel</button>
              <button
                onClick={handleExport}
                className={`${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200`}
              >Export</button>
            </div>
          </div>
        </div>
      )}

      {/* Legal Section */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className={`p-3 rounded-xl ${colors.containerOverlay}`}>
            <FileText size={20} className={`${colors.accentText}`} />
          </div>
          <h3 className={`text-lg font-medium ${colors.text}`}>Legal</h3>
        </div>
        <div className="space-y-3">
          <div className={`${colors.container} ${colors.border} border rounded-2xl p-4 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <FileText className={colors.accentText} size={18} />
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
          <div className={`${colors.container} ${colors.border} border rounded-2xl p-4 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <Shield className={colors.accentText} size={18} />
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
          <div className={`${colors.container} ${colors.border} border rounded-2xl p-4 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <BadgeCheck className={colors.accentText} size={18} />
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
      </section>
      
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
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className={`p-3 rounded-xl ${colors.containerOverlay}`}>
            <BarChart3 size={20} className={`${colors.accentText}`} />
          </div>
          <h3 className={`text-lg font-medium ${colors.text}`}>Markbook Settings</h3>
        </div>
        <div className="space-y-3">
          {localStorage.getItem('markbookPassword') && !showMarkbookSettings && (
            <div className={`${colors.container} ${colors.border} border rounded-2xl p-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <Shield className={`${colors.accentText}`} size={18} />
                <div>
                  <p className={`font-medium ${colors.containerText}`}>View Markbook Settings</p>
                  <p className={`text-sm ${colors.containerText} opacity-80`}>Password required to view settings</p>
                </div>
              </div>
              <button
                onClick={() => setShowMarkbookPasswordVerification(true)}
                className={`${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2`}
              >
                <BarChart3 size={16} />
                View Settings
              </button>
            </div>
          )}

          {(!localStorage.getItem('markbookPassword') || showMarkbookSettings) && (
            <>
              <div className={`${colors.container} ${colors.border} border rounded-2xl p-4 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <Shield className={`${colors.accentText}`} size={18} />
                  <div>
                    <p className={`font-medium ${colors.containerText}`}>Password Protection</p>
                    <p className={`text-sm ${colors.containerText} opacity-80`}>Require a password to view marks</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={markbookPasswordEnabled} onChange={(e) => { setMarkbookPasswordEnabled(e.target.checked); if (!e.target.checked) setMarkbookPassword(''); }} className="sr-only peer" />
                  <div className={`w-14 h-7 rounded-full relative transition-colors ${markbookPasswordEnabled ? colors.buttonAccent : 'bg-gray-500'} peer-focus:outline-none peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-white/20 after:rounded-full after:h-6 after:w-6 after:transition-all`}></div>
                </label>
              </div>
              {markbookPasswordEnabled && (
                <>
                  <div className={`${colors.container} ${colors.border} border rounded-2xl p-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <Lock className={`${colors.accentText}`} size={18} />
                      <div>
                        <p className={`font-medium ${colors.containerText}`}>Markbook Password</p>
                        <p className={`text-sm ${colors.containerText} opacity-80`}>{localStorage.getItem('markbookPassword') ? 'Change your markbook password' : 'Set a password to protect your marks'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className={`${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2`}
                    >
                      <Edit2 size={16} />
                      {localStorage.getItem('markbookPassword') ? 'Change' : 'Set'} Password
                    </button>
                  </div>
                  {localStorage.getItem('markbookPassword') && (
                    <div className={`${colors.container} ${colors.border} border rounded-2xl p-4 flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <Trash2 className={effectiveMode === 'light' ? 'text-red-600' : 'text-red-400'} size={18} />
                        <div>
                          <p className={`font-medium ${colors.containerText}`}>Remove Password</p>
                          <p className={`text-sm ${colors.containerText} opacity-80`}>Remove password protection from markbook</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          localStorage.removeItem('markbookPassword');
                          setMarkbookPasswordEnabled(false);
                          setMarkbookPassword('');
                          showSuccess('Password Removed', 'Markbook password protection has been removed', { effectiveMode, colors });
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </div>
                  )}
                </>
              )}
              {showMarkbookSettings && localStorage.getItem('markbookPassword') && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowMarkbookSettings(false)}
                    className={`${colors.button} ${colors.buttonHover} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2`}
                  >
                    <X size={16} />
                    Close Settings
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

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
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg mb-2 ${effectiveMode === 'light' ? 'bg-white text-black' : 'bg-gray-800 text-white'} ${colors.inputBorder}`}
                  placeholder="Enter current password"
                />
              </div>
            )}
            
            <label className={`block text-sm font-medium mb-1 ${colors.containerText}`}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6 text-lg ${effectiveMode === 'light' ? 'bg-white text-black' : 'bg-gray-800 text-white'} ${colors.inputBorder}`}
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

      {/* Markbook Password Verification Modal */}
      {showMarkbookPasswordVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className={`${colors.container} rounded-lg p-6 shadow-xl border border-gray-700 w-full max-w-md`}>
            <h3 className={`text-xl font-semibold ${colors.buttonText} mb-4`}>Enter Markbook Password</h3>
            <p className={`text-sm ${colors.containerText} opacity-80 mb-4`}>
              Enter your markbook password to view settings
            </p>
            
            <label className={`block text-sm font-medium mb-1 ${colors.containerText}`}>Password</label>
            <input
              type="password"
              value={markbookPasswordVerification}
              onChange={(e) => setMarkbookPasswordVerification(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const storedHash = localStorage.getItem('markbookPassword');
                  if (storedHash && bcrypt.compareSync(markbookPasswordVerification, storedHash)) {
                    setShowMarkbookPasswordVerification(false);
                    setMarkbookPasswordVerification('');
                    setShowMarkbookSettings(true);
                  } else {
                    showError('Incorrect Password', 'Please try again', { effectiveMode, colors });
                  }
                }
              }}
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6 text-lg ${colors.inputBackground} ${colors.inputBorder} ${colors.buttonText}`}
              placeholder="Enter password"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { 
                  setShowMarkbookPasswordVerification(false); 
                  setMarkbookPasswordVerification(''); 
                }}
                className="bg-secondary hover:bg-secondary-dark text-secondary-foreground px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >Cancel</button>
              <button
                onClick={() => {
                  const storedHash = localStorage.getItem('markbookPassword');
                  if (storedHash && bcrypt.compareSync(markbookPasswordVerification, storedHash)) {
                    setShowMarkbookPasswordVerification(false);
                    setMarkbookPasswordVerification('');
                    setShowMarkbookSettings(true);
                  } else {
                    showError('Incorrect Password', 'Please try again', { effectiveMode, colors });
                  }
                }}
                className={`${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200`}
              >Verify</button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Section */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className={colors.text} size={20} />
          <h3 className={`text-lg font-medium ${colors.text}`}>Preferences</h3>
        </div>
        <div className="space-y-3">
          <div className={`${colors.container} ${colors.border} border rounded-2xl p-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <Smartphone className={`${colors.accentText}`} size={18} />
              <div>
                <p className={`font-medium ${colors.containerText}`}>Enable Auto-Naming</p>
                <p className={`text-sm ${colors.containerText} opacity-80`}>Automatically rename subjects based on keywords</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={autoNamingEnabled} onChange={(e) => { setAutoNamingEnabled(e.target.checked); showSuccess( 'Auto-Naming Updated', `Auto-naming has been ${e.target.checked ? 'enabled' : 'disabled'} successfully!`, { effectiveMode, colors } ); }} className="sr-only peer" />
              <div className={`w-14 h-7 rounded-full relative transition-colors ${autoNamingEnabled ? colors.buttonAccent : 'bg-gray-500'} peer-focus:outline-none peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-white/20 after:rounded-full after:h-6 after:w-6 after:transition-all`}></div>
            </label>
          </div>
          <div className={`${colors.container} ${colors.border} border rounded-2xl p-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <Timer className={`${colors.accentText}`} size={18} />
              <div>
                <p className={`font-medium ${colors.containerText}`}>Show Countdown in Browser Tab</p>
                <p className={`text-sm ${colors.containerText} opacity-80`}>Display the countdown timer in the browser tab title</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={countdownInTitle} onChange={(e) => { setCountdownInTitle(e.target.checked); showSuccess( 'Countdown Setting Updated', `Countdown in browser tab has been ${e.target.checked ? 'enabled' : 'disabled'} successfully!`, { effectiveMode, colors } ); }} className="sr-only peer" />
              <div className={`w-14 h-7 rounded-full relative transition-colors ${countdownInTitle ? colors.buttonAccent : 'bg-gray-500'} peer-focus:outline-none peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-white/20 after:rounded-full after:h-6 after:w-6 after:transition-all`}></div>
            </label>
          </div>
          <div className={`${colors.container} ${colors.border} border rounded-2xl p-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <Trash2 className={effectiveMode === 'light' ? 'text-red-600' : 'text-red-400'} size={18} />
              <div>
                <p className={`font-medium ${colors.containerText}`}>Clear Timetable Data</p>
                <p className={`text-sm ${colors.containerText} opacity-80`}>This will remove all uploaded calendar data and subjects</p>
              </div>
            </div>
            <button
              onClick={() => setShowClearDataModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <X size={16} />
              Clear Data
            </button>
          </div>
        </div>
      </section>

      {/* Customise Section */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className={`p-3 rounded-xl ${colors.containerOverlay}`}>
            <Palette size={20} className={`${colors.accentText}`} />
          </div>
          <h3 className={`text-lg font-medium ${colors.text}`}>Customise</h3>
        </div>
        <div className="space-y-3">
          <div className={`${colors.container} ${colors.border} border rounded-2xl p-4`}>
            <div className="flex items-center gap-3 mb-4">
              <Sun className={`${colors.accentText}`} size={18} />
              <div>
                <p className={`font-medium ${colors.containerText}`}>Appearance</p>
                <p className={`text-sm ${colors.containerText} opacity-80`}>Choose your preferred color mode</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setThemeMode('light')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${themeMode === 'light' ? `${colors.buttonAccent} ${colors.buttonText}` : `${colors.button} ${colors.buttonHover} ${colors.buttonText}`}`}
              >
                <Sun size={18} />
                Light
              </button>
              <button
                onClick={() => setThemeMode('dark')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${themeMode === 'dark' ? `${colors.buttonAccent} ${colors.buttonText}` : `${colors.button} ${colors.buttonHover} ${colors.buttonText}`}`}
              >
                <Moon size={18} />
                Dark
              </button>
              <button
                onClick={() => setThemeMode('system')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${themeMode === 'system' ? `${colors.buttonAccent} ${colors.buttonText}` : `${colors.button} ${colors.buttonHover} ${colors.buttonText}`}`}
              >
                <Monitor size={18} />
                System
              </button>
            </div>
          </div>
          <div className={`${colors.container} ${colors.border} border rounded-2xl p-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <Palette className={`${colors.accentText}`} size={18} />
              <div>
                <p className={`font-medium ${colors.containerText}`}>Theme</p>
                <p className={`text-sm ${colors.containerText} opacity-80`}>Change the colour theme of the app</p>
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
      </section>

      {/* Feedback Form (Dummy replacement for YouForm) */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <FileText className={colors.text} size={20} />
          <h3 className={`text-lg font-medium ${colors.text}`}>Feedback</h3>
        </div>
        <div className={`${colors.container} ${colors.border} border rounded-2xl p-4`}>
          <div className="w-full">
            <FeedbackForm 
              theme={theme}
              themeType={themeType}
              effectiveMode={effectiveMode}
              colors={colors}
            />
          </div>
        </div>
      </section>

      {/* Footer with GitHub link and Made by */}
      <div className={`${colors.container} rounded-lg ${colors.border} border p-6`}>
        <div className="flex flex-col items-center gap-4">
          <a
            href="https://github.com/SahasTechnologies/react-schoolplanner"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 ${colors.containerText} hover:${colors.text} transition-colors duration-200`}
            title="View on GitHub"
          >
            <Github size={24} />
            <span className="font-medium">View Source on GitHub</span>
          </a>
          <div className={`flex items-center gap-2 ${colors.containerText}`}>
            <span>Made with</span>
            <Heart size={18} className="text-red-500" fill="currentColor" />
            <span>by Sahas</span>
          </div>
        </div>
      </div>

      {/* Clear Data Confirmation Modal */}
      {showClearDataModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className={`${colors.container} rounded-lg p-6 shadow-xl border border-gray-700 w-full max-w-md`}>
            <h3 className={`text-xl font-semibold ${colors.buttonText} mb-4`}>Clear All Data?</h3>
            <p className={`${colors.containerText} mb-4`}>
              This will permanently remove all your calendar data, subjects, and settings. This action cannot be undone.
            </p>
            <p className={`${colors.containerText} mb-6 font-medium`}>
              💡 Consider exporting your data first to keep a backup!
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearDataModal(false)}
                className={`${colors.button} ${colors.buttonHover} ${colors.buttonText} px-4 py-2 rounded-lg font-medium transition-colors duration-200`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearData();
                  setShowClearDataModal(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Widgets Modal */}
      <WidgetsModal
        isOpen={showWidgetsModal}
        onClose={() => setShowWidgetsModal(false)}
        effectiveMode={effectiveMode}
        colors={colors}
        showCountdownInTimeline={showCountdownInTimeline}
      />
    </div>
    </div>
  );
};

export default Settings;