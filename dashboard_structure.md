# MRU Admissions Dashboard — Complete Structure

## Pages Overview
Total Pages: 6

---

## Page 1: Overview

### KPI Tiles
| Icon | Title | Sub |
|------|-------|-----|
| 📊 | Peak Admissions 2024 | All programs |
| 📈 | Peak Admissions 2025 | All programs (with delta vs 2024) |
| 🎓 | Admissions 2026 YTD | New session (with delta vs 2025) |
| 🏫 | Total Intake 2025 | Sanctioned seats |
| ⚡ | Fill Rate 2025 | Capacity utilized |
| 📤 | Withdrawals 2025 | Students withdrawn |

### Charts
1. **Admission Trajectory** — Line chart
   - Cumulative admissions across all three sessions
   - Lines: 2024 (cyan), 2025 (purple), 2026 (blue)

2. **Year-over-Year Growth** — Bar chart
   - Monthly delta: 2025 vs 2024
   - Green bars = positive, Red bars = negative

3. **Program Category Mix** — Donut chart
   - Intake distribution by program type
   - Categories: B.Tech CSE, B.Tech Other, BCA/BBA/MBA, M.Tech/M.Sc, Other Programs

4. **Admission Velocity** — Bar chart
   - Monthly new admissions rate per period
   - Shows 2024 and 2025 side by side

5. **2026 Fill Rate by Category** — Horizontal bar chart
   - Admissions as % of total intake per category
   - Green ≥70%, Amber ≥40%, Red <40%

---

## Page 2: AI Insights

### Sections
1. **Header Banner**
   - Title: "Automated Data Intelligence"
   - Subtitle: Real-time analytical narrative from 2024–2026 dataset

2. **Growth & Strengths** (green card)
   - Overall YoY growth count and percentage vs 2024
   - Highest growth program (biggest volume increase)
   - Flagship performer (highest total admissions in 2025)

3. **Alerts & Constraints** (red card)
   - Withdrawal alert: program with highest dropouts
   - Unmet demand gap: program with most unfilled seats and fill rate %

4. **Executive Trajectory Forecast** (cyan card)
   - Velocity-based projection narrative
   - Shows recent admissions run-rate per day
   - Projects whether 2025 will exceed 2024 peak

---

## Page 3: Trends & Growth

### Charts
1. **Full Admissions Timeline** — Line chart
   - Complete date-by-date cumulative admissions
   - All 3 sessions: 2024-25, 2025-26, 2026-27

2. **Cumulative Growth Rate %** — Line chart
   - Session growth rate over time relative to Jan baseline
   - Shows 2024 and 2025 growth curves

3. **Net Admissions Acceleration** — Bar chart
   - Period-to-period incremental gain (second derivative)
   - Shows 2024 and 2025 acceleration side by side

4. **2024 vs 2025 Admissions — Radar** — Radar chart
   - Month-by-month head-to-head comparison
   - 2024 (cyan) vs 2025 (purple)

5. **Session Peak Comparison** — Bar chart
   - Monthly max admissions per session
   - Jan through Oct, 2024 vs 2025

---

## Page 4: Program Analysis

### Controls
- Date Snapshot selector (all available dates)
- Year selector: 2024-25 / 2025-26 / 2026-27
- Metric selector: Net Admissions / Intake / Withdrawals

### Charts
1. **Program-wise Comparison** — Horizontal bar chart
   - All programs ranked by selected metric
   - All 3 years shown side by side
   - Scrollable (dynamic height based on program count)

2. **Top 10 Programs by Admissions** — Horizontal bar chart
   - Top 10 highest admission programs for selected year
   - Each bar has a different color

3. **Program Type Breakdown** — Grouped bar chart
   - Category-by-category intake vs admissions
   - 2025 data, intake (light) vs admissions (solid)

4. **Withdrawal Analysis** — Horizontal bar chart
   - Top 15 programs with highest withdrawals
   - For selected year, rose/red color

5. **New vs Discontinued Programs** — Donut chart
   - Continued (2024→2026): green
   - New in 2026: blue
   - Discontinued by 2026: red
   - Only in 2025: amber

---

## Page 5: School Comparison

### Controls
- Date Snapshot selector (all available dates)

### Schools Tracked
- MRSoE (Engineering)
- MRSoM&C (Management & Commerce)
- MRSoS (Sciences)
- MRSoE&H (Education & Humanities)
- MRSoL (Law)

### Charts
1. **School-wise Admissions** — Grouped bar chart
   - Net admissions by school
   - All 3 years side by side

2. **School Intake Distribution** — Pie chart
   - Seat allocation share by school
   - Shows which school has most sanctioned seats

3. **School Performance Radar** — Radar chart
   - Multi-dimensional: Intake, Admissions, Withdrawals
   - One shape per school

4. **School Fill Rate 2024 vs 2025 vs 2026** — Bar chart
   - Schools ranked by % of intake filled
   - All 3 years compared

5. **School Withdrawals** — Bar chart
   - Per-school dropout count
   - All 3 sessions

---

## Page 6: Intake vs Fill Rate

### Stat Cards
| Card | Color |
|------|-------|
| Total Intake 2024 | Cyan |
| Total Intake 2025 | Purple |
| Total Intake 2026 | Blue |

### Charts
1. **Intake vs Actual Admissions** — Grouped bar chart
   - Side-by-side at peak date
   - All 3 years, per school

2. **Fill Rate % Per Session** — Horizontal bar chart
   - How much of capacity was filled at peak
   - One bar per session

3. **Capacity Utilization Bubbles** — Bubble chart
   - X axis: Intake
   - Y axis: Admissions
   - Bubble size: Withdrawals
   - One bubble per school

4. **Programs with Unmet Demand** — Bar chart
   - Programs where intake far exceeds admissions
   - Shows the gap (unfilled seats)

5. **Intake Change 2024 → 2026** — Bar chart
   - How seat capacity evolved across sessions
   - Per program, shows increase or decrease

---

## Data Structure (from dashboard_data.json)

```
{
  time_series: [{ date, 2024, 2025, 2026 }],
  faculty_breakdown: {
    "31 Oct": [{ program, school, 2024: {intake, admissions, withdrawals}, 2025: {...}, 2026: {...} }]
  },
  school_date_wise: {
    "31 Oct": { MRSoE: { 2024: {...}, 2025: {...}, 2026: {...} } }
  },
  program_categories: {
    "B.Tech CSE": { count, intake_2024, intake_2025, intake_2026, admissions_2024, admissions_2025, admissions_2026 }
  }
}
```

## Tech Stack
- Frontend: HTML + CSS + JavaScript (Chart.js)
- Charts library: Chart.js v4.4.0 + chartjs-plugin-datalabels
- Font: Inter (Google Fonts)
- Backend (planned): FastAPI + SQLite on Hugging Face Space
- Data source (planned): Google Sheets → HF Space /sync → SQLite → /data → Dashboard
