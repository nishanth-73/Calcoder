"use client";

import { useState, useMemo, useCallback } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { ToolLayout } from "@/components/layout/ToolLayout";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart,
} from "recharts";
import { Banknote, IndianRupee, TrendingUp, Calendar, PiggyBank, ArrowUpRight, Table } from "lucide-react";

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

const MIN_INVESTMENT = 100;
const MAX_INVESTMENT = 10000000;
const MIN_RETURN = 1;
const MAX_RETURN = 30;
const MIN_YEARS = 1;
const MAX_YEARS = 50;

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

interface SIPResults {
  investedAmount: number;
  estimatedReturns: number;
  futureValue: number;
  chartData: { year: string; Invested: number; Value: number }[];
  yearlyData: { year: number; invested: number; value: number; returns: number }[];
  xirr: number;
}

function calculateSIP(
  monthlyInvestment: number,
  annualReturn: number,
  years: number
): SIPResults {
  if (!Number.isFinite(monthlyInvestment) || !Number.isFinite(annualReturn) || !Number.isFinite(years)) {
    return { investedAmount: 0, estimatedReturns: 0, futureValue: 0, chartData: [], yearlyData: [], xirr: 0 };
  }

  const clampedInvestment = Math.max(0, Math.min(monthlyInvestment, MAX_INVESTMENT));
  const clampedReturn = Math.max(0, Math.min(annualReturn, MAX_RETURN));
  const clampedYears = Math.max(0, Math.min(years, MAX_YEARS));

  if (clampedInvestment <= 0 || clampedYears <= 0) {
    return { investedAmount: 0, estimatedReturns: 0, futureValue: 0, chartData: [], yearlyData: [], xirr: 0 };
  }

  const monthlyRate = clampedReturn / 12 / 100;
  const months = clampedYears * 12;

  let futureValue: number;
  if (clampedReturn === 0) {
    futureValue = clampedInvestment * months;
  } else {
    futureValue =
      clampedInvestment *
      ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
      (1 + monthlyRate);
  }

  const investedAmount = clampedInvestment * months;
  const estimatedReturns = Math.max(0, futureValue - investedAmount);

  const chartData: SIPResults["chartData"] = [];
  const yearlyData: SIPResults["yearlyData"] = [];

  for (let i = 1; i <= clampedYears; i++) {
    const currentMonths = i * 12;
    let fv: number;
    if (clampedReturn === 0) {
      fv = clampedInvestment * currentMonths;
    } else {
      fv =
        clampedInvestment *
        ((Math.pow(1 + monthlyRate, currentMonths) - 1) / monthlyRate) *
        (1 + monthlyRate);
    }
    const invested = clampedInvestment * currentMonths;
    chartData.push({ year: `Yr ${i}`, Invested: Math.round(invested), Value: Math.round(fv) });
    yearlyData.push({ year: i, invested: Math.round(invested), value: Math.round(fv), returns: Math.round(fv - invested) });
  }

  return {
    investedAmount: Math.round(investedAmount),
    estimatedReturns: Math.round(estimatedReturns),
    futureValue: Math.round(futureValue),
    chartData,
    yearlyData,
    xirr: clampedReturn,
  };
}

const PIE_COLORS = ["#2563eb", "#10b981"];

function CustomTooltip({ active, payload, label, currency }: any) {
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

export default function SIPCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [showTable, setShowTable] = useState(false);

  const { value: monthlyInvestment, displayValue: monthlyInvestmentDisplay, setValue: setMonthlyInvestment, handleChange: handleInvestmentChange, handleFocus: handleInvestmentFocus, handleBlur: handleInvestmentBlur } = useNumericField(5000);
  const { value: expectedReturn, displayValue: expectedReturnDisplay, setValue: setExpectedReturn, handleChange: handleReturnChange, handleFocus: handleReturnFocus, handleBlur: handleReturnBlur } = useNumericField(12);
  const { value: years, displayValue: yearsDisplay, setValue: setYears, handleChange: handleYearsChange, handleFocus: handleYearsFocus, handleBlur: handleYearsBlur } = useNumericField(10);

  const results = useMemo(
    () => calculateSIP(monthlyInvestment, expectedReturn, years),
    [monthlyInvestment, expectedReturn, years]
  );

  const { investedAmount, estimatedReturns, futureValue, chartData, yearlyData, xirr } = results;

  const pieData = useMemo(
    () => [
      { name: "Invested Amount", value: investedAmount },
      { name: "Estimated Returns", value: estimatedReturns },
    ],
    [investedAmount, estimatedReturns]
  );

  const returnsPercent = futureValue > 0 ? (estimatedReturns / futureValue) * 100 : 0;

  return (
    <ToolLayout
      title="SIP Calculator"
      description="Calculate the future value of your Systematic Investment Plan (SIP). Enter monthly investment, expected return rate, and tenure to see projected wealth growth with charts and yearly breakdown."
      category="finance"
      faqContent={[
        {
          question: "What is a Systematic Investment Plan (SIP)?",
          answer: "A Systematic Investment Plan (SIP) is an investment method offered by mutual funds where you invest a fixed amount at regular intervals, usually monthly. It helps build wealth gradually through compounding and rupee-cost averaging, making it one of the most popular investment strategies globally.",
        },
        {
          question: "How does the SIP calculator work?",
          answer: "The calculator uses the future value of an annuity formula: FV = P × [((1 + r)^n - 1) / r] × (1 + r). P is your monthly investment, r is the monthly rate of return (annual rate ÷ 12 ÷ 100), and n is the total number of months. This formula accounts for the compounding effect on each monthly installment.",
        },
        {
          question: "What is a good expected return rate for SIP?",
          answer: "Historical equity mutual fund returns have averaged 8-14% per annum over long periods depending on the market. Debt funds typically return 4-8%. For conservative estimates, use 8-10%. For aggressive projections, 12-15%. Past performance does not guarantee future returns.",
        },
        {
          question: "What is the minimum amount for a SIP?",
          answer: "SIP minimums vary by market - as low as ₹500 in India, $50 in the US, or €25 in Europe. The calculator works for any amount in any currency, helping you plan according to your budget and local investment options.",
        },
        {
          question: "How does compounding benefit SIP investors?",
          answer: "Compounding means you earn returns not just on your principal, but also on previously earned returns. In a 15-year SIP at 12%, approximately 65% of the final corpus comes from returns, not your own money. The longer you stay invested, the more powerful compounding becomes.",
        },
        {
          question: "Should I stop my SIP during market downturns?",
          answer: "No. Market downturns are actually beneficial for SIP investors because you buy more units when prices are low (rupee-cost averaging). Continuing SIPs through bear markets significantly improves long-term returns.",
        },
        {
          question: "What is the difference between SIP and lump sum?",
          answer: "SIP involves investing fixed amounts periodically, reducing the impact of market volatility through rupee-cost averaging. Lump sum is a one-time investment of a large amount. SIP is generally recommended for regular income earners, while lump sum suits those with a large corpus available.",
        },
        {
          question: "Can I increase my SIP amount later?",
          answer: "Yes, most investment platforms allow you to increase your SIP amount through a 'top-up' or 'step-up' facility. Increasing your SIP by 10% annually can significantly boost your final corpus due to the power of compounding.",
        },
      ]}
      explanationContent={
        <div className="prose prose-slate max-w-none">
          <h2>What is a SIP Calculator?</h2>
          <p>
            A <strong>SIP (Systematic Investment Plan) calculator</strong> is a financial planning tool that estimates the potential future value of your mutual fund SIP investments. By entering three key inputs - monthly investment amount, expected annual return rate, and investment tenure - you get a detailed projection of your wealth growth trajectory.
          </p>

          <h3>The SIP Formula</h3>
          <p>The calculator uses the future value of a series formula, also known as the annuity formula:</p>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
            FV = P × [((1 + r)<sup>n</sup> - 1) / r] × (1 + r)
          </pre>
          <p>Where:</p>
          <ul>
            <li><strong>FV</strong> = Future value of the SIP after n months</li>
            <li><strong>P</strong> = Monthly investment amount</li>
            <li><strong>r</strong> = Expected monthly rate of return (annual return ÷ 12 ÷ 100)</li>
            <li><strong>n</strong> = Total number of monthly installments (tenure in years × 12)</li>
          </ul>

          <h3>Benefits of SIP Investing</h3>
          <ul>
            <li><strong>Rupee Cost Averaging:</strong> By investing at regular intervals, you buy more units when prices are low and fewer when prices are high, averaging out your purchase cost over time.</li>
            <li><strong>Power of Compounding:</strong> Your returns generate their own returns, creating exponential growth. The longer your horizon, the more pronounced this effect.</li>
            <li><strong>Financial Discipline:</strong> Fixed monthly investments build a habit of regular saving, helping you stay committed to your financial goals.</li>
            <li><strong>Flexibility:</strong> Start with small amounts, increase over time, and stop or pause without penalties.</li>
            <li><strong>Lower Risk:</strong> Compared to lump sum investments, SIPs spread market risk across time, reducing the impact of timing the market.</li>
          </ul>

          <h3>Example Calculation</h3>
          <p><strong>Scenario:</strong> You invest ₹5,000 per month for 10 years at an expected annual return of 12%.</p>
          <ul>
            <li><strong>Monthly Investment:</strong> ₹5,000</li>
            <li><strong>Investment Tenure:</strong> 10 years (120 months)</li>
            <li><strong>Expected Return:</strong> 12% per annum</li>
            <li><strong>Total Amount Invested:</strong> ₹5,000 × 120 = ₹6,00,000</li>
            <li><strong>Estimated Returns:</strong> ~₹5,60,000</li>
            <li><strong>Total Corpus:</strong> ~₹11,60,000</li>
          </ul>
          <p>This means your ₹6 lakh investment could grow to over ₹11.6 lakhs in 10 years, with nearly half the final value coming from returns.</p>

          <h3>Common Mistakes to Avoid</h3>
          <ul>
            <li><strong>Unrealistic return expectations:</strong> Assuming 20%+ annual returns is not sustainable. Use realistic rates of 8-14% for equity SIPs.</li>
            <li><strong>Stopping too early:</strong> The first 5-7 years may show modest returns. The real compounding magic happens in later years. Avoid stopping your SIP prematurely.</li>
            <li><strong>Ignoring inflation:</strong> Factor in 3-6% inflation when setting your target to understand the real value of your future corpus.</li>
            <li><strong>Not reviewing periodically:</strong> Review your SIP portfolio annually and rebalance if needed. Increase your SIP amount as your income grows.</li>
            <li><strong>Chasing past performance:</strong> Last year's top-performing fund may not repeat. Diversify across fund categories and stick to a consistent investment plan.</li>
          </ul>

          <h3>Tips for Maximizing SIP Returns</h3>
          <ul>
            <li><strong>Start early:</strong> Even small amounts invested early can grow significantly due to the long compounding period.</li>
            <li><strong>Use the step-up feature:</strong> Increase your SIP amount by 10% every year. This aligns your investments with your growing income.</li>
            <li><strong>Stay through volatility:</strong> Market corrections are buying opportunities for SIP investors. Stay invested and benefit from lower unit prices.</li>
            <li><strong>Choose the right funds:</strong> Select funds based on your risk appetite and investment horizon.</li>
            <li><strong>Have a goal:</strong> Invest with a clear goal (retirement, education, house) and time horizon. This helps you stay disciplined during market fluctuations.</li>
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
              <label htmlFor="sip-currency" className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <Banknote className="w-4 h-4 text-primary" />
                Currency
              </label>
              <select id="sip-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>

            {/* Monthly Investment */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <IndianRupee className="w-4 h-4 text-primary" />
                <span>Monthly Investment</span>
                <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(monthlyInvestment, currency)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={monthlyInvestmentDisplay}
                  onChange={(e) => handleInvestmentChange(e.target.value)}
                  onFocus={handleInvestmentFocus}
                  onBlur={handleInvestmentBlur}
                  className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="Enter amount"
                />
              </div>
              <input
                id="sip-investment"
                type="range"
                min={MIN_INVESTMENT}
                max={MAX_INVESTMENT}
                step={100}
                value={monthlyInvestment}
                onChange={(e) => setMonthlyInvestment(parseFloat(e.target.value))}
                className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                aria-valuemin={MIN_INVESTMENT}
                aria-valuemax={MAX_INVESTMENT}
                aria-valuenow={monthlyInvestment}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(MIN_INVESTMENT, currency)}</span>
                <span>{formatCurrency(MAX_INVESTMENT, currency)}</span>
              </div>
            </div>

            {/* Expected Return */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>Expected Return (p.a.)</span>
                <span className="ml-auto text-lg font-bold text-primary">{expectedReturn}%</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={expectedReturnDisplay}
                    onChange={(e) => handleReturnChange(e.target.value)}
                    onFocus={handleReturnFocus}
                    onBlur={handleReturnBlur}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="Enter rate"
                  />
                </div>
                <span className="text-muted-foreground font-medium text-sm">%</span>
              </div>
              <input
                id="sip-return"
                type="range"
                min={MIN_RETURN}
                max={MAX_RETURN}
                step={0.5}
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(parseFloat(e.target.value))}
                className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                aria-valuemin={MIN_RETURN}
                aria-valuemax={MAX_RETURN}
                aria-valuenow={expectedReturn}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MIN_RETURN}%</span>
                <span>{MAX_RETURN}%</span>
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
                id="sip-years"
                type="range"
                min={MIN_YEARS}
                max={MAX_YEARS}
                step={1}
                value={years}
                onChange={(e) => setYears(parseFloat(e.target.value))}
                className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
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
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <PiggyBank className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground font-medium">Total Corpus Value</p>
              </div>
              <p className="text-4xl font-extrabold text-primary break-words">{formatCurrency(futureValue, currency)}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                <span>{returnsPercent.toFixed(1)}% from returns</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" />
                  Total Invested
                </p>
                <p className="text-lg font-bold break-words">{formatCurrency(investedAmount, currency)}</p>
              </div>
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  Est. Returns
                </p>
                <p className="text-lg font-bold text-emerald-500 break-words">{formatCurrency(estimatedReturns, currency)}</p>
              </div>
            </div>

            {futureValue > 0 && estimatedReturns > 0 && (
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
                    <p className="text-sm font-semibold">{formatCurrency(investedAmount, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Est. Returns</p>
                    <p className="text-sm font-semibold text-emerald-500">{formatCurrency(estimatedReturns, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">XIRR</p>
                    <p className="text-sm font-semibold">{xirr.toFixed(2)}%</p>
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
              <ResponsiveContainer initialDimension={{width:100,height:100}} width="100%" height="100%">
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
                  <YAxis tickFormatter={(v: number) => formatCompact(v, currency)} fontSize={11} width={55} />
                  <Tooltip content={<CustomTooltip currency={currency} />} />
                  <Area type="monotone" dataKey="Invested" stroke="#2563eb" strokeWidth={2} fill="url(#investedGrad)" dot={false} animationDuration={1000} />
                  <Area type="monotone" dataKey="Value" stroke="#10b981" strokeWidth={2} fill="url(#valueGrad)" dot={false} animationDuration={1200} />
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
