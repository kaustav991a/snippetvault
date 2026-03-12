'use client';

import { useMemo, DependencyList } from 'react';

/**
 * A specialized useMemo for Firebase references/queries to prevent infinite loops.
 */
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
