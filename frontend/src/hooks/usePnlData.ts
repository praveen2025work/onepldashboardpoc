import { useState, useEffect, useCallback, useRef } from 'react';
import type { Filters, SummaryResponse, DataResponse, LineageResponse, FiltersResponse } from '../types/pnl';
import { fetchSummary, fetchData, fetchLineage, fetchFilters } from '../api/client';

export function usePnlData(filters: Filters) {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [dataResp, setDataResp] = useState<DataResponse | null>(null);
  const [lineage, setLineage] = useState<LineageResponse | null>(null);
  const [filterOptions, setFilterOptions] = useState<FiltersResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('DurationAvg');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedNpl, setSelectedNpl] = useState('');

  // Serialize filters to detect actual value changes (avoid object ref issues)
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    setError('');
    fetchFilters()
      .then(setFilterOptions)
      .catch(e => { console.error('fetchFilters failed:', e); setError(`Filters: ${e.message}`); });
  }, []);

  useEffect(() => {
    setError('');
    fetchSummary(filters)
      .then(setSummary)
      .catch(e => { console.error('fetchSummary failed:', e); setError(`Summary: ${e.message}`); });
  }, [filtersKey]);

  useEffect(() => {
    setPage(1);
  }, [filtersKey]);

  useEffect(() => {
    fetchData(filters, page, 15, sortBy, sortDir)
      .then(setDataResp)
      .catch(e => { console.error('fetchData failed:', e); setError(`Data: ${e.message}`); });
  }, [filtersKey, page, sortBy, sortDir]);

  useEffect(() => {
    if (selectedNpl) {
      fetchLineage(selectedNpl)
        .then(setLineage)
        .catch(e => { console.error('fetchLineage failed:', e); setError(`Lineage: ${e.message}`); });
    } else {
      setLineage(null);
    }
  }, [selectedNpl]);

  const handleSort = useCallback((col: string) => {
    setSortBy(prev => {
      if (prev === col) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        return col;
      }
      setSortDir('desc');
      return col;
    });
  }, []);

  return {
    summary, dataResp, lineage, filterOptions, error,
    page, setPage, sortBy, sortDir, handleSort,
    selectedNpl, setSelectedNpl,
  };
}
