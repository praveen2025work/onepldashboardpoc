import logging
import math
from typing import Optional
from urllib.parse import unquote

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from models import (
    DataResponse,
    FiltersResponse,
    HealthResponse,
    LineageResponse,
    SummaryResponse,
)
from services.csv_loader import load_csv, get_row_count
from services.filters import apply_filters
from services.lineage import build_lineage

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
def startup():
    df = load_csv()
    logger.info("Startup complete. Loaded %d rows.", len(df))


@app.get("/api/health", response_model=HealthResponse)
def health():
    return {"status": "ok", "rows": get_row_count()}


@app.get("/api/pnl/summary", response_model=SummaryResponse)
def pnl_summary(
    region: Optional[str] = None,
    feed: Optional[str] = None,
    npl: Optional[str] = None,
    flagged_only: bool = False,
    search: Optional[str] = None,
):
    df = load_csv()
    total_records = len(df)
    filtered = apply_filters(df, region, feed, npl, flagged_only, search)
    filtered_count = len(filtered)
    sla_breaches = int(filtered["flagged"].sum())
    breach_pct = round((sla_breaches / filtered_count * 100), 1) if filtered_count > 0 else 0.0
    avg_dur = round(float(filtered["DurationAvg"].mean()), 2) if filtered_count > 0 else 0.0

    by_region = {}
    for r, grp in filtered.groupby("Region"):
        by_region[r] = {"total": len(grp), "flagged": int(grp["flagged"].sum())}

    by_feed = {}
    for f, grp in filtered.groupby("FeedName"):
        by_feed[f] = {
            "total": len(grp),
            "flagged": int(grp["flagged"].sum()),
            "avg_duration": round(float(grp["DurationAvg"].mean()), 2),
        }

    return {
        "total_records": total_records,
        "filtered_records": filtered_count,
        "sla_breaches": sla_breaches,
        "breach_percentage": breach_pct,
        "avg_duration_hours": avg_dur,
        "unique_npls": filtered["NamedPnlName"].nunique(),
        "unique_master_books": filtered["MasterBookID"].nunique(),
        "by_region": by_region,
        "by_feed": by_feed,
    }


@app.get("/api/pnl/data", response_model=DataResponse)
def pnl_data(
    region: Optional[str] = None,
    feed: Optional[str] = None,
    npl: Optional[str] = None,
    flagged_only: bool = False,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    sort_by: str = "DurationAvg",
    sort_dir: str = "desc",
):
    df = load_csv()
    filtered = apply_filters(df, region, feed, npl, flagged_only, search)

    if sort_by in filtered.columns:
        ascending = sort_dir == "asc"
        filtered = filtered.sort_values(by=sort_by, ascending=ascending, na_position="last")

    total_records = len(filtered)
    total_pages = max(1, math.ceil(total_records / page_size))
    start = (page - 1) * page_size
    end = start + page_size
    page_data = filtered.iloc[start:end]

    rows = []
    for _, row in page_data.iterrows():
        rows.append({
            "NamedPnlName": row["NamedPnlName"],
            "NamedPnLID": row["NamedPnLID"],
            "MasterBookID": row["MasterBookID"],
            "MasterBookName": row["MasterBookName"],
            "MSBk_ID": row["MSBk_ID"],
            "FeedName": row["FeedName"],
            "Region": row["Region"],
            "SYEY_ID": row["SYEY_ID"],
            "Avg_CompletedOnTime": row["Avg_CompletedOnTime"],
            "Max_CompletedOnTime": row["Max_CompletedOnTime"],
            "Min_CompletedOnTime": row["Min_CompletedOnTime"],
            "Avg_DelTimePCLocationTime": row["Avg_DelTimePCLocationTime"],
            "Max_DelTimePCLocationTime": row["Max_DelTimePCLocationTime"],
            "Min_DelTimePCLocationTime": row["Min_DelTimePCLocationTime"],
            "DurationAvg": round(float(row["DurationAvg"]), 2),
            "DurationMax": round(float(row["DurationMax"]), 2),
            "DurationMin": round(float(row["DurationMin"]), 2),
            "flagged": bool(row["flagged"]),
        })

    return {
        "data": rows,
        "page": page,
        "page_size": page_size,
        "total_records": total_records,
        "total_pages": total_pages,
    }


@app.get("/api/pnl/lineage/{npl_name}", response_model=LineageResponse)
def pnl_lineage(npl_name: str):
    decoded = unquote(npl_name)
    df = load_csv()
    return build_lineage(df, decoded)


@app.get("/api/pnl/filters", response_model=FiltersResponse)
def pnl_filters():
    df = load_csv()
    return {
        "regions": sorted(df["Region"].unique().tolist()),
        "feeds": sorted(df["FeedName"].unique().tolist()),
        "npl_names": sorted(df["NamedPnlName"].unique().tolist()),
    }
