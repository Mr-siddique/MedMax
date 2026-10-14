import { act, renderHook } from '@testing-library/react-native';
import { useDebouncedValue } from '../../src/utils/useDebouncedValue';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('useDebouncedValue', () => {
  it('returns the initial value immediately', async () => {
    const { result } = await renderHook(() => useDebouncedValue('a', 300));
    expect(result.current).toBe('a');
  });

  it('only updates after the value has been still for the delay', async () => {
    const { result, rerender } = await renderHook(
      (props: { value: string }) => useDebouncedValue(props.value, 300),
      { initialProps: { value: 'a' } },
    );

    await rerender({ value: 'ab' });
    await act(async () => jest.advanceTimersByTime(200));
    await rerender({ value: 'abc' });
    await act(async () => jest.advanceTimersByTime(200));
    expect(result.current).toBe('a'); // timer restarted by 'abc'

    await act(async () => jest.advanceTimersByTime(100));
    expect(result.current).toBe('abc');
  });
});
