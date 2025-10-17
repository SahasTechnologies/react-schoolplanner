import React, { useState } from 'react';
import { School, TrendingUp, Download } from 'lucide-react';
import ExportModal from './ExportModal';
import { exportData } from '../utils/fileUtils';
import { ThemeKey, getColors } from '../utils/themeUtils';
import type { Subject } from '../types';

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
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Get saved theme from localStorage, or fallback to blue theme with system mode
  const savedTheme = (localStorage.getItem('theme') as ThemeKey) || 'blue';
  const savedThemeType = (localStorage.getItem('themeType') as 'normal' | 'extreme') || 'normal';
  const savedThemeMode = (localStorage.getItem('themeMode') as 'light' | 'dark' | 'system') || 'system';
  
  // Determine effective mode
  const getSystemMode = (): 'light' | 'dark' => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const effectiveMode: 'light' | 'dark' = savedThemeMode === 'system' ? getSystemMode() : savedThemeMode;
  
  // Get colors using the same utility as the main app
  const colors = getColors(savedTheme, savedThemeType, effectiveMode);

  const handleExportData = (options: ExportOptions) => {
    try {
      // Debug: Log what's in localStorage
      console.log('LocalStorage keys:', Object.keys(localStorage));
      console.log('Raw subjects data:', localStorage.getItem('subjects'));
      
      // Get subjects and userName from localStorage
      const subjectsData = localStorage.getItem('subjects');
      const subjects: Subject[] = subjectsData ? JSON.parse(subjectsData) : [];
      const userName = localStorage.getItem('userName') || '';

      console.log('Parsed subjects:', subjects);
      console.log('User name:', userName);

      // Check if we have any data
      if (subjects.length === 0) {
        alert('No data found to export. Make sure you have imported your calendar data before exporting.');
        setShowExportModal(false);
        return;
      }

      // Use the proper export function for main data
      if (options.subjects || options.subjectInfo || options.subjectNotes || options.subjectColours || options.subjectIcons || options.name) {
        exportData(subjects, userName, {
          subjects: options.subjects,
          subjectInfo: options.subjectInfo,
          subjectNotes: options.subjectNotes,
          subjectColours: options.subjectColours,
          subjectIcons: options.subjectIcons,
          name: options.name,
        });
      }

      // Also export additional data if requested (exams, links, preferences)
      if (options.examsBySubject || options.links || options.preferences) {
        const additionalData: Record<string, any> = {
          version: '1.0',
          exportDate: new Date().toISOString(),
          data: {}
        };

        const keysToExport: string[] = [];
        
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
              additionalData.data[key] = JSON.parse(value);
            } catch {
              additionalData.data[key] = value;
            }
          }
        });

        // Create blob and download for additional data
        const blob = new Blob([JSON.stringify(additionalData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `school-planner-additional-${new Date().toISOString().split('T')[0]}.school`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

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
          backgroundColor: colors.background,
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
            backgroundColor: colors.container,
            borderColor: colors.border,
            borderRadius: '16px',
            padding: '48px 32px',
            border: `1px solid ${colors.border}`,
            transition: 'all 0.3s ease'
          }}
        >
          {/* School Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <School
              size={80}
              color={colors.accent}
              style={{ margin: '0 auto' }}
            />
          </div>

          {/* Heading with Icon */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: '700',
                color: colors.text,
                textAlign: 'center',
                lineHeight: '1.2'
              }}
            >
              We've Moved
            </h1>
            <TrendingUp size={32} color={colors.accent} />
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: '16px',
              color: colors.textSecondary,
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
              backgroundColor: colors.container,
              border: `2px solid ${colors.accent}`,
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
                color: colors.textSecondary,
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
                color: colors.accent,
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
              color: colors.textSecondary,
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
                color: colors.textSecondary,
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
                backgroundColor: colors.buttonAccent,
                color: colors.buttonText,
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
                e.currentTarget.style.backgroundColor = colors.buttonAccent;
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
              color: colors.textSecondary,
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
        theme={effectiveMode}
      />
    </>
  );
};

export default RedirectPage;
