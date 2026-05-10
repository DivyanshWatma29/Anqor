const DRAFT_PREFIX = 'anqor_draft_';

export interface FormDraft<T> {
  data: T;
  timestamp: number;
  version: string;
}

const CURRENT_VERSION = '1.0';

/**
 * Save form draft to localStorage
 */
export function saveDraft<T>(key: string, data: T): void {
  try {
    const draft: FormDraft<T> = {
      data,
      timestamp: Date.now(),
      version: CURRENT_VERSION,
    };
    localStorage.setItem(DRAFT_PREFIX + key, JSON.stringify(draft));
  } catch (error) {
    console.warn('Failed to save form draft:', error);
  }
}

/**
 * Load form draft from localStorage
 * Returns null if no draft exists or if it's expired
 */
export function loadDraft<T>(key: string, maxAgeMs?: number): T | null {
  try {
    const raw = localStorage.getItem(DRAFT_PREFIX + key);
    if (!raw) return null;

    const draft: FormDraft<T> = JSON.parse(raw);
    
    // Check version
    if (draft.version !== CURRENT_VERSION) {
      clearDraft(key);
      return null;
    }

    // Check expiry
    if (maxAgeMs && Date.now() - draft.timestamp > maxAgeMs) {
      clearDraft(key);
      return null;
    }

    return draft.data;
  } catch (error) {
    console.warn('Failed to load form draft:', error);
    return null;
  }
}

/**
 * Clear a specific form draft
 */
export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(DRAFT_PREFIX + key);
  } catch (error) {
    console.warn('Failed to clear form draft:', error);
  }
}

/**
 * Clear all form drafts
 */
export function clearAllDrafts(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DRAFT_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Failed to clear all drafts:', error);
  }
}

/**
 * Get all draft keys (without prefix)
 */
export function getDraftKeys(): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DRAFT_PREFIX)) {
        keys.push(key.replace(DRAFT_PREFIX, ''));
      }
    }
    return keys;
  } catch {
    return [];
  }
}

/**
 * Check if a draft exists and is not expired
 */
export function hasDraft(key: string, maxAgeMs?: number): boolean {
  return loadDraft(key, maxAgeMs) !== null;
}
