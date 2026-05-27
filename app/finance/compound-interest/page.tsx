"use client";

import { useState, useMemo, useCallback } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { ToolLayout } from "@/components/layout/ToolLayout";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Banknote, DollarSign, Percent, Calendar, PiggyBank, TrendingUp, ArrowUpRight, Table } from "lucide-react";

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

const MIN_PRINCIPAL = 100;
const MAX_PRINCIPAL = 10000000;
const MIN_RATE = 0.1;
const MAX_RATE = 50;
const MIN_YEARS = 1;
const MAX_YEARS = 50;

const FREQUENCIES = [
  { value: 1, label: "Annually" },
  { value: 2, label: "Semi-Annually" },
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
  return `${Math.round(value * 10) / 10}%`;
}

interface CIResults {
  totalAmount: number;
  totalInterest: number;
  principal: number;
  effectiveRate: number;
  chartData: { year: string; Principal: number; Value: number }[];
  yearlyData: { year: number; principal: number; value: number; interest: number }[];
}

function calculateCI(
  p: number,
  rate: number,
  years: number,
  freq: number
): CIResults {
  if (!Number.isFinite(p) || !Number.isFinite(rate) || !Number.isFinite(years) || !Number.isFinite(freq)) {
    return { totalAmount: 0, totalInterest: 0, principal: 0, effectiveRate: 0, chartData: [], yearlyData: [] };
  }

  const clampedP = Math.max(0, Math.min(p, MAX_PRINCIPAL));
  const clampedRate = Math.max(0, Math.min(rate, MAX_RATE));
  const clampedYears = Math.max(0, Math.min(years, MAX_YEARS));

  if (clampedP <= 0 || clampedYears <= 0) {
    return { totalAmount: 0, totalInterest: 0, principal: clampedP, effectiveRate: 0, chartData: [], yearlyData: [] };
  }

  const r = clampedRate / 100;
  let totalAmount: number;
  let effectiveRate: number;

  if (clampedRate === 0) {
    totalAmount = clampedP;
    effectiveRate = 0;
  } else if (freq === 0) {
    totalAmount = clampedP * Math.exp(r * clampedYears);
    effectiveRate = (Math.exp(r) - 1) * 100;
  } else {
    totalAmount = clampedP * Math.pow(1 + r / freq, freq * clampedYears);
    effectiveRate = (Math.pow(1 + r / freq, freq) - 1) * 100;
  }

  const totalInterest = Math.max(0, totalAmount - clampedP);

  const chartData: CIResults["chartData"] = [];
  const yearlyData: CIResults["yearlyData"] = [];

  for (let i = 0; i <= clampedYears; i++) {
    let fv: number;
    if (clampedRate === 0) {
      fv = clampedP;
    } else if (freq === 0) {
      fv = clampedP * Math.exp(r * i);
    } else {
      fv = clampedP * Math.pow(1 + r / freq, freq * i);
    }
    chartData.push({
      year: i === 0 ? "Start" : `Yr ${i}`,
      Principal: Math.round(clampedP),
      Value: Math.round(fv),
    });
    if (i > 0) {
      yearlyData.push({
        year: i,
        principal: Math.round(clampedP),
        value: Math.round(fv),
        interest: Math.round(fv - clampedP),
      });
    }
  }

  return {
    totalAmount: Math.round(totalAmount),
    totalInterest: Math.round(totalInterest),
    principal: Math.round(clampedP),
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

export default function CompoundInterestCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [freq, setFreq] = useState(12);
  const [showTable, setShowTable] = useState(false);

  const { value: principal, displayValue: principalDisplay, setValue: setPrincipal, handleChange: handlePrincipalChange, handleFocus: handlePrincipalFocus, handleBlur: handlePrincipalBlur } = useNumericField(10000);
  const { value: rate, displayValue: rateDisplay, setValue: setRate, handleChange: handleRateChange, handleFocus: handleRateFocus, handleBlur: handleRateBlur } = useNumericField(5);
  const { value: years, displayValue: yearsDisplay, setValue: setYears, handleChange: handleYearsChange, handleFocus: handleYearsFocus, handleBlur: handleYearsBlur } = useNumericField(10);

  const results = useMemo(
    () => calculateCI(principal, rate, years, freq),
    [principal, rate, years, freq]
  );

  const { totalAmount, totalInterest, principal: principalAmt, effectiveRate, chartData, yearlyData } = results;

  const pieData = useMemo(
    () => [
      { name: "Principal Amount", value: principalAmt },
      { name: "Total Interest", value: totalInterest },
    ],
    [principalAmt, totalInterest]
  );

  const returnsPercent = totalAmount > 0 ? (totalInterest / totalAmount) * 100 : 0;

  const inputRangeClass =
    "w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer";

  return (
    <ToolLayout
      title="Compound Interest Calculator"
      description="Calculate how your money can grow over time with compound interest. Adjust principal, rate, time, and compounding frequency to see detailed projections with charts and yearly breakdowns."
      category="finance"
      faqContent={[
        {
          question: "What is compound interest?",
          answer: "Compound interest is interest calculated on both the initial principal and the accumulated interest from previous periods. Unlike simple interest, which is calculated only on the principal, compound interest allows your money to grow exponentially over time. Albert Einstein reportedly called it the 'eighth wonder of the world' because of its powerful wealth-building effect.",
        },
        {
          question: "How does the compound interest calculator work?",
          answer: "The calculator uses the compound interest formula A = P(1 + r/n)^(nt), where P is the principal, r is the annual interest rate (as a decimal), n is the number of compounding periods per year, and t is the time in years. For continuous compounding, it uses A = P × e^(rt). Enter your values and the calculator instantly shows your future balance, total interest earned, and a full growth breakdown.",
        },
        {
          question: "What is the difference between compounding frequencies?",
          answer: "The more frequently interest is compounded, the more you earn. Daily compounding (365 times per year) yields slightly more than monthly (12), which yields more than quarterly (4), semi-annual (2), and annual (1). Continuous compounding represents the theoretical maximum - interest compounded at every possible moment. The difference becomes more significant with higher rates and longer time periods.",
        },
        {
          question: "How does compound interest differ from simple interest?",
          answer: "Simple interest is calculated only on the principal amount. Compound interest is calculated on the principal plus any accumulated interest. For example, $10,000 at 5% simple interest for 20 years yields $10,000 in interest ($20,000 total). With annual compounding, it yields $16,533 in interest ($26,533 total) - over 65% more. The gap widens with higher rates and longer timeframes.",
        },
        {
          question: "What is a good interest rate for compound growth?",
          answer: "Savings accounts typically offer 0.5-5% APY, certificates of deposit (CDs) offer 2-6%, bonds offer 3-7%, and stock market investments have historically averaged 7-10% annually (before inflation). For long-term retirement planning, rates of 6-10% are commonly used. Higher returns typically come with higher risk and volatility.",
        },
        {
          question: "What is the Rule of 72?",
          answer: "The Rule of 72 is a quick mental shortcut to estimate how long it takes for an investment to double. Divide 72 by your annual interest rate. For example, at 8% interest: 72 ÷ 8 = 9 years to double. At 12%: 72 ÷ 12 = 6 years. This rule works best for rates between 6% and 10% and gives a surprisingly accurate estimate for compounding growth.",
        },
        {
          question: "How does inflation affect compound interest?",
          answer: "Inflation reduces the purchasing power of money over time. The 'nominal' return is what you see in the calculator, but the 'real' return subtracts inflation. If you earn 7% but inflation is 3%, your real return is approximately 4%. For accurate long-term planning, consider using real return rates (nominal rate minus expected inflation) in your calculations.",
        },
        {
          question: "What is the best compounding frequency?",
          answer: "Daily or continuous compounding gives the highest theoretical return, but the difference is often minimal. For example, $10,000 at 8% for 10 years earns $21,589 with annual compounding vs $22,254 with daily compounding - only about 3% more. What matters more is the interest rate itself and the length of time you stay invested. Focus on finding good rates and starting early rather than obsessing over compounding frequency.",
        },
        {
          question: "Can compound interest work against me?",
          answer: "Yes - compound interest works against you on debt like credit cards, payday loans, and high-interest personal loans. If you carry a credit card balance at 20% APR compounded daily, your debt can quickly spiral. This is why paying off high-interest debt should typically be a higher priority than investing. The same exponential growth that builds wealth can also amplify debt.",
        },
        {
          question: "How can I maximize compound interest?",
          answer: "Start investing as early as possible to maximize the time component. Reinvest all dividends and interest instead of taking cash. Increase your contributions regularly, minimize fees and taxes by using tax-advantaged accounts, and avoid withdrawing funds early. Even small amounts invested consistently over long periods can grow substantially due to the power of compounding.",
        },
      ]}
      explanationContent={
        <div className="prose prose-slate max-w-none">
          <h2>What is a Compound Interest Calculator?</h2>
          <p>
            A <strong>compound interest calculator</strong> is a financial planning tool that estimates the future value of your investments by accounting for the exponential growth that occurs when interest earns interest. Unlike simple interest, compound interest accelerates your wealth accumulation, making it one of the most powerful concepts in personal finance and investing.
          </p>

          <h3>The Compound Interest Formula</h3>
          <p>The calculator uses the standard compound interest formula:</p>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
            A = P × (1 + r/n)<sup>nt</sup>
          </pre>
          <p>Where:</p>
          <ul>
            <li><strong>A</strong> = Final amount (principal + interest)</li>
            <li><strong>P</strong> = Initial principal (starting balance)</li>
            <li><strong>r</strong> = Annual nominal interest rate (as a decimal, e.g., 5% = 0.05)</li>
            <li><strong>n</strong> = Number of compounding periods per year</li>
            <li><strong>t</strong> = Number of years the money is invested</li>
          </ul>
          <p>For <strong>continuous compounding</strong>, the formula becomes:</p>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
            A = P × e<sup>rt</sup>
          </pre>

          <h3>Benefits of Compound Interest</h3>
          <ul>
            <li><strong>Exponential Growth:</strong> Your money grows faster over time because you earn returns on both your principal and previously earned interest. The longer your time horizon, the more dramatic this effect becomes.</li>
            <li><strong>Passive Wealth Building:</strong> Once your money is invested, compounding works automatically without any additional effort. It is truly passive income generation at its finest.</li>
            <li><strong>Inflation Protection:</strong> Investments that compound at rates above inflation help preserve and grow your purchasing power over the long term, protecting your savings from erosion.</li>
            <li><strong>Reinvestment Power:</strong> By reinvesting dividends, interest payments, and capital gains, you amplify the compounding effect and accelerate your wealth accumulation significantly.</li>
            <li><strong>Flexible Timeframes:</strong> Compound interest works for any time period, but the benefits become extraordinary over decades. Starting early gives you the greatest advantage.</li>
          </ul>

          <h3>Example Calculation</h3>
          <p><strong>Scenario:</strong> You invest $10,000 at an annual interest rate of 7% compounded monthly for 20 years.</p>
          <ul>
            <li><strong>Principal:</strong> $10,000</li>
            <li><strong>Annual Rate:</strong> 7%</li>
            <li><strong>Compounding:</strong> Monthly (12 times per year)</li>
            <li><strong>Time Period:</strong> 20 years</li>
            <li><strong>Total Amount:</strong> A = 10,000 × (1 + 0.07/12)<sup>12×20</sup> ≈ $40,104</li>
            <li><strong>Total Interest:</strong> $40,104 - $10,000 = $30,104</li>
          </ul>
          <p>Your $10,000 investment grows to over $40,000 in 20 years. Over 75% of the final value comes from interest, demonstrating the powerful effect of long-term compounding.</p>

          <h3>Common Mistakes to Avoid</h3>
          <ul>
            <li><strong>Starting too late:</strong> The most powerful factor in compounding is time, not the amount invested. Delaying by even 5 years can reduce your final corpus by 40-50%.</li>
            <li><strong>Ignoring fees:</strong> High management fees, expense ratios, and transaction costs significantly eat into your compounded returns. A 1% annual fee can reduce your final amount by 20-30% over 30 years.</li>
            <li><strong>Withdrawing early:</strong> Every withdrawal breaks the compounding cycle. Early withdrawals also often trigger penalties and taxes, further reducing your returns.</li>
            <li><strong>Using unrealistic rates:</strong> Assuming 15-20% consistent annual returns is not realistic for most investments. Use conservative estimates of 6-10% for stocks and 3-5% for bonds.</li>
            <li><strong>Forgetting about taxes:</strong> Interest and capital gains may be taxable depending on your jurisdiction. Consider using tax-advantaged accounts (401(k), IRA, ISA, PPF) to let your money compound tax-free.</li>
          </ul>

          <h3>Tips for Maximizing Compound Growth</h3>
          <ul>
            <li><strong>Start today, not tomorrow:</strong> Even $100 invested today is worth more than $100 invested next year. Time in the market beats timing the market.</li>
            <li><strong>Increase your contributions regularly:</strong> As your income grows, increase the amount you invest. Even small annual increases compound into significantly larger balances over time.</li>
            <li><strong>Choose higher compounding frequency:</strong> All else being equal, accounts that compound daily or monthly will yield more than those compounding annually. Check the compounding policy of your accounts.</li>
            <li><strong>Reinvest all earnings:</strong> Always reinvest dividends, interest, and capital gains rather than taking them as cash. This is the core mechanism of compound growth.</li>
            <li><strong>Stay invested through market cycles:</strong> Market volatility is normal. Selling during downturns locks in losses and breaks the compounding cycle. Stay disciplined and maintain a long-term perspective.</li>
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
              <label htmlFor="ci-currency" className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <Banknote className="w-4 h-4 text-primary" />
                Currency
              </label>
              <select id="ci-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>

            {/* Principal Amount */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <DollarSign className="w-4 h-4 text-primary" />
                <span>Principal Amount</span>
                <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(principal, currency)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={principalDisplay}
                  onChange={(e) => handlePrincipalChange(e.target.value)}
                  onFocus={handlePrincipalFocus}
                  onBlur={handlePrincipalBlur}
                  className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="Enter amount"
                />
              </div>
              <input
                id="ci-principal"
                type="range"
                min={MIN_PRINCIPAL}
                max={MAX_PRINCIPAL}
                step={100}
                value={principal}
                onChange={(e) => setPrincipal(parseFloat(e.target.value))}
                className={inputRangeClass}
                aria-valuemin={MIN_PRINCIPAL}
                aria-valuemax={MAX_PRINCIPAL}
                aria-valuenow={principal}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(MIN_PRINCIPAL, currency)}</span>
                <span>{formatCurrency(MAX_PRINCIPAL, currency)}</span>
              </div>
            </div>

            {/* Annual Interest Rate */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Percent className="w-4 h-4 text-primary" />
                <span>Annual Interest Rate</span>
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
              <input
                id="ci-rate"
                type="range"
                min={MIN_RATE}
                max={MAX_RATE}
                step={0.1}
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className={inputRangeClass}
                aria-valuemin={MIN_RATE}
                aria-valuemax={MAX_RATE}
                aria-valuenow={rate}
              />
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
                id="ci-years"
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

            {/* Compounding Frequency */}
            <div>
              <label htmlFor="ci-freq" className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Compounding Frequency
              </label>
              <select
                id="ci-freq"
                value={freq}
                onChange={(e) => setFreq(Number(e.target.value))}
                className="w-full p-3 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Effective Annual Rate */}
            {effectiveRate > 0 && (
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-sm">
                <span className="text-muted-foreground">Effective Annual Rate:</span>{" "}
                <span className="font-semibold text-primary">{formatPercent(effectiveRate)}</span>
              </div>
            )}
          </div>

          {/* Results Cards */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <PiggyBank className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground font-medium">Total Amount</p>
              </div>
              <p className="text-4xl font-extrabold text-primary break-words">{formatCurrency(totalAmount, currency)}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                <span>{returnsPercent.toFixed(1)}% from interest</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Principal
                </p>
                <p className="text-lg font-bold break-words">{formatCurrency(principalAmt, currency)}</p>
              </div>
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  Total Interest
                </p>
                <p className="text-lg font-bold text-emerald-500 break-words">{formatCurrency(totalInterest, currency)}</p>
              </div>
            </div>

            {totalAmount > 0 && totalInterest > 0 && (
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
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-[#2563eb]" />
                      <span className="text-muted-foreground">Principal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-[#10b981]" />
                      <span className="text-muted-foreground">Interest</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Total Invested</p>
                    <p className="text-sm font-semibold">{formatCurrency(principalAmt, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Est. Returns</p>
                    <p className="text-sm font-semibold text-emerald-500">{formatCurrency(totalInterest, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Growth</p>
                    <p className="text-sm font-semibold">{returnsPercent.toFixed(1)}%</p>
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
                Growth Over Time
              </h3>
            </div>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="principalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="year" fontSize={11} tickMargin={8} />
                  <YAxis tickFormatter={(v: number) => formatCompact(v, currency)} fontSize={11} width={60} />
                  <Tooltip content={<ChartTooltip currency={currency} />} />
                  <Area
                    type="monotone"
                    dataKey="Principal"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fill="url(#principalGrad)"
                    dot={false}
                    animationDuration={1000}
                  />
                  <Area
                    type="monotone"
                    dataKey="Value"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#valueGrad)"
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
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Principal</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Interest</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyData.map((row) => (
                      <tr key={row.year} className="border-b border-border/50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2 font-medium">Year {row.year}</td>
                        <td className="text-right py-3 px-2">{formatCurrency(row.principal, currency)}</td>
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
