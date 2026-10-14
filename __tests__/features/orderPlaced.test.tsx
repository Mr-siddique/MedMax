import { fireEvent, render, screen } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import { OrderPlacedScreen } from '../../src/features/order/OrderPlacedScreen';

const mockReset = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ reset: mockReset }),
  useRoute: () => ({ params: { orderId: 'ORDABC123', total: 1234 } }),
}));

beforeEach(() => mockReset.mockReset());

type BackListener = Parameters<typeof BackHandler.addEventListener>[1];

const HOME = { index: 0, routes: [{ name: 'Main' }] };

describe('OrderPlacedScreen', () => {
  it('confirms the order with its id and amount', async () => {
    await render(<OrderPlacedScreen />);
    expect(screen.getByText('Order placed!')).toBeTruthy();
    expect(screen.getByLabelText('Order ID ORDABC123')).toBeTruthy();
    expect(screen.getByLabelText('Amount to pay ₹1,234')).toBeTruthy();
  });

  it('"Back to home" resets the stack to Main', async () => {
    await render(<OrderPlacedScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Back to home' }));
    expect(mockReset).toHaveBeenCalledWith(HOME);
  });

  it('the Android back button also goes home instead of back to the cart', async () => {
    let onBack: BackListener = () => false;
    const remove = jest.fn();
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_e, cb) => {
      onBack = cb;
      return { remove };
    });

    const { unmount } = await render(<OrderPlacedScreen />);
    expect(onBack({ type: 'hardwareBackPress', timeStamp: 0 })).toBe(true); // handled, so the app does not exit
    expect(mockReset).toHaveBeenCalledWith(HOME);

    await unmount();
    expect(remove).toHaveBeenCalled();
  });
});
