"use client";

import { useState, useMemo } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { ToolLayout } from "@/components/layout/ToolLayout";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Banknote, DollarSign, Percent, Calendar, PiggyBank, TrendingUp, ArrowUpRight, Table, Zap, Clock } from "lucide-react";

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
const MIN_EXTRA = 0;
const MAX_EXTRA = 10000;

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

interface LoanRepaymentResults {
  standardEMI: number;
  standardTotalInterest: number;
  standardTotalPayment: number;
  withExtraEMI: number;
  withExtraTotalInterest: number;
  withExtraTotalPayment: number;
  extraMonthly: number;
  interestSaved: number;
  monthsSaved: number;
  standardMonths: number;
  actualMonths: number;
  standardChartData: { year: string; Balance: number }[];
  extraChartData: { year: string; Balance: number }[];
  standardBarData: { year: string; Principal: number; Interest: number }[];
  extraBarData: { year: string; Principal: number; Interest: number }[];
  standardYearlyData: { year: number; principalPaid: number; interestPaid: number; balance: number }[];
  extraYearlyData: { year: number; principalPaid: number; interestPaid: number; balance: number }[];
}

function calculateLoanRepayment(
  loanAmount: number,
  annualRate: number,
  years: number,
  extraMonthly: number
): LoanRepaymentResults {
  if (!Number.isFinite(loanAmount) || !Number.isFinite(annualRate) || !Number.isFinite(years) || !Number.isFinite(extraMonthly)) {
    return {
      standardEMI: 0, standardTotalInterest: 0, standardTotalPayment: 0,
      withExtraEMI: 0, withExtraTotalInterest: 0, withExtraTotalPayment: 0,
      extraMonthly: 0, interestSaved: 0, monthsSaved: 0, standardMonths: 0, actualMonths: 0,
      standardChartData: [], extraChartData: [], standardBarData: [], extraBarData: [],
      standardYearlyData: [], extraYearlyData: [],
    };
  }

  const clampedLoan = Math.max(0, Math.min(loanAmount, MAX_LOAN));
  const clampedRate = Math.max(0, Math.min(annualRate, MAX_RATE));
  const clampedYears = Math.max(0, Math.min(years, MAX_YEARS));
  const clampedExtra = Math.max(0, Math.min(extraMonthly, MAX_EXTRA));

  if (clampedLoan <= 0 || clampedYears <= 0) {
    return {
      standardEMI: 0, standardTotalInterest: 0, standardTotalPayment: 0,
      withExtraEMI: 0, withExtraTotalInterest: 0, withExtraTotalPayment: 0,
      extraMonthly: 0, interestSaved: 0, monthsSaved: 0, standardMonths: 0, actualMonths: 0,
      standardChartData: [], extraChartData: [], standardBarData: [], extraBarData: [],
      standardYearlyData: [], extraYearlyData: [],
    };
  }

  const monthlyRate = clampedRate / 12 / 100;
  const totalMonths = clampedYears * 12;

  let standardEMI: number;
  if (clampedRate === 0) {
    standardEMI = clampedLoan / totalMonths;
  } else {
    standardEMI = (clampedLoan * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
  }

  const standardTotalPayment = standardEMI * totalMonths;
  const standardTotalInterest = Math.max(0, standardTotalPayment - clampedLoan);

  const withExtraEMI = standardEMI + clampedExtra;

  // Simulate standard amortization
  const standardChartData: LoanRepaymentResults["standardChartData"] = [];
  const standardBarData: LoanRepaymentResults["standardBarData"] = [];
  const standardYearlyData: LoanRepaymentResults["standardYearlyData"] = [];

  let balanceStd = clampedLoan;
  for (let y = 1; y <= clampedYears; y++) {
    let yearPrincipal = 0;
    let yearInterest = 0;
    for (let m = 1; m <= 12; m++) {
      if (balanceStd <= 0) break;
      const interest = balanceStd * monthlyRate;
      const principal = Math.min(standardEMI - interest, balanceStd);
      yearInterest += interest;
      yearPrincipal += principal;
      balanceStd -= principal;
    }
    standardChartData.push({ year: `Yr ${y}`, Balance: Math.round(Math.max(0, balanceStd)) });
    standardBarData.push({
      year: `Yr ${y}`,
      Principal: Math.round(yearPrincipal),
      Interest: Math.round(yearInterest),
    });
    standardYearlyData.push({
      year: y,
      principalPaid: Math.round(yearPrincipal),
      interestPaid: Math.round(yearInterest),
      balance: Math.round(Math.max(0, balanceStd)),
    });
  }

  // Simulate amortization with extra payment
  const extraChartData: LoanRepaymentResults["extraChartData"] = [];
  const extraBarData: LoanRepaymentResults["extraBarData"] = [];
  const extraYearlyData: LoanRepaymentResults["extraYearlyData"] = [];

  let balanceExtra = clampedLoan;
  let actualMonthCount = 0;
  let maxSimMonths = totalMonths;
  let depleted = false;

  for (let y = 1; y <= clampedYears && !depleted; y++) {
    let yearPrincipal = 0;
    let yearInterest = 0;
    for (let m = 1; m <= 12; m++) {
      if (balanceExtra <= 0) { depleted = true; break; }
      actualMonthCount++;
      const interest = balanceExtra * monthlyRate;
      const totalPayment = Math.min(withExtraEMI, balanceExtra + interest);
      const principal = Math.max(0, totalPayment - interest);
      yearInterest += interest;
      yearPrincipal += principal;
      balanceExtra -= principal;
    }
    extraChartData.push({ year: `Yr ${y}`, Balance: Math.round(Math.max(0, balanceExtra)) });
    extraBarData.push({
      year: `Yr ${y}`,
      Principal: Math.round(yearPrincipal),
      Interest: Math.round(yearInterest),
    });
    extraYearlyData.push({
      year: y,
      principalPaid: Math.round(yearPrincipal),
      interestPaid: Math.round(yearInterest),
      balance: Math.round(Math.max(0, balanceExtra)),
    });
    if (balanceExtra <= 0) break;
  }

  // If extra payments didn't finish early, use full tenure
  if (!depleted) actualMonthCount = totalMonths;

  const withExtraTotalPayment = standardEMI * actualMonthCount + clampedExtra * actualMonthCount;
  const withExtraTotalInterest = Math.max(0, withExtraTotalPayment - clampedLoan);
  const interestSaved = Math.max(0, standardTotalInterest - withExtraTotalInterest);
  const monthsSaved = Math.max(0, totalMonths - actualMonthCount);

  return {
    standardEMI: Math.round(standardEMI),
    standardTotalInterest: Math.round(standardTotalInterest),
    standardTotalPayment: Math.round(standardTotalPayment),
    withExtraEMI: Math.round(withExtraEMI),
    withExtraTotalInterest: Math.round(withExtraTotalInterest),
    withExtraTotalPayment: Math.round(withExtraTotalPayment),
    extraMonthly: clampedExtra,
    interestSaved: Math.round(interestSaved),
    monthsSaved,
    standardMonths: totalMonths,
    actualMonths: actualMonthCount,
    standardChartData,
    extraChartData,
    standardBarData,
    extraBarData,
    standardYearlyData,
    extraYearlyData,
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

export default function LoanRepaymentCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const { value: loanAmount, displayValue: loanAmountDisplay, setValue: setLoanAmount, handleChange: handleLoanChange, handleFocus: handleLoanFocus, handleBlur: handleLoanBlur } = useNumericField(500000);
  const { value: interestRate, displayValue: interestRateDisplay, setValue: setInterestRate, handleChange: handleRateChange, handleFocus: handleRateFocus, handleBlur: handleRateBlur } = useNumericField(7);
  const { value: tenureYears, displayValue: tenureYearsDisplay, setValue: setTenureYears, handleChange: handleYearsChange, handleFocus: handleYearsFocus, handleBlur: handleYearsBlur } = useNumericField(20);
  const { value: extraPayment, displayValue: extraPaymentDisplay, setValue: setExtraPayment, handleChange: handleExtraChange, handleFocus: handleExtraFocus, handleBlur: handleExtraBlur } = useNumericField(200);
  const [showTable, setShowTable] = useState(false);

  const results = useMemo(
    () => calculateLoanRepayment(loanAmount, interestRate, tenureYears, extraPayment),
    [loanAmount, interestRate, tenureYears, extraPayment]
  );

  const {
    standardEMI, standardTotalInterest, standardTotalPayment,
    withExtraEMI, withExtraTotalInterest, withExtraTotalPayment,
    extraMonthly, interestSaved, monthsSaved, standardMonths, actualMonths,
    standardChartData, extraChartData, standardBarData, extraBarData,
    standardYearlyData, extraYearlyData,
  } = results;

  const standardPieData = useMemo(
    () => [
      { name: "Principal", value: loanAmount },
      { name: "Total Interest", value: standardTotalInterest },
    ],
    [loanAmount, standardTotalInterest]
  );

  const extraPieData = useMemo(
    () => [
      { name: "Principal", value: loanAmount },
      { name: "Total Interest", value: withExtraTotalInterest },
    ],
    [loanAmount, withExtraTotalInterest]
  );

  const hasExtra = extraMonthly > 0;
  const interestRatioStd = standardTotalPayment > 0 ? (standardTotalInterest / standardTotalPayment) * 100 : 0;
  const interestRatioExtra = withExtraTotalPayment > 0 ? (withExtraTotalInterest / withExtraTotalPayment) * 100 : 0;

  const mergedChartData = useMemo(() => {
    const maxLen = Math.max(standardChartData.length, extraChartData.length);
    const merged: { year: string; Standard: number; WithExtra: number }[] = [];
    for (let i = 0; i < maxLen; i++) {
      merged.push({
        year: standardChartData[i]?.year || extraChartData[i]?.year || `Yr ${i}`,
        Standard: standardChartData[i]?.Balance ?? 0,
        WithExtra: extraChartData[i]?.Balance ?? 0,
      });
    }
    return merged;
  }, [standardChartData, extraChartData]);

  const inputRangeClass =
    "w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer";

  return (
    <ToolLayout
      title="Loan Repayment Calculator"
      description="Calculate your loan repayment schedule with amortization analysis. See how extra monthly payments reduce your total interest and shorten your loan tenure with detailed charts and comparisons."
      category="finance"
      faqContent={[
        {
          question: "How does making extra payments help?",
          answer: "Extra payments directly reduce your loan principal, which means less interest accrues in future months. Even small extra payments ($50-200/month) can save thousands in interest and shorten your loan by years. This is because the extra payment goes entirely toward principal reduction, skipping the interest portion that regular EMI payments include.",
        },
        {
          question: "What is the difference between this and the EMI calculator?",
          answer: "The EMI calculator shows your standard monthly payment and total interest. This Loan Repayment Calculator goes further by showing the complete amortization schedule and allowing you to compare standard repayment vs making extra payments. It shows exactly how much interest and time you can save with extra payments.",
        },
        {
          question: "How much should I pay extra each month?",
          answer: "Any amount helps, but a common guideline is to pay an extra 5-10% of your EMI each month. For a $2,000 EMI, that is $100-200 extra. Even one extra full EMI payment per year can reduce a 20-year loan by 4-5 years. Use the calculator to experiment with different extra payment amounts and see the impact.",
        },
        {
          question: "Are there any penalties for prepaying my loan?",
          answer: "Many lenders charge prepayment penalties, especially for fixed-rate loans. However, floating-rate home loans in many countries (including India) allow prepayment without penalty. Always check your loan agreement before making extra payments. Some lenders limit how much you can prepay annually without penalty.",
        },
        {
          question: "Is it better to make extra payments or invest the money?",
          answer: "Compare your loan interest rate with potential investment returns. If your loan rate is 8% and you expect investment returns of 10%, investing may be better. But paying off a loan is a guaranteed, tax-free return equal to your interest rate. For high-interest debts (credit cards, personal loans), paying extra is almost always the better choice.",
        },
        {
          question: "How does making extra payments early help more?",
          answer: "Interest is calculated on the outstanding balance. Early in your loan, the balance is highest, so more of your EMI goes to interest. Extra payments made early reduce the principal when it matters most - they prevent years of future interest from accruing. An extra payment in year 1 saves 5-10x more interest than the same payment in year 15.",
        },
        {
          question: "What is a lump sum prepayment?",
          answer: "A lump sum prepayment is a one-time extra payment toward your principal, such as from a bonus or tax refund. The calculator handles regular monthly extra payments, but lump sum prepayments work similarly - they reduce principal and save future interest. You can approximate a lump sum by dividing it by your remaining months and adding it as extra monthly payment.",
        },
        {
          question: "How does loan refinancing compare to extra payments?",
          answer: "Refinancing lowers your interest rate, reducing both EMI and total interest. Extra payments keep your current rate but accelerate repayment. Refinancing is better when rates have dropped significantly (1-2%+). Extra payments are better when rates are already competitive or you want to avoid refinancing costs.",
        },
        {
          question: "What happens if I miss a loan payment?",
          answer: "Missing a payment can result in late fees, a negative impact on your credit score, and potential default. If you miss a payment, your lender may add the missed amount to your outstanding balance, increasing future interest. Set up auto-payments and maintain an emergency fund to avoid missed payments.",
        },
        {
          question: "Can I reduce my loan tenure instead of my EMI?",
          answer: "Yes, when you make extra payments, you have two options: (1) Keep the same EMI and shorten the tenure - this saves the most interest, or (2) Keep the same tenure and reduce the EMI - this provides immediate cash flow relief. The calculator uses option 1 (shorter tenure with same EMI), which maximizes interest savings.",
        },
      ]}
      explanationContent={
        <div className="prose prose-slate max-w-none">
          <h2>What is a Loan Repayment Calculator?</h2>
          <p>
            A <strong>loan repayment calculator</strong> is a comprehensive financial tool that shows the complete amortization schedule for your loan, including how extra payments can save you money. Unlike a basic EMI calculator, this tool helps you understand the long-term cost of borrowing and the powerful impact of making additional principal payments.
          </p>

          <h3>How Loan Repayment Works</h3>
          <p>Each monthly payment consists of two parts: interest and principal. The standard EMI formula:</p>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
            EMI = [P × r × (1+r)<sup>n</sup>] / [(1+r)<sup>n</sup> - 1]
          </pre>
          <p>When you make an extra payment:</p>
          <ul>
            <li>The <strong>entire extra amount</strong> goes toward principal reduction</li>
            <li>Future <strong>interest is calculated on the lower balance</strong></li>
            <li>Your loan is paid off <strong>faster</strong> (shorter tenure)</li>
            <li>You pay <strong>significantly less total interest</strong></li>
          </ul>
          <p>The calculator simulates two scenarios in parallel: standard repayment and repayment with extra monthly payments.</p>

          <h3>Benefits of Using This Calculator</h3>
          <ul>
            <li><strong>See the True Cost:</strong> Understand exactly how much interest you will pay over the full loan term - it often exceeds the principal for long-term loans.</li>
            <li><strong>Compare Scenarios:</strong> See side-by-side comparisons of standard repayment versus accelerated repayment with extra payments.</li>
            <li><strong>Optimize Extra Payments:</strong> Experiment with different extra payment amounts to find the sweet spot between cash flow and interest savings.</li>
            <li><strong>Plan Prepayments:</strong> Use the visualization to understand how extra payments early in the loan term have the greatest impact.</li>
            <li><strong>Make Informed Decisions:</strong> Decide whether to make extra payments, refinance, or invest based on concrete numbers from the comparison.</li>
          </ul>

          <h3>Example Calculation</h3>
          <p><strong>Scenario:</strong> You have a $500,000 home loan at 7% interest for 20 years. You decide to pay an extra $200 per month.</p>
          <ul>
            <li><strong>Standard EMI:</strong> ~$3,877</li>
            <li><strong>Standard Total Interest:</strong> ~$430,387</li>
            <li><strong>With Extra $200/month:</strong> New total payment = $4,077/month</li>
            <li><strong>New Total Interest:</strong> ~$334,563</li>
            <li><strong>Interest Saved:</strong> ~$95,824</li>
            <li><strong>Time Saved:</strong> ~4 years and 8 months</li>
          </ul>
          <p>By paying just $200 extra each month (about 5% more), you save nearly $96,000 in interest and finish your loan almost 5 years early. This demonstrates the powerful effect of even modest extra payments.</p>

          <h3>When to Make Extra Payments vs Invest</h3>
          <p>The decision depends on your loan rate and expected investment returns:</p>
          <ul>
            <li><strong>High-interest debt (8%+):</strong> Always prioritize extra payments. The guaranteed return of reducing debt exceeds typical conservative investment returns.</li>
            <li><strong>Moderate interest (4-8%):</strong> Consider a balanced approach. Make some extra payments while also investing for long-term growth.</li>
            <li><strong>Low interest (below 4%):</strong> Investing may be better. After-tax investment returns could exceed the low cost of borrowing.</li>
          </ul>

          <h3>Common Mistakes to Avoid</h3>
          <ul>
            <li><strong>Not having an emergency fund:</strong> Before making extra loan payments, ensure you have 3-6 months of expenses saved. Don't tie up all your cash in illiquid loan prepayments.</li>
            <li><strong>Ignoring prepayment penalties:</strong> Some loans charge fees for early repayment. Calculate whether the interest savings outweigh the penalty before making extra payments.</li>
            <li><strong>Making extra payments irregularly:</strong> Setting up automatic extra payments ensures consistency. Manual extra payments are easy to forget or skip.</li>
            <li><strong>Neglecting higher-interest debt:</strong> If you have multiple loans, always prioritize the highest interest rate first (debt avalanche method) for maximum savings.</li>
            <li><strong>Not recalculating after rate changes:</strong> If you have a floating-rate loan, recalculate after rate changes. A lower rate may reduce the benefit of extra payments, while a higher rate increases it.</li>
          </ul>

          <h3>Tips for Accelerating Loan Repayment</h3>
          <ul>
            <li><strong>Use windfalls for principal reduction:</strong> Apply tax refunds, bonuses, or inheritance directly to your loan principal. These lump sum payments have an outsized impact on interest savings.</li>
            <li><strong>Switch to bi-weekly payments:</strong> Making half your EMI every two weeks results in 26 half-payments = 13 full payments per year instead of 12. This effectively makes one extra payment annually without feeling the pinch.</li>
            <li><strong>Round up your EMI:</strong> Round your EMI to the nearest hundred. A $3,877 EMI rounded to $3,900 adds only $23/month but saves thousands in interest over the loan term.</li>
            <li><strong>Review annually:</strong> Revisit your loan strategy each year. As your income grows, increase your extra payment amount. Even small annual increases compound into significant savings.</li>
            <li><strong>Consider a shorter initial tenure:</strong> If you can afford the payments, choosing a 15-year loan instead of 20-30 years when taking the loan locks in a faster payoff and lower interest rate.</li>
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
              <label htmlFor="lr-currency" className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <Banknote className="w-4 h-4 text-primary" />
                Currency
              </label>
              <select id="lr-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
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
                id="lr-loan"
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
                id="lr-rate"
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
                id="lr-years"
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

            {/* Extra Monthly Payment */}
            <div className="bg-emerald-50/50 border border-emerald-200/50 rounded-xl p-4 space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span>Extra Monthly Payment</span>
                <span className={`ml-auto text-lg font-bold ${hasExtra ? "text-emerald-500" : "text-muted-foreground"}`}>
                  {formatCurrency(extraPayment, currency)}
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={extraPaymentDisplay}
                  onChange={(e) => handleExtraChange(e.target.value)}
                  onFocus={handleExtraFocus}
                  onBlur={handleExtraBlur}
                  className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="Enter amount"
                />
              </div>
              <input
                id="lr-extra"
                type="range"
                min={MIN_EXTRA}
                max={MAX_EXTRA}
                step={50}
                value={extraPayment}
                onChange={(e) => setExtraPayment(parseFloat(e.target.value))}
                className={inputRangeClass}
                aria-valuemin={MIN_EXTRA}
                aria-valuemax={MAX_EXTRA}
                aria-valuenow={extraPayment}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(MIN_EXTRA, currency)}</span>
                <span>{formatCurrency(MAX_EXTRA, currency)}</span>
              </div>
              {hasExtra && interestSaved > 0 && (
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <Zap className="w-3 h-3" /> Save {formatCurrency(interestSaved, currency)} in interest
                  </span>
                  <span className="inline-flex items-center gap-1 text-primary font-medium">
                    <Clock className="w-3 h-3" /> Pay off {monthsSaved} {monthsSaved === 1 ? "month" : "months"} early
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Results Cards */}
          <div className="space-y-4">
            {/* Standard EMI Hero */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <PiggyBank className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground font-medium">
                  {hasExtra ? "Standard Monthly Payment" : "Monthly Payment"}
                </p>
              </div>
              <p className="text-4xl font-extrabold text-primary break-words">{formatCurrency(standardEMI, currency)}</p>
              {hasExtra && (
                <p className="text-sm text-muted-foreground mt-1">
                  + {formatCurrency(extraMonthly, currency)} extra ={" "}
                  <span className="font-semibold text-primary">{formatCurrency(withExtraEMI, currency)}</span>/month
                </p>
              )}
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <ArrowUpRight className="w-4 h-4 text-amber-500" />
                <span>{interestRatioStd.toFixed(1)}% of total payment is interest</span>
              </div>
            </div>

            {/* Interest Comparison */}
            <div className={`grid grid-cols-2 gap-3`}>
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1">Total Interest</p>
                <p className="text-base font-bold break-words">{formatCurrency(standardTotalInterest, currency)}</p>
                {hasExtra && (
                  <p className="text-xs text-muted-foreground mt-1 line-through">
                    {formatCurrency(standardTotalInterest, currency)}
                  </p>
                )}
              </div>
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1">Total Payment</p>
                <p className="text-base font-bold break-words">{formatCurrency(standardTotalPayment, currency)}</p>
                {hasExtra && (
                  <p className="text-xs text-muted-foreground mt-1">
                    With extra: <span className="text-emerald-500 font-medium">{formatCurrency(withExtraTotalPayment, currency)}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Savings Cards (when extra payments active) */}
            {hasExtra && interestSaved > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 min-w-0 overflow-hidden">
                  <p className="text-xs text-emerald-600 font-medium mb-1 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Interest Saved
                  </p>
                  <p className="text-xl font-bold text-emerald-600 break-words">{formatCurrency(interestSaved, currency)}</p>
                </div>
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 min-w-0 overflow-hidden">
                  <p className="text-xs text-primary font-medium mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Time Saved
                  </p>
                  <p className="text-xl font-bold text-primary break-words">{monthsSaved} {monthsSaved === 1 ? "month" : "months"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ({standardMonths} → {actualMonths} months)
                  </p>
                </div>
              </div>
            )}

            {/* Side-by-side Pie Charts */}
            <div className="bg-white border border-border rounded-xl p-6 flex flex-col justify-center min-h-[320px]">
              <div className="flex items-center gap-4 justify-center h-52">
                <div className="flex-1">
                  <p className="text-xs text-center text-muted-foreground mb-1">Standard</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={standardPieData}
                        cx="50%" cy="50%"
                        innerRadius={38} outerRadius={62}
                        dataKey="value"
                        animationBegin={100}
                        animationDuration={800}
                      >
                        {standardPieData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip currency={currency} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {hasExtra && (
                  <div className="flex-1">
                    <p className="text-xs text-center text-emerald-600 font-medium mb-1">With Extra</p>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie
                          data={extraPieData}
                          cx="50%" cy="50%"
                          innerRadius={38} outerRadius={62}
                          dataKey="value"
                          animationBegin={100}
                          animationDuration={800}
                        >
                          {extraPieData.map((_, idx) => (
                            <Cell key={idx} fill={PIE_COLORS[idx]} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip currency={currency} />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center gap-4 text-xs mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#2563eb]" />
                  <span className="text-muted-foreground">Principal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b]" />
                  <span className="text-muted-foreground">Interest</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Standard Interest</p>
                  <p className="text-sm font-semibold">{formatCurrency(standardTotalInterest, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">With Extra Interest</p>
                  <p className="text-sm font-semibold text-emerald-500">{formatCurrency(withExtraTotalInterest, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">You Save</p>
                  <p className="text-sm font-semibold">{formatCurrency(interestSaved, currency)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart: Balance Comparison */}
        {mergedChartData.length > 0 && (
          <div className="bg-white border border-border rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Balance Comparison
              </h3>
            </div>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mergedChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="extraGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="year" fontSize={11} tickMargin={8} />
                  <YAxis tickFormatter={(v: number) => formatCompact(v, currency)} fontSize={11} width={60} />
                  <Tooltip content={<ChartTooltip currency={currency} />} />
                  <Area
                    type="monotone"
                    dataKey="Standard"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fill="url(#stdGrad)"
                    dot={false}
                    animationDuration={1000}
                  />
                  {hasExtra && (
                    <Area
                      type="monotone"
                      dataKey="WithExtra"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#extraGrad)"
                      dot={false}
                      animationDuration={1200}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Yearly Amortization Table */}
        {standardYearlyData.length > 0 && (
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
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Standard Balance</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">With Extra Balance</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Std Interest Paid</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Extra Interest Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standardYearlyData.map((row, idx) => {
                      const extraRow = extraYearlyData[idx];
                      return (
                        <tr key={row.year} className="border-b border-border/50 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-2 font-medium">Year {row.year}</td>
                          <td className="text-right py-3 px-2">{formatCurrency(row.balance, currency)}</td>
                          <td className={`text-right py-3 px-2 ${extraRow ? "text-emerald-600" : "text-muted-foreground"}`}>
                            {extraRow ? formatCurrency(extraRow.balance, currency) : "-"}
                          </td>
                          <td className="text-right py-3 px-2 text-amber-500">{formatCurrency(row.interestPaid, currency)}</td>
                          <td className={`text-right py-3 px-2 ${extraRow ? "text-emerald-600" : "text-muted-foreground"}`}>
                            {extraRow ? formatCurrency(extraRow.interestPaid, currency) : "-"}
                          </td>
                        </tr>
                      );
                    })}
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
