import { useState, useEffect } from 'react';
import type { NewsArticle } from '../types/news';

export interface UseGeneralStockNewsDataParams {
  limit: number;
  enabled: boolean;
}

export interface UseGeneralStockNewsDataResult {
  articles: NewsArticle[];
  loading: boolean;
  error: Error | null;
}

export function useGeneralStockNewsData({
  limit,
  enabled
}: UseGeneralStockNewsDataParams): UseGeneralStockNewsDataResult {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip if not enabled or invalid limit
    if (!enabled || limit < 1) {
      return;
    }

    const apiKey = import.meta.env.VITE_FMP_API_KEY;

    if (!apiKey) {
      setError(new Error('API key not configured'));
      return;
    }

    // Build API URL for general stock news
    const newsUrl = `https://financialmodelingprep.com/stable/news/stock-latest?page=0&limit=${limit}&apikey=${apiKey}`;

    const fetchGeneralStockNews = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(newsUrl);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        // Set articles directly
        setArticles(data as NewsArticle[]);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch general stock news');
        setError(error);
        console.error('General stock news fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGeneralStockNews();
  }, [limit, enabled]);

  return {
    articles,
    loading,
    error
  };
}
