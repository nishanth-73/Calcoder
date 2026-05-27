"use client";

import { useMemo } from "react";
import { useNumericField } from "@/lib/useNumericField";
import {
  Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip,
} from "recharts";
import {
  Users, TrendingDown, TrendingUp, UserPlus, UserMinus, FileText,
  BarChart3, Percent, ArrowUpRight, Target, Info,
} from "lucide-react";
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

const CHART_COLORS = ["#10b981", "#f43f5e", "#6366f1", "#f59e0b"];

const RELATED_TOOLS = [
  { name: "CAC Calculator", href: "/marketing/cac-calculator", desc: "Calculate customer acquisition cost for your business." },
  { name: "LTV Calculator", href: "/marketing/ltv-calculator", desc: "Calculate customer lifetime value and profitability." },
  { name: "ARR Calculator", href: "/marketing/arr-calculator", desc: "Calculate annual recurring revenue for SaaS businesses." },
  { name: "MRR Calculator", href: "/marketing/mrr-calculator", desc: "Calculate monthly recurring revenue and growth." },
  { name: "CPC Calculator", href: "/marketing/cpc-calculator", desc: "Calculate cost per click for your ad campaigns." },
  { name: "ROAS Calculator", href: "/marketing/roas-calculator", desc: "Calculate return on ad spend for advertising campaigns." },
  { name: "CTR Calculator", href: "/marketing/ctr-calculator", desc: "Calculate click-through rate for ads and emails." },
  { name: "Profit Margin Calculator", href: "/finance/profit-margin-calculator", desc: "Calculate profit margins on products and services." },
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

export default function ChurnRateCalculator() {
  const customersStart = useNumericField(1000);
  const customersLost = useNumericField(50);
  const newCustomers = useNumericField(80);

  const results = useMemo(() => {
    const start = Math.max(1, customersStart.value);
    const lost = Math.max(0, customersLost.value);
    const acquired = Math.max(0, newCustomers.value);

    const churnRate = (lost / start) * 100;
    const retentionRate = ((start - lost) / start) * 100;
    const netGrowth = acquired - lost;
    const endingCustomers = start - lost + acquired;
    const growthRate = start > 0 ? ((acquired - lost) / start) * 100 : 0;

    const retained = Math.max(0, start - lost);
    const lostCount = Math.max(0, lost);
    const newCount = Math.max(0, acquired);

    let benchmark: "none" | "low" | "moderate" | "high" | "critical";
    if (start <= 1) benchmark = "none";
    else if (churnRate <= 2) benchmark = "low";
    else if (churnRate <= 5) benchmark = "moderate";
    else if (churnRate <= 10) benchmark = "high";
    else benchmark = "critical";

    return {
      churnRate, retentionRate, netGrowth, growthRate, retained,
      lostCount, newCount, endingCustomers, benchmark,
    };
  }, [customersStart.value, customersLost.value, newCustomers.value]);

  const chartData = useMemo(() => [
    { name: "Retained Customers", value: Math.max(0, results.retained) },
    { name: "Lost Customers", value: Math.max(0, results.lostCount) },
    { name: "New Customers", value: Math.max(0, results.newCount) },
  ], [results]);

  const benchmarkConfig: Record<string, { label: string; color: string; bg: string }> = {
    none: { label: "N/A", color: "text-muted-foreground", bg: "bg-muted/50" },
    low: { label: "Low Churn", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    moderate: { label: "Moderate Churn", color: "text-amber-500", bg: "bg-amber-500/10" },
    high: { label: "High Churn", color: "text-orange-500", bg: "bg-orange-500/10" },
    critical: { label: "Critical Churn", color: "text-red-500", bg: "bg-red-500/10" },
  };

  const bm = benchmarkConfig[results.benchmark];

  return (
    <ToolLayout
      title="Churn Rate Calculator"
      description="Calculate customer churn rate and retention metrics for subscription businesses and SaaS companies. Free online churn rate calculator with instant results, charts, and detailed breakdown."
      category="marketing"
      faqContent={[
        {
          question: "What is churn rate?",
          answer: "Churn rate is the percentage of customers who stop using your product or service over a given period. It is calculated by dividing the number of customers lost during the period by the total number of customers at the start of the period, then multiplying by 100. Churn rate is a critical metric for subscription-based businesses because it directly impacts revenue, growth, and customer lifetime value. A high churn rate means you are losing customers faster than you can acquire them, creating a leaky bucket that limits sustainable growth.",
        },
        {
          question: "How is churn rate calculated?",
          answer: "Churn Rate = (Customers Lost ÷ Customers at Start) × 100. For example, if you start the month with 1,000 customers and lose 50, your churn rate is (50 ÷ 1,000) × 100 = 5%. Customer Retention Rate is the inverse: 100% - Churn Rate = 95%. Net Customer Growth considers new customers acquired: Net Growth = New Customers - Lost Customers. Ending Customers = Starting Customers - Lost Customers + New Customers. Growth Rate = (Net Growth ÷ Starting Customers) × 100.",
        },
        {
          question: "What is a good churn rate?",
          answer: "For SaaS businesses, an annual churn rate of 5-7% is considered good (0.4-0.6% monthly). Exceptional SaaS companies achieve under 3% annual churn. B2B SaaS typically has lower churn (3-5% annually) than B2C (5-10% monthly). E-commerce subscription services average 5-10% monthly churn. Anything above 10% monthly churn indicates serious retention issues. For reference: Low churn = 0-2% monthly, Moderate = 2-5%, High = 5-10%, Critical = 10%+. The best benchmarks compare against companies in your specific industry and business model.",
        },
        {
          question: "How does churn affect revenue?",
          answer: "Churn directly impacts revenue growth and profitability. A high churn rate creates a leaking bucket effect - you must constantly acquire new customers just to maintain current revenue levels. For example, with 5% monthly churn, you lose over 46% of your customer base annually. This means you need to replace nearly half your customers each year just to stay flat. Reducing churn by even 1% can significantly improve customer lifetime value (LTV) and overall business profitability. Companies with low churn can grow faster with less acquisition spend.",
        },
        {
          question: "What is the difference between customer churn and revenue churn?",
          answer: "Customer churn measures the percentage of customers lost, while revenue churn measures the percentage of recurring revenue lost. They can differ significantly - losing a few high-value customers could result in 20% revenue churn but only 5% customer churn. Both metrics are important. Revenue churn (also called net revenue retention) is more relevant for businesses with tiered pricing. Gross revenue churn ignores expansion revenue, while net revenue churn accounts for upsells. A negative net revenue churn (expansion exceeds losses) is the ideal state for SaaS companies.",
        },
        {
          question: "How can I reduce customer churn?",
          answer: "To reduce churn, focus on these proven strategies: 1) Improve onboarding to ensure customers quickly reach their aha moment and realize value; 2) Provide proactive customer success outreach with regular check-ins and health monitoring; 3) Gather and act on customer feedback through surveys, interviews, and usage data; 4) Implement retention campaigns including win-back emails, special offers, and feature adoption prompts; 5) Improve product quality and add features customers request; 6) Offer annual billing discounts - annual subscribers churn at significantly lower rates than monthly; 7) Monitor health scores to identify at-risk customers early and intervene before they cancel.",
        },
        {
          question: "What is negative churn and why is it important?",
          answer: "Negative churn occurs when revenue expansion from existing customers (upgrades, cross-sells, add-ons) exceeds revenue lost from churned customers. This is the holy grail for SaaS businesses because it means the existing customer base is growing revenue even without new customer acquisition. For example, if you lose $10K from churn but gain $15K from upgrades, your net churn is -$5K (negative). Negative churn requires a combination of low customer churn rate and strong expansion revenue through usage-based pricing, tier upgrades, or additional product offerings.",
        },
        {
          question: "How does churn rate relate to customer lifetime value (LTV)?",
          answer: "Churn rate directly determines customer lifetime value. The simplest formula is: LTV = Average Revenue Per Account (ARPA) ÷ Monthly Churn Rate. For example, if ARPA is $100/month and monthly churn is 5%, LTV = $100 ÷ 0.05 = $2,000. Reducing churn from 5% to 3% increases LTV to $3,333 - a 67% improvement. This exponential relationship means that small improvements in churn create outsized value. This is why reducing churn is one of the highest-leverage activities for subscription businesses. Combining lower churn with higher ARPA (through upgrades) creates even more value.",
        },
        {
          question: "What is the difference between voluntary and involuntary churn?",
          answer: "Voluntary churn happens when customers actively decide to cancel - due to poor product fit, budget constraints, competitive offers, or dissatisfaction. Involuntary churn occurs when payments fail - expired credit cards, insufficient funds, or billing issues. Involuntary churn typically accounts for 20-40% of total churn and is often preventable through dunning management (automated retry logic, email reminders, card update prompts). Best practices for reducing involuntary churn include: smart payment retry scheduling, multiple payment methods on file, proactive card expiration alerts, and grace periods before cancellation. Addressing both types is essential for a comprehensive retention strategy.",
        },
        {
          question: "What are the leading indicators of customer churn?",
          answer: "Key leading indicators of churn include: 1) Declining product usage - logins, feature usage, and time spent decreasing; 2) Decreasing engagement - fewer support tickets, less interaction with success team; 3) Negative sentiment - support tickets with frustration, low NPS/CSAT scores; 4) Budget or personnel changes at the customer's company; 5) Competitor mentions or RFPs; 6) Missed renewal meetings or delayed contract discussions; 7) Reduced feature adoption after onboarding; 8) Long periods of inactivity. Monitor these signals through a customer health score that combines usage data, support interactions, and account information to flag at-risk accounts early.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a Churn Rate Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A Churn Rate Calculator helps SaaS businesses and subscription companies measure customer retention and loss.
              By entering your <strong>customers at the start of the period</strong>, <strong>customers lost</strong>, and
              {" "}<strong>new customers acquired</strong>, you get instant insights into churn rate, retention rate,
              net customer growth, ending customer count, and overall growth rate. This tool is essential for tracking
              customer health, forecasting revenue, and identifying retention issues before they become critical problems.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p><strong>Churn Rate = (Customers Lost ÷ Customers at Start) × 100</strong></p>
              <p>Retention Rate = 100% - Churn Rate</p>
              <p>Net Customer Growth = New Customers - Lost Customers</p>
              <p>Ending Customers = Start Customers - Lost Customers + New Customers</p>
              <p>Growth Rate = Net Growth ÷ Customers at Start × 100</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Key Metrics Explained</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  metric: "Churn Rate",
                  desc: "The percentage of customers lost during the period. The primary metric for measuring customer retention health.",
                },
                {
                  metric: "Retention Rate",
                  desc: "The percentage of customers who stayed. The inverse of churn rate - higher is always better.",
                },
                {
                  metric: "Net Customer Growth",
                  desc: "New customers acquired minus customers lost. Positive growth means your customer base is expanding.",
                },
                {
                  metric: "Ending Customers",
                  desc: "Total customers at the end of the period after accounting for losses and new acquisitions.",
                },
                {
                  metric: "Growth Rate",
                  desc: "The percentage growth of your customer base relative to starting customers. Combines acquisition and retention.",
                },
                {
                  metric: "Customer Lifetime Value",
                  desc: "The total revenue a customer generates before churning. Lower churn directly increases LTV.",
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
              <p className="font-medium text-foreground mb-2">Scenario: 1,000 customers at start, 50 lost, 80 acquired during the month.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Churn Rate = (50 ÷ 1,000) × 100 = <strong>5.00%</strong></li>
                <li>Retention Rate = 100% - 5% = <strong>95.00%</strong></li>
                <li>Net Growth = 80 - 50 = <strong>+30 customers</strong></li>
                <li>Ending Customers = 1,000 - 50 + 80 = <strong>1,030 customers</strong></li>
                <li>Growth Rate = (30 ÷ 1,000) × 100 = <strong>3.00%</strong></li>
              </ul>
              <p className="mt-2">You retained 95% of customers, lost 5%, and grew by 30 customers (3% growth). Your customer base ended at 1,030.</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Churn Rate Benchmarks by Industry</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-semibold">Industry</th>
                    <th className="text-right py-2 font-semibold">Avg Monthly Churn</th>
                    <th className="text-right py-2 font-semibold">Avg Annual Churn</th>
                    <th className="text-right py-2 font-semibold">Best-in-Class</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    ["B2B SaaS (SMB)", "3-5%", "30-50%", "&lt;2% monthly"],
                    ["B2B SaaS (Enterprise)", "1-2%", "12-22%", "&lt;1% monthly"],
                    ["B2C SaaS", "5-10%", "50-70%", "&lt;3% monthly"],
                    ["E-commerce Subscription", "5-10%", "50-70%", "&lt;4% monthly"],
                    ["Media/Streaming", "4-8%", "40-60%", "&lt;3% monthly"],
                    ["Mobile Apps", "10-20%", "70-90%", "&lt;6% monthly"],
                    ["Fintech", "3-7%", "30-60%", "&lt;2% monthly"],
                    ["Health/Fitness", "5-8%", "45-65%", "&lt;4% monthly"],
                  ].map(([industry, monthly, annual, best]) => (
                    <tr key={industry} className="border-b border-border/50">
                      <td className="py-2">{industry}</td>
                      <td className="text-right py-2">{monthly}</td>
                      <td className="text-right py-2">{annual}</td>
                      <td className="text-right py-2">{best}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Tips to Reduce Churn</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
              <li><strong>Optimize onboarding</strong> - Design a structured onboarding flow that gets new users to their aha moment within the first 14 days. Use checklists, guided tours, and milestone celebrations.</li>
              <li><strong>Implement customer health scoring</strong> - Build a scoring system using product usage, support interactions, NPS scores, and account data to identify at-risk customers before they churn.</li>
              <li><strong>Proactive customer success</strong> - Schedule regular check-ins (quarterly business reviews for enterprise, automated check-ins for SMB) to ensure customers are achieving their desired outcomes.</li>
              <li><strong>Collect and act on feedback</strong> - Send churn surveys when customers cancel, conduct exit interviews, and use the insights to improve your product and processes.</li>
              <li><strong>Offer annual billing</strong> - Customers on annual contracts churn at significantly lower rates than monthly subscribers. Offer 15-20% discounts for annual commitments.</li>
              <li><strong>Build a community</strong> - Foster customer communities (Slack groups, user forums, events) that increase stickiness and create switching costs through peer relationships.</li>
              <li><strong>Improve communication</strong> - Send regular product updates, tips and tricks, and value-added content. Inactive users often churn because they forget why they subscribed.</li>
              <li><strong>Implement win-back campaigns</strong> - Target cancelled customers with re-engagement emails, special offers, and product improvement announcements to recover lost accounts.</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Common Mistakes to Avoid</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              <li><strong>Focusing only on acquisition</strong> - High acquisition spend is wasted if churn is high. Customer retention is often 5-10x more cost-effective than acquisition. Balance growth investments across both.</li>
              <li><strong>Ignoring involuntary churn</strong> - 20-40% of churn is caused by failed payments, not customer choice. Implement dunning management with smart retry logic and proactive card expiration alerts.</li>
              <li><strong>Measuring churn incorrectly</strong> - Logo churn (customer count) and revenue churn often tell different stories. Track both metrics and understand the difference between losing many small customers vs. a few large ones.</li>
              <li><strong>Not segmenting churn analysis</strong> - Churn varies significantly by customer segment, cohort, plan tier, and acquisition channel. Analyze churn by segment to identify which groups need targeted retention strategies.</li>
              <li><strong>Reacting too late</strong> - Once a customer churns, it is 5-10x harder to win them back than to retain them. Monitor leading indicators and intervene early with at-risk accounts.</li>
            </ul>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-6">
          <SliderField
            label="Customers at Start"
            icon={Users}
            value={customersStart.value}
            displayValue={customersStart.displayValue}
            onChange={(e) => customersStart.setValue(parseFloat(e.target.value))}
            onTextChange={customersStart.handleChange}
            onFocus={customersStart.handleFocus}
            onBlur={customersStart.handleBlur}
            min={1}
            max={10000000}
            step={1}
            formatDisplay={formatCompact(customersStart.value)}
          />
          <SliderField
            label="Customers Lost"
            icon={UserMinus}
            value={customersLost.value}
            displayValue={customersLost.displayValue}
            onChange={(e) => customersLost.setValue(parseFloat(e.target.value))}
            onTextChange={customersLost.handleChange}
            onFocus={customersLost.handleFocus}
            onBlur={customersLost.handleBlur}
            min={0}
            max={10000000}
            step={1}
            formatDisplay={formatCompact(customersLost.value)}
          />
          <SliderField
            label="New Customers Acquired"
            icon={UserPlus}
            value={newCustomers.value}
            displayValue={newCustomers.displayValue}
            onChange={(e) => newCustomers.setValue(parseFloat(e.target.value))}
            onTextChange={newCustomers.handleChange}
            onFocus={newCustomers.handleFocus}
            onBlur={newCustomers.handleBlur}
            min={0}
            max={10000000}
            step={1}
            formatDisplay={formatCompact(newCustomers.value)}
          />
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-emerald-500/10 to-primary/10 border border-emerald-500/20 rounded-xl p-6 text-center">
            <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              Churn Rate
            </p>
            <p className="text-4xl font-extrabold text-foreground">
              {formatPercent(results.churnRate)}
            </p>
            <div className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold mt-2 ${bm.bg} ${bm.color}`}>
              <Target className="w-3 h-3" />
              {bm.label}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on {formatCompact(results.retained + results.lostCount)} total customers
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Retention Rate"
              value={formatPercent(results.retentionRate)}
              icon={TrendingUp}
              valueClassName="text-emerald-500"
              tooltip="Percentage of customers retained during the period"
            />
            <MetricCard
              label="Net Customer Growth"
              value={results.netGrowth >= 0 ? `+${formatCompact(results.netGrowth)}` : formatCompact(results.netGrowth)}
              icon={BarChart3}
              valueClassName={results.netGrowth >= 0 ? "text-emerald-500" : "text-red-500"}
              tooltip="New customers minus lost customers"
            />
            <MetricCard
              label="Ending Customers"
              value={formatCompact(results.endingCustomers)}
              icon={Users}
              valueClassName={
                results.endingCustomers > customersStart.value
                  ? "text-emerald-500"
                  : results.endingCustomers < customersStart.value
                    ? "text-red-500"
                    : ""
              }
              tooltip="Total customers at end of period"
            />
            <MetricCard
              label="Growth Rate"
              value={formatPercent(results.growthRate)}
              icon={ArrowUpRight}
              valueClassName={
                results.growthRate > 0
                  ? "text-emerald-500"
                  : results.growthRate < 0
                    ? "text-red-500"
                    : ""
              }
              tooltip="Percentage growth of customer base"
            />
          </div>

          <div className="bg-white border border-border rounded-xl p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Customer Breakdown
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
                <span className="text-muted-foreground">Start of Period</span>
                <span className="font-medium">{formatCompact(customersStart.value)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">End of Period</span>
                <span className="font-medium">{formatCompact(results.endingCustomers)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Net Change</span>
                <span className={`font-medium ${results.netGrowth >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {results.netGrowth >= 0 ? `+${formatCompact(results.netGrowth)}` : formatCompact(results.netGrowth)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-t border-border/50 pt-1.5">
                <span className="font-semibold">Churn Rate</span>
                <span className="font-bold text-rose-500">{formatPercent(results.churnRate)}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Start Customers</p>
                <p className="text-sm font-semibold">{formatCompact(customersStart.value)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Retained</p>
                <p className="text-sm font-semibold text-emerald-500">{formatCompact(results.retained)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Churn Rate</p>
                <p className="text-sm font-semibold text-rose-500">{formatPercent(results.churnRate)}</p>
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
