import { useState, useEffect } from 'react';
import { Search, Newspaper, TrendingUp, BarChart3, LineChart } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useGeneralNewsData } from '../../hooks/useGeneralNewsData';
import { useGeneralStockNewsData } from '../../hooks/useGeneralStockNewsData';
import NotebookArticleDisplay from '../../Components/NotebookArticleDisplay/NotebookArticleDisplay';
import TickerNewsModal from '../../Components/TickerNewsModal/TickerNewsModal';
import TreasuryYieldsModal from '../../Components/TreasuryYieldsModal/TreasuryYieldsModal';
import type { NewsArticle } from '../../types/news';

function Research() {
  const [tickerList, setTickerList] = useState<string[]>([]);
  const [showTickerModal, setShowTickerModal] = useState(false);
  const [showTreasuryModal, setShowTreasuryModal] = useState(false);
  const [generalStockLimit, setGeneralStockLimit] = useState(15);
  const [fetchGeneralStock, setFetchGeneralStock] = useState(false);
  const [generalNewsLimit, setGeneralNewsLimit] = useState(15);
  const [fetchGeneralNews, setFetchGeneralNews] = useState(false);
  const [displayedArticles, setDisplayedArticles] = useState<NewsArticle[]>([]);
  const [loadingSource, setLoadingSource] = useState<'stock' | 'market' | null>(null);

  useEffect(() => {
    document.title = "News";
  }, []);

  // Load tickers from database
  useEffect(() => {
    const loadTickers = async () => {
      const client = generateClient<Schema>();
      let allData: Array<{ symbol?: string | null }> = [];
      let nextToken: string | null | undefined = undefined;

      try {
        do {
          const response = await client.models.TickerLot.list({
            limit: 1000,
            nextToken: nextToken || undefined,
          });
          allData = [...allData, ...response.data];
          nextToken = response.nextToken;
        } while (nextToken);

        // Extract unique ticker symbols and sort
        const uniqueTickers = Array.from(
          new Set(allData.map(lot => lot.ticker))
        ).sort();

        setTickerList(uniqueTickers);
      } catch (error) {
        console.error('Failed to load tickers:', error);
      }
    };

    loadTickers();
  }, []);

  // Use the custom hook for fetching general stock news
  const { articles: generalStockArticles, loading: generalStockLoading, error: generalStockError } = useGeneralStockNewsData({
    limit: generalStockLimit,
    enabled: fetchGeneralStock
  });

  // Use the custom hook for fetching general market news
  const { articles: generalArticles, loading: generalLoading, error: generalError } = useGeneralNewsData({
    limit: generalNewsLimit,
    enabled: fetchGeneralNews
  });

  // When general stock articles are fetched
  useEffect(() => {
    if (generalStockArticles.length > 0 && !generalStockLoading) {
      setDisplayedArticles(generalStockArticles);
      setLoadingSource(null);
      setFetchGeneralStock(false);
    }
  }, [generalStockArticles, generalStockLoading]);

  // When general market articles are fetched
  useEffect(() => {
    if (generalArticles.length > 0 && !generalLoading) {
      setDisplayedArticles(generalArticles);
      setLoadingSource(null);
      setFetchGeneralNews(false);
    }
  }, [generalArticles, generalLoading]);

  const handleFetchGeneralStock = () => {
    setDisplayedArticles([]);
    setLoadingSource('stock');
    setFetchGeneralStock(true);
  };

  const handleFetchGeneralNews = () => {
    setDisplayedArticles([]);
    setLoadingSource('market');
    setFetchGeneralNews(true);
  };

  const handleTickerNewsComplete = (articles: NewsArticle[]) => {
    setDisplayedArticles(articles);
    setLoadingSource(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Stock News Research</h1>
        <p className="text-slate-300">Choose your news source below</p>
      </div>

      {/* Four Cards: Stock-Specific, General Stock News, General Market News, and Treasury Yields */}
      <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Card 1: Stock-Specific News */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-slate-200">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <TrendingUp size={28} className="text-blue-600" />
              Stock-Specific News
            </h2>
            <p className="text-slate-600 text-sm">Search news articles for a specific ticker and date range</p>
          </div>

          <button
            onClick={() => setShowTickerModal(true)}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <Search size={24} />
            Search Stock News
          </button>
        </div>

        {/* Card 2: General Stock News */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-slate-200">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <BarChart3 size={28} className="text-green-600" />
              General Stock News
            </h2>
            <p className="text-slate-600 text-sm">Get the latest stock market news articles</p>
          </div>

          <div className="flex items-end gap-3">
            <div className="w-32">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Articles
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={generalStockLimit}
                onChange={(e) => setGeneralStockLimit(parseInt(e.target.value) || 15)}
                className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-green-500 text-lg"
              />
            </div>

            <button
              onClick={handleFetchGeneralStock}
              disabled={generalStockLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-bold hover:from-green-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <BarChart3 size={24} />
              {generalStockLoading ? 'Fetching News...' : 'Get Stock News'}
            </button>
          </div>
        </div>

        {/* Card 3: General Market News */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-slate-200">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Newspaper size={28} className="text-amber-600" />
              General Market News
            </h2>
            <p className="text-slate-600 text-sm">Get the latest market news across all sectors</p>
          </div>

          <div className="flex items-end gap-3">
            <div className="w-32">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Articles
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={generalNewsLimit}
                onChange={(e) => setGeneralNewsLimit(parseInt(e.target.value) || 15)}
                className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-amber-500 text-lg"
              />
            </div>

            <button
              onClick={handleFetchGeneralNews}
              disabled={generalLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-bold hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Newspaper size={24} />
              {generalLoading ? 'Fetching News...' : 'Get Latest News'}
            </button>
          </div>
        </div>

        {/* Card 4: Treasury Yields */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-slate-200">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <LineChart size={28} className="text-purple-600" />
              Treasury Yields
            </h2>
            <p className="text-slate-600 text-sm">Compare treasury yield curves across different time periods</p>
          </div>

          <button
            onClick={() => setShowTreasuryModal(true)}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <LineChart size={24} />
            View Treasury Yields
          </button>
        </div>
      </div>

      {/* Notebook Display */}
      <NotebookArticleDisplay
        articles={displayedArticles}
        loading={loadingSource === 'stock' ? generalStockLoading : loadingSource === 'market' ? generalLoading : false}
        error={loadingSource === 'stock' ? generalStockError : loadingSource === 'market' ? generalError : null}
      />

      {/* Ticker News Modal */}
      {showTickerModal && (
        <TickerNewsModal
          onClose={() => setShowTickerModal(false)}
          onFetchComplete={handleTickerNewsComplete}
          tickerList={tickerList}
        />
      )}

      {/* Treasury Yields Modal */}
      {showTreasuryModal && (
        <TreasuryYieldsModal
          onClose={() => setShowTreasuryModal(false)}
        />
      )}
    </div>
  );
}

export default Research;
