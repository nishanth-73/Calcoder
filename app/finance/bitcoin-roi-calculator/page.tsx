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
  { name: "Crypto Profit Calculator", href: "/finance/crypto-profit-calculator", desc: "Calculate crypto trading profit and loss with entry/exit prices and fees." },
  { name: "Capital Gains Tax Calculator", href: "/finance/capital-gains-tax-calculator", desc: "Calculate capital gains tax on crypto and other investments." },
  { name: "ROI Calculator", href: "/finance/roi-calculator", desc: "Calculate return on investment percentage for any asset." },
  { name: "Profit Margin Calculator", href: "/finance/profit-margin-calculator", desc: "Calculate gross and net profit margins on products." },
];

// ===================================================================
// TYPES
// ===================================================================

interface BtcResults {
  investment: number;
  buyPrice: number;
  currentPrice: number;
  feePercent: number;
  holdingPeriod: number;
  btcAcquired: number;
  currentValue: number;
  absoluteReturn: number;
  roi: number;
  annualizedRoi: number;
  xMultiplier: number;
  totalFees: number;
  priceChange: number;
  priceChangePercent: number;
  isGain: boolean;
  isLoss: boolean;
  hasReturn: boolean;
}

// ===================================================================
// CALCULATION ENGINE
// ===================================================================

const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

function calculateBtcRoi(
  investment: number,
  buyPrice: number,
  currentPrice: number,
  feePercent: number,
  holdingPeriod: number,
): BtcResults {
  const inv = clamp(Number.isFinite(investment) ? Math.max(0, investment) : 0, 0, 1e9);
  const bp = clamp(Number.isFinite(buyPrice) ? Math.max(0, buyPrice) : 0, 0, 1e9);
  const cp = clamp(Number.isFinite(currentPrice) ? Math.max(0, currentPrice) : 0, 0, 1e9);
  const f = clamp(Number.isFinite(feePercent) ? Math.max(0, feePercent) : 0, 0, 100);
  const hp = clamp(Number.isFinite(holdingPeriod) ? Math.max(0, holdingPeriod) : 0, 0, 1200);

  const btcAcquired = bp > 0 ? inv / bp : 0;
  const currentValue = btcAcquired * cp;
  const feeAmount = (inv + currentValue) * (f / 100);
  const absoluteReturn = currentValue - inv - feeAmount;
  const roi = inv > 0 ? (absoluteReturn / inv) * 100 : 0;
  const annualizedRoi = hp > 0 ? ((1 + roi / 100) ** (12 / hp) - 1) * 100 : roi;
  const xMultiplier = inv > 0 ? currentValue / inv : 0;
  const totalFees = feeAmount;
  const priceChange = cp - bp;
  const priceChangePercent = bp > 0 ? ((cp - bp) / bp) * 100 : 0;

  return {
    investment: inv,
    buyPrice: bp,
    currentPrice: cp,
    feePercent: f,
    holdingPeriod: hp,
    btcAcquired,
    currentValue,
    absoluteReturn,
    roi,
    annualizedRoi: Number.isFinite(annualizedRoi) ? annualizedRoi : roi,
    xMultiplier,
    totalFees,
    priceChange,
    priceChangePercent,
    isGain: absoluteReturn > 0.005,
    isLoss: absoluteReturn < -0.005,
    hasReturn: btcAcquired > 0,
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

export default function BtcRoiCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const { value: investment, displayValue: investmentDisplay, setValue: setInvestment, handleChange: handleInvestmentInput, handleFocus: handleInvestmentFocus, handleBlur: handleInvestmentBlur } = useNumericField(10000);
  const { value: buyPrice, displayValue: buyPriceDisplay, setValue: setBuyPrice, handleChange: handleBuyInput, handleFocus: handleBuyFocus, handleBlur: handleBuyBlur } = useNumericField(50000);
  const { value: currentPrice, displayValue: currentPriceDisplay, setValue: setCurrentPrice, handleChange: handleCurrentInput, handleFocus: handleCurrentFocus, handleBlur: handleCurrentBlur } = useNumericField(75000);
  const { value: feePercent, displayValue: feePercentDisplay, setValue: setFeePercent, handleChange: handleFeeInput, handleFocus: handleFeeFocus, handleBlur: handleFeeBlur } = useNumericField(0.1);
  const { value: holdingPeriod, displayValue: holdingPeriodDisplay, setValue: setHoldingPeriod, handleChange: handlePeriodInput, handleFocus: handlePeriodFocus, handleBlur: handlePeriodBlur } = useNumericField(12);

  const results = useMemo<BtcResults>(
    () => calculateBtcRoi(investment, buyPrice, currentPrice, feePercent, holdingPeriod),
    [investment, buyPrice, currentPrice, feePercent, holdingPeriod],
  );

  const pieData = useMemo(() => {
    if (!results.hasReturn) return [];
    const profitValue = Math.abs(results.absoluteReturn);
    if (results.isLoss) {
      return [
        { name: "Net Loss", value: profitValue },
        { name: "Investment", value: results.investment },
      ];
    }
    return [
      { name: "Net Profit", value: profitValue },
      { name: "Investment", value: results.investment },
    ];
  }, [results.absoluteReturn, results.investment, results.isLoss, results.hasReturn]);

  const showPie = results.hasReturn && (results.isGain || results.isLoss);

  // --- Handlers ---

  const handleCurrencyChange = useCallback((val: string) => {
    setCurrency(val as CurrencyCode);
  }, []);



  return (
    <ToolLayout
      title="Bitcoin ROI Calculator"
      description="Calculate Bitcoin return on investment - track your BTC profit, ROI, annualized returns, and price analysis with real-time charts and 29-currency support."
      category="finance"
      faqContent={[
        {
          question: "How is Bitcoin ROI calculated?",
          answer: "Bitcoin ROI is calculated as: ROI = ((Current Value - Investment - Fees) ÷ Investment) × 100. First, your BTC acquired is determined by dividing your investment by the buy price. Then, current value = BTC acquired × current price. The absolute return subtracts your investment and fees from the current value. ROI expresses this return as a percentage of your original investment.",
        },
        {
          question: "What is annualized ROI and why does it matter?",
          answer: "Annualized ROI normalizes your return to a per-year rate, making it comparable across different holding periods. It is calculated as: Annualized ROI = ((1 + ROI/100)^(12/months) - 1) × 100. For example, a 50% return over 24 months annualizes to approximately 22.5% per year. This helps you compare Bitcoin returns against other investments like stocks or bonds.",
        },
        {
          question: "How do exchange fees affect Bitcoin ROI?",
          answer: "Exchange fees reduce your net return. Most exchanges charge 0.1%-0.5% per trade, applied to both buying and selling. This calculator applies the fee percentage to both your investment amount (buy side) and your current portfolio value (sell side), giving you a realistic net return. Even small fees compound over time and can significantly impact long-term ROI.",
        },
        {
          question: "What is the X multiplier in Bitcoin ROI?",
          answer: "The X multiplier shows how many times your investment has grown. A 2× multiplier means your investment has doubled, 3× means tripled, etc. It is calculated as: X Multiplier = Current Value ÷ Investment. For example, a $10,000 investment now worth $50,000 = 5× multiplier. This is an intuitive way to understand large returns without percentages.",
        },
        {
          question: "How does holding period affect annualized ROI?",
          answer: "Longer holding periods typically smooth out Bitcoin's volatility. A 100% return in 6 months annualizes to ~300%, while the same return over 4 years annualizes to ~19%. This calculator uses your investment date in months to compute the annualized rate. Bitcoin has historically rewarded long-term holders, but past performance does not guarantee future results.",
        },
        {
          question: "What Bitcoin price should I use for current value?",
          answer: "Use the current market price from a reliable source like CoinGecko, CoinMarketCap, or your exchange's spot price. For the most accurate valuation, use the mid-market price (average of bid and ask). If calculating for tax purposes, use the price at the specific time of disposal (sale or transfer), as required by your local tax authority.",
        },
        {
          question: "How do I calculate ROI if I bought Bitcoin at multiple prices?",
          answer: "For multiple purchases, calculate your average cost basis: Total Investment ÷ Total BTC Acquired. Enter this average as the buy price, and your total investment amount. This gives you a blended ROI. For precise tax reporting, use a dedicated crypto portfolio tracker or cost basis method (FIFO, LIFO, or specific identification).",
        },
        {
          question: "Is Bitcoin ROI the same as profit?",
          answer: "No. Profit (absolute return) is the dollar amount gained or lost. ROI is this profit expressed as a percentage of your investment. For example, a $5,000 profit on a $10,000 investment = 50% ROI. A $5,000 profit on a $100,000 investment = 5% ROI. The dollar amount is the same, but the ROI tells you how efficiently your capital was deployed.",
        },
        {
          question: "What is the break-even Bitcoin price for my investment?",
          answer: "Your break-even price is: Break-Even = Buy Price × (1 + Fee% ÷ (1 - Fee%)). For example, if you bought at $50,000 with 0.1% fees, your break-even is approximately $50,100. The current price must exceed this for you to have a net profit after all fees. Use this calculator by adjusting the current price until your net return is zero.",
        },
        {
          question: "How do I use this calculator for Bitcoin tax reporting?",
          answer: "Enter your actual buy price and investment amount as recorded on your exchange. The absolute return shows your gross gain before taxes. For capital gains tax, use the Capital Gains Tax Calculator with your holding period to determine short-term vs long-term rates. Note that mining income, staking rewards, and airdrops are taxed as ordinary income, not capital gains.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a Bitcoin ROI Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A Bitcoin ROI Calculator helps investors calculate the return on investment for their Bitcoin holdings.
              By entering your <strong>investment amount</strong>, <strong>buy price</strong>, <strong>current price</strong>,
              <strong> trading fees</strong>, and <strong>holding period</strong>, you get an instant breakdown of your
              profit or loss, ROI percentage, annualized returns, and price analysis. This tool supports 29+ currencies
              for global investors.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p>BTC Acquired = Investment ÷ Buy Price</p>
              <p>Current Value = BTC Acquired × Current Price</p>
              <p>Total Trade Value = Investment + Current Value</p>
              <p>Total Fees = Total Trade Value × (Fee % ÷ 100)</p>
              <p>Absolute Return = Current Value - Investment - Fees</p>
              <p><strong>ROI = (Absolute Return ÷ Investment) × 100</strong></p>
              <p>Annualized ROI = ((1 + ROI ÷ 100) ^ (12 ÷ Months) - 1) × 100</p>
              <p>X Multiplier = Current Value ÷ Investment</p>
              <p>Price Change % = ((Current Price - Buy Price) ÷ Buy Price) × 100</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Benefits of Using This Calculator</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              <li><strong>Instant ROI:</strong> See your Bitcoin return on investment in real time as you adjust prices and investment amount.</li>
              <li><strong>Annualized Returns:</strong> Compare Bitcoin performance to traditional investments with annualized ROI.</li>
              <li><strong>Fee-Aware:</strong> Account for exchange fees that reduce your net returns.</li>
              <li><strong>X Multiplier:</strong> Intuitive multiplier view - see how many times your investment has grown.</li>
              <li><strong>Global Currencies:</strong> Supports 29+ currencies with proper locale-aware formatting.</li>
              <li><strong>Visual Charts:</strong> Pie chart breakdown of investment vs profit, updated in real time.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Scenario: You invested $10,000 when Bitcoin was $50,000. Today it&apos;s $75,000. You held for 12 months with 0.1% fees.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>BTC Acquired = $10,000 ÷ $50,000 = <strong>0.2 BTC</strong></li>
                <li>Current Value = 0.2 × $75,000 = <strong>$15,000</strong></li>
                <li>Total Fees = ($10,000 + $15,000) × 0.1% = <strong>$25</strong></li>
                <li>Absolute Return = $15,000 - $10,000 - $25 = <strong>$4,975</strong></li>
                <li><strong>ROI = ($4,975 ÷ $10,000) × 100 = 49.75%</strong></li>
                <li>Annualized ROI = ((1 + 0.4975)^(12÷12) - 1) × 100 = <strong>49.75%</strong></li>
                <li>X Multiplier = $15,000 ÷ $10,000 = <strong>1.5×</strong></li>
                <li>Price Change = (($75,000 - $50,000) ÷ $50,000) × 100 = <strong>50%</strong></li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Common Mistakes to Avoid</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed text-muted-foreground">
              <li>Forgetting to include trading fees - they reduce your net return, especially on frequent trades.</li>
              <li>Confusing absolute return (dollar amount) with ROI (percentage) - both are useful but tell different stories.</li>
              <li>Not annualizing returns when comparing across different holding periods.</li>
              <li>Using the wrong buy price - include the price you actually paid, not the price at the time you first heard about Bitcoin.</li>
              <li>Ignoring tax implications - a high ROI may still result in significant capital gains tax liability.</li>
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
            <label htmlFor="btc-currency" className="flex items-center gap-1.5 text-sm font-medium mb-1">
              <Banknote className="w-4 h-4 text-primary" />
              Currency
            </label>
            <select
              id="btc-currency"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} - {c.label} ({c.symbol})</option>
              ))}
            </select>
          </div>

          {/* Investment Amount */}
          <div className="space-y-2">
            <label htmlFor="btc-investment" className="flex items-center gap-1.5 text-sm font-medium">
              <Wallet className="w-4 h-4 text-primary" />
              <span>Investment Amount</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(investment, currency)}</span>
            </label>
            <input
              id="btc-investment"
              type="range"
              min={0}
              max={getMaxAmount(currency)}
              step={getSliderStep(currency)}
              value={Math.min(investment, getMaxAmount(currency))}
              onChange={(e) => setInvestment(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={getMaxAmount(currency)}
              aria-valuenow={investment}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCompact(getMaxAmount(currency), currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={investmentDisplay}
              onChange={(e) => handleInvestmentInput(e.target.value)}
              onFocus={handleInvestmentFocus}
              onBlur={handleInvestmentBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter investment amount"
            />
          </div>

          {/* Buy Price */}
          <div className="space-y-2">
            <label htmlFor="btc-buy" className="flex items-center gap-1.5 text-sm font-medium">
              <Coins className="w-4 h-4 text-primary" />
              <span>Buy Price (per BTC)</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(buyPrice, currency)}</span>
            </label>
            <input
              id="btc-buy"
              type="range"
              min={0}
              max={1000000}
              step={10}
              value={Math.min(buyPrice, 1000000)}
              onChange={(e) => setBuyPrice(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={1000000}
              aria-valuenow={buyPrice}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCompact(1000000, currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={buyPriceDisplay}
              onChange={(e) => handleBuyInput(e.target.value)}
              onFocus={handleBuyFocus}
              onBlur={handleBuyBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter buy price per BTC"
            />
          </div>

          {/* Current Price */}
          <div className="space-y-2">
            <label htmlFor="btc-current" className="flex items-center gap-1.5 text-sm font-medium">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Current Price (per BTC)</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(currentPrice, currency)}</span>
            </label>
            <input
              id="btc-current"
              type="range"
              min={0}
              max={1000000}
              step={10}
              value={Math.min(currentPrice, 1000000)}
              onChange={(e) => setCurrentPrice(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={1000000}
              aria-valuenow={currentPrice}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCompact(1000000, currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={currentPriceDisplay}
              onChange={(e) => handleCurrentInput(e.target.value)}
              onFocus={handleCurrentFocus}
              onBlur={handleCurrentBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter current price per BTC"
            />
          </div>

          {/* Fee Percentage */}
          <div className="space-y-2">
            <label htmlFor="btc-fee" className="flex items-center gap-1.5 text-sm font-medium">
              <BadgePercent className="w-4 h-4 text-primary" />
              <span>Trading Fee</span>
              <span className="ml-auto text-lg font-bold text-primary">{feePercent.toFixed(3)}%</span>
            </label>
            <input
              id="btc-fee"
              type="range"
              min={0}
              max={5}
              step={0.01}
              value={Math.min(feePercent, 5)}
              onChange={(e) => setFeePercent(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={5}
              aria-valuenow={feePercent}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0%</span>
              <span>2.5%</span>
              <span>5%</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={feePercentDisplay}
              onChange={(e) => handleFeeInput(e.target.value)}
              onFocus={handleFeeFocus}
              onBlur={handleFeeBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter fee %"
            />
          </div>

          {/* Holding Period */}
          <div className="space-y-2">
            <label htmlFor="btc-period" className="flex items-center gap-1.5 text-sm font-medium">
              <Clock className="w-4 h-4 text-primary" />
              <span>Holding Period</span>
              <span className="ml-auto text-lg font-bold text-primary">{holdingPeriod >= 12 ? `${(holdingPeriod / 12).toFixed(1)} yrs` : `${holdingPeriod} mos`}</span>
            </label>
            <input
              id="btc-period"
              type="range"
              min={0}
              max={1200}
              step={1}
              value={holdingPeriod}
              onChange={(e) => setHoldingPeriod(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={1200}
              aria-valuenow={holdingPeriod}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0 mo</span>
              <span>5 yrs</span>
              <span>100 yrs</span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={holdingPeriodDisplay}
              onChange={(e) => handlePeriodInput(e.target.value)}
              onFocus={handlePeriodFocus}
              onBlur={handlePeriodBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter months held"
            />
          </div>

          {/* Pie Chart */}
          {showPie && (
            <div className="bg-white border border-border rounded-xl p-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Investment vs Profit
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
                  <p className="text-[11px] text-muted-foreground mb-0.5">Investment</p>
                  <p className="text-sm font-semibold">{formatCurrency(results.investment, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Profit/Loss</p>
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
            {results.holdingPeriod > 0 && (
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>
                  Annualized: <span className={cn("font-semibold", results.isLoss ? "text-red-500" : "text-emerald-500")}>
                    {results.isLoss ? "" : "+"}{results.annualizedRoi.toFixed(2)}%
                  </span>
                  {" over "}{results.holdingPeriod >= 12
                    ? `${(results.holdingPeriod / 12).toFixed(1)} years`
                    : `${results.holdingPeriod} months`}
                </span>
              </div>
            )}
          </div>

          {/* Mini Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Wallet className="w-3 h-3 text-blue-500" />
                Investment
              </p>
              <p className="text-lg font-bold text-blue-500 break-words">
                {formatCurrency(results.investment, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Wallet className="w-3 h-3 text-indigo-500" />
                Current Value
              </p>
              <p className="text-lg font-bold text-indigo-500 break-words">
                {formatCurrency(results.currentValue, currency)}
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
                <span className="text-muted-foreground">BTC Acquired</span>
                <span className="font-medium">{results.btcAcquired.toFixed(results.btcAcquired < 1 ? 8 : 4)} BTC</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Buy Price</span>
                <span className="font-medium">{formatCurrency(results.buyPrice, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Current Price</span>
                <span className="font-medium">{formatCurrency(results.currentPrice, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Investment</span>
                <span className="font-medium">{formatCurrency(results.investment, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Current Value</span>
                <span className="font-medium">{formatCurrency(results.currentValue, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Trading Fees ({results.feePercent.toFixed(2)}%)</span>
                <span className="font-medium text-amber-500">-{formatCurrency(results.totalFees, currency)}</span>
              </div>
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

          {/* Price Change Card */}
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Price Analysis
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Buy Price</p>
                <p className="text-lg font-bold">{formatCurrency(results.buyPrice, currency)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                <p className="text-lg font-bold">{formatCurrency(results.currentPrice, currency)}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-border/50">
              {results.priceChangePercent >= 0 ? (
                <ArrowUpRight className="w-5 h-5 text-emerald-500" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-red-500" />
              )}
              <span className={cn("text-lg font-bold", results.priceChangePercent < 0 ? "text-red-500" : "text-emerald-500")}>
                {results.priceChangePercent >= 0 ? "+" : ""}{results.priceChangePercent.toFixed(2)}%
              </span>
              <span className="text-sm text-muted-foreground">
                ({results.priceChange >= 0 ? "+" : ""}{formatCurrency(results.priceChange, currency)})
              </span>
            </div>
          </div>

          {/* Annualized ROI Card */}
          {results.holdingPeriod > 0 && (
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Annualized Performance
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Holding Period</p>
                  <p className="text-lg font-bold">
                    {results.holdingPeriod >= 12
                      ? `${(results.holdingPeriod / 12).toFixed(1)} years`
                      : `${results.holdingPeriod} months`}
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
                Total return of {results.roi.toFixed(2)}% over {results.holdingPeriod >= 12
                  ? `${(results.holdingPeriod / 12).toFixed(1)} years`
                  : `${results.holdingPeriod} months`} annualizes to {results.annualizedRoi.toFixed(2)}% per year
              </p>
            </div>
          )}
        </div>
      </div>

    </ToolLayout>
  );
}
