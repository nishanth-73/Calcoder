"use client";

import { useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { cn } from "@/lib/utils";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import {
  DollarSign, Eye, FileText, MousePointerClick, TrendingUp, BarChart3,
  Calculator,
} from "lucide-react";
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
  prefix,
  suffix,
  min,
  max,
  step,
  currencyCode,
  formatValue,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: NumericField;
  prefix?: string;
  suffix?: string;
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
  const hasPrefix = Boolean(prefix);
  const hasSuffix = Boolean(suffix);

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm font-medium">
        <Icon className="w-4 h-4 text-primary" />
        <span>{label}</span>
        <span className="ml-auto text-lg font-bold text-primary truncate max-w-[50%]">
          {display}
        </span>
      </label>
      {hasSuffix ? (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            {hasPrefix && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none select-none">
                {prefix}
              </span>
            )}
            <input
              type="text" inputMode="decimal"
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
          <span className="text-muted-foreground font-medium text-sm">{suffix}</span>
        </div>
      ) : (
        <div className="relative">
          {hasPrefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none select-none">
              {prefix}
            </span>
          )}
          <input
            type="text" inputMode="decimal"
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
      )}
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
        <span>{prefix}{min.toLocaleString()}{suffix}</span>
        <span>{prefix}{max.toLocaleString()}{suffix}</span>
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

const CHART_COLORS = ["#10b981", "#f43f5e", "#6366f1", "#f59e0b"];

const RELATED_TOOLS = [
  { name: "CPC Calculator", href: "/marketing/cpc-calculator", desc: "Calculate cost per click for your ad campaigns." },
  { name: "CPM Calculator", href: "/marketing/cpm-calculator", desc: "Calculate cost per mille for ad impressions." },
  { name: "CTR Calculator", href: "/marketing/ctr-calculator", desc: "Calculate click-through rate for ads and emails." },
  { name: "ROAS Calculator", href: "/marketing/roas-calculator", desc: "Calculate return on ad spend for marketing ROI." },
  { name: "YouTube Money Calculator", href: "/marketing/youtube-money-calculator", desc: "Estimate YouTube channel earnings and RPM." },
  { name: "Instagram Reach Calculator", href: "/marketing/instagram-reach-calculator", desc: "Estimate Instagram post reach and engagement." },
  { name: "LTV Calculator", href: "/marketing/ltv-calculator", desc: "Calculate customer lifetime value for your business." },
  { name: "CAC Calculator", href: "/marketing/cac-calculator", desc: "Calculate customer acquisition cost and payback period." },
];

export default function AdSenseCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");

  const dailyPageViews = useNumericField(10000);
  const ctr = useNumericField(1.5);
  const cpc = useNumericField(0.25);

  const results = useMemo(() => {
    const pv = Number.isFinite(dailyPageViews.value) ? Math.max(0, dailyPageViews.value) : 0;
    const ct = Number.isFinite(ctr.value) ? Math.max(0, ctr.value) : 0;
    const cp = Number.isFinite(cpc.value) ? Math.max(0, cpc.value) : 0;

    const dailyClicks = pv * (ct / 100);
    const dailyEarnings = dailyClicks * cp;
    const monthlyEarnings = dailyEarnings * 30;
    const yearlyEarnings = dailyEarnings * 365;
    const rpm = pv > 0 ? (dailyEarnings / pv) * 1000 : 0;
    const pageRpm = pv > 0 ? (dailyEarnings / pv) * 1000 : 0;

    return { dailyClicks, dailyEarnings, monthlyEarnings, yearlyEarnings, rpm, pageRpm };
  }, [dailyPageViews.value, ctr.value, cpc.value]);

  const chartData = useMemo(() => [
    { name: "Daily", value: Math.max(0, results.dailyEarnings) },
    { name: "Monthly (\u00d730)", value: Math.max(0, results.monthlyEarnings - results.dailyEarnings) },
    { name: "Yearly (\u00d7365)", value: Math.max(0, results.yearlyEarnings - results.monthlyEarnings) },
  ], [results]);

  const cfg = getCurrency(currency);

  return (
    <ToolLayout
      title="AdSense Revenue Calculator"
      description="Estimate your daily, monthly, and yearly Google AdSense earnings based on traffic, CTR, and CPC."
      category="marketing"
      faqContent={[
        {
          question: "How does the AdSense Revenue Calculator work?",
          answer: "This calculator estimates your Google AdSense earnings by multiplying your daily page views by your CTR (click-through rate) to get daily clicks, then multiplying by your CPC (cost per click). Daily earnings are then extrapolated to monthly (\u00d730) and yearly (\u00d7365) figures.",
        },
        {
          question: "What is a good CTR for AdSense?",
          answer: "Average AdSense CTR ranges from 0.5% to 2%. A CTR above 2% is considered good for most niches. CTR varies significantly by ad placement, content type, and audience. Above-fold placements and well-integrated ad units typically achieve higher CTRs.",
        },
        {
          question: "What is a good CPC for AdSense?",
          answer: "AdSense CPC varies widely by niche. Finance, insurance, and B2B SaaS niches can have CPCs of $5-$50+. General content niches (entertainment, lifestyle) average $0.10-$0.50. Your CPC is determined by advertisers bidding on your content keywords, so targeting high-value topics can increase CPC.",
        },
        {
          question: "What is RPM and why does it matter?",
          answer: "RPM (Revenue Per Mille) is your estimated earnings per 1,000 page views. It is calculated as (estimated earnings \u00f7 page views) \u00d7 1,000. RPM combines CTR and CPC into a single metric, making it easier to compare performance across different traffic sources, content types, and ad formats.",
        },
        {
          question: "How accurate are these estimates?",
          answer: "These estimates are approximations based on average industry metrics. Actual earnings depend on many factors including ad placement, device types (mobile vs desktop), geographic location of visitors, time of year (holiday seasons command higher CPCs), and ad-blocker usage. Use this tool as a planning guide, not a guarantee.",
        },
        {
          question: "How many page views do I need to make $1000/month?",
          answer: "The number of page views needed depends on your CTR and CPC. At 1% CTR and $0.25 CPC, you need approximately 133,334 daily page views. At 2% CTR and $0.50 CPC, you need about 33,334 daily page views. Higher CTRs and CPCs in lucrative niches drastically reduce the traffic required.",
        },
        {
          question: "Does ad placement affect earnings?",
          answer: "Yes, ad placement significantly impacts earnings. Ads placed above the fold, within content, and in high-visibility areas generally perform better. Google recommends a mix of formats (display, in-feed, in-article) and responsive ad units that adapt to different screen sizes.",
        },
        {
          question: "What is the difference between CPC and RPM?",
          answer: "CPC (Cost Per Click) is the amount an advertiser pays per click on your ad. RPM (Revenue Per Mille) is your total earnings per 1,000 page views, accounting for both CTR and CPC. RPM gives a more complete picture of revenue performance because it includes the effect of traffic volume.",
        },
        {
          question: "How do mobile vs desktop earnings compare?",
          answer: "Mobile traffic typically has lower CPCs and CTRs compared to desktop because mobile ad sizes are smaller and screen real estate is limited. However, mobile traffic volume is often higher. Desktop users tend to have higher engagement rates, leading to better ad performance and higher RPM.",
        },
        {
          question: "How can I increase my AdSense revenue?",
          answer: "To increase AdSense revenue, focus on creating high-quality content that targets high-CPC keywords, optimize ad placement for maximum visibility, improve page load speed, use responsive ad units, experiment with different ad formats, and grow your traffic from high-value geographic regions.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is an AdSense Revenue Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              An AdSense Revenue Calculator helps website owners and publishers estimate their potential earnings from Google AdSense.
              By entering your <strong>daily page views</strong>, <strong>click-through rate (CTR)</strong>, and
              <strong> cost per click (CPC)</strong>, you get an instant projection of your daily, monthly, and yearly earnings.
              This tool also calculates <strong>RPM (Revenue Per Mille)</strong> and <strong>Page RPM</strong> to give you a
              comprehensive view of your ad revenue performance.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground mt-3">
              Whether you are a new blogger exploring monetization or an experienced publisher optimizing ad strategy,
              this calculator provides realistic benchmarks to help you set revenue goals and track the impact of
              traffic growth and engagement improvements over time.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p>Daily Clicks = Daily Page Views \u00d7 (CTR \u00f7 100)</p>
              <p>Daily Earnings = Daily Clicks \u00d7 CPC</p>
              <p>Monthly Earnings = Daily Earnings \u00d7 30</p>
              <p>Yearly Earnings = Daily Earnings \u00d7 365</p>
              <p>RPM = (Daily Earnings \u00f7 Daily Page Views) \u00d7 1,000</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Key Metrics Explained</h3>
            <div className="space-y-3 text-sm">
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-medium text-foreground mb-1">CTR (Click-Through Rate)</p>
                <p className="text-muted-foreground">The percentage of page views that result in an ad click. CTR = (Clicks \u00f7 Page Views) \u00d7 100. Average range: 0.5% to 2%.</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-medium text-foreground mb-1">CPC (Cost Per Click)</p>
                <p className="text-muted-foreground">The amount earned per ad click. CPC varies dramatically by niche from $0.10 (entertainment) to $50+ (finance).</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-medium text-foreground mb-1">RPM (Revenue Per Mille)</p>
                <p className="text-muted-foreground">Estimated earnings per 1,000 page views. RPM = (Estimated Earnings \u00f7 Page Views) \u00d7 1,000. This combines CTR and CPC into one benchmark metric.</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-medium text-foreground mb-1">Page RPM</p>
                <p className="text-muted-foreground">Similar to RPM but specifically measures revenue per 1,000 page views across all ad units on a page. Useful for comparing different pages or traffic sources.</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Scenario: 10,000 daily page views, 2% CTR, $0.50 CPC.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Daily Clicks = 10,000 \u00d7 (2 \u00f7 100) = <strong>200 clicks</strong></li>
                <li>Daily Earnings = 200 \u00d7 $0.50 = <strong>$100</strong></li>
                <li>Monthly Earnings = $100 \u00d7 30 = <strong>$3,000</strong></li>
                <li>Yearly Earnings = $100 \u00d7 365 = <strong>$36,500</strong></li>
                <li>RPM = ($100 \u00f7 10,000) \u00d7 1,000 = <strong>$10.00</strong></li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">AdSense Earnings Benchmarks</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-2 border border-border font-medium">Niche</th>
                    <th className="text-left p-2 border border-border font-medium">Avg. RPM</th>
                    <th className="text-left p-2 border border-border font-medium">Avg. CPC</th>
                    <th className="text-left p-2 border border-border font-medium">Avg. CTR</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="p-2 border border-border">Finance</td><td className="p-2 border border-border">$15 - $50</td><td className="p-2 border border-border">$5.00 - $50.00</td><td className="p-2 border border-border">0.5% - 1.5%</td></tr>
                  <tr><td className="p-2 border border-border">Insurance</td><td className="p-2 border border-border">$20 - $60</td><td className="p-2 border border-border">$10.00 - $50.00</td><td className="p-2 border border-border">0.3% - 1.0%</td></tr>
                  <tr><td className="p-2 border border-border">Technology</td><td className="p-2 border border-border">$5 - $20</td><td className="p-2 border border-border">$0.50 - $5.00</td><td className="p-2 border border-border">0.5% - 2.0%</td></tr>
                  <tr><td className="p-2 border border-border">Health &amp; Fitness</td><td className="p-2 border border-border">$3 - $15</td><td className="p-2 border border-border">$0.50 - $3.00</td><td className="p-2 border border-border">0.8% - 2.5%</td></tr>
                  <tr><td className="p-2 border border-border">Lifestyle &amp; Entertainment</td><td className="p-2 border border-border">$1 - $5</td><td className="p-2 border border-border">$0.10 - $0.50</td><td className="p-2 border border-border">1.0% - 3.0%</td></tr>
                  <tr><td className="p-2 border border-border">Education</td><td className="p-2 border border-border">$2 - $10</td><td className="p-2 border border-border">$0.20 - $2.00</td><td className="p-2 border border-border">0.5% - 2.0%</td></tr>
                  <tr><td className="p-2 border border-border">Travel</td><td className="p-2 border border-border">$2 - $8</td><td className="p-2 border border-border">$0.20 - $1.50</td><td className="p-2 border border-border">0.5% - 1.5%</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Source: Industry averages. Actual earnings vary by audience location, seasonality, and ad implementation.</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Tips to Increase AdSense Revenue</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li><strong>Target high-CPC keywords</strong> \u2014 Create content around topics that advertisers pay premium rates for (finance, SaaS, business).</li>
              <li><strong>Optimize ad placement</strong> \u2014 Place ads above the fold, within content, and at natural break points for maximum visibility.</li>
              <li><strong>Improve page speed</strong> \u2014 Faster loading pages keep visitors engaged longer, increasing ad impression rates and CTR.</li>
              <li><strong>Use responsive ad units</strong> \u2014 Let Google auto-optimize ad sizes for different devices to maximize revenue per visitor.</li>
              <li><strong>Grow quality traffic</strong> \u2014 Focus on organic search traffic from high-value countries (US, UK, Canada, Australia).</li>
              <li><strong>A/B test ad formats</strong> \u2014 Experiment with display, in-feed, in-article, and matched content units to find the best mix.</li>
              <li><strong>Increase session duration</strong> \u2014 Longer visits mean more ad impressions and higher probability of clicks.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Common Mistakes to Avoid</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li><strong>Too many ads</strong> \u2014 Overloading pages with ads hurts user experience and can lead to policy violations.</li>
              <li><strong>Ignoring mobile</strong> \u2014 Over 60% of web traffic is mobile. Non-responsive ad units lose significant revenue.</li>
              <li><strong>Chasing low-value traffic</strong> \u2014 High traffic volume from low-CPC countries does not always translate to good earnings.</li>
              <li><strong>Not using ad units strategically</strong> \u2014 Random ad placement without testing leaves money on the table.</li>
              <li><strong>Relying on a single ad format</strong> \u2014 Diversifying ad formats increases fill rates and overall revenue.</li>
              <li><strong>Neglecting content quality</strong> \u2014 Thin or low-value content leads to high bounce rates and poor ad performance.</li>
            </ul>
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

          <SliderField label="Daily Page Views" icon={Eye} value={dailyPageViews} prefix="" min={100} max={1000000} step={1000} formatValue={formatCompact} />
          <SliderField label="Click Through Rate (CTR)" icon={MousePointerClick} value={ctr} suffix="%" min={0.1} max={15} step={0.1} formatValue={(n) => `${n.toFixed(2)}%`} />
          <SliderField label="Cost Per Click (CPC)" icon={DollarSign} value={cpc} prefix={cfg.symbol} min={0.01} max={50} step={0.05} currencyCode={currency} />
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-emerald-500/10 to-primary/10 border border-emerald-500/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground font-medium">Estimated Monthly Earnings</p>
            </div>
            <p className="text-4xl font-extrabold text-primary">
              {formatCurrency(results.monthlyEarnings, currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Based on {formatCompact(dailyPageViews.value)} daily page views at {ctr.value.toFixed(2)}% CTR
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard icon={DollarSign} label="Daily Earnings" value={formatCurrency(results.dailyEarnings, currency)} color="text-blue-500" />
            <MetricCard icon={TrendingUp} label="Yearly Earnings" value={formatCurrency(results.yearlyEarnings, currency)} color="text-indigo-500" />
            <MetricCard icon={BarChart3} label="RPM" value={formatCurrency(results.rpm, currency)} color="text-emerald-500" />
            <MetricCard icon={MousePointerClick} label="Daily Clicks" value={results.dailyClicks.toFixed(0)} color="text-amber-500" />
          </div>

          <div className="bg-white border border-border rounded-xl p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Full Revenue Breakdown
            </p>
            <div className="flex items-start gap-6 mb-4">
              <div className="w-32 h-32 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
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
            <div className="space-y-1.5 text-sm border-t border-border/50 pt-3">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Daily Page Views</span>
                <span className="font-medium">{formatCompact(dailyPageViews.value)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Daily Clicks</span>
                <span className="font-medium">{results.dailyClicks.toFixed(0)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">CTR</span>
                <span className="font-medium">{ctr.value.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">CPC</span>
                <span className="font-medium">{formatCurrency(cpc.value, currency)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Daily Earnings</span>
                <span className="font-medium">{formatCurrency(results.dailyEarnings, currency)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Monthly Earnings</span>
                <span className="font-medium">{formatCurrency(results.monthlyEarnings, currency)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Yearly Earnings</span>
                <span className="font-medium">{formatCurrency(results.yearlyEarnings, currency)}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-border/50">
                <span className="font-semibold">RPM</span>
                <span className="font-bold text-emerald-500">{formatCurrency(results.rpm, currency)}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Daily Earnings</p>
                <p className="text-sm font-semibold">{formatCurrency(results.dailyEarnings, currency)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">RPM</p>
                <p className="text-sm font-semibold text-emerald-500">{formatCurrency(results.rpm, currency)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Daily Clicks</p>
                <p className="text-sm font-semibold">{results.dailyClicks.toFixed(0)}</p>
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
