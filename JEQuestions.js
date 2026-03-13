// journalQuestions.js
// Emily’s Dental Practice – April transactions

const CURRENT_YEAR = new Date().getFullYear();

const journalQuestions = [
  {
    id: 1,
    date: `${CURRENT_YEAR}-04-01`,
    title: "Transaction (1). Investment by owner",
    description:
      "Emily invests €20,000 cash in her dental practice in exchange for ordinary shares.",
    correctLines: [
      { accountId: 101, debit: 20000, credit: 0 }, // Cash
      { accountId: 311, debit: 0, credit: 20000 }  // Share Capital—Ordinary
    ],
    explanation:
      "Cash increases (debit). Share Capital—Ordinary increases equity (credit)."
  },
  {
    id: 2,
    date: `${CURRENT_YEAR}-04-01`,
    title: "Transaction (2). Hiring an employee",
    description:
      "Emily hires a secretary‑receptionist at a salary of €700 per week, payable monthly. No work has been performed yet.",
    requiresEntry: false,
    correctLines: [],
    explanation:
      "Signing an employment agreement alone does not affect assets, liabilities, equity, revenue, or expenses, so no journal entry is recorded."
  },
  {
    id: 3,
    date: `${CURRENT_YEAR}-04-02`,
    title: "Transaction (3). Rent payment",
    description:
      "Paid office rent for the month, €1,100.",
    correctLines: [
      { accountId: 729, debit: 1100, credit: 0 }, // Rent Expense
      { accountId: 101, debit: 0, credit: 1100 }  // Cash
    ],
    explanation:
      "Rent Expense increases (debit), reducing equity. Cash decreases (credit)."
  },
  {
    id: 4,
    date: `${CURRENT_YEAR}-04-03`,
    title: "Transaction (4). Supplies on account",
    description:
      "Purchased dental supplies on account from Dazzle Company, €4,000.",
    correctLines: [
      { accountId: 126, debit: 4000, credit: 0 }, // Supplies
      { accountId: 201, debit: 0, credit: 4000 }  // Accounts Payable
    ],
    explanation:
      "Supplies (asset) increases, so debit Supplies. A liability to Dazzle arises, so credit Accounts Payable."
  },
  {
    id: 5,
    date: `${CURRENT_YEAR}-04-10`,
    title: "Transaction (5). Services billed to insurance",
    description:
      "Performed dental services and billed insurance companies, €5,100.",
    correctLines: [
      { accountId: 112, debit: 5100, credit: 0 }, // Accounts Receivable
      { accountId: 400, debit: 0, credit: 5100 }  // Service Revenue
    ],
    explanation:
      "Accounts Receivable (asset) increases because the insurance companies owe Emily. Service Revenue increases equity (credit)."
  },
  {
    id: 6,
    date: `${CURRENT_YEAR}-04-11`,
    title: "Transaction (6). Cash advance from patient",
    description:
      "Received €1,000 cash in advance from Leah Mataruka for an implant to be performed later.",
    correctLines: [
      { accountId: 101, debit: 1000, credit: 0 }, // Cash
      { accountId: 209, debit: 0, credit: 1000 }  // Unearned Service Revenue
    ],
    explanation:
      "Cash increases (debit). Because the service has not yet been performed, credit Unearned Service Revenue (a liability), not Service Revenue."
  },
  {
    id: 7,
    date: `${CURRENT_YEAR}-04-20`,
    title: "Transaction (7). Cash services",
    description:
      "Received €2,100 cash from Michael Santos for dental services performed.",
    correctLines: [
      { accountId: 101, debit: 2100, credit: 0 }, // Cash
      { accountId: 400, debit: 0, credit: 2100 }  // Service Revenue
    ],
    explanation:
      "Cash increases (debit). Because the services are performed now, credit Service Revenue."
  },
  {
    id: 8,
    date: `${CURRENT_YEAR}-04-30`,
    title: "Transaction (8). Salary payment",
    description:
      "Paid the secretary‑receptionist for the month, €2,800.",
    correctLines: [
      { accountId: 726, debit: 2800, credit: 0 }, // Salaries and Wages Expense
      { accountId: 101, debit: 0, credit: 2800 }  // Cash
    ],
    explanation:
      "Salaries and Wages Expense increases (debit) for the work done this month. Cash decreases (credit)."
  },
  {
    id: 9,
    date: `${CURRENT_YEAR}-04-30`,
    title: "Transaction (9). Payment to Dazzle on account",
    description:
      "Paid €2,400 to Dazzle Company for accounts payable due.",
    correctLines: [
      { accountId: 201, debit: 2400, credit: 0 }, // Accounts Payable
      { accountId: 101, debit: 0, credit: 2400 }  // Cash
    ],
    explanation:
      "Paying Dazzle reduces the liability: debit Accounts Payable. Cash decreases (credit). No new expense is recorded."
  }
];
