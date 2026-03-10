// journalChartOfAccounts.js
// Chart of accounts for the current exercise (Emily’s Dental Practice example)

const chartOfAccounts = [
  // Assets
  { id: 101, code: "101", name: "Cash", type: "Asset" },
  { id: 112, code: "112", name: "Accounts Receivable", type: "Asset" },
  { id: 126, code: "126", name: "Supplies", type: "Asset" },

  // Liabilities
  { id: 201, code: "201", name: "Accounts Payable", type: "Liability" },
  { id: 209, code: "209", name: "Unearned Service Revenue", type: "Liability" },

  // Equity
  { id: 311, code: "311", name: "Share Capital—Ordinary", type: "Equity" },
  { id: 320, code: "320", name: "Retained Earnings", type: "Equity" },

  // Revenue
  { id: 400, code: "400", name: "Service Revenue", type: "Revenue" },

  // Expenses
  { id: 710, code: "710", name: "Cost of Sales", type: "Expense" },
  { id: 726, code: "726", name: "Salaries and Wages Expense", type: "Expense" },
  { id: 729, code: "729", name: "Rent Expense", type: "Expense" },
  { id: 732, code: "732", name: "Supplies Expense", type: "Expense" },
  { id: 734, code: "734", name: "Utilities Expense", type: "Expense" },
  { id: 790, code: "726", name: "Income Tax Expense", type: "Expense" }
];
