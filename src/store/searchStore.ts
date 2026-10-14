import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { searchMedicines } from '../data/searchApi';
import { Medicine } from '../domain/types';
import { persistOptions } from '../persistence/persistOptions';
import { isRecord, isStringArray } from '../utils/guards';

export const MAX_RECENT_SEARCHES = 5;
export const SEARCH_STORAGE_KEY = 'medmax.search';

export type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

interface PersistedSearch {
  recents: readonly string[];
}

interface SearchState extends PersistedSearch {
  query: string;
  status: SearchStatus;
  results: readonly Medicine[];
  /** Runs a search. A blank query resets to idle and cancels any search in flight. */
  search: (query: string) => Promise<void>;
  /** Call when the user submits the query or adds a result — not on every keystroke. */
  recordRecent: (query: string) => void;
  clearRecents: () => void;
}

const EMPTY: PersistedSearch = { recents: [] };

function addRecent(recents: readonly string[], query: string): string[] {
  const trimmed = query.trim();
  if (trimmed === '') {
    return [...recents];
  }
  const rest = recents.filter(r => r.toLowerCase() !== trimmed.toLowerCase());
  return [trimmed, ...rest].slice(0, MAX_RECENT_SEARCHES);
}

export function sanitizeSearch(raw: unknown): PersistedSearch {
  if (!isRecord(raw) || !isStringArray(raw.recents)) {
    return EMPTY;
  }
  const recents: string[] = [];
  for (const entry of raw.recents) {
    const trimmed = entry.trim();
    const duplicate = recents.some(
      r => r.toLowerCase() === trimmed.toLowerCase(),
    );
    if (trimmed !== '' && !duplicate && recents.length < MAX_RECENT_SEARCHES) {
      recents.push(trimmed);
    }
  }
  return { recents };
}

/** Only the most recent request may write results; older responses are dropped. */
let latestRequest = 0;

export const useSearchStore = create<SearchState>()(
  persist<SearchState, [], [], PersistedSearch>(
    (set, get) => ({
      ...EMPTY,
      query: '',
      status: 'idle',
      results: [],

      search: async query => {
        const requestId = ++latestRequest;
        if (query.trim() === '') {
          set({ query, status: 'idle', results: [] });
          return;
        }
        set({ query, status: 'loading' });
        try {
          const results = await searchMedicines(query);
          if (requestId !== latestRequest) {
            return;
          }
          set({ results, status: results.length > 0 ? 'success' : 'empty' });
        } catch {
          if (requestId === latestRequest) {
            set({ results: [], status: 'error' });
          }
        }
      },

      recordRecent: query => set({ recents: addRecent(get().recents, query) }),

      clearRecents: () => set({ recents: [] }),
    }),
    persistOptions<SearchState, PersistedSearch>({
      name: SEARCH_STORAGE_KEY,
      version: 1,
      partialize: ({ recents }) => ({ recents }),
      sanitize: sanitizeSearch,
      empty: EMPTY,
    }),
  ),
);
