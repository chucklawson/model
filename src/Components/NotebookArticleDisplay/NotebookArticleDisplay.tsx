import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, RefreshCw } from 'lucide-react';
import type { NewsArticle } from '../../types/news';

interface NotebookArticleDisplayProps {
  articles: NewsArticle[];
  loading: boolean;
  error: Error | null;
}

function NotebookArticleDisplay({ articles, loading, error }: NotebookArticleDisplayProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = articles.length;
  const currentArticle = totalPages > 0 ? articles[currentPage] : null;

  // Reset to first page when articles change
  useEffect(() => {
    setCurrentPage(0);
  }, [articles]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentPage > 0) {
        setCurrentPage(currentPage - 1);
      } else if (e.key === 'ArrowRight' && currentPage < totalPages - 1) {
        setCurrentPage(currentPage + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);

  const nextArticle = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevArticle = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          <RefreshCw size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-lg text-slate-600 font-semibold">Fetching news articles...</p>
          <p className="text-sm text-slate-500 mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          <p className="text-xl text-red-600 font-semibold mb-2">Error Fetching News</p>
          <p className="text-sm text-slate-600">{error.message}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && totalPages === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          <p className="text-xl text-slate-600 font-semibold mb-2">No articles found</p>
          <p className="text-sm text-slate-500">Try adjusting your date range or selecting a different ticker</p>
        </div>
      </div>
    );
  }

  // Notebook display with article
  return (
    <div className="max-w-4xl mx-auto">
      {/* Spiral Notebook Container */}
      <div
        className="relative bg-white shadow-2xl rounded-lg overflow-hidden"
        style={{
          borderLeft: '30px solid #e0e0e0',
          backgroundImage: 'linear-gradient(to bottom, #f9f9f9 1px, transparent 1px)',
          backgroundSize: '100% 30px',
        }}
      >
        {/* Spiral Holes */}
        <div className="absolute left-0 top-0 bottom-0 w-[30px] flex flex-col justify-around items-center bg-gray-200 py-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-gray-400 rounded-full shadow-inner"
              style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
            />
          ))}
        </div>

        {/* Article Content */}
        <div className="p-8 pl-12 min-h-[600px]">
          {currentArticle && (
            <>
              {/* Article Title */}
              <h2 className="text-2xl font-bold text-slate-800 mb-3 leading-tight">
                {currentArticle.title}
              </h2>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm text-slate-500 mb-4 pb-3 border-b border-slate-200">
                <span className="font-semibold">
                  {new Date(currentArticle.publishedDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                <span>•</span>
                <span>{currentArticle.site}</span>
                {currentArticle.symbol && (
                  <>
                    <span>•</span>
                    <span className="uppercase font-bold text-blue-600">{currentArticle.symbol}</span>
                  </>
                )}
              </div>

              {/* Article Image */}
              {currentArticle.image && (
                <img
                  src={currentArticle.image}
                  alt={currentArticle.title}
                  className="w-full rounded-lg mb-4 shadow-md max-h-80 object-cover"
                  onError={(e) => {
                    // Hide image if it fails to load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}

              {/* Article Text */}
              <div className="prose max-w-none">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-justify">
                  {currentArticle.text}
                </p>
              </div>

              {/* External Link */}
              <a
                href={currentArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
              >
                Read full article <ExternalLink size={16} />
              </a>
            </>
          )}
        </div>

        {/* Page Curl Effect (bottom-right corner) */}
        <div
          className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%)',
            borderBottomRightRadius: '8px'
          }}
        />

        {/* Navigation Controls */}
        <div className="flex justify-between items-center px-8 py-4 border-t bg-slate-50">
          <button
            onClick={prevArticle}
            disabled={currentPage === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <ArrowLeft size={20} /> Previous
          </button>

          <div className="text-center">
            <span className="text-slate-600 font-semibold">
              Article {currentPage + 1} of {totalPages}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Use arrow keys to navigate
            </p>
          </div>

          <button
            onClick={nextArticle}
            disabled={currentPage === totalPages - 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            Next <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotebookArticleDisplay;
