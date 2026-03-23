/* =============================================
   MRU Admissions Intelligence — app.js
   Complete logic for 5-page SPA with 20+ charts
   ============================================= */

'use strict';

// ============================================================
// 0. GLOBAL SETUP
// ============================================================

// Register DataLabels plugin
Chart.register(ChartDataLabels);

// Default Chart.js overrides
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyle = 'rectRounded';
Chart.defaults.plugins.legend.labels.boxWidth = 10;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.plugins.datalabels.display = false; // off by default

const gridColor = 'rgba(255,255,255,0.05)';

// Removed hardcoded COLORS, SCHOOL_PALETTE, pages, pageTitles
// These now come from DATA.config via backend

let DATA = null; // global data store
const activeCharts = {}; // chart instance registry

// Helper functions to access config safely
function getConfig() { return DATA?.config || {}; }
function getYears() { return getConfig().years || [2024, 2025, 2026]; }
function getYearLabel(year) { return getConfig().yearLabels?.[year] || `${year}`; }
function getPages() { return getConfig().pages || ['overview', 'insights', 'trends', 'programs', 'schools', 'intake', 'editor']; }
function getPageLabel(page) { return getConfig().pageLabels?.[page] || page; }
function getSchools() { return getConfig().schools || []; }
function getSchoolColor(schoolName) {
    return getConfig().schools?.find(s => s.name === schoolName)?.color || '#94a3b8';
}
function getMonths() { return getConfig().months || ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; }
function getThreshold(key) { return getConfig().thresholds?.[key] ?? 0; }
function getLimit(key) { return getConfig().ui?.limits?.[key] ?? 10; }
function getTruncate(key) { return getConfig().ui?.truncateLimits?.[key] ?? 40; }
function getAnimDuration(key) { return getConfig().ui?.animation?.[key] ?? 400; }
function getPrecision(key) { return getConfig().ui?.precision?.[key] ?? 1; }

// Legacy color getters for backward compatibility
function getYearColor(year) {
    const colors = { '2024': '#00e5ff', '2025': '#b57bee', '2026': '#4f8dfd' };
    return colors[year] || '#94a3b8';
}

function hexA(hex, alpha) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
}

function getDefaultSchoolLabel() { return getConfig().ui?.defaultSchoolLabel || 'Unknown'; }

// ============================================================
// 1. NAVIGATION
// ============================================================

function navigateTo(pageId) {
    const pages = getPages();
    pages.forEach(p => {
        document.getElementById(`page-${p}`).classList.toggle('active', p === pageId);
        document.getElementById(`nav-${p}`).classList.toggle('active', p === pageId);
    });
    document.getElementById('pageTitle').textContent = getPageLabel(pageId);
    document.getElementById('pageBreadcrumb').textContent = `Dashboard → ${getPageLabel(pageId)}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Re-render active page so charts can size properly
    setTimeout(() => {
        if (pageId === 'schools') renderSchoolsPage();
        if (pageId === 'intake') renderIntakePage();
        if (pageId === 'programs') renderProgramsPage();
        // Force resize all charts on this page
        Object.values(activeCharts).forEach(c => { try { c.resize(); } catch(e){} });
    }, getAnimDuration('pageNav'));
}

function rebuildChart(id, config) {
    if (activeCharts[id]) { activeCharts[id].destroy(); }
    const ctx = document.getElementById(id);
    if (!ctx) return null;
    const chart = new Chart(ctx, config);
    activeCharts[id] = chart;
    return chart;
}

// ============================================================
// 2. DATA LOAD & BOOT
// ============================================================

async function boot() {
    // Show loading
    const loadDiv = document.createElement('div');
    loadDiv.className = 'spinner-wrap';
    loadDiv.innerHTML = `<div class="spinner"></div><p class="spinner-text">Loading data…</p>`;
    document.body.appendChild(loadDiv);

    try {
        // Try to load from /data endpoint (live), fall back to static JSON
        let res;
        try {
            res = await fetch('/data');
        } catch(e) {
            res = await fetch('dashboard_data.json');
        }
        DATA = await res.json();
        loadDiv.style.opacity = 0;
        setTimeout(() => loadDiv.remove(), getAnimDuration('loadingDelay'));
        init();
    } catch(e) {
        loadDiv.innerHTML = `<p style="color:#fb7185">Error loading data: ${e.message}</p>`;
    }
}

async function refreshData() {
    // Refresh data from backend
    const btn = document.getElementById('refreshBtn');
    const originalText = btn.textContent;
    btn.innerHTML = '<span class="spinner-tiny"></span> Syncing...';
    btn.disabled = true;

    try {
        const res = await fetch('/data');
        if (!res.ok) throw new Error('Failed to fetch data');
        DATA = await res.json();

        // Re-render all active pages
        renderOverviewPage();
        renderInsightsPage();
        renderTrendsPage();
        renderProgramsPage();
        renderSchoolsPage();
        renderIntakePage();

        btn.textContent = '✓ Data Updated';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 2000);
    } catch(e) {
        btn.textContent = '✗ Failed';
        console.error('Refresh error:', e);
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 2000);
    }
}

function init() {
    // Navigation wiring
    document.querySelectorAll('.nav-item').forEach(el => {
        el.addEventListener('click', e => {
            e.preventDefault();
            navigateTo(el.dataset.page);
        });
    });

    // Sidebar toggle
    const sidebar = document.getElementById('sidebar');
    const mainWrap = document.querySelector('.main-wrapper');
    document.getElementById('menuToggle').addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainWrap.classList.toggle('expanded');
    });

    // Refresh button listener
    document.getElementById('refreshBtn')?.addEventListener('click', refreshData);

    // Populate date selectors
    const dates = Object.keys(DATA.faculty_breakdown);
    populateSelect('programDateSel', dates, dates[dates.length - 1]);
    populateSelect('schoolDateSel', dates, dates[dates.length - 1]);

    // Control listeners
    ['programDateSel','programYearSel','programMetricSel'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', renderProgramsPage);
    });
    document.getElementById('schoolDateSel')?.addEventListener('change', renderSchoolsPage);

    // Build all pages
    renderOverviewPage();
    renderInsightsPage();
    renderTrendsPage();
    renderProgramsPage();
    renderSchoolsPage();
    renderIntakePage();
    renderEditorPage();
}

function populateSelect(id, options, defaultVal) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
    options.forEach(opt => {
        const o = document.createElement('option');
        o.value = opt;
        o.textContent = opt;
        el.appendChild(o);
    });
    if (defaultVal) el.value = defaultVal;
}

// ============================================================
// 2.5 AI INSIGHTS PAGE
// ============================================================

function renderInsightsPage() {
    const lastDate = Object.keys(DATA.faculty_breakdown).slice(-1)[0];
    const progs = DATA.faculty_breakdown[lastDate] || [];
    
    // Strengths Logic
    let highestGrowthProg = { name: '', growth: -9999 };
    let highestAdmProg = { name: '', count: 0 };
    progs.forEach(p => {
        const growth = p['2025'].admissions - p['2024'].admissions;
        if (growth > highestGrowthProg.growth && p['2024'].admissions > 0) {
            highestGrowthProg = { name: p.program, growth };
        }
        if (p['2025'].admissions > highestAdmProg.count) {
            highestAdmProg = { name: p.program, count: p['2025'].admissions };
        }
    });

    const total24 = progs.reduce((s, p) => s + p['2024'].admissions, 0);
    const total25 = progs.reduce((s, p) => s + p['2025'].admissions, 0);
    const yoyGrowth = total25 - total24;
    const yoyGrowthPct = total24 > 0 ? ((total25/total24 - 1)*100).toFixed(getPrecision("main")) : 0;

    let strengthsHtml = `
        <div class="insight-bullet">
            <span class="pulse-dot green"></span>
            <p><strong>Overall Growth:</strong> Admissions are currently <span class="highlight-good">up by ${yoyGrowth} students</span> (${yoyGrowthPct}%) compared to the 2024 session.</p>
        </div>
        <div class="insight-bullet">
            <span class="pulse-dot green"></span>
            <p><strong>Highest Growth Program:</strong> <span class="highlight-var">${highestGrowthProg.name}</span> showed the most significant year-over-year volume growth, securing an additional <span class="highlight-good">${highestGrowthProg.growth} admissions</span> over last year.</p>
        </div>
        <div class="insight-bullet">
            <span class="pulse-dot green"></span>
            <p><strong>Flagship Performer:</strong> <span class="highlight-var">${highestAdmProg.name}</span> remains the highest performing program with <span class="highlight-good">${highestAdmProg.count} total admissions</span> in 2025.</p>
        </div>
    `;
    document.getElementById('insightStrengths').innerHTML = strengthsHtml;

    // Concerns Logic
    let highestWDProg = { name: '', count: 0 };
    let worstFillProg = { name: '', gap: 0, fillRate: 100 };
    progs.forEach(p => {
        if (p['2025'].withdrawals > highestWDProg.count) {
            highestWDProg = { name: p.program, count: p['2025'].withdrawals };
        }
        if (p['2025'].intake > 20) {
            const gap = p['2025'].intake - p['2025'].admissions;
            const fillRate = (p['2025'].admissions / p['2025'].intake) * 100;
            if (gap > worstFillProg.gap) {
                worstFillProg = { name: p.program, gap, fillRate: fillRate.toFixed(getPrecision("main")) };
            }
        }
    });

    let concernsHtml = `
        <div class="insight-bullet">
            <span class="pulse-dot red"></span>
            <p><strong>Withdrawal Alert:</strong> <span class="highlight-var">${highestWDProg.name}</span> has the highest volume of dropouts/withdrawals at <span class="highlight-bad">${highestWDProg.count} students</span> lost.</p>
        </div>
        <div class="insight-bullet">
            <span class="pulse-dot red"></span>
            <p><strong>Unmet Demand Gap:</strong> <span class="highlight-var">${worstFillProg.name}</span> has the largest unfilled seat capacity, missing its target by <span class="highlight-bad">${worstFillProg.gap} seats</span> (Currently at ${worstFillProg.fillRate}% capacity).</p>
        </div>
    `;
    document.getElementById('insightConcerns').innerHTML = concernsHtml;

    // Forecast Logic
    const ts = DATA.time_series;
    const last30Days24 = ts.slice(-30).map(d => d['2024']);
    const last30Days25 = ts.slice(-30).map(d => d['2025']);
    
    const recentVelocity25 = (last30Days25[last30Days25.length-1] - last30Days25[0]) / 30;
    
    let forecastSentence = recentVelocity25 > 0 
        ? `Admissions are pacing at a robust run-rate. Extrapolating the recent trajectory of <span class="highlight-var">+${recentVelocity25.toFixed(getPrecision("main"))} students/day</span>, total 2025 volume is mathematically projected to <span class="highlight-good">comfortably exceed</span> the 2024 peak.`
        : `Momentum has currently flat-lined. Admissions have slowed to <span class="highlight-bad">near zero</span> net growth per day. Strategic intervention is required if intake seats are heavily untendered within key programs.`;

    document.getElementById('insightForecast').innerHTML = `
        <div class="insight-bullet">
            <span class="pulse-dot cyan"></span>
            <p>${forecastSentence}</p>
        </div>
    `;
}

// ============================================================
// 3. OVERVIEW PAGE
// ============================================================

function renderOverviewPage() {
    buildKPIs();
    buildOverviewTrend();
    buildYoYChart();
    buildCategoryDonut();
    buildVelocityChart();
    buildFillRateOverview();
}

function buildKPIs() {
    const ts = DATA.time_series;
    const last = ts[ts.length - 1];
    const lastDate = Object.keys(DATA.faculty_breakdown).slice(-1)[0];
    const progs = DATA.faculty_breakdown[lastDate] || [];

    // Compute totals
    const total24 = Math.max(...ts.map(d => d['2024']));
    const total25 = Math.max(...ts.map(d => d['2025']));
    const total26 = Math.max(...ts.map(d => d['2026']));
    const delta2524 = total25 - total24;
    const delta2526 = total26 - total25;

    const totalIntake25 = progs.reduce((s, p) => s + p['2025'].intake, 0);
    const totalAdm25    = progs.reduce((s, p) => s + p['2025'].admissions, 0);
    const fillRate25    = totalIntake25 > 0 ? ((totalAdm25 / totalIntake25) * 100).toFixed(getPrecision("main")) : 0;
    const totalWD25     = progs.reduce((s, p) => s + p['2025'].withdrawals, 0);

    const kpis = [
        { label: 'Peak Admissions 2024', val: total24, sub: 'All programs', delta: null, color: 'kpi-cyan', icon: '📊' },
        { label: 'Peak Admissions 2025', val: total25, sub: 'All programs', delta: `${delta2524 >= 0 ? '+' : ''}${delta2524} vs 2024`, deltaDir: delta2524 >= 0 ? 'up' : 'down', color: 'kpi-purple', icon: '📈' },
        { label: 'Admissions 2026 YTD', val: total26, sub: 'New session', delta: `${delta2526 >= 0 ? '+' : ''}${delta2526} vs 2025`, deltaDir: delta2526 >= 0 ? 'up' : 'down', color: 'kpi-blue', icon: '🎓' },
        { label: 'Total Intake 2025', val: totalIntake25.toLocaleString(), sub: 'Sanctioned seats', delta: null, color: 'kpi-green', icon: '🏫' },
        { label: 'Fill Rate 2025', val: `${fillRate25}%`, sub: 'Capacity utilized', delta: null, color: 'kpi-amber', icon: '⚡' },
        { label: 'Withdrawals 2025', val: totalWD25, sub: 'Students withdrawn', delta: null, color: 'kpi-rose', icon: '📤' },
    ];

    const row = document.getElementById('kpiRow');
    row.innerHTML = kpis.map(k => `
        <div class="kpi-tile ${k.color}">
            <div class="kpi-icon">${k.icon}</div>
            <div class="kpi-label">${k.label}</div>
            <div class="kpi-val" data-target="${k.val}">${k.val}</div>
            <div class="kpi-sub">${k.sub}</div>
            ${k.delta ? `<div class="kpi-delta ${k.deltaDir}">${k.deltaDir === 'up' ? '▲' : '▼'} ${k.delta}</div>` : ''}
        </div>
    `).join('');

    // Animate number KPIs
    row.querySelectorAll('.kpi-val').forEach(el => {
        const raw = el.dataset.target;
        const num = parseInt(raw.toString().replace(/\D/g,''));
        if (isNaN(num)) return;
        animateCount(el, 0, num, getAnimDuration('counterDuration'));
    });
}

function animateCount(el, from, to, duration) {
    let start = null;
    const step = ts => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(ease * (to - from) + from).toLocaleString();
        if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

function buildOverviewTrend() {
    const ts = DATA.time_series;
    const labels = ts.map(d => d.date);
    rebuildChart('overviewTrendChart', {
        type: 'line',
        data: {
            labels,
            datasets: [
                lineDS('2024-25', ts.map(d => d['2024']), getYearColor('2024')),
                lineDS('2025-26', ts.map(d => d['2025']), getYearColor('2025')),
                lineDS('2026-27', ts.map(d => d['2026']), getYearColor('2026')),
            ]
        },
        options: lineOpts({ maintainAspectRatio: false })
    });
}

function buildYoYChart() {
    const ts = DATA.time_series;
    const labels = ts.map(d => d.date);
    const delta = ts.map(d => d['2025'] - d['2024']);
    rebuildChart('yoyChart', {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: '2025 vs 2024 Delta',
                data: delta,
                backgroundColor: delta.map(v => v >= 0 ? hexA('#34d399', 0.75) : hexA('#fb7185', 0.75)),
                borderRadius: 4,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: tooltipConfig(), datalabels: { display: false } },
            scales: {
                x: { grid: { display: false } },
                y: { grid: { color: gridColor }, beginAtZero: true }
            }
        }
    });
}

function buildCategoryDonut() {
    const cats = DATA.program_categories;
    const labels = Object.keys(cats);
    const vals = labels.map(l => cats[l].intake_2025);
    rebuildChart('categoryDonutChart', {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: vals,
                backgroundColor: labels.map((_, i) => getSchools()[i % getSchools().length]?.color || "#94a3b8"),
                hoverOffset: 8,
                borderColor: 'rgba(7,12,26,.8)',
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { position: 'bottom' },
                tooltip: tooltipConfig(),
                datalabels: {
                    display: true,
                    color: '#fff',
                    font: { size: 11, weight: 'bold' },
                    formatter: (val, ctx) => {
                        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        return total ? Math.round(val / total * 100) + '%' : '';
                    }
                }
            }
        }
    });
}

function buildVelocityChart() {
    const ts = DATA.time_series;
    const labels = ts.slice(1).map(d => d.date);
    const vel24 = ts.slice(1).map((d, i) => d['2024'] - ts[i]['2024']);
    const vel25 = ts.slice(1).map((d, i) => d['2025'] - ts[i]['2025']);
    rebuildChart('velocityChart', {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: '2024', data: vel24, backgroundColor: hexA(getYearColor('2024'), 0.7), borderRadius: 3, borderSkipped: false },
                { label: '2025', data: vel25, backgroundColor: hexA(getYearColor('2025'), 0.7), borderRadius: 3, borderSkipped: false }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true }, tooltip: tooltipConfig(), datalabels: { display: false } },
            scales: {
                x: { grid: { display: false } },
                y: { grid: { color: gridColor } }
            }
        }
    });
}

function buildFillRateOverview() {
    const cats = DATA.program_categories;
    const labels = Object.keys(cats);
    const fillRates = labels.map(l => {
        const c = cats[l];
        return c.intake_2025 > 0 ? parseFloat((c.admissions_2025 / c.intake_2025 * 100).toFixed(getPrecision("main"))) : 0;
    });
    rebuildChart('fillRateOverview', {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Fill Rate % (2025)',
                data: fillRates,
                backgroundColor: fillRates.map(v => v >= 70 ? hexA('#34d399', 0.75) : v >= 40 ? hexA('#fbbf24', 0.75) : hexA('#fb7185', 0.75)),
                borderRadius: 5,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: { legend: { display: false }, tooltip: tooltipConfig(), datalabels: { display: false } },
            scales: {
                x: { max: 110, grid: { color: gridColor }, ticks: { callback: v => v + '%' } },
                y: { grid: { display: false } }
            }
        }
    });
}

// ============================================================
// 4. TRENDS PAGE
// ============================================================

function renderTrendsPage() {
    buildFullTrend();
    buildGrowthRate();
    buildAcceleration();
    buildRadarChart();
    buildPeakComp();
}

function buildFullTrend() {
    const ts = DATA.time_series;
    const labels = ts.map(d => d.date);
    rebuildChart('fullTrendChart', {
        type: 'line',
        data: {
            labels,
            datasets: [
                lineDS('Session 2024-25', ts.map(d => d['2024']), getYearColor('2024')),
                lineDS('Session 2025-26', ts.map(d => d['2025']), getYearColor('2025')),
                lineDS('Session 2026-27', ts.map(d => d['2026']), getYearColor('2026')),
            ]
        },
        options: lineOpts({ maintainAspectRatio: false, fillMode: true })
    });
}

function buildGrowthRate() {
    const ts = DATA.time_series;
    const labels = ts.slice(1).map(d => d.date);
    const base24 = ts[0]['2024'] || 1;
    const base25 = ts[0]['2025'] || 1;
    const gr24 = ts.slice(1).map(d => +((d['2024'] / base24 - 1) * 100).toFixed(getPrecision("main")));
    const gr25 = ts.slice(1).map(d => +((d['2025'] / base25 - 1) * 100).toFixed(getPrecision("main")));
    rebuildChart('growthRateChart', {
        type: 'line',
        data: {
            labels,
            datasets: [
                lineDS('2024 Growth %', gr24, getYearColor('2024'), false),
                lineDS('2025 Growth %', gr25, getYearColor('2025'), false),
            ]
        },
        options: lineOpts({ maintainAspectRatio: false, yLabel: '%' })
    });
}

function buildAcceleration() {
    const ts = DATA.time_series;
    if (ts.length < 3) return;
    const labels = ts.slice(2).map(d => d.date);
    const acc24 = ts.slice(2).map((d, i) => (d['2024'] - ts[i + 1]['2024']) - (ts[i + 1]['2024'] - ts[i]['2024']));
    const acc25 = ts.slice(2).map((d, i) => (d['2025'] - ts[i + 1]['2025']) - (ts[i + 1]['2025'] - ts[i]['2025']));
    rebuildChart('accelerationChart', {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: '2024 Acceleration', data: acc24, backgroundColor: hexA(getYearColor('2024'), 0.65), borderRadius: 3, borderSkipped: false },
                { label: '2025 Acceleration', data: acc25, backgroundColor: hexA(getYearColor('2025'), 0.65), borderRadius: 3, borderSkipped: false },
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: true }, tooltip: tooltipConfig(), datalabels: { display: false } },
            scales: { x: { grid: { display: false } }, y: { grid: { color: gridColor } } }
        }
    });
}

function buildRadarChart() {
    const ts = DATA.time_series;
    rebuildChart('radarChart', {
        type: 'radar',
        data: {
            labels: ts.map(d => d.date),
            datasets: [
                { label: '2024', data: ts.map(d => d['2024']), borderColor: getYearColor('2024'), backgroundColor: hexA(getYearColor('2024'), 0.15), pointBackgroundColor: getYearColor('2024'), borderWidth: 2 },
                { label: '2025', data: ts.map(d => d['2025']), borderColor: getYearColor('2025'), backgroundColor: hexA(getYearColor('2025'), 0.15), pointBackgroundColor: getYearColor('2025'), borderWidth: 2 },
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: true }, tooltip: tooltipConfig(), datalabels: { display: false } },
            scales: {
                r: {
                    grid: { color: gridColor },
                    ticks: { color: '#64748b', backdropColor: 'transparent' },
                    pointLabels: { font: { size: 9 } }
                }
            }
        }
    });
}

function buildPeakComp() {
    const ts = DATA.time_series;
    const months = getMonths().slice(0, 10);
    const byMonth24 = months.map(m => Math.max(...ts.filter(d => d.date.includes(m)).map(d => d['2024']), 0));
    const byMonth25 = months.map(m => Math.max(...ts.filter(d => d.date.includes(m)).map(d => d['2025']), 0));
    rebuildChart('peakCompChart', {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                { label: '2024 Peak', data: byMonth24, backgroundColor: hexA(getYearColor('2024'), 0.7), borderRadius: 4, borderSkipped: false },
                { label: '2025 Peak', data: byMonth25, backgroundColor: hexA(getYearColor('2025'), 0.7), borderRadius: 4, borderSkipped: false },
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: true }, tooltip: tooltipConfig(), datalabels: { display: false } },
            scales: { x: { grid: { display: false } }, y: { grid: { color: gridColor } } }
        }
    });
}

// ============================================================
// 5. PROGRAMS PAGE
// ============================================================

function renderProgramsPage() {
    const date    = document.getElementById('programDateSel')?.value;
    const year    = document.getElementById('programYearSel')?.value;
    const metric  = document.getElementById('programMetricSel')?.value;
    if (!date || !DATA.faculty_breakdown[date]) return;

    const progs = DATA.faculty_breakdown[date];
    buildProgramBar(progs, year, metric);
    buildTop10(progs, year);
    buildCatComp(progs);
    buildWithdrawals(progs, year);
    buildProgramStatus(progs);
}

function buildProgramBar(progs, year, metric) {
    const sorted = [...progs].sort((a, b) => (b[year][metric] || 0) - (a[year][metric] || 0));
    const labels = sorted.map(p => p.program.length > 40 ? p.program.slice(0,40) + '…' : p.program);
    const d24 = sorted.map(p => p['2024'][metric] || 0);
    const d25 = sorted.map(p => p['2025'][metric] || 0);
    const d26 = sorted.map(p => p['2026'][metric] || 0);
    const dynamicH = Math.max(800, labels.length * 28);
    document.getElementById('programBarChartContainer').style.minHeight = dynamicH + 'px';
    rebuildChart('programBarChart', {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: '2024', data: d24, backgroundColor: hexA(getYearColor('2024'), 0.75), borderRadius: 3, borderSkipped: false },
                { label: '2025', data: d25, backgroundColor: hexA(getYearColor('2025'), 0.85), borderRadius: 3, borderSkipped: false },
                { label: '2026', data: d26, backgroundColor: hexA(getYearColor('2026'), 0.85), borderRadius: 3, borderSkipped: false },
            ]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: true }, tooltip: tooltipConfig(), datalabels: { display: false } },
            scales: { x: { grid: { color: gridColor }, beginAtZero: true }, y: { grid: { display: false }, ticks: { font: { size: 10 } } } }
        }
    });
}

function buildTop10(progs, year) {
    const sorted = [...progs].sort((a, b) => (b[year].admissions || 0) - (a[year].admissions || 0)).slice(0, getLimit("topPrograms"));
    const labels = sorted.map(p => p.program.length > 25 ? p.program.slice(0,25)+'…' : p.program);
    const vals = sorted.map(p => p[year].admissions || 0);
    rebuildChart('top10Chart', {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: `Admissions ${year}`,
                data: vals,
                backgroundColor: vals.map((_, i) => getSchools()[i % getSchools().length]?.color || "#94a3b8"),
                borderRadius: 5,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, indexAxis: 'y',
            plugins: { legend: { display: false }, tooltip: tooltipConfig(), datalabels: {
                display: true, color: '#fff', anchor: 'end', align: 'start', font: { size: 10, weight: 'bold' },
                formatter: v => v > 0 ? v : ''
            }},
            scales: { x: { grid: { color: gridColor } }, y: { grid: { display: false } } }
        }
    });
}

function buildCatComp(progs) {
    const cats = {};
    progs.forEach(p => {
        const cat = guessCategory(p.program);
        if (!cats[cat]) cats[cat] = { intake25: 0, adm25: 0 };
        cats[cat].intake25 += p['2025'].intake;
        cats[cat].adm25   += p['2025'].admissions;
    });
    const labels = Object.keys(cats);
    rebuildChart('catCompChart', {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'Intake 2025', data: labels.map(l => cats[l].intake25), backgroundColor: hexA(getYearColor('2025'), 0.45), borderRadius: 4 },
                { label: 'Admissions 2025', data: labels.map(l => cats[l].adm25), backgroundColor: hexA(getYearColor('2025'), 0.85), borderRadius: 4 },
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: true }, tooltip: tooltipConfig(), datalabels: { display: false } },
            scales: { x: { grid: { display: false } }, y: { grid: { color: gridColor } } }
        }
    });
}

function buildWithdrawals(progs, year) {
    const sorted = [...progs].sort((a, b) => (b[year].withdrawals || 0) - (a[year].withdrawals || 0)).filter(p => (p[year].withdrawals || 0) > 0).slice(0, getLimit("topWithdrawals"));
    const labels = sorted.map(p => p.program.length > 28 ? p.program.slice(0,28)+'…' : p.program);
    const vals = sorted.map(p => p[year].withdrawals || 0);
    rebuildChart('withdrawalChart', {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: `Withdrawals ${year}`,
                data: vals,
                backgroundColor: hexA('#fb7185', 0.75),
                borderRadius: 5,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, indexAxis: 'y',
            plugins: { legend: { display: false }, tooltip: tooltipConfig(), datalabels: { display: false } },
            scales: { x: { grid: { color: gridColor } }, y: { grid: { display: false }, ticks: { font: { size: 10 } } } }
        }
    });
}

function buildProgramStatus(progs) {
    // New programs: those that have intake in 2026 but not in 2024
    const newProgs = progs.filter(p => p['2026'].intake > 0 && p['2024'].intake === 0).length;
    const discontinued = progs.filter(p => p['2024'].intake > 0 && p['2026'].intake === 0).length;
    const continued = progs.filter(p => p['2024'].intake > 0 && p['2026'].intake > 0).length;
    const newIn2025 = progs.filter(p => p['2025'].intake > 0 && p['2024'].intake === 0 && p['2026'].intake === 0).length;
    rebuildChart('programStatusChart', {
        type: 'doughnut',
        data: {
            labels: ['Continued (2024→2026)', 'New in 2026', 'Discontinued by 2026', 'Only in 2025'],
            datasets: [{
                data: [continued, newProgs, discontinued, newIn2025],
                backgroundColor: [hexA('#34d399', 0.8), hexA('#22d3ee', 0.8), hexA('#fb7185', 0.8), hexA('#fbbf24', 0.8)],
                borderColor: 'rgba(7,12,26,.8)',
                borderWidth: 2,
                hoverOffset: 8,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '55%',
            plugins: { legend: { position: 'bottom' }, tooltip: tooltipConfig(), datalabels: {
                display: true, color: '#fff', font: { size: 11, weight: 'bold' },
                formatter: (v, ctx) => {
                    const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                    return total ? Math.round(v / total * 100) + '%' : '';
                }
            }}
        }
    });
}

// ============================================================
// 6. SCHOOLS PAGE
// ============================================================

function renderSchoolsPage() {
    const date = document.getElementById('schoolDateSel')?.value;
    if (!date || !DATA.faculty_breakdown[date]) return;
    const progs = DATA.faculty_breakdown[date];

    // Aggregate by school
    const schools = {};
    progs.forEach(p => {
        const s = p.school || getDefaultSchoolLabel();
        if (!schools[s]) schools[s] = { intake24:0, intake25:0, intake26:0, adm24:0, adm25:0, adm26:0, wd24:0, wd25:0, wd26:0 };
        const sc = schools[s];
        sc.intake24 += p['2024'].intake; sc.adm24 += p['2024'].admissions; sc.wd24 += p['2024'].withdrawals;
        sc.intake25 += p['2025'].intake; sc.adm25 += p['2025'].admissions; sc.wd25 += p['2025'].withdrawals;
        sc.intake26 += p['2026'].intake; sc.adm26 += p['2026'].admissions; sc.wd26 += p['2026'].withdrawals;
    });
    const labels = Object.keys(schools).filter(k => k !== getDefaultSchoolLabel() && (schools[k].intake24 + schools[k].intake25 + schools[k].intake26) > 0);
    const sc = labels.map(l => schools[l]);
    const colors = getSchools().map(s => s.color);

    // School Bar
    rebuildChart('schoolBarChart', {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: '2024', data: sc.map(s => s.adm24), backgroundColor: hexA(getYearColor('2024'), 0.75), borderRadius: 4, borderSkipped: false },
                { label: '2025', data: sc.map(s => s.adm25), backgroundColor: hexA(getYearColor('2025'), 0.75), borderRadius: 4, borderSkipped: false },
                { label: '2026', data: sc.map(s => s.adm26), backgroundColor: hexA(getYearColor('2026'), 0.75), borderRadius: 4, borderSkipped: false },
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: true }, tooltip: tooltipConfig(), datalabels: { display: false } },
            scales: { x: { grid: { display: false } }, y: { grid: { color: gridColor } } }
        }
    });

    // School Pie — intake 2025
    rebuildChart('schoolPieChart', {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                data: sc.map(s => s.intake25),
                backgroundColor: labels.map((_, i) => colors[i % colors.length]),
                borderColor: 'rgba(7,12,26,.8)',
                borderWidth: 2,
                hoverOffset: 10,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' }, tooltip: tooltipConfig(), datalabels: {
                display: true, color: '#fff', font: { size: 10, weight: 'bold' },
                formatter: (v, ctx) => {
                    const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                    return total ? Math.round(v / total * 100) + '%' : '';
                }
            }}
        }
    });

    // School Radar — 2025 metrics
    rebuildChart('schoolRadarChart', {
        type: 'radar',
        data: {
            labels: ['Intake 2024', 'Admissions 2024', 'Intake 2025', 'Admissions 2025', 'Intake 2026', 'Withdrawals'],
            datasets: labels.slice(0, getLimit("radarSchools")).map((l, i) => ({
                label: l,
                data: [sc[i].intake24, sc[i].adm24, sc[i].intake25, sc[i].adm25, sc[i].intake26, sc[i].wd25],
                borderColor: colors[i % colors.length],
                backgroundColor: hexA(colors[i % colors.length], 0.08),
                pointBackgroundColor: colors[i % colors.length],
                borderWidth: 2,
            }))
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' }, tooltip: tooltipConfig(), datalabels: { display: false } },
            scales: { r: { grid: { color: gridColor }, ticks: { color: '#64748b', backdropColor: 'transparent' }, pointLabels: { font: { size: 9 } } } }
        }
    });

    // Fill Rate chart
    const fillLabels = labels;
    const fill24 = sc.map(s => s.intake24 > 0 ? +(s.adm24 / s.intake24 * 100).toFixed(getPrecision("main")) : 0);
    const fill25 = sc.map(s => s.intake25 > 0 ? +(s.adm25 / s.intake25 * 100).toFixed(getPrecision("main")) : 0);
    const fill26 = sc.map(s => s.intake26 > 0 ? +(s.adm26 / s.intake26 * 100).toFixed(getPrecision("main")) : 0);
    rebuildChart('schoolFillChart', {
        type: 'bar',
        data: {
            labels: fillLabels,
            datasets: [
                { label: '2024 Fill%', data: fill24, backgroundColor: hexA(getYearColor('2024'), 0.7), borderRadius: 4, borderSkipped: false },
                { label: '2025 Fill%', data: fill25, backgroundColor: hexA(getYearColor('2025'), 0.7), borderRadius: 4, borderSkipped: false },
                { label: '2026 Fill%', data: fill26, backgroundColor: hexA(getYearColor('2026'), 0.7), borderRadius: 4, borderSkipped: false },
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: true }, tooltip: {
                ...tooltipConfig(),
                callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}%` }
            }, datalabels: { display: false } },
            scales: { x: { grid: { display: false } }, y: { grid: { color: gridColor }, ticks: { callback: v => v + '%' } } }
        }
    });

    // School withdrawal chart
    rebuildChart('schoolWithdrawChart', {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: '2024 Withdrawals', data: sc.map(s => s.wd24), backgroundColor: hexA('#fb7185', 0.55), borderRadius: 3, borderSkipped: false },
                { label: '2025 Withdrawals', data: sc.map(s => s.wd25), backgroundColor: hexA('#fb7185', 0.85), borderRadius: 3, borderSkipped: false },
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: true }, tooltip: tooltipConfig(), datalabels: { display: false } },
            scales: { x: { grid: { display: false } }, y: { grid: { color: gridColor } } }
        }
    });
}

// ============================================================
// 7. INTAKE PAGE
// ============================================================

function renderIntakePage() {
    const lastDate = Object.keys(DATA.faculty_breakdown).slice(-1)[0];
    const progs = DATA.faculty_breakdown[lastDate] || [];

    const totalIntake24 = progs.reduce((s, p) => s + p['2024'].intake, 0);
    const totalIntake25 = progs.reduce((s, p) => s + p['2025'].intake, 0);
    const totalIntake26 = progs.reduce((s, p) => s + p['2026'].intake, 0);
    const totalAdm24    = progs.reduce((s, p) => s + p['2024'].admissions, 0);
    const totalAdm25    = progs.reduce((s, p) => s + p['2025'].admissions, 0);
    const totalAdm26    = progs.reduce((s, p) => s + p['2026'].admissions, 0);

    animateCount(document.getElementById('totalIntake2024'), 0, totalIntake24, getAnimDuration('counterDuration'));
    animateCount(document.getElementById('totalIntake2025'), 0, totalIntake25, getAnimDuration('counterDuration'));
    animateCount(document.getElementById('totalIntake2026'), 0, totalIntake26, getAnimDuration('counterDuration'));

    // Intake vs Admissions grouped bar
    const cats = {};
    progs.forEach(p => {
        const cat = guessCategory(p.program);
        if (!cats[cat]) cats[cat] = { i24:0, a24:0, i25:0, a25:0, i26:0, a26:0 };
        cats[cat].i24 += p['2024'].intake; cats[cat].a24 += p['2024'].admissions;
        cats[cat].i25 += p['2025'].intake; cats[cat].a25 += p['2025'].admissions;
        cats[cat].i26 += p['2026'].intake; cats[cat].a26 += p['2026'].admissions;
    });
    const catLabels = Object.keys(cats);

    rebuildChart('intakeVsAdmChart', {
        type: 'bar',
        data: {
            labels: catLabels,
            datasets: [
                { label: 'Intake 2024',      data: catLabels.map(l => cats[l].i24), backgroundColor: hexA(getYearColor('2024'), 0.3), borderRadius: 4, borderSkipped: false },
                { label: 'Admissions 2024',  data: catLabels.map(l => cats[l].a24), backgroundColor: hexA(getYearColor('2024'), 0.85), borderRadius: 4, borderSkipped: false },
                { label: 'Intake 2025',      data: catLabels.map(l => cats[l].i25), backgroundColor: hexA(getYearColor('2025'), 0.3), borderRadius: 4, borderSkipped: false },
                { label: 'Admissions 2025',  data: catLabels.map(l => cats[l].a25), backgroundColor: hexA(getYearColor('2025'), 0.85), borderRadius: 4, borderSkipped: false },
                { label: 'Intake 2026',      data: catLabels.map(l => cats[l].i26), backgroundColor: hexA(getYearColor('2026'), 0.3), borderRadius: 4, borderSkipped: false },
                { label: 'Admissions 2026',  data: catLabels.map(l => cats[l].a26), backgroundColor: hexA(getYearColor('2026'), 0.85), borderRadius: 4, borderSkipped: false },
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: true }, tooltip: tooltipConfig(), datalabels: { display: false } },
            scales: { x: { grid: { display: false } }, y: { grid: { color: gridColor } } }
        }
    });

    // Fill Rate Gauge-style polar chart
    const fill24 = totalIntake24 > 0 ? +(totalAdm24 / totalIntake24 * 100).toFixed(getPrecision("main")) : 0;
    const fill25 = totalIntake25 > 0 ? +(totalAdm25 / totalIntake25 * 100).toFixed(getPrecision("main")) : 0;
    const fill26 = totalIntake26 > 0 ? +(totalAdm26 / totalIntake26 * 100).toFixed(getPrecision("main")) : 0;
    rebuildChart('fillRateGaugeChart', {
        type: 'polarArea',
        data: {
            labels: ['Fill Rate 2024', 'Fill Rate 2025', 'Fill Rate 2026'],
            datasets: [{
                data: [fill24, fill25, fill26],
                backgroundColor: [hexA(getYearColor('2024'), 0.7), hexA(getYearColor('2025'), 0.7), hexA(getYearColor('2026'), 0.7)],
                borderColor: 'rgba(7,12,26,.6)',
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' }, tooltip: {
                ...tooltipConfig(),
                callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed.r}%` }
            }, datalabels: {
                display: true, color: '#fff', font: { size: 13, weight: 'bold' },
                formatter: v => v + '%'
            }},
            scales: { r: { grid: { color: gridColor }, ticks: { color: '#64748b', backdropColor: 'transparent' } } }
        }
    });

    // Bubble chart — school level (intake vs adm, bubble = withdrawals)
    const schools = {};
    progs.forEach(p => {
        const s = p.school || getDefaultSchoolLabel();
        if (!schools[s]) schools[s] = { intake25:0, adm25:0, wd25:0 };
        schools[s].intake25 += p['2025'].intake;
        schools[s].adm25    += p['2025'].admissions;
        schools[s].wd25     += p['2025'].withdrawals;
    });
    const schoolNames = Object.keys(schools).filter(k => k !== getDefaultSchoolLabel() && schools[k].intake25 > 0);
    rebuildChart('bubbleChart', {
        type: 'bubble',
        data: {
            datasets: schoolNames.map((name, i) => ({
                label: name,
                data: [{ x: schools[name].intake25, y: schools[name].adm25, r: Math.max(5, Math.sqrt(schools[name].wd25 + 1) * 5) }],
                backgroundColor: hexA(getSchools()[i % getSchools().length]?.color || "#94a3b8", 0.7),
                borderColor: getSchools()[i % getSchools().length]?.color || "#94a3b8",
                borderWidth: 1.5,
            }))
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: true }, tooltip: {
                ...tooltipConfig(),
                callbacks: {
                    label: ctx => `${ctx.dataset.label} | Intake: ${ctx.parsed.x}, Admissions: ${ctx.parsed.y}, Withdrawals≈${Math.round(Math.pow(ctx.parsed._custom / 5, 2) - 1)}`
                }
            }, datalabels: { display: false } },
            scales: {
                x: { title: { display: true, text: 'Intake', color: '#94a3b8' }, grid: { color: gridColor } },
                y: { title: { display: true, text: 'Admissions', color: '#94a3b8' }, grid: { color: gridColor } }
            }
        }
    });

    // Gap chart — programs with unmet demand (intake >> admissions)
    const gaps = progs
        .map(p => ({ name: p.program, gap: p['2025'].intake - p['2025'].admissions, intake: p['2025'].intake }))
        .filter(p => p.gap > 50 && p.intake > 0)
        .sort((a, b) => b.gap - a.gap).slice(0, getLimit("topGaps"));

    const gLabels = gaps.map(g => g.name.length > 30 ? g.name.slice(0, 30)+'…' : g.name);
    rebuildChart('gapChart', {
        type: 'bar',
        data: {
            labels: gLabels,
            datasets: [
                { label: 'Intake 2025', data: gaps.map(g => g.intake), backgroundColor: hexA('#fbbf24', 0.5), borderRadius:4, borderSkipped:false },
                { label: 'Admissions 2025', data: gaps.map(g => g.intake - g.gap), backgroundColor: hexA('#34d399', 0.75), borderRadius:4, borderSkipped:false },
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false, indexAxis:'y',
            plugins: { legend: { display: true }, tooltip: tooltipConfig(), datalabels: { display: false } },
            scales: { x: { grid: { color: gridColor }, stacked: false }, y: { grid: { display: false }, ticks: { font: { size: 10 } } } }
        }
    });

    // Intake Change chart — by program category
    rebuildChart('intakeChangeChart', {
        type: 'bar',
        data: {
            labels: catLabels,
            datasets: [
                { label: 'Intake 2024', data: catLabels.map(l => cats[l].i24), backgroundColor: hexA(getYearColor('2024'), 0.7), borderRadius:4, borderSkipped:false },
                { label: 'Intake 2025', data: catLabels.map(l => cats[l].i25), backgroundColor: hexA(getYearColor('2025'), 0.7), borderRadius:4, borderSkipped:false },
                { label: 'Intake 2026', data: catLabels.map(l => cats[l].i26), backgroundColor: hexA(getYearColor('2026'), 0.7), borderRadius:4, borderSkipped:false },
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: true }, tooltip: tooltipConfig(), datalabels: { display: false } },
            scales: { x: { grid: { display: false } }, y: { grid: { color: gridColor } } }
        }
    });
}

// ============================================================
// 7. DATA EDITOR (DYNAMIC - NO HARDCODING)
// ============================================================

function renderEditorPage() {
    // Populate date selector from actual data (not hardcoded!)
    const dates = Object.keys(DATA.faculty_breakdown);
    const dateSelect = document.getElementById('editorDateSel');

    if (dates.length > 0) {
        dateSelect.innerHTML = '';
        dates.forEach(date => {
            const opt = document.createElement('option');
            opt.value = date;
            opt.textContent = date;
            dateSelect.appendChild(opt);
        });
        dateSelect.value = dates[dates.length - 1]; // Default to latest
        renderEditorTable(dates[dates.length - 1]);
    }

    // Date selector listener
    dateSelect.addEventListener('change', (e) => {
        renderEditorTable(e.target.value);
    });
}

function renderEditorTable(date) {
    // Dynamically generate table from actual program data
    const programs = DATA.faculty_breakdown[date] || [];
    const tbody = document.getElementById('editorTableBody');

    if (programs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;color:#64748b;">No data for this date</td></tr>';
        return;
    }

    // Generate table rows dynamically from data
    tbody.innerHTML = programs.map((prog, idx) => `
        <tr data-idx="${idx}" class="data-row">
            <td class="program-name">${prog.program}</td>
            <td class="school-name">${prog.school}</td>
            <td class="editable" data-year="2024" data-field="intake">${prog['2024'].intake}</td>
            <td class="editable" data-year="2024" data-field="admissions">${prog['2024'].admissions}</td>
            <td class="editable" data-year="2024" data-field="withdrawals">${prog['2024'].withdrawals}</td>
            <td class="editable" data-year="2025" data-field="intake">${prog['2025'].intake}</td>
            <td class="editable" data-year="2025" data-field="admissions">${prog['2025'].admissions}</td>
            <td class="editable" data-year="2025" data-field="withdrawals">${prog['2025'].withdrawals}</td>
            <td class="editable" data-year="2026" data-field="intake">${prog['2026'].intake}</td>
            <td class="editable" data-year="2026" data-field="admissions">${prog['2026'].admissions}</td>
            <td class="editable" data-year="2026" data-field="withdrawals">${prog['2026'].withdrawals}</td>
        </tr>
    `).join('');

    // Attach click listeners for editing
    document.querySelectorAll('.editable').forEach(cell => {
        cell.addEventListener('click', () => {
            const original = cell.textContent.trim();
            const input = document.createElement('input');
            input.type = 'number';
            input.value = original;
            input.className = 'cell-input';

            cell.innerHTML = '';
            cell.appendChild(input);
            input.focus();

            const saveEdit = () => {
                const newVal = input.value;
                cell.textContent = newVal || original;
                // Update DATA object (for when teacher saves)
                const rowIdx = parseInt(cell.closest('tr').dataset.idx);
                const year = cell.dataset.year;
                const field = cell.dataset.field;
                DATA.faculty_breakdown[date][rowIdx][year][field] = parseInt(newVal) || 0;
            };

            input.addEventListener('blur', saveEdit);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') saveEdit();
            });
        });
    });
}

// ============================================================
// 8. HELPERS
// ============================================================

function lineDS(label, data, color, fill = true) {
    return {
        label,
        data,
        borderColor: color,
        backgroundColor: fill ? hexA(color, 0.08) : 'transparent',
        borderWidth: 2.5,
        fill,
        tension: 0.42,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
    };
}

function lineOpts(extra = {}) {
    return {
        responsive: true,
        maintainAspectRatio: extra.maintainAspectRatio ?? false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: true },
            tooltip: tooltipConfig(),
            datalabels: { display: false }
        },
        scales: {
            x: { grid: { display: false } },
            y: {
                grid: { color: gridColor },
                beginAtZero: true,
                ticks: extra.yLabel ? { callback: v => v + extra.yLabel } : undefined
            }
        }
    };
}

function tooltipConfig() {
    return {
        backgroundColor: 'rgba(7,12,26,.92)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
    };
}

function guessCategory(name) {
    const n = name.toLowerCase();
    if ((n.includes('b.tech') || n.includes('btech')) && (n.includes('cse') || n.includes('computer science')))
        return 'B.Tech CSE';
    if (n.includes('b.tech') || n.includes('btech') || n.includes('lateral'))
        return 'B.Tech Other';
    if (n.includes('bca') || n.includes('bba') || n.includes('mba'))
        return 'BCA/BBA/MBA';
    if (n.includes('m.tech') || n.includes('m.sc') || n.includes('msc') || n.includes('m.sc.'))
        return 'M.Tech/M.Sc';
    return 'Other Programs';
}

// ============================================================
// 9. BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', boot);
