export interface MonthOption {
  key: string;    // "2026-02" — used for API filtering
  label: string;  // "Feb 2026" — display in UI
}

export interface FiltersResponse {
  months: MonthOption[];
  business_areas: string[];
  named_pnls: string[];
}

export interface BusinessAreaCard {
  area_name: string;
  total_npls: number;
  on_time_count: number;
  on_time_pct: number;
  status: "green" | "amber" | "red";
}

export interface OverviewResponse {
  cards: BusinessAreaCard[];
}

export interface NplSummaryRow {
  npl_id: string;
  npl_name: string;
  business_area: string;
  on_time_pct: number;
  status: "green" | "amber" | "red";
  total_dates: number;
}

export interface AreaDrilldownResponse {
  area_name: string;
  npls: NplSummaryRow[];
}

export interface TimestampPoint {
  business_date: string;
  bofc_time: string;
  manual_time: string;
  delivery_time: string;
}

export interface DurationPoint {
  business_date: string;
  bofc_to_manual: number;
  manual_to_pc: number;
  bofc_to_pc: number;
}

export interface NplDetailResponse {
  npl_id: string;
  npl_name: string;
  business_area: string;
  timestamps: TimestampPoint[];
  durations: DurationPoint[];
}

export interface FeedLineageRow {
  business_date: string;
  feed_name: string;
  master_book_id: string;
  master_book_name: string;
  ola_time: string;
  arrived_time: string;
  delayed: boolean;
}

export interface FeedLineageResponse {
  npl_id: string;
  npl_name: string;
  feeds: FeedLineageRow[];
}

export interface DashboardFilters {
  month: string;
  areas: string[];
}
