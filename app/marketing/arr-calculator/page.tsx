"use client";

import { useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { cn } from "@/lib/utils";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Calculator, DollarSign, TrendingUp, Users, CreditCard } from "lucide-react";
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
  { name: "MRR Calculator", href: "/marketing/mrr-calculator", desc: "Calculate Monthly Recurring Revenue for subscription businesses." },
  { name: "LTV Calculator", href: "/marketing/ltv-calculator", desc: "Calculate Customer Lifetime Value for your business." },
  { name: "Burn Rate Calculator", href: "/marketing/burn-rate-calculator", desc: "Calculate startup monthly burn rate and runway." },
  { name: "CAC Calculator", href: "/marketing/cac-calculator", desc: "Calculate customer acquisition cost and payback period." },
  { name: "Churn Rate Calculator", href: "/marketing/churn-rate-calculator", desc: "Calculate customer churn rate and retention metrics." },
  { name: "CPC Calculator", href: "/marketing/cpc-calculator", desc: "Calculate cost per click for advertising campaigns." },
  { name: "ROAS Calculator", href: "/marketing/roas-calculator", desc: "Calculate return on ad spend for marketing ROI." },
  { name: "CPM Calculator", href: "/marketing/cpm-calculator", desc: "Calculate cost per mille for ad impressions." },
];

export default function ArrCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const customers = useNumericField(100);
  const acv = useNumericField(1200);

  const results = useMemo(() => {
    const arr = customers.value * acv.value;
    const mrr = arr / 12;
    return {
      arr,
      mrr,
      customers: customers.value,
      acv: acv.value,
      revenuePerCustomerPerMonth: acv.value / 12,
    };
  }, [customers.value, acv.value]);

  const cfg = getCurrency(currency);

  const chartData = useMemo(() => [
    { name: "Paying Customers", value: Math.max(0, results.customers) },
    { name: "ACV / Year", value: Math.max(0, results.acv) },
    { name: "Monthly Revenue", value: Math.max(0, results.mrr) },
    { name: "Annual Revenue", value: Math.max(0, results.arr) },
  ], [results]);

  return (
    <ToolLayout
      title="ARR Calculator"
      description="Calculate Annual Recurring Revenue - measure predictable annual revenue from subscription customers, SaaS contracts, and project monthly equivalents."
      category="marketing"
      faqContent={[
        {
          question: "What is ARR?",
          answer: "Annual Recurring Revenue (ARR) is the predictable total revenue a business generates from subscriptions over a year. It is calculated as: Number of Customers × Average Annual Contract Value (ACV). ARR is the standard metric for SaaS companies with annual contracts and is used to measure business scale, growth rates, and valuation. Unlike MRR which is more granular, ARR provides a big-picture view of your recurring revenue stream.",
        },
        {
          question: "How is ARR calculated?",
          answer: "ARR = Number of Customers × Average Annual Contract Value (ACV). For example, 100 customers paying $1,200/year each gives you an ARR of $120,000. The equivalent MRR is ARR ÷ 12, which would be $10,000/month. ACV represents the average annual value per customer contract, which may differ from simply multiplying monthly revenue by 12 if customers have different contract terms.",
        },
        {
          question: "What is the difference between ARR and MRR?",
          answer: "ARR (Annual Recurring Revenue) is your yearly subscription revenue, while MRR (Monthly Recurring Revenue) is your monthly subscription revenue. ARR = MRR × 12. ARR is commonly used for larger enterprise SaaS companies with annual contracts and is the preferred metric for investors and board reporting. MRR is more granular and useful for tracking monthly changes, growth rates, and operational decisions.",
        },
        {
          question: "What is Average Contract Value (ACV)?",
          answer: "ACV (Average Annual Contract Value) is the average revenue generated per customer contract per year. It normalizes different contract lengths and start dates. For example, if you have 10 customers on $1,200/year contracts and 10 on $600/year contracts, your ACV is ($12,000 + $6,000) ÷ 20 = $900/year. ACV helps you understand the value of your average customer relationship.",
        },
        {
          question: "What is a good ARR growth rate?",
          answer: "For SaaS companies, the Rule of 40 (growth rate + profit margin ≥ 40%) is a common benchmark. Typical ARR growth rates: Early-stage (under $2M ARR): 100-200% YoY, Growth-stage ($2-10M ARR): 40-100% YoY, Scale-up ($10-100M ARR): 20-40% YoY, Enterprise (over $100M ARR): 10-20% YoY. Growth rates naturally decelerate as the base gets larger.",
        },
        {
          question: "How is ARR used in company valuation?",
          answer: "ARR is the primary driver of SaaS valuations. Typical multiples range from 5× to 15× ARR depending on growth rate, gross margin, churn, and market size. For example, a company with $5M ARR growing at 80% YoY might be valued at 12× ARR ($60M), while one with $50M ARR growing at 20% might be valued at 6× ARR ($300M). Higher growth and lower churn command higher multiples.",
        },
        {
          question: "What is net revenue retention (NRR) and why does it matter?",
          answer: "Net Revenue Retention (NRR) measures the percentage of recurring revenue retained from existing customers over a period, including expansions, contractions, and churn. NRR = (Starting ARR + Expansion - Contraction - Churn) ÷ Starting ARR × 100. An NRR above 100% means your existing customers are growing their spend faster than you're losing revenue to churn - a hallmark of the best SaaS companies.",
        },
        {
          question: "How does contract length affect ARR?",
          answer: "Annual contracts provide more revenue certainty than monthly contracts. Companies with a higher percentage of annual contracts typically have lower churn, better cash flow, and higher valuations. However, annual contracts often include discounts (e.g., 2 months free), which reduces Effective ARR. It's important to track both Gross ARR (total billed) and Net ARR (after discounts and refunds).",
        },
        {
          question: "What common mistakes do companies make with ARR?",
          answer: "Common ARR mistakes include: (1) Counting non-recurring revenue (setup fees, professional services) as ARR; (2) Not normalizing for contract start dates - revenue should be recognized ratably; (3) Ignoring the difference between billings and revenue; (4) Including free trial users who haven't converted; (5) Not segmenting ARR by plan type, customer size, and channel to identify growth drivers.",
        },
        {
          question: "How should I track ARR vs CARR (Committed ARR)?",
          answer: "CARR (Committed Annual Recurring Revenue) only includes revenue from signed contracts with committed future payments, while ARR may include month-to-month customers who could cancel anytime. CARR is a more conservative and reliable metric for forecasting. Many enterprise SaaS companies track both: ARR for total recurring revenue and CARR for contracted, non-cancelable revenue.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is an Annual Recurring Revenue Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              An ARR Calculator helps SaaS and subscription businesses measure their annual recurring revenue - the key metric
              that investors and stakeholders use to evaluate business health and growth. By entering your number of paying
              customers and average contract value (ACV) per year, you get an instant ARR calculation and equivalent MRR.
              This tool is essential for financial planning, investor reporting, board presentations, and growth tracking.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">ARR Formula</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p>ARR = Number of Customers × Average Annual Contract Value (ACV)</p>
              <p><strong>Equivalent MRR = ARR ÷ 12</strong></p>
              <p className="pt-2 border-t border-border/50 mt-2">Revenue per Customer per Month = ACV ÷ 12</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Key ARR Metrics</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground space-y-2">
              <p><strong className="text-foreground">New ARR:</strong> Revenue added from new customer acquisition during the period.</p>
              <p><strong className="text-foreground">Expansion ARR:</strong> Additional revenue from existing customers (upsells, cross-sells, price increases).</p>
              <p><strong className="text-foreground">Contraction ARR:</strong> Revenue lost from existing customers downgrading their plans.</p>
              <p><strong className="text-foreground">Churned ARR:</strong> Revenue lost from customers who cancel entirely.</p>
              <p><strong className="text-foreground">Net New ARR:</strong> New ARR + Expansion ARR - Contraction ARR - Churned ARR.</p>
              <p><strong className="text-foreground">Net Revenue Retention (NRR):</strong> (Starting ARR - Churn - Contraction + Expansion) / Starting ARR.</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Scenario: A B2B SaaS company with:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Number of Customers: 500</li>
                <li>Average Annual Contract Value (ACV): $2,400/year ($200/month)</li>
                <li>ARR = 500 × $2,400 = <strong>$1,200,000 / year</strong></li>
                <li>Equivalent MRR = $1,200,000 ÷ 12 = <strong>$100,000 / month</strong></li>
                <li>Revenue per Customer per Month = $2,400 ÷ 12 = <strong>$200 / month</strong></li>
              </ul>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">ARR Benchmarks by Stage</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="pb-2 pr-4 font-medium text-foreground">Stage</th>
                    <th className="pb-2 pr-4 font-medium text-foreground">ARR Range</th>
                    <th className="pb-2 font-medium text-foreground">YoY Growth Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr><td className="py-2 pr-4">Seed / Early</td><td className="py-2 pr-4">$0 - $2M</td><td className="py-2">100-200%</td></tr>
                  <tr><td className="py-2 pr-4">Growth / Series A</td><td className="py-2 pr-4">$2M - $10M</td><td className="py-2">40-100%</td></tr>
                  <tr><td className="py-2 pr-4">Scale / Series B</td><td className="py-2 pr-4">$10M - $50M</td><td className="py-2">20-40%</td></tr>
                  <tr><td className="py-2 pr-4">Expansion / Late</td><td className="py-2 pr-4">$50M - $100M</td><td className="py-2">15-30%</td></tr>
                  <tr><td className="py-2 pr-4">Enterprise / Public</td><td className="py-2 pr-4">$100M+</td><td className="py-2">10-20%</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Tips for Growing ARR</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground space-y-2">
              <p>1. <strong className="text-foreground">Increase ACV:</strong> Add premium features, enterprise tiers, and usage-based pricing to boost per-customer revenue.</p>
              <p>2. <strong className="text-foreground">Reduce Churn:</strong> Implement customer success programs, onboarding automation, and proactive support.</p>
              <p>3. <strong className="text-foreground">Annual Contracts:</strong> Incentivize annual prepaid plans with discounts - they improve cash flow and reduce churn risk.</p>
              <p>4. <strong className="text-foreground">Expand Revenue:</strong> Cross-sell complementary products and services to existing customers.</p>
              <p>5. <strong className="text-foreground">Target Enterprise:</strong> Enterprise customers typically have 3-5× higher ACV and lower churn than SMB customers.</p>
              <p>6. <strong className="text-foreground">Improve Sales Efficiency:</strong> Optimize CAC payback period to under 12 months for maximum growth reinvestment.</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Common ARR Mistakes to Avoid</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground space-y-2">
              <p>1. <strong className="text-foreground">Counting Non-Recurring Revenue:</strong> Setup fees, implementation fees, and one-time services are not ARR.</p>
              <p>2. <strong className="text-foreground">Ignoring Contract Start Dates:</strong> Revenue should be recognized ratably &mdash; don&apos;t count full-year revenue for a contract signed this month.</p>
              <p>3. <strong className="text-foreground">Not Differentiating CARR:</strong> Committed ARR (signed contracts) is different from total ARR (includes month-to-month).</p>
              <p>4. <strong className="text-foreground">Overlooking Discounts:</strong> Track net ARR after discounts, not just gross billed amounts.</p>
              <p>5. <strong className="text-foreground">Not Segmenting by Cohort:</strong> ARR by customer cohort, plan type, and acquisition channel reveals true growth drivers and risks.</p>
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
          <SliderField label="Avg Annual Contract Value (ACV)" icon={DollarSign} value={acv} symbol={cfg.symbol} min={12} max={1000000} step={12} currencyCode={currency} />
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-emerald-500/10 to-primary/10 border border-emerald-500/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground font-medium">Annual Recurring Revenue</p>
            </div>
            <p className="text-4xl font-extrabold text-primary break-words">
              {formatCurrency(results.arr, currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              per year from {results.customers.toLocaleString()} customers
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard icon={Users} label="Total Customers" value={results.customers.toLocaleString()} color="text-blue-500" />
            <MetricCard icon={DollarSign} label="Avg Contract Value (ACV)" value={formatCurrency(results.acv, currency)} color="text-indigo-500" />
          </div>

          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Equivalent Monthly Revenue
            </p>
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground mb-1">Equivalent MRR</p>
              <p className="text-3xl font-bold text-emerald-500">
                {formatCurrency(results.mrr, currency)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ARR &divide; 12 months = {formatCurrency(results.revenuePerCustomerPerMonth, currency)}/customer/month
              </p>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              ARR Breakdown
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
                    <span className="font-medium">{item.name === "Paying Customers" ? item.value.toLocaleString() : formatCurrency(item.value, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 text-sm border-t border-border/50 pt-3">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Paying Customers</span>
                <span className="font-medium">{results.customers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Avg Revenue / Customer / Year</span>
                <span className="font-medium">{formatCurrency(results.acv, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Revenue / Customer / Month</span>
                <span className="font-medium">{formatCurrency(results.revenuePerCustomerPerMonth, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Equivalent Monthly Revenue</span>
                <span className="font-medium">{formatCurrency(results.mrr, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-medium">Annual Recurring Revenue</span>
                <span className="font-bold text-primary">{formatCurrency(results.arr, currency)}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Total ARR</p>
                <p className="text-sm font-semibold">{formatCurrency(results.arr, currency)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Equivalent MRR</p>
                <p className="text-sm font-semibold text-emerald-500">{formatCurrency(results.mrr, currency)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Avg Contract Value</p>
                <p className="text-sm font-semibold">{formatCurrency(results.acv, currency)}</p>
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
