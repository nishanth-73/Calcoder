"use client";

import { useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { BadgePercent, Banknote, Calculator, FileText, TrendingUp, TrendingDown, Wallet, Receipt, Package } from "lucide-react";
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

const PIE_COLORS = ["#3b82f6", "#f59e0b"];

const RELATED_TOOLS = [
  { name: "Profit Margin Calculator", href: "/finance/profit-margin-calculator", desc: "Calculate gross and net profit margins for products." },
  { name: "ROI Calculator", href: "/finance/roi-calculator", desc: "Calculate return on investment percentage for any asset." },
  { name: "Revenue Growth Calculator", href: "/finance/revenue-growth-calculator", desc: "Calculate revenue growth rate over multiple periods." },
  { name: "Crypto Profit Calculator", href: "/finance/crypto-profit-calculator", desc: "Calculate crypto trading profit and loss with fees." },
];

// ===================================================================
// TYPES
// ===================================================================

interface BreakEvenResults {
  fixedCosts: number;
  variableCostPerUnit: number;
  sellingPrice: number;
  targetProfit: number;
  contributionMargin: number;
  contributionMarginRatio: number;
  breakEvenUnits: number;
  breakEvenRevenue: number;
  targetUnits: number;
  targetRevenue: number;
  totalVariableAtBE: number;
  totalCostAtBE: number;
  canBreakEven: boolean;
  hasTarget: boolean;
}

// ===================================================================
// CALCULATION ENGINE
// ===================================================================

const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

function calculateBreakEven(
  fixedCosts: number,
  variableCostPerUnit: number,
  sellingPrice: number,
  targetProfit: number,
): BreakEvenResults {
  const fc = clamp(Number.isFinite(fixedCosts) ? Math.max(0, fixedCosts) : 0, 0, 1e9);
  const vc = clamp(Number.isFinite(variableCostPerUnit) ? Math.max(0, variableCostPerUnit) : 0, 0, 1e9);
  const sp = clamp(Number.isFinite(sellingPrice) ? Math.max(0, sellingPrice) : 0, 0, 1e9);
  const tp = clamp(Number.isFinite(targetProfit) ? Math.max(0, targetProfit) : 0, 0, 1e9);

  const contributionMargin = sp - vc;
  const contributionMarginRatio = sp > 0 ? (contributionMargin / sp) * 100 : 0;
  const canBreakEven = contributionMargin > 0 && fc > 0;

  const breakEvenUnits = contributionMargin > 0 ? fc / contributionMargin : 0;
  const breakEvenRevenue = breakEvenUnits * sp;
  const totalVariableAtBE = breakEvenUnits * vc;
  const totalCostAtBE = fc + totalVariableAtBE;

  const targetUnits = contributionMargin > 0 && tp > 0
    ? (fc + tp) / contributionMargin
    : 0;
  const targetRevenue = targetUnits * sp;

  return {
    fixedCosts: fc,
    variableCostPerUnit: vc,
    sellingPrice: sp,
    targetProfit: tp,
    contributionMargin,
    contributionMarginRatio,
    breakEvenUnits,
    breakEvenRevenue,
    targetUnits,
    targetRevenue,
    totalVariableAtBE,
    totalCostAtBE,
    canBreakEven,
    hasTarget: tp > 0,
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

export default function BreakEvenCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const { value: fixedCosts, displayValue: fixedCostsDisplay, setValue: setFixedCosts, handleChange: handleFixedInput, handleFocus: handleFixedFocus, handleBlur: handleFixedBlur } = useNumericField(50000);
  const { value: variableCostPerUnit, displayValue: variableCostPerUnitDisplay, setValue: setVariableCostPerUnit, handleChange: handleVarInput, handleFocus: handleVarFocus, handleBlur: handleVarBlur } = useNumericField(30);
  const { value: sellingPrice, displayValue: sellingPriceDisplay, setValue: setSellingPrice, handleChange: handlePriceInput, handleFocus: handlePriceFocus, handleBlur: handlePriceBlur } = useNumericField(50);
  const { value: targetProfit, displayValue: targetProfitDisplay, setValue: setTargetProfit, handleChange: handleTargetInput, handleFocus: handleTargetFocus, handleBlur: handleTargetBlur } = useNumericField(0);

  const results = useMemo<BreakEvenResults>(
    () => calculateBreakEven(fixedCosts, variableCostPerUnit, sellingPrice, targetProfit),
    [fixedCosts, variableCostPerUnit, sellingPrice, targetProfit],
  );

  const pieData = useMemo(() => {
    if (!results.canBreakEven || results.breakEvenUnits === 0) return [];
    return [
      { name: "Fixed Costs", value: results.fixedCosts },
      { name: "Variable Costs", value: results.totalVariableAtBE },
    ];
  }, [results.fixedCosts, results.totalVariableAtBE, results.canBreakEven, results.breakEvenUnits]);

  const showPie = pieData.length > 1;

  const volumeSteps = useMemo(() => {
    if (!results.canBreakEven) return [];
    const be = Math.ceil(results.breakEvenUnits);
    const step = Math.max(1, Math.ceil(be / 4));
    const steps: { label: string; units: number; revenue: number; cost: number; profit: number }[] = [];
    const halfBe = Math.max(1, Math.floor(be * 0.5));
    steps.push({ label: "50%", units: halfBe, revenue: halfBe * results.sellingPrice, cost: results.fixedCosts + halfBe * results.variableCostPerUnit, profit: 0 });
    steps.push({ label: "100%", units: be, revenue: be * results.sellingPrice, cost: results.fixedCosts + be * results.variableCostPerUnit, profit: 0 });
    steps.push({ label: "150%", units: Math.floor(be * 1.5), revenue: Math.floor(be * 1.5) * results.sellingPrice, cost: results.fixedCosts + Math.floor(be * 1.5) * results.variableCostPerUnit, profit: 0 });
    steps.push({ label: "200%", units: be * 2, revenue: be * 2 * results.sellingPrice, cost: results.fixedCosts + be * 2 * results.variableCostPerUnit, profit: 0 });
    return steps.map((s) => ({
      ...s,
      profit: s.revenue - s.cost,
    }));
  }, [results]);

  // --- Handlers ---

  const handleCurrencyChange = (val: string) => {
    setCurrency(val as CurrencyCode);
  };

  return (
    <ToolLayout
      title="Break-Even Calculator"
      description="Calculate your break-even point - find out how many units you need to sell to cover costs, with real-time charts, contribution margin analysis, and 29-currency support."
      category="finance"
      faqContent={[
        {
          question: "How is the break-even point calculated?",
          answer: "The break-even point is calculated as: Break-Even Units = Fixed Costs ÷ (Selling Price - Variable Cost Per Unit). The denominator (selling price - variable cost) is called the contribution margin - the amount each unit contributes toward covering fixed costs. Once fixed costs are covered, every additional unit sold generates pure profit.",
        },
        {
          question: "What is the difference between fixed costs and variable costs?",
          answer: "Fixed costs remain constant regardless of production volume - rent, salaries, insurance, equipment leases. Variable costs change with production - raw materials, direct labor, packaging, shipping. The break-even point is where total revenue equals total costs (fixed + variable). Understanding this distinction is essential for pricing and production decisions.",
        },
        {
          question: "What is contribution margin and why does it matter?",
          answer: "Contribution Margin = Selling Price - Variable Cost Per Unit. It measures how much each unit sold contributes to covering fixed costs and generating profit. A higher contribution margin means you reach break-even faster. For example, a $50 product with $30 variable cost has a $20 contribution margin - each sale contributes $20 toward fixed costs.",
        },
        {
          question: "What is a good contribution margin ratio?",
          answer: "Contribution Margin Ratio = Contribution Margin ÷ Selling Price × 100. Higher ratios are better. Service businesses often have 70-90%, while product businesses range 30-60%. A ratio below 20% makes it difficult to achieve profitability unless volumes are extremely high. If your ratio is low, consider raising prices or reducing variable costs.",
        },
        {
          question: "How do I calculate units needed to achieve a target profit?",
          answer: "Target Units = (Fixed Costs + Target Profit) ÷ Contribution Margin Per Unit. For example, with $50,000 fixed costs, $20 contribution margin, and a $10,000 target profit: ($50,000 + $10,000) ÷ $20 = 3,000 units. This calculator includes a target profit field so you can see exactly what volume you need to hit your profit goals.",
        },
        {
          question: "What happens if my selling price is less than variable cost?",
          answer: "If selling price is less than variable cost, the contribution margin is negative - meaning each unit sold increases your loss. In this case, break-even is impossible regardless of volume. You must either raise prices or reduce variable costs to achieve a positive contribution margin before break-even analysis becomes meaningful.",
        },
        {
          question: "How can I lower my break-even point?",
          answer: "To lower your break-even point: (1) Reduce fixed costs - negotiate rent, outsource non-core functions. (2) Increase selling prices - even a 5-10% price increase significantly reduces break-even. (3) Reduce variable costs - better supplier deals, bulk purchasing, more efficient production. (4) Focus on higher-margin products or services.",
        },
        {
          question: "What is the break-even point in revenue vs units?",
          answer: "Break-Even Revenue = Break-Even Units × Selling Price. While break-even units tells you how many items to sell, break-even revenue tells you the total dollar amount needed. For example, selling 2,500 units at $50 each = $125,000 break-even revenue. Revenue-based targets are often easier for businesses to track and communicate.",
        },
        {
          question: "How does break-even analysis work for a subscription business?",
          answer: "For subscription businesses, replace 'units sold' with 'customers acquired.' Fixed costs stay the same. Variable cost per unit becomes cost of serving one customer (hosting, support). Selling price per unit becomes monthly or annual revenue per customer. The break-even customer count tells you how many subscribers you need to cover costs.",
        },
        {
          question: "Can break-even analysis be used for a single product vs a multi-product business?",
          answer: "For a single product, enter its specific costs and price. For a multi-product business, use the weighted average selling price and weighted average variable cost across all products. Fixed costs should include the total overhead allocated to the product line. This gives you a blended break-even point for your overall business.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a Break-Even Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A Break-Even Calculator helps business owners determine how many units they need to sell to cover all costs.
              By entering your <strong>fixed costs</strong>, <strong>variable cost per unit</strong>, and
              <strong> selling price</strong>, you get an instant calculation of your break-even point in units and revenue,
              contribution margin, and the volume needed to achieve a target profit. This tool supports 29+ currencies.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p>Contribution Margin = Selling Price - Variable Cost Per Unit</p>
              <p>CM Ratio = (Contribution Margin ÷ Selling Price) × 100</p>
              <p><strong>Break-Even Units = Fixed Costs ÷ Contribution Margin</strong></p>
              <p>Break-Even Revenue = Break-Even Units × Selling Price</p>
              <p>Target Units = (Fixed Costs + Target Profit) ÷ Contribution Margin</p>
              <p>Target Revenue = Target Units × Selling Price</p>
              <p>Total Cost at BE = Fixed Costs + (BE Units × Variable Cost)</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Benefits of Using This Calculator</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              <li><strong>Instant Break-Even:</strong> Know exactly how many units to sell to cover all costs - in units and revenue.</li>
              <li><strong>Contribution Margin:</strong> Understand how much each sale contributes to your fixed costs and profit.</li>
              <li><strong>Target Profit Planning:</strong> Set a profit goal and see the exact volume needed to achieve it.</li>
              <li><strong>Volume Scenarios:</strong> See profit/loss at 50%, 100%, 150%, and 200% of break-even volume.</li>
              <li><strong>Global Currencies:</strong> Supports 29+ currencies with proper locale-aware formatting.</li>
              <li><strong>Cost Structure Visual:</strong> Pie chart showing the proportion of fixed vs variable costs at break-even.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Scenario: A business has $50,000 in monthly fixed costs. Each product costs $30 to make and sells for $50. The owner wants a $10,000 monthly profit.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Contribution Margin = $50 - $30 = <strong>$20 per unit</strong></li>
                <li>CM Ratio = $20 ÷ $50 × 100 = <strong>40%</strong></li>
                <li>Break-Even Units = $50,000 ÷ $20 = <strong>2,500 units</strong></li>
                <li>Break-Even Revenue = 2,500 × $50 = <strong>$125,000</strong></li>
                <li>Target Units = ($50,000 + $10,000) ÷ $20 = <strong>3,000 units</strong></li>
                <li>At 2,000 units (80% of BE): Revenue = $100,000, Cost = $110,000, <strong>Loss = $10,000</strong></li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Common Mistakes to Avoid</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed text-muted-foreground">
              <li>Confusing fixed and variable costs - misclassifying costs leads to an inaccurate break-even point and poor pricing decisions.</li>
              <li>Ignoring semi-variable costs - some costs (like utilities) have both fixed and variable components that should be split.</li>
              <li>Setting prices below variable costs - this guarantees a loss on every unit sold, making break-even impossible.</li>
              <li>Using too broad a product mix - different products have different margins; use weighted averages for accurate analysis.</li>
              <li>Forgetting that break-even is dynamic - costs and prices change over time; revisit your break-even calculation regularly.</li>
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
            <label htmlFor="be-currency" className="flex items-center gap-1.5 text-sm font-medium mb-1">
              <Banknote className="w-4 h-4 text-primary" />
              Currency
            </label>
            <select
              id="be-currency"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} - {c.label} ({c.symbol})</option>
              ))}
            </select>
          </div>

          {/* Fixed Costs */}
          <div className="space-y-2">
            <label htmlFor="be-fixed" className="flex items-center gap-1.5 text-sm font-medium">
              <Wallet className="w-4 h-4 text-primary" />
              <span>Fixed Costs</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(fixedCosts, currency)}</span>
            </label>
            <input
              id="be-fixed"
              type="range"
              min={0}
              max={getMaxAmount(currency)}
              step={getSliderStep(currency)}
              value={Math.min(fixedCosts, getMaxAmount(currency))}
               onChange={(e) => setFixedCosts(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={getMaxAmount(currency)}
              aria-valuenow={fixedCosts}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCompact(getMaxAmount(currency), currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={fixedCostsDisplay}
              onChange={(e) => handleFixedInput(e.target.value)}
              onFocus={handleFixedFocus}
              onBlur={handleFixedBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter fixed costs"
            />
          </div>

          {/* Variable Cost Per Unit */}
          <div className="space-y-2">
            <label htmlFor="be-variable" className="flex items-center gap-1.5 text-sm font-medium">
              <Receipt className="w-4 h-4 text-primary" />
              <span>Variable Cost Per Unit</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(variableCostPerUnit, currency)}</span>
            </label>
            <input
              id="be-variable"
              type="range"
              min={0}
              max={10000}
              step={1}
              value={Math.min(variableCostPerUnit, 10000)}
               onChange={(e) => setVariableCostPerUnit(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={10000}
              aria-valuenow={variableCostPerUnit}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCurrency(5000, currency)}</span>
              <span>{formatCurrency(10000, currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={variableCostPerUnitDisplay}
              onChange={(e) => handleVarInput(e.target.value)}
              onFocus={handleVarFocus}
              onBlur={handleVarBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter variable cost per unit"
            />
          </div>

          {/* Selling Price */}
          <div className="space-y-2">
            <label htmlFor="be-price" className="flex items-center gap-1.5 text-sm font-medium">
              <Package className="w-4 h-4 text-primary" />
              <span>Selling Price Per Unit</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(sellingPrice, currency)}</span>
            </label>
            <input
              id="be-price"
              type="range"
              min={0}
              max={100000}
              step={1}
              value={Math.min(sellingPrice, 100000)}
               onChange={(e) => setSellingPrice(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={100000}
              aria-valuenow={sellingPrice}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCurrency(50000, currency)}</span>
              <span>{formatCurrency(100000, currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={sellingPriceDisplay}
              onChange={(e) => handlePriceInput(e.target.value)}
              onFocus={handlePriceFocus}
              onBlur={handlePriceBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter selling price per unit"
            />
          </div>

          {/* Target Profit */}
          <div className="space-y-2">
            <label htmlFor="be-target" className="flex items-center gap-1.5 text-sm font-medium">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Target Profit <span className="text-xs text-muted-foreground font-normal">(optional)</span></span>
              <span className="ml-auto text-lg font-bold text-primary">
                {targetProfit > 0 ? formatCurrency(targetProfit, currency) : "-"}
              </span>
            </label>
            <input
              id="be-target"
              type="range"
              min={0}
              max={getMaxAmount(currency)}
              step={getSliderStep(currency)}
              value={Math.min(targetProfit, getMaxAmount(currency))}
               onChange={(e) => setTargetProfit(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={getMaxAmount(currency)}
              aria-valuenow={targetProfit}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>No target</span>
              <span>{formatCompact(getMaxAmount(currency), currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={targetProfitDisplay}
              onChange={(e) => handleTargetInput(e.target.value)}
              onFocus={handleTargetFocus}
              onBlur={handleTargetBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter target profit (optional)"
            />
          </div>

          {/* Pie Chart */}
          {showPie && (
            <div className="bg-white border border-border rounded-xl p-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Cost Structure at Break-Even
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
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#3b82f6]" />
                    <span className="text-muted-foreground">
                      Fixed Costs ({(results.fixedCosts / (results.fixedCosts + results.totalVariableAtBE) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#f59e0b]" />
                    <span className="text-muted-foreground">
                      Variable Costs ({(results.totalVariableAtBE / (results.fixedCosts + results.totalVariableAtBE) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Fixed Costs</p>
                  <p className="text-sm font-semibold">{formatCurrency(results.fixedCosts, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Variable Costs</p>
                  <p className="text-sm font-semibold text-amber-500">{formatCurrency(results.totalVariableAtBE, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Total Costs</p>
                  <p className="text-sm font-semibold">{formatCurrency(results.totalCostAtBE, currency)}</p>
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
              results.canBreakEven
                ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200"
                : "bg-gradient-to-br from-red-50 to-red-100/50 border-red-200",
            )}
          >
            <div className="flex items-center gap-2 mb-3">
              {results.canBreakEven ? (
                <Calculator className="w-5 h-5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              <p className="text-sm text-muted-foreground font-medium">
                {results.canBreakEven ? "Break-Even Point" : "Cannot Break Even"}
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-extrabold text-emerald-500 break-words">
                {results.breakEvenUnits.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <span className="text-lg text-muted-foreground font-medium">units</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <span className="font-medium">
                Revenue: {formatCurrency(results.breakEvenRevenue, currency)}
              </span>
            </div>
            {!results.canBreakEven && (
              <p className="text-xs text-red-600 mt-2">
                Selling price must exceed variable cost to reach break-even
              </p>
            )}
          </div>

          {/* Mini Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <BadgePercent className="w-3 h-3 text-blue-500" />
                Contribution Margin
              </p>
              <p className="text-lg font-bold text-blue-500 break-words">
                {formatCurrency(results.contributionMargin, currency)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">per unit</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <BadgePercent className="w-3 h-3 text-indigo-500" />
                CM Ratio
              </p>
              <p className="text-lg font-bold text-indigo-500 break-words">
                {results.contributionMarginRatio.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">of revenue</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Receipt className="w-3 h-3 text-amber-500" />
                Fixed Costs
              </p>
              <p className="text-lg font-bold text-amber-500 break-words">
                {formatCurrency(results.fixedCosts, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Receipt className="w-3 h-3 text-orange-500" />
                Variable @ BE
              </p>
              <p className="text-lg font-bold text-orange-500 break-words">
                {formatCurrency(results.totalVariableAtBE, currency)}
              </p>
            </div>
          </div>

          {/* Target Profit Card */}
          {results.hasTarget && results.canBreakEven && (
            <div
              className={cn(
                "rounded-xl p-4 border",
                "bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200",
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <p className="text-sm text-muted-foreground font-medium">
                  Target Profit: {formatCurrency(results.targetProfit, currency)}
                </p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-extrabold text-purple-500 break-words">
                  {results.targetUnits.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <span className="text-base text-muted-foreground font-medium">units</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Revenue needed: {formatCurrency(results.targetRevenue, currency)}
              </p>
            </div>
          )}

          {/* Volume Scenarios Table */}
          {results.canBreakEven && volumeSteps.length > 0 && (
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Volume Scenarios
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1.5 pr-2 font-medium text-muted-foreground">Volume</th>
                      <th className="text-right py-1.5 px-2 font-medium text-muted-foreground">Units</th>
                      <th className="text-right py-1.5 px-2 font-medium text-muted-foreground">Revenue</th>
                      <th className="text-right py-1.5 px-2 font-medium text-muted-foreground">Cost</th>
                      <th className="text-right py-1.5 pl-2 font-medium text-muted-foreground">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volumeSteps.map((step) => (
                      <tr key={step.label} className="border-b border-border/50 last:border-0">
                        <td className="py-1.5 pr-2 font-medium">{step.label}</td>
                        <td className="text-right py-1.5 px-2">{step.units.toLocaleString()}</td>
                        <td className="text-right py-1.5 px-2">{formatCurrency(step.revenue, currency)}</td>
                        <td className="text-right py-1.5 px-2">{formatCurrency(step.cost, currency)}</td>
                        <td className={cn("text-right py-1.5 pl-2 font-medium", step.profit < 0 ? "text-red-500" : step.profit > 0 ? "text-emerald-500" : "")}>
                          {step.profit < 0 ? "-" : step.profit > 0 ? "+" : ""}{formatCurrency(Math.abs(step.profit), currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary Breakdown */}
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Break-Even Summary
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Fixed Costs</span>
                <span className="font-medium">{formatCurrency(results.fixedCosts, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Variable Cost Per Unit</span>
                <span className="font-medium">{formatCurrency(results.variableCostPerUnit, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Selling Price Per Unit</span>
                <span className="font-medium">{formatCurrency(results.sellingPrice, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Contribution Margin</span>
                <span className={cn("font-medium", results.contributionMargin > 0 ? "text-emerald-500" : "text-red-500")}>
                  {formatCurrency(results.contributionMargin, currency)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">CM Ratio</span>
                <span className="font-medium">{results.contributionMarginRatio.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Break-Even Units</span>
                <span className="font-bold text-emerald-500">{results.breakEvenUnits.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-medium">Break-Even Revenue</span>
                <span className="font-bold text-emerald-500">{formatCurrency(results.breakEvenRevenue, currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </ToolLayout>
  );
}
