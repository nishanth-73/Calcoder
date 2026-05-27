"use client";

import { useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import {
  Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip,
} from "recharts";
import {
  DollarSign, Flame, TrendingUp, TrendingDown,
  Wallet, BarChart3, CheckCircle2, Target,
} from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { cn } from "@/lib/utils";

type CurrencyCode =
  | "USD" | "INR" | "EUR" | "GBP" | "AED" | "CAD"
  | "AUD" | "JPY" | "SGD" | "SAR" | "CHF";

interface CurrencyConfig {
  code: CurrencyCode;
  label: string;
  symbol: string;
  locale: string;
}

const CURRENCIES: CurrencyConfig[] = [
  { code: "USD", label: "US Dollar", symbol: "$", locale: "en-US" },
  { code: "INR", label: "Indian Rupee", symbol: "\u20b9", locale: "en-IN" },
  { code: "EUR", label: "Euro", symbol: "\u20ac", locale: "de-DE" },
  { code: "GBP", label: "British Pound", symbol: "\u00a3", locale: "en-GB" },
  { code: "AED", label: "UAE Dirham", symbol: "\u062f.\u0625", locale: "ar-AE" },
  { code: "CAD", label: "Canadian Dollar", symbol: "CA$", locale: "en-CA" },
  { code: "AUD", label: "Australian Dollar", symbol: "AU$", locale: "en-AU" },
  { code: "JPY", label: "Japanese Yen", symbol: "\u00a5", locale: "ja-JP" },
  { code: "SGD", label: "Singapore Dollar", symbol: "S$", locale: "en-SG" },
  { code: "SAR", label: "Saudi Riyal", symbol: "\ufdfc", locale: "ar-SA" },
  { code: "CHF", label: "Swiss Franc", symbol: "Fr.", locale: "de-CH" },
];

const NO_DECIMAL = new Set<CurrencyCode>(["JPY"]);

function getCurrency(code: CurrencyCode): CurrencyConfig {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

function formatCurrency(value: number, code: CurrencyCode): string {
  const cfg = getCurrency(code);
  if (!Number.isFinite(value)) return `${cfg.symbol}0`;
  const noDec = NO_DECIMAL.has(code);
  try {
    return new Intl.NumberFormat(cfg.locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: noDec ? 0 : 2,
      maximumFractionDigits: noDec ? 0 : 2,
    }).format(value);
  } catch {
    return `${cfg.symbol}${value.toLocaleString(cfg.locale, {
      minimumFractionDigits: noDec ? 0 : 2,
      maximumFractionDigits: noDec ? 0 : 2,
    })}`;
  }
}

function formatCompact(n: number): string {
  if (!Number.isFinite(n) || isNaN(n)) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(abs / 1e3).toFixed(1)}K`;
  return abs.toFixed(0);
}

function formatRunway(months: number): string {
  if (!Number.isFinite(months) || months < 0) return "Infinite";
  if (months >= 120) return "10+ years";
  if (months >= 12)
    return `${(months / 12).toFixed(1)} years (${Math.floor(months)} months)`;
  return `${Math.round(months)} months`;
}

function formatRatio(n: number): string {
  if (!Number.isFinite(n) || isNaN(n)) return "N/A";
  return `${n.toFixed(2)}x`;
}

// â"€â"€ Local SliderField â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

interface NumericField {
  value: number;
  displayValue: string;
  setValue: (val: number) => void;
  handleChange: (raw: string) => void;
  handleFocus: () => void;
  handleBlur: () => void;
}

function SliderField({
  label,
  icon: Icon,
  value,
  symbol,
  min,
  max,
  step,
  currencyCode,
  formatValue,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: NumericField;
  symbol: string;
  min: number;
  max: number;
  step: number;
  currencyCode?: CurrencyCode;
  formatValue?: (n: number) => string;
}) {
  const display = formatValue
    ? formatValue(value.value)
    : currencyCode
      ? formatCurrency(value.value, currencyCode)
      : String(value.value);
  const hasPrefix = Boolean(symbol);

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm font-medium">
        <Icon className="w-4 h-4 text-primary" />
        <span>{label}</span>
        <span className="ml-auto text-lg font-bold text-primary truncate max-w-[50%]">
          {display}
        </span>
      </label>
      <div className="relative">
        {hasPrefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none select-none">
            {symbol}
          </span>
        )}
        <input
          type="text"
          inputMode="decimal"
          value={value.displayValue}
          onChange={(e) => value.handleChange(e.target.value)}
          onFocus={value.handleFocus}
          onBlur={value.handleBlur}
          className={cn(
            "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors",
            hasPrefix && "pl-8",
          )}
          placeholder="Enter value"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value.value}
        onChange={(e) => value.setValue(parseFloat(e.target.value))}
        className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{symbol}{min.toLocaleString()}</span>
        <span>{symbol}{max.toLocaleString()}</span>
      </div>
    </div>
  );
}

// â"€â"€ Local MetricCard â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function MetricCard({
  icon: Icon,
  label,
  value,
  color = "text-blue-500",
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  color?: string;
  iconColor?: string;
}) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
        <Icon className={cn("w-3.5 h-3.5", iconColor ?? color)} />
        {label}
      </p>
      <p className={cn("text-lg font-bold break-words", color)}>{value}</p>
    </div>
  );
}

// â"€â"€ Constants â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const CHART_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#f43f5e"];

const RELATED_TOOLS = [
  {
    name: "MRR Calculator",
    href: "/marketing/mrr-calculator",
    desc: "Calculate Monthly Recurring Revenue for subscription businesses.",
  },
  {
    name: "ARR Calculator",
    href: "/marketing/arr-calculator",
    desc: "Calculate Annual Recurring Revenue for SaaS businesses.",
  },
  {
    name: "LTV Calculator",
    href: "/marketing/ltv-calculator",
    desc: "Calculate Customer Lifetime Value for your business.",
  },
  {
    name: "Churn Rate Calculator",
    href: "/marketing/churn-rate-calculator",
    desc: "Calculate customer churn rate and retention metrics.",
  },
  {
    name: "CAC Payback Calculator",
    href: "/marketing/cac-calculator",
    desc: "Calculate customer acquisition cost payback period.",
  },
  {
    name: "ROAS Calculator",
    href: "/marketing/roas-calculator",
    desc: "Calculate return on ad spend for marketing campaigns.",
  },
  {
    name: "ROI Calculator",
    href: "/marketing/roi-calculator",
    desc: "Calculate return on investment for business decisions.",
  },
  {
    name: "Profit Margin Calculator",
    href: "/marketing/profit-margin-calculator",
    desc: "Calculate profit margins and markup percentages.",
  },
];

const FAQ_DATA: { question: string; answer: string }[] = [
  {
    question: "What is burn rate?",
    answer:
      "Burn rate is the rate at which a company spends its cash reserves, typically measured per month. Gross burn rate is total monthly expenses, while net burn rate subtracts monthly revenue. These metrics are critical for startups to understand their financial health, plan fundraising, and determine how long they can operate before needing additional capital.",
  },
  {
    question: "How is burn rate calculated?",
    answer:
      "Gross Burn Rate = Total Monthly Expenses. Net Burn Rate = Monthly Expenses \u2212 Monthly Revenue. Runway (months) = Total Cash on Hand \u00f7 Net Burn Rate. If your net burn rate is zero or negative (profitable), your runway is infinite because your revenue covers or exceeds expenses. Most investors track net burn more closely since it reflects the company's true cash consumption.",
  },
  {
    question: "What is a good runway for a startup?",
    answer:
      "Most VCs recommend having 12\u201318 months of runway at all times. This gives enough time to hit key milestones, iterate on product-market fit, and raise the next funding round. If runway drops below 6 months, it\u2019s considered critical and requires immediate cost-cutting or revenue acceleration. Seed-stage startups should aim for 18\u201324 months to account for longer fundraising cycles.",
  },
  {
    question: "How can I extend my runway?",
    answer:
      "You can extend runway by: 1) Reducing operating expenses \u2014 headcount, software subscriptions, office space, and non-essential vendor contracts. 2) Increasing revenue through pricing optimization, upselling, or expanding sales channels. 3) Raising additional funding from investors, grants, or debt facilities. 4) Pivoting to a less capital-intensive business model. 5) Negotiating better payment terms with vendors and delaying large capital expenditures.",
  },
  {
    question: "What is the difference between gross burn and net burn?",
    answer:
      "Gross burn is your total monthly operating expenses \u2014 the raw cash leaving your bank account each month before any revenue. Net burn is gross burn minus monthly revenue, representing the actual cash deficit. For example, if you spend $100K/month but earn $30K/month, your gross burn is $100K and your net burn is $70K. Net burn is the more important metric because it reflects your true cash consumption rate.",
  },
  {
    question: "What is the difference between burn rate and cash runway?",
    answer:
      "Burn rate measures how fast you spend cash (e.g., $50K/month). Cash runway measures how long your cash will last at the current burn rate (e.g., 12 months). Runway = Cash on Hand \u00f7 Net Burn Rate. Burn rate is the speed; runway is the distance. Both are essential for financial planning, but runway gives a more actionable timeline for when you need to raise funds or reach profitability.",
  },
  {
    question: "How do VCs evaluate burn rate?",
    answer:
      "VCs evaluate burn rate efficiency through metrics like the \u2018Rule of 40\u2019 (growth rate + profit margin \u2265 40%) and burn multiple (net burn \u00f7 net new ARR). A burn multiple below 1x is excellent, 1\u20132x is acceptable, and above 3x is dangerous. VCs also look at whether burn is going toward growth (sales & marketing, R&D) versus operational inefficiency. High burn without proportional growth is a red flag.",
  },
  {
    question: "What burn rate is healthy for a startup at different stages?",
    answer:
      "Pre-seed / Seed: $20K\u2013$50K/month with 12\u201318 months runway. Series A: $50K\u2013$150K/month with 18\u201324 months runway. Series B: $150K\u2013$500K/month with 18\u201324 months runway. Series C+: $500K\u2013$2M+/month with 18\u201324 months runway. Profitable / Bootstrapped: $5K\u2013$30K/month with 6\u201312 months runway. These ranges vary by industry, location, and business model.",
  },
  {
    question: "How does burn rate affect fundraising?",
    answer:
      "A high burn rate relative to growth makes fundraising difficult because investors worry about capital efficiency. Startups with 12+ months of runway can negotiate better terms and valuations since they aren\u2019t desperate. Those with under 6 months of runway often face down-rounds or bridge notes on unfavorable terms. Keeping burn rate efficient signals discipline and extends your negotiation leverage with investors.",
  },
  {
    question: "When should you worry about your burn rate?",
    answer:
      "You should worry when: 1) Runway drops below 6 months and you haven\u2019t started fundraising, 2) Burn rate is growing faster than revenue month-over-month, 3) Your burn multiple exceeds 3x (net burn \u00f7 net new ARR), 4) You\u2019re burning cash on non-essential items while core product milestones slip, or 5) Unit economics are worsening despite higher spending. A rising burn rate combined with flat or declining growth is a major warning sign.",
  },
];

const EXPLANATION_CONTENT = (
  <div className="space-y-8">
    <div>
      <h2 className="text-xl font-bold mb-3">What is a Burn Rate Calculator?</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        A Burn Rate Calculator helps startups and businesses understand their monthly cash
        consumption and how long their current cash reserves will last. By entering your cash
        on hand, monthly revenue, and monthly expenses, you get instant calculations of gross
        burn rate, net burn rate, and cash runway. This tool is essential for financial
        planning, fundraising decisions, budgeting, and avoiding cash crises. Founders,
        CFOs, and investors use burn rate analysis to evaluate startup health and determine
        when the next funding round is needed.
      </p>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-2">Formula Used</h3>
      <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
        <p>Gross Burn Rate = Total Monthly Expenses</p>
        <p>Net Burn Rate = Monthly Expenses \u2212 Monthly Revenue</p>
        <p>Runway (months) = Cash on Hand \u00f7 Net Burn Rate</p>
        <p className="font-semibold">If Net Burn Rate \u2264 0, Runway is Infinite</p>
        <p>Revenue-to-Expense Ratio = Revenue \u00f7 Expenses</p>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-2">Key Metrics Explained</h3>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <div>
          <span className="font-medium text-foreground">Gross Burn Rate: </span>
          Total monthly operating expenses. This is the raw cash outflow before any revenue
          is considered. It includes salaries, rent, software, marketing, and all other
          operating costs.
        </div>
        <div>
          <span className="font-medium text-foreground">Net Burn Rate: </span>
          Gross burn minus monthly revenue. This represents the actual cash deficit each
          month. A negative net burn means the company is profitable and generating more
          cash than it spends.
        </div>
        <div>
          <span className="font-medium text-foreground">Runway: </span>
          The number of months your current cash on hand will last at the current net burn
          rate. This is the most critical metric for determining fundraising timing.
        </div>
        <div>
          <span className="font-medium text-foreground">Runway Zero Date: </span>
          The estimated date when your cash reserves will be depleted if you continue
          spending at the current net burn rate. Most companies aim to raise their next
          round at least 6 months before this date.
        </div>
        <div>
          <span className="font-medium text-foreground">Revenue-to-Expense Ratio: </span>
          A measure of how much revenue you generate per dollar of expense. A ratio above
          1.0 means you are profitable; below 1.0 means you are spending more than you
          earn. Improving this ratio is a key path to profitability.
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
      <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground mb-2">
          Scenario: An early-stage startup with:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Cash on Hand: $500,000</li>
          <li>Monthly Revenue: $50,000</li>
          <li>Monthly Expenses: $100,000</li>
          <li>Gross Burn Rate = <strong>$100,000 / month</strong></li>
          <li>Net Burn Rate = $100,000 \u2212 $50,000 = <strong>$50,000 / month</strong></li>
          <li>Runway = $500,000 \u00f7 $50,000 = <strong>10 months</strong></li>
          <li>Revenue-to-Expense Ratio = $50,000 \u00f7 $100,000 = <strong>0.50x</strong></li>
          <li>Runway Zero Date = <strong>10 months from today</strong></li>
        </ul>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-2">
        Burn Rate Benchmarks by Startup Stage
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="p-2.5 border border-border text-left font-medium">
                Stage
              </th>
              <th className="p-2.5 border border-border text-left font-medium">
                Monthly Burn
              </th>
              <th className="p-2.5 border border-border text-left font-medium">
                Ideal Runway
              </th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr>
              <td className="p-2.5 border border-border">Pre-Seed / Seed</td>
              <td className="p-2.5 border border-border">$20K \u2013 $50K</td>
              <td className="p-2.5 border border-border">12 \u2013 18 months</td>
            </tr>
            <tr>
              <td className="p-2.5 border border-border">Series A</td>
              <td className="p-2.5 border border-border">$50K \u2013 $150K</td>
              <td className="p-2.5 border border-border">18 \u2013 24 months</td>
            </tr>
            <tr>
              <td className="p-2.5 border border-border">Series B</td>
              <td className="p-2.5 border border-border">$150K \u2013 $500K</td>
              <td className="p-2.5 border border-border">18 \u2013 24 months</td>
            </tr>
            <tr>
              <td className="p-2.5 border border-border">Series C+</td>
              <td className="p-2.5 border border-border">$500K \u2013 $2M+</td>
              <td className="p-2.5 border border-border">18 \u2013 24 months</td>
            </tr>
            <tr>
              <td className="p-2.5 border border-border">
                Profitable / Bootstrapped
              </td>
              <td className="p-2.5 border border-border">$5K \u2013 $30K</td>
              <td className="p-2.5 border border-border">6 \u2013 12 months</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Benchmarks vary by industry, geography, and business model. Use these as general
        guidelines, not strict targets.
      </p>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-2">Tips to Manage Burn Rate</h3>
      <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
        <li>
          <strong className="text-foreground">Hire intentionally: </strong>
          Each new hire should have a clear ROI. Headcount is usually the largest expense
          for startups, so be deliberate about when and who you hire.
        </li>
        <li>
          <strong className="text-foreground">Negotiate vendor contracts: </strong>
          Ask for startup discounts, annual payment discounts, or usage-based pricing from
          software vendors. Many offer 20\u201350% off for early-stage companies.
        </li>
        <li>
          <strong className="text-foreground">Monitor unit economics: </strong>
          Ensure your customer acquisition cost (CAC) is recovering within 12 months and
          your LTV-to-CAC ratio is above 3x. Poor unit economics amplify burn rate.
        </li>
        <li>
          <strong className="text-foreground">Extend payment terms: </strong>
          Negotiate net-60 or net-90 payment terms with vendors while collecting payments
          from customers upfront or on net-15. This improves working capital without
          reducing expenses.
        </li>
        <li>
          <strong className="text-foreground">Raise before you need it: </strong>
          Start fundraising when you have 9\u201312 months of runway remaining. Raising
          capital when you are desperate leads to unfavorable terms and dilution.
        </li>
        <li>
          <strong className="text-foreground">Focus on revenue growth: </strong>
          The best way to reduce net burn is to increase revenue. Invest in sales and
          marketing channels with the best ROI rather than cutting costs across the board.
        </li>
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-2">
        Common Mistakes Founders Make
      </h3>
      <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
        <li>
          <strong className="text-foreground">Focusing only on gross burn: </strong>
          Gross burn ignores revenue entirely. A company with $1M gross burn and $900K
          revenue is in much better shape than one with $500K gross burn and zero revenue.
          Always track net burn.
        </li>
        <li>
          <strong className="text-foreground">Ignoring burn rate until it&apos;s too late: </strong>
          Many founders don&apos;t calculate runway until they have under 3 months of cash
          left. By then, fundraising options are limited and expensive. Check burn rate
          monthly.
        </li>
        <li>
          <strong className="text-foreground">Over-hiring before product-market fit: </strong>
          Hiring a large team before proving product-market fit dramatically increases burn
          rate without proportional growth. Stay lean until you have repeatable revenue.
        </li>
        <li>
          <strong className="text-foreground">Confusing profit with cash flow: </strong>
          A company can be profitable on paper but still run out of cash due to timing
          mismatches (e.g., annual contracts paid upfront). Burn rate measures actual cash
          movements, not accrual accounting.
        </li>
        <li>
          <strong className="text-foreground">Not stress-testing scenarios: </strong>
          Founders should model best-case, base-case, and worst-case burn scenarios. What
          happens if revenue drops by 30%? What if a key customer churns? Stress-testing
          helps build resilience and contingency plans.
        </li>
      </ul>
    </div>
  </div>
);

// â"€â"€ Page Component â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

export default function BurnRateCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const cashOnHand = useNumericField(500000);
  const revenue = useNumericField(50000);
  const expenses = useNumericField(100000);

  const results = useMemo(() => {
    const cash = cashOnHand.value;
    const rev = revenue.value;
    const exp = expenses.value;
    const netBurn = exp - rev;
    const grossBurn = exp;
    const runway = netBurn > 0 ? cash / netBurn : Infinity;
    const isProfitable = rev >= exp;
    const revToExpRatio = exp > 0 ? rev / exp : 0;
    return {
      cashOnHand: cash,
      revenue: rev,
      expenses: exp,
      netBurn,
      grossBurn,
      runway,
      isProfitable,
      revToExpRatio,
    };
  }, [cashOnHand.value, revenue.value, expenses.value]);

  const cfg = getCurrency(currency);

  const chartData = useMemo(
    () => [
      { name: "Cash on Hand", value: Math.max(0, results.cashOnHand) },
      { name: "Monthly Revenue", value: Math.max(0, results.revenue) },
      { name: "Monthly Expenses", value: Math.max(0, results.expenses) },
      { name: "Net Burn", value: Math.max(0, results.netBurn) },
    ],
    [results],
  );

  return (
    <ToolLayout
      title="Burn Rate Calculator"
      description="Calculate startup monthly burn rate and runway \u2014 understand how long your cash will last based on revenue and expenses."
      category="marketing"
      faqContent={FAQ_DATA}
      explanationContent={EXPLANATION_CONTENT}
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* â"€â"€ Inputs â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-muted-foreground">
              Currency:
            </span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="text-sm border border-border rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} \u2014 {c.code}
                </option>
              ))}
            </select>
          </div>

          <SliderField
            label="Total Cash on Hand"
            icon={Wallet}
            value={cashOnHand}
            symbol={cfg.symbol}
            min={1000}
            max={100000000}
            step={1000}
            currencyCode={currency}
          />

          <SliderField
            label="Monthly Revenue"
            icon={TrendingUp}
            value={revenue}
            symbol={cfg.symbol}
            min={0}
            max={10000000}
            step={100}
            currencyCode={currency}
          />

          <SliderField
            label="Monthly Expenses"
            icon={TrendingDown}
            value={expenses}
            symbol={cfg.symbol}
            min={100}
            max={10000000}
            step={100}
            currencyCode={currency}
          />
        </div>

        {/* â"€â"€ Results â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
        <div className="space-y-4">
          {/* Hero metric */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-primary/10 border border-emerald-200/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              {results.isProfitable ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <Flame className="w-5 h-5 text-red-500" />
              )}
              <p className="text-sm text-muted-foreground font-medium">
                {results.isProfitable ? "Profitable" : "Net Burn Rate"}
              </p>
            </div>
            <p
              className={cn(
                "text-4xl font-extrabold break-words",
                results.isProfitable ? "text-emerald-500" : "text-red-500",
              )}
            >
              {results.isProfitable
                ? "Profit"
                : formatCurrency(results.netBurn, currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {results.isProfitable
                ? "Your revenue covers all expenses"
                : "per month net cash consumption"}
            </p>
          </div>

          {/* Metric cards grid */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon={Wallet}
              label="Cash on Hand"
              value={formatCurrency(results.cashOnHand, currency)}
              color="text-blue-500"
            />
            <MetricCard
              icon={DollarSign}
              label="Gross Burn Rate"
              value={formatCurrency(results.grossBurn, currency)}
              color="text-amber-500"
            />
            <MetricCard
              icon={TrendingUp}
              label="Revenue / Expense Ratio"
              value={formatRatio(results.revToExpRatio)}
              color={results.revToExpRatio >= 1 ? "text-emerald-500" : "text-red-500"}
              iconColor="text-emerald-500"
            />
            <MetricCard
              icon={Flame}
              label="Net Burn Rate"
              value={results.netBurn <= 0 ? "Profit" : formatCurrency(results.netBurn, currency)}
              color={results.netBurn > 0 ? "text-red-500" : "text-emerald-500"}
              iconColor={results.netBurn > 0 ? "text-red-500" : "text-emerald-500"}
            />
          </div>

          {/* Runway analysis */}
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <Target className="w-3 h-3" />
              Runway Analysis
            </p>
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground mb-1">
                Estimated Runway
              </p>
              <p
                className={cn(
                  "text-3xl font-bold",
                  results.isProfitable
                    ? "text-emerald-500"
                    : results.runway < 6
                      ? "text-red-500"
                      : results.runway < 12
                        ? "text-amber-500"
                        : "text-emerald-500",
                )}
              >
                {formatRunway(results.runway)}
              </p>
              {Number.isFinite(results.runway) && results.runway >= 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Estimated zero date:{" "}
                  {new Date(
                    Date.now() + results.runway * 30.44 * 86400000,
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Burn rate breakdown */}
          <div className="bg-white border border-border rounded-xl p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              Burn Rate Breakdown
            </p>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-32 h-32 flex-shrink-0 mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38} outerRadius={62}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {chartData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(val: any) => formatCompact(Number(val) || 0)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5 text-sm">
                {chartData.map((item, i) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: CHART_COLORS[i] }}
                      />
                      {item.name}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(item.value, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 text-sm border-t border-border/50 pt-3">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Cash on Hand</span>
                <span className="font-medium">
                  {formatCurrency(results.cashOnHand, currency)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Monthly Revenue</span>
                <span className="font-medium text-emerald-500">
                  +{formatCurrency(results.revenue, currency)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Monthly Expenses</span>
                <span className="font-medium text-red-500">
                  -{formatCurrency(results.expenses, currency)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Gross Burn Rate</span>
                <span className="font-medium">
                  {formatCurrency(results.grossBurn, currency)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Net Burn Rate</span>
                <span
                  className={cn(
                    "font-medium",
                    results.netBurn > 0 ? "text-red-500" : "text-emerald-500",
                  )}
                >
                  {results.netBurn <= 0
                    ? formatCurrency(0, currency)
                    : formatCurrency(results.netBurn, currency)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">
                  Revenue / Expense Ratio
                </span>
                <span
                  className={cn(
                    "font-medium",
                    results.revToExpRatio >= 1
                      ? "text-emerald-500"
                      : "text-red-500",
                  )}
                >
                  {formatRatio(results.revToExpRatio)}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-medium">Runway</span>
                <span
                  className={cn(
                    "font-bold",
                    results.isProfitable
                      ? "text-emerald-500"
                      : results.runway < 6
                        ? "text-red-500"
                        : results.runway < 12
                          ? "text-amber-500"
                          : "text-emerald-500",
                  )}
                >
                  {formatRunway(results.runway)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Gross Burn</p>
                <p className="text-sm font-semibold">{formatCurrency(results.grossBurn, currency)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Net Burn</p>
                <p className={`text-sm font-semibold ${results.netBurn > 0 ? "text-red-500" : "text-emerald-500"}`}>{results.netBurn <= 0 ? formatCurrency(0, currency) : formatCurrency(results.netBurn, currency)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Runway</p>
                <p className="text-sm font-semibold">{formatRunway(results.runway)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* â"€â"€ Related Calculators â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6">Related Calculators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {RELATED_TOOLS.map((tool) => (
            <a
              key={tool.name}
              href={tool.href}
              className="block bg-white border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-md transition-all group"
            >
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                {tool.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">{tool.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
}
