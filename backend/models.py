from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    workflow_rows: int
    feed_rows: int


class MonthOption(BaseModel):
    key: str    # "2026-02" — used for filtering
    label: str  # "Feb 2026" — display in UI


class FiltersResponse(BaseModel):
    months: list[MonthOption]
    business_areas: list[str]
    named_pnls: list[str]


class BusinessAreaCard(BaseModel):
    area_name: str
    total_npls: int
    on_time_count: int
    on_time_pct: float
    status: str  # "green" | "amber" | "red"


class OverviewResponse(BaseModel):
    cards: list[BusinessAreaCard]


class NplSummaryRow(BaseModel):
    npl_id: str
    npl_name: str
    business_area: str
    on_time_pct: float
    status: str  # "green" | "amber" | "red"
    total_dates: int


class AreaDrilldownResponse(BaseModel):
    area_name: str
    npls: list[NplSummaryRow]


class TimestampPoint(BaseModel):
    business_date: str
    bofc_time: str
    manual_time: str
    delivery_time: str


class DurationPoint(BaseModel):
    business_date: str
    bofc_to_manual: float
    manual_to_pc: float
    bofc_to_pc: float


class NplDetailResponse(BaseModel):
    npl_id: str
    npl_name: str
    business_area: str
    timestamps: list[TimestampPoint]
    durations: list[DurationPoint]


class FeedLineageRow(BaseModel):
    business_date: str
    feed_name: str
    master_book_id: str
    master_book_name: str
    ola_time: str
    arrived_time: str
    delayed: bool


class FeedLineageResponse(BaseModel):
    npl_id: str
    npl_name: str
    feeds: list[FeedLineageRow]
