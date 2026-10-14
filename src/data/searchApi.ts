import { filterMedicines } from '../domain/search';
import { Medicine } from '../domain/types';
import { catalog } from './catalog';

/**
 * There is no backend, so this is a stand-in with realistic latency. It keeps
 * the loading state and stale-response handling honest and gives a single place
 * to swap in a real request.
 */
export const SEARCH_LATENCY_MS = 400;

export function searchMedicines(query: string): Promise<Medicine[]> {
  return new Promise(resolve => {
    setTimeout(
      () => resolve(filterMedicines(catalog, query)),
      SEARCH_LATENCY_MS,
    );
  });
}
