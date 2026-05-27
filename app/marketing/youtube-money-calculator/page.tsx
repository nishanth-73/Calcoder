"use client";

import { useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Eye, TrendingUp, Wallet, Play, Calendar, Info, BarChart3, ThumbsUp, FileText } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";

type CurrencyCode = "USD" | "INR" | "EUR" | "GBP" | "AED" | "CAD" | "AUD" | "JPY" | "SGD" | "SAR" | "CHF";

interface CurrencyConfig { code: CurrencyCode; label: string; symbol: string; locale: string; }

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

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];

const RELATED_TOOLS = [
  { name: "TikTok Earnings Calculator", href: "/marketing/tiktok-earnings-calculator", desc: "Estimate TikTok Creator Fund and sponsorship earnings." },
  { name: "AdSense Revenue Calculator", href: "/marketing/adsense-calculator", desc: "Estimate Google AdSense earnings from web traffic." },
  { name: "CPM Calculator", href: "/marketing/cpm-calculator", desc: "Calculate cost per mille for your ad campaigns." },
  { name: "CPC Calculator", href: "/marketing/cpc-calculator", desc: "Calculate cost per click for your ads." },
  { name: "Engagement Rate Calculator", href: "/marketing/engagement-rate-calculator", desc: "Calculate social media engagement rates." },
  { name: "Instagram Reach Calculator", href: "/marketing/instagram-reach-calculator", desc: "Estimate Instagram post reach and impressions." },
  { name: "ROAS Calculator", href: "/marketing/roas-calculator", desc: "Calculate return on ad spend." },
  { name: "CTR Calculator", href: "/marketing/ctr-calculator", desc: "Calculate click-through rate for your campaigns." },
];

function SliderField({ label, icon: Icon, value, displayValue, onChange, onTextChange, onFocus, onBlur, min, max, step, formatDisplay, prefix }: {
  label: string; icon: React.ElementType; value: number; displayValue: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onTextChange: (raw: string) => void; onFocus: () => void; onBlur: () => void; min: number; max: number; step: number; formatDisplay?: string; prefix?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm font-medium">
        <Icon className="w-4 h-4 text-primary" />
        <span>{label}</span>
        <span className="ml-auto text-lg font-bold text-primary">{formatDisplay ?? value}</span>
      </label>
      {prefix ? (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{prefix}</span>
          <input type="text" inputMode="decimal" value={displayValue} onFocus={onFocus} onBlur={onBlur} onChange={(e) => onTextChange(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-8 px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter value" />
        </div>
      ) : (
        <div className="relative">
          <input type="text" inputMode="decimal" value={displayValue} onFocus={onFocus} onBlur={onBlur} onChange={(e) => onTextChange(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter value" />
        </div>
      )}
      <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} aria-label={label}
        className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, className, valueClassName, tooltip }: {
  label: string; value: string; icon: React.ElementType; className?: string; valueClassName?: string; tooltip?: string;
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

export default function YoutubeMoneyCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");

  const views = useNumericField(100000);
  const cpm = useNumericField(2.5);
  const rpm = useNumericField(1.5);
  const engagement = useNumericField(4);

  const results = useMemo(() => {
    const v = Math.max(0, views.value);
    const cp = Math.max(0, cpm.value);
    const rp = Math.max(0, rpm.value);

    const cpmBasedMonthly = (v / 1000) * cp;
    const rpmBasedMonthly = (v / 1000) * rp;
    const monthlyEarnings = (cpmBasedMonthly + rpmBasedMonthly) / 2;
    const yearlyEarnings = monthlyEarnings * 12;
    const perThousand = monthlyEarnings / v * 1000;

    const adRevenue = monthlyEarnings * 0.55;
    const memberships = monthlyEarnings * 0.2;
    const sponsorships = monthlyEarnings * 0.15;
    const other = monthlyEarnings * 0.1;

    return { monthlyEarnings, yearlyEarnings, cpmBasedMonthly, rpmBasedMonthly, perThousand, adRevenue, memberships, sponsorships, other };
  }, [views.value, cpm.value, rpm.value]);

  const chartData = useMemo(() => [
    { name: "Ad Revenue", value: Math.max(0, results.adRevenue) },
    { name: "Memberships", value: Math.max(0, results.memberships) },
    { name: "Sponsorships", value: Math.max(0, results.sponsorships) },
    { name: "Other Income", value: Math.max(0, results.other) },
  ], [results]);

  const cfg = getCurrency(currency);

  return (
    <ToolLayout
      title="YouTube Money Calculator"
      description="Estimate your potential YouTube earnings based on monthly views, CPM rates, RPM rates, and audience engagement. Free online calculator with instant results and revenue breakdown."
      category="marketing"
      faqContent={[
        { question: "How does the YouTube Money Calculator work?", answer: "This calculator estimates YouTube earnings by combining CPM-based and RPM-based revenue projections. CPM (Cost Per Mille) represents what advertisers pay per 1,000 views, while RPM (Revenue Per Mille) represents what you actually earn after YouTube's cut. The calculator averages both metrics and breaks down revenue across ad revenue, memberships, sponsorships, and other income sources based on typical creator split percentages." },
        { question: "What is the difference between CPM and RPM on YouTube?", answer: "CPM (Cost Per Mille) is what advertisers pay per 1,000 ad impressions on your videos. RPM (Revenue Per Mille) is your actual earnings per 1,000 views after YouTube deducts its 45% revenue share. RPM is always lower than CPM. For example, if CPM is $5.00, your RPM might be around $2.75 after YouTube's cut. RPM is the more realistic metric for planning your income." },
        { question: "What is a good CPM for YouTube videos?", answer: "YouTube CPM varies dramatically by niche and audience location. Finance, business, and tech channels often command $10-$30+ CPM. Entertainment, gaming, and vlog channels average $1-$5 CPM. US, UK, and Australian audiences generate the highest CPMs, while developing countries generate lower rates. Seasonality also matters - Q4 (holiday season) typically sees 20-40% higher CPMs." },
        { question: "How many views do you need to make money on YouTube?", answer: "You need at least 1,000 subscribers and 4,000 watch hours in the past 12 months to join the YouTube Partner Program. Once accepted, with 10,000 monthly views at a $2.50 CPM and $1.50 RPM, you could earn approximately $20 per month. To earn a full-time income of $3,000-$5,000 monthly, you typically need 500,000 to 1 million monthly views, depending on your niche and CPM rates." },
        { question: "What factors affect YouTube earnings the most?", answer: "The biggest factors are your video niche (finance/tech command higher CPMs), audience geographic location (US/UK/AU audiences pay the most), watch time (longer watch time means more ad impressions), upload frequency (consistency grows your channel), and engagement rate (higher engagement signals quality content to YouTube's algorithm, increasing recommendations and views)." },
        { question: "How much do YouTubers earn from memberships and super chats?", answer: "Channel memberships typically range from $0.99 to $99.99 per month per member, with YouTube taking a 30% cut. Super Chat and Super Stickers during live streams also contribute significantly for engaged communities. For a channel with 100,000 subscribers, memberships might add 15-25% to base ad revenue. The calculator estimates memberships at 20% of your total earnings for a balanced projection." },
        { question: "What is RPM and why does it matter?", answer: "RPM (Revenue Per Mille) shows your actual earnings per 1,000 views after YouTube's 45% revenue share. It matters because it reflects your true take-home rate. While CPM might be $5.00, your RPM could be $2.75. Tracking RPM over time helps you understand real revenue trends. Improving RPM involves creating longer videos (more mid-roll ads), targeting high-CPM topics, and building an audience in high-paying countries." },
        { question: "How accurate are YouTube earnings estimates?", answer: "Earnings estimates are approximations based on industry averages. Actual earnings vary significantly based on ad rates, viewer location, watch time, ad blocker usage, time of year, and YouTube policy changes. Use this calculator as a planning tool to understand potential scenarios. For precise numbers, check your YouTube Analytics Revenue reports, which show actual RPM and earnings." },
        { question: "What is the YouTube Partner Program and how do I join?", answer: "The YouTube Partner Program (YPP) allows creators to monetize their content through ads, memberships, Super Chat, and more. To join, you need 1,000 subscribers and 4,000 watch hours in the past 12 months (or 1,000 subscribers with 10 million Shorts views). Once approved, you can enable monetization on your videos and start earning revenue. The application process reviews your channel for adherence to YouTube's policies and guidelines." },
        { question: "How can I increase my YouTube RPM?", answer: "To increase RPM, focus on creating longer videos (8+ minutes) to enable multiple mid-roll ad placements. Target topics with high advertiser demand like finance, technology, and business. Build an audience in Tier 1 countries (US, UK, Canada, Australia) where CPM rates are highest. Improve audience retention to maximize ad impressions per view. Upload consistently to maintain algorithmic favor. Diversify revenue with memberships, merchandise, and affiliate marketing alongside ad revenue." },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a YouTube Money Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A YouTube Money Calculator helps content creators estimate their potential earnings from the YouTube Partner Program.
              By entering your <strong>monthly views</strong>, <strong>CPM rate</strong>, <strong>RPM rate</strong>, and
              <strong> engagement rate</strong>, you get a comprehensive breakdown of monthly and yearly earnings,
              including ad revenue, memberships, sponsorships, and other income streams.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p>CPM Revenue = (Monthly Views ÷ 1,000) × CPM</p>
              <p>RPM Revenue = (Monthly Views ÷ 1,000) × RPM</p>
              <p><strong>Monthly Earnings = (CPM Revenue + RPM Revenue) ÷ 2</strong></p>
              <p>Yearly Earnings = Monthly Earnings × 12</p>
              <p>Revenue per 1,000 Views = Monthly Earnings ÷ Monthly Views × 1,000</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Scenario: 100,000 monthly views, $5.00 CPM, $3.00 RPM, 5% engagement.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>CPM Revenue = (100,000 ÷ 1,000) × $5.00 = <strong>$500</strong></li>
                <li>RPM Revenue = (100,000 ÷ 1,000) × $3.00 = <strong>$300</strong></li>
                <li>Monthly Earnings = ($500 + $300) ÷ 2 = <strong>$400</strong></li>
                <li>Yearly Earnings = $400 × 12 = <strong>$4,800</strong></li>
                <li>Per 1,000 Views = $400 ÷ 100,000 × 1,000 = <strong>$4.00</strong></li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Tips to Maximize YouTube Earnings</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
              <li><strong>Optimize video length</strong> - Videos over 8 minutes allow multiple mid-roll ad placements, significantly boosting ad revenue per view.</li>
              <li><strong>Target high-CPM niches</strong> - Finance, technology, business, and educational content consistently command higher CPM rates than entertainment or gaming.</li>
              <li><strong>Build a global audience</strong> - Viewers from the US, UK, Canada, and Australia generate the highest CPM. Create content that appeals to these markets.</li>
              <li><strong>Increase upload frequency</strong> - Consistent uploading signals reliability to YouTube's algorithm, leading to more impressions and views over time.</li>
              <li><strong>Diversify revenue streams</strong> - Combine ad revenue with channel memberships, Super Chats, merchandise, affiliate marketing, and brand sponsorships.</li>
              <li><strong>Improve retention rate</strong> - Higher audience retention means more ad impressions per view. Hook viewers in the first 15 seconds and maintain pacing.</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">YouTube CPM Benchmarks by Niche</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-semibold">Content Niche</th>
                    <th className="text-right py-2 font-semibold">Low CPM</th>
                    <th className="text-right py-2 font-semibold">Average CPM</th>
                    <th className="text-right py-2 font-semibold">High CPM</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    ["Finance & Investing", "$8", "$15", "$30+"],
                    ["Business & Entrepreneurship", "$6", "$12", "$25+"],
                    ["Technology & Reviews", "$5", "$10", "$20+"],
                    ["Education & Tutorials", "$4", "$8", "$18"],
                    ["Lifestyle & Vlogging", "$2", "$5", "$10"],
                    ["Entertainment", "$1", "$4", "$8"],
                    ["Gaming", "$0.50", "$3", "$6"],
                    ["Music & Animation", "$0.50", "$2", "$5"],
                  ].map(([niche, low, avg, high]) => (
                    <tr key={niche} className="border-b border-border/50">
                      <td className="py-2">{niche}</td>
                      <td className="text-right py-2">{low}</td>
                      <td className="text-right py-2">{avg}</td>
                      <td className="text-right py-2">{high}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.symbol} - {c.code}</option>)}
            </select>
          </div>

          <SliderField label="Monthly Views" icon={Play} value={views.value} displayValue={views.displayValue} onChange={(e) => views.setValue(parseFloat(e.target.value))} onTextChange={views.handleChange} onFocus={views.handleFocus} onBlur={views.handleBlur} min={100} max={50000000} step={100} formatDisplay={formatCompact(views.value)} />
          <SliderField label={`CPM (${cfg.symbol})`} icon={TrendingUp} value={cpm.value} displayValue={cpm.displayValue} onChange={(e) => cpm.setValue(parseFloat(e.target.value))} onTextChange={cpm.handleChange} onFocus={cpm.handleFocus} onBlur={cpm.handleBlur} min={0.5} max={20} step={0.1} formatDisplay={formatCurrency(cpm.value, currency)} prefix={cfg.symbol} />
          <SliderField label={`RPM (${cfg.symbol})`} icon={Wallet} value={rpm.value} displayValue={rpm.displayValue} onChange={(e) => rpm.setValue(parseFloat(e.target.value))} onTextChange={rpm.handleChange} onFocus={rpm.handleFocus} onBlur={rpm.handleBlur} min={0.5} max={15} step={0.1} formatDisplay={formatCurrency(rpm.value, currency)} prefix={cfg.symbol} />
          <SliderField label="Engagement Rate (%)" icon={ThumbsUp} value={engagement.value} displayValue={engagement.displayValue} onChange={(e) => engagement.setValue(parseFloat(e.target.value))} onTextChange={engagement.handleChange} onFocus={engagement.handleFocus} onBlur={engagement.handleBlur} min={0.1} max={20} step={0.1} />
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-emerald-500/10 to-primary/10 border border-emerald-500/20 rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Estimated Monthly Earnings
            </p>
            <p className="text-4xl font-extrabold text-foreground">{formatCurrency(results.monthlyEarnings, currency)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Yearly Earnings" value={formatCurrency(results.yearlyEarnings, currency)} icon={Calendar} tooltip="Projected annual earnings based on current monthly average" />
            <MetricCard label="CPM-based Revenue" value={formatCurrency(results.cpmBasedMonthly, currency)} icon={BarChart3} tooltip="Revenue estimate using CPM rate before YouTube's cut" />
            <MetricCard label="RPM-based Revenue" value={formatCurrency(results.rpmBasedMonthly, currency)} icon={Wallet} tooltip="Revenue estimate using RPM rate after YouTube's cut" />
            <MetricCard label="Per 1,000 Views" value={formatCurrency(results.perThousand, currency)} icon={Eye} tooltip="Average earnings per 1,000 views across all revenue sources" />
          </div>

          <div className="bg-white border border-border rounded-xl p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Revenue Breakdown
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
              <div className="w-32 h-32 flex-shrink-0 mx-auto sm:mx-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" strokeWidth={0}>
                      {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip formatter={(val: any) => formatCurrency(Number(val) || 0, currency)} />
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
                    <span className="font-medium">{formatCurrency(item.value, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 text-sm border-t border-border/50 pt-3">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Monthly Views</span>
                <span className="font-medium">{formatCompact(views.value)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Engagement Rate</span>
                <span className="font-medium">{engagement.value.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between py-1 border-t border-border/50 pt-1.5">
                <span className="font-semibold">Total Monthly Revenue</span>
                <span className="font-bold text-emerald-500">{formatCurrency(results.monthlyEarnings, currency)}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Monthly Views</p>
                <p className="text-sm font-semibold">{formatCompact(views.value)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">CPM-based</p>
                <p className="text-sm font-semibold text-emerald-500">{formatCurrency(results.cpmBasedMonthly, currency)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">RPM-based</p>
                <p className="text-sm font-semibold">{formatCurrency(results.rpmBasedMonthly, currency)}</p>
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
