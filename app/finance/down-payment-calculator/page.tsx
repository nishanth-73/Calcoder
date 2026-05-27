"use client";

import { useState, useMemo } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { ToolLayout } from "@/components/layout/ToolLayout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import { Banknote, DollarSign, Percent, Calendar, PiggyBank, TrendingUp, Clock, Target, Home } from "lucide-react";

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
  { code: "GBP", label: "GBP (£)", symbol: "£", locale: "en-GB" },
  { code: "AED", label: "AED (د.إ)", symbol: "د.إ", locale: "ar-AE" },
  { code: "CAD", label: "CAD (C$)", symbol: "C$", locale: "en-CA" },
  { code: "AUD", label: "AUD (A$)", symbol: "A$", locale: "en-AU" },
  { code: "JPY", label: "JPY (¥)", symbol: "¥", locale: "ja-JP" },
  { code: "SGD", label: "SGD (S$)", symbol: "S$", locale: "en-SG" },
  { code: "CNY", label: "CNY (¥)", symbol: "¥", locale: "zh-CN" },
  { code: "MYR", label: "MYR (RM)", symbol: "RM", locale: "ms-MY" },
  { code: "ZAR", label: "ZAR (R)", symbol: "R", locale: "en-ZA" },
];

const MIN_PRICE = 10000;
const MAX_PRICE = 10000000;
const MIN_DOWN_PCT = 0;
const MAX_DOWN_PCT = 50;
const MIN_SAVED = 0;
const MAX_SAVED = 2000000;
const MIN_SAVING = 0;
const MAX_SAVING = 20000;

const BAR_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6"];

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

interface DownPaymentResults {
  downPayment: number;
  downPct: number;
  loanAmount: number;
  ltv: number;
  avoidsPMI: boolean;
  neededFor20: number;
  savingsGap: number;
  monthsToSave: number | null;
  chartData: { name: string; value: number; fill: string }[];
  timelineData: { month: string; Savings: number; Target: number }[];
}

function calculateDownPayment(
  homePrice: number,
  downPct: number,
  currentSavings: number,
  monthlySaving: number
): DownPaymentResults {
  if (!Number.isFinite(homePrice) || !Number.isFinite(downPct) || !Number.isFinite(currentSavings) || !Number.isFinite(monthlySaving)) {
    return {
      downPayment: 0, downPct: 0, loanAmount: 0, ltv: 0, avoidsPMI: false,
      neededFor20: 0, savingsGap: 0, monthsToSave: null, chartData: [], timelineData: [],
    };
  }

  const clampedPrice = Math.max(0, Math.min(homePrice, MAX_PRICE));
  const clampedPct = Math.max(0, Math.min(downPct, MAX_DOWN_PCT));
  const clampedSaved = Math.max(0, Math.min(currentSavings, MAX_SAVED));
  const clampedSaving = Math.max(0, Math.min(monthlySaving, MAX_SAVING));

  if (clampedPrice <= 0) {
    return {
      downPayment: 0, downPct: 0, loanAmount: 0, ltv: 0, avoidsPMI: false,
      neededFor20: 0, savingsGap: 0, monthsToSave: null, chartData: [], timelineData: [],
    };
  }

  const downPayment = clampedPrice * (clampedPct / 100);
  const loanAmount = clampedPrice - downPayment;
  const ltv = (loanAmount / clampedPrice) * 100;
  const avoidsPMI = clampedPct >= 20;
  const neededFor20 = clampedPrice * 0.2;
  const savingsGap = Math.max(0, downPayment - clampedSaved);

  let monthsToSave: number | null = null;
  if (clampedSaving > 0 && savingsGap > 0) {
    monthsToSave = Math.ceil(savingsGap / clampedSaving);
  } else if (savingsGap <= 0) {
    monthsToSave = 0;
  }

  const chartData = [
    { name: "Down Payment", value: Math.round(downPayment), fill: BAR_COLORS[0] },
    { name: "Loan Amount", value: Math.round(loanAmount), fill: BAR_COLORS[1] },
  ];

  const timelineData: DownPaymentResults["timelineData"] = [];
  if (clampedSaving > 0) {
    const maxSteps = 120;
    let saved = clampedSaved;
    for (let m = 0; m <= maxSteps; m++) {
      timelineData.push({
        month: m === 0 ? "Start" : m <= 12 ? `Mo ${m}` : m % 12 === 0 ? `Yr ${m / 12}` : "",
        Savings: Math.round(Math.min(saved, downPayment)),
        Target: Math.round(downPayment),
      });
      if (saved >= downPayment) break;
      saved += clampedSaving;
    }
  }

  return {
    downPayment: Math.round(downPayment),
    downPct: clampedPct,
    loanAmount: Math.round(loanAmount),
    ltv,
    avoidsPMI,
    neededFor20: Math.round(neededFor20),
    savingsGap: Math.round(savingsGap),
    monthsToSave,
    chartData,
    timelineData,
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

export default function DownPaymentCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const { value: homePrice, displayValue: homePriceDisplay, setValue: setHomePrice, handleChange: handleHomePriceChange, handleFocus: handleHomePriceFocus, handleBlur: handleHomePriceBlur } = useNumericField(400000);
  const { value: downPct, displayValue: downPctDisplay, setValue: setDownPct, handleChange: handleDownPctChange, handleFocus: handleDownPctFocus, handleBlur: handleDownPctBlur } = useNumericField(20);
  const { value: currentSavings, displayValue: currentSavingsDisplay, setValue: setCurrentSavings, handleChange: handleCurrentSavingsChange, handleFocus: handleCurrentSavingsFocus, handleBlur: handleCurrentSavingsBlur } = useNumericField(50000);
  const { value: monthlySaving, displayValue: monthlySavingDisplay, setValue: setMonthlySaving, handleChange: handleMonthlySavingChange, handleFocus: handleMonthlySavingFocus, handleBlur: handleMonthlySavingBlur } = useNumericField(1500);

  const results = useMemo(
    () => calculateDownPayment(homePrice, downPct, currentSavings, monthlySaving),
    [homePrice, downPct, currentSavings, monthlySaving]
  );

  const {
    downPayment, downPct: dp, loanAmount, ltv, avoidsPMI,
    neededFor20, savingsGap, monthsToSave, chartData, timelineData,
  } = results;

  const inputRangeClass = "w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer";

  return (
    <ToolLayout
      title="Down Payment Calculator"
      description="Determine the required down payment for your home purchase. Calculate how much you need to save, how different down payment percentages affect your loan, and how long it will take you to reach your goal."
      category="finance"
      faqContent={[
        {
          question: "How much down payment do I need for a house?",
          answer: "The ideal down payment is 20% of the home price, which eliminates the need for PMI (Private Mortgage Insurance). However, many loan options require less: conventional loans can go as low as 5%, FHA loans require 3.5%, and VA/USDA loans may require 0% down for eligible borrowers. A larger down payment means a lower monthly payment and less total interest.",
        },
        {
          question: "What is PMI and why should I avoid it?",
          answer: "PMI (Private Mortgage Insurance) protects the lender, not you, and is required when your down payment is less than 20%. It typically costs 0.3-1.5% of your loan amount annually ($50-200/month for a typical loan). PMI provides no benefit to you and can add thousands to your costs before it automatically terminates when you reach 22% equity.",
        },
        {
          question: "How does the down payment affect my monthly payment?",
          answer: "A larger down payment reduces your loan amount, which directly reduces both your monthly payment and total interest. For example, on a $400,000 home at 6.5%: a 10% down payment ($40K) results in a ~$2,276 monthly payment and ~$459K total interest, while 20% down ($80K) gives a ~$2,023 payment and ~$408K total interest - saving $253/month and $51K in interest.",
        },
        {
          question: "How long will it take to save for a down payment?",
          answer: "The time depends on your home price target, desired down payment percentage, current savings, and monthly saving amount. For a $400,000 home with 20% down ($80,000): if you have $20,000 saved and save $1,500/month, it will take about 40 months (3.3 years). Use the calculator's savings timeline chart to visualize your progress.",
        },
        {
          question: "What is LTV and why does it matter?",
          answer: "LTV (Loan-to-Value) is your loan amount divided by the home price, expressed as a percentage. An 80% LTV means you have 20% equity. LTV below 80% qualifies you for better interest rates and eliminates PMI. Higher LTV loans (above 80%) are considered riskier and typically have higher rates and require mortgage insurance.",
        },
        {
          question: "Should I put 20% down or a lower amount?",
          answer: "Putting 20% down is ideal if you can afford it - you avoid PMI, get better rates, and have lower monthly payments. However, if saving 20% would take many years, a lower down payment (5-10%) may be better so you can start building equity sooner. The 'rent vs buy' math often favors buying earlier with a smaller down payment, especially in markets with rising home prices.",
        },
        {
          question: "What are the minimum down payment requirements for different loan types?",
          answer: "Conventional loans: 3-5% minimum (depends on lender). FHA loans: 3.5% minimum (requires MIP for life of loan). VA loans: 0% for qualifying veterans. USDA loans: 0% in eligible rural areas. Jumbo loans: typically 10-20%. Each loan type has different requirements and costs - consult with a mortgage professional to find the best option for your situation.",
        },
        {
          question: "Can I use gift money for my down payment?",
          answer: "Yes, many loan programs allow gift funds from family members for part or all of your down payment. FHA loans allow 100% of the down payment as a gift. Conventional loans typically require 5% of your own funds but allow gifts for the remainder. You will need a gift letter documenting that the money is not a loan. Check with your lender for specific requirements.",
        },
        {
          question: "What other costs should I plan for besides the down payment?",
          answer: "Beyond the down payment, plan for closing costs (2-5% of home price), moving expenses, home inspection, appraisal fees, and an emergency fund for unexpected repairs. A common guideline is to have at least 25-30% of the home price in cash: 20% for down payment and 5-10% for closing costs and reserves.",
        },
        {
          question: "How does my down payment affect my interest rate?",
          answer: "Larger down payments typically qualify for lower interest rates because the lender faces less risk. Borrowers with 20%+ down often get rate discounts of 0.25-0.5% compared to those with minimal down payments. Combined with the lower loan amount, this can save tens of thousands over the life of the loan.",
        },
      ]}
      explanationContent={
        <div className="prose prose-slate max-w-none">
          <h2>What is a Down Payment Calculator?</h2>
          <p>
            A <strong>down payment calculator</strong> helps you determine how much money you need to put down when buying a home, how different down payment amounts affect your loan structure, and how long it will take to save for your goal. It is an essential first step in the home-buying journey, helping you create a realistic savings plan and understand the trade-offs between different down payment strategies.
          </p>

          <h3>Key Calculations</h3>
          <p>The calculator computes several related metrics from your inputs:</p>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
            Down Payment = Home Price × (Down Payment % / 100)
            Loan Amount = Home Price − Down Payment
            LTV = (Loan Amount / Home Price) × 100
            Savings Gap = Down Payment − Current Savings
            Months to Save = Savings Gap / Monthly Savings (if above 0)
          </pre>

          <h3>Benefits of a Larger Down Payment</h3>
          <ul>
            <li><strong>No PMI:</strong> With 20% down or more, you avoid Private Mortgage Insurance, saving $100-300/month.</li>
            <li><strong>Lower Monthly Payment:</strong> A smaller loan means a smaller monthly payment, freeing up cash for other expenses.</li>
            <li><strong>Less Total Interest:</strong> Borrowing less means paying less interest over the life of the loan - potentially saving $50,000-100,000+.</li>
            <li><strong>Better Interest Rates:</strong> Lenders offer their best rates to borrowers with lower LTV ratios and more equity.</li>
            <li><strong>Instant Equity:</strong> A 20% down payment gives you 20% equity from day one, providing a buffer against market fluctuations.</li>
          </ul>

          <h3>When a Smaller Down Payment Makes Sense</h3>
          <ul>
            <li><strong>Rising home prices:</strong> If home prices are increasing faster than you can save, buying with a smaller down payment may be better than waiting.</li>
            <li><strong>High rent costs:</strong> If your rent is similar to or higher than a mortgage payment, buying earlier with a smaller down payment builds equity instead of paying a landlord.</li>
            <li><strong>Low interest rate environment:</strong> When rates are low, the cost of borrowing is cheaper, making a smaller down payment more affordable.</li>
            <li><strong>Strong job security and income growth:</strong> If you expect your income to grow, you can refinance later to remove PMI and get better terms.</li>
          </ul>

          <h3>Example Calculation</h3>
          <p><strong>Scenario:</strong> You want to buy a $400,000 home with a 20% down payment. You have $40,000 saved and can save $1,500 per month.</p>
          <ul>
            <li><strong>Home Price:</strong> $400,000</li>
            <li><strong>Target Down Payment (20%):</strong> $80,000</li>
            <li><strong>Current Savings:</strong> $40,000</li>
            <li><strong>Savings Gap:</strong> $40,000</li>
            <li><strong>Monthly Savings:</strong> $1,500</li>
            <li><strong>Time to Save:</strong> ~27 months (2.3 years)</li>
          </ul>
          <p>If you reduced your target to 10% down ($40,000), you could buy immediately with your current savings - but you would need to pay PMI and have a higher monthly payment. Use the calculator to experiment with different scenarios.</p>

          <h3>Common Mistakes to Avoid</h3>
          <ul>
            <li><strong>Emptying your emergency fund:</strong> Never use all your savings for a down payment. Keep 3-6 months of expenses in an emergency fund after the purchase.</li>
            <li><strong>Ignoring closing costs:</strong> Closing costs add 2-5% to your upfront cash needs. Don't forget to budget for these when setting your savings target.</li>
            <li><strong>Not checking loan programs:</strong> FHA, VA, USDA, and conventional loans all have different down payment requirements. Check all options before deciding how much to save.</li>
            <li><strong>Waiting for the perfect 20%:</strong> If it takes 10 years to save 20%, you may be better off buying with a lower down payment and building equity sooner.</li>
            <li><strong>Forgetting about moving costs:</strong> Moving expenses, new furniture, and immediate repairs can add $5,000-15,000 to your first-year homeownership costs.</li>
          </ul>

          <h3>Tips for Saving for a Down Payment</h3>
          <ul>
            <li><strong>Open a dedicated savings account:</strong> Keep your down payment savings separate from your regular accounts to avoid spending it and to track your progress clearly.</li>
            <li><strong>Automate your savings:</strong> Set up automatic transfers from your paycheck or checking account on payday. You cannot spend what you do not see.</li>
            <li><strong>Reduce housing costs temporarily:</strong> Consider moving to a cheaper apartment, getting a roommate, or living with family temporarily to accelerate your down payment savings.</li>
            <li><strong>Increase income strategically:</strong> A side hustle, freelance work, or overtime can dramatically shorten your savings timeline. Even $500 extra per month saves years.</li>
            <li><strong>Use tax-advantaged accounts:</strong> In some countries, first-time home buyer accounts offer tax benefits. In the US, you can withdraw up to $10,000 from a Roth IRA for a first home purchase without penalty.</li>
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
              <label htmlFor="dp-currency" className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <Banknote className="w-4 h-4 text-primary" />
                Currency
              </label>
              <select id="dp-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>

            {/* Home Price */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Home className="w-4 h-4 text-primary" />
                <span>Home Price</span>
                <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(homePrice, currency)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={homePriceDisplay}
                  onChange={(e) => handleHomePriceChange(e.target.value)}
                  onFocus={handleHomePriceFocus}
                  onBlur={handleHomePriceBlur}
                  className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="Enter amount"
                />
              </div>
              <input id="dp-price" type="range" min={MIN_PRICE} max={MAX_PRICE} step={5000} value={homePrice}
                onChange={(e) => setHomePrice(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_PRICE} aria-valuemax={MAX_PRICE} aria-valuenow={homePrice} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(MIN_PRICE, currency)}</span>
                <span>{formatCurrency(MAX_PRICE, currency)}</span>
              </div>
            </div>

            {/* Down Payment % */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Percent className="w-4 h-4 text-primary" />
                <span>Target Down Payment</span>
                <span className="ml-auto text-lg font-bold text-primary">{dp}% ({formatCurrency(downPayment, currency)})</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={downPctDisplay}
                    onChange={(e) => handleDownPctChange(e.target.value)}
                    onFocus={handleDownPctFocus}
                    onBlur={handleDownPctBlur}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="Enter percentage"
                  />
                </div>
                <span className="text-muted-foreground font-medium text-sm">%</span>
              </div>
              <input id="dp-pct" type="range" min={MIN_DOWN_PCT} max={MAX_DOWN_PCT} step={1} value={downPct}
                onChange={(e) => setDownPct(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_DOWN_PCT} aria-valuemax={MAX_DOWN_PCT} aria-valuenow={downPct} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MIN_DOWN_PCT}%</span>
                <span>{MAX_DOWN_PCT}%</span>
              </div>
              {dp >= 20 ? (
                <p className="text-xs text-emerald-500">✓ 20%+ down - no PMI required</p>
              ) : (
                <p className="text-xs text-amber-500">Below 20% - PMI will be required</p>
              )}
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
                <input
                  type="text"
                  inputMode="decimal"
                  value={currentSavingsDisplay}
                  onChange={(e) => handleCurrentSavingsChange(e.target.value)}
                  onFocus={handleCurrentSavingsFocus}
                  onBlur={handleCurrentSavingsBlur}
                  className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="Enter amount"
                />
              </div>
              <input id="dp-saved" type="range" min={MIN_SAVED} max={MAX_SAVED} step={1000} value={currentSavings}
                onChange={(e) => setCurrentSavings(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_SAVED} aria-valuemax={MAX_SAVED} aria-valuenow={currentSavings} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(MIN_SAVED, currency)}</span>
                <span>{formatCurrency(MAX_SAVED, currency)}</span>
              </div>
            </div>

            {/* Monthly Savings */}
            <div className="bg-emerald-50/50 border border-emerald-200/50 rounded-xl p-4 space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Monthly Savings</span>
                <span className="ml-auto text-lg font-bold text-emerald-500">{formatCurrency(monthlySaving, currency)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={monthlySavingDisplay}
                  onChange={(e) => handleMonthlySavingChange(e.target.value)}
                  onFocus={handleMonthlySavingFocus}
                  onBlur={handleMonthlySavingBlur}
                  className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="Enter amount"
                />
              </div>
              <input id="dp-saving" type="range" min={MIN_SAVING} max={MAX_SAVING} step={100} value={monthlySaving}
                onChange={(e) => setMonthlySaving(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_SAVING} aria-valuemax={MAX_SAVING} aria-valuenow={monthlySaving} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(MIN_SAVING, currency)}</span>
                <span>{formatCurrency(MAX_SAVING, currency)}</span>
              </div>
              {monthlySaving > 0 && monthsToSave !== null && (
                <p className="text-xs text-emerald-600 mt-2">
                  {monthsToSave === 0
                    ? "✓ You already have enough saved!"
                    : `Time to reach target: ~${monthsToSave} ${monthsToSave === 1 ? "month" : "months"} (${Math.ceil(monthsToSave / 12)} yr ${monthsToSave % 12 > 0 ? `${monthsToSave % 12} mo` : ""})`}
                </p>
              )}
            </div>
          </div>

          {/* Results Cards */}
          <div className="space-y-4">
            {/* Down Payment Hero Card */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground font-medium">Required Down Payment</p>
              </div>
              <p className="text-4xl font-extrabold text-primary break-words">{formatCurrency(downPayment, currency)}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span>{dp}% of home price</span>
                <span className="mx-1">·</span>
                <span>LTV: {ltv.toFixed(0)}%</span>
                <span className="mx-1">·</span>
                <span className={avoidsPMI ? "text-emerald-500" : "text-amber-500"}>{avoidsPMI ? "No PMI" : "PMI needed"}</span>
              </div>
            </div>

            {/* Loan + 20% Target */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1">Loan Amount</p>
                <p className="text-base font-bold break-words">{formatCurrency(loanAmount, currency)}</p>
              </div>
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1">20% Down Target</p>
                <p className="text-base font-bold break-words">{formatCurrency(neededFor20, currency)}</p>
                {dp < 20 && (
                  <p className="text-xs text-amber-500 mt-0.5">
                    Need {formatCurrency(neededFor20 - downPayment, currency)} more for 20%
                  </p>
                )}
              </div>
            </div>

            {/* Savings Progress */}
            <div className="bg-white border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Savings Progress</p>
                <p className="text-sm font-bold text-primary">
                  {currentSavings >= downPayment ? "Goal Reached!" : `${Math.round((currentSavings / downPayment) * 100)}%`}
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${currentSavings >= downPayment ? "bg-emerald-500" : "bg-primary"}`}
                  style={{ width: `${Math.min(100, (currentSavings / downPayment) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatCurrency(currentSavings, currency)} saved</span>
                <span>{formatCurrency(downPayment, currency)} target</span>
              </div>
              {savingsGap > 0 && (
                <p className="text-xs text-amber-500 mt-1">Gap: {formatCurrency(savingsGap, currency)}</p>
              )}
            </div>

            {/* Price Composition Bar */}
            {chartData.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-2 text-center">Price Composition</p>
                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
                      <XAxis type="number" tickFormatter={(v: number) => formatCompact(v, currency)} fontSize={10} />
                      <YAxis type="category" dataKey="name" fontSize={11} width={90} />
                      <Tooltip content={<ChartTooltip currency={currency} />} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={1000}>
                        {chartData.map((entry, idx) => (
                          <rect key={idx} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Savings Timeline */}
            {timelineData.length > 1 && (
              <div className="bg-white border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-2 text-center flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  Savings Timeline
                </p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="month" fontSize={10} tickMargin={4} interval="preserveStartEnd" />
                      <YAxis tickFormatter={(v: number) => formatCompact(v, currency)} fontSize={10} width={50} />
                      <Tooltip content={<ChartTooltip currency={currency} />} />
                      <Area type="monotone" dataKey="Target" stroke="#f59e0b" strokeWidth={1.5}
                        strokeDasharray="6 3" fill="none" dot={false} />
                      <Area type="monotone" dataKey="Savings" stroke="#10b981" strokeWidth={2}
                        fill="url(#savingsGrad)" dot={false} animationDuration={1200} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 text-xs mt-1">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-[#10b981]" />
                    <span className="text-muted-foreground">Your Savings</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 border-t border-dashed border-[#f59e0b]" />
                    <span className="text-muted-foreground">Target</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
