import { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Lightbulb, Map, FileText } from 'lucide-react';

interface HelpSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

interface SectionGroup {
  title: string;
  icon: React.ReactNode;
  sections: {
    id: string;
    label: string;
  }[];
}

export default function HelpSidebar({ activeSection, onSectionChange }: HelpSidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['getting-started', 'features', 'guides', 'reference'])
  );

  const sectionGroups: SectionGroup[] = [
    {
      title: 'Getting Started',
      icon: <BookOpen className="w-5 h-5" />,
      sections: [
        { id: 'overview', label: 'Overview' },
        { id: 'getting-started/quick-start-guide', label: 'Quick Start Guide' },
        { id: 'getting-started/first-time-setup', label: 'First-Time Setup' },
      ],
    },
    {
      title: 'Features',
      icon: <Lightbulb className="w-5 h-5" />,
      sections: [
        { id: 'features/portfolio-management', label: 'Portfolio Management' },
        { id: 'features/research-tools', label: 'Research Tools' },
        { id: 'features/calculators', label: 'Calculators' },
        { id: 'features/key-metrics', label: 'Key Metrics' },
        { id: 'features/flexible-portfolio', label: 'Portfolio Visualization' },
        { id: 'features/historical-dividends', label: 'Historical Dividends' },
      ],
    },
    {
      title: 'Guides',
      icon: <Map className="w-5 h-5" />,
      sections: [
        { id: 'guides/api-setup', label: 'API Setup' },
        { id: 'guides/csv-import', label: 'CSV Import' },
        { id: 'guides/portfolio-management', label: 'Portfolio Organization' },
        { id: 'guides/export-data', label: 'Export Data' },
      ],
    },
    {
      title: 'Reference',
      icon: <FileText className="w-5 h-5" />,
      sections: [
        { id: 'reference/csv-format', label: 'CSV Format' },
        { id: 'reference/troubleshooting', label: 'Troubleshooting' },
        { id: 'reference/keyboard-shortcuts', label: 'Keyboard Shortcuts' },
      ],
    },
  ];

  const toggleGroup = (groupTitle: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupTitle)) {
      newExpanded.delete(groupTitle);
    } else {
      newExpanded.add(groupTitle);
    }
    setExpandedGroups(newExpanded);
  };

  const groupTitleToId = (title: string) => title.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-4 sticky top-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
        Documentation
      </h2>

      <nav>
        {sectionGroups.map((group) => {
          const groupId = groupTitleToId(group.title);
          const isExpanded = expandedGroups.has(groupId);

          return (
            <div key={groupId} className="mb-4">
              <button
                onClick={() => toggleGroup(groupId)}
                className="flex items-center justify-between w-full px-3 py-2 text-left font-semibold text-slate-700 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  {group.icon}
                  <span>{group.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-2 ml-4 space-y-1">
                  {group.sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => onSectionChange(section.id)}
                      className={`block w-full text-left px-4 py-2 rounded-lg transition-colors text-sm ${
                        activeSection === section.id
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium shadow-md'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
