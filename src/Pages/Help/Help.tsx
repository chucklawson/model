/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import HelpSidebar from './HelpSidebar';
import MarkdownRenderer from './MarkdownRenderer';

// Import markdown files as raw text
import overviewMd from '../../../docs/README.md?raw';
import quickStartMd from '../../../docs/getting-started/quick-start-guide.md?raw';
import firstTimeSetupMd from '../../../docs/getting-started/first-time-setup.md?raw';
import portfolioManagementMd from '../../../docs/features/portfolio-management.md?raw';
import researchToolsMd from '../../../docs/features/research-tools.md?raw';
import calculatorsMd from '../../../docs/features/calculators.md?raw';
import keyMetricsMd from '../../../docs/features/key-metrics.md?raw';
import flexiblePortfolioMd from '../../../docs/features/flexible-portfolio.md?raw';
import historicalDividendsMd from '../../../docs/features/historical-dividends.md?raw';
import apiSetupMd from '../../../docs/guides/api-setup.md?raw';
import csvImportMd from '../../../docs/guides/csv-import.md?raw';
import portfolioOrganizationMd from '../../../docs/guides/portfolio-management.md?raw';
import exportDataMd from '../../../docs/guides/export-data.md?raw';
import csvFormatMd from '../../../docs/reference/csv-format.md?raw';
import troubleshootingMd from '../../../docs/reference/troubleshooting.md?raw';
import keyboardShortcutsMd from '../../../docs/reference/keyboard-shortcuts.md?raw';

export default function Help() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Get section from URL params, default to 'overview'
  const section = searchParams.get('section') || 'overview';

  // Map of section IDs to markdown content
  const markdownContent: Record<string, string> = {
    'overview': overviewMd,
    'getting-started/quick-start-guide': quickStartMd,
    'getting-started/first-time-setup': firstTimeSetupMd,
    'features/portfolio-management': portfolioManagementMd,
    'features/research-tools': researchToolsMd,
    'features/calculators': calculatorsMd,
    'features/key-metrics': keyMetricsMd,
    'features/flexible-portfolio': flexiblePortfolioMd,
    'features/historical-dividends': historicalDividendsMd,
    'guides/api-setup': apiSetupMd,
    'guides/csv-import': csvImportMd,
    'guides/portfolio-management': portfolioOrganizationMd,
    'guides/export-data': exportDataMd,
    'reference/csv-format': csvFormatMd,
    'reference/troubleshooting': troubleshootingMd,
    'reference/keyboard-shortcuts': keyboardShortcutsMd,
  };

  useEffect(() => {
    const loadContent = () => {
      setLoading(true);
      const markdown = markdownContent[section] || `# Page Not Found\n\nThe documentation page "${section}" could not be found.`;
      setContent(markdown);
      setLoading(false);
      window.scrollTo(0, 0);
    };
    loadContent();
  }, [section]);

  // Reset match navigation whenever the page or search term changes
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [content, searchTerm]);

  const handleSectionChange = (newSection: string) => {
    setSearchParams({ section: newSection });
  };

  const handlePrev = () => {
    if (matchCount === 0) return;
    setCurrentMatchIndex(i => (i - 1 + matchCount) % matchCount);
  };

  const handleNext = () => {
    if (matchCount === 0) return;
    setCurrentMatchIndex(i => (i + 1) % matchCount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
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
              searchTerm={searchTerm}
              matchCount={matchCount}
              currentMatchIndex={currentMatchIndex}
              onSearchChange={term => { setSearchTerm(term); setCurrentMatchIndex(0); }}
              onPrev={handlePrev}
              onNext={handleNext}
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
              <MarkdownRenderer
                content={content}
                searchTerm={searchTerm}
                currentMatchIndex={currentMatchIndex}
                onMatchCount={setMatchCount}
              />
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
