"""Workflow service: business area overview, area drilldown, NPL detail."""
from __future__ import annotations

from typing import Optional

from services.csv_loader import load_workflow

SLA_THRESHOLD = 5.0  # hours


def _classify_status(on_time_pct: float) -> str:
    """Classify on-time percentage into green/amber/red."""
    if on_time_pct >= 98:
        return "green"
    if on_time_pct >= 80:
        return "amber"
    return "red"


def get_overview(month: str, areas: Optional[list[str]] = None) -> list[dict]:
    """Return business area cards with SLA status for a given month.

    For each area, computes the % of (NPL, date) pairs where BOFCToPC <= 5h.
    """
    df = load_workflow()
    df = df[df["Month"] == month]

    if areas:
        df = df[df["BusinessArea"].isin(areas)]

    if df.empty:
        return []

    cards = []
    for area, grp in df.groupby("BusinessArea"):
        total = len(grp)
        on_time = int((grp["BOFCToPC"] <= SLA_THRESHOLD).sum())
        pct = round(on_time / total * 100, 1) if total > 0 else 0.0
        unique_npls = grp["NamedPnlId"].nunique()

        cards.append({
            "area_name": area,
            "total_npls": unique_npls,
            "on_time_count": on_time,
            "on_time_pct": pct,
            "status": _classify_status(pct),
        })

    return sorted(cards, key=lambda c: c["on_time_pct"])


def get_area_drilldown(month: str, area: str) -> dict:
    """Return all NPLs within a business area with per-NPL SLA status."""
    df = load_workflow()
    df = df[(df["Month"] == month) & (df["BusinessArea"] == area)]

    npls = []
    for (npl_id, npl_name), grp in df.groupby(["NamedPnlId", "NamedPnlName"]):
        total = len(grp)
        on_time = int((grp["BOFCToPC"] <= SLA_THRESHOLD).sum())
        pct = round(on_time / total * 100, 1) if total > 0 else 0.0

        npls.append({
            "npl_id": npl_id,
            "npl_name": npl_name,
            "business_area": area,
            "on_time_pct": pct,
            "status": _classify_status(pct),
            "total_dates": total,
        })

    return {
        "area_name": area,
        "npls": sorted(npls, key=lambda n: n["on_time_pct"]),
    }


def get_npl_detail(month: str, npl_id: str) -> dict:
    """Return per-business-date timestamps and durations for a Named PNL."""
    df = load_workflow()
    df = df[(df["Month"] == month) & (df["NamedPnlId"] == npl_id)]

    if df.empty:
        return {
            "npl_id": npl_id,
            "npl_name": "",
            "business_area": "",
            "timestamps": [],
            "durations": [],
        }

    npl_name = df.iloc[0]["NamedPnlName"]
    business_area = df.iloc[0]["BusinessArea"]

    # Sort by date
    df = df.sort_values("BusinessDate")

    timestamps = []
    durations = []
    for _, row in df.iterrows():
        bdate = str(row["BusinessDate"])
        timestamps.append({
            "business_date": bdate,
            "bofc_time": str(row["BOFCCompletedOn"]),
            "manual_time": str(row["ManualCompletedOn"]),
            "delivery_time": str(row["DeliveryPCLocationTime"]),
        })
        durations.append({
            "business_date": bdate,
            "bofc_to_manual": round(float(row["BOFCToManual"]), 2),
            "manual_to_pc": round(float(row["ManualToPC"]), 2),
            "bofc_to_pc": round(float(row["BOFCToPC"]), 2),
        })

    return {
        "npl_id": npl_id,
        "npl_name": npl_name,
        "business_area": business_area,
        "timestamps": timestamps,
        "durations": durations,
    }
