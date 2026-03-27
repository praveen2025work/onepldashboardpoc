"""Filter service: month and business area filtering + filter options."""
from services.csv_loader import load_workflow, load_feed


def get_filter_options() -> dict:
    """Return available months, business areas, and named PNLs.

    Months are returned as a list of {key: "2026-02", label: "Feb 2026"}
    sorted chronologically.
    """
    wf = load_workflow()
    feed = load_feed()

    # Build month list from both datasets with key (YYYY-MM) and label (Mon YYYY)
    month_map: dict[str, str] = {}
    for df in [wf, feed]:
        for _, row in df[["Month", "MonthLabel"]].drop_duplicates().iterrows():
            month_map[row["Month"]] = row["MonthLabel"]

    # Sort chronologically by key (YYYY-MM sorts naturally)
    months = [
        {"key": k, "label": v}
        for k, v in sorted(month_map.items())
    ]

    areas = sorted(wf["BusinessArea"].unique())
    npls = sorted(wf["NamedPnlName"].unique())

    return {
        "months": months,
        "business_areas": areas,
        "named_pnls": npls,
    }
