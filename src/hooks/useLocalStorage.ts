// ============================================
// FILE: src/hooks/useLocalStorage.ts
// ============================================

import { useState, useEffect, useRef } from 'react';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/localStorage';

/**
 * Custom hook for syncing state with localStorage
 *
 * @param key - Storage key (without version suffix)
 * @param version - Version number for the data
 * @param initialValue - Default value if nothing in localStorage
 * @param saveImmediately - If true, auto-saves on every change. If false, returns manual save function
 * @returns [value, setValue, manualSave] - The state value, setter, and optional manual save function
 *
 * @example
 * // Auto-save mode (saves on every change)
 * const [filter, setFilter] = useLocalStorage('myKey', 1, [], true);
 *
 * @example
 * // Manual save mode (must call save explicitly)
 * const [columns, setColumns, saveColumns] = useLocalStorage('cols', 1, [], false);
 * // Later: saveColumns();
 */
export function useLocalStorage<T>(
  key: string,
  version: number,
  initialValue: T,
  saveImmediately: boolean = true
): [T, (value: T) => void, () => void] {
  // Track if this is the first render to avoid saving initial value
  const isFirstRender = useRef(true);

  // Load from localStorage on mount
  const [value, setValue] = useState<T>(() => {
    return loadFromLocalStorage(key, version, initialValue);
  });

  // Auto-save effect (only runs if saveImmediately is true, skips first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (saveImmediately) {
      saveToLocalStorage(key, version, value);
    }
  }, [value, key, version, saveImmediately]);

  // Manual save function
  const manualSave = () => {
    saveToLocalStorage(key, version, value);
  };

  return [value, setValue, manualSave];
}
