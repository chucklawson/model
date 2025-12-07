export interface NewsArticle {
  symbol?: string;  // Optional for general news
  publishedDate: string;
  title: string;
  image: string;
  site: string;
  text: string;
  url: string;
}

export interface UseNewsDataParams {
  symbol: string;
  startDate: string;
  endDate: string;
  enabled: boolean;
}

export interface UseNewsDataResult {
  articles: NewsArticle[];
  loading: boolean;
  error: Error | null;
}
