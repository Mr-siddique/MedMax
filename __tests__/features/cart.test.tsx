import { fireEvent, render, screen, act } from '@testing-library/react-native';
import { CartScreen } from '../../src/features/cart/CartScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ADDRESS_STORAGE_KEY,
  useAddressStore,
} from '../../src/store/addressStore';
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

beforeEach(async () => {
  await AsyncStorage.clear();
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

describe('coupon code box', () => {
  const codeBox = () => screen.getByLabelText('Have a coupon code?');
  const typeCode = (text: string) => fireEvent.changeText(codeBox(), text);
  const pressApply = () =>
    fireEvent.press(screen.getByRole('button', { name: 'Apply coupon code' }));

  it('applies a typed code, ignoring case and spaces', async () => {
    fill('m6', 2); // 360
    await render(<CartScreen />);
    await typeCode(' flat50 ');
    await pressApply();

    expect(cart().couponCode).toBe('FLAT50');
    expect(screen.getByText('FLAT50 applied')).toBeTruthy();
    expect(screen.getByText('You save ₹50')).toBeTruthy();
    expect(screen.queryByLabelText('Have a coupon code?')).toBeNull();
  });

  it('keeps Apply disabled until something is typed', async () => {
    fill('m6', 1);
    await render(<CartScreen />);
    await pressApply();
    expect(cart().couponCode).toBeNull();
    await typeCode('FLAT50');
    expect(
      screen.getByRole('button', { name: 'Apply coupon code' }),
    ).toBeEnabled();
  });

  it('rejects an unknown code and clears the error when you edit', async () => {
    fill('m6', 2);
    await render(<CartScreen />);
    await typeCode('NOPE');
    await pressApply();
    expect(screen.getByText('This coupon is not valid')).toBeTruthy();
    expect(cart().couponCode).toBeNull();

    await typeCode('NOPE2');
    expect(screen.queryByText('This coupon is not valid')).toBeNull();
  });

  it('explains why an eligible-looking code cannot be used yet', async () => {
    fill('m6', 1); // 180 < 300
    await render(<CartScreen />);
    await typeCode('FLAT50');
    await pressApply();
    expect(screen.getByText(/Add ₹120 more/)).toBeTruthy();
    expect(cart().couponCode).toBeNull();
  });

  it('refuses FIRST100 once it has been used', async () => {
    useCartStore.setState({ usedCouponCodes: ['FIRST100'] });
    fill('m6', 2);
    await render(<CartScreen />);
    await typeCode('FIRST100');
    await pressApply();
    expect(screen.getByText('You have already used this coupon')).toBeTruthy();
    expect(cart().couponCode).toBeNull();
  });

  it('removes an applied coupon and brings the box back', async () => {
    fill('m6', 2);
    cart().applyCoupon('FLAT50');
    await render(<CartScreen />);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Remove coupon FLAT50' }),
    );
    expect(cart().couponCode).toBeNull();
    expect(codeBox()).toBeTruthy();
  });

  it('drops the coupon and tells the user when the cart no longer qualifies', async () => {
    fill('m6', 2); // 360 >= 300
    cart().applyCoupon('FLAT50');
    await render(<CartScreen />);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Decrease quantity of Allegra 120' }),
    );
    expect(screen.queryByText('FLAT50 applied')).toBeNull();
    expect(codeBox()).toBeTruthy();
    expect(useToastStore.getState().toast?.message).toContain('FLAT50 removed');
  });
});

describe('coupon list', () => {
  const openList = () =>
    fireEvent.press(screen.getByRole('button', { name: 'View all coupons' }));

  it('lists every coupon with the reason when one cannot be applied', async () => {
    fill('m6', 1); // 180
    await render(<CartScreen />);
    await openList();

    for (const code of ['FLAT50', 'SAVE10', 'FREEDEL', 'FIRST100']) {
      expect(screen.getByText(code)).toBeTruthy();
    }
    expect(screen.getByRole('button', { name: 'Apply FLAT50' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Apply SAVE10' })).toBeEnabled();
    expect(screen.getAllByText(/Add ₹\d+ more to use this coupon/).length).toBe(
      2,
    ); // FLAT50, FIRST100
  });

  it('applies from the list and collapses it', async () => {
    fill('m6', 2); // 360
    await render(<CartScreen />);
    await openList();
    await fireEvent.press(screen.getByRole('button', { name: 'Apply SAVE10' }));

    expect(cart().couponCode).toBe('SAVE10');
    expect(screen.getByText('SAVE10 applied')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Apply FLAT50' })).toBeNull();
  });

  it('replaces the applied coupon: only one at a time', async () => {
    fill('m6', 2);
    cart().applyCoupon('FLAT50');
    await render(<CartScreen />);
    await openList();
    expect(
      screen.getByRole('button', { name: 'FLAT50 is applied' }),
    ).toBeDisabled();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Apply FREEDEL' }),
    );
    expect(cart().couponCode).toBe('FREEDEL');
  });

  it('marks a used one-time coupon as unavailable', async () => {
    useCartStore.setState({ usedCouponCodes: ['FIRST100'] });
    fill('m6', 2);
    await render(<CartScreen />);
    await openList();
    expect(screen.getByText('You have already used this coupon')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Apply FIRST100' }),
    ).toBeDisabled();
  });

  it('can be hidden again', async () => {
    fill('m6', 1);
    await render(<CartScreen />);
    await openList();
    await fireEvent.press(screen.getByRole('button', { name: 'Hide coupons' }));
    expect(screen.queryByText('FLAT50')).toBeNull();
  });
});

describe('address', () => {
  const openForm = () =>
    fireEvent.press(
      screen.getByRole('button', { name: 'Add delivery address' }),
    );
  const changeFromBar = () =>
    fireEvent.press(
      screen.getByRole('button', { name: 'Change delivery address' }),
    );
  const fillForm = async (values: Partial<typeof address> = {}) => {
    const v = { ...address, ...values };
    await fireEvent.changeText(screen.getByLabelText('Full name'), v.name);
    await fireEvent.changeText(screen.getByLabelText('Mobile number'), v.phone);
    await fireEvent.changeText(
      screen.getByLabelText('House / flat, street and area'),
      v.line1,
    );
    await fireEvent.changeText(screen.getByLabelText('Pincode'), v.pincode);
  };
  const save = () =>
    fireEvent.press(screen.getByRole('button', { name: 'Save address' }));

  it('is a collapsed prompt by default when there is no address', async () => {
    fill('m6', 2);
    await render(<CartScreen />);
    expect(screen.getByText('Add delivery address')).toBeTruthy();
    expect(screen.queryByLabelText('Full name')).toBeNull();
    expect(
      screen.getByText('Add a delivery address to place your order'),
    ).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Place order' }));
    expect(cart().lines).toHaveLength(1); // blocked
  });

  it('opens the form on tap and collapses it again on Cancel', async () => {
    fill('m6', 1);
    await render(<CartScreen />);
    await openForm();
    expect(screen.getByLabelText('Full name')).toBeTruthy();
    expect(screen.getByLabelText('Pincode')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByLabelText('Full name')).toBeNull();
    expect(screen.getByText('Add delivery address')).toBeTruthy();
  });

  it('reports every invalid field and saves nothing', async () => {
    fill('m6', 1);
    await render(<CartScreen />);
    await openForm();
    await save();
    expect(screen.getByText('Enter the receiver’s name')).toBeTruthy();
    expect(
      screen.getByText('Enter a valid 10-digit mobile number'),
    ).toBeTruthy();
    expect(screen.getByText('Enter a valid 6-digit pincode')).toBeTruthy();
    expect(useAddressStore.getState().address).toBeNull();
  });

  it('clears a field error as soon as that field is edited', async () => {
    fill('m6', 1);
    await render(<CartScreen />);
    await openForm();
    await save();
    await fireEvent.changeText(screen.getByLabelText('Pincode'), '5');
    expect(screen.queryByText('Enter a valid 6-digit pincode')).toBeNull();
    expect(
      screen.getByText('Enter a valid 10-digit mobile number'),
    ).toBeTruthy();
  });

  it('once saved, hides the card, shows a one-line summary in the bar and unlocks ordering', async () => {
    fill('m6', 2);
    await render(<CartScreen />);
    await openForm();
    await fillForm({ name: '  Aamir Rahman ' });
    await save();

    expect(useAddressStore.getState().address).toEqual(address);
    expect(screen.queryByLabelText('Full name')).toBeNull();
    expect(screen.queryByText('Add delivery address')).toBeNull();
    expect(
      screen.getByLabelText('Delivering to Aamir Rahman, 560038'),
    ).toBeTruthy();
    expect(
      screen.queryByText('Add a delivery address to place your order'),
    ).toBeNull();
    expect(screen.getByRole('button', { name: 'Place order' })).toBeEnabled();
  });

  it('shows no address card at all when one is already saved', async () => {
    fill('m6', 1);
    useAddressStore.setState({ address });
    await render(<CartScreen />);
    expect(screen.queryByText('Add delivery address')).toBeNull();
    expect(screen.queryByLabelText('Full name')).toBeNull();
    expect(
      screen.getByLabelText('Delivering to Aamir Rahman, 560038'),
    ).toBeTruthy();
  });

  it('Change opens the form prefilled and blocks ordering until it is saved or cancelled', async () => {
    fill('m6', 1);
    useAddressStore.setState({ address });
    await render(<CartScreen />);

    await changeFromBar();
    expect(screen.getByLabelText('Full name').props.value).toBe('Aamir Rahman');
    expect(
      screen.getByText('Save or cancel your address changes first'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Place order' })).toBeDisabled();

    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByLabelText('Full name')).toBeNull();
    expect(screen.getByRole('button', { name: 'Place order' })).toBeEnabled();
  });

  it('Cancel keeps the old address and discards edits', async () => {
    fill('m6', 1);
    useAddressStore.setState({ address });
    await render(<CartScreen />);
    await changeFromBar();
    await fireEvent.changeText(
      screen.getByLabelText('Full name'),
      'Someone Else',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(useAddressStore.getState().address?.name).toBe('Aamir Rahman');

    await changeFromBar();
    expect(screen.getByLabelText('Full name').props.value).toBe('Aamir Rahman');
  });

  it('saves an edited address and the bar reflects it', async () => {
    fill('m6', 1);
    useAddressStore.setState({ address });
    await render(<CartScreen />);
    await changeFromBar();
    await fireEvent.changeText(
      screen.getByLabelText('Full name'),
      'Someone Else',
    );
    await save();
    expect(useAddressStore.getState().address?.name).toBe('Someone Else');
    expect(
      screen.getByLabelText('Delivering to Someone Else, 560038'),
    ).toBeTruthy();
  });

  it('survives an app launch: a saved address is restored from storage and not asked for again', async () => {
    fill('m6', 1);
    const first = await render(<CartScreen />);
    await openForm();
    await fillForm();
    await save();
    await first.unmount();

    // Simulate a new process: keep only what reached storage, wipe memory, reload.
    const saved = await AsyncStorage.getItem(ADDRESS_STORAGE_KEY);
    expect(saved).not.toBeNull();
    useAddressStore.setState({ address: null });
    await AsyncStorage.setItem(ADDRESS_STORAGE_KEY, saved ?? '');
    await useAddressStore.persist.rehydrate();

    await render(<CartScreen />);
    expect(screen.queryByText('Add delivery address')).toBeNull();
    expect(screen.queryByLabelText('Full name')).toBeNull();
    expect(
      screen.getByLabelText('Delivering to Aamir Rahman, 560038'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Place order' })).toBeEnabled();
  });
});

describe('placing the order', () => {
  it('clears the cart, marks FIRST100 used and goes to the confirmation', async () => {
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
