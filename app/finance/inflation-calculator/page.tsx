"use client";

import { useState, useMemo } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { ToolLayout } from "@/components/layout/ToolLayout";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Banknote, IndianRupee, Percent, Calendar, TrendingUp, ArrowUpRight, ArrowDownRight, Table, BadgePercent, ShoppingCart, Wallet, Gauge } from "lucide-react";

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

const MIN_AMOUNT = 100;
const MAX_AMOUNT = 1000000000;
const MIN_RATE = 0;
const MAX_RATE = 50;
const MIN_YEARS = 1;
const MAX_YEARS = 50;

const PIE_COLORS = ["#2563eb", "#ef4444"];

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

interface InflationResults {
  futurePurchasingPower: number;
  futureCost: number;
  valueLost: number;
  lossPercent: number;
  cumulativeInflation: number;
  yearsToHalve: number;
  chartData: { year: number; purchasingPower: number; futureCost: number }[];
  yearlyData: { year: number; purchasingPower: number; futureCost: number; valueLost: number }[];
}

function calculateInflation(
  presentValue: number,
  rate: number,
  years: number
): InflationResults {
  if (!Number.isFinite(presentValue) || !Number.isFinite(rate) || !Number.isFinite(years)) {
    return {
      futurePurchasingPower: 0, futureCost: 0, valueLost: 0, lossPercent: 0,
      cumulativeInflation: 0, yearsToHalve: 0, chartData: [], yearlyData: [],
    };
  }

  const clampedPV = Math.max(0, Math.min(presentValue, MAX_AMOUNT));
  const clampedRate = Math.max(0, Math.min(rate, MAX_RATE));
  const clampedYears = Math.max(0, Math.min(years, MAX_YEARS));

  if (clampedPV <= 0 || clampedYears <= 0) {
    return {
      futurePurchasingPower: 0, futureCost: 0, valueLost: 0, lossPercent: 0,
      cumulativeInflation: 0, yearsToHalve: 0, chartData: [], yearlyData: [],
    };
  }

  const r = clampedRate / 100;

  let futurePurchasingPower: number;
  let futureCost: number;

  if (clampedRate === 0) {
    futurePurchasingPower = clampedPV;
    futureCost = clampedPV;
  } else {
    futurePurchasingPower = clampedPV / Math.pow(1 + r, clampedYears);
    futureCost = clampedPV * Math.pow(1 + r, clampedYears);
  }

  const valueLost = Math.max(0, clampedPV - futurePurchasingPower);
  const lossPercent = clampedPV > 0 ? (1 - futurePurchasingPower / clampedPV) * 100 : 0;
  const cumulativeInflation = clampedRate === 0 ? 0 : (Math.pow(1 + r, clampedYears) - 1) * 100;

  let yearsToHalve = 0;
  if (clampedRate > 0) {
    yearsToHalve = Math.log(2) / Math.log(1 + r);
  }

  const chartData: InflationResults["chartData"] = [];
  const yearlyData: InflationResults["yearlyData"] = [];

  for (let i = 0; i <= clampedYears; i++) {
    let pp: number;
    let fc: number;

    if (clampedRate === 0) {
      pp = clampedPV;
      fc = clampedPV;
    } else {
      pp = clampedPV / Math.pow(1 + r, i);
      fc = clampedPV * Math.pow(1 + r, i);
    }

    chartData.push({
      year: i,
      purchasingPower: Math.round(pp),
      futureCost: Math.round(fc),
    });

    if (i > 0) {
      yearlyData.push({
        year: i,
        purchasingPower: Math.round(pp),
        futureCost: Math.round(fc),
        valueLost: Math.round(clampedPV - pp),
      });
    }
  }

  return {
    futurePurchasingPower: Math.round(futurePurchasingPower),
    futureCost: Math.round(futureCost),
    valueLost: Math.round(valueLost),
    lossPercent,
    cumulativeInflation,
    yearsToHalve,
    chartData,
    yearlyData,
  };
}

function ChartTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white border border-border rounded-xl shadow-xl p-4 text-sm space-y-2">
      <p className="font-semibold text-foreground">Year {label}</p>
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

export default function InflationCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const { value: presentValue, displayValue: presentValueDisplay, setValue: setPresentValue, handleChange: handlePresentValueChange, handleFocus: handlePresentValueFocus, handleBlur: handlePresentValueBlur } = useNumericField(100000);
  const { value: rate, displayValue: rateDisplay, setValue: setRate, handleChange: handleRateChange, handleFocus: handleRateFocus, handleBlur: handleRateBlur } = useNumericField(6);
  const { value: years, displayValue: yearsDisplay, setValue: setYears, handleChange: handleYearsChange, handleFocus: handleYearsFocus, handleBlur: handleYearsBlur } = useNumericField(10);
  const [showTable, setShowTable] = useState(false);

  const results = useMemo(
    () => calculateInflation(presentValue, rate, years),
    [presentValue, rate, years]
  );

  const {
    futurePurchasingPower, futureCost, valueLost, lossPercent,
    cumulativeInflation, yearsToHalve, chartData, yearlyData,
  } = results;

  const pieData = useMemo(() => [
    { name: "Original Value", value: presentValue },
    { name: "Value Lost to Inflation", value: valueLost },
  ], [presentValue, valueLost]);

  const halved = yearsToHalve > 0 && years > 0;
  const inputRangeClass = "w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer";

  return (
    <ToolLayout
      title="Inflation Calculator"
      description="Calculate how inflation erodes your money's purchasing power over time. See the future value of your money, the equivalent future cost of goods, and the cumulative impact of inflation with detailed charts and year-by-year analysis."
      category="finance"
      faqContent={[
        {
          question: "What is inflation and how does it affect my money?",
          answer: "Inflation is the rate at which the general level of prices for goods and services rises over time, causing purchasing power to fall. If inflation is 6%, something that costs ₹100 today will cost ₹106 next year, while the purchasing power of ₹100 drops to ₹94.34. This calculator shows both perspectives - how your money's value declines and how costs rise.",
        },
        {
          question: "How is the inflation calculation performed?",
          answer: "The calculator uses the compound interest formula in reverse for purchasing power: Future Purchasing Power = Present Value / (1 + r)^n, where r is the inflation rate and n is the number of years. For future cost, it uses the standard compounding formula: Future Cost = Present Value × (1 + r)^n. The difference between the two shows inflation's dual impact.",
        },
        {
          question: "What is the Rule of 72 for inflation?",
          answer: "The Rule of 72 estimates how long it takes for inflation to halve your money's purchasing power. Divide 72 by the annual inflation rate. At 6% inflation: 72 ÷ 6 = 12 years. At 4%: 72 ÷ 4 = 18 years. At 8%: just 9 years. This calculator computes the exact halving time using logarithms for precision.",
        },
        {
          question: "What is a normal inflation rate?",
          answer: "Central banks typically target 2-3% inflation in developed economies. In developing economies like India, inflation averages 4-6%. Hyperinflation is defined as rates exceeding 50% per month. This calculator handles rates from 0% to 50%, covering everything from deflation to extreme inflation scenarios.",
        },
        {
          question: "How does inflation affect retirement planning?",
          answer: "Inflation is the biggest threat to retirement savings. If you need ₹50,000/month today, at 6% inflation you'll need ~₹1,60,000/month in 20 years to maintain the same lifestyle. That's why retirement calculators use real (inflation-adjusted) returns. This tool helps you visualize exactly how much more you'll need.",
        },
        {
          question: "What is the difference between nominal and real returns?",
          answer: "Nominal return is the raw percentage return on an investment. Real return is adjusted for inflation: (1 + nominal) = (1 + real) × (1 + inflation). If your FD gives 7% and inflation is 6%, your real return is only ~0.94%. Understanding this distinction is crucial for accurate financial planning.",
        },
        {
          question: "How does inflation impact different asset classes?",
          answer: "Cash and fixed deposits lose value in high-inflation environments (negative real returns). Real estate and gold often appreciate with inflation. Equities have historically outpaced inflation over long periods, delivering 3-5% real returns. TIPS (Treasury Inflation-Protected Securities) and inflation-indexed bonds adjust payouts for inflation.",
        },
        {
          question: "What causes inflation?",
          answer: "Inflation is primarily caused by demand-pull factors (too much money chasing too few goods), cost-push factors (rising production costs), and monetary factors (increased money supply). Supply chain disruptions, fiscal policy, exchange rates, and wage growth also contribute. Central banks manage inflation through interest rate adjustments.",
        },
        {
          question: "How can I protect my savings from inflation?",
          answer: "To protect against inflation: invest in assets that historically outpace inflation (equities, real estate, gold); maintain diversified portfolios; consider inflation-indexed bonds; avoid holding excessive cash; regularly increase your savings rate as income grows; and invest for the long term to benefit from compounding that exceeds inflation.",
        },
        {
          question: "What is hyperinflation and has it occurred?",
          answer: "Hyperinflation is extremely rapid inflation, typically exceeding 50% per month. Notable historical examples: Zimbabwe (2008, 79.6 billion % monthly), Germany (1923, 29,500% monthly), Hungary (1946, 41.9 quadrillion % monthly), and more recently Venezuela (2018, ~65,000% annually). This calculator supports rates up to 50% for analyzing high-inflation scenarios.",
        },
      ]}
      explanationContent={
        <div className="prose prose-slate max-w-none">
          <h2>What is an Inflation Calculator?</h2>
          <p>
            An <strong>Inflation Calculator</strong> is a financial tool that shows how the purchasing power of money changes over time due to inflation. It answers two critical questions: (1) How much will today's money be worth in the future? and (2) How much money will you need in the future to buy what you can buy today? Understanding inflation is essential for accurate financial planning, investment decisions, and retirement preparation.
          </p>

          <h3>The Inflation Formula</h3>
          <p>The calculator uses two complementary formulas to show inflation's dual impact:</p>

          <h4>Future Purchasing Power</h4>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
            FV = PV / (1 + r)<sup>n</sup>
          </pre>
          <p>This shows how much your current money will be worth in the future. For example, at 6% inflation, ₹1,00,000 today will have the purchasing power of only ~₹55,839 in 10 years - you've lost nearly half your money's value.</p>

          <h4>Future Cost Equivalent</h4>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
            FV = PV × (1 + r)<sup>n</sup>
          </pre>
          <p>This shows how much you'll need in the future to buy what costs ₹1,00,000 today. At 6% inflation, you'll need ~₹1,79,085 in 10 years to buy the same goods and services.</p>

          <h4>Cumulative Inflation Rate</h4>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
            Cumulative Inflation = (1 + r)<sup>n</sup> - 1
          </pre>
          <p>At 6% over 10 years, cumulative inflation is ~79.1% - meaning prices have nearly doubled.</p>

          <h3>Benefits of Using an Inflation Calculator</h3>
          <ul>
            <li><strong>Accurate Financial Planning:</strong> See the real value of your future savings, investments, and retirement corpus in today's terms, enabling realistic goal setting.</li>
            <li><strong>Investment Strategy:</strong> Determine the minimum return required to preserve purchasing power. If inflation is 6%, your investments must earn at least 6% just to break even in real terms.</li>
            <li><strong>Retirement Readiness:</strong> Calculate how much retirement income you'll truly need. A ₹50,000/month lifestyle today could require ₹1-2 lakhs/month in 15-30 years.</li>
            <li><strong>Education & Health Planning:</strong> Education costs have historically risen 8-12% annually in India - far above general inflation. Use this to project future college costs.</li>
            <li><strong>Salary Negotiation:</strong> Understand whether your salary increases are keeping pace with inflation and delivering real growth or just maintaining your current standard of living.</li>
          </ul>

          <h3>Example Calculation</h3>
          <p><strong>Scenario:</strong> You have ₹1,00,000 today and want to know its value in 10 years at 6% annual inflation.</p>
          <ul>
            <li><strong>Present Value:</strong> ₹1,00,000</li>
            <li><strong>Inflation Rate:</strong> 6% per annum</li>
            <li><strong>Time Period:</strong> 10 years</li>
            <li><strong>Future Purchasing Power:</strong> ~₹55,839 - your ₹1,00,000 will buy only what ₹55,839 buys today</li>
            <li><strong>Future Cost Equivalent:</strong> ~₹1,79,085 - you'll need ₹1,79,085 to buy what ₹1,00,000 buys today</li>
            <li><strong>Value Lost to Inflation:</strong> ~₹44,161 (44.2% of your original value)</li>
            <li><strong>Cumulative Inflation:</strong> ~79.1% - prices have nearly doubled over the decade</li>
            <li><strong>Years to Halve:</strong> ~11.9 years - at 6% inflation, your money loses half its value in about 12 years</li>
          </ul>

          <h3>Common Mistakes to Avoid</h3>
          <ul>
            <li><strong>Ignoring inflation in long-term plans:</strong> Many people set retirement or savings goals based on today's costs without accounting for inflation, leading to severe shortfalls 20-30 years out.</li>
            <li><strong>Confusing nominal and real returns:</strong> A 7% FD return sounds good, but at 6% inflation, your real return is only ~0.94%. Always think in real (inflation-adjusted) terms.</li>
            <li><strong>Using historical averages blindly:</strong> Past 10-year average inflation may not predict the next 10 years. Run multiple scenarios with different rates (optimistic: 4%, moderate: 6%, pessimistic: 8%).</li>
            <li><strong>Not accounting for category-specific inflation:</strong> Education (8-12%), healthcare (8-10%), and housing (6-8%) often inflate faster than general CPI. Use category-specific rates for goal planning.</li>
            <li><strong>Assuming deflation is beneficial:</strong> While low/deflation sounds good, persistent deflation can indicate economic distress. Moderate, stable inflation (2-6%) is generally healthy for growing economies.</li>
          </ul>

          <h3>Tips for Beating Inflation</h3>
          <ul>
            <li><strong>Invest in growth assets:</strong> Equities have historically delivered 10-12% returns in India, outpacing inflation by 4-6% over long periods. Include equity mutual funds or index funds in your portfolio.</li>
            <li><strong>Diversify across asset classes:</strong> A mix of equities, real estate, gold, and fixed income provides inflation protection while managing risk. Rebalance annually based on market conditions.</li>
            <li><strong>Use inflation-indexed instruments:</strong> Consider Inflation-Indexed Bonds (IIBs) or inflation-beating small savings schemes like PPF (currently ~7.1%) and SSY (~8.2%).</li>
            <li><strong>Increase savings rate regularly:</strong> As your income grows with inflation, increase your savings rate proportionally. Aim to save at least 15-20% of income for long-term goals.</li>
            <li><strong>Review and adjust annually:</strong> Inflation rates change, and so should your plans. Review your financial projections annually with updated inflation assumptions and adjust your savings rate accordingly.</li>
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
              <label htmlFor="inf-currency" className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <Banknote className="w-4 h-4 text-primary" />
                Currency
              </label>
              <select id="inf-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>

            {/* Present Value */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <IndianRupee className="w-4 h-4 text-primary" />
                <span>Present Amount</span>
                <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(presentValue, currency)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                <input type="text" inputMode="decimal" value={presentValueDisplay} onChange={(e) => handlePresentValueChange(e.target.value)} onFocus={handlePresentValueFocus} onBlur={handlePresentValueBlur} className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter amount" />
              </div>
              <input id="inf-amount" type="range" min={MIN_AMOUNT} max={MAX_AMOUNT} step={1000} value={presentValue}
                onChange={(e) => setPresentValue(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_AMOUNT} aria-valuemax={MAX_AMOUNT} aria-valuenow={presentValue} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(MIN_AMOUNT, currency)}</span>
                <span>{formatCurrency(MAX_AMOUNT, currency)}</span>
              </div>
            </div>

            {/* Inflation Rate */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Percent className="w-4 h-4 text-primary" />
                <span>Inflation Rate (p.a.)</span>
                <span className="ml-auto text-lg font-bold text-primary">{rate}%</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input type="text" inputMode="decimal" value={rateDisplay} onChange={(e) => handleRateChange(e.target.value)} onFocus={handleRateFocus} onBlur={handleRateBlur} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter rate" />
                </div>
                <span className="text-muted-foreground font-medium text-sm">%</span>
              </div>
              <input id="inf-rate" type="range" min={MIN_RATE} max={MAX_RATE} step={0.25} value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_RATE} aria-valuemax={MAX_RATE} aria-valuenow={rate} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MIN_RATE}%</span>
                <span>{MAX_RATE}%</span>
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
                <input type="text" inputMode="decimal" value={yearsDisplay} onChange={(e) => handleYearsChange(e.target.value)} onFocus={handleYearsFocus} onBlur={handleYearsBlur} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter years" />
              </div>
              <input id="inf-years" type="range" min={MIN_YEARS} max={MAX_YEARS} step={1} value={years}
                onChange={(e) => setYears(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_YEARS} aria-valuemax={MAX_YEARS} aria-valuenow={years} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MIN_YEARS} Yr</span>
                <span>{MAX_YEARS} Yrs</span>
              </div>
            </div>

            {/* Quick Insight: Years to Halve */}
            {halved && (
              <div className="bg-gray-50 border border-border/50 rounded-lg p-3 text-sm flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Gauge className="w-4 h-4 text-primary" />
                  Years for money to halve in value
                </span>
                <span className="font-semibold text-primary">{yearsToHalve.toFixed(1)} years</span>
              </div>
            )}
          </div>

          {/* Results Cards */}
          <div className="space-y-4">
            {/* Future Purchasing Power Hero */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground font-medium">Future Purchasing Power</p>
              </div>
              <p className="text-4xl font-extrabold text-primary break-words">{formatCurrency(futurePurchasingPower, currency)}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <ArrowDownRight className="w-4 h-4 text-red-500" />
                <span>Value eroded by {lossPercent.toFixed(1)}% due to inflation</span>
              </div>
            </div>

            {/* Mini Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <ShoppingCart className="w-3 h-3 text-amber-500" />
                  Future Cost Equivalent
                </p>
                <p className="text-lg font-bold text-amber-500 break-words">{formatCurrency(futureCost, currency)}</p>
              </div>
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <BadgePercent className="w-3 h-3 text-red-500" />
                  Cumulative Inflation
                </p>
                <p className="text-lg font-bold text-red-500 break-words">{formatPercent(cumulativeInflation / 100)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3 text-red-500" />
                  Value Lost to Inflation
                </p>
                <p className="text-lg font-bold text-red-500 break-words">{formatCurrency(valueLost, currency)}</p>
              </div>
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-primary" />
                  Avg Annual Erosion
                </p>
                <p className="text-lg font-bold text-primary break-words">{rate > 0 ? `${(100 - 100 / (1 + rate / 100)).toFixed(1)}%` : "0%"}</p>
              </div>
            </div>

            {/* Pie Chart */}
            {valueLost > 0 && (
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
                    <p className="text-[11px] text-muted-foreground mb-0.5">Current Cost</p>
                    <p className="text-sm font-semibold">{formatCurrency(presentValue, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Inflation Impact</p>
                    <p className="text-sm font-semibold text-red-500">{formatCurrency(valueLost, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Future Cost</p>
                    <p className="text-sm font-semibold">{formatCurrency(futureCost, currency)}</p>
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
                Inflation Impact Over Time
              </h3>
            </div>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ppGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="year" fontSize={11} tickMargin={8} tickFormatter={(v) => `Yr ${v}`} />
                  <YAxis tickFormatter={(v: number) => formatCompact(v, currency)} fontSize={11} width={60} />
                  <Tooltip content={<ChartTooltip currency={currency} />} />
                  <Area type="monotone" dataKey="futureCost" stroke="#f59e0b" strokeWidth={2}
                    fill="url(#fcGrad)" dot={false} name="Future Cost" animationDuration={1000} />
                  <Area type="monotone" dataKey="purchasingPower" stroke="#2563eb" strokeWidth={2}
                    fill="url(#ppGrad)" dot={false} name="Purchasing Power" animationDuration={1200} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded bg-blue-500" />
                <span>Purchasing Power</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded bg-amber-500" />
                <span>Future Cost</span>
              </div>
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
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Purchasing Power</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Future Cost</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Value Lost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyData.map((row) => (
                      <tr key={row.year} className="border-b border-border/50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2 font-medium">Year {row.year}</td>
                        <td className="text-right py-3 px-2 font-semibold">{formatCurrency(row.purchasingPower, currency)}</td>
                        <td className="text-right py-3 px-2 text-amber-500">{formatCurrency(row.futureCost, currency)}</td>
                        <td className="text-right py-3 px-2 text-red-500">{formatCurrency(row.valueLost, currency)}</td>
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
