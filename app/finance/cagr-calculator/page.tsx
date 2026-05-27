"use client";

import { useState, useMemo, useCallback } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { ToolLayout } from "@/components/layout/ToolLayout";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Banknote, DollarSign, Percent, Calendar, PiggyBank, TrendingUp, ArrowUpRight, Table, Target } from "lucide-react";

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

const MIN_START = 1000;
const MAX_START = 10000000;
const MIN_END = 0;
const MAX_END = 50000000;
const MIN_YEARS = 1;
const MAX_YEARS = 50;

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
  const sign = value >= 0 ? "+" : "";
  return `${sign}${(Math.round(value * 1000) / 10).toFixed(1)}%`;
}

interface CAGRResults {
  cagr: number;
  totalReturn: number;
  totalReturnPercent: number;
  investmentMultiple: number;
  chartData: { year: string; Value: number }[];
  yearlyData: { year: number; value: number; returns: number }[];
}

function calculateCAGR(
  startValue: number,
  endValue: number,
  years: number
): CAGRResults {
  if (!Number.isFinite(startValue) || !Number.isFinite(endValue) || !Number.isFinite(years)) {
    return { cagr: 0, totalReturn: 0, totalReturnPercent: 0, investmentMultiple: 0, chartData: [], yearlyData: [] };
  }

  const clampedStart = Math.max(0, Math.min(startValue, MAX_START));
  const clampedEnd = Math.max(0, Math.min(endValue, MAX_END));
  const clampedYears = Math.max(0, Math.min(years, MAX_YEARS));

  if (clampedStart <= 0 || clampedYears <= 0) {
    return { cagr: 0, totalReturn: 0, totalReturnPercent: 0, investmentMultiple: 0, chartData: [], yearlyData: [] };
  }

  const totalReturn = clampedEnd - clampedStart;
  const totalReturnPercent = (clampedEnd / clampedStart - 1) * 100;
  const investmentMultiple = clampedEnd / clampedStart;

  let cagr: number;
  if (clampedEnd <= 0) {
    cagr = -100;
  } else if (clampedEnd <= clampedStart) {
    cagr = (Math.pow(clampedEnd / clampedStart, 1 / clampedYears) - 1) * 100;
  } else {
    cagr = (Math.pow(clampedEnd / clampedStart, 1 / clampedYears) - 1) * 100;
  }

  const r = cagr / 100;
  const chartData: CAGRResults["chartData"] = [{ year: "Start", Value: clampedStart }];
  const yearlyData: CAGRResults["yearlyData"] = [];

  for (let i = 1; i <= clampedYears; i++) {
    const fv = clampedStart * Math.pow(1 + r, i);
    chartData.push({ year: `Yr ${i}`, Value: Math.round(fv) });
    yearlyData.push({
      year: i,
      value: Math.round(fv),
      returns: Math.round(fv - clampedStart),
    });
  }

  return {
    cagr,
    totalReturn: Math.round(totalReturn),
    totalReturnPercent,
    investmentMultiple,
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

export default function CAGRCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [showTable, setShowTable] = useState(false);

  const { value: startValue, displayValue: startValueDisplay, setValue: setStartValue, handleChange: handleStartChange, handleFocus: handleStartFocus, handleBlur: handleStartBlur } = useNumericField(50000);
  const { value: endValue, displayValue: endValueDisplay, setValue: setEndValue, handleChange: handleEndChange, handleFocus: handleEndFocus, handleBlur: handleEndBlur } = useNumericField(150000);
  const { value: years, displayValue: yearsDisplay, setValue: setYears, handleChange: handleYearsChange, handleFocus: handleYearsFocus, handleBlur: handleYearsBlur } = useNumericField(5);

  const results = useMemo(
    () => calculateCAGR(startValue, endValue, years),
    [startValue, endValue, years]
  );

  const { cagr, totalReturn, totalReturnPercent, investmentMultiple, chartData, yearlyData } = results;

  const pieData = useMemo(
    () => [
      { name: "Invested Amount", value: startValue },
      { name: "Total Returns", value: totalReturn > 0 ? totalReturn : 0 },
    ],
    [startValue, totalReturn]
  );

  const positiveReturn = totalReturn > 0;
  const isNegativeReturn = totalReturn < 0;
  const returnsPercent = endValue > 0 ? (totalReturn / endValue) * 100 : 0;

  const inputRangeClass =
    "w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer";

  return (
    <ToolLayout
      title="CAGR Calculator"
      description="Calculate the Compound Annual Growth Rate of your investment. Enter the beginning value, ending value, and time period to determine the annualized return rate with charts and year-by-year projections."
      category="finance"
      faqContent={[
        {
          question: "What is CAGR (Compound Annual Growth Rate)?",
          answer: "CAGR is the mean annual growth rate of an investment over a specified time period longer than one year. It represents one of the most accurate ways to calculate and determine returns for anything that can rise or fall in value over time. CAGR smooths out the effects of volatility and provides a single annualized rate that represents the consistent rate at which the investment would have grown if it grew at a steady pace.",
        },
        {
          question: "How does the CAGR calculator work?",
          answer: "The calculator uses the CAGR formula: CAGR = (Ending Value / Beginning Value)^(1/years) - 1. You enter the beginning value of your investment, its ending value after a certain period, and the number of years. The calculator instantly computes the annualized growth rate, total return amount, total return percentage, and the investment multiple.",
        },
        {
          question: "What is the difference between CAGR and absolute return?",
          answer: "Absolute return simply measures the total percentage change from start to end, regardless of time. CAGR annualizes the return, giving you the average yearly growth rate. For example, a 50% absolute return over 5 years is about 8.4% CAGR. CAGR is more useful for comparing investments with different time periods because it normalizes returns to an annual basis.",
        },
        {
          question: "Can CAGR be negative?",
          answer: "Yes, CAGR can be negative if the ending value is less than the beginning value. This indicates that the investment lost value over the period. For example, an investment that drops from $10,000 to $8,000 over 3 years has a CAGR of approximately -7.2%. The calculator handles negative CAGR values and displays them correctly in all results and charts.",
        },
        {
          question: "What is a good CAGR for investments?",
          answer: "A 'good' CAGR depends on the investment type and market conditions. S&P 500 has historically returned about 7-10% CAGR over long periods. Indian equity mutual funds average 10-14% CAGR. Real estate typically returns 8-12% CAGR. Fixed deposits offer 5-8% CAGR. A CAGR above the inflation rate (typically 3-6%) means your investment has grown in real terms.",
        },
        {
          question: "How does CAGR differ from IRR (Internal Rate of Return)?",
          answer: "CAGR assumes a single lump sum investment with no intermediate cash flows. IRR is used when there are multiple cash flows over time (like SIP investments). CAGR is simpler and appropriate for straightforward investments, while IRR accounts for the timing of each cash flow. For lump sum investments, CAGR and IRR produce the same result.",
        },
        {
          question: "What is the investment multiple?",
          answer: "The investment multiple (also called 'money multiple' or 'MOIC') shows how many times your initial investment has grown. A multiple of 2.0 means your investment doubled. A multiple of 3.5 means it grew 3.5 times. The multiple is simply the ending value divided by the beginning value. It is a useful metric alongside CAGR for understanding total wealth creation.",
        },
        {
          question: "Can CAGR be used for non-financial calculations?",
          answer: "Yes, CAGR can be applied to any metric that changes over time - company revenue growth, user base growth, website traffic growth, GDP growth, population growth, and more. The formula is universal: (final/initial)^(1/years) - 1. This makes the CAGR calculator useful beyond just investment returns.",
        },
        {
          question: "What are the limitations of CAGR?",
          answer: "CAGR assumes smooth, consistent growth and ignores volatility. An investment may have had wild swings but still show a steady CAGR. CAGR also does not account for additional investments or withdrawals during the period. For accurate analysis, use CAGR alongside other metrics like standard deviation, Sharpe ratio, and maximum drawdown.",
        },
        {
          question: "How do I calculate CAGR for partial years?",
          answer: "For partial years, express the time as a decimal. For example, 2 years and 6 months = 2.5 years. The calculator uses whole years, but the formula works with any positive time value. For precise calculations with partial years, you can use the formula directly: (ending/beginning)^(1/years) - 1 with the decimal year value.",
        },
      ]}
      explanationContent={
        <div className="prose prose-slate max-w-none">
          <h2>What is a CAGR Calculator?</h2>
          <p>
            A <strong>CAGR (Compound Annual Growth Rate) calculator</strong> is a financial tool that computes the annualized rate of return of an investment over a specified time period. Unlike simple return calculations that show total growth, CAGR smooths out volatility and provides a single, comparable annualized rate - making it the most widely used metric for evaluating and comparing investment performance across different timeframes.
          </p>

          <h3>The CAGR Formula</h3>
          <p>The calculator uses the standard CAGR formula:</p>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
            CAGR = (EV / BV)<sup>(1/t)</sup> - 1
          </pre>
          <p>Where:</p>
          <ul>
            <li><strong>EV</strong> = Ending value (final investment value)</li>
            <li><strong>BV</strong> = Beginning value (initial investment)</li>
            <li><strong>t</strong> = Number of years</li>
            <li><strong>CAGR</strong> = Annualized growth rate (as a decimal)</li>
          </ul>

          <h3>Related Metrics</h3>
          <p>From the CAGR calculation, the calculator also derives:</p>
          <ul>
            <li><strong>Total Return:</strong> EV - BV - the absolute gain or loss in currency terms</li>
            <li><strong>Total Return Percentage:</strong> (EV/BV - 1) × 100 - the total growth rate over the entire period</li>
            <li><strong>Investment Multiple:</strong> EV/BV - how many times your investment grew (e.g., 2.5× means your money multiplied by 2.5)</li>
          </ul>

          <h3>Benefits of Using CAGR</h3>
          <ul>
            <li><strong>Apples-to-Apples Comparison:</strong> CAGR allows you to compare investments with different time periods on a level playing field by annualizing their returns.</li>
            <li><strong>Volatility Smoothing:</strong> CAGR ignores the ups and downs along the way, giving you a single meaningful rate that represents the overall trend.</li>
            <li><strong>Performance Benchmarking:</strong> Compare your investment's CAGR against market indices (S&P 500, Nifty 50), inflation rates, or target returns to evaluate performance.</li>
            <li><strong>Goal Planning:</strong> Use CAGR in reverse to determine what return rate you need to achieve a specific investment goal within a given timeframe.</li>
            <li><strong>Universal Application:</strong> CAGR works for stocks, mutual funds, real estate, business revenue, GDP, population - any metric that changes over time.</li>
          </ul>

          <h3>Example Calculation</h3>
          <p><strong>Scenario:</strong> You invested $50,000 in a mutual fund 5 years ago, and it is now worth $85,000.</p>
          <ul>
            <li><strong>Beginning Value:</strong> $50,000</li>
            <li><strong>Ending Value:</strong> $85,000</li>
            <li><strong>Time Period:</strong> 5 years</li>
            <li><strong>CAGR:</strong> (85,000 / 50,000)<sup>(1/5)</sup> - 1 ≈ 11.2% per year</li>
            <li><strong>Total Return:</strong> $85,000 - $50,000 = $35,000 (70% absolute return)</li>
            <li><strong>Investment Multiple:</strong> 1.7× your initial investment</li>
          </ul>
          <p>Your investment grew at an average rate of 11.2% per year, turning $50,000 into $85,000 over 5 years - a 70% total return.</p>

          <h3>Common Mistakes to Avoid</h3>
          <ul>
            <li><strong>Confusing CAGR with absolute return:</strong> A 100% return over 5 years is not 20% per year - it is approximately 14.9% CAGR. Always annualize returns when comparing across time periods.</li>
            <li><strong>Ignoring the time period:</strong> A 15% CAGR over 2 years is impressive, but the same rate over 15 years is extraordinary. Always consider the time period alongside the CAGR.</li>
            <li><strong>Using CAGR for volatile assets naively:</strong> CAGR hides volatility. An investment with 30% CAGR could have had 50% drawdowns along the way. Use CAGR alongside risk metrics.</li>
            <li><strong>Applying CAGR to cash flows:</strong> CAGR assumes a single investment with no additions or withdrawals. For SIPs or investments with multiple cash flows, use XIRR instead.</li>
            <li><strong>Past CAGR â‰  future returns:</strong> A high historical CAGR does not guarantee future performance. Markets mean-revert, and exceptional past returns often moderate over time.</li>
          </ul>

          <h3>Tips for Using CAGR Effectively</h3>
          <ul>
            <li><strong>Compare against benchmarks:</strong> Always compare your investment's CAGR against relevant benchmarks (e.g., Nifty 50 for Indian equities, S&P 500 for US equities) over the same period.</li>
            <li><strong>Use multiple timeframes:</strong> Calculate CAGR over 1-year, 3-year, 5-year, and 10-year periods to get a complete picture of performance consistency.</li>
            <li><strong>Consider inflation-adjusted CAGR:</strong> Subtract the average inflation rate from your CAGR to get the 'real' return. If CAGR is 10% and inflation is 5%, your real return is about 4.8%.</li>
            <li><strong>Look for consistency:</strong> A fund with 12% CAGR over 10 years with low volatility is often better than one with 15% CAGR but high volatility and large drawdowns.</li>
            <li><strong>Use for goal setting:</strong> Work backward from your financial goal. If you need $200,000 in 10 years from a $100,000 investment, you need approximately 7.2% CAGR - use this calculator to determine the required rate.</li>
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
              <label htmlFor="cagr-currency" className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <Banknote className="w-4 h-4 text-primary" />
                Currency
              </label>
              <select id="cagr-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>

            {/* Beginning Value */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <DollarSign className="w-4 h-4 text-primary" />
                <span>Beginning Value</span>
                <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(startValue, currency)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={startValueDisplay}
                  onChange={(e) => handleStartChange(e.target.value)}
                  onFocus={handleStartFocus}
                  onBlur={handleStartBlur}
                  className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="Enter amount"
                />
              </div>
              <input
                id="cagr-start"
                type="range"
                min={MIN_START}
                max={MAX_START}
                step={1000}
                value={startValue}
                onChange={(e) => setStartValue(parseFloat(e.target.value))}
                className={inputRangeClass}
                aria-valuemin={MIN_START}
                aria-valuemax={MAX_START}
                aria-valuenow={startValue}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(MIN_START, currency)}</span>
                <span>{formatCurrency(MAX_START, currency)}</span>
              </div>
            </div>

            {/* Ending Value */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Target className="w-4 h-4 text-primary" />
                <span>Ending Value</span>
                <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(endValue, currency)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={endValueDisplay}
                  onChange={(e) => handleEndChange(e.target.value)}
                  onFocus={handleEndFocus}
                  onBlur={handleEndBlur}
                  className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="Enter amount"
                />
              </div>
              <input
                id="cagr-end"
                type="range"
                min={MIN_END}
                max={MAX_END}
                step={1000}
                value={endValue}
                onChange={(e) => setEndValue(parseFloat(e.target.value))}
                className={inputRangeClass}
                aria-valuemin={MIN_END}
                aria-valuemax={MAX_END}
                aria-valuenow={endValue}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(MIN_END, currency)}</span>
                <span>{formatCurrency(MAX_END, currency)}</span>
              </div>
            </div>

            {/* Time Period */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Calendar className="w-4 h-4 text-primary" />
                <span>Time Period</span>
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
              <input
                id="cagr-years"
                type="range"
                min={MIN_YEARS}
                max={MAX_YEARS}
                step={1}
                value={years}
                onChange={(e) => setYears(parseFloat(e.target.value))}
                className={inputRangeClass}
                aria-valuemin={MIN_YEARS}
                aria-valuemax={MAX_YEARS}
                aria-valuenow={years}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MIN_YEARS} Year</span>
                <span>{MAX_YEARS} Years</span>
              </div>
            </div>
          </div>

          {/* Results Cards */}
          <div className="space-y-4">
            {/* CAGR Hero Card */}
            <div className={`rounded-xl p-6 border ${
              cagr >= 0
                ? "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
                : "bg-gradient-to-br from-red-50 to-red-100/50 border-red-200"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className={`w-5 h-5 ${cagr >= 0 ? "text-primary" : "text-red-500"}`} />
                <p className="text-sm text-muted-foreground font-medium">Compound Annual Growth Rate</p>
              </div>
              <p className={`text-4xl font-extrabold break-words ${cagr >= 0 ? "text-primary" : "text-red-500"}`}>
                {formatPercent(cagr / 100)}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground min-w-0">
                <ArrowUpRight className={`w-4 h-4 flex-shrink-0 ${cagr >= 0 ? "text-emerald-500" : "text-red-500 rotate-180"}`} />
                <span className="truncate">{formatCurrency(startValue, currency)} → {formatCurrency(endValue, currency)} · {years} {years === 1 ? "yr" : "yrs"}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-border rounded-xl p-3 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1">Total Return</p>
                <p className={`text-sm font-bold truncate ${isNegativeReturn ? "text-red-500" : "text-emerald-500"}`}>
                  {isNegativeReturn ? "-" : "+"}{formatCurrency(Math.abs(totalReturn), currency)}
                </p>
              </div>
              <div className="bg-white border border-border rounded-xl p-3 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1">Return %</p>
                <p className={`text-sm font-bold truncate ${isNegativeReturn ? "text-red-500" : "text-emerald-500"}`}>
                  {formatPercent(totalReturnPercent / 100)}
                </p>
              </div>
              <div className="bg-white border border-border rounded-xl p-3 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1">Multiple</p>
                <p className="text-sm font-bold truncate">
                  {investmentMultiple.toFixed(2)}×
                </p>
              </div>
            </div>

            {positiveReturn && (
              <div className="bg-white border border-border rounded-xl p-6">
                <div className="flex items-center justify-center h-36">
                  <ResponsiveContainer width="100%" height="100%">
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
                    <p className="text-[11px] text-muted-foreground mb-0.5">Total Invested</p>
                    <p className="text-sm font-semibold">{formatCurrency(startValue, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Est. Returns</p>
                    <p className="text-sm font-semibold text-emerald-500">{formatCurrency(totalReturn, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">CAGR</p>
                    <p className="text-sm font-semibold">{cagr.toFixed(2)}%</p>
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
                Growth Trajectory at CAGR
              </h3>
            </div>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cagrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={cagr >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={cagr >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="year" fontSize={11} tickMargin={8} />
                  <YAxis tickFormatter={(v: number) => formatCompact(v, currency)} fontSize={11} width={60} />
                  <Tooltip content={<ChartTooltip currency={currency} />} />
                  <Area
                    type="monotone"
                    dataKey="Value"
                    stroke={cagr >= 0 ? "#10b981" : "#ef4444"}
                    strokeWidth={2}
                    fill="url(#cagrGrad)"
                    dot={false}
                    animationDuration={1200}
                  />
                </AreaChart>
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
              Yearly Breakdown at CAGR
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
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Returns</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">YoY Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyData.map((row, idx) => {
                      const prevValue = idx === 0 ? startValue : yearlyData[idx - 1].value;
                      const yoyGrowth = prevValue > 0 ? ((row.value - prevValue) / prevValue) * 100 : 0;
                      return (
                        <tr key={row.year} className="border-b border-border/50 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-2 font-medium">Year {row.year}</td>
                          <td className="text-right py-3 px-2">{formatCurrency(row.value, currency)}</td>
                          <td className={`text-right py-3 px-2 ${row.returns > 0 ? "text-emerald-500" : "text-muted-foreground"}`}>
                            {row.returns > 0 ? formatCurrency(row.returns, currency) : "-"}
                          </td>
                          <td className={`text-right py-3 px-2 ${yoyGrowth >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {formatPercent(yoyGrowth / 100)}
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
