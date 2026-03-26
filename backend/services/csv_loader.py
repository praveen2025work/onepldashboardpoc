import logging
import os
import random

import pandas as pd

logger = logging.getLogger("pnl_dashboard")

from typing import Optional
_df: Optional[pd.DataFrame] = None

NPL_NAMES = [
    "Rates Trading NA", "FX Options EMEA", "Credit Flow APAC",
    "Equities Delta One", "Commodities Structured", "EM Rates Trading",
    "G10 FX Spot", "Securitized Products", "Repo & Financing",
    "Prime Brokerage", "Macro Trading", "Vol Trading Desk",
    "Cross Asset Solutions", "Systematic Strategies", "Flow Credit Trading",
]
FEEDS = ["Atlas", "Calypso", "Murex", "Summit", "Kondor", "Sophis", "Endur", "Findur"]
REGIONS = ["AMER", "EMEA", "APAC", "LATAM"]


def _fmt_ist(h: int, m: int, s: int) -> str:
    hr12 = h % 12 or 12
    ampm = "AM" if h < 12 else "PM"
    return f"{hr12}:{m:02d}:{s:02d} {ampm}"


def _rand_ist(base_hour: float, spread: float) -> str:
    h = int(base_hour + random.random() * spread) % 24
    m = random.randint(0, 59)
    s = random.randint(0, 59)
    return _fmt_ist(h, m, s)


def _generate_sample_csv(path: str, count: int = 500) -> pd.DataFrame:
    """Generate a sample CSV with realistic P&L data."""
    random.seed(42)
    rows = []
    npl_master_books: dict[int, list[str]] = {}

    for i in range(count):
        npl_idx = random.randint(0, len(NPL_NAMES) - 1)

        if npl_idx not in npl_master_books:
            num_books = random.randint(2, 6)
            npl_master_books[npl_idx] = [
                f"MB-{random.randint(10000, 99999):05d}" for _ in range(num_books)
            ]

        mb_id = random.choice(npl_master_books[npl_idx])
        feed = random.choice(FEEDS)
        region = random.choice(REGIONS)

        bofc_base = 8 + random.random() * 6
        del_base = bofc_base + 2 + random.random() * 8

        # ~40% breach rate
        if random.random() < 0.4:
            duration_avg = round(5.1 + random.random() * 5, 2)
        else:
            duration_avg = round(0.5 + random.random() * 4.5, 2)

        duration_max = round(duration_avg + random.random() * 3, 2)
        duration_min = round(max(0.1, duration_avg - random.random() * 3), 2)

        rows.append({
            "NamedPnlName": NPL_NAMES[npl_idx],
            "MasterBookID": mb_id,
            "MasterBookName": f"Book_{NPL_NAMES[npl_idx].split()[0]}_{mb_id[-2:]}",
            "FeedName": feed,
            "Region": region,
            "SYEY_ID": f"SY-{random.randint(1000, 9999)}",
            "NamedPnLID": f"NPL-{npl_idx + 100:04d}",
            "MSBk_ID": f"MSB-{random.randint(0, 999999):06d}",
            "Avg_CompletedOnTime": _rand_ist(bofc_base, 2),
            "Max_CompletedOnTime": _rand_ist(bofc_base + 1, 2),
            "Min_CompletedOnTime": _rand_ist(max(6, bofc_base - 2), 1),
            "Avg_DelTimePCLocationTime": _rand_ist(del_base, 2),
            "Max_DelTimePCLocationTime": _rand_ist(del_base + 1, 3),
            "Min_DelTimePCLocationTime": _rand_ist(max(bofc_base + 1, del_base - 2), 1),
            "DurationAvg": duration_avg,
            "DurationMax": duration_max,
            "DurationMin": duration_min,
        })

    df = pd.DataFrame(rows)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    df.to_csv(path, index=False)
    logger.info("Generated sample CSV with %d rows at %s", len(df), path)
    return df


def load_csv() -> pd.DataFrame:
    global _df
    if _df is not None:
        return _df

    csv_path = os.path.join(os.path.dirname(__file__), "..", "data", "pnl_data.csv")
    csv_path = os.path.normpath(csv_path)

    if not os.path.exists(csv_path):
        logger.warning("CSV not found at %s, generating sample data...", csv_path)
        _df = _generate_sample_csv(csv_path)
    else:
        _df = pd.read_csv(csv_path)
        logger.info("Loaded CSV from %s", csv_path)

    # Strip whitespace from string columns
    str_cols = _df.select_dtypes(include=["object"]).columns
    for col in str_cols:
        _df[col] = _df[col].fillna("").astype(str).str.strip()

    # Fill NaN numbers with 0
    num_cols = _df.select_dtypes(include=["number"]).columns
    for col in num_cols:
        _df[col] = _df[col].fillna(0)

    # Add flagged column
    _df["flagged"] = _df["DurationAvg"] > 5

    logger.info("Loaded %d rows, %d flagged", len(_df), _df["flagged"].sum())
    return _df


def get_row_count() -> int:
    df = load_csv()
    return len(df)
