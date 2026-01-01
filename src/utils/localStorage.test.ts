import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadFromLocalStorage,
  saveToLocalStorage,
  removeFromLocalStorage,
  STORAGE_KEYS,
  STORAGE_VERSIONS,
} from './localStorage';
import logger from './logger';

describe('localStorage', () => {
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    // Create a mock localStorage
    mockLocalStorage = {};

    // Mock localStorage methods
    global.localStorage = {
      getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
      length: 0,
      key: vi.fn(),
    } as Storage;

    // Spy on logger methods without mocking implementation
    vi.spyOn(logger, 'warn');
    vi.spyOn(logger, 'error');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('STORAGE_KEYS', () => {
    it('should have correct storage key constants', () => {
      expect(STORAGE_KEYS.TICKER_COLUMNS).toBe('tickers.columns');
      expect(STORAGE_KEYS.TICKER_PORTFOLIO_FILTER).toBe('tickers.portfolioFilter');
      expect(STORAGE_KEYS.FLEXIBLE_PORTFOLIO_FILTER).toBe('flexiblePortfolio.portfolioFilter');
    });
  });

  describe('STORAGE_VERSIONS', () => {
    it('should have correct version numbers', () => {
      expect(STORAGE_VERSIONS.TICKER_COLUMNS).toBe(2);
      expect(STORAGE_VERSIONS.TICKER_PORTFOLIO_FILTER).toBe(1);
      expect(STORAGE_VERSIONS.FLEXIBLE_PORTFOLIO_FILTER).toBe(1);
    });
  });

  describe('saveToLocalStorage', () => {
    it('should save data with version wrapping', () => {
      const data = { columns: ['name', 'price'] };
      const result = saveToLocalStorage('test.key', 1, data);

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'test.key.v1',
        JSON.stringify({ version: 1, data })
      );
    });

    it('should save primitive values', () => {
      const result = saveToLocalStorage('test.number', 1, 42);

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'test.number.v1',
        JSON.stringify({ version: 1, data: 42 })
      );
    });

    it('should save string values', () => {
      const result = saveToLocalStorage('test.string', 1, 'hello');

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'test.string.v1',
        JSON.stringify({ version: 1, data: 'hello' })
      );
    });

    it('should save boolean values', () => {
      const result = saveToLocalStorage('test.bool', 1, true);

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'test.bool.v1',
        JSON.stringify({ version: 1, data: true })
      );
    });

    it('should save array values', () => {
      const data = [1, 2, 3];
      const result = saveToLocalStorage('test.array', 2, data);

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'test.array.v2',
        JSON.stringify({ version: 2, data })
      );
    });

    it('should save null values', () => {
      const result = saveToLocalStorage('test.null', 1, null);

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'test.null.v1',
        JSON.stringify({ version: 1, data: null })
      );
    });

    it('should handle localStorage errors gracefully', () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const result = saveToLocalStorage('test.key', 1, { data: 'test' });

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'test.key' }),
        'Failed to save to localStorage'
      );
    });

    it('should append version to key', () => {
      saveToLocalStorage('my.key', 5, 'data');

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'my.key.v5',
        expect.any(String)
      );
    });

    it('should handle complex nested objects', () => {
      const complexData = {
        user: { name: 'John', settings: { theme: 'dark', notifications: true } },
        items: [{ id: 1, value: 'a' }, { id: 2, value: 'b' }],
      };

      const result = saveToLocalStorage('test.complex', 1, complexData);

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'test.complex.v1',
        JSON.stringify({ version: 1, data: complexData })
      );
    });
  });

  describe('loadFromLocalStorage', () => {
    it('should load data with matching version', () => {
      const data = { columns: ['name', 'price'] };
      mockLocalStorage['test.key.v1'] = JSON.stringify({ version: 1, data });

      const result = loadFromLocalStorage('test.key', 1, null);

      expect(result).toEqual(data);
      expect(localStorage.getItem).toHaveBeenCalledWith('test.key.v1');
    });

    it('should return fallback when no data exists', () => {
      const fallback = { default: 'value' };
      const result = loadFromLocalStorage('nonexistent.key', 1, fallback);

      expect(result).toEqual(fallback);
    });

    it('should return fallback when version mismatch', () => {
      const data = { old: 'data' };
      mockLocalStorage['test.key.v1'] = JSON.stringify({ version: 1, data });

      const fallback = { new: 'fallback' };
      const result = loadFromLocalStorage('test.key', 2, fallback);

      expect(result).toEqual(fallback);
      // Note: console.warn is called for version mismatch but not tested here
      // as it's a non-critical logging feature
    });

    it('should log warning when version mismatch occurs', () => {
      const data = { old: 'data' };
      mockLocalStorage['test.key.v3'] = JSON.stringify({ version: 2, data });

      const fallback = { new: 'fallback' };
      loadFromLocalStorage('test.key', 3, fallback);

      expect(logger.warn).toHaveBeenCalledWith(
        { key: 'test.key', expectedVersion: 3, actualVersion: 2 },
        'localStorage version mismatch'
      );
    });

    it('should load primitive number values', () => {
      mockLocalStorage['test.number.v1'] = JSON.stringify({ version: 1, data: 42 });

      const result = loadFromLocalStorage('test.number', 1, 0);

      expect(result).toBe(42);
    });

    it('should load string values', () => {
      mockLocalStorage['test.string.v1'] = JSON.stringify({ version: 1, data: 'hello' });

      const result = loadFromLocalStorage('test.string', 1, '');

      expect(result).toBe('hello');
    });

    it('should load boolean values', () => {
      mockLocalStorage['test.bool.v1'] = JSON.stringify({ version: 1, data: false });

      const result = loadFromLocalStorage('test.bool', 1, true);

      expect(result).toBe(false);
    });

    it('should load array values', () => {
      const data = [1, 2, 3];
      mockLocalStorage['test.array.v1'] = JSON.stringify({ version: 1, data });

      const result = loadFromLocalStorage('test.array', 1, []);

      expect(result).toEqual(data);
    });

    it('should load null values', () => {
      mockLocalStorage['test.null.v1'] = JSON.stringify({ version: 1, data: null });

      const result = loadFromLocalStorage('test.null', 1, 'fallback');

      expect(result).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      mockLocalStorage['test.key.v1'] = 'invalid json{';

      const fallback = { safe: 'value' };
      const result = loadFromLocalStorage('test.key', 1, fallback);

      expect(result).toEqual(fallback);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'test.key' }),
        'Failed to load from localStorage'
      );
    });

    it('should handle localStorage errors gracefully', () => {
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      const fallback = { error: 'fallback' };
      const result = loadFromLocalStorage('test.key', 1, fallback);

      expect(result).toEqual(fallback);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'test.key' }),
        'Failed to load from localStorage'
      );
    });

    it('should handle complex nested objects', () => {
      const complexData = {
        user: { name: 'John', settings: { theme: 'dark', notifications: true } },
        items: [{ id: 1, value: 'a' }, { id: 2, value: 'b' }],
      };
      mockLocalStorage['test.complex.v1'] = JSON.stringify({ version: 1, data: complexData });

      const result = loadFromLocalStorage('test.complex', 1, {});

      expect(result).toEqual(complexData);
    });

    it('should return fallback when data is empty string', () => {
      mockLocalStorage['test.key.v1'] = '';

      const fallback = { default: 'value' };
      const result = loadFromLocalStorage('test.key', 1, fallback);

      expect(result).toEqual(fallback);
    });
  });

  describe('removeFromLocalStorage', () => {
    it('should remove item from localStorage', () => {
      mockLocalStorage['test.key'] = 'some value';

      const result = removeFromLocalStorage('test.key');

      expect(result).toBe(true);
      expect(localStorage.removeItem).toHaveBeenCalledWith('test.key');
      expect(mockLocalStorage['test.key']).toBeUndefined();
    });

    it('should handle removal of non-existent key', () => {
      const result = removeFromLocalStorage('nonexistent.key');

      expect(result).toBe(true);
      expect(localStorage.removeItem).toHaveBeenCalledWith('nonexistent.key');
    });

    it('should handle localStorage errors gracefully', () => {
      vi.mocked(localStorage.removeItem).mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      const result = removeFromLocalStorage('test.key');

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'test.key' }),
        'Failed to remove from localStorage'
      );
    });

    it('should work with versioned keys', () => {
      mockLocalStorage['test.key.v2'] = 'value';

      const result = removeFromLocalStorage('test.key.v2');

      expect(result).toBe(true);
      expect(localStorage.removeItem).toHaveBeenCalledWith('test.key.v2');
    });
  });

  describe('Integration scenarios', () => {
    it('should save and load data correctly', () => {
      const data = { setting: 'value', count: 5 };

      const saveResult = saveToLocalStorage('integration.test', 1, data);
      expect(saveResult).toBe(true);

      const loadResult = loadFromLocalStorage('integration.test', 1, null);
      expect(loadResult).toEqual(data);
    });

    it('should handle version migration scenario', () => {
      // Save with version 1
      const oldData = { oldField: 'value' };
      saveToLocalStorage('migration.test', 1, oldData);

      // Try to load with version 2 - should get fallback
      const newFallback = { newField: 'default' };
      const result = loadFromLocalStorage('migration.test', 2, newFallback);

      expect(result).toEqual(newFallback);
      // Version mismatch warning is logged but not tested here
    });

    it('should handle save, load, remove cycle', () => {
      const data = { test: 'data' };

      // Save
      saveToLocalStorage('cycle.test', 1, data);

      // Load
      let result = loadFromLocalStorage('cycle.test', 1, null);
      expect(result).toEqual(data);

      // Remove
      removeFromLocalStorage('cycle.test.v1');

      // Load after removal should return fallback
      result = loadFromLocalStorage('cycle.test', 1, { fallback: true });
      expect(result).toEqual({ fallback: true });
    });

    it('should handle multiple keys with different versions', () => {
      saveToLocalStorage('key.a', 1, 'value-a');
      saveToLocalStorage('key.b', 2, 'value-b');
      saveToLocalStorage('key.c', 3, 'value-c');

      expect(loadFromLocalStorage('key.a', 1, null)).toBe('value-a');
      expect(loadFromLocalStorage('key.b', 2, null)).toBe('value-b');
      expect(loadFromLocalStorage('key.c', 3, null)).toBe('value-c');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty object', () => {
      const empty = {};
      saveToLocalStorage('empty.obj', 1, empty);

      const result = loadFromLocalStorage('empty.obj', 1, null);
      expect(result).toEqual(empty);
    });

    it('should handle empty array', () => {
      const empty: any[] = [];
      saveToLocalStorage('empty.array', 1, empty);

      const result = loadFromLocalStorage('empty.array', 1, null);
      expect(result).toEqual(empty);
    });

    it('should handle zero as valid data', () => {
      saveToLocalStorage('zero', 1, 0);

      const result = loadFromLocalStorage('zero', 1, 99);
      expect(result).toBe(0);
    });

    it('should handle false as valid data', () => {
      saveToLocalStorage('false', 1, false);

      const result = loadFromLocalStorage('false', 1, true);
      expect(result).toBe(false);
    });

    it('should handle empty string as valid data', () => {
      saveToLocalStorage('empty.string', 1, '');

      const result = loadFromLocalStorage('empty.string', 1, 'fallback');
      expect(result).toBe('');
    });

    it('should handle version 0', () => {
      saveToLocalStorage('version.zero', 0, 'data');

      const result = loadFromLocalStorage('version.zero', 0, null);
      expect(result).toBe('data');
    });

    it('should handle very large version numbers', () => {
      saveToLocalStorage('high.version', 999999, 'data');

      const result = loadFromLocalStorage('high.version', 999999, null);
      expect(result).toBe('data');
    });

    it('should handle special characters in keys', () => {
      saveToLocalStorage('key-with.special_chars', 1, 'value');

      const result = loadFromLocalStorage('key-with.special_chars', 1, null);
      expect(result).toBe('value');
    });
  });
});
