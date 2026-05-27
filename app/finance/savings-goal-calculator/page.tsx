"use client";

import { useState, useMemo } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { ToolLayout } from "@/components/layout/ToolLayout";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  PieChart, Pie, Cell,
} from "recharts";
import { Banknote, IndianRupee, Percent, Calendar, PiggyBank, TrendingUp, ArrowUpRight, ArrowDownRight, Table, Target, CheckCircle, AlertTriangle, Clock, Gauge } from "lucide-react";

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

const MIN_GOAL = 10000;
const MAX_GOAL = 1000000000;
const MIN_CURRENT = 0;
const MAX_CURRENT = 100000000;
const MIN_MONTHLY = 0;
const MAX_MONTHLY = 1000000;
const MIN_RATE = 0;
const MAX_RATE = 30;
const MIN_YEARS = 0.5;
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
  return `${(Math.round(value * 1000) / 10).toFixed(1)}%`;
}

interface SavingsGoalResults {
  futureValue: number;
  totalContributions: number;
  totalReturns: number;
  monthlyNeeded: number;
  timeToGoal: number | null;
  progress: number;
  isOnTrack: boolean;
  shortfall: number;
  chartData: { year: number; value: number; goalLine: number }[];
  yearlyData: { year: number; value: number; contributions: number }[];
}

function calculateSavingsGoal(
  goalAmount: number,
  currentSavings: number,
  monthlySavings: number,
  rate: number,
  years: number
): SavingsGoalResults {
  const inputs = [goalAmount, currentSavings, monthlySavings, rate, years];
  if (!inputs.every(Number.isFinite)) {
    return {
      futureValue: 0, totalContributions: 0, totalReturns: 0, monthlyNeeded: 0,
      timeToGoal: null, progress: 0, isOnTrack: false, shortfall: 0, chartData: [], yearlyData: [],
    };
  }

  const clampedGoal = Math.max(0, Math.min(goalAmount, MAX_GOAL));
  const clampedCurrent = Math.max(0, Math.min(currentSavings, MAX_CURRENT));
  const clampedMonthly = Math.max(0, Math.min(monthlySavings, MAX_MONTHLY));
  const clampedRate = Math.max(0, Math.min(rate, MAX_RATE));
  const clampedYears = Math.max(0, Math.min(years, MAX_YEARS));

  if (clampedGoal <= 0 || clampedYears <= 0) {
    return {
      futureValue: 0, totalContributions: 0, totalReturns: 0, monthlyNeeded: 0,
      timeToGoal: null, progress: 0, isOnTrack: false, shortfall: 0, chartData: [], yearlyData: [],
    };
  }

  const totalMonths = Math.round(clampedYears * 12);
  const monthlyRate = clampedRate / 100 / 12;

  // Phase 1: Simulate month-by-month growth
  let balance = clampedCurrent;
  let totalContributions = clampedCurrent;
  const chartData: SavingsGoalResults["chartData"] = [];
  const yearlyData: SavingsGoalResults["yearlyData"] = [];

  chartData.push({ year: 0, value: Math.round(balance), goalLine: clampedGoal });

  for (let m = 1; m <= totalMonths; m++) {
    balance += clampedMonthly;
    totalContributions += clampedMonthly;

    if (clampedRate > 0) {
      balance *= (1 + monthlyRate);
    }

    if (m % 12 === 0 || m === totalMonths) {
      const year = m / 12;
      chartData.push({ year, value: Math.round(balance), goalLine: clampedGoal });
      yearlyData.push({
        year: Math.round(year),
        value: Math.round(balance),
        contributions: Math.round(totalContributions),
      });
    }
  }

  const futureValue = Math.round(balance);
  const totalContributionsEnd = Math.round(totalContributions);
  const totalReturns = Math.max(0, futureValue - totalContributionsEnd);
  const progress = clampedGoal > 0 ? Math.min(100, (futureValue / clampedGoal) * 100) : 0;
  const isOnTrack = futureValue >= clampedGoal;
  const shortfall = Math.max(0, clampedGoal - futureValue);

  // Monthly savings needed to reach goal
  let monthlyNeeded = 0;
  const monthsForGoal = totalMonths;
  if (monthsForGoal > 0) {
    const fvOfCurrent = clampedCurrent > 0 && clampedRate > 0
      ? clampedCurrent * Math.pow(1 + monthlyRate, monthsForGoal)
      : clampedCurrent;

    const remaining = Math.max(0, clampedGoal - fvOfCurrent);

    if (remaining > 0 && clampedRate > 0 && monthsForGoal > 0) {
      monthlyNeeded = Math.round(
        remaining * monthlyRate / (Math.pow(1 + monthlyRate, monthsForGoal) - 1) / (1 + monthlyRate)
      );
    } else if (remaining > 0 && monthsForGoal > 0) {
      monthlyNeeded = Math.round(remaining / monthsForGoal);
    }
  }

  // Time to reach goal (in years)
  let timeToGoal: number | null = null;
  if (clampedGoal > 0 && futureValue < clampedGoal && (clampedMonthly > 0 || clampedCurrent > 0)) {
    // Solve for n: goal = current(1+r)^n + monthly(1+r)((1+r)^n - 1)/r
    if (clampedRate > 0 && monthlyRate > 0) {
      const A = clampedCurrent;
      const M = clampedMonthly;
      const target = clampedGoal;
      const B = A + M * (1 + monthlyRate) / monthlyRate;
      const C = target + M * (1 + monthlyRate) / monthlyRate;

      if (B > 0 && C / B > 0) {
        const months = Math.log(C / B) / Math.log(1 + monthlyRate);
        if (Number.isFinite(months) && months > 0) {
          timeToGoal = months / 12;
        }
      }
    } else if (clampedMonthly > 0) {
      // Zero rate: simply goal / monthly
      const months = (clampedGoal - clampedCurrent) / clampedMonthly;
      if (Number.isFinite(months) && months > 0) {
        timeToGoal = months / 12;
      }
    }
  } else if (futureValue >= clampedGoal) {
    // Already on track - find when goal is reached
    // Scan through chart data to find first year where value >= goal
    for (const point of chartData) {
      if (point.value >= clampedGoal) {
        timeToGoal = point.year;
        break;
      }
    }
  }

  return {
    futureValue,
    totalContributions: totalContributionsEnd,
    totalReturns,
    monthlyNeeded,
    timeToGoal: timeToGoal !== null ? Math.round(timeToGoal * 10) / 10 : null,
    progress,
    isOnTrack,
    shortfall,
    chartData,
    yearlyData,
  };
}

function ChartTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white border border-border rounded-xl shadow-xl p-4 text-sm space-y-2">
      <p className="font-semibold text-foreground">Year {label}</p>
      {payload.map((entry: any) => {
        if (entry.dataKey === "goalLine") return null;
        return (
          <div key={entry.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{formatCurrency(entry.value, currency)}</span>
          </div>
        );
      })}
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

export default function SavingsGoalCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const { value: goalAmount, displayValue: goalAmountDisplay, setValue: setGoalAmount, handleChange: handleGoalAmountChange, handleFocus: handleGoalAmountFocus, handleBlur: handleGoalAmountBlur } = useNumericField(1000000);
  const { value: currentSavings, displayValue: currentSavingsDisplay, setValue: setCurrentSavings, handleChange: handleCurrentSavingsChange, handleFocus: handleCurrentSavingsFocus, handleBlur: handleCurrentSavingsBlur } = useNumericField(0);
  const { value: monthlySavings, displayValue: monthlySavingsDisplay, setValue: setMonthlySavings, handleChange: handleMonthlySavingsChange, handleFocus: handleMonthlySavingsFocus, handleBlur: handleMonthlySavingsBlur } = useNumericField(10000);
  const { value: rate, displayValue: rateDisplay, setValue: setRate, handleChange: handleRateChange, handleFocus: handleRateFocus, handleBlur: handleRateBlur } = useNumericField(8);
  const { value: years, displayValue: yearsDisplay, setValue: setYears, handleChange: handleYearsChange, handleFocus: handleYearsFocus, handleBlur: handleYearsBlur } = useNumericField(5);
  const [showTable, setShowTable] = useState(false);

  const results = useMemo(
    () => calculateSavingsGoal(goalAmount, currentSavings, monthlySavings, rate, years),
    [goalAmount, currentSavings, monthlySavings, rate, years]
  );

  const {
    futureValue, totalContributions, totalReturns, monthlyNeeded,
    timeToGoal, progress, isOnTrack, shortfall, chartData, yearlyData,
  } = results;

  const pieData = useMemo(() => [
    { name: "Total Contributions", value: totalContributions },
    { name: "Investment Returns", value: totalReturns },
  ], [totalContributions, totalReturns]);

  const inputRangeClass = "w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer";

  return (
    <ToolLayout
      title="Savings Goal Calculator"
      description="Plan your savings journey with this comprehensive goal calculator. See how much you need to save monthly to reach your target, project your future value, track progress, and get actionable insights with detailed charts."
      category="finance"
      faqContent={[
        {
          question: "How does the Savings Goal Calculator work?",
          answer: "The calculator simulates your savings growth month-by-month, compounding your existing savings and monthly contributions at your expected return rate. It then compares the projected future value to your goal and shows whether you're on track, how much more you need to save monthly, or how long it will take to reach your goal.",
        },
        {
          question: "What formulas does this calculator use?",
          answer: "The calculator uses the future value of a series formula: FV = PV(1+r)^n + PMT × ((1+r)^n - 1)/r × (1+r), where PV is your current savings, PMT is your monthly contribution, r is the monthly return rate, and n is the number of months. For reverse calculations, it solves for the unknown variable using algebraic or logarithmic methods.",
        },
        {
          question: "How much should I save monthly for my goal?",
          answer: "The calculator shows both: (1) the future value of your current monthly savings, and (2) the monthly savings needed to reach your exact goal in the given timeframe. If there's a gap, the 'Monthly Needed' figure tells you exactly how much more to save. A common guideline is to save 15-20% of your income for long-term goals.",
        },
        {
          question: "What is a realistic return rate to use?",
          answer: "For short-term goals (1-3 years): use 4-6% (debt funds, FDs). For medium-term (3-7 years): use 6-9% (balanced funds). For long-term (7+ years): use 8-12% (equity mutual funds, index funds). Conservative estimates are safer for goal planning - it's better to exceed your goal than fall short.",
        },
        {
          question: "What types of goals can I plan with this calculator?",
          answer: "This calculator works for any financial goal: emergency fund (3-6 months expenses), down payment for a home (20% of property value), wedding expenses, child's education (costs rising 8-12% annually), vacation fund, retirement top-up, new car purchase, home renovation, or any other savings target with a specific amount and timeframe.",
        },
        {
          question: "Should I include my existing savings?",
          answer: "Yes, always include any money you've already set aside for this goal. Your existing savings continue to earn returns while you add monthly contributions. Even a small existing corpus significantly reduces the monthly savings needed due to the power of compounding.",
        },
        {
          question: "What if I'm not on track to reach my goal?",
          answer: "You have three levers: (1) increase monthly savings - even small increases compound significantly over time, (2) extend the time horizon - a few more years can dramatically reduce monthly requirements, (3) seek higher returns - but only within your risk tolerance. The calculator shows the exact adjustments needed.",
        },
        {
          question: "How does inflation affect my savings goal?",
          answer: "Inflation increases the cost of your goal over time. A ₹10 lakh goal today might require ₹16-18 lakhs in 10 years at 5-6% inflation. To account for this, either inflate your goal amount using an inflation calculator first, or use a lower real return rate (nominal return - expected inflation) in this calculator.",
        },
        {
          question: "What is the best way to save for multiple goals?",
          answer: "Use separate calculators for each goal with dedicated timelines and risk profiles. Short-term goals (1-3 years) should use safer instruments (FDs, liquid funds). Long-term goals (7+ years) can use equity for higher returns. Track each goal separately and adjust contributions as priorities change.",
        },
        {
          question: "How often should I review my savings goals?",
          answer: "Review your savings goals at least annually and after major life events (job change, marriage, children, inheritance). Increase your savings as your income grows - a common strategy is to save 50% of any salary increase. Rebalancing your investment mix as you approach your goal helps protect accumulated savings.",
        },
      ]}
      explanationContent={
        <div className="prose prose-slate max-w-none">
          <h2>What is a Savings Goal Calculator?</h2>
          <p>
            A <strong>Savings Goal Calculator</strong> is a financial planning tool that helps you determine the monthly savings required to reach a specific financial target within a desired timeframe. It accounts for your existing savings, expected investment returns, and time horizon to give you a complete roadmap - including projected future value, progress tracking, and actionable adjustments if you're off track.
          </p>

          <h3>How the Calculation Works</h3>
          <p>The calculator uses the future value formula combining your existing corpus and monthly contributions with compound growth:</p>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
            FV = PV × (1 + r)<sup>n</sup> + PMT × ((1 + r)<sup>n</sup> - 1) / r × (1 + r)
          </pre>
          <p>Where:</p>
          <ul>
            <li><strong>FV</strong> = Future value of your savings</li>
            <li><strong>PV</strong> = Current savings (existing corpus)</li>
            <li><strong>PMT</strong> = Monthly contribution amount</li>
            <li><strong>r</strong> = Monthly rate of return (annual rate ÷ 12 ÷ 100)</li>
            <li><strong>n</strong> = Total number of months</li>
          </ul>

          <h4>Reverse Calculations</h4>
          <p>The calculator also solves for the unknown variable when needed:</p>
          <ul>
            <li><strong>Monthly savings needed:</strong> Rearranges the formula to solve for PMT given a target FV, existing PV, and time horizon. Uses the annuity payment formula.</li>
            <li><strong>Time to reach goal:</strong> Uses logarithms to solve for n: n = ln((FV + PMT(1+r)/r) / (PV + PMT(1+r)/r)) / ln(1+r)</li>
          </ul>

          <h3>Benefits of Using a Savings Goal Calculator</h3>
          <ul>
            <li><strong>Clear Roadmap:</strong> Know exactly how much to save each month instead of guessing. A concrete plan dramatically increases the likelihood of achieving your goal.</li>
            <li><strong>Progress Tracking:</strong> See your progress percentage and projected timeline at a glance. Visual feedback keeps you motivated and on track.</li>
            <li><strong>Scenario Testing:</strong> Adjust any input to see the impact. What if you save ₹2,000 more per month? What if you extend the timeline by 2 years? Make data-driven decisions.</li>
            <li><strong>Early Warning System:</strong> If you're falling short, the calculator tells you immediately - giving you years or decades to adjust rather than discovering the gap at the deadline.</li>
            <li><strong>Goal Prioritization:</strong> Compare different goals side-by-side. See which goals are achievable with your current savings rate and which need adjustment or reprioritization.</li>
          </ul>

          <h3>Example Calculation</h3>
          <p><strong>Scenario:</strong> You want to save ₹10,00,000 for a down payment in 5 years. You have ₹0 saved currently, plan to save ₹10,000/month, and expect 8% annual returns.</p>
          <ul>
            <li><strong>Goal Amount:</strong> ₹10,00,000</li>
            <li><strong>Current Savings:</strong> ₹0</li>
            <li><strong>Monthly Savings:</strong> ₹10,000</li>
            <li><strong>Expected Return:</strong> 8% per annum</li>
            <li><strong>Time Horizon:</strong> 5 years (60 months)</li>
            <li><strong>Projected Future Value:</strong> ~₹7,39,000</li>
            <li><strong>Monthly Savings Needed:</strong> ~₹13,700/month to reach ₹10,00,000</li>
            <li><strong>Progress:</strong> ~74% of goal</li>
            <li><strong>Status:</strong> Not on track - increase monthly savings by ~₹3,700 or extend timeline by ~1.5 years</li>
          </ul>

          <h3>Common Mistakes to Avoid</h3>
          <ul>
            <li><strong>Ignoring existing savings:</strong> Even ₹50,000 in existing savings earning 8% grows to ~₹74,000 in 5 years - that's ₹24,000 of free growth. Always include what you already have.</li>
            <li><strong>Using unrealistic return rates:</strong> Assuming 15%+ returns for a 2-year goal is unrealistic. Match your return expectations to your investment strategy and time horizon.</li>
            <li><strong>Not accounting for inflation:</strong> A ₹10 lakh goal today will cost more in the future. For long-term goals (10+ years), inflate your target or use real (inflation-adjusted) returns.</li>
            <li><strong>Setting and forgetting:</strong> Goals, income, and market conditions change. Review your plan annually and adjust savings rates, time horizons, or investment strategies as needed.</li>
            <li><strong>Being too aggressive or too conservative:</strong> Overly aggressive returns lead to missed goals. Overly conservative returns lead to over-saving. Find the right balance based on your timeline and risk tolerance.</li>
          </ul>

          <h3>Tips for Reaching Your Savings Goals Faster</h3>
          <ul>
            <li><strong>Automate your savings:</strong> Set up automatic transfers on payday. What you don't see in your checking account, you won't spend. Automating is the single most effective savings strategy.</li>
            <li><strong>Increase savings with every raise:</strong> Commit to saving 50% of every salary increase, bonus, or windfall. Your lifestyle stays the same while your savings rate grows automatically.</li>
            <li><strong>Use tax-advantaged accounts:</strong> In India, PPF (7.1%), EPF, ELSS, and NPS offer tax benefits under Section 80C while helping you reach long-term goals. Use these alongside your regular savings.</li>
            <li><strong>Cut expenses strategically:</strong> Review subscriptions, dining out, and discretionary spending. Redirect even ₹2,000-5,000 per month to your goal - it compounds significantly over time.</li>
            <li><strong>Celebrate milestones:</strong> When you reach 25%, 50%, 75% of your goal, acknowledge the progress. Positive reinforcement keeps you motivated for the long journey ahead.</li>
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
              <label htmlFor="sg-currency" className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <Banknote className="w-4 h-4 text-primary" />
                Currency
              </label>
              <select id="sg-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>

            {/* Goal Amount */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Target className="w-4 h-4 text-primary" />
                <span>Goal Amount</span>
                <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(goalAmount, currency)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                <input type="text" inputMode="decimal" value={goalAmountDisplay} onChange={(e) => handleGoalAmountChange(e.target.value)} onFocus={handleGoalAmountFocus} onBlur={handleGoalAmountBlur} className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter amount" />
              </div>
              <input id="sg-goal" type="range" min={MIN_GOAL} max={MAX_GOAL} step={50000} value={goalAmount}
                onChange={(e) => setGoalAmount(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_GOAL} aria-valuemax={MAX_GOAL} aria-valuenow={goalAmount} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(MIN_GOAL, currency)}</span>
                <span>{formatCurrency(MAX_GOAL, currency)}</span>
              </div>
            </div>

            {/* Current Savings */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <PiggyBank className="w-4 h-4 text-primary" />
                <span>Current Savings</span>
                <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(currentSavings, currency)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                <input type="text" inputMode="decimal" value={currentSavingsDisplay} onChange={(e) => handleCurrentSavingsChange(e.target.value)} onFocus={handleCurrentSavingsFocus} onBlur={handleCurrentSavingsBlur} className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter amount" />
              </div>
              <input id="sg-current" type="range" min={MIN_CURRENT} max={MAX_CURRENT} step={10000} value={currentSavings}
                onChange={(e) => setCurrentSavings(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_CURRENT} aria-valuemax={MAX_CURRENT} aria-valuenow={currentSavings} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(MIN_CURRENT, currency)}</span>
                <span>{formatCurrency(MAX_CURRENT, currency)}</span>
              </div>
            </div>

            {/* Monthly Savings */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <IndianRupee className="w-4 h-4 text-primary" />
                <span>Monthly Savings</span>
                <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(monthlySavings, currency)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                <input type="text" inputMode="decimal" value={monthlySavingsDisplay} onChange={(e) => handleMonthlySavingsChange(e.target.value)} onFocus={handleMonthlySavingsFocus} onBlur={handleMonthlySavingsBlur} className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter amount" />
              </div>
              <input id="sg-monthly" type="range" min={MIN_MONTHLY} max={MAX_MONTHLY} step={500} value={monthlySavings}
                onChange={(e) => setMonthlySavings(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_MONTHLY} aria-valuemax={MAX_MONTHLY} aria-valuenow={monthlySavings} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(MIN_MONTHLY, currency)}</span>
                <span>{formatCurrency(MAX_MONTHLY, currency)}</span>
              </div>
            </div>

            {/* Expected Return */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>Expected Return (p.a.)</span>
                <span className="ml-auto text-lg font-bold text-primary">{rate}%</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input type="text" inputMode="decimal" value={rateDisplay} onChange={(e) => handleRateChange(e.target.value)} onFocus={handleRateFocus} onBlur={handleRateBlur} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter rate" />
                </div>
                <span className="text-muted-foreground font-medium text-sm">%</span>
              </div>
              <input id="sg-rate" type="range" min={MIN_RATE} max={MAX_RATE} step={0.25} value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_RATE} aria-valuemax={MAX_RATE} aria-valuenow={rate} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MIN_RATE}%</span>
                <span>{MAX_RATE}%</span>
              </div>
            </div>

            {/* Time Horizon */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Calendar className="w-4 h-4 text-primary" />
                <span>Time Horizon</span>
                <span className="ml-auto text-lg font-bold text-primary">{years} {years === 1 ? "Year" : "Years"}</span>
              </label>
              <div className="relative">
                <input type="text" inputMode="decimal" value={yearsDisplay} onChange={(e) => handleYearsChange(e.target.value)} onFocus={handleYearsFocus} onBlur={handleYearsBlur} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter years" />
              </div>
              <input id="sg-years" type="range" min={MIN_YEARS} max={MAX_YEARS} step={0.5} value={years}
                onChange={(e) => setYears(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_YEARS} aria-valuemax={MAX_YEARS} aria-valuenow={years} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MIN_YEARS} Yr</span>
                <span>{MAX_YEARS} Yrs</span>
              </div>
            </div>
          </div>

          {/* Results Cards */}
          <div className="space-y-4">
            {/* Future Value Hero */}
            <div className={`rounded-xl p-6 border ${
              isOnTrack
                ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200"
                : "bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <PiggyBank className={`w-5 h-5 ${isOnTrack ? "text-emerald-600" : "text-amber-600"}`} />
                <p className="text-sm font-medium text-muted-foreground">Projected Future Value</p>
              </div>
              <p className={`text-4xl font-extrabold ${isOnTrack ? "text-emerald-600" : "text-foreground"}`}>
                {formatCurrency(futureValue, currency)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {isOnTrack ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Goal on Track
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Needs Adjustment
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {progress.toFixed(0)}% of goal
                </span>
              </div>
              {/* Progress Bar */}
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${isOnTrack ? "bg-emerald-500" : "bg-amber-500"}`}
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            </div>

            {/* Mini Cards Row 1 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Target className="w-3 h-3 text-primary" />
                  Goal Amount
                </p>
                <p className="text-lg font-bold break-words">{formatCurrency(goalAmount, currency)}</p>
              </div>
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-emerald-500" />
                  Monthly Needed
                </p>
                <p className="text-lg font-bold text-emerald-500 break-words">
                  {monthlyNeeded > 0 ? formatCurrency(monthlyNeeded, currency) : "-"}
                </p>
              </div>
            </div>

            {/* Mini Cards Row 2 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-primary" />
                  Time to Goal
                </p>
                <p className="text-lg font-bold break-words">
                  {timeToGoal !== null
                    ? `${timeToGoal.toFixed(1)} ${timeToGoal === 1 ? "yr" : "yrs"}`
                    : "-"}
                </p>
              </div>
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  {isOnTrack ? (
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-red-500" />
                  )}
                  {isOnTrack ? "Surplus" : "Shortfall"}
                </p>
                <p className={`text-lg font-bold break-words ${isOnTrack ? "text-emerald-500" : "text-red-500"}`}>
                  {formatCurrency(isOnTrack ? futureValue - goalAmount : shortfall, currency)}
                </p>
              </div>
            </div>

            {/* Gap Advisory */}
            {!isOnTrack && monthlyNeeded > 0 && (
              <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-4">
                <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  How to Get on Track
                </p>
                <p className="text-sm text-amber-800">
                  Save <strong>{formatCurrency(monthlyNeeded, currency)}/month</strong> instead of {formatCurrency(monthlySavings, currency)}/month to reach your goal in {years} {years === 1 ? "year" : "years"}.
                  {timeToGoal !== null && timeToGoal > years && (
                    <> Alternatively, extend your timeline to <strong>{timeToGoal.toFixed(1)} years</strong> with your current savings rate.</>
                  )}
                </p>
              </div>
            )}

            {/* Pie Chart */}
            {totalReturns > 0 && (
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
                    <p className="text-[11px] text-muted-foreground mb-0.5">Total Saved</p>
                    <p className="text-sm font-semibold">{formatCurrency(totalContributions, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Interest Earned</p>
                    <p className="text-sm font-semibold text-emerald-500">{formatCurrency(totalReturns, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Goal Amount</p>
                    <p className="text-sm font-semibold">{formatCurrency(goalAmount, currency)}</p>
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
                Savings Growth Trajectory
              </h3>
            </div>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="year" fontSize={11} tickMargin={8} tickFormatter={(v) => `Yr ${v}`} />
                  <YAxis tickFormatter={(v: number) => formatCompact(v, currency)} fontSize={11} width={60} />
                  <Tooltip content={<ChartTooltip currency={currency} />} />
                  <ReferenceLine y={goalAmount} stroke="#f59e0b" strokeDasharray="6 3"
                    label={{ value: "Goal", position: "right", fontSize: 11, fill: "#f59e0b" }} />
                  <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2}
                    fill="url(#sgGrad)" dot={false} animationDuration={1200} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-3">
              <span>Start</span>
              <span className="text-amber-600 font-medium">Goal: {formatCurrency(goalAmount, currency)}</span>
              <span>Year {years}</span>
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
              Yearly Projection
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
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Contributions</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">% of Goal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyData.map((row) => {
                      const pct = goalAmount > 0 ? (row.value / goalAmount) * 100 : 0;
                      return (
                        <tr key={row.year} className="border-b border-border/50 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-2 font-medium">Year {row.year}</td>
                          <td className={`text-right py-3 px-2 font-semibold ${row.value >= goalAmount ? "text-emerald-500" : ""}`}>
                            {formatCurrency(row.value, currency)}
                          </td>
                          <td className="text-right py-3 px-2">{formatCurrency(row.contributions, currency)}</td>
                          <td className="text-right py-3 px-2">{pct.toFixed(0)}%</td>
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
