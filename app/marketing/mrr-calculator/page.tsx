"use client";

import { useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { cn } from "@/lib/utils";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Calculator, DollarSign, TrendingUp, Users, ArrowUp, ArrowDown, RefreshCw, BarChart3, AlertTriangle, CreditCard } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";

type CurrencyCode = "USD" | "INR" | "EUR" | "GBP" | "AED" | "CAD" | "AUD" | "JPY" | "SGD" | "SAR" | "CHF";

interface CurrencyConfig { code: CurrencyCode; label: string; symbol: string; locale: string; }

const CURRENCIES: CurrencyConfig[] = [
  { code: "USD", label: "US Dollar", symbol: "$", locale: "en-US" },
  { code: "INR", label: "Indian Rupee", symbol: "\u20b9", locale: "en-IN" },
  { code: "EUR", label: "Euro", symbol: "\u20ac", locale: "de-DE" },
  { code: "GBP", label: "British Pound", symbol: "\u00a3", locale: "en-GB" },
  { code: "AED", label: "UAE Dirham", symbol: "\u062f.\u0625", locale: "ar-AE" },
  { code: "CAD", label: "Canadian Dollar", symbol: "C$", locale: "en-CA" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$", locale: "en-AU" },
  { code: "JPY", label: "Japanese Yen", symbol: "\u00a5", locale: "ja-JP" },
  { code: "SGD", label: "Singapore Dollar", symbol: "S$", locale: "en-SG" },
  { code: "SAR", label: "Saudi Riyal", symbol: "\ufdfc", locale: "ar-SA" },
  { code: "CHF", label: "Swiss Franc", symbol: "Fr", locale: "de-CH" },
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
    return new Intl.NumberFormat(cfg.locale, { style: "currency", currency: code, minimumFractionDigits: noDec ? 0 : 2, maximumFractionDigits: noDec ? 0 : 2 }).format(value);
  } catch {
    return `${cfg.symbol}${value.toLocaleString(cfg.locale, { minimumFractionDigits: noDec ? 0 : 2, maximumFractionDigits: noDec ? 0 : 2 })}`;
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

const CHART_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#f43f5e"];

const RELATED_TOOLS = [
  { name: "ARR Calculator", href: "/marketing/arr-calculator", desc: "Calculate Annual Recurring Revenue for SaaS businesses." },
  { name: "LTV Calculator", href: "/marketing/ltv-calculator", desc: "Calculate Customer Lifetime Value for your business." },
  { name: "Burn Rate Calculator", href: "/marketing/burn-rate-calculator", desc: "Calculate startup monthly burn rate and runway." },
  { name: "CAC Calculator", href: "/marketing/cac-calculator", desc: "Calculate customer acquisition cost and payback period." },
  { name: "Churn Rate Calculator", href: "/marketing/churn-rate-calculator", desc: "Calculate customer churn rate and retention metrics." },
  { name: "CPC Calculator", href: "/marketing/cpc-calculator", desc: "Calculate cost per click for advertising campaigns." },
  { name: "ROAS Calculator", href: "/marketing/roas-calculator", desc: "Calculate return on ad spend for marketing ROI." },
  { name: "CPM Calculator", href: "/marketing/cpm-calculator", desc: "Calculate cost per mille for ad impressions." },
];

export default function MrrCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const customers = useNumericField(100);
  const arpu = useNumericField(100);
  const upgrades = useNumericField(5);
  const downgrades = useNumericField(2);
  const churned = useNumericField(3);

  const results = useMemo(() => {
    const mrr = customers.value * arpu.value;
    const arr = mrr * 12;
    const upgradeRevenue = upgrades.value * arpu.value;
    const downgradeLoss = downgrades.value * arpu.value;
    const churnLoss = churned.value * arpu.value;
    const netMRRChange = upgradeRevenue - downgradeLoss - churnLoss;
    const projectedMRR = mrr + netMRRChange;
    const netNewPercentage = customers.value > 0
      ? ((upgrades.value - downgrades.value - churned.value) / customers.value) * 100
      : 0;
    return {
      mrr,
      arr,
      customers: customers.value,
      arpu: arpu.value,
      upgrades: upgrades.value,
      downgrades: downgrades.value,
      churned: churned.value,
      upgradeRevenue,
      downgradeLoss,
      churnLoss,
      netMRRChange,
      projectedMRR,
      netNewPercentage,
    };
  }, [customers.value, arpu.value, upgrades.value, downgrades.value, churned.value]);

  const cfg = getCurrency(currency);

  const chartData = useMemo(() => [
    { name: "Active Customers", value: Math.max(0, results.customers) },
    { name: "ARPU", value: Math.max(0, results.arpu) },
    { name: "Monthly Revenue", value: Math.max(0, results.mrr) },
    { name: "Annual Revenue", value: Math.max(0, results.arr) },
  ], [results]);

  return (
    <ToolLayout
      title="MRR Calculator"
      description="Calculate Monthly Recurring Revenue - measure predictable revenue from subscription customers, track upgrades and downgrades, and project annual growth."
      category="marketing"
      faqContent={[
        {
          question: "What is MRR?",
          answer: "Monthly Recurring Revenue (MRR) is the predictable total revenue a business generates from active subscriptions each month. It is the single most important metric for SaaS and subscription businesses. MRR strips out one-time fees, variable charges, and non-recurring revenue to give you a clear picture of your predictable income stream. Investors use MRR to evaluate business health, growth trajectory, and valuation multiples.",
        },
        {
          question: "How is MRR calculated?",
          answer: "MRR = Number of Customers × Average Revenue Per User (ARPU). For example, 100 customers paying $100/month each gives an MRR of $10,000. The projected ARR (Annual Recurring Revenue) is simply MRR × 12, which would be $120,000/year. This calculator also factors in upgrades (+MRR), downgrades (-MRR), and churn (-MRR) to show your net MRR change and projected future MRR.",
        },
        {
          question: "What is the difference between MRR and ARR?",
          answer: "MRR (Monthly Recurring Revenue) measures your subscription revenue on a monthly basis, while ARR (Annual Recurring Revenue) annualizes that figure (MRR × 12). ARR is typically used by larger SaaS companies with annual contracts or those over $1M in revenue. MRR is more granular and better for tracking month-to-month changes, growth rates, and the impact of upgrades, downgrades, and churn.",
        },
        {
          question: "What is a good MRR growth rate?",
          answer: "For early-stage SaaS companies, a month-over-month MRR growth rate of 15-20% is considered excellent. For growth-stage companies (ARR over $1M), 5-10% monthly growth is strong. Mature companies typically see 2-5% monthly growth. The key is consistent, predictable growth that outpaces churn. Your net MRR change (upgrades minus downgrades minus churn) should always be positive to sustain growth.",
        },
        {
          question: "How do upgrades and downgrades affect MRR?",
          answer: "Upgrades (existing customers moving to higher-tier plans) increase MRR, while downgrades (moving to lower-tier plans) decrease it. Tracking these separately from new customer acquisition gives you a complete picture of revenue changes. For example, if 5 customers upgrade at $20/month each ($100 MRR gain) and 3 downgrade at $15/month each ($45 MRR loss), your net expansion MRR is +$55.",
        },
        {
          question: "What is churn and how does it impact MRR?",
          answer: "Churn measures customers who cancel their subscriptions entirely. Each churned customer reduces your MRR by their ARPU. If 3 customers paying $100/month each churn, that's $300 in lost MRR. Your churn rate (churned customers ÷ total customers × 100) directly impacts growth. A healthy SaaS business typically targets a monthly churn rate under 5% and strives for under 2%.",
        },
        {
          question: "What is a healthy ARPU for SaaS businesses?",
          answer: "ARPU (Average Revenue Per User) varies widely by market segment. B2C SaaS apps might have ARPU of $5-15/month, SMB-focused SaaS $50-200/month, and enterprise SaaS $500-5,000+/month. The key is that your ARPU should be at least 5-10× your cost to serve per customer. Increasing ARPU through upsells and feature additions is one of the most efficient ways to grow MRR.",
        },
        {
          question: "How does MRR relate to company valuation?",
          answer: "MRR and ARR are primary drivers of SaaS valuations. Typical valuation multiples range from 5× to 15× ARR for high-growth SaaS companies, depending on growth rate, churn, and market size. For example, a company with $1M ARR growing at 100% YoY might be valued at 10× ARR ($10M), while one growing at 20% might be valued at 4× ARR ($4M).",
        },
        {
          question: "Should I track gross MRR or net MRR?",
          answer: "Gross MRR includes all revenue from all customers without deductions. Net MRR is gross MRR minus churn and downgrades. Both are important: gross MRR shows your total scale, while net MRR (or net new MRR) shows true growth. Your net MRR retention rate (starting MRR minus churn and downgrades, plus upgrades, divided by starting MRR) should ideally be above 100% for a healthy business.",
        },
        {
          question: "What common mistakes do companies make with MRR?",
          answer: "Common MRR mistakes include: (1) Counting one-time setup fees as MRR - only recurring subscription revenue counts; (2) Ignoring payment failures and refunds - these reduce effective MRR; (3) Not segmenting MRR by plan type or customer cohort; (4) Confusing billings with revenue - revenue is recognized over the subscription period; (5) Not tracking contraction MRR (downgrades and churn) separately from expansion MRR (upgrades and upsells).",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a Monthly Recurring Revenue Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              An MRR Calculator helps subscription businesses measure their monthly recurring revenue - the lifeblood of any SaaS company.
              By entering your number of paying customers, average revenue per user (ARPU), and tracking upgrades, downgrades, and churn,
              you get a complete view of your MRR, projected annual revenue, and net revenue changes. This tool is essential for tracking
              growth, forecasting, investor reporting, and making data-driven business decisions.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">MRR Formula</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p>MRR = Number of Customers × Average Revenue Per User (ARPU)</p>
              <p>Projected ARR = MRR × 12</p>
              <p className="pt-2 border-t border-border/50 mt-2">Net MRR Change = Upgrade Revenue - Downgrade Loss - Churn Loss</p>
              <p>Projected MRR = Current MRR + Net MRR Change</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Key MRR Metrics</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground space-y-2">
              <p><strong className="text-foreground">New MRR:</strong> Revenue from newly acquired customers.</p>
              <p><strong className="text-foreground">Expansion MRR:</strong> Additional revenue from upgrades and upsells.</p>
              <p><strong className="text-foreground">Contraction MRR:</strong> Revenue lost from downgrades.</p>
              <p><strong className="text-foreground">Churn MRR:</strong> Revenue lost from customer cancellations.</p>
              <p><strong className="text-foreground">Net New MRR:</strong> New MRR + Expansion MRR - Contraction MRR - Churn MRR.</p>
              <p><strong className="text-foreground">Net MRR Retention Rate:</strong> (Starting MRR - Churn - Contraction + Expansion) / Starting MRR × 100.</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Scenario: A growing SaaS business with:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Number of Customers: 250</li>
                <li>Average Revenue Per User (ARPU): $150/month</li>
                <li>Upgrades: 5 customers upgrading at +$50/month = +$250</li>
                <li>Downgrades: 2 customers downgrading at -$30/month = -$60</li>
                <li>Churned: 3 customers at $150/month = -$450</li>
                <li>MRR = 250 × $150 = <strong>$37,500 / month</strong></li>
                <li>Net MRR Change = $250 - $60 - $450 = <strong>-$260</strong></li>
                <li>Projected ARR = $37,500 × 12 = <strong>$450,000 / year</strong></li>
              </ul>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">MRR Benchmarks by Stage</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="pb-2 pr-4 font-medium text-foreground">Stage</th>
                    <th className="pb-2 pr-4 font-medium text-foreground">MRR Range</th>
                    <th className="pb-2 font-medium text-foreground">Growth Rate (MoM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr><td className="py-2 pr-4">Idea / Pre-Seed</td><td className="py-2 pr-4">$0 - $10K</td><td className="py-2">N/A</td></tr>
                  <tr><td className="py-2 pr-4">Seed / Early</td><td className="py-2 pr-4">$10K - $50K</td><td className="py-2">15-20%</td></tr>
                  <tr><td className="py-2 pr-4">Growth / Series A</td><td className="py-2 pr-4">$50K - $250K</td><td className="py-2">10-15%</td></tr>
                  <tr><td className="py-2 pr-4">Scale / Series B+</td><td className="py-2 pr-4">$250K - $1M+</td><td className="py-2">5-10%</td></tr>
                  <tr><td className="py-2 pr-4">Mature / Public</td><td className="py-2 pr-4">$1M+</td><td className="py-2">2-5%</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Tips for Growing MRR</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground space-y-2">
              <p>1. <strong className="text-foreground">Reduce Churn:</strong> Improving retention by just 5% can increase profits by 25-95%.</p>
              <p>2. <strong className="text-foreground">Increase ARPU:</strong> Introduce tiered pricing, add-on features, and usage-based upsells.</p>
              <p>3. <strong className="text-foreground">Optimize Pricing:</strong> Regularly test pricing tiers and packaging to maximize willingness to pay.</p>
              <p>4. <strong className="text-foreground">Expand Revenue:</strong> Implement annual prepaid plans (discounted) to improve cash flow and reduce churn.</p>
              <p>5. <strong className="text-foreground">Customer Segmentation:</strong> Focus sales and marketing efforts on high-ARPU customer segments.</p>
              <p>6. <strong className="text-foreground">Win-Back Campaigns:</strong> Re-engage churned customers with targeted campaigns - 20-40% may return.</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Common MRR Mistakes to Avoid</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground space-y-2">
              <p>1. <strong className="text-foreground">Counting Non-Recurring Revenue:</strong> Setup fees, professional services, and one-time charges should not be included in MRR.</p>
              <p>2. <strong className="text-foreground">Ignoring Payment Failures:</strong> Failed payments reduce effective MRR - track collected MRR vs. billed MRR.</p>
              <p>3. <strong className="text-foreground">Not Segmenting MRR:</strong> Break down MRR by plan type, customer cohort, and acquisition channel for actionable insights.</p>
              <p>4. <strong className="text-foreground">Confusing Billings with Revenue:</strong> Revenue is recognized ratably over the subscription period.</p>
              <p>5. <strong className="text-foreground">Overlooking Contraction MRR:</strong> Track downgrades separately from churn to identify at-risk customer segments.</p>
            </div>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-muted-foreground">Currency:</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="text-sm border border-border rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.symbol} - {c.label}</option>)}
            </select>
          </div>

          <SliderField label="Number of Customers" icon={Users} value={customers} symbol="" min={1} max={100000} step={1} formatValue={formatCompact} />
          <SliderField label="Avg Revenue Per User (ARPU)" icon={DollarSign} value={arpu} symbol={cfg.symbol} min={1} max={100000} step={1} currencyCode={currency} />

          <div className="border-t border-border/50 pt-6">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" />
              MRR Changes (Upgrades / Downgrades / Churn)
            </p>
            <div className="space-y-4">
              <SliderField label="Upgrades (customers moving up)" icon={ArrowUp} value={upgrades} symbol="" min={0} max={10000} step={1} formatValue={formatCompact} />
              <SliderField label="Downgrades (customers moving down)" icon={ArrowDown} value={downgrades} symbol="" min={0} max={10000} step={1} formatValue={formatCompact} />
              <SliderField label="Churned (cancelled customers)" icon={AlertTriangle} value={churned} symbol="" min={0} max={10000} step={1} formatValue={formatCompact} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-emerald-500/10 to-primary/10 border border-emerald-500/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground font-medium">Monthly Recurring Revenue</p>
            </div>
            <p className="text-4xl font-extrabold text-primary break-words">
              {formatCurrency(results.mrr, currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              per month from {results.customers.toLocaleString()} customers
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard icon={Users} label="Active Customers" value={results.customers.toLocaleString()} color="text-blue-500" />
            <MetricCard icon={DollarSign} label="Avg Revenue Per User" value={formatCurrency(results.arpu, currency)} color="text-indigo-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard icon={ArrowUp} label="Upgrade Revenue (+)" value={formatCurrency(results.upgradeRevenue, currency)} color="text-emerald-500" iconColor="text-emerald-500" />
            <MetricCard icon={ArrowDown} label="Downgrade Loss (-)" value={formatCurrency(results.downgradeLoss, currency)} color="text-orange-500" iconColor="text-orange-500" />
          </div>

          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              Net MRR Analysis
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Churn Loss</span>
                <span className="font-medium text-red-500">-{formatCurrency(results.churnLoss, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Net MRR Change</span>
                <span className={cn("font-medium", results.netMRRChange >= 0 ? "text-emerald-500" : "text-red-500")}>
                  {results.netMRRChange >= 0 ? "+" : ""}{formatCurrency(results.netMRRChange, currency)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Net New Customers %</span>
                <span className={cn("font-medium", results.netNewPercentage >= 0 ? "text-emerald-500" : "text-red-500")}>
                  {results.netNewPercentage >= 0 ? "+" : ""}{results.netNewPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-medium">Projected MRR (next month)</span>
                <span className="font-bold text-primary">{formatCurrency(results.projectedMRR, currency)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Projected Annual Revenue
            </p>
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground mb-1">Projected ARR</p>
              <p className="text-3xl font-bold text-emerald-500">
                {formatCurrency(results.arr, currency)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                MRR × 12 months
              </p>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              MRR Breakdown
            </p>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-32 h-32 flex-shrink-0 mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" strokeWidth={0}>
                      {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip formatter={(val: any) => formatCompact(Number(val) || 0)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5 text-sm">
                {chartData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: CHART_COLORS[i] }} />
                      {item.name}
                    </span>
                    <span className="font-medium">{item.name === "Active Customers" ? item.value.toLocaleString() : formatCurrency(item.value, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 text-sm border-t border-border/50 pt-3">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Active Customers</span>
                <span className="font-medium">{results.customers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Avg Revenue / User / Month</span>
                <span className="font-medium">{formatCurrency(results.arpu, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Monthly Recurring Revenue</span>
                <span className="font-medium text-primary">{formatCurrency(results.mrr, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-medium">Projected Annual Revenue</span>
                <span className="font-bold text-emerald-500">{formatCurrency(results.arr, currency)}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Active Customers</p>
                <p className="text-sm font-semibold">{results.customers.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">MRR</p>
                <p className="text-sm font-semibold text-emerald-500">{formatCurrency(results.mrr, currency)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Projected ARR</p>
                <p className="text-sm font-semibold">{formatCurrency(results.arr, currency)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6">Related Calculators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {RELATED_TOOLS.map((tool) => (
            <a
              key={tool.name}
              href={tool.href}
              className="block bg-white border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-md transition-all group"
            >
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{tool.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{tool.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
}
