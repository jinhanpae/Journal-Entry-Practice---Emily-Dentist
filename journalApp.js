// journalApp.js
// Generic journal entry practice engine
// Includes per-question attempt tracking, feedback persistence, trial balance, and full general ledger popups.

let currentIndex = 0;            // index into journalQuestions[]
let totalAttempted = 0;          // total times "Submit journal entry" clicked (all questions)
let totalCorrect = 0;            // total points earned (sum of perQuestionScore)


// Running totals for a trial balance (by accountId) – built fresh on demand
// Now stores: { debit, credit, code }
const tbTotals = new Map();


// Store user entries per question so they persist when navigating
// key: questionId, value: [{ code, debit, credit }, ...]
const userEntriesByQuestion = new Map();


// Track attempts per question ID (how many times "Submit" has been clicked for that question)
const attemptsByQuestion = new Map();


// Questions that have been tried at least once (used as denominator for overall score)
const triedQuestionIds = new Set();


// Per-question score based on latest result (0 or 0.5 or 1)
const perQuestionScore = new Map();


// Questions that have had at least one wrong attempt (used to decide partial vs full credit)
const everWrongByQuestion = new Map();


// Store feedback state per question so it shows on revisit
// key: questionId, value: { className, text }
const feedbackByQuestion = new Map();


// Store "no entry required" checkbox state per question (debugging/navigation aid)
const noEntryChosenByQuestion = new Map();


// ---------- Simple helper ----------

function $(id) {
  // Shorthand for document.getElementById
  return document.getElementById(id);
}

function hashCode(str) {
  // Simple 32-bit hash (converted to unsigned hex string), used in trial balance footer
  let hash = 0;
  if (!str) return "0";
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // 32-bit
  }
  return (hash >>> 0).toString(16);
}


// ---------- Chart lookup helpers ----------

function findAccountByCode(code) {
  if (!code) return null;
  const norm = code.toString().trim();
  return chartOfAccounts.find(a => a.code === norm) || null;
}

function nameForAccountId(id) {
  const acc = chartOfAccounts.find(a => a.id === id);
  return acc ? acc.name : "(Unknown account)";
}


// ---------- Rendering the question ----------

function renderQuestion() {
  // Render the current question, its saved journal lines, feedback, and "no entry" checkbox
  const q = journalQuestions[currentIndex];

  $("tx-title").textContent =
    q.title + (q.date ? ` (Date: ${q.date})` : "");
  $("tx-description").textContent = q.description;

  const tbody = $("journal-rows");
  tbody.innerHTML = "";

  const saved = userEntriesByQuestion.get(q.id);

  if (saved && saved.length > 0) {
    // Rebuild the exact lines the student last submitted for this question
    saved.forEach(line => {
      const code = line.code || "";
      const tr = document.createElement("tr");

      const tdCode = document.createElement("td");
      const tdName = document.createElement("td");
      const tdDr = document.createElement("td");
      const tdCr = document.createElement("td");

      const codeInput = document.createElement("input");
      codeInput.type = "text";
      codeInput.maxLength = 3;
      codeInput.className = "code-input";
      codeInput.value = code;

      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.className = "name-display";
      nameInput.readOnly = true;

      const drInput = document.createElement("input");
      drInput.type = "number";
      drInput.step = "0.01";
      drInput.className = "dr-input";
      drInput.value = line.debit ? String(line.debit) : "";

      const crInput = document.createElement("input");
      crInput.type = "number";
      crInput.step = "0.01";
      crInput.className = "cr-input";
      crInput.value = line.credit ? String(line.credit) : "";

      tdCode.appendChild(codeInput);
      tdName.appendChild(nameInput);
      tdDr.appendChild(drInput);
      tdCr.appendChild(crInput);

      tr.appendChild(tdCode);
      tr.appendChild(tdName);
      tr.appendChild(tdDr);
      tr.appendChild(tdCr);

      tbody.appendChild(tr);

      // Keep account name in sync with the 3-digit code
      updateNameForCodeInput(codeInput, nameInput);
      codeInput.addEventListener("input", () =>
        updateNameForCodeInput(codeInput, nameInput)
      );
    });
  } else {
    // Initial state for each question: two empty rows
    addRow("");
    addRow("");
  }

  // Reset feedback visually, then restore any saved message
  const fb = $("feedback");
  fb.textContent = "";
  fb.className = "feedback";

  const savedFb = feedbackByQuestion.get(q.id);
  if (savedFb) {
    fb.className = savedFb.className;
    fb.textContent = savedFb.text;
  }

  // Restore "no journal entry is required" checkbox to last known state for this question
  const noEntryBox = $("no-entry-checkbox");
  if (noEntryBox) {
    const savedNoEntry = noEntryChosenByQuestion.get(q.id) || false;
    noEntryBox.checked = savedNoEntry;
  }

  // Re-align rows visually (debits first, credits indented, blanks last)
  rearrangeVisibleRows();
}

function addRow(initialCode = "") {
  // Add a new blank journal row (optionally pre-filling the code)
  const tbody = $("journal-rows");
  const tr = document.createElement("tr");

  const tdCode = document.createElement("td");
  const tdName = document.createElement("td");
  const tdDr = document.createElement("td");
  const tdCr = document.createElement("td");

  const codeInput = document.createElement("input");
  codeInput.type = "text";
  codeInput.maxLength = 3;
  codeInput.className = "code-input";
  codeInput.value = initialCode;

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "name-display";
  nameInput.readOnly = true;

  const drInput = document.createElement("input");
  drInput.type = "number";
  drInput.step = "0.01";
  drInput.className = "dr-input";

  const crInput = document.createElement("input");
  crInput.type = "number";
  crInput.step = "0.01";
  crInput.className = "cr-input";

  tdCode.appendChild(codeInput);
  tdName.appendChild(nameInput);
  tdDr.appendChild(drInput);
  tdCr.appendChild(crInput);

  tr.appendChild(tdCode);
  tr.appendChild(tdName);
  tr.appendChild(tdDr);
  tr.appendChild(tdCr);

  tbody.appendChild(tr);

  // Immediately sync account name and hook up live update
  updateNameForCodeInput(codeInput, nameInput);
  codeInput.addEventListener("input", () =>
    updateNameForCodeInput(codeInput, nameInput)
  );
}

function updateNameForCodeInput(codeInput, nameInput) {
  // Look up account by code and show its name in the read-only name field
  const acc = findAccountByCode(codeInput.value);
  nameInput.value = acc ? acc.name : "";
}


// ---------- Collect user input & comparison ----------

function getUserLines() {
  // Read all current rows and return an array of non-blank journal lines
  const rows = Array.from(document.querySelectorAll("#journal-rows tr"));
  return rows
    .map(tr => {
      const code = tr.querySelector(".code-input").value.trim();
      const acc = findAccountByCode(code);

      const drVal = tr.querySelector(".dr-input").value;
      const crVal = tr.querySelector(".cr-input").value;

      const debit = drVal ? parseFloat(drVal) : 0;
      const credit = crVal ? parseFloat(crVal) : 0;

      // Completely blank row → ignore for grading / saving
      if (!code && debit === 0 && credit === 0) return null;

      return {
        accountId: acc ? acc.id : null,
        code,
        debit,
        credit
      };
    })
    .filter(x => x !== null);
}

function journalsEqual(user, correct) {
  // Compare two sets of journal lines for exact match (by accountId and amounts)
  if (user.length !== correct.length) return false;

  const key = r =>
    `${r.accountId}|${r.debit.toFixed(2)}|${r.credit.toFixed(2)}`;

  const u = [...user].sort((a, b) => (key(a) > key(b) ? 1 : -1));
  const c = [...correct].sort((a, b) => (key(a) > key(b) ? 1 : -1));

  for (let i = 0; i < c.length; i++) {
    if (
      u[i].accountId !== c[i].accountId ||
      Math.abs(u[i].debit - c[i].debit) > 0.01 ||
      Math.abs(u[i].credit - c[i].credit) > 0.01
    ) {
      return false;
    }
  }
  return true;
}


// ---------- Trial balance helpers ----------

function buildTrialBalanceFromSavedEntries() {
  // Build tbTotals from all saved userEntriesByQuestion
  tbTotals.clear();

  userEntriesByQuestion.forEach(savedLines => {
    savedLines.forEach(line => {
      const acc = findAccountByCode(line.code);
      if (!acc) return;

      const prev = tbTotals.get(acc.id) || { debit: 0, credit: 0, code: acc.code };
      tbTotals.set(acc.id, {
        debit: prev.debit + (line.debit || 0),
        credit: prev.credit + (line.credit || 0),
        code: acc.code
      });
    });
  });
}

function resetTrialBalance() {
  tbTotals.clear();
}


// ---------- Ledger helpers (per-account detail) ----------

// Build a Map: accountId -> [{ questionId, code, debit, credit }]
function buildLedgerFromSavedEntries() {
  const ledgerByAccount = new Map();

  userEntriesByQuestion.forEach((savedLines, questionId) => {
    savedLines.forEach(line => {
      const acc = findAccountByCode(line.code);
      if (!acc) return;

      const list = ledgerByAccount.get(acc.id) || [];
      list.push({
        questionId,
        code: line.code,
        debit: line.debit || 0,
        credit: line.credit || 0
      });
      ledgerByAccount.set(acc.id, list);
    });
  });

  return ledgerByAccount;
}

function openFullLedgerWindow() {
  // Open a popup showing the full general ledger (all accounts)
  const ledgerByAccount = buildLedgerFromSavedEntries();

  if (ledgerByAccount.size === 0) {
    alert("No valid journal entries have been recorded for this session yet.");
    return;
  }

  // Prepare question title lookup
  const titleById = new Map();
  journalQuestions.forEach(q => {
    if (q && q.id != null && q.title) {
      titleById.set(q.id, q.title);
    }
  });

  // Entity / company name from config (used in title)
  const entityName =
    (typeof exerciseConfig !== "undefined" && exerciseConfig.tbEntityName) ||
    "Entity";

  // Build HTML sections for each account
  const sections = [];

  // Sort accounts by accountId for a stable order
  const accountIds = Array.from(ledgerByAccount.keys()).sort((a, b) => a - b);

  accountIds.forEach(accountId => {
    const lines = ledgerByAccount.get(accountId) || [];
    const accountName = nameForAccountId(accountId) || "(Unknown account)";

    // Sort lines by questionId for stable order
    lines.sort((a, b) => {
      if (a.questionId < b.questionId) return -1;
      if (a.questionId > b.questionId) return 1;
      return 0;
    });

    let runningBalance = 0;
    const rowsHtml = lines.map(line => {
      runningBalance += (line.debit || 0) - (line.credit || 0);
      const label = titleById.get(line.questionId) || line.questionId || "";

      let balanceDisplay = "";
      if (runningBalance > 0) {
        balanceDisplay = runningBalance.toLocaleString();
      } else if (runningBalance < 0) {
        balanceDisplay = "(" + Math.abs(runningBalance).toLocaleString() + ")";
      }

      return `
        <tr>
          <td>${label}</td>
          <td style="text-align:right;">${line.debit ? line.debit.toLocaleString() : ""}</td>
          <td style="text-align:right;">${line.credit ? line.credit.toLocaleString() : ""}</td>
          <td style="text-align:right;">${balanceDisplay}</td>
        </tr>
      `;
    }).join("");

    const tableHtml = `
      <section style="margin-bottom: 24px;">
        <h2 style="font-size: 15px; margin: 16px 0 6px;">${accountName} (${accountId})</h2>
        <table>
          <thead>
            <tr>
              <th>Transaction</th>
              <th style="text-align:right;">Debit</th>
              <th style="text-align:right;">Credit</th>
              <th style="text-align:right;">Balance Dr (Cr)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="4">No entries recorded for this account yet.</td></tr>`}
          </tbody>
        </table>
      </section>
    `;

    sections.push(tableHtml);
  });

  const win = window.open("", "GeneralLedger", "width=650,height=700,scrollbars=yes");
  if (!win) return;

  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>General Ledger – ${entityName}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
      margin: 16px;
      background: #f9fafb;
      color: #111827;
      font-size: 13px;
    }
    h1 {
      font-size: 18px;
      margin: 0 0 8px;
    }
    h2 {
      font-size: 15px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 4px 6px;
      font-size: 12px;
    }
    th {
      background: #f3f4f6;
      text-align: left;
    }
  </style>
</head>
<body>
  <h1>General Ledger – ${entityName}</h1>
  ${sections.join("")}
</body>
</html>`);
  win.document.close();
}


// ---------- Trial balance window ----------

function openTrialBalanceWindow() {
  // Open a popup window showing the running trial balance across all questions
  buildTrialBalanceFromSavedEntries();

  if (tbTotals.size === 0) {
    alert("No valid journal entries have been recorded for this session yet.");
    return;
  }

  const rows = [];
  tbTotals.forEach((totals, accountId) => {
    rows.push({
      accountId,
      name: nameForAccountId(accountId),
      debit: totals.debit,
      credit: totals.credit,
      code: totals.code || ""
    });
  });

  rows.sort((a, b) => a.accountId - b.accountId);

  let totalDr = 0;
  let totalCr = 0;

  rows.forEach(r => {
    const net = r.debit - r.credit;
    if (net > 0) totalDr += net;
    else if (net < 0) totalCr += -net;
  });

  const name = sessionStorage.getItem("studentName") || "(not provided)";
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();
  const ip = window.USER_IP || "not available";
  const questionsTried = triedQuestionIds.size;
  const scoreStr = `${totalCorrect}/${questionsTried || 0}`;

  // Prefix used to generate a hash (helps identify the submission instance)
  const preparedPrefix =
    `User: ${name} (score: ${scoreStr}, ${dateStr} ${timeStr}, IP: ${ip}, hash: `;

  const hash = hashCode(preparedPrefix);

  const entityName =
    (typeof exerciseConfig !== "undefined" && exerciseConfig.tbEntityName) ||
    "Trial Balance";

  const tbWindowTitle =
    (typeof exerciseConfig !== "undefined" && exerciseConfig.tbWindowTitle) ||
    entityName;

  const win = window.open("", "JournalTB", "width=550,height=650");
  if (!win) return;

  // Build trial balance rows with Code as first column, then Account name
  const tbRowsHtml = rows
    .map(r => {
      const net = r.debit - r.credit;
      let debitBalance = 0;
      let creditBalance = 0;
      if (net > 0) debitBalance = net;
      else if (net < 0) creditBalance = -net;

      return `<tr>
        <td>${r.code}</td>
        <td>${r.name}</td>
        <td class='num'>${debitBalance ? debitBalance.toLocaleString() : ""}</td>
        <td class='num'>${creditBalance ? creditBalance.toLocaleString() : ""}</td>
      </tr>`;
    })
    .join("");

  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${tbWindowTitle}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
      margin: 16px;
      background: #f9fafb;
      color: #111827;
      font-size: 13px;
    }
    h1 {
      font-size: 18px;
      margin: 0 0 8px;
    }
    p {
      font-size: 12px;
      color: #6b7280;
      margin: 0 0 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 4px 6px;
    }
    th {
      background: #f3f4f6;
      text-align: left;
    }
    th.num,
    td.num {
      text-align: right;
    }
    tfoot th {
      text-align: left;
    }
    .meta {
      margin-top: 10px;
      font-size: 11px;
      color: #4b5563;
    }
  </style>
</head>
<body>
  <h1>${entityName}</h1>
  <table>
    <thead>
      <tr>
        <th>Code</th>
        <th>Account</th>
        <th style="text-align: right;">Debit</th>
        <th style="text-align: right;">Credit</th>
      </tr>
    </thead>
    <tbody>
      ${tbRowsHtml}
    </tbody>
    <tfoot>
      <tr>
        <th colspan="2">Total</th>
        <th class="num">${totalDr.toLocaleString()}</th>
        <th class="num">${totalCr.toLocaleString()}</th>
      </tr>
    </tfoot>
  </table>
  ${
    Math.abs(totalDr - totalCr) > 0.01
      ? `<p style="color:#b91c1c;margin-top:8px;">
           Warning: total debits and credits in the trial balance do not match.
         </p>`
      : ""
  }
  <div class="meta">
${preparedPrefix}${hash})
  </div>
</body>
</html>`);
  win.document.close();
}


// ---------- Visual realignment of user rows ----------

function rearrangeVisibleRows() {
  // Group rows visually by debit/credit for easier reading
  const tbody = $("journal-rows");
  const rows = Array.from(tbody.querySelectorAll("tr"));

  const debits = [];
  const credits = [];
  const blanks = [];

  rows.forEach(tr => {
    const drInput = tr.querySelector(".dr-input");
    const crInput = tr.querySelector(".cr-input");
    const codeInput = tr.querySelector(".code-input");

    const drVal = drInput.value;
    const crVal = crInput.value;
    const code = codeInput.value.trim();

    const debit = drVal ? parseFloat(drVal) : 0;
    const credit = crVal ? parseFloat(crVal) : 0;

    if (!code && debit === 0 && credit === 0) {
      blanks.push(tr);
    } else if (debit > 0 && credit === 0) {
      debits.push(tr);
    } else if (credit > 0 && debit === 0) {
      credits.push(tr);
    } else {
      // Mixed or ambiguous rows are treated as debits for layout purposes
      debits.push(tr);
    }
  });

  tbody.innerHTML = "";

  const setIndent = (tr, px) => {
    const nameInput = tr.querySelector(".name-display");
    if (nameInput) nameInput.style.paddingLeft = px;
  };

  // Debits flush left
  debits.forEach(tr => {
    setIndent(tr, "0px");
    tbody.appendChild(tr);
  });

  // Credits slightly indented
  credits.forEach(tr => {
    setIndent(tr, "16px");
    tbody.appendChild(tr);
  });

  // Blank rows at the bottom, no indent
  blanks.forEach(tr => {
    setIndent(tr, "0px");
    tbody.appendChild(tr);
  });
}


// ---------- Grading ----------

function checkAnswer() {
  // Main grading function called when the student clicks "Submit journal entry"
  const q = journalQuestions[currentIndex];
  const needsEntry = q.requiresEntry !== false; // default: entry is required
  const user = getUserLines();
  const fb = $("feedback");

  const noEntryBox = $("no-entry-checkbox");
  const noEntryChosen = !!(noEntryBox && noEntryBox.checked);

  const hasAnyLines = user.length > 0;

  // Has this question ever been attempted before?
  const prevAttempts = attemptsByQuestion.get(q.id) || 0;

  // Persist checkbox state for this submission (used to restore on navigation)
  noEntryChosenByQuestion.set(q.id, noEntryChosen);

  // If "no entry" is checked AND there is at least one journal line → not allowed
  if (noEntryChosen && hasAnyLines) {
    fb.className = "feedback incorrect";
    fb.textContent =
      "You cannot check \"No journal entry is required\" and also enter journal lines. Choose one approach and try again.";
    feedbackByQuestion.set(q.id, {
      className: fb.className,
      text: fb.textContent
    });
    return;
  }

  // --- Only gate the *first* attempt ---
  if (prevAttempts === 0) {
    // For both transaction and non-transaction questions:
    // a real attempt means either journal lines OR "no entry" checked
    const isRealAttempt = hasAnyLines || noEntryChosen;

    if (!isRealAttempt) {
      // Instructional message only (no "Not correct"), and do not count this as an attempt
      fb.className = "feedback incorrect";
      fb.textContent =
        needsEntry
          ? "Enter at least one account code with a debit or credit amount, or choose \"No journal entry is required\" before submitting."
          : "Choose \"No journal entry is required\" or enter a journal entry before submitting.";
      feedbackByQuestion.set(q.id, {
        className: fb.className,
        text: fb.textContent
      });
      return;
    }
  }

  // From here on: either this is the first real attempt, or a later attempt.
  triedQuestionIds.add(q.id);
  rearrangeVisibleRows();

  // Save current user lines for this question (latest state)
  userEntriesByQuestion.set(
    q.id,
    user.map(line => ({
      code: line.code,
      debit: line.debit,
      credit: line.credit
    }))
  );

  const totalDr = user.reduce((s, r) => s + r.debit, 0);
  const totalCr = user.reduce((s, r) => s + r.credit, 0);

  const currentAttempts = prevAttempts + 1;
  attemptsByQuestion.set(q.id, currentAttempts);
  totalAttempted++;

  // ------------- Non‑transaction items (no journal entry is the conceptual focus) -------------
  if (!needsEntry) {
    if (noEntryChosen && !hasAnyLines) {
      // Correct: explicitly chose "no entry" and did not enter any lines
      const hadWrong = everWrongByQuestion.get(q.id) === true;
      const newScore = hadWrong ? 0.5 : 1.0; // partial if previously wrong
      perQuestionScore.set(q.id, newScore);

      fb.className = "feedback correct";
      fb.textContent =
        "Correct.\n" + (q.explanation || "");
    } else {
      // Any other combination is considered incorrect (e.g., entered lines, or left everything untouched on later attempts)
      perQuestionScore.set(q.id, 0);
      everWrongByQuestion.set(q.id, true);

      fb.className = "feedback incorrect";
      fb.textContent =
        "Review the concept carefully and try again.";
    }

    feedbackByQuestion.set(q.id, {
      className: fb.className,
      text: fb.textContent
    });

    // Recompute totalCorrect from all per-question scores
    totalCorrect = 0;
    perQuestionScore.forEach(v => {
      totalCorrect += v || 0;
    });

    const questionsTried = triedQuestionIds.size;
    const pctNon =
      questionsTried > 0
        ? ((totalCorrect / questionsTried) * 100).toFixed(1)
        : "0.0";

    $("score-summary").textContent =
      `Score: ${totalCorrect.toFixed(1)} / ${questionsTried} questions ` +
      `(${pctNon}% correct, with partial credit). ` +
      `Questions attempted: ${questionsTried}.`;

    return;
  }

  // ------------- Regular transaction grading (journal entry required) -------------

  const allAmountsZero =
    hasAnyLines &&
    user.every(r => r.debit === 0 && r.credit === 0);

  if (allAmountsZero) {
    fb.className = "feedback incorrect";
    fb.textContent =
      "You selected accounts but did not enter any debit or credit amounts.";
  } else if (!hasAnyLines) {
    fb.className = "feedback incorrect";
    if (noEntryChosen) {
      // Student chose "no entry" on a question that actually requires a journal entry
      perQuestionScore.set(q.id, 0);
      everWrongByQuestion.set(q.id, true);

      fb.textContent =
        "A journal entry is required; enter the appropriate accounts and amounts.";
    } else {
      // Student clicked submit with nothing entered (after the first gated attempt)
      fb.textContent =
        "Enter at least one account code with a debit or credit amount before submitting.";
    }
  } else if (user.some(r => r.accountId === null)) {
    fb.className = "feedback incorrect";
    fb.textContent =
      "One or more account IDs are not in the chart of accounts. Use the 3-digit codes shown in the chart window.";
  } else if (Math.abs(totalDr - totalCr) > 0.01) {
    perQuestionScore.set(q.id, 0);
    everWrongByQuestion.set(q.id, true);

    fb.className = "feedback incorrect";
    fb.textContent =
      "Debits and credits are not equal.\n" +
      `Total debits: ${totalDr.toFixed(2)}, total credits: ${totalCr.toFixed(
        2
      )}.`;
  } else {
    // Structure is valid; now compare against the model solution
    const isNowCorrect = journalsEqual(user, q.correctLines);

    if (isNowCorrect) {
      const hadWrong = everWrongByQuestion.get(q.id) === true;
      const newScore = hadWrong ? 0.5 : 1.0; // partial credit if they corrected a previous mistake
      perQuestionScore.set(q.id, newScore);

      fb.className = "feedback correct";
      fb.textContent = "Correct!";
    } else {
      // Balanced but accounts/amounts do not match the solution
      perQuestionScore.set(q.id, 0);
      everWrongByQuestion.set(q.id, true);

      fb.className = "feedback incorrect";
      fb.textContent = "Not correct.\n" + q.explanation;
    }
  }

  feedbackByQuestion.set(q.id, {
    className: fb.className,
    text: fb.textContent
  });

  // Recompute overall score summary after this question
  totalCorrect = 0;
  perQuestionScore.forEach(v => {
    totalCorrect += v || 0;
  });

  const questionsTried = triedQuestionIds.size;
  const pct =
    questionsTried > 0
      ? ((totalCorrect / questionsTried) * 100).toFixed(1)
      : "0.0";

  $("score-summary").textContent =
    `Score: ${totalCorrect.toFixed(1)} / ${questionsTried} questions ` +
    `(${pct}% correct, with partial credit). ` +
    `Questions attempted: ${questionsTried}.`;
}


// ---------- Navigation ----------

function nextQuestion() {
  // Move to the next question (wrap around) and re-render
  currentIndex = (currentIndex + 1) % journalQuestions.length;
  renderQuestion();
}

function prevQuestion() {
  // Move to the previous question (wrap around) and re-render
  currentIndex =
    (currentIndex - 1 + journalQuestions.length) % journalQuestions.length;
  renderQuestion();
}


// Clear entry: remove saved transaction and feedback for current question, do NOT restore later
function clearEntry() {
  const q = journalQuestions[currentIndex];

  userEntriesByQuestion.delete(q.id);
  perQuestionScore.set(q.id, 0);
  attemptsByQuestion.delete(q.id);
  everWrongByQuestion.delete(q.id);
  feedbackByQuestion.delete(q.id);
  noEntryChosenByQuestion.delete(q.id);

  const tbody = $("journal-rows");
  tbody.innerHTML = "";
  addRow("");
  addRow("");

  $("feedback").textContent = "";
  $("feedback").className = "feedback";

  const noEntryBox = $("no-entry-checkbox");
  if (noEntryBox) noEntryBox.checked = false;
}


// ---------- Login / startup ----------

function setupLoginAndStartup() {
  // Handles optional login overlay and then starts the main app
  const loginOverlay = document.getElementById("login-overlay");
  const mainApp = document.getElementById("main-app");
  const loginBtn = document.getElementById("login-btn");
  const nameInput = document.getElementById("student-name");
  const passInput = document.getElementById("password-input");
  const loginError = document.getElementById("login-error");

  const useLogin =
    !exerciseConfig || exerciseConfig.useLoginScreen !== false;

  const requiredPassword =
    (exerciseConfig && typeof exerciseConfig.loginPassword === "string")
      ? exerciseConfig.loginPassword
      : "KUBS";

  function startApp() {
    if (loginOverlay) loginOverlay.style.display = "none";
    if (mainApp) mainApp.style.display = "block";
    renderQuestion();
  }

  function attemptLogin() {
    const pw = (passInput && passInput.value || "").trim();
    const noPasswordRequired = requiredPassword === "";

    if (noPasswordRequired || pw === requiredPassword) {
      const nm = (nameInput && nameInput.value || "").trim();
      if (nm) {
        sessionStorage.setItem("studentName", nm);
      }
      startApp();
    } else {
      if (loginError) {
        loginError.textContent = "Incorrect password. Please try again!";
      }
      if (passInput) {
        passInput.value = "";
        passInput.focus();
      }
    }
  }

  if (!useLogin) {
    // Login screen disabled: show app immediately
    startApp();
    return;
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", attemptLogin);
  }
  if (passInput) {
    passInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") attemptLogin();
    });
  }
}


// ---------- Init ----------

window.addEventListener("DOMContentLoaded", () => {
  // Wire up all buttons once the DOM is ready
  $("add-row-btn").addEventListener("click", () => addRow(""));
  $("check-btn").addEventListener("click", checkAnswer);
  $("next-btn").addEventListener("click", nextQuestion);
  $("prev-btn").addEventListener("click", prevQuestion);
  $("clear-btn").addEventListener("click", clearEntry);

  const tbBtn = $("tb-btn");
  if (tbBtn) {
    tbBtn.addEventListener("click", () => {
      openTrialBalanceWindow();
    });
  }

  const ledgerBtn = $("ledger-btn");
  if (ledgerBtn) {
    ledgerBtn.addEventListener("click", () => {
      openFullLedgerWindow();
    });
  }

  const resetAllBtn = $("reset-all-btn");
  if (resetAllBtn) {
    resetAllBtn.addEventListener("click", () => {
      // Full reset of the session (for debugging or a clean restart)
      totalAttempted = 0;
      totalCorrect = 0;
      attemptsByQuestion.clear();
      triedQuestionIds.clear();
      perQuestionScore.clear();
      everWrongByQuestion.clear();
      feedbackByQuestion.clear();
      noEntryChosenByQuestion.clear();

      resetTrialBalance();
      userEntriesByQuestion.clear();
      $("score-summary").textContent = "";
      $("feedback").textContent = "";
      $("feedback").className = "feedback";
      currentIndex = 0;

      const noEntryBox = $("no-entry-checkbox");
      if (noEntryBox) noEntryBox.checked = false;

      renderQuestion();
    });
  }

  const footer = $("app-footer");
  if (footer) {
    const year = new Date().getFullYear();
    const footerText =
      (exerciseConfig && exerciseConfig.footerText) ||
      "For classroom use only. Do not redistribute.";
    const copyrightText =
      (exerciseConfig && exerciseConfig.copyright)
        || `© ${year} Jinhan Pae. All rights reserved.`;
    footer.innerHTML =
      `<span>${copyrightText}</span>
       <span>${footerText}</span>`;
  }

  // Ensure any lingering entries from a previous run are cleared
  userEntriesByQuestion.clear();

  // Titles & subtitles from config (main app + login)
  const appTitleEl = document.getElementById("app-title");
  const appSubtitleEl = document.getElementById("app-subtitle");
  const loginTitleEl = document.getElementById("login-title");
  const loginSubtitleEl = document.getElementById("login-subtitle");
  const loginButtonLabelEl = document.getElementById("login-button-label");

  if (typeof exerciseConfig !== "undefined") {
    if (appTitleEl) appTitleEl.textContent = exerciseConfig.appTitle || "Journal Entry Practice";
    if (appSubtitleEl) appSubtitleEl.textContent = exerciseConfig.subtitle || "";
    if (loginTitleEl) loginTitleEl.textContent = exerciseConfig.loginTitle || "Journal Entry Practice";
    if (loginSubtitleEl) loginSubtitleEl.textContent = exerciseConfig.loginPrompt || "";
    if (loginButtonLabelEl) loginButtonLabelEl.textContent = exerciseConfig.loginButtonLabel || "Start practice";
  }

  // Finally, either show login or start the app immediately
  setupLoginAndStartup();
});
