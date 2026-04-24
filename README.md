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

---

## 2. Dashboard Controls

When you open `index.html` in the browser, the **white panel at the very top** is the Dashboard. This panel is only visible on screen — it is **automatically hidden when you print or export to PDF**.

```
┌─────────────────────────────────────────────────────────────────────┐
│  SOC Master Dashboard (Editable Version)                            │
│                                                                     │
│  Customer Name        Daily AVG EPS       Reporting Device (CSV)   │
│  [ RMZ Corp.       ]  [ 82             ]  [ Choose File ]          │
│                                                                     │
│  Analytics (TP.csv)   SNS Logo            Client Logo              │
│  [ Choose File     ]  [ Choose File    ]  [ Choose File ]          │
│                                                                     │
│  [        PRINT FINAL REPORT                                     ]  │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Field-by-Field Reference

#### Customer Name
- **What it does:** Sets the customer name across the entire report simultaneously.
- **Where it appears after you type:**
  - Cover page title (e.g. `RMZ Corp. - SOC Daily Report`)
  - Document Control table — Title row
  - EPS chart legend label
  - TOC section numbering (changes if BluPine detected)
- **Special behaviour:** If the name contains the word `blupine` (any case, e.g. `BluPine Corp`), the tool switches into **BluPine mode** — see [Section 4](#4-interactive-features) for details.
- **Default value:** `RMZ Corp.`

---

#### Daily AVG EPS
- **What it does:** Sets the value displayed on the **Daily Average EPS** 3D bar chart (Page 4, Section 1).
- **EPS** stands for *Events Per Second* — it measures how many log events the customer's SIEM receives per second on average.
- The chart Y-axis auto-scales to the next round number above your value (e.g. enter `82` → axis goes to `100`; enter `105` → axis goes to `120`).
- The value also appears in the small legend table below the chart.
- **Default value:** `82`

---

#### Reporting Device (CSV)
- **What it does:** Populates the **Reporting Device — Average EPS** bar chart (Page 4, Section 2).
- **Upload:** Click *Choose File* and select a `.csv` file.
- **Required columns** (header names are matched case-insensitively):

  | Column | Must contain | Example |
  |--------|-------------|---------|
  | Device/Host name | the word `host` | `Host Name` |
  | Event rate | the word `rate` | `AVG(Event Rate)` |

- **Sample file in this repo:** `EPStest.csv`

  ```
  Host Name,AVG(Event Rate)
  Firewall-01,65.94
  Proxy-Server,1.47
  DC-Primary,1.18
  ...
  ```

- Only the **top 10 rows** are used (the 10 highest-reporting devices).
- Each device becomes a separate coloured bar in the chart.

---

#### Analytics (TP.csv)
- **What it does:** This is the most important upload. It populates **three charts** and the **entire Potential Incidents table** on Page 6.
- **Upload:** Click *Choose File* and select your incidents CSV file (named `TP.csv` by convention, but any `.csv` works).
- **Required/detected columns** (matched by partial name, case-insensitive):

  | Column purpose | Header must contain | Example header |
  |---------------|--------------------|-|
  | Ticket number | `ticket` | `Ticket NO` |
  | Incident name | `incident title`, `title`, or `alert name` | `Incident Title` |
  | Severity level | `severity` | `Severity` |
  | Resolution type | `resolution` | `Resolution` |
  | Current status | exactly `status` | `Status` |

- **Sample file in this repo:** `Incidenttest.csv`

  ```
  Ticket NO,Incident Title,Severity,Observation & Recommendation,Resolution,Status,True/False Positive
  #75509,Office365: Brute Force,Medium,...,True Positive,Open,True Positive
  #75533,Safetica Sensitive Data,Medium,...,True Positive,Open,True Positive
  ```

- **What gets generated from this file:**

  | Chart / Section | What the tool reads |
  |----------------|---------------------|
  | Incident Severity Count (Pg 5) | `Severity` column — counts `HIGH`, `MEDIUM`, `LOW` |
  | True Positive chart (Pg 5) | `Resolution` column — looks for `true positive` or `tp` |
  | False Positive text (Pg 5) | `Resolution` column — looks for `false positive` or `fp` |
  | Potential Incidents table (Pg 6) | All columns — `Ticket NO`, `Severity`, `Incident Title`, `Status` |

> **Important:** Severity values must be exactly `High`, `Medium`, or `Low` (case-insensitive). Any other value is ignored in the count chart.

---

#### SNS Logo
- **What it does:** Sets the SNS company logo that appears in the **top-right corner of every inner page** (Pages 2–6+).
- **Upload:** Click *Choose File* and select a PNG or JPG image.
- The logo is also placed on the **cover page** at a larger size.
- **If no logo is uploaded:** The logo area remains blank (no broken image icon).
- **Recommended format:** PNG with transparent background, landscape orientation.

---

#### Client Logo
- **What it does:** Sets the customer's logo displayed in the **centre of the cover page**.
- **Upload:** Click *Choose File* and select a PNG or JPG image.
- Maximum display size: 50mm tall × 100mm wide (scales down automatically if larger).
- **If no logo is uploaded:** The logo area remains blank.

---

#### PRINT FINAL REPORT Button
- **What it does:** Opens the browser's native **Print dialog**.
- From there you can:
  - Select **Save as PDF** (recommended) to export the report as a PDF file
  - Print directly to a physical printer
- **Important print settings to check in the dialog:**
  - ✅ Enable **Background graphics** (so the coloured footer strips and chart colours appear)
  - Set paper size to **A4**
  - Set margins to **None** (margins are built into the page design)
- After you close the print dialog (whether you printed or cancelled), the **page automatically reloads** to reset to a clean state for the next report.

---

*Continue to [Section 3 — Report Pages Explained](#3-report-pages-explained)*

---

## 3. Report Pages Explained

The report is made up of **6 fixed pages** (Pages 1–6) plus any number of **auto-generated overflow pages** when the incident table is too long. Every page is sized exactly to **A4 (210mm × 297mm)** so it prints perfectly without any scaling.

Below is a page-by-page breakdown of what each page contains, what is editable, and what is auto-generated.

---

### Page 1 — Cover Page

```
┌──────────────────────────────────────┐
│                        [ SNS Logo ]  │
│                                      │
│                                      │
│      RMZ Corp. - SOC Daily Report    │  ← Editable (click to type)
│      For the Date: 23-04-2026        │  ← Auto-generated (yesterday's date)
│                                      │
│           [ Customer Logo ]          │  ← Uploaded via dashboard
│                                      │
│                                      │
│  Copyright and Confidential Notice:  │  ← Editable block
│  ©2026 Secure Network Solutions...   │
│                                      │
├──────────────────────────────────────┤
│ ██████████████████ ████████████████ │  ← Blue | Red footer strip
└──────────────────────────────────────┘
```

| Element | How it gets its value |
|---------|----------------------|
| SNS Logo | Uploaded via dashboard |
| Report title | Auto-set from Customer Name field; click to edit further |
| Date line | Auto-set to **yesterday's date** (n−1 logic) in `DD-MM-YYYY` format; click to edit |
| Customer Logo | Uploaded via dashboard |
| Copyright block | Click anywhere in the block to edit the text |
| Footer strip | Decorative only — blue (45%) + red (55%) bars |

> **Why yesterday's date?** SOC daily reports typically cover the previous 24-hour window (e.g. a report prepared on 24-Apr covers 23-Apr 9 PM to 24-Apr 9 PM). The tool sets the date automatically so analysts do not have to remember.

---

### Page 2 — Document Control

```
┌──────────────────────────────────────┐
│                        [ SNS Logo ]  │
│  Document Control                    │
│  ────────────────────────────────── │
│  Field                  Details      │
│  ────────────────────────────────── │
│  Title                  RMZ Corp...  │
│  Document Version       1.0          │
│  Document Prepared By   Amirdeshwara │
│  Document Prepared On   24/04/2026   │  ← Auto-generated
│  Document Reviewed By   Kishore Kumar│
│  Document Approved By   Diptesh Saha │
│  ────────────────────────────────── │
│                                      │
│  Confidential                      2 │
└──────────────────────────────────────┘
```

| Element | How it gets its value |
|---------|----------------------|
| Title | Auto-set from Customer Name field |
| Document Version | Fixed as `1.0` — edit directly in the table |
| Document Prepared By | Fixed as `Amirdeshwara R` — edit directly in the table |
| Document Prepared On | **Auto-generated** — today's date + time range (e.g. `24/04/2026 (09 PM 23 Apr to 09 PM 24 Apr)`) |
| Document Reviewed By | Fixed as `Kishore Kumar K` — edit directly in the table |
| Document Approved By | Fixed as `Diptesh Saha` — edit directly in the table |
| Page number | Auto-assigned |

> The entire table has `contenteditable="true"` — click any cell value to change it.

---

### Page 3 — Table of Contents

```
┌──────────────────────────────────────┐
│                        [ SNS Logo ]  │
│  Table of Contents                   │
│                                      │
│  1. Daily Average EPS .......... 4   │
│  2. Reporting Device - Avg EPS .. 4  │
│  3. Incident Severity Count ..... 5  │
│  4. False Positive & True Positive 5 │
│  5. Potential Incidents ......... 6  │  ← Becomes "6." for BluPine
│                                      │
│  Confidential                      3 │
└──────────────────────────────────────┘
```

| Element | How it gets its value |
|---------|----------------------|
| Section entries | Fixed text — edit by clicking any line |
| Page numbers (right side) | **Auto-updated** every time the layout changes |
| Section 5 vs Section 6 | Automatically changes to 6 when BluPine mode is active |
| BluPine extra item | Hidden by default; appears automatically for BluPine customers |

> The dotted leader lines (`. . . . .`) between the section name and page number are drawn with CSS — they expand and contract automatically to fill the space.

---

### Page 4 — Charts: Daily EPS & Device EPS

```
┌──────────────────────────────────────┐
│                        [ SNS Logo ]  │
│  1. Daily Average EPS                │
│  ┌────────────────────────────────┐  │
│  │     [  3D Bar Chart  ]         │  │
│  │  ┌──────────────┐              │  │
│  │  │ AVG EPS      │              │  │
│  │  │ RMZ Corp. 82 │              │  │
│  │  └──────────────┘              │  │
│  └────────────────────────────────┘  │
│  2. Reporting Device - Average EPS   │
│  ┌────────────────────────────────┐  │
│  │   [  Bar Chart — Devices  ]    │  │
│  └────────────────────────────────┘  │
│  Confidential                      4 │
└──────────────────────────────────────┘
```

Each chart takes up roughly half the page height (46% each with a small gap).

| Section | Data source | Chart type |
|---------|------------|-----------|
| 1. Daily Average EPS | EPS input field + Customer Name field | Custom 3D bar (Canvas API) |
| 2. Reporting Device — Average EPS | Device CSV upload | Chart.js grouped bar |

See [Section 5 — Charts Explained](#5-charts-explained) for deep detail on how each chart works.

---

### Page 5 — Charts: Severity & True/False Positive

```
┌──────────────────────────────────────┐
│                        [ SNS Logo ]  │
│  3. Incident Severity Count          │
│  ┌────────────────────────────────┐  │
│  │  [ Bar Chart: High/Med/Low ]   │  │
│  └────────────────────────────────┘  │
│  4. False Positive & True Positive   │
│  ┌────────────────────────────────┐  │
│  │  [ Bar Chart: TP by Severity ] │  │
│  └────────────────────────────────┘  │
│  False Positive:                     │
│  No False positive incidents...      │  ← Auto-generated text
│                                      │
│  Confidential                      5 │
└──────────────────────────────────────┘
```

| Section | Data source | Shown when |
|---------|------------|-----------|
| 3. Incident Severity Count | Analytics CSV — `Severity` column | Any HIGH/MEDIUM/LOW found |
| 4. True Positive chart | Analytics CSV — `Resolution` column (looks for "true positive"/"tp") | Any TP found |
| False Positive text | Analytics CSV — `Resolution` column (looks for "false positive"/"fp") | Always shown |

**Blank-state messages:** If no CSV is uploaded yet, each section shows a message like:
> *"No potential incidents have been observed from 23-04-2026 9:00 PM to 24-04-2026 9:00 PM."*

---

### Page 6 — Potential Incidents

```
┌──────────────────────────────────────┐
│                        [ SNS Logo ]  │
│  5. Potential Incidents              │
│  [+ Add Row]  [- Delete Row]         │  ← Hidden in print
│  Drag between column headers...      │  ← Hidden in print
│  ┌────┬──────────┬────────┬──────────────────────────────┬────────┐ │
│  │S.No│ Ticket No│Severity│       Incident Title          │ Status │ │
│  ├────┼──────────┼────────┼──────────────────────────────┼────────┤ │
│  │ 1  │ #75509   │ Medium │ Office365: Brute Force...     │  Open  │ │
│  │ 2  │ #75533   │ Medium │ Safetica Sensitive Data...    │  Open  │ │
│  └────┴──────────┴────────┴──────────────────────────────┴────────┘ │
│                                      │
│  NOTE: We have shared the remediation│  ← Auto-generated based on Status
│  details with the customer...        │
│                                      │
│  Confidential                      6 │
└──────────────────────────────────────┘
```

**Columns and their widths:**

| Column | Default Width | Notes |
|--------|--------------|-------|
| S.No | 6% | Auto-renumbers when rows are added/deleted |
| Ticket No | 16% | Editable; draggable to resize |
| Severity | 14% | Editable; draggable to resize |
| Incident Title | 46% | Long text wraps to next line within the cell |
| Status | 18% | Drives the auto-generated NOTE text |

**Auto-generated NOTE paragraph:**
- If any row has Status containing `open` → *"NOTE: We have shared the remediation details with the customer, and the action is currently pending on their side."*
- If any row has Status containing `close` → *"NOTE: We have shared the remediation details with the customer, and the action is taken/Confirmed by the customer as a legitimate."*
- If no rows or no recognisable status → NOTE is hidden automatically.

---

### Overflow Pages — Potential Incidents (Continued)

When the incident table has more rows than fit on Page 6, the tool **automatically creates extra pages**:

```
┌──────────────────────────────────────┐
│                        [ SNS Logo ]  │
│  5. Potential Incidents (Continued)  │
│  ┌────┬──────────┬────────┬──────────────────────────────┬────────┐ │
│  │S.No│ Ticket No│Severity│       Incident Title          │ Status │ │
│  ├────┼──────────┼────────┼──────────────────────────────┼────────┤ │
│  │ 8  │ #75541   │  High  │ Suspicious Login Detected...  │ Closed │ │
│  └────┴──────────┴────────┴──────────────────────────────┴────────┘ │
│                                      │
│  NOTE: ...                           │  ← Moves here if needed
│  Confidential                      7 │
└──────────────────────────────────────┘
```

- The heading reads **"5. Potential Incidents (Continued)"** — or **"6."** for BluPine.
- The table header row (S.No, Ticket No, etc.) is repeated on every continuation page.
- Serial numbers continue from the previous page (e.g. if Page 6 ends at row 7, the next page starts at row 8).
- If rows are deleted and a continuation page becomes empty, it is **automatically removed**.
- The NOTE paragraph moves to a dedicated overflow page if it would overlap the footer.

---

*Continue to [Section 4 — Interactive Features](#4-interactive-features)*
