import axios from 'axios';
import type { SummaryResponse, DataResponse, LineageResponse, FiltersResponse, Filters } from '../types/pnl';

const api = axios.create({ baseURL: '/api' });

function buildFilterParams(filters: Filters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.region) params.region = filters.region;
  if (filters.feed) params.feed = filters.feed;
  if (filters.npl) params.npl = filters.npl;
  if (filters.flaggedOnly) params.flagged_only = 'true';
  if (filters.search) params.search = filters.search;
  if (filters.durMin > 0) params.dur_min = String(filters.durMin);
  if (filters.durMax < 24) params.dur_max = String(filters.durMax);
  return params;
}

export async function fetchSummary(filters: Filters): Promise<SummaryResponse> {
  const { data } = await api.get('/pnl/summary', { params: buildFilterParams(filters) });
  return data;
}

export async function fetchData(
  filters: Filters,
  page: number,
  pageSize: number,
  sortBy: string,
  sortDir: string,
): Promise<DataResponse> {
  const params = {
    ...buildFilterParams(filters),
    page: String(page),
    page_size: String(pageSize),
    sort_by: sortBy,
    sort_dir: sortDir,
  };
  const { data } = await api.get('/pnl/data', { params });
  return data;
}

export async function fetchLineage(nplName: string): Promise<LineageResponse> {
  const { data } = await api.get(`/pnl/lineage/${encodeURIComponent(nplName)}`);
  return data;
}

export async function fetchFilters(): Promise<FiltersResponse> {
  const { data } = await api.get('/pnl/filters');
  return data;
}
