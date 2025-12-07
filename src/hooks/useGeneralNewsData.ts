import { useState, useEffect } from 'react';
import type { NewsArticle } from '../types/news';

export interface UseGeneralNewsDataParams {
  limit: number;
  enabled: boolean;
}

export interface UseGeneralNewsDataResult {
  articles: NewsArticle[];
  loading: boolean;
  error: Error | null;
}

export function useGeneralNewsData({
  limit,
  enabled
}: UseGeneralNewsDataParams): UseGeneralNewsDataResult {
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

    // Build API URL for general news
    const newsUrl = `https://financialmodelingprep.com/stable/news/general-latest?page=0&limit=${limit}&apikey=${apiKey}`;

    const fetchGeneralNews = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(newsUrl);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        // Set articles directly (no date filtering for general news)
        setArticles(data as NewsArticle[]);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch general news');
        setError(error);
        console.error('General news fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGeneralNews();
  }, [limit, enabled]);

  return {
    articles,
    loading,
    error
  };
}
