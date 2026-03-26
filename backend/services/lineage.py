import math

import pandas as pd


def _safe_str(val: object) -> str:
    """Convert a value to string, handling NaN/None."""
    if val is None:
        return ""
    if isinstance(val, float) and math.isnan(val):
        return ""
    return str(val).strip()


def _safe_float(val: object) -> float:
    """Convert a value to float, handling NaN/None."""
    if val is None:
        return 0.0
    try:
        f = float(val)
        return 0.0 if math.isnan(f) or math.isinf(f) else round(f, 2)
    except (ValueError, TypeError):
        return 0.0


def _safe_bool(val: object) -> bool:
    """Convert a value to bool, handling NaN/None."""
    if val is None:
        return False
    if isinstance(val, float) and math.isnan(val):
        return False
    return bool(val)


def build_lineage(df: pd.DataFrame, npl_name: str) -> dict:
    npl_data = df[df["NamedPnlName"] == npl_name]

    if npl_data.empty:
        return {
            "npl_name": npl_name,
            "npl_id": "",
            "has_breach": False,
            "master_books": [],
        }

    npl_id = _safe_str(npl_data.iloc[0].get("NamedPnLID", ""))
    has_breach = _safe_bool(npl_data["flagged"].any())

    master_books = []
    for mb_id, mb_group in npl_data.groupby("MasterBookID"):
        mb_name = _safe_str(mb_group.iloc[0].get("MasterBookName", ""))
        mb_has_breach = _safe_bool(mb_group["flagged"].any())

        feeds = []
        for _, row in mb_group.iterrows():
            feeds.append({
                "feed_name": _safe_str(row.get("FeedName", "")),
                "bofc_avg": _safe_str(row.get("Avg_CompletedOnTime", "")),
                "delivery_avg": _safe_str(row.get("Avg_DelTimePCLocationTime", "")),
                "duration_avg": _safe_float(row.get("DurationAvg", 0)),
                "flagged": _safe_bool(row.get("flagged", False)),
            })

        master_books.append({
            "id": _safe_str(mb_id),
            "name": mb_name,
            "has_breach": mb_has_breach,
            "feeds": feeds,
        })

    return {
        "npl_name": npl_name,
        "npl_id": npl_id,
        "has_breach": has_breach,
        "master_books": master_books,
    }
