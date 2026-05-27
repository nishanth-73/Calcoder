"use client";

import { useState, useMemo } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { ToolLayout } from "@/components/layout/ToolLayout";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { Banknote, DollarSign, Percent, Calendar, PiggyBank, TrendingUp, ArrowUpRight, Table, Home } from "lucide-react";

type CurrencyCode = "USD" | "INR" | "EUR" | "GBP" | "AED" | "CAD" | "AUD" | "JPY" | "SGD" | "CNY" | "MYR" | "ZAR";

interface CurrencyConfig {
  code: CurrencyCode;
  label: string;
  symbol: string;
  locale: string;
}

const CURRENCIES: CurrencyConfig[] = [
  { code: "USD", label: "USD ($)", symbol: "$", locale: "en-US" },
  { code: "INR", label: "INR (₹)", symbol: "₹", locale: "en-IN" },
  { code: "EUR", label: "EUR (€)", symbol: "€", locale: "de-DE" },
  { code: "GBP", label: "GBP (Â£)", symbol: "Â£", locale: "en-GB" },
  { code: "AED", label: "AED (Ø¯.Ø¥)", symbol: "Ø¯.Ø¥", locale: "ar-AE" },
  { code: "CAD", label: "CAD (C$)", symbol: "C$", locale: "en-CA" },
  { code: "AUD", label: "AUD (A$)", symbol: "A$", locale: "en-AU" },
  { code: "JPY", label: "JPY (Â¥)", symbol: "Â¥", locale: "ja-JP" },
  { code: "SGD", label: "SGD (S$)", symbol: "S$", locale: "en-SG" },
  { code: "CNY", label: "CNY (Â¥)", symbol: "Â¥", locale: "zh-CN" },
  { code: "MYR", label: "MYR (RM)", symbol: "RM", locale: "ms-MY" },
  { code: "ZAR", label: "ZAR (R)", symbol: "R", locale: "en-ZA" },
];

const MIN_LOAN = 1000;
const MAX_LOAN = 10000000;
const MIN_RATE = 0.5;
const MAX_RATE = 30;
const MIN_YEARS = 1;
const MAX_YEARS = 40;

const PIE_COLORS = ["#2563eb", "#f59e0b"];

function getCurrencyConfig(code: CurrencyCode): CurrencyConfig {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

function formatCurrency(value: number, currency: CurrencyCode): string {
  if (!Number.isFinite(value) || value < 0) {
    const cfg = getCurrencyConfig(currency);
    return `${cfg.symbol}0`;
  }
  const cfg = getCurrencyConfig(currency);
  try {
    return new Intl.NumberFormat(cfg.locale, {
      style: "currency",
      currency: cfg.code,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${cfg.symbol}${Math.round(value).toLocaleString()}`;
  }
}

function formatCompact(value: number, currency: CurrencyCode): string {
  if (!Number.isFinite(value)) return "0";
  const abs = Math.abs(value);
  const cfg = getCurrencyConfig(currency);
  const sym = cfg.symbol;

  if (currency === "INR") {
    if (abs >= 10000000) return `${sym}${(value / 10000000).toFixed(1)}Cr`;
    if (abs >= 100000) return `${sym}${(value / 100000).toFixed(1)}L`;
    if (abs >= 1000) return `${sym}${(value / 1000).toFixed(0)}K`;
    return formatCurrency(value, currency);
  }

  if (abs >= 1000000000) return `${sym}${(value / 1000000000).toFixed(1)}B`;
  if (abs >= 1000000) return `${sym}${(value / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${sym}${(value / 1000).toFixed(0)}K`;
  return formatCurrency(value, currency);
}

function formatPercent(value: number): string {
  return `${(Math.round(value * 1000) / 10).toFixed(1)}%`;
}

interface EMIResults {
  emi: number;
  totalInterest: number;
  totalPayment: number;
  principal: number;
  interestRatio: number;
  chartData: { year: string; Balance: number }[];
  barData: { year: string; Principal: number; Interest: number }[];
  yearlyData: { year: number; principalPaid: number; interestPaid: number; balance: number }[];
}

function calculateEMI(
  loanAmount: number,
  annualRate: number,
  years: number
): EMIResults {
  if (!Number.isFinite(loanAmount) || !Number.isFinite(annualRate) || !Number.isFinite(years)) {
    return { emi: 0, totalInterest: 0, totalPayment: 0, principal: 0, interestRatio: 0, chartData: [], barData: [], yearlyData: [] };
  }

  const clampedLoan = Math.max(0, Math.min(loanAmount, MAX_LOAN));
  const clampedRate = Math.max(0, Math.min(annualRate, MAX_RATE));
  const clampedYears = Math.max(0, Math.min(years, MAX_YEARS));

  if (clampedLoan <= 0 || clampedYears <= 0) {
    return { emi: 0, totalInterest: 0, totalPayment: 0, principal: clampedLoan, interestRatio: 0, chartData: [], barData: [], yearlyData: [] };
  }

  const monthlyRate = clampedRate / 12 / 100;
  const months = clampedYears * 12;

  let emi: number;
  if (clampedRate === 0) {
    emi = clampedLoan / months;
  } else {
    emi = (clampedLoan * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  }

  const totalPayment = emi * months;
  const totalInterest = Math.max(0, totalPayment - clampedLoan);

  const interestRatio = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0;

  const chartData: EMIResults["chartData"] = [{ year: "Start", Balance: clampedLoan }];
  const barData: EMIResults["barData"] = [];
  const yearlyData: EMIResults["yearlyData"] = [];

  let balance = clampedLoan;
  for (let y = 1; y <= clampedYears; y++) {
    let yearPrincipal = 0;
    let yearInterest = 0;

    for (let m = 1; m <= 12; m++) {
      if (balance <= 0) break;
      const interest = balance * monthlyRate;
      const principal = Math.min(emi - interest, balance);
      yearInterest += interest;
      yearPrincipal += principal;
      balance -= principal;
    }

    chartData.push({ year: `Yr ${y}`, Balance: Math.round(Math.max(0, balance)) });
    barData.push({
      year: `Yr ${y}`,
      Principal: Math.round(yearPrincipal),
      Interest: Math.round(yearInterest),
    });
    yearlyData.push({
      year: y,
      principalPaid: Math.round(yearPrincipal),
      interestPaid: Math.round(yearInterest),
      balance: Math.round(Math.max(0, balance)),
    });
  }

  return {
    emi: Math.round(emi),
    totalInterest: Math.round(totalInterest),
    totalPayment: Math.round(totalPayment),
    principal: clampedLoan,
    interestRatio,
    chartData,
    barData,
    yearlyData,
  };
}

function ChartTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white border border-border rounded-xl shadow-xl p-4 text-sm space-y-2">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{formatCurrency(entry.value, currency)}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload, currency }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0];
  return (
    <div className="bg-white border border-border rounded-xl shadow-xl p-3 text-sm">
      <p className="font-medium">{data.name}: {formatCurrency(data.value, currency)}</p>
    </div>
  );
}

export default function EMICalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const { value: loanAmount, displayValue: loanAmountDisplay, setValue: setLoanAmount, handleChange: handleLoanChange, handleFocus: handleLoanFocus, handleBlur: handleLoanBlur } = useNumericField(500000);
  const { value: interestRate, displayValue: interestRateDisplay, setValue: setInterestRate, handleChange: handleRateChange, handleFocus: handleRateFocus, handleBlur: handleRateBlur } = useNumericField(8.5);
  const { value: tenureYears, displayValue: tenureYearsDisplay, setValue: setTenureYears, handleChange: handleYearsChange, handleFocus: handleYearsFocus, handleBlur: handleYearsBlur } = useNumericField(20);
  const [showTable, setShowTable] = useState(false);

  const results = useMemo(
    () => calculateEMI(loanAmount, interestRate, tenureYears),
    [loanAmount, interestRate, tenureYears]
  );

  const { emi, totalInterest, totalPayment, principal, interestRatio, chartData, barData, yearlyData } = results;

  const pieData = useMemo(
    () => [
      { name: "Principal", value: principal },
      { name: "Total Interest", value: totalInterest },
    ],
    [principal, totalInterest]
  );

  const showPie = totalInterest > 0;

  const inputRangeClass =
    "w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer";

  return (
    <ToolLayout
      title="EMI Calculator"
      description="Calculate your Equated Monthly Installment (EMI) for home loans, car loans, or personal loans. Enter loan amount, interest rate, and tenure to see monthly payments, total interest, and full amortization schedule."
      category="finance"
      faqContent={[
        {
          question: "What is an EMI (Equated Monthly Installment)?",
          answer: "An Equated Monthly Installment (EMI) is a fixed payment amount made by a borrower to a lender at a specified date each calendar month. EMIs are used to pay off both interest and principal each month so that over a specified number of years, the loan is fully paid off. Each EMI covers the interest due for that month plus a portion of the principal amount.",
        },
        {
          question: "How is EMI calculated?",
          answer: "EMI is calculated using the formula: EMI = [P × r × (1+r)^n] / [(1+r)^n - 1], where P is the loan amount, r is the monthly interest rate (annual rate divided by 12), and n is the number of monthly installments. This formula ensures each payment is equal while the proportion of interest and principal changes over time.",
        },
        {
          question: "What is an amortization schedule?",
          answer: "An amortization schedule is a complete table of periodic loan payments, showing the amount of principal and the amount of interest that comprise each payment until the loan is paid off at the end of its term. Early payments consist of more interest than principal, while later payments have more principal and less interest - this is called 'front-loaded' interest.",
        },
        {
          question: "How does loan tenure affect my EMI?",
          answer: "Longer loan tenures reduce your monthly EMI but increase the total interest paid over the life of the loan. For example, a $500,000 loan at 8% for 10 years has an EMI of ~$6,066 and total interest of ~$227,986. The same loan for 30 years has an EMI of ~$3,668 but total interest of ~$820,484 - more than 3.5 times the interest!",
        },
        {
          question: "What factors affect my EMI amount?",
          answer: "Three main factors determine your EMI: (1) Loan amount - higher loans mean higher EMIs, (2) Interest rate - higher rates increase both EMI and total interest, (3) Loan tenure - longer tenures reduce EMI but increase total interest. Some lenders also charge processing fees or prepayment penalties that can affect the effective cost of the loan.",
        },
        {
          question: "Should I choose a shorter or longer loan tenure?",
          answer: "Choose a shorter tenure if you can afford higher monthly payments - you will pay significantly less total interest. Choose a longer tenure if you need lower monthly payments for cash flow reasons, but be aware of the much higher total interest cost. A good strategy is to choose the shortest tenure you can comfortably afford.",
        },
        {
          question: "What is the difference between flat rate and reducing balance?",
          answer: "Flat rate interest is calculated on the original loan amount for the entire tenure, resulting in higher total interest. Reducing balance (or 'diminishing') interest is calculated on the outstanding principal, which decreases as you make payments. All standard loans (home, car, personal) use the reducing balance method. The calculator uses the reducing balance method.",
        },
        {
          question: "Can I prepay my loan to reduce interest?",
          answer: "Yes, prepaying your loan reduces the outstanding principal, which reduces the total interest you pay. However, some lenders charge prepayment penalties, especially for fixed-rate loans. Many floating-rate home loans in India allow prepayment without penalty. Use the calculator to see how much interest you can save by making prepayments.",
        },
        {
          question: "What is the impact of a higher down payment?",
          answer: "A higher down payment reduces your loan amount, which directly reduces both your EMI and total interest. For example, on a $500,000 property, a 20% down payment ($100,000) means a $400,000 loan vs a 10% down payment ($50,000) means a $450,000 loan. The larger down payment saves thousands in interest over the loan term.",
        },
        {
          question: "How does credit score affect my EMI?",
          answer: "Your credit score directly impacts the interest rate lenders offer you. A higher credit score (750+) typically qualifies you for lower interest rates, which means lower EMIs and less total interest. For example, a 1% difference in interest rate on a $500,000, 20-year loan can save or cost you approximately $60 per month and $15,000 in total interest.",
        },
      ]}
      explanationContent={
        <div className="prose prose-slate max-w-none">
          <h2>What is an EMI Calculator?</h2>
          <p>
            An <strong>EMI (Equated Monthly Installment) calculator</strong> is a financial planning tool that helps you estimate your monthly loan payments. By entering the loan amount, interest rate, and tenure, you can instantly see your monthly EMI, total interest payable, and the complete amortization schedule. It is essential for planning home loans, car loans, personal loans, and any other type of installment loan.
          </p>

          <h3>The EMI Formula</h3>
          <p>The calculator uses the standard reducing balance EMI formula:</p>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
            EMI = [P × r × (1+r)<sup>n</sup>] / [(1+r)<sup>n</sup> - 1]
          </pre>
          <p>Where:</p>
          <ul>
            <li><strong>P</strong> = Loan amount (principal)</li>
            <li><strong>r</strong> = Monthly interest rate (annual rate ÷ 12 ÷ 100)</li>
            <li><strong>n</strong> = Number of monthly installments (tenure in years × 12)</li>
          </ul>
          <p>For <strong>zero-interest loans</strong> (r = 0), the formula simplifies to: <strong>EMI = P / n</strong></p>

          <h3>Benefits of Using an EMI Calculator</h3>
          <ul>
            <li><strong>Budget Planning:</strong> Know exactly how much you need to set aside each month for your loan payments, helping you manage your monthly budget effectively.</li>
            <li><strong>Interest Cost Awareness:</strong> See the true cost of borrowing - the total interest you will pay over the full loan term often surprises borrowers and encourages better loan choices.</li>
            <li><strong>Tenure Comparison:</strong> Easily compare how different tenures affect your monthly payment and total interest cost, helping you choose the optimal balance.</li>
            <li><strong>Rate Comparison:</strong> Quickly compare offers from different lenders by plugging in their interest rates and seeing the exact EMI difference.</li>
            <li><strong>Prepayment Planning:</strong> Understand how extra payments or prepayments reduce your total interest and shorten your loan tenure.</li>
          </ul>

          <h3>Example Calculation</h3>
          <p><strong>Scenario:</strong> You take a home loan of $500,000 at 8.5% annual interest for 20 years.</p>
          <ul>
            <li><strong>Loan Amount:</strong> $500,000</li>
            <li><strong>Interest Rate:</strong> 8.5% per annum</li>
            <li><strong>Loan Tenure:</strong> 20 years (240 months)</li>
            <li><strong>Monthly EMI:</strong> ≈ $4,340</li>
            <li><strong>Total Interest:</strong> ≈ $541,491</li>
            <li><strong>Total Payment:</strong> ≈ $1,041,491</li>
          </ul>
          <p>Over 20 years, you will pay more in interest ($541,491) than the original loan amount ($500,000). The total cost of the loan is over $1 million. This illustrates why choosing the right loan terms and making prepayments can save you substantial money.</p>

          <h3>Understanding Amortization</h3>
          <p>Loan amortization is the process of gradually paying off a loan through regular payments. In the early years:</p>
          <ul>
            <li>A large portion of each EMI goes toward <strong>interest</strong></li>
            <li>Only a small portion goes toward <strong>principal reduction</strong></li>
            <li>Over time, this ratio reverses - more goes to principal, less to interest</li>
          </ul>
          <p>This is why making extra payments early in the loan term has a much greater impact on reducing total interest than later payments.</p>

          <h3>Common Mistakes to Avoid</h3>
          <ul>
            <li><strong>Focusing only on the EMI:</strong> A lower EMI from a longer tenure seems attractive, but you pay much more total interest. Always check the total payment amount, not just the EMI.</li>
            <li><strong>Ignoring processing fees and hidden charges:</strong> Loan processing fees, documentation charges, and prepayment penalties add to the effective cost. Factor these into your decision.</li>
            <li><strong>Not comparing multiple lenders:</strong> Even a 0.5% difference in interest rate can save or cost you thousands over the life of the loan. Shop around for the best rate.</li>
            <li><strong>Choosing floating rate without understanding risk:</strong> Floating rates can increase over time, raising your EMI. Ensure you have buffer room in your budget for potential rate hikes.</li>
            <li><strong>Overborrowing:</strong> Lenders may approve a higher loan than you can comfortably afford. A general guideline is that your EMI should not exceed 30-40% of your monthly income.</li>
          </ul>

          <h3>Tips for Managing Your Loan</h3>
          <ul>
            <li><strong>Make prepayments when possible:</strong> Extra payments directly reduce the principal and save future interest. Even one extra EMI payment per year can reduce your loan tenure by 2-3 years.</li>
            <li><strong>Choose a shorter tenure if affordable:</strong> A 15-year loan instead of 20 years may increase your EMI by 15-20%, but can reduce total interest by 30-40%.</li>
            <li><strong>Improve your credit score:</strong> A good credit score (750+) qualifies you for lower interest rates. Pay all bills on time, keep credit utilization low, and avoid multiple loan applications.</li>
            <li><strong>Consider a balance transfer:</strong> If interest rates have dropped or your credit score has improved, transferring your loan to another lender at a lower rate can save significant interest.</li>
            <li><strong>Use windfalls wisely:</strong> Apply bonuses, tax refunds, or inheritance toward your loan principal. Early prepayments have the greatest impact on reducing total interest.</li>
          </ul>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            {/* Currency Selector */}
            <div>
              <label htmlFor="emi-currency" className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <Banknote className="w-4 h-4 text-primary" />
                Currency
              </label>
              <select id="emi-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>

            {/* Loan Amount */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <DollarSign className="w-4 h-4 text-primary" />
                <span>Loan Amount</span>
                <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(loanAmount, currency)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={loanAmountDisplay}
                  onChange={(e) => handleLoanChange(e.target.value)}
                  onFocus={handleLoanFocus}
                  onBlur={handleLoanBlur}
                  className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="Enter amount"
                />
              </div>
              <input
                id="emi-loan"
                type="range"
                min={MIN_LOAN}
                max={MAX_LOAN}
                step={1000}
                value={loanAmount}
                onChange={(e) => setLoanAmount(parseFloat(e.target.value))}
                className={inputRangeClass}
                aria-valuemin={MIN_LOAN}
                aria-valuemax={MAX_LOAN}
                aria-valuenow={loanAmount}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(MIN_LOAN, currency)}</span>
                <span>{formatCurrency(MAX_LOAN, currency)}</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Percent className="w-4 h-4 text-primary" />
                <span>Interest Rate (p.a.)</span>
                <span className="ml-auto text-lg font-bold text-primary">{interestRate}%</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={interestRateDisplay}
                    onChange={(e) => handleRateChange(e.target.value)}
                    onFocus={handleRateFocus}
                    onBlur={handleRateBlur}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="Enter rate"
                  />
                </div>
                <span className="text-muted-foreground font-medium text-sm">%</span>
              </div>
              <input
                id="emi-rate"
                type="range"
                min={MIN_RATE}
                max={MAX_RATE}
                step={0.1}
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                className={inputRangeClass}
                aria-valuemin={MIN_RATE}
                aria-valuemax={MAX_RATE}
                aria-valuenow={interestRate}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MIN_RATE}%</span>
                <span>{MAX_RATE}%</span>
              </div>
            </div>

            {/* Loan Tenure */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Calendar className="w-4 h-4 text-primary" />
                <span>Loan Tenure</span>
                <span className="ml-auto text-lg font-bold text-primary">{tenureYears} {tenureYears === 1 ? "Year" : "Years"}</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={tenureYearsDisplay}
                  onChange={(e) => handleYearsChange(e.target.value)}
                  onFocus={handleYearsFocus}
                  onBlur={handleYearsBlur}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="Enter years"
                />
              </div>
              <input
                id="emi-years"
                type="range"
                min={MIN_YEARS}
                max={MAX_YEARS}
                step={1}
                value={tenureYears}
                onChange={(e) => setTenureYears(parseFloat(e.target.value))}
                className={inputRangeClass}
                aria-valuemin={MIN_YEARS}
                aria-valuemax={MAX_YEARS}
                aria-valuenow={tenureYears}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MIN_YEARS} Year</span>
                <span>{MAX_YEARS} Years</span>
              </div>
            </div>
          </div>

          {/* Results Cards */}
          <div className="space-y-4">
            {/* Monthly EMI Hero Card */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Home className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground font-medium">Monthly EMI</p>
              </div>
              <p className="text-4xl font-extrabold text-primary break-words">{formatCurrency(emi, currency)}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <ArrowUpRight className="w-4 h-4 text-amber-500" />
                <span>{interestRatio.toFixed(1)}% of total payment is interest</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-border rounded-xl p-3 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1">Principal</p>
                <p className="text-sm font-bold break-words">{formatCurrency(principal, currency)}</p>
              </div>
              <div className="bg-white border border-border rounded-xl p-3 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1">Total Interest</p>
                <p className="text-sm font-bold text-amber-500 break-words">{formatCurrency(totalInterest, currency)}</p>
              </div>
              <div className="bg-white border border-border rounded-xl p-3 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1">Total Payment</p>
                <p className="text-sm font-bold break-words">{formatCurrency(totalPayment, currency)}</p>
              </div>
            </div>

            {showPie && (
              <div className="bg-white border border-border rounded-xl p-6">
                <div className="flex items-center justify-center h-36">
                  <ResponsiveContainer initialDimension={{width:100,height:100}} width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={38} outerRadius={62}
                        dataKey="value"
                        animationBegin={100}
                        animationDuration={800}
                      >
                        {pieData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip currency={currency} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 text-xs ml-2">
                    {pieData.map((entry, idx) => (
                      <div key={entry.name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PIE_COLORS[idx] }} />
                        <span className="text-muted-foreground">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Loan Amount</p>
                    <p className="text-sm font-semibold">{formatCurrency(principal, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Total Interest</p>
                    <p className="text-sm font-semibold text-amber-500">{formatCurrency(totalInterest, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Total Payment</p>
                    <p className="text-sm font-semibold">{formatCurrency(totalPayment, currency)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart: Balance Over Time */}
        {chartData.length > 0 && (
          <div className="bg-white border border-border rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Loan Balance Over Time
              </h3>
            </div>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer initialDimension={{width:100,height:100}} width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="emiBalanceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="year" fontSize={11} tickMargin={8} />
                  <YAxis tickFormatter={(v: number) => formatCompact(v, currency)} fontSize={11} width={60} />
                  <Tooltip content={<ChartTooltip currency={currency} />} />
                  <Area
                    type="monotone"
                    dataKey="Balance"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fill="url(#emiBalanceGrad)"
                    dot={false}
                    animationDuration={1200}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Chart: Principal vs Interest Per Year */}
        {barData.length > 0 && (
          <div className="bg-white border border-border rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Principal vs Interest Per Year
              </h3>
            </div>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer initialDimension={{width:100,height:100}} width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="year" fontSize={11} tickMargin={8} />
                  <YAxis tickFormatter={(v: number) => formatCompact(v, currency)} fontSize={11} width={60} />
                  <Tooltip content={<ChartTooltip currency={currency} />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  />
                  <Bar dataKey="Principal" fill="#2563eb" radius={[4, 4, 0, 0]} animationDuration={1000} />
                  <Bar dataKey="Interest" fill="#f59e0b" radius={[4, 4, 0, 0]} animationDuration={1200} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Yearly Table Toggle */}
        {yearlyData.length > 0 && (
          <div className="bg-white border border-border rounded-xl p-4 sm:p-6">
            <button
              onClick={() => setShowTable(!showTable)}
              className="flex items-center gap-2 text-lg font-bold mb-2 hover:text-primary transition-colors"
              aria-expanded={showTable}
            >
              <Table className="w-5 h-5 text-primary" />
              Amortization Schedule (Yearly)
              <span className={`ml-auto text-sm font-normal text-muted-foreground transition-transform ${showTable ? "rotate-180" : ""}`}>
                {showTable ? "Hide" : "Show"}
              </span>
            </button>
            {showTable && (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Year</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Principal Paid</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Interest Paid</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyData.map((row) => (
                      <tr key={row.year} className="border-b border-border/50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2 font-medium">Year {row.year}</td>
                        <td className="text-right py-3 px-2 text-primary">{formatCurrency(row.principalPaid, currency)}</td>
                        <td className="text-right py-3 px-2 text-amber-500">{formatCurrency(row.interestPaid, currency)}</td>
                        <td className="text-right py-3 px-2 font-semibold">{formatCurrency(row.balance, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
