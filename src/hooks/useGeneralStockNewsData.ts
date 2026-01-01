import { useState, useEffect } from 'react';
import type { NewsArticle } from '../types/news';
import { callFmpApi } from '../utils/fmpApiClient';
import logger from '../utils/logger';

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

    const fetchGeneralStockNews = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await callFmpApi({
          endpoint: '/stable/news/stock-latest',
          queryParams: { page: '0', limit: limit.toString() }
        });

        // Set articles directly
        setArticles(data as NewsArticle[]);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch general stock news');
        setError(error);
        logger.error({ error, limit, context: 'useGeneralStockNewsData' }, 'Failed to fetch general stock news');
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
