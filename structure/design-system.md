# MRU Dashboard — Design System

## Theme
Dark Glassmorphism — deep navy background with frosted glass cards and glowing accents.

---

## Background Colors
| Name       | Value                  | Usage                        |
|------------|------------------------|------------------------------|
| bg         | #070c1a                | Main page background         |
| bg2        | #0d1526                | Secondary background         |
| surface    | rgba(255,255,255,0.04) | Card backgrounds             |
| surface-h  | rgba(255,255,255,0.07) | Card hover state             |

---

## Accent Colors
| Name   | Hex       | Usage                              |
|--------|-----------|------------------------------------|
| cyan   | #00e5ff   | 2024 data, primary highlights      |
| purple | #b57bee   | 2025 data, AI insights accent      |
| blue   | #4f8dfd   | 2026 data, intake stats            |
| green  | #34d399   | Positive deltas, growth indicators |
| rose   | #fb7185   | Negative deltas, withdrawals       |
| amber  | #fbbf24   | Warnings, fill rate alerts         |
| indigo | #818cf8   | Secondary charts                   |

---

## Text Colors
| Name  | Hex       | Usage                        |
|-------|-----------|------------------------------|
| text  | #e2e8f0   | Primary body text            |
| muted | #64748b   | Subtitles, labels, captions  |
| label | #94a3b8   | Secondary labels             |

---

## Border Colors
| Name     | Value                  | Usage              |
|----------|------------------------|--------------------|
| border   | rgba(255,255,255,0.07) | Default card border|
| border-h | rgba(255,255,255,0.16) | Hover border       |

---

## Typography
| Element        | Font    | Weight | Size     |
|----------------|---------|--------|----------|
| Font Family    | Inter   | —      | —        |
| Page Title     | Inter   | 700    | 1.3rem   |
| Card Title     | Inter   | 700    | 1rem     |
| KPI Value      | Inter   | 800    | 2.2rem   |
| Big Stat       | Inter   | 800    | 3rem     |
| Subtitle       | Inter   | 400    | 0.78rem  |
| Nav Item       | Inter   | 500    | 0.87rem  |
| Badge          | Inter   | 600    | 0.75rem  |
| Body Text      | Inter   | 400    | 0.95rem  |

---

## Border Radius
| Name      | Value  | Usage              |
|-----------|--------|--------------------|
| radius-sm | 10px   | Buttons, nav items |
| radius    | 16px   | Cards              |
| radius-lg | 24px   | Large containers   |

---

## Shadows & Glows
| Name   | Value                          | Usage              |
|--------|--------------------------------|--------------------|
| shadow | 0 8px 40px rgba(0,0,0,.5)     | All cards          |
| glow-c | 0 0 28px rgba(0,229,255,.18)  | Cyan glow (active) |
| glow-p | 0 0 28px rgba(181,123,238,.18)| Purple glow        |
| glow-b | 0 0 28px rgba(79,141,253,.18) | Blue glow          |

---

## Year Color Mapping
| Year    | Color  | Hex     |
|---------|--------|---------|
| 2024-25 | Cyan   | #00e5ff |
| 2025-26 | Purple | #b57bee |
| 2026-27 | Blue   | #4f8dfd |

---

## KPI Tile Top Border Colors
| KPI                  | Color  |
|----------------------|--------|
| Peak Admissions 2024 | Cyan   |
| Peak Admissions 2025 | Purple |
| Admissions 2026 YTD  | Blue   |
| Total Intake 2025    | Green  |
| Fill Rate 2025       | Amber  |
| Withdrawals 2025     | Rose   |

---

## SCHOOL_PALETTE (multi-series charts)
Used for school comparison charts, top-10 program bars, donut slices, and bubble charts.
```
['#00e5ff', '#b57bee', '#4f8dfd', '#34d399', '#fb7185', '#fbbf24', '#818cf8', '#f97316', '#22d3ee', '#a3e635']
```
Index cycles if more than 10 items.

---

## Chart Defaults (Chart.js global overrides)
- Font family: Inter
- Font size: 11px
- Font color: #94a3b8
- Grid lines: rgba(255,255,255,0.05)
- Legend style: rectRounded point style, boxWidth 10, padding 16
- DataLabels plugin: off by default (`display: false`)
- All charts: responsive, maintainAspectRatio false

---

## lineDS Helper (line dataset factory)
Used by all line charts. Produces a consistent styled dataset.
| Property           | Value                        |
|--------------------|------------------------------|
| borderWidth        | 2.5                          |
| tension            | 0.42 (smooth curves)         |
| pointRadius        | 3                            |
| pointHoverRadius   | 6                            |
| fill               | true by default (area fill)  |
| backgroundColor    | color at 0.08 alpha (fill)   |

Pass `fill = false` to disable area fill (used on growth rate chart).

---

## Tooltip Config
All charts share the same tooltip style via `tooltipConfig()`.
| Property      | Value                    |
|---------------|--------------------------|
| backgroundColor | rgba(7,12,26,.92)      |
| titleColor    | #f8fafc                  |
| bodyColor     | #cbd5e1                  |
| borderColor   | rgba(255,255,255,.1)     |
| borderWidth   | 1                        |
| padding       | 12                       |
| cornerRadius  | 10                       |

---

## Animations
| Animation         | Details                                                        |
|-------------------|----------------------------------------------------------------|
| KPI count-up      | 0 → final value over 1400ms, quartic ease-out (`1 - (1-p)^4`) |
| Page transition   | `fadeSlide` — opacity + translateY 12px, duration 0.3s        |
| Loading spinner   | Shown on boot before data loads, fades out on data ready       |
