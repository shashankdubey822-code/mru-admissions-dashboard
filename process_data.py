import pandas as pd
import json
import math
import re
from collections import defaultdict

file_path = 'ADMISSIONS COMPARISON REPORT FROM 2024 TO 2026-3.xlsx'
xl = pd.ExcelFile(file_path)

analysis = {
    "time_series": [],
    "faculty_breakdown": {},
    "school_date_wise": {},
    "program_categories": {},
    "all_programs": set()
}

# -------- 1. MASTER DATA-DATE WISE --------
df_ts = xl.parse('Master Data-Date wise', header=1)
ts_cols = {}
for col in df_ts.columns:
    col_str = str(col).lower()
    if 'date' in col_str: ts_cols[col] = 'date'
    elif '2024' in col_str: ts_cols[col] = 'admissions_2024'
    elif '2025' in col_str: ts_cols[col] = 'admissions_2025'
    elif '2026' in col_str: ts_cols[col] = 'admissions_2026'
df_ts = df_ts.rename(columns=ts_cols)

if 'date' in df_ts.columns:
    df_ts = df_ts.dropna(subset=['date'])
    for _, row in df_ts.iterrows():
        date_val = row.get('date')
        if pd.isna(date_val): continue
        if isinstance(date_val, pd.Timestamp):
            date_str = date_val.strftime('%d %b')
        else:
            date_str = str(date_val).strip()
        if 'total' in date_str.lower(): continue
        def safe_int(v):
            try:
                f = float(v)
                return 0 if math.isnan(f) else int(f)
            except: return 0
        analysis["time_series"].append({
            "date": date_str,
            "2024": safe_int(row.get('admissions_2024', 0)),
            "2025": safe_int(row.get('admissions_2025', 0)),
            "2026": safe_int(row.get('admissions_2026', 0))
        })

# -------- 2. MASTER DATA SCHOOL-DATE WISE --------
# Check header rows
df_school = xl.parse('Master Data School-Datewise', header=None)
# Find school headers — look for row that mentions school names
# Typically rows 0 and 1 are title/school headers and row 2 is year columns
# Let's try to read it with multi-index header

# Instead: parse with row 1 as header (0-indexed, so header=1)
# Find what the actual column headers mean

# grab raw top 5 rows to understand
raw_top = xl.parse('Master Data School-Datewise', header=None, nrows=5)
print("School sheet top rows:")
for i, row in raw_top.iterrows():
    print(f"  Row {i}: {list(row.values)}")

# --------  3. DATE-SPECIFIC SHEETS (faculty breakdown) --------
date_pattern = re.compile(r'^\d{1,2}\s+[a-zA-Z]{3,}$', re.IGNORECASE)

school_labels = {}  # Mapping to understand which schools have which programs

for sheet in xl.sheet_names:
    if not date_pattern.match(sheet.strip()):
        continue
    
    df = xl.parse(sheet, header=None)
    # Find header row
    header_row_idx = -1
    for i in range(min(5, len(df))):
        row_vals = [str(x).lower() for x in df.iloc[i].values]
        if any('faculty/program' in val for val in row_vals):
            header_row_idx = i
            break
    if header_row_idx == -1: continue
    
    # Find school grouping rows
    school_programs = {}
    current_school = "Unknown"
    
    programs_list = []
    for i in range(header_row_idx + 1, len(df)):
        row = df.iloc[i].values
        fac_name = str(row[0]).strip()
        if fac_name == 'nan' or not fac_name: continue
        
        # Check if it's a school header (all-caps short string with no numbers in other cols)
        numeric_vals = [v for v in row[1:10] if pd.notna(v) and str(v).strip() not in ('', 'nan')]
        is_school_header = len(numeric_vals) == 0

        if is_school_header:
            current_school = fac_name
            continue
        
        if 'grand total' in fac_name.lower(): continue
        
        def clean_num(val):
            try:
                v = float(val)
                return 0 if math.isnan(v) else int(v)
            except: return 0
        
        intake_24 = clean_num(row[1]) if len(row) > 1 else 0
        adm_24    = clean_num(row[2]) if len(row) > 2 else 0
        wd_24     = clean_num(row[3]) if len(row) > 3 else 0
        intake_25 = clean_num(row[4]) if len(row) > 4 else 0
        adm_25    = clean_num(row[5]) if len(row) > 5 else 0
        wd_25     = clean_num(row[6]) if len(row) > 6 else 0
        intake_26 = clean_num(row[7]) if len(row) > 7 else 0
        adm_26    = clean_num(row[8]) if len(row) > 8 else 0
        wd_26     = clean_num(row[9]) if len(row) > 9 else 0
        
        programs_list.append({
            "program": fac_name,
            "school": current_school,
            "2024": {"intake": intake_24, "admissions": adm_24, "withdrawals": wd_24},
            "2025": {"intake": intake_25, "admissions": adm_25, "withdrawals": wd_25},
            "2026": {"intake": intake_26, "admissions": adm_26, "withdrawals": wd_26}
        })
        analysis["all_programs"].add(fac_name)
    
    analysis["faculty_breakdown"][sheet] = programs_list

# --------  4. COMPUTE SCHOOL-WISE AGGREGATIONS --------
# For each date, aggregate by school
for sheet, programs in analysis["faculty_breakdown"].items():
    school_agg = defaultdict(lambda: {
        "2024": {"intake": 0, "admissions": 0, "withdrawals": 0},
        "2025": {"intake": 0, "admissions": 0, "withdrawals": 0},
        "2026": {"intake": 0, "admissions": 0, "withdrawals": 0}
    })
    for p in programs:
        school = p["school"]
        for yr in ["2024", "2025", "2026"]:
            for metric in ["intake", "admissions", "withdrawals"]:
                school_agg[school][yr][metric] += p[yr][metric]
    analysis["school_date_wise"][sheet] = dict(school_agg)

# --------  5. COMPUTE PROGRAM CATEGORY ANALYSIS --------
# Extract keywords from program names to categorize
categories = {
    "B.Tech CSE": [],
    "B.Tech Other": [],
    "BCA/BBA/MBA": [],
    "M.Tech/M.Sc": [],
    "Other Programs": []
}

# Use last year's sheet for category analysis
last_sheet = list(analysis["faculty_breakdown"].keys())[-1] if analysis["faculty_breakdown"] else None
if last_sheet:
    for p in analysis["faculty_breakdown"][last_sheet]:
        name = p["program"]
        if 'b.tech' in name.lower() and ('cse' in name.lower() or 'computer science' in name.lower()):
            categories["B.Tech CSE"].append(p)
        elif 'b.tech' in name.lower():
            categories["B.Tech Other"].append(p)
        elif 'bca' in name.lower() or 'bba' in name.lower() or 'mba' in name.lower():
            categories["BCA/BBA/MBA"].append(p)
        elif 'm.tech' in name.lower() or 'm.sc' in name.lower():
            categories["M.Tech/M.Sc"].append(p)
        else:
            categories["Other Programs"].append(p)

analysis["program_categories"] = {
    cat: {
        "count": len(progs),
        "intake_2024": sum(p["2024"]["intake"] for p in progs),
        "intake_2025": sum(p["2025"]["intake"] for p in progs),
        "intake_2026": sum(p["2026"]["intake"] for p in progs),
        "admissions_2024": sum(p["2024"]["admissions"] for p in progs),
        "admissions_2025": sum(p["2025"]["admissions"] for p in progs),
        "admissions_2026": sum(p["2026"]["admissions"] for p in progs),
    }
    for cat, progs in categories.items()
}

# Convert set to list for JSON serialization
analysis["all_programs"] = list(analysis["all_programs"])

output = {
    "time_series": analysis["time_series"],
    "faculty_breakdown": analysis["faculty_breakdown"],
    "school_date_wise": analysis["school_date_wise"],
    "program_categories": analysis["program_categories"]
}

with open('dashboard_data.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2, default=str)

print(f"Processing complete!")
print(f"Time series data points: {len(analysis['time_series'])}")
print(f"Date sheets processed: {len(analysis['faculty_breakdown'])}")
print(f"Schools detected: {set(s for sheets in analysis['faculty_breakdown'].values() for p in sheets for s in [p['school']])}")
print(f"Program categories: {list(analysis['program_categories'].keys())}")
