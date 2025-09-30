import React, { useState, useEffect } from 'react';
import { ExternalLink, Download, Check } from 'lucide-react';

const RedirectPage: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [exported, setExported] = useState(false);

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

  const handleExportData = () => {
    try {
      // Gather all data from localStorage
      const dataToExport: Record<string, any> = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: {}
      };

      // Keys to export
      const keysToExport = [
        'weekData',
        'subjects',
        'userName',
        'autoNamingEnabled',
        'theme',
        'themeType',
        'themeMode',
        'examsBySubject',
        'offlineCachingEnabled',
        'countdownInTitle',
        'showCountdownInTimeline',
        'showCountdownInSidebar',
        'showFirstInfoBeside',
        'infoOrder',
        'infoShown',
        'links',
        'markbookPassword',
        'markbookPasswordEnabled'
      ];

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

      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  return (
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
          boxShadow: theme === 'dark' 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
            : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          border: `1px solid ${borderColor}`,
          transition: 'all 0.3s ease'
        }}
      >
        {/* School Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ margin: '0 auto' }}
          >
            <path
              d="M12 3L2 7L12 11L22 7L12 3Z"
              fill={accentColor}
              opacity="0.2"
            />
            <path
              d="M2 7L12 11L22 7M12 11V21M6 9.5V15.5L12 18.5L18 15.5V9.5"
              stroke={accentColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: '32px',
            fontWeight: '700',
            color: textColor,
            textAlign: 'center',
            marginBottom: '16px',
            lineHeight: '1.2'
          }}
        >
          We've Moved! 🎉
        </h1>

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

        {/* New Domain Box */}
        <div
          style={{
            backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc',
            border: `2px solid ${accentColor}`,
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
            textAlign: 'center'
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
        </div>

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
            onClick={handleExportData}
            style={{
              width: '100%',
              backgroundColor: exported ? '#10b981' : accentColor,
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
              if (!exported) {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!exported) {
                e.currentTarget.style.backgroundColor = accentColor;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {exported ? (
              <>
                <Check size={20} />
                Exported Successfully!
              </>
            ) : (
              <>
                <Download size={20} />
                Export My Data
              </>
            )}
          </button>
        </div>

        {/* Continue to New Site Button */}
        <a
          href="https://school.sahas.dpdns.org"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            backgroundColor: 'transparent',
            color: accentColor,
            border: `2px solid ${accentColor}`,
            borderRadius: '8px',
            padding: '14px 24px',
            fontSize: '16px',
            fontWeight: '600',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = accentColor;
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = accentColor;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Continue to New Site
          <ExternalLink size={20} />
        </a>

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
  );
};

export default RedirectPage;
