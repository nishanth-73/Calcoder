"use client";

import { useState, useMemo } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { ToolLayout } from "@/components/layout/ToolLayout";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Banknote, IndianRupee, Percent, Calendar, PiggyBank, TrendingUp, ArrowUpRight, Table, Repeat, Landmark } from "lucide-react";

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

const MIN_MONTHLY = 100;
const MAX_MONTHLY = 1000000;
const MIN_RATE = 1;
const MAX_RATE = 15;
const MIN_YEARS = 0.5;
const MAX_YEARS = 15;

const FREQUENCIES = [
  { value: 4, label: "Quarterly" },
  { value: 2, label: "Half-Yearly" },
  { value: 1, label: "Annually" },
  { value: 12, label: "Monthly" },
];

const PIE_COLORS = ["#2563eb", "#10b981"];

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

interface RDResults {
  maturityAmount: number;
  totalDeposits: number;
  totalInterest: number;
  effectiveRate: number;
  chartData: { year: string; Deposits: number; Value: number }[];
  yearlyData: { year: number; deposits: number; value: number; interest: number }[];
}

function calculateRD(
  monthly: number,
  rate: number,
  years: number,
  freq: number
): RDResults {
  if (!Number.isFinite(monthly) || !Number.isFinite(rate) || !Number.isFinite(years) || !Number.isFinite(freq)) {
    return { maturityAmount: 0, totalDeposits: 0, totalInterest: 0, effectiveRate: 0, chartData: [], yearlyData: [] };
  }

  const clampedMonthly = Math.max(0, Math.min(monthly, MAX_MONTHLY));
  const clampedRate = Math.max(0, Math.min(rate, MAX_RATE));
  const clampedYears = Math.max(0, Math.min(years, MAX_YEARS));

  if (clampedMonthly <= 0 || clampedYears <= 0) {
    return { maturityAmount: 0, totalDeposits: 0, totalInterest: 0, effectiveRate: 0, chartData: [], yearlyData: [] };
  }

  const totalMonths = Math.round(clampedYears * 12);
  const monthsPerCompound = 12 / freq;
  const periodicRate = clampedRate / 100 / freq;

  let balance = 0;
  let totalDeposits = 0;
  const chartData: RDResults["chartData"] = [];
  const yearlyData: RDResults["yearlyData"] = [];

  for (let m = 1; m <= totalMonths; m++) {
    balance += clampedMonthly;
    totalDeposits += clampedMonthly;

    if (clampedRate > 0 && m % monthsPerCompound === 0) {
      balance *= (1 + periodicRate);
    }

    if (m % 12 === 0) {
      const year = m / 12;
      chartData.push({ year: `Yr ${year}`, Deposits: Math.round(totalDeposits), Value: Math.round(balance) });
      yearlyData.push({
        year,
        deposits: Math.round(totalDeposits),
        value: Math.round(balance),
        interest: Math.round(balance - totalDeposits),
      });
    }
  }

  const totalInterest = Math.max(0, Math.round(balance - totalDeposits));
  const maturityAmount = Math.round(balance);

  let effectiveRate = 0;
  if (totalDeposits > 0 && totalInterest > 0 && clampedYears > 0) {
    const ratio = maturityAmount / totalDeposits;
    effectiveRate = (Math.pow(ratio, 1 / clampedYears) - 1) * 100;
  }

  return {
    maturityAmount,
    totalDeposits: Math.round(totalDeposits),
    totalInterest,
    effectiveRate,
    chartData,
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

export default function RDCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const { value: monthly, displayValue: monthlyDisplay, setValue: setMonthly, handleChange: handleMonthlyChange, handleFocus: handleMonthlyFocus, handleBlur: handleMonthlyBlur } = useNumericField(5000);
  const { value: rate, displayValue: rateDisplay, setValue: setRate, handleChange: handleRateChange, handleFocus: handleRateFocus, handleBlur: handleRateBlur } = useNumericField(7);
  const { value: years, displayValue: yearsDisplay, setValue: setYears, handleChange: handleYearsChange, handleFocus: handleYearsFocus, handleBlur: handleYearsBlur } = useNumericField(5);
  const [freq, setFreq] = useState(4);
  const [showTable, setShowTable] = useState(false);

  const results = useMemo(
    () => calculateRD(monthly, rate, years, freq),
    [monthly, rate, years, freq]
  );

  const { maturityAmount, totalDeposits, totalInterest, effectiveRate, chartData, yearlyData } = results;

  const pieData = useMemo(() => [
    { name: "Total Deposits", value: totalDeposits },
    { name: "Interest Earned", value: totalInterest },
  ], [totalDeposits, totalInterest]);

  const interestRatio = maturityAmount > 0 ? (totalInterest / maturityAmount) * 100 : 0;

  const inputRangeClass = "w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer";

  return (
    <ToolLayout
      title="RD Calculator"
      description="Calculate Recurring Deposit maturity amount with monthly deposits, compounding interest, and full year-by-year growth trajectory. Plan your savings with accurate projections, charts, and detailed breakdowns."
      category="finance"
      faqContent={[
        {
          question: "What is a Recurring Deposit (RD)?",
          answer: "A Recurring Deposit (RD) is a savings product offered by banks and post offices where you deposit a fixed amount every month for a predetermined period. Interest is compounded quarterly (typically) and the total amount (principal + interest) is paid at maturity. RDs are ideal for salaried individuals who want to build a savings habit with regular monthly contributions.",
        },
        {
          question: "How is RD interest calculated?",
          answer: "RD interest is calculated using the compound interest formula applied to each monthly installment. The standard formula is: M = R × [(1 + i)^n - 1] / [1 - (1 + i)^(-1/3)], where R is the monthly deposit, i is the quarterly interest rate (annual rate / 400), and n is the number of quarters. Most Indian banks compound RD interest quarterly, though some offer monthly or annual compounding options.",
        },
        {
          question: "What is the difference between RD and FD?",
          answer: "An FD (Fixed Deposit) requires a one-time lump sum deposit, while an RD involves regular monthly contributions. FDs typically offer slightly higher interest rates than RDs for the same tenure. RDs are better for building savings from income, while FDs are suitable for investing surplus funds. Both are safe, guaranteed-return instruments.",
        },
        {
          question: "What is the minimum and maximum tenure for RDs?",
          answer: "RD tenures typically range from 6 months to 10 years. Most banks offer RDs for 1-5 years as standard, with some extending to 10 years. Shorter tenures (6-12 months) are good for short-term goals, while longer tenures (3-10 years) maximize the power of compounding. Post Office RD has a fixed tenure of 5 years.",
        },
        {
          question: "Can I withdraw my RD before maturity?",
          answer: "Yes, most banks allow premature closure of RDs, but they may charge a penalty (typically 0.5-1% reduction in interest rate). Some banks require a minimum lock-in period (e.g., 3-6 months) before allowing premature withdrawal. If you close in the first year, you may only get savings account interest rate.",
        },
        {
          question: "What happens if I miss an RD installment?",
          answer: "Missing an installment usually incurs a penalty, typically ₹5-₹20 per ₹1,000 deposit or a flat fee per missed month. Some banks allow a grace period of a few days. If multiple consecutive installments are missed, the RD may be closed prematurely and moved to a savings account. A few banks offer 'skip' facility with slightly reduced returns.",
        },
        {
          question: "Which compounding frequency is best for RD?",
          answer: "Quarterly compounding is the most common and beneficial for RDs provided by Indian banks. It offers higher returns than annual compounding but the difference from monthly compounding is minimal. For example, ₹5,000 monthly at 7% for 5 years: quarterly gives ~₹3,64,867; monthly gives ~₹3,65,196. The difference is only ~₹329.",
        },
        {
          question: "Is RD better than a savings account?",
          answer: "RDs offer 3-6% higher interest rates than regular savings accounts (which offer 2.5-4% in India). However, RDs lock in monthly contributions with penalties for missed installments or premature withdrawal. A common strategy is to use RDs for goal-based savings (vacation, down payment, emergency fund) while keeping some liquidity in a savings account.",
        },
        {
          question: "How is RD interest taxed?",
          answer: "Interest earned on RDs is fully taxable as per your income tax slab rate. Banks deduct TDS (Tax Deducted at Source) at 10% if the total interest across all deposits exceeds ₹40,000 (₹50,000 for senior citizens) in a financial year. If you don't have a PAN card, TDS is deducted at 20%. You must declare RD interest when filing your income tax return.",
        },
        {
          question: "Can I have multiple RDs at the same time?",
          answer: "Yes, you can open multiple RDs simultaneously with the same bank or across different banks. This is useful for goal-based savings - for example, one RD for a vacation fund, another for a down payment fund, and a third for an emergency fund. You can also ladder RDs by opening them at different times to create a regular maturity cycle.",
        },
      ]}
      explanationContent={
        <div className="prose prose-slate max-w-none">
          <h2>What is an RD Calculator?</h2>
          <p>
            A <strong>Recurring Deposit (RD) calculator</strong> is a financial planning tool that estimates the maturity amount of your recurring deposit investments. By entering your monthly deposit amount, interest rate, tenure, and compounding frequency, you get an accurate projection of your savings growth including the total deposits made, interest earned, and final maturity value.
          </p>

          <h3>The RD Formula</h3>
          <p>The calculator uses the standard RD formula based on quarterly compounding, the most common method used by Indian banks:</p>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
            M = R × [(1 + i)<sup>n</sup> - 1] / [1 - (1 + i)<sup>-1/3</sup>]
          </pre>
          <p>Where:</p>
          <ul>
            <li><strong>M</strong> = Maturity amount</li>
            <li><strong>R</strong> = Monthly deposit amount</li>
            <li><strong>i</strong> = Quarterly interest rate (annual rate ÷ 400)</li>
            <li><strong>n</strong> = Number of quarters (tenure in years × 4)</li>
          </ul>
          <p>The calculator simulates month-by-month deposits with periodic compounding - adding your monthly contribution and applying interest at each compounding interval - for maximum accuracy across all compounding frequencies.</p>

          <h3>Benefits of RD Investing</h3>
          <ul>
            <li><strong>Regular Savings Habit:</strong> Fixed monthly deposits instill financial discipline, making it easier to achieve short-to-medium-term savings goals without requiring a large lump sum.</li>
            <li><strong>Guaranteed Returns:</strong> Unlike market-linked investments, RDs offer guaranteed, predetermined interest rates, making them a safe choice for risk-averse savers.</li>
            <li><strong>Flexible Tenures:</strong> Choose from 6 months to 10 years to match your specific financial goals - whether it's a vacation next year or a down payment in 5 years.</li>
            <li><strong>No Market Risk:</strong> Your principal and interest are protected, with deposits insured up to ₹5 lakh by DICGC (for bank RDs). Ideal for emergency funds and short-term goals.</li>
            <li><strong>Loan Facility:</strong> Most banks allow you to take a loan against your RD balance (typically up to 90-95% of the balance), providing liquidity without breaking the deposit.</li>
          </ul>

          <h3>Example Calculation</h3>
          <p><strong>Scenario:</strong> You deposit ₹5,000 per month in an RD at 7% interest for 5 years with quarterly compounding.</p>
          <ul>
            <li><strong>Monthly Deposit:</strong> ₹5,000</li>
            <li><strong>Interest Rate:</strong> 7% per annum (quarterly compounded)</li>
            <li><strong>Tenure:</strong> 5 years (60 months / 20 quarters)</li>
            <li><strong>Total Deposits:</strong> ₹5,000 × 60 = ₹3,00,000</li>
            <li><strong>Maturity Amount:</strong> ~₹3,64,867</li>
            <li><strong>Interest Earned:</strong> ~₹64,867</li>
            <li><strong>Effective Annual Return:</strong> ~7.19%</li>
          </ul>
          <p>This means your ₹3,00,000 in total deposits grows to over ₹3.64 lakhs in 5 years, with nearly 18% of the final value coming from interest earnings.</p>

          <h3>Common Mistakes to Avoid</h3>
          <ul>
            <li><strong>Missing installments:</strong> Late or missed payments incur penalties that reduce your effective returns. Set up auto-debit from your savings account to avoid this.</li>
            <li><strong>Breaking prematurely:</strong> Premature closure penalties can significantly reduce your returns. Choose tenures carefully and maintain a separate emergency fund.</li>
            <li><strong>Ignoring tax on interest:</strong> RD interest is taxable. Failing to account for this can lead to unexpected tax bills. Use the post-tax comparison in related calculators for accurate planning.</li>
            <li><strong>Not comparing compounding frequencies:</strong> Different banks may compound interest quarterly, monthly, or annually. Always check the compounding frequency and choose the one that maximizes returns.</li>
            <li><strong>Forgetting laddering:</strong> Instead of one large RD, consider laddering multiple RDs with different maturities to create regular liquidity and average out interest rate changes over time.</li>
          </ul>

          <h3>Tips for Maximizing RD Returns</h3>
          <ul>
            <li><strong>Choose quarterly compounding:</strong> Quarterly compounding is the standard and offers the best balance of returns and simplicity. It typically yields 0.1-0.2% higher effective returns than annual compounding.</li>
            <li><strong>Use auto-debit:</strong> Set up automatic monthly transfers from your savings account to your RD to avoid missed installments and ensure consistent savings growth.</li>
            <li><strong>Ladder your RDs:</strong> Open multiple RDs with staggered maturities - for example, one 1-year, one 2-year, one 3-year, one 4-year, and one 5-year RD. As each matures, reinvest in a new 5-year RD for a self-sustaining cycle.</li>
            <li><strong>Compare rates across banks:</strong> Small finance banks and NBFCs often offer 0.5-1.5% higher RD rates than large banks. Post Office RD offers competitive guaranteed rates with sovereign backing.</li>
            <li><strong>Time deposits with rate cycles:</strong> When interest rates are high, lock in longer tenures. When rates are low, choose shorter tenures and reinvest when rates rise. Use this calculator to compare scenarios.</li>
          </ul>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            {/* Currency */}
            <div>
              <label htmlFor="rd-currency" className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <Banknote className="w-4 h-4 text-primary" />
                Currency
              </label>
              <select id="rd-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>

            {/* Monthly Deposit */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <IndianRupee className="w-4 h-4 text-primary" />
                <span>Monthly Deposit</span>
                <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(monthly, currency)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                <input type="text" inputMode="decimal" value={monthlyDisplay} onChange={(e) => handleMonthlyChange(e.target.value)} onFocus={handleMonthlyFocus} onBlur={handleMonthlyBlur} className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter amount" />
              </div>
              <input id="rd-monthly" type="range" min={MIN_MONTHLY} max={MAX_MONTHLY} step={100} value={monthly}
                onChange={(e) => setMonthly(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_MONTHLY} aria-valuemax={MAX_MONTHLY} aria-valuenow={monthly} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(MIN_MONTHLY, currency)}</span>
                <span>{formatCurrency(MAX_MONTHLY, currency)}</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Percent className="w-4 h-4 text-primary" />
                <span>Interest Rate (p.a.)</span>
                <span className="ml-auto text-lg font-bold text-primary">{rate}%</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input type="text" inputMode="decimal" value={rateDisplay} onChange={(e) => handleRateChange(e.target.value)} onFocus={handleRateFocus} onBlur={handleRateBlur} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter rate" />
                </div>
                <span className="text-muted-foreground font-medium text-sm">%</span>
              </div>
              <input id="rd-rate" type="range" min={MIN_RATE} max={MAX_RATE} step={0.25} value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_RATE} aria-valuemax={MAX_RATE} aria-valuenow={rate} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MIN_RATE}%</span>
                <span>{MAX_RATE}%</span>
              </div>
            </div>

            {/* Tenure */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Calendar className="w-4 h-4 text-primary" />
                <span>Tenure</span>
                <span className="ml-auto text-lg font-bold text-primary">{years} {years === 1 ? "Year" : "Years"}</span>
              </label>
              <div className="relative">
                <input type="text" inputMode="decimal" value={yearsDisplay} onChange={(e) => handleYearsChange(e.target.value)} onFocus={handleYearsFocus} onBlur={handleYearsBlur} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter years" />
              </div>
              <input id="rd-years" type="range" min={MIN_YEARS} max={MAX_YEARS} step={0.5} value={years}
                onChange={(e) => setYears(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_YEARS} aria-valuemax={MAX_YEARS} aria-valuenow={years} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MIN_YEARS} Yr</span>
                <span>{MAX_YEARS} Yrs</span>
              </div>
            </div>

            {/* Compounding Frequency */}
            <div>
              <label htmlFor="rd-freq" className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Compounding Frequency
              </label>
              <select
                id="rd-freq"
                value={freq}
                onChange={(e) => setFreq(Number(e.target.value))}
                className="w-full p-3 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1.5">
                Quarterly is the standard compounding frequency for RDs at most banks.
              </p>
            </div>

            {/* Effective Rate Display */}
            {effectiveRate > 0 && (
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-sm flex items-center justify-between">
                <span className="text-muted-foreground">Effective Annual Rate (EAR)</span>
                <span className="font-semibold text-primary">{formatPercent(effectiveRate / 100)}</span>
              </div>
            )}
          </div>

          {/* Results Cards */}
          <div className="space-y-4">
            {/* Maturity Hero */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <PiggyBank className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground font-medium">Maturity Amount</p>
              </div>
              <p className="text-4xl font-extrabold text-primary break-words">{formatCurrency(maturityAmount, currency)}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                <span>{interestRatio.toFixed(1)}% from interest · EAR {formatPercent(effectiveRate / 100)}</span>
              </div>
            </div>

            {/* Deposit + Interest Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Landmark className="w-3 h-3" />
                  Total Deposits
                </p>
                <p className="text-lg font-bold break-words">{formatCurrency(totalDeposits, currency)}</p>
              </div>
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  Interest Earned
                </p>
                <p className="text-lg font-bold text-emerald-500 break-words">{formatCurrency(totalInterest, currency)}</p>
              </div>
            </div>

            {/* Pie Chart */}
            {totalInterest > 0 && (
              <div className="bg-white border border-border rounded-xl p-6">
                <div className="flex items-center justify-center h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={62}
                        dataKey="value" animationBegin={100} animationDuration={800}>
                        {pieData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip currency={currency} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 text-xs ml-2">
                    {pieData.map((item, idx) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PIE_COLORS[idx] }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Total Deposited</p>
                    <p className="text-sm font-semibold">{formatCurrency(totalDeposits, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Interest Earned</p>
                    <p className="text-sm font-semibold text-emerald-500">{formatCurrency(totalInterest, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Maturity</p>
                    <p className="text-sm font-semibold">{formatCurrency(maturityAmount, currency)}</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="bg-white border border-border rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                RD Growth Trajectory
              </h3>
            </div>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rdDepositsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="rdValueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="year" fontSize={11} tickMargin={8} />
                  <YAxis tickFormatter={(v: number) => formatCompact(v, currency)} fontSize={11} width={60} />
                  <Tooltip content={<ChartTooltip currency={currency} />} />
                  <Area type="monotone" dataKey="Deposits" stroke="#2563eb" strokeWidth={2}
                    fill="url(#rdDepositsGrad)" dot={false} animationDuration={1000} />
                  <Area type="monotone" dataKey="Value" stroke="#10b981" strokeWidth={2}
                    fill="url(#rdValueGrad)" dot={false} animationDuration={1200} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Yearly Table */}
        {yearlyData.length > 0 && (
          <div className="bg-white border border-border rounded-xl p-4 sm:p-6">
            <button
              onClick={() => setShowTable(!showTable)}
              className="flex items-center gap-2 text-lg font-bold mb-2 hover:text-primary transition-colors"
              aria-expanded={showTable}
            >
              <Table className="w-5 h-5 text-primary" />
              Yearly Breakdown
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
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Deposits</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Interest</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyData.map((row) => (
                      <tr key={row.year} className="border-b border-border/50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2 font-medium">Year {row.year}</td>
                        <td className="text-right py-3 px-2">{formatCurrency(row.deposits, currency)}</td>
                        <td className={`text-right py-3 px-2 ${row.interest > 0 ? "text-emerald-500" : "text-muted-foreground"}`}>
                          {row.interest > 0 ? formatCurrency(row.interest, currency) : "-"}
                        </td>
                        <td className="text-right py-3 px-2 font-semibold">{formatCurrency(row.value, currency)}</td>
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
