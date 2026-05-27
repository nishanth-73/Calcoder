"use client";

import { useState, useMemo } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { ToolLayout } from "@/components/layout/ToolLayout";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Banknote, DollarSign, Percent, Calendar, PiggyBank, TrendingUp, ArrowUpRight, Table, Landmark } from "lucide-react";

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

const MIN_DEPOSIT = 1000;
const MAX_DEPOSIT = 10000000;
const MIN_RATE = 1;
const MAX_RATE = 15;
const MIN_YEARS = 0.5;
const MAX_YEARS = 10;
const MIN_TAX = 0;
const MAX_TAX = 40;

const FREQUENCIES = [
  { value: 1, label: "Annually" },
  { value: 4, label: "Quarterly" },
  { value: 12, label: "Monthly" },
  { value: 365, label: "Daily" },
  { value: 0, label: "Continuous" },
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

interface FDResults {
  maturityAmount: number;
  totalInterest: number;
  effectiveRate: number;
  postTaxMaturity: number;
  postTaxInterest: number;
  taxAmount: number;
  chartData: { year: string; Value: number }[];
  yearlyData: { year: number; value: number; interest: number }[];
}

function calculateFD(
  deposit: number,
  rate: number,
  years: number,
  freq: number,
  taxRate: number
): FDResults {
  if (!Number.isFinite(deposit) || !Number.isFinite(rate) || !Number.isFinite(years) ||
      !Number.isFinite(freq) || !Number.isFinite(taxRate)) {
    return { maturityAmount: 0, totalInterest: 0, effectiveRate: 0,
      postTaxMaturity: 0, postTaxInterest: 0, taxAmount: 0, chartData: [], yearlyData: [] };
  }

  const clampedDeposit = Math.max(0, Math.min(deposit, MAX_DEPOSIT));
  const clampedRate = Math.max(0, Math.min(rate, MAX_RATE));
  const clampedYears = Math.max(0, Math.min(years, MAX_YEARS));
  const clampedTax = Math.max(0, Math.min(taxRate, MAX_TAX));

  if (clampedDeposit <= 0 || clampedYears <= 0) {
    return { maturityAmount: 0, totalInterest: 0, effectiveRate: 0,
      postTaxMaturity: 0, postTaxInterest: 0, taxAmount: 0, chartData: [], yearlyData: [] };
  }

  const r = clampedRate / 100;
  let maturityAmount: number;
  let effectiveRate: number;

  if (clampedRate === 0) {
    maturityAmount = clampedDeposit;
    effectiveRate = 0;
  } else if (freq === 0) {
    maturityAmount = clampedDeposit * Math.exp(r * clampedYears);
    effectiveRate = (Math.exp(r) - 1) * 100;
  } else {
    maturityAmount = clampedDeposit * Math.pow(1 + r / freq, freq * clampedYears);
    effectiveRate = (Math.pow(1 + r / freq, freq) - 1) * 100;
  }

  const totalInterest = Math.max(0, maturityAmount - clampedDeposit);
  const taxAmount = totalInterest * (clampedTax / 100);
  const postTaxInterest = totalInterest - taxAmount;
  const postTaxMaturity = clampedDeposit + postTaxInterest;

  const chartData: FDResults["chartData"] = [];
  const yearlyData: FDResults["yearlyData"] = [];

  for (let i = 0; i <= Math.ceil(clampedYears); i++) {
    const yearFraction = Math.min(i, clampedYears);
    let fv: number;
    if (clampedRate === 0) {
      fv = clampedDeposit;
    } else if (freq === 0) {
      fv = clampedDeposit * Math.exp(r * yearFraction);
    } else {
      fv = clampedDeposit * Math.pow(1 + r / freq, freq * yearFraction);
    }
    chartData.push({
      year: i === 0 ? "Start" : `Yr ${i}`,
      Value: Math.round(fv),
    });
    if (i > 0 && i <= Math.ceil(clampedYears)) {
      yearlyData.push({
        year: i,
        value: Math.round(fv),
        interest: Math.round(fv - clampedDeposit),
      });
    }
  }

  return {
    maturityAmount: Math.round(maturityAmount),
    totalInterest: Math.round(totalInterest),
    effectiveRate,
    postTaxMaturity: Math.round(postTaxMaturity),
    postTaxInterest: Math.round(postTaxInterest),
    taxAmount: Math.round(taxAmount),
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

export default function FDCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const { value: deposit, displayValue: depositDisplay, setValue: setDeposit, handleChange: handleDepositChange, handleFocus: handleDepositFocus, handleBlur: handleDepositBlur } = useNumericField(500000);
  const { value: rate, displayValue: rateDisplay, setValue: setRate, handleChange: handleRateChange, handleFocus: handleRateFocus, handleBlur: handleRateBlur } = useNumericField(7);
  const { value: years, displayValue: yearsDisplay, setValue: setYears, handleChange: handleYearsChange, handleFocus: handleYearsFocus, handleBlur: handleYearsBlur } = useNumericField(3);
  const { value: taxRate, displayValue: taxRateDisplay, setValue: setTaxRate, handleChange: handleTaxRateChange, handleFocus: handleTaxRateFocus, handleBlur: handleTaxRateBlur } = useNumericField(10);
  const [freq, setFreq] = useState(4);
  const [showTable, setShowTable] = useState(false);

  const results = useMemo(
    () => calculateFD(deposit, rate, years, freq, taxRate),
    [deposit, rate, years, freq, taxRate]
  );

  const {
    maturityAmount, totalInterest, effectiveRate,
    postTaxMaturity, postTaxInterest, taxAmount,
    chartData, yearlyData,
  } = results;

  const pieData = useMemo(() => [
    { name: "Principal", value: deposit },
    { name: "Interest", value: totalInterest },
  ], [deposit, totalInterest]);

  const hasTax = taxRate > 0;
  const interestRatio = maturityAmount > 0 ? (totalInterest / maturityAmount) * 100 : 0;

  const inputRangeClass = "w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer";

  return (
    <ToolLayout
      title="FD Calculator"
      description="Calculate Fixed Deposit returns with quarterly, monthly, or annual compounding. See pre-tax and post-tax maturity amounts, effective yield, and full growth trajectory."
      category="finance"
      faqContent={[
        {
          question: "What is a Fixed Deposit (FD)?",
          answer: "A Fixed Deposit (FD) is a financial instrument offered by banks and non-banking financial companies (NBFCs) where you deposit a lump sum for a fixed period at a predetermined interest rate. FDs offer guaranteed returns and are one of the safest investment options, making them popular among conservative investors and senior citizens seeking steady income.",
        },
        {
          question: "How is FD interest calculated?",
          answer: "FD interest is calculated using the compound interest formula: A = P(1 + r/n)^(nt), where P is the deposit amount, r is the annual interest rate, n is the compounding frequency, and t is the tenure. Most banks in India compound interest quarterly, which means your interest earns interest four times a year, maximizing your returns.",
        },
        {
          question: "What is the best compounding frequency for FD?",
          answer: "Higher compounding frequency yields slightly higher returns. Quarterly compounding (most common for FDs) gives better returns than annual but the difference from monthly is minimal. For example, ₹5,00,000 at 7% for 3 years: annual gives ₹6,12,522; quarterly gives ₹6,15,696; monthly gives ₹6,16,299. The difference is small but meaningful for large deposits.",
        },
        {
          question: "How is FD interest taxed?",
          answer: "In India, FD interest is taxed as per your income tax slab rate. Banks deduct TDS (Tax Deducted at Source) at 10% if interest exceeds ₹40,000 (₹50,000 for senior citizens) in a financial year. If you do not have a PAN card, TDS is deducted at 20%. The calculator shows both pre-tax and post-tax returns for accurate planning.",
        },
        {
          question: "What is the difference between cumulative and non-cumulative FD?",
          answer: "In a cumulative FD, interest is compounded and paid at maturity along with the principal - maximizing returns through compounding. In a non-cumulative FD, interest is paid out regularly (monthly, quarterly, half-yearly, or annually) and is not compounded. Cumulative FDs offer higher effective returns and are better for long-term goals.",
        },
        {
          question: "What is the minimum and maximum tenure for FDs?",
          answer: "FD tenures typically range from 7 days to 10 years. Short-term FDs (7 days to 1 year) are suitable for parking surplus cash. Medium-term (1-3 years) offers good balance of returns and liquidity. Long-term (3-10 years) maximizes compounding. Senior citizens often get 0.25-0.75% higher rates.",
        },
        {
          question: "Can I withdraw my FD before maturity?",
          answer: "Yes, most banks allow premature withdrawal of FDs, but they charge a penalty - typically 0.5-1% less than the contracted rate. Some banks may also refuse premature withdrawal on certain schemes. Tax-saver FDs (5-year lock-in) cannot be withdrawn before 5 years. Always check the penalty terms before booking an FD.",
        },
        {
          question: "What is the effective annual rate (EAR)?",
          answer: "The Effective Annual Rate (EAR) is the actual annual rate of return accounting for compounding frequency. For example, an FD with 7% nominal rate compounded quarterly has an EAR of approximately 7.19%. The higher the compounding frequency, the higher the EAR. This calculator displays the EAR alongside the nominal rate.",
        },
        {
          question: "How do senior citizen rates work?",
          answer: "Most banks in India offer senior citizens (60+ years) an additional interest rate of 0.25-0.75% on FDs. For example, if the regular FD rate is 7%, senior citizens may get 7.5-7.75%. The higher rate applies to the full deposit amount and is subject to the same TDS rules. Use the calculator with the higher rate to see senior citizen benefits.",
        },
        {
          question: "Is FD better than a savings account?",
          answer: "FDs offer 3-6% higher interest rates than savings accounts (which offer 2.5-4% in India). However, FDs lock in your money for a fixed period with penalties for early withdrawal. A common strategy is to keep emergency funds in a savings account and surplus funds in FDs. Use the calculator to compare the returns difference.",
        },
      ]}
      explanationContent={
        <div className="prose prose-slate max-w-none">
          <h2>What is an FD Calculator?</h2>
          <p>
            A <strong>Fixed Deposit (FD) calculator</strong> is a financial tool that estimates the maturity amount and interest earnings on your fixed deposit investments. It accounts for the deposit amount, interest rate, tenure, compounding frequency, and tax rate to give you a complete picture of your pre-tax and post-tax returns.
          </p>

          <h3>The FD Formula</h3>
          <p>The calculator uses the compound interest formula for FDs:</p>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
            A = P × (1 + r/n)<sup>nt</sup>
          </pre>
          <p>Where:</p>
          <ul>
            <li><strong>A</strong> = Maturity amount</li>
            <li><strong>P</strong> = Deposit amount (principal)</li>
            <li><strong>r</strong> = Annual interest rate (as a decimal)</li>
            <li><strong>n</strong> = Compounding frequency per year</li>
            <li><strong>t</strong> = Time period in years</li>
          </ul>
          <p>For FDs with <strong>quarterly compounding</strong> (most common in India), n = 4.</p>

          <h3>Post-Tax Calculation</h3>
          <p>The calculator also computes post-tax returns:</p>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
            Post-Tax Interest = Total Interest × (1 - Tax Rate / 100)
            Post-Tax Maturity = Deposit + Post-Tax Interest
          </pre>

          <h3>Benefits of Using an FD Calculator</h3>
          <ul>
            <li><strong>Accurate Planning:</strong> See exactly how much your FD will grow with different tenures and compounding frequencies.</li>
            <li><strong>Tax-Aware Projections:</strong> Factor in TDS and income tax to see your actual take-home returns, not just the advertised rate.</li>
            <li><strong>Tenure Optimization:</strong> Compare returns across different tenures to find the sweet spot between lock-in period and returns.</li>
            <li><strong>Frequency Comparison:</strong> See how quarterly vs annual vs monthly compounding affects your final amount.</li>
            <li><strong>Informed Decisions:</strong> Compare FD returns against other fixed-income options like bonds, RDs, and debt funds.</li>
          </ul>

          <h3>Example Calculation</h3>
          <p><strong>Scenario:</strong> You deposit ₹5,00,000 in an FD at 7% interest for 3 years with quarterly compounding, and your tax rate is 10%.</p>
          <ul>
            <li><strong>Deposit Amount:</strong> ₹5,00,000</li>
            <li><strong>Interest Rate:</strong> 7% per annum (quarterly compounded)</li>
            <li><strong>Tenure:</strong> 3 years</li>
            <li><strong>Effective Annual Rate:</strong> ~7.19%</li>
            <li><strong>Pre-Tax Maturity:</strong> ~₹6,15,696</li>
            <li><strong>Total Interest (Pre-Tax):</strong> ~₹1,15,696</li>
            <li><strong>Tax at 10%:</strong> ~₹11,570</li>
            <li><strong>Post-Tax Maturity:</strong> ~₹6,04,126</li>
          </ul>

          <h3>Common Mistakes to Avoid</h3>
          <ul>
            <li><strong>Ignoring TDS:</strong> Interest on FDs is taxable. Failing to account for tax can lead to unexpected tax bills and lower effective returns than expected.</li>
            <li><strong>Not comparing compounding frequencies:</strong> Banks may quote the same nominal rate but compound differently. Always check the compounding frequency and use this calculator to compare.</li>
            <li><strong>Breaking FDs prematurely:</strong> Premature withdrawal penalties (0.5-1%) can significantly reduce your returns. Choose tenures carefully and maintain a separate emergency fund.</li>
            <li><strong>Laddering without a plan:</strong> While FD laddering (staggering maturities) is smart, do it with clear goals rather than randomly spreading across tenures.</li>
            <li><strong>Forgetting senior citizen benefits:</strong> If eligible, always claim the higher interest rate for senior citizens. It can add 0.25-0.75% to your effective return.</li>
          </ul>

          <h3>Tips for Maximizing FD Returns</h3>
          <ul>
            <li><strong>Choose cumulative FDs for long-term goals:</strong> Cumulative FDs compound interest and pay at maturity, maximizing your returns through the power of compounding.</li>
            <li><strong>Ladder your FDs:</strong> Split your investment across FDs with different maturities (1, 2, 3, 5 years). This provides regular liquidity and averages out interest rate changes.</li>
            <li><strong>Consider tax-saver FDs:</strong> 5-year tax-saver FDs offer Section 80C tax benefits (up to ₹1.5 lakh deduction) though they have a lock-in period.</li>
            <li><strong>Compare rates across banks:</strong> Small finance banks and NBFCs often offer 0.5-1.5% higher rates than large banks. Ensure they are covered by deposit insurance (DICGC up to ₹5 lakh).</li>
            <li><strong>Time your deposits:</strong> Interest rates cycle up and down. If rates are high, lock in longer tenures. If rates are low, choose shorter tenures and reinvest when rates rise.</li>
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
              <label htmlFor="fd-currency" className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <Banknote className="w-4 h-4 text-primary" />
                Currency
              </label>
              <select id="fd-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>

            {/* Deposit Amount */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Landmark className="w-4 h-4 text-primary" />
                <span>Deposit Amount</span>
                <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(deposit, currency)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={depositDisplay}
                  onChange={(e) => handleDepositChange(e.target.value)}
                  onFocus={handleDepositFocus}
                  onBlur={handleDepositBlur}
                  className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="Enter amount"
                />
              </div>
              <input id="fd-deposit" type="range" min={MIN_DEPOSIT} max={MAX_DEPOSIT} step={1000} value={deposit}
                onChange={(e) => setDeposit(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_DEPOSIT} aria-valuemax={MAX_DEPOSIT} aria-valuenow={deposit} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(MIN_DEPOSIT, currency)}</span>
                <span>{formatCurrency(MAX_DEPOSIT, currency)}</span>
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
                  <input
                    type="text"
                    inputMode="decimal"
                    value={rateDisplay}
                    onChange={(e) => handleRateChange(e.target.value)}
                    onFocus={handleRateFocus}
                    onBlur={handleRateBlur}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="Enter rate"
                  />
                </div>
                <span className="text-muted-foreground font-medium text-sm">%</span>
              </div>
              <input id="fd-rate" type="range" min={MIN_RATE} max={MAX_RATE} step={0.25} value={rate}
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
                <input
                  type="text"
                  inputMode="decimal"
                  value={yearsDisplay}
                  onChange={(e) => handleYearsChange(e.target.value)}
                  onFocus={handleYearsFocus}
                  onBlur={handleYearsBlur}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="Enter years"
                />
              </div>
              <input id="fd-years" type="range" min={MIN_YEARS} max={MAX_YEARS} step={0.5} value={years}
                onChange={(e) => setYears(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_YEARS} aria-valuemax={MAX_YEARS} aria-valuenow={years} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MIN_YEARS} Yr</span>
                <span>{MAX_YEARS} Yrs</span>
              </div>
            </div>

            {/* Compounding Frequency */}
            <div>
              <label htmlFor="fd-freq" className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Compounding Frequency
              </label>
              <select
                id="fd-freq"
                value={freq}
                onChange={(e) => setFreq(Number(e.target.value))}
                className="w-full p-3 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Tax Rate */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Percent className="w-4 h-4 text-primary" />
                <span>Tax Rate (TDS / Income Tax)</span>
                <span className="ml-auto text-lg font-bold text-primary">{taxRate}%</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={taxRateDisplay}
                    onChange={(e) => handleTaxRateChange(e.target.value)}
                    onFocus={handleTaxRateFocus}
                    onBlur={handleTaxRateBlur}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="Enter rate"
                  />
                </div>
                <span className="text-muted-foreground font-medium text-sm">%</span>
              </div>
              <input id="fd-tax" type="range" min={MIN_TAX} max={MAX_TAX} step={1} value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_TAX} aria-valuemax={MAX_TAX} aria-valuenow={taxRate} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MIN_TAX}%</span>
                <span>{MAX_TAX}%</span>
              </div>
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
            {/* Pre-Tax Maturity Hero */}
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

            {/* Interest + Tax */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1">Total Interest</p>
                <p className="text-base font-bold text-emerald-500 break-words">{formatCurrency(totalInterest, currency)}</p>
              </div>
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1">Deposit Amount</p>
                <p className="text-base font-bold break-words">{formatCurrency(deposit, currency)}</p>
              </div>
            </div>

            {/* Post-Tax Section */}
            {hasTax && (
              <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-amber-800 flex items-center gap-1.5">
                  <Landmark className="w-4 h-4" />
                  Post-Tax Returns
                </p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs text-amber-600">Tax Paid</p>
                    <p className="font-bold text-amber-700 break-words">{formatCurrency(taxAmount, currency)}</p>
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs text-amber-600">Interest After Tax</p>
                    <p className="font-bold text-emerald-600 break-words">{formatCurrency(postTaxInterest, currency)}</p>
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs text-amber-600">Net Maturity</p>
                    <p className="font-bold text-primary break-words">{formatCurrency(postTaxMaturity, currency)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pie Chart */}
            {totalInterest > 0 && (
              <div className="bg-white border border-border rounded-xl p-6">
                <div className="flex items-center justify-center h-36">
                  <ResponsiveContainer initialDimension={{width:100,height:100}} width="100%" height="100%">
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
                    <p className="text-sm font-semibold">{formatCurrency(deposit, currency)}</p>
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
                FD Growth Trajectory
              </h3>
            </div>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer initialDimension={{width:100,height:100}} width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="year" fontSize={11} tickMargin={8} />
                  <YAxis tickFormatter={(v: number) => formatCompact(v, currency)} fontSize={11} width={60} />
                  <Tooltip content={<ChartTooltip currency={currency} />} />
                  <Area type="monotone" dataKey="Value" stroke="#2563eb" strokeWidth={2}
                    fill="url(#fdGrad)" dot={false} animationDuration={1200} />
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
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Value</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Interest</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Post-Tax Interest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyData.map((row) => (
                      <tr key={row.year} className="border-b border-border/50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2 font-medium">Year {row.year}</td>
                        <td className="text-right py-3 px-2 font-semibold">{formatCurrency(row.value, currency)}</td>
                        <td className="text-right py-3 px-2 text-emerald-500">{formatCurrency(row.interest, currency)}</td>
                        <td className="text-right py-3 px-2 text-amber-500">
                          {formatCurrency(Math.round(row.interest * (1 - taxRate / 100)), currency)}
                        </td>
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
