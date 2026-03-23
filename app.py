"""
MRU Admissions Dashboard — HuggingFace Space Backend
Reads directly from Google Sheets API. Dynamically discovers all date sheets.
No database, no sync endpoint. Real-time Google Sheets integration.

HF Secrets required:
  GOOGLE_SHEET_ID  — the spreadsheet ID
  GOOGLE_API_KEY   — restricted API key (Google Sheets API only)
"""

import os
import re
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

SHEET_ID = os.environ.get("GOOGLE_SHEET_ID", "")
API_KEY  = os.environ.get("GOOGLE_API_KEY", "")

# School name rows in the sheet (rows where program column = school name only)
SCHOOL_NAMES = {"MRSoE", "MRSoM&C", "MRSoS", "MRSoE&H", "MRSoL"}

# Sheets to skip (metadata/summary sheets)
SKIP_SHEETS = {"Master Data-Date wise", "Master Data School-Datewise"}


def to_int(val):
    """Safely convert a cell value to int."""
    try:
        return int(val) if val not in (None, "", "N/A") else 0
    except (ValueError, TypeError):
        return 0


async def get_sheet_names(client: httpx.AsyncClient) -> list:
    """Fetch all sheet names from the spreadsheet metadata."""
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}"
    resp = await client.get(url, params={"key": API_KEY})
    if resp.status_code != 200:
        return []

    data = resp.json()
    sheets = data.get("sheets", [])
    names = [sheet["properties"]["title"] for sheet in sheets]
    # Filter out metadata sheets, keep only date snapshots
    return [name for name in names if name not in SKIP_SHEETS]


async def fetch_sheet_range(client: httpx.AsyncClient, sheet_name: str, cell_range: str = "A1:J200") -> list:
    """Fetch a range from a sheet via Google Sheets API v4."""
    encoded = httpx.URL("").copy_with(
        path=f"/v4/spreadsheets/{SHEET_ID}/values/{sheet_name}!{cell_range}"
    )
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}/values/{sheet_name}!{cell_range}"
    resp = await client.get(url, params={"key": API_KEY})
    if resp.status_code != 200:
        return []
    return resp.json().get("values", [])


def detect_school(program_name: str) -> str:
    """Detect school from program name prefix or known school rows."""
    n = program_name.strip()
    if n in SCHOOL_NAMES:
        return n
    return ""


def parse_date_sheet(rows: list, label: str) -> tuple[list, int, int, int]:
    """
    Parse a date snapshot sheet into program records.
    Sheet layout (row 0 = title, row 1 = headers, row 2+ = data):
      Col 0: Faculty/Program
      Col 1: Intake 2024-25
      Col 2: Net Admissions 2024
      Col 3: Withdrawals 2024-25
      Col 4: Intake 2025-26
      Col 5: Net Admissions 2025
      Col 6: Withdrawals 2025-26
      Col 7: Intake 2026-27
      Col 8: Net Admissions 2026
      Col 9: Withdrawals 2026-27

    Returns (program_records, total_2024, total_2025, total_2026)
    """
    if len(rows) < 3:
        return [], 0, 0, 0

    records = []
    current_school = ""
    total = {"2024": 0, "2025": 0, "2026": 0}

    for row in rows[2:]:  # skip title + header rows
        if not row or not row[0]:
            continue

        name = str(row[0]).strip()
        if not name:
            continue

        # School header row — no numeric data
        if name in SCHOOL_NAMES:
            current_school = name
            continue

        # Skip "Total" summary rows
        if name.lower().startswith("total"):
            # Capture totals from the Total MRU row for time_series
            if "mru" in name.lower() or name.lower() == "total":
                total["2024"] = to_int(row[2]) if len(row) > 2 else 0
                total["2025"] = to_int(row[5]) if len(row) > 5 else 0
                total["2026"] = to_int(row[8]) if len(row) > 8 else 0
            continue

        records.append({
            "school":  current_school,
            "program": name,
            "2024": {
                "intake":      to_int(row[1]) if len(row) > 1 else 0,
                "admissions":  to_int(row[2]) if len(row) > 2 else 0,
                "withdrawals": to_int(row[3]) if len(row) > 3 else 0,
            },
            "2025": {
                "intake":      to_int(row[4]) if len(row) > 4 else 0,
                "admissions":  to_int(row[5]) if len(row) > 5 else 0,
                "withdrawals": to_int(row[6]) if len(row) > 6 else 0,
            },
            "2026": {
                "intake":      to_int(row[7]) if len(row) > 7 else 0,
                "admissions":  to_int(row[8]) if len(row) > 8 else 0,
                "withdrawals": to_int(row[9]) if len(row) > 9 else 0,
            },
        })

    # If no Total MRU row found, sum from records
    if total["2024"] == 0 and total["2025"] == 0:
        for r in records:
            total["2024"] += r["2024"]["admissions"]
            total["2025"] += r["2025"]["admissions"]
            total["2026"] += r["2026"]["admissions"]

    return records, total["2024"], total["2025"], total["2026"]


def guess_category(name: str) -> str:
    n = name.lower()
    if ("b.tech" in n or "btech" in n) and ("cse" in n or "computer science" in n):
        return "B.Tech CSE"
    if "b.tech" in n or "btech" in n or "lateral" in n:
        return "B.Tech Other"
    if "bca" in n or "bba" in n or "mba" in n:
        return "BCA/BBA/MBA"
    if "m.tech" in n or "m.sc" in n or "msc" in n:
        return "M.Tech/M.Sc"
    return "Other Programs"


@app.get("/data")
async def get_data():
    """
    Dynamically reads all date sheets from Google Sheets and returns the full dashboard JSON.
    Automatically discovers new date sheets (e.g., "23 March", "29 March").
    Shape matches dashboard_data.json exactly.
    """
    if not SHEET_ID or not API_KEY:
        raise HTTPException(status_code=500, detail="GOOGLE_SHEET_ID or GOOGLE_API_KEY not set in environment")

    time_series = []
    faculty_breakdown = {}

    async with httpx.AsyncClient(timeout=30) as client:
        # Dynamically fetch all date sheet names
        date_sheets = await get_sheet_names(client)

        for sheet_name in date_sheets:
            rows = await fetch_sheet_range(client, sheet_name)
            if not rows:
                continue

            # Use sheet name as label (will match format like "31 Oct", "23 March", etc.)
            label = sheet_name
            records, t24, t25, t26 = parse_date_sheet(rows, label)

            if records:
                faculty_breakdown[label] = records

            time_series.append({
                "date":  label,
                "2024":  t24,
                "2025":  t25,
                "2026":  t26,
            })

    # Sort time series by date for consistent ordering
    time_series.sort(key=lambda x: x["date"])

    # Build program_categories from last date snapshot
    program_categories = {}
    if faculty_breakdown:
        last_date = list(faculty_breakdown.keys())[-1]
        for p in faculty_breakdown[last_date]:
            cat = guess_category(p["program"])
            if cat not in program_categories:
                program_categories[cat] = {
                    "intake_2024": 0, "admissions_2024": 0,
                    "intake_2025": 0, "admissions_2025": 0,
                    "intake_2026": 0, "admissions_2026": 0,
                }
            c = program_categories[cat]
            c["intake_2024"]     += p["2024"]["intake"]
            c["admissions_2024"] += p["2024"]["admissions"]
            c["intake_2025"]     += p["2025"]["intake"]
            c["admissions_2025"] += p["2025"]["admissions"]
            c["intake_2026"]     += p["2026"]["intake"]
            c["admissions_2026"] += p["2026"]["admissions"]

    from datetime import datetime

    return {
        "time_series":       time_series,
        "faculty_breakdown": faculty_breakdown,
        "program_categories": program_categories,
        "config": {
            "years": [2024, 2025, 2026],
            "yearLabels": {
                "2024": "2024–25",
                "2025": "2025–26",
                "2026": "2026–27"
            },
            "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            "currentDate": time_series[-1]["date"] if time_series else "N/A",
            "schools": [
                {"name": "MRSoE", "color": "#FF6B6B", "labelEn": "School of Engineering"},
                {"name": "MRSoM&C", "color": "#4ECDC4", "labelEn": "School of Management & Commerce"},
                {"name": "MRSoS", "color": "#FFE66D", "labelEn": "School of Sciences"},
                {"name": "MRSoE&H", "color": "#95E1D3", "labelEn": "School of Education & Humanities"},
                {"name": "MRSoL", "color": "#A8D8EA", "labelEn": "School of Law"}
            ],
            "pages": ["overview", "insights", "trends", "programs", "schools", "intake", "editor"],
            "pageLabels": {
                "overview": "Overview",
                "insights": "AI Insights",
                "trends": "Trends",
                "programs": "Programs",
                "schools": "Schools",
                "intake": "Intake Analysis",
                "editor": "Data Editor"
            },
            "thresholds": {
                "intakeConcern": 20,
                "fillRateHigh": 70,
                "fillRateMedium": 40,
                "gapThreshold": 50
            },
            "ui": {
                "truncateLimits": {
                    "program": 40,
                    "programShort": 25,
                    "school": 28,
                    "gap": 30
                },
                "limits": {
                    "topPrograms": 10,
                    "topWithdrawals": 15,
                    "radarSchools": 6,
                    "topGaps": 12
                },
                "animation": {
                    "pageNav": 80,
                    "loadingDelay": 400,
                    "counterDuration": 1400
                },
                "precision": {
                    "main": 1,
                    "percentage": 1
                },
                "defaultSchoolLabel": "Unknown"
            },
            "language": "en",
            "strings": {
                "totalIntake": {"en": "Total Intake"},
                "netAdmissions": {"en": "Net Admissions"},
                "withdrawals": {"en": "Withdrawals"},
                "intakeRate": {"en": "Intake Rate"},
                "fillRate": {"en": "Fill Rate"},
                "unmetDemand": {"en": "Unmet Demand"}
            }
        }
    }


@app.get("/health")
def health():
    return {"status": "ok", "sheet_id_set": bool(SHEET_ID), "api_key_set": bool(API_KEY)}


@app.get("/")
def root():
    return FileResponse("index.html")


# Serve static files (index.html, app.js, style.css)
app.mount("/", StaticFiles(directory=".", html=True), name="static")
