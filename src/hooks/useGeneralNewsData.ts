import { useState, useEffect } from 'react';
import type { NewsArticle } from '../types/news';
import { callFmpApi } from '../utils/fmpApiClient';

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

    const fetchGeneralNews = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await callFmpApi({
          endpoint: '/stable/news/general-latest',
          queryParams: { page: '0', limit: limit.toString() }
        });

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
