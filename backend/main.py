import logging
from typing import Optional
from urllib.parse import unquote

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from models import (
    AreaDrilldownResponse,
    FeedLineageResponse,
    FiltersResponse,
    HealthResponse,
    NplDetailResponse,
    OverviewResponse,
)
from services.csv_loader import get_row_counts, load_workflow, load_feed
from services.filters import get_filter_options
from services.workflow import get_overview, get_area_drilldown, get_npl_detail
from services.feed_lineage import get_feed_lineage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pnl_dashboard")

app = FastAPI(title="P&L Lineage Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    wf = load_workflow()
    feed = load_feed()
    logger.info("Startup complete. Workflow: %d rows, Feed: %d rows.", len(wf), len(feed))


@app.get("/api/health", response_model=HealthResponse)
def health() -> dict:
    wf_count, feed_count = get_row_counts()
    return {"status": "ok", "workflow_rows": wf_count, "feed_rows": feed_count}


@app.get("/api/filters", response_model=FiltersResponse)
def filters() -> dict:
    return get_filter_options()


@app.get("/api/overview", response_model=OverviewResponse)
def overview(
    month: str = Query("Feb"),
    areas: Optional[str] = None,
) -> dict:
    area_list = [a.strip() for a in areas.split(",")] if areas else None
    cards = get_overview(month, area_list)
    return {"cards": cards}


@app.get("/api/area/{area_name}", response_model=AreaDrilldownResponse)
def area_drilldown(area_name: str, month: str = Query("Feb")) -> dict:
    decoded = unquote(area_name)
    return get_area_drilldown(month, decoded)


@app.get("/api/npl/{npl_id}", response_model=NplDetailResponse)
def npl_detail(npl_id: str, month: str = Query("Feb")) -> dict:
    return get_npl_detail(month, npl_id)


@app.get("/api/npl/{npl_id}/feeds", response_model=FeedLineageResponse)
def npl_feeds(npl_id: str, month: str = Query("Feb")) -> dict:
    return get_feed_lineage(month, npl_id)
