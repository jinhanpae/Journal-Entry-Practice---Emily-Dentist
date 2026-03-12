// journalChart.js
// Builds the chart-of-accounts table in the popup window.
// Uses global exerciseConfig and chartOfAccounts.

document.addEventListener("DOMContentLoaded", () => {
  const title =
    typeof exerciseConfig !== "undefined" && exerciseConfig.chartWindowTitle
      ? exerciseConfig.chartWindowTitle
      : "Chart of Accounts";

  const titleEl = document.getElementById("chart-title");
  const subtitleEl = document.getElementById("chart-subtitle");

  if (titleEl) {
    titleEl.textContent = title;
  }
  if (subtitleEl) {
    subtitleEl.textContent =
      "Use these 3-digit codes when entering journal entries.";
  }

  const tbody = document.querySelector("#chart-table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (Array.isArray(chartOfAccounts)) {
    chartOfAccounts.forEach(acc => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${acc.code}</td>
        <td>${acc.name}</td>
        <td>${acc.type}</td>
      `;
      tbody.appendChild(tr);
    });
  }
});
