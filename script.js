const ChartDataLabels = window.ChartDataLabels;
Chart.register(ChartDataLabels);
let activeCharts = {};
const themeColors = ['#5b9bd5', '#ed7d31', '#a5a5a5', '#ffc000', '#4472c4', '#70ad47', '#255e91', '#9e480e', '#636363', '#997300'];

// 16 = ~8K sharpness; charts render at (css size × this ratio) for maximum PDF quality
var PRINT_DPI_RATIO = 16;

function setChartsHighDPIForPrint(ratio) {
    ratio = ratio || PRINT_DPI_RATIO;
    Object.keys(activeCharts).forEach(function (key) {
        var ch = activeCharts[key];
        if (ch && ch.canvas) {
            if (ch.options) ch.options.devicePixelRatio = ratio;
            ch.resize();
        }
    });
}

function printReport() {
    setChartsHighDPIForPrint(PRINT_DPI_RATIO);
    // Allow charts to re-render at high DPI before print capture
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            function onAfterPrint() {
                window.removeEventListener('afterprint', onAfterPrint);
                window.location.reload();
            }
            window.addEventListener('afterprint', onAfterPrint);
            window.print();
        });
    });
}

function sync() {
    const name = document.getElementById('inName').value;
    const coverTitle = document.getElementById('outCoverName');
    if (coverTitle) coverTitle.innerText = `${name} - SOC Daily Report`;

    const docControlTitle = document.getElementById('docControlTitle');
    if (docControlTitle) docControlTitle.innerText = `${name} - SOC Daily Report`;

    const epsLabel = document.getElementById('epsCustomerLabel');
    if (epsLabel) epsLabel.innerText = name;

    // Check for BluPine customer
    const isBluPine = name.trim().toLowerCase().includes('blupine');
    const bpSection = document.getElementById('bluPineSectionWrapper');
    const mainHeader = document.getElementById('mainIncidentHeader');
    const tocBluPine = document.getElementById('tocBluPineItem');
    const tocMain = document.getElementById('tocMainIncidentItem');

    if (bpSection && mainHeader) {
        if (isBluPine) {
            bpSection.style.display = 'flex';
            mainHeader.innerText = '6. Potential Incidents';
            if (tocBluPine) tocBluPine.style.display = 'flex';
            if (tocMain) tocMain.querySelector('span:first-child').innerText = '6. Potential Incidents';
        } else {
            bpSection.style.display = 'none';
            mainHeader.innerText = '5. Potential Incidents';
            if (tocBluPine) tocBluPine.style.display = 'none';
            if (tocMain) tocMain.querySelector('span:first-child').innerText = '5. Potential Incidents';
        }
    }

    refreshEPS();
    refreshBluPineChart();
    adjustLayoutForBluPine();
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            managePagination();
            updatePageNumbers();
        });
    });
}

function loadImg(e, type) {
    if (!e.target.files.length) return;
    const r = new FileReader();
    r.onload = () => {
        if (type === 'snsLogo') {
            document.querySelectorAll('.sns-logo-img').forEach(img => img.src = r.result);
        } else {
            const el = document.getElementById('custLogo');
            if (el) el.src = r.result;
        }
    };
    r.readAsDataURL(e.target.files[0]);
}

function escapeHtmlCell(val) {
    if (val == null) return '';
    return String(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Drag resize between column headers (Potential Incidents tables only). */
const INCIDENT_COL_MIN_PX = 40;
const DEFAULT_INCIDENT_COL_FRACS = [0.04, 0.10, 0.09, 0.22, 0.46, 0.09];

function getIncidentDataTables() {
    return document.querySelectorAll('.incident-table-wrap table.incident-data-table');
}

function ensureIncidentColgroup(table) {
    let cg = table.querySelector('colgroup');
    if (!cg) {
        cg = document.createElement('colgroup');
        const cls = ['inc-col-sn', 'inc-col-ticket', 'inc-col-sev', 'inc-col-title', 'inc-col-obs', 'inc-col-status'];
        for (let i = 0; i < 6; i++) {
            const col = document.createElement('col');
            col.className = cls[i];
            cg.appendChild(col);
        }
        table.insertBefore(cg, table.firstChild);
    }
    return cg;
}

function incidentTableInnerWidth(table) {
    const w = table.getBoundingClientRect().width;
    if (w > 1) return w;
    const ow = table.offsetWidth;
    if (ow > 1) return ow;
    return 720;
}

function readIncidentColWidthsPx(table) {
    const cols = table.querySelectorAll('colgroup col');
    if (cols.length !== 6) return null;
    const out = [];
    for (let i = 0; i < 6; i++) {
        const px = parseFloat(cols[i].style.width);
        if (!px || px <= 0) return null;
        out.push(px);
    }
    return out;
}

function applyIncidentColWidthsPx(widthsPx) {
    getIncidentDataTables().forEach(function (table) {
        ensureIncidentColgroup(table);
        const cols = table.querySelectorAll('colgroup col');
        if (cols.length !== 6) return;
        widthsPx.forEach(function (px, i) {
            cols[i].style.width = Math.max(INCIDENT_COL_MIN_PX, Math.round(px)) + 'px';
        });
    });
}

function normalizeIncidentColWidths(table) {
    ensureIncidentColgroup(table);
    const cols = table.querySelectorAll('colgroup col');
    if (cols.length !== 6) return;
    const w = table.clientWidth || table.getBoundingClientRect().width;
    if (!w || w < 80) return;
    let widths = Array.from(cols).map(function (c) {
        return parseFloat(c.style.width) || 0;
    });
    let sum = widths.reduce(function (a, b) {
        return a + b;
    }, 0);
    if (sum < 1) {
        widths = DEFAULT_INCIDENT_COL_FRACS.map(function (f) {
            return f * w;
        });
        sum = widths.reduce(function (a, b) {
            return a + b;
        }, 0);
    }
    const scale = w / sum;
    widths = widths.map(function (x) {
        return Math.max(INCIDENT_COL_MIN_PX * 0.85, x * scale);
    });
    sum = widths.reduce(function (a, b) {
        return a + b;
    }, 0);
    if (sum > w) {
        const s2 = w / sum;
        widths = widths.map(function (x) {
            return Math.floor(x * s2);
        });
        sum = widths.reduce(function (a, b) {
            return a + b;
        }, 0);
    }
    if (sum < w) {
        widths[4] += w - sum;
    }
    applyIncidentColWidthsPx(widths);
}

function initIncidentColumnResize(table) {
    if (!table || table.dataset.incidentResizeInit === '1') return;
    const theadRow = table.querySelector('thead tr');
    if (!theadRow) return;
    const ths = theadRow.querySelectorAll('th');
    if (ths.length !== 6) return;

    ensureIncidentColgroup(table);
    const firstInited = Array.from(getIncidentDataTables()).find(function (t) {
        return t.dataset.incidentResizeInit === '1';
    });

    if (firstInited) {
        const w = readIncidentColWidthsPx(firstInited);
        if (w) applyIncidentColWidthsPx(w);
    } else {
        const tw = incidentTableInnerWidth(table);
        const widths = DEFAULT_INCIDENT_COL_FRACS.map(function (f) {
            return f * tw;
        });
        applyIncidentColWidthsPx(widths);
        normalizeIncidentColWidths(table);
    }

    table.dataset.incidentResizeInit = '1';

    ths.forEach(function (th, idx) {
        if (idx === 4) return;
        if (th.querySelector('.incident-col-resize-handle')) return;

        const handle = document.createElement('span');
        handle.className = 'incident-col-resize-handle';
        handle.title = 'Drag to resize columns';
        th.appendChild(handle);

        handle.addEventListener('mousedown', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const sourceTable = table;
            const base = readIncidentColWidthsPx(sourceTable);
            if (!base) return;
            const startX = e.clientX;
            const wL0 = base[idx];
            const wR0 = base[idx + 1];
            const prevUserSelect = document.body.style.userSelect;
            document.body.style.userSelect = 'none';

            function onMove(ev) {
                const dx = ev.clientX - startX;
                let wL = wL0 + dx;
                let wR = wR0 - dx;
                if (wL < INCIDENT_COL_MIN_PX) {
                    wR -= INCIDENT_COL_MIN_PX - wL;
                    wL = INCIDENT_COL_MIN_PX;
                }
                if (wR < INCIDENT_COL_MIN_PX) {
                    wL -= INCIDENT_COL_MIN_PX - wR;
                    wR = INCIDENT_COL_MIN_PX;
                }
                const next = base.slice();
                next[idx] = wL;
                next[idx + 1] = wR;
                applyIncidentColWidthsPx(next);
            }

            function onUp() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                document.body.style.userSelect = prevUserSelect;
                const anchor = getIncidentDataTables()[0];
                if (anchor) normalizeIncidentColWidths(anchor);
                requestAnimationFrame(function () {
                    managePagination();
                    updatePageNumbers();
                });
            }

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    });
}

function initNewIncidentTablesResizeOnly() {
    getIncidentDataTables().forEach(function (t) {
        if (t.dataset.incidentResizeInit !== '1') {
            initIncidentColumnResize(t);
        }
    });
}

/** Keep incident tables exactly within the page content width (no horizontal scrollbar). */
function fitIncidentTablesToPageWidth() {
    const anchor = getIncidentDataTables()[0];
    if (!anchor) return;
    normalizeIncidentColWidths(anchor);
}

let incidentTableFitTimeout;
window.addEventListener('resize', function () {
    clearTimeout(incidentTableFitTimeout);
    incidentTableFitTimeout = setTimeout(function () {
        fitIncidentTablesToPageWidth();
    }, 200);
});

function addRow() {
    const tbodies = document.querySelectorAll('.incident-tbody');
    const lastTbody = tbodies[tbodies.length - 1];
    const rowCount = document.querySelectorAll('.incident-tbody tr').length + 1;
    const row = '<tr>'
        + `<td contenteditable="true">${rowCount}</td>`
        + '<td contenteditable="true">#</td>'
        + '<td contenteditable="true">High</td>'
        + '<td contenteditable="true">New Incident</td>'
        + '<td contenteditable="true"></td>'
        + '<td contenteditable="true">Open</td>'
        + '</tr>';
    lastTbody.insertAdjacentHTML('beforeend', row);
    managePagination();
}

function delRow() {
    const tbodies = document.querySelectorAll('.incident-tbody');
    let totalRows = 0;
    tbodies.forEach(tb => totalRows += tb.rows.length);

    if (totalRows === 1) {
        // Just clear the contents of the final row instead of deleting it
        let firstRow = tbodies[0].rows[0];
        let isEmpty = true;
        for (let i = 1; i < firstRow.cells.length; i++) {
            if (firstRow.cells[i].innerHTML !== '<b>-</b>') {
                isEmpty = false;
                firstRow.cells[i].innerHTML = '<b>-</b>';
            }
        }
        if (isEmpty) {
            for (let i = 1; i < firstRow.cells.length; i++) {
                firstRow.cells[i].innerHTML = '';
            }
        }
    } else {
        // Normal deletion logic
        for (let i = tbodies.length - 1; i >= 0; i--) {
            if (tbodies[i].rows.length > 0) {
                tbodies[i].deleteRow(tbodies[i].rows.length - 1);
                break;
            }
        }
    }
    managePagination();
}

function refreshBluPineChart() {
    const isBluPine = document.getElementById('inName').value.trim().toLowerCase().includes('blupine');
    if (!isBluPine) {
        if (activeCharts.bluPine) {
            activeCharts.bluPine.destroy();
            delete activeCharts.bluPine;
        }
        return;
    }

    const titles = {};
    document.querySelectorAll('.incident-tbody tr').forEach(tr => {
        if (tr.cells.length > 4) {
            let title = tr.cells[3].innerText.trim();
            if (title && title !== '#' && title !== 'Enter observation...' && title !== '-' && title !== 'New Incident') {
                titles[title] = (titles[title] || 0) + 1;
            }
        }
    });

    const datasetLabels = Object.keys(titles);

    if (activeCharts.bluPine) activeCharts.bluPine.destroy();

    const counts = Object.values(titles);
    const maxCount = counts.length > 0 ? Math.max(...counts) : 0;

    const bpBox = document.getElementById('bluPineChartBox');
    const bpMsg = document.getElementById('bpBlankMsg');
    const bpSection = document.getElementById('bluPineSectionWrapper');

    if (datasetLabels.length === 0) {
        if (bpBox) bpBox.style.display = 'none';
        if (bpMsg) {
            bpMsg.style.display = 'block';
            bpMsg.style.marginBottom = '25px';
        }
        if (bpSection) bpSection.style.marginBottom = '0px';
        return;
    } else {
        if (bpBox) {
            bpBox.style.display = 'flex';
            bpBox.style.marginBottom = '20px';
        }
        if (bpMsg) bpMsg.style.display = 'none';
        if (bpSection) bpSection.style.marginBottom = '10px';
    }

    const canvas = document.getElementById('bluPineChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // One dataset per incident title: each bar gets its own legend color + name (SS3 style)
    const bpDatasets = datasetLabels.map((title, i) => ({
        label: title,
        data: [titles[title]],
        backgroundColor: themeColors[i % themeColors.length],
        maxBarThickness: 80
    }));

    activeCharts.bluPine = new Chart(ctx, {
        type: 'bar',
        data: { labels: ['Count'], datasets: bpDatasets },
        options: {
            maintainAspectRatio: false,
            layout: { padding: { top: 25, left: 10, right: 10, bottom: 5 } },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        boxWidth: 12, padding: 12,
                        font: { size: 10 },
                        generateLabels: function(chart) {
                            return chart.data.datasets.map((ds, i) => ({
                                text: ds.label,
                                fillStyle: ds.backgroundColor,
                                strokeStyle: ds.backgroundColor,
                                lineWidth: 0, datasetIndex: i, hidden: false
                            }));
                        }
                    }
                },
                datalabels: { anchor: 'end', align: 'top', font: { size: 12, weight: 'bold' }, formatter: (v) => v || '', color: '#555' },
                title: { display: true, text: 'Potential Incidents with Count', font: { size: 16, weight: 'bold' }, color: '#444', padding: { bottom: 10 } }
            },
            scales: {
                y: { beginAtZero: true, suggestedMax: maxCount > 0 ? maxCount + 1 : 1, ticks: { stepSize: 1, precision: 0 }, grid: { drawBorder: false } },
                x: { grid: { display: false }, ticks: { display: false } }
            }
        }
    });
}

// --- Flexible pagination: responds to typing AND row height changes (wrapping text) ---
let paginationTimeout;

// Debounced pagination trigger — used by both input and ResizeObserver
function schedulePagination() {
    clearTimeout(paginationTimeout);
    paginationTimeout = setTimeout(() => {
        managePagination();
    }, 300);
}

// ResizeObserver watches every incident-tbody.
// When a row's content wraps and the tbody grows taller, pagination re-runs automatically.
const tbodyResizeObserver = new ResizeObserver(() => {
    schedulePagination();
});

function observeTbody(tbody) {
    if (tbody) tbodyResizeObserver.observe(tbody);
}

// Observe existing tbodies on load
document.querySelectorAll('.incident-tbody').forEach(observeTbody);

// Keyboard input still triggers pagination (for fast typists before resize fires)
document.addEventListener('input', function (e) {
    if (e.target.closest('.incident-tbody')) {
        schedulePagination();
    }
});

// Per-cell editing: Enter = line break in the same cell. Tab / Shift+Tab = next/previous cell (stays in table).
document.addEventListener('keydown', function (e) {
    const td = e.target.closest('.incident-data-table td[contenteditable]');
    if (!td || !e.target.closest('.incident-tbody')) return;
    if (e.key === 'Enter') {
        e.preventDefault();
        document.execCommand('insertLineBreak');
        return;
    }
    if (e.key === 'Tab') {
        e.preventDefault();
        const all = Array.from(document.querySelectorAll('.incident-tbody td[contenteditable]'));
        const i = all.indexOf(td);
        if (i === -1) return;
        const next = e.shiftKey ? all[i - 1] : all[i + 1];
        if (next) {
            next.focus();
            const sel = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(next);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
}, true);

/** Pixel band reserved above the footer for the auto-generated NOTE (last table only). */
function getIncidentNoteReservePx() {
    let hasOpen = false;
    let hasClosed = false;
    let rowsExist = false;
    document.querySelectorAll('.incident-tbody tr').forEach(function (tr) {
        if (tr.cells.length > 4) {
            rowsExist = true;
            const status = tr.cells[5].innerText.trim().toLowerCase();
            if (status.includes('open')) hasOpen = true;
            if (status.includes('close')) hasClosed = true;
        }
    });
    if (!rowsExist) return 0;
    if (hasOpen || hasClosed) return 130;
    return 0;
}

function incidentNoteOverlapsFooter() {
    const note = document.getElementById('incidentStatusNote');
    if (!note || !note.innerText.trim()) return false;
    const page = note.closest('.page');
    if (!page) return false;
    const fs = page.querySelector('.footer-strip');
    if (!fs) return false;
    const pad = 16;
    return note.getBoundingClientRect().bottom > fs.getBoundingClientRect().top - pad;
}

function moveLastRowFromLastIncidentTbodyToNextPage() {
    const tbodies = document.querySelectorAll('.incident-tbody');
    if (tbodies.length === 0) return false;
    const tbody = tbodies[tbodies.length - 1];
    if (tbody.rows.length === 0) return false;
    const page = tbody.closest('.page');
    let nextPage = page.nextElementSibling;
    if (!nextPage || !nextPage.classList.contains('incident-page-extra')) {
        nextPage = createNewIncidentPage(page);
    }
    const nextTbody = nextPage.querySelector('.incident-tbody');
    if (!nextTbody) return false;
    const lastRow = tbody.rows[tbody.rows.length - 1];
    nextTbody.insertBefore(lastRow, nextTbody.firstChild);
    return true;
}

function pruneEmptyIncidentContinuationPages() {
    document.querySelectorAll('.page.incident-page-extra').forEach(function (pg) {
        if (pg.classList.contains('incident-note-overflow-page')) return;
        const tb = pg.querySelector('.incident-tbody');
        if (tb && tb.rows.length === 0) pg.remove();
    });
}

function createIncidentNoteOverflowPage(afterPage) {
    const page = document.createElement('div');
    page.className = 'page incident-page-extra incident-note-overflow-page';
    page.innerHTML = ''
        + `<img class="sns-logo-img page-sns-logo" src="${(document.querySelector('.page-sns-logo') || {src:''}).src}" alt="">`
        + '<div class="incident-note-overflow-inner" style="flex-grow:1;display:flex;flex-direction:column;padding:12px 0 88px;min-height:0;box-sizing:border-box;">'
        + '</div>'
        + '<div class="footer-text-row"><span class="confidential-mark">Confidential</span><span class="page-num"></span></div>'
        + '<div class="footer-strip"><div class="strip-blue"></div><div class="strip-pink"></div></div>';
    afterPage.parentNode.insertBefore(page, afterPage.nextSibling);
    return page;
}

/** When one row is too tall + NOTE, move NOTE to the following page (table stays). */
function moveIncidentNoteToDedicatedPage() {
    const noteEl = document.getElementById('incidentStatusNote');
    if (!noteEl || !noteEl.innerText.trim()) return false;
    const tbodies = document.querySelectorAll('.incident-tbody');
    if (tbodies.length === 0) return false;
    let afterPage = tbodies[tbodies.length - 1].closest('.page');
    if (!afterPage) return false;
    let nx = afterPage.nextElementSibling;
    while (nx && nx.classList.contains('incident-page-extra') && !nx.classList.contains('incident-note-overflow-page')) {
        const tb = nx.querySelector('.incident-tbody');
        if (tb && tb.rows.length > 0) {
            afterPage = nx;
            nx = afterPage.nextElementSibling;
        } else {
            break;
        }
    }
    let notePage = afterPage.nextElementSibling;
    if (!notePage || !notePage.classList.contains('incident-note-overflow-page')) {
        notePage = createIncidentNoteOverflowPage(afterPage);
    }
    const inner = notePage.querySelector('.incident-note-overflow-inner');
    if (!inner) return false;
    noteEl.setAttribute('data-note-on-overflow-page', '1');
    inner.appendChild(noteEl);
    return true;
}

function renumberIncidentRows() {
    let sn = 1;
    document.querySelectorAll('.incident-tbody tr').forEach(function (tr) {
        if (tr.cells.length > 0) tr.cells[0].innerText = sn++;
    });
}

function ensureIncidentNoteClearsFooter() {
    const notePinned = document.getElementById('incidentStatusNote');
    if (notePinned && notePinned.getAttribute('data-note-on-overflow-page') === '1') {
        if (!incidentNoteOverlapsFooter()) return;
        notePinned.removeAttribute('data-note-on-overflow-page');
        document.querySelectorAll('.incident-note-overflow-page').forEach(function (p) {
            p.remove();
        });
        updateIncidentNote();
    }
    let guard = 0;
    while (guard++ < 400 && incidentNoteOverlapsFooter()) {
        const tbodies = document.querySelectorAll('.incident-tbody');
        const lastTb = tbodies[tbodies.length - 1];
        if (!lastTb || lastTb.rows.length === 0) break;

        if (lastTb.rows.length > 1) {
            if (!moveLastRowFromLastIncidentTbodyToNextPage()) break;
            pruneEmptyIncidentContinuationPages();
            renumberIncidentRows();
            updateIncidentNote();
        } else {
            if (!moveIncidentNoteToDedicatedPage()) break;
            updateIncidentNote();
            break;
        }
    }
}

function managePagination() {
    const isBluPine = document.getElementById('inName').value.trim().toLowerCase().includes('blupine');

    // ── SECTION-LEVEL CHECK ───────────────────────────────────────────────
    // Check if the "Potential Incidents" heading + table starts too close to
    // the footer on its current page (< 150px room). If so, move the ENTIRE
    // section5Wrapper to a dedicated next page BEFORE row-level pagination.
    {
        const sec5 = document.getElementById('section5Wrapper');
        if (sec5) {
            const currentPage = sec5.closest('.page');
            if (currentPage) {
                const footerStrip = currentPage.querySelector('.footer-strip');
                if (footerStrip) {
                    const footerTop = footerStrip.getBoundingClientRect().top;
                    const sec5Top = sec5.getBoundingClientRect().top;
                    const roomLeft = footerTop - sec5Top;
                    if (roomLeft < 150) {
                        // Not enough room — create a new page and move section5Wrapper there
                        let overflowPage = document.getElementById('p7');
                        if (!overflowPage) {
                            overflowPage = document.createElement('div');
                            overflowPage.className = 'page';
                            overflowPage.id = 'p7';
                            overflowPage.innerHTML = `<img class="sns-logo-img page-sns-logo" src="${(document.querySelector('.page-sns-logo') || {src:''}).src}" alt="">`
                                + '<div id="p7Container" style="flex-grow:0;display:flex;flex-direction:column;position:relative;padding-top:10px;"></div>'
                                + '<div class="footer-text-row"><span class="confidential-mark">Confidential</span><span class="page-num"></span></div>'
                                + '<div class="footer-strip"><div class="strip-blue"></div><div class="strip-pink"></div></div>';
                            currentPage.parentNode.insertBefore(overflowPage, currentPage.nextSibling);
                        }
                        const overflowContainer = overflowPage.querySelector('#p7Container');
                        if (overflowContainer && sec5.parentNode !== overflowContainer) {
                            overflowContainer.appendChild(sec5);
                        }
                    }
                }
            }
        }
    }

    let tables = Array.from(document.querySelectorAll('.incident-tbody'));

    // Move overflowing rows to next page (reserve space for NOTE below last table)
    for (let i = 0; i < tables.length; i++) {
        let tbody = tables[i];
        let page = tbody.closest('.page');
        const isLastTbody = i === tables.length - 1;
        const noteReserve = isLastTbody ? getIncidentNoteReservePx() : 0;
        let overflowGuard = 0;

        while (tbody.rows.length > 0 && overflowGuard < 400) {
            overflowGuard++;
            let pageRect = page.getBoundingClientRect();
            if (pageRect.height === 0) break; // Hidden page

            // Use the footer strip as the true bottom boundary of printable area
            let footerStrip = page.querySelector('.footer-strip');
            let pageBottom = footerStrip ? footerStrip.getBoundingClientRect().top : pageRect.bottom - 45;
            pageBottom -= noteReserve;

            let lastRow = tbody.rows[tbody.rows.length - 1];
            let rowRect = lastRow.getBoundingClientRect();

            if (rowRect.bottom > pageBottom - 10) {
                let nextPage = page.nextElementSibling;
                if (!nextPage || !nextPage.classList.contains('incident-page-extra')) {
                    nextPage = createNewIncidentPage(page);
                    tables.splice(i + 1, 0, nextPage.querySelector('.incident-tbody'));
                }
                let nextTbody = nextPage.querySelector('.incident-tbody');
                nextTbody.insertBefore(lastRow, nextTbody.firstChild);
            } else {
                break; // Fits perfectly
            }
        }
    }

    // Move underflowing rows back to previous page and cleanup empty pages
    tables = Array.from(document.querySelectorAll('.incident-tbody'));
    for (let i = tables.length - 1; i > 0; i--) {
        let tbody = tables[i];
        if (tbody.rows.length === 0) {
            let page = tbody.closest('.page');
            if (page && page.id !== 'p5' && page.id !== 'p6') page.remove();
            continue;
        }

        let prevTbody = tables[i - 1];
        let prevPage = prevTbody.closest('.page');
        const noteReserveUnderflow = i === tables.length - 1 ? getIncidentNoteReservePx() : 0;
        let underflowGuard = 0;

        while (tbody.rows.length > 0 && underflowGuard < 400) {
            underflowGuard++;
            let pageRect = prevPage.getBoundingClientRect();
            if (pageRect.height === 0) break;

            let footerStrip = prevPage.querySelector('.footer-strip');
            let pageBottom = footerStrip ? footerStrip.getBoundingClientRect().top : pageRect.bottom - 45;
            pageBottom -= noteReserveUnderflow;

            let firstRow = tbody.rows[0];
            prevTbody.appendChild(firstRow);

            let newRowRect = firstRow.getBoundingClientRect();
            if (newRowRect.bottom > pageBottom - 10) {
                // Not enough space, put it back
                tbody.insertBefore(firstRow, tbody.firstChild);
                break;
            }
        }

        if (tbody.rows.length === 0) {
            let pToRemove = tbody.closest('.page');
            if (pToRemove && pToRemove.id !== 'p5' && pToRemove.id !== 'p6') pToRemove.remove();
        }
    }

    // Reassign serial numbers
    let sn = 1;
    document.querySelectorAll('.incident-tbody tr').forEach(tr => {
        if (tr.cells.length > 0) tr.cells[0].innerText = sn++;
    });

    updateIncidentNote();
    ensureIncidentNoteClearsFooter();

    refreshBluPineChart();
    updatePageNumbers();
    // Re-register any new tbodies created during pagination with the ResizeObserver
    document.querySelectorAll('.incident-tbody').forEach(observeTbody);
    requestAnimationFrame(function () {
        initNewIncidentTablesResizeOnly();
        requestAnimationFrame(function () {
            fitIncidentTablesToPageWidth();
        });
    });
}

function createNewIncidentPage(afterPage) {
    // Determine correct heading number for continuation pages
    const isBluPine = document.getElementById('inName').value.trim().toLowerCase().includes('blupine');
    const headingNum = isBluPine ? '6' : '5';

    const newPage = document.createElement('div');
    newPage.className = 'page incident-page-extra';
    newPage.innerHTML = `
        <img class="sns-logo-img page-sns-logo" src="${(document.querySelector('.page-sns-logo') || {src:''}).src}" alt="">
        <div style="flex-grow:0;display:flex;flex-direction:column;position:relative;">
            <h3 class="section-header incident-section-heading incident-section-heading--continued" style="margin-top:10px;">${headingNum}. Potential Incidents (Continued)</h3>
            <div class="box-border incident-table-wrap" style="padding:0;margin-bottom:35px;border:1px solid #ccc;flex-grow:0;min-height:fit-content;height:auto;">
                <table class="data-table incident-data-table">
                    <colgroup>
                        <col class="inc-col-sn">
                        <col class="inc-col-ticket">
                        <col class="inc-col-sev">
                        <col class="inc-col-title">
                        <col class="inc-col-obs">
                        <col class="inc-col-status">
                    </colgroup>
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Ticket No</th>
                            <th>Severity</th>
                            <th>Incident Title</th>
                            <th>Observation &amp; Recommendation</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody class="incident-tbody"></tbody>
                </table>
            </div>
        </div>
        <div class="footer-text-row"><span class="confidential-mark">Confidential</span><span class="page-num"></span></div>
        <div class="footer-strip"><div class="strip-blue"></div><div class="strip-pink"></div></div>
    `;
    afterPage.parentNode.insertBefore(newPage, afterPage.nextSibling);
    // Register the new tbody with the ResizeObserver so it triggers pagination on resize
    const newTbody = newPage.querySelector('.incident-tbody');
    observeTbody(newTbody);
    return newPage;
}

function updateIncidentNote() {
    let noteEl = document.getElementById('incidentStatusNote');
    if (!noteEl) {
        noteEl = document.createElement('p');
        noteEl.id = 'incidentStatusNote';
        noteEl.contentEditable = "true";
        noteEl.style.cssText = 'margin-top: 20px; font-weight: bold; font-size: 11pt; color: #555;';
    }

    let hasOpen = false;
    let hasClosed = false;
    let rowsExist = false;

    // Scan ALL incident tables (this naturally excludes the BluPine table which uses .blupine-tbody)
    document.querySelectorAll('.incident-tbody tr').forEach(tr => {
        if (tr.cells.length > 5) {
            rowsExist = true;
            let status = tr.cells[5].innerText.trim().toLowerCase();
            if (status.includes('open')) hasOpen = true;
            if (status.includes('close')) hasClosed = true;
        }
    });

    if (!rowsExist) {
        noteEl.innerText = "";
        noteEl.removeAttribute('data-note-on-overflow-page');
        document.querySelectorAll('.incident-note-overflow-page').forEach(function (p) {
            p.remove();
        });
        noteEl.remove();
        return;
    } else if (hasOpen) {
        noteEl.innerText = "NOTE : We have shared the remediation details with the customer, and the action is currently pending on their side.";
    } else if (hasClosed) {
        noteEl.innerText = "NOTE : We have shared the remediation details with the customer, and the action is taken/Confirmed by the customer as a legitimate.";
    } else {
        noteEl.innerText = "";
        noteEl.removeAttribute('data-note-on-overflow-page');
        document.querySelectorAll('.incident-note-overflow-page').forEach(function (p) {
            p.remove();
        });
    }

    if (noteEl.getAttribute('data-note-on-overflow-page') === '1') {
        return;
    }

    if (!noteEl.innerText.trim()) {
        noteEl.remove();
        return;
    }

    // Attach the note below the very last incident table that exists (to support pagination)
    const tbodies = document.querySelectorAll('.incident-tbody');
    if (tbodies.length > 0) {
        const lastTbody = tbodies[tbodies.length - 1];
        const boxBorder = lastTbody.closest('.box-border');
        if (boxBorder && boxBorder.parentNode) {
            boxBorder.parentNode.insertBefore(noteEl, boxBorder.nextSibling);
        }
    }
}

function adjustLayoutForBluPine() {
    const isBluPine = document.getElementById('inName').value.trim().toLowerCase().includes('blupine');

    const sec5 = document.getElementById('section5Wrapper');
    const container = document.getElementById('incidentSectionsContainer');
    const p6 = document.getElementById('p6');

    if (!sec5 || !container || !p6) return;

    // Remove any stale p7 — managePagination will create overflow pages as needed
    const p7 = document.getElementById('p7');
    if (p7) p7.remove();

    // Always keep sec5 (Section 6 heading + table) inside container on p6.
    // managePagination() handles pushing overflow rows to a new page automatically.
    if (sec5.parentNode !== container) {
        container.appendChild(sec5);
    }
}

function incidentTableHasRealData() {
    const rows = Array.from(document.querySelectorAll('.incident-tbody tr'));
    if (rows.length === 0) return false;

    const isPlaceholder = (raw) => {
        const text = (raw || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (!text) return true;
        return (
            text === '-' ||
            text === '#' ||
            text === 'new incident' ||
            text === 'enter observation...' ||
            text === 'n/a' ||
            text === 'tbd'
        );
    };

    // If ANY row contains any non-placeholder value (excluding S.N), treat as "data present".
    return rows.some(tr => {
        const cells = Array.from(tr.cells).slice(1); // ignore S.N
        if (cells.length === 0) return false;
        return cells.some(td => !isPlaceholder(td.innerText));
    });
}

/** All report pages that are actually visible (works for 6, 8, 15+ pages). */
function getVisibleReportPages() {
    return Array.from(document.querySelectorAll('.page')).filter(function (p) {
        const s = window.getComputedStyle(p);
        if (s.display === 'none' || s.visibility === 'hidden') return false;
        if (p.getClientRects().length === 0) return false;
        return true;
    });
}

function updatePageNumbers() {
    const pages = getVisibleReportPages();

    pages.forEach(function (p, index) {
        const numEl = p.querySelector('.page-num');
        if (numEl) numEl.innerText = String(index + 1);
    });

    const bpSection = document.getElementById('bluPineSectionWrapper');
    if (bpSection && bpSection.style.display !== 'none') {
        const pPage = bpSection.closest('.page');
        const index = pages.indexOf(pPage);
        const tocBluPineObj = document.getElementById('tocBluPinePage');
        if (tocBluPineObj && index !== -1) tocBluPineObj.innerText = index + 1;
    }

    const sec5Wrapper = document.getElementById('section5Wrapper');
    if (sec5Wrapper) {
        const pPage = sec5Wrapper.closest('.page');
        const index = pages.indexOf(pPage);
        const tocItem = document.getElementById('tocIncidentPage');
        if (tocItem && index !== -1) tocItem.innerText = index + 1;
    }

    document.querySelectorAll('.end-doc-pin').forEach(function (pin) {
        pin.remove();
    });

    const lastPage = pages.length ? pages[pages.length - 1] : null;
    if (!lastPage) return;

    const pin = document.createElement('div');
    pin.className = 'end-doc-pin';
    pin.innerHTML = '← End of Document →';
    const footerRow = lastPage.querySelector('.footer-text-row');
    if (footerRow) {
        lastPage.insertBefore(pin, footerRow);
    } else {
        lastPage.appendChild(pin);
    }

    // Place the marker just above the footer row on the true last page (any page number).
    requestAnimationFrame(function () {
        const fr = lastPage.querySelector('.footer-text-row');
        if (!fr || !pin.parentNode) return;
        const pageRect = lastPage.getBoundingClientRect();
        const frRect = fr.getBoundingClientRect();
        if (pageRect.height < 1) return;
        const gap = 6;
        const bottomPx = pageRect.bottom - frRect.top + gap;
        if (isFinite(bottomPx) && bottomPx > 40) {
            pin.style.bottom = Math.max(48, bottomPx) + 'px';
        }
    });
}
function draw3DEPSChart(canvasEl, value, custName, ratio) {
    ratio = ratio || (window.devicePixelRatio || 1);
    const wrap = canvasEl.parentElement;
    let cssW = wrap ? (wrap.clientWidth || wrap.offsetWidth || 400) : 400;
    let cssH = wrap ? (wrap.clientHeight || wrap.offsetHeight || 280) : 280;
    if (cssW < 20) cssW = 400;
    if (cssH < 20) cssH = 280;

    canvasEl.width = Math.round(cssW * ratio);
    canvasEl.height = Math.round(cssH * ratio);
    canvasEl.style.width = cssW + 'px';
    canvasEl.style.height = cssH + 'px';

    const ctx = canvasEl.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    ctx.scale(ratio, ratio);

    const W = cssW, H = cssH;

    // Layout — leave room for 3D depth on right
    const padL = 55, padR = 8, padT = 32, padB = 8;
    const depth = Math.round(W * 0.14); // 3D depth pixels
    const chartW = W - padL - padR - depth;
    const chartH = H - padT - padB;

    // Depth vector (upper-right, Excel-style perspective)
    const dX = depth;
    const dY = Math.round(depth * 0.55);

    // Y scale: next multiple of 20 strictly above value (90 → 100, 100 → 120)
    const numVal = parseFloat(value) || 0;
    const maxY = Math.max(20, Math.ceil((numVal + 1) / 20) * 20);

    // Screen y for chart y-value
    const scY = (v) => padT + chartH - (v / maxY) * chartH;

    // ── Chart title (customer name) ──────────────────────────────────────
    ctx.font = 'bold 14px Calibri, Arial, sans-serif';
    ctx.fillStyle = '#222';
    ctx.textAlign = 'center';
    ctx.fillText(custName, padL + (chartW + dX) / 2, 21);

    // ── Back-wall fill (parallelogram) ───────────────────────────────────
    // Corners: front-top-left → back-top-right → back-bottom-right → front-bottom-left
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(padL,           padT);
    ctx.lineTo(padL + chartW + dX, padT - dY);
    ctx.lineTo(padL + chartW + dX, padT + chartH - dY);
    ctx.lineTo(padL,           padT + chartH);
    ctx.closePath();
    ctx.fill();

    // ── Horizontal grid lines ────────────────────────────────────────────
    ctx.strokeStyle = '#c8c8c8';
    ctx.lineWidth = 0.7;
    for (let v = 0; v <= maxY; v += 20) {
        const yFront = scY(v);
        ctx.beginPath();
        ctx.moveTo(padL, yFront);
        ctx.lineTo(padL + chartW, yFront);
        ctx.stroke();
    }

    // ── Back-wall border outline ─────────────────────────────────────────
    ctx.strokeStyle = '#b0b0b0';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(padL,           padT);
    ctx.lineTo(padL + chartW + dX, padT - dY);
    ctx.lineTo(padL + chartW + dX, padT + chartH - dY);
    ctx.lineTo(padL,           padT + chartH);
    ctx.closePath();
    ctx.stroke();

    // ── Y-axis labels ────────────────────────────────────────────────────
    ctx.font = '11px Calibri, Arial, sans-serif';
    ctx.fillStyle = '#444';
    ctx.textAlign = 'right';
    for (let v = 0; v <= maxY; v += 20) {
        ctx.fillText(v, padL - 5, scY(v) + 4);
    }

    // ── 3D Bar ───────────────────────────────────────────────────────────
    const barW  = Math.min(chartW * 0.32, 105);
    const barX  = padL + (chartW - barW) / 2;
    const barHpx = Math.max(2, Math.round((numVal / maxY) * chartH));
    const barY  = padT + chartH - barHpx;

    // Right face (darker blue)
    ctx.fillStyle = '#2F619E';
    ctx.beginPath();
    ctx.moveTo(barX + barW,       barY);
    ctx.lineTo(barX + barW + dX,  barY - dY);
    ctx.lineTo(barX + barW + dX,  barY - dY + barHpx);
    ctx.lineTo(barX + barW,       barY + barHpx);
    ctx.closePath();
    ctx.fill();

    // Front face (medium blue — draw after back-wall so it sits in front)
    ctx.fillStyle = '#5b9bd5';
    ctx.fillRect(barX, barY, barW, barHpx);

    // Top face (lighter blue)
    ctx.fillStyle = '#A8D0E8';
    ctx.beginPath();
    ctx.moveTo(barX,          barY);
    ctx.lineTo(barX + barW,   barY);
    ctx.lineTo(barX + barW + dX, barY - dY);
    ctx.lineTo(barX + dX,     barY - dY);
    ctx.closePath();
    ctx.fill();

    // Subtle outline on front face
    ctx.strokeStyle = '#4a85bb';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(barX, barY, barW, barHpx);

    // Left Y-axis line (draw on top of everything for visibility)
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + chartH);
    ctx.stroke();

    ctx.restore();
}

function refreshEPS() {
    const val = document.getElementById('epsIn').value;
    const custName = document.getElementById('inName').value || 'Customer';
    const epsDisplay = document.getElementById('epsValDisplay');
    const epsLabel = document.getElementById('epsCustomerLabel');
    if (epsDisplay) epsDisplay.innerText = val;
    if (epsLabel) epsLabel.innerText = custName;

    const canvasEl = document.getElementById('epsChart');
    if (!canvasEl) return;

    draw3DEPSChart(canvasEl, val, custName, window.devicePixelRatio || 1);

    // Store a Chart.js-compatible object so setChartsHighDPIForPrint works
    activeCharts.eps = {
        canvas: canvasEl,
        _val: val,
        _custName: custName,
        options: { devicePixelRatio: window.devicePixelRatio || 1 },
        resize: function () {
            draw3DEPSChart(this.canvas, this._val, this._custName, this.options.devicePixelRatio || window.devicePixelRatio || 1);
        },
        destroy: function () {}
    };
}

document.getElementById('deviceCsv').addEventListener('change', function (e) {
    if (!e.target.files.length) return;
    Papa.parse(e.target.files[0], {
        header: true, skipEmptyLines: true,
        complete: function (res) {
            if (!res.data || !res.data.length) return;
            const cols = Object.keys(res.data[0]);
            const hostKey = cols.find(k => k.toLowerCase().includes('host'));
            const rateKey = cols.find(k => k.toLowerCase().includes('rate'));
            renderDeviceChart(res.data.slice(0, 10).map(r => r[hostKey] || "Unknown"), res.data.slice(0, 10).map(r => parseFloat(r[rateKey] || 0)));
        }
    });
});

function renderDeviceChart(labels, data) {
    if (activeCharts.dev) activeCharts.dev.destroy();
    const datasets = labels.map((l, i) => ({
        label: l, data: labels.map((_, idx) => idx === i ? data[i] : null),
        backgroundColor: themeColors[i % themeColors.length]
    }));
    activeCharts.dev = new Chart(document.getElementById('deviceChart'), {
        type: 'bar', data: { labels, datasets },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } },
                datalabels: { anchor: 'end', align: 'top', font: { weight: 'bold' }, formatter: (v) => v || '' }
            },
            scales: { x: { display: false, stacked: true }, y: { beginAtZero: true } }
        }
    });
}

document.getElementById('incidentCsv').addEventListener('change', function (e) {
    if (!e.target.files.length) return;
    Papa.parse(e.target.files[0], {
        header: true, skipEmptyLines: true,
        complete: function (results) {
            if (!results.data || !results.data.length || !results.meta.fields) return;
            const headers = results.meta.fields;
            const sevCol = headers.find(h => h.toUpperCase().includes("SEVERITY"));
            const resCol = headers.find(h => h.toUpperCase().includes("RESOLUTION"));
            let stats = { HIGH: 0, MEDIUM: 0, LOW: 0 };
            let fpData = { HIGH: 0, MEDIUM: 0, LOW: 0 };
            let tpData = { HIGH: 0, MEDIUM: 0, LOW: 0 };

            results.data.forEach(row => {
                const s = (row[sevCol] || "").toUpperCase().trim();
                const r = (row[resCol] || "").trim().toLowerCase();
                if (stats.hasOwnProperty(s)) {
                    stats[s]++;
                    if (r.includes("false positive") || r.includes("fp")) fpData[s]++;
                    else if (r.includes("true positive") || r.includes("tp")) tpData[s]++;
                }
            });

            // ── SEVERITY CHART (Section 3) ──────────────────────────────────
            const sevMsg = document.getElementById('sevBlankMsg');
            const sevContainer = document.getElementById('sevChartContainer');
            if (stats.HIGH > 0 || stats.MEDIUM > 0 || stats.LOW > 0) {
                if (sevMsg) sevMsg.style.display = 'none';
                if (sevContainer) {
                    sevContainer.style.display = 'flex';
                    sevContainer.style.height = 'auto';
                    const wrap = sevContainer.querySelector('.canvas-wrap');
                    if (wrap) wrap.style.height = '200px';
                }
                renderIncidentChart('sevChart', stats, "Incident Severity");
            } else {
                if (sevContainer) sevContainer.style.display = 'none';
                if (sevMsg) { sevMsg.style.display = 'block'; sevMsg.innerText = 'No incidents observed.'; }
            }

            // ── TRUE POSITIVE CHART (Section 4) ────────────────────────────
            const tpTotal = tpData.HIGH + tpData.MEDIUM + tpData.LOW;
            const tpMsg = document.getElementById('tpBlankMsg');
            const tpContainer = document.getElementById('tpChartContainer');
            const tpWrap = document.getElementById('tpWrap');
            if (tpTotal > 0) {
                if (tpMsg) tpMsg.style.display = 'none';
                if (tpContainer) { tpContainer.style.display = 'flex'; tpContainer.style.height = 'auto'; }
                if (tpWrap) { tpWrap.style.display = 'block'; tpWrap.style.height = '160px'; }
                renderIncidentChart('tpChart', tpData, "True Positive");
            } else {
                if (tpContainer) tpContainer.style.display = 'none';
                if (tpMsg) { tpMsg.style.display = 'block'; tpMsg.innerText = 'No True Positive incidents observed.'; }
            }

            // ── FALSE POSITIVE TEXT (below Section 4 chart) ────────────────
            const fpTotal = fpData.HIGH + fpData.MEDIUM + fpData.LOW;
            updateFPText(fpTotal, fpData);

            // ── INCIDENT TABLE (Section 5, always on p6) ───────────────────
            document.querySelectorAll('.incident-tbody').forEach((tb, idx) => {
                if (idx > 0) { const pg = tb.closest('.page'); if (pg) pg.remove(); }
                else tb.innerHTML = '';
            });

            adjustLayoutForBluPine();

            const ticketCol = headers.find(h => h.toUpperCase().includes("TICKET")) || "Ticket No";
            const titleCol = headers.find(h => h.toUpperCase().includes("INCIDENT TITLE") || h.toUpperCase() === "TITLE" || h.toUpperCase() === "ALERT NAME") || "Incident Title";
            const obsCol = headers.find(h => h.toUpperCase().includes("OBSERVATION")) || "Observation & Recommendation";
            const statusCol = headers.find(h => h.toUpperCase() === "STATUS") || "Status";

            let currentTbody = document.querySelector('.incident-tbody');
            if (results.data.length > 0) {
                results.data.forEach((row, i) => {
                    const obsRaw = row[obsCol] || '';
                    const obsHtml = escapeHtmlCell(obsRaw)
                        .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
                        .replace(/\n/g, '<br>');
                    const tr = '<tr>'
                        + `<td contenteditable="true">${i + 1}</td>`
                        + `<td contenteditable="true">${escapeHtmlCell(row[ticketCol] || '#')}</td>`
                        + `<td contenteditable="true">${escapeHtmlCell(row[sevCol] || 'N/A')}</td>`
                        + `<td contenteditable="true">${escapeHtmlCell(row[titleCol] || 'N/A')}</td>`
                        + `<td contenteditable="true">${obsHtml}</td>`
                        + `<td contenteditable="true">${escapeHtmlCell(row[statusCol] || 'Open')}</td>`
                        + '</tr>';
                    currentTbody.insertAdjacentHTML('beforeend', tr);
                });
            } else {
                currentTbody.innerHTML = '<tr>'
                    + '<td contenteditable="true">1</td>'
                    + '<td contenteditable="true">#</td>'
                    + '<td contenteditable="true">High</td>'
                    + '<td contenteditable="true">New Incident</td>'
                    + '<td contenteditable="true"></td>'
                    + '<td contenteditable="true">Open</td>'
                    + '</tr>';
            }

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    managePagination();
                    updatePageNumbers();
                });
            });
        }
    });
});
function renderIncidentChart(id, counts, label) {
    const ctx = document.getElementById(id).getContext('2d');
    if (activeCharts[id]) activeCharts[id].destroy();

    const maxCount = Math.max(counts.HIGH, counts.MEDIUM, counts.LOW);
    const showTitle = id !== 'sevChart';

    activeCharts[id] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [''],
            datasets: [
                { label: 'High', data: [counts.HIGH], backgroundColor: '#FF0000', maxBarThickness: 120 },
                { label: 'Medium', data: [counts.MEDIUM], backgroundColor: '#FFFF00', maxBarThickness: 120 },
                { label: 'Low', data: [counts.LOW], backgroundColor: '#00B050', maxBarThickness: 120 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            layout: { padding: 15 },
            plugins: {
                title: { display: showTitle, text: label, font: { size: 16, weight: 'bold' }, color: '#444', padding: { bottom: 10 } },
                legend: { display: true, position: 'bottom', labels: { boxWidth: 12, padding: 15 } },
                datalabels: { anchor: 'end', align: 'top', formatter: (v) => v, font: { size: 12, weight: 'bold' }, color: '#555' }
            },
            scales: {
                y: { beginAtZero: true, suggestedMax: maxCount > 0 ? maxCount + 1 : 1, ticks: { stepSize: 1, precision: 0 }, grid: { drawBorder: false } },
                x: { grid: { display: false } }
            }
        }
    });
}

function updateFPText(fpTotal, fpData) {
    const heading = document.getElementById('fpTextHeading');
    const body = document.getElementById('fpTextBody');
    if (!body) return;
    const dr = window._fpDateRange || {};
    const from = dr.coverDate || '';
    const to = dr.todayDate || '';
    const rangeStr = from && to ? ` from ${from} 9:00 PM to ${to} 9:00 PM` : '';
    if (!fpTotal || fpTotal === 0) {
        body.innerText = `No False positive incidents have been observed${rangeStr}.`;
    } else {
        const parts = [];
        if (fpData && fpData.HIGH > 0) parts.push(`${fpData.HIGH} High`);
        if (fpData && fpData.MEDIUM > 0) parts.push(`${fpData.MEDIUM} Medium`);
        if (fpData && fpData.LOW > 0) parts.push(`${fpData.LOW} Low`);
        body.innerText = `${parts.join(', ')} false positive incident${fpTotal > 1 ? 's' : ''} observed${rangeStr}.`;
    }
    if (heading) heading.style.display = 'block';
    body.style.display = 'block';
}

window.onload = () => {
    // Handle n-1 logic for the date
    let date = new Date();
    date.setDate(date.getDate() - 1);
    let day = ("0" + date.getDate()).slice(-2);
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let year = date.getFullYear();
    let formattedDate = day + "-" + month + "-" + year; // Format changed to DD-MM-YYYY

    // For Cover date
    document.querySelectorAll('.auto-date').forEach(el => el.innerText = formattedDate);

    // For Document Prepared On date with logic: DD/MM/YYYY (9PM n-1st Mon to 9PM nth Mon)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let today = new Date();
    let todayDay = today.getDate();
    let todayMonth = today.getMonth() + 1;
    let todayYear = today.getFullYear();
    let formattedToday = ("0" + todayDay).slice(-2) + "-" + ("0" + todayMonth).slice(-2) + "-" + todayYear;

    let n1Day = date.getDate();
    let formattedTodaySlash = ("0" + todayDay).slice(-2) + "/" + ("0" + todayMonth).slice(-2) + "/" + todayYear;
    let docPrepText = `${formattedTodaySlash} (09 PM ${n1Day} ${monthNames[date.getMonth()]} to 09 PM ${todayDay} ${monthNames[today.getMonth()]})`;
    document.querySelectorAll('.auto-date-doc-prep').forEach(el => el.innerText = docPrepText);

    // Expose date range for FP text generation
    window._fpDateRange = { coverDate: formattedDate, todayDate: formattedToday };

    // Blank-state messages
    const coverDateText = document.getElementById('coverDate').innerText;
    const blankMessage = `No potential incidents have been observed from ${coverDateText} 9:00 PM to ${formattedToday} 9:00 PM.`;

    const sevMsg = document.getElementById('sevBlankMsg');
    if (sevMsg) sevMsg.innerText = blankMessage;

    const tpMsg = document.getElementById('tpBlankMsg');
    if (tpMsg) tpMsg.innerText = 'No True Positive incidents observed.';

    const bpMsg = document.getElementById('bpBlankMsg');
    if (bpMsg) bpMsg.innerText = `No potential incidents with count have been observed from ${coverDateText} 9:00 PM to ${formattedToday} 9:00 PM.`;

    // Set default FP text
    updateFPText(0, null);

    document.querySelectorAll('#sevHalfContainer, #tpHalfContainer').forEach(c => {
        if (c) c.style.height = 'auto';
    });

    sync();
    updatePageNumbers();

    document.addEventListener('input', function (e) {
        if (e.target.closest('.incident-tbody')) {
            managePagination();
        }
    });
};
