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
      <style>{`
        /* Set theme variables for checkbox for better light mode visibility */
        .checkbox-wrapper-30 {
          --color-bg: ${theme === 'light' ? '#f3f4f6' : '#232323'};
          --color-bg-dark: ${theme === 'dark' ? '#232323' : '#f3f4f6'};
          --color-border: ${theme === 'light' ? '#d1d5db' : '#444'};
          --color-primary: ${accentColor};
          --color-primary-light: ${accentColor};
        }
        /* Checkbox CSS by Saeed Alipoor */
        .checkbox-wrapper-30 .checkbox {
          --bg: var(--color-bg);
          --brdr: var(--color-border);
          --brdr-actv: var(--color-primary);
          --brdr-hovr: var(--color-primary-light);
          --tick: ${theme === 'light' ? '#222' : '#fff'};
          --dur: calc((var(--size, 2)/2) * 0.6s);
          display: inline-block;
          width: calc(var(--size, 1) * 22px);
          position: relative;
        }
        .checkbox-wrapper-30 .checkbox:after {
          content: "";
          width: 100%;
          padding-top: 100%;
          display: block;
        }
        .checkbox-wrapper-30 .checkbox > * {
          position: absolute;
        }
        .checkbox-wrapper-30 .checkbox input {
          -webkit-appearance: none;
          -moz-appearance: none;
          -webkit-tap-highlight-color: transparent;
          cursor: pointer;
          background-color: var(--bg);
          border-radius: calc(var(--size, 1) * 4px);
          border: calc(var(--newBrdr, var(--size, 1)) * 1px) solid;
          color: var(--newBrdrClr, var(--brdr));
          outline: none;
          margin: 0;
          padding: 0;
          transition: all calc(var(--dur) / 3) linear;
        }
        .checkbox-wrapper-30 .checkbox input:hover,
        .checkbox-wrapper-30 .checkbox input:checked {
          --newBrdr: calc(var(--size, 1) * 2);
        }
        .checkbox-wrapper-30 .checkbox input:hover {
          --newBrdrClr: var(--brdr-hovr);
        }
        .checkbox-wrapper-30 .checkbox input:checked {
          --newBrdrClr: var(--brdr-actv);
          transition-delay: calc(var(--dur) /1.3);
        }
        .checkbox-wrapper-30 .checkbox input:checked + svg {
          --dashArray: 16 93;
          --dashOffset: 109;
          stroke: var(--tick);
        }
        .checkbox-wrapper-30 .checkbox svg {
          fill: none;
          left: 0;
          pointer-events: none;
          stroke: var(--tick, var(--border-active));
          stroke-dasharray: var(--dashArray, 93);
          stroke-dashoffset: var(--dashOffset, 94);
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-width: 2px;
          top: 0;
          transition: stroke-dasharray var(--dur), stroke-dashoffset var(--dur);
        }
        .checkbox-wrapper-30 .checkbox svg,
        .checkbox-wrapper-30 .checkbox input {
          display: block;
          height: 100%;
          width: 100%;
        }
      `}</style>
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
            <div className="checkbox-wrapper-30">
              <span className="checkbox">
                <input
                  type="checkbox"
                  checked={options.subjects}
                  onChange={(e) => setOptions({ ...options, subjects: e.target.checked })}
                />
                <svg>
                  <use xlinkHref="#checkbox-30"></use>
                </svg>
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" style={{display:'none'}}>
                <symbol id="checkbox-30" viewBox="0 0 22 22">
                  <path fill="none" stroke="currentColor" d="M5.5,11.3L9,14.8L20.2,3.3l0,0c-0.5-1-1.5-1.8-2.7-1.8h-13c-1.7,0-3,1.3-3,3v13c0,1.7,1.3,3,3,3h13 c1.7,0,3-1.3,3-3v-13c0-0.4-0.1-0.8-0.3-1.2"/>
                </symbol>
              </svg>
            </div>
            <span style={{ color: textColor }}>Subjects (with timing, original/edited names)</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
            <div className="checkbox-wrapper-30">
              <span className="checkbox">
                <input type="checkbox" checked={options.subjectInfo} onChange={(e) => setOptions({ ...options, subjectInfo: e.target.checked })} />
                <svg><use xlinkHref="#checkbox-30"></use></svg>
              </span>
            </div>
            <span style={{ color: textColor }}>Subject Information</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
            <div className="checkbox-wrapper-30">
              <span className="checkbox">
                <input type="checkbox" checked={options.subjectNotes} onChange={(e) => setOptions({ ...options, subjectNotes: e.target.checked })} />
                <svg><use xlinkHref="#checkbox-30"></use></svg>
              </span>
            </div>
            <span style={{ color: textColor }}>Subject Notes</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
            <div className="checkbox-wrapper-30">
              <span className="checkbox">
                <input type="checkbox" checked={options.subjectColours} onChange={(e) => setOptions({ ...options, subjectColours: e.target.checked })} />
                <svg><use xlinkHref="#checkbox-30"></use></svg>
              </span>
            </div>
            <span style={{ color: textColor }}>Subject Colours</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
            <div className="checkbox-wrapper-30">
              <span className="checkbox">
                <input type="checkbox" checked={options.subjectIcons} onChange={(e) => setOptions({ ...options, subjectIcons: e.target.checked })} />
                <svg><use xlinkHref="#checkbox-30"></use></svg>
              </span>
            </div>
            <span style={{ color: textColor }}>Subject Icons</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
            <div className="checkbox-wrapper-30">
              <span className="checkbox">
                <input type="checkbox" checked={options.name} onChange={(e) => setOptions({ ...options, name: e.target.checked })} />
                <svg><use xlinkHref="#checkbox-30"></use></svg>
              </span>
            </div>
            <span style={{ color: textColor }}>Name</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
            <div className="checkbox-wrapper-30">
              <span className="checkbox">
                <input type="checkbox" checked={options.examsBySubject} onChange={(e) => setOptions({ ...options, examsBySubject: e.target.checked })} />
                <svg><use xlinkHref="#checkbox-30"></use></svg>
              </span>
            </div>
            <span style={{ color: textColor }}>Exams & Markbook Data</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
            <div className="checkbox-wrapper-30">
              <span className="checkbox">
                <input type="checkbox" checked={options.links} onChange={(e) => setOptions({ ...options, links: e.target.checked })} />
                <svg><use xlinkHref="#checkbox-30"></use></svg>
              </span>
            </div>
            <span style={{ color: textColor }}>Custom Links</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
            <div className="checkbox-wrapper-30">
              <span className="checkbox">
                <input type="checkbox" checked={options.preferences} onChange={(e) => setOptions({ ...options, preferences: e.target.checked })} />
                <svg><use xlinkHref="#checkbox-30"></use></svg>
              </span>
            </div>
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
