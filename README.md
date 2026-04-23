# SOC Daily Report

A static, print-ready **SOC Daily Report** web app. It runs entirely in the browser (no backend): edit fields, upload CSV analytics, generate charts, and export to PDF via the system print dialog.

**Repository:** [github.com/Maveera/SOC-Daily-Report](https://github.com/Maveera/SOC-Daily-Report)

## What’s in the repo

| File | Role |
|------|------|
| `index.html` | Page structure, cover, document control, TOC, charts, Potential Incidents tables |
| `style.css` | Layout, A4-style pages, `@media print`, incident table styling |
| `script.js` | Charts (Chart.js), CSV parsing (PapaParse), pagination, BluPine logic, print |

External libraries are loaded from CDNs (Chart.js, chartjs-plugin-datalabels, PapaParse).

## Features

### Report content

- **Cover page** — Customer name, date, optional SNS and client logos.
- **Document control** — Editable metadata table.
- **Table of contents** — Section links; page numbers update when the layout changes.
- **Charts** — Daily Average EPS, reporting device EPS, incident severity, True/False Positive (when data exists).
- **Potential Incidents** — Multi-column table with borders; **Observation & Recommendation** is **left-aligned** for long text; other columns are centered. Drag the lines between **column headers** to resize widths (applies across incident pages).

### Data import

- **Reporting Device (CSV)** — Host/rate columns parsed for the device chart.
- **Analytics (TP.csv)** — Populates severity / TP / FP charts and fills the Potential Incidents table when columns match (e.g. Ticket, Severity, Incident Title, Observation, Status, True/False).

### BluPine customers

If the customer name **includes** `blupine` (case-insensitive):

- **Potential Incidents with Count** chart and section appear.
- Section numbering and TOC adjust (e.g. main incidents list may show as section 6).
- Layout avoids pushing an empty incidents block to a new page when the table has no real data.

### Notes

- A **NOTE** paragraph under the last incidents table reflects open vs closed incidents (wording updates from row statuses).

### Pagination

- Row height and page breaks are recalculated as you type or when content wraps; overflow rows move to **(Continued)** pages with repeated headers.
- An **End of Document** marker is placed on the last page above the footer.

### Print / PDF

- **PRINT FINAL REPORT** raises the browser print dialog (print or Save as PDF).
- Charts render at higher resolution for print (`devicePixelRatio` boost) so bars and labels stay sharp.
- After printing, the page reloads so the next export starts from a clean state.
- Print CSS hides dashboard-only controls (e.g. config panel, resize handles).

## Run locally

1. Clone or download this repository.
2. Open `index.html` in a modern browser **or** serve the folder, for example:
   ```bash
   npx serve .
   ```
   then open the URL shown (e.g. `http://localhost:3000`).

No build step is required.

## Git: push updates

If you already cloned the repo and have push access:

```bash
git add .
git status
git commit -m "Describe your change"
git push origin main
```

For a **new** clone:

```bash
git clone https://github.com/Maveera/SOC-Daily-Report.git
cd SOC-Daily-Report
```

(Cache-busting query strings on `style.css` / `script.js` in `index.html` can be bumped when you change those assets so browsers load fresh files.)

## Technology

- **HTML5** — Structure, `contenteditable` where needed.
- **CSS3** — Flex layout, print styles, fixed page dimensions for export.
- **JavaScript** — DOM updates, pagination, file readers, Chart.js integration.

---

*Secure Network Solutions India Pvt Ltd — SOC Daily Report tooling.*
