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
  LoaderCircle
} from 'lucide-react';
import { ThemeKey } from '../utils/theme';
import { registerServiceWorker, unregisterServiceWorker, clearAllCaches, isServiceWorkerSupported, getServiceWorkerStatus, forceCacheUpdate } from '../utils/cacheUtils';

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
  showInfoPopup: boolean;
  setShowInfoPopup: (show: boolean) => void;
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
  setOfflineCachingEnabled: (enabled: boolean) => void;
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
  setOfflineCachingEnabled
}: SettingsProps) => {
  const [showNameEditModal, setShowNameEditModal] = React.useState(false);
  const [editUserName, setEditUserName] = React.useState(userName);
  const [serviceWorkerSupported] = React.useState(isServiceWorkerSupported());
  const [isCachingLoading, setIsCachingLoading] = React.useState(false);
  const [swStatus, setSwStatus] = React.useState<'registered' | 'not-registered' | 'not-supported'>('not-registered');

  // Handle offline caching toggle
  const handleOfflineCachingToggle = async (enabled: boolean) => {
    setIsCachingLoading(true);
    
    if (enabled) {
      // Enable offline caching
      const success = await registerServiceWorker();
      if (success) {
        setOfflineCachingEnabled(true);
        setTimeout(async () => {
          const status = await getServiceWorkerStatus();
          setSwStatus(status);
          setIsCachingLoading(false);
        }, 1000);
      } else {
        // Show error or revert toggle
        console.error('Failed to enable offline caching');
        alert('Failed to enable offline caching. Please try again.');
        setIsCachingLoading(false);
      }
    } else {
      // Disable offline caching
      await unregisterServiceWorker();
      await clearAllCaches();
      setOfflineCachingEnabled(false);
      setSwStatus('not-registered');
      setIsCachingLoading(false);
    }
  };

  // Check status on mount
  React.useEffect(() => {
    const checkStatus = async () => {
      const status = await getServiceWorkerStatus();
      setSwStatus(status);
    };
    checkStatus();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={24} />
        <h2 className={`text-2xl font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Settings</h2>
      </div>

      {/* Data Section */}
      <div className={`${colors.container} rounded-lg ${colors.border} border p-6 mb-4`}>
        <div className="flex items-center gap-2 mb-4">
          <User className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={20} />
          <h3 className={`text-lg font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Data</h3>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className={`font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Name</p>
            <p className={`text-gray-400 text-sm ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>{userName || <span className="italic">(not set)</span>}</p>
          </div>
          <button
            onClick={() => { setEditUserName(userName); setShowNameEditModal(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <Edit2 size={16} />
            Change Name
          </button>
        </div>
        {/* Export Data Button */}
        <div className="flex items-center justify-between mt-4">
          <div>
            <p className={`font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Export Data</p>
            <p className={`text-gray-400 text-sm ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>Export your calendar and subject data as a .school file</p>
          </div>
          <button
            onClick={() => setExportModalState((prev) => ({ ...prev, show: true }))}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <FileText size={16} />
            Export
          </button>
        </div>
        {/* Import Data Button (direct file input, no modal) */}
        <div className="flex items-center justify-between mt-4">
          <div>
            <p className={`font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Import Data</p>
            <p className={`text-gray-400 text-sm ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>Import your .ics or .school file</p>
          </div>
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
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
          </>
        </div>
        {/* Offline Caching Toggle */}
        <div className="flex items-center justify-between mt-4 border-t border-gray-700 pt-4">
          <div className="flex items-center gap-3">
            {offlineCachingEnabled ? (
              <Wifi className={effectiveMode === 'light' ? 'text-green-600' : 'text-green-400'} size={18} />
            ) : (
              <WifiOff className={effectiveMode === 'light' ? 'text-gray-600' : 'text-gray-400'} size={18} />
            )}
            <div>
              <p className={`font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Save Site for Offline Use</p>
              <p className={`text-gray-400 text-sm ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>
                {serviceWorkerSupported 
                  ? 'Cache the site so it works without internet connection' 
                  : 'Service Worker not supported in this browser'}
              </p>
            </div>
          </div>
          {isCachingLoading ? (
            <div className="flex items-center justify-center w-11 h-6">
              <LoaderCircle className={`animate-spin ${effectiveMode === 'light' ? 'text-blue-600' : 'text-blue-400'}`} size={20} />
            </div>
          ) : (
            <label className={`relative inline-flex items-center cursor-pointer ${!serviceWorkerSupported ? 'opacity-50' : ''}`}>
              <input
                type="checkbox"
                checked={offlineCachingEnabled}
                onChange={(e) => serviceWorkerSupported && handleOfflineCachingToggle(e.target.checked)}
                className="sr-only peer"
                disabled={!serviceWorkerSupported}
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          )}
        </div>
        
        {/* Update Cache Button - only show if caching is enabled */}
        {offlineCachingEnabled && serviceWorkerSupported && (
          <div className="flex items-center justify-between mt-4 border-t border-gray-700 pt-4">
            <div className="flex items-center gap-3">
              <div>
                <p className={`font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Update Cache</p>
                <p className={`text-gray-400 text-sm ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>
                  Manually update the cached files to the latest version
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                const success = await forceCacheUpdate();
                if (success) {
                  alert('Cache updated successfully!');
                } else {
                  alert('Failed to update cache. Please try again.');
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <FileText size={16} />
              Update Cache
            </button>
          </div>
        )}
      </div>

      {/* Name Edit Modal */}
      {showNameEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className={`${colors.container} rounded-lg p-6 shadow-xl border border-gray-700 w-full max-w-md`}>
            <h3 className={`text-xl font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'} mb-4`}>Edit Name</h3>
            <input
              type="text"
              value={editUserName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditUserName(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6 text-lg ${effectiveMode === 'light' ? 'bg-gray-100 text-black border-gray-300' : 'bg-gray-700 text-white border-gray-600'}`}
              placeholder="Enter your name"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNameEditModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >Cancel</button>
              <button
                onClick={() => { setUserName(editUserName); setShowNameEditModal(false); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportModalState.show && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className={`${colors.container} rounded-lg p-6 shadow-xl border border-gray-700 w-full max-w-md`}>
            <h3 className={`text-xl font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'} mb-4`}>Export Data</h3>
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
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >Cancel</button>
              <button
                onClick={handleExport}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >Export</button>
            </div>
          </div>
        </div>
      )}

      {/* Timetable Settings */}
      <div className={`${colors.container} rounded-lg ${colors.border} border p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={20} />
          <h3 className={`text-lg font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Timetable Settings</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trash2 className={effectiveMode === 'light' ? 'text-red-600' : 'text-red-400'} size={18} />
              <div>
                <p className={`font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Clear Timetable Data</p>
                <p className={`text-gray-400 text-sm ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>This will remove all uploaded calendar data and subjects</p>
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
          <div className="flex items-center justify-between mt-4 border-t border-gray-700 pt-4">
            <div className="flex items-center gap-3">
              <Smartphone className={effectiveMode === 'light' ? 'text-blue-600' : 'text-blue-400'} size={18} />
              <div>
                <p className={`font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Enable Auto-Naming</p>
                <p className={`text-gray-400 text-sm ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>Automatically rename subjects based on keywords</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoNamingEnabled}
                onChange={(e) => setAutoNamingEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Customise Section */}
      <div className={`${colors.container} rounded-lg ${colors.border} border p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <Palette className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={20} />
          <h3 className={`text-lg font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Customise</h3>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {/* themeMode === 'light' && <Sun className={effectiveMode === 'light' ? 'text-yellow-600' : 'text-yellow-400'} size={18} /> */}
              {/* themeMode === 'dark' && <Moon className={effectiveMode === 'light' ? 'text-blue-600' : 'text-blue-400'} size={18} /> */}
              {/* themeMode === 'system' && <Monitor className={effectiveMode === 'light' ? 'text-gray-600' : 'text-gray-400'} size={18} /> */}
            </div>
            <div>
              <p className={`font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Theme</p>
              <p className={`text-gray-400 text-sm ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>Change the color theme of the app</p>
            </div>
          </div>
          <button
            onClick={() => setShowThemeModal(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${colors.button} text-white`}
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