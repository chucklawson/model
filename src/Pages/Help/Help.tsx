/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import HelpSidebar from './HelpSidebar';
import MarkdownRenderer from './MarkdownRenderer';

// Import markdown files as raw text
import overviewMd from '../../../docs/README.md?raw';
import quickStartMd from '../../../docs/getting-started/quick-start-guide.md?raw';
import apiSetupMd from '../../../docs/guides/api-setup.md?raw';
import csvImportMd from '../../../docs/guides/csv-import.md?raw';
import portfolioManagementMd from '../../../docs/features/portfolio-management.md?raw';

export default function Help() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  // Get section from URL params, default to 'overview'
  const section = searchParams.get('section') || 'overview';

  // Map of section IDs to markdown content
  const markdownContent: Record<string, string> = {
    'overview': overviewMd,
    'getting-started/quick-start-guide': quickStartMd,
    'getting-started/first-time-setup': '# First-Time Setup\n\nContent coming soon...',
    'getting-started/installation': '# Installation\n\nContent coming soon...',
    'features/portfolio-management': portfolioManagementMd,
    'features/research-tools': '# Research Tools\n\nContent coming soon...',
    'features/calculators': '# Calculators\n\nContent coming soon...',
    'features/key-metrics': '# Key Metrics\n\nContent coming soon...',
    'features/flexible-portfolio': '# Portfolio Visualization\n\nContent coming soon...',
    'features/historical-dividends': '# Historical Dividends\n\nContent coming soon...',
    'guides/api-setup': apiSetupMd,
    'guides/csv-import': csvImportMd,
    'guides/portfolio-management': '# Portfolio Organization\n\nContent coming soon...',
    'guides/export-data': '# Export Data\n\nContent coming soon...',
    'reference/csv-format': '# CSV Format Specification\n\nContent coming soon...',
    'reference/troubleshooting': '# Troubleshooting\n\nContent coming soon...',
    'reference/keyboard-shortcuts': '# Keyboard Shortcuts\n\nContent coming soon...',
  };

  useEffect(() => {
    const loadContent = () => {
      setLoading(true);

      // Get markdown content for the current section
      const markdown = markdownContent[section] || `# Page Not Found\n\nThe documentation page "${section}" could not be found.`;

      setContent(markdown);
      setLoading(false);

      // Scroll to top when section changes
      window.scrollTo(0, 0);
    };

    loadContent();
  }, [section]);

  const handleSectionChange = (newSection: string) => {
    setSearchParams({ section: newSection });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Help & Documentation
          </h1>
          <p className="text-slate-300">
            Comprehensive guide to using Investment Portfolio Manager
          </p>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-3">
            <HelpSidebar
              activeSection={section}
              onSectionChange={handleSectionChange}
            />
          </div>

          {/* Content */}
          <div className="col-span-12 lg:col-span-9">
            {loading ? (
              <div className="bg-white rounded-2xl shadow-2xl p-8 min-h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading documentation...</p>
                </div>
              </div>
            ) : (
              <MarkdownRenderer content={content} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-400 text-sm">
          <p>
            Need more help? Check the{' '}
            <button
              onClick={() => handleSectionChange('reference/troubleshooting')}
              className="text-purple-400 hover:text-purple-300 underline"
            >
              Troubleshooting Guide
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
