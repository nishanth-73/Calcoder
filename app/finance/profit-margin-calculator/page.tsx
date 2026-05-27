"use client";

import { useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { ArrowUpRight, BadgePercent, Banknote, Calculator, FileText, TrendingUp, TrendingDown, Wallet, Receipt, Tags } from "lucide-react";
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

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6"];

const RELATED_TOOLS = [
  { name: "ROI Calculator", href: "/finance/roi-calculator", desc: "Calculate return on investment percentage for any asset." },
  { name: "Break-Even Calculator", href: "/finance/break-even-calculator", desc: "Calculate break-even point for products and services." },
  { name: "Revenue Growth Calculator", href: "/finance/revenue-growth-calculator", desc: "Calculate revenue growth rate over multiple periods." },
  { name: "Crypto Profit Calculator", href: "/finance/crypto-profit-calculator", desc: "Calculate crypto trading profit and loss with fees." },
];

// ===================================================================
// TYPES
// ===================================================================

interface MarginResults {
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  taxRate: number;
  grossProfit: number;
  grossMargin: number;
  operatingProfit: number;
  operatingMargin: number;
  netProfit: number;
  netMargin: number;
  markup: number;
  totalCosts: number;
  taxAmount: number;
  costRatio: number;
  isProfitable: boolean;
  hasRevenue: boolean;
}

// ===================================================================
// CALCULATION ENGINE
// ===================================================================

const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

function calculateMargin(
  revenue: number,
  cogs: number,
  operatingExpenses: number,
  taxRate: number,
): MarginResults {
  const rev = clamp(Number.isFinite(revenue) ? Math.max(0, revenue) : 0, 0, 1e9);
  const c = clamp(Number.isFinite(cogs) ? Math.max(0, cogs) : 0, 0, 1e9);
  const oe = clamp(Number.isFinite(operatingExpenses) ? Math.max(0, operatingExpenses) : 0, 0, 1e9);
  const tr = clamp(Number.isFinite(taxRate) ? Math.max(0, taxRate) : 0, 0, 100);

  const grossProfit = rev - c;
  const grossMargin = rev > 0 ? (grossProfit / rev) * 100 : 0;
  const operatingProfit = grossProfit - oe;
  const operatingMargin = rev > 0 ? (operatingProfit / rev) * 100 : 0;
  const taxAmount = operatingProfit > 0 ? operatingProfit * (tr / 100) : 0;
  const netProfit = operatingProfit - taxAmount;
  const netMargin = rev > 0 ? (netProfit / rev) * 100 : 0;
  const markup = c > 0 ? (grossProfit / c) * 100 : 0;
  const totalCosts = c + oe + taxAmount;

  return {
    revenue: rev,
    cogs: c,
    operatingExpenses: oe,
    taxRate: tr,
    grossProfit,
    grossMargin,
    operatingProfit,
    operatingMargin,
    netProfit,
    netMargin,
    markup,
    totalCosts,
    taxAmount,
    costRatio: rev > 0 ? (totalCosts / rev) * 100 : 0,
    isProfitable: netProfit > 0.005,
    hasRevenue: rev > 0,
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

export default function ProfitMarginCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const { value: revenue, displayValue: revenueDisplay, setValue: setRevenue, handleChange: handleRevenueInput, handleFocus: handleRevenueFocus, handleBlur: handleRevenueBlur } = useNumericField(50000);
  const { value: cogs, displayValue: cogsDisplay, setValue: setCogs, handleChange: handleCogsInput, handleFocus: handleCogsFocus, handleBlur: handleCogsBlur } = useNumericField(30000);
  const { value: operatingExpenses, displayValue: operatingExpensesDisplay, setValue: setOperatingExpenses, handleChange: handleExpensesInput, handleFocus: handleExpensesFocus, handleBlur: handleExpensesBlur } = useNumericField(10000);
  const { value: taxRate, displayValue: taxRateDisplay, setValue: setTaxRate, handleChange: handleTaxInput, handleFocus: handleTaxFocus, handleBlur: handleTaxBlur } = useNumericField(15);

  const results = useMemo<MarginResults>(
    () => calculateMargin(revenue, cogs, operatingExpenses, taxRate),
    [revenue, cogs, operatingExpenses, taxRate],
  );

  const pieData = useMemo(() => {
    if (!results.hasRevenue) return [];
    const segments: { name: string; value: number }[] = [];
    if (results.cogs > 0.005) segments.push({ name: "COGS", value: results.cogs });
    if (results.operatingExpenses > 0.005) segments.push({ name: "Operating Expenses", value: results.operatingExpenses });
    if (results.taxAmount > 0.005) segments.push({ name: "Taxes", value: results.taxAmount });
    if (results.netProfit > 0.005) segments.push({ name: "Net Profit", value: results.netProfit });
    return segments;
  }, [results.cogs, results.operatingExpenses, results.taxAmount, results.netProfit, results.hasRevenue]);

  const showPie = pieData.length > 1;

  // --- Handlers ---

  const handleCurrencyChange = (val: string) => {
    setCurrency(val as CurrencyCode);
  };

  return (
    <ToolLayout
      title="Profit Margin Calculator"
      description="Calculate gross profit margin, operating margin, and net profit margin for your products and business - with real-time charts and 29-currency support."
      category="finance"
      faqContent={[
        {
          question: "How is profit margin calculated?",
          answer: "Profit margin is calculated as: (Profit ÷ Revenue) × 100. Gross Margin = (Revenue - COGS) ÷ Revenue × 100. Operating Margin = (Gross Profit - Operating Expenses) ÷ Revenue × 100. Net Margin = Net Profit ÷ Revenue × 100. Each margin level shows how much of your revenue is retained after deducting progressively more costs.",
        },
        {
          question: "What is the difference between gross margin and net margin?",
          answer: "Gross margin deducts only direct production costs (COGS), showing how efficiently you produce goods. Net margin deducts all costs - COGS, operating expenses, interest, and taxes - showing your true bottom-line profitability. A healthy gross margin with a thin net margin indicates high operating overhead, which may need cost optimization.",
        },
        {
          question: "What is a good profit margin?",
          answer: "Profit margins vary significantly by industry. Retail: 2-5% net margin. Restaurants: 3-8%. SaaS: 70-80% gross, 15-25% net. Consulting: 15-20% net. Manufacturing: 5-10% net. A good rule of thumb: gross margin above 50% and net margin above 10% is generally healthy. Compare against industry benchmarks rather than absolute numbers.",
        },
        {
          question: "What is the difference between markup and margin?",
          answer: "Markup is calculated as a percentage of cost: (Profit ÷ COGS) × 100. Margin is calculated as a percentage of revenue: (Profit ÷ Revenue) × 100. For example, a 50% markup on $100 cost = $150 selling price, which is only a 33% margin. A 50% margin means the selling price is $200 - twice the cost. Markup always gives a higher percentage than margin for the same profit.",
        },
        {
          question: "How do operating expenses affect profit margin?",
          answer: "Operating expenses (rent, salaries, marketing, utilities) directly reduce your operating margin. Even with a strong gross margin, high operating expenses can wipe out profitability. For example, a 60% gross margin with 50% operating expenses leaves only a 10% operating margin. Reducing operating expenses is one of the fastest ways to improve net margin.",
        },
        {
          question: "How does tax rate affect net profit margin?",
          answer: "Taxes are calculated on operating profit and directly reduce net profit. For example, with a $20,000 operating profit and 25% tax rate: taxes = $5,000, reducing net profit to $15,000. A higher tax rate compresses net margin. Tax planning strategies like deductions, credits, and entity structuring can help minimize the tax impact on profitability.",
        },
        {
          question: "What is the difference between COGS and operating expenses?",
          answer: "COGS (Cost of Goods Sold) are direct costs tied to production: raw materials, direct labor, manufacturing overhead. Operating expenses are indirect costs: rent, salaries, marketing, utilities, R&D, depreciation. COGS varies with production volume; operating expenses are often fixed. This distinction is critical for gross vs operating margin analysis.",
        },
        {
          question: "How can I improve my profit margins?",
          answer: "To improve margins: (1) Raise prices - even a 5% increase can boost net margin by 20-50% if volume stays stable. (2) Reduce COGS through better supplier deals or bulk purchasing. (3) Automate processes to reduce labor costs. (4) Increase operational efficiency. (5) Focus on high-margin products. (6) Reduce customer acquisition costs through organic marketing.",
        },
        {
          question: "What is the break-even revenue for a given margin?",
          answer: "Break-even revenue is the minimum revenue needed to cover all costs. It is calculated as: Total Fixed Costs ÷ (1 - Variable Cost % of Revenue). With a 40% gross margin, if fixed costs are $50,000, break-even revenue = $50,000 ÷ 40% = $125,000. Use this calculator to find your margin, then calculate break-even separately.",
        },
        {
          question: "How do I calculate margin for a single product vs a business?",
          answer: "For a single product: enter the selling price as revenue and the unit cost as COGS, with zero operating expenses and tax. For a business: enter total revenue, total COGS across all products, all operating expenses, and your effective tax rate. This calculator works for both scenarios - just adjust which fields you include.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a Profit Margin Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A Profit Margin Calculator helps business owners, entrepreneurs, and analysts measure the profitability
              of products and businesses. By entering your <strong>revenue</strong>, <strong>cost of goods sold</strong>,
              <strong> operating expenses</strong>, and <strong>tax rate</strong>, you get an instant breakdown of
              gross margin, operating margin, net margin, and markup percentage. This tool supports 29+ currencies.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p>Gross Profit = Revenue - COGS</p>
              <p>Gross Margin = (Gross Profit ÷ Revenue) × 100</p>
              <p>Operating Profit = Gross Profit - Operating Expenses</p>
              <p>Operating Margin = (Operating Profit ÷ Revenue) × 100</p>
              <p>Tax Amount = Operating Profit × (Tax Rate ÷ 100)</p>
              <p>Net Profit = Operating Profit - Tax Amount</p>
              <p><strong>Net Margin = (Net Profit ÷ Revenue) × 100</strong></p>
              <p>Markup = (Gross Profit ÷ COGS) × 100</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Benefits of Using This Calculator</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              <li><strong>Three Margin Levels:</strong> See gross, operating, and net margins at a glance - understand your full cost structure.</li>
              <li><strong>Markup Conversion:</strong> Automatically see the markup percentage alongside margin percentages.</li>
              <li><strong>Cost Breakdown:</strong> Visualize how COGS, operating expenses, and taxes consume your revenue.</li>
              <li><strong>Tax-Aware:</strong> Account for corporate or personal tax rates to get true net profitability.</li>
              <li><strong>Global Currencies:</strong> Supports 29+ currencies with proper locale-aware formatting.</li>
              <li><strong>Revenue Pie Chart:</strong> See the proportion of each cost category vs net profit in real time.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Scenario: A business has $50,000 revenue, $30,000 COGS, $10,000 operating expenses, and a 15% tax rate.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Gross Profit = $50,000 - $30,000 = <strong>$20,000</strong></li>
                <li>Gross Margin = ($20,000 ÷ $50,000) × 100 = <strong>40%</strong></li>
                <li>Operating Profit = $20,000 - $10,000 = <strong>$10,000</strong></li>
                <li>Tax Amount = $10,000 × 15% = <strong>$1,500</strong></li>
                <li>Net Profit = $10,000 - $1,500 = <strong>$8,500</strong></li>
                <li><strong>Net Margin = ($8,500 ÷ $50,000) × 100 = 17%</strong></li>
                <li>Markup = ($20,000 ÷ $30,000) × 100 = <strong>66.67%</strong></li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Common Mistakes to Avoid</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed text-muted-foreground">
              <li>Confusing markup with margin - a 50% markup equals only a 33% margin. Know the difference when setting prices.</li>
              <li>Forgetting to include all operating expenses - many businesses overlook indirect costs like insurance, software, and maintenance.</li>
              <li>Ignoring taxes when calculating net margin - net profit should always be after tax for accurate business analysis.</li>
              <li>Comparing margins across different industries without context - a 5% net margin is excellent for grocery but poor for software.</li>
              <li>Using margin alone without considering volume - high margin but low volume may not sustain the business.</li>
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
            <label htmlFor="margin-currency" className="flex items-center gap-1.5 text-sm font-medium mb-1">
              <Banknote className="w-4 h-4 text-primary" />
              Currency
            </label>
            <select
              id="margin-currency"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} - {c.label} ({c.symbol})</option>
              ))}
            </select>
          </div>

          {/* Revenue */}
          <div className="space-y-2">
            <label htmlFor="margin-revenue" className="flex items-center gap-1.5 text-sm font-medium">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Revenue</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(revenue, currency)}</span>
            </label>
            <input
              id="margin-revenue"
              type="range"
              min={0}
              max={getMaxAmount(currency)}
              step={getSliderStep(currency)}
              value={Math.min(revenue, getMaxAmount(currency))}
               onChange={(e) => setRevenue(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={getMaxAmount(currency)}
              aria-valuenow={revenue}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCompact(getMaxAmount(currency), currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={revenueDisplay}
              onChange={(e) => handleRevenueInput(e.target.value)}
              onFocus={handleRevenueFocus}
              onBlur={handleRevenueBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter total revenue"
            />
          </div>

          {/* COGS */}
          <div className="space-y-2">
            <label htmlFor="margin-cogs" className="flex items-center gap-1.5 text-sm font-medium">
              <Receipt className="w-4 h-4 text-primary" />
              <span>Cost of Goods Sold (COGS)</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(cogs, currency)}</span>
            </label>
            <input
              id="margin-cogs"
              type="range"
              min={0}
              max={getMaxAmount(currency)}
              step={getSliderStep(currency)}
              value={Math.min(cogs, getMaxAmount(currency))}
               onChange={(e) => setCogs(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={getMaxAmount(currency)}
              aria-valuenow={cogs}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCompact(getMaxAmount(currency), currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={cogsDisplay}
              onChange={(e) => handleCogsInput(e.target.value)}
              onFocus={handleCogsFocus}
              onBlur={handleCogsBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter cost of goods sold"
            />
          </div>

          {/* Operating Expenses */}
          <div className="space-y-2">
            <label htmlFor="margin-expenses" className="flex items-center gap-1.5 text-sm font-medium">
              <Tags className="w-4 h-4 text-primary" />
              <span>Operating Expenses</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(operatingExpenses, currency)}</span>
            </label>
            <input
              id="margin-expenses"
              type="range"
              min={0}
              max={getMaxAmount(currency)}
              step={getSliderStep(currency)}
              value={Math.min(operatingExpenses, getMaxAmount(currency))}
               onChange={(e) => setOperatingExpenses(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={getMaxAmount(currency)}
              aria-valuenow={operatingExpenses}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCompact(getMaxAmount(currency), currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={operatingExpensesDisplay}
              onChange={(e) => handleExpensesInput(e.target.value)}
              onFocus={handleExpensesFocus}
              onBlur={handleExpensesBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter operating expenses"
            />
          </div>

          {/* Tax Rate */}
          <div className="space-y-2">
            <label htmlFor="margin-tax" className="flex items-center gap-1.5 text-sm font-medium">
              <BadgePercent className="w-4 h-4 text-primary" />
              <span>Tax Rate</span>
              <span className="ml-auto text-lg font-bold text-primary">{taxRate.toFixed(1)}%</span>
            </label>
            <input
              id="margin-tax"
              type="range"
              min={0}
              max={50}
              step={0.5}
              value={Math.min(taxRate, 50)}
               onChange={(e) => setTaxRate(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={50}
              aria-valuenow={taxRate}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={taxRateDisplay}
              onChange={(e) => handleTaxInput(e.target.value)}
              onFocus={handleTaxFocus}
              onBlur={handleTaxBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter tax rate %"
            />
          </div>

          {/* Pie Chart */}
          {showPie && (
            <div className="bg-white border border-border rounded-xl p-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Revenue Breakdown
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
                  {pieData.map((d, idx) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground">
                        {d.name} ({((d.value / results.revenue) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Revenue</p>
                  <p className="text-sm font-semibold">{formatCurrency(results.revenue, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Profit</p>
                  <p className="text-sm font-semibold text-emerald-500">{formatCurrency(results.netProfit, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Margin</p>
                  <p className="text-sm font-semibold">{results.netMargin.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Cost Ratio */}
          {results.hasRevenue && (
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Cost-to-Revenue Ratio
              </p>
              <p className="text-2xl font-bold text-primary">
                {results.costRatio.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {results.costRatio.toFixed(1)}% of revenue goes to all costs combined;
                {results.isProfitable ? ` ${(100 - results.costRatio).toFixed(1)}% remains as net profit` : " no profit remains after costs"}
              </p>
            </div>
          )}
        </div>

        {/* ============ RIGHT: RESULTS ============ */}
        <div className="space-y-4">
          {/* Hero Card */}
          <div
            className={cn(
              "rounded-xl p-6 border",
              results.isProfitable
                ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200"
                : "bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200",
            )}
          >
            <div className="flex items-center gap-2 mb-3">
              {results.isProfitable ? (
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-orange-500" />
              )}
              <p className="text-sm text-muted-foreground font-medium">
                Net Profit After Tax
              </p>
            </div>
            <p
              className={cn(
                "text-4xl font-extrabold break-words",
                results.isProfitable ? "text-emerald-500" : "text-orange-500",
              )}
            >
              {formatCurrency(results.netProfit, currency)}
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <BadgePercent className="w-4 h-4 text-emerald-500" />
              <span className={results.isProfitable ? "text-emerald-600 font-medium" : "text-orange-600 font-medium"}>
                Net Margin: {results.netMargin.toFixed(2)}%
              </span>
              <span>· Gross: {results.grossMargin.toFixed(2)}%</span>
            </div>
          </div>

          {/* Margin Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-border rounded-xl p-3 text-center min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1">Gross Margin</p>
              <p className={cn("text-lg font-bold break-words", results.grossMargin >= 40 ? "text-emerald-500" : results.grossMargin >= 20 ? "text-amber-500" : "text-red-500")}>
                {results.grossMargin.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-3 text-center min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1">Operating Margin</p>
              <p className={cn("text-lg font-bold break-words", results.operatingMargin >= 20 ? "text-emerald-500" : results.operatingMargin >= 10 ? "text-amber-500" : results.operatingMargin > 0 ? "text-orange-500" : "text-red-500")}>
                {results.operatingMargin.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-3 text-center min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1">Net Margin</p>
              <p className={cn("text-lg font-bold break-words", results.netMargin >= 10 ? "text-emerald-500" : results.netMargin > 0 ? "text-amber-500" : "text-red-500")}>
                {results.netMargin.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Mini Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Wallet className="w-3 h-3 text-blue-500" />
                Gross Profit
              </p>
              <p className="text-lg font-bold text-blue-500 break-words">
                {formatCurrency(results.grossProfit, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <BadgePercent className="w-3 h-3 text-indigo-500" />
                Markup
              </p>
              <p className="text-lg font-bold text-indigo-500 break-words">
                {results.markup.toFixed(2)}%
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Receipt className="w-3 h-3 text-amber-500" />
                Operating Profit
              </p>
              <p className={cn("text-lg font-bold break-words", results.operatingProfit < 0 ? "text-red-500" : "text-amber-500")}>
                {results.operatingProfit >= 0 ? "" : "-"}{formatCurrency(Math.abs(results.operatingProfit), currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Calculator className="w-3 h-3 text-rose-500" />
                Taxes Paid
              </p>
              <p className="text-lg font-bold text-rose-500 break-words">
                {formatCurrency(results.taxAmount, currency)}
              </p>
            </div>
          </div>

          {/* Summary Breakdown */}
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Profit &amp; Loss Breakdown
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Revenue</span>
                <span className="font-medium">{formatCurrency(results.revenue, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">COGS</span>
                <span className="font-medium text-amber-500">-{formatCurrency(results.cogs, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground font-medium">Gross Profit</span>
                <span className="font-semibold text-blue-500">{formatCurrency(results.grossProfit, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground pl-3">Gross Margin</span>
                <span className="font-medium">{results.grossMargin.toFixed(2)}%</span>
              </div>
              {results.operatingExpenses > 0 && (
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Operating Expenses</span>
                  <span className="font-medium text-amber-500">-{formatCurrency(results.operatingExpenses, currency)}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground font-medium">Operating Profit</span>
                <span className="font-semibold text-amber-500">{formatCurrency(results.operatingProfit, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground pl-3">Operating Margin</span>
                <span className="font-medium">{results.operatingMargin.toFixed(2)}%</span>
              </div>
              {results.taxAmount > 0 && (
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Taxes ({results.taxRate.toFixed(1)}%)</span>
                  <span className="font-medium text-rose-500">-{formatCurrency(results.taxAmount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground font-medium">Net Profit</span>
                <span className={cn("font-bold", results.isProfitable ? "text-emerald-500" : "text-red-500")}>
                  {formatCurrency(results.netProfit, currency)}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-medium">Net Margin</span>
                <span className={cn("font-bold", results.isProfitable ? "text-emerald-500" : "text-red-500")}>
                  {results.netMargin.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Markup vs Margin Card */}
          {results.cogs > 0 && (
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                <BadgePercent className="w-3 h-3" />
                Markup vs Margin
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-muted-foreground mb-1">Markup %</p>
                  <p className="text-2xl font-bold text-blue-500">{results.markup.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">On cost</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-xs text-muted-foreground mb-1">Gross Margin %</p>
                  <p className="text-2xl font-bold text-emerald-500">{results.grossMargin.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">On revenue</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                For every {formatCurrency(results.cogs, currency)} in cost, you earn {formatCurrency(results.grossProfit, currency)} in gross profit
                - a {results.markup.toFixed(1)}% markup yields a {results.grossMargin.toFixed(1)}% gross margin
              </p>
            </div>
          )}
        </div>
      </div>

    </ToolLayout>
  );
}
