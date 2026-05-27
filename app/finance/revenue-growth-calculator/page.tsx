"use client";

import { useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { ArrowUpRight, ArrowDownRight, BadgePercent, Banknote, Calculator, Clock, FileText, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { cn } from "@/lib/utils";

// ===================================================================
// CURRENCY SYSTEM
// ===================================================================

type CurrencyCode =
  | "USD" | "INR" | "EUR" | "GBP" | "AED" | "SAR" | "CAD" | "AUD"
  | "JPY" | "SGD" | "MYR" | "NZD" | "ZAR" | "CHF" | "CNY"
  | "HKD" | "KRW" | "BRL" | "SEK" | "NOK" | "DKK" | "PLN"
  | "TRY" | "MXN" | "PHP" | "THB" | "VND" | "IDR" | "TWD";

interface CurrencyConfig {
  code: CurrencyCode;
  label: string;
  symbol: string;
  locale: string;
}

const CURRENCIES: CurrencyConfig[] = [
  { code: "USD", label: "US Dollar", symbol: "$", locale: "en-US" },
  { code: "EUR", label: "Euro", symbol: "€", locale: "de-DE" },
  { code: "GBP", label: "British Pound", symbol: "Â£", locale: "en-GB" },
  { code: "INR", label: "Indian Rupee", symbol: "₹", locale: "en-IN" },
  { code: "AED", label: "UAE Dirham", symbol: "Ø¯.Ø¥", locale: "ar-AE" },
  { code: "SAR", label: "Saudi Riyal", symbol: "ï·¼", locale: "ar-SA" },
  { code: "CAD", label: "Canadian Dollar", symbol: "C$", locale: "en-CA" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$", locale: "en-AU" },
  { code: "JPY", label: "Japanese Yen", symbol: "Â¥", locale: "ja-JP" },
  { code: "SGD", label: "Singapore Dollar", symbol: "S$", locale: "en-SG" },
  { code: "MYR", label: "Malaysian Ringgit", symbol: "RM", locale: "ms-MY" },
  { code: "NZD", label: "New Zealand Dollar", symbol: "NZ$", locale: "en-NZ" },
  { code: "ZAR", label: "South African Rand", symbol: "R", locale: "en-ZA" },
  { code: "CHF", label: "Swiss Franc", symbol: "Fr", locale: "de-CH" },
  { code: "CNY", label: "Chinese Yuan", symbol: "Â¥", locale: "zh-CN" },
  { code: "HKD", label: "Hong Kong Dollar", symbol: "HK$", locale: "en-HK" },
  { code: "KRW", label: "South Korean Won", symbol: "â‚©", locale: "ko-KR" },
  { code: "BRL", label: "Brazilian Real", symbol: "R$", locale: "pt-BR" },
  { code: "SEK", label: "Swedish Krona", symbol: "kr", locale: "sv-SE" },
  { code: "NOK", label: "Norwegian Krone", symbol: "kr", locale: "nb-NO" },
  { code: "DKK", label: "Danish Krone", symbol: "kr", locale: "da-DK" },
  { code: "PLN", label: "Polish Zloty", symbol: "zÅ‚", locale: "pl-PL" },
  { code: "TRY", label: "Turkish Lira", symbol: "â‚º", locale: "tr-TR" },
  { code: "MXN", label: "Mexican Peso", symbol: "MX$", locale: "es-MX" },
  { code: "PHP", label: "Philippine Peso", symbol: "â‚±", locale: "en-PH" },
  { code: "THB", label: "Thai Baht", symbol: "à¸¿", locale: "th-TH" },
  { code: "VND", label: "Vietnamese Dong", symbol: "â‚«", locale: "vi-VN" },
  { code: "IDR", label: "Indonesian Rupiah", symbol: "Rp", locale: "id-ID" },
  { code: "TWD", label: "Taiwan Dollar", symbol: "NT$", locale: "zh-TW" },
];

function getCurrency(code: CurrencyCode): CurrencyConfig {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

const NO_DECIMAL_CURRENCIES = new Set<CurrencyCode>(["JPY", "KRW", "VND", "IDR"]);

function formatCurrency(value: number, code: CurrencyCode): string {
  const cfg = getCurrency(code);
  if (!Number.isFinite(value)) return `${cfg.symbol}0`;
  const noDec = NO_DECIMAL_CURRENCIES.has(code);
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

function formatCompact(value: number, code: CurrencyCode): string {
  const cfg = getCurrency(code);
  if (!Number.isFinite(value)) return `${cfg.symbol}0`;
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (code === "INR") {
    if (abs >= 1e7) return `${sign}${cfg.symbol}${(abs / 1e7).toFixed(1)}Cr`;
    if (abs >= 1e5) return `${sign}${cfg.symbol}${(abs / 1e5).toFixed(1)}L`;
    if (abs >= 1e3) return `${sign}${cfg.symbol}${(abs / 1e3).toFixed(1)}K`;
    return `${sign}${cfg.symbol}${abs.toFixed(0)}`;
  }
  if (abs >= 1e9) return `${sign}${cfg.symbol}${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}${cfg.symbol}${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}${cfg.symbol}${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${cfg.symbol}${abs.toFixed(0)}`;
}

function getMaxAmount(code: CurrencyCode): number {
  return NO_DECIMAL_CURRENCIES.has(code) ? 100_000_000 : 10_000_000;
}

function getSliderStep(code: CurrencyCode): number {
  return NO_DECIMAL_CURRENCIES.has(code) ? 1000 : 100;
}

// ===================================================================
// CONSTANTS
// ===================================================================

const PIE_COLORS_GAIN = ["#10b981", "#3b82f6"];
const PIE_COLORS_LOSS = ["#ef4444", "#3b82f6"];

const RELATED_TOOLS = [
  { name: "Profit Margin Calculator", href: "/finance/profit-margin-calculator", desc: "Calculate gross and net profit margins for products." },
  { name: "Break-Even Calculator", href: "/finance/break-even-calculator", desc: "Calculate break-even point for products and services." },
  { name: "ROI Calculator", href: "/finance/roi-calculator", desc: "Calculate return on investment percentage for any asset." },
  { name: "CAGR Calculator", href: "/finance/cagr-calculator", desc: "Calculate compound annual growth rate for investments." },
];

// ===================================================================
// TYPES
// ===================================================================

interface GrowthResults {
  startRevenue: number;
  endRevenue: number;
  periods: number;
  absoluteGrowth: number;
  growthRate: number;
  cagr: number;
  growthMultiplier: number;
  avgPeriodGrowth: number;
  isGrowth: boolean;
  isDecline: boolean;
  hasActivity: boolean;
  projected1Y: number;
  projected3Y: number;
  projected5Y: number;
}

// ===================================================================
// CALCULATION ENGINE
// ===================================================================

const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

function calculateGrowth(
  startRevenue: number,
  endRevenue: number,
  periods: number,
): GrowthResults {
  const sr = clamp(Number.isFinite(startRevenue) ? Math.max(0, startRevenue) : 0, 0, 1e9);
  const er = clamp(Number.isFinite(endRevenue) ? Math.max(0, endRevenue) : 0, 0, 1e9);
  const p = clamp(Number.isFinite(periods) ? Math.max(0, periods) : 0, 0, 1200);

  const absoluteGrowth = er - sr;
  const growthRate = sr > 0 ? (absoluteGrowth / sr) * 100 : 0;
  const years = p > 0 ? p / 12 : 0;
  const cagr = sr > 0 && years > 0 ? ((er / sr) ** (1 / years) - 1) * 100 : growthRate;
  const growthMultiplier = sr > 0 ? er / sr : 0;
  const avgPeriodGrowth = p > 0 ? absoluteGrowth / p : 0;

  const annualRate = years > 0 ? cagr : growthRate;

  const project = (forwardYears: number): number => {
    if (sr <= 0) return 0;
    return sr * (1 + annualRate / 100) ** forwardYears;
  };

  return {
    startRevenue: sr,
    endRevenue: er,
    periods: p,
    absoluteGrowth,
    growthRate,
    cagr: Number.isFinite(cagr) ? cagr : growthRate,
    growthMultiplier,
    avgPeriodGrowth,
    isGrowth: absoluteGrowth > 0.005,
    isDecline: absoluteGrowth < -0.005,
    hasActivity: sr > 0 || er > 0,
    projected1Y: project(1),
    projected3Y: project(3),
    projected5Y: project(5),
  };
}

// ===================================================================
// PIECHART TOOLTIP
// ===================================================================

function PieTooltip({ active, payload, currency }: { active?: boolean; payload?: { name: string; value: number }[]; currency: CurrencyCode }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-medium">{d.name}</p>
      <p className="text-muted-foreground">{formatCurrency(d.value, currency)}</p>
    </div>
  );
}

// ===================================================================
// MAIN COMPONENT
// ===================================================================

export default function RevenueGrowthCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const { value: startRevenue, displayValue: startRevenueDisplay, setValue: setStartRevenue, handleChange: handleStartInput, handleFocus: handleStartFocus, handleBlur: handleStartBlur } = useNumericField(100000);
  const { value: endRevenue, displayValue: endRevenueDisplay, setValue: setEndRevenue, handleChange: handleEndInput, handleFocus: handleEndFocus, handleBlur: handleEndBlur } = useNumericField(150000);
  const { value: periods, displayValue: periodsDisplay, setValue: setPeriods, handleChange: handlePeriodsInput, handleFocus: handlePeriodsFocus, handleBlur: handlePeriodsBlur } = useNumericField(12);

  const results = useMemo<GrowthResults>(
    () => calculateGrowth(startRevenue, endRevenue, periods),
    [startRevenue, endRevenue, periods],
  );

  const pieData = useMemo(() => {
    if (!results.hasActivity || results.startRevenue <= 0) return [];
    const growthValue = Math.abs(results.absoluteGrowth);
    if (results.isDecline) {
      return [
        { name: "Revenue Decline", value: growthValue },
        { name: "Current Revenue", value: results.endRevenue },
      ];
    }
    return [
      { name: "Revenue Growth", value: growthValue },
      { name: "Starting Revenue", value: results.startRevenue },
    ];
  }, [results.startRevenue, results.endRevenue, results.absoluteGrowth, results.isDecline, results.hasActivity]);

  const showPie = pieData.length > 1;

  // --- Handlers ---

  const handleCurrencyChange = (val: string) => {
    setCurrency(val as CurrencyCode);
  };

  return (
    <ToolLayout
      title="Revenue Growth Calculator"
      description="Calculate period-over-period revenue growth - measure growth rate, CAGR, projections, and absolute growth with real-time charts and 29-currency support."
      category="finance"
      faqContent={[
        {
          question: "How is revenue growth calculated?",
          answer: "Revenue growth is calculated as: Growth Rate = ((Ending Revenue - Starting Revenue) ÷ Starting Revenue) × 100. For example, if revenue grew from $100,000 to $150,000, the growth rate is (50,000 ÷ 100,000) × 100 = 50%. This measures the percentage change in revenue over a specific period.",
        },
        {
          question: "What is CAGR and how is it different from simple growth rate?",
          answer: "CAGR (Compound Annual Growth Rate) is the year-over-year growth rate that would produce the same result if growth were constant. It is calculated as: CAGR = ((Ending ÷ Starting)^(1÷Years) - 1) × 100. Unlike simple growth rate, CAGR accounts for time. A 50% return over 2 years has a CAGR of ~22.5%, while simple growth rate is 50%.",
        },
        {
          question: "What is a good revenue growth rate?",
          answer: "Good revenue growth varies by company stage and industry. Early-stage startups: 100-500%+ annually. Growth-stage companies: 30-100%. Mature companies: 10-20%. S&P 500 companies average 5-8%. A sustainable growth rate of 15-25% is generally considered healthy for established businesses. Growth above 50% may strain operations if not managed carefully.",
        },
        {
          question: "How do I calculate month-over-month vs year-over-year growth?",
          answer: "Month-over-month (MoM) growth uses consecutive months as the period. Year-over-year (YoY) growth compares the same month across years, removing seasonal effects. This calculator supports any period length - enter the number of months between your start and end values. For MoM, use 1 month. For YoY, use 12 months.",
        },
        {
          question: "What is the difference between absolute growth and growth rate?",
          answer: "Absolute growth is the dollar amount: Ending Revenue - Starting Revenue. Growth rate is the percentage: (Absolute ÷ Starting) × 100. A company growing from $1M to $2M has $1M absolute growth and 100% growth rate. A company growing from $100M to $110M has $10M absolute growth but only 10% growth rate. Both metrics are important for different analyses.",
        },
        {
          question: "How can I project future revenue based on current growth?",
          answer: "Future revenue can be projected using: Projected Revenue = Starting Revenue × (1 + CAGR/100)^Years. This calculator projects 1, 3, and 5 years forward using your calculated CAGR. For example, $100,000 growing at 22.5% CAGR would reach approximately $150,000 in 2 years and $225,000 in 4 years.",
        },
        {
          question: "What does a negative growth rate indicate?",
          answer: "A negative growth rate (decline) means ending revenue is less than starting revenue. This could indicate customer churn, market contraction, competitive pressure, or operational issues. Persistent negative growth may signal fundamental business problems. Short-term negative growth may be acceptable if part of a restructuring or pivot strategy.",
        },
        {
          question: "How does growth rate relate to the growth multiplier?",
          answer: "Growth Multiplier = Ending Revenue ÷ Starting Revenue. A multiplier of 2× means revenue doubled (100% growth), 1.5× means 50% growth, 3× means 200% growth. The multiplier is an intuitive way to communicate growth: 'our revenue tripled' is more impactful than 'we grew 200%.' Both convey the same mathematical relationship.",
        },
        {
          question: "Can this calculator handle multiple periods of growth?",
          answer: "This calculator computes growth between two points in time (start and end). For multi-period analysis with different growth rates each year, you would need a more detailed financial model. However, CAGR smooths fluctuations into a single annualized rate, giving you a meaningful average growth rate across any number of periods.",
        },
        {
          question: "How do I account for seasonality in revenue growth?",
          answer: "To account for seasonality, use year-over-year comparisons (12 months apart) rather than sequential months. For example, compare January 2025 revenue to January 2024 revenue rather than January to February. This removes seasonal effects. You can still enter the monthly amounts; just set the period to 12 months for a YoY comparison.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a Revenue Growth Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A Revenue Growth Calculator helps businesses measure their revenue performance over time.
              By entering your <strong>starting revenue</strong>, <strong>ending revenue</strong>, and
              <strong> time period</strong>, you get an instant breakdown of absolute growth, growth rate,
              compound annual growth rate (CAGR), and future revenue projections. This tool supports 29+ currencies.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p>Absolute Growth = Ending Revenue - Starting Revenue</p>
              <p>Growth Rate = (Absolute Growth ÷ Starting Revenue) × 100</p>
              <p>Years = Months ÷ 12</p>
              <p><strong>CAGR = ((Ending ÷ Starting) ^ (1 ÷ Years) - 1) × 100</strong></p>
              <p>Growth Multiplier = Ending ÷ Starting</p>
              <p>Average Period Growth = Absolute Growth ÷ Months</p>
              <p>Projected Revenue = Starting × (1 + CAGR ÷ 100) ^ Forward Years</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Benefits of Using This Calculator</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              <li><strong>Instant Growth Metrics:</strong> See absolute growth, growth rate, and CAGR at a glance.</li>
              <li><strong>Future Projections:</strong> Automatically project revenue 1, 3, and 5 years forward at current growth rate.</li>
              <li><strong>CAGR Analysis:</strong> Annualize growth across any period to compare apples-to-apples.</li>
              <li><strong>Growth Multiplier:</strong> Quick intuitive view - see how many times revenue has grown.</li>
              <li><strong>Global Currencies:</strong> Supports 29+ currencies with proper locale-aware formatting.</li>
              <li><strong>Visual Chart:</strong> Pie chart breakdown of starting revenue vs growth, updated in real time.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Scenario: A startup had $100,000 revenue in Year 1 and $150,000 revenue in Year 3 (24 months).</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Absolute Growth = $150,000 - $100,000 = <strong>$50,000</strong></li>
                <li>Growth Rate = ($50,000 ÷ $100,000) × 100 = <strong>50%</strong></li>
                <li>Years = 24 ÷ 12 = <strong>2 years</strong></li>
                <li>CAGR = (($150,000 ÷ $100,000)^(1÷2) - 1) × 100 = <strong>22.47%</strong></li>
                <li>Growth Multiplier = $150,000 ÷ $100,000 = <strong>1.5×</strong></li>
                <li>Projected (3 more years): $150,000 × (1 + 0.2247)^3 = <strong>$275,000</strong></li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Common Mistakes to Avoid</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed text-muted-foreground">
              <li>Comparing growth rates across different time periods without annualizing - use CAGR for fair comparisons.</li>
              <li>Ignoring seasonal effects - always compare same periods (YoY) rather than sequential months.</li>
              <li>Focusing only on growth rate without considering absolute growth - a high percentage on a small base is misleading.</li>
              <li>Extrapolating short-term growth rates long-term - early-stage hypergrowth is rarely sustainable.</li>
              <li>Confusing revenue growth with profit growth - growing revenue without growing profit can destroy value.</li>
            </ul>
          </div>
        </div>
      }
      relatedTools={RELATED_TOOLS}
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* ============ LEFT: INPUTS + CHART ============ */}
        <div className="space-y-6">
          {/* Currency Select */}
          <div className="space-y-2">
            <label htmlFor="growth-currency" className="flex items-center gap-1.5 text-sm font-medium mb-1">
              <Banknote className="w-4 h-4 text-primary" />
              Currency
            </label>
            <select
              id="growth-currency"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} - {c.label} ({c.symbol})</option>
              ))}
            </select>
          </div>

          {/* Starting Revenue */}
          <div className="space-y-2">
            <label htmlFor="growth-start" className="flex items-center gap-1.5 text-sm font-medium">
              <Wallet className="w-4 h-4 text-primary" />
              <span>Starting Revenue</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(startRevenue, currency)}</span>
            </label>
            <input
              id="growth-start"
              type="range"
              min={0}
              max={getMaxAmount(currency)}
              step={getSliderStep(currency)}
              value={Math.min(startRevenue, getMaxAmount(currency))}
               onChange={(e) => setStartRevenue(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={getMaxAmount(currency)}
              aria-valuenow={startRevenue}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCompact(getMaxAmount(currency), currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={startRevenueDisplay}
              onChange={(e) => handleStartInput(e.target.value)}
              onFocus={handleStartFocus}
              onBlur={handleStartBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter starting revenue"
            />
          </div>

          {/* Ending Revenue */}
          <div className="space-y-2">
            <label htmlFor="growth-end" className="flex items-center gap-1.5 text-sm font-medium">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Ending Revenue</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(endRevenue, currency)}</span>
            </label>
            <input
              id="growth-end"
              type="range"
              min={0}
              max={getMaxAmount(currency)}
              step={getSliderStep(currency)}
              value={Math.min(endRevenue, getMaxAmount(currency))}
               onChange={(e) => setEndRevenue(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={getMaxAmount(currency)}
              aria-valuenow={endRevenue}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCompact(getMaxAmount(currency), currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={endRevenueDisplay}
              onChange={(e) => handleEndInput(e.target.value)}
              onFocus={handleEndFocus}
              onBlur={handleEndBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter ending revenue"
            />
          </div>

          {/* Period */}
          <div className="space-y-2">
            <label htmlFor="growth-periods" className="flex items-center gap-1.5 text-sm font-medium">
              <Clock className="w-4 h-4 text-primary" />
              <span>Time Period</span>
              <span className="ml-auto text-lg font-bold text-primary">
                {periods >= 12 ? `${(periods / 12).toFixed(1)} years` : `${periods} months`}
              </span>
            </label>
            <input
              id="growth-periods"
              type="range"
              min={0}
              max={1200}
              step={1}
              value={periods}
               onChange={(e) => setPeriods(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={1200}
              aria-valuenow={periods}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0 mo</span>
              <span>5 yrs</span>
              <span>100 yrs</span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={periodsDisplay}
              onChange={(e) => handlePeriodsInput(e.target.value)}
              onFocus={handlePeriodsFocus}
              onBlur={handlePeriodsBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter months between periods"
            />
          </div>

          {/* Pie Chart */}
          {showPie && (
            <div className="bg-white border border-border rounded-xl p-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Revenue Composition
              </p>
              <div className="flex items-center justify-center h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38} outerRadius={62}
                      dataKey="value"
                      animationBegin={100}
                      animationDuration={800}
                    >
                      {pieData.map((_, idx) => (
                        <Cell key={idx} fill={results.isDecline ? PIE_COLORS_LOSS[idx] : PIE_COLORS_GAIN[idx]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<PieTooltip currency={currency} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 text-xs ml-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-sm", results.isDecline ? "bg-[#ef4444]" : "bg-[#10b981]")} />
                    <span className="text-muted-foreground">
                      {results.isDecline ? "Decline" : "Growth"} ({results.isDecline
                        ? (Math.abs(results.absoluteGrowth) / (results.endRevenue + Math.abs(results.absoluteGrowth)) * 100).toFixed(1)
                        : (results.absoluteGrowth / (results.endRevenue) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#3b82f6]" />
                    <span className="text-muted-foreground">
                      {results.isDecline ? "Current Revenue" : "Starting Revenue"} ({results.isDecline
                        ? (results.endRevenue / (results.endRevenue + Math.abs(results.absoluteGrowth)) * 100).toFixed(1)
                        : (results.startRevenue / results.endRevenue * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Current Revenue</p>
                  <p className="text-sm font-semibold">{formatCurrency(results.endRevenue, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Growth</p>
                  <p className="text-sm font-semibold text-emerald-500">{formatCurrency(Math.abs(results.absoluteGrowth), currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Growth %</p>
                  <p className="text-sm font-semibold">{results.growthRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============ RIGHT: RESULTS ============ */}
        <div className="space-y-4">
          {/* Hero Card */}
          <div
            className={cn(
              "rounded-xl p-6 border",
              results.isDecline
                ? "bg-gradient-to-br from-red-50 to-red-100/50 border-red-200"
                : results.isGrowth
                  ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200"
                  : "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20",
            )}
          >
            <div className="flex items-center gap-2 mb-3">
              {results.isDecline ? (
                <TrendingDown className="w-5 h-5 text-red-500" />
              ) : results.isGrowth ? (
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              ) : (
                <Calculator className="w-5 h-5 text-primary" />
              )}
              <p className="text-sm text-muted-foreground font-medium">
                {results.isDecline ? "Revenue Decline" : results.isGrowth ? "Revenue Growth" : "No Change"}
              </p>
            </div>
            <p
              className={cn(
                "text-4xl font-extrabold break-words",
                results.isDecline ? "text-red-500" : results.isGrowth ? "text-emerald-500" : "text-primary",
              )}
            >
              {results.isDecline && "-"}{formatCurrency(Math.abs(results.absoluteGrowth), currency)}
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              {results.isDecline ? (
                <span className="text-red-600 font-medium">
                  {results.growthRate.toFixed(2)}% decline
                </span>
              ) : results.isGrowth ? (
                <>
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">
                    +{results.growthRate.toFixed(2)}% growth
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">Flat revenue</span>
              )}
            </div>
            {results.periods > 0 && (
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>
                  CAGR: <span className={cn("font-semibold", results.isDecline ? "text-red-500" : "text-emerald-500")}>
                    {results.isDecline ? "" : "+"}{results.cagr.toFixed(2)}%
                  </span>
                  {" over "}{results.periods >= 12
                    ? `${(results.periods / 12).toFixed(1)} years`
                    : `${results.periods} months`}
                </span>
              </div>
            )}
          </div>

          {/* Mini Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Wallet className="w-3 h-3 text-blue-500" />
                Starting Revenue
              </p>
              <p className="text-lg font-bold text-blue-500 break-words">
                {formatCurrency(results.startRevenue, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Wallet className="w-3 h-3 text-indigo-500" />
                Ending Revenue
              </p>
              <p className="text-lg font-bold text-indigo-500 break-words">
                {formatCurrency(results.endRevenue, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <BadgePercent className="w-3 h-3 text-primary" />
                Growth Rate
              </p>
              <p className={cn("text-lg font-bold break-words", results.isDecline ? "text-red-500" : "text-primary")}>
                {results.isDecline ? "" : "+"}{results.growthRate.toFixed(2)}%
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-amber-500" />
                Growth Multiplier
              </p>
              <p className={cn("text-lg font-bold break-words", results.growthMultiplier < 1 ? "text-red-500" : "text-emerald-500")}>
                {results.growthMultiplier.toFixed(2)}×
              </p>
            </div>
          </div>

          {/* Summary Breakdown */}
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Growth Breakdown
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Starting Revenue</span>
                <span className="font-medium">{formatCurrency(results.startRevenue, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Ending Revenue</span>
                <span className="font-medium">{formatCurrency(results.endRevenue, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Absolute Growth</span>
                <span className={cn("font-medium", results.absoluteGrowth < 0 ? "text-red-500" : "text-emerald-500")}>
                  {results.absoluteGrowth >= 0 ? "+" : ""}{formatCurrency(results.absoluteGrowth, currency)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Growth Rate</span>
                <span className={cn("font-medium", results.growthRate < 0 ? "text-red-500" : "text-emerald-500")}>
                  {results.growthRate >= 0 ? "+" : ""}{results.growthRate.toFixed(2)}%
                </span>
              </div>
              {results.periods > 0 && (
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">CAGR (Annualized)</span>
                  <span className={cn("font-medium", results.cagr < 0 ? "text-red-500" : "text-emerald-500")}>
                    {results.cagr >= 0 ? "+" : ""}{results.cagr.toFixed(2)}%
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Growth Multiplier</span>
                <span className="font-medium">{results.growthMultiplier.toFixed(2)}×</span>
              </div>
              {results.periods > 0 && (
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Avg Growth / Month</span>
                  <span className={cn("font-medium", results.avgPeriodGrowth < 0 ? "text-red-500" : "text-emerald-500")}>
                    {results.avgPeriodGrowth >= 0 ? "+" : ""}{formatCurrency(results.avgPeriodGrowth, currency)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Projection Card */}
          {results.startRevenue > 0 && (
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Future Projections
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Projected revenue at {results.cagr >= 0 ? "+" : ""}{results.cagr.toFixed(2)}% CAGR
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-muted-foreground mb-1">1 Year</p>
                  <p className="text-base font-bold text-blue-500 break-words">
                    {formatCurrency(results.projected1Y, currency)}
                  </p>
                </div>
                <div className="text-center p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-xs text-muted-foreground mb-1">3 Years</p>
                  <p className="text-base font-bold text-indigo-500 break-words">
                    {formatCurrency(results.projected3Y, currency)}
                  </p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-muted-foreground mb-1">5 Years</p>
                  <p className="text-base font-bold text-purple-500 break-words">
                    {formatCurrency(results.projected5Y, currency)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Based on current CAGR - actual results may vary. Growth rates typically decrease as revenue scales.
              </p>
            </div>
          )}
        </div>
      </div>

    </ToolLayout>
  );
}
