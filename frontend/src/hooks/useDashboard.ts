import { useState, useEffect, useCallback } from 'react';
import type {
  FiltersResponse,
  OverviewResponse,
  AreaDrilldownResponse,
  NplDetailResponse,
  FeedLineageResponse,
} from '../types/pnl';
import {
  fetchFilters,
  fetchOverview,
  fetchAreaDrilldown,
  fetchNplDetail,
  fetchNplFeeds,
} from '../api/client';

export type ViewLevel = 'overview' | 'area-drilldown' | 'npl-detail';

interface DashboardState {
  filterOptions: FiltersResponse | null;
  selectedMonth: string;
  selectedAreas: string[];
  overview: OverviewResponse | null;
  selectedArea: string | null;
  drilldown: AreaDrilldownResponse | null;
  selectedNplId: string | null;
  selectedNplName: string | null;
  nplDetail: NplDetailResponse | null;
  nplFeeds: FeedLineageResponse | null;
  activeTab: 'timestamps' | 'durations' | 'feeds';
  viewLevel: ViewLevel;
  loading: boolean;
  error: string;
}

export function useDashboard() {
  const [state, setState] = useState<DashboardState>({
    filterOptions: null,
    selectedMonth: '',
    selectedAreas: [],
    overview: null,
    selectedArea: null,
    drilldown: null,
    selectedNplId: null,
    selectedNplName: null,
    nplDetail: null,
    nplFeeds: null,
    activeTab: 'durations',
    viewLevel: 'overview',
    loading: false,
    error: '',
  });

  // Load filter options once
  useEffect(() => {
    fetchFilters()
      .then(fo => setState(s => ({
        ...s,
        filterOptions: fo,
        selectedMonth: fo.months.length > 0 ? fo.months[fo.months.length - 1].key : '',
      })))
      .catch(e => setState(s => ({ ...s, error: `Filters: ${e.message}` })));
  }, []);

  // Fetch overview when month or areas change
  useEffect(() => {
    if (!state.selectedMonth) return;
    setState(s => ({ ...s, loading: true, error: '' }));
    fetchOverview(
      state.selectedMonth,
      state.selectedAreas.length > 0 ? state.selectedAreas : undefined,
    )
      .then(ov => setState(s => ({ ...s, overview: ov, loading: false })))
      .catch(e => setState(s => ({ ...s, error: `Overview: ${e.message}`, loading: false })));
  }, [state.selectedMonth, state.selectedAreas.join(',')]);

  // Fetch drilldown when area selected
  useEffect(() => {
    if (!state.selectedArea) return;
    setState(s => ({ ...s, loading: true, error: '' }));
    fetchAreaDrilldown(state.selectedArea, state.selectedMonth)
      .then(dd => setState(s => ({ ...s, drilldown: dd, loading: false })))
      .catch(e => setState(s => ({ ...s, error: `Drilldown: ${e.message}`, loading: false })));
  }, [state.selectedArea, state.selectedMonth]);

  // Fetch NPL detail when NPL selected
  useEffect(() => {
    if (!state.selectedNplId) return;
    setState(s => ({ ...s, loading: true, error: '' }));
    Promise.all([
      fetchNplDetail(state.selectedNplId, state.selectedMonth),
      fetchNplFeeds(state.selectedNplId, state.selectedMonth),
    ])
      .then(([detail, feeds]) => setState(s => ({
        ...s,
        nplDetail: detail,
        nplFeeds: feeds,
        loading: false,
      })))
      .catch(e => setState(s => ({ ...s, error: `NPL Detail: ${e.message}`, loading: false })));
  }, [state.selectedNplId, state.selectedMonth]);

  // Actions
  const setMonth = useCallback((month: string) => {
    setState(s => ({
      ...s,
      selectedMonth: month,
      selectedArea: null,
      drilldown: null,
      selectedNplId: null,
      selectedNplName: null,
      nplDetail: null,
      nplFeeds: null,
      viewLevel: 'overview',
    }));
  }, []);

  const setAreas = useCallback((areas: string[]) => {
    setState(s => ({ ...s, selectedAreas: areas }));
  }, []);

  const selectArea = useCallback((area: string) => {
    setState(s => ({
      ...s,
      selectedArea: area,
      selectedNplId: null,
      selectedNplName: null,
      nplDetail: null,
      nplFeeds: null,
      viewLevel: 'area-drilldown',
    }));
  }, []);

  const selectNpl = useCallback((nplId: string, nplName: string) => {
    setState(s => ({
      ...s,
      selectedNplId: nplId,
      selectedNplName: nplName,
      nplDetail: null,
      nplFeeds: null,
      activeTab: 'durations',
      viewLevel: 'npl-detail',
    }));
  }, []);

  const setActiveTab = useCallback((tab: 'timestamps' | 'durations' | 'feeds') => {
    setState(s => ({ ...s, activeTab: tab }));
  }, []);

  const goBack = useCallback(() => {
    setState(s => {
      if (s.viewLevel === 'npl-detail') {
        return {
          ...s,
          selectedNplId: null,
          selectedNplName: null,
          nplDetail: null,
          nplFeeds: null,
          viewLevel: 'area-drilldown',
        };
      }
      if (s.viewLevel === 'area-drilldown') {
        return {
          ...s,
          selectedArea: null,
          drilldown: null,
          viewLevel: 'overview',
        };
      }
      return s;
    });
  }, []);

  return {
    ...state,
    setMonth,
    setAreas,
    selectArea,
    selectNpl,
    setActiveTab,
    goBack,
  };
}
