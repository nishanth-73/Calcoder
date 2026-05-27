"use client";

import { useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import {
  Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip,
} from "recharts";
import {
  DollarSign, TrendingUp, BadgePercent, FileText, Wallet,
  BarChart3, ArrowUpRight, ShoppingCart, AlertTriangle, CheckCircle2,
  Target, Info, Users,
} from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";

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

function formatPercent(n: number): string {
  if (!Number.isFinite(n) || isNaN(n)) return "0%";
  return `${n.toFixed(2)}%`;
}

const CHART_COLORS = ["#10b981", "#f43f5e", "#6366f1", "#f59e0b"];

const RELATED_TOOLS = [
  { name: "LTV Calculator", href: "/marketing/ltv-calculator", desc: "Calculate customer lifetime value for your business." },
  { name: "CPC Calculator", href: "/marketing/cpc-calculator", desc: "Calculate cost per click for your ad campaigns." },
  { name: "CPM Calculator", href: "/marketing/cpm-calculator", desc: "Calculate cost per mille for your ad campaigns." },
  { name: "Churn Rate Calculator", href: "/marketing/churn-rate-calculator", desc: "Calculate customer churn rate for your business." },
  { name: "ROAS Calculator", href: "/marketing/roas-calculator", desc: "Calculate return on ad spend for your campaigns." },
  { name: "ROI Calculator", href: "/finance/roi-calculator", desc: "Calculate return on investment including all costs." },
  { name: "Burn Rate Calculator", href: "/marketing/burn-rate-calculator", desc: "Calculate your startup monthly burn rate." },
  { name: "MRR Calculator", href: "/marketing/mrr-calculator", desc: "Calculate monthly recurring revenue for your SaaS." },
];

function SliderField({
  label, icon: Icon, value, displayValue, onChange, onTextChange,
  onFocus, onBlur, min, max, step, formatDisplay, unit, prefix,
}: {
  label: string;
  icon: React.ElementType;
  value: number;
  displayValue: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTextChange: (raw: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  min: number;
  max: number;
  step: number;
  formatDisplay?: string;
  unit?: string;
  prefix?: string;
}) {
  const isPercent = unit === "%";
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm font-medium">
        <Icon className="w-4 h-4 text-primary" />
        <span>{label}</span>
        <span className="ml-auto text-lg font-bold text-primary">
          {formatDisplay ?? value}
        </span>
      </label>
      {isPercent ? (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text" inputMode="decimal"
              value={displayValue}
              onFocus={onFocus}
              onBlur={onBlur}
              onChange={(e) => onTextChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="Enter value"
            />
          </div>
          <span className="text-muted-foreground font-medium text-sm">%</span>
        </div>
      ) : prefix ? (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">
            {prefix}
          </span>
          <input
            type="text" inputMode="decimal"
            value={displayValue}
            onFocus={onFocus}
            onBlur={onBlur}
            onChange={(e) => onTextChange(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-8 px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            placeholder="Enter value"
          />
        </div>
      ) : (
        <div className="relative">
          <input
            type="text" inputMode="decimal"
            value={displayValue}
            onFocus={onFocus}
            onBlur={onBlur}
            onChange={(e) => onTextChange(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            placeholder="Enter value"
          />
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        aria-label={label}
        className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  );
}

function MetricCard({
  label, value, icon: Icon, className, valueClassName, tooltip,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  className?: string;
  valueClassName?: string;
  tooltip?: string;
}) {
  return (
    <div className={`bg-white border border-border rounded-xl p-4 ${className ?? ""}`}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {label}
        {tooltip && (
          <span title={tooltip} className="cursor-help">
            <Info className="w-3 h-3 text-muted-foreground/50" />
          </span>
        )}
      </p>
      <p className={`text-lg font-bold ${valueClassName ?? ""}`}>{value}</p>
    </div>
  );
}

function getCacStatus(cac: number) {
  if (!Number.isFinite(cac) || cac <= 0) {
    return { label: "N/A", icon: Info, color: "text-muted-foreground", bg: "bg-muted", border: "border-border" };
  }
  if (cac < 100) return { label: "Excellent", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
  if (cac < 250) return { label: "Good", icon: ArrowUpRight, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" };
  if (cac < 500) return { label: "Average", icon: Target, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
  return { label: "High", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" };
}

export default function CacCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");

  const marketingSpend = useNumericField(50000);
  const salesSpend = useNumericField(20000);
  const newCustomers = useNumericField(500);

  const results = useMemo(() => {
    const mkt = Number.isFinite(marketingSpend.value) ? Math.max(0, marketingSpend.value) : 0;
    const sales = Number.isFinite(salesSpend.value) ? Math.max(0, salesSpend.value) : 0;
    const cust = Number.isFinite(newCustomers.value) ? Math.max(0, newCustomers.value) : 0;

    const totalSpend = mkt + sales;
    const cac = cust > 0 ? totalSpend / cust : 0;
    const marketingPct = totalSpend > 0 ? (mkt / totalSpend) * 100 : 0;
    const salesPct = totalSpend > 0 ? (sales / totalSpend) * 100 : 0;
    const impliedLtv = cac * 3;

    let paybackMonths = 0;
    if (cac > 0) {
      const monthlyRevenuePerCustomer = impliedLtv / 24;
      paybackMonths = monthlyRevenuePerCustomer > 0 ? cac / monthlyRevenuePerCustomer : 0;
    }

    return { totalSpend, cac, marketingPct, salesPct, impliedLtv, paybackMonths };
  }, [marketingSpend.value, salesSpend.value, newCustomers.value]);

  const chartData = useMemo(() => {
    const mkt = Math.max(0, marketingSpend.value);
    const sales = Math.max(0, salesSpend.value);
    return [
      { name: "Marketing", value: mkt },
      { name: "Sales", value: sales },
    ].filter((d) => d.value > 0);
  }, [marketingSpend.value, salesSpend.value]);

  const cfg = getCurrency(currency);
  const status = getCacStatus(results.cac);

  const ltvCacScalePercent = Math.min(100, (3 / 5) * 100);

  return (
    <ToolLayout
      title="CAC Calculator"
      description="Calculate Customer Acquisition Cost - determine how much it costs to acquire a new customer. Free online CAC calculator with instant results, charts, and detailed breakdown."
      category="marketing"
      faqContent={[
        {
          question: "What is Customer Acquisition Cost (CAC)?",
          answer: "Customer Acquisition Cost (CAC) is a business metric that represents the total cost of acquiring a new customer, including all marketing and sales expenses. It is calculated by dividing the total marketing and sales spend by the number of new customers acquired in a given period. CAC is a fundamental metric for understanding the efficiency of your growth efforts and determining the sustainability of your business model. A lower CAC indicates more efficient customer acquisition, while a high CAC may signal that your marketing and sales strategies need optimization.",
        },
        {
          question: "How is CAC calculated?",
          answer: "CAC = (Total Marketing Spend + Total Sales Spend) ÷ Total New Customers. For example, if you spend $50,000 on marketing and $20,000 on sales in a month, and acquire 500 new customers, your CAC is ($50,000 + $20,000) ÷ 500 = $140 per customer. This means each new customer costs $140 to acquire across all marketing and sales efforts. You can also calculate component CACs by channel to understand which channels are most efficient.",
        },
        {
          question: "What is a good CAC?",
          answer: "A good CAC depends on your industry, business model, and customer lifetime value (LTV). The general rule is that your LTV:CAC ratio should be at least 3:1 - meaning each customer should generate at least 3 times what it cost to acquire them. SaaS companies typically aim for a payback period of 12 months or less. Generally: CAC under $100 is excellent for most businesses; $100-$250 is good; $250-$500 is average; over $500 may be concerning unless LTV is proportionally high.",
        },
        {
          question: "How can I reduce my CAC?",
          answer: "To reduce CAC: 1) Optimize marketing channels by focusing budget on the highest-performing ones, 2) Improve conversion rates through A/B testing landing pages and ad copy, 3) Leverage organic channels (SEO, content marketing, referrals) which have lower long-term costs, 4) Implement customer referral programs that reward existing customers for bringing in new ones, 5) Improve sales team efficiency with better lead scoring and CRM tools, 6) Use retargeting campaigns to convert warm leads at lower cost, 7) Create high-quality content that attracts inbound leads, 8) Automate lead nurturing with email sequences and chatbots.",
        },
        {
          question: "What is the difference between CAC and CPA?",
          answer: "CAC (Customer Acquisition Cost) is the total cost to acquire a paying customer, including all marketing AND sales expenses, salaries, tools, and overhead. CPA (Cost Per Acquisition) is a narrower metric that typically refers to the cost of a single conversion event (like a sign-up, form fill, or purchase) from a specific ad campaign. CPA usually only includes ad spend, while CAC encompasses the entire marketing and sales ecosystem. CPA is used for campaign-level optimization, while CAC is used for business-level financial analysis.",
        },
        {
          question: "What is a good LTV:CAC ratio?",
          answer: "The LTV:CAC ratio compares customer lifetime value to acquisition cost. A ratio of 3:1 is considered the minimum healthy benchmark - the customer generates 3 times what it cost to acquire them. A ratio of 5:1 or higher is excellent. Below 3:1, your business may struggle with profitability, and below 1:1 means you are losing money on every customer you acquire. However, early-stage companies may accept lower ratios as they invest in growth. Track this ratio monthly and investigate any significant changes.",
        },
        {
          question: "How does CAC vary by industry?",
          answer: "CAC varies significantly by industry and business model. SaaS (B2B): $100-$500 average, $1,000+ for enterprise. SaaS (B2C): $20-$200. E-commerce: $20-$100. Retail: $10-$50. Financial Services: $200-$1,000+. Healthcare: $100-$500. Enterprise Software: $500-$5,000+. Mobile Apps: $1-$5 (but high volume). Marketplaces: $50-$200. Agencies/Consulting: $200-$1,000+. These ranges depend on pricing, sales cycle length, and whether you use self-service vs. sales-led growth.",
        },
        {
          question: "What factors affect CAC the most?",
          answer: "The biggest factors affecting CAC are: 1) Marketing channel mix - paid channels have immediate but higher costs, organic channels have lower long-term costs, 2) Conversion rate optimization - improving landing page conversion can dramatically reduce CAC, 3) Sales process efficiency - lead qualification, CRM usage, and sales team structure, 4) Product pricing - higher-priced products can sustain higher CAC, 5) Market competition - competitive markets drive up ad costs, 6) Brand awareness - established brands have lower CAC due to organic and direct traffic, 7) Seasonality - CAC often increases during competitive seasons, 8) Target audience - niche audiences may have higher CAC but better conversion rates.",
        },
        {
          question: "How often should I track CAC?",
          answer: "CAC should be tracked at multiple frequencies: Monthly - primary tracking interval to spot trends and seasonality, Quarterly - deeper analysis of CAC by channel, segment, and product line, Annually - strategic review of CAC trends and LTV:CAC ratio evolution. Additionally, track CAC by marketing channel (paid search, social, email, organic) to optimize budget allocation. Set up alerts when CAC increases more than 20% month-over-month. For high-growth startups, weekly CAC tracking can help catch issues early before they impact growth targets.",
        },
        {
          question: "How do I calculate CAC payback period?",
          answer: "The CAC payback period is the time it takes to earn back the cost of acquiring a customer. Formula: CAC Payback Period (months) = CAC ÷ Monthly Revenue per Customer. For example, if your CAC is $140 and your average customer pays $50 per month, your payback period is $140 ÷ $50 = 2.8 months. Most SaaS companies aim for a payback period of 12 months or less. A shorter payback period means faster return on acquisition investment and better cash flow. Track payback period by customer segment and acquisition channel.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a CAC Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A CAC (Customer Acquisition Cost) Calculator helps businesses determine how much it costs to acquire
              each new customer. By entering your <strong>total marketing spend</strong>,{" "}
              <strong>total sales spend</strong>, and <strong>new customers acquired</strong>, you get an instant
              CAC that tells you the true cost of growth. This metric is essential for evaluating the efficiency of
              your marketing and sales efforts, forecasting profitability, and making data-driven budget allocation
              decisions.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p>Total Spend = Marketing Spend + Sales Spend</p>
              <p><strong>CAC = Total Spend ÷ New Customers</strong></p>
              <p>Marketing % = (Marketing Spend ÷ Total Spend) × 100</p>
              <p>Sales % = (Sales Spend ÷ Total Spend) × 100</p>
              <p>Implied LTV (3:1) = CAC × 3</p>
              <p>Payback Period (months) = CAC ÷ Monthly Revenue per Customer</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Key Metrics Explained</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  metric: "CAC (Customer Acquisition Cost)",
                  desc: "The total cost of acquiring a new customer, combining all marketing and sales expenses. Lower is better.",
                },
                {
                  metric: "LTV:CAC Ratio",
                  desc: "Compares customer lifetime value to acquisition cost. A 3:1 ratio is the minimum healthy benchmark.",
                },
                {
                  metric: "CAC Payback Period",
                  desc: "The time (in months) required to earn back the cost of acquiring a customer. Shorter is better.",
                },
                {
                  metric: "Marketing % of Spend",
                  desc: "The portion of total acquisition spend allocated to marketing activities. Helps balance budget allocation.",
                },
                {
                  metric: "Sales % of Spend",
                  desc: "The portion of total acquisition spend allocated to sales activities. Indicates sales team investment.",
                },
                {
                  metric: "Implied LTV (3:1)",
                  desc: "The minimum customer lifetime value needed to achieve a healthy 3:1 LTV:CAC ratio.",
                },
              ].map((item) => (
                <div key={item.metric} className="bg-muted/50 p-3 rounded-lg">
                  <p className="font-semibold text-sm">{item.metric}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">
                Scenario: Your company spends $50,000 on marketing and $20,000 on sales, acquiring 500 new customers.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Total Spend = $50,000 + $20,000 = <strong>$70,000</strong></li>
                <li>CAC = $70,000 ÷ 500 = <strong>$140.00 per customer</strong></li>
                <li>Marketing % = ($50,000 ÷ $70,000) × 100 = <strong>71.43%</strong></li>
                <li>Sales % = ($20,000 ÷ $70,000) × 100 = <strong>28.57%</strong></li>
                <li>Implied LTV (3:1) = $140 × 3 = <strong>$420.00</strong></li>
                <li>With $50/mo revenue per customer, payback period = $140 ÷ $50 = <strong>2.8 months</strong></li>
              </ul>
              <p className="mt-2">
                Each new customer costs $140 to acquire. To maintain a healthy LTV:CAC ratio of 3:1, the average
                customer lifetime value should be at least $420, and revenue should recover the acquisition cost
                within 2.8 months.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">CAC Benchmarks by Industry</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-semibold">Industry</th>
                    <th className="text-right py-2 font-semibold">Average CAC</th>
                    <th className="text-right py-2 font-semibold">Good CAC</th>
                    <th className="text-right py-2 font-semibold">Excellent</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    ["SaaS (B2B)", "$200", "$100", "<$75"],
                    ["SaaS (B2C)", "$80", "$40", "<$20"],
                    ["E-commerce", "$50", "$30", "<$20"],
                    ["Retail", "$30", "$15", "<$10"],
                    ["Financial Services", "$500", "$250", "<$150"],
                    ["Healthcare", "$250", "$150", "<$100"],
                    ["Enterprise Software", "$2,000", "$1,000", "<$500"],
                    ["Mobile Apps", "$3", "$2", "<$1"],
                    ["Marketplaces", "$100", "$60", "<$40"],
                    ["Agencies / Consulting", "$500", "$300", "<$200"],
                  ].map(([industry, avg, good, exc]) => (
                    <tr key={industry} className="border-b border-border/50">
                      <td className="py-2">{industry}</td>
                      <td className="text-right py-2">{avg}</td>
                      <td className="text-right py-2">{good}</td>
                      <td className="text-right py-2">{exc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Tips to Reduce CAC</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
              <li><strong>Optimize channel mix</strong> - Analyze CAC by channel and reallocate budget to the most efficient channels. Focus on channels with the lowest CAC and highest conversion rates.</li>
              <li><strong>Improve conversion rates</strong> - A/B test landing pages, simplify checkout flows, add social proof, and optimize for mobile. A 10% improvement in conversion can reduce CAC by 9%.</li>
              <li><strong>Leverage organic channels</strong> - Invest in SEO, content marketing, and social media organic reach. These channels have higher upfront costs but lower CAC over time.</li>
              <li><strong>Implement referral programs</strong> - Encourage existing customers to refer new ones. Referral customers typically have 25% lower CAC and 30% higher retention.</li>
              <li><strong>Use retargeting</strong> - Re-engage website visitors who didn't convert. Retargeting campaigns often have 50-70% lower CAC than cold acquisition.</li>
              <li><strong>Improve lead scoring</strong> - Use data-driven lead scoring to focus sales efforts on high-intent prospects, reducing wasted sales time and improving conversion rates.</li>
              <li><strong>Automate lead nurturing</strong> - Set up email sequences, chatbots, and drip campaigns to convert leads without manual intervention, reducing sales team workload.</li>
              <li><strong>Create high-quality content</strong> - Publish blog posts, videos, case studies, and whitepapers that attract inbound leads with high purchase intent and lower acquisition cost.</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Common Mistakes to Avoid</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              <li><strong>Ignoring fully loaded CAC</strong> - Many businesses only include ad spend, forgetting salaries, tools, overhead, and agency fees. Always calculate fully loaded CAC for accurate financial planning.</li>
              <li><strong>Not segmenting CAC by channel</strong> - Blended CAC hides channel-level inefficiencies. Always calculate CAC per channel, campaign, and customer segment to identify optimization opportunities.</li>
              <li><strong>Focusing only on CAC reduction</strong> - Reducing CAC too aggressively can stunt growth. Balance CAC optimization with volume targets to maintain healthy growth rates.</li>
              <li><strong>Ignoring the LTV side of the equation</strong> - A higher CAC is acceptable if LTV is proportionally higher. Always evaluate CAC in context of LTV:CAC ratio, not in isolation.</li>
              <li><strong>Using wrong time periods</strong> - CAC should be calculated over consistent periods (monthly, quarterly) and aligned with your sales cycle. Short measurement periods can be misleading for long-cycle sales.</li>
              <li><strong>Setting and forgetting</strong> - CAC changes with market conditions, seasonality, and campaign performance. Continuously monitor and optimize based on current data, not historical averages.</li>
            </ul>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-muted-foreground">Currency:</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="text-sm border border-border rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} - {c.code}
                </option>
              ))}
            </select>
          </div>

          <SliderField
            label={`Total Marketing Spend (${cfg.symbol})`}
            icon={ShoppingCart}
            value={marketingSpend.value}
            displayValue={marketingSpend.displayValue}
            onChange={(e) => marketingSpend.setValue(parseFloat(e.target.value))}
            onTextChange={marketingSpend.handleChange}
            onFocus={marketingSpend.handleFocus}
            onBlur={marketingSpend.handleBlur}
            min={0}
            max={10000000}
            step={100}
            formatDisplay={formatCurrency(marketingSpend.value, currency)}
            prefix={cfg.symbol}
          />

          <SliderField
            label={`Total Sales Spend (${cfg.symbol})`}
            icon={Wallet}
            value={salesSpend.value}
            displayValue={salesSpend.displayValue}
            onChange={(e) => salesSpend.setValue(parseFloat(e.target.value))}
            onTextChange={salesSpend.handleChange}
            onFocus={salesSpend.handleFocus}
            onBlur={salesSpend.handleBlur}
            min={0}
            max={10000000}
            step={100}
            formatDisplay={formatCurrency(salesSpend.value, currency)}
            prefix={cfg.symbol}
          />

          <SliderField
            label="Total New Customers"
            icon={Users}
            value={newCustomers.value}
            displayValue={newCustomers.displayValue}
            onChange={(e) => newCustomers.setValue(parseFloat(e.target.value))}
            onTextChange={newCustomers.handleChange}
            onFocus={newCustomers.handleFocus}
            onBlur={newCustomers.handleBlur}
            min={1}
            max={100000}
            step={1}
            formatDisplay={formatCompact(newCustomers.value)}
          />
        </div>

        <div className="space-y-4">
          <div
            className={`bg-gradient-to-br from-emerald-500/10 to-primary/10 ${status.border} rounded-xl p-6 text-center`}
          >
            <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Customer Acquisition Cost (CAC)
            </p>
            <p className="text-4xl font-extrabold text-foreground">
              {results.cac > 0 ? formatCurrency(results.cac, currency) : `${cfg.symbol}0`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              per new customer
            </p>
            {results.cac > 0 && (
              <div className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold mt-2 ${status.bg} ${status.color}`}>
                <status.icon className="w-3 h-3" />
                {status.label}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-emerald-500/20">
              <p className="text-xs text-muted-foreground mb-2">LTV:CAC Ratio Benchmark</p>
              <div className="relative h-2 bg-gradient-to-r from-red-400 via-amber-400 via-emerald-400 to-emerald-600 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white border-2 border-gray-800 rounded-full transition-all duration-300 z-10"
                  style={{ left: `${ltvCacScalePercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                <span>0:1</span>
                <span>Poor</span>
                <span className="text-emerald-600 font-semibold">3:1</span>
                <span>5:1+</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                <CheckCircle2 className="w-3 h-3 inline text-emerald-500" />{" "}
                3:1 is the minimum healthy LTV:CAC ratio. Your implied LTV is{" "}
                <strong>{formatCurrency(results.impliedLtv, currency)}</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Marketing Spend"
              value={formatCurrency(marketingSpend.value, currency)}
              icon={ShoppingCart}
              tooltip="Total amount spent on marketing activities"
            />
            <MetricCard
              label="Sales Spend"
              value={formatCurrency(salesSpend.value, currency)}
              icon={Wallet}
              tooltip="Total amount spent on sales activities"
            />
            <MetricCard
              label="Total Spend"
              value={formatCurrency(results.totalSpend, currency)}
              icon={DollarSign}
              valueClassName="text-primary"
              tooltip="Combined marketing and sales spend"
            />
            <MetricCard
              label="CAC (per Customer)"
              value={results.cac > 0 ? formatCurrency(results.cac, currency) : `${cfg.symbol}0`}
              icon={TrendingUp}
              valueClassName={results.cac > 0 ? (results.cac < 100 ? "text-emerald-500" : results.cac < 250 ? "text-blue-500" : results.cac < 500 ? "text-amber-500" : "text-red-500") : ""}
              tooltip="Cost to acquire each new customer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="New Customers"
              value={formatCompact(newCustomers.value)}
              icon={Users}
              tooltip="Total number of new customers acquired"
            />
            <MetricCard
              label="Marketing %"
              value={formatPercent(results.marketingPct)}
              icon={BadgePercent}
              valueClassName={results.marketingPct >= 50 ? "text-emerald-500" : "text-amber-500"}
              tooltip="Percentage of total spend allocated to marketing"
            />
            <MetricCard
              label="Sales %"
              value={formatPercent(results.salesPct)}
              icon={BarChart3}
              valueClassName={results.salesPct >= 50 ? "text-emerald-500" : "text-amber-500"}
              tooltip="Percentage of total spend allocated to sales"
            />
            <MetricCard
              label="Implied LTV (3:1)"
              value={formatCurrency(results.impliedLtv, currency)}
              icon={Target}
              valueClassName="text-emerald-500"
              tooltip="Minimum customer lifetime value for a healthy 3:1 LTV:CAC ratio"
            />
          </div>

          <div className="bg-white border border-border rounded-xl p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Cost Breakdown
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
              <div className="w-32 h-32 flex-shrink-0 mx-auto sm:mx-0">
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
                      formatter={(val: any) =>
                        formatCurrency(Number(val) || 0, currency)
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-1.5 text-sm">
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
            <div className="space-y-1.5 text-sm border-t border-border/50 pt-3">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Marketing Spend</span>
                <span className="font-medium">
                  {formatCurrency(marketingSpend.value, currency)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Sales Spend</span>
                <span className="font-medium">
                  {formatCurrency(salesSpend.value, currency)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Total Spend</span>
                <span className="font-medium">
                  {formatCurrency(results.totalSpend, currency)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">New Customers</span>
                <span className="font-medium">
                  {formatCompact(newCustomers.value)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Marketing %</span>
                <span className="font-medium">
                  {formatPercent(results.marketingPct)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Sales %</span>
                <span className="font-medium">
                  {formatPercent(results.salesPct)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-t border-border/50 pt-1.5">
                <span className="font-semibold">CAC (per customer)</span>
                <span className={`font-bold ${results.cac > 0 ? (results.cac < 100 ? "text-emerald-500" : results.cac < 250 ? "text-blue-500" : results.cac < 500 ? "text-amber-500" : "text-red-500") : ""}`}>
                  {results.cac > 0 ? formatCurrency(results.cac, currency) : `${cfg.symbol}0`}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Total Spend</p>
                <p className="text-sm font-semibold">{formatCurrency(results.totalSpend, currency)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">New Customers</p>
                <p className="text-sm font-semibold text-emerald-500">{formatCompact(newCustomers.value)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">CAC</p>
                <p className="text-sm font-semibold">{results.cac > 0 ? formatCurrency(results.cac, currency) : `${cfg.symbol}0`}</p>
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
