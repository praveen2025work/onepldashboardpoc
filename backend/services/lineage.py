import pandas as pd


def build_lineage(df: pd.DataFrame, npl_name: str) -> dict:
    npl_data = df[df["NamedPnlName"] == npl_name]

    if npl_data.empty:
        return {
            "npl_name": npl_name,
            "npl_id": "",
            "has_breach": False,
            "master_books": [],
        }

    npl_id = npl_data.iloc[0]["NamedPnLID"]
    has_breach = bool(npl_data["flagged"].any())

    master_books = []
    for mb_id, mb_group in npl_data.groupby("MasterBookID"):
        mb_name = mb_group.iloc[0]["MasterBookName"]
        mb_has_breach = bool(mb_group["flagged"].any())

        feeds = []
        for _, row in mb_group.iterrows():
            feeds.append({
                "feed_name": row["FeedName"],
                "bofc_avg": row["Avg_CompletedOnTime"],
                "delivery_avg": row["Avg_DelTimePCLocationTime"],
                "duration_avg": round(float(row["DurationAvg"]), 2),
                "flagged": bool(row["flagged"]),
            })

        master_books.append({
            "id": mb_id,
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
