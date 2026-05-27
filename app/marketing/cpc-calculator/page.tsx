"use client";

import { useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import {
  Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip,
} from "recharts";
import {
  DollarSign, TrendingUp, BadgePercent, FileText, Wallet,
  BarChart3, ArrowUpRight, ShoppingCart, MousePointerClick, Target,
  Info,
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

const CHART_COLORS = ["#10b981", "#f43f5e", "#6366f1"];

const CPC_BENCHMARKS: { label: string; range: [number, number]; color: string; bg: string }[] = [
  { label: "Low", range: [0, 0.5], color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "Average", range: [0.5, 2], color: "text-amber-500", bg: "bg-amber-500/10" },
  { label: "High", range: [2, 5], color: "text-orange-500", bg: "bg-orange-500/10" },
  { label: "Premium", range: [5, Infinity], color: "text-red-500", bg: "bg-red-500/10" },
];

function getCpcStatus(cpc: number): { label: string; color: string; bg: string } {
  if (!Number.isFinite(cpc) || cpc <= 0) return { label: "N/A", color: "text-muted-foreground", bg: "bg-muted/50" };
  for (const b of CPC_BENCHMARKS) {
    if (cpc >= b.range[0] && cpc < b.range[1]) return { label: b.label, color: b.color, bg: b.bg };
  }
  return CPC_BENCHMARKS[3];
}

const RELATED_TOOLS = [
  { name: "ROI Calculator", href: "/marketing/roi-calculator", desc: "Calculate return on investment including all costs." },
  { name: "ROAS Calculator", href: "/marketing/roas-calculator", desc: "Calculate return on ad spend for campaigns." },
  { name: "CPM Calculator", href: "/marketing/cpm-calculator", desc: "Calculate cost per mille for ad campaigns." },
  { name: "CTR Calculator", href: "/marketing/ctr-calculator", desc: "Calculate click-through rate for ads." },
  { name: "CAC Calculator", href: "/marketing/cac-calculator", desc: "Calculate customer acquisition cost." },
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

export default function CpcCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");

  const adSpend = useNumericField(1000);
  const clicks = useNumericField(500);

  const results = useMemo(() => {
    const spend = Math.max(0, adSpend.value);
    const clickCount = Math.max(0, clicks.value);

    const cpc = clickCount > 0 ? spend / clickCount : 0;
    const clicksPerDollar = spend > 0 ? clickCount / spend : 0;
    const effectiveCpc = clickCount > 0 ? spend / clickCount : 0;
    const totalImpressionsEquiv = spend > 0 && cpc > 0 ? (spend / cpc) * 1000 : 0;

    return {
      cpc,
      clicksPerDollar,
      effectiveCpc,
      totalImpressionsEquiv,
    };
  }, [adSpend.value, clicks.value]);

  const chartData = useMemo(() => {
    const spend = Math.max(0, adSpend.value);
    const clickCount = Math.max(0, clicks.value);
    const cpcValue = Math.max(0, results.cpc);
    return [
      { name: "Ad Spend", value: spend > 0 ? spend : 1 },
      { name: "Clicks Value", value: clickCount > 0 && cpcValue > 0 ? clickCount * cpcValue : 1 },
      { name: "CPC Rate", value: cpcValue > 0 ? cpcValue * 100 : 1 },
    ];
  }, [adSpend.value, clicks.value, results.cpc]);

  const cfg = getCurrency(currency);
  const status = getCpcStatus(results.cpc);

  return (
    <ToolLayout
      title="CPC Calculator"
      description="Calculate Cost Per Click (CPC) - determine how much you pay for each click on your ads. Free online CPC calculator with instant results, charts, and detailed breakdown."
      category="marketing"
      faqContent={[
        {
          question: "What is CPC?",
          answer: "CPC (Cost Per Click) is a marketing metric that represents the cost of each individual click on your ad. It is calculated by dividing the total ad spend by the total number of clicks. CPC is the standard pricing model for search engine advertising (Google Ads, Bing Ads) and many social media platforms. Advertisers bid on keywords and pay only when someone clicks on their ad, making CPC a performance-based pricing model that directly ties cost to user engagement.",
        },
        {
          question: "How is CPC calculated?",
          answer: "CPC = Total Ad Spend \u00f7 Total Clicks. For example, if you spend $500 on a campaign that generates 250 clicks, your CPC is $500 \u00f7 250 = $2.00. This means each click costs you $2.00 on average. You can also calculate related metrics: Clicks per Dollar = Total Clicks \u00f7 Total Ad Spend (how many clicks you get per dollar spent), and Effective CPC = Total Ad Spend \u00f7 Total Clicks (same as standard CPC but accounts for all costs).",
        },
        {
          question: "What is a good CPC?",
          answer: "A good CPC depends on your industry, keywords, and conversion rates. Average Google Ads CPC ranges from $1-$2 for many industries, but competitive keywords can cost $50+ per click. The key is to ensure your CPC is lower than the value per click (conversion rate \u00d7 average order value). A high CPC is acceptable if the clicks convert well. General benchmarks: Low ($0-$0.50), Average ($0.50-$2.00), High ($2.00-$5.00), Premium ($5.00+). Always measure CPC against conversion value rather than in isolation.",
        },
        {
          question: "How can I lower my CPC?",
          answer: "To lower CPC, improve your ad Quality Score by optimizing ad relevance, landing page experience, and expected CTR. Use long-tail keywords (less competitive), negative keywords to filter irrelevant traffic, and ad scheduling to target peak performance hours. Remarketing campaigns often have lower CPCs than prospecting campaigns. Other strategies: improve ad copy and CTAs, test different ad formats, use location targeting to focus on high-performing areas, and leverage audience targeting to reach users more likely to engage.",
        },
        {
          question: "What is the difference between CPC and CPM?",
          answer: "CPC (Cost Per Click) charges advertisers only when someone clicks on their ad, making it ideal for performance-driven campaigns focused on driving traffic, leads, or sales. CPM (Cost Per Mille) charges per 1,000 impressions regardless of clicks, making it better for brand awareness and reach campaigns. CPC is commonly used in search advertising (Google Ads) while CPM is more common in display and programmatic advertising. The choice depends on campaign goals: clicks vs. visibility.",
        },
        {
          question: "How does CPC vary by industry?",
          answer: "CPC varies significantly by industry due to competition and keyword value. Legal services ($5-$10+), insurance ($5-$10+), and real estate ($2-$5) typically have the highest CPCs due to high customer lifetime value. Retail/e-commerce ($0.50-$2), technology ($2-$4), and education ($1-$3) fall in the middle. Entertainment, arts, and non-profit sectors often have the lowest CPCs ($0.10-$1). B2B keywords generally cost more than B2C due to higher average order values and longer sales cycles.",
        },
        {
          question: "What factors affect CPC rates?",
          answer: "Key factors affecting CPC rates include: 1) Keyword competition \u2014 higher competition drives up bids; 2) Quality Score \u2014 higher scores reduce CPC; 3) Ad relevance \u2014 relevant ads get better placement at lower costs; 4) Landing page experience \u2014 better pages improve Quality Score; 5) Targeting options \u2014 audience, location, device, and time targeting affect bids; 6) Ad rank \u2014 Google's formula combining bid and Quality Score; 7) Seasonality \u2014 CPCs often spike during holiday seasons; 8) Market saturation \u2014 more advertisers bidding increases costs.",
        },
        {
          question: "How do conversion rates impact effective CPC?",
          answer: "Conversion rates directly impact the true cost of acquiring a customer. Effective CPC (also called Cost Per Acquisition or CPA) is calculated as CPC \u00f7 Conversion Rate. If your CPC is $2.00 and your conversion rate is 5%, your effective CPC per conversion is $2.00 \u00f7 0.05 = $40.00. A high CPC is acceptable if conversion rates are proportionally higher. Always optimize for the full funnel \u2014 a lower CPC with poor conversions is worse than a higher CPC with excellent conversion rates.",
        },
        {
          question: "What is the maximum CPC I should pay?",
          answer: "Your maximum CPC should be based on your product's profit margin and conversion rate. Calculate it as: Max CPC = (Average Order Value \u00d7 Profit Margin) \u00d7 Target Conversion Rate. For example, if your AOV is $100 with a 40% profit margin and 5% conversion rate, your max CPC = ($100 \u00d7 0.40) \u00d7 0.05 = $2.00. This ensures you remain profitable on each click. Set smart bidding targets in Google Ads or manual max CPC bids that align with your break-even point.",
        },
        {
          question: "How does Quality Score affect CPC in Google Ads?",
          answer: "Quality Score is Google's rating of the quality and relevance of your keywords, ads, and landing pages. It ranges from 1-10, with 10 being the highest. A higher Quality Score reduces your actual CPC because Google rewards relevant ads with better ad rank at lower costs. Improving Quality Score by 1 point can reduce CPC by 10-15%. Quality Score is based on expected CTR, ad relevance, and landing page experience. Focus on tight keyword-ad groups, compelling ad copy, and fast, relevant landing pages.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a CPC Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A CPC (Cost Per Click) Calculator helps advertisers calculate the average cost of each click on their ads.
              By entering your <strong>total ad spend</strong> and <strong>total clicks</strong>, you get an instant CPC rate
              that tells you how much each click costs your campaign. This is essential for budgeting, bid optimization,
              and evaluating the efficiency of pay-per-click (PPC) advertising campaigns across search engines,
              social media platforms, and display networks.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p><strong>CPC = Total Ad Spend \u00f7 Total Clicks</strong></p>
              <p>Clicks per Dollar = Total Clicks \u00f7 Total Ad Spend</p>
              <p>Effective CPC = Total Ad Spend \u00f7 Total Clicks</p>
              <p>CPC (per 1000 impressions equivalent) = (Ad Spend \u00f7 Impressions) \u00d7 1000</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Key Metrics Explained</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  metric: "Cost Per Click (CPC)",
                  desc: "The average cost you pay each time a user clicks on your ad. Lower CPC means more efficient spending.",
                },
                {
                  metric: "Effective CPC",
                  desc: "The true cost per click after accounting for all campaign costs. Used for accurate performance measurement.",
                },
                {
                  metric: "Clicks per Dollar",
                  desc: "The number of clicks generated for each dollar spent. Higher values indicate better cost efficiency.",
                },
                {
                  metric: "CPM vs CPC",
                  desc: "CPM charges per 1,000 impressions; CPC charges per click. CPC is better for direct response campaigns.",
                },
                {
                  metric: "Conversion Rate Impact",
                  desc: "A high CPC can be justified by a high conversion rate. Calculate CPA = CPC \u00f7 Conversion Rate.",
                },
                {
                  metric: "Quality Score",
                  desc: "Google's relevance rating (1-10). Higher scores lower your CPC and improve ad position simultaneously.",
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
              <p className="font-medium text-foreground mb-2">Scenario: You spend $1,000 on a campaign that receives 500 clicks.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>CPC = $1,000 \u00f7 500 = <strong>$2.00</strong></li>
                <li>Clicks per Dollar = 500 \u00f7 $1,000 = <strong>0.5 clicks per dollar</strong></li>
                <li>To achieve a $1.00 CPC, you would need 1,000 clicks for the same $1,000 spend</li>
              </ul>
              <p className="mt-2">Each click on your ad costs $2.00 on average. If your conversion rate is 5%, each conversion costs $40.00.</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">CPC Benchmarks by Industry</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-semibold">Industry</th>
                    <th className="text-right py-2 font-semibold">Avg CPC (Google)</th>
                    <th className="text-right py-2 font-semibold">Avg CPC (Facebook)</th>
                    <th className="text-right py-2 font-semibold">High Competition</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    ["Legal Services", "$5.00-$10.00", "$2.00-$5.00", "$50+"],
                    ["Insurance", "$5.00-$10.00", "$3.00-$6.00", "$40+"],
                    ["Real Estate", "$2.00-$5.00", "$1.50-$3.50", "$15+"],
                    ["Technology", "$2.00-$4.00", "$1.50-$3.00", "$20+"],
                    ["Education", "$1.00-$3.00", "$1.00-$2.50", "$10+"],
                    ["E-commerce", "$0.50-$2.00", "$0.50-$1.50", "$5+"],
                    ["Travel & Hospitality", "$0.50-$1.50", "$0.40-$1.00", "$4+"],
                    ["Entertainment", "$0.20-$1.00", "$0.20-$0.80", "$3+"],
                  ].map(([industry, google, facebook, high]) => (
                    <tr key={industry} className="border-b border-border/50">
                      <td className="py-2">{industry}</td>
                      <td className="text-right py-2">{google}</td>
                      <td className="text-right py-2">{facebook}</td>
                      <td className="text-right py-2">{high}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Tips to Optimize CPC Campaigns</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
              <li><strong>Improve Quality Score</strong> - Optimize ad relevance, landing page experience, and expected CTR to lower your CPC in Google Ads.</li>
              <li><strong>Use long-tail keywords</strong> - Less competitive, more specific keywords have lower CPCs and often convert at higher rates.</li>
              <li><strong>Implement negative keywords</strong> - Filter out irrelevant search terms that waste budget on non-converting clicks.</li>
              <li><strong>Leverage audience targeting</strong> - Reach users with higher purchase intent through remarketing, lookalike audiences, and custom segments.</li>
              <li><strong>Optimize ad scheduling</strong> - Run ads during peak conversion hours when competition (and CPC) is lower.</li>
              <li><strong>A/B test ad copy</strong> - Test different headlines, descriptions, and CTAs to improve CTR and Quality Score simultaneously.</li>
              <li><strong>Focus on mobile optimization</strong> - Mobile traffic often has lower CPCs but requires fast-loading, mobile-optimized landing pages.</li>
              <li><strong>Use bid adjustments</strong> - Adjust bids by device, location, time, and audience to maximize ROI on high-performing segments.</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Common Mistakes to Avoid</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              <li><strong>Focusing only on low CPC</strong> - A low CPC with poor conversion rates costs more per acquisition than a higher CPC with strong conversions. Always evaluate CPC alongside conversion data.</li>
              <li><strong>Ignoring Quality Score</strong> - Low Quality Scores lead to higher CPCs and worse ad positions. Investing in ad relevance and landing page experience directly reduces costs.</li>
              <li><strong>Not using negative keywords</strong> - Without negative keywords, you waste budget on irrelevant searches that drive clicks without conversions, inflating your effective CPC.</li>
              <li><strong>Setting and forgetting bids</strong> - CPC benchmarks change over time. Continuously monitor campaigns, adjust bids, and refresh ad creatives to maintain performance.</li>
              <li><strong>Comparing CPC across industries blindly</strong> - A $5 CPC is terrible for e-commerce but excellent for legal services. Always benchmark against your specific industry and campaign goals.</li>
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
            label="Total Clicks"
            icon={MousePointerClick}
            value={clicks.value}
            displayValue={clicks.displayValue}
            onChange={(e) => clicks.setValue(parseFloat(e.target.value))}
            onTextChange={clicks.handleChange}
            onFocus={clicks.handleFocus}
            onBlur={clicks.handleBlur}
            min={1}
            max={10000000}
            step={1}
            formatDisplay={formatCompact(clicks.value)}
          />
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-emerald-500/10 to-primary/10 border border-emerald-500/20 rounded-xl p-6 text-center">
            <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Cost Per Click (CPC)
            </p>
            <p className="text-4xl font-extrabold text-foreground">
              {formatCurrency(results.cpc, currency)}
            </p>
            <div className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold mt-2 ${status.bg} ${status.color}`}>
              <Target className="w-3 h-3" />
              {status.label}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on {formatCompact(clicks.value)} total clicks
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Total Ad Spend"
              value={formatCurrency(adSpend.value, currency)}
              icon={DollarSign}
              tooltip="Total amount spent on advertising"
            />
            <MetricCard
              label="Total Clicks"
              value={formatCompact(clicks.value)}
              icon={MousePointerClick}
              tooltip="Total number of clicks generated"
            />
            <MetricCard
              label="Avg. Cost Per Click"
              value={formatCurrency(results.cpc, currency)}
              icon={BarChart3}
              valueClassName={
                results.cpc > 0 && results.cpc < 0.5
                  ? "text-emerald-500"
                  : results.cpc < 2
                    ? "text-amber-500"
                    : results.cpc < 5
                      ? "text-orange-500"
                      : "text-red-500"
              }
              tooltip="Average cost per click across all campaigns"
            />
            <MetricCard
              label="Clicks per Dollar"
              value={results.clicksPerDollar > 0 ? results.clicksPerDollar.toFixed(4) : "0"}
              icon={ArrowUpRight}
              valueClassName={
                results.clicksPerDollar >= 1
                  ? "text-emerald-500"
                  : results.clicksPerDollar > 0
                    ? "text-amber-500"
                    : "text-muted-foreground"
              }
              tooltip="Number of clicks generated for each dollar spent"
            />
          </div>

          <div className="bg-white border border-border rounded-xl p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Campaign Breakdown
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
                <span className="text-muted-foreground">Total Clicks</span>
                <span className="font-medium">
                  {formatCompact(clicks.value)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-t border-border/50 pt-1.5">
                <span className="font-semibold">CPC</span>
                <span className="font-bold text-emerald-500">
                  {formatCurrency(results.cpc, currency)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Ad Spend</p>
                <p className="text-sm font-semibold">{formatCurrency(adSpend.value, currency)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Total Clicks</p>
                <p className="text-sm font-semibold text-emerald-500">{formatCompact(clicks.value)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">CPC</p>
                <p className="text-sm font-semibold">{formatCurrency(results.cpc, currency)}</p>
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
