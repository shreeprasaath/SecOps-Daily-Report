# SOC Daily Report Generator

> A professional, browser-based Security Operations Center (SOC) Daily Report tool built by **Secure Network Solutions India Pvt Ltd (SNS)**. Upload your data, fill in the details, and export a polished PDF report — no server, no installation, no coding needed.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Dashboard Controls](#2-dashboard-controls)
3. [Report Pages Explained](#3-report-pages-explained)
4. [Interactive Features](#4-interactive-features)
5. [Charts Explained](#5-charts-explained)
6. [Technical Architecture](#6-technical-architecture)
7. [Troubleshooting & FAQ](#7-troubleshooting--faq)

---

## 1. Overview

### What is this tool?

The SOC Daily Report Generator is a **single-page web application** that runs entirely inside your browser. It lets SOC analysts at SNS:

- Fill in a customer's name, EPS value, and upload their incident data
- Automatically generate professional charts and incident tables
- Export the complete report as a PDF via the browser's print dialog

There is **no backend server**, **no database**, and **no login required**. Everything happens locally on your machine.

### Who is it for?

| Role | How they use it |
|------|----------------|
| SOC Analyst | Fills in daily incident data and exports the PDF |
| Team Lead | Reviews and approves the report before sending |
| Developer / Fresher | Maintains and extends the tool's features |

### Key Features

- **6-page A4 report** — Cover, Document Control, Table of Contents, 2 chart pages, Incident table
- **CSV data import** — Upload device EPS data and incident analytics; charts and tables populate automatically
- **4 charts** — Daily Average EPS (3D), Reporting Device EPS, Incident Severity Count, True/False Positive
- **Editable everywhere** — Click any text on the report to edit it directly in the browser
- **Auto pagination** — Incident table automatically overflows to extra pages when it gets too long
- **BluPine mode** — Special layout and extra chart for BluPine customers (auto-detected from customer name)
- **High-quality PDF export** — Charts render at 4× resolution so they stay sharp when printed

### Prerequisites

You only need:
- A **modern browser** — Google Chrome or Microsoft Edge recommended (best print support)
- **No Node.js**, no Python, no build tools required

To run with a local server (optional, but avoids some browser file-access restrictions):
```bash
# If you have Node.js installed:
npx serve .
# Then open http://localhost:3000 in your browser
```

### How to Run Locally

**Option A — Simplest (double-click):**
1. Download or clone this repository
2. Open `index.html` directly in Chrome or Edge

**Option B — Local server (recommended):**
```bash
git clone https://github.com/shreeprasaath/secops-daily-report.git
cd secops-daily-report
npx serve .
```
Then open the URL shown in your terminal (e.g. `http://localhost:3000`).

No build step. No `npm install`. Just open and use.

---

### Repository File Map

| File | Type | Purpose |
|------|------|---------|
| `index.html` | HTML | The entire report structure — all 6 pages, the dashboard control panel, chart canvas elements, and the incident table |
| `style.css` | CSS | All visual styling — A4 page dimensions, colors, fonts, table layouts, print-specific rules |
| `script.js` | JavaScript | All logic — chart rendering, CSV parsing, pagination, column resizing, print handling |
| `EPStest.csv` | CSV | Sample data for the **Reporting Device** chart (device names + event rates) |
| `Incidenttest.csv` | CSV | Sample data for **all incident charts** and the **Potential Incidents table** |
| `RMZ_template.pdf` | PDF | The original report template this tool is based on (for visual reference) |

### External Libraries

These are loaded automatically from CDN — no download needed:

| Library | Version | What it does |
|---------|---------|-------------|
| [Chart.js](https://www.chartjs.org/) | Latest | Renders bar charts for devices, severity, and TP/FP data |
| [chartjs-plugin-datalabels](https://chartjs-plugin-datalabels.netlify.app/) | 2.0.0 | Adds value labels on top of chart bars |
| [PapaParse](https://www.papaparse.com/) | 5.3.2 | Parses uploaded CSV files into JavaScript objects |

> The EPS chart (Section 1) is **not** built with Chart.js — it is hand-drawn using the browser's built-in HTML5 Canvas API for the custom 3D bar effect.

---

*Continue to [Section 2 — Dashboard Controls](#2-dashboard-controls)*
