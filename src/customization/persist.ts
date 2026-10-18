import { PART_BY_ID } from '../data/parts';
import { APPEARANCE_KINDS, APPEARANCE_KEYS } from './schema';
import type { AppearanceRecord, AppearanceValues } from './types';

const STORAGE_KEY = 'mx87.appearance.v1';
let saveTimer: number | undefined;

function validValue(value: unknown): string | number | boolean | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return undefined;
}

/** Accept only known part IDs, schema keys and primitive values. */
export function sanitizeAppearance(input: unknown): AppearanceRecord {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const record: AppearanceRecord = {};
  for (const [partId, raw] of Object.entries(input as Record<string, unknown>)) {
    if (!PART_BY_ID[partId] || !raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const clean: AppearanceValues = {};
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (!APPEARANCE_KEYS.has(key)) continue;
      const next = validValue(value);
      if (next === undefined) continue;
      const kind = APPEARANCE_KINDS.get(key);
      if (kind === 'range' && typeof next !== 'number') continue;
      if (kind === 'toggle' && typeof next !== 'boolean') continue;
      if ((kind === 'color' || kind === 'text') && typeof next !== 'string') continue;
      (clean as Record<string, unknown>)[key] = next;
    }
    if (Object.keys(clean).length > 0) record[partId] = clean;
  }
  return record;
}

export function loadAppearance(): AppearanceRecord {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return sanitizeAppearance(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function scheduleAppearanceSave(record: AppearanceRecord): void {
  if (typeof window === 'undefined') return;
  if (saveTimer !== undefined) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveTimer = undefined;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      // Storage can be unavailable in private mode; the UI still works in memory.
    }
  }, 180);
}

export function clearAppearanceStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
