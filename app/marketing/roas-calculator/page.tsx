"use client";

import { useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import {
  Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip,
} from "recharts";
import {
  DollarSign, TrendingUp, BadgePercent, FileText, Wallet,
  BarChart3, ArrowUpRight, ShoppingCart, AlertTriangle, CheckCircle2,
  Target, Info,
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

function formatNumber(n: number): string {
  if (!Number.isFinite(n) || isNaN(n)) return "0";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPercent(n: number): string {
  if (!Number.isFinite(n) || isNaN(n)) return "0%";
  return `${n.toFixed(2)}%`;
}

const CHART_COLORS = ["#10b981", "#f43f5e", "#6366f1", "#f59e0b"];

const RELATED_TOOLS = [
  { name: "ROI Calculator", href: "/marketing/roi-calculator", desc: "Calculate return on investment including all costs." },
  { name: "CPC Calculator", href: "/marketing/cpc-calculator", desc: "Calculate cost per click for your ad campaigns." },
  { name: "CPM Calculator", href: "/marketing/cpm-calculator", desc: "Calculate cost per mille (thousand impressions)." },
  { name: "CAC Calculator", href: "/marketing/cac-calculator", desc: "Calculate customer acquisition cost." },
  { name: "CTR Calculator", href: "/marketing/ctr-calculator", desc: "Calculate click-through rate for your ads." },
  { name: "LTV Calculator", href: "/marketing/ltv-calculator", desc: "Calculate customer lifetime value." },
  { name: "AdSense Calculator", href: "/marketing/adsense-calculator", desc: "Estimate AdSense earnings potential." },
  { name: "Profit Margin Calculator", href: "/finance/profit-margin-calculator", desc: "Calculate profit margins on products." },
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

export default function RoasCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");

  const adSpend = useNumericField(1000);
  const revenue = useNumericField(5000);

  const results = useMemo(() => {
    const spend = Math.max(0, adSpend.value);
    const rev = Math.max(0, revenue.value);

    const roasRatio = spend > 0 ? rev / spend : 0;
    const roasPercent = spend > 0 ? (rev / spend) * 100 : 0;
    const netProfit = rev - spend;
    const profitMargin = rev > 0 ? ((rev - spend) / rev) * 100 : 0;
    const revPerDollar = spend > 0 ? rev / spend : 0;
    const costRatio = rev > 0 ? (spend / rev) * 100 : (spend === 0 ? 0 : 100);

    let status: "profitable" | "breakeven" | "losing";
    if (spend === 0 && rev === 0) status = "breakeven";
    else if (rev > spend) status = "profitable";
    else if (rev === spend) status = "breakeven";
    else status = "losing";

    const spendCoverage = spend > 0 && rev > 0
      ? Math.min(100, (rev / spend) * 100)
      : 0;

    return {
      roasRatio, roasPercent, netProfit, profitMargin,
      revPerDollar, costRatio, status, spendCoverage,
    };
  }, [adSpend.value, revenue.value]);

  const chartData = useMemo(() => {
    const rev = Math.max(0, revenue.value);
    const spend = Math.max(0, adSpend.value);
    const profit = Math.max(0, results.netProfit);
    const loss = results.netProfit < 0 ? Math.abs(results.netProfit) : 0;

    if (profit > 0) {
      return [
        { name: "Revenue", value: rev },
        { name: "Ad Spend", value: spend - profit > 0 ? spend : 0 },
        { name: "Net Profit", value: profit },
      ].filter((d) => d.value > 0);
    }
    return [
      { name: "Revenue", value: rev },
      { name: "Ad Spend", value: spend },
      { name: "Net Loss", value: loss || 1 },
    ].filter((d) => d.value > 0);
  }, [revenue.value, adSpend.value, results.netProfit]);

  const cfg = getCurrency(currency);

  const statusConfig = {
    profitable: {
      label: "Profitable",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    breakeven: {
      label: "Breakeven",
      icon: Target,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    losing: {
      label: "Loss Making",
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
  };

  const st = statusConfig[results.status];

  const roasScalePercent = Math.min(100, (results.roasRatio / 12) * 100);

  return (
    <ToolLayout
      title="ROAS Calculator"
      description="Calculate Return on Ad Spend (ROAS) to measure the effectiveness and profitability of your marketing campaigns. Free online ROAS calculator with instant results, charts, and detailed breakdown."
      category="marketing"
      faqContent={[
        {
          question: "What is ROAS (Return on Ad Spend)?",
          answer: "ROAS (Return on Ad Spend) is a marketing metric that measures the revenue generated for every dollar spent on advertising. It is calculated by dividing total revenue by total ad spend. ROAS helps marketers evaluate campaign effectiveness, compare performance across channels, and make data-driven budget allocation decisions. A ROAS of 4:1 means you earn \$4 for every \$1 spent on advertising.",
        },
        {
          question: "How is ROAS calculated?",
          answer: "ROAS = Total Revenue ÷ Total Ad Spend. For example, if you spend \$1,000 on ads and generate \$5,000 in revenue, your ROAS is \$5,000 ÷ \$1,000 = 5:1 (500%). This means for every dollar spent, you earned \$5 in revenue. A ROAS of 1:1 (100%) means you break even - your revenue equals your ad spend. You can also calculate Net Profit = Revenue - Ad Spend and Profit Margin = (Revenue - Ad Spend) ÷ Revenue × 100.",
        },
        {
          question: "What is a good ROAS?",
          answer: "A good ROAS depends on your profit margins and business model. Generally: 1:1 (100%) = Breakeven, 2:1-3:1 (200-300%) = Below average, 4:1-5:1 (400-500%) = Good, 6:1-8:1 (600-800%) = Very good, 8:1+ (800%+) = Excellent. E-commerce typically targets 4:1, SaaS companies target 3:1, and lead generation campaigns target 5:1 or higher. Consider your profit margins - a 3:1 ROAS with 50% margins may be better than 8:1 with 10% margins.",
        },
        {
          question: "What is break-even ROAS?",
          answer: "Break-even ROAS is the minimum ROAS needed to cover your product costs and ad spend without losing money. It is calculated as: 1 ÷ Profit Margin × 100. If your profit margin is 25%, your break-even ROAS is 1 ÷ 0.25 = 4:1 (400%). Any ROAS above 4:1 generates profit; anything below results in a loss. Knowing your break-even ROAS helps you set realistic campaign targets and decide when to pause underperforming ads.",
        },
        {
          question: "What is the difference between ROAS and ROI?",
          answer: "ROAS (Return on Ad Spend) measures revenue against advertising costs only. ROI (Return on Investment) considers all costs including product costs, overhead, and other expenses. ROAS is a narrower metric focused purely on ad efficiency, while ROI gives a more complete picture of overall campaign profitability. A campaign can have a high ROAS but low ROI if product costs are high. For a complete financial picture, track both metrics together.",
        },
        {
          question: "How can I improve my ROAS?",
          answer: "To improve ROAS: 1) Optimize audience targeting to reach higher-intent users, 2) Improve landing page conversion rates through A/B testing, 3) Test different ad creatives and copy, 4) Use negative keywords to filter irrelevant traffic, 5) Implement retargeting campaigns for warm audiences, 6) Focus on high-margin products or services, 7) Optimize bid strategies based on ROAS targets, 8) Analyze ROAS by channel and reallocate budget to best performers, 9) Use ad scheduling to run ads during peak conversion times, 10) Improve ad relevance scores and quality ratings.",
        },
        {
          question: "How does ROAS vary by advertising channel?",
          answer: "ROAS varies significantly by channel: Google Search (4:1-8:1+) - highest due to purchase intent; Google Shopping (3:1-6:1) - strong for e-commerce; Facebook/Instagram (2:1-5:1) - good for targeting but lower intent; LinkedIn (1:1-3:1) - higher cost but quality B2B leads; TikTok (1:1-4:1) - variable, best for viral products; Display/Programmatic (1:1-3:1) - lowest intent, brand awareness; Email Marketing (20:1-40:1) - highest ROAS but limited scale. Cross-channel attribution is critical for accurate comparison.",
        },
        {
          question: "What is the difference between ROAS and profit margin?",
          answer: "ROAS measures revenue against ad spend: ROAS = Revenue ÷ Ad Spend. Profit margin measures profit against revenue: Profit Margin = (Revenue - All Costs) ÷ Revenue × 100. A campaign can have a 5:1 ROAS (earn 5× ad spend) but only a 20% profit margin after product costs, overhead, and other expenses. ROAS tells you if your ads are efficient; profit margin tells you if your business is profitable. Both are essential for complete campaign analysis.",
        },
        {
          question: "What factors affect ROAS the most?",
          answer: "The biggest factors affecting ROAS are: 1) Audience targeting accuracy - reaching users with purchase intent, 2) Conversion rate optimization - a 10% improvement can double ROAS, 3) Ad creative quality - compelling visuals and copy drive clicks, 4) Landing page experience - fast loading, clear CTAs, mobile-friendly, 5) Product pricing and margins, 6) Seasonality - holiday seasons often see higher ROAS, 7) Competition level - higher CPCs in competitive markets reduce ROAS, 8) Attribution window - longer windows capture more conversions, 9) Ad fatigue - stale creatives lead to declining performance, 10) Market saturation - diminishing returns on increased spend.",
        },
        {
          question: "How often should I track ROAS?",
          answer: "ROAS should be tracked at multiple levels: Daily - monitor active campaigns for sudden drops or spikes; Weekly - review performance trends and adjust bids/budgets; Monthly - analyze channel-level ROAS and reallocate budget; Quarterly - deep dive into ROAS by product, audience, and campaign type for strategic planning. Track ROAS by campaign, ad set, ad, keyword, device, time of day, audience segment, and geographic location for granular optimization. Set up automated alerts for ROAS below your target threshold.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a ROAS Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A ROAS (Return on Ad Spend) Calculator helps advertisers and marketers measure the effectiveness of their
              advertising campaigns. By comparing <strong>total ad spend</strong> against{" "}
              <strong>total revenue generated</strong>, you get a clear picture of how well your marketing budget is
              performing and whether your campaigns are truly profitable.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p><strong>ROAS Ratio = Total Revenue ÷ Total Ad Spend</strong></p>
              <p>ROAS Percentage = (Revenue ÷ Ad Spend) × 100</p>
              <p>Net Profit = Revenue - Ad Spend</p>
              <p>Profit Margin = (Revenue - Ad Spend) ÷ Revenue × 100</p>
              <p>Revenue per \$1 Spent = Revenue ÷ Ad Spend</p>
              <p>Cost Ratio = (Ad Spend ÷ Revenue) × 100</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Key Metrics Explained</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  metric: "ROAS Ratio",
                  desc: "The primary metric showing revenue earned per dollar spent. A 5:1 ratio means \$5 earned for every \$1 spent.",
                },
                {
                  metric: "Net Profit",
                  desc: "Total revenue minus ad spend. This is your actual profit from the campaign before other costs.",
                },
                {
                  metric: "Profit Margin",
                  desc: "The percentage of revenue that remains as profit after ad costs. Higher margins mean more efficient campaigns.",
                },
                {
                  metric: "Revenue per \$1",
                  desc: "Shows exactly how many dollars you earn for each dollar invested in advertising.",
                },
                {
                  metric: "Cost Ratio",
                  desc: "The percentage of revenue consumed by advertising costs. Lower is better.",
                },
                {
                  metric: "Break-even ROAS",
                  desc: "The minimum ROAS needed to cover costs. Depends on your product profit margins.",
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
                Scenario: You spend \$5,000 on Google Ads and generate \$25,000 in revenue.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>ROAS = \$25,000 ÷ \$5,000 = <strong>5:1 (500%)</strong></li>
                <li>Net Profit = \$25,000 - \$5,000 = <strong>\$20,000</strong></li>
                <li>Profit Margin = (\$25,000 - \$5,000) ÷ \$25,000 × 100 = <strong>80%</strong></li>
                <li>Revenue per \$1 = \$25,000 ÷ \$5,000 = <strong>\$5.00</strong></li>
              </ul>
              <p className="mt-2">
                For every dollar spent on ads, you earned \$5 in revenue, with an 80% profit margin and \$20,000
                in net profit from the campaign.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">ROAS Benchmarks by Channel</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-semibold">Channel</th>
                    <th className="text-right py-2 font-semibold">Average ROAS</th>
                    <th className="text-right py-2 font-semibold">Good ROAS</th>
                    <th className="text-right py-2 font-semibold">Excellent</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    ["Google Search", "4:1", "6:1", "8:1+"],
                    ["Google Shopping", "3:1", "5:1", "7:1+"],
                    ["Facebook/Instagram", "2:1", "4:1", "6:1+"],
                    ["LinkedIn", "1:1", "2:1", "3:1+"],
                    ["TikTok", "1:1", "3:1", "5:1+"],
                    ["Display Ads", "1:1", "2:1", "3:1+"],
                    ["Email Marketing", "20:1", "30:1", "40:1+"],
                  ].map(([channel, avg, good, exc]) => (
                    <tr key={channel} className="border-b border-border/50">
                      <td className="py-2">{channel}</td>
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
            <h3 className="text-lg font-semibold mb-3">Tips to Improve ROAS</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
              <li><strong>Refine audience targeting</strong> - Use lookalike audiences, retargeting, and custom segments to reach high-intent users.</li>
              <li><strong>Improve conversion rates</strong> - A/B test landing pages, simplify checkout, add social proof, and optimize for mobile.</li>
              <li><strong>Use negative keywords</strong> - Filter out irrelevant search terms that waste budget on non-converting clicks.</li>
              <li><strong>Optimize ad creatives</strong> - Test different headlines, images, CTAs, and ad formats to find what resonates.</li>
              <li><strong>Implement retargeting</strong> - Re-engage users who visited your site but didn't convert - they convert at higher rates.</li>
              <li><strong>Focus on high-margin products</strong> - Promote products with better profit margins to maximize overall profitability.</li>
              <li><strong>Analyze by channel</strong> - Measure ROAS separately for each channel and reallocate budget to the best performers.</li>
              <li><strong>Use ad scheduling</strong> - Run ads during peak conversion hours and days when your audience is most active.</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Common Mistakes to Avoid</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              <li><strong>Looking at ROAS in isolation</strong> - A high ROAS doesn't mean high profits if margins are thin. Always consider profit margins alongside ROAS.</li>
              <li><strong>Using wrong attribution window</strong> - Last-click attribution undervalues upper-funnel channels. Use data-driven or multi-touch attribution.</li>
              <li><strong>Ignoring customer LTV</strong> - A low initial ROAS may be acceptable if customers have high lifetime value. Consider LTV:CAC ratio as well.</li>
              <li><strong>Setting and forgetting</strong> - ROAS changes over time. Continuously monitor and optimize campaigns based on performance data.</li>
              <li><strong>Comparing across industries blindly</strong> - ROAS benchmarks vary significantly by industry, business model, and sales cycle.</li>
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
            label={`Total Ad Spend (${cfg.symbol})`}
            icon={Wallet}
            value={adSpend.value}
            displayValue={adSpend.displayValue}
            onChange={(e) => adSpend.setValue(parseFloat(e.target.value))}
            onTextChange={adSpend.handleChange}
            onFocus={adSpend.handleFocus}
            onBlur={adSpend.handleBlur}
            min={10}
            max={10000000}
            step={10}
            formatDisplay={formatCurrency(adSpend.value, currency)}
            prefix={cfg.symbol}
          />
          <SliderField
            label={`Total Revenue Generated (${cfg.symbol})`}
            icon={ShoppingCart}
            value={revenue.value}
            displayValue={revenue.displayValue}
            onChange={(e) => revenue.setValue(parseFloat(e.target.value))}
            onTextChange={revenue.handleChange}
            onFocus={revenue.handleFocus}
            onBlur={revenue.handleBlur}
            min={0}
            max={100000000}
            step={10}
            formatDisplay={formatCurrency(revenue.value, currency)}
            prefix={cfg.symbol}
          />
        </div>

        <div className="space-y-4">
          <div
            className={`bg-gradient-to-br from-emerald-500/10 to-primary/10 ${st.border} rounded-xl p-6 text-center`}
          >
            <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Return on Ad Spend
            </p>
            <p className="text-4xl font-extrabold text-foreground">
              {results.roasRatio.toFixed(2)}:1
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {formatPercent(results.roasPercent)}
            </p>
            <div
              className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold mt-2 ${st.bg} ${st.color}`}
            >
              <st.icon className="w-3 h-3" />
              {st.label}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Net Profit"
              value={
                results.netProfit >= 0
                  ? formatCurrency(results.netProfit, currency)
                  : `-${formatCurrency(Math.abs(results.netProfit), currency)}`
              }
              icon={DollarSign}
              valueClassName={
                results.netProfit >= 0 ? "text-emerald-500" : "text-red-500"
              }
              tooltip="Total revenue minus ad spend - your actual campaign profit"
            />
            <MetricCard
              label="Profit Margin"
              value={formatPercent(results.profitMargin)}
              icon={BadgePercent}
              valueClassName={
                results.profitMargin > 0
                  ? "text-emerald-500"
                  : results.profitMargin < 0
                    ? "text-red-500"
                    : ""
              }
              tooltip="Percentage of revenue remaining as profit after ad costs"
            />
            <MetricCard
              label="Revenue per \$1"
              value={`${cfg.symbol}${results.revPerDollar.toFixed(2)}`}
              icon={ArrowUpRight}
              valueClassName={
                results.revPerDollar >= 1
                  ? "text-emerald-500"
                  : "text-red-500"
              }
              tooltip="Revenue earned for each dollar spent on advertising"
            />
            <MetricCard
              label="Cost Ratio"
              value={formatPercent(results.costRatio)}
              icon={BarChart3}
              valueClassName={
                results.costRatio <= 25
                  ? "text-emerald-500"
                  : results.costRatio <= 50
                    ? "text-amber-500"
                    : "text-red-500"
              }
              tooltip="Percentage of revenue consumed by advertising costs"
            />
          </div>

          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <Target className="w-3 h-3" />
              ROAS Performance Scale
            </p>
            <div className="relative h-3 bg-gradient-to-r from-red-400 via-amber-400 via-emerald-400 to-emerald-600 rounded-full overflow-hidden">
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white border-2 border-gray-800 rounded-full transition-all duration-300 z-10"
                style={{ left: `${roasScalePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>0:1</span>
              <span>Poor</span>
              <span>Average</span>
              <span>Good</span>
              <span>12:1+</span>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Financial Breakdown
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
                <span className="text-muted-foreground">Ad Spend</span>
                <span className="font-medium">
                  {formatCurrency(adSpend.value, currency)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Revenue Generated</span>
                <span className="font-medium">
                  {formatCurrency(revenue.value, currency)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Net Profit</span>
                <span
                  className={`font-medium ${results.netProfit >= 0 ? "text-emerald-500" : "text-red-500"}`}
                >
                  {results.netProfit >= 0
                    ? formatCurrency(results.netProfit, currency)
                    : `-${formatCurrency(Math.abs(results.netProfit), currency)}`}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Profit Margin</span>
                <span className="font-medium">
                  {formatPercent(results.profitMargin)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-t border-border/50 pt-1.5">
                <span className="font-semibold">ROAS</span>
                <span className="font-bold text-emerald-500">
                  {results.roasRatio.toFixed(2)}:1 ({formatPercent(results.roasPercent)})
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Ad Spend</p>
                <p className="text-sm font-semibold">{formatCurrency(adSpend.value, currency)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Revenue</p>
                <p className="text-sm font-semibold text-emerald-500">{formatCurrency(revenue.value, currency)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Net Profit</p>
                <p className={`text-sm font-semibold ${results.netProfit >= 0 ? "" : "text-red-500"}`}>{results.netProfit >= 0 ? formatCurrency(results.netProfit, currency) : `-${formatCurrency(Math.abs(results.netProfit), currency)}`}</p>
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
