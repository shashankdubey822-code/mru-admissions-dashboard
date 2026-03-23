/**
 * MRU Admissions Dashboard — Google Apps Script
 *
 * HOW TO USE:
 * 1. Open your Google Sheet → Extensions → Apps Script
 * 2. Paste this entire file
 * 3. Save and run setupTrigger() once to install the onEdit trigger
 *
 * What it does:
 * - When any cell in a data sheet is edited, it sets column A of that row to 1 (push flag)
 * - Every 5 minutes (time-driven trigger), it reads all rows with push=1,
 *   builds the JSON payload, sends it to the HF Space /sync endpoint,
 *   then resets push flag to 0
 */

const HF_SYNC_URL = "https://vrfefavr-mru-admissions-dashboard.hf.space/sync";

// ─────────────────────────────────────────────────────────────
// 1. onEdit trigger — auto-flag edited rows
// ─────────────────────────────────────────────────────────────

/**
 * Runs automatically on every cell edit.
 * Sets column A of the edited row to 1 so the sync knows to push it.
 */
function onEdit(e) {
  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();

  // Skip sheets that are not data sheets (adjust names as needed)
  const skipSheets = ["README", "Config", "Master Summary"];
  if (skipSheets.includes(sheetName)) return;

  // Set push flag (column A) = 1 for the edited row
  const row = e.range.getRow();
  if (row > 1) { // skip header row
    sheet.getRange(row, 1).setValue(1);
  }
}

// ─────────────────────────────────────────────────────────────
// 2. syncPendingRows — reads push=1 rows and sends to HF Space
// ─────────────────────────────────────────────────────────────

function syncPendingRows() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  const timeSeries = [];
  const facultyBreakdown = {};

  sheets.forEach(sheet => {
    const name = sheet.getName();

    // ── Time-series sheets (named like "1 JAN", "15 FEB", "31 OCT") ──
    if (isDateSheet(name)) {
      const data = sheet.getDataRange().getValues();
      const headers = data[0]; // first row = headers

      data.slice(1).forEach((row, i) => {
        const pushFlag = row[0]; // column A
        if (pushFlag != 1) return; // skip if not flagged

        const actualRow = i + 2; // 1-indexed, +1 for header
        const program = row[getCol(headers, "Program")] || "";
        const school  = row[getCol(headers, "School")]  || "";

        if (!facultyBreakdown[name]) facultyBreakdown[name] = [];

        facultyBreakdown[name].push({
          school: school,
          program: program,
          "2024": {
            intake:      toInt(row[getCol(headers, "Intake 2024")]),
            admissions:  toInt(row[getCol(headers, "Net Admissions 2024")]),
            withdrawals: toInt(row[getCol(headers, "Withdrawals 2024")]),
          },
          "2025": {
            intake:      toInt(row[getCol(headers, "Intake 2025")]),
            admissions:  toInt(row[getCol(headers, "Net Admissions 2025")]),
            withdrawals: toInt(row[getCol(headers, "Withdrawals 2025")]),
          },
          "2026": {
            intake:      toInt(row[getCol(headers, "Intake 2026")]),
            admissions:  toInt(row[getCol(headers, "Net Admissions 2026")]),
            withdrawals: toInt(row[getCol(headers, "Withdrawals 2026")]),
          },
        });

        // Reset push flag
        sheet.getRange(actualRow, 1).setValue(0);
      });
    }

    // ── Master time-series sheet (named "Time Series" or similar) ──
    if (name === "Time Series") {
      const data = sheet.getDataRange().getValues();
      const headers = data[0];

      data.slice(1).forEach((row, i) => {
        const pushFlag = row[0];
        if (pushFlag != 1) return;

        const actualRow = i + 2;
        timeSeries.push({
          date:   row[getCol(headers, "Date")] || "",
          "2024": toInt(row[getCol(headers, "2024")]),
          "2025": toInt(row[getCol(headers, "2025")]),
          "2026": toInt(row[getCol(headers, "2026")]),
        });

        sheet.getRange(actualRow, 1).setValue(0);
      });
    }
  });

  // Nothing to sync
  if (timeSeries.length === 0 && Object.keys(facultyBreakdown).length === 0) {
    Logger.log("Nothing to sync.");
    return;
  }

  const payload = JSON.stringify({ time_series: timeSeries, faculty_breakdown: facultyBreakdown });

  const options = {
    method: "post",
    contentType: "application/json",
    payload: payload,
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(HF_SYNC_URL, options);
    Logger.log("Sync response: " + response.getContentText());
  } catch (err) {
    Logger.log("Sync error: " + err.toString());
  }
}

// ─────────────────────────────────────────────────────────────
// 3. Helpers
// ─────────────────────────────────────────────────────────────

/** Returns true if the sheet name looks like a date snapshot (e.g. "1 JAN", "31 OCT") */
function isDateSheet(name) {
  return /^\d{1,2}\s+[A-Z]{3}$/i.test(name.trim());
}

/** Find column index by header name (0-based) */
function getCol(headers, name) {
  const idx = headers.findIndex(h => h.toString().trim().toLowerCase() === name.toLowerCase());
  return idx >= 0 ? idx : 0;
}

/** Parse value as integer, return 0 if invalid */
function toInt(val) {
  const n = parseInt(val);
  return isNaN(n) ? 0 : n;
}

// ─────────────────────────────────────────────────────────────
// 4. Setup — run this ONCE to install triggers
// ─────────────────────────────────────────────────────────────

/**
 * Run this function once from the Apps Script editor.
 * It installs:
 *   - onEdit trigger (fires on every cell edit)
 *   - Time-driven trigger (syncPendingRows every 5 minutes)
 */
function setupTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Remove existing triggers to avoid duplicates
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

  // onEdit trigger
  ScriptApp.newTrigger("onEdit")
    .forSpreadsheet(ss)
    .onEdit()
    .create();

  // Time-driven: every 5 minutes
  ScriptApp.newTrigger("syncPendingRows")
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log("Triggers installed successfully.");
}
