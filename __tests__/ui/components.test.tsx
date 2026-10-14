import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useToastStore } from '../../src/store/toastStore';
import { Button } from '../../src/ui/Button';
import { EmptyState } from '../../src/ui/EmptyState';
import { RxBadge } from '../../src/ui/RxBadge';
import { Stepper } from '../../src/ui/Stepper';
import { TOAST_DURATION_MS, ToastHost } from '../../src/ui/ToastHost';

describe('Button', () => {
  it('calls onPress', async () => {
    const onPress = jest.fn();
    await render(<Button label="Add" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Add' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['disabled', { disabled: true }],
    ['loading', { loading: true }],
  ])('does not fire when %s', async (_label, props) => {
    const onPress = jest.fn();
    await render(<Button label="Add" onPress={onPress} {...props} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Add' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('Stepper', () => {
  const setup = async (qty: number, max: number) => {
    const onIncrement = jest.fn();
    const onDecrement = jest.fn();
    await render(
      <Stepper
        qty={qty}
        max={max}
        itemName="Dolo 650"
        onIncrement={onIncrement}
        onDecrement={onDecrement}
      />,
    );
    return { onIncrement, onDecrement };
  };

  it('increments and decrements', async () => {
    const { onIncrement, onDecrement } = await setup(2, 5);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Increase quantity of Dolo 650' }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Decrease quantity of Dolo 650' }),
    );
    expect(onIncrement).toHaveBeenCalledTimes(1);
    expect(onDecrement).toHaveBeenCalledTimes(1);
  });

  it('labels the minus button as a removal at quantity 1', async () => {
    const { onDecrement } = await setup(1, 5);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Remove Dolo 650 from cart' }),
    );
    expect(onDecrement).toHaveBeenCalledTimes(1);
  });

  it('disables increment at maxQty and says why', async () => {
    const { onIncrement } = await setup(2, 2);
    const plus = screen.getByRole('button', {
      name: 'Maximum quantity of 2 reached for Dolo 650',
    });
    await fireEvent.press(plus);
    expect(onIncrement).not.toHaveBeenCalled();
  });
});

describe('RxBadge / EmptyState', () => {
  it('labels the Rx badge for screen readers', async () => {
    await render(<RxBadge />);
    expect(screen.getByLabelText('Prescription required')).toBeTruthy();
  });

  it('renders the action only when provided', async () => {
    const onAction = jest.fn();
    await render(
      <EmptyState
        icon="🛒"
        title="Cart is empty"
        message="Add medicines"
        actionLabel="Browse"
        onAction={onAction}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Browse' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});

describe('ToastHost', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useToastStore.setState({ toast: null });
    jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const renderHost = () =>
    render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 360, height: 640 },
          insets: { top: 24, left: 0, right: 0, bottom: 0 },
        }}
      >
        <ToastHost />
      </SafeAreaProvider>,
    );

  it('shows a toast, announces it, and auto-dismisses', async () => {
    await renderHost();
    expect(screen.queryByRole('alert')).toBeNull();

    await act(async () => useToastStore.getState().show('FLAT50 removed'));
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      'FLAT50 removed',
    );

    await act(async () => jest.advanceTimersByTime(TOAST_DURATION_MS));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('dismisses on tap', async () => {
    await renderHost();
    await act(async () => useToastStore.getState().show('Hello'));
    await fireEvent.press(screen.getByRole('alert'));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('restarts the timer when a new toast replaces the old one', async () => {
    await renderHost();
    await act(async () => useToastStore.getState().show('First'));
    await act(async () => jest.advanceTimersByTime(TOAST_DURATION_MS - 500));
    await act(async () => useToastStore.getState().show('Second'));
    await act(async () => jest.advanceTimersByTime(TOAST_DURATION_MS - 500));
    expect(screen.getByText('Second')).toBeTruthy();
    await act(async () => jest.advanceTimersByTime(500));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
