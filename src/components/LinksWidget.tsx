import * as React from 'react';
import {
  ExternalLink, Pencil, Plus, Trash2,
  BookOpen, Clock, FileText, User, Printer, Calendar, Folder, CreditCard, Newspaper,
  Globe, Link as LinkIcon, Home, School, Laptop, Smartphone, X
} from 'lucide-react';

interface LinkItem {
  id: string;
  name: string;
  url: string;
  subtitle: string;
  icon: string;
}

interface LinksWidgetProps {
  effectiveMode: 'light' | 'dark';
  colors: any;
}

export default function LinksWidget({ effectiveMode, colors }: LinksWidgetProps): React.ReactElement {
  // Default links as shown in the image
  const [links, setLinks] = React.useState<LinkItem[]>(() => {
    const saved = localStorage.getItem('quickLinks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fall back to defaults if parsing fails
      }
    }
    return [
      {
        id: '1',
        name: 'Moodle',
        url: 'https://web1.baulkham-h.schools.nsw.edu.au/',
        subtitle: 'web1.baulkham-h.schools.nsw.edu.au',
        icon: 'Folder'
      },
      {
        id: '2',
        name: 'Calendar',
        url: 'https://baulkham-h.sentral.com.au',
        subtitle: 'baulkham-h.sentral.com.au',
        icon: 'Clock'
      },
      {
        id: '3',
        name: 'Newsletter',
        url: 'https://baulkham-h.schools.nsw.gov.au',
        subtitle: 'baulkham-h.schools.nsw.gov.au',
        icon: 'Newspaper'
      },
      {
        id: '4',
        name: 'Sentral',
        url: 'https://baulkham-h.sentral.com.au/auth/portal?action=login_student',
        subtitle: 'baulkham-h.sentral.com.au',
        icon: 'CreditCard'
      },
      {
        id: '5',
        name: 'Printing',
        url: 'http://10.209.96.176',
        subtitle: '10.209.96.176',
        icon: 'Printer'
      }
    ];
  });

  const [isEditing, setIsEditing] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [editingLink, setEditingLink] = React.useState<LinkItem | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editUrl, setEditUrl] = React.useState('');
  const [editSubtitle, setEditSubtitle] = React.useState('');
  const [editIcon, setEditIcon] = React.useState('ExternalLink');

  // Known icon names supported by this widget's renderIcon
  const knownIcons = React.useMemo(() => new Set<string>([
    'BookOpen','Clock','FileText','User','Printer','Calendar','Folder','CreditCard','Newspaper',
    'Globe','Link','Home','School','Laptop','Smartphone','ExternalLink'
  ]), []);

  // Helper function to render icon (prioritize lucide icons over emojis)
  const renderIcon = (iconName: string, size = 32) => {
    // Check for lucide icons first
    const iconProps = { 
      size, 
      className: `${effectiveMode === 'light' ? 'text-gray-600' : 'text-gray-400'} opacity-90` 
    };
    
    switch (iconName) {
      case 'BookOpen': return <BookOpen {...iconProps} />;
      case 'Clock': return <Clock {...iconProps} />;
      case 'FileText': return <FileText {...iconProps} />;
      case 'User': return <User {...iconProps} />;
      case 'Printer': return <Printer {...iconProps} />;
      case 'Calendar': return <Calendar {...iconProps} />;
      case 'Folder': return <Folder {...iconProps} />;
      case 'CreditCard': return <CreditCard {...iconProps} />;
      case 'Newspaper': return <Newspaper {...iconProps} />;
      case 'Globe': return <Globe {...iconProps} />;
      case 'Link': return <LinkIcon {...iconProps} />;
      case 'Home': return <Home {...iconProps} />;
      case 'School': return <School {...iconProps} />;
      case 'Laptop': return <Laptop {...iconProps} />;
      case 'Smartphone': return <Smartphone {...iconProps} />;
      case 'ExternalLink': return <ExternalLink {...iconProps} />;
      default: 
        // Always default to ExternalLink for unknown values
        return <ExternalLink {...iconProps} />;
    }
  };

  // Suggest a sensible default icon based on the link name/url (used to migrate old saved links)
  const suggestIconForLink = (link: LinkItem): string => {
    const name = (link.name || '').toLowerCase();
    let host = '';
    try {
      const u = link.url?.startsWith('http') ? link.url : `https://${link.url}`;
      host = new URL(u).hostname.toLowerCase();
    } catch {}
    if (name.includes('moodle') || host.includes('moodle')) return 'Folder';
    if (name.includes('calendar') || host.includes('sentral') || host.includes('calendar')) return 'Clock';
    if (name.includes('news')) return 'Newspaper';
    if (name.includes('sentral') || name.includes('portal')) return 'CreditCard';
    if (name.includes('print')) return 'Printer';
    if (name.includes('school')) return 'School';
    if (name.includes('home')) return 'Home';
    if (name.includes('profile') || name.includes('account')) return 'User';
    if (host.includes('google') || host.includes('bing')) return 'Globe';
    return 'ExternalLink';
  };

  // One-time migration to set better icons for existing saved links that default to ExternalLink
  const migratedRef = React.useRef(false);
  React.useEffect(() => {
    if (migratedRef.current) return;
    migratedRef.current = true;
    try {
      const updated = links.map(l => {
        if (!l.icon || l.icon === 'ExternalLink' || (l.icon && !knownIcons.has(l.icon))) {
          return { ...l, icon: suggestIconForLink(l) };
        }
        return l;
      });
      const changed = updated.some((l, i) => l.icon !== links[i].icon);
      if (changed) setLinks(updated);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save links to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('quickLinks', JSON.stringify(links));
  }, [links]);

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const addLink = () => {
    const newLink: LinkItem = {
      id: Date.now().toString(),
      name: '',
      url: '',
      subtitle: '',
      icon: 'ExternalLink'
    };
    setEditingLink(newLink);
    setEditName('');
    setEditUrl('');
    setEditSubtitle('');
    setEditIcon('ExternalLink');
    setIsEditing(true);
  };

  const editLink = (link: LinkItem) => {
    setEditingLink(link);
    setEditName(link.name);
    setEditUrl(link.url);
    setEditSubtitle(link.subtitle);
    setEditIcon(link.icon);
    setIsEditing(true);
  };

  const saveLink = () => {
    if (!editName.trim() || !editUrl.trim() || !editingLink) return;
    
    if (links.find(l => l.id === editingLink.id)) {
      // Update existing link
      setLinks(links.map(l => 
        l.id === editingLink.id 
          ? { 
              ...l, 
              name: editName.trim(), 
              url: editUrl.trim(),
              subtitle: editSubtitle.trim(),
              icon: editIcon
            }
          : l
      ));
    } else {
      // Add new link
      setLinks([...links, { 
        ...editingLink, 
        name: editName.trim(), 
        url: editUrl.trim(),
        subtitle: editSubtitle.trim(),
        icon: editIcon
      }]);
    }
    
    cancelEdit();
  };

  const deleteLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id));
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingLink(null);
    setEditName('');
    setEditUrl('');
    setEditSubtitle('');
    setEditIcon('ExternalLink');
  };

  const openLink = (url: string) => {
    // Ensure URL has protocol
    const finalUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`${colors.container} rounded-lg ${colors.border} border p-6 mb-4 flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-semibold ${colors.text}`}>Links</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleEditMode}
            className={`px-3 py-1 text-sm rounded ${effectiveMode === 'light' ? 'text-blue-600 hover:bg-blue-50' : 'text-blue-400 hover:bg-blue-900/20'} transition-colors`}
          >
            {editMode ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Add Link Button */}
      <div className="mb-4">
        <button
          onClick={addLink}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} font-medium transition-colors`}
        >
          <Plus size={16} />
          Add Link
        </button>
      </div>

      {/* Links Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {links.map((link) => (
          <div
            key={link.id}
            onClick={() => !editMode && openLink(link.url)}
            className={`relative p-6 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-lg ${colors.border} border-2 hover:opacity-80 group`}
          >
            {/* Edit mode controls */}
            {editMode && (
              <>
                {/* Edit button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    editLink(link);
                  }}
                  className={`absolute top-3 right-3 p-1 rounded ${effectiveMode === 'light' ? 'text-gray-600 hover:text-gray-800 hover:bg-white/80' : 'text-gray-300 hover:text-white hover:bg-gray-600/80'} transition-all`}
                  title="Edit Link"
                >
                  <Pencil size={16} />
                </button>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this link?')) {
                      deleteLink(link.id);
                    }
                  }}
                  className={`absolute top-3 left-3 p-1 rounded ${effectiveMode === 'light' ? 'text-red-600 hover:text-red-800 hover:bg-white/80' : 'text-red-400 hover:text-red-200 hover:bg-gray-600/80'} transition-all`}
                  title="Delete Link"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}

            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className={`text-2xl font-semibold ${colors.text} mb-2 truncate`}>
                  {link.name}
                </h3>
                <p className={`text-sm ${effectiveMode === 'light' ? 'text-gray-500' : 'text-gray-400'} truncate`}>
                  {link.subtitle}
                </p>
              </div>
              
              <div className="ml-4 flex-shrink-0">
                {renderIcon(link.icon, 40)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {links.length === 0 && !isEditing && (
        <div className="text-center py-12">
          <ExternalLink size={48} className={`mx-auto mb-4 ${effectiveMode === 'light' ? 'text-gray-400' : 'text-gray-600'}`} />
          <p className={`text-lg ${colors.containerText} opacity-70 mb-2`}>No links added yet</p>
          <button
            onClick={addLink}
            className={`px-4 py-2 rounded-lg ${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} font-medium transition-colors`}
          >
            Add Your First Link
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className={`${colors.container} rounded-lg ${colors.border} border p-6 w-full max-w-md`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${colors.text}`}>
                {editingLink && links.find(l => l.id === editingLink.id) ? 'Edit Link' : 'Add Link'}
              </h3>
              <button
                onClick={cancelEdit}
                className={`${colors.text} opacity-70 hover:opacity-100 transition`}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${colors.text} mb-1`}>Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`w-full px-3 py-2 rounded border ${colors.border} focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.container} ${colors.text}`}
                  placeholder="Link name"
                  autoFocus
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${colors.text} mb-1`}>Subtitle</label>
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className={`w-full px-3 py-2 rounded border ${colors.border} focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.container} ${colors.text}`}
                  placeholder="example.com"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${colors.text} mb-1`}>URL</label>
                <input
                  type="url"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className={`w-full px-3 py-2 rounded border ${colors.border} focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.container} ${colors.text}`}
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${colors.text} mb-1`}>Icon</label>
                {/* Icon grid selector (similar to SubjectEditModal) */}
                {(() => {
                  const iconOptions = [
                    { name: 'ExternalLink', component: ExternalLink, label: 'External' },
                    { name: 'Folder', component: Folder, label: 'Folder' },
                    { name: 'Clock', component: Clock, label: 'Clock' },
                    { name: 'Calendar', component: Calendar, label: 'Calendar' },
                    { name: 'Newspaper', component: Newspaper, label: 'News' },
                    { name: 'CreditCard', component: CreditCard, label: 'ID Card' },
                    { name: 'Printer', component: Printer, label: 'Printer' },
                    { name: 'BookOpen', component: BookOpen, label: 'Book' },
                    { name: 'FileText', component: FileText, label: 'Document' },
                    { name: 'User', component: User, label: 'User' },
                    { name: 'Globe', component: Globe, label: 'Web' },
                    { name: 'Link', component: LinkIcon, label: 'Link' },
                    { name: 'Home', component: Home, label: 'Home' },
                    { name: 'School', component: School, label: 'School' },
                    { name: 'Laptop', component: Laptop, label: 'Laptop' },
                    { name: 'Smartphone', component: Smartphone, label: 'Phone' },
                  ];
                  return (
                    <>
                      <div className="grid grid-cols-6 gap-2 mb-2">
                        {iconOptions.map((opt) => {
                          const IconComp = opt.component;
                          return (
                            <button
                              key={opt.name}
                              type="button"
                              onClick={() => setEditIcon(opt.name)}
                              title={opt.label}
                              className={`w-10 h-10 rounded-lg border-2 ${editIcon === opt.name ? 'border-blue-400 bg-blue-500/20' : 'border-gray-600 hover:border-gray-500'} flex items-center justify-center transition-all duration-200`}
                            >
                              <IconComp size={18} className={effectiveMode === 'light' ? 'text-black' : 'text-white'} />
                            </button>
                          );
                        })}
                      </div>
                      {editIcon && (
                        <div className={`text-xs ${colors.text} opacity-70`}>Selected: {editIcon}</div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={cancelEdit}
                className={`px-4 py-2 rounded border ${colors.border} ${colors.text} hover:bg-opacity-10 ${effectiveMode === 'light' ? 'hover:bg-gray-200' : 'hover:bg-gray-700'} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={saveLink}
                disabled={!editName.trim() || !editUrl.trim()}
                className={`px-4 py-2 rounded ${colors.buttonAccent} ${colors.buttonAccentHover} ${colors.buttonText} font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
