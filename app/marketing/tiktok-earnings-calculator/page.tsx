"use client";

import { useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { DollarSign, TrendingUp, Users, Eye, Video, Calendar, FileText, BadgePercent, Music, CreditCard } from "lucide-react";
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

function formatPercent(n: number): string {
  if (!Number.isFinite(n) || isNaN(n)) return "0%";
  return `${n.toFixed(2)}%`;
}

const CHART_COLORS = ["#25f4ee", "#fe2c55", "#f59e0b", "#8b5cf6"];

const RELATED_TOOLS = [
  { name: "YouTube Money Calculator", href: "/marketing/youtube-money-calculator", desc: "Estimate YouTube channel earnings." },
  { name: "Instagram Reach Calculator", href: "/marketing/instagram-reach-calculator", desc: "Estimate Instagram post reach." },
  { name: "AdSense Revenue Calculator", href: "/marketing/adsense-calculator", desc: "Estimate Google AdSense earnings." },
  { name: "Engagement Rate Calculator", href: "/marketing/engagement-rate-calculator", desc: "Calculate social media engagement rates." },
  { name: "Facebook Money Calculator", href: "/marketing/facebook-money-calculator", desc: "Estimate Facebook page earnings." },
  { name: "Twitter Earnings Calculator", href: "/marketing/twitter-earnings-calculator", desc: "Estimate Twitter/X creator earnings." },
  { name: "Twitch Earnings Calculator", href: "/marketing/twitch-earnings-calculator", desc: "Estimate Twitch streaming income." },
  { name: "LinkedIn Money Calculator", href: "/marketing/linkedin-money-calculator", desc: "Estimate LinkedIn content earnings." },
];

function SliderField({ label, icon: Icon, value, displayValue, onChange, onTextChange, onFocus, onBlur, min, max, step, formatDisplay, unit, prefix }: {
  label: string; icon: React.ElementType; value: number; displayValue: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onTextChange: (raw: string) => void; onFocus: () => void; onBlur: () => void; min: number; max: number; step: number; formatDisplay?: string; unit?: string; prefix?: string;
}) {
  const isPercent = unit === "%";
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm font-medium">
        <Icon className="w-4 h-4 text-primary" />
        <span>{label}</span>
        <span className="ml-auto text-lg font-bold text-primary">{formatDisplay ?? value}</span>
      </label>
      {isPercent ? (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input type="text" inputMode="decimal" value={displayValue} onFocus={onFocus} onBlur={onBlur} onChange={(e) => onTextChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter value" />
          </div>
          <span className="text-muted-foreground font-medium text-sm">%</span>
        </div>
      ) : prefix ? (
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
        <span>{min.toLocaleString()}{unit ?? ""}</span>
        <span>{max.toLocaleString()}{unit ?? ""}</span>
      </div>
    </div>
  );
}

export default function TiktokEarningsCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");

  const followers = useNumericField(10000);
  const avgViews = useNumericField(50000);
  const engagement = useNumericField(5);
  const videosPerMonth = useNumericField(15);
  const sponsorshipRate = useNumericField(500);

  const results = useMemo(() => {
    const f = Math.max(0, followers.value);
    const av = Math.max(0, avgViews.value);
    const eng = Math.max(0, engagement.value);
    const vpm = Math.max(1, videosPerMonth.value);
    const sr = Math.max(0, sponsorshipRate.value);

    const rpm = 0.02 + (eng / 100) * 0.02;
    const creatorFundPerVideo = (av / 1000) * rpm;
    const creatorFundMonthly = creatorFundPerVideo * vpm;
    const sponsorshipMonthly = sr * Math.max(1, Math.round(vpm / 4));
    const totalMonthly = creatorFundMonthly + sponsorshipMonthly;
    const yearlyEarnings = totalMonthly * 12;
    const perVideo = totalMonthly / vpm;

    return { creatorFundMonthly, sponsorshipMonthly, totalMonthly, yearlyEarnings, perVideo, rpm };
  }, [followers.value, avgViews.value, engagement.value, videosPerMonth.value, sponsorshipRate.value]);

  const chartData = useMemo(() => [
    { name: "Creator Fund", value: Math.max(0, results.creatorFundMonthly) },
    { name: "Sponsorships", value: Math.max(0, results.sponsorshipMonthly) },
  ], [results]);

  const cfg = getCurrency(currency);

  return (
    <ToolLayout
      title="TikTok Earnings Calculator"
      description="Estimate your TikTok Creator Fund earnings and sponsored post revenue based on followers, views, and engagement."
      category="marketing"
      faqContent={[
        { question: "How does the TikTok Earnings Calculator work?", answer: "This calculator estimates TikTok earnings by combining Creator Fund revenue with sponsorship income. Creator Fund earnings are calculated using an RPM (Revenue Per Mille) that scales with engagement rate, typically $0.02-$0.04 per 1,000 views. Sponsorship income is estimated based on your sponsorship rate per post and how many sponsored posts you can realistically secure per month." },
        { question: "How much does TikTok pay per 1,000 views?", answer: "TikTok's Creator Fund pays approximately $0.02 to $0.04 per 1,000 views, which is significantly lower than YouTube's RPM. This means 1 million views might earn only $20-$40 from the Creator Fund. The calculator adjusts RPM based on your engagement rate - higher engagement suggests better audience quality, which can slightly increase effective RPM. Most TikTok creators earn the bulk of their income from sponsorships, not the Creator Fund." },
        { question: "How many followers do you need to make money on TikTok?", answer: "You need at least 10,000 followers, 100,000 video views in the past 30 days, and an account that follows TikTok's community guidelines to join the Creator Fund. However, many creators start earning through brand sponsorships and affiliate marketing with as few as 1,000-5,000 followers if they have high engagement. The real earning potential grows significantly after 100,000 followers." },
        { question: "How much can you earn from TikTok sponsorships?", answer: "TikTok sponsorship rates vary by niche and engagement. Micro-creators (10K-50K followers) typically earn $50-$500 per sponsored post. Mid-tier creators (50K-500K followers) earn $500-$5,000 per post. Top creators (500K+) can earn $5,000-$50,000+ per post. The calculator assumes you secure 1-2 sponsored posts per month, scaling with your follower count and posting frequency." },
        { question: "What engagement rate is good for TikTok?", answer: "TikTok engagement rates are typically higher than other platforms, averaging 5-15% across the platform. Rates above 15% are excellent, while rates below 3% may indicate content issues. High engagement is crucial for TikTok because the algorithm prioritizes content with strong engagement signals, leading to more views and higher earning potential." },
        { question: "How does TikTok's algorithm affect earnings?", answer: "TikTok's For You Page algorithm is the primary driver of views and earnings. Videos that perform well in the first hour get pushed to larger audiences. Factors that boost algorithmic performance include high completion rates (watch time), shares, comments, and likes. The calculator accounts for this through the engagement rate input - higher engagement leads to more views and higher effective RPM." },
        { question: "What is RPM on TikTok?", answer: "RPM (Revenue Per Mille) on TikTok represents your earnings per 1,000 video views from the Creator Fund. It ranges from $0.02 to $0.04, much lower than YouTube's RPM. The calculator estimates RPM based on your engagement rate, using the formula: RPM = $0.02 + (Engagement Rate ÷ 100) × $0.02. Higher engagement signals better content quality, potentially leading to slightly better RPM." },
        { question: "How accurate are TikTok earnings estimates?", answer: "TikTok earnings estimates are approximations based on publicly available data and creator reports. Actual earnings vary based on viewer location, video length, completion rates, ad inventory, time of year, and Creator Fund policy changes. Sponsorship estimates are particularly variable since rates depend on your niche, negotiation skills, and brand relationships. Use this tool as a planning guide." },
        { question: "TikTok Shop earnings vs Creator Fund - which pays more?", answer: "TikTok Shop (affiliate/e-commerce) earnings can far exceed Creator Fund revenue for most creators. While Creator Fund pays $0.02-$0.04 per 1,000 views, TikTok Shop creators earn commissions on products sold through their videos and live streams, often 10-30% per sale. A single viral product video can generate hundreds or thousands of dollars in commissions. Many creators now focus primarily on TikTok Shop as their main revenue stream, treating Creator Fund as a small bonus." },
        { question: "How does geography affect TikTok earnings?", answer: "Viewer location significantly impacts TikTok earnings. Creator Fund RPM is higher for viewers in the US, UK, Canada, and Australia ($0.03-$0.06) compared to viewers in India, Southeast Asia, or Africa ($0.01 or less). Sponsorship rates also vary by geography - US-based creators command 2-5x higher rates than creators in developing markets with similar follower counts. The calculator uses blended average rates, but actual earnings may differ based on your audience's geographic composition." },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a TikTok Earnings Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A TikTok Earnings Calculator helps TikTok creators estimate their potential income from the TikTok Creator Fund
              and brand sponsorships. By entering your <strong>follower count</strong>, <strong>average views per video</strong>,
              <strong> engagement rate</strong>, <strong>posting frequency</strong>, and <strong>sponsorship rate</strong>,
              you get a comprehensive projection of your monthly and yearly earnings potential.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p>RPM = $0.02 + (Engagement Rate ÷ 100) × $0.02</p>
              <p>Creator Fund/Video = (Views ÷ 1,000) × RPM</p>
              <p><strong>Creator Fund Monthly = Creator Fund/Video × Videos Per Month</strong></p>
              <p>Sponsorship Monthly = Sponsorship Rate × Sponsorships Per Month</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Scenario: 10,000 followers, 50,000 views/video, 5% engagement, 15 videos/month, $500 sponsorship rate.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>RPM = $0.02 + (5% ÷ 100) × $0.02 = <strong>$0.021</strong></li>
                <li>Creator Fund/Video = (50,000 ÷ 1,000) × $0.021 = <strong>$1.05</strong></li>
                <li>Creator Fund Monthly = $1.05 × 15 = <strong>$15.75</strong></li>
                <li>Sponsorship Monthly = $500 × 4 = <strong>$2,000</strong></li>
                <li><strong>Total Monthly = $2,015.75</strong></li>
              </ul>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Earnings Benchmarks by Follower Count</h3>
            <div className="bg-muted p-4 rounded-lg text-sm">
              <p className="text-muted-foreground mb-3">The table below shows typical monthly earning ranges for TikTok creators at different follower tiers.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 pr-4 font-semibold">Follower Range</th>
                      <th className="py-2 pr-4 font-semibold">Creator Fund / Month</th>
                      <th className="py-2 pr-4 font-semibold">Sponsorships / Month</th>
                      <th className="py-2 font-semibold">Total Estimated / Month</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium text-foreground">10K - 50K</td>
                      <td className="py-2 pr-4">$5 - $30</td>
                      <td className="py-2 pr-4">$50 - $500</td>
                      <td className="py-2">$55 - $530</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium text-foreground">50K - 100K</td>
                      <td className="py-2 pr-4">$30 - $100</td>
                      <td className="py-2 pr-4">$500 - $1,500</td>
                      <td className="py-2">$530 - $1,600</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium text-foreground">100K - 500K</td>
                      <td className="py-2 pr-4">$100 - $500</td>
                      <td className="py-2 pr-4">$1,500 - $5,000</td>
                      <td className="py-2">$1,600 - $5,500</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium text-foreground">500K - 1M</td>
                      <td className="py-2 pr-4">$500 - $2,000</td>
                      <td className="py-2 pr-4">$5,000 - $15,000</td>
                      <td className="py-2">$5,500 - $17,000</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium text-foreground">1M+</td>
                      <td className="py-2 pr-4">$2,000 - $10,000+</td>
                      <td className="py-2 pr-4">$15,000 - $50,000+</td>
                      <td className="py-2">$17,000 - $60,000+</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Tips to Maximize TikTok Earnings</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground space-y-2">
              <p><strong className="text-foreground">Diversify revenue streams.</strong> Do not rely solely on the Creator Fund. Combine sponsorships, TikTok Shop commissions, affiliate marketing, and merchandise to build a resilient income. Creators with 3+ revenue streams earn significantly more than those depending only on the Creator Fund.</p>
              <p><strong className="text-foreground">Post consistently.</strong> The TikTok algorithm favors accounts that post at least once daily. Higher posting frequency gives you more chances to go viral and increases your total view count, directly boosting both Creator Fund and sponsorship income.</p>
              <p><strong className="text-foreground">Optimize for watch time.</strong> Videos with high completion rates are pushed to more users. Keep content fast-paced, hook viewers in the first 2 seconds, and use trending formats to maximize retention. Longer watch times lead to more views and higher RPM.</p>
              <p><strong className="text-foreground">Build a niche audience.</strong> Brands pay premium rates for creators in high-value niches like finance (FinTok), tech, education, and beauty. A smaller but highly engaged audience in a lucrative niche can earn more than a large general audience.</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Common Mistakes to Avoid</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground space-y-2">
              <p><strong className="text-foreground">Over-relying on Creator Fund revenue.</strong> Many new creators focus solely on Creator Fund earnings, which typically pay less than $100/month even at 100K followers. The real money is in sponsorships, TikTok Shop, and other monetization methods. Use Creator Fund as supplemental income, not your main goal.</p>
              <p><strong className="text-foreground">Ignoring engagement rate.</strong> A high follower count means little if engagement is low. Brands and the algorithm both prioritize engagement rate over raw follower numbers. Focus on creating content that drives comments, shares, and saves rather than chasing vanity metrics.</p>
              <p><strong className="text-foreground">Underpricing sponsorships.</strong> Many creators accept brand deals for far less than they are worth. A common rule is to charge $50-$100 per 10,000 followers for a standard sponsored post, but this varies by niche. Always negotiate and factor in usage rights, exclusivity, and production effort.</p>
              <p><strong className="text-foreground">Inconsistent posting schedule.</strong> Posting sporadically hurts both algorithmic reach and sponsor relationships. Brands want to work with creators who have a reliable posting cadence. Aim for at least 4-5 posts per week to maintain growth and maximize earnings.</p>
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

          <SliderField label="Total Followers" icon={Users} value={followers.value} displayValue={followers.displayValue} onChange={(e) => followers.setValue(parseFloat(e.target.value))} onTextChange={followers.handleChange} onFocus={followers.handleFocus} onBlur={followers.handleBlur} min={100} max={100000000} step={100} formatDisplay={formatCompact(followers.value)} />
          <SliderField label={`Avg Views Per Video`} icon={Eye} value={avgViews.value} displayValue={avgViews.displayValue} onChange={(e) => avgViews.setValue(parseFloat(e.target.value))} onTextChange={avgViews.handleChange} onFocus={avgViews.handleFocus} onBlur={avgViews.handleBlur} min={100} max={50000000} step={100} formatDisplay={formatCompact(avgViews.value)} />
          <SliderField label="Engagement Rate (%)" icon={BadgePercent} value={engagement.value} displayValue={engagement.displayValue} onChange={(e) => engagement.setValue(parseFloat(e.target.value))} onTextChange={engagement.handleChange} onFocus={engagement.handleFocus} onBlur={engagement.handleBlur} min={0.1} max={50} step={0.1} unit="%" />
          <SliderField label="Videos Per Month" icon={Video} value={videosPerMonth.value} displayValue={videosPerMonth.displayValue} onChange={(e) => videosPerMonth.setValue(parseFloat(e.target.value))} onTextChange={videosPerMonth.handleChange} onFocus={videosPerMonth.handleFocus} onBlur={videosPerMonth.handleBlur} min={1} max={60} step={1} />
          <SliderField label={`Sponsorship Rate (${cfg.symbol})`} icon={DollarSign} value={sponsorshipRate.value} displayValue={sponsorshipRate.displayValue} onChange={(e) => sponsorshipRate.setValue(parseFloat(e.target.value))} onTextChange={sponsorshipRate.handleChange} onFocus={sponsorshipRate.handleFocus} onBlur={sponsorshipRate.handleBlur} min={0} max={100000} step={10} formatDisplay={formatCurrency(sponsorshipRate.value, currency)} prefix={cfg.symbol} />
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-teal-400/10 to-rose-500/10 border border-teal-400/20 rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-teal-500" />
              Estimated Monthly Earnings
            </p>
            <p className="text-4xl font-extrabold text-teal-500">{formatCurrency(results.totalMonthly, currency)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Creator Fund Monthly", value: formatCurrency(results.creatorFundMonthly, currency), icon: Music },
              { label: "Sponsorship Monthly", value: formatCurrency(results.sponsorshipMonthly, currency), icon: CreditCard },
              { label: "Yearly Earnings", value: formatCurrency(results.yearlyEarnings, currency), icon: Calendar },
              { label: "Earnings Per Video", value: formatCurrency(results.perVideo, currency), icon: Video },
            ].map((item) => (
              <div key={item.label} className="bg-white border border-border rounded-xl p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                  <item.icon className="w-3 h-3" />
                  {item.label}
                </p>
                <p className="text-lg font-bold text-teal-500">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-border rounded-xl p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Income Breakdown
            </p>
            <div className="flex items-center gap-4 mb-4">
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
            <div className="space-y-2 text-sm border-t border-border/50 pt-3">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Followers</span>
                <span className="font-medium">{formatCompact(followers.value)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Engagement Rate</span>
                <span className="font-medium">{formatPercent(engagement.value)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Effective RPM</span>
                <span className="font-medium">{formatCurrency(results.rpm, currency)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-medium">Total Monthly</span>
                <span className="font-bold text-teal-500">{formatCurrency(results.totalMonthly, currency)}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Followers</p>
                <p className="text-sm font-semibold">{formatCompact(followers.value)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Creator Fund</p>
                <p className="text-sm font-semibold text-emerald-500">{formatCurrency(results.creatorFundMonthly, currency)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Total Monthly</p>
                <p className="text-sm font-semibold">{formatCurrency(results.totalMonthly, currency)}</p>
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
