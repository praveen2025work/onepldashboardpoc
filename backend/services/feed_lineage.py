"""Feed lineage service: per-date feed OLA vs Arrived for a Named PNL."""
from services.csv_loader import load_feed


def get_feed_lineage(month: str, npl_id: str) -> dict:
    """Return all feed rows for a Named PNL in a given month."""
    df = load_feed()
    df = df[(df["Month"] == month) & (df["NamedPnlId"] == npl_id)]

    if df.empty:
        return {"npl_id": npl_id, "npl_name": "", "feeds": []}

    npl_name = df.iloc[0]["NamedPnlName"]

    # Sort by feed name then date
    df = df.sort_values(["FeedName", "BusinessDate"])

    feeds = []
    for _, row in df.iterrows():
        feeds.append({
            "business_date": str(row["BusinessDate"]),
            "feed_name": str(row["FeedName"]),
            "master_book_id": str(row["MasterBookId"]),
            "master_book_name": str(row["MasterBookName"]),
            "ola_time": str(row["FeedOLA"]),
            "arrived_time": str(row["FeedArrived"]),
            "delayed": bool(row["FeedDelayed"]),
        })

    return {
        "npl_id": npl_id,
        "npl_name": npl_name,
        "feeds": feeds,
    }
