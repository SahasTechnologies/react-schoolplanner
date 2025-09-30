import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ExportModalProps {
  show: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  theme: 'light' | 'dark';
}

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

const ExportModal: React.FC<ExportModalProps> = ({ show, onClose, onExport, theme }) => {
  const [options, setOptions] = useState<ExportOptions>({
    subjects: true,
    subjectInfo: true,
    subjectNotes: true,
    subjectColours: true,
    subjectIcons: true,
    name: true,
    examsBySubject: true,
    links: true,
    preferences: true,
  });

  const cardBackground = theme === 'dark' ? '#1e293b' : '#ffffff';
  const textColor = theme === 'dark' ? '#f1f5f9' : '#0f172a';
  const mutedText = theme === 'dark' ? '#94a3b8' : '#64748b';
  const borderColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const accentColor = '#3b82f6';

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '20px'
      }}
    >
      <div
        style={{
          backgroundColor: cardBackground,
          borderRadius: '12px',
          padding: '24px',
          border: `1px solid ${borderColor}`,
          width: '100%',
          maxWidth: '500px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: textColor }}>Export Data</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: mutedText,
              padding: '4px'
            }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={options.subjects}
              onChange={(e) => setOptions({ ...options, subjects: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ color: textColor }}>Subjects (with timing, original/edited names)</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={options.subjectInfo}
              onChange={(e) => setOptions({ ...options, subjectInfo: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ color: textColor }}>Subject Information</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={options.subjectNotes}
              onChange={(e) => setOptions({ ...options, subjectNotes: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ color: textColor }}>Subject Notes</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={options.subjectColours}
              onChange={(e) => setOptions({ ...options, subjectColours: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ color: textColor }}>Subject Colours</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={options.subjectIcons}
              onChange={(e) => setOptions({ ...options, subjectIcons: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ color: textColor }}>Subject Icons</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={options.name}
              onChange={(e) => setOptions({ ...options, name: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ color: textColor }}>Name</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={options.examsBySubject}
              onChange={(e) => setOptions({ ...options, examsBySubject: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ color: textColor }}>Exams & Markbook Data</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={options.links}
              onChange={(e) => setOptions({ ...options, links: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ color: textColor }}>Custom Links</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={options.preferences}
              onChange={(e) => setOptions({ ...options, preferences: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ color: textColor }}>All Preferences & Settings</span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: theme === 'dark' ? '#334155' : '#e2e8f0',
              color: textColor,
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onExport(options)}
            style={{
              backgroundColor: accentColor,
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
