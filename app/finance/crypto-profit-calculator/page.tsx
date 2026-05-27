"use client";

import { useCallback, useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { ArrowUpRight, ArrowDownRight, BadgePercent, Banknote, Calculator, Coins, FileText, Wallet, TrendingUp, TrendingDown } from "lucide-react";
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

// ===================================================================
// CONSTANTS
// ===================================================================

const PIE_COLORS_GAIN = ["#10b981", "#3b82f6"];
const PIE_COLORS_LOSS = ["#ef4444", "#3b82f6"];

const RELATED_TOOLS = [
  { name: "Bitcoin ROI Calculator", href: "/finance/bitcoin-roi-calculator", desc: "Calculate return on investment specifically for Bitcoin." },
  { name: "Capital Gains Tax Calculator", href: "/finance/capital-gains-tax-calculator", desc: "Calculate capital gains tax on crypto and other investments." },
  { name: "Profit Margin Calculator", href: "/finance/profit-margin-calculator", desc: "Calculate gross and net profit margins on products." },
  { name: "ROI Calculator", href: "/finance/roi-calculator", desc: "Calculate return on investment percentage for any asset." },
];

// ===================================================================
// TYPES
// ===================================================================

interface CryptoResults {
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  feePercent: number;
  costBasis: number;
  proceeds: number;
  grossProfit: number;
  totalFees: number;
  netProfit: number;
  roi: number;
  priceChange: number;
  priceChangePercent: number;
  isGain: boolean;
  isLoss: boolean;
  hasFees: boolean;
}

// ===================================================================
// CALCULATION ENGINE
// ===================================================================

const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

function calculateCrypto(
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  feePercent: number,
): CryptoResults {
  const ep = clamp(Number.isFinite(entryPrice) ? Math.max(0, entryPrice) : 0, 0, 1e9);
  const xp = clamp(Number.isFinite(exitPrice) ? Math.max(0, exitPrice) : 0, 0, 1e9);
  const q = clamp(Number.isFinite(quantity) ? Math.max(0, quantity) : 0, 0, 1e9);
  const f = clamp(Number.isFinite(feePercent) ? Math.max(0, feePercent) : 0, 0, 100);

  const costBasis = ep * q;
  const proceeds = xp * q;

  const tradeValue = costBasis + proceeds;
  const totalFees = tradeValue * (f / 100);

  const grossProfit = proceeds - costBasis;
  const netProfit = grossProfit - totalFees;

  return {
    entryPrice: ep,
    exitPrice: xp,
    quantity: q,
    feePercent: f,
    costBasis,
    proceeds,
    grossProfit,
    totalFees,
    netProfit,
    roi: costBasis > 0 ? (netProfit / costBasis) * 100 : 0,
    priceChange: xp - ep,
    priceChangePercent: ep > 0 ? ((xp - ep) / ep) * 100 : 0,
    isGain: netProfit > 0.005,
    isLoss: netProfit < -0.005,
    hasFees: totalFees > 0.005,
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

export default function CryptoProfitCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const { value: entryPrice, displayValue: entryPriceDisplay, setValue: setEntryPrice, handleChange: handleEntryInput, handleFocus: handleEntryFocus, handleBlur: handleEntryBlur } = useNumericField(50000);
  const { value: exitPrice, displayValue: exitPriceDisplay, setValue: setExitPrice, handleChange: handleExitInput, handleFocus: handleExitFocus, handleBlur: handleExitBlur } = useNumericField(55000);
  const { value: quantity, displayValue: quantityDisplay, setValue: setQuantity, handleChange: handleQuantityInput, handleFocus: handleQuantityFocus, handleBlur: handleQuantityBlur } = useNumericField(1);
  const { value: feePercent, displayValue: feePercentDisplay, setValue: setFeePercent, handleChange: handleFeeInput, handleFocus: handleFeeFocus, handleBlur: handleFeeBlur } = useNumericField(0.1);

  const results = useMemo<CryptoResults>(
    () => calculateCrypto(entryPrice, exitPrice, quantity, feePercent),
    [entryPrice, exitPrice, quantity, feePercent],
  );

  const pieData = useMemo(() => {
    const netValue = results.isLoss ? Math.abs(results.netProfit) : results.netProfit;
    if (results.isLoss) {
      return [
        { name: "Net Loss", value: netValue },
        { name: "Cost Basis", value: results.costBasis },
      ];
    }
    return [
      { name: "Net Profit", value: netValue },
      { name: "Cost Basis", value: results.costBasis },
    ];
  }, [results.netProfit, results.costBasis, results.isLoss]);

  const showPie = results.costBasis > 0 && (results.isGain || results.isLoss);

  // --- Handlers ---

  const handleCurrencyChange = useCallback((val: string) => {
    setCurrency(val as CurrencyCode);
  }, []);



  return (
    <ToolLayout
      title="Crypto Profit Calculator"
      description="Calculate cryptocurrency trading profit and loss with entry and exit prices, quantity, fees, and real-time ROI charts with multi-currency support."
      category="finance"
      faqContent={[
        {
          question: "How is crypto trading profit calculated?",
          answer: "Crypto trading profit is calculated as: Net Profit = (Exit Price × Quantity) - (Entry Price × Quantity) - Trading Fees. Your cost basis is the total amount invested (entry price × quantity). Your proceeds are the total amount received (exit price × quantity). Trading fees are typically a percentage of the total trade value and are deducted from your gross profit.",
        },
        {
          question: "What is ROI and how is it calculated for crypto?",
          answer: "ROI (Return on Investment) measures your profit as a percentage of your investment. It is calculated as: ROI = (Net Profit / Cost Basis) × 100. A positive ROI means you made a profit; a negative ROI means you took a loss. Crypto ROI can range from small single-digit returns to 10,000%+ gains on early-stage investments.",
        },
        {
          question: "How do trading fees affect my crypto profits?",
          answer: "Trading fees directly reduce your profits. Most exchanges charge between 0.01% and 0.5% per trade (maker/taker fees). Over many trades, fees can significantly impact your overall returns. This calculator applies the fee percentage to both your buy (cost basis) and sell (proceeds) trade values, giving you an accurate net profit figure.",
        },
        {
          question: "What is the difference between gross profit and net profit?",
          answer: "Gross profit is your profit before fees: Gross Profit = Proceeds - Cost Basis. Net profit is your actual profit after all trading costs: Net Profit = Gross Profit - Total Fees. Always focus on net profit, as it represents the actual money you take away from the trade. The difference can be significant for high-frequency traders.",
        },
        {
          question: "How do I calculate profit on partial crypto sells?",
          answer: "For partial sells, you need to determine the cost basis of the portion sold using a method like FIFO (First-In, First-Out), LIFO (Last-In, First-Out), or average cost basis. For example, if you bought 2 BTC at different prices and sell 1 BTC, you need to know which lot you're selling from. This calculator handles single-batch calculations - for complex portfolios, use a dedicated crypto tax tool.",
        },
        {
          question: "What fees should I include in my crypto profit calculation?",
          answer: "Include all fees associated with the trade: exchange trading fees (maker/taker), withdrawal fees, deposit fees (if any), network/gas fees for blockchain transactions, and conversion fees if you traded through a stablecoin pair. Some fees may be tax-deductible. This calculator uses a single all-in fee percentage for simplicity.",
        },
        {
          question: "How do stablecoin trades affect profit calculations?",
          answer: "Stablecoin trades (e.g., USDT, USDC, DAI) are calculated the same way as any other crypto trade. The entry price is what you paid per token, and the exit price is what you sold for. Stablecoins are designed to maintain a $1 peg, so profits typically come from interest (yield farming, staking) rather than price appreciation.",
        },
        {
          question: "What is the break-even price for a crypto trade?",
          answer: "Your break-even price is the exit price at which your net profit equals zero after fees. It is calculated as: Break-Even = Entry Price × (1 + Fee% / (1 - Fee%)). For example, with a $50,000 entry and 0.1% fees, your break-even is approximately $50,100 - meaning the price needs to rise 0.2% just to cover fees.",
        },
        {
          question: "How do I calculate profit on crypto margin trading?",
          answer: "Margin trading multiplies both gains and losses by the leverage factor. For example, with 5× leverage, a 10% price move results in a 50% gain or loss on your position. This calculator handles spot trading (no leverage). For margin calculations, multiply the net profit by your leverage factor and account for funding rates and interest.",
        },
        {
          question: "How can I minimize crypto trading fees?",
          answer: "To minimize fees: use limit orders (maker) instead of market orders (taker) to get lower rates, trade on exchanges with competitive fee structures (Binance 0.1%, Kraken 0.16%, Coinbase Advanced 0.4%), hold exchange tokens for fee discounts (BNB on Binance), use peer-to-peer trading for zero fees, and batch smaller trades into larger ones to reduce the number of transactions.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a Crypto Profit Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A Crypto Profit Calculator helps cryptocurrency traders calculate the profit or loss on their trades.
              By entering your <strong>entry price</strong>, <strong>exit price</strong>, <strong>quantity</strong>,
              and <strong>trading fees</strong>, you get an instant breakdown of your gross profit, net profit after
              fees, ROI percentage, and price change analysis. This tool supports 29+ currencies for global traders.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p>Cost Basis = Entry Price × Quantity</p>
              <p>Proceeds = Exit Price × Quantity</p>
              <p>Total Trade Value = Cost Basis + Proceeds</p>
              <p>Total Fees = Total Trade Value × (Fee % ÷ 100)</p>
              <p>Gross Profit = Proceeds - Cost Basis</p>
              <p><strong>Net Profit = Gross Profit - Total Fees</strong></p>
              <p>ROI = (Net Profit ÷ Cost Basis) × 100</p>
              <p>Price Change % = ((Exit Price - Entry Price) ÷ Entry Price) × 100</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Benefits of Using This Calculator</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              <li><strong>Instant Profit/Loss:</strong> See your net profit after fees in real time as you adjust prices and quantity.</li>
              <li><strong>Fee-Aware Calculations:</strong> Account for trading fees that eat into your profits - get an accurate net result.</li>
              <li><strong>ROI &amp; Price Analysis:</strong> View your ROI percentage and the price change from entry to exit.</li>
              <li><strong>Global Currencies:</strong> Supports 29+ currencies with proper locale-aware formatting.</li>
              <li><strong>Real-Time Pie Chart:</strong> Visual breakdown of your cost basis vs profit, updated instantly as you adjust sliders.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Scenario: You bought 1 BTC at $50,000 and sold at $55,000 with 0.1% trading fees.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Cost Basis = 1 × $50,000 = <strong>$50,000</strong></li>
                <li>Proceeds = 1 × $55,000 = <strong>$55,000</strong></li>
                <li>Gross Profit = $55,000 - $50,000 = <strong>$5,000</strong></li>
                <li>Total Fees = ($50,000 + $55,000) × 0.1% = <strong>$105</strong></li>
                <li><strong>Net Profit = $5,000 - $105 = $4,895</strong></li>
                <li>ROI = ($4,895 ÷ $50,000) × 100 = <strong>9.79%</strong></li>
                <li>Price Change = (($55,000 - $50,000) ÷ $50,000) × 100 = <strong>10%</strong></li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Common Mistakes to Avoid</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed text-muted-foreground">
              <li>Forgetting to include trading fees - they can significantly reduce your net profit, especially on small trades.</li>
              <li>Confusing gross profit with net profit - always subtract fees to get your actual take-home amount.</li>
              <li>Not accounting for network/gas fees when transferring crypto between wallets or exchanges.</li>
              <li>Using the wrong cost basis method (FIFO vs LIFO vs average) when reporting taxes on partial sells.</li>
              <li>Ignoring slippage - the actual execution price may differ from the quoted price on volatile markets.</li>
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
            <label htmlFor="crypto-currency" className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <Banknote className="w-4 h-4 text-primary" />
              Currency
            </label>
            <select
              id="crypto-currency"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} - {c.label} ({c.symbol})</option>
              ))}
            </select>
          </div>

          {/* Entry Price */}
          <div className="space-y-2">
            <label htmlFor="crypto-entry" className="flex items-center gap-1.5 text-sm font-medium">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Entry Price (per coin)</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(entryPrice, currency)}</span>
            </label>
            <input
              id="crypto-entry"
              type="range"
              min={0}
              max={1000000}
              step={10}
              value={Math.min(entryPrice, 1000000)}
              onChange={(e) => setEntryPrice(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={1000000}
              aria-valuenow={entryPrice}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCompact(1000000, currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={entryPriceDisplay}
              onChange={(e) => handleEntryInput(e.target.value)}
              onFocus={handleEntryFocus}
              onBlur={handleEntryBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter entry price"
            />
          </div>

          {/* Exit Price */}
          <div className="space-y-2">
            <label htmlFor="crypto-exit" className="flex items-center gap-1.5 text-sm font-medium">
              <TrendingDown className="w-4 h-4 text-primary" />
              <span>Exit Price (per coin)</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(exitPrice, currency)}</span>
            </label>
            <input
              id="crypto-exit"
              type="range"
              min={0}
              max={1000000}
              step={10}
              value={Math.min(exitPrice, 1000000)}
              onChange={(e) => setExitPrice(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={1000000}
              aria-valuenow={exitPrice}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCompact(1000000, currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={exitPriceDisplay}
              onChange={(e) => handleExitInput(e.target.value)}
              onFocus={handleExitFocus}
              onBlur={handleExitBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter exit price"
            />
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <label htmlFor="crypto-quantity" className="flex items-center gap-1.5 text-sm font-medium">
              <Coins className="w-4 h-4 text-primary" />
              <span>Quantity (coins/tokens)</span>
              <span className="ml-auto text-lg font-bold text-primary">{quantity.toFixed(quantity < 1 ? 6 : 4)}</span>
            </label>
            <input
              id="crypto-quantity"
              type="range"
              min={0}
              max={100000}
              step={0.1}
              value={Math.min(quantity, 100000)}
              onChange={(e) => setQuantity(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={100000}
              aria-valuenow={quantity}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span>100K</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={quantityDisplay}
              onChange={(e) => handleQuantityInput(e.target.value)}
              onFocus={handleQuantityFocus}
              onBlur={handleQuantityBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter quantity"
            />
          </div>

          {/* Fee Percentage */}
          <div className="space-y-2">
            <label htmlFor="crypto-fee" className="flex items-center gap-1.5 text-sm font-medium">
              <BadgePercent className="w-4 h-4 text-primary" />
              <span>Trading Fee</span>
              <span className="ml-auto text-lg font-bold text-primary">{feePercent.toFixed(3)}%</span>
            </label>
            <input
              id="crypto-fee"
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

          {/* Pie Chart */}
          {showPie && (
            <div className="bg-white border border-border rounded-xl p-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Cost Basis vs Profit
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
                  <p className="text-sm font-semibold">{formatCurrency(results.costBasis, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Profit/Loss</p>
                  <p className={cn("text-sm font-semibold", results.netProfit >= 0 ? "text-emerald-500" : "text-red-500")}>
                    {results.netProfit >= 0 ? "+" : "-"}{formatCurrency(Math.abs(results.netProfit), currency)}
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
              {results.isLoss && "-"}{formatCurrency(Math.abs(results.netProfit), currency)}
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
          </div>

          {/* Mini Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Wallet className="w-3 h-3 text-blue-500" />
                Cost Basis
              </p>
              <p className="text-lg font-bold text-blue-500 break-words">
                {formatCurrency(results.costBasis, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Wallet className="w-3 h-3 text-indigo-500" />
                Proceeds
              </p>
              <p className="text-lg font-bold text-indigo-500 break-words">
                {formatCurrency(results.proceeds, currency)}
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
                <BadgePercent className="w-3 h-3 text-amber-500" />
                Price Change
              </p>
              <p className={cn("text-lg font-bold break-words", results.priceChangePercent < 0 ? "text-red-500" : "text-emerald-500")}>
                {results.priceChangePercent >= 0 ? "+" : ""}{results.priceChangePercent.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Summary Breakdown */}
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Trade Breakdown
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Entry Price</span>
                <span className="font-medium">{formatCurrency(results.entryPrice, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Exit Price</span>
                <span className="font-medium">{formatCurrency(results.exitPrice, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-medium">{results.quantity.toFixed(results.quantity < 1 ? 6 : 4)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Cost Basis</span>
                <span className="font-medium">{formatCurrency(results.costBasis, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Proceeds</span>
                <span className="font-medium">{formatCurrency(results.proceeds, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Gross Profit</span>
                <span className={cn("font-medium", results.grossProfit < 0 ? "text-red-500" : "text-emerald-500")}>
                  {results.grossProfit >= 0 ? "+" : ""}{formatCurrency(results.grossProfit, currency)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Trading Fees ({results.feePercent.toFixed(2)}%)</span>
                <span className="font-medium text-amber-500">-{formatCurrency(results.totalFees, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-medium">Net Profit</span>
                <span className={cn("font-bold", results.isLoss ? "text-red-500" : results.isGain ? "text-emerald-500" : "text-primary")}>
                  {results.isLoss ? "-" : "+"}{formatCurrency(Math.abs(results.netProfit), currency)}
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
                <p className="text-xs text-muted-foreground mb-1">Entry Price</p>
                <p className="text-lg font-bold">{formatCurrency(results.entryPrice, currency)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Exit Price</p>
                <p className="text-lg font-bold">{formatCurrency(results.exitPrice, currency)}</p>
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
        </div>
      </div>

    </ToolLayout>
  );
}
