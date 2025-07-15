import React from 'react';
import { Calendar, BarChart3, Home as HomeIcon } from 'lucide-react';
import { WeekData, Subject } from '../types';

interface HomeProps {
  weekData: WeekData | null;
  subjects: Subject[];
  setCurrentPage: (page: string) => void;
  userName: string;
  getGreeting: () => string;
}

const Home: React.FC<HomeProps> = ({ weekData, subjects, setCurrentPage, userName, getGreeting }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HomeIcon className="text-blue-400" size={24} />
        <h2 className="text-2xl font-semibold text-white">Home</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="text-blue-400" size={20} />
            <h3 className="text-lg font-medium text-white">Schedule</h3>
          </div>
          <p className="text-gray-400 mb-4">
            {weekData ? 'View your weekly schedule' : 'Upload your ICS calendar file to get started'}
          </p>
          <button
            onClick={() => setCurrentPage('calendar')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            {weekData ? 'View Schedule' : 'Upload Calendar'}
          </button>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="text-blue-400" size={20} />
            <h3 className="text-lg font-medium text-white">Markbook</h3>
          </div>
          <p className="text-gray-400 mb-4">
            {subjects.length > 0 ? `Manage your ${subjects.length} subjects` : 'No subjects available yet'}
          </p>
          <button
            onClick={() => setCurrentPage('markbook')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Open Markbook
          </button>
        </div>
      </div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">
          {userName ? `${getGreeting()}, ${userName}!` : 'School Planner'}
        </h1>
        <p className="text-gray-400">Manage your schedule and subjects</p>
      </div>
    </div>
  );
};

export default Home; 