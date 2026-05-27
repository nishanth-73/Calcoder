"use client";

import { useMemo } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Heart, MessageCircle, Hash, Eye, Users, TrendingUp, BarChart3, FileText, Camera, Radio, DollarSign, MousePointerClick, Target, PieChart as PieChartIcon } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";

function formatNumber(n: number): string {
  if (!Number.isFinite(n) || isNaN(n)) return "0";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

const CHART_COLORS = ["#f43f5e", "#8b5cf6", "#3b82f6", "#10b981"];

const RELATED_TOOLS = [
  { name: "Engagement Rate Calculator", href: "/marketing/engagement-rate-calculator", desc: "Calculate social media engagement rates." },
  { name: "YouTube Money Calculator", href: "/marketing/youtube-money-calculator", desc: "Estimate YouTube channel earnings." },
  { name: "TikTok Earnings Calculator", href: "/marketing/tiktok-earnings-calculator", desc: "Estimate TikTok Creator Fund earnings." },
  { name: "AdSense Revenue Calculator", href: "/marketing/adsense-calculator", desc: "Estimate Google AdSense earnings." },
  { name: "CPC Calculator", href: "/marketing/cpc-calculator", desc: "Calculate cost-per-click for ad campaigns." },
  { name: "CPM Calculator", href: "/marketing/cpm-calculator", desc: "Calculate cost per thousand impressions." },
  { name: "CTR Calculator", href: "/marketing/ctr-calculator", desc: "Calculate click-through rates for ads." },
  { name: "ROAS Calculator", href: "/marketing/roas-calculator", desc: "Measure return on ad spend." },
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

export default function InstagramReachCalculator() {
  const followers = useNumericField(10000);
  const likes = useNumericField(500);
  const comments = useNumericField(30);
  const hashtags = useNumericField(10);
  const storyViews = useNumericField(500);

  const results = useMemo(() => {
    const f = Math.max(0, followers.value);
    const l = Math.max(0, likes.value);
    const c = Math.max(0, comments.value);
    const h = Math.max(0, hashtags.value);
    const sv = Math.max(0, storyViews.value);

    const engagementRate = f > 0 ? ((l + c) / f) * 100 : 0;
    const hashtagBoost = Math.min(1.5, 1 + h * 0.03);
    const storyBoost = f > 0 ? Math.min(2, 1 + sv / f) : 1;
    const baseReach = f * 0.3;
    const estimatedReach = Math.min(f, baseReach * hashtagBoost * storyBoost);
    const reachRate = f > 0 ? (estimatedReach / f) * 100 : 0;
    const likesToFollower = f > 0 ? (l / f) * 100 : 0;
    const storyCompletionRate = f > 0 ? Math.min(100, (sv / (f * 0.15)) * 100) : 0;

    return { engagementRate, estimatedReach, reachRate, likesToFollower, storyCompletionRate };
  }, [followers.value, likes.value, comments.value, hashtags.value, storyViews.value]);

  const chartData = useMemo(() => [
    { name: "Likes", value: Math.max(0, likes.value) },
    { name: "Comments", value: Math.max(0, comments.value) },
    { name: "Story Views", value: Math.max(0, storyViews.value) },
    { name: "Other Reach", value: Math.max(0, results.estimatedReach - likes.value - comments.value - storyViews.value) },
  ], [likes.value, comments.value, storyViews.value, results.estimatedReach]);

  return (
    <ToolLayout
      title="Instagram Reach Calculator"
      description="Estimate your Instagram post reach based on followers, engagement patterns, hashtag usage, and story views."
      category="marketing"
      faqContent={[
        { question: "How does the Instagram Reach Calculator work?", answer: "This calculator estimates your Instagram post reach by analyzing your follower count, average likes and comments, hashtag usage, and story views. It calculates engagement rate, applies a hashtag boost factor, and incorporates story view patterns to project how many unique accounts will see your content. The model uses industry benchmarks for reach distribution across different content types." },
        { question: "What is a good engagement rate on Instagram?", answer: "Average Instagram engagement rates vary by follower count. Accounts with under 10K followers typically see 3-7% engagement. Accounts with 100K+ followers average 1-3%. The overall platform average is around 1-3% per post. Engagement rates above 5% are considered excellent. Micro-influencers often have higher rates due to more authentic connections with their audience." },
        { question: "How many hashtags should I use for maximum reach?", answer: "Instagram recommends using 3-5 relevant hashtags for optimal reach. While you can use up to 30, studies show posts with 5-10 hashtags perform best. Using too many can appear spammy and may reduce reach. Focus on a mix of broad and niche hashtags relevant to your content. The calculator applies a hashtag boost factor that increases with up to 10 hashtags before plateauing." },
        { question: "What is reach rate and why does it matter?", answer: "Reach rate is the percentage of your followers who actually see your content. It matters because high follower counts don't guarantee visibility. A reach rate of 30-40% is average for Instagram. Rates above 50% indicate strong content and algorithmic favor. Reach is more important than follower count for measuring actual content performance and brand value." },
        { question: "How do Instagram Reels affect reach?", answer: "Instagram Reels currently receive significantly higher organic reach than static posts or Stories. The platform prioritizes Reels in the Explore tab and main feed. Accounts using Reels see 30-50% higher reach rates on average. The calculator's base reach model accounts for this by assuming a mix of content types, with Reels getting preferential algorithmic treatment." },
        { question: "What is a good likes-to-follower ratio?", answer: "A healthy likes-to-follower ratio on Instagram is 2-5%. This means for every 100 followers, you get 2-5 likes per post. Ratios above 5% are excellent and indicate highly engaged audiences. Ratios below 1% suggest your content may not be resonating or you may have inactive/bot followers. Micro-accounts often have higher ratios than large accounts." },
        { question: "How do story views compare to feed post reach?", answer: "Story views are typically 15-25% of your follower count, while feed post reach averages 30-40%. Stories have a different algorithmic distribution - they appear in a separate bar at the top and depend on user behavior. Accounts with strong story engagement often see higher overall reach because Instagram rewards accounts that use all content formats." },
        { question: "How can I improve my Instagram reach?", answer: "To improve reach, post consistently (3-5 times per week), use a mix of Reels, carousels, and static images, engage with your audience in comments and DMs, use 5-10 relevant hashtags, post when your audience is most active, leverage trending audio and effects, collaborate with other creators, and analyze your Instagram Insights to understand what content resonates best with your audience." },
        { question: "How do Instagram algorithm updates affect my reach?", answer: "Instagram frequently updates its algorithm, affecting how content is ranked and distributed. Key changes include shifts from chronological to algorithmic feeds, increased Reels prioritization, and reduced organic reach for static posts. The algorithm now considers saved posts, shares, and time spent on content as strong signals. Staying adaptable - testing new formats, posting consistently, and monitoring Insights - helps maintain reach despite algorithm shifts." },
        { question: "How does reach compare across Reels, Stories, and Feed posts?", answer: "Reels typically achieve the highest organic reach, often 2-3x more than static feed posts, because Instagram actively promotes short-form video to compete with TikTok. Feed posts reach 30-40% of followers on average. Stories reach 15-25% of followers but boost overall account visibility. Carousel posts tend to perform well, with higher save and share rates. For best results, use a balanced content mix that leverages each format's strengths." },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is an Instagram Reach Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              An Instagram Reach Calculator helps content creators, influencers, and marketers estimate how many unique users
              will see their Instagram posts. By analyzing <strong>follower count</strong>, <strong>engagement metrics</strong>,
              <strong> hashtag strategy</strong>, and <strong>story views</strong>, this tool provides realistic reach projections
              to help you plan your content strategy and set performance benchmarks.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Key Metrics Explained</h3>
            <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
              <p><strong>Engagement Rate</strong> = (Likes + Comments) ÷ Followers × 100</p>
              <p><strong>Reach Rate</strong> = Estimated Reach ÷ Followers × 100</p>
              <p><strong>Hashtag Boost</strong> = 1 + (Hashtags Used × 0.03), capped at 1.5×</p>
              <p><strong>Estimated Reach</strong> = Base Reach (30% of followers) × Hashtag Boost × Story Boost</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Scenario: 10,000 followers, 500 likes, 30 comments, 10 hashtags, 500 story views.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Engagement Rate = (500 + 30) ÷ 10,000 × 100 = <strong>5.3%</strong></li>
                <li>Hashtag Boost = 1 + (10 × 0.03) = <strong>1.3×</strong></li>
                <li>Estimated Reach = 10,000 × 0.3 × 1.3 × 1.05 = <strong>4,095 users</strong></li>
                <li>Reach Rate = 4,095 ÷ 10,000 × 100 = <strong>40.95%</strong></li>
              </ul>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Reach Benchmarks by Follower Count</h3>
            <div className="bg-muted p-4 rounded-lg text-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 pr-4 font-semibold">Follower Range</th>
                    <th className="pb-2 pr-4 font-semibold">Avg. Reach Rate</th>
                    <th className="pb-2 pr-4 font-semibold">Avg. Engagement Rate</th>
                    <th className="pb-2 font-semibold">Content Strategy</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">1K - 10K</td>
                    <td className="py-2 pr-4">40-60%</td>
                    <td className="py-2 pr-4">3-7%</td>
                    <td className="py-2">High engagement; prioritize community building</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">10K - 50K</td>
                    <td className="py-2 pr-4">30-45%</td>
                    <td className="py-2 pr-4">2-5%</td>
                    <td className="py-2">Mix of Reels and static posts; leverage niche hashtags</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">50K - 500K</td>
                    <td className="py-2 pr-4">20-35%</td>
                    <td className="py-2 pr-4">1-3%</td>
                    <td className="py-2">Consistent posting schedule; focus on Reels and collaborations</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">500K+</td>
                    <td className="py-2 pr-4">10-25%</td>
                    <td className="py-2 pr-4">0.5-2%</td>
                    <td className="py-2">Data-driven content; leverage brand partnerships</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Tips to Improve Instagram Reach</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground space-y-2">
              <p><strong>1. Prioritize Reels.</strong> Short-form video content consistently receives the highest organic reach on Instagram. Aim for at least 3-4 Reels per week.</p>
              <p><strong>2. Optimize posting time.</strong> Post when your audience is most active. Use Instagram Insights to find your followers&apos; peak hours and schedule posts accordingly.</p>
              <p><strong>3. Write engaging captions.</strong> Captions that prompt saves and shares signal high value to the algorithm. Use storytelling, questions, and calls-to-action to boost engagement.</p>
              <p><strong>4. Use a consistent hashtag strategy.</strong> Create a set of 5-10 relevant hashtags that mix broad terms with niche tags. Rotate them regularly to avoid being flagged as spam.</p>
              <p><strong>5. Engage authentically.</strong> Reply to comments, start conversations in DMs, and interact with accounts in your niche. The algorithm rewards accounts that build community.</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Common Mistakes to Avoid</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground space-y-2">
              <p><strong>Ignoring analytics.</strong> Posting without reviewing Insights means you&apos;re flying blind. Check which content types, topics, and posting times drive the most reach.</p>
              <p><strong>Using too many hashtags.</strong> While 30 hashtags are allowed, performance studies show 5-10 relevant tags outperform the maximum. Spammy hashtag stuffing can hurt reach.</p>
              <p><strong>Posting infrequently.</strong> Posting once a week or less makes it hard for the algorithm to establish your account as active and relevant. Consistency matters more than volume.</p>
              <p><strong>Neglecting Stories.</strong> Stories boost overall account visibility and strengthen audience connection. Use polls, questions, and countdowns to keep viewers engaged daily.</p>
              <p><strong>Buying followers.</strong> Purchased followers inflate your count but kill your engagement rate. The algorithm penalizes accounts with low engagement relative to follower count.</p>
            </div>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-6">
          <SliderField label="Total Followers" icon={Users} value={followers.value} displayValue={followers.displayValue} onChange={(e) => followers.setValue(parseFloat(e.target.value))} onTextChange={followers.handleChange} onFocus={followers.handleFocus} onBlur={followers.handleBlur} min={100} max={100000000} step={100} formatDisplay={formatCompact(followers.value)} />
          <SliderField label="Average Likes" icon={Heart} value={likes.value} displayValue={likes.displayValue} onChange={(e) => likes.setValue(parseFloat(e.target.value))} onTextChange={likes.handleChange} onFocus={likes.handleFocus} onBlur={likes.handleBlur} min={0} max={10000000} step={1} formatDisplay={formatCompact(likes.value)} />
          <SliderField label="Average Comments" icon={MessageCircle} value={comments.value} displayValue={comments.displayValue} onChange={(e) => comments.setValue(parseFloat(e.target.value))} onTextChange={comments.handleChange} onFocus={comments.handleFocus} onBlur={comments.handleBlur} min={0} max={100000} step={1} formatDisplay={formatCompact(comments.value)} />
          <SliderField label="Hashtags Used" icon={Hash} value={hashtags.value} displayValue={hashtags.displayValue} onChange={(e) => hashtags.setValue(parseFloat(e.target.value))} onTextChange={hashtags.handleChange} onFocus={hashtags.handleFocus} onBlur={hashtags.handleBlur} min={0} max={30} step={1} />
          <SliderField label="Story Views" icon={Camera} value={storyViews.value} displayValue={storyViews.displayValue} onChange={(e) => storyViews.setValue(parseFloat(e.target.value))} onTextChange={storyViews.handleChange} onFocus={storyViews.handleFocus} onBlur={storyViews.handleBlur} min={0} max={10000000} step={10} formatDisplay={formatCompact(storyViews.value)} />
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-rose-500/10 to-violet-500/10 border border-rose-500/20 rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <BarChart3 className="w-4 h-4 text-rose-500" />
              Estimated Reach
            </p>
            <p className="text-4xl font-extrabold text-rose-500">{formatCompact(results.estimatedReach)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Engagement Rate", value: formatPercent(results.engagementRate), icon: TrendingUp },
              { label: "Reach Rate", value: formatPercent(results.reachRate), icon: Eye },
              { label: "Likes-to-Follower", value: formatPercent(results.likesToFollower), icon: Heart },
              { label: "Story Completion", value: formatPercent(results.storyCompletionRate), icon: Radio },
            ].map((item) => (
              <div key={item.label} className="bg-white border border-border rounded-xl p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                  <item.icon className="w-3 h-3" />
                  {item.label}
                </p>
                <p className="text-lg font-bold text-rose-500">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-border rounded-xl p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Engagement Breakdown
            </p>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-32 h-32 flex-shrink-0">
                <ResponsiveContainer initialDimension={{width:100,height:100}} width="100%" height="100%">
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
                    <span className="font-medium">{formatCompact(item.value)}</span>
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
                <span className="text-muted-foreground">Hashtags</span>
                <span className="font-medium">{hashtags.value}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-medium">Total Reach</span>
                <span className="font-bold text-rose-500">{formatCompact(results.estimatedReach)}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Followers</p>
                <p className="text-sm font-semibold">{formatCompact(followers.value)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Reach</p>
                <p className="text-sm font-semibold text-emerald-500">{formatCompact(results.estimatedReach)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Engagement Rate</p>
                <p className="text-sm font-semibold">{formatPercent(results.engagementRate)}</p>
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
