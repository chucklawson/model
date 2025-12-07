import { useState, useEffect } from 'react';
import type { NewsArticle, UseNewsDataParams, UseNewsDataResult } from '../types/news';

export function useNewsData({
  symbol,
  startDate,
  endDate,
  enabled
}: UseNewsDataParams): UseNewsDataResult {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip if not enabled or required params are missing
    if (!enabled || symbol.length < 1 || !startDate || !endDate) {
      return;
    }

    const apiKey = import.meta.env.VITE_FMP_API_KEY;

    if (!apiKey) {
      setError(new Error('API key not configured'));
      return;
    }

    // Build API URL
    const newsUrl = `https://financialmodelingprep.com/stable/news/stock?symbols=${symbol}&apikey=${apiKey}`;

    const fetchNewsData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(newsUrl);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        // Filter articles by date range
        const filteredArticles = (data as NewsArticle[]).filter(article => {
          const articleDate = new Date(article.publishedDate);
          const start = new Date(startDate);
          const end = new Date(endDate);

          // Set end date to end of day for inclusive range
          end.setHours(23, 59, 59, 999);

          return articleDate >= start && articleDate <= end;
        });

        setArticles(filteredArticles);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch news data');
        setError(error);
        console.error('News data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewsData();
  }, [symbol, startDate, endDate, enabled]);

  return {
    articles,
    loading,
    error
  };
}
