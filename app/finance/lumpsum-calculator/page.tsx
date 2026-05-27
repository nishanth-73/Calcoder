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

const MIN_INVESTMENT = 1000;
const MAX_INVESTMENT = 10000000;
const MIN_RATE = 1;
const MAX_RATE = 30;
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
  return `${Math.round(value * 10) / 10}%`;
}

interface LumpsumResults {
  finalCorpus: number;
  totalReturns: number;
  cagr: number;
  chartData: { year: string; Invested: number; Value: number }[];
  yearlyData: { year: number; invested: number; value: number; returns: number }[];
}

function calculateLumpsum(
  investment: number,
  annualReturn: number,
  years: number
): LumpsumResults {
  if (!Number.isFinite(investment) || !Number.isFinite(annualReturn) || !Number.isFinite(years)) {
    return { finalCorpus: 0, totalReturns: 0, cagr: 0, chartData: [], yearlyData: [] };
  }

  const clampedInvestment = Math.max(0, Math.min(investment, MAX_INVESTMENT));
  const clampedReturn = Math.max(0, Math.min(annualReturn, MAX_RATE));
  const clampedYears = Math.max(0, Math.min(years, MAX_YEARS));

  if (clampedInvestment <= 0 || clampedYears <= 0) {
    return { finalCorpus: 0, totalReturns: 0, cagr: 0, chartData: [], yearlyData: [] };
  }

  const r = clampedReturn / 100;

  let finalCorpus: number;
  if (clampedReturn === 0) {
    finalCorpus = clampedInvestment;
  } else {
    finalCorpus = clampedInvestment * Math.pow(1 + r, clampedYears);
  }

  const totalReturns = Math.max(0, finalCorpus - clampedInvestment);

  const chartData: LumpsumResults["chartData"] = [
    { year: "Start", Invested: clampedInvestment, Value: clampedInvestment },
  ];
  const yearlyData: LumpsumResults["yearlyData"] = [];

  for (let i = 1; i <= clampedYears; i++) {
    let fv: number;
    if (clampedReturn === 0) {
      fv = clampedInvestment;
    } else {
      fv = clampedInvestment * Math.pow(1 + r, i);
    }
    chartData.push({ year: `Yr ${i}`, Invested: clampedInvestment, Value: Math.round(fv) });
    yearlyData.push({
      year: i,
      invested: clampedInvestment,
      value: Math.round(fv),
      returns: Math.round(fv - clampedInvestment),
    });
  }

  return {
    finalCorpus: Math.round(finalCorpus),
    totalReturns: Math.round(totalReturns),
    cagr: clampedReturn,
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

export default function LumpsumCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [showTable, setShowTable] = useState(false);

  const { value: investment, displayValue: investmentDisplay, setValue: setInvestment, handleChange: handleInvestmentChange, handleFocus: handleInvestmentFocus, handleBlur: handleInvestmentBlur } = useNumericField(100000);
  const { value: rate, displayValue: rateDisplay, setValue: setRate, handleChange: handleRateChange, handleFocus: handleRateFocus, handleBlur: handleRateBlur } = useNumericField(12);
  const { value: years, displayValue: yearsDisplay, setValue: setYears, handleChange: handleYearsChange, handleFocus: handleYearsFocus, handleBlur: handleYearsBlur } = useNumericField(10);

  const results = useMemo(
    () => calculateLumpsum(investment, rate, years),
    [investment, rate, years]
  );

  const { finalCorpus, totalReturns, cagr, chartData, yearlyData } = results;

  const pieData = useMemo(
    () => [
      { name: "Invested Amount", value: investment },
      { name: "Total Returns", value: totalReturns },
    ],
    [investment, totalReturns]
  );

  const returnsPercent = finalCorpus > 0 ? (totalReturns / finalCorpus) * 100 : 0;

  const inputRangeClass =
    "w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer";

  return (
    <ToolLayout
      title="Lumpsum Calculator"
      description="Calculate the future value of your mutual fund lumpsum investment. Enter your investment amount, expected return rate, and time horizon to see projected wealth growth with charts and yearly breakdowns."
      category="finance"
      faqContent={[
        {
          question: "What is a lumpsum investment?",
          answer: "A lumpsum investment is a one-time investment of a large amount of money into an investment vehicle such as a mutual fund, stock, or fixed deposit. Unlike a Systematic Investment Plan (SIP) where you invest small amounts periodically, a lumpsum investment puts your entire capital to work immediately, allowing it to benefit from compounding from day one.",
        },
        {
          question: "How does the lumpsum calculator work?",
          answer: "The calculator uses the compound annual growth rate (CAGR) formula: A = P × (1 + r)^t, where P is your initial investment, r is the expected annual return rate, and t is the time period in years. It projects the growth year by year, showing how your single investment compounds over time into a larger corpus.",
        },
        {
          question: "What is a good expected return for lumpsum investments?",
          answer: "Expected returns depend on the asset class. Large-cap equity mutual funds have historically returned 10-14% annually in India and 7-10% in US markets. Debt funds and fixed deposits return 5-8%. For conservative planning, use 10-12% for equity lumpsum investments. Past performance does not guarantee future returns.",
        },
        {
          question: "How is lumpsum different from SIP?",
          answer: "In a lumpsum investment, your entire amount is invested at once and grows from day one. In a SIP, you invest smaller amounts periodically, averaging your entry price over time. Lumpsum is better when markets are undervalued or for windfall gains, while SIP reduces timing risk and is better for regular income earners.",
        },
        {
          question: "What is the best time period for lumpsum investing?",
          answer: "Lumpsum investments in equity markets work best with a time horizon of at least 5-7 years. Longer periods of 10-15 years significantly reduce the impact of market volatility and allow compounding to work its magic. For debt investments, even 1-3 year periods can be suitable depending on the instrument.",
        },
        {
          question: "Is lumpsum better than SIP in a falling market?",
          answer: "In a falling market, SIP is generally better because you buy more units at lower prices (rupee-cost averaging). A lumpsum investment made just before a market crash can take years to recover. However, in a rising market or for long-term investors, lumpsum can outperform SIP because the full amount starts compounding immediately.",
        },
        {
          question: "What is CAGR and why does it matter?",
          answer: "CAGR (Compound Annual Growth Rate) is the average annual growth rate of an investment over a specified period, assuming profits are reinvested. It smooths out volatility and gives you a single percentage that represents the annualized return. The calculator shows the CAGR equivalent of your expected return rate.",
        },
        {
          question: "What are the tax implications of lumpsum investments?",
          answer: "In most countries, capital gains on investments held for more than a year are taxed at lower long-term capital gains rates. Short-term gains are taxed as ordinary income. The specific rates vary by country - for example, India taxes LTCG above ₹1 lakh at 10%, while the US taxes based on income brackets. Consult a tax professional for your jurisdiction.",
        },
        {
          question: "Can I lose money in a lumpsum investment?",
          answer: "Yes, market-linked lumpsum investments carry the risk of capital loss, especially over short timeframes. Equity markets can decline 20-40% in bear markets. However, historically, longer holding periods of 7-10 years have always delivered positive returns in major equity markets. This is why a long investment horizon is crucial for lumpsum equity investing.",
        },
        {
          question: "How much should I invest as a lumpsum?",
          answer: "The amount depends on your financial goals, risk tolerance, and existing portfolio. A common guideline is to invest no more than 10-20% of your total portfolio in a single lumpsum. Diversify across asset classes (equity, debt, gold) and use the calculator to project potential outcomes for different investment amounts and timeframes.",
        },
      ]}
      explanationContent={
        <div className="prose prose-slate max-w-none">
          <h2>What is a Lumpsum Calculator?</h2>
          <p>
            A <strong>lumpsum calculator</strong> is a financial planning tool that estimates the future value of a one-time (lumpsum) investment in mutual funds or other investment vehicles. By entering your initial investment amount, expected annual return rate, and investment tenure, you can see how your single investment grows over time through the power of compounding.
          </p>

          <h3>The Lumpsum Formula (CAGR)</h3>
          <p>The calculator uses the standard compound annual growth rate formula:</p>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
            A = P × (1 + r)<sup>t</sup>
          </pre>
          <p>Where:</p>
          <ul>
            <li><strong>A</strong> = Final corpus value (future value)</li>
            <li><strong>P</strong> = Initial lumpsum investment (present value)</li>
            <li><strong>r</strong> = Expected annual rate of return (as a decimal, e.g., 12% = 0.12)</li>
            <li><strong>t</strong> = Number of years the investment is held</li>
          </ul>

          <h3>Benefits of Lumpsum Investing</h3>
          <ul>
            <li><strong>Immediate Compounding:</strong> Unlike SIP where money is deployed gradually, a lumpsum investment starts compounding from day one, maximizing the time value of your money.</li>
            <li><strong>Higher Potential Returns:</strong> If invested at the right time, lumpsum can capture full market upside. A well-timed lumpsum investment can significantly outperform staggered investments.</li>
            <li><strong>Simple and Efficient:</strong> One-time decision, one-time transaction. No need to manage periodic investments or remember monthly SIP dates.</li>
            <li><strong>Suitable for Windfalls:</strong> Perfect for investing bonuses, inheritance, insurance payouts, or any large sum of money you receive at once.</li>
            <li><strong>Lower Costs:</strong> A single transaction typically incurs lower total costs compared to multiple small transactions over time.</li>
          </ul>

          <h3>Example Calculation</h3>
          <p><strong>Scenario:</strong> You invest a lumpsum of $100,000 in a mutual fund with an expected annual return of 12% for 10 years.</p>
          <ul>
            <li><strong>Initial Investment:</strong> $100,000</li>
            <li><strong>Expected Return:</strong> 12% per annum (CAGR)</li>
            <li><strong>Investment Tenure:</strong> 10 years</li>
            <li><strong>Final Corpus:</strong> A = 100,000 × (1 + 0.12)<sup>10</sup> ≈ $310,585</li>
            <li><strong>Total Returns:</strong> $310,585 - $100,000 = $210,585</li>
          </ul>
          <p>Your $100,000 investment grows to over $310,000 in 10 years, with nearly 68% of the final value coming from returns. This demonstrates the power of long-term compounding with a single lumpsum investment.</p>

          <h3>Lumpsum vs SIP: Which is Better?</h3>
          <p>Both strategies have advantages depending on market conditions:</p>
          <ul>
            <li><strong>Lumpsum is better when:</strong> Markets are undervalued, you have a long time horizon (10+ years), you receive a windfall, or you want to avoid the hassle of periodic investments.</li>
            <li><strong>SIP is better when:</strong> Markets are volatile or overvalued, you have a regular income, you want to average your entry price, or you prefer a disciplined approach.</li>
            <li><strong>Hybrid approach:</strong> Many investors use a combination - invest a portion as lumpsum and the rest through a SIP over 6-12 months to balance timing risk.</li>
          </ul>

          <h3>Common Mistakes to Avoid</h3>
          <ul>
            <li><strong>Investing without a time horizon:</strong> Lumpsum equity investments need at least 5-7 years to weather market cycles. Investing with a short horizon increases the risk of loss.</li>
            <li><strong>Putting all money in one fund:</strong> Diversify across multiple funds and asset classes. A single fund may underperform or face sector-specific challenges.</li>
            <li><strong>Chasing past performance:</strong> Last year's top-performing fund often underperforms in subsequent years. Choose funds based on consistent long-term track record and investment philosophy.</li>
            <li><strong>Ignoring expense ratios:</strong> High expense ratios significantly eat into your returns over time. A 1.5% fee vs 0.5% fee can reduce your final corpus by 15-20% over 20 years.</li>
            <li><strong>Panic selling during downturns:</strong> Market corrections are normal. Selling during a downturn locks in losses and breaks the compounding cycle. Stay invested and maintain a long-term perspective.</li>
          </ul>

          <h3>Tips for Successful Lumpsum Investing</h3>
          <ul>
            <li><strong>Choose the right funds:</strong> For long-term lumpsum investing, choose large-cap or flexi-cap funds with a consistent track record of 5-10 years. For shorter horizons, consider debt funds or balanced advantage funds.</li>
            <li><strong>Use a staggered entry:</strong> If you are unsure about market timing, split your lumpsum into 3-4 parts and invest over a few weeks or months. This reduces timing risk while keeping most of your money invested.</li>
            <li><strong>Reinvest dividends:</strong> Choose the growth option or reinvest dividends to maximize compounding. Taking dividends as cash reduces your compounding potential.</li>
            <li><strong>Monitor and rebalance:</strong> Review your portfolio annually. If one asset class has grown disproportionately, rebalance to maintain your target allocation.</li>
            <li><strong>Have an exit strategy:</strong> Know when and why you will withdraw. Having a clear goal (retirement, education, home purchase) helps you stay disciplined and avoid emotional decisions.</li>
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
              <label htmlFor="ls-currency" className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <Banknote className="w-4 h-4 text-primary" />
                Currency
              </label>
              <select id="ls-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>

            {/* Investment Amount */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <DollarSign className="w-4 h-4 text-primary" />
                <span>Investment Amount</span>
                <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(investment, currency)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={investmentDisplay}
                  onChange={(e) => handleInvestmentChange(e.target.value)}
                  onFocus={handleInvestmentFocus}
                  onBlur={handleInvestmentBlur}
                  className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="Enter amount"
                />
              </div>
              <input
                id="ls-investment"
                type="range"
                min={MIN_INVESTMENT}
                max={MAX_INVESTMENT}
                step={1000}
                value={investment}
                onChange={(e) => setInvestment(parseFloat(e.target.value))}
                className={inputRangeClass}
                aria-valuemin={MIN_INVESTMENT}
                aria-valuemax={MAX_INVESTMENT}
                aria-valuenow={investment}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(MIN_INVESTMENT, currency)}</span>
                <span>{formatCurrency(MAX_INVESTMENT, currency)}</span>
              </div>
            </div>

            {/* Expected Return */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Percent className="w-4 h-4 text-primary" />
                <span>Expected Return (p.a.)</span>
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
                id="ls-rate"
                type="range"
                min={MIN_RATE}
                max={MAX_RATE}
                step={0.5}
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
                id="ls-years"
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

            {/* CAGR Display */}
            {cagr > 0 && (
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-sm">
                <span className="text-muted-foreground">CAGR:</span>{" "}
                <span className="font-semibold text-primary">{formatPercent(cagr)}</span>
              </div>
            )}
          </div>

          {/* Results Cards */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <PiggyBank className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground font-medium">Final Corpus</p>
              </div>
              <p className="text-4xl font-extrabold text-primary break-words">{formatCurrency(finalCorpus, currency)}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                <span>{returnsPercent.toFixed(1)}% from returns</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Total Invested
                </p>
                <p className="text-lg font-bold break-words">{formatCurrency(investment, currency)}</p>
              </div>
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  Total Returns
                </p>
                <p className="text-lg font-bold text-emerald-500 break-words">{formatCurrency(totalReturns, currency)}</p>
              </div>
            </div>

            {finalCorpus > 0 && totalReturns > 0 && (
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
                    <p className="text-sm font-semibold">{formatCurrency(investment, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Est. Returns</p>
                    <p className="text-sm font-semibold text-emerald-500">{formatCurrency(totalReturns, currency)}</p>
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
                Wealth Growth Trajectory
              </h3>
            </div>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
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
                    dataKey="Invested"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fill="url(#investedGrad)"
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
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Invested</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Returns</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyData.map((row) => (
                      <tr key={row.year} className="border-b border-border/50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2 font-medium">Year {row.year}</td>
                        <td className="text-right py-3 px-2">{formatCurrency(row.invested, currency)}</td>
                        <td className={`text-right py-3 px-2 ${row.returns > 0 ? "text-emerald-500" : "text-muted-foreground"}`}>
                          {row.returns > 0 ? formatCurrency(row.returns, currency) : "-"}
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
