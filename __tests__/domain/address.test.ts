import { validateAddress } from '../../src/domain/address';

const valid = {
  name: 'Aamir Rahman',
  phone: '9876543210',
  line1: '12, MG Road, Indiranagar',
  pincode: '560038',
};

describe('validateAddress', () => {
  it('accepts a good address and trims it', () => {
    const result = validateAddress({
      ...valid,
      name: '  Aamir Rahman ',
      pincode: ' 560038 ',
    });
    expect(result).toEqual({ valid: true, address: valid });
  });

  it.each([
    ['phone', { phone: '12345' }],
    ['phone', { phone: '5876543210' }],
    ['phone', { phone: '98765432101' }],
    ['phone', { phone: '98765abcde' }],
    ['pincode', { pincode: '56003' }],
    ['pincode', { pincode: '060038' }],
    ['name', { name: ' a ' }],
    ['line1', { line1: '12' }],
  ])('rejects a bad %s', (field, patch) => {
    const result = validateAddress({ ...valid, ...patch });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(Object.keys(result.errors)).toEqual([field]);
    }
  });

  it('reports every bad field at once', () => {
    const result = validateAddress({
      name: '',
      phone: '',
      line1: '',
      pincode: '',
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(Object.keys(result.errors).sort()).toEqual([
        'line1',
        'name',
        'phone',
        'pincode',
      ]);
    }
  });
});
