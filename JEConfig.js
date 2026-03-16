// JEConfig.js
// Global configuration for this specific exercise (Emily’s Dental Practice P2.2).

const exerciseConfig = {
  // App labels
  appTitle: "Journal Entry Practice – Emily's Dental Practice",
  subtitle: "April transactions and events  (P2.2).",

  // Entity / report labels
  entityName: "Emily's Dental Practice",
  chartWindowTitle: "Chart of Accounts – Emily's Dental Practice",
  tbWindowTitle: "Trial Balance",
  tbEntityName: "Emily's Dental Practice – Trial Balance",

  // Mode: "exercise" (feedback & grading) or "test" (no feedback / grading)
  mode: "exercise",
  // mode: "test",

  // Login / initial screen
  useLoginScreen: true,
  loginTitle: "Journal Entry Practice",
  loginSubtitle: "Emily’s Dental Practice.",
  loginPrompt: "Enter your name (optional) and password to begin.",
  // Empty string = no password required
  loginPassword: "KUBS",
  loginButtonLabel: "Start",

  // Footer
  footerText: "For Korea University classroom use only. Do not redistribute.",
  copyright:
    `© ${new Date().getFullYear()} Jinhan Pae. All rights reserved.`
};
