"use client";

import { useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import {
  Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip,
} from "recharts";
import {
  DollarSign, TrendingUp, BadgePercent, FileText, Eye,
  MousePointerClick, BarChart3, ArrowUpRight, Target, Info,
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
  { code: "INR", label: "Indian Rupee", symbol: "₹", locale: "en-IN" },
  { code: "EUR", label: "Euro", symbol: "€", locale: "de-DE" },
  { code: "GBP", label: "British Pound", symbol: "Â£", locale: "en-GB" },
  { code: "AED", label: "UAE Dirham", symbol: "Ø¯.Ø¥", locale: "ar-AE" },
  { code: "CAD", label: "Canadian Dollar", symbol: "C$", locale: "en-CA" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$", locale: "en-AU" },
  { code: "JPY", label: "Japanese Yen", symbol: "Â¥", locale: "ja-JP" },
  { code: "SGD", label: "Singapore Dollar", symbol: "S$", locale: "en-SG" },
  { code: "SAR", label: "Saudi Riyal", symbol: "ï·¼", locale: "ar-SA" },
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
  { name: "CPC Calculator", href: "/marketing/cpc-calculator", desc: "Calculate cost per click for your ad campaigns." },
  { name: "CPM Calculator", href: "/marketing/cpm-calculator", desc: "Calculate cost per mille for ad campaigns." },
  { name: "CAC Calculator", href: "/marketing/cac-calculator", desc: "Calculate customer acquisition cost." },
  { name: "ROAS Calculator", href: "/marketing/roas-calculator", desc: "Calculate return on ad spend." },
  { name: "ROI Calculator", href: "/marketing/roi-calculator", desc: "Calculate return on investment including all costs." },
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

export default function CtrCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const impressions = useNumericField(10000);
  const clicks = useNumericField(200);
  const cpcValue = useNumericField(0);

  const results = useMemo(() => {
    const imp = Math.max(0, impressions.value);
    const cl = Math.max(0, clicks.value);
    const cpc = Math.max(0, cpcValue.value);

    const ctr = imp > 0 ? (cl / imp) * 100 : 0;
    const clickRate = imp > 0 ? cl / imp : 0;
    const clicksPerThousand = imp > 0 ? (cl / imp) * 1000 : 0;
    const clickValue = cpc > 0 && cl > 0 ? cl * cpc : 0;

    let benchmark: "none" | "low" | "average" | "good" | "excellent";
    if (imp === 0 || (imp > 0 && cl === 0)) benchmark = "none";
    else if (ctr < 1) benchmark = "low";
    else if (ctr < 3) benchmark = "average";
    else if (ctr < 5) benchmark = "good";
    else benchmark = "excellent";

    return { ctr, clickRate, clicksPerThousand, clickValue, benchmark, imp, cl };
  }, [impressions.value, clicks.value, cpcValue.value]);

  const chartData = useMemo(() => {
    const imp = results.imp;
    const cl = results.cl;
    const nonClicks = Math.max(0, imp - cl);
    return [
      { name: "Clicks", value: cl > 0 ? cl : 1 },
      { name: "Non-Clicks", value: nonClicks > 0 ? nonClicks : 1 },
    ];
  }, [results.imp, results.cl]);

  const cfg = getCurrency(currency);

  const benchmarkConfig: Record<string, { label: string; color: string; bg: string }> = {
    none: { label: "No Data", color: "text-muted-foreground", bg: "bg-muted/50" },
    low: { label: "Below Average", color: "text-red-500", bg: "bg-red-500/10" },
    average: { label: "Average", color: "text-amber-500", bg: "bg-amber-500/10" },
    good: { label: "Good", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    excellent: { label: "Excellent", color: "text-blue-500", bg: "bg-blue-500/10" },
  };

  const bm = benchmarkConfig[results.benchmark];

  return (
    <ToolLayout
      title="CTR Calculator"
      description="Calculate Click-Through Rate (CTR) for your ads, email campaigns, and digital marketing efforts. Free online CTR calculator with instant results, charts, and detailed breakdown."
      category="marketing"
      faqContent={[
        {
          question: "What is CTR (Click-Through Rate)?",
          answer: "CTR (Click-Through Rate) is the percentage of people who click on your ad, email, or link after seeing it. It is calculated by dividing the total number of clicks by the total number of impressions (views), then multiplying by 100. CTR is a key performance indicator for digital marketing, measuring how effectively your content drives engagement. A higher CTR indicates that your ad or content is relevant and compelling to your target audience.",
        },
        {
          question: "How is CTR calculated?",
          answer: "CTR = (Total Clicks ÷ Total Impressions) × 100. For example, if your ad receives 200 clicks from 10,000 impressions, your CTR is (200 ÷ 10,000) × 100 = 2%. This means 2% of people who saw your ad clicked on it. The formula is the same across all platforms - Google Ads, Facebook, email marketing, and display advertising all use this standard calculation. You can also calculate Clicks Per 1,000 Impressions = (Clicks ÷ Impressions) × 1,000.",
        },
        {
          question: "What is a good CTR?",
          answer: "Good CTR varies by channel and industry. Google Search ads average 3-5% for the top positions, with top-of-page ads reaching 7-10%. Display ads average 0.3-0.8%. Email campaigns average 2-5%, with highly segmented campaigns reaching 10%+. Social media ads average 0.5-1.5% for Facebook, 0.8-2% for Instagram, 1-3% for TikTok, and 0.4-1% for LinkedIn. A CTR above industry average is considered good, but context matters - a high CTR with low conversions may indicate irrelevant clicks or poor landing page experience.",
        },
        {
          question: "What is the difference between CTR and Click Rate?",
          answer: "CTR and click rate are often used interchangeably, but technically CTR is expressed as a percentage while click rate can be expressed as a decimal. Both represent the same ratio of clicks to impressions. The calculator provides both for clarity. CTR as a percentage (e.g., 2.5%) is the standard format used in most marketing platforms and reports. Click rate as a decimal (0.025) is more common in statistical analysis and data science contexts.",
        },
        {
          question: "How can I improve my CTR?",
          answer: "To improve CTR, focus on compelling ad copy and headlines that include your target keywords, use strong calls-to-action (CTAs) like 'Shop Now', 'Get Started', or 'Learn More'. Test different creative variations through A/B testing - change one element at a time (headline, image, CTA, description). Target more specific audiences using demographics, interests, and behaviors. Use eye-catching visuals that stand out in the feed. Optimize for mobile devices with responsive design. Leverage urgency and scarcity tactics like limited-time offers. Ensure your offer aligns with user search intent. Improve Google Ads Quality Score through relevance - higher Quality Scores lead to better ad positions and higher CTR.",
        },
        {
          question: "Why is CTR important for Google Ads?",
          answer: "CTR is a key component of Google Ads Quality Score, which affects your ad rank and cost per click. A higher CTR signals to Google that your ad is relevant to the search query, which can lower your CPC and improve ad position. Google uses expected CTR as one of three main Quality Score factors (along with ad relevance and landing page experience). A 1-point improvement in Quality Score can reduce CPC by 10-15%. Higher CTR also means more traffic from the same impression volume, directly improving campaign efficiency and ROI.",
        },
        {
          question: "What is a good CTR for email marketing?",
          answer: "Average email CTR across all industries is approximately 2-3%. However, good CTR varies significantly by industry - real estate averages 2.2%, e-commerce 2.1%, education 3.0%, government 3.5%, healthcare 2.0%, and media/publishing 3.5%. Personalization is the biggest driver - emails with personalized subject lines see 26% higher CTR. Clear, prominent CTAs improve CTR by 28%. Mobile-friendly emails are critical since 60%+ of emails are opened on mobile. Segmented campaigns typically see 30-50% higher CTRs than non-segmented ones.",
        },
        {
          question: "How does CTR affect ad costs?",
          answer: "Higher CTRs generally lead to lower costs in pay-per-click advertising. In Google Ads, a high CTR contributes to a better Quality Score, which can reduce your cost per click by 30-50% or more. In social media advertising (Facebook, Instagram, LinkedIn), high CTRs signal engaging content to the platform's algorithm, which can lead to lower CPMs and better ad delivery efficiency. Platforms reward ads that generate positive user engagement with lower costs and better placement. A CTR improvement from 1% to 3% can effectively halve your cost per conversion.",
        },
        {
          question: "What factors influence CTR the most?",
          answer: "The biggest factors influencing CTR are: 1) Ad copy relevance - matching user intent with compelling messaging; 2) Visual quality - high-quality images and videos outperform text-only ads; 3) Ad position - top-of-page ads get 10x higher CTR than bottom-of-page; 4) Targeting accuracy - reaching the right audience at the right time; 5) Timing and seasonality - CTR varies by day of week and time of day; 6) Device type - mobile CTR often differs from desktop; 7) Ad format - video ads, carousel ads, and shopping ads have different CTR baselines; 8) Brand recognition - established brands often see higher CTR than unknown brands.",
        },
        {
          question: "How does CTR relate to conversion rate and CPA?",
          answer: "CTR, conversion rate (CVR), and cost per acquisition (CPA) form a complete performance funnel. CTR measures top-of-funnel engagement (clicks per impression). CVR measures mid-to-bottom funnel effectiveness (conversions per click). CPA combines both to show total cost efficiency. A high CTR with low CVR indicates a disconnect between ad promise and landing page experience. The formula: Clicks = Impressions × CTR, Conversions = Clicks × CVR, CPA = Total Cost ÷ Conversions. Optimize all three metrics together - a balanced approach beats optimizing any single metric in isolation.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a CTR Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A CTR (Click-Through Rate) Calculator helps marketers and advertisers measure the effectiveness of their campaigns
              by calculating the percentage of users who click on a specific link, ad, or email. By entering your
              {" "}<strong>total impressions</strong> and <strong>total clicks</strong>, you get an instant CTR rate
              that tells you how engaging your content is to your target audience. The calculator also estimates the monetary
              value of your clicks when you provide a cost-per-click (CPC) value, giving you a complete picture of campaign
              performance from engagement through revenue generation.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p><strong>CTR (%) = (Total Clicks ÷ Total Impressions) × 100</strong></p>
              <p>Click Rate = Total Clicks ÷ Total Impressions</p>
              <p>Clicks Per 1,000 Impressions = (Clicks ÷ Impressions) × 1,000</p>
              <p>Click Value (monetary) = Total Clicks × Cost Per Click (CPC)</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Key Metrics Explained</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  metric: "Click-Through Rate (CTR)",
                  desc: "The percentage of impressions that resulted in clicks. The primary metric for measuring ad engagement and relevance.",
                },
                {
                  metric: "Click Rate",
                  desc: "The decimal form of CTR (e.g., 0.02 instead of 2%). Used in statistical analysis and bid calculations.",
                },
                {
                  metric: "Clicks Per 1K Impressions",
                  desc: "The number of clicks per thousand impressions. Useful for comparing performance across different impression volumes.",
                },
                {
                  metric: "Click Value",
                  desc: "The total monetary value of all clicks based on CPC. Shows the financial impact of your click volume.",
                },
                {
                  metric: "Total Impressions",
                  desc: "The total number of times your ad, email, or link was displayed. The denominator in CTR calculation.",
                },
                {
                  metric: "Total Clicks",
                  desc: "The total number of user clicks on your ad. The numerator in CTR calculation.",
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
              <p className="font-medium text-foreground mb-2">Scenario: Your ad receives 50,000 impressions and 1,500 clicks.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>CTR = (1,500 ÷ 50,000) × 100 = <strong>3.00%</strong></li>
                <li>Clicks Per 1,000 Impressions = (1,500 ÷ 50,000) × 1,000 = <strong>30</strong></li>
                <li>Click Rate = 1,500 ÷ 50,000 = <strong>0.03</strong></li>
              </ul>
              <p className="mt-2">This means 3% of users who saw your ad clicked on it, with 30 clicks per 1,000 impressions. If your CPC is $0.50, the total click value is 1,500 × $0.50 = $750.</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">CTR Benchmarks by Channel</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-semibold">Channel</th>
                    <th className="text-right py-2 font-semibold">Average CTR</th>
                    <th className="text-right py-2 font-semibold">Good CTR</th>
                    <th className="text-right py-2 font-semibold">Excellent</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    ["Google Search Ads", "3-5%", "5-8%", "10%+"],
                    ["Google Display Ads", "0.3-0.8%", "0.8-1.5%", "2%+"],
                    ["Facebook Feed Ads", "0.5-1.5%", "1.5-3%", "4%+"],
                    ["Instagram Stories", "0.3-1%", "1-2%", "3%+"],
                    ["LinkedIn Ads", "0.4-1%", "1-2%", "3%+"],
                    ["TikTok Ads", "1-3%", "3-5%", "7%+"],
                    ["Email Marketing", "2-5%", "5-10%", "15%+"],
                    ["Twitter/X Ads", "0.5-1.5%", "1.5-3%", "5%+"],
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
            <h3 className="text-lg font-semibold mb-3">Tips to Improve CTR</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
              <li><strong>Write compelling headlines</strong> - Include target keywords, numbers, and power words that grab attention and match search intent.</li>
              <li><strong>Use strong calls-to-action</strong> - Action-oriented CTAs like "Get Started Free", "Shop Now", "Download Guide" drive more clicks than generic "Learn More".</li>
              <li><strong>A/B test ad creatives</strong> - Test different headlines, images, descriptions, and CTAs to find the highest-performing combinations for each audience segment.</li>
              <li><strong>Improve ad relevance</strong> - Match your ad copy and offers to the specific audience and keyword intent. Higher relevance drives higher CTR and Quality Score.</li>
              <li><strong>Optimize for mobile</strong> - Over 60% of ad clicks happen on mobile devices. Ensure ads and landing pages are mobile-responsive with fast load times.</li>
              <li><strong>Use ad extensions</strong> - In Google Ads, add site links, callouts, structured snippets, and call extensions to make your ad more prominent and clickable.</li>
              <li><strong>Target the right audience</strong> - Use demographic targeting, interests, custom audiences, and retargeting to reach users most likely to engage.</li>
              <li><strong>Leverage urgency and scarcity</strong> - Limited-time offers, countdown timers, and low-stock alerts create FOMO and drive higher CTR.</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Common Mistakes to Avoid</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              <li><strong>Focusing only on CTR</strong> - A high CTR doesn't guarantee conversions. Always evaluate CTR alongside conversion rate, CPA, and ROAS for a complete picture.</li>
              <li><strong>Using misleading ad copy</strong> - Clickbait headlines may boost CTR temporarily but damage brand trust and lead to high bounce rates and low conversions.</li>
              <li><strong>Ignoring impression volume</strong> - A 10% CTR on 100 impressions (10 clicks) is less valuable than a 2% CTR on 100,000 impressions (2,000 clicks). Consider absolute click volume.</li>
              <li><strong>Not segmenting by device</strong> - Mobile and desktop CTR often differ significantly. Optimize and bid separately for each device type to maximize overall performance.</li>
              <li><strong>Setting and forgetting</strong> - CTR changes over time due to ad fatigue, seasonality, and market shifts. Continuously refresh creatives and monitor performance trends.</li>
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
            label="Total Impressions"
            icon={Eye}
            value={impressions.value}
            displayValue={impressions.displayValue}
            onChange={(e) => impressions.setValue(parseFloat(e.target.value))}
            onTextChange={impressions.handleChange}
            onFocus={impressions.handleFocus}
            onBlur={impressions.handleBlur}
            min={10}
            max={100000000}
            step={10}
            formatDisplay={formatCompact(impressions.value)}
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
            min={0}
            max={10000000}
            step={1}
            formatDisplay={formatCompact(clicks.value)}
          />
          <SliderField
            label={`Cost Per Click (${cfg.symbol})`}
            icon={DollarSign}
            value={cpcValue.value}
            displayValue={cpcValue.displayValue}
            onChange={(e) => cpcValue.setValue(parseFloat(e.target.value))}
            onTextChange={cpcValue.handleChange}
            onFocus={cpcValue.handleFocus}
            onBlur={cpcValue.handleBlur}
            min={0}
            max={10000}
            step={0.01}
            formatDisplay={cpcValue.value > 0 ? formatCurrency(cpcValue.value, currency) : "Optional"}
            prefix={cfg.symbol}
          />
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-emerald-500/10 to-primary/10 border border-emerald-500/20 rounded-xl p-6 text-center">
            <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Click-Through Rate (CTR)
            </p>
            <p className="text-4xl font-extrabold text-foreground">
              {results.imp > 0 ? formatPercent(results.ctr) : "N/A"}
            </p>
            {results.imp > 0 && (
              <div className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold mt-2 ${bm.bg} ${bm.color}`}>
                <Target className="w-3 h-3" />
                {bm.label}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Based on {formatCompact(results.imp)} impressions and {formatCompact(results.cl)} clicks
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Total Impressions"
              value={formatCompact(results.imp)}
              icon={Eye}
              tooltip="Total number of times your ad was displayed"
            />
            <MetricCard
              label="Total Clicks"
              value={formatCompact(results.cl)}
              icon={MousePointerClick}
              tooltip="Total number of clicks generated"
            />
            <MetricCard
              label="Clicks Per 1K Impr."
              value={results.clicksPerThousand.toFixed(1)}
              icon={BarChart3}
              valueClassName={results.clicksPerThousand >= 10 ? "text-emerald-500" : "text-amber-500"}
              tooltip="Number of clicks per 1,000 impressions"
            />
            <MetricCard
              label="Click Value"
              value={results.clickValue > 0 ? formatCurrency(results.clickValue, currency) : "N/A"}
              icon={DollarSign}
              valueClassName={results.clickValue > 0 ? "text-emerald-500" : "text-muted-foreground"}
              tooltip="Total monetary value of all clicks based on CPC"
            />
          </div>

          <div className="bg-white border border-border rounded-xl p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Campaign Summary
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
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val: any) => formatCompact(Number(val) || 0)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-1.5 text-sm">
                {chartData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: CHART_COLORS[i] }} />
                      {item.name}
                    </span>
                    <span className="font-medium">{formatCompact(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 text-sm border-t border-border/50 pt-3">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Impressions</span>
                <span className="font-medium">{formatCompact(results.imp)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Clicks</span>
                <span className="font-medium">{formatCompact(results.cl)}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-border/50 pt-1.5">
                <span className="font-semibold">CTR</span>
                <span className="font-bold text-emerald-500">{results.imp > 0 ? formatPercent(results.ctr) : "N/A"}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Impressions</p>
                <p className="text-sm font-semibold">{formatCompact(results.imp)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Clicks</p>
                <p className="text-sm font-semibold text-emerald-500">{formatCompact(results.cl)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">CTR</p>
                <p className="text-sm font-semibold">{results.imp > 0 ? formatPercent(results.ctr) : "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6">Related Calculators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {RELATED_TOOLS.map((tool) => (
            <a key={tool.name} href={tool.href}
              className="block bg-white border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-md transition-all group">
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{tool.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{tool.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
}
