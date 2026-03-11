// exerciseConfig.js
// Global configuration for a specific exercise.
// Swap this file (and the chart/questions files) to reuse the app.

const exerciseConfig = {
  // High-level app labels
  appTitle: "Journal Entry Practice – Emily’s Dental Practice (P2.2)",
  subtitle: "Journal entries for April transactions (1)–(9). Enter 3‑digit account codes.",

  // Entity / exercise name for reports (trial balance, chart of accounts, general ledger, etc.)
  entityName: "Emily’s Dental Practice",
  chartWindowTitle: "Chart of Accounts – Emily’s Dental Practice",
  tbWindowTitle: "Trial Balance – Emily’s Dental Practice",
  tbEntityName: "Emily’s Dental Practice Trial Balance",

  // Login / initial screen
  // If false → skip overlay and show app immediately.
  useLoginScreen: true,
  loginTitle: "Journal Entry Practice – Emily’s Dental Practice",
  loginPrompt: "Enter your name (optional) and password to begin.",
  // If empty string "" → no password required (just click Start).
  loginPassword: "KUBS",
  loginButtonLabel: "Start",

  // Footer
  // © 2026 Jinhan Pae. All rights reserved. | footerText
  copyright:
    "© " + new Date().getFullYear() + " Jinhan Pae. All rights reserved.",
  footerText: "For Korea University classroom use only. Do not redistribute."
};
