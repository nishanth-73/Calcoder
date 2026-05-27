"use client";

import { useMemo } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import {
  Users, Eye, FileText, Heart, MessageCircle, Repeat2, Bookmark,
  TrendingUp, BarChart3, Activity, Star
} from "lucide-react";

const RELATED_TOOLS = [
  { name: "YouTube Money Calculator", href: "/marketing/youtube-money-calculator", desc: "Estimate YouTube channel earnings and revenue." },
  { name: "Instagram Reach Calculator", href: "/marketing/instagram-reach-calculator", desc: "Calculate your Instagram post reach and impressions." },
  { name: "TikTok Earnings Calculator", href: "/marketing/tiktok-earnings-calculator", desc: "Estimate potential TikTok creator earnings." },
  { name: "CPM Calculator", href: "/marketing/cpm-calculator", desc: "Calculate cost per mille for your ad campaigns." },
  { name: "CTR Calculator", href: "/marketing/ctr-calculator", desc: "Calculate click-through rate for your ads." },
  { name: "AdSense Revenue Calculator", href: "/marketing/adsense-calculator", desc: "Estimate your Google AdSense earnings." },
];

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

function formatPercent(value: number): string {
  if (!Number.isFinite(value) || isNaN(value)) return "0%";
  return `${(Math.round(value * 1000) / 10).toFixed(1)}%`;
}

const PIE_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444"];

function getEngagementBadge(er: number): { label: string; color: string } {
  if (er < 1) return { label: "Low", color: "text-red-500 bg-red-50 border-red-200" };
  if (er < 3.5) return { label: "Average", color: "text-yellow-600 bg-yellow-50 border-yellow-200" };
  if (er < 6) return { label: "Good", color: "text-emerald-500 bg-emerald-50 border-emerald-200" };
  return { label: "High", color: "text-blue-500 bg-blue-50 border-blue-200" };
}

interface PieTooltipPayload {
  name: string;
  value: number;
  fill: string;
}

function PieTooltipContent({ active, payload }: { active?: boolean; payload?: PieTooltipPayload[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0];
  const total = payload.reduce((s: number, p: PieTooltipPayload) => s + p.value, 0);
  const pct = total > 0 ? ((data.value / total) * 100).toFixed(1) : "0";
  return (
    <div className="bg-white border border-border rounded-xl shadow-xl p-3 text-sm">
      <p className="font-medium">{data.name}: {formatCompact(data.value)} ({pct}%)</p>
    </div>
  );
}

export default function EngagementRateCalculator() {
  const { value: followers, displayValue: followersDisplay, setValue: setFollowers, handleChange: handleFollowersChange, handleFocus: handleFollowersFocus, handleBlur: handleFollowersBlur } = useNumericField(10000);
  const { value: reach, displayValue: reachDisplay, setValue: setReach, handleChange: handleReachChange, handleFocus: handleReachFocus, handleBlur: handleReachBlur } = useNumericField(5000);
  const { value: posts, displayValue: postsDisplay, setValue: setPosts, handleChange: handlePostsChange, handleFocus: handlePostsFocus, handleBlur: handlePostsBlur } = useNumericField(30);
  const { value: likes, displayValue: likesDisplay, setValue: setLikes, handleChange: handleLikesChange, handleFocus: handleLikesFocus, handleBlur: handleLikesBlur } = useNumericField(500);
  const { value: comments, displayValue: commentsDisplay, setValue: setComments, handleChange: handleCommentsChange, handleFocus: handleCommentsFocus, handleBlur: handleCommentsBlur } = useNumericField(50);
  const { value: shares, displayValue: sharesDisplay, setValue: setShares, handleChange: handleSharesChange, handleFocus: handleSharesFocus, handleBlur: handleSharesBlur } = useNumericField(100);
  const { value: saves, displayValue: savesDisplay, setValue: setSaves, handleChange: handleSavesChange, handleFocus: handleSavesFocus, handleBlur: handleSavesBlur } = useNumericField(25);

  const results = useMemo(() => {
    const f = Number.isFinite(followers) ? Math.max(0, followers) : 0;
    const r = Number.isFinite(reach) ? Math.max(0, reach) : 0;
    const p = Number.isFinite(posts) ? Math.max(1, posts) : 1;
    const l = Number.isFinite(likes) ? Math.max(0, likes) : 0;
    const c = Number.isFinite(comments) ? Math.max(0, comments) : 0;
    const s = Number.isFinite(shares) ? Math.max(0, shares) : 0;
    const sv = Number.isFinite(saves) ? Math.max(0, saves) : 0;

    const totalEngagements = l + c + s + sv;
    const erByFollowers = f > 0 ? (totalEngagements / f) * 100 : 0;
    const erByReach = r > 0 ? (totalEngagements / r) * 100 : 0;
    const avgPerPost = totalEngagements / p;

    return { totalEngagements, erByFollowers, erByReach, avgPerPost, f, r, p, l, c, s, sv };
  }, [followers, reach, posts, likes, comments, shares, saves]);

  const pieData = useMemo(() => [
    { name: "Likes", value: results.l },
    { name: "Comments", value: results.c },
    { name: "Shares", value: results.s },
    { name: "Saves", value: results.sv },
  ], [results.l, results.c, results.s, results.sv]);

  const badge = getEngagementBadge(results.erByFollowers);
  const inputRangeClass = "w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer";

  return (
    <ToolLayout
      title="Engagement Rate Calculator"
      description="Calculate your social media engagement rate across platforms. Measure likes, comments, shares, and saves against followers and reach."
      category="marketing"
      faqContent={[
        {
          question: "What is a good engagement rate on Instagram?",
          answer: "The average engagement rate on Instagram ranges from 0.5% to 3%. A rate above 3% is considered good, while rates above 6% are excellent. However, engagement rates vary significantly by industry, account size, and content type. Micro-influencers (1K-10K followers) often see higher engagement rates (3-6%) compared to larger accounts (0.5-2%), as smaller audiences tend to be more engaged and loyal.",
        },
        {
          question: "How is engagement rate different from reach?",
          answer: "Engagement rate measures the percentage of people who interacted with your content (likes, comments, shares, saves) relative to your audience size (followers or reach). Reach is simply the number of unique users who saw your content. A high reach with low engagement suggests your content is being seen but not resonating, while high engagement with lower reach indicates a highly engaged but smaller audience.",
        },
        {
          question: "Should I include saves in engagement rate?",
          answer: "Yes, saves should absolutely be included in engagement rate calculations. Saves are a strong engagement signal - they indicate that users found your content valuable enough to bookmark for later. Many social media algorithms weigh saves heavily, considering them a high-intent action. Including saves provides a more complete picture of how your audience values your content.",
        },
        {
          question: "What's the difference between ER by followers vs ER by reach?",
          answer: "Engagement Rate by Followers measures engagement as a percentage of your total follower count, showing how well you engage your existing audience. Engagement Rate by Reach measures engagement as a percentage of people who actually saw your post, showing how compelling your content is to viewers. ER by Reach is often higher and is useful for evaluating content quality, while ER by Followers is better for overall account health benchmarking.",
        },
        {
          question: "What is the average engagement rate on TikTok?",
          answer: "TikTok typically has the highest engagement rates across all platforms, averaging 3-10%. This is due to TikTok's algorithmic content distribution that shows videos to interested users regardless of follower count. Viral content can achieve engagement rates above 20%. The platform's interactive features (duets, stitches, effects) also drive higher interaction rates compared to other social networks.",
        },
        {
          question: "How often should I track engagement rate?",
          answer: "Engagement rate should be tracked consistently - weekly for active accounts and monthly for casual posters. Track after every 10-15 posts to identify patterns. Look for trends over time rather than fixating on individual post performance. A declining engagement rate over several weeks may indicate content fatigue or algorithm changes, while an improving trend suggests your content strategy is working.",
        },
        {
          question: "What factors affect engagement rate?",
          answer: "Key factors include: posting time and frequency, content quality and format (video vs image vs carousel), use of trending audio/hashtags, caption length and CTAs, account size (smaller accounts typically have higher ER), audience demographics, platform algorithm changes, and seasonality. Posting when your audience is most active and using interactive elements like polls and questions can significantly boost engagement.",
        },
        {
          question: "Can engagement rate help predict viral content?",
          answer: "Engagement rate is one of the best predictors of viral potential. Content that achieves a high engagement rate (especially shares and saves) in the first 1-2 hours signals to algorithms that it is valuable, triggering broader distribution. Posts with engagement rates 2-3x above your average within the first hour have significantly higher viral potential. This is why many creators monitor early engagement metrics closely.",
        },
        {
          question: "What is a good engagement rate on LinkedIn?",
          answer: "LinkedIn engagement rates average 0.5-2%, which is lower than Instagram or TikTok but higher than Twitter/X. Professional content, industry insights, and thought leadership posts typically perform best. LinkedIn's algorithm favors content that sparks conversations, so posts with thoughtful comments and replies can see higher engagement rates. Video content on LinkedIn often achieves 2-3x higher engagement than text posts.",
        },
        {
          question: "How do I improve my engagement rate?",
          answer: "To improve engagement rate: post consistently at optimal times, use high-quality visuals and video content, write compelling captions with clear CTAs, engage back with your audience (reply to comments), use relevant hashtags, post interactive content (polls, questions, quizzes), leverage trending topics and sounds, collaborate with other creators, analyze your top-performing content and replicate its patterns, and focus on quality over quantity.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is Engagement Rate?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Engagement Rate is a social media metric that measures the level of interaction your content receives relative to your audience size. It is calculated by dividing <strong>total engagements</strong> (likes, comments, shares, saves) by either <strong>total followers</strong> or <strong>post reach</strong>, then multiplying by 100 to get a percentage. This metric helps content creators, influencers, and brands understand how well their content resonates with their audience.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p>Total Engagements = Likes + Comments + Shares + Saves</p>
              <p>ER (by Followers) = (Total Engagements ÷ Followers) × 100</p>
              <p>ER (by Reach) = (Total Engagements ÷ Reach) × 100</p>
              <p><strong>Avg Engagement Per Post = Total Engagements ÷ Posts</strong></p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Why Engagement Rate Matters</h3>
            <p className="text-sm leading-relaxed text-muted-foreground mb-3">
              Engagement rate is widely considered the most important social media metric because it measures genuine audience interest rather than vanity metrics like follower count. A high engagement rate indicates that your content is resonating, your audience is active, and your community is healthy.
            </p>
            <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Platform Benchmarks:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Instagram: 0.5% - 3% (average ~1%)</li>
                <li>TikTok: 3% - 10% (average ~5%)</li>
                <li>YouTube: 2% - 5% (average ~3%)</li>
                <li>LinkedIn: 0.5% - 2% (average ~1%)</li>
                <li>Twitter / X: 0.1% - 0.5% (average ~0.3%)</li>
                <li>Facebook: 0.5% - 1.5% (average ~0.8%)</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Benefits of Tracking Engagement</h3>
            <ul className="list-disc pl-5 text-sm leading-relaxed text-muted-foreground space-y-1">
              <li><strong>Content Optimization:</strong> Identify which content types drive the most interaction and refine your strategy accordingly.</li>
              <li><strong>Algorithm Favorability:</strong> Platforms prioritize content with high engagement, increasing your organic reach.</li>
              <li><strong>Monetization Potential:</strong> Brands pay premium rates for creators with high engagement rates, not just large follower counts.</li>
              <li><strong>Community Health:</strong> Track audience loyalty and content resonance over time.</li>
              <li><strong>Competitive Analysis:</strong> Compare your engagement rate against industry benchmarks and competitors.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Scenario: 10,000 followers, 5,000 reach, 30 posts, 500 likes, 50 comments, 100 shares, 25 saves.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Total Engagements = 500 + 50 + 100 + 25 = <strong>675</strong></li>
                <li>ER by Followers = (675 ÷ 10,000) × 100 = <strong>6.75%</strong></li>
                <li>ER by Reach = (675 ÷ 5,000) × 100 = <strong>13.5%</strong></li>
                <li>Avg Engagement Per Post = 675 ÷ 30 = <strong>22.5</strong></li>
              </ul>
              <p className="mt-2">This engagement rate of 6.75% by followers would be considered high, indicating very strong audience engagement.</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Tips to Improve Engagement</h3>
            <ul className="list-disc pl-5 text-sm leading-relaxed text-muted-foreground space-y-1">
              <li>Post high-quality, value-driven content consistently</li>
              <li>Use strong calls-to-action in your captions</li>
              <li>Reply to comments and engage with your audience</li>
              <li>Post when your audience is most active</li>
              <li>Use interactive features (polls, quizzes, questions)</li>
              <li>Leverage trending audio, hashtags, and formats</li>
              <li>Collaborate with other creators in your niche</li>
              <li>Analyze your top-performing content and replicate patterns</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Common Mistakes to Avoid</h3>
            <ul className="list-disc pl-5 text-sm leading-relaxed text-muted-foreground space-y-1">
              <li><strong>Confusing engagement rate with raw engagement numbers:</strong> A post with 100 likes on a 1,000-follower account (10% ER) is more impressive than 500 likes on 100,000 followers (0.5% ER).</li>
              <li><strong>Ignoring the platform context:</strong> A 1% engagement rate is excellent on Twitter/X but below average on TikTok. Always benchmark against platform-specific averages.</li>
              <li><strong>Not tracking both ER by followers AND ER by reach:</strong> Each provides different insights - one measures audience health, the other measures content effectiveness.</li>
              <li><strong>Comparing across different time periods inconsistently:</strong> Seasonal variations, algorithm changes, and content format shifts can significantly affect engagement rates.</li>
              <li><strong>Focusing only on likes:</strong> Shares, saves, and comments are higher-intent actions that indicate deeper engagement. Include all engagement types for a complete picture.</li>
            </ul>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                Total Followers
              </span>
              <span className="text-lg font-bold text-primary">{formatCompact(followers)}</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={followersDisplay}
              onChange={(e) => handleFollowersChange(e.target.value)}
              onFocus={handleFollowersFocus}
              onBlur={handleFollowersBlur}
              className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
            />
            <input
              type="range"
              min={100}
              max={100000000}
              step={100}
              value={followers}
              onChange={(e) => setFollowers(parseFloat(e.target.value))}
              className={inputRangeClass}
              aria-label="Total Followers"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>100</span>
              <span>100M</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-primary" />
                Post Reach / Impressions
              </span>
              <span className="text-lg font-bold text-primary">{formatCompact(reach)}</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={reachDisplay}
              onChange={(e) => handleReachChange(e.target.value)}
              onFocus={handleReachFocus}
              onBlur={handleReachBlur}
              className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
            />
            <input
              type="range"
              min={10}
              max={10000000}
              step={10}
              value={reach}
              onChange={(e) => setReach(parseFloat(e.target.value))}
              className={inputRangeClass}
              aria-label="Post Reach / Impressions"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10</span>
              <span>10M</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" />
                Number of Posts
              </span>
              <span className="text-lg font-bold text-primary">{posts}</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={postsDisplay}
              onChange={(e) => handlePostsChange(e.target.value)}
              onFocus={handlePostsFocus}
              onBlur={handlePostsBlur}
              className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
            />
            <input
              type="range"
              min={1}
              max={365}
              step={1}
              value={posts}
              onChange={(e) => setPosts(parseFloat(e.target.value))}
              className={inputRangeClass}
              aria-label="Number of Posts"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>365</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-primary" />
                Total Likes
              </span>
              <span className="text-lg font-bold text-primary">{formatCompact(likes)}</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={likesDisplay}
              onChange={(e) => handleLikesChange(e.target.value)}
              onFocus={handleLikesFocus}
              onBlur={handleLikesBlur}
              className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
            />
            <input
              type="range"
              min={0}
              max={10000000}
              step={1}
              value={likes}
              onChange={(e) => setLikes(parseFloat(e.target.value))}
              className={inputRangeClass}
              aria-label="Total Likes"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>10M</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-primary" />
                Total Comments
              </span>
              <span className="text-lg font-bold text-primary">{formatCompact(comments)}</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={commentsDisplay}
              onChange={(e) => handleCommentsChange(e.target.value)}
              onFocus={handleCommentsFocus}
              onBlur={handleCommentsBlur}
              className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
            />
            <input
              type="range"
              min={0}
              max={1000000}
              step={1}
              value={comments}
              onChange={(e) => setComments(parseFloat(e.target.value))}
              className={inputRangeClass}
              aria-label="Total Comments"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>1M</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <Repeat2 className="w-4 h-4 text-primary" />
                Total Shares
              </span>
              <span className="text-lg font-bold text-primary">{formatCompact(shares)}</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={sharesDisplay}
              onChange={(e) => handleSharesChange(e.target.value)}
              onFocus={handleSharesFocus}
              onBlur={handleSharesBlur}
              className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
            />
            <input
              type="range"
              min={0}
              max={1000000}
              step={1}
              value={shares}
              onChange={(e) => setShares(parseFloat(e.target.value))}
              className={inputRangeClass}
              aria-label="Total Shares"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>1M</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-primary" />
                Total Saves
              </span>
              <span className="text-lg font-bold text-primary">{formatCompact(saves)}</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={savesDisplay}
              onChange={(e) => handleSavesChange(e.target.value)}
              onFocus={handleSavesFocus}
              onBlur={handleSavesBlur}
              className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
            />
            <input
              type="range"
              min={0}
              max={1000000}
              step={1}
              value={saves}
              onChange={(e) => setSaves(parseFloat(e.target.value))}
              className={inputRangeClass}
              aria-label="Total Saves"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>1M</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`rounded-xl p-6 border bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 text-center`}>
            <div className="flex items-center justify-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground font-medium">Engagement Rate by Followers</p>
            </div>
            <p className="text-4xl font-extrabold text-primary">{formatPercent(results.erByFollowers / 100)}</p>
            <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-semibold border ${badge.color}`}>
              {badge.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                ER by Reach
              </p>
              <p className="text-lg font-bold text-primary">{formatPercent(results.erByReach / 100)}</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                Total Engagements
              </p>
              <p className="text-lg font-bold text-primary">{formatCompact(results.totalEngagements)}</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Star className="w-3 h-3" />
                Avg Per Post
              </p>
              <p className="text-lg font-bold text-primary">{formatNumber(results.avgPerPost)}</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Followers
              </p>
              <p className="text-lg font-bold text-primary">{formatCompact(results.f)}</p>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Engagement Breakdown
            </p>
            <div className="flex items-start gap-6 mb-4">
              <div className="w-32 h-32 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" strokeWidth={0}>
                      {pieData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx]} />)}
                    </Pie>
                    <RechartsTooltip content={<PieTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5 text-sm">
                {pieData.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: PIE_COLORS[idx] }} />
                      {item.name}
                    </span>
                    <span className="font-medium">{formatCompact(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 text-sm border-t border-border/50 pt-3">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Likes</span>
                <span className="font-medium">{formatCompact(results.l)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Comments</span>
                <span className="font-medium">{formatCompact(results.c)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Shares</span>
                <span className="font-medium">{formatCompact(results.s)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Saves</span>
                <span className="font-medium">{formatCompact(results.sv)}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-border/50">
                <span className="font-semibold">Total Engagement</span>
                <span className="font-bold text-primary">{formatCompact(results.totalEngagements)}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Total Engagements</p>
                <p className="text-sm font-semibold">{formatCompact(results.totalEngagements)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">ER</p>
                <p className="text-sm font-semibold text-emerald-500">{formatPercent(results.erByFollowers / 100)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Followers</p>
                <p className="text-sm font-semibold">{formatCompact(results.f)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6">Related Calculators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
