import logging
import os
from typing import Optional

import pandas as pd

logger = logging.getLogger("pnl_dashboard")

_workflow_df: Optional[pd.DataFrame] = None
_feed_df: Optional[pd.DataFrame] = None


def _data_dir() -> str:
    return os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "data"))


def _ensure_csvs() -> tuple[str, str]:
    """Return paths to both CSVs, generating them if missing."""
    data_dir = _data_dir()
    workflow_path = os.path.join(data_dir, "npl_workflow.csv")
    feed_path = os.path.join(data_dir, "feed_to_npl.csv")

    if not os.path.exists(workflow_path) or not os.path.exists(feed_path):
        logger.warning("CSV files not found, generating sample data...")
        from generate_data import generate
        generate()

    return workflow_path, feed_path


def _add_month_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Add Month (YYYY-MM) and MonthLabel (Mon YYYY) columns from BusinessDate."""
    dates = pd.to_datetime(df["BusinessDate"].astype(str))
    df["Month"] = dates.dt.strftime("%Y-%m")          # "2026-02" — for filtering & sorting
    df["MonthLabel"] = dates.dt.strftime("%b %Y")      # "Feb 2026" — for display
    return df


def load_workflow() -> pd.DataFrame:
    """Load npl_workflow.csv into a DataFrame (cached)."""
    global _workflow_df
    if _workflow_df is not None:
        return _workflow_df

    workflow_path, _ = _ensure_csvs()
    _workflow_df = pd.read_csv(workflow_path)

    # Parse BusinessDate
    _workflow_df["BusinessDate"] = pd.to_datetime(_workflow_df["BusinessDate"]).dt.date

    # Add month columns
    _workflow_df = _add_month_columns(_workflow_df)

    # Ensure string columns are clean
    str_cols = ["BusinessArea", "NamedPnlId", "NamedPnlName",
                "BOFCCompletedOn", "ManualCompletedOn", "DeliveryPCLocationTime"]
    for col in str_cols:
        if col in _workflow_df.columns:
            _workflow_df[col] = _workflow_df[col].fillna("").astype(str).str.strip()

    # Ensure duration columns are float
    dur_cols = ["BOFCToManual", "ManualToPC", "BOFCToPC"]
    for col in dur_cols:
        if col in _workflow_df.columns:
            _workflow_df[col] = pd.to_numeric(_workflow_df[col], errors="coerce").fillna(0.0)

    logger.info("Loaded workflow CSV: %d rows", len(_workflow_df))
    return _workflow_df


def load_feed() -> pd.DataFrame:
    """Load feed_to_npl.csv into a DataFrame (cached)."""
    global _feed_df
    if _feed_df is not None:
        return _feed_df

    _, feed_path = _ensure_csvs()
    _feed_df = pd.read_csv(feed_path)

    # Parse BusinessDate
    _feed_df["BusinessDate"] = pd.to_datetime(_feed_df["BusinessDate"]).dt.date

    # Add month columns
    _feed_df = _add_month_columns(_feed_df)

    # Ensure string columns are clean
    str_cols = ["BusinessArea", "NamedPnlId", "NamedPnlName",
                "MasterBookId", "MasterBookName", "FeedName",
                "FeedOLA", "FeedArrived"]
    for col in str_cols:
        if col in _feed_df.columns:
            _feed_df[col] = _feed_df[col].fillna("").astype(str).str.strip()

    # Ensure boolean
    if "FeedDelayed" in _feed_df.columns:
        _feed_df["FeedDelayed"] = _feed_df["FeedDelayed"].astype(bool)

    logger.info("Loaded feed CSV: %d rows", len(_feed_df))
    return _feed_df


def get_row_counts() -> tuple[int, int]:
    """Return (workflow_rows, feed_rows)."""
    return len(load_workflow()), len(load_feed())
