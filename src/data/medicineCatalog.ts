import rawCatalog from './catalog.json';
import { Medicine } from '../domain/types';
import { isRecord } from '../utils/guards';

function isInteger(value: unknown, min: number): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= min;
}

function isMedicine(value: unknown): value is Medicine {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.salt === 'string' &&
    isInteger(value.price, 0) &&
    isInteger(value.maxQty, 1) &&
    typeof value.rx === 'boolean'
  );
}

/**
 * The catalog is a shipped asset, so a malformed entry is a programmer error:
 * fail loudly here rather than render a half-broken app.
 */
export function parseCatalog(raw: unknown): Medicine[] {
  if (!Array.isArray(raw)) {
    throw new Error('catalog.json must be an array');
  }
  const ids = new Set<string>();
  return raw.map((entry, index) => {
    if (!isMedicine(entry)) {
      throw new Error(`catalog.json: invalid entry at index ${index}`);
    }
    if (ids.has(entry.id)) {
      throw new Error(`catalog.json: duplicate id "${entry.id}"`);
    }
    ids.add(entry.id);
    return entry;
  });
}

export const catalog: readonly Medicine[] = parseCatalog(rawCatalog);

const byId = new Map(catalog.map(medicine => [medicine.id, medicine]));

export function getMedicine(id: string): Medicine | undefined {
  return byId.get(id);
}
