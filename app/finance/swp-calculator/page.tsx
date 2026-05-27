"use client";

import { useState, useMemo, useCallback } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { ToolLayout } from "@/components/layout/ToolLayout";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Banknote, DollarSign, Percent, Calendar, PiggyBank, TrendingUp, ArrowUpRight, Table, AlertCircle } from "lucide-react";

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
const MIN_WITHDRAWAL = 100;
const MAX_WITHDRAWAL = 500000;
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

interface SWPResults {
  finalBalance: number;
  totalWithdrawn: number;
  totalReturns: number;
  depletionYear: number | null;
  isSustainable: boolean;
  yearsCovered: number;
  chartData: { year: string; Balance: number }[];
  yearlyData: { year: number; startBalance: number; withdrawn: number; returns: number; endBalance: number }[];
}

function calculateSWP(
  initialInvestment: number,
  monthlyWithdrawal: number,
  annualReturn: number,
  years: number
): SWPResults {
  if (
    !Number.isFinite(initialInvestment) ||
    !Number.isFinite(monthlyWithdrawal) ||
    !Number.isFinite(annualReturn) ||
    !Number.isFinite(years)
  ) {
    return {
      finalBalance: 0, totalWithdrawn: 0, totalReturns: 0,
      depletionYear: null, isSustainable: false, yearsCovered: 0,
      chartData: [], yearlyData: [],
    };
  }

  const clampedInvestment = Math.max(0, Math.min(initialInvestment, MAX_INVESTMENT));
  const clampedWithdrawal = Math.max(0, Math.min(monthlyWithdrawal, MAX_WITHDRAWAL));
  const clampedReturn = Math.max(0, Math.min(annualReturn, MAX_RATE));
  const clampedYears = Math.max(0, Math.min(years, MAX_YEARS));

  if (clampedInvestment <= 0 || clampedYears <= 0) {
    return {
      finalBalance: clampedInvestment, totalWithdrawn: 0, totalReturns: 0,
      depletionYear: null, isSustainable: false, yearsCovered: 0,
      chartData: [], yearlyData: [],
    };
  }

  if (clampedWithdrawal <= 0) {
    // No withdrawals - just compound growth
    const monthlyRate = clampedReturn / 12 / 100;
    const months = clampedYears * 12;
    let fv: number;
    if (clampedReturn === 0) {
      fv = clampedInvestment;
    } else {
      fv = clampedInvestment * Math.pow(1 + monthlyRate, months);
    }
    const totalReturns = Math.max(0, fv - clampedInvestment);
    return {
      finalBalance: Math.round(fv),
      totalWithdrawn: 0,
      totalReturns: Math.round(totalReturns),
      depletionYear: null,
      isSustainable: true,
      yearsCovered: clampedYears,
      chartData: [],
      yearlyData: [],
    };
  }

  const monthlyRate = clampedReturn / 12 / 100;
  const totalMonths = clampedYears * 12;
  let balance = clampedInvestment;
  let totalWithdrawn = 0;
  let depletionYear: number | null = null;
  let yearsCovered = 0;
  let depleted = false;

  const chartData: SWPResults["chartData"] = [{ year: "Start", Balance: Math.round(balance) }];
  const yearlyData: SWPResults["yearlyData"] = [];

  for (let y = 1; y <= clampedYears; y++) {
    if (depleted) break;
    const yearStartBalance = balance;
    let yearWithdrawn = 0;
    let yearReturnsSum = 0;

    for (let m = 1; m <= 12; m++) {
      if (balance <= 0) {
        depleted = true;
        break;
      }

      const monthlyReturn = balance * monthlyRate;
      balance += monthlyReturn;
      yearReturnsSum += monthlyReturn;

      if (balance >= clampedWithdrawal) {
        balance -= clampedWithdrawal;
        yearWithdrawn += clampedWithdrawal;
        totalWithdrawn += clampedWithdrawal;
      } else {
        yearWithdrawn += balance;
        totalWithdrawn += balance;
        balance = 0;
        depleted = true;
        depletionYear = y;
        break;
      }
    }

    yearsCovered = y;

    const yearReturns = Math.round(balance - yearStartBalance + yearWithdrawn);

    chartData.push({ year: `Yr ${y}`, Balance: Math.round(balance) });
    yearlyData.push({
      year: y,
      startBalance: Math.round(yearStartBalance),
      withdrawn: Math.round(yearWithdrawn),
      returns: yearReturns,
      endBalance: Math.round(balance),
    });

    if (depleted) break;
  }

  const finalBalance = Math.round(balance);
  const totalReturns = Math.round(totalWithdrawn + finalBalance - clampedInvestment);
  const isSustainable =
    !depleted && monthlyRate > 0 &&
    (clampedInvestment * monthlyRate) >= clampedWithdrawal;

  return {
    finalBalance,
    totalWithdrawn: Math.round(totalWithdrawn),
    totalReturns: Math.max(0, totalReturns),
    depletionYear,
    isSustainable,
    yearsCovered,
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

export default function SWPCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [showTable, setShowTable] = useState(false);

  const { value: investment, displayValue: investmentDisplay, setValue: setInvestment, handleChange: handleInvestmentChange, handleFocus: handleInvestmentFocus, handleBlur: handleInvestmentBlur } = useNumericField(500000);
  const { value: withdrawal, displayValue: withdrawalDisplay, setValue: setWithdrawal, handleChange: handleWithdrawalChange, handleFocus: handleWithdrawalFocus, handleBlur: handleWithdrawalBlur } = useNumericField(15000);
  const { value: rate, displayValue: rateDisplay, setValue: setRate, handleChange: handleRateChange, handleFocus: handleRateFocus, handleBlur: handleRateBlur } = useNumericField(8);
  const { value: years, displayValue: yearsDisplay, setValue: setYears, handleChange: handleYearsChange, handleFocus: handleYearsFocus, handleBlur: handleYearsBlur } = useNumericField(20);

  const results = useMemo(
    () => calculateSWP(investment, withdrawal, rate, years),
    [investment, withdrawal, rate, years]
  );

  const { finalBalance, totalWithdrawn, totalReturns, depletionYear, isSustainable, yearsCovered, chartData, yearlyData } = results;

  const totalReturned = finalBalance + totalWithdrawn;
  const returnsPercent = totalReturned > investment ? ((totalReturned - investment) / totalReturned) * 100 : 0;

  const pieData = useMemo(
    () => [
      { name: "Total Withdrawn", value: totalWithdrawn },
      { name: "Final Balance", value: finalBalance },
    ],
    [totalWithdrawn, finalBalance]
  );

  const showPie = totalWithdrawn > 0 || finalBalance > 0;

  const inputRangeClass =
    "w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer";

  return (
    <ToolLayout
      title="SWP Calculator"
      description="Plan your Systematic Withdrawal Plan (SWP) withdrawals. Calculate how long your investment corpus will last with regular monthly withdrawals and see detailed projections with charts and yearly breakdowns."
      category="finance"
      faqContent={[
        {
          question: "What is a Systematic Withdrawal Plan (SWP)?",
          answer: "A Systematic Withdrawal Plan (SWP) is an investment strategy where you withdraw a fixed amount of money from your investment corpus at regular intervals, typically monthly. It is commonly used by retirees to generate a steady income stream from their accumulated corpus while the remaining balance continues to earn returns. SWPs are popular in mutual funds and provide flexibility in withdrawal amounts and frequency.",
        },
        {
          question: "How does the SWP calculator work?",
          answer: "The calculator simulates your SWP by taking your initial corpus, monthly withdrawal amount, expected annual return, and time period. Each month, it adds the monthly return to your balance and then subtracts your withdrawal. It tracks the balance year by year, shows when the corpus would be depleted (if ever), and provides detailed projections including charts and yearly breakdowns.",
        },
        {
          question: "What is a sustainable withdrawal rate?",
          answer: "A withdrawal is sustainable when the monthly return on your remaining corpus is greater than or equal to your monthly withdrawal amount. In this case, your corpus never declines and can theoretically provide income indefinitely. The sustainable withdrawal rate depends on your expected return - for a 8% annual return, you can sustainably withdraw about 0.67% of your corpus monthly without depleting it.",
        },
        {
          question: "What happens if I withdraw too much?",
          answer: "If your monthly withdrawal exceeds the monthly returns on your corpus, your principal will gradually deplete. The calculator shows exactly when your corpus would run out (the depletion year). For example, withdrawing $2,000/month from a $200,000 corpus earning 6% would deplete the corpus in about 12-14 years, depending on the exact return rate.",
        },
        {
          question: "How does SWP differ from a regular pension?",
          answer: "A pension typically guarantees fixed payments for life regardless of market conditions. An SWP is market-linked - your withdrawal sustainability depends on the actual returns your investments generate. In good years, your corpus may grow despite withdrawals; in bad years, it may deplete faster. SWPs offer more flexibility and potential for inheritance (remaining balance goes to heirs), but come with market risk.",
        },
        {
          question: "What is a good SWP withdrawal rate?",
          answer: "The '4% rule' is a common guideline - withdraw 4% of your initial corpus annually (adjusted for inflation). This was designed for 30-year US retirement portfolios. For a more conservative approach, 3-3.5% is recommended. In the calculator, this translates to monthly withdrawals of about 0.3% of your initial corpus. Lower withdrawal rates ensure your money lasts longer.",
        },
        {
          question: "Can I increase my SWP withdrawals over time?",
          answer: "Yes, many SWP plans allow you to increase withdrawals to account for inflation. However, increasing withdrawals accelerates corpus depletion. The calculator uses a fixed withdrawal amount. For inflation-adjusted planning, consider starting with a lower withdrawal rate and using the calculator to stress-test different scenarios with higher withdrawal amounts as needed.",
        },
        {
          question: "What happens to the remaining corpus when I pass away?",
          answer: "Unlike a pension or annuity which stops upon death, the remaining corpus in an SWP is typically passed to your legal heirs. This makes SWPs an attractive option for those who want to leave a financial legacy. The calculator shows the final balance remaining at the end of your planned withdrawal period, which represents the amount available for inheritance.",
        },
        {
          question: "How does SWP compare to dividend income?",
          answer: "Dividend income depends on company distributions, which are irregular and not guaranteed. SWPs provide predictable, fixed withdrawals regardless of market conditions. However, dividends don't require selling units, while SWPs may involve redeeming units. For retirement planning, SWPs offer more control and predictability compared to relying solely on dividend income.",
        },
        {
          question: "What factors affect SWP sustainability?",
          answer: "The key factors are: (1) Initial corpus size - larger corpus lasts longer, (2) Withdrawal amount - lower withdrawals extend the plan, (3) Expected return rate - higher returns sustain withdrawals longer, (4) Time period - longer periods require lower withdrawal rates, (5) Market volatility - actual returns may vary from expected returns, affecting actual depletion timing.",
        },
      ]}
      explanationContent={
        <div className="prose prose-slate max-w-none">
          <h2>What is an SWP Calculator?</h2>
          <p>
            An <strong>SWP (Systematic Withdrawal Plan) calculator</strong> is a retirement and income planning tool that estimates how long your investment corpus will last when you make regular withdrawals. It is essential for retirees, semi-retirees, and anyone planning to generate a steady income stream from their accumulated investments while ensuring their money does not run out prematurely.
          </p>

          <h3>How SWP Calculations Work</h3>
          <p>The calculator simulates your withdrawal plan month by month:</p>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
            Balance<sub>new</sub> = Balance<sub>old</sub> × (1 + r/12) - W
          </pre>
          <p>Where:</p>
          <ul>
            <li><strong>Balance</strong> = Remaining corpus at the start of the month</li>
            <li><strong>r</strong> = Expected annual return rate (as a decimal, e.g., 8% = 0.08)</li>
            <li><strong>W</strong> = Monthly withdrawal amount</li>
          </ul>
          <p>Each month, the corpus first earns a return (r/12 of the balance), then the withdrawal is subtracted. This cycle repeats for the entire planned period, with the calculator tracking the balance trajectory and identifying if and when the corpus would be depleted.</p>

          <h3>Sustainability Threshold</h3>
          <p>A withdrawal plan is <strong>sustainable indefinitely</strong> when:</p>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
            Investment × (r/12) ≥ Monthly Withdrawal
          </pre>
          <p>In this case, the monthly returns cover the full withdrawal amount, and the principal never decreases. Your corpus becomes a perpetual income generator.</p>

          <h3>Benefits of SWP Planning</h3>
          <ul>
            <li><strong>Retirement Income:</strong> Generate a steady monthly income stream from your accumulated retirement corpus without needing to sell all your investments at once.</li>
            <li><strong>Capital Preservation:</strong> When structured properly, SWPs can preserve your capital while providing regular income, allowing your wealth to last throughout retirement.</li>
            <li><strong>Flexibility:</strong> Choose your withdrawal amount, frequency, and duration. Adjust as your needs change over time without penalty.</li>
            <li><strong>Tax Efficiency:</strong> SWPs can be more tax-efficient than lump-sum withdrawals because only the gains portion is taxable, and withdrawals can be spread across financial years.</li>
            <li><strong>Legacy Planning:</strong> The remaining corpus passes to your heirs, unlike annuities which typically stop upon death. This makes SWPs attractive for estate planning.</li>
          </ul>

          <h3>Example Calculation</h3>
          <p><strong>Scenario:</strong> You have a $500,000 retirement corpus earning 8% annually. You plan to withdraw $2,000 per month for 20 years.</p>
          <ul>
            <li><strong>Initial Investment:</strong> $500,000</li>
            <li><strong>Monthly Withdrawal:</strong> $2,000</li>
            <li><strong>Annual Return:</strong> 8%</li>
            <li><strong>Time Period:</strong> 20 years</li>
            <li><strong>Total Withdrawn:</strong> $480,000 ($2,000 × 240 months)</li>
            <li><strong>Total Returns Earned:</strong> ~$370,000</li>
            <li><strong>Final Balance:</strong> ~$390,000</li>
          </ul>
          <p>After 20 years of withdrawing $2,000 monthly, you would still have approximately $390,000 remaining - nearly 80% of your initial corpus preserved, thanks to the returns earned on the remaining balance throughout the period.</p>

          <h3>Common Mistakes to Avoid</h3>
          <ul>
            <li><strong>Withdrawing too aggressively:</strong> Taking out more than 5-6% of your corpus annually significantly increases the risk of depletion, especially during market downturns in the early years of retirement.</li>
            <li><strong>Ignoring sequence of returns risk:</strong> Poor returns in the first few years of withdrawals can dramatically reduce how long your corpus lasts, even if average returns over the full period are adequate.</li>
            <li><strong>Not accounting for inflation:</strong> A fixed withdrawal of $2,000 today will have much less purchasing power in 20 years. Consider starting with a lower withdrawal rate and planning for periodic increases.</li>
            <li><strong>Using unrealistic return expectations:</strong> Assuming 12-15% consistent returns is not realistic for a retirement portfolio. Use conservative estimates of 6-8% for a balanced portfolio of stocks and bonds.</li>
            <li><strong>Failing to rebalance:</strong> Market movements can shift your asset allocation. Regular rebalancing ensures your portfolio risk level remains appropriate for your withdrawal phase.</li>
          </ul>

          <h3>Tips for SWP Success</h3>
          <ul>
            <li><strong>Start with a lower withdrawal rate:</strong> Begin with 3-4% of your initial corpus annually. You can always increase withdrawals later if your corpus grows more than expected.</li>
            <li><strong>Maintain a cash buffer:</strong> Keep 1-2 years of withdrawals in cash or liquid instruments. This allows you to avoid selling investments during market downturns.</li>
            <li><strong>Review and adjust regularly:</strong> Monitor your corpus annually and adjust withdrawals based on actual performance. A dynamic withdrawal strategy can significantly extend the life of your portfolio.</li>
            <li><strong>Diversify your investments:</strong> A mix of equities, bonds, and fixed-income instruments provides stability and growth potential. The right allocation depends on your time horizon and risk tolerance.</li>
            <li><strong>Consider a bucket strategy:</strong> Divide your corpus into short-term (cash), medium-term (bonds), and long-term (equities) buckets. Withdraw from the short-term bucket first, replenishing it from longer-term investments during good market conditions.</li>
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
              <label htmlFor="swp-currency" className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <Banknote className="w-4 h-4 text-primary" />
                Currency
              </label>
              <select id="swp-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>

            {/* Total Investment */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <PiggyBank className="w-4 h-4 text-primary" />
                <span>Total Investment</span>
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
                id="swp-investment"
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

            {/* Monthly Withdrawal */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <DollarSign className="w-4 h-4 text-primary" />
                <span>Monthly Withdrawal</span>
                <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(withdrawal, currency)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={withdrawalDisplay}
                  onChange={(e) => handleWithdrawalChange(e.target.value)}
                  onFocus={handleWithdrawalFocus}
                  onBlur={handleWithdrawalBlur}
                  className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="Enter amount"
                />
              </div>
              <input
                id="swp-withdrawal"
                type="range"
                min={MIN_WITHDRAWAL}
                max={MAX_WITHDRAWAL}
                step={100}
                value={withdrawal}
                onChange={(e) => setWithdrawal(parseFloat(e.target.value))}
                className={inputRangeClass}
                aria-valuemin={MIN_WITHDRAWAL}
                aria-valuemax={MAX_WITHDRAWAL}
                aria-valuenow={withdrawal}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(MIN_WITHDRAWAL, currency)}</span>
                <span>{formatCurrency(MAX_WITHDRAWAL, currency)}</span>
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
                id="swp-rate"
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
                id="swp-years"
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
            {/* Depletion Warning */}
            {depletionYear !== null && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-800">Corpus Depleted by Year {depletionYear}</p>
                  <p className="text-amber-700 mt-1">
                    Your withdrawal of {formatCurrency(withdrawal, currency)}/month exceeds sustainable levels for a {years}-year period at {rate}% return. Consider increasing your corpus, reducing withdrawals, or extending your return rate.
                  </p>
                </div>
              </div>
            )}

            {/* Sustainable Badge */}
            {isSustainable && !depletionYear && withdrawal > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-emerald-800">Sustainable Withdrawal Plan</p>
                  <p className="text-emerald-700 mt-1">
                    Your monthly returns exceed your withdrawal amount. Your corpus can sustain this withdrawal rate indefinitely without depletion.
                  </p>
                </div>
              </div>
            )}

            {/* Final Balance Hero Card */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <PiggyBank className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground font-medium">Final Balance</p>
              </div>
              <p className="text-4xl font-extrabold text-primary break-words">{formatCurrency(finalBalance, currency)}</p>
              {totalReturns > 0 && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  <span>{returnsPercent.toFixed(1)}% from returns</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Total Withdrawn
                </p>
                <p className="text-lg font-bold break-words">{formatCurrency(totalWithdrawn, currency)}</p>
              </div>
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  Total Returns
                </p>
                <p className="text-lg font-bold text-emerald-500 break-words">{formatCurrency(totalReturns, currency)}</p>
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
                    <p className="text-[11px] text-muted-foreground mb-0.5">Total Withdrawn</p>
                    <p className="text-sm font-semibold">{formatCurrency(totalWithdrawn, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Total Returns</p>
                    <p className="text-sm font-semibold text-emerald-500">{formatCurrency(totalReturns, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Remaining</p>
                    <p className="text-sm font-semibold">{formatCurrency(finalBalance, currency)}</p>
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
                Corpus Over Time
              </h3>
            </div>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer initialDimension={{width:100,height:100}} width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#balanceGrad)"
                    dot={false}
                    animationDuration={1200}
                    isAnimationActive={chartData.length <= 50}
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
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Start Balance</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Withdrawn</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Returns</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">End Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyData.map((row) => (
                      <tr key={row.year} className="border-b border-border/50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2 font-medium">Year {row.year}</td>
                        <td className="text-right py-3 px-2">{formatCurrency(row.startBalance, currency)}</td>
                        <td className="text-right py-3 px-2">{formatCurrency(row.withdrawn, currency)}</td>
                        <td className={`text-right py-3 px-2 ${row.returns > 0 ? "text-emerald-500" : "text-muted-foreground"}`}>
                          {row.returns > 0 ? formatCurrency(row.returns, currency) : "-"}
                        </td>
                        <td className="text-right py-3 px-2 font-semibold">{formatCurrency(row.endBalance, currency)}</td>
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
