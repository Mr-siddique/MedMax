import { SEARCH_LATENCY_MS, searchMedicines } from '../../src/data/searchApi';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('searchMedicines', () => {
  it('resolves matching medicines after the simulated latency', async () => {
    const pending = searchMedicines('dolo');
    jest.advanceTimersByTime(SEARCH_LATENCY_MS);
    const results = await pending;
    expect(results.map(m => m.id)).toEqual(['m1']);
  });

  it('does not resolve before the latency has passed', async () => {
    let settled = false;
    searchMedicines('dolo').then(() => {
      settled = true;
    });
    jest.advanceTimersByTime(SEARCH_LATENCY_MS - 1);
    await Promise.resolve();
    expect(settled).toBe(false);
  });
});
