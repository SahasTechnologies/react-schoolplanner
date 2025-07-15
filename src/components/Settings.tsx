import React from 'react';
import { Settings, X } from 'lucide-react';

interface SettingsProps {
  clearData: () => void;
}

const SettingsPage: React.FC<SettingsProps> = ({ clearData }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="text-blue-400" size={24} />
        <h2 className="text-2xl font-semibold text-white">Settings</h2>
      </div>
      <div className="space-y-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-medium text-white mb-4">Timetable Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Clear Timetable Data</p>
                <p className="text-gray-400 text-sm">This will remove all uploaded calendar data and subjects</p>
              </div>
              <button
                onClick={clearData}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <X size={16} />
                Clear Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 