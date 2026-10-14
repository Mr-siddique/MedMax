import { act, renderHook } from '@testing-library/react-native';
import { Keyboard } from 'react-native';
import { useKeyboardVisible } from '../../src/utils/useKeyboardVisible';

const keyboardEvent = {
  duration: 0,
  easing: 'keyboard',
  endCoordinates: { screenX: 0, screenY: 0, width: 0, height: 0 },
} as const;

describe('useKeyboardVisible', () => {
  it('follows the keyboard showing and hiding', async () => {
    const listeners = new Map<string, () => void>();
    jest.spyOn(Keyboard, 'addListener').mockImplementation((event, cb) => {
      listeners.set(event, () => cb(keyboardEvent));
      return { remove: jest.fn() };
    });
    const { result } = await renderHook(() => useKeyboardVisible());
    expect(result.current).toBe(false);

    await act(async () => listeners.get('keyboardDidShow')?.());
    expect(result.current).toBe(true);

    await act(async () => listeners.get('keyboardDidHide')?.());
    expect(result.current).toBe(false);
  });
});
