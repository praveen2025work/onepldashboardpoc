from typing import Optional

import pandas as pd


def apply_filters(
    df: pd.DataFrame,
    region: Optional[str] = None,
    feed: Optional[str] = None,
    npl: Optional[str] = None,
    flagged_only: bool = False,
    search: Optional[str] = None,
) -> pd.DataFrame:
    filtered = df.copy()

    if region:
        filtered = filtered[filtered["Region"] == region]

    if feed:
        filtered = filtered[filtered["FeedName"] == feed]

    if npl:
        filtered = filtered[filtered["NamedPnlName"] == npl]

    if flagged_only:
        filtered = filtered[filtered["flagged"]]

    if search:
        s = search.lower()
        mask = (
            filtered["NamedPnlName"].str.lower().str.contains(s, na=False)
            | filtered["MasterBookID"].str.lower().str.contains(s, na=False)
            | filtered["MasterBookName"].str.lower().str.contains(s, na=False)
            | filtered["FeedName"].str.lower().str.contains(s, na=False)
        )
        filtered = filtered[mask]

    return filtered
