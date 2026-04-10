/**
 * historyService.js
 * ─────────────────
 * Centralised localStorage-backed history for MedIntel.
 * Every completed analysis / search is stored here and read by the
 * Dashboard and History pages so the data shown is always real.
 *
 * Storage keys:
 *   medintel_history   – JSON array of history records
 *   medintel_searches  – total search count (number)
 */

const HISTORY_KEY = 'medintel_history';
const SEARCH_COUNT_KEY = 'medintel_searches';

// ─── Helpers ────────────────────────────────────────────────────────
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── History records ────────────────────────────────────────────────

/**
 * Returns the full history array (most-recent-first).
 */
export function getHistory() {
  return read(HISTORY_KEY, []);
}

/**
 * Adds a new record to history.
 * @param {{ name: string, dose?: string, category?: string, status?: string, savings?: string, alternatives?: number }} entry
 */
export function addHistoryEntry(entry) {
  const record = {
    id: Date.now(),
    name: entry.name || 'Unknown Medicine',
    dose: entry.dose || 'As prescribed',
    category: entry.category || 'General',
    status: entry.status || 'Verified',
    savings: entry.savings || '₹0.00',
    alternatives: entry.alternatives || 0,
    date: new Date().toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }),
    timestamp: Date.now(),
  };

  const history = getHistory();
  history.unshift(record);           // newest first
  write(HISTORY_KEY, history);

  // Also bump the search counter
  incrementSearchCount();

  // Notify any listeners (Dashboard etc.) via a custom DOM event
  window.dispatchEvent(new Event('medintel_history_updated'));

  return record;
}

/**
 * Removes a single record by id.
 */
export function deleteHistoryEntry(id) {
  const history = getHistory().filter(r => r.id !== id);
  write(HISTORY_KEY, history);
  window.dispatchEvent(new Event('medintel_history_updated'));
}

/**
 * Clears all history.
 */
export function clearHistory() {
  write(HISTORY_KEY, []);
  window.dispatchEvent(new Event('medintel_history_updated'));
}

// ─── Search count ───────────────────────────────────────────────────

export function getSearchCount() {
  return read(SEARCH_COUNT_KEY, 0);
}

function incrementSearchCount() {
  const current = getSearchCount();
  write(SEARCH_COUNT_KEY, current + 1);
}
