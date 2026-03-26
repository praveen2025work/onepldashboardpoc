from pydantic import BaseModel, field_validator
from typing import Optional
import math


class HealthResponse(BaseModel):
    status: str
    rows: int


class RegionStats(BaseModel):
    total: int
    flagged: int


class FeedStats(BaseModel):
    total: int
    flagged: int
    avg_duration: float


class SummaryResponse(BaseModel):
    total_records: int
    filtered_records: int
    sla_breaches: int
    breach_percentage: float
    avg_duration_hours: float
    unique_npls: int
    unique_master_books: int
    by_region: dict[str, RegionStats]
    by_feed: dict[str, FeedStats]


class PnlRow(BaseModel):
    NamedPnlName: str
    NamedPnLID: str
    MasterBookID: str
    MasterBookName: str
    MSBk_ID: str
    FeedName: str
    Region: str
    SYEY_ID: str
    Avg_CompletedOnTime: str
    Max_CompletedOnTime: str
    Min_CompletedOnTime: str
    Avg_DelTimePCLocationTime: str
    Max_DelTimePCLocationTime: str
    Min_DelTimePCLocationTime: str
    DurationAvg: float
    DurationMax: float
    DurationMin: float
    flagged: bool


class DataResponse(BaseModel):
    data: list[PnlRow]
    page: int
    page_size: int
    total_records: int
    total_pages: int


class FeedDetail(BaseModel):
    feed_name: str = ""
    bofc_avg: str = ""
    delivery_avg: str = ""
    duration_avg: float = 0.0
    flagged: bool = False

    @field_validator("duration_avg", mode="before")
    @classmethod
    def sanitize_duration(cls, v: object) -> float:
        if v is None:
            return 0.0
        try:
            f = float(v)
            return 0.0 if math.isnan(f) or math.isinf(f) else round(f, 2)
        except (ValueError, TypeError):
            return 0.0


class MasterBookDetail(BaseModel):
    id: str = ""
    name: str = ""
    has_breach: bool = False
    feeds: list[FeedDetail] = []


class LineageResponse(BaseModel):
    npl_name: str = ""
    npl_id: str = ""
    has_breach: bool = False
    master_books: list[MasterBookDetail] = []


class FiltersResponse(BaseModel):
    regions: list[str]
    feeds: list[str]
    npl_names: list[str]
