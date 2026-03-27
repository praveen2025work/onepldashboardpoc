"""Generate two CSV files for the P&L Lineage Dashboard.

File 1: feed_to_npl.csv — Feed lineage (Feed -> MasterBook -> NPL)
File 2: npl_workflow.csv — Workflow delivery (BOFC -> Manual -> Delivery PC)

Usage:
    python generate_data.py              # defaults to Feb 2026
    python generate_data.py --month 3    # March 2026
    python generate_data.py --month 2 --year 2026
"""
import argparse
import calendar
import os
import time
from datetime import date, timedelta

import numpy as np
import pandas as pd

rng = np.random.default_rng(42)

# ── Business Areas and Named PNLs ──────────────────────────────────────
BUSINESS_AREAS: dict[str, list[str]] = {
    "Credit Trading": [
        "Credit Flow NA", "Credit Flow EMEA", "Credit Flow APAC",
        "HY Credit NA", "HY Credit EMEA", "IG Credit NA",
        "IG Credit EMEA", "Credit Derivatives NA", "Credit Derivatives EMEA",
        "Distressed Credit", "Credit Index Trading", "CLO Trading",
        "Loan Trading", "Credit Options",
    ],
    "Rates Trading": [
        "Rates NA", "Rates EMEA", "Rates APAC", "Rates LATAM",
        "Govies NA", "Govies EMEA", "Govies APAC",
        "IRS Trading NA", "IRS Trading EMEA", "IRS Trading APAC",
        "Inflation Trading NA", "Inflation Trading EMEA",
        "Swaptions NA", "Swaptions EMEA",
    ],
    "FX Trading": [
        "G10 FX Spot", "G10 FX Forwards", "G10 FX Options",
        "EM FX Spot", "EM FX Forwards", "EM FX Options",
        "FX Exotics", "FX Swaps", "NDFs Trading",
        "FX Vol Trading", "Cross Currency Swaps",
        "FX Structured Products", "FX Algo Trading",
    ],
    "Equities Trading": [
        "Equities Delta One NA", "Equities Delta One EMEA",
        "Equities Delta One APAC", "Equity Derivatives NA",
        "Equity Derivatives EMEA", "Equity Derivatives APAC",
        "Equity Exotics", "Convertible Bonds",
        "Equity Swaps", "Index Trading", "Single Stock Options",
        "Variance Swaps", "Equity Vol Trading",
    ],
    "Commodities": [
        "Oil Trading", "Gas Trading", "Power Trading",
        "Metals Trading", "Agri Commodities",
        "Commodities Structured", "Commodities Options",
        "Emissions Trading", "Base Metals", "Precious Metals",
        "Commodities Index",
    ],
    "Securitized Products": [
        "RMBS Trading", "CMBS Trading", "ABS Trading",
        "Agency MBS", "Non-Agency MBS", "Whole Loans",
        "Securitized Derivatives", "CLO Warehouse",
        "CRT Trading", "SFR Bonds",
    ],
    "Repo & Financing": [
        "Govt Repo NA", "Govt Repo EMEA", "Govt Repo APAC",
        "Corp Repo", "Equity Repo", "Tri-Party Repo",
        "Securities Lending", "Margin Financing",
        "Collateral Trading", "Prime Financing",
    ],
    "Macro Trading": [
        "Global Macro NA", "Global Macro EMEA", "Global Macro APAC",
        "Macro Relative Value", "Macro Event Driven",
        "Sovereign Trading", "Cross Asset Macro",
        "Macro Systematic", "EM Macro",
    ],
    "Emerging Markets": [
        "EM Rates CEEMEA", "EM Rates LatAm", "EM Rates Asia",
        "EM Credit", "EM FX", "EM Local Markets",
        "EM Hard Currency", "EM Structured",
        "Frontier Markets", "China Onshore",
    ],
    "Prime Brokerage": [
        "PB Equity Finance", "PB Fixed Income Finance",
        "PB Synthetic", "PB Clearing", "PB Margin",
        "PB Collateral Mgmt", "PB Delta One",
        "PB Swaps", "PB FX Prime",
    ],
    "Structured Products": [
        "Structured Notes NA", "Structured Notes EMEA",
        "Structured Notes APAC", "Autocallables",
        "Accumulator Products", "Range Accruals",
        "Capital Protection", "Structured Deposits",
    ],
    "Vol Trading": [
        "Equity Vol NA", "Equity Vol EMEA", "Equity Vol APAC",
        "FX Vol Desk", "Rates Vol Desk", "Cross Asset Vol",
        "Dispersion Trading", "Correlation Trading",
        "Variance Trading", "Vol Surface Trading",
    ],
    "Municipal Trading": [
        "Muni Bonds NA", "Muni Taxable", "Muni High Yield",
        "Muni Short Duration", "Muni Derivatives",
        "Muni ETF Trading", "Muni New Issues",
    ],
    "Cross Asset Solutions": [
        "QIS NA", "QIS EMEA", "QIS APAC",
        "Multi-Asset Solutions", "Risk Premia",
        "Factor Investing", "Systematic Cross Asset",
    ],
    "Treasury & ALM": [
        "Treasury Funding NA", "Treasury Funding EMEA",
        "Treasury Funding APAC", "ALM Hedging",
        "Liquidity Management", "Capital Markets Desk",
    ],
    "Flow Credit": [
        "Flow IG NA", "Flow IG EMEA", "Flow HY NA",
        "Flow HY EMEA", "Flow CDS NA", "Flow CDS EMEA",
        "ETF Market Making",
    ],
    "Private Credit": [
        "Direct Lending", "Mezzanine Finance",
        "Specialty Finance", "Asset-Based Lending",
        "Infrastructure Debt", "Real Estate Debt",
    ],
    "Market Making": [
        "MM Equities NA", "MM Equities EMEA",
        "MM Fixed Income NA", "MM Fixed Income EMEA",
        "MM ETFs", "MM Options",
    ],
    "Wealth Management": [
        "WM Structured Products", "WM Fixed Income",
        "WM Equities", "WM Alternatives",
        "WM FX Solutions", "WM Advisory",
    ],
    "Research Trading": [
        "Research Eq Trading NA", "Research Eq Trading EMEA",
        "Research FI Trading", "Thematic Trading",
        "Event Driven Trading",
    ],
}

FEEDS = ["Atlas", "Calypso", "Murex", "Summit", "Kondor", "Sophis", "Endur", "Findur"]


def _get_weekdays(year: int, month: int) -> list[date]:
    """Return all weekdays (Mon-Fri) for a given month."""
    num_days = calendar.monthrange(year, month)[1]
    return [
        date(year, month, d)
        for d in range(1, num_days + 1)
        if date(year, month, d).weekday() < 5
    ]


def _fmt_time_12h(hour: int, minute: int, second: int) -> str:
    """Format 24h time as 12h IST string like '2:29:00 AM'."""
    h = hour % 24
    hr12 = h % 12 or 12
    ampm = "AM" if h < 12 else "PM"
    return f"{hr12}:{minute:02d}:{second:02d} {ampm}"


def _rand_time(base_hour: float, spread: float, n: int = 1) -> list[str]:
    """Generate n random IST timestamps around base_hour +/- spread."""
    results = []
    for _ in range(n):
        h = int(base_hour + rng.random() * spread) % 24
        m = int(rng.integers(0, 60))
        s = int(rng.integers(0, 60))
        results.append(_fmt_time_12h(h, m, s))
    return results


def _time_to_hours(time_str: str) -> float:
    """Convert '2:29:00 PM' to decimal hours (14.483)."""
    parts = time_str.rsplit(" ", 1)
    hms = parts[0].split(":")
    h, m, s = int(hms[0]), int(hms[1]), int(hms[2])
    ampm = parts[1].upper()
    if ampm == "PM" and h != 12:
        h += 12
    elif ampm == "AM" and h == 12:
        h = 0
    return h + m / 60 + s / 3600


def _hours_to_time(decimal_hours: float) -> str:
    """Convert decimal hours (14.483) to '2:29:00 PM'."""
    h = int(decimal_hours) % 24
    remainder = (decimal_hours - int(decimal_hours)) * 60
    m = int(remainder)
    s = int((remainder - m) * 60)
    return _fmt_time_12h(h, m, s)


def generate(
    year: int = 2026,
    month: int = 2,
    months: int = 1,
) -> tuple[str, str]:
    """Generate both CSV files and return their paths.

    Args:
        year: Starting year.
        month: Starting month (1-12).
        months: Number of months to generate (1-12).
    """
    t0 = time.time()

    # Collect weekdays across all requested months
    weekdays: list[date] = []
    month_labels: list[str] = []
    for i in range(months):
        m = ((month - 1 + i) % 12) + 1
        y = year + ((month - 1 + i) // 12)
        weekdays.extend(_get_weekdays(y, m))
        month_labels.append(f"{calendar.month_abbr[m]} {y}")

    label = ", ".join(month_labels)
    print(f"Generating data for {label} ({len(weekdays)} weekdays)...")

    # Build NPL registry with stable IDs
    npl_registry: list[dict[str, str]] = []
    npl_id_counter = 100
    for area, npls in BUSINESS_AREAS.items():
        for npl_name in npls:
            npl_registry.append({
                "npl_id": f"NPL-{npl_id_counter:04d}",
                "npl_name": npl_name,
                "business_area": area,
            })
            npl_id_counter += 1

    print(f"  {len(npl_registry)} Named PNLs across {len(BUSINESS_AREAS)} business areas")

    # Assign master books per NPL (stable)
    npl_master_books: dict[str, list[dict[str, str]]] = {}
    for npl in npl_registry:
        num_books = int(rng.integers(3, 10))
        books = []
        for _ in range(num_books):
            mb_id = f"MB-{rng.integers(10000, 99999):05d}"
            short = npl["npl_name"].split()[0]
            books.append({"id": mb_id, "name": f"Book_{short}_{mb_id[-2:]}"})
        npl_master_books[npl["npl_id"]] = books

    # Assign feeds per master book (stable)
    mb_feeds: dict[str, list[str]] = {}
    for npl_id, books in npl_master_books.items():
        for book in books:
            num_feeds = int(rng.integers(1, 4))
            mb_feeds[book["id"]] = list(rng.choice(FEEDS, size=num_feeds, replace=False))

    # ── Area-level SLA profiles ──
    # Assign each business area a target status to ensure green/amber/red distribution
    area_names = list(BUSINESS_AREAS.keys())
    area_profiles: dict[str, dict] = {}
    # Deterministic assignment: ~30% green, ~40% amber, ~30% red
    for i, area in enumerate(area_names):
        bucket = i % 10
        if bucket < 3:  # green: very low breach
            base_breach = float(rng.uniform(0.0, 0.01))
        elif bucket < 7:  # amber: moderate breach
            base_breach = float(rng.uniform(0.05, 0.15))
        else:  # red: high breach
            base_breach = float(rng.uniform(0.25, 0.50))
        area_profiles[area] = {"base_breach": base_breach}

    # ── Performance profiles per NPL ──
    npl_profiles: dict[str, dict] = {}
    for npl in npl_registry:
        area_breach = area_profiles[npl["business_area"]]["base_breach"]
        # BOFC typically completes between 2AM-10AM IST
        bofc_base = float(rng.uniform(2, 10))
        # Manual step happens 0.5-2.5 hours after BOFC (kept short for non-breach)
        manual_gap = float(rng.uniform(0.5, 2.5))
        # Delivery happens 0.3-2 hours after manual
        delivery_gap = float(rng.uniform(0.3, 2.0))
        # Variance in minutes
        variance = float(rng.uniform(15, 60))
        # Per-NPL breach prob is area base +/- small jitter
        breach_prob = max(0.0, min(0.7, area_breach + float(rng.normal(0, 0.02))))

        npl_profiles[npl["npl_id"]] = {
            "bofc_base": bofc_base,
            "manual_gap": manual_gap,
            "delivery_gap": delivery_gap,
            "variance_min": variance,
            "breach_prob": breach_prob,
        }

    # ── Generate npl_workflow.csv ──
    print("  Generating workflow data...")
    workflow_rows = []
    for npl in npl_registry:
        prof = npl_profiles[npl["npl_id"]]
        for bdate in weekdays:
            # Add daily variance
            var_h = prof["variance_min"] / 60
            bofc_h = prof["bofc_base"] + float(rng.normal(0, var_h))
            bofc_h = max(1, min(23, bofc_h))

            # Decide if this is a breach day (slow day)
            is_breach = rng.random() < prof["breach_prob"]
            if is_breach:
                mgap = prof["manual_gap"] * float(rng.uniform(1.5, 3.0))
                dgap = prof["delivery_gap"] * float(rng.uniform(1.5, 2.5))
            else:
                mgap = prof["manual_gap"] * float(rng.uniform(0.6, 1.2))
                dgap = prof["delivery_gap"] * float(rng.uniform(0.6, 1.2))

            manual_h = bofc_h + mgap
            delivery_h = manual_h + dgap

            # Clamp to 24h
            manual_h = min(23.99, manual_h)
            delivery_h = min(23.99, delivery_h)

            bofc_to_manual = round(manual_h - bofc_h, 2)
            manual_to_pc = round(delivery_h - manual_h, 2)
            bofc_to_pc = round(delivery_h - bofc_h, 2)

            workflow_rows.append({
                "BusinessDate": bdate.isoformat(),
                "BusinessArea": npl["business_area"],
                "NamedPnlId": npl["npl_id"],
                "NamedPnlName": npl["npl_name"],
                "BOFCCompletedOn": _hours_to_time(bofc_h),
                "ManualCompletedOn": _hours_to_time(manual_h),
                "DeliveryPCLocationTime": _hours_to_time(delivery_h),
                "BOFCToManual": bofc_to_manual,
                "ManualToPC": manual_to_pc,
                "BOFCToPC": bofc_to_pc,
            })

    workflow_df = pd.DataFrame(workflow_rows)
    print(f"  Workflow rows: {len(workflow_df):,}")

    # ── Generate feed_to_npl.csv ──
    print("  Generating feed lineage data...")
    feed_rows = []
    for npl in npl_registry:
        books = npl_master_books[npl["npl_id"]]
        for book in books:
            feeds = mb_feeds[book["id"]]
            for feed_name in feeds:
                for bdate in weekdays:
                    # Feed OLA: typically between midnight and 6AM IST
                    ola_h = float(rng.uniform(0, 6))
                    # Feed arrived: usually near OLA, sometimes late
                    late_prob = float(rng.uniform(0.05, 0.2))
                    if rng.random() < late_prob:
                        arrived_h = ola_h + float(rng.uniform(1, 4))
                    else:
                        arrived_h = ola_h + float(rng.uniform(-0.5, 0.5))
                    arrived_h = max(0, min(23.99, arrived_h))

                    delayed = arrived_h > ola_h

                    feed_rows.append({
                        "BusinessDate": bdate.isoformat(),
                        "BusinessArea": npl["business_area"],
                        "NamedPnlId": npl["npl_id"],
                        "NamedPnlName": npl["npl_name"],
                        "MasterBookId": book["id"],
                        "MasterBookName": book["name"],
                        "FeedName": feed_name,
                        "FeedOLA": _hours_to_time(ola_h),
                        "FeedArrived": _hours_to_time(arrived_h),
                        "FeedDelayed": delayed,
                    })

    feed_df = pd.DataFrame(feed_rows)
    print(f"  Feed rows: {len(feed_df):,}")

    # ── Write CSVs ──
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(data_dir, exist_ok=True)

    workflow_path = os.path.join(data_dir, "npl_workflow.csv")
    feed_path = os.path.join(data_dir, "feed_to_npl.csv")

    workflow_df.to_csv(workflow_path, index=False)
    feed_df.to_csv(feed_path, index=False)

    elapsed = time.time() - t0
    breach_count = int((workflow_df["BOFCToPC"] > 5).sum())
    total_wf = len(workflow_df)
    print(f"Done in {elapsed:.1f}s")
    print(f"  Workflow: {total_wf:,} rows, {breach_count:,} breaches ({breach_count/total_wf*100:.1f}%)")
    print(f"  Feed lineage: {len(feed_df):,} rows")
    print(f"  Files: {workflow_path}, {feed_path}")

    return workflow_path, feed_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate P&L dashboard CSV data")
    parser.add_argument("--month", type=int, default=2, help="Starting month (1-12)")
    parser.add_argument("--year", type=int, default=2026, help="Starting year")
    parser.add_argument("--months", type=int, default=1, help="Number of months to generate (e.g., 6)")
    args = parser.parse_args()
    generate(year=args.year, month=args.month, months=args.months)
