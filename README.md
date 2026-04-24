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

---

## 4. Interactive Features

The report is fully interactive in the browser before you print. This section covers every interactive behaviour — what triggers it, what it does, and what to expect.

---

### 4.1 Editable Text (Click to Edit)

Almost every piece of text in the report can be edited directly in the browser — no separate input fields needed. These elements have `contenteditable="true"` set on them in the HTML.

**Editable areas include:**
- Cover page title (customer name + report title)
- Cover page date
- Cover page copyright block
- Every cell in the Document Control table (Page 2)
- Every cell in the Potential Incidents table (Page 6)
- The auto-generated NOTE paragraph below the incidents table

**How to edit:**
1. Click on the text you want to change
2. A cursor appears — type normally
3. Click outside when done

> **Tip:** Changes you make by clicking and typing are **not saved to a file**. If you refresh the browser, they will be lost. Always export your PDF before closing or refreshing.

---

### 4.2 Adding and Deleting Incident Rows

Two buttons appear above the incident table on Page 6 (hidden in print):

| Button | What it does |
|--------|-------------|
| `+ Add Row` | Appends a new blank row at the bottom of the last incident table. S.No auto-increments. Default values: `#` for Ticket, `High` for Severity, `New Incident` for Title, `Open` for Status |
| `- Delete Row` | Removes the last row. If only one row remains, it clears the cell contents instead of deleting the row (the table always keeps at least one row) |

**Serial number (S.No) behaviour:**
- Numbers are assigned automatically across all pages (including continuation pages)
- Adding, deleting, or moving rows due to pagination always re-runs the numbering from 1
- You do not need to manually update S.No

---

### 4.3 Column Resizing (Drag to Resize)

You can drag the boundary between any two column headers in the incident table to change their widths.

**How to use:**
1. Hover over the right edge of a column header — the cursor changes to a resize arrow (`↔`)
2. Click and drag left or right
3. Release — the new widths are applied instantly

**Rules:**
- No column can be made smaller than **40px** (a minimum is enforced)
- Resizing one column takes space from the adjacent column to the right
- The last column (Status) cannot be dragged from its right edge
- All continuation pages (if any) update to the same widths simultaneously

**Default column widths** (as percentage of table width):

| Column | Default |
|--------|---------|
| S.No | 6% |
| Ticket No | 16% |
| Severity | 14% |
| Incident Title | 46% |
| Status | 18% |

If the window is resized or the page layout changes, column widths are automatically re-scaled proportionally so the table never overflows its container.

---

### 4.4 Keyboard Shortcuts Inside the Incident Table

When your cursor is inside a cell of the incident table, these keys have special behaviour:

| Key | What it does |
|-----|-------------|
| `Enter` | Inserts a **line break within the same cell** (does not move to the next row). This lets you write multi-line content in a single cell. |
| `Tab` | Moves focus to the **next cell** to the right. At the last cell of a row, wraps to the first cell of the next row. |
| `Shift + Tab` | Moves focus to the **previous cell** to the left. |

> **Why does Enter not go to the next row?** In a report table, cells often need multi-line content (e.g. a long incident title). Using Enter for line breaks is more useful here than moving between rows.

---

### 4.5 Auto Pagination

As you add rows, type long content, or upload a CSV with many incidents, the tool automatically manages how the table flows across pages.

**How it works step by step:**
1. Every time content changes inside the incident table, a **300ms debounce timer** starts
2. After 300ms of no changes, the pagination engine (`managePagination()`) runs
3. It measures whether the last row in the table overflows past the footer boundary
4. If a row overflows → it is **moved to the next page** (creating a new page if one does not exist yet)
5. If rows move back up and a page becomes empty → the empty page is **automatically deleted**
6. Serial numbers are re-assigned across all pages
7. Page numbers in the footer and TOC are updated

**What triggers pagination:**
- Typing inside any incident table cell
- Adding or deleting a row (`+ Add Row` / `- Delete Row`)
- Uploading a new Analytics CSV
- Text wrapping — when a long word causes a row to grow taller, the ResizeObserver detects the height change and re-runs pagination automatically

**Continuation page structure:**
- Each new page gets the same table header (S.No, Ticket No, Severity, Incident Title, Status)
- The heading reads **"5. Potential Incidents (Continued)"**
- The NOTE paragraph moves to the bottom of the **last** page that has table rows

---

### 4.6 BluPine Mode

BluPine is a special customer layout. It activates automatically when the **Customer Name** field contains the word `blupine` (case-insensitive — `BluPine`, `BLUPINE`, `blupine corp` all work).

**What changes in BluPine mode:**

| Element | Normal mode | BluPine mode |
|---------|------------|-------------|
| Section numbering | Incidents = Section 5 | Incidents = Section 6 |
| TOC | 5 items | 6 items (extra BluPine chart item) |
| Page 6 | Incidents table only | BluPine chart + Incidents table |
| BluPine chart | Hidden | Visible — "Potential Incidents with Count" |

**The BluPine chart** ("Potential Incidents with Count"):
- Reads the **Incident Title** column from the incidents table
- Groups rows by title and counts how many times each appears
- Displays one bar per unique incident title, coloured differently
- Updates live as you add/edit/delete rows
- If all incident titles are blank or placeholder values, the chart is hidden and a blank-state message is shown instead

**To turn off BluPine mode:** Simply change the customer name to something that does not contain `blupine`.

---

### 4.7 Auto-Generated Status NOTE

Below the last incidents table, the tool automatically writes a NOTE paragraph based on the values in the **Status** column.

**Logic:**

| Condition | NOTE text shown |
|-----------|----------------|
| Any row has Status containing `open` | *"NOTE: We have shared the remediation details with the customer, and the action is currently pending on their side."* |
| Any row has Status containing `close` | *"NOTE: We have shared the remediation details with the customer, and the action is taken/Confirmed by the customer as a legitimate."* |
| Both open and closed rows exist | The `open` version takes priority |
| No rows, or no recognisable status | NOTE is hidden entirely |

**Behaviour:**
- The NOTE is `contenteditable` — you can click it to change the wording if needed
- If the NOTE overlaps the page footer, it is automatically moved to a dedicated overflow page
- The NOTE always appears at the bottom of the **last page** that has incident rows

---

*Continue to [Section 5 — Charts Explained](#5-charts-explained)*

---

## 5. Charts Explained

The report has up to **5 charts** depending on the data uploaded. This section explains how each chart works, where its data comes from, and how it renders.

---

### How Charts Render (The Snapshot System)

Understanding this first will make everything else clear.

Every chart goes through a two-step process:

```
Step 1 — Draw                         Step 2 — Freeze
─────────────────────                 ─────────────────────────────────
Chart.js / Canvas API                 canvas.toDataURL('image/png')
draws to a <canvas>        ────────►  captures the canvas as a PNG
element in memory                     and places it in an <img> tag.
                                      The canvas is then hidden.
```

**Why freeze as an image?**
- A live `<canvas>` is expensive for the browser to scroll past — it has active JavaScript watchers
- A static `<img>` is just a texture — the browser's GPU compositor handles it with zero JS cost
- Result: **smooth scrolling** past all charts with no jank

**Print quality:**
- Charts are drawn at **4× the screen size** (`SNAPSHOT_RATIO = 4` in `script.js`)
- A chart container that is 400×200px on screen is drawn internally at 1600×800px
- When printed on A4 at 300 DPI, this resolves to approximately **300 DPI quality** — sharp bars and readable labels
- No extra rendering step happens at print time — the high-res image is already there

**When charts re-render:**
- EPS chart: every time Customer Name or EPS value changes
- Device chart: every time a new Device CSV is uploaded
- Severity / TP charts: every time a new Analytics CSV is uploaded
- BluPine chart: every time the incident table changes (rows added, deleted, edited)

---

### Chart 1 — Daily Average EPS (Page 4, Section 1)

```
        RMZ Corp.
  100 ┤
   80 ┤         ╔═══╗╗
   60 ┤         ║   ║║
   40 ┤         ║   ║║
   20 ┤         ║   ║║
    0 └─────────╚═══╝╚──
         ┌──────────────┐
         │ AVG EPS      │
         │ RMZ Corp. 82 │
         └──────────────┘
```

| Property | Detail |
|----------|--------|
| **Type** | Custom 3D bar chart — hand-drawn using HTML5 Canvas 2D API (NOT Chart.js) |
| **Data source** | `Daily AVG EPS` input field in the dashboard |
| **Customer label** | `Customer Name` input field |
| **Y-axis max** | Auto-scales to the next multiple of 20 strictly above the value (e.g. value `82` → max `100`; value `100` → max `120`) |
| **Y-axis step** | Fixed at 20 |
| **3D effect** | Right face (dark blue `#2F619E`) + top face (light blue `#A8D0E8`) + front face (medium blue `#5b9bd5`) |
| **Legend table** | Small table below the chart showing customer name and EPS value |

**How the 3D bar is drawn** (`draw3DEPSChart` in `script.js`):
1. A white rectangle is drawn as the chart back wall
2. Horizontal grid lines are drawn across the full width (including the 3D depth area)
3. The bar's **right face** (a parallelogram) is filled dark blue
4. The bar's **front face** (a plain rectangle) is filled medium blue on top of the right face
5. The bar's **top face** (a parallelogram) is filled light blue
6. A subtle border is stroked around the front face
7. The left Y-axis line is redrawn on top of everything for visibility

---

### Chart 2 — Reporting Device Average EPS (Page 4, Section 2)

| Property | Detail |
|----------|--------|
| **Type** | Chart.js grouped bar chart |
| **Data source** | Device CSV upload (column containing `host` = labels, column containing `rate` = values) |
| **Max devices shown** | 10 (top 10 rows of the CSV) |
| **Colours** | Each device gets its own colour from a 10-colour palette: blue, orange, grey, yellow, dark blue, green, navy, brown, dark grey, dark yellow |
| **Legend** | Shown at the bottom — one colour swatch per device |
| **Data labels** | Value displayed above each bar |
| **If no CSV uploaded** | Chart area is empty (no blank-state message for this chart) |

**CSV column detection logic** (`script.js` device CSV handler):
- Scans every column header
- First header containing the word `host` (case-insensitive) → used as the device name
- First header containing the word `rate` (case-insensitive) → used as the EPS value
- This means headers like `Host Name`, `hostname`, `AVG(Event Rate)`, `event_rate` all work

---

### Chart 3 — Incident Severity Count (Page 5, Section 3)

| Property | Detail |
|----------|--------|
| **Type** | Chart.js bar chart |
| **Data source** | Analytics CSV — `Severity` column |
| **Categories counted** | `HIGH`, `MEDIUM`, `LOW` (case-insensitive match) |
| **Bar colours** | High = Red (`#FF0000`), Medium = Yellow (`#FFFF00`), Low = Green (`#00B050`) |
| **Y-axis** | Starts at 0, max = highest count + 1, integer steps only |
| **Data labels** | Count shown above each bar |
| **If all counts are zero** | Chart is hidden; blank-state message shown: *"No potential incidents have been observed from [date] 9:00 PM to [date] 9:00 PM."* |

**Counting logic:**
```
For each row in the CSV:
  Read the Severity column value
  Convert to uppercase, trim spaces
  If value == "HIGH"   → highCount++
  If value == "MEDIUM" → mediumCount++
  If value == "LOW"    → lowCount++
  Any other value      → ignored
```

---

### Chart 4 — True Positive (Page 5, Section 4)

| Property | Detail |
|----------|--------|
| **Type** | Chart.js bar chart |
| **Data source** | Analytics CSV — `Resolution` column |
| **Detection** | Row is counted as True Positive if Resolution contains `true positive` or `tp` (case-insensitive) |
| **Breakdown** | Counted separately for High, Medium, Low (using the same row's `Severity` column) |
| **Bar colours** | Same as Severity chart — Red, Yellow, Green |
| **If no TP rows found** | Chart is hidden; blank-state message shown: *"No True Positive incidents observed."* |

**False Positive text block** (below Chart 4, not a chart):
- Reads the same `Resolution` column, looks for `false positive` or `fp`
- Counts total FPs and breaks them down by severity
- If zero FPs: *"No False positive incidents have been observed from [date range]."*
- If FPs exist: *"2 Medium, 1 Low false positive incidents observed from [date range]."*
- This text is always shown (unlike the TP chart which hides when empty)

---

### Chart 5 — Potential Incidents with Count (Page 6, BluPine only)

| Property | Detail |
|----------|--------|
| **Type** | Chart.js grouped bar chart |
| **Data source** | The **Incident Title** column in the incidents table (live — reads the DOM, not the CSV) |
| **Visible** | Only when Customer Name contains `blupine` |
| **What it shows** | One bar per unique incident title; bar height = number of rows with that title |
| **Colours** | Each unique title gets its own colour from the 10-colour palette |
| **Legend** | Full incident title as legend label at the bottom |
| **Updates** | Refreshes every time the incident table changes (300ms debounce) |
| **If all titles are blank** | Chart box hidden; blank-state message shown |

**Titles ignored when counting:**
- Empty cells
- `#` (default placeholder)
- `New Incident` (default placeholder)
- `-`
- `N/A`
- `TBD`

---

### Colour Palette Reference

All Chart.js charts use the same 10-colour rotation:

| Index | Colour | Hex |
|-------|--------|-----|
| 1 | Steel Blue | `#5b9bd5` |
| 2 | Orange | `#ed7d31` |
| 3 | Grey | `#a5a5a5` |
| 4 | Yellow | `#ffc000` |
| 5 | Dark Blue | `#4472c4` |
| 6 | Green | `#70ad47` |
| 7 | Navy | `#255e91` |
| 8 | Brown | `#9e480e` |
| 9 | Dark Grey | `#636363` |
| 10 | Dark Yellow | `#997300` |

After index 10, the palette wraps back to index 1.

---

*Continue to [Section 6 — Technical Architecture](#6-technical-architecture)*

---

## 6. Technical Architecture

This section is for developers and freshers who want to understand how the code is structured, modify existing behaviour, or add new features.

---

### 6.1 How the Three Files Relate

```
┌─────────────────────────────────────────────────────────────────────┐
│                         index.html                                  │
│                                                                     │
│  • Defines all 6 A4 pages as <div class="page"> blocks             │
│  • Each page holds headings, canvas placeholders, tables            │
│  • contenteditable="true" marks text the user can click-edit       │
│  • Loads CDN libraries (Chart.js, PapaParse, DataLabels)           │
│  • Links style.css and script.js                                    │
└──────────────┬──────────────────────────────────┬───────────────────┘
               │                                  │
               ▼                                  ▼
┌──────────────────────────┐     ┌────────────────────────────────────┐
│       style.css          │     │             script.js              │
│                          │     │                                    │
│  • A4 page sizing        │     │  • Reads dashboard inputs          │
│    (210mm × 297mm)       │     │  • Parses CSV files (PapaParse)    │
│  • Flex column layout    │     │  • Draws / snapshots charts        │
│    for each page         │     │  • Manages incident table          │
│  • Column widths for     │     │  • Runs pagination engine          │
│    the incident table    │     │  • Updates page numbers            │
│  • @media print rules    │     │  • Handles print + reload          │
│  • contain: layout style │     │  • Auto-generates dates & notes    │
│    (scroll performance)  │     │                                    │
└──────────────────────────┘     └────────────────────────────────────┘
```

---

### 6.2 index.html Structure

The HTML file has two main areas:

**1. Dashboard panel** (`.no-print` div at the top)
- Contains all `<input>` fields and the Print button
- Has `class="no-print"` so the `@media print` CSS hides it during export

**2. Report pages** — each page is a `<div class="page" id="pN">`

| Page ID | Contents |
|---------|----------|
| `#p1` | Cover — logo, title, date, client logo, copyright, footer strip |
| `#p2` | Document Control table |
| `#p3` | Table of Contents with `<a>` links |
| `#p4` | Two `<canvas>` elements for EPS and Device charts |
| `#p5` | Two `<canvas>` elements for Severity and TP charts + FP text |
| `#p6` | Incident table, Add/Delete buttons, status note |
| Dynamic | Overflow pages created by JS — `class="page incident-page-extra"` |

**Key HTML patterns used:**

```html
<!-- A4 page wrapper -->
<div class="page" id="p4">
  <img class="sns-logo-img page-sns-logo" src="" alt="">
  <!-- content -->
  <div class="footer-text-row">
    <span class="confidential-mark">Confidential</span>
    <span class="page-num">4</span>   <!-- updated by JS -->
  </div>
  <div class="footer-strip">...</div>
</div>

<!-- Editable cell example -->
<td contenteditable="true">Amirdeshwara R</td>

<!-- Chart canvas — JS reads this and draws into it -->
<div class="canvas-wrap"><canvas id="epsChart"></canvas></div>

<!-- Incident table colgroup controls column widths via JS -->
<colgroup>
  <col class="inc-col-sn">      <!-- 6%  -->
  <col class="inc-col-ticket">  <!-- 16% -->
  <col class="inc-col-sev">     <!-- 14% -->
  <col class="inc-col-title">   <!-- 46% -->
  <col class="inc-col-status">  <!-- 18% -->
</colgroup>
```

---

### 6.3 style.css Architecture

**A4 page sizing** — the most important rule:
```css
.page {
    width: 210mm;
    height: 297mm;
    padding: 15mm 20mm;   /* top/bottom 15mm, left/right 20mm */
    overflow: hidden;
    contain: layout style; /* isolates each page's layout for scroll performance */
}
```
`contain: layout style` means a change inside one page cannot trigger a reflow in other pages. This is why scrolling through many pages stays smooth.

**Half-page chart layout** (two charts per page, each ~46% height):
```css
.half-container { height: 46%; }   /* leaves 8% gap across both containers */
.canvas-wrap    { flex-grow: 1; position: relative; } /* fills remaining space */
```

**Incident table column widths** (in `<col>` elements, overridden to `px` by JS):
```css
.inc-col-sn     { width: 6%;  }
.inc-col-ticket { width: 16%; }
.inc-col-sev    { width: 14%; }
.inc-col-title  { width: 46%; }
.inc-col-status { width: 18%; }
```

**Header vs data cell text behaviour:**
```css
/* Headers never break mid-word */
.incident-data-table th { white-space: nowrap; overflow: hidden; }

/* Data cells wrap long text to the next line */
.incident-data-table td { word-break: break-word; overflow-wrap: break-word; }
```

**Print media query** (`@media print`) key rules:
```css
.no-print, .btn-row, .incident-col-resize-handle { display: none !important; }
body  { background: none; padding: 0; }
.page { margin: 0; box-shadow: none; }
* { -webkit-print-color-adjust: exact !important; } /* forces colours in PDF */
```

---

### 6.4 script.js Function Reference

The script is ~1,370 lines. Here is every major function grouped by area.

---

#### Initialisation

| Function / Variable | What it does |
|--------------------|-------------|
| `window.onload` | Entry point — sets auto dates, blank messages, calls `sync()` |
| `sync()` | Master update — called whenever Customer Name or EPS changes. Syncs the name to all locations, detects BluPine, refreshes charts, triggers pagination |
| `window._fpDateRange` | Global object storing `{ coverDate, todayDate }` — used by the FP text generator |

**Date logic inside `window.onload`:**
```
today     = current system date
yesterday = today - 1 day  (n-1 logic)

Cover date          → yesterday in DD-MM-YYYY
Doc Prepared On     → today in DD/MM/YYYY (09 PM [yesterday day] [month] to 09 PM [today day] [month])
Blank-state message → "...from [yesterday] 9:00 PM to [today] 9:00 PM"
```

---

#### Chart Rendering

| Function | What it does |
|----------|-------------|
| `SNAPSHOT_RATIO = 4` | Constant — all charts render at 4× CSS size for 300 DPI print quality |
| `snapshotChart(canvasEl)` | Captures the canvas as a PNG (`toDataURL`), places it in an `<img>` over the canvas, hides the canvas |
| `draw3DEPSChart(canvas, value, name, ratio)` | Draws the custom 3D bar chart using Canvas 2D API — back wall, grid lines, right face, front face, top face, Y-axis labels |
| `refreshEPS()` | Reads EPS input + customer name, calls `draw3DEPSChart`, then `snapshotChart` |
| `renderDeviceChart(labels, data)` | Creates a Chart.js bar chart for device EPS data; calls `snapshotChart` after one animation frame |
| `renderIncidentChart(id, counts, label)` | Creates a Chart.js bar chart for severity or TP data; calls `snapshotChart` after one animation frame |
| `refreshBluPineChart()` | Reads incident titles from the DOM, counts occurrences, creates Chart.js chart; calls `snapshotChart` |

---

#### CSV Parsing

| Event / Function | What it does |
|----------------|-------------|
| `#deviceCsv` change event | Triggers PapaParse on the uploaded file; finds `host` and `rate` columns; calls `renderDeviceChart` |
| `#incidentCsv` change event | Triggers PapaParse; counts severity/TP/FP; populates incident table rows; triggers pagination |
| `escapeHtmlCell(val)` | Sanitises a CSV cell value before inserting it into the DOM (prevents XSS — e.g. `<script>` in a CSV cell cannot execute) |

**CSV column detection approach:**
```javascript
// Finds the first header that contains the search word (case-insensitive)
const sevCol = headers.find(h => h.toUpperCase().includes("SEVERITY"));
const ticketCol = headers.find(h => h.toUpperCase().includes("TICKET"));
// etc.
```
This means column headers do not need to match exactly — `TICKET NO`, `Ticket Number`, `ticket_id` all work for the ticket column.

---

#### Column Resize System

| Function / Constant | What it does |
|--------------------|-------------|
| `DEFAULT_INCIDENT_COL_FRACS` | Array `[0.06, 0.16, 0.14, 0.46, 0.18]` — default widths as fractions of total table width |
| `INCIDENT_COL_MIN_PX = 40` | Minimum column width in pixels — enforced during drag |
| `ensureIncidentColgroup(table)` | Creates the `<colgroup>` element if it does not exist |
| `incidentTableInnerWidth(table)` | Returns the pixel width of the table's **wrapper div** (not the table itself, which may be overflowed) |
| `applyIncidentColWidthsPx(widths)` | Sets `style.width` in pixels on every `<col>` in every incident table on screen |
| `normalizeIncidentColWidths(table)` | Re-scales stored column widths to fit the current container width (called after window resize or column drag) |
| `initIncidentColumnResize(table)` | Adds drag handles to each `<th>` and attaches `mousedown`/`mousemove`/`mouseup` listeners |
| `fitIncidentTablesToPageWidth()` | Called on window resize (debounced 200ms) to keep tables within page bounds |

---

#### Pagination Engine

| Function | What it does |
|----------|-------------|
| `schedulePagination()` | Debounced wrapper (300ms) — prevents pagination from running on every single keystroke |
| `tbodyResizeObserver` | `ResizeObserver` instance watching all `<tbody>` elements; fires `schedulePagination()` when a tbody's height changes (e.g. text wraps) |
| `managePagination()` | Main engine — moves overflow rows to the next page, moves underflow rows back, creates/deletes pages, renumbers rows, updates NOTE and page numbers |
| `createNewIncidentPage(afterPage)` | Builds a new `.page.incident-page-extra` div with a full table structure and inserts it after the given page |
| `pruneEmptyIncidentContinuationPages()` | Removes any continuation pages whose `<tbody>` has zero rows |
| `getIncidentNoteReservePx()` | Returns `130` if there are rows with open/closed status (reserves space for the NOTE), otherwise `0` |
| `renumberIncidentRows()` | Walks all `<tbody>` rows across all pages and writes sequential S.No values |
| `observeTbody(tbody)` | Registers a `<tbody>` with the `ResizeObserver` |

**Pagination algorithm (simplified):**
```
1. Check if section5Wrapper has < 150px room before footer → move to new page (p7)
2. For each tbody (top to bottom):
   While last row overflows past footer boundary:
     Move last row to next page (create page if needed)
3. For each tbody (bottom to top):
   While first row of this tbody fits on previous page:
     Move first row back up (delete this page if now empty)
4. Renumber all S.No cells
5. Update NOTE text
6. Update page numbers in footer + TOC
```

---

#### Page Numbering & End-of-Document Marker

| Function | What it does |
|----------|-------------|
| `getVisibleReportPages()` | Returns all `.page` elements that are currently visible (not `display:none`) |
| `updatePageNumbers()` | Assigns sequential numbers to all `.page-num` spans; updates TOC page references; places the `← End of Document →` marker on the last page |

The `← End of Document →` marker is a `<div class="end-doc-pin">` element positioned above the footer on whichever page happens to be last — it moves automatically as pages are added or removed.

---

#### Print Flow

```
User clicks "PRINT FINAL REPORT"
         │
         ▼
printReport() in script.js
         │
         ▼
window.addEventListener('afterprint', onAfterPrint)
         │
         ▼
window.print()  ──►  Browser print dialog opens
                      (user selects printer / Save as PDF)
                      (charts are already 4× resolution images)
         │
         ▼  (user closes dialog)
onAfterPrint() fires
         │
         ▼
window.location.reload()  ──►  Page resets to clean state
```

Charts do not need any extra processing before printing because they were already snapshotted at 4× resolution when they were first rendered.

---

### 6.5 Cache Busting

The browser caches `style.css` and `script.js` aggressively. Whenever you deploy a change to either file, users may still see the old version until the cache expires.

**Solution:** Bump the version number in the `<head>` of `index.html`:

```html
<!-- In index.html -->
<link rel="stylesheet" href="style.css?v=19">   <!-- change 19 → 20 -->
<script src="script.js?v=19"></script>           <!-- change 19 → 20 -->
```

The `?v=19` query string makes the browser treat it as a new URL, forcing a fresh download. The number has no other meaning — just increment it each time you deploy.

---

### 6.6 How to Add a New Column to the Incident Table

This is the most common structural change. Here is every place you need to touch, in order:

**Step 1 — `index.html`: Add `<col>` to colgroup**
```html
<colgroup>
  <col class="inc-col-sn">
  <col class="inc-col-ticket">
  <col class="inc-col-sev">
  <col class="inc-col-title">
  <col class="inc-col-newcol">   <!-- add this -->
  <col class="inc-col-status">
</colgroup>
```

**Step 2 — `index.html`: Add `<th>` to the header row**
```html
<tr>
  <th>S.No</th>
  <th>Ticket No</th>
  <th>Severity</th>
  <th>Incident Title</th>
  <th>New Column</th>   <!-- add this -->
  <th>Status</th>
</tr>
```

**Step 3 — `index.html`: Add a `<td>` to the default body row**
```html
<tr>
  <td contenteditable="true">1</td>
  <td contenteditable="true">#71408</td>
  <td contenteditable="true">Medium</td>
  <td contenteditable="true">Account Locked: Server</td>
  <td contenteditable="true"></td>   <!-- add this -->
  <td contenteditable="true">Closed</td>
</tr>
```

**Step 4 — `style.css`: Add a width class**
```css
.inc-col-newcol { width: 12%; }
/* Reduce other columns so total remains 100%
   e.g. reduce inc-col-title from 46% to 34% */
```

**Step 5 — `script.js`: Update column count guards**
Search for every `cols.length !== 5` and `cells.length > 5` and update the number:
```javascript
// Change from:
if (cols.length !== 5) return;
// Change to:
if (cols.length !== 6) return;
```

**Step 6 — `script.js`: Update `DEFAULT_INCIDENT_COL_FRACS`**
```javascript
// Change from:
const DEFAULT_INCIDENT_COL_FRACS = [0.06, 0.16, 0.14, 0.46, 0.18];
// Change to (must sum to 1.0):
const DEFAULT_INCIDENT_COL_FRACS = [0.06, 0.16, 0.14, 0.34, 0.12, 0.18];
```

**Step 7 — `script.js`: Update the CSV handler to populate the new column**
```javascript
// Inside the incidentCsv complete handler, find the row-building code:
const tr = '<tr>'
    + `<td contenteditable="true">${i + 1}</td>`
    + `<td contenteditable="true">${escapeHtmlCell(row[ticketCol])}</td>`
    + `<td contenteditable="true">${escapeHtmlCell(row[sevCol])}</td>`
    + `<td contenteditable="true">${escapeHtmlCell(row[titleCol])}</td>`
    + `<td contenteditable="true">${escapeHtmlCell(row[newCol])}</td>`  // add
    + `<td contenteditable="true">${escapeHtmlCell(row[statusCol])}</td>`
    + '</tr>';
```

**Step 8 — `script.js`: Update `addRow()` to include the new cell**
```javascript
const row = '<tr>'
    + `<td contenteditable="true">${rowCount}</td>`
    + '<td contenteditable="true">#</td>'
    + '<td contenteditable="true">High</td>'
    + '<td contenteditable="true">New Incident</td>'
    + '<td contenteditable="true"></td>'   // add
    + '<td contenteditable="true">Open</td>'
    + '</tr>';
```

**Step 9 — `script.js`: Update `createNewIncidentPage()` with the new `<th>` and `<col>`**
Find the `createNewIncidentPage` function and add the new column to the table HTML template inside it (same changes as Steps 1–2).

**Step 10 — Bump the version** in `index.html` (`?v=N` → `?v=N+1`)

---

### 6.7 How to Change a Name/Value That Is Hardcoded

| What to change | Where to find it |
|---------------|-----------------|
| "Prepared By" name | `index.html` — `<td>Amirdeshwara R</td>` (~line 74) |
| "Reviewed By" name | `index.html` — `<td>Kishore Kumar K</td>` (~line 80) |
| "Approved By" name | `index.html` — `<td>Diptesh Saha</td>` (~line 83) |
| Copyright text | Click it directly in the browser and type, OR edit `index.html` `<p class="copyright-text">` |
| Default EPS value | `index.html` — `<input ... value="82">` |
| Default customer name | `index.html` — `<input ... value="RMZ Corp.">` |
| Status NOTE wording | `script.js` — `updateIncidentNote()` function, the two `noteEl.innerText = "NOTE: ..."` lines |
| Chart bar colours | `script.js` — `const themeColors = [...]` array at the top |
| EPS bar colour | `script.js` — `draw3DEPSChart()` function, `ctx.fillStyle = '#5b9bd5'` (front face) |

---

*Continue to [Section 7 — Troubleshooting & FAQ](#7-troubleshooting--faq)*
