import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Newspaper, X } from 'lucide-react';
import { useGeneralStockNewsData } from '../../hooks/useGeneralStockNewsData';
import type { NewsArticle } from '../../types/news';

interface GeneralStockNewsModalProps {
  onClose: () => void;
  onFetchComplete: (articles: NewsArticle[]) => void;
}

export default function GeneralStockNewsModal({ onClose, onFetchComplete }: GeneralStockNewsModalProps) {
  const [articleLimit, setArticleLimit] = useState(15);
  const [fetchEnabled, setFetchEnabled] = useState(false);

  // Use the custom hook for fetching general stock news
  const { articles, loading, error } = useGeneralStockNewsData({
    limit: articleLimit,
    enabled: fetchEnabled
  });

  // When articles are successfully fetched, pass to parent and close
  useEffect(() => {
    if (articles.length > 0 && !loading && !error) {
      onFetchComplete(articles);
      onClose();
    }
  }, [articles, loading, error, onFetchComplete, onClose]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (articleLimit < 1 || articleLimit > 20) {
      return;
    }

    // Trigger the API fetch
    setFetchEnabled(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Newspaper size={28} />
              General Stock News
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-green-100 text-sm mt-2">Get the latest stock market news articles</p>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Number of Articles
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={articleLimit}
                onChange={(e) => setArticleLimit(parseInt(e.target.value) || 15)}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-green-500 text-lg"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-1">Enter a number between 1 and 20</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 mb-4">
                Error: {error.message}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={articleLimit < 1 || articleLimit > 20 || loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-bold hover:from-green-700 hover:to-teal-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Newspaper size={20} />
                {loading ? 'Fetching...' : 'Fetch News'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
