// JEChartOfAccounts.js
// beginningBalance: signed number in normal balance direction.
//   Assets, Expenses: positive = debit balance.
//   Liabilities, Equity, Revenue: negative = credit balance.
// If beginningBalance is omitted, it is treated as zero.

const chartOfAccounts = [
  // Assets (debit-normal → positive)
  { id: 101, code: "101", name: "Cash", type: "Asset", beginningBalance: 0 },  // 0 can be skipped
  { id: 112, code: "112", name: "Accounts Receivable", type: "Asset", beginningBalance: 0 },
  { id: 126, code: "126", name: "Supplies", type: "Asset", beginningBalance: 0 },

  // Liabilities (credit-normal → negative)
  { id: 201, code: "201", name: "Accounts Payable", type: "Liability", beginningBalance: -0 },  // -0 is zero
  { id: 209, code: "209", name: "Unearned Service Revenue", type: "Liability", beginningBalance: 0 },

  // Equity (credit-normal → negative)
  { id: 311, code: "311", name: "Share Capital–Ordinary", type: "Equity", beginningBalance: 0 },
  // Retained Earnings with zero beginning balance → no beginningBalance field
  { id: 320, code: "320", name: "Retained Earnings", type: "Equity" },

  // Revenue (credit-normal → negative, zero here)
  { id: 400, code: "400", name: "Service Revenue", type: "Revenue" },

  // Expenses (debit-normal → positive, zero here)
  { id: 710, code: "710", name: "Cost of Sales", type: "Expense" },
  { id: 726, code: "726", name: "Salaries and Wages Expense", type: "Expense" },
  { id: 729, code: "729", name: "Rent Expense", type: "Expense" },
  { id: 732, code: "732", name: "Supplies Expense", type: "Expense" },
  { id: 734, code: "734", name: "Utilities Expense", type: "Expense" },
  { id: 790, code: "790", name: "Income Tax Expense", type: "Expense" }
];
