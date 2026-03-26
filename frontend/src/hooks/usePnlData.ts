import { useState, useEffect, useCallback } from 'react';
import type { Filters, SummaryResponse, DataResponse, LineageResponse, FiltersResponse } from '../types/pnl';
import { fetchSummary, fetchData, fetchLineage, fetchFilters } from '../api/client';

export function usePnlData(filters: Filters) {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [dataResp, setDataResp] = useState<DataResponse | null>(null);
  const [lineage, setLineage] = useState<LineageResponse | null>(null);
  const [filterOptions, setFilterOptions] = useState<FiltersResponse | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('DurationAvg');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedNpl, setSelectedNpl] = useState('');

  useEffect(() => {
    fetchFilters().then(setFilterOptions).catch(console.error);
  }, []);

  useEffect(() => {
    fetchSummary(filters).then(setSummary).catch(console.error);
  }, [filters]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    fetchData(filters, page, 15, sortBy, sortDir).then(setDataResp).catch(console.error);
  }, [filters, page, sortBy, sortDir]);

  useEffect(() => {
    if (selectedNpl) {
      fetchLineage(selectedNpl).then(setLineage).catch(console.error);
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
    summary, dataResp, lineage, filterOptions,
    page, setPage, sortBy, sortDir, handleSort,
    selectedNpl, setSelectedNpl,
  };
}
