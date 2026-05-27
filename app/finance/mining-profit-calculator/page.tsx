"use client";

import { useCallback, useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { ArrowUpRight, ArrowDownRight, BadgePercent, Banknote, Calculator, Clock, Coins, FileText, TrendingUp, TrendingDown, Wallet, Zap, Cpu } from "lucide-react";
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
// HARDWARE PRESETS
// ===================================================================

interface MinerPreset {
  name: string;
  hashRate: number;
  power: number;
}

const MINER_PRESETS: MinerPreset[] = [
  { name: "S19 Pro", hashRate: 110, power: 3250 },
  { name: "S19 XP", hashRate: 140, power: 3010 },
  { name: "S21", hashRate: 200, power: 3500 },
  { name: "S21 XP", hashRate: 270, power: 3600 },
  { name: "M50S", hashRate: 126, power: 3276 },
  { name: "M60", hashRate: 180, power: 3400 },
  { name: "M66S", hashRate: 250, power: 3600 },
  { name: "Custom", hashRate: 100, power: 3000 },
];

// ===================================================================
// CONSTANTS
// ===================================================================

const BLOCKS_PER_DAY = 144;
const DEFAULT_BLOCK_REWARD = 3.125;

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6"];

const RELATED_TOOLS = [
  { name: "Bitcoin ROI Calculator", href: "/finance/bitcoin-roi-calculator", desc: "Calculate return on investment for Bitcoin holdings." },
  { name: "Crypto Profit Calculator", href: "/finance/crypto-profit-calculator", desc: "Calculate crypto trading profit and loss with fees." },
  { name: "Staking Rewards Calculator", href: "/finance/staking-rewards-calculator", desc: "Estimate returns from crypto staking and yield farming." },
  { name: "Profit Margin Calculator", href: "/finance/profit-margin-calculator", desc: "Calculate gross and net profit margins on products." },
];

// ===================================================================
// TYPES
// ===================================================================

interface MiningResults {
  hashRate: number;
  power: number;
  electricityCost: number;
  poolFee: number;
  btcPrice: number;
  networkHashRate: number;
  blockReward: number;
  dailyBtc: number;
  dailyRevenue: number;
  dailyElectricityCost: number;
  dailyPoolFee: number;
  dailyProfit: number;
  monthlyProfit: number;
  yearlyProfit: number;
  efficiency: number;
  breakEvenElectricity: number;
  profitPerTh: number;
  isProfitable: boolean;
  hasRevenue: boolean;
  revenueBtc: number;
  costBtc: number;
  feeBtc: number;
  profitBtc: number;
}

// ===================================================================
// CALCULATION ENGINE
// ===================================================================

const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

function calculateMining(
  hashRate: number,
  power: number,
  electricityCost: number,
  poolFee: number,
  btcPrice: number,
  networkHashRate: number,
  blockReward: number,
): MiningResults {
  const hr = clamp(Number.isFinite(hashRate) ? Math.max(0, hashRate) : 0, 0, 1e6);
  const pw = clamp(Number.isFinite(power) ? Math.max(0, power) : 0, 0, 1e6);
  const ec = clamp(Number.isFinite(electricityCost) ? Math.max(0, electricityCost) : 0, 0, 100);
  const pf = clamp(Number.isFinite(poolFee) ? Math.max(0, poolFee) : 0, 0, 100);
  const bp = clamp(Number.isFinite(btcPrice) ? Math.max(0, btcPrice) : 0, 0, 1e9);
  const nhr = clamp(Number.isFinite(networkHashRate) ? Math.max(0.001, networkHashRate) : 0.001, 0.001, 1e6);
  const br = clamp(Number.isFinite(blockReward) ? Math.max(0, blockReward) : 0, 0, 100);

  const networkTh = nhr * 1e6;
  const share = hr / networkTh;
  const dailyBtc = share * BLOCKS_PER_DAY * br;
  const dailyRevenue = dailyBtc * bp;
  const dailyElectricityCost = (pw / 1000) * 24 * ec;
  const dailyPoolFee = dailyRevenue * (pf / 100);
  const dailyProfit = dailyRevenue - dailyElectricityCost - dailyPoolFee;

  const efficiency = hr > 0 ? pw / hr : 0;
  const breakEvenElectricity = pw > 0
    ? (dailyRevenue - dailyPoolFee) / ((pw / 1000) * 24)
    : 0;

  return {
    hashRate: hr,
    power: pw,
    electricityCost: ec,
    poolFee: pf,
    btcPrice: bp,
    networkHashRate: nhr,
    blockReward: br,
    dailyBtc,
    dailyRevenue,
    dailyElectricityCost,
    dailyPoolFee,
    dailyProfit,
    monthlyProfit: dailyProfit * 30,
    yearlyProfit: dailyProfit * 365,
    efficiency,
    breakEvenElectricity: Math.max(0, breakEvenElectricity),
    profitPerTh: hr > 0 ? dailyProfit / hr : 0,
    isProfitable: dailyProfit > 0.005,
    hasRevenue: dailyBtc > 1e-12,
    revenueBtc: dailyBtc,
    costBtc: bp > 0 ? dailyElectricityCost / bp : 0,
    feeBtc: bp > 0 ? dailyPoolFee / bp : 0,
    profitBtc: bp > 0 ? dailyProfit / bp : 0,
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

export default function MiningProfitCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const { value: hashRate, displayValue: hashRateDisplay, setValue: setHashRate, handleChange: handleHashInput, handleFocus: handleHashFocus, handleBlur: handleHashBlur } = useNumericField(110);
  const { value: power, displayValue: powerDisplay, setValue: setPower, handleChange: handlePowerInput, handleFocus: handlePowerFocus, handleBlur: handlePowerBlur } = useNumericField(3250);
  const { value: electricityCost, displayValue: electricityCostDisplay, setValue: setElectricityCost, handleChange: handleElecInput, handleFocus: handleElecFocus, handleBlur: handleElecBlur } = useNumericField(0.08);
  const { value: poolFee, displayValue: poolFeeDisplay, setValue: setPoolFee, handleChange: handlePoolInput, handleFocus: handlePoolFocus, handleBlur: handlePoolBlur } = useNumericField(1);
  const { value: btcPrice, displayValue: btcPriceDisplay, setValue: setBtcPrice, handleChange: handleBtcInput, handleFocus: handleBtcFocus, handleBlur: handleBtcBlur } = useNumericField(65000);
  const { value: networkHashRate, displayValue: networkHashRateDisplay, setValue: setNetworkHashRate, handleChange: handleNetworkInput, handleFocus: handleNetworkFocus, handleBlur: handleNetworkBlur } = useNumericField(600);
  const { value: blockReward, displayValue: blockRewardDisplay, setValue: setBlockReward, handleChange: handleBlockRewardInput, handleFocus: handleBlockRewardFocus, handleBlur: handleBlockRewardBlur } = useNumericField(DEFAULT_BLOCK_REWARD);

  const results = useMemo<MiningResults>(
    () => calculateMining(hashRate, power, electricityCost, poolFee, btcPrice, networkHashRate, blockReward),
    [hashRate, power, electricityCost, poolFee, btcPrice, networkHashRate, blockReward],
  );

  const pieData = useMemo(() => {
    if (!results.hasRevenue) return [];
    const elec = results.dailyElectricityCost;
    const fee = results.dailyPoolFee;
    const profit = Math.max(0, results.dailyProfit);
    const segments: { name: string; value: number }[] = [];
    if (profit > 0.005) segments.push({ name: "Net Profit", value: profit });
    if (fee > 0.005) segments.push({ name: "Pool Fee", value: fee });
    if (elec > 0.005) segments.push({ name: "Electricity", value: elec });
    return segments;
  }, [results.dailyElectricityCost, results.dailyPoolFee, results.dailyProfit, results.hasRevenue]);

  const showPie = pieData.length > 1;

  const hasLoss = results.dailyProfit < -0.005 && results.hasRevenue;

  // --- Handlers ---

  const handleCurrencyChange = useCallback((val: string) => {
    setCurrency(val as CurrencyCode);
  }, []);

  const applyPreset = useCallback((preset: MinerPreset) => {
    setHashRate(preset.hashRate);
    setPower(preset.power);
  }, []);

  return (
    <ToolLayout
      title="Mining Profit Calculator"
      description="Estimate your crypto mining profitability - calculate daily profit, electricity costs, pool fees, and ROI for Bitcoin mining rigs with real-time charts and 29-currency support."
      category="finance"
      faqContent={[
        {
          question: "How is mining profit calculated?",
          answer: "Mining profit is calculated as: Daily Profit = Daily Revenue - Electricity Cost - Pool Fees. Daily Revenue = (Your Hash Rate ÷ Network Hash Rate) × 144 blocks/day × Block Reward × BTC Price. This gives you your net profit after all operational costs, updated in real time as you adjust parameters.",
        },
        {
          question: "What is the current Bitcoin block reward?",
          answer: "The current Bitcoin block reward is 3.125 BTC (post-April 2024 halving). This reward halves approximately every 4 years (210,000 blocks). The next halving is expected around 2028, reducing the reward to 1.5625 BTC. This calculator defaults to 3.125 but lets you adjust the value for historical or future projections.",
        },
        {
          question: "How do I find my miner's hash rate and power consumption?",
          answer: "Your miner's hash rate (TH/s) and power consumption (Watts) are typically listed on the manufacturer's spec sheet or your miner's dashboard. Common miners: Antminer S19 Pro (110 TH/s, 3250W), S21 (200 TH/s, 3500W), Whatsminer M50S (126 TH/s, 3276W). Use the preset buttons for instant configuration.",
        },
        {
          question: "What is the current Bitcoin network hash rate?",
          answer: "The Bitcoin network hash rate fluctuates based on mining difficulty and active miners. As of 2025, it ranges between 500-700 EH/s. You can find the current value on sites like Blockchain.com or Mempool.space. A higher network hash rate means more competition and lower earnings per TH/s.",
        },
        {
          question: "How does electricity cost affect mining profitability?",
          answer: "Electricity is typically the largest operational expense for mining. At $0.08/kWh, electricity can consume 40-60% of your mining revenue. At $0.15/kWh, most older miners become unprofitable. This calculator computes your break-even electricity rate - the maximum you can pay per kWh to still make a profit.",
        },
        {
          question: "What is an average pool fee for Bitcoin mining?",
          answer: "Most mining pools charge between 0% and 4% in fees. Common pools like F2Pool, Antpool, and ViaBTC charge 1-2.5%. Some pools offer 0% fee promotions for new miners. Pay-per-Share (PPS) pools typically charge higher fees (2-4%) but offer more predictable payouts than FPPS or PPLNS pools.",
        },
        {
          question: "What is a good efficiency rating for a Bitcoin miner?",
          answer: "Miner efficiency is measured in J/TH (Joules per TeraHash). New-generation miners achieve 25-30 J/TH (S21: 17.5 J/TH, M66S: 14.4 J/TH). Older miners like the S19 Pro are around 29.5 J/TH. Lower J/TH means more hashrate per watt, directly improving profitability, especially in high-electricity-cost regions.",
        },
        {
          question: "How often does mining difficulty adjust?",
          answer: "Bitcoin mining difficulty adjusts every 2,016 blocks (approximately every 2 weeks) to maintain a 10-minute average block time. When more miners join the network, difficulty increases, reducing everyone's earnings per TH/s. This calculator uses network hash rate as a proxy for current difficulty conditions.",
        },
        {
          question: "What is the break-even electricity cost for mining?",
          answer: "The break-even electricity cost is the maximum price per kWh you can pay and still break even on mining. It is calculated as: Break-Even = (Daily Revenue - Pool Fee) ÷ (Power × 24 ÷ 1000). If your actual electricity cost is below this number, your mining operation is profitable. If above, you are mining at a loss.",
        },
        {
          question: "How do I calculate mining ROI for a hardware purchase?",
          answer: "To calculate mining ROI, divide your hardware cost by your daily net profit. For example, a $2,000 miner earning $10/day profit has a 200-day payback period. Use this calculator to estimate daily profit, then factor in hardware costs, shipping, customs, cooling, and maintenance for a complete ROI analysis.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a Mining Profit Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A Mining Profit Calculator helps cryptocurrency miners estimate the profitability of their mining operation.
              By entering your <strong>hash rate</strong>, <strong>power consumption</strong>, <strong>electricity cost</strong>,
              <strong> pool fee</strong>, <strong>BTC price</strong>, and <strong>network hash rate</strong>, you get an instant
              breakdown of daily, monthly, and yearly profits. This tool supports 29+ currencies for global miners.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p>Network TH/s = Network EH/s × 1,000,000</p>
              <p>Your Share = Hash Rate ÷ Network TH/s</p>
              <p>Daily BTC = Your Share × 144 blocks × Block Reward</p>
              <p>Daily Revenue = Daily BTC × BTC Price</p>
              <p>Daily Electricity = (Power ÷ 1000) × 24 hrs × Cost/kWh</p>
              <p>Daily Pool Fee = Daily Revenue × (Pool Fee % ÷ 100)</p>
              <p><strong>Daily Profit = Revenue - Electricity - Pool Fee</strong></p>
              <p>Monthly Profit = Daily Profit × 30</p>
              <p>Yearly Profit = Daily Profit × 365</p>
              <p>Efficiency (J/TH) = Power ÷ Hash Rate</p>
              <p>Break-Even Rate = (Revenue - Fee) ÷ ((Power ÷ 1000) × 24)</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Benefits of Using This Calculator</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              <li><strong>Instant Profitability:</strong> See your daily, monthly, and yearly mining profit in real time.</li>
              <li><strong>Hardware Presets:</strong> Quick-select buttons for popular ASIC miners (S19, S21, M50S, etc.).</li>
              <li><strong>Cost Breakdown:</strong> Visualize how electricity and pool fees eat into your mining revenue.</li>
              <li><strong>Break-Even Analysis:</strong> Know exactly the maximum electricity rate you can afford.</li>
              <li><strong>Global Currencies:</strong> Supports 29+ currencies with proper locale-aware formatting.</li>
              <li><strong>Efficiency Metric:</strong> J/TH rating helps you compare different miners at a glance.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Scenario: Antminer S19 Pro (110 TH/s, 3250W) with $0.08/kWh electricity, 1% pool fee, BTC at $65,000, network at 600 EH/s.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your Share = 110 ÷ (600 × 1,000,000) = <strong>0.0000001833</strong></li>
                <li>Daily BTC = 0.0000001833 × 144 × 3.125 = <strong>0.0000825 BTC</strong></li>
                <li>Daily Revenue = 0.0000825 × $65,000 = <strong>$5.36</strong></li>
                <li>Daily Electricity = (3250 ÷ 1000) × 24 × $0.08 = <strong>$6.24</strong></li>
                <li>Daily Pool Fee = $5.36 × 1% = <strong>$0.05</strong></li>
                <li><strong>Daily Profit = $5.36 - $6.24 - $0.05 = -$0.93 (loss)</strong></li>
                <li>Efficiency = 3250W ÷ 110 TH/s = <strong>29.5 J/TH</strong></li>
                <li>Break-Even Electricity = ($5.36 - $0.05) ÷ ((3250 ÷ 1000) × 24) = <strong>$0.068/kWh</strong></li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Common Mistakes to Avoid</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed text-muted-foreground">
              <li>Forgetting to account for all electricity costs - include cooling, PSU efficiency losses, and facility fees.</li>
              <li>Using peak network hash rate instead of current - difficulty adjusts based on the average, not the peak.</li>
              <li>Ignoring pool fee variance - PPS pools charge higher fees but offer stable payouts; FPPS pools vary more.</li>
              <li>Not considering hardware maintenance - fans, PSUs, and controllers fail and need replacement over time.</li>
              <li>Assuming BTC price stays constant - mining profitability is highly sensitive to Bitcoin price fluctuations.</li>
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
            <label htmlFor="mine-currency" className="flex items-center gap-1.5 text-sm font-medium mb-1">
              <Banknote className="w-4 h-4 text-primary" />
              Currency
            </label>
            <select
              id="mine-currency"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} - {c.label} ({c.symbol})</option>
              ))}
            </select>
          </div>

          {/* Hardware Presets */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-medium">
              <Cpu className="w-4 h-4 text-primary" />
              <span>Miner Presets</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MINER_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-full border transition-colors",
                    hashRate === preset.hashRate && power === preset.power
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary",
                  )}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Hash Rate */}
          <div className="space-y-2">
            <label htmlFor="mine-hash" className="flex items-center gap-1.5 text-sm font-medium">
              <Zap className="w-4 h-4 text-primary" />
              <span>Hash Rate</span>
              <span className="ml-auto text-lg font-bold text-primary">{hashRate.toFixed(hashRate < 1 ? 2 : 0)} TH/s</span>
            </label>
            <input
              id="mine-hash"
              type="range"
              min={0}
              max={500}
              step={1}
              value={Math.min(hashRate, 500)}
              onChange={(e) => setHashRate(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={500}
              aria-valuenow={hashRate}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0 TH/s</span>
              <span>500 TH/s</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={hashRateDisplay}
              onChange={(e) => handleHashInput(e.target.value)}
              onFocus={handleHashFocus}
              onBlur={handleHashBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter hash rate in TH/s"
            />
          </div>

          {/* Power Consumption */}
          <div className="space-y-2">
            <label htmlFor="mine-power" className="flex items-center gap-1.5 text-sm font-medium">
              <Zap className="w-4 h-4 text-primary" />
              <span>Power Consumption</span>
              <span className="ml-auto text-lg font-bold text-primary">{power.toFixed(0)} W</span>
            </label>
            <input
              id="mine-power"
              type="range"
              min={0}
              max={10000}
              step={10}
              value={Math.min(power, 10000)}
              onChange={(e) => setPower(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={10000}
              aria-valuenow={power}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0 W</span>
              <span>10,000 W</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={powerDisplay}
              onChange={(e) => handlePowerInput(e.target.value)}
              onFocus={handlePowerFocus}
              onBlur={handlePowerBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter power consumption in watts"
            />
          </div>

          {/* Electricity Cost */}
          <div className="space-y-2">
            <label htmlFor="mine-elec" className="flex items-center gap-1.5 text-sm font-medium">
              <BadgePercent className="w-4 h-4 text-primary" />
              <span>Electricity Cost</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(electricityCost, currency)}/kWh</span>
            </label>
            <input
              id="mine-elec"
              type="range"
              min={0}
              max={0.5}
              step={0.005}
              value={Math.min(electricityCost, 0.5)}
              onChange={(e) => setElectricityCost(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={0.5}
              aria-valuenow={electricityCost}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCurrency(0.25, currency)}</span>
              <span>{formatCurrency(0.5, currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={electricityCostDisplay}
              onChange={(e) => handleElecInput(e.target.value)}
              onFocus={handleElecFocus}
              onBlur={handleElecBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter cost per kWh"
            />
          </div>

          {/* Pool Fee */}
          <div className="space-y-2">
            <label htmlFor="mine-pool" className="flex items-center gap-1.5 text-sm font-medium">
              <BadgePercent className="w-4 h-4 text-primary" />
              <span>Pool Fee</span>
              <span className="ml-auto text-lg font-bold text-primary">{poolFee.toFixed(1)}%</span>
            </label>
            <input
              id="mine-pool"
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={Math.min(poolFee, 5)}
              onChange={(e) => setPoolFee(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={5}
              aria-valuenow={poolFee}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0%</span>
              <span>2.5%</span>
              <span>5%</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={poolFeeDisplay}
              onChange={(e) => handlePoolInput(e.target.value)}
              onFocus={handlePoolFocus}
              onBlur={handlePoolBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter pool fee %"
            />
          </div>

          {/* BTC Price */}
          <div className="space-y-2">
            <label htmlFor="mine-btc" className="flex items-center gap-1.5 text-sm font-medium">
              <Coins className="w-4 h-4 text-primary" />
              <span>BTC Price</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(btcPrice, currency)}</span>
            </label>
            <input
              id="mine-btc"
              type="range"
              min={0}
              max={getMaxAmount(currency)}
              step={getSliderStep(currency)}
              value={Math.min(btcPrice, getMaxAmount(currency))}
              onChange={(e) => setBtcPrice(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={getMaxAmount(currency)}
              aria-valuenow={btcPrice}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCompact(getMaxAmount(currency), currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={btcPriceDisplay}
              onChange={(e) => handleBtcInput(e.target.value)}
              onFocus={handleBtcFocus}
              onBlur={handleBtcBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter BTC price"
            />
          </div>

          {/* Network Hash Rate */}
          <div className="space-y-2">
            <label htmlFor="mine-network" className="flex items-center gap-1.5 text-sm font-medium">
              <Zap className="w-4 h-4 text-primary" />
              <span>Network Hash Rate</span>
              <span className="ml-auto text-lg font-bold text-primary">{networkHashRate.toFixed(0)} EH/s</span>
            </label>
            <input
              id="mine-network"
              type="range"
              min={100}
              max={1000}
              step={1}
              value={Math.min(networkHashRate, 1000)}
              onChange={(e) => setNetworkHashRate(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={100}
              aria-valuemax={1000}
              aria-valuenow={networkHashRate}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>100 EH/s</span>
              <span>500 EH/s</span>
              <span>1,000 EH/s</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={networkHashRateDisplay}
              onChange={(e) => handleNetworkInput(e.target.value)}
              onFocus={handleNetworkFocus}
              onBlur={handleNetworkBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter network hash rate in EH/s"
            />
          </div>

          {/* Block Reward */}
          <div className="space-y-2">
            <label htmlFor="mine-reward" className="flex items-center gap-1.5 text-sm font-medium">
              <Coins className="w-4 h-4 text-primary" />
              <span>Block Reward</span>
              <span className="ml-auto text-lg font-bold text-primary">{blockReward.toFixed(3)} BTC</span>
            </label>
            <div className="flex gap-2">
              {[6.25, 3.125, 1.5625].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setBlockReward(r)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-full border transition-colors",
                    Math.abs(blockReward - r) < 0.001
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary",
                  )}
                >
                  {r} BTC
                </button>
              ))}
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={blockRewardDisplay}
              onChange={(e) => handleBlockRewardInput(e.target.value)}
              onFocus={handleBlockRewardFocus}
              onBlur={handleBlockRewardBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter block reward"
            />
          </div>

          {/* Pie Chart */}
          {showPie && (
            <div className="bg-white border border-border rounded-xl p-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Daily Revenue Breakdown
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
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<PieTooltip currency={currency} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 text-xs ml-2">
                  {pieData.map((d, idx) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground">
                        {d.name} ({((d.value / pieData.reduce((s, p) => s + p.value, 0)) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Daily Revenue</p>
                  <p className="text-sm font-semibold">{formatCurrency(results.dailyRevenue, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Net Profit</p>
                  <p className={cn("text-sm font-semibold", hasLoss ? "text-red-500" : "text-emerald-500")}>
                    {hasLoss ? "-" : "+"}{formatCurrency(Math.abs(results.dailyProfit), currency)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Profit/TH</p>
                  <p className="text-sm font-semibold">{formatCurrency(results.profitPerTh, currency)}</p>
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
              hasLoss
                ? "bg-gradient-to-br from-red-50 to-red-100/50 border-red-200"
                : results.isProfitable
                  ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200"
                  : "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20",
            )}
          >
            <div className="flex items-center gap-2 mb-3">
              {hasLoss ? (
                <TrendingDown className="w-5 h-5 text-red-500" />
              ) : results.isProfitable ? (
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              ) : (
                <Calculator className="w-5 h-5 text-primary" />
              )}
              <p className="text-sm text-muted-foreground font-medium">
                {hasLoss ? "Daily Net Loss" : results.isProfitable ? "Daily Net Profit" : "Break-Even"}
              </p>
            </div>
            <p
              className={cn(
                "text-4xl font-extrabold break-words",
                hasLoss ? "text-red-500" : results.isProfitable ? "text-emerald-500" : "text-primary",
              )}
            >
              {hasLoss && "-"}{formatCurrency(Math.abs(results.dailyProfit), currency)}
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              {hasLoss ? (
                <span className="text-red-600 font-medium">
                  {results.dailyBtc.toFixed(8)} BTC/day · {results.profitBtc.toFixed(8)} BTC net
                </span>
              ) : results.isProfitable ? (
                <>
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">
                    {results.dailyBtc.toFixed(8)} BTC/day
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">{results.dailyBtc.toFixed(8)} BTC/day</span>
              )}
            </div>
          </div>

          {/* Mini Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Wallet className="w-3 h-3 text-blue-500" />
                Revenue
              </p>
              <p className="text-lg font-bold text-blue-500 break-words">
                {formatCurrency(results.dailyRevenue, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                Electricity
              </p>
              <p className="text-lg font-bold text-amber-500 break-words">
                {formatCurrency(results.dailyElectricityCost, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <BadgePercent className="w-3 h-3 text-primary" />
                Pool Fee
              </p>
              <p className="text-lg font-bold text-primary break-words">
                {formatCurrency(results.dailyPoolFee, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-purple-500" />
                Efficiency
              </p>
              <p className={cn("text-lg font-bold break-words", results.efficiency > 0 && results.efficiency < 30 ? "text-emerald-500" : "text-muted-foreground")}>
                {results.efficiency.toFixed(1)} J/TH
              </p>
            </div>
          </div>

          {/* Monthly + Yearly */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-500" />
                Monthly Profit (30d)
              </p>
              <p className={cn("text-lg font-bold break-words", hasLoss ? "text-red-500" : "text-emerald-500")}>
                {hasLoss && "-"}{formatCurrency(Math.abs(results.monthlyProfit), currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-500" />
                Yearly Profit (365d)
              </p>
              <p className={cn("text-lg font-bold break-words", hasLoss ? "text-red-500" : "text-emerald-500")}>
                {hasLoss && "-"}{formatCurrency(Math.abs(results.yearlyProfit), currency)}
              </p>
            </div>
          </div>

          {/* Summary Breakdown */}
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Mining Breakdown
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Hash Rate</span>
                <span className="font-medium">{results.hashRate.toFixed(0)} TH/s</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Power Consumption</span>
                <span className="font-medium">{results.power.toFixed(0)} W</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Daily BTC Earned</span>
                <span className="font-medium">{results.dailyBtc.toFixed(8)} BTC</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Daily Revenue</span>
                <span className="font-medium">{formatCurrency(results.dailyRevenue, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Electricity Cost</span>
                <span className="font-medium text-amber-500">-{formatCurrency(results.dailyElectricityCost, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Pool Fee ({results.poolFee.toFixed(1)}%)</span>
                <span className="font-medium text-primary">-{formatCurrency(results.dailyPoolFee, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Efficiency</span>
                <span className="font-medium">{results.efficiency.toFixed(1)} J/TH</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-medium">Daily Profit</span>
                <span className={cn("font-bold", hasLoss ? "text-red-500" : results.isProfitable ? "text-emerald-500" : "text-primary")}>
                  {hasLoss ? "-" : "+"}{formatCurrency(Math.abs(results.dailyProfit), currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Break-Even Card */}
          {results.dailyRevenue > 0.005 && (
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                <Calculator className="w-3 h-3" />
                Break-Even Analysis
              </p>
              <div className="grid grid-cols-1 gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Break-Even Electricity Rate</p>
                  <p className={cn(
                    "text-xl font-bold",
                    results.electricityCost <= results.breakEvenElectricity ? "text-emerald-500" : "text-red-500",
                  )}>
                    {formatCurrency(results.breakEvenElectricity, currency)}/kWh
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {results.electricityCost <= results.breakEvenElectricity
                      ? `Your rate (${formatCurrency(results.electricityCost, currency)}/kWh) is below break-even`
                      : `Your rate (${formatCurrency(results.electricityCost, currency)}/kWh) exceeds break-even by ${formatCurrency(results.electricityCost - results.breakEvenElectricity, currency)}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Profit per TH/s Card */}
          {results.hashRate > 0 && (
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Performance Metrics
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Profit per TH/s</p>
                  <p className={cn("text-lg font-bold", hasLoss ? "text-red-500" : "text-emerald-500")}>
                    {formatCurrency(results.profitPerTh, currency)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Revenue per TH/s</p>
                  <p className="text-lg font-bold text-blue-500">
                    {formatCurrency(results.dailyRevenue / results.hashRate, currency)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </ToolLayout>
  );
}
