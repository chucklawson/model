// ============================================
// FILE: src/utils/localStorage.ts
// ============================================

/**
 * Storage keys for localStorage
 */
export const STORAGE_KEYS = {
  TICKER_COLUMNS: 'tickers.columns',
  TICKER_PORTFOLIO_FILTER: 'tickers.portfolioFilter',
} as const;

/**
 * Storage versions for schema migration
 */
export const STORAGE_VERSIONS = {
  TICKER_COLUMNS: 1,
  TICKER_PORTFOLIO_FILTER: 1,
} as const;

/**
 * Wrapper interface for versioned localStorage data
 */
interface StorageData<T> {
  version: number;
  data: T;
}

/**
 * Load data from localStorage with version checking
 *
 * @param key - Storage key (without version suffix)
 * @param version - Expected version number
 * @param fallback - Default value to return if load fails
 * @returns Loaded data or fallback value
 */
export function loadFromLocalStorage<T>(
  key: string,
  version: number,
  fallback: T
): T {
  try {
    const fullKey = `${key}.v${version}`;
    const item = localStorage.getItem(fullKey);

    if (!item) {
      return fallback;
    }

    const parsed: StorageData<T> = JSON.parse(item);

    // Version mismatch - return fallback
    if (parsed.version !== version) {
      console.warn(`localStorage version mismatch for ${key}: expected ${version}, got ${parsed.version}`);
      return fallback;
    }

    return parsed.data;
  } catch (error) {
    console.error(`Failed to load from localStorage (${key}):`, error);
    return fallback;
  }
}

/**
 * Save data to localStorage with version wrapping
 *
 * @param key - Storage key (without version suffix)
 * @param version - Version number for the data
 * @param data - Data to save
 * @returns True if save succeeded, false otherwise
 */
export function saveToLocalStorage<T>(
  key: string,
  version: number,
  data: T
): boolean {
  try {
    const fullKey = `${key}.v${version}`;
    const wrapped: StorageData<T> = {
      version,
      data,
    };

    localStorage.setItem(fullKey, JSON.stringify(wrapped));
    return true;
  } catch (error) {
    console.error(`Failed to save to localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Remove data from localStorage
 *
 * @param key - Storage key (with or without version suffix)
 * @returns True if removal succeeded, false otherwise
 */
export function removeFromLocalStorage(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove from localStorage (${key}):`, error);
    return false;
  }
}
