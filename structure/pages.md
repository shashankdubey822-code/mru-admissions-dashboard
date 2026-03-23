# MRU Dashboard — All Pages & Charts

---

## Page 1: Overview

### KPI Tiles (6 tiles)
| Tile | Icon | Color | Value Type | Compares |
|------|------|-------|------------|----------|
| Peak Admissions 2024 | 📊 | Cyan | Raw number (animated count-up) | Baseline |
| Peak Admissions 2025 | 📈 | Purple | Raw number (animated count-up) | vs 2024 (delta shown) |
| Admissions 2026 YTD | 🎓 | Blue | Raw number (animated count-up) | vs 2025 (delta shown) |
| Total Intake 2025 | 🏫 | Green | Raw number (animated count-up) | Sanctioned seats |
| Fill Rate 2025 | ⚡ | Amber | Percentage string e.g. `39.7%` | Capacity utilized |
| Withdrawals 2025 | 📤 | Rose | Raw number (animated count-up) | Students withdrawn |

Note: All numeric KPIs animate from 0 to final value over 1400ms using quartic ease-out. A loading spinner is shown on boot before data loads.

### Chart 1: Admission Trajectory
- Name: `overviewTrendChart`
- Type: Line chart
- Theme: Cyan (2024), Purple (2025), Blue (2026)
- Compares: Cumulative admissions across all 3 sessions over time
- X axis: Dates (all 21 snapshot dates, Jan to Oct)
- Y axis: Total admissions count

### Chart 2: Year-over-Year Growth
- Name: `yoyChart`
- Type: Bar chart
- Theme: Green bars (positive delta), Rose bars (negative delta)
- Compares: 2025 vs 2024 delta per date point
- X axis: Dates
- Y axis: Difference in admissions

### Chart 3: Program Category Mix
- Name: `categoryDonutChart`
- Type: Donut chart (cutout 65%)
- Theme: Multi-color (SCHOOL_PALETTE)
- Compares: Intake 2025 share by category (B.Tech CSE, B.Tech Other, BCA/BBA/MBA, M.Tech/M.Sc, Other Programs)
- Shows % labels on each slice

### Chart 4: Admission Velocity
- Name: `velocityChart`
- Type: Grouped bar chart
- Theme: Cyan (2024), Purple (2025)
- Compares: Period-to-period new admissions rate for 2024 vs 2025
- X axis: Dates
- Y axis: New admissions per period

### Chart 5: 2026 Fill Rate by Category
- Name: `fillRateOverview`
- Type: Horizontal bar chart (indexAxis: 'y')
- Theme: Green ≥70%, Amber ≥40%, Rose <40%
- Compares: Admissions as % of intake per program category (2025)
- X axis: Fill rate % (max 110)
- Y axis: Program categories

---

## Page 2: AI Insights

### Section 1: Header Banner
- Theme: Purple top border, gradient background
- Content: Title + description text only, no chart

### Section 2: Growth & Strengths
- Type: Text insight bullets (no chart)
- Theme: Green top border, green pulse dots
- Shows:
  - Overall YoY growth count and %
  - Highest growth program name + extra admissions
  - Flagship performer name + total admissions

### Section 3: Alerts & Constraints
- Type: Text insight bullets (no chart)
- Theme: Rose top border, red pulse dots
- Shows:
  - Program with highest withdrawals + count
  - Program with worst fill rate + gap in seats + fill %

### Section 4: Executive Trajectory Forecast
- Type: Text insight bullet (no chart)
- Theme: Cyan top border, cyan pulse dot
- Shows:
  - Recent velocity (students/day)
  - Projection: will 2025 exceed 2024 peak or not

---

## Page 3: Trends & Growth

### Chart 1: Full Admissions Timeline
- Name: `fullTrendChart`
- Type: Line chart with area fill under lines (`fillMode: true`)
- Theme: Cyan (2024), Purple (2025), Blue (2026)
- Compares: Complete cumulative admissions all 3 sessions
- X axis: All 21 date snapshot points (Jan–Oct)
- Y axis: Total admissions

### Chart 2: Cumulative Growth Rate %
- Name: `growthRateChart`
- Type: Line chart (no fill)
- Theme: Cyan (2024), Purple (2025)
- Compares: Growth rate relative to Jan baseline for 2024 vs 2025
- X axis: Dates
- Y axis: Growth %

### Chart 3: Net Admissions Acceleration
- Name: `accelerationChart`
- Type: Grouped bar chart
- Theme: Cyan (2024), Purple (2025)
- Compares: Period-to-period differential (second derivative) for 2024 vs 2025
- X axis: Dates
- Y axis: Acceleration value (can be negative)

### Chart 4: 2024 vs 2025 Admissions — Radar
- Name: `radarChart`
- Type: Radar chart
- Theme: Cyan (2024), Purple (2025)
- Compares: Head-to-head 2024 vs 2025 across all time series points
- Axes: All 21 date snapshot points (each date is one axis)

### Chart 5: Session Peak Comparison
- Name: `peakCompChart`
- Type: Grouped bar chart
- Theme: Cyan (2024), Purple (2025)
- Compares: Monthly maximum admissions per session
- X axis: Months (Jan–Oct)
- Y axis: Peak admissions count

---

## Page 4: Program Analysis

### Controls
- Date Snapshot: select any date (e.g. 31 Oct)
- Year: 2024-25 / 2025-26 / 2026-27
- Metric: Net Admissions / Intake / Withdrawals

### Chart 1: Program-wise Comparison
- Name: `programBarChart`
- Type: Horizontal bar chart (scrollable)
- Theme: Cyan (2024), Purple (2025), Blue (2026)
- Compares: All programs ranked by selected metric, all 3 years
- X axis: Metric value
- Y axis: Program names (truncated to 40 chars)
- Container height: dynamic — `Math.max(800, labels.length * 28)` px

### Chart 2: Top 10 Programs by Admissions
- Name: `top10Chart`
- Type: Horizontal bar chart
- Theme: Multi-color (each bar different SCHOOL_PALETTE color)
- Compares: Top 10 highest admission programs for selected year
- X axis: Admissions count
- Y axis: Program names (truncated to 25 chars)
- Shows value labels on bars

### Chart 3: Program Type Breakdown
- Name: `catCompChart`
- Type: Grouped bar chart
- Theme: Purple light opacity (intake), Purple solid (admissions)
- Compares: Intake vs admissions per category for 2025
- Categories built using `guessCategory()` which maps: b.tech+cse → "B.Tech CSE", b.tech/btech/lateral → "B.Tech Other", bca/bba/mba → "BCA/BBA/MBA", m.tech/m.sc → "M.Tech/M.Sc", else → "Other Programs"
- X axis: Program categories
- Y axis: Count

### Chart 4: Withdrawal Analysis
- Name: `withdrawalChart`
- Type: Horizontal bar chart
- Theme: Rose/red
- Compares: Top 15 programs by withdrawal count for selected year (only programs with >0 withdrawals)
- X axis: Withdrawal count
- Y axis: Program names (truncated to 28 chars)

### Chart 5: New vs Discontinued Programs
- Name: `programStatusChart`
- Type: Donut chart (cutout 55%)
- Theme: Green (continued), Blue (new in 2026), Rose (discontinued by 2026), Amber (only in 2025)
- Compares: Program lifecycle across 2024→2026
- Shows 4 segments with counts

---

## Page 5: School Comparison

### Controls
- Date Snapshot: select any date

### Schools
- MRSoE (Engineering)
- MRSoM&C (Management & Commerce)
- MRSoS (Sciences)
- MRSoE&H (Education & Humanities)
- MRSoL (Law)

### Chart 1: School-wise Admissions
- Name: `schoolBarChart`
- Type: Grouped bar chart
- Theme: Cyan (2024), Purple (2025), Blue (2026)
- Compares: Net admissions per school across all 3 years
- X axis: Schools
- Y axis: Admissions count

### Chart 2: School Intake Distribution
- Name: `schoolPieChart`
- Type: Pie chart
- Theme: Multi-color (one SCHOOL_PALETTE color per school)
- Compares: Intake 2025 seat allocation share by school
- Shows % labels on each slice

### Chart 3: School Performance Radar
- Name: `schoolRadarChart`
- Type: Radar chart
- Theme: Multi-color (one shape per school, up to 6 schools)
- Axes (exactly 6): `Intake 2024`, `Admissions 2024`, `Intake 2025`, `Admissions 2025`, `Intake 2026`, `Withdrawals`
- Note: Withdrawals axis uses 2025 withdrawal data (`wd25`)

### Chart 4: School Fill Rate 2024 vs 2025 vs 2026
- Name: `schoolFillChart`
- Type: Grouped bar chart
- Theme: Cyan (2024), Purple (2025), Blue (2026)
- Compares: % of intake filled per school across all 3 years
- X axis: Schools
- Y axis: Fill rate %

### Chart 5: School Withdrawals
- Name: `schoolWithdrawChart`
- Type: Grouped bar chart
- Theme: Rose at 0.55 opacity (2024), Rose at 0.85 opacity (2025)
- Compares: Dropout count per school — 2024 and 2025 only (NOT 2026)
- X axis: Schools
- Y axis: Withdrawal count

---

## Page 6: Intake vs Fill Rate

### Stat Cards (3 cards)
| Card | Color | Shows |
|------|-------|-------|
| Total Intake 2024 | Cyan | Sum of all sanctioned seats 2024 (animated count-up) |
| Total Intake 2025 | Purple | Sum of all sanctioned seats 2025 (animated count-up) |
| Total Intake 2026 | Blue | Sum of all sanctioned seats 2026 (animated count-up) |

### Chart 1: Intake vs Actual Admissions
- Name: `intakeVsAdmChart`
- Type: Grouped bar chart (6 datasets)
- Theme: Cyan light (Intake 2024), Cyan solid (Admissions 2024), Purple light (Intake 2025), Purple solid (Admissions 2025), Blue light (Intake 2026), Blue solid (Admissions 2026)
- Compares: Intake vs actual admissions for all 3 years, grouped by program category
- X axis: Program categories (from `guessCategory()`)
- Y axis: Count

### Chart 2: Fill Rate % Per Session
- Name: `fillRateGaugeChart`
- Type: Polar Area chart (`polarArea`)
- Theme: Cyan (2024), Purple (2025), Blue (2026)
- Compares: How much of total capacity was filled per session (overall %)
- Shows % labels on each segment
- 3 segments: Fill Rate 2024, Fill Rate 2025, Fill Rate 2026

### Chart 3: Capacity Utilization Bubbles
- Name: `bubbleChart`
- Type: Bubble chart
- Theme: Multi-color (one color per school from SCHOOL_PALETTE)
- Compares: Intake 2025 (X) vs Admissions 2025 (Y) per school
- Bubble size: `Math.max(5, Math.sqrt(wd25 + 1) * 5)` — based on 2025 withdrawals
- One bubble per school, 2025 data only

### Chart 4: Programs with Unmet Demand (Gap Chart)
- Name: `gapChart`
- Type: Horizontal bar chart (indexAxis: 'y')
- Theme: Amber at 0.5 opacity (Intake 2025), Green at 0.75 opacity (Admissions 2025)
- Compares: Intake vs actual admissions for programs with the largest unfilled gaps
- Filter: Only programs where `gap > 50` seats, shows top 12
- X axis: Seat count
- Y axis: Program names (truncated to 30 chars)

### Chart 5: Intake Change 2024 → 2026
- Name: `intakeChangeChart`
- Type: Grouped bar chart
- Theme: Cyan (2024), Purple (2025), Blue (2026)
- Compares: All 3 intakes side by side per program category
- X axis: Program categories
- Y axis: Intake seat count
