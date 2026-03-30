# P&L Lineage Intelligence Dashboard v2.0

Granular per-business-date dashboard for monitoring BOFC-to-Delivery duration SLAs across Named P&Ls, Master Books, and Feeds. No averages — every data point is shown per business date.

- **Backend:** Python FastAPI serving data from 2 CSV files
- **Frontend:** React + Vite + TypeScript with recharts, deployed as static files on IIS

---

## Prerequisites

- Python 3.9+
- Node.js 18+
- npm 9+
- (Production) Windows Server with IIS and NSSM

---

## Project Structure

```
onepnldashboard/
├── backend/
│   ├── main.py                    # FastAPI app (6 endpoints)
│   ├── models.py                  # Pydantic response models
│   ├── requirements.txt           # Python dependencies
│   ├── generate_data.py           # Sample data generator (--month, --year)
│   ├── services/
│   │   ├── csv_loader.py          # Dual-CSV loader (workflow + feed)
│   │   ├── filters.py             # Month/area filter options
│   │   ├── workflow.py            # Overview, area drilldown, NPL detail
│   │   └── feed_lineage.py        # Feed OLA vs Arrived per NPL
│   └── data/
│       ├── npl_workflow.csv       # Workflow delivery data
│       └── feed_to_npl.csv        # Feed lineage data
├── frontend/
│   ├── package.json
│   ├── vite.config.ts             # Proxy /api → localhost:8000 (dev only)
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── App.tsx                # Hierarchical drill-down app
│       ├── main.tsx
│       ├── api/client.ts          # Axios API client (5 endpoints)
│       ├── types/pnl.ts           # TypeScript interfaces
│       ├── utils/time.ts          # 12hr time parser, date formatter
│       ├── hooks/
│       │   └── useDashboard.ts    # State: month → area → NPL
│       ├── components/
│       │   ├── Layout.tsx         # Header, month selector, breadcrumbs
│       │   ├── MonthSelector.tsx  # Month button row
│       │   ├── BusinessAreaFilter.tsx  # Multi-select area filter
│       │   ├── BusinessAreaCard.tsx    # Green/amber/red area card
│       │   ├── OverviewGrid.tsx       # Grid of area cards
│       │   ├── NplListTable.tsx       # NPLs within an area
│       │   ├── TimestampChart.tsx     # BOFC/Manual/Delivery line chart
│       │   ├── DurationChart.tsx      # Stacked duration bar chart
│       │   ├── NplDetailView.tsx      # NPL detail with 3 tabs
│       │   └── FeedLineageTable.tsx   # Collapsible feed groups
│       └── styles/tokens.ts      # Design tokens
└── README.md
```

---

## CSV Quick Reference

### File 1: `feed_to_npl.csv` (Feed → MasterBook → NPL lineage)

| Column | Example |
|--------|---------|
| BusinessDate | 2025-09-01 |
| NamedPnlId | NPL-0100 |
| NamedPnlName | Credit Flow NA |
| MasterBookId | MB-79655 |
| MasterBookName | Book_Credit_55 |
| FeedName | Endur |
| FeedOLA | 3:52:59 AM |
| FeedArrived | 3:36:06 AM |
| FeedDelayed | False |

### File 2: `npl_workflow.csv` (NPL Workflow/Delivery)

| Column | Example |
|--------|---------|
| BusinessDate | 2025-09-01 |
| BusinessArea | Credit Trading |
| NamedPnlId | NPL-0100 |
| NamedPnlName | Credit Flow NA |
| BOFCCompletedOn | 8:10:59 AM |
| ManualCompletedOn | 8:56:26 AM |
| DeliveryPCLocationTime | 10:58:52 AM |
| BOFCToManual | 0.76 |
| ManualToPC | 2.04 |
| BOFCToPC | 2.8 |

**Key notes:**
- Times are in 12hr format (e.g., `3:52:59 AM`)
- Durations (`BOFCToManual`, `ManualToPC`, `BOFCToPC`) are in decimal hours
- `FeedDelayed` is a boolean (`True`/`False`)
- Both files share `BusinessDate`, `NamedPnlId`, `NamedPnlName` as join keys

---

## CSV File Specifications (Detailed)

Place your real data files in `backend/data/`. The app loads them on startup.
If files are missing, sample data is auto-generated.

### File 1: `npl_workflow.csv` — Workflow Delivery

One row per Named PNL per business date.

| Column | Type | Format | Example | Description |
|--------|------|--------|---------|-------------|
| BusinessDate | date | YYYY-MM-DD | `2026-02-03` | Business date |
| BusinessArea | text | | `Credit Trading` | Business area name |
| NamedPnlId | text | | `NPL-0100` | Unique PNL identifier |
| NamedPnlName | text | | `Credit Flow NA` | PNL display name |
| BOFCCompletedOn | time | 12hr IST | `4:29:00 AM` | Book Open For Correction completed |
| ManualCompletedOn | time | 12hr IST | `1:37:57 PM` | First manual step completed |
| DeliveryPCLocationTime | time | 12hr IST | `3:45:12 PM` | VP sign-off / delivery PC time |
| BOFCToManual | decimal | hours | `9.15` | ManualCompletedOn − BOFCCompletedOn |
| ManualToPC | decimal | hours | `2.12` | DeliveryPCLocationTime − ManualCompletedOn |
| BOFCToPC | decimal | hours | `11.27` | DeliveryPCLocationTime − BOFCCompletedOn |

Sample:
```csv
BusinessDate,BusinessArea,NamedPnlId,NamedPnlName,BOFCCompletedOn,ManualCompletedOn,DeliveryPCLocationTime,BOFCToManual,ManualToPC,BOFCToPC
2026-02-03,Credit Trading,NPL-0100,Credit Flow NA,4:29:00 AM,1:37:57 PM,3:45:12 PM,9.15,2.12,11.27
2026-02-04,Credit Trading,NPL-0100,Credit Flow NA,5:10:22 AM,10:15:00 AM,12:30:45 PM,5.08,2.26,7.34
2026-02-03,Rates Trading,NPL-0114,Rates NA,3:15:00 AM,6:45:30 AM,8:20:00 AM,3.51,1.57,5.08
```

### File 2: `feed_to_npl.csv` — Feed Lineage

One row per Feed per MasterBook per Named PNL per business date.

| Column | Type | Format | Example | Description |
|--------|------|--------|---------|-------------|
| BusinessDate | date | YYYY-MM-DD | `2026-02-03` | Business date |
| NamedPnlId | text | | `NPL-0100` | Must match workflow file |
| NamedPnlName | text | | `Credit Flow NA` | Must match workflow file |
| MasterBookId | text | | `MB-68910` | Master book identifier |
| MasterBookName | text | | `Book_Credit_10` | Master book display name |
| FeedName | text | | `Calypso` | Feed system name |
| FeedOLA | time | 12hr IST | `2:00:00 AM` | Expected arrival (OLA) |
| FeedArrived | time | 12hr IST | `2:15:30 AM` | Actual arrival time |
| FeedDelayed | boolean | | `True` or `False` | True if FeedArrived > FeedOLA |

Sample:
```csv
BusinessDate,NamedPnlId,NamedPnlName,MasterBookId,MasterBookName,FeedName,FeedOLA,FeedArrived,FeedDelayed
2026-02-03,NPL-0100,Credit Flow NA,MB-68910,Book_Credit_10,Calypso,2:00:00 AM,2:15:30 AM,True
2026-02-03,NPL-0100,Credit Flow NA,MB-68910,Book_Credit_10,Murex,3:00:00 AM,2:50:00 AM,False
```

### Multi-Month Support

Include multiple months in the same files. The dashboard auto-detects available months from the `BusinessDate` column:

```csv
2026-02-03,Credit Trading,NPL-0100,...
2026-02-04,Credit Trading,NPL-0100,...
2026-03-03,Credit Trading,NPL-0100,...
2026-03-04,Credit Trading,NPL-0100,...
```

The month selector will show both **Feb** and **Mar** automatically.

### Important Notes

- `NamedPnlId` and `NamedPnlName` must be consistent between both files
- Time format must be 12-hour with AM/PM: `1:37:57 PM`, `4:29:00 AM`
- Duration columns are in decimal hours (e.g., 5.25 = 5 hours 15 minutes)
- `FeedDelayed` accepts `True`/`False`, `true`/`false`, `1`/`0`

---

## Running Locally (Development)

### 1. Start the Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

If `backend/data/npl_workflow.csv` doesn't exist, sample data is auto-generated on first startup.

To regenerate sample data manually:
```bash
python generate_data.py                 # Feb 2026 (default)
python generate_data.py --month 3       # Mar 2026
python generate_data.py --month 3 --year 2026
```

Verify:
```bash
curl http://localhost:8000/api/health
# {"status":"ok","workflow_rows":3620,"feed_rows":42300}
```

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

The Vite dev server proxies `/api` requests to `http://localhost:8000`.

#### Corporate / Private npm Registry

If `npm install` fails with 404 errors on your internal registry:

```cmd
del package-lock.json
rmdir /s /q node_modules
npm install
npm run dev
```

---

## Production Deployment on Windows

### Architecture

```
                    ┌──────────────────────────┐
                    │       IIS (Port 80)       │
 Browser ─────────►│                            │
                    │  Static files: /           │──► frontend/dist/
                    │  Reverse proxy: /api/*     │──► http://localhost:8000
                    │                            │
                    └──────────────────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │  Python FastAPI (NSSM)    │
                    │  Port 8000                │
                    │  backend/                 │
                    └──────────────────────────┘
```

- **IIS** serves the React build (`frontend/dist/`) as static files and reverse-proxies `/api` to the Python backend
- **NSSM** runs the Python FastAPI backend as a Windows service

---

### Step 1: Install Prerequisites on Windows

```cmd
REM Install Python 3.9+ from https://www.python.org/downloads/
REM Ensure "Add to PATH" is checked during install

REM Install Node.js 18+ from https://nodejs.org/

REM Install NSSM (Non-Sucking Service Manager)
REM Download from https://nssm.cc/download
REM Extract nssm.exe to C:\tools\nssm\ and add to PATH

REM Enable IIS features
REM Control Panel → Programs → Turn Windows features on or off
REM Check: Internet Information Services
REM Check: Internet Information Services → World Wide Web Services → Application Development Features
REM Check: Internet Information Services → Web Management Tools → IIS Management Console
```

### Step 2: Deploy the Backend (Python + NSSM)

```cmd
REM Copy project to server
mkdir C:\apps\onepnldashboard
xcopy /E /I onepnldashboard C:\apps\onepnldashboard

REM Set up Python virtual environment
cd C:\apps\onepnldashboard\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
deactivate

REM Place your real CSV files
REM Copy your npl_workflow.csv to C:\apps\onepnldashboard\backend\data\npl_workflow.csv
REM Copy your feed_to_npl.csv to C:\apps\onepnldashboard\backend\data\feed_to_npl.csv

REM Test the backend starts correctly
cd C:\apps\onepnldashboard\backend
venv\Scripts\python -m uvicorn main:app --host 0.0.0.0 --port 8000
REM Verify: open http://localhost:8000/api/health in browser
REM Press Ctrl+C to stop
```

#### Register as Windows Service with NSSM

```cmd
nssm install PnLDashboardAPI

REM In the NSSM dialog:
REM   Path:              C:\apps\onepnldashboard\backend\venv\Scripts\python.exe
REM   Startup directory: C:\apps\onepnldashboard\backend
REM   Arguments:         -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Or via command line:

```cmd
nssm install PnLDashboardAPI "C:\apps\onepnldashboard\backend\venv\Scripts\python.exe" "-m uvicorn main:app --host 0.0.0.0 --port 8000"
nssm set PnLDashboardAPI AppDirectory "C:\apps\onepnldashboard\backend"
nssm set PnLDashboardAPI DisplayName "PnL Dashboard API"
nssm set PnLDashboardAPI Description "FastAPI backend for P&L Lineage Dashboard"
nssm set PnLDashboardAPI Start SERVICE_AUTO_START

REM Configure logging
nssm set PnLDashboardAPI AppStdout "C:\apps\onepnldashboard\logs\api-stdout.log"
nssm set PnLDashboardAPI AppStderr "C:\apps\onepnldashboard\logs\api-stderr.log"
nssm set PnLDashboardAPI AppRotateFiles 1
nssm set PnLDashboardAPI AppRotateBytes 10485760

REM Create logs directory
mkdir C:\apps\onepnldashboard\logs

REM Start the service
nssm start PnLDashboardAPI
```

#### NSSM Service Management

```cmd
nssm start PnLDashboardAPI      REM Start service
nssm stop PnLDashboardAPI       REM Stop service
nssm restart PnLDashboardAPI    REM Restart (e.g., after CSV update)
nssm status PnLDashboardAPI     REM Check status
nssm edit PnLDashboardAPI       REM Edit settings (opens GUI)
nssm remove PnLDashboardAPI     REM Uninstall service
```

### Step 3: Build the Frontend

```cmd
cd C:\apps\onepnldashboard\frontend
npm install
npm run build
```

This creates `C:\apps\onepnldashboard\frontend\dist\` containing:
```
dist/
├── index.html
└── assets/
    └── index-XXXXXXXX.js
```

### Step 4: Configure IIS

#### 4a. Install URL Rewrite Module

Download and install from: https://www.iis.net/downloads/microsoft/url-rewrite

This is required for the reverse proxy from IIS to the Python backend.

#### 4b. Install Application Request Routing (ARR)

Download and install from: https://www.iis.net/downloads/microsoft/application-request-routing

After installing, enable proxy:
1. Open IIS Manager
2. Click the server name (top level)
3. Double-click **Application Request Routing Cache**
4. Click **Server Proxy Settings** in the right panel
5. Check **Enable proxy**
6. Click **Apply**

#### 4c. Create IIS Site

1. Open IIS Manager
2. Right-click **Sites** → **Add Website**
   - Site name: `PnLDashboard`
   - Physical path: `C:\apps\onepnldashboard\frontend\dist`
   - Port: `80` (or your preferred port)
   - Host name: (leave blank for default, or set your hostname)
3. Click **OK**

#### 4d. Add web.config for Reverse Proxy and SPA Routing

Create the file `C:\apps\onepnldashboard\frontend\dist\web.config`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>

    <!-- Serve static files with correct MIME types -->
    <staticContent>
      <remove fileExtension=".js" />
      <mimeMap fileExtension=".js" mimeType="application/javascript" />
      <remove fileExtension=".json" />
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <remove fileExtension=".woff2" />
      <mimeMap fileExtension=".woff2" mimeType="font/woff2" />
    </staticContent>

    <rewrite>
      <rules>
        <!-- Rule 1: Reverse proxy /api/* to Python backend -->
        <rule name="API Proxy" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:8000/api/{R:1}" />
        </rule>

        <!-- Rule 2: SPA fallback — serve index.html for all non-file routes -->
        <rule name="SPA Fallback" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>

  </system.webServer>
</configuration>
```

#### 4e. Set Folder Permissions

```cmd
icacls "C:\apps\onepnldashboard\frontend\dist" /grant "IIS_IUSRS:(OI)(CI)R" /T
```

### Step 5: Verify Deployment

1. Check the Python service is running:
   ```cmd
   nssm status PnLDashboardAPI
   curl http://localhost:8000/api/health
   ```

2. Open the dashboard in a browser:
   ```
   http://your-server-name/
   ```

3. You should see:
   - Month selector at the top (showing months from your data)
   - Business area cards with green/amber/red status
   - Click any card → see Named PNLs
   - Click any NPL → see per-date duration and timestamp charts

---

## Updating Data

When you get new CSV files:

1. Replace the files in `C:\apps\onepnldashboard\backend\data\`:
   ```cmd
   copy /Y \\share\npl_workflow.csv C:\apps\onepnldashboard\backend\data\npl_workflow.csv
   copy /Y \\share\feed_to_npl.csv  C:\apps\onepnldashboard\backend\data\feed_to_npl.csv
   ```

2. Restart the backend to reload the data:
   ```cmd
   nssm restart PnLDashboardAPI
   ```

3. Refresh the dashboard in the browser. New months will appear automatically.

---

## API Endpoints

| Method | Endpoint | Query Params | Description |
|--------|----------|--------------|-------------|
| GET | `/api/health` | | Health check with row counts |
| GET | `/api/filters` | | Available months, business areas, NPL names |
| GET | `/api/overview` | `month`, `areas` (comma-separated) | Business area cards with SLA status |
| GET | `/api/area/{area_name}` | `month` | NPLs within a business area |
| GET | `/api/npl/{npl_id}` | `month` | Per-date timestamps and durations |
| GET | `/api/npl/{npl_id}/feeds` | `month` | Feed OLA vs Arrived per date |

Examples:
```
GET /api/overview?month=Feb
GET /api/overview?month=Feb&areas=Credit%20Trading,Rates%20Trading
GET /api/area/Credit%20Trading?month=Feb
GET /api/npl/NPL-0100?month=Feb
GET /api/npl/NPL-0100/feeds?month=Feb
```

---

## Key Business Rules

- **SLA Breach:** BOFCToPC > 5 hours = breach
- **Business Area Status:**
  - Green: 98%+ of (NPL, date) pairs delivered within 5 hours
  - Amber: 80% to 98% within 5 hours
  - Red: Less than 80% within 5 hours
- **No averages:** Every data point is per business date
- **Timestamps:** IST 12-hour format (e.g., `2:29:00 PM`)
- **Durations:** Decimal hours (e.g., `5.25` = 5 hours 15 minutes)
- **Data Hierarchy:** Business Area → Named PNL → Master Book → Feed

## Dashboard Features

- **Overview:** Color-coded business area cards (green/amber/red) with on-time percentage
- **Area Drilldown:** Sortable table of Named PNLs within an area
- **NPL Detail — Duration Breakdown:** Stacked bar chart (BOFC→Manual + Manual→PC) with 5h SLA line. Click any bar to see timestamps
- **NPL Detail — Timestamp Timeline:** Line chart showing BOFC, Manual, and Delivery PC times per date
- **NPL Detail — Feed Lineage:** Collapsible feed groups showing OLA vs Arrived with delay indicators
- **Breadcrumb Navigation:** Overview → Business Area → Named PNL with back button
- **Month Selector:** Switch between months (auto-populated from data)
- **Business Area Filter:** Multi-select to filter the overview

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Backend won't start | Check `C:\apps\onepnldashboard\logs\api-stderr.log` |
| IIS shows 500 error on /api | Ensure ARR proxy is enabled and URL Rewrite is installed |
| IIS shows 404 on refresh | Ensure `web.config` is in the `dist` folder |
| Dashboard shows "API Error" | Verify backend is running: `curl http://localhost:8000/api/health` |
| No months appear in selector | Check CSV files exist in `backend/data/` and have correct column names |
| NSSM service won't start | Run the uvicorn command manually first to check for Python errors |
| npm install fails on corporate network | Delete `package-lock.json` and `node_modules`, then run `npm install` again |
