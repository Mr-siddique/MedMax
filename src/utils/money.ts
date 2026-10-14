/** Formats whole rupees with Indian digit grouping, e.g. 1234567 -> "₹12,34,567". */
export function formatRupees(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const digits = String(Math.abs(Math.round(amount)));
  const lastThree = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const grouped =
    rest === '' ? '' : `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},`;
  return `${sign}₹${grouped}${lastThree}`;
}
