import axios from 'axios';
import type {
  FiltersResponse,
  OverviewResponse,
  AreaDrilldownResponse,
  NplDetailResponse,
  FeedLineageResponse,
} from '../types/pnl';

const api = axios.create({ baseURL: '/api' });

export async function fetchFilters(): Promise<FiltersResponse> {
  const { data } = await api.get('/filters');
  return data;
}

export async function fetchOverview(
  month: string,
  areas?: string[],
): Promise<OverviewResponse> {
  const params: Record<string, string> = { month };
  if (areas && areas.length > 0) {
    params.areas = areas.join(',');
  }
  const { data } = await api.get('/overview', { params });
  return data;
}

export async function fetchAreaDrilldown(
  area: string,
  month: string,
): Promise<AreaDrilldownResponse> {
  const { data } = await api.get(`/area/${encodeURIComponent(area)}`, {
    params: { month },
  });
  return data;
}

export async function fetchNplDetail(
  nplId: string,
  month: string,
): Promise<NplDetailResponse> {
  const { data } = await api.get(`/npl/${encodeURIComponent(nplId)}`, {
    params: { month },
  });
  return data;
}

export async function fetchNplFeeds(
  nplId: string,
  month: string,
): Promise<FeedLineageResponse> {
  const { data } = await api.get(`/npl/${encodeURIComponent(nplId)}/feeds`, {
    params: { month },
  });
  return data;
}
