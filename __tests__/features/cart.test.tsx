import { fireEvent, render, screen, act } from '@testing-library/react-native';
import { CartScreen } from '../../src/features/cart/CartScreen';
import { useAddressStore } from '../../src/store/addressStore';
import { useCartStore } from '../../src/store/cartStore';
import { useToastStore } from '../../src/store/toastStore';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const address = {
  name: 'Aamir Rahman',
  phone: '9876543210',
  line1: '12, MG Road, Indiranagar',
  pincode: '560038',
};

const cart = () => useCartStore.getState();
function fill(id: string, times: number) {
  for (let i = 0; i < times; i++) {
    cart().add(id);
  }
}

beforeEach(() => {
  mockNavigate.mockReset();
  useCartStore.setState({ lines: [], couponCode: null, usedCouponCodes: [] });
  useAddressStore.setState({ address: null });
  useToastStore.setState({ toast: null });
});

describe('empty cart', () => {
  it('explains itself and sends you to Home', async () => {
    await render(<CartScreen />);
    expect(screen.getByText('Your cart is empty')).toBeTruthy();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Browse medicines' }),
    );
    expect(mockNavigate).toHaveBeenCalledWith('HomeTab');
  });
});

describe('items', () => {
  it('lists each line with its total and unit price', async () => {
    fill('m6', 2); // Allegra ₹180
    await render(<CartScreen />);
    expect(screen.getByText('Allegra 120')).toBeTruthy();
    expect(screen.getByText('Fexofenadine')).toBeTruthy();
    expect(screen.getAllByText('₹360').length).toBeGreaterThan(0);
    expect(screen.getByText('₹180 each')).toBeTruthy();
    expect(screen.getByLabelText('2 in cart')).toBeTruthy();
  });

  it('changes quantity and removes a line', async () => {
    fill('m6', 2);
    fill('m1', 1);
    await render(<CartScreen />);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Increase quantity of Allegra 120' }),
    );
    expect(cart().lines.find(l => l.id === 'm6')?.qty).toBe(3);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Remove Dolo 650 from cart' }),
    );
    expect(cart().lines.map(l => l.id)).toEqual(['m6']);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Remove all Allegra 120' }),
    );
    expect(cart().lines).toEqual([]);
    expect(screen.getByText('Your cart is empty')).toBeTruthy();
  });

  it('caps at maxQty and says so', async () => {
    fill('m3', 5); // Azithral, maxQty 2, rx
    await render(<CartScreen />);
    expect(screen.getByLabelText('2 in cart')).toBeTruthy();
    expect(screen.getByText('Max 2 per order')).toBeTruthy();
    await fireEvent.press(
      screen.getByRole('button', {
        name: 'Maximum quantity of 2 reached for Azithral 500',
      }),
    );
    expect(cart().lines).toEqual([{ id: 'm3', qty: 2 }]);
  });

  it('shows the Rx badge and notice only when a prescription item is in the cart', async () => {
    fill('m1', 1);
    await render(<CartScreen />);
    expect(screen.queryByLabelText('Prescription required')).toBeNull();
    expect(screen.queryByText(/valid prescription/)).toBeNull();

    await act(async () => cart().add('m3'));
    expect(screen.getByLabelText('Prescription required')).toBeTruthy();
    expect(screen.getByText(/verified at delivery/)).toBeTruthy();
  });
});

describe('bill', () => {
  const expectBill = (
    itemTotal: string,
    discount: string,
    delivery: string,
    grand: string,
  ) => {
    expect(screen.getByLabelText(`Item total, ${itemTotal}`)).toBeTruthy();
    expect(screen.getByLabelText(`Discount, ${discount}`)).toBeTruthy();
    expect(screen.getByLabelText(`Delivery fee, ${delivery}`)).toBeTruthy();
    expect(screen.getByLabelText(`Grand total, ${grand}`)).toBeTruthy();
  };

  it('charges the delivery fee below ₹499 and nudges toward free delivery', async () => {
    fill('m6', 2); // 360
    await render(<CartScreen />);
    expectBill('₹360', '₹0', '₹40', '₹400');
    expect(screen.getByText('Add ₹139 more for free delivery')).toBeTruthy();
  });

  it('is free from ₹499', async () => {
    fill('m6', 2); // 360
    fill('m9', 2); // 220 -> 580
    await render(<CartScreen />);
    expectBill('₹580', '₹0', 'Free', '₹580');
    expect(screen.queryByText(/more for free delivery/)).toBeNull();
  });

  it('applies a coupon from the store and shows the saving', async () => {
    fill('m6', 2);
    cart().applyCoupon('FLAT50');
    await render(<CartScreen />);
    expect(screen.getByText('FLAT50 applied')).toBeTruthy();
    expect(screen.getByText('You save ₹50')).toBeTruthy();
    expectBill('₹360', '-₹50', '₹40', '₹350');
  });

  it('describes a free-delivery coupon', async () => {
    fill('m6', 1); // 180
    cart().applyCoupon('FREEDEL');
    await render(<CartScreen />);
    expect(screen.getByText('Delivery fee waived')).toBeTruthy();
    expectBill('₹180', '₹0', 'Free', '₹180');
  });

  it('shows the capped SAVE10 discount', async () => {
    fill('m5', 10); // 250
    fill('m8', 2); // 400 -> 650 => 10% = 65
    cart().applyCoupon('SAVE10');
    await render(<CartScreen />);
    expectBill('₹650', '-₹65', 'Free', '₹585');
  });
});

describe('coupon row', () => {
  it('opens the coupons screen when none is applied', async () => {
    fill('m6', 1);
    await render(<CartScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Apply coupon' }));
    expect(mockNavigate).toHaveBeenCalledWith('Coupons');
  });

  it('removes an applied coupon', async () => {
    fill('m6', 2);
    cart().applyCoupon('FLAT50');
    await render(<CartScreen />);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Remove coupon FLAT50' }),
    );
    expect(cart().couponCode).toBeNull();
    expect(screen.getByRole('button', { name: 'Apply coupon' })).toBeTruthy();
  });

  it('drops the coupon and tells the user when the cart no longer qualifies', async () => {
    fill('m6', 2); // 360 >= 300
    cart().applyCoupon('FLAT50');
    await render(<CartScreen />);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Decrease quantity of Allegra 120' }),
    );
    expect(screen.queryByText('FLAT50 applied')).toBeNull();
    expect(screen.getByRole('button', { name: 'Apply coupon' })).toBeTruthy();
    expect(useToastStore.getState().toast?.message).toContain('FLAT50 removed');
  });
});

describe('address and placing the order', () => {
  it('blocks ordering until there is an address, and links to the form', async () => {
    fill('m6', 2);
    await render(<CartScreen />);
    expect(
      screen.getByText('Add a delivery address to place your order'),
    ).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Place order' }));
    expect(cart().lines).toHaveLength(1); // nothing happened

    await fireEvent.press(
      screen.getByRole('button', { name: 'Add delivery address' }),
    );
    expect(mockNavigate).toHaveBeenCalledWith('Address');
  });

  it('shows the saved address', async () => {
    fill('m6', 1);
    useAddressStore.setState({ address });
    await render(<CartScreen />);
    expect(screen.getByText('Deliver to Aamir Rahman')).toBeTruthy();
    expect(screen.getByText('12, MG Road, Indiranagar, 560038')).toBeTruthy();
    expect(
      screen.queryByText('Add a delivery address to place your order'),
    ).toBeNull();
  });

  it('places the order: clears the cart, marks FIRST100 used, goes to the confirmation', async () => {
    fill('m6', 2); // 360
    cart().applyCoupon('FIRST100');
    useAddressStore.setState({ address });
    await render(<CartScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Place order' }));

    expect(mockNavigate).toHaveBeenCalledWith('OrderPlaced', {
      orderId: expect.any(String),
      total: 360 - 100 + 40,
    });
    expect(cart().lines).toEqual([]);
    expect(cart().usedCouponCodes).toEqual(['FIRST100']);
  });

  it('shows the sticky total from the bill', async () => {
    fill('m6', 2);
    await render(<CartScreen />);
    expect(screen.getAllByLabelText('Grand total ₹400')).toHaveLength(1);
  });
});
