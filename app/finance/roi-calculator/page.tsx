"use client";

import { useCallback, useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { ArrowUpRight, ArrowDownRight, BadgePercent, Banknote, Calculator, Clock, Coins, FileText, TrendingUp, TrendingDown, Wallet } from "lucide-react";
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
  { name: "Bitcoin ROI Calculator", href: "/finance/bitcoin-roi-calculator", desc: "Calculate return on investment specifically for Bitcoin holdings." },
  { name: "CAGR Calculator", href: "/finance/cagr-calculator", desc: "Calculate compound annual growth rate for investments." },
  { name: "Profit Margin Calculator", href: "/finance/profit-margin-calculator", desc: "Calculate gross and net profit margins on products." },
  { name: "Crypto Profit Calculator", href: "/finance/crypto-profit-calculator", desc: "Calculate crypto trading profit and loss with entry/exit prices." },
];

// ===================================================================
// TYPES
// ===================================================================

interface RoiResults {
  initialInvestment: number;
  finalValue: number;
  additionalContributions: number;
  totalCost: number;
  months: number;
  feesPercent: number;
  feesAmount: number;
  absoluteReturn: number;
  roi: number;
  annualizedRoi: number;
  xMultiplier: number;
  isGain: boolean;
  isLoss: boolean;
  hasReturn: boolean;
}

// ===================================================================
// CALCULATION ENGINE
// ===================================================================

const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

function calculateRoi(
  initialInvestment: number,
  finalValue: number,
  additionalContributions: number,
  months: number,
  feesPercent: number,
): RoiResults {
  const inv = clamp(Number.isFinite(initialInvestment) ? Math.max(0, initialInvestment) : 0, 0, 1e9);
  const fv = clamp(Number.isFinite(finalValue) ? Math.max(0, finalValue) : 0, 0, 1e9);
  const ac = clamp(Number.isFinite(additionalContributions) ? Math.max(0, additionalContributions) : 0, 0, 1e9);
  const m = clamp(Number.isFinite(months) ? Math.max(0, months) : 0, 0, 1200);
  const fp = clamp(Number.isFinite(feesPercent) ? Math.max(0, feesPercent) : 0, 0, 100);

  const totalCost = inv + ac;
  const feesAmount = totalCost * (fp / 100);
  const absoluteReturn = fv - totalCost - feesAmount;
  const roi = totalCost > 0 ? (absoluteReturn / totalCost) * 100 : 0;
  const annualizedRoi = m > 0 ? ((1 + roi / 100) ** (12 / m) - 1) * 100 : roi;
  const xMultiplier = totalCost > 0 ? fv / totalCost : 0;

  return {
    initialInvestment: inv,
    finalValue: fv,
    additionalContributions: ac,
    totalCost,
    months: m,
    feesPercent: fp,
    feesAmount,
    absoluteReturn,
    roi,
    annualizedRoi: Number.isFinite(annualizedRoi) ? annualizedRoi : roi,
    xMultiplier,
    isGain: absoluteReturn > 0.005,
    isLoss: absoluteReturn < -0.005,
    hasReturn: totalCost > 0,
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

export default function RoiCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const { value: initialInvestment, displayValue: initialInvestmentDisplay, setValue: setInitialInvestment, handleChange: handleInitialInput, handleFocus: handleInitialFocus, handleBlur: handleInitialBlur } = useNumericField(10000);
  const { value: finalValue, displayValue: finalValueDisplay, setValue: setFinalValue, handleChange: handleFinalInput, handleFocus: handleFinalFocus, handleBlur: handleFinalBlur } = useNumericField(15000);
  const { value: additionalContributions, displayValue: additionalContributionsDisplay, setValue: setAdditionalContributions, handleChange: handleContribInput, handleFocus: handleContribFocus, handleBlur: handleContribBlur } = useNumericField(0);
  const { value: months, displayValue: monthsDisplay, setValue: setMonths, handleChange: handleMonthsInput, handleFocus: handleMonthsFocus, handleBlur: handleMonthsBlur } = useNumericField(12);
  const { value: feesPercent, displayValue: feesPercentDisplay, setValue: setFeesPercent, handleChange: handleFeesInput, handleFocus: handleFeesFocus, handleBlur: handleFeesBlur } = useNumericField(0);

  const results = useMemo<RoiResults>(
    () => calculateRoi(initialInvestment, finalValue, additionalContributions, months, feesPercent),
    [initialInvestment, finalValue, additionalContributions, months, feesPercent],
  );

  const pieData = useMemo(() => {
    if (!results.hasReturn) return [];
    const profitValue = Math.abs(results.absoluteReturn);
    if (results.isLoss) {
      return [
        { name: "Net Loss", value: profitValue },
        { name: "Total Cost", value: results.totalCost },
      ];
    }
    return [
      { name: "Net Profit", value: profitValue },
      { name: "Total Cost", value: results.totalCost },
    ];
  }, [results.absoluteReturn, results.totalCost, results.isLoss, results.hasReturn]);

  const showPie = results.hasReturn && (results.isGain || results.isLoss);

  // --- Handlers ---

  const handleCurrencyChange = useCallback((val: string) => {
    setCurrency(val as CurrencyCode);
  }, []);



  return (
    <ToolLayout
      title="ROI Calculator"
      description="Calculate return on investment for any asset - measure profit, ROI percentage, annualized returns, and X multiplier with real-time charts and 29-currency support."
      category="finance"
      faqContent={[
        {
          question: "How is ROI calculated?",
          answer: "ROI (Return on Investment) is calculated as: ROI = ((Final Value - Total Cost - Fees) ÷ Total Cost) × 100. Total Cost = Initial Investment + Additional Contributions. ROI expresses your profit or loss as a percentage of your total invested capital. A positive ROI means you made a profit; a negative ROI means you took a loss.",
        },
        {
          question: "What is annualized ROI and why is it important?",
          answer: "Annualized ROI normalizes your return to a per-year rate, making it comparable across investments with different holding periods. It is calculated as: Annualized ROI = ((1 + ROI/100)^(12/months) - 1) × 100. For example, a 20% return over 24 months annualizes to approximately 9.5% per year, allowing you to compare a 2-year investment to a 6-month one.",
        },
        {
          question: "What is the difference between ROI and X multiplier?",
          answer: "ROI expresses return as a percentage (e.g., 50% return), while the X multiplier expresses it as a factor of your investment (e.g., 1.5×). Both convey the same information: an ROI of 100% = 2× multiplier, 200% = 3×, 50% = 1.5×, 0% = 1×. The X multiplier is intuitive for quick comparisons - 10× sounds more impressive than 900%.",
        },
        {
          question: "Should I include additional contributions in ROI calculation?",
          answer: "Yes, always include additional contributions to get an accurate ROI. If you invest $10,000 initially and later add $5,000, your total cost basis is $15,000, not $10,000. Calculating ROI without additional contributions would overstate your returns. This calculator lets you add contributions to get a true weighted return.",
        },
        {
          question: "How do fees affect my return on investment?",
          answer: "Fees directly reduce your net return. This includes trading commissions, management fees, advisory fees, and transaction costs. For example, a 2% fee on a $100,000 investment costs $2,000, reducing your absolute return by that amount. Over long periods, high fees can significantly compound and eat into your investment growth.",
        },
        {
          question: "What is a good ROI for an investment?",
          answer: "A good ROI depends on the investment type and risk level. Stock market average ROI is 7-10% annualized (S&P 500 historical average). Real estate typically yields 8-15%. Venture capital targets 25%+. High-risk investments should command higher potential ROI. As a rule of thumb, any positive ROI above inflation (2-3%) means your purchasing power grew.",
        },
        {
          question: "Can ROI be negative and what does it mean?",
          answer: "Yes, a negative ROI means you lost money on your investment. For example, if you invested $10,000 and the investment is now worth $8,000, your ROI is -20%. A negative ROI indicates that the investment did not perform as expected, and you would have been better off holding cash or choosing a different investment vehicle.",
        },
        {
          question: "How do I calculate ROI for a rental property?",
          answer: "For rental properties, use the initial investment (down payment + closing costs + renovation) as your cost basis. The final value includes both the property's appreciation and cumulative rental income minus expenses (property tax, insurance, maintenance, management fees). This calculator works for real estate by entering your total cash invested and total returns received.",
        },
        {
          question: "What is the difference between ROI and IRR?",
          answer: "ROI is a simple percentage return over the entire holding period. IRR (Internal Rate of Return) accounts for the timing of cash flows - when money goes in and comes out. ROI treats all investments the same regardless of timing. For investments with multiple contributions at different times, IRR is more accurate but more complex to calculate.",
        },
        {
          question: "How do I use this calculator for business ROI?",
          answer: "For business investments, enter your total project cost (equipment, labor, marketing) as the initial investment, and the total revenue or savings generated as the final value. Include any ongoing costs as additional contributions. The ROI shows whether the business initiative was worthwhile - most businesses target an ROI of at least 15-20% for new projects.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is an ROI Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              An ROI (Return on Investment) Calculator helps investors measure the profitability of any investment.
              By entering your <strong>initial investment</strong>, <strong>final value</strong>, <strong>additional contributions</strong>,
              <strong> holding period</strong>, and <strong>fees</strong>, you get an instant breakdown of your absolute return,
              ROI percentage, annualized returns, and X multiplier. This tool supports 29+ currencies for global investors.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p>Total Cost = Initial Investment + Additional Contributions</p>
              <p>Fees Amount = Total Cost × (Fees % ÷ 100)</p>
              <p>Absolute Return = Final Value - Total Cost - Fees</p>
              <p><strong>ROI = (Absolute Return ÷ Total Cost) × 100</strong></p>
              <p>Annualized ROI = ((1 + ROI ÷ 100) ^ (12 ÷ Months) - 1) × 100</p>
              <p>X Multiplier = Final Value ÷ Total Cost</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Benefits of Using This Calculator</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              <li><strong>Universal Application:</strong> Works for stocks, real estate, business projects, crypto, or any investment.</li>
              <li><strong>Annualized Returns:</strong> Compare investments with different holding periods on a level playing field.</li>
              <li><strong>Fee-Aware:</strong> Account for commissions, management fees, and transaction costs.</li>
              <li><strong>Multi-Contribution:</strong> Add extra contributions over time for accurate total cost basis.</li>
              <li><strong>Global Currencies:</strong> Supports 29+ currencies with proper locale-aware formatting.</li>
              <li><strong>Visual Chart:</strong> Pie chart breakdown of total cost vs profit, updated in real time.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Scenario: You invested $10,000 in a stock. After 24 months, it&apos;s worth $15,000. You added $2,000 in extra contributions. Fees were 1%.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Total Cost = $10,000 + $2,000 = <strong>$12,000</strong></li>
                <li>Fees = $12,000 × 1% = <strong>$120</strong></li>
                <li>Absolute Return = $15,000 - $12,000 - $120 = <strong>$2,880</strong></li>
                <li><strong>ROI = ($2,880 ÷ $12,000) × 100 = 24%</strong></li>
                <li>Annualized ROI = ((1 + 0.24)^(12÷24) - 1) × 100 = <strong>11.36%</strong></li>
                <li>X Multiplier = $15,000 ÷ $12,000 = <strong>1.25×</strong></li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Common Mistakes to Avoid</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed text-muted-foreground">
              <li>Forgetting to include all costs - purchase fees, maintenance, taxes, and exit costs all reduce your true ROI.</li>
              <li>Comparing annualized vs simple ROI - always annualize when comparing investments with different timeframes.</li>
              <li>Ignoring inflation - a 5% ROI in a year with 6% inflation means you actually lost purchasing power.</li>
              <li>Using only initial investment and ignoring additional contributions - this inflates your apparent returns.</li>
              <li>Confusing revenue with profit - revenue is what you receive; profit is revenue minus all costs and fees.</li>
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
            <label htmlFor="roi-currency" className="flex items-center gap-1.5 text-sm font-medium mb-1">
              <Banknote className="w-4 h-4 text-primary" />
              Currency
            </label>
            <select
              id="roi-currency"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} - {c.label} ({c.symbol})</option>
              ))}
            </select>
          </div>

          {/* Initial Investment */}
          <div className="space-y-2">
            <label htmlFor="roi-initial" className="flex items-center gap-1.5 text-sm font-medium">
              <Wallet className="w-4 h-4 text-primary" />
              <span>Initial Investment</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(initialInvestment, currency)}</span>
            </label>
            <input
              id="roi-initial"
              type="range"
              min={0}
              max={getMaxAmount(currency)}
              step={getSliderStep(currency)}
              value={Math.min(initialInvestment, getMaxAmount(currency))}
              onChange={(e) => setInitialInvestment(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={getMaxAmount(currency)}
              aria-valuenow={initialInvestment}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCompact(getMaxAmount(currency), currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={initialInvestmentDisplay}
              onChange={(e) => handleInitialInput(e.target.value)}
              onFocus={handleInitialFocus}
              onBlur={handleInitialBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter initial investment"
            />
          </div>

          {/* Final Value */}
          <div className="space-y-2">
            <label htmlFor="roi-final" className="flex items-center gap-1.5 text-sm font-medium">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Final Value</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(finalValue, currency)}</span>
            </label>
            <input
              id="roi-final"
              type="range"
              min={0}
              max={getMaxAmount(currency)}
              step={getSliderStep(currency)}
              value={Math.min(finalValue, getMaxAmount(currency))}
              onChange={(e) => setFinalValue(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={getMaxAmount(currency)}
              aria-valuenow={finalValue}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCompact(getMaxAmount(currency), currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={finalValueDisplay}
              onChange={(e) => handleFinalInput(e.target.value)}
              onFocus={handleFinalFocus}
              onBlur={handleFinalBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter final value"
            />
          </div>

          {/* Additional Contributions */}
          <div className="space-y-2">
            <label htmlFor="roi-contrib" className="flex items-center gap-1.5 text-sm font-medium">
              <Coins className="w-4 h-4 text-primary" />
              <span>Additional Contributions</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(additionalContributions, currency)}</span>
            </label>
            <input
              id="roi-contrib"
              type="range"
              min={0}
              max={getMaxAmount(currency)}
              step={getSliderStep(currency)}
              value={Math.min(additionalContributions, getMaxAmount(currency))}
              onChange={(e) => setAdditionalContributions(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={getMaxAmount(currency)}
              aria-valuenow={additionalContributions}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCompact(getMaxAmount(currency), currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={additionalContributionsDisplay}
              onChange={(e) => handleContribInput(e.target.value)}
              onFocus={handleContribFocus}
              onBlur={handleContribBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter additional contributions"
            />
          </div>

          {/* Holding Period */}
          <div className="space-y-2">
            <label htmlFor="roi-period" className="flex items-center gap-1.5 text-sm font-medium">
              <Clock className="w-4 h-4 text-primary" />
              <span>Holding Period</span>
              <span className="ml-auto text-lg font-bold text-primary">{months >= 12 ? `${(months / 12).toFixed(1)} yrs` : `${months} mos`}</span>
            </label>
            <input
              id="roi-period"
              type="range"
              min={0}
              max={1200}
              step={1}
              value={months}
              onChange={(e) => setMonths(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={1200}
              aria-valuenow={months}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0 mo</span>
              <span>5 yrs</span>
              <span>100 yrs</span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={monthsDisplay}
              onChange={(e) => handleMonthsInput(e.target.value)}
              onFocus={handleMonthsFocus}
              onBlur={handleMonthsBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter months"
            />
          </div>

          {/* Fees */}
          <div className="space-y-2">
            <label htmlFor="roi-fees" className="flex items-center gap-1.5 text-sm font-medium">
              <BadgePercent className="w-4 h-4 text-primary" />
              <span>Fees &amp; Costs</span>
              <span className="ml-auto text-lg font-bold text-primary">{feesPercent.toFixed(1)}%</span>
            </label>
            <input
              id="roi-fees"
              type="range"
              min={0}
              max={20}
              step={0.5}
              value={Math.min(feesPercent, 20)}
              onChange={(e) => setFeesPercent(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={20}
              aria-valuenow={feesPercent}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0%</span>
              <span>10%</span>
              <span>20%</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={feesPercentDisplay}
              onChange={(e) => handleFeesInput(e.target.value)}
              onFocus={handleFeesFocus}
              onBlur={handleFeesBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter fees %"
            />
          </div>

          {/* Pie Chart */}
          {showPie && (
            <div className="bg-white border border-border rounded-xl p-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Cost vs Profit
              </p>
              <div className="flex items-center justify-center h-36">
                <ResponsiveContainer initialDimension={{width:100,height:100}} width="100%" height="100%">
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
                        <Cell key={idx} fill={results.isLoss ? PIE_COLORS_LOSS[idx] : PIE_COLORS_GAIN[idx]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<PieTooltip currency={currency} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 text-xs ml-2">
                  {pieData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: results.isLoss ? PIE_COLORS_LOSS[idx] : PIE_COLORS_GAIN[idx] }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Total Invested</p>
                  <p className="text-sm font-semibold">{formatCurrency(results.totalCost, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Net Return</p>
                  <p className={cn("text-sm font-semibold", results.absoluteReturn >= 0 ? "text-emerald-500" : "text-red-500")}>
                    {results.absoluteReturn >= 0 ? "+" : "-"}{formatCurrency(Math.abs(results.absoluteReturn), currency)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">ROI</p>
                  <p className={cn("text-sm font-semibold", results.roi >= 0 ? "text-emerald-500" : "text-red-500")}>
                    {results.roi >= 0 ? "+" : ""}{results.roi.toFixed(2)}%
                  </p>
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
              results.isLoss
                ? "bg-gradient-to-br from-red-50 to-red-100/50 border-red-200"
                : results.isGain
                  ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200"
                  : "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20",
            )}
          >
            <div className="flex items-center gap-2 mb-3">
              {results.isLoss ? (
                <TrendingDown className="w-5 h-5 text-red-500" />
              ) : results.isGain ? (
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              ) : (
                <Calculator className="w-5 h-5 text-primary" />
              )}
              <p className="text-sm text-muted-foreground font-medium">
                {results.isLoss ? "Net Loss" : results.isGain ? "Net Profit" : "Break-Even"}
              </p>
            </div>
            <p
              className={cn(
                "text-4xl font-extrabold break-words",
                results.isLoss ? "text-red-500" : results.isGain ? "text-emerald-500" : "text-primary",
              )}
            >
              {results.isLoss && "-"}{formatCurrency(Math.abs(results.absoluteReturn), currency)}
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              {results.isLoss ? (
                <span className="text-red-600 font-medium">
                  {results.roi.toFixed(2)}% return
                </span>
              ) : results.isGain ? (
                <>
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">
                    +{results.roi.toFixed(2)}% return
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">No profit or loss</span>
              )}
            </div>
            {results.months > 0 && (
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>
                  Annualized: <span className={cn("font-semibold", results.isLoss ? "text-red-500" : "text-emerald-500")}>
                    {results.isLoss ? "" : "+"}{results.annualizedRoi.toFixed(2)}%
                  </span>
                  {" over "}{results.months >= 12
                    ? `${(results.months / 12).toFixed(1)} years`
                    : `${results.months} months`}
                </span>
              </div>
            )}
          </div>

          {/* Mini Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Wallet className="w-3 h-3 text-blue-500" />
                Total Cost
              </p>
              <p className="text-lg font-bold text-blue-500 break-words">
                {formatCurrency(results.totalCost, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Wallet className="w-3 h-3 text-indigo-500" />
                Final Value
              </p>
              <p className="text-lg font-bold text-indigo-500 break-words">
                {formatCurrency(results.finalValue, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <BadgePercent className="w-3 h-3 text-primary" />
                ROI
              </p>
              <p className={cn("text-lg font-bold break-words", results.isLoss ? "text-red-500" : "text-primary")}>
                {results.isLoss ? "" : "+"}{results.roi.toFixed(2)}%
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-amber-500" />
                X Multiplier
              </p>
              <p className={cn("text-lg font-bold break-words", results.xMultiplier < 1 ? "text-red-500" : "text-emerald-500")}>
                {results.xMultiplier.toFixed(2)}×
              </p>
            </div>
          </div>

          {/* Summary Breakdown */}
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Investment Breakdown
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Initial Investment</span>
                <span className="font-medium">{formatCurrency(results.initialInvestment, currency)}</span>
              </div>
              {results.additionalContributions > 0 && (
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Additional Contributions</span>
                  <span className="font-medium">+{formatCurrency(results.additionalContributions, currency)}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Total Cost</span>
                <span className="font-medium">{formatCurrency(results.totalCost, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Final Value</span>
                <span className="font-medium">{formatCurrency(results.finalValue, currency)}</span>
              </div>
              {results.feesPercent > 0 && (
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Fees ({results.feesPercent.toFixed(1)}%)</span>
                  <span className="font-medium text-amber-500">-{formatCurrency(results.feesAmount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Absolute Return</span>
                <span className={cn("font-medium", results.absoluteReturn < 0 ? "text-red-500" : "text-emerald-500")}>
                  {results.absoluteReturn >= 0 ? "+" : ""}{formatCurrency(results.absoluteReturn, currency)}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-medium">ROI</span>
                <span className={cn("font-bold", results.isLoss ? "text-red-500" : results.isGain ? "text-emerald-500" : "text-primary")}>
                  {results.isLoss ? "" : "+"}{results.roi.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Annualized ROI Card */}
          {results.months > 0 && (
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Annualized Performance
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Holding Period</p>
                  <p className="text-lg font-bold">
                    {results.months >= 12
                      ? `${(results.months / 12).toFixed(1)} years`
                      : `${results.months} months`}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Annualized ROI</p>
                  <p className={cn("text-lg font-bold", results.isLoss ? "text-red-500" : "text-emerald-500")}>
                    {results.isLoss ? "" : "+"}{results.annualizedRoi.toFixed(2)}%
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Total return of {results.roi.toFixed(2)}% over {results.months >= 12
                  ? `${(results.months / 12).toFixed(1)} years`
                  : `${results.months} months`} annualizes to {results.annualizedRoi.toFixed(2)}% per year
              </p>
            </div>
          )}
        </div>
      </div>

    </ToolLayout>
  );
}
