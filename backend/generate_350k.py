"""Generate 350K row CSV for P&L Lineage Dashboard."""
import numpy as np
import pandas as pd
import os
import time

NUM_ROWS = 350_000

NPL_NAMES = [
    "Rates Trading NA", "FX Options EMEA", "Credit Flow APAC",
    "Equities Delta One", "Commodities Structured", "EM Rates Trading",
    "G10 FX Spot", "Securitized Products", "Repo & Financing",
    "Prime Brokerage", "Macro Trading", "Vol Trading Desk",
    "Cross Asset Solutions", "Systematic Strategies", "Flow Credit Trading",
]
FEEDS = ["Atlas", "Calypso", "Murex", "Summit", "Kondor", "Sophis", "Endur", "Findur"]
REGIONS = ["AMER", "EMEA", "APAC", "LATAM"]

# Pre-build master book pool: each NPL gets 5-20 unique master books
rng = np.random.default_rng(42)
NPL_TO_BOOKS: dict = {}
for idx, npl in enumerate(NPL_NAMES):
    num_books = rng.integers(5, 21)
    book_ids = [f"MB-{rng.integers(10000, 99999):05d}" for _ in range(num_books)]
    NPL_TO_BOOKS[idx] = book_ids

print(f"Generating {NUM_ROWS:,} rows...")
t0 = time.time()

# Vectorized generation
npl_indices = rng.integers(0, len(NPL_NAMES), size=NUM_ROWS)
npl_names = np.array(NPL_NAMES)[npl_indices]
npl_ids = np.array([f"NPL-{i + 100:04d}" for i in npl_indices])

# Assign master books based on NPL
mb_ids = []
mb_names = []
for i in range(NUM_ROWS):
    npl_idx = npl_indices[i]
    books = NPL_TO_BOOKS[npl_idx]
    mb = books[rng.integers(0, len(books))]
    mb_ids.append(mb)
    mb_names.append(f"Book_{NPL_NAMES[npl_idx].split()[0]}_{mb[-2:]}")
mb_ids = np.array(mb_ids)
mb_names = np.array(mb_names)

feed_indices = rng.integers(0, len(FEEDS), size=NUM_ROWS)
feeds = np.array(FEEDS)[feed_indices]

region_indices = rng.integers(0, len(REGIONS), size=NUM_ROWS)
regions = np.array(REGIONS)[region_indices]

syey_ids = np.array([f"SY-{v}" for v in rng.integers(1000, 9999, size=NUM_ROWS)])
msbk_ids = np.array([f"MSB-{v:06d}" for v in rng.integers(0, 999999, size=NUM_ROWS)])


def make_ist_timestamps(num: int, base_low: float, base_high: float) -> np.ndarray:
    """Generate IST time strings vectorized."""
    hours = rng.integers(int(base_low), int(base_high), size=num) % 24
    minutes = rng.integers(0, 60, size=num)
    seconds = rng.integers(0, 60, size=num)
    result = []
    for h, m, s in zip(hours, minutes, seconds):
        hr12 = h % 12 or 12
        ampm = "AM" if h < 12 else "PM"
        result.append(f"{hr12}:{m:02d}:{s:02d} {ampm}")
    return np.array(result)


print("  Generating timestamps...")
avg_completed = make_ist_timestamps(NUM_ROWS, 8, 14)    # BOFC: 8AM-2PM
max_completed = make_ist_timestamps(NUM_ROWS, 9, 16)
min_completed = make_ist_timestamps(NUM_ROWS, 6, 12)
# ManualStep: after BOFC, before Delivery — typically 1-3h after BOFC
avg_manual = make_ist_timestamps(NUM_ROWS, 10, 16)      # 10AM-4PM (after BOFC avg 8-14)
max_manual = make_ist_timestamps(NUM_ROWS, 11, 18)
min_manual = make_ist_timestamps(NUM_ROWS, 8, 14)
avg_delivery = make_ist_timestamps(NUM_ROWS, 12, 20)    # Delivery: 12PM-8PM
max_delivery = make_ist_timestamps(NUM_ROWS, 14, 22)
min_delivery = make_ist_timestamps(NUM_ROWS, 10, 18)

print("  Generating durations...")
# Each NPL gets a distinct duration profile so some average above 5h SLA
# and others below — giving meaningful green/red splits on the dashboard.
NPL_PROFILES = {
    # (breach_rate, breach_center, normal_center) — controls per-NPL avg duration
    0:  (0.20, 5.5, 2.0),   # Rates Trading NA — mostly fast, low breach
    1:  (0.75, 7.0, 4.5),   # FX Options EMEA — slow, high breach → avg ~6h
    2:  (0.65, 6.5, 4.0),   # Credit Flow APAC — moderate-high breach → avg ~5.5h
    3:  (0.15, 5.3, 1.5),   # Equities Delta One — very fast
    4:  (0.55, 6.0, 3.5),   # Commodities Structured — borderline → avg ~5h
    5:  (0.80, 8.0, 5.0),   # EM Rates Trading — worst performer → avg ~7h
    6:  (0.10, 5.2, 1.8),   # G10 FX Spot — fastest
    7:  (0.45, 6.5, 3.0),   # Securitized Products — middle
    8:  (0.25, 5.5, 2.5),   # Repo & Financing — mostly good
    9:  (0.60, 7.5, 4.0),   # Prime Brokerage — slow → avg ~6h
    10: (0.35, 5.8, 2.8),   # Macro Trading — slightly below SLA
    11: (0.70, 7.0, 3.5),   # Vol Trading Desk — high breach → avg ~5.5h
    12: (0.30, 5.5, 2.0),   # Cross Asset Solutions — decent
    13: (0.50, 6.0, 3.0),   # Systematic Strategies — borderline
    14: (0.40, 5.5, 3.0),   # Flow Credit Trading — average
}

duration_avg = np.zeros(NUM_ROWS)
for i in range(NUM_ROWS):
    npl_idx = npl_indices[i]
    breach_rate, breach_center, normal_center = NPL_PROFILES[npl_idx]
    if rng.random() < breach_rate:
        duration_avg[i] = breach_center + rng.random() * 3
    else:
        duration_avg[i] = max(0.3, normal_center + (rng.random() - 0.5) * 2)
duration_avg = np.round(duration_avg, 2)
duration_max = np.round(duration_avg + rng.random(NUM_ROWS) * 3, 2)
duration_min = np.round(np.maximum(0.1, duration_avg - rng.random(NUM_ROWS) * 3), 2)

# ManualStep durations: BOFC → ManualStep (subset of total duration, ~30-60% of it)
manual_ratio = 0.3 + rng.random(NUM_ROWS) * 0.3  # 30-60% of total duration
duration_manual_avg = np.round(duration_avg * manual_ratio, 2)
duration_manual_max = np.round(duration_max * (0.3 + rng.random(NUM_ROWS) * 0.3), 2)
duration_manual_min = np.round(np.maximum(0.1, duration_min * (0.3 + rng.random(NUM_ROWS) * 0.3)), 2)

print("  Building DataFrame...")
df = pd.DataFrame({
    "NamedPnlName": npl_names,
    "MasterBookID": mb_ids,
    "MasterBookName": mb_names,
    "FeedName": feeds,
    "Region": regions,
    "SYEY_ID": syey_ids,
    "NamedPnLID": npl_ids,
    "MSBk_ID": msbk_ids,
    "Avg_CompletedOnTime": avg_completed,
    "Max_CompletedOnTime": max_completed,
    "Min_CompletedOnTime": min_completed,
    "Avg_ManualStepTime": avg_manual,
    "Max_ManualStepTime": max_manual,
    "Min_ManualStepTime": min_manual,
    "Avg_DelTimePCLocationTime": avg_delivery,
    "Max_DelTimePCLocationTime": max_delivery,
    "Min_DelTimePCLocationTime": min_delivery,
    "DurationAvg": duration_avg,
    "DurationMax": duration_max,
    "DurationMin": duration_min,
    "DurationManualAvg": duration_manual_avg,
    "DurationManualMax": duration_manual_max,
    "DurationManualMin": duration_manual_min,
})

out_path = os.path.join(os.path.dirname(__file__), "data", "pnl_data.csv")
os.makedirs(os.path.dirname(out_path), exist_ok=True)

print(f"  Writing CSV to {out_path}...")
df.to_csv(out_path, index=False)

elapsed = time.time() - t0
breach_count = int((duration_avg > 5).sum())
print(f"Done! {len(df):,} rows, {breach_count:,} breaches ({breach_count/len(df)*100:.1f}%) in {elapsed:.1f}s")
print(f"File size: {os.path.getsize(out_path) / 1024 / 1024:.1f} MB")
