// journalApp.js
// Generic journal entry practice engine

let currentIndex = 0;
let totalAttempted = 0;          // total times "Submit journal entry" clicked
let totalCorrect = 0;            // total points earned (recomputed)

// Running totals for a trial balance (by accountId) – built fresh on demand
const tbTotals = new Map();

// Store user entries per question so they persist when navigating
const userEntriesByQuestion = new Map();

// Track attempts per question ID
const attemptsByQuestion = new Map();

// Questions that have been tried at least once (used for denominator)
const triedQuestionIds = new Set();

// Per-question score based on latest result (0 or 0.5 or 1)
const perQuestionScore = new Map();

// Questions that have had at least one wrong attempt
const everWrongByQuestion = new Map();

// Store feedback state per question so it shows on revisit
const feedbackByQuestion = new Map();

// ---------- Simple helper ----------

function $(id) {
  return document.getElementById(id);
}

function hashCode(str) {
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
  const q = journalQuestions[currentIndex];

  $("tx-title").textContent =
    q.title + (q.date ? ` (Date: ${q.date})` : "");
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
    noEntryBox.checked = false;
  }

  rearrangeVisibleRows();
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
  tbTotals.clear();

  userEntriesByQuestion.forEach(savedLines => {
    savedLines.forEach(line => {
      const acc = findAccountByCode(line.code);
      if (!acc) return;

      const prev = tbTotals.get(acc.id) || { debit: 0, credit: 0 };
      tbTotals.set(acc.id, {
        debit: prev.debit + (line.debit || 0),
        credit: prev.credit + (line.credit || 0)
      });
    });
  });
}

function resetTrialBalance() {
  tbTotals.clear();
}

function openTrialBalanceWindow() {
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
      credit: totals.credit
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

  const preparedPrefix =
    `User: ${name} (score: ${scoreStr}, ${dateStr} ${timeStr}, IP: ${ip}, hash: `;

  const hash = hashCode(preparedPrefix);

  const entityName =
    (typeof exerciseConfig !== "undefined" && exerciseConfig.tbEntityName) ||
    "Trial Balance";

  const tbWindowTitle =
    (typeof exerciseConfig !== "undefined" && exerciseConfig.tbWindowTitle) ||
    entityName;

  const win = window.open("", "JournalTB", "width=500,height=650");
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
        <th>Account</th>
        <th style="text-align: right;">Debit</th>
        <th style="text-align: right;">Credit</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(r => {
          const net = r.debit - r.credit;
          let debitBalance = 0;
          let creditBalance = 0;
          if (net > 0) debitBalance = net;
          else if (net < 0) creditBalance = -net;

          return `<tr>
            <td>${r.name}</td>
            <td class="num">${debitBalance ? debitBalance.toLocaleString() : ""}</td>
            <td class="num">${creditBalance ? creditBalance.toLocaleString() : ""}</td>
          </tr>`;
        })
        .join("")}
    </tbody>
    <tfoot>
      <tr>
        <th>Total</th>
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
  const needsEntry = q.requiresEntry !== false; // default true
  const user = getUserLines();
  const fb = $("feedback");

  const noEntryBox = $("no-entry-checkbox");
  const noEntryChosen = !!(noEntryBox && noEntryBox.checked);

  const hasAnyLines = user.length > 0;

  // Has this question ever been attempted before?
  const prevAttempts = attemptsByQuestion.get(q.id) || 0;

  // If "no entry" is checked AND there is at least one journal line → not allowed
  if (noEntryChosen && hasAnyLines) {
    fb.className = "feedback incorrect";
    fb.textContent =
      "Not correct. You cannot check \"No journal entry is required\" and also enter journal lines. Choose one approach and try again.";
    feedbackByQuestion.set(q.id, {
      className: fb.className,
      text: fb.textContent
    });
    return;
  }

  // --- Only gate the *first* attempt ---
  if (prevAttempts === 0) {
    const isRealAttempt =
      (needsEntry && (hasAnyLines || noEntryChosen)) ||
      (!needsEntry && noEntryChosen);

    if (!isRealAttempt) {
      fb.className = "feedback incorrect";
      fb.textContent =
        needsEntry
          ? "Enter at least one account code with a debit or credit amount before submitting."
          : "Not correct. Review the concept carefully and try again.";
      feedbackByQuestion.set(q.id, {
        className: fb.className,
        text: fb.textContent
      });
      return;
    }
  }

  // From here on: either this is the first real attempt, or later attempts.
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

  // ------------- Non‑transaction items -------------
  if (!needsEntry) {
    if (noEntryChosen && !hasAnyLines) {
      const hadWrong = everWrongByQuestion.get(q.id) === true;
      const newScore = hadWrong ? 0.5 : 1.0;
      perQuestionScore.set(q.id, newScore);

      fb.className = "feedback correct";
      fb.textContent =
        "Correct.\n" + (q.explanation || "");
    } else {
      perQuestionScore.set(q.id, 0);
      everWrongByQuestion.set(q.id, true);

      fb.className = "feedback incorrect";
      fb.textContent =
        "Not correct. Review the concept carefully and try again.";
    }

    feedbackByQuestion.set(q.id, {
      className: fb.className,
      text: fb.textContent
    });

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

  // ------------- Regular transaction grading -------------

  const allAmountsZero =
    hasAnyLines &&
    user.every(r => r.debit === 0 && r.credit === 0);

  if (allAmountsZero) {
    fb.className = "feedback incorrect";
    fb.textContent =
      "Not correct. You selected accounts but did not enter any debit or credit amounts.";
  } else if (!hasAnyLines) {
    fb.className = "feedback incorrect";
    if (noEntryChosen) {
      perQuestionScore.set(q.id, 0);
      everWrongByQuestion.set(q.id, true);

      fb.textContent =
        "Not correct. A journal entry is required; enter the appropriate accounts and amounts.";
    } else {
      fb.textContent =
        "Not correct. Enter at least one account code with a debit or credit amount before submitting.";
    }
  } else if (user.some(r => r.accountId === null)) {
    fb.className = "feedback incorrect";
    fb.textContent =
      "One or more account IDs are not in the chart of accounts. " +
      "Use the 3-digit codes shown in the chart window.";
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
    const isNowCorrect = journalsEqual(user, q.correctLines);

    if (isNowCorrect) {
      const hadWrong = everWrongByQuestion.get(q.id) === true;
      const newScore = hadWrong ? 0.5 : 1.0;
      perQuestionScore.set(q.id, newScore);

      fb.className = "feedback correct";
      fb.textContent = "Correct!";
    } else {
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
  currentIndex = (currentIndex + 1) % journalQuestions.length;
  renderQuestion();
}

function prevQuestion() {
  currentIndex =
    (currentIndex - 1 + journalQuestions.length) % journalQuestions.length;
  renderQuestion();
}

// Clear entry: remove saved transaction, do NOT restore later
function clearEntry() {
  const q = journalQuestions[currentIndex];

  userEntriesByQuestion.delete(q.id);
  perQuestionScore.set(q.id, 0);
  attemptsByQuestion.delete(q.id);
  everWrongByQuestion.delete(q.id);
  feedbackByQuestion.delete(q.id);

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

  setupLoginAndStartup();
});
