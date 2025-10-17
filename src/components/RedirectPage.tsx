import React from 'react';
import { School, TrendingUp, Download } from 'lucide-react';
import { exportAllData } from '../utils/fileUtils';
import { ThemeKey, getColorValues } from '../utils/themeUtils';
import type { Subject } from '../types';

const RedirectPage: React.FC = () => {
  
  // Get saved theme from localStorage, or fallback to blue theme with system mode
  const savedTheme = (localStorage.getItem('theme') as ThemeKey) || 'blue';
  const savedThemeType = (localStorage.getItem('themeType') as 'normal' | 'extreme') || 'normal';
  const savedThemeMode = (localStorage.getItem('themeMode') as 'light' | 'dark' | 'system') || 'system';
  
  // Determine effective mode
  const getSystemMode = (): 'light' | 'dark' => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const effectiveMode: 'light' | 'dark' = savedThemeMode === 'system' ? getSystemMode() : savedThemeMode;
  
  // Get colors using the color values utility for inline styles
  const colors = getColorValues(savedTheme, savedThemeType, effectiveMode);

  const handleExportAllData = () => {
    try {
      // Get subjects and userName from localStorage
      const subjectsData = localStorage.getItem('subjects');
      const subjects: Subject[] = subjectsData ? JSON.parse(subjectsData) : [];
      const userName = localStorage.getItem('userName') || '';

      // Check if we have any data
      if (subjects.length === 0) {
        alert('No data found to export. Make sure you have imported your calendar data before exporting.');
        return;
      }

      // Export EVERYTHING in a single comprehensive file
      // Includes: subjects (with timings, original/edited names), subject info, notes, colors, icons,
      // name, exams, markbook, links, and all preferences
      const fileName = exportAllData(subjects, userName, true);

      alert(`✅ Export successful! File "${fileName}" has been downloaded with all your data.`);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('❌ Failed to export data. Please try again.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.background,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        fontFamily: "'Red Hat Text', system-ui, -apple-system, sans-serif",
        transition: 'background-color 0.3s ease'
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
          lineHeight: '1.6',
          maxWidth: '600px'
        }}
      >
        School Planner has moved to a new domain for better performance and reliability.
      </p>

      {/* New Domain Button */}
      <a
        href="https://school.sahas.dpdns.org"
        style={{
          display: 'block',
          backgroundColor: effectiveMode === 'dark' ? '#1f2937' : '#f9fafb',
          border: `2px solid ${colors.accent}`,
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '8px',
          textAlign: 'center',
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          maxWidth: '600px',
          width: '100%'
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
      <div style={{ marginBottom: '24px', maxWidth: '600px', width: '100%' }}>
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
          onClick={handleExportAllData}
          style={{
            width: '100%',
            backgroundColor: colors.accent,
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
            e.currentTarget.style.backgroundColor = colors.accent;
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
          lineHeight: '1.5',
          maxWidth: '600px'
        }}
      >
        Your bookmarks and saved links will need to be updated. This old domain will be deactivated soon.
      </p>
    </div>
  );
};

export default RedirectPage;
