import {
  catalog,
  getMedicine,
  parseCatalog,
} from '../../src/data/medicineCatalog';

const valid = {
  id: 'x1',
  name: 'X',
  salt: 'S',
  price: 10,
  maxQty: 2,
  rx: false,
};

describe('catalog', () => {
  it('loads the shipped catalog', () => {
    expect(catalog.length).toBeGreaterThan(0);
    expect(getMedicine('m1')?.name).toBe('Dolo 650');
    expect(getMedicine('nope')).toBeUndefined();
  });

  it('rejects a non-array', () => {
    expect(() => parseCatalog({})).toThrow('array');
  });

  it.each([
    ['missing field', { ...valid, salt: undefined }],
    ['fractional price', { ...valid, price: 9.5 }],
    ['zero maxQty', { ...valid, maxQty: 0 }],
    ['string rx', { ...valid, rx: 'false' }],
    ['null entry', null],
  ])('rejects %s', (_label, entry) => {
    expect(() => parseCatalog([entry])).toThrow('invalid entry');
  });

  it('rejects duplicate ids', () => {
    expect(() => parseCatalog([valid, valid])).toThrow('duplicate');
  });
});
