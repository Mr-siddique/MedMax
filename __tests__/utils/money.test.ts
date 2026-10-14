import { formatRupees } from '../../src/utils/money';

describe('formatRupees', () => {
  it.each([
    [0, '₹0'],
    [40, '₹40'],
    [499, '₹499'],
    [1000, '₹1,000'],
    [12345, '₹12,345'],
    [123456, '₹1,23,456'],
    [1234567, '₹12,34,567'],
    [-50, '-₹50'],
  ])('%d -> %s', (input, expected) => {
    expect(formatRupees(input)).toBe(expected);
  });
});
