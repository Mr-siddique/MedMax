import { CartLine, Medicine, ResolvedLine } from './types';

export function getQty(lines: readonly CartLine[], id: string): number {
  return lines.find(line => line.id === id)?.qty ?? 0;
}

/**
 * Adds one unit, or inserts the line at qty 1. Returns the same array
 * instance when the item is already at maxQty so callers can detect a no-op.
 */
export function addOne(
  lines: readonly CartLine[],
  medicine: Medicine,
): readonly CartLine[] {
  const qty = getQty(lines, medicine.id);
  if (qty >= medicine.maxQty) {
    return lines;
  }
  if (qty === 0) {
    return [...lines, { id: medicine.id, qty: 1 }];
  }
  return lines.map(line =>
    line.id === medicine.id ? { ...line, qty: qty + 1 } : line,
  );
}

/** Removes one unit; the line disappears when it reaches zero. */
export function removeOne(
  lines: readonly CartLine[],
  id: string,
): readonly CartLine[] {
  return lines.flatMap(line => {
    if (line.id !== id) {
      return [line];
    }
    return line.qty > 1 ? [{ ...line, qty: line.qty - 1 }] : [];
  });
}

export function removeLine(
  lines: readonly CartLine[],
  id: string,
): readonly CartLine[] {
  return lines.filter(line => line.id !== id);
}

export function totalQty(lines: readonly CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.qty, 0);
}

/** Joins lines with catalog data, dropping ids the catalog no longer knows. */
export function resolveLines(
  lines: readonly CartLine[],
  getMedicine: (id: string) => Medicine | undefined,
): ResolvedLine[] {
  return lines.flatMap(line => {
    const medicine = getMedicine(line.id);
    return medicine ? [{ medicine, qty: line.qty }] : [];
  });
}
