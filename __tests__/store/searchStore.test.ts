import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchMedicines } from '../../src/data/searchApi';
import { filterMedicines } from '../../src/domain/search';
import { catalog } from '../../src/data/catalog';
import { Medicine } from '../../src/domain/types';
import {
  MAX_RECENT_SEARCHES,
  SEARCH_STORAGE_KEY,
  useSearchStore,
} from '../../src/store/searchStore';

jest.mock('../../src/data/searchApi');
const mockSearch = jest.mocked(searchMedicines);

const store = () => useSearchStore.getState();

function deferred() {
  let resolve!: (value: Medicine[]) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<Medicine[]>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(async () => {
  await AsyncStorage.clear();
  mockSearch.mockReset();
  mockSearch.mockImplementation(async q => filterMedicines(catalog, q));
  useSearchStore.setState({
    query: '',
    status: 'idle',
    results: [],
    recents: [],
  });
});

describe('search states', () => {
  it('stays idle for a blank query and never calls the API', async () => {
    await store().search('   ');
    expect(store().status).toBe('idle');
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('goes loading then success with results', async () => {
    const pending = store().search('dolo');
    expect(store().status).toBe('loading');
    await pending;
    expect(store().status).toBe('success');
    expect(store().results.map(m => m.id)).toEqual(['m1']);
    expect(store().query).toBe('dolo');
  });

  it('reports empty when nothing matches', async () => {
    await store().search('zzzz');
    expect(store().status).toBe('empty');
    expect(store().results).toEqual([]);
  });

  it('reports error when the API fails, and recovers on retry', async () => {
    mockSearch.mockRejectedValueOnce(new Error('boom'));
    await store().search('dolo');
    expect(store().status).toBe('error');
    await store().search('dolo');
    expect(store().status).toBe('success');
  });

  it('clearing the box returns to idle and drops old results', async () => {
    await store().search('dolo');
    await store().search('');
    expect(store().status).toBe('idle');
    expect(store().results).toEqual([]);
  });
});

describe('stale responses', () => {
  it('ignores an older response that arrives after a newer one', async () => {
    const first = deferred();
    const second = deferred();
    mockSearch.mockReturnValueOnce(first.promise);
    mockSearch.mockReturnValueOnce(second.promise);

    const a = store().search('para');
    const b = store().search('dolo');
    second.resolve(filterMedicines(catalog, 'dolo'));
    await b;
    first.resolve(filterMedicines(catalog, 'para'));
    await a;

    expect(store().query).toBe('dolo');
    expect(store().results.map(m => m.id)).toEqual(['m1']);
  });

  it('ignores a response that lands after the box was cleared', async () => {
    const pending = deferred();
    mockSearch.mockReturnValueOnce(pending.promise);
    const a = store().search('dolo');
    await store().search('');
    pending.resolve(filterMedicines(catalog, 'dolo'));
    await a;
    expect(store().status).toBe('idle');
    expect(store().results).toEqual([]);
  });

  it('ignores a stale failure', async () => {
    const pending = deferred();
    mockSearch.mockReturnValueOnce(pending.promise);
    const a = store().search('para');
    await store().search('dolo');
    pending.reject(new Error('late'));
    await a;
    expect(store().status).toBe('success');
  });
});

describe('recent searches', () => {
  it('puts the newest first and trims', () => {
    store().recordRecent(' dolo ');
    store().recordRecent('crocin');
    expect(store().recents).toEqual(['crocin', 'dolo']);
  });

  it('de-duplicates case-insensitively and moves the repeat to the front', () => {
    store().recordRecent('Dolo');
    store().recordRecent('crocin');
    store().recordRecent('dolo');
    expect(store().recents).toEqual(['dolo', 'crocin']);
  });

  it('keeps at most 5', () => {
    ['a', 'b', 'c', 'd', 'e', 'f', 'g'].forEach(q => store().recordRecent(q));
    expect(store().recents).toHaveLength(MAX_RECENT_SEARCHES);
    expect(store().recents).toEqual(['g', 'f', 'e', 'd', 'c']);
  });

  it('ignores blank queries', () => {
    store().recordRecent('   ');
    expect(store().recents).toEqual([]);
  });

  it('searching alone does not record a recent', async () => {
    await store().search('dolo');
    expect(store().recents).toEqual([]);
  });

  it('clears', () => {
    store().recordRecent('dolo');
    store().clearRecents();
    expect(store().recents).toEqual([]);
  });
});

describe('recents persistence', () => {
  it('persists only the recents', async () => {
    store().recordRecent('dolo');
    await store().search('dolo');
    const raw = await AsyncStorage.getItem(SEARCH_STORAGE_KEY);
    expect(JSON.parse(raw ?? 'null')).toEqual({
      version: 1,
      state: { recents: ['dolo'] },
    });
  });

  it('restores them after a restart', async () => {
    await AsyncStorage.setItem(
      SEARCH_STORAGE_KEY,
      JSON.stringify({ version: 1, state: { recents: ['dolo', 'crocin'] } }),
    );
    await useSearchStore.persist.rehydrate();
    expect(store().recents).toEqual(['dolo', 'crocin']);
  });

  it('cleans up bad saved data: non-strings, blanks, duplicates, overflow', async () => {
    await AsyncStorage.setItem(
      SEARCH_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state: {
          recents: ['a', ' ', 'A', 'b', 'c', 'd', 'e', 'f', 'g'],
        },
      }),
    );
    await useSearchStore.persist.rehydrate();
    expect(store().recents).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it.each([
    ['not JSON', '{{'],
    [
      'non-array recents',
      JSON.stringify({ version: 1, state: { recents: 'x' } }),
    ],
    [
      'mixed types',
      JSON.stringify({ version: 1, state: { recents: ['a', 1] } }),
    ],
    [
      'unknown version',
      JSON.stringify({ version: 3, state: { recents: ['a'] } }),
    ],
  ])('survives corrupt storage: %s', async (_label, raw) => {
    await AsyncStorage.setItem(SEARCH_STORAGE_KEY, raw);
    await useSearchStore.persist.rehydrate();
    expect(store().recents).toEqual([]);
    expect(useSearchStore.persist.hasHydrated()).toBe(true);
  });
});
