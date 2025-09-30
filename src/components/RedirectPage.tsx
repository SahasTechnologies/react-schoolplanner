import React, { useState, useEffect } from 'react';
import { GraduationCap, TrendingUp, Download } from 'lucide-react';
import ExportModal from './ExportModal';

interface ExportOptions {
  subjects: boolean;
  subjectInfo: boolean;
  subjectNotes: boolean;
  subjectColours: boolean;
  subjectIcons: boolean;
  name: boolean;
  examsBySubject: boolean;
  links: boolean;
  preferences: boolean;
}

const RedirectPage: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    // Detect system theme preference
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(isDark ? 'dark' : 'light');

    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const backgroundColor = theme === 'dark' ? '#0f172a' : '#f1f5f9';
  const cardBackground = theme === 'dark' ? '#1e293b' : '#ffffff';
  const textColor = theme === 'dark' ? '#f1f5f9' : '#0f172a';
  const accentColor = '#3b82f6'; // Blue accent
  const mutedText = theme === 'dark' ? '#94a3b8' : '#64748b';
  const borderColor = theme === 'dark' ? '#334155' : '#e2e8f0';

  const handleExportData = (options: ExportOptions) => {
    try {
      // Gather all data from localStorage based on selected options
      const dataToExport: Record<string, any> = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: {}
      };

      // Build keys array based on options
      const keysToExport: string[] = [];
      
      if (options.subjects) keysToExport.push('weekData', 'subjects');
      if (options.name) keysToExport.push('userName');
      if (options.subjectColours) keysToExport.push('subjectColours');
      if (options.subjectIcons) keysToExport.push('subjectIcons');
      if (options.examsBySubject) keysToExport.push('examsBySubject', 'markbookPassword', 'markbookPasswordEnabled');
      if (options.links) keysToExport.push('links');
      if (options.preferences) {
        keysToExport.push(
          'autoNamingEnabled',
          'theme',
          'themeType',
          'themeMode',
          'offlineCachingEnabled',
          'countdownInTitle',
          'showCountdownInTimeline',
          'showCountdownInSidebar',
          'showFirstInfoBeside',
          'infoOrder',
          'infoShown'
        );
      }

      // Export each key
      keysToExport.forEach(key => {
        const value = localStorage.getItem(key);
        if (value !== null) {
          try {
            dataToExport.data[key] = JSON.parse(value);
          } catch {
            dataToExport.data[key] = value;
          }
        }
      });

      // Create blob and download
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `school-planner-export-${new Date().toISOString().split('T')[0]}.school`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowExportModal(false);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  return (
    <>
      <div
        style={{
          minHeight: '100vh',
          backgroundColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: "'Red Hat Text', system-ui, -apple-system, sans-serif",
          transition: 'background-color 0.3s ease'
        }}
      >
        <div
          style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: cardBackground,
            borderRadius: '16px',
            padding: '48px 32px',
            border: `1px solid ${borderColor}`,
            transition: 'all 0.3s ease'
          }}
        >
          {/* School Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <GraduationCap
              size={80}
              color={accentColor}
              style={{ margin: '0 auto' }}
            />
          </div>

          {/* Heading with Icon */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: '700',
                color: textColor,
                textAlign: 'center',
                lineHeight: '1.2'
              }}
            >
              We've Moved
            </h1>
            <TrendingUp size={32} color={accentColor} />
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: '16px',
              color: mutedText,
              textAlign: 'center',
              marginBottom: '32px',
              lineHeight: '1.6'
            }}
          >
            School Planner has moved to a new domain for better performance and reliability.
          </p>

          {/* New Domain Button */}
          <a
            href="https://school.sahas.dpdns.org"
            style={{
              display: 'block',
              backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc',
              border: `2px solid ${accentColor}`,
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '8px',
              textAlign: 'center',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <p
              style={{
                fontSize: '14px',
                color: mutedText,
                marginBottom: '8px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              New Domain
            </p>
            <p
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: accentColor,
                wordBreak: 'break-all'
              }}
            >
              school.sahas.dpdns.org
            </p>
          </a>

          {/* Error Code */}
          <p
            style={{
              fontSize: '11px',
              color: mutedText,
              textAlign: 'center',
              marginBottom: '32px',
              fontFamily: 'monospace',
              opacity: 0.7
            }}
          >
            ERR_301_MOVED_PERMANENTLY
          </p>

          {/* Export Button */}
          <div style={{ marginBottom: '24px' }}>
            <p
              style={{
                fontSize: '14px',
                color: mutedText,
                marginBottom: '12px',
                textAlign: 'center'
              }}
            >
              Before you go, export your data to import it on the new site:
            </p>
            <button
              onClick={() => setShowExportModal(true)}
              style={{
                width: '100%',
                backgroundColor: accentColor,
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '14px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = accentColor;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Download size={20} />
              Export My Data
            </button>
          </div>

          {/* Footer Note */}
          <p
            style={{
              fontSize: '12px',
              color: mutedText,
              textAlign: 'center',
              marginTop: '24px',
              lineHeight: '1.5'
            }}
          >
            Your bookmarks and saved links will need to be updated. This old domain will be deactivated soon.
          </p>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        show={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportData}
        theme={theme}
      />
    </>
  );
};

export default RedirectPage;
