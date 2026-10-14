import { act, fireEvent, render, screen } from '@testing-library/react-native';
import {
  HomeScreen,
  SEARCH_DEBOUNCE_MS,
} from '../../src/features/home/HomeScreen';
import { catalog } from '../../src/data/medicineCatalog';
import { searchMedicines } from '../../src/data/searchApi';
import { filterMedicines } from '../../src/domain/search';
import { Medicine } from '../../src/domain/types';
import { useCartStore } from '../../src/store/cartStore';
import { usePermissionStore } from '../../src/store/permissionStore';
import { useSearchStore } from '../../src/store/searchStore';

jest.mock('../../src/data/searchApi');
jest.mock('../../src/services/permissions');
jest.mock('../../src/services/location', () => ({
  ...jest.requireActual('../../src/services/location'),
  getCurrentCoords: jest.fn(),
}));
const mockSearch = jest.mocked(searchMedicines);

const SEARCH_LABEL = 'Search medicines by name or salt';

function deferred() {
  let resolve!: (value: Medicine[]) => void;
  const promise = new Promise<Medicine[]>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

/** Types into the box and lets the debounce fire. */
async function typeQuery(text: string) {
  await fireEvent.changeText(screen.getByLabelText(SEARCH_LABEL), text);
  await act(async () => jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
}

beforeEach(() => {
  jest.useFakeTimers();
  mockSearch.mockReset();
  mockSearch.mockImplementation(async q => filterMedicines(catalog, q));
  useSearchStore.setState({
    query: '',
    status: 'idle',
    results: [],
    recents: [],
  });
  useCartStore.setState({ lines: [], couponCode: null, usedCouponCodes: [] });
  usePermissionStore.setState({
    status: { location: 'granted', notifications: 'granted' },
    coords: { latitude: 12.9716, longitude: 77.5946 },
    locationFetch: 'idle',
  });
});

afterEach(() => jest.useRealTimers());

describe('search states', () => {
  it('lists the catalog when the box is empty, without calling the API', async () => {
    await render(<HomeScreen />);
    expect(screen.getByText('All medicines')).toBeTruthy();
    expect(screen.getByText('Dolo 650')).toBeTruthy();
    expect(screen.getByText('Crocin Advance')).toBeTruthy();
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('adds straight from the browse list without recording a search', async () => {
    await render(<HomeScreen />);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Add Dolo 650 to cart' }),
    );
    expect(useCartStore.getState().lines).toEqual([{ id: 'm1', qty: 1 }]);
    expect(useSearchStore.getState().recents).toEqual([]);
  });

  it('swaps the catalog for the matches once a search runs', async () => {
    await render(<HomeScreen />);
    await typeQuery('azithral');
    expect(screen.queryByText('All medicines')).toBeNull();
    expect(screen.queryByText('Dolo 650')).toBeNull();
    expect(screen.getByText('Azithral 500')).toBeTruthy();
  });

  it('waits for the debounce, shows loading, then results', async () => {
    const pending = deferred();
    mockSearch.mockReturnValueOnce(pending.promise);
    await render(<HomeScreen />);

    await fireEvent.changeText(screen.getByLabelText(SEARCH_LABEL), 'dolo');
    expect(mockSearch).not.toHaveBeenCalled();
    await act(async () => jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS));

    expect(mockSearch).toHaveBeenCalledWith('dolo');
    expect(screen.getByLabelText('Searching medicines')).toBeTruthy();

    await act(async () => pending.resolve(filterMedicines(catalog, 'dolo')));
    expect(screen.queryByLabelText('Searching medicines')).toBeNull();
    expect(screen.getByText('Dolo 650')).toBeTruthy();
    expect(screen.getByText('1 result for “dolo”')).toBeTruthy();
  });

  it('matches on salt too', async () => {
    await render(<HomeScreen />);
    await typeQuery('paracetamol');
    expect(screen.getByText('Dolo 650')).toBeTruthy();
    expect(screen.getByText('Crocin Advance')).toBeTruthy();
    expect(screen.getByText('6 results for “paracetamol”')).toBeTruthy();
  });

  it('shows a no-results state with a way out', async () => {
    await render(<HomeScreen />);
    await typeQuery('zzzz');
    expect(screen.getByText('No medicines found')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByText('All medicines')).toBeTruthy();
    expect(screen.getByLabelText(SEARCH_LABEL).props.value).toBe('');
  });

  it('shows an error state and retries', async () => {
    mockSearch.mockRejectedValueOnce(new Error('boom'));
    await render(<HomeScreen />);
    await typeQuery('dolo');
    expect(screen.getByText('Something went wrong')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('Dolo 650')).toBeTruthy();
  });
});

describe('result rows', () => {
  it('shows the Rx badge only on prescription medicines', async () => {
    await render(<HomeScreen />);
    await typeQuery('azithral'); // rx: true
    expect(screen.getByLabelText('Prescription required')).toBeTruthy();

    await typeQuery('dolo'); // rx: false
    expect(screen.queryByLabelText('Prescription required')).toBeNull();
  });

  it('turns Add into a stepper wired to the cart', async () => {
    await render(<HomeScreen />);
    await typeQuery('dolo');

    await fireEvent.press(
      screen.getByRole('button', { name: 'Add Dolo 650 to cart' }),
    );
    expect(useCartStore.getState().lines).toEqual([{ id: 'm1', qty: 1 }]);
    expect(screen.getByLabelText('1 in cart')).toBeTruthy();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Increase quantity of Dolo 650' }),
    );
    expect(screen.getByLabelText('2 in cart')).toBeTruthy();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Decrease quantity of Dolo 650' }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Remove Dolo 650 from cart' }),
    );
    expect(useCartStore.getState().lines).toEqual([]);
    expect(
      screen.getByRole('button', { name: 'Add Dolo 650 to cart' }),
    ).toBeTruthy();
  });

  it('stops at maxQty and says so', async () => {
    await render(<HomeScreen />);
    await typeQuery('azithral'); // maxQty 2
    await fireEvent.press(
      screen.getByRole('button', { name: 'Add Azithral 500 to cart' }),
    );
    await fireEvent.press(
      screen.getByRole('button', {
        name: 'Increase quantity of Azithral 500',
      }),
    );

    expect(useCartStore.getState().lines).toEqual([{ id: 'm3', qty: 2 }]);
    expect(screen.getByText('Max 2 per order')).toBeTruthy();
    await fireEvent.press(
      screen.getByRole('button', {
        name: 'Maximum quantity of 2 reached for Azithral 500',
      }),
    );
    expect(useCartStore.getState().lines).toEqual([{ id: 'm3', qty: 2 }]);
  });

  it('reflects cart changes made elsewhere', async () => {
    await render(<HomeScreen />);
    await typeQuery('dolo');
    await act(async () => useCartStore.getState().add('m1'));
    expect(screen.getByLabelText('1 in cart')).toBeTruthy();
  });
});

describe('recent searches', () => {
  it('records a query when the keyboard search key is pressed', async () => {
    await render(<HomeScreen />);
    await fireEvent.changeText(screen.getByLabelText(SEARCH_LABEL), 'dolo');
    await fireEvent(screen.getByLabelText(SEARCH_LABEL), 'submitEditing');
    expect(useSearchStore.getState().recents).toEqual(['dolo']);
  });

  it('records a query when a result is added, but not for plain searching', async () => {
    await render(<HomeScreen />);
    await typeQuery('dolo');
    expect(useSearchStore.getState().recents).toEqual([]);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Add Dolo 650 to cart' }),
    );
    expect(useSearchStore.getState().recents).toEqual(['dolo']);
  });

  it('lists recents when idle, re-runs one on tap, and clears them', async () => {
    useSearchStore.setState({ recents: ['crocin', 'dolo'] });
    await render(<HomeScreen />);
    expect(screen.getByText('Recent searches')).toBeTruthy();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Search again for crocin' }),
    );
    expect(screen.getByLabelText(SEARCH_LABEL).props.value).toBe('crocin');
    expect(screen.getByText('Crocin Advance')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
    await fireEvent.press(
      screen.getByRole('button', { name: 'Clear recent searches' }),
    );
    expect(useSearchStore.getState().recents).toEqual([]);
    expect(screen.queryByText('Recent searches')).toBeNull();
  });
});

describe('header', () => {
  it('shows the delivery location and the permission status line', async () => {
    await render(<HomeScreen />);
    expect(screen.getByText('Delivering to: 12.9716,77.5946')).toBeTruthy();
    expect(
      screen.getByText(
        'Permissions · Location: granted · Notifications: granted',
      ),
    ).toBeTruthy();
  });

  it('restores the last query when the screen is shown again', async () => {
    useSearchStore.setState({
      query: 'dolo',
      status: 'success',
      results: filterMedicines(catalog, 'dolo'),
    });
    await render(<HomeScreen />);
    expect(screen.getByLabelText(SEARCH_LABEL).props.value).toBe('dolo');
    expect(screen.getByText('Dolo 650')).toBeTruthy();
    await act(async () => jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    expect(mockSearch).not.toHaveBeenCalled();
  });
});
