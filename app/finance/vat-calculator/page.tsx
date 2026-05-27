"use client";

import { useCallback, useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { ArrowUpRight, BadgePercent, Banknote, Calculator, CheckCircle, FileText, Globe, Percent, Receipt } from "lucide-react";
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
// VAT COUNTRY CONFIGURATIONS
// ===================================================================

interface VatCountry {
  name: string;
  code: string;
  rates: number[];
  defaultRate: number;
  description: string;
  defaultCurrency: CurrencyCode;
}

const VAT_COUNTRIES: Record<string, VatCountry> = {
  uk: {
    name: "United Kingdom",
    code: "uk",
    rates: [5, 20],
    defaultRate: 20,
    description: "Value Added Tax",
    defaultCurrency: "GBP",
  },
  "eu-standard": {
    name: "EU (Standard)",
    code: "eu-standard",
    rates: [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
    defaultRate: 20,
    description: "EU standard VAT reference",
    defaultCurrency: "EUR",
  },
  germany: {
    name: "Germany",
    code: "germany",
    rates: [7, 19],
    defaultRate: 19,
    description: "Mehrwertsteuer",
    defaultCurrency: "EUR",
  },
  france: {
    name: "France",
    code: "france",
    rates: [2.1, 5.5, 10, 20],
    defaultRate: 20,
    description: "Taxe sur la Valeur AjoutÃ©e",
    defaultCurrency: "EUR",
  },
  italy: {
    name: "Italy",
    code: "italy",
    rates: [4, 5, 10, 22],
    defaultRate: 22,
    description: "Imposta sul Valore Aggiunto",
    defaultCurrency: "EUR",
  },
  spain: {
    name: "Spain",
    code: "spain",
    rates: [4, 10, 21],
    defaultRate: 21,
    description: "Impuesto sobre el Valor AÃ±adido",
    defaultCurrency: "EUR",
  },
  netherlands: {
    name: "Netherlands",
    code: "netherlands",
    rates: [9, 21],
    defaultRate: 21,
    description: "Belasting over de Toegevoegde Waarde",
    defaultCurrency: "EUR",
  },
  sweden: {
    name: "Sweden",
    code: "sweden",
    rates: [6, 12, 25],
    defaultRate: 25,
    description: "MervÃ¤rdesskatt",
    defaultCurrency: "SEK",
  },
  denmark: {
    name: "Denmark",
    code: "denmark",
    rates: [25],
    defaultRate: 25,
    description: "MervÃ¦rdiafgift",
    defaultCurrency: "DKK",
  },
  norway: {
    name: "Norway",
    code: "norway",
    rates: [15, 25],
    defaultRate: 25,
    description: "Merverdiavgift",
    defaultCurrency: "NOK",
  },
  switzerland: {
    name: "Switzerland",
    code: "switzerland",
    rates: [2.6, 8.1],
    defaultRate: 8.1,
    description: "Mehrwertsteuer / TVA",
    defaultCurrency: "CHF",
  },
  poland: {
    name: "Poland",
    code: "poland",
    rates: [5, 8, 23],
    defaultRate: 23,
    description: "Podatek od TowarÃ³w i UsÅ‚ug",
    defaultCurrency: "PLN",
  },
  turkey: {
    name: "Turkey",
    code: "turkey",
    rates: [1, 8, 20],
    defaultRate: 20,
    description: "Katma DeÄŸer Vergisi",
    defaultCurrency: "TRY",
  },
  uae: {
    name: "UAE",
    code: "uae",
    rates: [5],
    defaultRate: 5,
    description: "Value Added Tax",
    defaultCurrency: "AED",
  },
  saudiarabia: {
    name: "Saudi Arabia",
    code: "saudiarabia",
    rates: [15],
    defaultRate: 15,
    description: "Value Added Tax",
    defaultCurrency: "SAR",
  },
  southafrica: {
    name: "South Africa",
    code: "southafrica",
    rates: [15],
    defaultRate: 15,
    description: "Value Added Tax",
    defaultCurrency: "ZAR",
  },
  newzealand: {
    name: "New Zealand",
    code: "newzealand",
    rates: [15],
    defaultRate: 15,
    description: "Goods and Services Tax",
    defaultCurrency: "NZD",
  },
  australia: {
    name: "Australia",
    code: "australia",
    rates: [10],
    defaultRate: 10,
    description: "Goods and Services Tax",
    defaultCurrency: "AUD",
  },
  canada: {
    name: "Canada",
    code: "canada",
    rates: [5, 13, 15],
    defaultRate: 13,
    description: "GST / HST",
    defaultCurrency: "CAD",
  },
  japan: {
    name: "Japan",
    code: "japan",
    rates: [8, 10],
    defaultRate: 10,
    description: "Consumption Tax",
    defaultCurrency: "JPY",
  },
};

// ===================================================================
// CONSTANTS
// ===================================================================

const PIE_COLORS = ["#14b8a6", "#6366f1"];

const RELATED_TOOLS = [
  { name: "GST Calculator", href: "/finance/gst-calculator", desc: "Calculate Goods and Services Tax for India, Canada, Australia, and more." },
  { name: "Income Tax Calculator", href: "/finance/income-tax-calculator", desc: "Estimate your annual income tax with multiple country regimes." },
  { name: "Capital Gains Tax Calculator", href: "/finance/capital-gains-tax-calculator", desc: "Calculate tax on profits from investments and asset sales." },
  { name: "Profit Margin Calculator", href: "/finance/profit-margin-calculator", desc: "Calculate gross and net profit margins on products." },
];

// ===================================================================
// TYPES
// ===================================================================

type CalculationMode = "exclusive" | "inclusive";

interface VatResults {
  baseAmount: number;
  vatAmount: number;
  totalAmount: number;
  vatRate: number;
  mode: CalculationMode;
  effectiveRate: number;
  vatRatio: number;
  hasVat: boolean;
}

// ===================================================================
// CALCULATION ENGINE
// ===================================================================

const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

function calculateVat(amount: number, vatRate: number, mode: CalculationMode): VatResults {
  const a = clamp(Number.isFinite(amount) ? Math.max(0, amount) : 0, 0, 1_000_000_000);
  const r = clamp(Number.isFinite(vatRate) ? Math.max(0, vatRate) : 0, 0, 100);

  let baseAmount: number;
  let vatAmount: number;
  let totalAmount: number;

  if (mode === "exclusive") {
    baseAmount = a;
    vatAmount = baseAmount * (r / 100);
    totalAmount = baseAmount + vatAmount;
  } else {
    totalAmount = a;
    baseAmount = r === 100 ? totalAmount / 2 : totalAmount / (1 + r / 100);
    vatAmount = totalAmount - baseAmount;
  }

  return {
    baseAmount,
    vatAmount,
    totalAmount,
    vatRate: r,
    mode,
    effectiveRate: baseAmount > 0 ? (vatAmount / baseAmount) * 100 : 0,
    vatRatio: totalAmount > 0 ? (vatAmount / totalAmount) * 100 : 0,
    hasVat: vatAmount > 0.005,
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

export default function VatCalculator() {
  const [countryCode, setCountryCode] = useState("uk");
  const [currency, setCurrency] = useState<CurrencyCode>("GBP");
  const { value: amount, displayValue: amountDisplay, setValue: setAmount, handleChange: handleAmountInput, handleFocus: handleAmountFocus, handleBlur: handleAmountBlur } = useNumericField(10000);
  const { value: vatRate, displayValue: vatRateDisplay, setValue: setVatRate, handleChange: handleRateInput, handleFocus: handleRateFocus, handleBlur: handleRateBlur } = useNumericField(20);
  const [mode, setMode] = useState<CalculationMode>("exclusive");

  const country = VAT_COUNTRIES[countryCode];
  const maxAmount = useMemo(() => getMaxAmount(currency), [currency]);
  const step = useMemo(() => getSliderStep(currency), [currency]);

  const results = useMemo<VatResults>(
    () => calculateVat(amount, vatRate, mode),
    [amount, vatRate, mode],
  );

  const pieData = useMemo(
    () => [
      { name: "VAT Amount", value: results.vatAmount },
      { name: "Base Amount", value: results.baseAmount },
    ],
    [results.vatAmount, results.baseAmount],
  );

  const isHighVat = results.effectiveRate >= 20;

  // --- Handlers ---

  const handleCountryChange = useCallback((val: string) => {
    setCountryCode(val);
    const c = VAT_COUNTRIES[val];
    if (c) {
      setVatRate(c.defaultRate);
      setCurrency(c.defaultCurrency);
    }
  }, []);

  const handleCurrencyChange = useCallback((val: string) => {
    setCurrency(val as CurrencyCode);
  }, []);



  const handlePresetRate = useCallback((rate: number) => {
    setVatRate(rate);
  }, []);

  return (
    <ToolLayout
      title="VAT Calculator"
      description="Calculate Value Added Tax (VAT) for 20+ European and global countries with real-time charts, multiple tax rates, and currency formatting."
      category="finance"
      faqContent={[
        {
          question: "What is VAT and how is it calculated?",
          answer: "VAT (Value Added Tax) is a consumption tax applied to goods and services at each stage of the supply chain. It is calculated as a percentage of the transaction value. In exclusive mode, VAT is added to the net price: Total = Net × (1 + Rate/100). In inclusive mode, VAT is already embedded in the gross price: Net = Gross / (1 + Rate/100) and VAT = Gross - Net.",
        },
        {
          question: "What is the difference between exclusive and inclusive VAT?",
          answer: "Exclusive VAT means the displayed price does not include tax - VAT is calculated and added at checkout. This is common in B2B transactions and invoicing. Inclusive VAT means the displayed price already includes the tax - the VAT portion is embedded within the price. This is the standard for consumer-facing retail prices across the EU and UK.",
        },
        {
          question: "What are the standard VAT rates across Europe?",
          answer: "EU member states set their own VAT rates within EU guidelines. The minimum standard rate is 15%. Current standard rates: UK 20%, Germany 19%, France 20%, Italy 22%, Spain 21%, Netherlands 21%, Sweden 25%, Denmark 25%, Poland 23%, Norway 25%. Reduced rates (typically 5-10%) apply to essential goods like food, children's clothing, and books.",
        },
        {
          question: "Who needs to register for VAT?",
          answer: "VAT registration thresholds vary by country. In the UK, businesses with turnover above Â£90,000 must register. In the EU, thresholds range from €10,000 (Luxembourg) to €50,000+ for other member states. Non-resident businesses supplying goods or services may also need to register. The VAT MOSS (Mini One-Stop Shop) scheme simplifies registration for digital services across the EU.",
        },
        {
          question: "How does reverse charge VAT work?",
          answer: "Reverse charge VAT shifts the responsibility for reporting VAT from the seller to the buyer. Instead of the supplier charging and remitting VAT, the buyer self-accounts for the VAT. This is commonly used for cross-border B2B services within the EU, construction services, and certain high-value goods. It prevents VAT fraud and simplifies cross-border trade.",
        },
        {
          question: "Can I reclaim VAT paid on business expenses?",
          answer: "Yes, VAT-registered businesses can reclaim VAT paid on business-related purchases (input VAT) by offsetting it against the VAT they collect from customers (output VAT). If input VAT exceeds output VAT, the business can claim a refund. Specific rules apply to partially exempt businesses, cars, entertainment, and other restricted items.",
        },
        {
          question: "What VAT rate applies to digital services in the EU?",
          answer: "Digital services sold to EU consumers are taxed at the VAT rate of the consumer's country (destination principle), not the seller's country. Since 2015, the VAT MOSS scheme allows businesses to declare and pay VAT through a single portal. The rate varies by country - for example, ebooks and online courses may qualify for reduced rates in some member states.",
        },
        {
          question: "How do I handle VAT on imports and exports?",
          answer: "Goods imported into the EU or UK are subject to import VAT, typically paid at customs clearance. For B2B exports outside the EU, VAT is generally zero-rated. For B2B goods moving between EU countries, the supply is often zero-rated if the buyer provides a valid VAT number. For B2C cross-border sales, the distance selling threshold or Import One-Stop Shop (IOSS) may apply.",
        },
        {
          question: "What is the difference between VAT and sales tax?",
          answer: "VAT is collected at every stage of the supply chain - each business charges VAT and reclaims input VAT, with the final consumer bearing the cost. Sales tax (used in the US) is collected only at the point of final sale to the consumer. VAT is embedded in B2B transactions with input credits, while sales tax is a single-stage tax on the end consumer with no intermediate credits.",
        },
        {
          question: "How does the UK post-Brexit VAT system work?",
          answer: "Since Brexit, the UK operates its own VAT system independent of the EU. Goods moving between Great Britain and EU countries are treated as imports/exports. The UK retained VAT rates (20% standard, 5% reduced) and similar rules but removed the EU distance selling threshold. Northern Ireland remains aligned with EU VAT rules for goods under the Northern Ireland Protocol.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a VAT Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A VAT (Value Added Tax) calculator is a financial tool that helps individuals and businesses compute the
              tax component on transactions. It supports both <strong>exclusive</strong> (adding tax on top) and{" "}
              <strong>inclusive</strong> (extracting tax from total) calculations across 20+ countries with their
              specific VAT rates and currencies. Whether you are invoicing a client, pricing products, or filing a
              VAT return, this tool provides instant and accurate results.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p><strong>Exclusive VAT</strong> (Tax added to net price):</p>
              <p className="pl-4">VAT Amount = Net Price × (VAT Rate ÷ 100)</p>
              <p className="pl-4">Gross Price = Net Price + VAT Amount</p>
              <br />
              <p><strong>Inclusive VAT</strong> (Tax included in gross price):</p>
              <p className="pl-4">Net Price = Gross Price ÷ (1 + VAT Rate ÷ 100)</p>
              <p className="pl-4">VAT Amount = Gross Price - Net Price</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Benefits of Using This Calculator</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              <li><strong>European &amp; Global Coverage:</strong> Pre-configured VAT rates for the UK, all major EU countries, Norway, Switzerland, Turkey, UAE, Saudi Arabia, and more.</li>
              <li><strong>Multi-Currency:</strong> Display results in 28+ currencies with proper locale-aware formatting - ideal for international businesses trading across borders.</li>
              <li><strong>Dual Calculation Modes:</strong> Switch between exclusive (add VAT) and inclusive (extract VAT) to handle any pricing or invoicing scenario.</li>
              <li><strong>Real-Time Pie Chart:</strong> Visual breakdown of VAT vs Net Amount updates instantly as you adjust sliders or type values.</li>
              <li><strong>Preset Rate Chips:</strong> Quick-select buttons for your selected country&apos;s standard and reduced VAT rates.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Scenario: You have a net price of Â£500 with 20% UK VAT (exclusive).</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>VAT Amount = Â£500 × (20 ÷ 100) = <strong>Â£100</strong></li>
                <li>Gross Price = Â£500 + Â£100 = <strong>Â£600</strong></li>
                <li>Effective Tax Rate: 20%</li>
              </ul>
              <p className="font-medium text-foreground mt-3 mb-2">Reverse Scenario: You paid Â£600 inclusive of 20% UK VAT.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Net Price = Â£600 ÷ (1 + 20 ÷ 100) = <strong>Â£500</strong></li>
                <li>VAT Amount = Â£600 - Â£500 = <strong>Â£100</strong></li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Common Mistakes to Avoid</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed text-muted-foreground">
              <li>Applying the wrong VAT rate for mixed-supply invoices - different products and services may have different rates.</li>
              <li>Confusing exclusive vs inclusive pricing when sending quotes to clients in different countries.</li>
              <li>Forgetting to register for VAT in the customer&apos;s country when selling digital services across EU borders.</li>
              <li>Not separating VAT from transaction amounts when calculating profit margins and break-even points.</li>
              <li>Misapplying the reverse charge mechanism on cross-border B2B transactions within the EU.</li>
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
            <label htmlFor="vat-country" className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <Globe className="w-4 h-4 text-primary" />
              Country / Region
            </label>
            <select
              id="vat-country"
              value={countryCode}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {Object.entries(VAT_COUNTRIES).map(([key, c]) => (
                <option key={key} value={key}>{c.name} - {c.description}</option>
              ))}
            </select>
          </div>

          {/* Currency Select */}
          <div className="space-y-2">
            <label htmlFor="vat-currency" className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <Banknote className="w-4 h-4 text-primary" />
              Currency
            </label>
            <select
              id="vat-currency"
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
            <label htmlFor="vat-amount" className="flex items-center gap-1.5 text-sm font-medium">
              <Receipt className="w-4 h-4 text-primary" />
              <span>{mode === "exclusive" ? "Net Price (excl. VAT)" : "Gross Price (incl. VAT)"}</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(amount, currency)}</span>
            </label>
            <input
              id="vat-amount"
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
                ? "VAT is added to the net price."
                : "VAT is extracted from the gross price."}
            </p>
          </div>

          {/* VAT Rate Slider + Presets */}
          <div className="space-y-3">
            <label htmlFor="vat-rate" className="flex items-center gap-1.5 text-sm font-medium">
              <Percent className="w-4 h-4 text-primary" />
              <span>VAT Rate</span>
              <span className="ml-auto text-lg font-bold text-primary">{vatRate.toFixed(1)}%</span>
            </label>
            <input
              id="vat-rate"
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={vatRate}
              onChange={(e) => setVatRate(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={vatRate}
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
                value={vatRateDisplay}
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
                      vatRate === rate
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
          {results.hasVat && (
            <div className="bg-white border border-border rounded-xl p-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                VAT vs Net Breakdown
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
                    <div className="w-3 h-3 rounded-sm bg-[#14b8a6]" />
                    <span className="text-muted-foreground">VAT ({results.effectiveRate.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#6366f1]" />
                    <span className="text-muted-foreground">Net ({(100 - results.effectiveRate).toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Net Price</p>
                  <p className="text-sm font-semibold">{formatCurrency(results.baseAmount, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">VAT Amount</p>
                  <p className="text-sm font-semibold text-amber-500">{formatCurrency(results.vatAmount, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Gross Price</p>
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
              !results.hasVat
                ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200"
                : isHighVat
                  ? "bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200"
                  : "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20",
            )}
          >
            <div className="flex items-center gap-2 mb-3">
              <Calculator
                className={cn(
                  "w-5 h-5",
                  !results.hasVat ? "text-emerald-500" : isHighVat ? "text-amber-500" : "text-primary",
                )}
              />
              <p className="text-sm text-muted-foreground font-medium">
                {mode === "exclusive" ? "Gross Price (incl. VAT)" : "Net Price (excl. VAT)"}
              </p>
            </div>
            <p
              className={cn(
                "text-4xl font-extrabold break-words",
                !results.hasVat
                  ? "text-emerald-500"
                  : isHighVat
                    ? "text-amber-500"
                    : "text-primary",
              )}
            >
              {formatCurrency(mode === "exclusive" ? results.totalAmount : results.baseAmount, currency)}
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              {results.hasVat ? (
                <>
                  <ArrowUpRight className={cn("w-4 h-4", isHighVat ? "text-amber-500" : "text-primary")} />
                  <span>
                    {results.effectiveRate.toFixed(1)}% effective VAT rate
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">No VAT applicable</span>
                </>
              )}
            </div>
          </div>

          {/* Mini Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <BadgePercent className="w-3 h-3 text-teal-500" />
                VAT Amount
              </p>
              <p className="text-lg font-bold text-teal-500 break-words">
                {formatCurrency(results.vatAmount, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Banknote className="w-3 h-3 text-indigo-500" />
                {mode === "exclusive" ? "Net Price" : "Gross Price"}
              </p>
              <p className="text-lg font-bold text-indigo-500 break-words">
                {formatCurrency(mode === "exclusive" ? results.baseAmount : results.totalAmount, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Percent className="w-3 h-3 text-primary" />
                VAT Rate
              </p>
              <p className="text-lg font-bold text-primary break-words">
                {results.vatRate.toFixed(1)}%
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
                  {mode === "exclusive" ? "Net Price (excl. VAT)" : "Gross Price (incl. VAT)"}
                </span>
                <span className="font-medium">{formatCurrency(amount, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">VAT Rate</span>
                <span className="font-medium">{results.vatRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">VAT Amount</span>
                <span className={cn("font-medium", results.hasVat ? "text-teal-500" : "text-muted-foreground")}>
                  {results.hasVat ? "+" : ""}{formatCurrency(results.vatAmount, currency)}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-medium">
                  {mode === "exclusive" ? "Gross (incl. VAT)" : "Net (excl. VAT)"}
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
