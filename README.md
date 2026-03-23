---
title: MRU Admissions Dashboard
emoji: 📊
colorFrom: blue
colorTo: indigo
sdk: docker
app_file: app.py
pinned: false
---

# MRU Admissions Dashboard

A real-time admissions analytics dashboard for Manav Rachna University, powered by Google Sheets and FastAPI.

## 🎯 Features

✅ **Live Google Sheets Integration** - Data syncs from Google Sheets in real-time
✅ **6 Interactive Pages** - Overview, AI Insights, Trends, Programs, Schools, Intake Analysis
✅ **25+ Data Visualizations** - Line charts, bar charts, radar charts, bubble charts, and more
✅ **Dynamic Sheet Discovery** - Automatically detects new date sheets (e.g., "23 March", "29 March")
✅ **On-Demand Refresh** - Teachers click to pull latest data from Google Sheets
✅ **AI-Generated Insights** - Automated analytics and trend analysis
✅ **Search & Filter** - Find programs by school, category, and year
✅ **Beautiful UI** - Glassmorphism design with dark theme

## 🏗️ Architecture

```
Google Sheets (Data Source)
    ↓ [Google Sheets API]
FastAPI Backend (app.py)
    ├─ Dynamically reads all date sheets
    ├─ Transforms to JSON format
    └─ Serves via /data endpoint
    ↓
Dashboard Frontend (index.html + app.js)
    ├─ Loads data from /data endpoint
    ├─ Renders 25+ interactive charts
    ├─ Calculates real-time metrics
    └─ Provides search & filter
    ↓
Browser Display
```

## 📊 Data Structure

Two types of sheets in your Google Sheet:

**Metadata Sheets:**
- `Master Data-Date wise` - Time series (overall admissions per date)
- `Master Data School-Datewise` - School aggregations

**Date Snapshot Sheets:**
- `1 JAN`, `15 Jan`, `31 Jan`, ..., `31 Oct` (existing)
- `23 March`, `29 March` (new sheets auto-discovered!)

Each date sheet contains:
```
Program | School | 2024 Intake | 2024 Admissions | 2024 Withdrawals |
2025 Intake | 2025 Admissions | 2025 Withdrawals |
2026 Intake | 2026 Admissions | 2026 Withdrawals
```

## 🔧 Setup Instructions

### 1. Prerequisites
- Python 3.9+
- FastAPI, uvicorn, httpx
- Google Sheets API credentials

### 2. Get Google Sheets API Credentials

1. Create a Google Cloud project: https://console.cloud.google.com
2. Enable "Google Sheets API"
3. Create a service account or API key
4. Copy your SHEET ID and API KEY

### 3. Configure Environment Variables

Create a `.env` file:
```
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_API_KEY=your_api_key_here
```

For HuggingFace Spaces, add these as Secrets in the Space settings.

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Run Locally

```bash
uvicorn app:app --reload
```

Visit: http://localhost:8000

### 6. Deploy to HuggingFace Spaces

1. Create a new Space on HuggingFace: https://huggingface.co/spaces
2. Choose "Docker" as the SDK
3. Push this repo to the Space
4. Add `GOOGLE_SHEET_ID` and `GOOGLE_API_KEY` in Space Secrets
5. Space will auto-build and deploy!

## 📋 Key Endpoints

- `GET /` - Serve dashboard UI
- `GET /data` - Fetch all dashboard data (dynamically discovers sheets)
- `GET /health` - Health check

## 🎨 Dashboard Pages

| Page | Purpose |
|------|---------|
| **Overview** | KPIs, admission trajectory, growth rate, program mix |
| **AI Insights** | Auto-generated analytics, alerts, forecasts |
| **Trends & Growth** | Advanced trend analysis, growth rates, radar charts |
| **Program Analysis** | Program-wise metrics, rankings, withdrawals |
| **School Comparison** | School performance, capacity utilization, fill rates |
| **Intake vs Fill Rate** | Capacity analysis, unmet demand, utilization |

## 💻 Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | FastAPI + Uvicorn |
| Frontend | HTML5 + CSS3 + Vanilla JS |
| Charts | Chart.js v4.4.0 |
| Data Source | Google Sheets API |
| Hosting | HuggingFace Spaces |

## 📝 How It Works

### Data Flow

1. **Teacher edits Google Sheet** - Updates program data, adds new date sheets
2. **Click "Refresh Data"** - Frontend fetches `/data` endpoint
3. **Backend processes** - Reads all sheets, calculates metrics
4. **Dashboard updates** - Charts refresh with new data
5. **Real-time viz** - All 25+ charts animate with new values

### New Sheet Detection

When a teacher adds a new sheet (e.g., "23 March"):
1. Backend's `get_sheet_names()` auto-discovers it
2. Data is immediately available
3. No code changes needed!

## 📊 Comparison Metrics

The dashboard automatically calculates:

- **YoY Growth %** - Year-over-year admission growth
- **Fill Rate %** - (Admissions / Intake) × 100
- **Withdrawal Impact** - Programs with high dropouts
- **Program Rankings** - Top performers by metrics
- **Velocity Curves** - Admission speed per day/week
- **Unmet Demand** - Programs with unfilled seats
- **Category Mix** - Distribution across program types
- **AI Insights** - Auto-generated narrative analysis

## 🔐 Security Considerations

- API credentials stored in HF Secrets (hidden)
- No password/auth yet (can be added)
- CORS enabled for all origins (configure as needed)
- Data is read-only from Google Sheets

## 🚀 Future Enhancements

- [ ] Password-protected data editor page
- [ ] Search & filter by program/school/category
- [ ] Export to CSV/PDF
- [ ] Mobile-responsive design
- [ ] Dark/Light theme toggle
- [ ] User authentication
- [ ] Audit trail for edits

## 📞 Support

For issues or questions:
1. Check the dashboard `/health` endpoint
2. Verify Google Sheets API credentials
3. Check HF Space logs if deployed

## 📄 License

MIT License - Feel free to use and modify!

---

**Built with ❤️ for Manav Rachna University**
