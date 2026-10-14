import { catalog } from '../../src/data/medicineCatalog';
import { filterMedicines } from '../../src/domain/search';

const ids = (query: string) =>
  filterMedicines(catalog, query).map(medicine => medicine.id);

describe('filterMedicines', () => {
  it('matches on name, case-insensitively', () => {
    expect(ids('DOLO')).toEqual(['m1']);
  });

  it('matches on salt', () => {
    expect(ids('azithromycin')).toEqual(['m3']);
  });

  it('matches several items sharing a salt', () => {
    expect(ids('paracetamol')).toEqual(['m1', 'm2', 'm7', 'm12', 'm16', 'm18']);
  });

  it('matches substrings and trims the query', () => {
    expect(ids('  vapo ')).toEqual(['m13']);
  });

  it('returns nothing for a blank query', () => {
    expect(ids('')).toEqual([]);
    expect(ids('   ')).toEqual([]);
  });

  it('returns nothing when nothing matches', () => {
    expect(ids('zzzz')).toEqual([]);
  });
});
