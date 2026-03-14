// JEApp.js
// Generic journal entry practice engine for JE apps.
//
// Assumes these globals exist per exercise:
// - exerciseConfig (JEConfig.js)
// - journalQuestions (JEQuestions.js)
// - chartOfAccounts (JEChartOfAccounts.js)
//
// Question flags (defaults if omitted):
// - requiresEntry: true   (set false for “no entry required” items)
// - isAdjusting: false    (set true only for adjusting entries)
// - isClosing: false      (set true only for closing entries)

let currentIndex = 0;
let totalAttempted = 0;
let totalCorrect = 0;

const tbTotals = new Map();
const userEntriesByQuestion = new Map();
const attemptsByQuestion = new Map();
const triedQuestionIds = new Set();
const perQuestionScore = new Map();
const everWrongByQuestion = new Map();
const feedbackByQuestion = new Map();
const noEntryChosenByQuestion = new Map();

// Normalize question metadata and build a lookup map
const qById = new Map();
journalQuestions.forEach(q => {
  if (typeof q.requiresEntry === "undefined") q.requiresEntry = true;
  if (typeof q.isAdjusting === "undefined") q.isAdjusting = false;
  if (typeof q.isClosing === "undefined") q.isClosing = false;
  qById.set(q.id, q);
});

function $(id) { return document.getElementById(id); }

function hashCode(str) {
  let hash = 0;
  if (!str) return "0";
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return (hash >>> 0).toString(16);
}

function isTestMode() {
  return exerciseConfig && exerciseConfig.mode === "test";
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
  const q = journalQuestions[currentIndex];
  $("tx-title").textContent = q.title + (q.date ? ` (Date: ${q.date})` : "");
  $("tx-description").textContent = q.description;

  const tbody = $("journal-rows");
  tbody.innerHTML = "";

  const saved = userEntriesByQuestion.get(q.id);
  if (saved && saved.length > 0) {
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
      drInput.min = "0";
      drInput.oninput = function () {
        if (!this.value) return;
        if (parseFloat(this.value) < 0) this.value = Math.abs(parseFloat(this.value)).toString();
      };
      drInput.className = "dr-input";
      drInput.value = line.debit ? String(line.debit) : "";

      const crInput = document.createElement("input");
      crInput.type = "number";
      crInput.step = "0.01";
      crInput.min = "0";
      crInput.oninput = function () {
        if (!this.value) return;
        if (parseFloat(this.value) < 0) this.value = Math.abs(parseFloat(this.value)).toString();
      };
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

      updateNameForCodeInput(codeInput, nameInput);
      codeInput.addEventListener("input", () =>
        updateNameForCodeInput(codeInput, nameInput)
      );
    });
  } else {
    addRow("");
    addRow("");
  }

  const fb = $("feedback");
  fb.textContent = "";
  fb.className = "feedback";

  const savedFb = feedbackByQuestion.get(q.id);
  if (savedFb) {
    fb.className = savedFb.className;
    fb.textContent = savedFb.text;
  }

  const noEntryBox = $("no-entry-checkbox");
  if (noEntryBox) {
    const savedNoEntry = noEntryChosenByQuestion.get(q.id) || false;
    noEntryBox.checked = savedNoEntry;
  }

  rearrangeVisibleRows();

  const nextBtn = $("next-btn");
  const submitBtn = $("check-btn");
  if (nextBtn) nextBtn.classList.remove("next-highlight");
  if (submitBtn) submitBtn.classList.remove("next-inactive");
}

function addRow(initialCode = "") {
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
  drInput.min = "0";
  drInput.oninput = function () {
    if (!this.value) return;
    if (parseFloat(this.value) < 0) this.value = Math.abs(parseFloat(this.value)).toString();
  };
  drInput.className = "dr-input";

  const crInput = document.createElement("input");
  crInput.type = "number";
  crInput.step = "0.01";
  crInput.min = "0";
  crInput.oninput = function () {
    if (!this.value) return;
    if (parseFloat(this.value) < 0) this.value = Math.abs(parseFloat(this.value)).toString();
  };
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

  updateNameForCodeInput(codeInput, nameInput);
  codeInput.addEventListener("input", () =>
    updateNameForCodeInput(codeInput, nameInput)
  );
}

function updateNameForCodeInput(codeInput, nameInput) {
  const acc = findAccountByCode(codeInput.value);
  nameInput.value = acc ? acc.name : "";
}

// ---------- Collect user input & comparison ----------

function getUserLines() {
  const rows = Array.from(document.querySelectorAll("#journal-rows tr"));
  return rows
    .map(tr => {
      const code = tr.querySelector(".code-input").value.trim();
      const acc = findAccountByCode(code);
      const drVal = tr.querySelector(".dr-input").value;
      const crVal = tr.querySelector(".cr-input").value;
      const debit = drVal ? parseFloat(drVal) : 0;
      const credit = crVal ? parseFloat(crVal) : 0;
      if (!code && debit === 0 && credit === 0) return null;
      return { accountId: acc ? acc.id : null, code, debit, credit };
    })
    .filter(x => x !== null);
}

function journalsEqual(user, correct) {
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

// ---------- Trial balance helpers (sign-based, with modes) ----------

function buildTrialBalanceFromSavedEntries(mode = "adjusted") {
  tbTotals.clear();
  let begTotal = 0;

  chartOfAccounts.forEach(acc => {
    if (typeof acc.beginningBalance === "number" && acc.beginningBalance !== 0) {
      const bal = acc.beginningBalance;
      begTotal += bal;
      tbTotals.set(acc.id, { net: bal, code: acc.code });
    }
  });

  userEntriesByQuestion.forEach((savedLines, questionId) => {
    const q = qById.get(questionId);
    const isAdj = q && q.isAdjusting === true;
    const isClose = q && q.isClosing === true;

    let include = true;
    if (mode === "unadjusted") {
      include = !isAdj && !isClose;
    } else if (mode === "adjusted") {
      include = !isClose;
    } else if (mode === "postClosing") {
      include = true; // include all; filter temps later
    }
    if (!include) return;

    savedLines.forEach(line => {
      const acc = findAccountByCode(line.code);
      if (!acc) return;
      const prev = tbTotals.get(acc.id) || { net: 0, code: acc.code };
      const netChange = (line.debit || 0) - (line.credit || 0);
      tbTotals.set(acc.id, { net: prev.net + netChange, code: acc.code });
    });
  });

  window.JE_BEG_BALANCED_OK = Math.abs(begTotal) < 0.01;
}

function resetTrialBalance() {
  tbTotals.clear();
}

// ---------- Ledger helpers ----------

function buildLedgerFromSavedEntries() {
  const ledgerByAccount = new Map();

  chartOfAccounts.forEach(acc => {
    if (typeof acc.beginningBalance === "number" && acc.beginningBalance !== 0) {
      if (!ledgerByAccount.has(acc.id)) ledgerByAccount.set(acc.id, []);
    }
  });

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
  const ledgerByAccount = buildLedgerFromSavedEntries();
  if (ledgerByAccount.size === 0) {
    alert("No valid journal entries or beginning balances have been recorded for this session yet.");
    return;
  }

  const titleById = new Map();
  const dateById = new Map();
  journalQuestions.forEach(q => {
    if (q && q.id != null) {
      if (q.title) titleById.set(q.id, q.title);
      if (q.date) dateById.set(q.id, q.date);
    }
  });

  const entityName =
    (typeof exerciseConfig !== "undefined" && exerciseConfig.entityName) ||
    "Entity";

  const sections = [];
  const accountIds = Array.from(ledgerByAccount.keys()).sort((a, b) => a - b);

  accountIds.forEach(accountId => {
    const lines = ledgerByAccount.get(accountId) || [];
    const accountName = nameForAccountId(accountId) || "(Unknown account)";
    const accMeta = chartOfAccounts.find(a => a.id === accountId);
    const begBal =
      accMeta && typeof accMeta.beginningBalance === "number"
        ? accMeta.beginningBalance
        : 0;
    let runningBalance = begBal !== 0 ? begBal : 0;

    const rowPieces = [];
    if (begBal !== 0) {
      const displayBegBal =
        runningBalance > 0
          ? runningBalance.toLocaleString()
          : "(" + Math.abs(runningBalance).toLocaleString() + ")";
      rowPieces.push(`
        <tr>
          <td>Beginning balance</td>
          <td style="text-align:right;"></td>
          <td style="text-align:right;"></td>
          <td style="text-align:right;">${displayBegBal}</td>
        </tr>
      `);
    }

    lines.sort((a, b) => a.questionId - b.questionId);

    const transactionRows = lines
      .map(line => {
        runningBalance += (line.debit || 0) - (line.credit || 0);
        const baseLabel = titleById.get(line.questionId) || line.questionId || "";
        const qDate = dateById.get(line.questionId);
        const label = qDate ? `${qDate} – ${baseLabel}` : baseLabel;
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
      })
      .join("");

    const rowsHtml = rowPieces.join("") + transactionRows;
    const tableHtml = `
      <section style="margin-bottom: 24px;">
        <h2 style="font-size: 15px; margin: 16px 0 6px;">${accountName} (${accountId})</h2>
        <table>
          <thead>
            <tr>
              <th style="width:50%;">Transaction</th>
              <th style="width:15%; text-align:right;">Debit</th>
              <th style="width:15%; text-align:right;">Credit</th>
              <th style="width:20%; text-align:right;">Balance Dr (Cr)</th>
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
    h1 { font-size: 18px; margin: 0 0 8px; }
    h2 { font-size: 15px; }
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
    th { background: #f3f4f6; text-align: left; }
  </style>
</head>
<body>
  <h1>General Ledger – ${entityName}</h1>
  ${sections.join("")}
</body>
</html>`);
  win.document.close();
}

// ---------- Trial balance window (supports modes) ----------

function openTrialBalanceWindow(mode = "adjusted") {
  buildTrialBalanceFromSavedEntries(mode);

  if (tbTotals.size === 0) {
    alert("No valid journal entries have been recorded for this session yet.");
    return;
  }

  const rows = [];
  tbTotals.forEach((totals, accountId) => {
    const name = nameForAccountId(accountId);
    const accMeta = chartOfAccounts.find(a => a.id === accountId);
    const accType = accMeta ? accMeta.type : "";

    if (mode === "postClosing") {
      const isPermanent =
        accType === "Asset" ||
        accType === "Liability" ||
        accType === "Equity";
      if (!isPermanent) return;
    }

    rows.push({
      accountId,
      name,
      net: totals.net || 0,
      code: totals.code || "",
      type: accType
    });
  });

  rows.sort((a, b) => a.accountId - b.accountId);

  let totalDr = 0;
  let totalCr = 0;

  const tbRowsHtml = rows
    .map(r => {
      const net = r.net || 0;
      let debitBalance = "";
      let creditBalance = "";
      if (net > 0) {
        debitBalance = net.toLocaleString();
        totalDr += net;
      } else if (net < 0) {
        creditBalance = (-net).toLocaleString();
        totalCr += -net;
      }
      return `<tr>
        <td>${r.code}</td>
        <td>${r.name}</td>
        <td class='num'>${debitBalance}</td>
        <td class='num'>${creditBalance}</td>
      </tr>`;
    })
    .join("");

  const name = sessionStorage.getItem("studentName") || "(not provided)";
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();
  const ip = window.USER_IP || "not available";
  const questionsTried = triedQuestionIds.size;
  const scoreStr = `${totalCorrect}/${questionsTried || 0}`;
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
    h1 { font-size: 18px; margin: 0 0 8px; }
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
    th { background: #f3f4f6; text-align: left; }
    th.num, td.num { text-align: right; }
    tfoot th { text-align: left; }
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
  ${
    window.JE_BEG_BALANCED_OK === false
      ? `<p style="color:#b91c1c;margin-top:4px;">
           Warning: beginning balances themselves are not equal.
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
      debits.push(tr);
    }
  });

  tbody.innerHTML = "";

  const setIndent = (tr, px) => {
    const nameInput = tr.querySelector(".name-display");
    if (nameInput) nameInput.style.paddingLeft = px;
  };

  debits.forEach(tr => {
    setIndent(tr, "0px");
    tbody.appendChild(tr);
  });
  credits.forEach(tr => {
    setIndent(tr, "16px");
    tbody.appendChild(tr);
  });
  blanks.forEach(tr => {
    setIndent(tr, "0px");
    tbody.appendChild(tr);
  });
}

// ---------- Grading ----------

function checkAnswer() {
  const q = journalQuestions[currentIndex];
  const needsEntry = q.requiresEntry !== false;
  const user = getUserLines();
  const fb = $("feedback");

  const noEntryBox = $("no-entry-checkbox");
  const noEntryChosen = !!(noEntryBox && noEntryBox.checked);
  const hasAnyLines = user.length > 0;
  const prevAttempts = attemptsByQuestion.get(q.id) || 0;

  noEntryChosenByQuestion.set(q.id, noEntryChosen);

  const nextBtn = $("next-btn");
  const submitBtn = $("check-btn");
  if (nextBtn) nextBtn.classList.remove("next-highlight");
  if (submitBtn) submitBtn.classList.remove("next-inactive");

  if (prevAttempts === 0) {
    const isRealAttempt = hasAnyLines || noEntryChosen;
    if (!isRealAttempt) {
      fb.className = "feedback incorrect";
      fb.textContent =
        needsEntry
          ? "Enter at least one account code with a debit or credit amount, or choose \"No journal entry is required\" before submitting."
          : "Choose \"No journal entry is required\" or enter a journal entry before submitting.";
      feedbackByQuestion.set(q.id, { className: fb.className, text: fb.textContent });
      return;
    }
  }

  const hasNegative = user.some(r => r.debit < 0 || r.credit < 0);
  if (hasNegative) {
    fb.className = "feedback incorrect";
    fb.textContent =
      "Debit and credit amounts must be zero or positive. Negative amounts are not allowed in this exercise.";
    feedbackByQuestion.set(q.id, { className: fb.className, text: fb.textContent });
    return;
  }

  rearrangeVisibleRows();

  if (isTestMode()) {
    userEntriesByQuestion.set(
      q.id,
      user.map(line => ({ code: line.code, debit: line.debit, credit: line.credit }))
    );

    const totalDr = user.reduce((s, r) => s + r.debit, 0);
    const totalCr = user.reduce((s, r) => s + r.credit, 0);

    if (Math.abs(totalDr - totalCr) > 0.01) {
      fb.className = "feedback incorrect";
      fb.textContent =
        "Debits and credits are not equal.\n" +
        `Total debits: ${totalDr.toFixed(2)}, total credits: ${totalCr.toFixed(2)}.`;
      const scoreEl = $("score-summary");
      if (scoreEl) scoreEl.textContent = "";
      return;
    }

    fb.className = "feedback";
    fb.textContent = "";

    if (nextBtn) nextBtn.classList.add("next-highlight");
    if (submitBtn) submitBtn.classList.add("next-inactive");

    const scoreEl = $("score-summary");
    if (scoreEl) scoreEl.textContent = "";
    return;
  }

  if (noEntryChosen && hasAnyLines) {
    fb.className = "feedback incorrect";
    fb.textContent =
      "You cannot check \"No journal entry is required\" and also enter journal lines. Choose one approach and try again.";
    feedbackByQuestion.set(q.id, { className: fb.className, text: fb.textContent });
    return;
  }

  triedQuestionIds.add(q.id);

  userEntriesByQuestion.set(
    q.id,
    user.map(line => ({ code: line.code, debit: line.debit, credit: line.credit }))
  );

  const totalDr = user.reduce((s, r) => s + r.debit, 0);
  const totalCr = user.reduce((s, r) => s + r.credit, 0);

  const currentAttempts = prevAttempts + 1;
  attemptsByQuestion.set(q.id, currentAttempts);
  totalAttempted++;

  const hasAllZeroAmounts =
    hasAnyLines && user.every(r => r.debit === 0 && r.credit === 0);

  if (!needsEntry) {
    if (noEntryChosen && !hasAnyLines) {
      const hadWrong = everWrongByQuestion.get(q.id) === true;
      const newScore = hadWrong ? 0.5 : 1.0;
      perQuestionScore.set(q.id, newScore);

      fb.className = "feedback correct";
      fb.textContent =
        "Correct.\n" + (q.explanation || "");

      if (nextBtn) nextBtn.classList.add("next-highlight");
      if (submitBtn) submitBtn.classList.add("next-inactive");
    } else {
      perQuestionScore.set(q.id, 0);
      everWrongByQuestion.set(q.id, true);
      fb.className = "feedback incorrect";
      fb.textContent =
        "Review the concept carefully and try again.";
    }

    feedbackByQuestion.set(q.id, { className: fb.className, text: fb.textContent });

    totalCorrect = 0;
    perQuestionScore.forEach(v => { totalCorrect += v || 0; });

    const questionsTried2 = triedQuestionIds.size;
    const pctNon =
      questionsTried2 > 0
        ? ((totalCorrect / questionsTried2) * 100).toFixed(1)
        : "0.0";

    $("score-summary").textContent =
      `Score: ${totalCorrect.toFixed(1)} / ${questionsTried2} questions ` +
      `(${pctNon}% correct, with partial credit). ` +
      `Questions attempted: ${questionsTried2}.`;
    return;
  }

  if (hasAllZeroAmounts) {
    perQuestionScore.set(q.id, 0);
    everWrongByQuestion.set(q.id, true);
    fb.className = "feedback incorrect";
    fb.textContent =
      "No debit or credit amounts were entered.\n" +
      "Enter debit and credit amounts for the selected accounts.";
  } else if (!hasAnyLines) {
    fb.className = "feedback incorrect";
    if (noEntryChosen) {
      perQuestionScore.set(q.id, 0);
      everWrongByQuestion.set(q.id, true);
      fb.textContent =
        "A journal entry is required; enter the appropriate accounts and amounts.";
    } else {
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
      `Total debits: ${totalDr.toFixed(2)}, total credits: ${totalCr.toFixed(2)}.`;
  } else {
    const isNowCorrect = journalsEqual(user, q.correctLines);
    if (isNowCorrect) {
      const hadWrong = everWrongByQuestion.get(q.id) === true;
      const newScore = hadWrong ? 0.5 : 1.0;
      perQuestionScore.set(q.id, newScore);
      fb.className = "feedback correct";
      fb.textContent = "Correct!";
      if (nextBtn) nextBtn.classList.add("next-highlight");
      if (submitBtn) submitBtn.classList.add("next-inactive");
    } else {
      perQuestionScore.set(q.id, 0);
      everWrongByQuestion.set(q.id, true);
      fb.className = "feedback incorrect";
      fb.textContent = "Not correct.\n" + q.explanation;
    }
  }

  feedbackByQuestion.set(q.id, { className: fb.className, text: fb.textContent });

  totalCorrect = 0;
  perQuestionScore.forEach(v => { totalCorrect += v || 0; });

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

// ---------- Navigation / clear ----------

function nextQuestion() {
  currentIndex = (currentIndex + 1) % journalQuestions.length;
  renderQuestion();
}

function prevQuestion() {
  currentIndex = (currentIndex - 1 + journalQuestions.length) % journalQuestions.length;
  renderQuestion();
}

function clearEntry() {
  const q = journalQuestions[currentIndex];
  userEntriesByQuestion.delete(q.id);
  noEntryChosenByQuestion.delete(q.id);

  const tbody = $("journal-rows");
  tbody.innerHTML = "";
  addRow("");
  addRow("");

  const fb = $("feedback");
  fb.textContent = "";
  fb.className = "feedback";

  const noEntryBox = $("no-entry-checkbox");
  if (noEntryBox) noEntryBox.checked = false;

  const nextBtn = $("next-btn");
  const submitBtn = $("check-btn");
  if (nextBtn) nextBtn.classList.remove("next-highlight");
  if (submitBtn) submitBtn.classList.remove("next-inactive");
}

// ---------- Login / startup ----------

function setupLoginAndStartup() {
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

// ---------- Global IP fetch ----------

window.USER_IP = "not available";
fetch("https://api.ipify.org?format=json")
  .then(r => r.json())
  .then(d => {
    if (d && d.ip) {
      window.USER_IP = d.ip;
    }
  })
  .catch(() => {
    window.USER_IP = "not available";
  });

// ---------- Init ----------

window.addEventListener("DOMContentLoaded", () => {
  $("add-row-btn").addEventListener("click", () => addRow(""));
  $("check-btn").addEventListener("click", checkAnswer);
  $("next-btn").addEventListener("click", () => {
    const nextBtn = $("next-btn");
    const submitBtn = $("check-btn");
    if (nextBtn) nextBtn.classList.remove("next-highlight");
    if (submitBtn) submitBtn.classList.remove("next-inactive");
    nextQuestion();
  });
  $("prev-btn").addEventListener("click", prevQuestion);
  $("clear-btn").addEventListener("click", clearEntry);

  const tbBtn = $("tb-btn");
  if (tbBtn) {
    tbBtn.addEventListener("click", () => {
      openTrialBalanceWindow("adjusted");
    });
  }

  const tbUnadjBtn = $("tb-unadjusted-btn");
  if (tbUnadjBtn) {
    tbUnadjBtn.addEventListener("click", () => openTrialBalanceWindow("unadjusted"));
  }
  const tbAdjBtn = $("tb-adjusted-btn");
  if (tbAdjBtn) {
    tbAdjBtn.addEventListener("click", () => openTrialBalanceWindow("adjusted"));
  }
  const tbPostBtn = $("tb-postclosing-btn");
  if (tbPostBtn) {
    tbPostBtn.addEventListener("click", () => openTrialBalanceWindow("postClosing"));
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

      const fb = $("feedback");
      if (fb) {
        fb.textContent = "";
        fb.className = "feedback";
      }
      const scoreEl = $("score-summary");
      if (scoreEl) scoreEl.textContent = "";

      const noEntryBox = $("no-entry-checkbox");
      if (noEntryBox) noEntryBox.checked = false;

      const nextBtn2 = $("next-btn");
      const submitBtn2 = $("check-btn");
      if (nextBtn2) nextBtn2.classList.remove("next-highlight");
      if (submitBtn2) submitBtn2.classList.remove("next-inactive");

      currentIndex = 0;
      renderQuestion();
    });
  }

  const chartBtn = $("open-chart-btn");
  if (chartBtn) {
    chartBtn.addEventListener("click", () => {
      window.open("JEChart.html", "COAWindow", "width=500,height=500");
    });
  }

  const footer = $("app-footer");
  if (footer) {
    const year = new Date().getFullYear();
    const footerText =
      (exerciseConfig && exerciseConfig.footerText) ||
      "For classroom use only. Do not redistribute.";
    const copyrightText =
      (exerciseConfig && exerciseConfig.copyright) ||
      `© ${year} Instructor. All rights reserved.`;
    footer.innerHTML =
      `<span>${copyrightText}</span>
       <span>${footerText}</span>`;
  }

  userEntriesByQuestion.clear();

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

  setupLoginAndStartup();
});
