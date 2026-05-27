"use client";

import { useCallback, useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { ArrowUpRight, BadgePercent, Banknote, Calculator, CheckCircle, FileText, Globe, Receipt, TrendingUp, TrendingDown, Clock } from "lucide-react";
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
// CGT COUNTRY CONFIGURATIONS
// ===================================================================

interface CgtCountry {
  name: string;
  code: string;
  shortTermRate: number;
  longTermRate: number;
  thresholdMonths: number;
  annualExemption: number;
  description: string;
  defaultCurrency: CurrencyCode;
}

const CGT_COUNTRIES: Record<string, CgtCountry> = {
  usa: {
    name: "United States",
    code: "usa",
    shortTermRate: 22,
    longTermRate: 15,
    thresholdMonths: 12,
    annualExemption: 0,
    description: "IRS rules (simplified rates)",
    defaultCurrency: "USD",
  },
  india: {
    name: "India",
    code: "india",
    shortTermRate: 15,
    longTermRate: 10,
    thresholdMonths: 12,
    annualExemption: 100000,
    description: "Income Tax Act, 1961 (listed securities)",
    defaultCurrency: "INR",
  },
  uk: {
    name: "United Kingdom",
    code: "uk",
    shortTermRate: 20,
    longTermRate: 10,
    thresholdMonths: 12,
    annualExemption: 3000,
    description: "HMRC (2024-25 rates)",
    defaultCurrency: "GBP",
  },
  canada: {
    name: "Canada",
    code: "canada",
    shortTermRate: 25,
    longTermRate: 25,
    thresholdMonths: 12,
    annualExemption: 0,
    description: "50% inclusion at marginal rate",
    defaultCurrency: "CAD",
  },
  australia: {
    name: "Australia",
    code: "australia",
    shortTermRate: 25,
    longTermRate: 12.5,
    thresholdMonths: 12,
    annualExemption: 0,
    description: "ATO (50% CGT discount for individuals)",
    defaultCurrency: "AUD",
  },
  germany: {
    name: "Germany",
    code: "germany",
    shortTermRate: 26.375,
    longTermRate: 0,
    thresholdMonths: 12,
    annualExemption: 0,
    description: "Abgeltungsteuer + Soli (private sales)",
    defaultCurrency: "EUR",
  },
  france: {
    name: "France",
    code: "france",
    shortTermRate: 30,
    longTermRate: 30,
    thresholdMonths: 12,
    annualExemption: 0,
    description: "PFU flat tax (12.8% + 17.2% social)",
    defaultCurrency: "EUR",
  },
  singapore: {
    name: "Singapore",
    code: "singapore",
    shortTermRate: 0,
    longTermRate: 0,
    thresholdMonths: 12,
    annualExemption: 0,
    description: "No Capital Gains Tax",
    defaultCurrency: "SGD",
  },
  uae: {
    name: "UAE",
    code: "uae",
    shortTermRate: 0,
    longTermRate: 0,
    thresholdMonths: 12,
    annualExemption: 0,
    description: "No Capital Gains Tax",
    defaultCurrency: "AED",
  },
  switzerland: {
    name: "Switzerland",
    code: "switzerland",
    shortTermRate: 0,
    longTermRate: 0,
    thresholdMonths: 60,
    annualExemption: 0,
    description: "No CGT for private individuals",
    defaultCurrency: "CHF",
  },
};

// ===================================================================
// CONSTANTS
// ===================================================================

const PIE_COLORS_GAIN = ["#10b981", "#3b82f6"];
const PIE_COLORS_LOSS = ["#ef4444", "#3b82f6"];

const RELATED_TOOLS = [
  { name: "Income Tax Calculator", href: "/finance/income-tax-calculator", desc: "Estimate your annual income tax with multiple country regimes." },
  { name: "GST Calculator", href: "/finance/gst-calculator", desc: "Calculate Goods and Services Tax for 15+ countries." },
  { name: "VAT Calculator", href: "/finance/vat-calculator", desc: "Calculate Value Added Tax for 20+ countries." },
  { name: "Profit Margin Calculator", href: "/finance/profit-margin-calculator", desc: "Calculate gross and net profit margins on products." },
];

// ===================================================================
// TYPES
// ===================================================================

interface CgtResults {
  costBasis: number;
  proceeds: number;
  fees: number;
  grossGain: number;
  holdingMonths: number;
  isLongTerm: boolean;
  applicableRate: number;
  annualExemption: number;
  taxableGain: number;
  taxDue: number;
  netAfterTax: number;
  totalReturn: number;
  roi: number;
  isGain: boolean;
  isLoss: boolean;
  hasCgt: boolean;
  holdingPeriodLabel: string;
  rateLabel: string;
}

// ===================================================================
// CALCULATION ENGINE
// ===================================================================

const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

function getHoldingLabel(months: number): string {
  if (months <= 0) return "Less than 1 month";
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} month${m !== 1 ? "s" : ""}`;
  if (m === 0) return `${y} year${y !== 1 ? "s" : ""}`;
  return `${y} year${y !== 1 ? "s" : ""}, ${m} month${m !== 1 ? "s" : ""}`;
}

function calculateCgt(
  costBasis: number,
  proceeds: number,
  fees: number,
  holdingMonths: number,
  country: CgtCountry,
): CgtResults {
  const c = clamp(Number.isFinite(costBasis) ? Math.max(0, costBasis) : 0, 0, 1e9);
  const p = clamp(Number.isFinite(proceeds) ? Math.max(0, proceeds) : 0, 0, 1e9);
  const f = clamp(Number.isFinite(fees) ? Math.max(0, fees) : 0, 0, 1e9);
  const h = clamp(Number.isFinite(holdingMonths) ? Math.max(0, holdingMonths) : 0, 0, 1200);

  const grossGain = p - c - f;
  const isLongTerm = h >= country.thresholdMonths;
  const rate = (isLongTerm ? country.longTermRate : country.shortTermRate);
  const taxableGain = Math.max(0, grossGain - country.annualExemption);
  const taxDue = taxableGain * (rate / 100);
  const netAfterTax = p - f - taxDue;
  const totalReturn = netAfterTax - c;
  const roi = c > 0 ? ((p - c - f) / c) * 100 : 0;

  return {
    costBasis: c,
    proceeds: p,
    fees: f,
    grossGain,
    holdingMonths: h,
    isLongTerm,
    applicableRate: rate,
    annualExemption: country.annualExemption,
    taxableGain: Math.max(0, taxableGain),
    taxDue,
    netAfterTax,
    totalReturn,
    roi,
    isGain: grossGain > 0.005,
    isLoss: grossGain < -0.005,
    hasCgt: rate > 0 && grossGain > country.annualExemption,
    holdingPeriodLabel: getHoldingLabel(h),
    rateLabel: isLongTerm ? "Long-Term" : "Short-Term",
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

export default function CgtCalculator() {
  const [countryCode, setCountryCode] = useState("usa");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const { value: costBasis, displayValue: costBasisDisplay, setValue: setCostBasis, handleChange: handleCostInput, handleFocus: handleCostFocus, handleBlur: handleCostBlur } = useNumericField(50000);
  const { value: proceeds, displayValue: proceedsDisplay, setValue: setProceeds, handleChange: handleProceedsInput, handleFocus: handleProceedsFocus, handleBlur: handleProceedsBlur } = useNumericField(75000);
  const { value: fees, displayValue: feesDisplay, setValue: setFees, handleChange: handleFeesInput, handleFocus: handleFeesFocus, handleBlur: handleFeesBlur } = useNumericField(0);
  const [holdingMonths, setHoldingMonths] = useState(12);

  const country = CGT_COUNTRIES[countryCode];
  const maxAmount = useMemo(() => getMaxAmount(currency), [currency]);
  const step = useMemo(() => getSliderStep(currency), [currency]);

  const results = useMemo<CgtResults>(
    () => calculateCgt(costBasis, proceeds, fees, holdingMonths, country),
    [costBasis, proceeds, fees, holdingMonths, country],
  );

  const pieData = useMemo(() => {
    if (results.isGain) {
      return [
        { name: "Capital Gain", value: results.grossGain },
        { name: "Cost Basis", value: results.costBasis },
      ];
    }
    if (results.isLoss) {
      return [
        { name: "Capital Loss", value: Math.abs(results.grossGain) },
        { name: "Cost Basis", value: results.costBasis },
      ];
    }
    return [];
  }, [results.grossGain, results.costBasis, results.isGain, results.isLoss]);

  const showPie = results.isGain || results.isLoss;

  // --- Handlers ---

  const handleCountryChange = useCallback((val: string) => {
    setCountryCode(val);
    const c = CGT_COUNTRIES[val];
    if (c) setCurrency(c.defaultCurrency);
  }, []);

  const handleCurrencyChange = useCallback((val: string) => {
    setCurrency(val as CurrencyCode);
  }, []);



  const maxFees = useMemo(() => Math.min(maxAmount * 0.1, 500000), [maxAmount]);
  const feesStep = useMemo(() => Math.max(10, step), [step]);

  return (
    <ToolLayout
      title="Capital Gains Tax Calculator"
      description="Calculate capital gains tax on investments for 10+ countries with short-term and long-term rates, real-time charts, and multi-currency support."
      category="finance"
      faqContent={[
        {
          question: "What is capital gains tax and how is it calculated?",
          answer: "Capital gains tax (CGT) is a tax on the profit made from selling an asset. It is calculated as: Capital Gain = Sale Proceeds - Cost Basis - Fees. The applicable tax rate depends on how long you held the asset (short-term vs long-term) and your country's tax rules. Short-term gains (assets held for less than a threshold period) are typically taxed at higher rates than long-term gains.",
        },
        {
          question: "What is the difference between short-term and long-term capital gains?",
          answer: "Short-term capital gains are profits from assets held for ≤12 months (or the country-specific threshold). They are typically taxed at higher rates - in the US, they're taxed as ordinary income (10-37%). Long-term gains are from assets held beyond the threshold and receive preferential rates - in the US, 0-20% based on income. Other countries like Germany even exempt private long-term gains entirely after 1 year.",
        },
        {
          question: "How do I calculate my cost basis for capital gains?",
          answer: "Cost basis is the original value of an asset for tax purposes, usually the purchase price plus any associated costs (brokerage fees, commissions, transfer taxes). For stocks bought at different times, methods like FIFO (First-In, First-Out), LIFO, or average cost may be used. For inherited assets, the cost basis is typically the fair market value at the time of inheritance (stepped-up basis).",
        },
        {
          question: "What countries have no capital gains tax?",
          answer: "Several countries do not impose capital gains tax on individuals: Singapore, UAE, Qatar, Bahrain, Kuwait, Oman, Saudi Arabia, Switzerland (for private individuals), and Monaco. Some countries like Belgium, New Zealand, and Hong Kong also have no general CGT. However, certain conditions may apply - for example, Switzerland has CGT on real estate and deemed employment income from trading.",
        },
        {
          question: "How does the US capital gains tax system work?",
          answer: "In the US, short-term gains (held ≤1 year) are taxed as ordinary income at rates from 10% to 37%. Long-term gains (held >1 year) are taxed at 0%, 15%, or 20% depending on your taxable income. An additional 3.8% Net Investment Income Tax (NIIT) may apply for high earners. This calculator uses simplified representative rates - consult a tax professional for your specific situation.",
        },
        {
          question: "What is the annual exemption for capital gains in the UK?",
          answer: "For the 2024-25 tax year, the UK's annual exempt amount for capital gains is Â£3,000 for individuals. This means you can make up to Â£3,000 in capital gains without paying any tax. Any gains above this threshold are taxed at 10% for basic rate taxpayers and 20% for higher rate taxpayers (for most assets). The exemption was reduced from Â£6,000 in 2023-24.",
        },
        {
          question: "How does India's capital gains tax work?",
          answer: "In India, for listed securities: short-term gains (held ≤12 months) are taxed at 15%. Long-term gains (>12 months) over ₹1 lakh are taxed at 10% without indexation benefit. For unlisted assets like real estate: short-term (<24 months) is at slab rates, long-term (≥24 months) at 20% with indexation. This calculator covers the securities/equity framework.",
        },
        {
          question: "Can capital losses offset capital gains?",
          answer: "Yes, capital losses can be used to offset capital gains in most tax systems. In the US, short-term losses offset short-term gains first, then long-term gains. Net losses can be deducted against ordinary income up to $3,000 per year, with remaining losses carried forward. In the UK, losses must be reported within 4 years and can be carried forward indefinitely to offset future gains.",
        },
        {
          question: "What assets are subject to capital gains tax?",
          answer: "Capital gains tax typically applies to: stocks and shares, mutual funds, ETFs, real estate (excluding primary residence in many countries), cryptocurrency, precious metals, collectibles (art, antiques), and business assets. Exemptions often include: primary residence (up to a limit), tax-advantaged retirement accounts (401k, IRA, ISA), and personal-use assets under certain thresholds.",
        },
        {
          question: "How does cryptocurrency capital gains tax work?",
          answer: "Most tax authorities treat cryptocurrency as property for tax purposes, meaning capital gains tax applies when you sell, trade, or spend crypto. Each disposal (crypto-to-crypto, crypto-to-fiat, or crypto-to-goods) is a taxable event. The holding period determines short-term vs long-term treatment. Using crypto for payments triggers CGT on the gain plus potentially income tax on the value received.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a Capital Gains Tax Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A Capital Gains Tax (CGT) calculator helps investors estimate the tax owed on profits from selling
              assets such as stocks, real estate, cryptocurrency, and other investments. It accounts for your cost
              basis, sale proceeds, fees, holding period, and country-specific tax rules to compute your net
              after-tax return. This tool supports both <strong>short-term</strong> and{" "}
              <strong>long-term</strong> capital gains tax regimes across 10+ countries.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p>Gross Gain = Sale Proceeds - Cost Basis - Fees</p>
              <p>Taxable Gain = max(0, Gross Gain - Annual Exemption)</p>
              <p>Tax Due = Taxable Gain × (Applicable Rate ÷ 100)</p>
              <p>Net After Tax = Sale Proceeds - Fees - Tax Due</p>
              <p>Total Return = Net After Tax - Cost Basis</p>
              <br />
              <p><strong>Holding Period:</strong> Short-term if ≤ threshold, Long-term if &gt; threshold</p>
              <p><strong>Applicable Rate:</strong> Short-term rate or Long-term rate based on holding period</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Benefits of Using This Calculator</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              <li><strong>Multi-Country Rules:</strong> Pre-configured CGT regimes for USA, India, UK, Canada, Australia, Germany, France, Singapore, UAE, and Switzerland.</li>
              <li><strong>Short-Term vs Long-Term:</strong> Automatic classification based on holding period with country-specific threshold and tax rates.</li>
              <li><strong>Global Currencies:</strong> Display results in 29+ currencies with proper locale-aware formatting.</li>
              <li><strong>Annual Exemptions:</strong> Automatically applies country-specific tax-free allowances (UK Â£3,000, India ₹1L, etc.).</li>
              <li><strong>Real-Time Visuals:</strong> Pie chart shows your gain vs cost basis breakdown, updated instantly as you adjust values.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Scenario: US investor bought shares for $50,000 and sold for $80,000 after 18 months with $200 in fees.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Gross Gain = $80,000 - $50,000 - $200 = <strong>$29,800</strong></li>
                <li>Holding Period: 18 months → <strong>Long-term</strong> (&gt;12 months)</li>
                <li>Applicable Rate: 15% (long-term rate)</li>
                <li>Tax Due = $29,800 × 15% = <strong>$4,470</strong></li>
                <li>Net After Tax = $80,000 - $200 - $4,470 = <strong>$75,330</strong></li>
                <li>Total Return = $75,330 - $50,000 = <strong>$25,330</strong></li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Common Mistakes to Avoid</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed text-muted-foreground">
              <li>Forgetting to include fees, commissions, and transfer taxes in your cost basis calculation.</li>
              <li>Miscounting the holding period - the clock starts the day after purchase and ends on the sale date.</li>
              <li>Confusing short-term and long-term classifications when holding period is near the threshold.</li>
              <li>Not accounting for annual exemptions that can reduce or eliminate your tax liability.</li>
              <li>Assuming the same tax rules apply across all asset types (crypto, real estate, and securities may have different treatments).</li>
            </ul>
          </div>
        </div>
      }
      relatedTools={RELATED_TOOLS}
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* ============ LEFT: INPUTS + CHART ============ */}
        <div className="space-y-6">
          {/* Country Select */}
          <div className="space-y-2">
            <label htmlFor="cgt-country" className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <Globe className="w-4 h-4 text-primary" />
              Country / Tax Regime
            </label>
            <select
              id="cgt-country"
              value={countryCode}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {Object.entries(CGT_COUNTRIES).map(([key, c]) => (
                <option key={key} value={key}>{c.name} - {c.description}</option>
              ))}
            </select>
          </div>

          {/* Currency Select */}
          <div className="space-y-2">
            <label htmlFor="cgt-currency" className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <Banknote className="w-4 h-4 text-primary" />
              Currency
            </label>
            <select
              id="cgt-currency"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} - {c.label} ({c.symbol})</option>
              ))}
            </select>
          </div>

          {/* Cost Basis */}
          <div className="space-y-2">
            <label htmlFor="cgt-cost" className="flex items-center gap-1.5 text-sm font-medium">
              <Receipt className="w-4 h-4 text-primary" />
              <span>Cost Basis (Purchase Price + Fees)</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(costBasis, currency)}</span>
            </label>
            <input
              id="cgt-cost"
              type="range"
              min={0}
              max={maxAmount}
              step={step}
              value={Math.min(costBasis, maxAmount)}
              onChange={(e) => setCostBasis(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={maxAmount}
              aria-valuenow={costBasis}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCompact(maxAmount, currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={costBasisDisplay}
              onChange={(e) => handleCostInput(e.target.value)}
              onFocus={handleCostFocus}
              onBlur={handleCostBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter cost basis"
            />
          </div>

          {/* Proceeds */}
          <div className="space-y-2">
            <label htmlFor="cgt-proceeds" className="flex items-center gap-1.5 text-sm font-medium">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Sale Proceeds</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(proceeds, currency)}</span>
            </label>
            <input
              id="cgt-proceeds"
              type="range"
              min={0}
              max={maxAmount}
              step={step}
              value={Math.min(proceeds, maxAmount)}
              onChange={(e) => setProceeds(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={maxAmount}
              aria-valuenow={proceeds}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCompact(maxAmount, currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={proceedsDisplay}
              onChange={(e) => handleProceedsInput(e.target.value)}
              onFocus={handleProceedsFocus}
              onBlur={handleProceedsBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter sale proceeds"
            />
          </div>

          {/* Fees */}
          <div className="space-y-2">
            <label htmlFor="cgt-fees" className="flex items-center gap-1.5 text-sm font-medium">
              <BadgePercent className="w-4 h-4 text-muted-foreground" />
              <span>Fees &amp; Commissions</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(fees, currency)}</span>
            </label>
            <input
              id="cgt-fees"
              type="range"
              min={0}
              max={maxFees}
              step={feesStep}
              value={Math.min(fees, maxFees)}
              onChange={(e) => setFees(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={maxFees}
              aria-valuenow={fees}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCompact(maxFees, currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={feesDisplay}
              onChange={(e) => handleFeesInput(e.target.value)}
              onFocus={handleFeesFocus}
              onBlur={handleFeesBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter fees"
            />
          </div>

          {/* Holding Period */}
          <div className="space-y-2">
            <label htmlFor="cgt-holding" className="flex items-center gap-1.5 text-sm font-medium">
              <Clock className="w-4 h-4 text-primary" />
              <span>Holding Period</span>
              <span className="ml-auto text-lg font-bold text-primary">{results.holdingPeriodLabel}</span>
            </label>
            <input
              id="cgt-holding"
              type="range"
              min={0}
              max={720}
              step={1}
              value={holdingMonths}
              onChange={(e) => setHoldingMonths(parseInt(e.target.value, 10))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={720}
              aria-valuenow={holdingMonths}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0 mo</span>
              <span>30 yr</span>
              <span>60 yr</span>
            </div>
            {/* Classification Badge */}
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                  results.isLongTerm
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700",
                )}
              >
                {results.rateLabel}
              </span>
              <span className="text-xs text-muted-foreground">
                Threshold: {country.thresholdMonths} months
              </span>
            </div>
          </div>

          {/* Pie Chart */}
          {showPie && (
            <div className="bg-white border border-border rounded-xl p-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Gain vs Cost Basis
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
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-sm", results.isLoss ? "bg-[#ef4444]" : "bg-[#10b981]")} />
                    <span className="text-muted-foreground">
                      {results.isLoss ? "Loss" : "Gain"} ({results.isLoss
                        ? (Math.abs(results.grossGain) / (results.costBasis + Math.abs(results.grossGain)) * 100).toFixed(1)
                        : (results.grossGain / (results.costBasis + results.grossGain) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#3b82f6]" />
                    <span className="text-muted-foreground">Cost Basis ({((results.costBasis / (results.costBasis + Math.abs(results.grossGain))) * 100).toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Cost Basis</p>
                  <p className="text-sm font-semibold">{formatCurrency(results.costBasis, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Capital Gains</p>
                  <p className="text-sm font-semibold text-emerald-500">{formatCurrency(results.grossGain, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Total Value</p>
                  <p className="text-sm font-semibold">{formatCurrency(results.proceeds, currency)}</p>
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
                  ? results.hasCgt
                    ? "bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200"
                    : "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200"
                  : "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20",
            )}
          >
            <div className="flex items-center gap-2 mb-3">
              {results.isLoss ? (
                <TrendingDown className="w-5 h-5 text-red-500" />
              ) : results.isGain ? (
                <TrendingUp className={cn("w-5 h-5", results.hasCgt ? "text-amber-500" : "text-emerald-500")} />
              ) : (
                <Calculator className="w-5 h-5 text-primary" />
              )}
              <p className="text-sm text-muted-foreground font-medium">
                {results.isLoss ? "Capital Loss" : results.isGain ? "Capital Gain" : "No Gain / No Loss"}
              </p>
            </div>
            <p
              className={cn(
                "text-4xl font-extrabold break-words",
                results.isLoss
                  ? "text-red-500"
                  : results.isGain
                    ? results.hasCgt ? "text-amber-500" : "text-emerald-500"
                    : "text-primary",
              )}
            >
              {results.isLoss
                ? formatCurrency(results.grossGain, currency)
                : formatCurrency(results.grossGain, currency)}
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              {results.isLoss ? (
                <span className="text-red-600 font-medium">
                  Capital loss - may offset other gains
                </span>
              ) : results.isGain ? (
                <>
                  {results.hasCgt ? (
                    <ArrowUpRight className="w-4 h-4 text-amber-500" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  )}
                  <span>
                    {results.roi.toFixed(1)}% ROI · {results.rateLabel}
                    {!results.hasCgt && results.applicableRate === 0 && " · Tax-free"}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">Break-even - no tax due</span>
              )}
            </div>
          </div>

          {/* Mini Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <BadgePercent className="w-3 h-3 text-primary" />
                ROI
              </p>
              <p className={cn("text-lg font-bold break-words", results.isLoss ? "text-red-500" : results.isGain ? "text-emerald-500" : "text-primary")}>
                {results.roi > 0 ? "+" : ""}{results.roi.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Calculator className="w-3 h-3 text-primary" />
                Tax Due
              </p>
              <p className="text-lg font-bold text-primary break-words">
                {formatCurrency(results.taxDue, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Banknote className="w-3 h-3 text-blue-500" />
                Net After Tax
              </p>
              <p className="text-lg font-bold text-blue-500 break-words">
                {formatCurrency(results.netAfterTax, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-purple-500" />
                Total Return
              </p>
              <p className={cn("text-lg font-bold break-words", results.totalReturn < 0 ? "text-red-500" : "text-purple-500")}>
                {formatCurrency(results.totalReturn, currency)}
              </p>
            </div>
          </div>

          {/* Summary Breakdown */}
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Summary Breakdown
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Cost Basis</span>
                <span className="font-medium">{formatCurrency(results.costBasis, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Sale Proceeds</span>
                <span className="font-medium">{formatCurrency(results.proceeds, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Fees &amp; Commissions</span>
                <span className="font-medium">-{formatCurrency(results.fees, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Gross Gain</span>
                <span className={cn("font-medium", results.isLoss ? "text-red-500" : results.isGain ? "text-emerald-500" : "")}>
                  {results.isLoss ? "" : "+"}{formatCurrency(results.grossGain, currency)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Holding Period</span>
                <span className="font-medium">{results.holdingPeriodLabel} · {results.rateLabel}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Tax Rate</span>
                <span className="font-medium">{results.applicableRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Annual Exemption</span>
                <span className="font-medium">{formatCurrency(results.annualExemption, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Taxable Gain</span>
                <span className="font-medium">{formatCurrency(results.taxableGain, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Tax Due</span>
                <span className="font-medium">-{formatCurrency(results.taxDue, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-medium">Net After Tax</span>
                <span className="font-bold text-primary">{formatCurrency(results.netAfterTax, currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </ToolLayout>
  );
}
