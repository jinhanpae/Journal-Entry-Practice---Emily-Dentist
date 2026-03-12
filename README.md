# Journal Entry Practice – Emily’s Dental Practice (P2.2)

A web-based practice app for introductory accounting students to drill **journal entries** for Emily’s Dental Practice (Problem P2.2), supported by an integrated **chart of accounts**, **trial balance**, and **general ledger**.

The app is designed so instructors can reuse the engine by swapping only a **config file**, **question bank**, and **chart of accounts**.

---

## Live site (GitHub Pages)

The app is hosted via **GitHub Pages** at:

- **URL:** https://jinhanpae.github.io/Journal-Entry-Practice---Emily-Dentist/

Students can access this link directly or via an embedded `<iframe>` in an LMS such as Canvas.

---

## Features

- Guided **journal entry grid** using 3‑digit account codes.
- Handles both transaction items and **“no journal entry required”** conceptual items.
- **Per-question scoring** with partial credit:
  - Full credit on first correct attempt.
  - Half credit if the student corrects a previous mistake.
- **State persistence** per question while navigating between items.
- **Trial balance** popup built from all student entries.
- **Full general ledger** popup with running balances per account.
- Optional **login overlay** (name + password) for classroom sessions.
- Fully client-side: pure HTML, CSS, and JavaScript, easy to host on GitHub Pages or embed in Canvas.

---

## File overview

Core files:

- `index.html`  
  Main HTML shell:
  - Login overlay.
  - Main app container, journal table, buttons, feedback, footer.
  - Script tags that load config, data, and app logic.

- `styles.css`  
  Layout and visual styles for the main app (container, table, buttons, feedback, footer).

- `exerciseConfig.js`  
  Configuration specific to **Emily’s Dental Practice – P2.2**:
  - App titles and subtitles.
  - Entity name for reports (trial balance, ledger, chart).
  - Login behaviour (use login screen, password, button label).
  - Footer text and copyright.

- `journalChartOfAccounts.js`  
  Chart of accounts for Emily’s Dental Practice:
  - Exports a `chartOfAccounts` array.
  - Each object: `{ id, code, name, type }`.

- `journalQuestions.js`  
  Question bank for this exercise set:
  - Exports a `journalQuestions` array.
  - Each question typically includes:
    - `id`
    - `title`, optional `date`, and `description`
    - `correctLines` (model journal entry)
    - `requiresEntry` and optional `explanation`

- `journalApp.js`  
  Main app engine and UI wiring:
  - Shared state across questions (Maps/Sets for attempts, scores, feedback).
  - Rendering of the journal-entry grid and navigation.
  - Grading logic, including partial credit and “no entry required” items.
  - Trial balance and general ledger popups.
  - Login overlay handling and startup.
  - Fetches the user’s public IP (for a meta line in the trial balance window).

Chart-of-accounts popup:

- `journalChart.html`  
  Popup window showing the chart of accounts for the exercise.

- `journalChart.js`  
  Builds the chart-of-accounts table in `journalChart.html` using:
  - `exerciseConfig.chartWindowTitle`
  - `chartOfAccounts` data.

---

## How it works (high level)

### 1. Login and startup

- On load, `journalApp.js`:
  - Wires all button handlers.
  - Applies titles and labels from `exerciseConfig`.
  - Checks `exerciseConfig.useLoginScreen`:
    - If `true`, shows the login overlay.
    - If `false`, skips directly to the main app.
- Students can enter:
  - Optional **name** (stored in `sessionStorage` for use in the trial balance meta line).
  - **Password** (default: `KUBS`, configurable via `exerciseConfig.loginPassword`).

### 2. Rendering questions

- `renderQuestion()` reads `journalQuestions[currentIndex]` and:
  - Displays the title, date (if present), and description.
  - Restores saved journal lines, feedback, and “no entry required” checkbox state.
  - If there are no saved lines yet, initializes with two blank rows.

### 3. Student input and auto-lookup

- Each journal row includes:
  - 3‑digit **account code** (`code-input`).
  - Read-only **account name** (`name-display`), auto-filled via `chartOfAccounts`.
  - **Debit** and **credit** amounts (`dr-input`, `cr-input`).
- `addRow()` allows students to add extra lines as needed.

### 4. Grading logic

- `checkAnswer()`:
  - Collects non-blank lines via `getUserLines()`.
  - Enforces:
    - First attempt must be a **real** attempt (lines OR “no entry” checked).
    - “No entry required” and journal lines are **mutually exclusive**.
    - Valid account codes (present in `chartOfAccounts`).
    - Debits equal credits (within a small tolerance) for entries that require a journal.
  - If `requiresEntry === false`:
    - Correct when “no entry required” is checked and no lines are entered.
    - Partial or full credit based on whether there were prior wrong attempts.
  - If `requiresEntry !== false`:
    - Calls `journalsEqual(userLines, q.correctLines)` to compare with the model.
    - Awards full or partial credit depending on correction history.
  - Updates a **score summary**:
    - Total points earned (including half points).
    - Number of questions attempted.
    - Percentage correct with partial credit.

### 5. Trial balance and ledger

- **Trial balance (`openTrialBalanceWindow`)**:
  - Aggregates saved entries from all questions into `tbTotals`.
  - Computes net debit/credit per account and total debits/credits.
  - Opens a popup window showing the trial balance.
  - Includes a meta line: student name, score, timestamp, IP address, and a hash.

- **General ledger (`openFullLedgerWindow`)**:
  - Groups entries by account.
  - For each account, shows:
    - Question titles as transaction labels.
    - Debit and credit columns.
    - Running balance per account with Dr/Cr representation.

### 6. Chart of accounts popup

- The “Open chart of accounts” button:
  - Opens `journalChart.html` in a popup (currently `width=500,height=500`).
- `journalChart.js`:
  - Uses `exerciseConfig.chartWindowTitle` for the page title.
  - Renders `chartOfAccounts` in a simple table (Code, Account, Type).

---

## Running the app

### 1. Live (recommended for students)

Use the GitHub Pages URL:

- https://jinhanpae.github.io/Journal-Entry-Practice---Emily-Dentist/

This can be:

- Opened directly in a browser, or  
- Embedded in Canvas or another LMS via an `<iframe>`, for example:

  ```html
  <p><strong>Hint:</strong> For this exercise, total debits and credits should both equal 29,800.</p>
  <p>
    <iframe
      style="border: 1px solid #ccc; overflow: auto;"
      src="https://jinhanpae.github.io/Journal-Entry-Practice---Emily-Dentist/"
      width="100%"
      height="700"
      allowfullscreen="allowfullscreen">
    </iframe>
  </p>
