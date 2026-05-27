"use client";

import { useState, useMemo } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { ToolLayout } from "@/components/layout/ToolLayout";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  PieChart, Pie, Cell,
} from "recharts";
import { Banknote, IndianRupee, Percent, Calendar, PiggyBank, TrendingUp, ArrowUpRight, ArrowDownRight, Table, User, Clock, CheckCircle, AlertTriangle, XCircle, Target } from "lucide-react";

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

const MIN_AGE = 18;
const MAX_AGE = 70;
const MIN_RETIREMENT = 30;
const MAX_RETIREMENT = 85;
const MIN_LIFE = 50;
const MAX_LIFE = 100;
const MIN_SAVINGS = 0;
const MAX_SAVINGS = 1000000;
const MIN_CORPUS = 0;
const MAX_CORPUS = 100000000;
const MIN_RETURN_PRE = 1;
const MAX_RETURN_PRE = 25;
const MIN_RETURN_POST = 0;
const MAX_RETURN_POST = 12;
const MIN_WITHDRAWAL = 0;
const MAX_WITHDRAWAL = 10000000;

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

interface RetirementResults {
  corpusAtRetirement: number;
  totalContributions: number;
  returnsDuringAccumulation: number;
  sustainableMonthlyWithdrawal: number;
  isOnTrack: boolean;
  additionalSavingsNeeded: number;
  yearsCorpusLasts: number;
  ageRunsOut: number | null;
  finalBalance: number;
  chartData: { age: number; value: number }[];
  pieData: { name: string; value: number }[];
  accumulationYears: number;
}

function calculateRetirement(
  currentAge: number,
  retirementAge: number,
  lifeExpectancy: number,
  monthlySavings: number,
  currentCorpus: number,
  preReturn: number,
  postReturn: number,
  desiredWithdrawal: number
): RetirementResults {
  if (![currentAge, retirementAge, lifeExpectancy, monthlySavings, currentCorpus, preReturn, postReturn, desiredWithdrawal].every(Number.isFinite)) {
    return {
      corpusAtRetirement: 0, totalContributions: 0, returnsDuringAccumulation: 0,
      sustainableMonthlyWithdrawal: 0, isOnTrack: false, additionalSavingsNeeded: 0,
      yearsCorpusLasts: 0, ageRunsOut: null, finalBalance: 0, chartData: [], pieData: [],
      accumulationYears: 0,
    };
  }

  const clampedCurrentAge = Math.max(MIN_AGE, Math.min(currentAge, MAX_AGE));
  const clampedRetirementAge = Math.max(Math.max(MIN_RETIREMENT, clampedCurrentAge + 1), Math.min(retirementAge, MAX_RETIREMENT));
  const clampedLifeExpectancy = Math.max(clampedRetirementAge + 1, Math.min(lifeExpectancy, MAX_LIFE));
  const clampedMonthlySavings = Math.max(0, Math.min(monthlySavings, MAX_SAVINGS));
  const clampedCurrentCorpus = Math.max(0, Math.min(currentCorpus, MAX_CORPUS));
  const clampedPreReturn = Math.max(0, Math.min(preReturn, MAX_RETURN_PRE));
  const clampedPostReturn = Math.max(0, Math.min(postReturn, MAX_RETURN_POST));
  const clampedWithdrawal = Math.max(0, Math.min(desiredWithdrawal, MAX_WITHDRAWAL));

  const yearsToRetirement = clampedRetirementAge - clampedCurrentAge;
  const yearsInRetirement = clampedLifeExpectancy - clampedRetirementAge;

  if (yearsToRetirement <= 0 || yearsInRetirement <= 0) {
    return {
      corpusAtRetirement: 0, totalContributions: 0, returnsDuringAccumulation: 0,
      sustainableMonthlyWithdrawal: 0, isOnTrack: false, additionalSavingsNeeded: 0,
      yearsCorpusLasts: 0, ageRunsOut: null, finalBalance: 0, chartData: [], pieData: [],
      accumulationYears: 0,
    };
  }

  const totalMonths = yearsToRetirement * 12;
  const retirementMonths = yearsInRetirement * 12;
  const monthlyPreRate = clampedPreReturn / 100 / 12;
  const monthlyPostRate = clampedPostReturn / 100 / 12;

  // Phase 1: Accumulation
  let balance = clampedCurrentCorpus;
  let totalContributions = clampedCurrentCorpus;
  const chartData: { age: number; value: number }[] = [];

  chartData.push({ age: clampedCurrentAge, value: Math.round(balance) });

  for (let m = 1; m <= totalMonths; m++) {
    balance += clampedMonthlySavings;
    totalContributions += clampedMonthlySavings;

    if (clampedPreReturn > 0) {
      balance *= (1 + monthlyPreRate);
    }

    if (m % 12 === 0 || m === totalMonths) {
      chartData.push({
        age: clampedCurrentAge + m / 12,
        value: Math.round(balance),
      });
    }
  }

  const corpusAtRetirement = Math.round(balance);
  const totalContributionsEnd = Math.round(totalContributions);
  const returnsDuringAccumulation = Math.max(0, corpusAtRetirement - totalContributionsEnd);

  // Phase 2: Retirement depletion
  let retireBalance = corpusAtRetirement;
  let ageRunsOut: number | null = null;

  for (let m = 1; m <= retirementMonths; m++) {
    if (clampedPostReturn > 0) {
      retireBalance *= (1 + monthlyPostRate);
    }
    retireBalance -= clampedWithdrawal;

    if (retireBalance <= 0 && ageRunsOut === null) {
      ageRunsOut = clampedRetirementAge + (m - 1) / 12;
      retireBalance = 0;
    }

    if (m % 12 === 0 || m === retirementMonths) {
      chartData.push({
        age: clampedRetirementAge + m / 12,
        value: Math.max(0, Math.round(retireBalance)),
      });
    }
  }

  const finalBalance = Math.max(0, Math.round(retireBalance));
  const isOnTrack = ageRunsOut === null || ageRunsOut >= clampedLifeExpectancy;
  const yearsCorpusLasts = ageRunsOut !== null ? Math.round((ageRunsOut - clampedRetirementAge) * 10) / 10 : yearsInRetirement;

  // Sustainable monthly withdrawal (annuity formula)
  let sustainableMonthlyWithdrawal = 0;
  if (retirementMonths > 0 && corpusAtRetirement > 0) {
    if (clampedPostReturn > 0) {
      sustainableMonthlyWithdrawal = Math.round(
        corpusAtRetirement * monthlyPostRate / (1 - Math.pow(1 + monthlyPostRate, -retirementMonths))
      );
    } else {
      sustainableMonthlyWithdrawal = Math.round(corpusAtRetirement / retirementMonths);
    }
  }

  // Gap analysis: additional monthly savings needed during accumulation
  let additionalSavingsNeeded = 0;
  if (!isOnTrack && clampedWithdrawal > 0 && totalMonths > 0) {
    let desiredCorpus = 0;
    if (clampedPostReturn > 0 && retirementMonths > 0) {
      desiredCorpus = Math.round(
        clampedWithdrawal * (1 - Math.pow(1 + monthlyPostRate, -retirementMonths)) / monthlyPostRate
      );
    } else if (retirementMonths > 0) {
      desiredCorpus = clampedWithdrawal * retirementMonths;
    }

    const gap = Math.max(0, desiredCorpus - corpusAtRetirement);

    if (gap > 0 && clampedPreReturn > 0 && totalMonths > 0) {
      additionalSavingsNeeded = Math.round(
        gap * monthlyPreRate / (Math.pow(1 + monthlyPreRate, totalMonths) - 1) / (1 + monthlyPreRate)
      );
    } else if (gap > 0 && totalMonths > 0) {
      additionalSavingsNeeded = Math.round(gap / totalMonths);
    }
  }

  return {
    corpusAtRetirement,
    totalContributions: totalContributionsEnd,
    returnsDuringAccumulation,
    sustainableMonthlyWithdrawal,
    isOnTrack,
    additionalSavingsNeeded,
    yearsCorpusLasts,
    ageRunsOut,
    finalBalance,
    chartData,
    pieData: [
      { name: "Total Deposits", value: totalContributionsEnd },
      { name: "Returns", value: returnsDuringAccumulation },
    ],
    accumulationYears: yearsToRetirement,
  };
}

function ChartTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white border border-border rounded-xl shadow-xl p-4 text-sm space-y-2">
      <p className="font-semibold text-foreground">Age {label}</p>
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

export default function RetirementCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const { value: currentAge, displayValue: currentAgeDisplay, setValue: setCurrentAge, handleChange: handleCurrentAgeChange, handleFocus: handleCurrentAgeFocus, handleBlur: handleCurrentAgeBlur } = useNumericField(30);
  const { value: retirementAge, displayValue: retirementAgeDisplay, setValue: setRetirementAge, handleChange: handleRetirementAgeChange, handleFocus: handleRetirementAgeFocus, handleBlur: handleRetirementAgeBlur } = useNumericField(60);
  const { value: lifeExpectancy, displayValue: lifeExpectancyDisplay, setValue: setLifeExpectancy, handleChange: handleLifeExpectancyChange, handleFocus: handleLifeExpectancyFocus, handleBlur: handleLifeExpectancyBlur } = useNumericField(85);
  const { value: monthlySavings, displayValue: monthlySavingsDisplay, setValue: setMonthlySavings, handleChange: handleMonthlySavingsChange, handleFocus: handleMonthlySavingsFocus, handleBlur: handleMonthlySavingsBlur } = useNumericField(10000);
  const { value: currentCorpus, displayValue: currentCorpusDisplay, setValue: setCurrentCorpus, handleChange: handleCurrentCorpusChange, handleFocus: handleCurrentCorpusFocus, handleBlur: handleCurrentCorpusBlur } = useNumericField(100000);
  const { value: preReturn, displayValue: preReturnDisplay, setValue: setPreReturn, handleChange: handlePreReturnChange, handleFocus: handlePreReturnFocus, handleBlur: handlePreReturnBlur } = useNumericField(10);
  const { value: postReturn, displayValue: postReturnDisplay, setValue: setPostReturn, handleChange: handlePostReturnChange, handleFocus: handlePostReturnFocus, handleBlur: handlePostReturnBlur } = useNumericField(6);
  const { value: desiredWithdrawal, displayValue: desiredWithdrawalDisplay, setValue: setDesiredWithdrawal, handleChange: handleDesiredWithdrawalChange, handleFocus: handleDesiredWithdrawalFocus, handleBlur: handleDesiredWithdrawalBlur } = useNumericField(50000);
  const [showTable, setShowTable] = useState(false);

  const results = useMemo(
    () => calculateRetirement(
      currentAge, retirementAge, lifeExpectancy,
      monthlySavings, currentCorpus,
      preReturn, postReturn, desiredWithdrawal
    ),
    [currentAge, retirementAge, lifeExpectancy, monthlySavings, currentCorpus, preReturn, postReturn, desiredWithdrawal]
  );

  const {
    corpusAtRetirement, totalContributions, returnsDuringAccumulation,
    sustainableMonthlyWithdrawal, isOnTrack, additionalSavingsNeeded,
    yearsCorpusLasts, ageRunsOut, finalBalance, chartData, pieData, accumulationYears,
  } = results;

  const retirementYears = lifeExpectancy - retirementAge;
  const savingsRatio = monthlySavings > 0 && desiredWithdrawal > 0
    ? Math.min(100, (monthlySavings / desiredWithdrawal) * 100) : 0;

  const inputRangeClass = "w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer";

  return (
    <ToolLayout
      title="Retirement Calculator"
      description="Plan your retirement with this comprehensive calculator. Project your corpus growth, determine sustainable monthly withdrawals, and see if you're on track for a comfortable retirement with detailed charts and analysis."
      category="finance"
      faqContent={[
        {
          question: "How does the Retirement Calculator work?",
          answer: "The calculator simulates your financial journey in two phases. Phase 1 (Accumulation): Your current corpus grows and monthly savings are added each month, compounding at your expected pre-retirement return rate until retirement. Phase 2 (Retirement): Your accumulated corpus is withdrawn monthly at your desired income level while continuing to earn returns at a lower post-retirement rate. The calculator shows whether your corpus lasts through your expected lifetime.",
        },
        {
          question: "What is the 4% rule in retirement planning?",
          answer: "The 4% rule is a retirement withdrawal guideline suggesting you can withdraw 4% of your retirement corpus in the first year, adjusted for inflation annually, with a high probability of your money lasting 30 years. This calculator uses a more precise annuity formula accounting for your specific retirement duration and expected post-retirement returns, giving you a personalized sustainable withdrawal amount.",
        },
        {
          question: "How much monthly savings do I need for retirement?",
          answer: "The amount depends on your current age, desired retirement age, expected returns, and desired retirement income. As a rule of thumb, saving 15-20% of your income from your 20s or 30s can build a substantial corpus. This calculator shows you exactly how much to save monthly and highlights any gap between your current savings rate and your retirement goal.",
        },
        {
          question: "What is a good pre-retirement return rate?",
          answer: "For equity-heavy portfolios, 10-12% annual returns are reasonable based on historical stock market averages. For balanced portfolios (60% equity, 40% debt), 8-10% is typical. For conservative portfolios, 6-8%. Use realistic rates - overestimating returns can lead to a false sense of security and inadequate savings.",
        },
        {
          question: "Why is the post-retirement return rate lower?",
          answer: "During retirement, most investors shift to a more conservative asset allocation to protect their corpus from market volatility. This typically means a higher proportion of debt, fixed deposits, and bonds, which offer lower but more stable returns. A 5-7% post-retirement return is realistic for a balanced retired portfolio.",
        },
        {
          question: "What happens if I retire early?",
          answer: "Early retirement means a longer accumulation period (more savings) but also a longer retirement period (more years to fund). The calculator accounts for both. If you retire at 50 instead of 60, you have 10 more years to save but need your corpus to last 10 more years. Use the calculator to compare different retirement ages and find the right balance.",
        },
        {
          question: "How does inflation affect retirement planning?",
          answer: "Inflation reduces purchasing power over time. If you need ₹50,000/month today, you'll need ~₹1,08,000/month in 20 years at 4% inflation. To account for inflation, use real (inflation-adjusted) return rates: for example, if your nominal return is 10% and inflation is 4%, use 6% as your real return rate in the calculator.",
        },
        {
          question: "What is the ideal retirement corpus?",
          answer: "A common benchmark is 25-30 times your annual expenses. For ₹6,00,000 annual expenses (₹50,000/month), this means a corpus of ₹1.5-1.8 crore. However, the ideal corpus depends on your life expectancy, post-retirement returns, and whether you have other income sources like pensions or rental income.",
        },
        {
          question: "Should I include my pension or Social Security?",
          answer: "Yes, include any guaranteed retirement income by reducing your desired monthly withdrawal. For example, if you need ₹50,000/month but expect ₹15,000/month from a pension or Social Security, set the desired withdrawal to ₹35,000/month. This gives a more accurate picture of your corpus requirements.",
        },
        {
          question: "How often should I review my retirement plan?",
          answer: "Review your retirement plan annually or whenever there's a significant life change (job change, marriage, children, inheritance, market crash). Update your actual corpus, returns, and savings rate. The retirement projection changes significantly with even small adjustments to inputs, so regular monitoring is essential.",
        },
      ]}
      explanationContent={
        <div className="prose prose-slate max-w-none">
          <h2>What is a Retirement Calculator?</h2>
          <p>
            A <strong>Retirement Calculator</strong> is a comprehensive financial planning tool that estimates whether your current savings and monthly contributions will fund your desired lifestyle throughout retirement. It simulates the full journey - from today through your working years, into retirement, and until your life expectancy - accounting for compound growth, monthly contributions, and periodic withdrawals.
          </p>

          <h3>How the Calculation Works</h3>
          <p>The calculator models two distinct phases of your financial life:</p>

          <h4>Phase 1: Accumulation (Age {currentAge} to {retirementAge})</h4>
          <p>During this phase, your existing corpus grows and you add monthly savings. The formula for the future value of each component:</p>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
            Corpus Growth: FV = PV × (1 + r/12)<sup>n</sup>
          </pre>
          <p>Where:</p>
          <ul>
            <li><strong>PV</strong> = Current retirement corpus</li>
            <li><strong>r</strong> = Annual pre-retirement return rate</li>
            <li><strong>n</strong> = Total months until retirement</li>
          </ul>
          <p>Each monthly savings contribution compounds from the time it's deposited. The total is the sum of the growing corpus plus the future value of all monthly contributions.</p>

          <h4>Phase 2: Retirement (Age {retirementAge} to {lifeExpectancy})</h4>
          <p>During retirement, your corpus earns returns at a lower rate while you make monthly withdrawals. The annuity formula determines your sustainable monthly withdrawal:</p>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
            PMT = PV × r / (1 - (1 + r)<sup>-n</sup>)
          </pre>
          <p>Where:</p>
          <ul>
            <li><strong>PMT</strong> = Sustainable monthly withdrawal</li>
            <li><strong>PV</strong> = Corpus at retirement</li>
            <li><strong>r</strong> = Monthly post-retirement return rate</li>
            <li><strong>n</strong> = Total months in retirement</li>
          </ul>

          {!isOnTrack && additionalSavingsNeeded > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
              <p className="font-semibold text-amber-800">ðŸ"Š Gap Analysis</p>
              <p className="text-amber-700 mt-1">
                Your current plan leaves a shortfall. Saving an additional <strong>{formatCurrency(additionalSavingsNeeded, currency)}/month</strong> would bridge the gap and put your retirement plan on track.
              </p>
            </div>
          )}

          <h3>Benefits of Retirement Planning</h3>
          <ul>
            <li><strong>Peace of Mind:</strong> Know exactly where you stand and what adjustments are needed to achieve a comfortable retirement.</li>
            <li><strong>Goal Clarity:</strong> Translate your desired retirement lifestyle into a concrete monthly savings target and corpus goal.</li>
            <li><strong>Early Warning:</strong> Identify gaps years or decades before retirement, giving you time to adjust your savings rate or retirement expectations.</li>
            <li><strong>Scenario Comparison:</strong> Compare different retirement ages, savings rates, and return assumptions to find the optimal strategy.</li>
            <li><strong>Data-Driven Decisions:</strong> Make informed choices about how much to save, when to retire, and how to allocate your investments.</li>
          </ul>

          <h3>Example Calculation</h3>
          <p><strong>Scenario:</strong> You are 30 years old, plan to retire at 60, and expect to live until 85. You save ₹10,000/month, have ₹1,00,000 saved, expect 10% pre-retirement returns, 6% post-retirement returns, and want ₹50,000/month in retirement.</p>
          <ul>
            <li><strong>Current Age:</strong> 30 | <strong>Retirement Age:</strong> 60 | <strong>Life Expectancy:</strong> 85</li>
            <li><strong>Accumulation:</strong> 30 years of saving</li>
            <li><strong>Corpus at Retirement:</strong> ~₹2.76 Cr</li>
            <li><strong>Total Contributions:</strong> ~₹37,00,000</li>
            <li><strong>Returns Earned:</strong> ~₹2.39 Cr</li>
            <li><strong>Sustainable Monthly Withdrawal:</strong> ~₹1,77,000/month</li>
            <li><strong>Status:</strong> On Track - your desired ₹50,000/month is well within sustainable limits</li>
          </ul>

          <h3>Common Retirement Planning Mistakes</h3>
          <ul>
            <li><strong>Starting too late:</strong> The power of compounding is strongest over long periods. Starting at 25 vs 35 can mean 2-3x the corpus at retirement for the same monthly savings.</li>
            <li><strong>Using unrealistic return assumptions:</strong> Assuming 15%+ returns consistently can lead to severe under-saving. Use conservative estimates of 8-12% for pre-retirement and 5-7% for post-retirement.</li>
            <li><strong>Ignoring inflation:</strong> ₹50,000/month today will be worth only ~₹15,000 in 30 years at 4% inflation. Use real return rates (nominal return - inflation) to account for this.</li>
            <li><strong>Underestimating life expectancy:</strong> With improving healthcare, many people live into their 90s. Planning only until 75-80 risks outliving your savings.</li>
            <li><strong>Not adjusting the plan:</strong> A retirement plan isn't static. Review annually, adjust savings as income grows, and rebalance investments as you approach retirement.</li>
          </ul>

          <h3>Tips for a Secure Retirement</h3>
          <ul>
            <li><strong>Start early and stay consistent:</strong> Even small amounts saved consistently from your 20s can grow significantly through decades of compounding.</li>
            <li><strong>Increase savings with income:</strong> As your income grows, increase your savings rate. Aim to save at least 15-20% of your income for retirement.</li>
            <li><strong>Diversify investments:</strong> A mix of equity, debt, and alternative investments provides growth while managing risk. Shift toward safer assets as you approach retirement.</li>
            <li><strong>Build multiple income streams:</strong> Supplement your retirement corpus with pensions, rental income, dividends, or part-time work to reduce withdrawal pressure.</li>
            <li><strong>Plan for healthcare costs:</strong> Healthcare expenses often increase significantly in retirement. Factor in health insurance premiums and potential medical costs.</li>
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
              <label htmlFor="ret-currency" className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <Banknote className="w-4 h-4 text-primary" />
                Currency
              </label>
              <select id="ret-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>

            {/* Current Age */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <User className="w-4 h-4 text-primary" />
                <span>Current Age</span>
                <span className="ml-auto text-lg font-bold text-primary">{currentAge}</span>
              </label>
              <div className="relative">
                <input type="text" inputMode="decimal" value={currentAgeDisplay} onChange={(e) => handleCurrentAgeChange(e.target.value)} onFocus={handleCurrentAgeFocus} onBlur={handleCurrentAgeBlur} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter age" />
              </div>
              <input id="ret-age" type="range" min={MIN_AGE} max={MAX_AGE} step={1} value={currentAge}
                onChange={(e) => setCurrentAge(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_AGE} aria-valuemax={MAX_AGE} aria-valuenow={currentAge} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MIN_AGE}</span>
                <span>{MAX_AGE}</span>
              </div>
            </div>

            {/* Retirement Age */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Target className="w-4 h-4 text-primary" />
                <span>Retirement Age</span>
                <span className="ml-auto text-lg font-bold text-primary">{retirementAge}</span>
              </label>
              <div className="relative">
                <input type="text" inputMode="decimal" value={retirementAgeDisplay} onChange={(e) => handleRetirementAgeChange(e.target.value)} onFocus={handleRetirementAgeFocus} onBlur={handleRetirementAgeBlur} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter age" />
              </div>
              <input id="ret-retire" type="range" min={Math.max(MIN_RETIREMENT, currentAge + 1)} max={MAX_RETIREMENT} step={1} value={retirementAge}
                onChange={(e) => setRetirementAge(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={Math.max(MIN_RETIREMENT, currentAge + 1)} aria-valuemax={MAX_RETIREMENT} aria-valuenow={retirementAge} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.max(MIN_RETIREMENT, currentAge + 1)}</span>
                <span>{MAX_RETIREMENT}</span>
              </div>
            </div>

            {/* Life Expectancy */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Clock className="w-4 h-4 text-primary" />
                <span>Life Expectancy</span>
                <span className="ml-auto text-lg font-bold text-primary">{lifeExpectancy}</span>
              </label>
              <div className="relative">
                <input type="text" inputMode="decimal" value={lifeExpectancyDisplay} onChange={(e) => handleLifeExpectancyChange(e.target.value)} onFocus={handleLifeExpectancyFocus} onBlur={handleLifeExpectancyBlur} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter age" />
              </div>
              <input id="ret-life" type="range" min={Math.max(MIN_LIFE, retirementAge + 1)} max={MAX_LIFE} step={1} value={lifeExpectancy}
                onChange={(e) => setLifeExpectancy(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={Math.max(MIN_LIFE, retirementAge + 1)} aria-valuemax={MAX_LIFE} aria-valuenow={lifeExpectancy} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.max(MIN_LIFE, retirementAge + 1)}</span>
                <span>{MAX_LIFE}</span>
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
              <input id="ret-savings" type="range" min={MIN_SAVINGS} max={MAX_SAVINGS} step={500} value={monthlySavings}
                onChange={(e) => setMonthlySavings(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_SAVINGS} aria-valuemax={MAX_SAVINGS} aria-valuenow={monthlySavings} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(MIN_SAVINGS, currency)}</span>
                <span>{formatCurrency(MAX_SAVINGS, currency)}</span>
              </div>
            </div>

            {/* Current Corpus */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <PiggyBank className="w-4 h-4 text-primary" />
                <span>Current Retirement Corpus</span>
                <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(currentCorpus, currency)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                <input type="text" inputMode="decimal" value={currentCorpusDisplay} onChange={(e) => handleCurrentCorpusChange(e.target.value)} onFocus={handleCurrentCorpusFocus} onBlur={handleCurrentCorpusBlur} className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter amount" />
              </div>
              <input id="ret-corpus" type="range" min={MIN_CORPUS} max={MAX_CORPUS} step={50000} value={currentCorpus}
                onChange={(e) => setCurrentCorpus(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_CORPUS} aria-valuemax={MAX_CORPUS} aria-valuenow={currentCorpus} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(MIN_CORPUS, currency)}</span>
                <span>{formatCurrency(MAX_CORPUS, currency)}</span>
              </div>
            </div>

            {/* Pre-Retirement Return */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>Pre-Retirement Return (p.a.)</span>
                <span className="ml-auto text-lg font-bold text-primary">{preReturn}%</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input type="text" inputMode="decimal" value={preReturnDisplay} onChange={(e) => handlePreReturnChange(e.target.value)} onFocus={handlePreReturnFocus} onBlur={handlePreReturnBlur} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter rate" />
                </div>
                <span className="text-muted-foreground font-medium text-sm">%</span>
              </div>
              <input id="ret-pre" type="range" min={MIN_RETURN_PRE} max={MAX_RETURN_PRE} step={0.25} value={preReturn}
                onChange={(e) => setPreReturn(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_RETURN_PRE} aria-valuemax={MAX_RETURN_PRE} aria-valuenow={preReturn} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MIN_RETURN_PRE}%</span>
                <span>{MAX_RETURN_PRE}%</span>
              </div>
            </div>

            {/* Post-Retirement Return */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>Post-Retirement Return (p.a.)</span>
                <span className="ml-auto text-lg font-bold text-primary">{postReturn}%</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input type="text" inputMode="decimal" value={postReturnDisplay} onChange={(e) => handlePostReturnChange(e.target.value)} onFocus={handlePostReturnFocus} onBlur={handlePostReturnBlur} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter rate" />
                </div>
                <span className="text-muted-foreground font-medium text-sm">%</span>
              </div>
              <input id="ret-post" type="range" min={MIN_RETURN_POST} max={MAX_RETURN_POST} step={0.25} value={postReturn}
                onChange={(e) => setPostReturn(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_RETURN_POST} aria-valuemax={MAX_RETURN_POST} aria-valuenow={postReturn} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MIN_RETURN_POST}%</span>
                <span>{MAX_RETURN_POST}%</span>
              </div>
            </div>

            {/* Desired Monthly Withdrawal */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <ArrowDownRight className="w-4 h-4 text-primary" />
                <span>Desired Monthly Withdrawal</span>
                <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(desiredWithdrawal, currency)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                <input type="text" inputMode="decimal" value={desiredWithdrawalDisplay} onChange={(e) => handleDesiredWithdrawalChange(e.target.value)} onFocus={handleDesiredWithdrawalFocus} onBlur={handleDesiredWithdrawalBlur} className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter amount" />
              </div>
              <input id="ret-withdrawal" type="range" min={MIN_WITHDRAWAL} max={MAX_WITHDRAWAL} step={500} value={desiredWithdrawal}
                onChange={(e) => setDesiredWithdrawal(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_WITHDRAWAL} aria-valuemax={MAX_WITHDRAWAL} aria-valuenow={desiredWithdrawal} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(MIN_WITHDRAWAL, currency)}</span>
                <span>{formatCurrency(MAX_WITHDRAWAL, currency)}</span>
              </div>
            </div>
          </div>

          {/* Results Cards */}
          <div className="space-y-4">
            {/* Corpus Hero */}
            <div className={`rounded-xl p-6 border ${isOnTrack
              ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200"
              : "bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <PiggyBank className={`w-5 h-5 ${isOnTrack ? "text-emerald-600" : "text-amber-600"}`} />
                <p className="text-sm font-medium text-muted-foreground">Corpus at Retirement</p>
              </div>
              <p className="text-4xl font-extrabold text-foreground break-words">{formatCurrency(corpusAtRetirement, currency)}</p>
              <div className="flex items-center gap-2 mt-2">
                {isOnTrack ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                    <CheckCircle className="w-3.5 h-3.5" />
                    On Track
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Needs Attention
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  Sustainable: {formatCurrency(sustainableMonthlyWithdrawal, currency)}/mo
                </span>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <CheckCircle className={`w-3 h-3 ${isOnTrack ? "text-emerald-500" : "text-amber-500"}`} />
                  Monthly Goal
                </p>
                <p className="text-lg font-bold break-words">{formatCurrency(desiredWithdrawal, currency)}</p>
              </div>
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  Sustainable
                </p>
                <p className="text-lg font-bold text-emerald-500 break-words">{formatCurrency(sustainableMonthlyWithdrawal, currency)}</p>
              </div>
            </div>

            {!isOnTrack && additionalSavingsNeeded > 0 && (
              <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-4">
                <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Gap Analysis
                </p>
                <p className="text-sm text-amber-800">
                  Save an additional <strong>{formatCurrency(additionalSavingsNeeded, currency)}/month</strong> to reach your goal.
                </p>
              </div>
            )}

            {ageRunsOut && !isOnTrack && (
              <div className="bg-red-50 border border-red-200/50 rounded-xl p-4">
                <p className="text-xs text-red-700 font-medium flex items-center gap-1.5 mb-1">
                  <XCircle className="w-3.5 h-3.5" />
                  Depletion Warning
                </p>
                <p className="text-sm text-red-800">
                  Your corpus runs out at age {Math.round(ageRunsOut)} - {yearsCorpusLasts.toFixed(0)} years into retirement. You may outlive your savings.
                </p>
              </div>
            )}

            {/* Pie Chart */}
            {returnsDuringAccumulation > 0 && (
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
                    <p className="text-[11px] text-muted-foreground mb-0.5">Total Saved</p>
                    <p className="text-sm font-semibold">{formatCurrency(totalContributions, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Growth</p>
                    <p className="text-sm font-semibold text-emerald-500">{formatCurrency(returnsDuringAccumulation, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Corpus</p>
                    <p className="text-sm font-semibold">{formatCurrency(corpusAtRetirement, currency)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="bg-white border border-border rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Contributions</span>
                <span className="font-medium">{formatCurrency(totalContributions, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Returns During Accumulation</span>
                <span className="font-medium text-emerald-500">{formatCurrency(returnsDuringAccumulation, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Corpus Depletion</span>
                <span className="font-medium">{ageRunsOut ? `Age ${Math.round(ageRunsOut)}` : "Lasts through retirement"}</span>
              </div>
              {finalBalance > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining at Life Expectancy</span>
                  <span className="font-medium text-emerald-500">{formatCurrency(finalBalance, currency)}</span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="bg-white border border-border rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Retirement Journey
              </h3>
              <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
                {accumulationYears}Y accumulation · {retirementYears}Y retirement
              </span>
            </div>
            <div className="h-72 sm:h-96">
              <ResponsiveContainer initialDimension={{width:100,height:100}} width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="50%" stopColor="#10b981" stopOpacity={0.10} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="age" fontSize={11} tickMargin={8} domain={["dataMin", "dataMax"]} />
                  <YAxis tickFormatter={(v: number) => formatCompact(v, currency)} fontSize={11} width={60} />
                  <Tooltip content={<ChartTooltip currency={currency} />} />
                  <ReferenceLine x={retirementAge} stroke="#f59e0b" strokeDasharray="6 3" label={{ value: "Retirement", position: "top", fontSize: 11, fill: "#f59e0b" }} />
                  <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2}
                    fill="url(#retGrad)" dot={false} animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-3">
              <span>Age {currentAge} (Today)</span>
              <span className="text-amber-600 font-medium">Retirement at {retirementAge}</span>
              <span>Age {lifeExpectancy}</span>
            </div>
          </div>
        )}

        {/* Yearly Table */}
        {chartData.length > 0 && (
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
                      <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Age</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Corpus Value</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Phase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.filter((_, i) => i % 5 === 0 || i === chartData.length - 1).map((row, idx) => (
                      <tr key={idx} className="border-b border-border/50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2 font-medium">Age {row.age}</td>
                        <td className="text-right py-3 px-2 font-semibold">{formatCurrency(row.value, currency)}</td>
                        <td className={`text-right py-3 px-2 text-xs font-medium ${row.age <= retirementAge ? "text-primary" : "text-amber-600"}`}>
                          {row.age <= retirementAge ? "Accumulating" : "Retirement"}
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
