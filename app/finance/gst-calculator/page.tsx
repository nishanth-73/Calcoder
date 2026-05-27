"use client";

import { useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { ArrowUpRight, BadgePercent, Banknote, Calculator, CheckCircle, FileText, Globe, Percent, Receipt } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { cn } from "@/lib/utils";

// ===================================================================
// CURRENCY SYSTEM
// ===================================================================

type CurrencyCode =
  | "USD" | "INR" | "EUR" | "GBP" | "AED" | "CAD" | "AUD"
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
  { code: "INR", label: "Indian Rupee", symbol: "₹", locale: "en-IN" },
  { code: "EUR", label: "Euro", symbol: "€", locale: "de-DE" },
  { code: "GBP", label: "British Pound", symbol: "Â£", locale: "en-GB" },
  { code: "AED", label: "UAE Dirham", symbol: "Ø¯.Ø¥", locale: "ar-AE" },
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
// GST COUNTRY CONFIGURATIONS
// ===================================================================

interface GstCountry {
  name: string;
  code: string;
  rates: number[];
  defaultRate: number;
  description: string;
  defaultCurrency: CurrencyCode;
}

const GST_COUNTRIES: Record<string, GstCountry> = {
  india: {
    name: "India",
    code: "india",
    rates: [0, 5, 12, 18, 28],
    defaultRate: 18,
    description: "Goods and Services Tax",
    defaultCurrency: "INR",
  },
  canada: {
    name: "Canada",
    code: "canada",
    rates: [5, 13, 15],
    defaultRate: 13,
    description: "GST / HST",
    defaultCurrency: "CAD",
  },
  australia: {
    name: "Australia",
    code: "australia",
    rates: [10],
    defaultRate: 10,
    description: "Goods and Services Tax",
    defaultCurrency: "AUD",
  },
  singapore: {
    name: "Singapore",
    code: "singapore",
    rates: [9],
    defaultRate: 9,
    description: "Goods and Services Tax",
    defaultCurrency: "SGD",
  },
  uk: {
    name: "United Kingdom",
    code: "uk",
    rates: [20],
    defaultRate: 20,
    description: "Value Added Tax",
    defaultCurrency: "GBP",
  },
  uae: {
    name: "UAE",
    code: "uae",
    rates: [5],
    defaultRate: 5,
    description: "Value Added Tax",
    defaultCurrency: "AED",
  },
  malaysia: {
    name: "Malaysia",
    code: "malaysia",
    rates: [6, 10],
    defaultRate: 10,
    description: "Sales and Service Tax",
    defaultCurrency: "MYR",
  },
  newzealand: {
    name: "New Zealand",
    code: "newzealand",
    rates: [15],
    defaultRate: 15,
    description: "Goods and Services Tax",
    defaultCurrency: "NZD",
  },
  southafrica: {
    name: "South Africa",
    code: "southafrica",
    rates: [15],
    defaultRate: 15,
    description: "Value Added Tax",
    defaultCurrency: "ZAR",
  },
  indonesia: {
    name: "Indonesia",
    code: "indonesia",
    rates: [11],
    defaultRate: 11,
    description: "Value Added Tax (PPN)",
    defaultCurrency: "IDR",
  },
  philippines: {
    name: "Philippines",
    code: "philippines",
    rates: [12],
    defaultRate: 12,
    description: "Value Added Tax",
    defaultCurrency: "PHP",
  },
  thailand: {
    name: "Thailand",
    code: "thailand",
    rates: [7],
    defaultRate: 7,
    description: "Value Added Tax",
    defaultCurrency: "THB",
  },
  vietnam: {
    name: "Vietnam",
    code: "vietnam",
    rates: [8, 10],
    defaultRate: 10,
    description: "Value Added Tax",
    defaultCurrency: "VND",
  },
  europe: {
    name: "European Union",
    code: "europe",
    rates: [5, 8, 10, 13, 20, 21, 22, 23, 24, 25, 27],
    defaultRate: 20,
    description: "Value Added Tax (standard rate EU)",
    defaultCurrency: "EUR",
  },
};

// ===================================================================
// CONSTANTS
// ===================================================================

const PIE_COLORS = ["#f59e0b", "#3b82f6"];

const RELATED_TOOLS = [
  { name: "VAT Calculator", href: "/finance/vat-calculator", desc: "Calculate Value Added Tax for EU and other countries." },
  { name: "Income Tax Calculator", href: "/finance/income-tax-calculator", desc: "Estimate your annual income tax with multiple country regimes." },
  { name: "Capital Gains Tax Calculator", href: "/finance/capital-gains-tax-calculator", desc: "Calculate tax on profits from investments and asset sales." },
  { name: "Profit Margin Calculator", href: "/finance/profit-margin-calculator", desc: "Calculate gross and net profit margins on products." },
];

// ===================================================================
// TYPES
// ===================================================================

type CalculationMode = "exclusive" | "inclusive";

interface GstResults {
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  gstRate: number;
  mode: CalculationMode;
  effectiveRate: number;
  gstRatio: number;
  hasGst: boolean;
}

// ===================================================================
// CALCULATION ENGINE
// ===================================================================

const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

function calculateGst(amount: number, gstRate: number, mode: CalculationMode): GstResults {
  const a = clamp(Number.isFinite(amount) ? Math.max(0, amount) : 0, 0, 1_000_000_000);
  const r = clamp(Number.isFinite(gstRate) ? Math.max(0, gstRate) : 0, 0, 100);

  let baseAmount: number;
  let gstAmount: number;
  let totalAmount: number;

  if (mode === "exclusive") {
    baseAmount = a;
    gstAmount = baseAmount * (r / 100);
    totalAmount = baseAmount + gstAmount;
  } else {
    totalAmount = a;
    baseAmount = r === 100 ? totalAmount / 2 : totalAmount / (1 + r / 100);
    gstAmount = totalAmount - baseAmount;
  }

  return {
    baseAmount,
    gstAmount,
    totalAmount,
    gstRate: r,
    mode,
    effectiveRate: baseAmount > 0 ? (gstAmount / baseAmount) * 100 : 0,
    gstRatio: totalAmount > 0 ? (gstAmount / totalAmount) * 100 : 0,
    hasGst: gstAmount > 0.005,
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

export default function GstCalculator() {
  const [countryCode, setCountryCode] = useState("india");
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const { value: amount, displayValue: amountDisplay, setValue: setAmount, handleChange: handleAmountInput, handleFocus: handleAmountFocus, handleBlur: handleAmountBlur } = useNumericField(10000);
  const { value: gstRate, displayValue: gstRateDisplay, setValue: setGstRate, handleChange: handleRateInput, handleFocus: handleRateFocus, handleBlur: handleRateBlur } = useNumericField(18);
  const [mode, setMode] = useState<CalculationMode>("exclusive");

  const country = GST_COUNTRIES[countryCode];
  const maxAmount = useMemo(() => getMaxAmount(currency), [currency]);
  const step = useMemo(() => getSliderStep(currency), [currency]);

  const results = useMemo<GstResults>(
    () => calculateGst(amount, gstRate, mode),
    [amount, gstRate, mode],
  );

  const pieData = useMemo(
    () => [
      { name: "GST Amount", value: results.gstAmount },
      { name: "Base Amount", value: results.baseAmount },
    ],
    [results.gstAmount, results.baseAmount],
  );

  const isHighGst = results.effectiveRate >= 20;

  // --- Handlers ---

  const handleCountryChange = (val: string) => {
    setCountryCode(val);
    const c = GST_COUNTRIES[val];
    if (c) {
      setGstRate(c.defaultRate);
      setCurrency(c.defaultCurrency);
    }
  };

  const handleCurrencyChange = (val: string) => {
    setCurrency(val as CurrencyCode);
  };

  const handlePresetRate = (rate: number) => {
    setGstRate(rate);
  };

  return (
    <ToolLayout
      title="GST Calculator"
      description="Calculate Goods and Services Tax (GST) and VAT for 15+ countries with real-time charts, multiple tax rates, and currency formatting."
      category="finance"
      faqContent={[
        {
          question: "What is GST and how is it calculated?",
          answer: "GST (Goods and Services Tax) is a consumption tax applied to the sale of goods and services. It is calculated as a percentage of the transaction value. In exclusive mode, GST is added to the base price: Total = Base × (1 + Rate/100). In inclusive mode, GST is already included in the total price: Base = Total / (1 + Rate/100) and GST = Total - Base.",
        },
        {
          question: "What is the difference between exclusive and inclusive GST?",
          answer: "Exclusive GST means the displayed price does not include tax - GST is calculated and added at checkout. This is common in B2B transactions. Inclusive GST means the displayed price already includes the tax - the GST portion is embedded within the price. This is common in retail pricing for consumers.",
        },
        {
          question: "How do GST rates differ by country?",
          answer: "GST rates vary significantly worldwide. India has a 4-tier structure (5%, 12%, 18%, 28%) depending on the product category. Canada uses 5% GST plus provincial HST (up to 15%). Australia applies a flat 10% GST. The UK uses 20% VAT. Singapore recently raised GST to 9%. The UAE applies 5% VAT. Always check your local tax authority for the correct applicable rate.",
        },
        {
          question: "What is the GST rate in India for different products?",
          answer: "India's GST has four main slabs: 0% (essential items like food grains, milk, eggs), 5% (household necessities like sugar, tea, coffee), 12% (processed foods, computers, mobile phones), 18% (most goods and services - the standard rate), and 28% (luxury items like cars, tobacco, premium appliances). Some items like gold have a special 3% rate.",
        },
        {
          question: "How do I calculate GST backwards from a total price?",
          answer: "To extract GST from an inclusive price, use the formula: Base Amount = Total / (1 + Rate/100). For example, if you paid ₹11,800 including 18% GST, your base amount is ₹11,800 / 1.18 = ₹10,000, and the GST component is ₹1,800. Switch to 'Inclusive' mode in this calculator to automatically perform reverse GST calculation.",
        },
        {
          question: "Is GST the same as VAT?",
          answer: "GST (Goods and Services Tax) and VAT (Value Added Tax) are conceptually the same - both are consumption taxes collected at each stage of the supply chain. The term 'GST' is used in countries like India, Canada, Australia, Singapore, and New Zealand. 'VAT' is used in the UK, Europe, UAE, and many other regions. The calculation method is identical.",
        },
        {
          question: "What is the difference between CGST, SGST, and IGST in India?",
          answer: "In India, GST is divided into: CGST (Central GST - collected by the central government), SGST (State GST - collected by the state government), and IGST (Integrated GST - collected on inter-state transactions). For intra-state sales, the total GST rate is split equally between CGST and SGST. For example, an 18% GST on an intra-state sale means 9% CGST + 9% SGST.",
        },
        {
          question: "How do I handle GST rounding in financial calculations?",
          answer: "GST amounts can result in fractional values. For accounting purposes, standard rounding rules apply: round to the nearest cent (or smallest currency unit). Most tax authorities accept standard mathematical rounding. This calculator provides precise decimal results - for official filings, consult your local tax authority's rounding rules.",
        },
        {
          question: "Which businesses need to register for GST?",
          answer: "GST registration thresholds vary by country. In India, businesses with annual turnover exceeding ₹20 lakh (₹10 lakh for special category states) must register. In Canada, the threshold is $30,000. In Australia, it's $75,000. In Singapore, it's S$1 million. In the UK, it's Â£90,000. Businesses below these thresholds may still voluntarily register to claim input tax credits.",
        },
        {
          question: "What is input tax credit (ITC) in GST?",
          answer: "Input Tax Credit (ITC) allows businesses to claim a credit for the GST paid on their purchases (inputs). This prevents tax cascading - where tax is charged on tax. For example, if a manufacturer pays ₹1,000 GST on raw materials and collects ₹2,000 GST on finished goods, they can claim ITC of ₹1,000 and only remit the net ₹1,000 to the government. ITC is a fundamental feature of the GST system.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a GST Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A GST (Goods and Services Tax) calculator is a financial tool that helps individuals and businesses compute the
              tax component on transactions. It supports both <strong>exclusive</strong> (adding tax on top) and{" "}
              <strong>inclusive</strong> (extracting tax from total) calculations across multiple countries, tax rates,
              and currencies. Whether you are invoicing a client, pricing a product, or filing a tax return, this tool
              provides instant and accurate results.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p><strong>Exclusive GST</strong> (Tax added to base):</p>
              <p className="pl-4">GST Amount = Base Price × (GST Rate ÷ 100)</p>
              <p className="pl-4">Total Price = Base Price + GST Amount</p>
              <br />
              <p><strong>Inclusive GST</strong> (Tax included in total):</p>
              <p className="pl-4">Base Price = Total Price ÷ (1 + GST Rate ÷ 100)</p>
              <p className="pl-4">GST Amount = Total Price - Base Price</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Benefits of Using This Calculator</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              <li><strong>Multi-Country Support:</strong> Pre-configured GST/VAT rates for 15+ countries including India, Canada, Australia, UK, Singapore, UAE, and more.</li>
              <li><strong>Global Currencies:</strong> Format results in 28+ currencies with proper locale-aware formatting - perfect for international businesses.</li>
              <li><strong>Dual Calculation Modes:</strong> Switch between exclusive (add GST) and inclusive (extract GST) to handle any pricing scenario.</li>
              <li><strong>Real-Time Visuals:</strong> The pie chart shows your GST vs Base breakdown at a glance, updated instantly as you adjust values.</li>
              <li><strong>Accurate &amp; Fast:</strong> Memoized calculations prevent unnecessary re-renders, and strict input validation prevents NaN errors or crashes.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Scenario: You have a base price of ₹50,000 with 18% GST (exclusive).</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>GST Amount = ₹50,000 × (18 ÷ 100) = <strong>₹9,000</strong></li>
                <li>Total Price = ₹50,000 + ₹9,000 = <strong>₹59,000</strong></li>
                <li>Effective Tax Rate: 18%</li>
              </ul>
              <p className="font-medium text-foreground mt-3 mb-2">Reverse Scenario: You paid ₹59,000 inclusive of 18% GST.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Base Price = ₹59,000 ÷ (1 + 18 ÷ 100) = <strong>₹50,000</strong></li>
                <li>GST Amount = ₹59,000 - ₹50,000 = <strong>₹9,000</strong></li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Common Mistakes to Avoid</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed text-muted-foreground">
              <li>Forgetting that different products may have different GST rates under the same country&apos;s tax system.</li>
              <li>Confusing exclusive vs inclusive pricing - always verify whether the quoted price includes tax or not.</li>
              <li>Applying the wrong rounding method for fractional currency amounts in official filings.</li>
              <li>Not considering input tax credit (ITC) when calculating net tax liability for businesses.</li>
              <li>Using incorrect GST codes or HSN/SAC codes when generating invoices for cross-border transactions.</li>
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
            <label htmlFor="gst-country" className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <Globe className="w-4 h-4 text-primary" />
              Country / Region
            </label>
            <select
              id="gst-country"
              value={countryCode}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {Object.entries(GST_COUNTRIES).map(([key, c]) => (
                <option key={key} value={key}>{c.name} - {c.description}</option>
              ))}
            </select>
          </div>

          {/* Currency Select */}
          <div className="space-y-2">
            <label htmlFor="gst-currency" className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <Banknote className="w-4 h-4 text-primary" />
              Currency
            </label>
            <select
              id="gst-currency"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} - {c.label} ({c.symbol})</option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label htmlFor="gst-amount" className="flex items-center gap-1.5 text-sm font-medium">
              <Receipt className="w-4 h-4 text-primary" />
              <span>{mode === "exclusive" ? "Base Amount (excl. GST)" : "Total Amount (incl. GST)"}</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(amount, currency)}</span>
            </label>
            <input
              id="gst-amount"
              type="range"
              min={0}
              max={maxAmount}
              step={step}
              value={Math.min(amount, maxAmount)}
               onChange={(e) => setAmount(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={maxAmount}
              aria-valuenow={amount}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCompact(maxAmount, currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={amountDisplay}
              onChange={(e) => handleAmountInput(e.target.value)}
              onFocus={handleAmountFocus}
              onBlur={handleAmountBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter amount"
            />
          </div>

          {/* Mode Toggle */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <Calculator className="w-4 h-4 text-primary" />
              Calculation Mode
            </label>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setMode("exclusive")}
                className={cn(
                  "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
                  mode === "exclusive"
                    ? "bg-primary text-white"
                    : "bg-white text-muted-foreground hover:bg-muted",
                )}
              >
                Exclusive
              </button>
              <button
                type="button"
                onClick={() => setMode("inclusive")}
                className={cn(
                  "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
                  mode === "inclusive"
                    ? "bg-primary text-white"
                    : "bg-white text-muted-foreground hover:bg-muted",
                )}
              >
                Inclusive
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {mode === "exclusive"
                ? "GST is added to the base price."
                : "GST is extracted from the total price."}
            </p>
          </div>

          {/* GST Rate Slider + Presets */}
          <div className="space-y-3">
            <label htmlFor="gst-rate" className="flex items-center gap-1.5 text-sm font-medium">
              <Percent className="w-4 h-4 text-primary" />
              <span>GST Rate</span>
              <span className="ml-auto text-lg font-bold text-primary">{gstRate.toFixed(1)}%</span>
            </label>
            <input
              id="gst-rate"
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={gstRate}
               onChange={(e) => setGstRate(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={gstRate}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={gstRateDisplay}
                onChange={(e) => handleRateInput(e.target.value)}
                onFocus={handleRateFocus}
                onBlur={handleRateBlur}
                className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
                placeholder="Rate"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            {/* Preset Rate Chips */}
            {country && (
              <div className="flex flex-wrap gap-1.5">
                {country.rates.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handlePresetRate(rate)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-full border transition-colors",
                      gstRate === rate
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary",
                    )}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pie Chart */}
          {results.hasGst && (
            <div className="bg-white border border-border rounded-xl p-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                GST vs Base Breakdown
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
                        <Cell key={idx} fill={PIE_COLORS[idx]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<PieTooltip currency={currency} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 text-xs ml-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#f59e0b]" />
                    <span className="text-muted-foreground">GST ({results.effectiveRate.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#3b82f6]" />
                    <span className="text-muted-foreground">Base ({(100 - results.effectiveRate).toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Base Price</p>
                  <p className="text-sm font-semibold">{formatCurrency(results.baseAmount, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">GST Amount</p>
                  <p className="text-sm font-semibold text-amber-500">{formatCurrency(results.gstAmount, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Total Price</p>
                  <p className="text-sm font-semibold">{formatCurrency(results.totalAmount, currency)}</p>
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
              !results.hasGst
                ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200"
                : isHighGst
                  ? "bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200"
                  : "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20",
            )}
          >
            <div className="flex items-center gap-2 mb-3">
              <Calculator
                className={cn(
                  "w-5 h-5",
                  !results.hasGst ? "text-emerald-500" : isHighGst ? "text-amber-500" : "text-primary",
                )}
              />
              <p className="text-sm text-muted-foreground font-medium">
                {mode === "exclusive" ? "Total Amount (incl. GST)" : "Base Amount (excl. GST)"}
              </p>
            </div>
            <p
              className={cn(
                "text-4xl font-extrabold break-words",
                !results.hasGst
                  ? "text-emerald-500"
                  : isHighGst
                    ? "text-amber-500"
                    : "text-primary",
              )}
            >
              {formatCurrency(mode === "exclusive" ? results.totalAmount : results.baseAmount, currency)}
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              {results.hasGst ? (
                <>
                  <ArrowUpRight className={cn("w-4 h-4", isHighGst ? "text-amber-500" : "text-primary")} />
                  <span>
                    {results.effectiveRate.toFixed(1)}% effective GST rate
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">No GST applicable</span>
                </>
              )}
            </div>
          </div>

          {/* Mini Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <BadgePercent className="w-3 h-3 text-amber-500" />
                GST Amount
              </p>
              <p className="text-lg font-bold text-amber-500 break-words">
                {formatCurrency(results.gstAmount, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Banknote className="w-3 h-3 text-blue-500" />
                {mode === "exclusive" ? "Base Amount" : "Total Amount"}
              </p>
              <p className="text-lg font-bold text-blue-500 break-words">
                {formatCurrency(mode === "exclusive" ? results.baseAmount : results.totalAmount, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Percent className="w-3 h-3 text-primary" />
                GST Rate
              </p>
              <p className="text-lg font-bold text-primary break-words">
                {results.gstRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-purple-500" />
                Effective Rate
              </p>
              <p className="text-lg font-bold text-purple-500 break-words">
                {results.effectiveRate.toFixed(1)}%
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
                <span className="text-muted-foreground">
                  {mode === "exclusive" ? "Base Amount (excl. GST)" : "Total Amount (incl. GST)"}
                </span>
                <span className="font-medium">{formatCurrency(amount, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">GST Rate</span>
                <span className="font-medium">{results.gstRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">GST Amount</span>
                <span className={cn("font-medium", results.hasGst ? "text-amber-500" : "text-muted-foreground")}>
                  {results.hasGst ? "+" : ""}{formatCurrency(results.gstAmount, currency)}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-medium">
                  {mode === "exclusive" ? "Total (incl. GST)" : "Base (excl. GST)"}
                </span>
                <span className="font-bold text-primary">
                  {formatCurrency(mode === "exclusive" ? results.totalAmount : results.baseAmount, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </ToolLayout>
  );
}
