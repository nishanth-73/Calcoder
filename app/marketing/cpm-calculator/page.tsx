"use client";

import { useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import {
  Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip,
} from "recharts";
import {
  DollarSign, TrendingUp, BadgePercent, FileText, Wallet,
  BarChart3, ArrowUpRight, Info, Eye,
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

const CHART_COLORS = ["#10b981", "#f43f5e", "#6366f1", "#f59e0b"];

const RELATED_TOOLS = [
  { name: "CPC Calculator", href: "/marketing/cpc-calculator", desc: "Calculate cost per click for your ad campaigns." },
  { name: "CTR Calculator", href: "/marketing/ctr-calculator", desc: "Calculate click-through rate for your ads." },
  { name: "CAC Calculator", href: "/marketing/cac-calculator", desc: "Calculate customer acquisition cost." },
  { name: "ROAS Calculator", href: "/marketing/roas-calculator", desc: "Calculate return on ad spend." },
  { name: "ROI Calculator", href: "/marketing/roi-calculator", desc: "Calculate return on investment including all costs." },
  { name: "LTV Calculator", href: "/marketing/ltv-calculator", desc: "Calculate customer lifetime value." },
  { name: "AdSense Calculator", href: "/marketing/adsense-calculator", desc: "Estimate AdSense earnings potential." },
  { name: "Profit Margin Calculator", href: "/finance/profit-margin-calculator", desc: "Calculate profit margins on products." },
];

function SliderField({
  label, icon: Icon, value, displayValue, onChange, onTextChange,
  onFocus, onBlur, min, max, step, formatDisplay, prefix,
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
  prefix?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm font-medium">
        <Icon className="w-4 h-4 text-primary" />
        <span>{label}</span>
        <span className="ml-auto text-lg font-bold text-primary">
          {formatDisplay ?? value}
        </span>
      </label>
      {prefix ? (
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

function getCpmStatus(cpm: number): { label: string; color: string; bg: string; border: string } {
  if (cpm <= 0) return { label: "Zero", color: "text-gray-500", bg: "bg-gray-500/10", border: "border-gray-500/20" };
  if (cpm <= 5) return { label: "Low", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
  if (cpm <= 15) return { label: "Medium", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
  if (cpm <= 50) return { label: "High", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" };
  return { label: "Extreme", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" };
}

export default function CpmCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");

  const adSpend = useNumericField(1000);
  const impressions = useNumericField(100000);

  const results = useMemo(() => {
    const spend = Math.max(0, adSpend.value);
    const imps = Math.max(0, impressions.value);

    const cpm = imps > 0 ? (spend / imps) * 1000 : 0;
    const costPerImpression = imps > 0 ? spend / imps : 0;
    const impressionsPerDollar = spend > 0 ? imps / spend : 0;
    const eCPM = cpm;

    return { cpm, costPerImpression, impressionsPerDollar, eCPM };
  }, [adSpend.value, impressions.value]);

  const chartData = useMemo(() => [
    { name: "Ad Spend", value: Math.max(0, adSpend.value) },
    { name: "Impressions (K)", value: Math.max(0, impressions.value / 1000) },
    { name: "CPM", value: Math.max(0, results.cpm) },
  ], [adSpend.value, impressions.value, results.cpm]);

  const cfg = getCurrency(currency);
  const status = getCpmStatus(results.cpm);

  return (
    <ToolLayout
      title="CPM Calculator"
      description="Calculate Cost Per Mille (CPM) - determine how much you pay per 1,000 ad impressions. Free online CPM calculator with instant results, charts, and detailed breakdown."
      category="marketing"
      faqContent={[
        {
          question: "What is CPM?",
          answer: "CPM (Cost Per Mille) is a marketing metric that represents the cost of 1,000 ad impressions. Mille is Latin for thousand, so CPM literally means cost per thousand impressions. It is calculated by dividing the total ad spend by the number of impressions, then multiplying by 1,000. CPM is commonly used in display advertising, social media ads, and programmatic advertising to compare the cost efficiency of different campaigns.",
        },
        {
          question: "How is CPM calculated?",
          answer: "CPM = (Total Ad Spend \u00f7 Total Impressions) \u00d7 1,000. For example, if you spend $500 on a campaign that delivers 100,000 impressions, your CPM is ($500 \u00f7 100,000) \u00d7 1,000 = $5.00. This means you pay $5.00 for every 1,000 times your ad is shown. You can also calculate impressions from CPM: Impressions = (Ad Spend / CPM) \u00d7 1,000.",
        },
        {
          question: "What is a good CPM rate?",
          answer: "Average CPM rates vary by industry, ad format, and targeting. Display ads typically range from $0.50 to $5.00 CPM. Video ads and premium placements can be $10\u2013$30+ CPM. Niche B2B audiences command higher CPMs. A CPM below $5 is generally considered low, $5\u2013$15 is medium, $15\u2013$50 is high, and above $50 is extreme. The key is to balance CPM with campaign performance \u2014 a higher CPM can be worthwhile if it drives better results.",
        },
        {
          question: "What is the difference between CPM and CPC?",
          answer: "CPM (Cost Per Mille) charges per 1,000 impressions regardless of clicks, while CPC (Cost Per Click) charges only when someone clicks your ad. CPM is better for brand awareness campaigns where you want maximum visibility. CPC is better for performance campaigns focused on driving traffic or conversions. Many platforms offer both pricing models, and the right choice depends on your campaign goals.",
        },
        {
          question: "How does CPM vary by industry?",
          answer: "CPM rates vary significantly by industry. Finance and insurance often have the highest CPMs ($10\u2013$50+) due to high competition and valuable audiences. Technology and B2B services also command premium rates ($8\u2013$30). Retail and e-commerce typically fall in the $3\u2013$15 range. Entertainment and media have lower CPMs ($1\u2013$8). Niche industries with specific targeting often see higher CPMs because advertisers are willing to pay more for qualified audiences.",
        },
        {
          question: "What factors affect CPM rates?",
          answer: "Several factors influence CPM rates: 1) Audience targeting \u2014 specific demographics and interests command higher CPMs; 2) Ad placement \u2014 premium positions cost more; 3) Ad format \u2014 video ads have higher CPMs than display; 4) Seasonality \u2014 holiday seasons drive up CPMs; 5) Competition \u2014 more advertisers bidding drives prices up; 6) Geographic targeting \u2014 Tier 1 countries have higher CPMs; 7) Device type \u2014 desktop vs mobile CPMs differ; 8) Time of day \u2014 peak hours cost more; 9) Ad quality and relevance scores.",
        },
        {
          question: "How can I lower my CPM?",
          answer: "To lower CPM: 1) Broaden your audience targeting to increase supply of impressions; 2) Use frequency capping to avoid showing ads to the same users too often; 3) Optimize ad placements and avoid premium-only inventory; 4) Test different ad formats and sizes; 5) Run ads during off-peak hours; 6) Target lower-cost geographic regions; 7) Improve ad relevance and quality scores; 8) Use programmatic guaranteed deals instead of open auction; 9) Leverage retargeting lists which often have lower CPMs; 10) A/B test creative to find high-performing, low-cost combinations.",
        },
        {
          question: "What is the difference between CPM and CPV (Cost Per View)?",
          answer: "CPM (Cost Per Mille) charges per 1,000 impressions, regardless of whether users watch or interact with the ad. CPV (Cost Per View) charges only when a user views your video ad for a minimum duration (typically 30 seconds or the full ad if shorter). CPV is used exclusively for video advertising on platforms like YouTube. CPM is more common for display, banner, and social media ads. For video campaigns, CPV often provides better value since you only pay for engaged views.",
        },
        {
          question: "Why is my CPM different across platforms?",
          answer: "CPM varies across platforms due to different audience quality, competition levels, and ad formats. Google Display Network typically has lower CPMs ($1\u2013$5) due to massive inventory. Facebook/Instagram CPMs range from $5\u2013$15 depending on targeting. LinkedIn has high CPMs ($15\u2013$50+) due to professional targeting. YouTube CPMs vary from $5\u2013$30 based on content category. TikTok CPMs range from $1\u2013$10. Each platform's auction dynamics, user demographics, and ad inventory quality affect your actual CPM. Always benchmark against platform averages for your industry.",
        },
        {
          question: "How do I calculate effective CPM (eCPM)?",
          answer: "eCPM (effective Cost Per Mille) is a publisher-side metric that measures the revenue earned per 1,000 impressions. It is calculated as: eCPM = (Total Earnings \u00f7 Total Impressions) \u00d7 1,000. For advertisers, eCPM can also mean the effective cost of 1,000 impressions including all fees and data costs. Unlike CPM which is the rate you agree to pay, eCPM reflects what you actually paid on average. It is especially useful when comparing campaigns with different pricing models (CPM, CPC, CPA) on a common basis.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a CPM Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A CPM (Cost Per Mille) Calculator helps advertisers and marketers calculate the cost of 1,000 ad impressions.
              By entering your <strong>total ad spend</strong> and <strong>total impressions</strong>, you get an instant CPM rate
              that tells you how much you are paying for every 1,000 ad views. This tool also calculates cost per impression,
              impressions per dollar, and provides an interactive breakdown of your campaign performance.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p><strong>CPM = (Total Ad Spend \u00f7 Total Impressions) \u00d7 1,000</strong></p>
              <p>Cost per Impression = Total Ad Spend \u00f7 Total Impressions</p>
              <p>Impressions per Dollar = Total Impressions \u00f7 Total Ad Spend</p>
              <p>Impressions from CPM = (Ad Spend / CPM) \u00d7 1,000</p>
              <p>eCPM = (Total Earnings \u00f7 Total Impressions) \u00d7 1,000</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Key Metrics Explained</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  metric: "CPM (Cost Per Mille)",
                  desc: "The cost of 1,000 ad impressions. Lower CPM means more impressions for your budget.",
                },
                {
                  metric: "eCPM (Effective CPM)",
                  desc: "The effective cost per 1,000 impressions including all fees. Useful for cross-campaign comparison.",
                },
                {
                  metric: "Cost per Impression",
                  desc: "The cost of a single ad impression. Typically a fraction of a cent for most campaigns.",
                },
                {
                  metric: "Impressions per Dollar",
                  desc: "How many impressions you get for each dollar spent. Higher is better for reach-focused campaigns.",
                },
                {
                  metric: "Total Ad Spend",
                  desc: "The total amount spent on the advertising campaign including all costs.",
                },
                {
                  metric: "Total Impressions",
                  desc: "The total number of times your ad was shown to users, regardless of interaction.",
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
              <p className="font-medium text-foreground mb-2">Scenario: You spend $1,000 on a campaign that delivers 200,000 impressions.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>CPM = ($1,000 \u00f7 200,000) \u00d7 1,000</li>
                <li>CPM = 0.005 \u00d7 1,000</li>
                <li><strong>CPM = $5.00</strong></li>
                <li>Cost per Impression = $1,000 \u00f7 200,000 = <strong>$0.005</strong></li>
                <li>Impressions per Dollar = 200,000 \u00f7 $1,000 = <strong>200 impressions</strong></li>
              </ul>
              <p className="mt-2">You pay $5.00 for every 1,000 impressions, or half a cent per impression. Each dollar buys 200 impressions.</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">CPM Benchmarks by Industry</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-semibold">Industry</th>
                    <th className="text-right py-2 font-semibold">Low CPM</th>
                    <th className="text-right py-2 font-semibold">Average CPM</th>
                    <th className="text-right py-2 font-semibold">High CPM</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    ["Finance & Insurance", "$2", "$12", "$50+"],
                    ["Technology", "$3", "$10", "$30+"],
                    ["Legal", "$5", "$15", "$40+"],
                    ["Healthcare", "$3", "$10", "$25+"],
                    ["B2B Services", "$4", "$12", "$35+"],
                    ["E-commerce / Retail", "$1", "$5", "$15"],
                    ["Education", "$2", "$8", "$20"],
                    ["Travel & Hospitality", "$2", "$7", "$18"],
                    ["Entertainment", "$1", "$4", "$10"],
                    ["News & Media", "$0.50", "$3", "$8"],
                    ["Automotive", "$2", "$8", "$20"],
                    ["Real Estate", "$3", "$9", "$25"],
                  ].map(([industry, low, avg, high]) => (
                    <tr key={industry} className="border-b border-border/50">
                      <td className="py-2">{industry}</td>
                      <td className="text-right py-2">{low}</td>
                      <td className="text-right py-2">{avg}</td>
                      <td className="text-right py-2">{high}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Tips to Optimize CPM Campaigns</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
              <li><strong>Target the right audience</strong> \u2014 Use precise targeting to reach users most likely to engage with your ads. Broad targeting lowers CPM but also lowers relevance.</li>
              <li><strong>Leverage retargeting</strong> \u2014 Retargeting campaigns often have lower CPMs because you are reaching users who already know your brand.</li>
              <li><strong>Test ad formats</strong> \u2014 Video ads typically have higher CPMs but also higher engagement. Compare display vs video to find the best value.</li>
              <li><strong>Use frequency capping</strong> \u2014 Limit how often the same user sees your ad to avoid ad fatigue and wasted impressions.</li>
              <li><strong>Optimize for viewability</strong> \u2014 Choose placements with high viewability rates to ensure your impressions are actually seen.</li>
              <li><strong>Negotiate direct deals</strong> \u2014 For large campaigns, negotiate directly with publishers for better CPM rates than open auction.</li>
              <li><strong>Analyze by placement</strong> \u2014 Measure CPM by placement and reallocate budget to the most cost-effective positions.</li>
              <li><strong>Consider ad scheduling</strong> \u2014 Run campaigns during times when your audience is most active and CPMs may be lower.</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Common Mistakes to Avoid</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              <li><strong>Focusing only on CPM</strong> \u2014 A low CPM doesn't guarantee campaign success. Measure CTR, conversion rates, and CPA alongside CPM for a complete picture.</li>
              <li><strong>Ignoring ad quality</strong> \u2014 Poor ad creative results in low engagement even with millions of impressions. Invest in compelling visuals and copy.</li>
              <li><strong>Not tracking viewability</strong> \u2014 Not all impressions are equal. Ads below the fold or in non-viewable placements waste budget. Track viewability rates.</li>
              <li><strong>Overlooking ad fraud</strong> \u2014 Bot traffic and invalid impressions inflate your impression count without delivering real value. Use fraud detection tools.</li>
              <li><strong>Setting and forgetting</strong> \u2014 CPM rates change with market conditions. Continuously monitor and optimize campaigns based on performance data.</li>
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
            label="Total Impressions"
            icon={Eye}
            value={impressions.value}
            displayValue={impressions.displayValue}
            onChange={(e) => impressions.setValue(parseFloat(e.target.value))}
            onTextChange={impressions.handleChange}
            onFocus={impressions.handleFocus}
            onBlur={impressions.handleBlur}
            min={1000}
            max={100000000}
            step={1000}
            formatDisplay={formatCompact(impressions.value)}
          />
        </div>

        <div className="space-y-4">
          <div
            className={`bg-gradient-to-br from-emerald-500/10 to-primary/10 ${status.border} rounded-xl p-6 text-center`}
          >
            <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Cost Per Mille (CPM)
            </p>
            <p className="text-4xl font-extrabold text-foreground">
              {formatCurrency(results.cpm, currency)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {results.cpm > 0 ? `${formatCurrency(results.costPerImpression, currency)} per impression` : "Zero spend or impressions"}
            </p>
            {results.cpm > 0 && (
              <div
                className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold mt-2 ${status.bg} ${status.color}`}
              >
                <BarChart3 className="w-3 h-3" />
                {status.label}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Total Cost"
              value={formatCurrency(adSpend.value, currency)}
              icon={DollarSign}
              tooltip="Total amount spent on the advertising campaign"
            />
            <MetricCard
              label="Total Impressions"
              value={formatCompact(impressions.value)}
              icon={Eye}
              tooltip="Total number of times your ad was shown"
            />
            <MetricCard
              label="Cost per 1,000"
              value={formatCurrency(results.cpm, currency)}
              icon={BadgePercent}
              valueClassName={results.cpm > 0 ? "text-emerald-500" : ""}
              tooltip="Cost per 1,000 ad impressions (CPM)"
            />
            <MetricCard
              label="Impressions per Dollar"
              value={results.impressionsPerDollar > 0 ? formatCompact(results.impressionsPerDollar) : `${cfg.symbol}0`}
              icon={ArrowUpRight}
              valueClassName={results.impressionsPerDollar > 0 ? "text-emerald-500" : ""}
              tooltip="Number of impressions you get for each dollar spent"
            />
          </div>

          <div className="bg-white border border-border rounded-xl p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Campaign Breakdown
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
              <div className="w-32 h-32 flex-shrink-0 mx-auto sm:mx-0">
                <ResponsiveContainer initialDimension={{width:100,height:100}} width="100%" height="100%">
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
                <span className="text-muted-foreground">Impressions</span>
                <span className="font-medium">
                  {formatCompact(impressions.value)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-t border-border/50 pt-1.5">
                <span className="font-semibold">CPM</span>
                <span className="font-bold text-emerald-500">
                  {formatCurrency(results.cpm, currency)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Ad Spend</p>
                <p className="text-sm font-semibold">{formatCurrency(adSpend.value, currency)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Impressions</p>
                <p className="text-sm font-semibold text-emerald-500">{formatCompact(impressions.value)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">CPM</p>
                <p className="text-sm font-semibold">{formatCurrency(results.cpm, currency)}</p>
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
