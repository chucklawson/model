/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
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

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) { handlePrev(); } else { handleNext(); }
    } else if (e.key === 'Escape') {
      setSearchTerm('');
    }
  };

  const hasSearch = searchTerm.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            Help & Documentation
          </h1>
          <p className="text-slate-300 mb-4">
            Comprehensive guide to using Investment Portfolio Manager
          </p>

          {/* Search bar */}
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2 max-w-xl">
            <Search className="text-slate-400 flex-shrink-0" size={16} />
            <input
              type="text"
              placeholder="Search this page… (Enter = next, Shift+Enter = prev)"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none text-sm min-w-0"
            />
            {hasSearch && (
              <>
                {matchCount > 0 ? (
                  <span className="text-slate-300 text-xs whitespace-nowrap">
                    {currentMatchIndex + 1} of {matchCount}
                  </span>
                ) : (
                  <span className="text-red-400 text-xs whitespace-nowrap">No matches</span>
                )}
                {matchCount > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      title="Previous match (Shift+Enter)"
                      className="text-slate-300 hover:text-white p-0.5 rounded"
                    >
                      <ChevronUp size={15} />
                    </button>
                    <button
                      onClick={handleNext}
                      title="Next match (Enter)"
                      className="text-slate-300 hover:text-white p-0.5 rounded"
                    >
                      <ChevronDown size={15} />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                  className="text-slate-400 hover:text-white p-0.5 rounded"
                >
                  <X size={14} />
                </button>
              </>
            )}
          </div>
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
