import { Medicine } from './types';

/** Case-insensitive substring match on name or salt. Blank query matches nothing. */
export function filterMedicines(
  catalog: readonly Medicine[],
  query: string,
): Medicine[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return [];
  }
  return catalog.filter(
    medicine =>
      medicine.name.toLowerCase().includes(needle) ||
      medicine.salt.toLowerCase().includes(needle),
  );
}
