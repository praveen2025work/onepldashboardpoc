import { useState, useCallback } from 'react';
import type { Filters } from '../types/pnl';

export const DUR_RANGE_MIN = 0;
export const DUR_RANGE_MAX = 24;

const defaultFilters: Filters = {
  region: '',
  feed: '',
  npl: '',
  flaggedOnly: false,
  search: '',
  durMin: DUR_RANGE_MIN,
  durMax: DUR_RANGE_MAX,
};

export function useFilters() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const setRegion = useCallback((v: string) => setFilters(f => ({ ...f, region: v })), []);
  const setFeed = useCallback((v: string) => setFilters(f => ({ ...f, feed: v })), []);
  const setNpl = useCallback((v: string) => setFilters(f => ({ ...f, npl: v })), []);
  const setFlaggedOnly = useCallback((v: boolean) => setFilters(f => ({ ...f, flaggedOnly: v })), []);
  const setSearch = useCallback((v: string) => setFilters(f => ({ ...f, search: v })), []);
  const setDurRange = useCallback((min: number, max: number) => setFilters(f => ({ ...f, durMin: min, durMax: max })), []);

  return { filters, setRegion, setFeed, setNpl, setFlaggedOnly, setSearch, setDurRange };
}
