import React from 'react';
import { 
  Settings as SettingsIcon, 
  Edit2, 
  X, 
  Palette, 
  GripVertical, 
  User, 
  Trash2, 
  Smartphone, 
  Eye, 
  Sun, 
  Moon, 
  Monitor,
  Home as HomeIcon,
  Calendar
} from 'lucide-react';
import { ThemeKey, colorVars, themeColors } from '../utils/theme';

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
}

const Settings: React.FC<SettingsProps> = ({
  userName,
  setUserName,
  clearData,
  autoNamingEnabled,
  setAutoNamingEnabled,
  showThemeModal,
  setShowThemeModal,
  theme,
  themeType,
  themeMode,
  setThemeMode,
  handleThemeChange,
  effectiveMode,
  colors,
  infoOrder,
  infoShown,
  showInfoPopup,
  setShowInfoPopup,
  draggedIdx,
  handleDragStart,
  handleInfoDragOver,
  handleDragEnd,
  handleToggleInfoShown,
  showFirstInfoBeside,
  setShowFirstInfoBeside
}) => {
  const [showNameEditModal, setShowNameEditModal] = React.useState(false);
  const [editUserName, setEditUserName] = React.useState(userName);

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
        <div className="flex items-center justify-between">
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
              {themeMode === 'light' && <Sun className={effectiveMode === 'light' ? 'text-yellow-600' : 'text-yellow-400'} size={18} />}
              {themeMode === 'dark' && <Moon className={effectiveMode === 'light' ? 'text-blue-600' : 'text-blue-400'} size={18} />}
              {themeMode === 'system' && <Monitor className={effectiveMode === 'light' ? 'text-gray-600' : 'text-gray-400'} size={18} />}
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

      {/* Info Shown at Start Section */}
      <div className={`${colors.container} rounded-lg ${colors.border} border p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <HomeIcon className={effectiveMode === 'light' ? 'text-black' : 'text-white'} size={20} />
          <h3 className={`text-lg font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Home</h3>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className={effectiveMode === 'light' ? 'text-green-600' : 'text-green-400'} size={18} />
            <div>
              <p className={`font-medium ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Info Shown at Start</p>
              <p className={`text-gray-400 text-sm ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>Choose which info is visible before hover in Today's Schedule</p>
            </div>
          </div>
          <button
            onClick={() => setShowInfoPopup(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <Edit2 size={16} />
            Edit
          </button>
        </div>
      </div>

      {/* Info Shown at Start Popup */}
      {showInfoPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`${colors.container} rounded-lg p-6 shadow-xl border border-gray-700 w-full max-w-md`}>
            <h3 className={`text-xl font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'} mb-4`}>Info Shown at Start</h3>
            <div className="space-y-5">
              {infoOrder.map((item: { key: string; label: string }, idx: number) => (
                <div
                  key={item.key}
                  className={`flex items-center justify-between gap-4 py-2 px-1 rounded transition-all duration-300 ${draggedIdx === idx ? 'bg-blue-100/20' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e: React.DragEvent) => { e.preventDefault(); handleInfoDragOver(idx); }}
                  onDragEnd={handleDragEnd}
                  style={{
                    transition: 'margin 0.3s, transform 0.3s',
                    marginTop: infoShown[item.key] && idx !== 0 ? '-12px' : '',
                    zIndex: draggedIdx === idx ? 10 : 1,
                  }}
                >
                  <div className="flex items-center gap-2 min-w-[32px]">
                    <GripVertical className="text-gray-400 cursor-grab" size={20} />
                  </div>
                  <span className="flex-1 font-medium text-lg">{item.label}</span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={infoShown[item.key]}
                      onChange={() => handleToggleInfoShown(item.key)}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition-colors duration-200 shadow-inner">
                      <div className="absolute left-0.5 top-0.5 bg-white border border-gray-300 rounded-full h-6 w-6 transition-transform duration-200 peer-checked:translate-x-5 shadow-md"></div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
            {/* Toggle for first info beside subject name */}
            <div className="flex items-center justify-between gap-4 py-4 mt-4 border-t border-gray-700">
              <span className="font-medium text-lg">Show first info beside subject name</span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showFirstInfoBeside}
                  onChange={(e) => setShowFirstInfoBeside(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition-colors duration-200 shadow-inner">
                  <div className="absolute left-0.5 top-0.5 bg-white border border-gray-300 rounded-full h-6 w-6 transition-transform duration-200 peer-checked:translate-x-5 shadow-md"></div>
                </div>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowInfoPopup(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Theme Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className={`rounded-xl p-8 shadow-2xl border-2 ${colors.container} ${colors.border} w-full max-w-xs mx-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Choose Theme</h3>
              <button onClick={() => setShowThemeModal(false)} className={`${effectiveMode === 'light' ? 'text-black' : 'text-white'} opacity-60 hover:opacity-100`}><X size={20} /></button>
            </div>
            {/* Theme Mode Toggle */}
            <div className="mb-6 flex flex-row items-center justify-center">
              <div className={`relative flex ${effectiveMode === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-full w-44 h-12 px-3 gap-x-2 py-2 transition-colors duration-200`}>
                {/* Toggle thumb */}
                <div
                  className={`absolute top-2 left-3 h-8 w-12 rounded-full transition-all duration-200 shadow-md ${themeMode === 'light' ? 'translate-x-0 bg-white' : themeMode === 'dark' ? 'translate-x-28 bg-gray-900' : 'translate-x-14 bg-gray-300 dark:bg-gray-800'}`}
                  style={{ zIndex: 1 }}
                />
                {/* Light */}
                <button
                  className={`relative flex-1 flex flex-col items-center justify-center z-10 rounded-full transition-colors duration-200 ${themeMode === 'light' ? (effectiveMode === 'light' ? 'text-blue-600' : 'text-blue-400') : (effectiveMode === 'light' ? 'text-black' : 'text-white')} mx-1`}
                  style={{ height: '40px' }}
                  onClick={() => setThemeMode('light')}
                >
                  <Sun size={20} />
                  <span className="text-xs font-medium">Light</span>
                </button>
                {/* System */}
                <button
                  className={`relative flex-1 flex flex-col items-center justify-center z-10 rounded-full transition-colors duration-200 ${themeMode === 'system' ? (effectiveMode === 'light' ? 'text-blue-600' : 'text-blue-400') : (effectiveMode === 'light' ? 'text-black' : 'text-white')} mx-1`}
                  style={{ height: '40px' }}
                  onClick={() => setThemeMode('system')}
                >
                  <Monitor size={20} />
                  <span className="text-xs font-medium">System</span>
                </button>
                {/* Dark */}
                <button
                  className={`relative flex-1 flex flex-col items-center justify-center z-10 rounded-full transition-colors duration-200 ${themeMode === 'dark' ? (effectiveMode === 'light' ? 'text-blue-600' : 'text-blue-400') : (effectiveMode === 'light' ? 'text-black' : 'text-white')} mx-1`}
                  style={{ height: '40px' }}
                  onClick={() => setThemeMode('dark')}
                >
                  <Moon size={20} />
                  <span className="text-xs font-medium">Dark</span>
                </button>
              </div>
            </div>
            {/* Normal Colour */}
            <div className={`mb-2 text-lg font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Normal Colour</div>
            <div className="flex flex-row flex-wrap gap-4 mb-6">
              {(Object.entries(colorVars) as [ThemeKey, typeof colorVars[ThemeKey]][]).map(([key, val]) => (
                <div key={key} className="flex flex-col items-center">
                  <button
                    className={`w-10 h-10 rounded-full border-2 ${(theme === key && themeType === 'normal') ? themeColors(effectiveMode)[key].borderAccent : 'border-gray-600'} ${val[effectiveMode].normal.swatch}`}
                    onClick={() => handleThemeChange(key, 'normal')}
                    title={themeColors(effectiveMode)[key].label}
                  />
                  <span className={`text-sm mt-1 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>{themeColors(effectiveMode)[key].label}</span>
                </div>
              ))}
            </div>
            {/* Extreme Colour */}
            <div className={`mb-2 text-lg font-semibold ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>Extreme Colour</div>
            <div className="flex flex-row flex-wrap gap-4">
              {(Object.entries(colorVars) as [ThemeKey, typeof colorVars[ThemeKey]][]).map(([key, val]) => (
                <div key={key} className="flex flex-col items-center">
                  <button
                    className={`w-10 h-10 rounded-full border-2 ${(theme === key && themeType === 'extreme') ? themeColors(effectiveMode)[key].borderAccent : 'border-gray-600'} ${val[effectiveMode].extreme.swatch}`}
                    onClick={() => handleThemeChange(key, 'extreme')}
                    title={themeColors(effectiveMode)[key].label + ' (Extreme)'}
                  />
                  <span className={`text-sm mt-1 ${effectiveMode === 'light' ? 'text-black' : 'text-white'}`}>{themeColors(effectiveMode)[key].label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings; 