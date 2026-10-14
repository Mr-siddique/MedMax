import {
  combineLocationStatuses,
  normalizeStatus,
  resolveStatus,
} from '../../src/services/permissionStatus';

describe('normalizeStatus', () => {
  it.each([
    ['granted', 'granted'],
    ['limited', 'granted'],
    ['denied', 'denied'],
    ['blocked', 'blocked'],
    ['unavailable', 'unavailable'],
  ] as const)('%s -> %s', (input, expected) => {
    expect(normalizeStatus(input)).toBe(expected);
  });
});

describe('combineLocationStatuses', () => {
  it('is granted when either fine or coarse is granted (approximate location)', () => {
    expect(combineLocationStatuses(['denied', 'granted'])).toBe('granted');
    expect(combineLocationStatuses(['blocked', 'granted'])).toBe('granted');
  });

  it('is blocked only when every permission is blocked', () => {
    expect(combineLocationStatuses(['blocked', 'blocked'])).toBe('blocked');
    expect(combineLocationStatuses(['blocked', 'denied'])).toBe('denied');
  });

  it('is denied when still askable', () => {
    expect(combineLocationStatuses(['denied', 'denied'])).toBe('denied');
  });

  it('is unavailable when the device has none of them', () => {
    expect(combineLocationStatuses(['unavailable', 'unavailable'])).toBe(
      'unavailable',
    );
  });
});

describe('resolveStatus', () => {
  it('keeps denied as denied without a hint', () => {
    expect(resolveStatus('denied', false)).toEqual({
      status: 'denied',
      blocked: false,
    });
  });

  it('upgrades denied to blocked when we saw a block earlier', () => {
    expect(resolveStatus('denied', true)).toEqual({
      status: 'blocked',
      blocked: true,
    });
  });

  it('records a blocked result', () => {
    expect(resolveStatus('blocked', false)).toEqual({
      status: 'blocked',
      blocked: true,
    });
  });

  it('clears the hint once granted (fixed in Settings)', () => {
    expect(resolveStatus('granted', true)).toEqual({
      status: 'granted',
      blocked: false,
    });
  });
});
