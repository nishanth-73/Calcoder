"use client";

import { useCallback, useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { ArrowUpRight, BadgePercent, Banknote, Calculator, Clock, Coins, FileText, TrendingUp, Wallet } from "lucide-react";
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

type CompoundFrequency = "none" | "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

const COMPOUND_OPTIONS: { value: CompoundFrequency; label: string; periods: number }[] = [
  { value: "none", label: "None (Simple)", periods: 0 },
  { value: "daily", label: "Daily (365)", periods: 365 },
  { value: "weekly", label: "Weekly (52)", periods: 52 },
  { value: "monthly", label: "Monthly (12)", periods: 12 },
  { value: "quarterly", label: "Quarterly (4)", periods: 4 },
  { value: "yearly", label: "Yearly (1)", periods: 1 },
];

const PIE_COLORS = ["#10b981", "#3b82f6"];

const RELATED_TOOLS = [
  { name: "Crypto Profit Calculator", href: "/finance/crypto-profit-calculator", desc: "Calculate crypto trading profit and loss with fees." },
  { name: "Bitcoin ROI Calculator", href: "/finance/bitcoin-roi-calculator", desc: "Calculate return on investment for Bitcoin holdings." },
  { name: "Mining Profit Calculator", href: "/finance/mining-profit-calculator", desc: "Estimate crypto mining profitability." },
  { name: "Compound Interest Calculator", href: "/finance/compound-interest", desc: "Calculate compound interest growth for any investment." },
];

// ===================================================================
// TYPES
// ===================================================================

interface StakingResults {
  stake: number;
  apr: number;
  months: number;
  frequency: CompoundFrequency;
  tokenPrice: number;
  feePercent: number;
  totalRewardsTokens: number;
  totalRewardsFiat: number;
  finalBalanceTokens: number;
  finalValueFiat: number;
  effectiveApy: number;
  monthlyReward: number;
  dailyReward: number;
  feeTokens: number;
  feeFiat: number;
  grossRewardsTokens: number;
  hasRewards: boolean;
}

// ===================================================================
// CALCULATION ENGINE
// ===================================================================

const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

function calculateStaking(
  stake: number,
  apr: number,
  months: number,
  frequency: CompoundFrequency,
  tokenPrice: number,
  feePercent: number,
): StakingResults {
  const s = clamp(Number.isFinite(stake) ? Math.max(0, stake) : 0, 0, 1e9);
  const ap = clamp(Number.isFinite(apr) ? Math.max(0, apr) : 0, 0, 100000);
  const m = clamp(Number.isFinite(months) ? Math.max(0, months) : 0, 0, 1200);
  const tp = clamp(Number.isFinite(tokenPrice) ? Math.max(0, tokenPrice) : 0, 0, 1e9);
  const fp = clamp(Number.isFinite(feePercent) ? Math.max(0, feePercent) : 0, 0, 100);

  const years = m / 12;
  const rate = ap / 100;
  const opt = COMPOUND_OPTIONS.find((o) => o.value === frequency) ?? COMPOUND_OPTIONS[0];

  let grossRewardsTokens: number;
  if (opt.periods === 0 || years === 0) {
    grossRewardsTokens = s * rate * years;
  } else {
    grossRewardsTokens = s * (1 + rate / opt.periods) ** (opt.periods * years) - s;
  }

  const feeTokens = grossRewardsTokens * (fp / 100);
  const totalRewardsTokens = grossRewardsTokens - feeTokens;
  const finalBalanceTokens = s + totalRewardsTokens;
  const totalRewardsFiat = totalRewardsTokens * tp;
  const finalValueFiat = finalBalanceTokens * tp;
  const monthlyReward = m > 0 ? totalRewardsTokens / m : 0;
  const dailyReward = m > 0 ? totalRewardsTokens / (m * 30.4375) : 0;

  let effectiveApy: number;
  if (s > 0 && years > 0) {
    effectiveApy = ((finalBalanceTokens / s) ** (1 / years) - 1) * 100;
  } else {
    effectiveApy = ap;
  }

  return {
    stake: s,
    apr: ap,
    months: m,
    frequency,
    tokenPrice: tp,
    feePercent: fp,
    totalRewardsTokens,
    totalRewardsFiat,
    finalBalanceTokens,
    finalValueFiat,
    effectiveApy: Number.isFinite(effectiveApy) ? effectiveApy : ap,
    monthlyReward,
    dailyReward,
    feeTokens,
    feeFiat: feeTokens * tp,
    grossRewardsTokens,
    hasRewards: totalRewardsTokens > 1e-12 && s > 0 && m > 0,
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
      <p className="text-muted-foreground">{d.name === "Stake" ? d.value.toLocaleString() : `${d.value.toLocaleString()} tokens`}</p>
    </div>
  );
}

// ===================================================================
// MAIN COMPONENT
// ===================================================================

export default function StakingRewardsCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const { value: stake, displayValue: stakeDisplay, setValue: setStake, handleChange: handleStakeInput, handleFocus: handleStakeFocus, handleBlur: handleStakeBlur } = useNumericField(10000);
  const { value: apr, displayValue: aprDisplay, setValue: setApr, handleChange: handleAprInput, handleFocus: handleAprFocus, handleBlur: handleAprBlur } = useNumericField(8);
  const { value: months, displayValue: monthsDisplay, setValue: setMonths, handleChange: handleMonthsInput, handleFocus: handleMonthsFocus, handleBlur: handleMonthsBlur } = useNumericField(12);
  const [frequency, setFrequency] = useState<CompoundFrequency>("monthly");
  const { value: tokenPrice, displayValue: tokenPriceDisplay, setValue: setTokenPrice, handleChange: handleTokenInput, handleFocus: handleTokenFocus, handleBlur: handleTokenBlur } = useNumericField(1);
  const { value: feePercent, displayValue: feePercentDisplay, setValue: setFeePercent, handleChange: handleFeeInput, handleFocus: handleFeeFocus, handleBlur: handleFeeBlur } = useNumericField(0);

  const results = useMemo<StakingResults>(
    () => calculateStaking(stake, apr, months, frequency, tokenPrice, feePercent),
    [stake, apr, months, frequency, tokenPrice, feePercent],
  );

  const pieData = useMemo(() => {
    if (!results.hasRewards) return [];
    return [
      { name: "Stake", value: results.stake },
      { name: "Rewards", value: results.totalRewardsTokens },
    ];
  }, [results.stake, results.totalRewardsTokens, results.hasRewards]);

  const showPie = results.hasRewards;

  // --- Handlers ---

  const handleCurrencyChange = useCallback((val: string) => {
    setCurrency(val as CurrencyCode);
  }, []);



  return (
    <ToolLayout
      title="Staking Rewards Calculator"
      description="Calculate your crypto staking rewards - estimate APY, compound interest, and monthly earnings for staked tokens with real-time charts and 29-currency support."
      category="finance"
      faqContent={[
        {
          question: "How are staking rewards calculated?",
          answer: "Staking rewards are calculated using compound interest: Final Balance = Stake × (1 + APR/100 ÷ n)^(n × years), where n is the compounding frequency (daily, weekly, monthly, quarterly, yearly). For simple staking (no compounding), rewards = Stake × APR/100 × years. Rewards are automatically adjusted for any protocol fees.",
        },
        {
          question: "What is the difference between APR and APY in staking?",
          answer: "APR (Annual Percentage Rate) is the base annual interest rate before compounding. APY (Annual Percentage Yield) includes the effect of compounding. For example, 10% APR compounded daily yields an APY of approximately 10.52%. The more frequent the compounding, the higher the APY. This calculator shows both your APR input and the effective APY based on your chosen frequency.",
        },
        {
          question: "What is a good staking APY?",
          answer: "Staking APY varies widely by protocol: major Proof-of-Stake blockchains like Ethereum (3-5%), Solana (6-8%), Cardano (3-5%), and Polkadot (12-16%). DeFi protocols can offer 5-30%+. Higher APYs (50%+) typically indicate higher risk, inflation-based rewards, or shorter duration incentives. Always research the protocol's tokenomics and lockup terms before staking.",
        },
        {
          question: "How does compounding frequency affect staking returns?",
          answer: "More frequent compounding increases your effective APY. For a 12% APR: annual compounding = 12% APY, quarterly = 12.55%, monthly = 12.68%, weekly = 12.73%, daily = 12.75%. The difference between daily and monthly compounding is small at typical APYs but becomes significant at higher rates (50%+ APR). Most major protocols auto-compound rewards.",
        },
        {
          question: "What is a staking protocol fee?",
          answer: "Many staking protocols charge a fee on rewards before distributing them to stakers. For example, Ethereum validators typically charge 5-15% commission. A 10% fee means if your gross rewards are 100 tokens, you receive 90 tokens and the protocol keeps 10. This calculator deducts the fee from gross rewards to show your actual net earnings.",
        },
        {
          question: "Can I lose money by staking?",
          answer: "Yes, staking carries risks: (1) Slashing - validators can lose funds for misbehavior on some networks. (2) Impermanent loss in DeFi liquidity pools. (3) Token price depreciation - even with high APY, if the token price drops 50%, you still lose fiat value. (4) Lockup risk - some protocols lock your stake for a period during which you cannot sell during a market downturn.",
        },
        {
          question: "How do I calculate staking rewards for Ethereum?",
          answer: "Ethereum staking rewards depend on the total amount of ETH staked. Current APY ranges from 3-5%. For solo staking (32 ETH), you run your own validator and earn the full rewards minus hardware costs. For liquid staking (Lido, Rocket Pool), you receive a stETH or rETH token that accrues value. Use the APR field for the base rate and the fee field for the protocol commission.",
        },
        {
          question: "What is the best compounding frequency for staking?",
          answer: "Daily compounding gives the highest theoretical return, but the marginal benefit over weekly or monthly is minimal at typical APYs. For example, at 10% APR: daily = 10.52% APY, weekly = 10.51%, monthly = 10.47%. Choose the frequency that matches how often your protocol distributes rewards. Most auto-compounding protocols use daily or epoch-based compounding.",
        },
        {
          question: "How are staking rewards taxed?",
          answer: "Staking rewards are generally taxed as income at the time of receipt (at their fair market value) in most jurisdictions. In the US, the IRS treats staking rewards as ordinary income. When sold, any change in value from the reward date is taxed as capital gains. Some countries (like Germany) may treat rewards as tax-free if held for over one year.",
        },
        {
          question: "What is liquid staking vs traditional staking?",
          answer: "Traditional staking locks your tokens in a protocol, making them illiquid until unstaked (which may have a waiting period). Liquid staking (e.g., Lido stETH, Rocket Pool rETH) gives you a derivative token that represents your staked position, which you can trade or use in DeFi while still earning rewards. This calculator models traditional staking with optional lockup periods.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a Staking Rewards Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A Staking Rewards Calculator helps cryptocurrency holders estimate the returns from staking their tokens.
              By entering your <strong>stake amount</strong>, <strong>APR</strong>, <strong>duration</strong>,
              <strong> compounding frequency</strong>, <strong>token price</strong>, and <strong>protocol fee</strong>,
              you get an instant breakdown of your expected rewards in both tokens and fiat value.
              This tool supports 29+ currencies for global users.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p>Years = Months ÷ 12</p>
              <p>Simple Rewards = Stake × (APR ÷ 100) × Years</p>
              <p><strong>Compound Rewards = Stake × (1 + APR/100 ÷ n)^(n × Years) - Stake</strong></p>
              <p>Protocol Fee = Gross Rewards × (Fee % ÷ 100)</p>
              <p>Net Rewards = Gross Rewards - Protocol Fee</p>
              <p>Final Balance = Stake + Net Rewards</p>
              <p>Effective APY = ((Final ÷ Stake)^(1 ÷ Years) - 1) × 100</p>
              <p>Monthly Reward = Net Rewards ÷ Months</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Benefits of Using This Calculator</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              <li><strong>Compound vs Simple:</strong> Compare different compounding frequencies to maximize your returns.</li>
              <li><strong>Fee-Aware:</strong> Account for protocol commission fees that reduce your net staking rewards.</li>
              <li><strong>Fiat Value:</strong> See your staking rewards in your chosen currency at current token prices.</li>
              <li><strong>Effective APY:</strong> Understand the true annual yield accounting for compounding frequency.</li>
              <li><strong>Global Currencies:</strong> Supports 29+ currencies with proper locale-aware formatting.</li>
              <li><strong>Visual Chart:</strong> Pie chart breakdown of your stake vs earned rewards.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Scenario: You stake 10,000 tokens at 12% APR for 24 months with monthly compounding and 5% protocol fee. Token price = $1.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Years = 24 ÷ 12 = <strong>2 years</strong></li>
                <li>Gross Rewards = 10,000 × (1 + 0.12/12)^(12×2) - 10,000 = <strong>2,697.35 tokens</strong></li>
                <li>Protocol Fee = 2,697.35 × 5% = <strong>134.87 tokens</strong></li>
                <li>Net Rewards = 2,697.35 - 134.87 = <strong>2,562.48 tokens</strong></li>
                <li>Final Balance = 10,000 + 2,562.48 = <strong>12,562.48 tokens</strong></li>
                <li>Effective APY = ((12,562.48 ÷ 10,000)^(1÷2) - 1) × 100 = <strong>12.08%</strong></li>
                <li>Monthly Reward = 2,562.48 ÷ 24 = <strong>106.77 tokens/month</strong></li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Common Mistakes to Avoid</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed text-muted-foreground">
              <li>Confusing APR with APY - APR is the base rate; APY includes compounding effects and is always higher.</li>
              <li>Ignoring protocol fees - even 5-10% fees significantly reduce long-term compounding returns.</li>
              <li>Not accounting for token price volatility - high APY means nothing if the token loses 80% of its value.</li>
              <li>Forgetting about lockup periods - some protocols lock your stake for weeks, preventing exit during crashes.</li>
              <li>Assuming APY stays constant - staking rates change based on total value staked, protocol adoption, and market conditions.</li>
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
            <label htmlFor="stake-currency" className="flex items-center gap-1.5 text-sm font-medium mb-1">
              <Banknote className="w-4 h-4 text-primary" />
              Currency (for fiat values)
            </label>
            <select
              id="stake-currency"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} - {c.label} ({c.symbol})</option>
              ))}
            </select>
          </div>

          {/* Stake Amount */}
          <div className="space-y-2">
            <label htmlFor="stake-amount" className="flex items-center gap-1.5 text-sm font-medium">
              <Coins className="w-4 h-4 text-primary" />
              <span>Stake Amount (tokens)</span>
              <span className="ml-auto text-lg font-bold text-primary">{stake.toLocaleString()} tokens</span>
            </label>
            <input
              id="stake-amount"
              type="range"
              min={0}
              max={getMaxAmount(currency)}
              step={getSliderStep(currency)}
              value={Math.min(stake, getMaxAmount(currency))}
              onChange={(e) => setStake(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={getMaxAmount(currency)}
              aria-valuenow={stake}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span>{formatCompact(getMaxAmount(currency), currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={stakeDisplay}
              onChange={(e) => handleStakeInput(e.target.value)}
              onFocus={handleStakeFocus}
              onBlur={handleStakeBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter stake amount"
            />
          </div>

          {/* APR */}
          <div className="space-y-2">
            <label htmlFor="stake-apr" className="flex items-center gap-1.5 text-sm font-medium">
              <BadgePercent className="w-4 h-4 text-primary" />
              <span>APR</span>
              <span className="ml-auto text-lg font-bold text-primary">{apr.toFixed(2)}%</span>
            </label>
            <input
              id="stake-apr"
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={Math.min(apr, 100)}
              onChange={(e) => setApr(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={apr}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={aprDisplay}
              onChange={(e) => handleAprInput(e.target.value)}
              onFocus={handleAprFocus}
              onBlur={handleAprBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter APR %"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label htmlFor="stake-duration" className="flex items-center gap-1.5 text-sm font-medium">
              <Clock className="w-4 h-4 text-primary" />
              <span>Staking Duration</span>
              <span className="ml-auto text-lg font-bold text-primary">
                {months >= 12 ? `${(months / 12).toFixed(1)} yrs` : `${months} mos`}
              </span>
            </label>
            <input
              id="stake-duration"
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

          {/* Compounding Frequency */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-medium">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Compounding Frequency</span>
              <span className="ml-auto text-lg font-bold text-primary">{COMPOUND_OPTIONS.find((o) => o.value === frequency)?.label}</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMPOUND_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFrequency(opt.value)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-full border transition-colors",
                    frequency === opt.value
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Token Price */}
          <div className="space-y-2">
            <label htmlFor="stake-price" className="flex items-center gap-1.5 text-sm font-medium">
              <Wallet className="w-4 h-4 text-primary" />
              <span>Token Price</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(tokenPrice, currency)}</span>
            </label>
            <input
              id="stake-price"
              type="range"
              min={0}
              max={10000}
              step={0.01}
              value={Math.min(tokenPrice, 10000)}
              onChange={(e) => setTokenPrice(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={10000}
              aria-valuenow={tokenPrice}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCurrency(5000, currency)}</span>
              <span>{formatCurrency(10000, currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={tokenPriceDisplay}
              onChange={(e) => handleTokenInput(e.target.value)}
              onFocus={handleTokenFocus}
              onBlur={handleTokenBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter token price"
            />
          </div>

          {/* Protocol Fee */}
          <div className="space-y-2">
            <label htmlFor="stake-fee" className="flex items-center gap-1.5 text-sm font-medium">
              <BadgePercent className="w-4 h-4 text-primary" />
              <span>Protocol Fee</span>
              <span className="ml-auto text-lg font-bold text-primary">{feePercent.toFixed(1)}%</span>
            </label>
            <input
              id="stake-fee"
              type="range"
              min={0}
              max={50}
              step={0.5}
              value={Math.min(feePercent, 50)}
              onChange={(e) => setFeePercent(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={50}
              aria-valuenow={feePercent}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
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
                Stake vs Rewards
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
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<PieTooltip currency={currency} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 text-xs ml-2">
                  {pieData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Staked Amount</p>
                  <p className="text-sm font-semibold">{results.stake.toLocaleString()} tokens</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Rewards</p>
                  <p className="text-sm font-semibold text-emerald-500">{results.totalRewardsTokens.toLocaleString(undefined, { maximumFractionDigits: 4 })} tokens</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">APY</p>
                  <p className="text-sm font-semibold text-emerald-500">{results.effectiveApy.toFixed(2)}%</p>
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
              results.hasRewards
                ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200"
                : "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20",
            )}
          >
            <div className="flex items-center gap-2 mb-3">
              {results.hasRewards ? (
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              ) : (
                <Calculator className="w-5 h-5 text-primary" />
              )}
              <p className="text-sm text-muted-foreground font-medium">
                {results.hasRewards ? "Total Staking Rewards" : "No Rewards"}
              </p>
            </div>
            <p
              className={cn(
                "text-4xl font-extrabold break-words",
                results.hasRewards ? "text-emerald-500" : "text-primary",
              )}
            >
              {results.totalRewardsTokens.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              <span className="text-lg text-muted-foreground font-medium ml-1">tokens</span>
            </p>
            {results.hasRewards && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">
                  {formatCurrency(results.totalRewardsFiat, currency)}
                </span>
                <span>
                  ({((results.totalRewardsTokens / results.stake) * 100).toFixed(2)}% return)
                </span>
              </div>
            )}
          </div>

          {/* Mini Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Wallet className="w-3 h-3 text-blue-500" />
                Final Balance
              </p>
              <p className="text-lg font-bold text-blue-500 break-words">
                {results.finalBalanceTokens.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatCurrency(results.finalValueFiat, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <BadgePercent className="w-3 h-3 text-indigo-500" />
                Effective APY
              </p>
              <p className="text-lg font-bold text-indigo-500 break-words">
                {results.effectiveApy.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {frequency === "none" ? "Simple interest" : `${COMPOUND_OPTIONS.find((o) => o.value === frequency)?.label}`}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                Monthly Reward
              </p>
              <p className="text-lg font-bold text-amber-500 break-words">
                {results.monthlyReward.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatCurrency(results.monthlyReward * results.tokenPrice, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                Daily Reward
              </p>
              <p className="text-lg font-bold text-emerald-500 break-words">
                {results.dailyReward.toLocaleString(undefined, { maximumFractionDigits: 6 })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatCurrency(results.dailyReward * results.tokenPrice, currency)}
              </p>
            </div>
          </div>

          {/* Summary Breakdown */}
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Staking Breakdown
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Stake Amount</span>
                <span className="font-medium">{results.stake.toLocaleString()} tokens</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Stake Value</span>
                <span className="font-medium">{formatCurrency(results.stake * results.tokenPrice, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">APR</span>
                <span className="font-medium">{results.apr.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">
                  {results.months >= 12
                    ? `${(results.months / 12).toFixed(1)} years (${results.months} months)`
                    : `${results.months} months`}
                </span>
              </div>
              {results.feePercent > 0 && (
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Protocol Fee ({results.feePercent.toFixed(1)}%)</span>
                  <span className="font-medium text-amber-500">
                    -{results.feeTokens.toLocaleString(undefined, { maximumFractionDigits: 4 })} tokens
                    ({formatCurrency(results.feeFiat, currency)})
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Gross Rewards</span>
                <span className="font-medium">
                  {results.grossRewardsTokens.toLocaleString(undefined, { maximumFractionDigits: 4 })} tokens
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Net Rewards</span>
                <span className="font-medium text-emerald-500">
                  +{results.totalRewardsTokens.toLocaleString(undefined, { maximumFractionDigits: 4 })} tokens
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-medium">Final Balance</span>
                <span className="font-bold text-primary">
                  {results.finalBalanceTokens.toLocaleString(undefined, { maximumFractionDigits: 4 })} tokens
                </span>
              </div>
            </div>
          </div>

          {/* APY Comparison Card */}
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <BadgePercent className="w-3 h-3" />
              APY Comparison by Frequency
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMPOUND_OPTIONS.filter((o) => o.value !== "none").map((opt) => {
                const mockApy = calculateStaking(stake, apr, 12, opt.value, tokenPrice, feePercent).effectiveApy;
                return (
                  <div
                    key={opt.value}
                    className={cn(
                      "text-center p-2 rounded-lg border text-xs",
                      frequency === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border",
                    )}
                  >
                    <p className="text-muted-foreground">{opt.label}</p>
                    <p className="font-bold text-primary">{mockApy.toFixed(2)}%</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Growth Card */}
          {results.months > 0 && (
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Growth Over Time
              </p>
              <div className="text-sm space-y-1.5">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Start Balance</span>
                  <span className="font-medium">{results.stake.toLocaleString()} tokens</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">After 1 Year</span>
                  <span className="font-medium">
                    {(results.stake * (1 + results.apr / 100 * (frequency === "none" ? 1 : 1))).toLocaleString(undefined, { maximumFractionDigits: 2 })} tokens
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">After {Math.max(1, Math.floor(results.months / 12))} Year{Math.floor(results.months / 12) !== 1 ? "s" : ""}</span>
                  <span className="font-bold text-emerald-500">{results.finalBalanceTokens.toLocaleString(undefined, { maximumFractionDigits: 4 })} tokens</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Total Return</span>
                  <span className="font-bold text-emerald-500">
                    +{((results.totalRewardsTokens / results.stake) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </ToolLayout>
  );
}
