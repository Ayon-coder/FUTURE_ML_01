/* ══════════════════════════════════════════════════════════════
   ForecastAI Dashboard — Multi-Page SPA
   ══════════════════════════════════════════════════════════════ */

const API_BASE = 'http://127.0.0.1:5000/api';

// Chart.js defaults
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.plugins.legend.display = false;
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;

const COLORS = {
    blue: '#6366f1', purple: '#8b5cf6', cyan: '#06b6d4',
    green: '#10b981', orange: '#f59e0b', pink: '#ec4899',
    red: '#ef4444', slate: '#64748b'
};
const CHART_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#a855f7'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Helpers ───
function $(v) { return formatCurrency(v); }
function formatCurrency(v) {
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return '$' + (v / 1e3).toFixed(1) + 'K';
    return '$' + v.toFixed(2);
}
function formatNumber(v) { return v.toLocaleString('en-US'); }
function monthLabel(d) { return new Date(d).toLocaleDateString('en-US', { year: '2-digit', month: 'short' }); }
function fullMonthLabel(d) { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }); }

// ─── DOM ───
const statusPill = document.getElementById('statusPill');
const loadingOverlay = document.getElementById('loadingOverlay');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');

// ══════════════════════════════════════════════════
//  PAGE ROUTER
// ══════════════════════════════════════════════════
const PAGE_META = {
    overview:    { title: 'Business Overview',   subtitle: 'Key performance indicators at a glance' },
    forecast:    { title: 'Sales Forecast',      subtitle: 'Historical trends with 12-month AI prediction' },
    breakdown:   { title: 'Sales Breakdown',     subtitle: 'Performance across categories, regions & segments' },
    seasonality: { title: 'Seasonality Patterns', subtitle: 'How sales fluctuate across months' },
    model:       { title: 'Model Performance',   subtitle: 'Linear Regression evaluation metrics' }
};

const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const chartInstances = {};
let currentPage = 'overview';
let dashboardData = null; // store fetched data

function navigateTo(pageName) {
    if (pageName === currentPage) return;
    currentPage = pageName;

    // Update nav
    navItems.forEach(n => n.classList.toggle('active', n.dataset.page === pageName));

    // Update header
    const meta = PAGE_META[pageName];
    pageTitle.textContent = meta.title;
    pageSubtitle.textContent = meta.subtitle;

    // Show/hide pages with animation
    pages.forEach(p => {
        if (p.id === `page-${pageName}`) {
            p.classList.add('active');
            p.style.animation = 'none';
            p.offsetHeight; // trigger reflow
            p.style.animation = '';
        } else {
            p.classList.remove('active');
        }
    });

    // Lazy-render charts for the page
    if (dashboardData) renderPage(pageName);

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) overlay.classList.remove('active');
}

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(item.dataset.page);
    });
});

// Mobile menu
document.getElementById('menuToggle').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
    overlay.classList.toggle('active');
});


// ══════════════════════════════════════════════════
//  DATA FETCHING
// ══════════════════════════════════════════════════
async function fetchJSON(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

async function loadDashboard() {
    try {
        const [forecastRes, metricsRes, insightsRes] = await Promise.all([
            fetchJSON('/forecast'),
            fetchJSON('/metrics'),
            fetchJSON('/insights')
        ]);

        dashboardData = { forecast: forecastRes, metrics: metricsRes, insights: insightsRes };

        loadingOverlay.classList.add('hidden');
        statusPill.classList.add('connected');
        statusPill.querySelector('span:last-child').textContent = 'Live';

        // Render the default page
        renderPage('overview');
    } catch (err) {
        console.error('Dashboard load error:', err);
        loadingOverlay.classList.add('hidden');
        statusPill.classList.add('error');
        statusPill.querySelector('span:last-child').textContent = 'Error';
        showError(err.message);
    }
}

function showError(msg) {
    const page = document.getElementById('page-overview');
    const errDiv = document.createElement('div');
    errDiv.style.cssText = 'background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:20px;color:#fca5a5;margin-bottom:20px;';
    errDiv.innerHTML = `<strong>⚠ Connection Error</strong><br><span style="color:#94a3b8;font-size:0.85rem">Could not connect to backend at ${API_BASE}.<br><code style="background:rgba(255,255,255,0.06);padding:4px 8px;border-radius:4px;margin-top:8px;display:inline-block">cd backend && python app.py</code></span>`;
    page.prepend(errDiv);
}

// ══════════════════════════════════════════════════
//  LAZY RENDERING PER PAGE
// ══════════════════════════════════════════════════
const renderedPages = new Set();

function renderPage(name) {
    if (renderedPages.has(name) || !dashboardData) return;
    renderedPages.add(name);

    const { forecast, metrics, insights } = dashboardData;

    switch (name) {
        case 'overview':
            renderKPIs(insights.kpis);
            renderYoYChart(insights.yoy_growth);
            break;
        case 'forecast':
            renderForecastChart(forecast.historical, forecast.forecast);
            renderForecastTable(forecast.forecast);
            break;
        case 'breakdown':
            renderCategoryChart(insights.categories);
            renderRegionChart(insights.regions);
            renderSegmentChart(insights.segments);
            renderSubCategoryChart(insights.subcategories);
            break;
        case 'seasonality':
            renderSeasonalityChart(insights.seasonality);
            renderYearlyMonthlyChart(insights.seasonality);
            break;
        case 'model':
            renderModelInfo(metrics.metrics);
            renderActualVsPred(metrics.metrics);
            break;
    }
}


// ══════════════════════════════════════════════════
//  RENDER: KPIs
// ══════════════════════════════════════════════════
function renderKPIs(kpis) {
    animateValue('kpiSales', kpis.total_sales, formatCurrency);
    animateValue('kpiProfit', kpis.total_profit, formatCurrency);
    animateValue('kpiOrders', kpis.total_orders, formatNumber);
    animateValue('kpiAOV', kpis.avg_order_value, formatCurrency);
    animateValue('kpiMargin', kpis.profit_margin, v => v.toFixed(1) + '%');
    animateValue('kpiQuantity', kpis.total_quantity, formatNumber);
}

function animateValue(id, target, formatter) {
    const el = document.getElementById(id);
    const duration = 1200;
    const start = performance.now();
    function update(ts) {
        const p = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = formatter(target * eased);
        if (p < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}


// ══════════════════════════════════════════════════
//  RENDER: YoY Growth
// ══════════════════════════════════════════════════
function renderYoYChart(data) {
    const ctx = document.getElementById('yoyChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.Year),
            datasets: [{
                data: data.map(d => d.Sales),
                backgroundColor: data.map((_, i) => CHART_COLORS[i % CHART_COLORS.length] + '99'),
                borderColor: data.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
                borderWidth: 1.5, borderRadius: 8, borderSkipped: false,
            }]
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: c => `Sales: ${formatCurrency(c.raw)}`,
                        afterLabel: c => data[c.dataIndex].Growth ? `Growth: ${data[c.dataIndex].Growth > 0 ? '+' : ''}${data[c.dataIndex].Growth}%` : ''
                    }
                }
            },
            scales: {
                y: { ticks: { callback: v => formatCurrency(v) }, grid: { color: 'rgba(255,255,255,0.04)' } },
                x: { grid: { display: false } }
            }
        }
    });
}


// ══════════════════════════════════════════════════
//  RENDER: Forecast Chart
// ══════════════════════════════════════════════════
function renderForecastChart(historical, forecast) {
    const ctx = document.getElementById('forecastChart').getContext('2d');

    const histLabels = historical.map(d => monthLabel(d.date));
    const histValues = historical.map(d => d.sales);
    const foreLabels = forecast.map(d => monthLabel(d.date));
    const foreValues = forecast.map(d => d.predicted_sales);

    const gradH = ctx.createLinearGradient(0, 0, 0, 420);
    gradH.addColorStop(0, 'rgba(99,102,241,0.25)');
    gradH.addColorStop(1, 'rgba(99,102,241,0)');

    const gradF = ctx.createLinearGradient(0, 0, 0, 420);
    gradF.addColorStop(0, 'rgba(245,158,11,0.25)');
    gradF.addColorStop(1, 'rgba(245,158,11,0)');

    const allLabels = [...histLabels, ...foreLabels];
    const histData = [...histValues, ...new Array(foreLabels.length).fill(null)];
    const foreData = [...new Array(histLabels.length - 1).fill(null), histValues.at(-1), ...foreValues];

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: allLabels,
            datasets: [
                { label: 'Historical', data: histData, borderColor: COLORS.blue, backgroundColor: gradH, fill: true, tension: 0.4, pointRadius: 2, pointHoverRadius: 6, borderWidth: 2.5 },
                { label: 'Forecast', data: foreData, borderColor: COLORS.orange, backgroundColor: gradF, fill: true, tension: 0.4, pointRadius: 3, pointHoverRadius: 6, borderWidth: 2.5, borderDash: [6, 4] }
            ]
        },
        options: {
            plugins: { tooltip: { callbacks: { label: c => `${c.dataset.label}: ${formatCurrency(c.raw)}` } } },
            scales: {
                y: { ticks: { callback: v => formatCurrency(v) }, grid: { color: 'rgba(255,255,255,0.04)' } },
                x: { grid: { display: false }, ticks: { maxTicksLimit: 18 } }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    });
}


// ══════════════════════════════════════════════════
//  RENDER: Forecast Table
// ══════════════════════════════════════════════════
function renderForecastTable(forecast) {
    const tbody = document.getElementById('forecastTableBody');
    forecast.forEach((f, i) => {
        const prev = i > 0 ? forecast[i - 1].predicted_sales : f.predicted_sales;
        const change = ((f.predicted_sales - prev) / prev * 100).toFixed(1);
        const isUp = change >= 0;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${fullMonthLabel(f.date)}</td><td><strong>${formatCurrency(f.predicted_sales)}</strong></td><td class="${isUp ? 'trend-up' : 'trend-down'}">${isUp ? '▲' : '▼'} ${Math.abs(change)}%</td>`;
        tbody.appendChild(tr);
    });
}


// ══════════════════════════════════════════════════
//  RENDER: Breakdowns
// ══════════════════════════════════════════════════
function renderCategoryChart(data) {
    new Chart(document.getElementById('categoryChart'), {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.Category),
            datasets: [{ data: data.map(d => d.Sales), backgroundColor: [COLORS.blue+'cc', COLORS.cyan+'cc', COLORS.green+'cc'], borderColor: [COLORS.blue, COLORS.cyan, COLORS.green], borderWidth: 2, hoverOffset: 8 }]
        },
        options: { cutout: '65%', plugins: { legend: { display: true, position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' } }, tooltip: { callbacks: { label: c => `${c.label}: ${formatCurrency(c.raw)}` } } } }
    });
}

function renderRegionChart(data) {
    new Chart(document.getElementById('regionChart'), {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.Region),
            datasets: [{ data: data.map(d => d.Sales), backgroundColor: [COLORS.purple+'cc', COLORS.orange+'cc', COLORS.pink+'cc', COLORS.cyan+'cc'], borderColor: [COLORS.purple, COLORS.orange, COLORS.pink, COLORS.cyan], borderWidth: 2, hoverOffset: 8 }]
        },
        options: { cutout: '65%', plugins: { legend: { display: true, position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' } }, tooltip: { callbacks: { label: c => `${c.label}: ${formatCurrency(c.raw)}` } } } }
    });
}

function renderSegmentChart(data) {
    new Chart(document.getElementById('segmentChart'), {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.Segment),
            datasets: [{ data: data.map(d => d.Sales), backgroundColor: [COLORS.green+'cc', COLORS.blue+'cc', COLORS.orange+'cc'], borderColor: [COLORS.green, COLORS.blue, COLORS.orange], borderWidth: 2, hoverOffset: 8 }]
        },
        options: { cutout: '65%', plugins: { legend: { display: true, position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' } }, tooltip: { callbacks: { label: c => `${c.label}: ${formatCurrency(c.raw)}` } } } }
    });
}

function renderSubCategoryChart(data) {
    const top10 = data.slice(0, 10);
    new Chart(document.getElementById('subCategoryChart'), {
        type: 'bar',
        data: {
            labels: top10.map(d => d['Sub-Category']),
            datasets: [{ data: top10.map(d => d.Sales), backgroundColor: top10.map((_, i) => CHART_COLORS[i]+'99'), borderColor: top10.map((_, i) => CHART_COLORS[i]), borderWidth: 1.5, borderRadius: 6, borderSkipped: false }]
        },
        options: {
            indexAxis: 'y',
            plugins: { tooltip: { callbacks: { label: c => formatCurrency(c.raw) } } },
            scales: { x: { ticks: { callback: v => formatCurrency(v) }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { grid: { display: false } } }
        }
    });
}


// ══════════════════════════════════════════════════
//  RENDER: Seasonality
// ══════════════════════════════════════════════════
function renderSeasonalityChart(data) {
    const monthlyAvg = data.monthly_avg;
    new Chart(document.getElementById('seasonalityChart'), {
        type: 'bar',
        data: {
            labels: monthlyAvg.map(d => MONTH_NAMES[d.Month - 1]),
            datasets: [{
                data: monthlyAvg.map(d => d.AvgSales),
                backgroundColor: monthlyAvg.map(d => [11, 12].includes(d.Month) ? COLORS.orange+'bb' : COLORS.cyan+'88'),
                borderColor: monthlyAvg.map(d => [11, 12].includes(d.Month) ? COLORS.orange : COLORS.cyan),
                borderWidth: 1.5, borderRadius: 8, borderSkipped: false,
            }]
        },
        options: {
            plugins: { tooltip: { callbacks: { label: c => `Sales: ${formatCurrency(c.raw)}`, afterLabel: c => [11, 12].includes(c.dataIndex + 1) ? '🔥 Holiday Season' : '' } } },
            scales: { y: { ticks: { callback: v => formatCurrency(v) }, grid: { color: 'rgba(255,255,255,0.04)' } }, x: { grid: { display: false } } }
        }
    });
}

function renderYearlyMonthlyChart(data) {
    const yearlyMonthly = data.yearly_monthly;
    const years = [...new Set(yearlyMonthly.map(d => d.Year))].sort();
    const datasets = years.map((year, i) => {
        const monthMap = {};
        yearlyMonthly.filter(d => d.Year === year).forEach(d => { monthMap[d.Month] = d.Sales; });
        return {
            label: String(year),
            data: Array.from({ length: 12 }, (_, m) => monthMap[m + 1] || 0),
            borderColor: CHART_COLORS[i % CHART_COLORS.length],
            backgroundColor: 'transparent',
            tension: 0.4, borderWidth: 2, pointRadius: 3, pointHoverRadius: 6,
        };
    });

    new Chart(document.getElementById('yearlyMonthlyChart'), {
        type: 'line',
        data: { labels: MONTH_NAMES, datasets },
        options: {
            plugins: { legend: { display: true, position: 'top', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' } }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${formatCurrency(c.raw)}` } } },
            scales: { y: { ticks: { callback: v => formatCurrency(v) }, grid: { color: 'rgba(255,255,255,0.04)' } }, x: { grid: { display: false } } },
            interaction: { intersect: false, mode: 'index' }
        }
    });
}


// ══════════════════════════════════════════════════
//  RENDER: Model Info (simple single model)
// ══════════════════════════════════════════════════
function renderModelInfo(metrics) {
    const grid = document.getElementById('modelStats');
    const items = [
        { label: 'MAE', value: formatCurrency(metrics.mae), cls: '' },
        { label: 'RMSE', value: formatCurrency(metrics.rmse), cls: '' },
        { label: 'MAPE', value: metrics.mape + '%', cls: metrics.mape < 15 ? 'good' : metrics.mape < 30 ? 'moderate' : 'poor' },
        { label: 'R²', value: metrics.r2.toString(), cls: metrics.r2 > 0.7 ? 'good' : metrics.r2 > 0.4 ? 'moderate' : 'poor' },
        { label: 'Train Size', value: metrics.train_size + ' months', cls: '' },
        { label: 'Test Size', value: metrics.test_size + ' months', cls: '' },
    ];

    grid.innerHTML = items.map(i => `
        <div class="stat-item">
            <div class="stat-label">${i.label}</div>
            <div class="stat-value ${i.cls}">${i.value}</div>
        </div>
    `).join('');
}

function renderActualVsPred(metrics) {
    const labels = metrics.actual.map((_, i) => `Month ${i + 1}`);
    new Chart(document.getElementById('actualVsPredChart'), {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Actual Sales', data: metrics.actual, borderColor: COLORS.blue, backgroundColor: 'transparent', borderWidth: 2.5, tension: 0.4, pointRadius: 4, pointBackgroundColor: COLORS.blue },
                { label: 'Predicted Sales', data: metrics.predictions, borderColor: COLORS.green, backgroundColor: 'transparent', borderWidth: 2.5, tension: 0.4, borderDash: [6, 4], pointRadius: 4, pointBackgroundColor: COLORS.green }
            ]
        },
        options: {
            plugins: { legend: { display: true, position: 'top', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' } }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${formatCurrency(c.raw)}` } } },
            scales: { y: { ticks: { callback: v => formatCurrency(v) }, grid: { color: 'rgba(255,255,255,0.04)' } }, x: { grid: { display: false } } },
            interaction: { intersect: false, mode: 'index' }
        }
    });
}


// ══════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════
loadDashboard();
