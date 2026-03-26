# P&L Lineage Intelligence Dashboard

Full-stack dashboard for monitoring BOFC-to-Delivery duration SLAs across Named P&Ls, Master Books, and Feeds. Built for CIO and senior leadership.

- **Backend:** Python FastAPI serving data from CSV
- **Frontend:** React + Vite + TypeScript with inline-styled components

## Prerequisites

- Python 3.9+
- Node.js 18+
- npm 9+

## Project Structure

```
onepnldashboard/
├── backend/
│   ├── main.py                  # FastAPI app (4 endpoints)
│   ├── models.py                # Pydantic response models
│   ├── requirements.txt         # Python dependencies
│   ├── generate_350k.py         # Script to regenerate 350K sample CSV
│   ├── services/
│   │   ├── csv_loader.py        # CSV ingestion + caching
│   │   ├── filters.py           # Filter/search logic
│   │   └── lineage.py           # Lineage tree builder
│   └── data/
│       └── pnl_data.csv         # Source CSV (350K rows, ~55MB)
├── frontend/
│   ├── package.json
│   ├── vite.config.ts           # Proxy /api → localhost:8000
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── api/client.ts        # Axios API client
│       ├── types/pnl.ts         # TypeScript interfaces
│       ├── hooks/
│       │   ├── useFilters.ts
│       │   └── usePnlData.ts
│       ├── components/
│       │   ├── Layout.tsx       # Header, tabs, filter bar
│       │   ├── KpiCards.tsx     # 5 KPI cards
│       │   ├── RegionChart.tsx  # Region volume chart
│       │   ├── FeedHealth.tsx   # Feed performance bars
│       │   ├── LineageView.tsx  # Lineage flow with MB/Feed filters
│       │   └── DataTable.tsx    # Sortable paginated table
│       └── styles/tokens.ts    # Design tokens (light theme)
└── README.md
```

## Running Locally

### 1. Clone the repo

```bash
git clone git@github.com:praveen2025work/onepldashboardpoc.git
cd onepldashboardpoc
```

### 2. Start the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

On first run, if `backend/data/pnl_data.csv` doesn't exist, a 500-row sample CSV is auto-generated. To generate the full 350K-row dataset:

```bash
python generate_350k.py
```

Verify the backend is running:

```bash
curl http://localhost:8000/api/health
# {"status":"ok","rows":350000}
```

### 3. Start the Frontend

```bash
cd frontend
npm ci
npm run dev
```

Open **http://localhost:5173** in your browser.

#### Corporate / Private npm Registry

If `npm ci` or `npm install` fails with 404 errors (e.g., `electron-to-chromium` not found on your internal Nexus/Artifactory registry), delete the lockfile and reinstall:

```bash
# Windows
del package-lock.json
rmdir /s /q node_modules
npm install
npm run dev

# macOS / Linux
rm package-lock.json
rm -rf node_modules
npm install
npm run dev
```

This regenerates `package-lock.json` against your registry with versions it has cached. Do not commit this lockfile back if it differs from the repo version.

The Vite dev server proxies `/api` requests to `http://localhost:8000`, so no CORS issues in development.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check with row count |
| GET | `/api/pnl/summary` | KPIs, region stats, feed stats (with filters) |
| GET | `/api/pnl/data` | Paginated, sortable table data (with filters) |
| GET | `/api/pnl/lineage/{npl_name}` | Lineage tree: NPL → Master Books → Feeds |
| GET | `/api/pnl/filters` | Distinct values for filter dropdowns |

### Filter Query Parameters (summary & data)

| Param | Type | Description |
|-------|------|-------------|
| `region` | string | Filter by region (AMER, EMEA, APAC, LATAM) |
| `feed` | string | Filter by feed name |
| `npl` | string | Filter by Named P&L name |
| `flagged_only` | bool | Only SLA breaches (DurationAvg > 5h) |
| `search` | string | Free-text search across P&L, Book, Feed |

### Data-specific Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `page_size` | int | 15 | Rows per page (max 100) |
| `sort_by` | string | DurationAvg | Column to sort by |
| `sort_dir` | string | desc | `asc` or `desc` |

## Key Business Rules

- **SLA Breach:** `DurationAvg > 5 hours` = flagged
- **Duration Calculation:** Pre-computed in CSV as `Delivery PC − BOFC CompletedOn`
  - `DurationAvg = Avg_DelTimePCLocationTime − Avg_CompletedOnTime`
  - `DurationMax = Max_DelTimePCLocationTime − Max_CompletedOnTime`
  - `DurationMin = Min_DelTimePCLocationTime − Min_CompletedOnTime`
- **Timestamps:** IST format strings (e.g., `2:29:20 PM`), passed through as-is
- **Data Hierarchy:** 1 Named P&L → Many Master Books → Many Feeds

## Dashboard Features

- **Executive View:** KPI cards, region chart, feed health bars, data table
- **Lineage Flow:** Interactive flow visualization with Master Book and Feed filters (defaults to first master book)
- **Detail Grid:** Full sortable/paginated table, click row to see lineage
- **Filters:** Region, Feed, Named P&L, SLA breach toggle, free-text search
