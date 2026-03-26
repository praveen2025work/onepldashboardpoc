import { useState, useCallback } from 'react';
import type { Filters } from '../types/pnl';

const defaultFilters: Filters = {
  region: '',
  feed: '',
  npl: '',
  flaggedOnly: false,
  search: '',
};

export function useFilters() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const setRegion = useCallback((v: string) => setFilters(f => ({ ...f, region: v })), []);
  const setFeed = useCallback((v: string) => setFilters(f => ({ ...f, feed: v })), []);
  const setNpl = useCallback((v: string) => setFilters(f => ({ ...f, npl: v })), []);
  const setFlaggedOnly = useCallback((v: boolean) => setFilters(f => ({ ...f, flaggedOnly: v })), []);
  const setSearch = useCallback((v: string) => setFilters(f => ({ ...f, search: v })), []);

  return { filters, setRegion, setFeed, setNpl, setFlaggedOnly, setSearch };
}
