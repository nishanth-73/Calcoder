"use client";

import { useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { cn } from "@/lib/utils";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Calculator, DollarSign, ShoppingCart, Users, Percent, CreditCard, TrendingUp, BarChart3, RefreshCw } from "lucide-react";
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
  { name: "ARR Calculator", href: "/marketing/arr-calculator", desc: "Calculate Annual Recurring Revenue for SaaS businesses." },
  { name: "Burn Rate Calculator", href: "/marketing/burn-rate-calculator", desc: "Calculate startup monthly burn rate and runway." },
  { name: "CAC Calculator", href: "/marketing/cac-calculator", desc: "Calculate customer acquisition cost and payback period." },
  { name: "Churn Rate Calculator", href: "/marketing/churn-rate-calculator", desc: "Calculate customer churn rate and retention metrics." },
  { name: "CPC Calculator", href: "/marketing/cpc-calculator", desc: "Calculate cost per click for advertising campaigns." },
  { name: "ROAS Calculator", href: "/marketing/roas-calculator", desc: "Calculate return on ad spend for marketing ROI." },
  { name: "CPM Calculator", href: "/marketing/cpm-calculator", desc: "Calculate cost per mille for ad impressions." },
];

export default function LtvCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const pv = useNumericField(50);
  const freq = useNumericField(2);
  const life = useNumericField(24);
  const mg = useNumericField(50);

  const results = useMemo(() => {
    const purchaseValue = pv.value;
    const frequency = freq.value;
    const lifespan = life.value;
    const margin = mg.value;
    const purchasesPerYear = frequency * 12;
    const revenuePerCustomer = purchaseValue * frequency * lifespan;
    const ltv = revenuePerCustomer * (margin / 100);
    const monthlyValue = purchaseValue * frequency * (margin / 100);
    const annualValue = monthlyValue * 12;
    const churnRate = lifespan > 0 ? (1 / lifespan) * 100 : 0;
    return {
      ltv,
      purchaseValue,
      frequency,
      lifespan,
      margin,
      purchasesPerYear,
      revenuePerCustomer,
      monthlyValue,
      annualValue,
      churnRate,
    };
  }, [pv.value, freq.value, life.value, mg.value]);

  const cfg = getCurrency(currency);

  const chartData = useMemo(() => [
    { name: "Avg Purchase Value", value: Math.max(0, results.purchaseValue) },
    { name: "Monthly Spend", value: Math.max(0, results.purchaseValue * results.frequency) },
    { name: "Revenue per Customer", value: Math.max(0, results.revenuePerCustomer) },
    { name: "LTV (Gross Profit)", value: Math.max(0, results.ltv) },
  ], [results]);

  return (
    <ToolLayout
      title="LTV Calculator"
      description="Calculate Customer Lifetime Value - estimate the total revenue and gross profit a business can expect from a single customer account throughout the business relationship."
      category="marketing"
      faqContent={[
        {
          question: "What is Customer Lifetime Value (LTV)?",
          answer: "Customer Lifetime Value (LTV or CLV) is a metric that estimates the total revenue a business can reasonably expect from a single customer account throughout the business relationship. It helps businesses understand how much they can spend on customer acquisition and retention. LTV is calculated as: Average Purchase Value × Purchase Frequency × Average Customer Lifespan × Gross Margin. It is one of the most important metrics for understanding unit economics.",
        },
        {
          question: "How is LTV calculated?",
          answer: "LTV = Average Purchase Value × Purchase Frequency (per month) × Average Customer Lifespan (in months) × (Gross Margin ÷ 100). For example, if customers spend $50 per purchase, purchase 2 times per month, stay for 24 months, with a 50% gross margin: LTV = $50 × 2 × 24 × 0.50 = $1,200. The revenue per customer before margin is $50 × 2 × 24 = $2,400.",
        },
        {
          question: "Why is gross margin important in LTV calculation?",
          answer: "Gross margin accounts for the cost of goods sold, giving you a more accurate picture of profit rather than just revenue. A high LTV with low margins may not be as valuable as a moderate LTV with high margins. Including margin helps you compare customer value across different products or services. For SaaS businesses with 70-80%+ gross margins, LTV is significantly higher relative to revenue compared to retail businesses with 30-50% margins.",
        },
        {
          question: "What is a good LTV?",
          answer: "A good LTV depends on your industry and business model. Generally, your LTV should be at least 3× your Customer Acquisition Cost (CAC) for a sustainable business. SaaS companies often target a 5:1 LTV-to-CAC ratio. Higher LTV indicates more valuable customer relationships and better unit economics. For e-commerce, an LTV of $200-500 is common, while enterprise SaaS can have LTV of $50,000+.",
        },
        {
          question: "How does purchase frequency affect LTV?",
          answer: "Purchase frequency is one of the most powerful levers for increasing LTV. A customer who buys twice per month vs. once per month effectively doubles their LTV. Strategies to increase frequency include: subscription programs, loyalty rewards, personalized recommendations, email marketing automation, and seasonal promotions. Even small increases in frequency compound significantly over the customer's lifespan.",
        },
        {
          question: "What is the relationship between churn rate and LTV?",
          answer: "Churn rate and LTV are inversely related. A lower churn rate means customers stay longer, which increases lifespan and therefore LTV. If your monthly churn rate is 5%, average lifespan is 20 months (1 ÷ 0.05). If you reduce churn to 2.5%, lifespan doubles to 40 months, doubling your LTV. This is why retention improvements have such dramatic effects on profitability.",
        },
        {
          question: "How does LTV help with CAC (Customer Acquisition Cost)?",
          answer: "LTV helps determine how much you can afford to spend on acquiring customers. The standard benchmark is an LTV-to-CAC ratio of at least 3:1. If your LTV is $1,200, you can spend up to $400 to acquire a customer while maintaining healthy unit economics. A ratio below 1:1 means you're losing money on every customer. A ratio above 5:1 may indicate you're under-investing in growth.",
        },
        {
          question: "What factors most impact LTV?",
          answer: "The factors that most impact LTV are: (1) Customer retention / lifespan - doubling lifespan doubles LTV; (2) Gross margin - higher margins directly increase profit LTV; (3) Purchase frequency - more frequent purchases compound LTV; (4) Average order value - higher-value purchases increase both revenue and profit LTV; (5) Referral value - customers who refer others have indirect LTV impact beyond their own purchases.",
        },
        {
          question: "How is LTV used for customer segmentation?",
          answer: "LTV is essential for customer segmentation and personalization. High-LTV customers deserve premium support, exclusive offers, and loyalty programs. Medium-LTV customers should be targeted with upsells and cross-sells. Low-LTV customers may need re-engagement campaigns or may not be worth the marketing investment. Segmenting by LTV helps allocate marketing budgets and sales resources efficiently.",
        },
        {
          question: "What common mistakes do companies make with LTV?",
          answer: "Common LTV mistakes include: (1) Using average values instead of segmenting by customer cohort; (2) Excluding gross margin and treating revenue as profit; (3) Using historical data without accounting for changing behavior; (4) Ignoring the time value of money - future revenue should be discounted; (5) Not tracking LTV by acquisition channel, which leads to misallocated marketing spend; (6) Forgetting to include support and service costs.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a Customer Lifetime Value Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              An LTV Calculator helps businesses estimate the total value a customer brings over their entire relationship with the company.
              By entering average purchase value, purchase frequency, customer lifespan, and gross margin, you get an instant
              calculation of customer lifetime value, total revenue per customer, and monthly/annual value. This metric is crucial
              for understanding marketing ROI, pricing strategies, customer acquisition budgets, and overall business health.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">LTV Formula</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p>Revenue per Customer = Avg Purchase Value × Purchase Frequency × Lifespan</p>
              <p><strong>LTV = Revenue per Customer × (Gross Margin ÷ 100)</strong></p>
              <p className="pt-2 border-t border-border/50 mt-2">Monthly Value = Avg Purchase Value × Purchase Frequency × (Gross Margin ÷ 100)</p>
              <p>Annual Value = Monthly Value × 12</p>
              <p>Implied Churn Rate = (1 ÷ Lifespan in months) × 100</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Key LTV Metrics</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground space-y-2">
              <p><strong className="text-foreground">Average Purchase Value:</strong> The average amount a customer spends per transaction.</p>
              <p><strong className="text-foreground">Purchase Frequency:</strong> How often a customer makes a purchase (per month).</p>
              <p><strong className="text-foreground">Customer Lifespan:</strong> The average duration a customer continues buying (in months).</p>
              <p><strong className="text-foreground">Gross Margin:</strong> The percentage of revenue retained after COGS (Cost of Goods Sold).</p>
              <p><strong className="text-foreground">LTV:CAC Ratio:</strong> LTV divided by Customer Acquisition Cost - target 3:1 or higher.</p>
              <p><strong className="text-foreground">Churn Rate:</strong> The rate at which customers stop doing business (1 / lifespan).</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Scenario: Online retail store with the following metrics:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Average Purchase Value: $50 per order</li>
                <li>Purchase Frequency: 2 orders per month</li>
                <li>Average Customer Lifespan: 24 months (2 years)</li>
                <li>Gross Margin: 50%</li>
                <li>Purchases per Year: 2 × 12 = <strong>24 purchases/year</strong></li>
                <li>Revenue per Customer = $50 × 2 × 24 = <strong>$2,400</strong></li>
                <li><strong>LTV = $2,400 × 0.50 = $1,200</strong></li>
                <li>Monthly Value = $50 × 2 × 0.50 = <strong>$50/month</strong></li>
                <li>Implied Churn Rate = 1 ÷ 24 = <strong>4.17% / month</strong></li>
              </ul>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">LTV Benchmarks by Industry</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="pb-2 pr-4 font-medium text-foreground">Industry</th>
                    <th className="pb-2 pr-4 font-medium text-foreground">Typical LTV</th>
                    <th className="pb-2 font-medium text-foreground">LTV:CAC Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr><td className="py-2 pr-4">E-Commerce / Retail</td><td className="py-2 pr-4">$200 - $500</td><td className="py-2">3:1</td></tr>
                  <tr><td className="py-2 pr-4">SaaS (SMB)</td><td className="py-2 pr-4">$2,000 - $10,000</td><td className="py-2">5:1</td></tr>
                  <tr><td className="py-2 pr-4">SaaS (Enterprise)</td><td className="py-2 pr-4">$50,000+</td><td className="py-2">5:1 - 10:1</td></tr>
                  <tr><td className="py-2 pr-4">Media / Publishing</td><td className="py-2 pr-4">$100 - $500</td><td className="py-2">3:1</td></tr>
                  <tr><td className="py-2 pr-4">Financial Services</td><td className="py-2 pr-4">$1,000 - $5,000</td><td className="py-2">4:1</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Tips for Increasing LTV</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground space-y-2">
              <p>1. <strong className="text-foreground">Improve Retention:</strong> Reduce churn by 5% to increase profits by 25-95% (Bain & Company).</p>
              <p>2. <strong className="text-foreground">Increase Order Value:</strong> Product bundles, volume discounts, and upsells at checkout.</p>
              <p>3. <strong className="text-foreground">Boost Frequency:</strong> Subscription models, loyalty programs, and regular email campaigns.</p>
              <p>4. <strong className="text-foreground">Improve Margins:</strong> Optimize supply chain, reduce COGS, and increase prices strategically.</p>
              <p>5. <strong className="text-foreground">Customer Education:</strong> Onboarding and training increase product adoption and reduce churn.</p>
              <p>6. <strong className="text-foreground">Personalization:</strong> Tailored recommendations and communications increase engagement and spend.</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Common LTV Mistakes to Avoid</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground space-y-2">
              <p>1. <strong className="text-foreground">Using Averages Across All Customers:</strong> Segment by cohort, channel, and product to get meaningful LTV insights.</p>
              <p>2. <strong className="text-foreground">Ignoring Gross Margin:</strong> Revenue LTV without margin overstates the true profit contribution.</p>
              <p>3. <strong className="text-foreground">Not Discounting Future Cash Flows:</strong> Money earned in the future is worth less - use a discount rate of 10-15% for accurate LTV.</p>
              <p>4. <strong className="text-foreground">Forgetting Service Costs:</strong> Support, onboarding, and retention program costs reduce net LTV.</p>
              <p>5. <strong className="text-foreground">Overly Optimistic Lifespan:</strong> Base lifespan on actual cohort data, not idealized assumptions about retention.</p>
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

          <SliderField label="Average Purchase Value" icon={ShoppingCart} value={pv} symbol={cfg.symbol} min={1} max={10000} step={1} currencyCode={currency} />
          <SliderField label="Purchase Frequency (per month)" icon={RefreshCw} value={freq} symbol="" min={0.1} max={50} step={0.1} formatValue={(n) => `${n.toFixed(1)}× / month`} />
          <SliderField label="Customer Lifespan (months)" icon={Users} value={life} symbol="" min={1} max={120} step={1} formatValue={(n) => `${n} ${n === 1 ? "mo" : "mos"}`} />
          <SliderField label="Gross Margin" icon={Percent} value={mg} symbol="" min={1} max={100} step={0.5} formatValue={(n) => `${n.toFixed(1)}%`} />
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-emerald-500/10 to-primary/10 border border-emerald-500/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground font-medium">Customer Lifetime Value (LTV)</p>
            </div>
            <p className="text-4xl font-extrabold text-primary break-words">
              {formatCurrency(results.ltv, currency)}
            </p>
            {results.revenuePerCustomer > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Gross profit per customer over {results.lifespan} months ({results.margin.toFixed(0)}% margin)
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard icon={ShoppingCart} label="Purchases per Year" value={`${results.purchasesPerYear.toFixed(1)}×`} color="text-blue-500" iconColor="text-blue-500" />
            <MetricCard icon={DollarSign} label="Revenue per Customer" value={formatCurrency(results.revenuePerCustomer, currency)} color="text-indigo-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard icon={TrendingUp} label="Monthly Value (Gross)" value={formatCurrency(results.monthlyValue, currency)} color="text-emerald-500" iconColor="text-emerald-500" />
            <MetricCard icon={BarChart3} label="Annual Value (Gross)" value={formatCurrency(results.annualValue, currency)} color="text-orange-500" iconColor="text-orange-500" />
          </div>

          <div className="bg-white border border-border rounded-xl p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              LTV Breakdown
            </p>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-32 h-32 flex-shrink-0 mx-auto">
                <ResponsiveContainer initialDimension={{width:100,height:100}} width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" strokeWidth={0}>
                      {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip formatter={(val: any) => formatCurrency(Number(val) || 0, currency)} />
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
                    <span className="font-medium">{formatCurrency(item.value, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 text-sm border-t border-border/50 pt-3">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Avg Purchase Value</span>
                <span className="font-medium">{formatCurrency(results.purchaseValue, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Purchase Frequency</span>
                <span className="font-medium">{results.frequency.toFixed(1)}× / month</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Customer Lifespan</span>
                <span className="font-medium">{results.lifespan} months ({results.lifespan >= 12 ? `${(results.lifespan / 12).toFixed(1)} years` : `${results.lifespan} months`})</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Gross Margin</span>
                <span className="font-medium">{results.margin.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Implied Churn Rate</span>
                <span className="font-medium">{results.churnRate.toFixed(2)}% / month</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Revenue per Customer</span>
                <span className="font-medium">{formatCurrency(results.revenuePerCustomer, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-medium">LTV (Gross Profit)</span>
                <span className="font-bold text-primary">{formatCurrency(results.ltv, currency)}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Revenue per Customer</p>
                <p className="text-sm font-semibold">{formatCurrency(results.revenuePerCustomer, currency)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Monthly Value</p>
                <p className="text-sm font-semibold text-emerald-500">{formatCurrency(results.monthlyValue, currency)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">LTV</p>
                <p className="text-sm font-semibold">{formatCurrency(results.ltv, currency)}</p>
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
