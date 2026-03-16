# Journal Entry Practice – Emily’s Dental Practice (P2.2)

This web-based app lets students practice journal entries for **Emily’s Dental Practice (Problem P2.2)**. It includes a journal-entry grid, a chart of accounts, and tools to view a trial balance and general ledger.

---

## How students access it

The app is available online:

- **URL:** https://jinhanpae.github.io/Journal-Entry-Practice---Emily-Dentist/

You can:

- Share this link directly with students, or
- Embed it in an LMS page (e.g., Canvas) using an `<iframe>`.

---

## What students can do

- Read a series of short **transaction descriptions**.
- Enter journal entries using **3‑digit account codes**.
- Use the **Chart of Accounts** window for reference.
- Click **Submit journal entry** to check their work and see **feedback**.
- See a running **score** with partial credit when they correct earlier mistakes.
- Open a **Trial Balance** based on all entries they have made.
- View a **General Ledger** with running balances by account.

Some questions require a journal entry; others test understanding that **no journal entry is required** for that item.

To prevent common errors:

- The app checks that **debits equal credits** and that **amounts are actually entered**.
- If debits and credits don’t match, or if accounts are selected with no amounts, students see a warning and the entry is treated as incorrect until fixed.

---

## Modes: Exercise vs Test

The app can run in two modes, controlled by the `exerciseConfig.mode` setting.

- **Exercise mode** (`mode: "exercise"` – default)  
  - Students see immediate **feedback** on each attempt (Correct / Not correct, explanations).  
  - The app tracks **partial credit**: if a student answers incorrectly first and later fixes it, they receive partial points.  
  - A **score summary** is shown at the bottom of the page as they work.  
  - When an answer is correct (including correctly choosing “No journal entry is required”), the **Next** button becomes highlighted in blue to guide students forward.

- **Test mode** (`mode: "test"`)  
  - Students can still enter and change journal entries for each transaction.  
  - The app only checks **mechanical validity**: debits and credits must be equal and non‑zero; otherwise a warning is shown and Next is not highlighted.  
  - There is **no feedback** about whether the accounts and amounts are conceptually correct, and no running score is displayed.  
  - This mode is intended for quizzes or graded work where instructors review the saved entries later (e.g., via the trial balance or general ledger).

---

## How instructors can reuse it

The app is designed so you can create new versions by changing only:

- The **exercise configuration** (titles, entity name, login text, mode).
- The **chart of accounts**.
- The **question set** and model answers.

The core app logic, scoring, and layout stay the same, which makes it easier to maintain and reuse across semesters.

---

## Classroom notes

- The login screen is meant to:
  - Ask for a **name** (optional) and a **password** shared in class.
  - Provide a simple starting screen for each session.
- The app runs entirely in the browser; students do **not** need to install anything.
- Pop‑up windows (trial balance, general ledger, chart of accounts) may need to be allowed in the browser if they are blocked.
- Button behavior:
  - **Submit journal entry** is the main action and is highlighted in blue by default.
  - After a correct entry (in Exercise mode) or a mechanically valid entry in Test mode, the **Next** button becomes highlighted to guide students forward.

---

## Copyright / use

This app is intended for classroom use in accounting courses.

Please see the footer in the app and the repository’s license for details about redistribution and use.
