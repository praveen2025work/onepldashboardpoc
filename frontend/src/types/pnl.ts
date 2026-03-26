export interface PnlRow {
  NamedPnlName: string;
  NamedPnLID: string;
  MasterBookID: string;
  MasterBookName: string;
  MSBk_ID: string;
  FeedName: string;
  Region: string;
  SYEY_ID: string;
  Avg_CompletedOnTime: string;
  Max_CompletedOnTime: string;
  Min_CompletedOnTime: string;
  Avg_DelTimePCLocationTime: string;
  Max_DelTimePCLocationTime: string;
  Min_DelTimePCLocationTime: string;
  DurationAvg: number;
  DurationMax: number;
  DurationMin: number;
  flagged: boolean;
}

export interface RegionStats {
  total: number;
  flagged: number;
}

export interface FeedStats {
  total: number;
  flagged: number;
  avg_duration: number;
}

export interface SummaryResponse {
  total_records: number;
  filtered_records: number;
  sla_breaches: number;
  breach_percentage: number;
  avg_duration_hours: number;
  unique_npls: number;
  unique_master_books: number;
  by_region: Record<string, RegionStats>;
  by_feed: Record<string, FeedStats>;
}

export interface DataResponse {
  data: PnlRow[];
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
}

export interface FeedDetail {
  feed_name: string;
  bofc_avg: string;
  delivery_avg: string;
  duration_avg: number;
  flagged: boolean;
}

export interface MasterBookDetail {
  id: string;
  name: string;
  has_breach: boolean;
  feeds: FeedDetail[];
}

export interface LineageResponse {
  npl_name: string;
  npl_id: string;
  has_breach: boolean;
  master_books: MasterBookDetail[];
}

export interface FiltersResponse {
  regions: string[];
  feeds: string[];
  npl_names: string[];
}

export interface Filters {
  region: string;
  feed: string;
  npl: string;
  flaggedOnly: boolean;
  search: string;
  durMin: number;
  durMax: number;
}
