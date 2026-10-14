import {
  addOne,
  getQty,
  removeLine,
  removeOne,
  resolveLines,
  totalQty,
} from '../../src/domain/cart';
import { CartLine, Medicine } from '../../src/domain/types';

const med = (id: string, maxQty: number): Medicine => ({
  id,
  name: id,
  salt: 'salt',
  price: 10,
  maxQty,
  rx: false,
});

describe('cart', () => {
  it('adds a new line at qty 1', () => {
    expect(addOne([], med('a', 3))).toEqual([{ id: 'a', qty: 1 }]);
  });

  it('increments an existing line without touching others', () => {
    const lines: CartLine[] = [
      { id: 'a', qty: 1 },
      { id: 'b', qty: 2 },
    ];
    expect(addOne(lines, med('a', 3))).toEqual([
      { id: 'a', qty: 2 },
      { id: 'b', qty: 2 },
    ]);
  });

  it('never exceeds maxQty and returns the same array when capped', () => {
    const lines: CartLine[] = [{ id: 'a', qty: 3 }];
    expect(addOne(lines, med('a', 3))).toBe(lines);
  });

  it('caps a maxQty of 1 on the first add', () => {
    const once = addOne([], med('a', 1));
    expect(addOne(once, med('a', 1))).toBe(once);
  });

  it('does not mutate its input', () => {
    const lines: CartLine[] = [{ id: 'a', qty: 1 }];
    addOne(lines, med('a', 3));
    removeOne(lines, 'a');
    expect(lines).toEqual([{ id: 'a', qty: 1 }]);
  });

  it('decrements, and removes the line at zero', () => {
    const lines: CartLine[] = [{ id: 'a', qty: 2 }];
    const once = removeOne(lines, 'a');
    expect(once).toEqual([{ id: 'a', qty: 1 }]);
    expect(removeOne(once, 'a')).toEqual([]);
  });

  it('ignores decrement of an unknown id', () => {
    const lines: CartLine[] = [{ id: 'a', qty: 2 }];
    expect(removeOne(lines, 'zzz')).toEqual(lines);
  });

  it('removes a whole line', () => {
    const lines: CartLine[] = [
      { id: 'a', qty: 2 },
      { id: 'b', qty: 1 },
    ];
    expect(removeLine(lines, 'a')).toEqual([{ id: 'b', qty: 1 }]);
  });

  it('reads quantities and totals', () => {
    const lines: CartLine[] = [
      { id: 'a', qty: 2 },
      { id: 'b', qty: 3 },
    ];
    expect(getQty(lines, 'b')).toBe(3);
    expect(getQty(lines, 'x')).toBe(0);
    expect(totalQty(lines)).toBe(5);
  });

  it('resolves lines against the catalog and drops unknown ids', () => {
    const known = med('a', 3);
    const resolved = resolveLines(
      [
        { id: 'a', qty: 2 },
        { id: 'gone', qty: 1 },
      ],
      id => (id === 'a' ? known : undefined),
    );
    expect(resolved).toEqual([{ medicine: known, qty: 2 }]);
  });
});
