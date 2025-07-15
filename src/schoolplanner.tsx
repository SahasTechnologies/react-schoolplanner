  // NOTE: This file requires the following dependencies to be present in your package.json for deployment:
  //   react, react-dom, lucide-react, @types/react, @types/react-dom
  // Favicon and title are set in index.html, see instructions below.
  import { useState, useRef } from 'react';
  import { Calendar, FileText, BarChart3, Settings, Home as HomeIcon } from 'lucide-react';
  import Home from './components/Home';
  import WeekView from './components/WeekView';
  import Markbook from './components/Markbook';
  import SettingsPage from './components/Settings';

  interface CalendarEvent {
    dtstart: Date;
    dtend?: Date;
    summary: string;
    location?: string;
    description?: string;
  }

  interface WeekData {
    monday: Date;
    friday: Date;
    events: CalendarEvent[];
  }

  interface Subject {
    id: string; // Unique ID for the subject
    name: string; // Display name, can be edited
    colour: string; // Changed to Australian English 'colour'
  }

  const SchoolPlanner = () => {
    const [weekData, setWeekData] = useState<WeekData | null>(null);
    const [error, setError] = useState('');
    const [loading] = useState(false); // Remove setLoading since it's unused
    const [currentPage, setCurrentPage] = useState('home'); // Initial page
    const [subjects, setSubjects] = useState<Subject[]>([]);
    
    // State for subject editing modal
    const [showSubjectEditModal, setShowSubjectEditModal] = useState(false);
    const [selectedSubjectForEdit, setSelectedSubjectForEdit] = useState<Subject | null>(null);
    const [editName, setEditName] = useState('');
    const [editColour, setEditColour] = useState(''); // Changed to 'editColour'

    // Welcome screen states
    const [welcomeStep, setWelcomeStep] = useState<'welcome' | 'name_input' | 'upload_ics' | 'completed'>('welcome');
    const [userName, setUserName] = useState('');

    // New state for auto-naming toggle
    const [autoNamingEnabled, setAutoNamingEnabled] = useState(true);

    // Remove enhanced biweekly schedule and pattern logic

    const customColourInputRef = useRef<HTMLInputElement | null>(null);

    // Default colours for the palette
    const defaultColours = [
      '#7C3AED', '#0891B2', '#DC2626', '#D97706', '#059669',
      '#047857', '#EA580C', '#2563EB', '#DB2777', '#475569',
      '#8B5CF6', '#06B6D4', '#EF4444', '#F59E0B', '#10B981',
      '#14B8A6', '#F97316', '#3B82F6', '#EC4899', '#64748B',
      '#6D28D9', '#0E7490', '#B91C1C', '#B45309', '#065F46'
    ];

    // Generate random colour (now uses defaultColours array)
    const generateRandomColour = () => {
      return defaultColours[Math.floor(Math.random() * defaultColours.length)];
    };

    // Determine greeting based on time of day
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      if (hour < 22) return 'Good evening';
      return 'Good night';
    };

    // Map for specific subject renames
    const renameMap = new Map<string, string>([
      ['roll', 'Roll Call'],
      ['va', 'Visual Arts'],
      ['art', 'Visual Arts'],
      ['history', 'History'],
      ['math', 'Mathematics'],
      ['tech', 'Technology'],
      ['english', 'English'],
      ['science', 'Science'],
      ['rec', 'Rec Sport'],
      ['pe', 'PD/H/PE'],
      ['pd', 'PD/H/PE'],
      ['japanese', 'Japanese'],
      ['latin', 'Latin'],
      ['french', 'French'],
      ['bhope', 'BHOPE'],
      ['music', 'Music'],
      ['commerce', 'Commerce'],
      ['drama', 'Drama'],
      ['geography', 'Geography'],
      ['design', 'Design & Technology'],
      ['dt', 'Design & Technology'],
      ['sport', 'Sport'],
      ['library', 'Library'],
      ['assembly', 'Assembly'],
      ['chapel', 'Chapel'],
      ['wellbeing', 'Wellbeing'],
      ['pastoral', 'Pastoral Care'],
      ['it', 'Information Technology'],
      ['computing', 'Computing'],
      ['stem', 'STEM'],
      ['coding', 'Coding Club'],
      ['robotics', 'Robotics'],
      ['choir', 'Choir'],
      ['band', 'Band Practice'],
      ['orchestra', 'Orchestra'],
      ['drama club', 'Drama Club'],
      ['debate', 'Debate Club'],
      ['reading', 'Reading Group'],
      ['writing', 'Writing Workshop'],
      ['study', 'Study Hall'],
      ['tutorial', 'Tutorial'],
      ['mentor', 'Mentoring Session'],
      ['career', 'Career Guidance'],
      ['counseling', 'Counseling'],
    ]);

    // Helper to normalize subject names for grouping and renaming
    const normalizeSubjectName = (summary: string): string => {
      let lowerSummary = summary.toLowerCase();

      if (autoNamingEnabled) { // Apply auto-naming only if enabled
        // Apply specific renames based on keywords first
        for (const [key, value] of renameMap.entries()) {
          if (lowerSummary.includes(key)) {
            return value; // Return the renamed value immediately upon first match
          }
        }

        // Then apply general cleaning (removing "period", "lesson", etc.)
        let cleanedName = lowerSummary.replace(/(period|lesson|class|room)\s*\d*/g, '').trim();

        // Capitalize the first letter of each word if it's not a specific rename
        if (cleanedName) {
          return cleanedName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
      }
      
      return summary.trim(); // Fallback to original if auto-naming is off or no specific rename/cleaning yields a useful name
    };

    const getEventColour = (title: string): string => { // Changed to 'getEventColour'
      const normalizedTitle = normalizeSubjectName(title);
      const subject = subjects.find((s: Subject) => normalizeSubjectName(s.name) === normalizedTitle);
      return subject ? subject.colour : generateRandomColour(); // Changed to 'subject.colour'
    };

    const clearData = () => {
      setWeekData(null);
      setError('');
      setSubjects([]);
      setWelcomeStep('welcome'); // Reset to welcome screen
      setUserName(''); // Clear user name
      setAutoNamingEnabled(true); // Reset auto-naming to default
      // Remove any now-unused state or props
    };

    const formatTime = (date: Date): string => {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    };

    // Subject editing modal functions
    const startEditingSubject = (subject: Subject) => {
      setSelectedSubjectForEdit(subject);
      setEditName(subject.name);
      setEditColour(subject.colour); // Changed to 'editColour'
      setShowSubjectEditModal(true);
    };

    const saveSubjectEdit = () => {
      if (selectedSubjectForEdit) {
        // Check if the new name conflicts with an existing subject (to merge)
        const existingSubjectWithNewName = subjects.find(
          (s: Subject) => normalizeSubjectName(s.name) === normalizeSubjectName(editName) && s.id !== selectedSubjectForEdit.id
        );

        if (existingSubjectWithNewName) {
          // Merge: Update events to point to the existing subject's ID
          // This is a simplified merge, actual event re-assignment isn't handled here
          // For now, we'll just remove the old subject and keep the existing one.
          setSubjects((prevSubjects: Subject[]) =>
            prevSubjects.filter((s: Subject) => s.id !== selectedSubjectForEdit.id)
          );
          // The colour of the existing subject might be updated if desired, but for simplicity, we keep its original colour.
        } else {
          // No conflict, just update the subject
          setSubjects((prevSubjects: Subject[]) =>
            prevSubjects.map((subject: Subject) =>
              subject.id === selectedSubjectForEdit.id
                ? { ...subject, name: editName, colour: editColour } // Changed to 'colour'
                : subject
            )
          );
        }
      }
      setShowSubjectEditModal(false);
      setSelectedSubjectForEdit(null);
      setEditName('');
      setEditColour('');
    };

    const cancelSubjectEdit = () => {
      setShowSubjectEditModal(false);
      setSelectedSubjectForEdit(null);
      setEditName('');
      setEditColour('');
    };

    // Remove week navigation logic


    const renderCurrentPage = () => {
      switch (currentPage) {
        case 'home':
          return <Home weekData={weekData} subjects={subjects} setCurrentPage={setCurrentPage} userName={userName} getGreeting={getGreeting} />;
        case 'calendar':
          return <WeekView weekData={weekData} getEventColour={getEventColour} formatTime={formatTime} />;
        case 'markbook':
          return <Markbook
            subjects={subjects}
            startEditingSubject={startEditingSubject}
            showSubjectEditModal={showSubjectEditModal}
            selectedSubjectForEdit={selectedSubjectForEdit}
            editName={editName}
            setEditName={setEditName}
            editColour={editColour}
            setEditColour={setEditColour}
            saveSubjectEdit={saveSubjectEdit}
            cancelSubjectEdit={cancelSubjectEdit}
            defaultColours={defaultColours}
            customColourInputRef={customColourInputRef}
          />;
        case 'settings':
          return <SettingsPage clearData={clearData} />;
        default:
          return <Home weekData={weekData} subjects={subjects} setCurrentPage={setCurrentPage} userName={userName} getGreeting={getGreeting} />;
      }
    };

    // Main render logic based on welcomeStep
    if (welcomeStep !== 'completed') {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center font-inter">
          {/* Welcome screen content is now handled by Home component */}
          {renderCurrentPage()}
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-900 text-white flex font-inter">
        {/* Sidebar */}
        <div className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4">
          <div className="space-y-4 w-full"> {/* Added w-full here for centering */}
            <button
              onClick={() => setCurrentPage('home')}
              className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${ // Added mx-auto block
                currentPage === 'home'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <HomeIcon size={20} />
            </button>

            <button
              onClick={() => setCurrentPage('calendar')}
              className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${ // Added mx-auto block
                currentPage === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Calendar size={20} />
            </button>

            <button
              onClick={() => setCurrentPage('markbook')}
              className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${ // Added mx-auto block
                currentPage === 'markbook'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <BarChart3 size={20} />
            </button>

            <button
              onClick={() => setCurrentPage('settings')}
              className={`p-3 rounded-lg transition-colors duration-200 mx-auto block ${ // Added mx-auto block
                currentPage === 'settings'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
              {/* Header - Conditional based on page */}
              {currentPage === 'home' && (
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold mb-2 text-white">
                    {userName ? `${getGreeting()}, ${userName}!` : 'School Planner'}
                  </h1>
                  <p className="text-gray-400">Manage your schedule and subjects</p>
                </div>
              )}
              {currentPage === 'settings' && (
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold mb-2 text-white">School Planner</h1>
                  <p className="text-gray-400">Manage your schedule and subjects</p>
                </div>
              )}


              {/* Loading State (only for main app after welcome) */}
              {loading && welcomeStep === 'completed' && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                  <p className="text-gray-400">Processing your calendar...</p>
                </div>
              )}

              {/* Error State (only for main app after welcome) */}
              {error && welcomeStep === 'completed' && (
                <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-red-400">
                    <FileText size={20} />
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Current Page Content */}
              {renderCurrentPage()}

              {/* Empty State for Calendar (only if not loading, no error, no data, and on calendar page) */}
              {!loading && !error && !weekData && currentPage === 'calendar' && (
                <div className="text-center py-16">
                  <Calendar size={64} className="mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 text-lg">No calendar data loaded yet</p>
                  <p className="text-gray-500 text-sm">Upload an ICS file to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default SchoolPlanner;
  // To set the favicon and page title:
  // 1. Edit public/index.html
  // 2. Set <title>School Planner</title>
  // 3. For favicon, export the Lucide 'School' icon as SVG and set as <link rel="icon" href="/school.svg"> in index.html.

