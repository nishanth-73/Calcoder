"use client";

import { useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { ToolLayout } from "@/components/layout/ToolLayout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Banknote, Percent, Calculator, PiggyBank, TrendingUp, ArrowUpRight, ArrowDownRight, Table, Globe, User, Wallet, Landmark, BadgePercent, Gauge, Target, CheckCircle, AlertTriangle, Info, Link as LinkIcon } from "lucide-react";

type CurrencyCode = "USD" | "INR" | "EUR" | "GBP" | "AED" | "CAD" | "AUD" | "JPY" | "SGD" | "CNY" | "MYR" | "ZAR";

interface CurrencyConfig {
  code: CurrencyCode;
  label: string;
  symbol: string;
  locale: string;
}

const CURRENCIES: CurrencyConfig[] = [
  { code: "USD", label: "USD", symbol: "$", locale: "en-US" },
  { code: "INR", label: "INR", symbol: "₹", locale: "en-IN" },
  { code: "EUR", label: "EUR", symbol: "€", locale: "de-DE" },
  { code: "GBP", label: "GBP", symbol: "£", locale: "en-GB" },
  { code: "AED", label: "AED", symbol: "Ø¯.Ø¥", locale: "ar-AE" },
  { code: "CAD", label: "CAD", symbol: "C$", locale: "en-CA" },
  { code: "AUD", label: "AUD", symbol: "A$", locale: "en-AU" },
  { code: "JPY", label: "JPY", symbol: "Â¥", locale: "ja-JP" },
  { code: "SGD", label: "SGD", symbol: "S$", locale: "en-SG" },
  { code: "CNY", label: "CNY", symbol: "Â¥", locale: "zh-CN" },
  { code: "MYR", label: "MYR", symbol: "RM", locale: "ms-MY" },
  { code: "ZAR", label: "ZAR", symbol: "R", locale: "en-ZA" },
];

type TaxCountry = "india-new" | "india-old" | "usa" | "uk" | "canada" | "australia" | "singapore" | "uae";
type AgeGroup = "below60" | "senior" | "superSenior";

interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

interface TaxConfig {
  name: string;
  currency: CurrencyCode;
  brackets: TaxBracket[];
  standardDeduction: number;
  deductionLabel: string;
  deductionMax: number;
  deductionStep: number;
  rebateLimit?: number;
  rebateAmount?: number;
  surchargeThresholds?: { threshold: number; rate: number }[];
  cess?: number;
  seniorExemption?: number;
  superSeniorExemption?: number;
  personalAllowancePhaseout?: number;
}

function getCurrencyConfig(code: CurrencyCode): CurrencyConfig {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

function formatCurrency(value: number, currency: CurrencyCode): string {
  if (!Number.isFinite(value) || value < 0) {
    const cfg = getCurrencyConfig(currency);
    return `${cfg.symbol}0`;
  }
  const cfg = getCurrencyConfig(currency);
  try {
    return new Intl.NumberFormat(cfg.locale, {
      style: "currency",
      currency: cfg.code,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${cfg.symbol}${Math.round(value).toLocaleString()}`;
  }
}

function formatCompact(value: number, currency: CurrencyCode): string {
  if (!Number.isFinite(value)) return "0";
  const cfg = getCurrencyConfig(currency);
  const sym = cfg.symbol;
  const abs = Math.abs(value);

  if (currency === "INR") {
    if (abs >= 10000000) return `${sym}${(value / 10000000).toFixed(2)}Cr`;
    if (abs >= 100000) return `${sym}${(value / 100000).toFixed(1)}L`;
    if (abs >= 1000) return `${sym}${(value / 1000).toFixed(0)}K`;
    return formatCurrency(value, currency);
  }

  if (abs >= 1000000000) return `${sym}${(value / 1000000000).toFixed(2)}B`;
  if (abs >= 1000000) return `${sym}${(value / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${sym}${(value / 1000).toFixed(0)}K`;
  return formatCurrency(value, currency);
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  return `${(value * 100).toFixed(2)}%`;
}

function formatBracketLabel(min: number, max: number): string {
  if (max === Infinity) return `> ${min.toLocaleString()}`;
  return `${min.toLocaleString()} - ${max.toLocaleString()}`;
}

const STEP = 1000;

function getMaxIncome(country: TaxCountry): number {
  switch (country) {
    case "india-new":
    case "india-old":
      return 100000000;
    case "usa":
      return 10000000;
    case "uk":
      return 5000000;
    case "canada":
      return 5000000;
    case "australia":
      return 5000000;
    case "singapore":
      return 5000000;
    case "uae":
      return 50000000;
    default:
      return 10000000;
  }
}

function getDefaultIncome(country: TaxCountry): number {
  switch (country) {
    case "india-new":
    case "india-old":
      return 1200000;
    case "usa":
      return 75000;
    case "uk":
      return 50000;
    case "canada":
      return 80000;
    case "australia":
      return 90000;
    case "singapore":
      return 60000;
    case "uae":
      return 240000;
    default:
      return 50000;
  }
}

function getCountryCurrency(country: TaxCountry): CurrencyCode {
  switch (country) {
    case "india-new":
    case "india-old":
      return "INR";
    case "usa":
      return "USD";
    case "uk":
      return "GBP";
    case "canada":
      return "CAD";
    case "australia":
      return "AUD";
    case "singapore":
      return "SGD";
    case "uae":
      return "AED";
    default:
      return "USD";
  }
}

const COUNTRY_CONFIGS: Record<TaxCountry, TaxConfig> = {
  "india-new": {
    name: "India (New Regime)",
    currency: "INR",
    brackets: [
      { min: 0, max: 300000, rate: 0 },
      { min: 300000, max: 600000, rate: 0.05 },
      { min: 600000, max: 900000, rate: 0.10 },
      { min: 900000, max: 1200000, rate: 0.15 },
      { min: 1200000, max: 1500000, rate: 0.20 },
      { min: 1500000, max: Infinity, rate: 0.30 },
    ],
    standardDeduction: 50000,
    deductionLabel: "Chapter VI-A Deductions",
    deductionMax: 150000,
    deductionStep: 10000,
    rebateLimit: 700000,
    rebateAmount: 25000,
    surchargeThresholds: [
      { threshold: 5000000, rate: 0.10 },
      { threshold: 10000000, rate: 0.15 },
      { threshold: 20000000, rate: 0.25 },
      { threshold: 50000000, rate: 0.37 },
    ],
    cess: 0.04,
  },
  "india-old": {
    name: "India (Old Regime)",
    currency: "INR",
    brackets: [
      { min: 0, max: 250000, rate: 0 },
      { min: 250000, max: 500000, rate: 0.05 },
      { min: 500000, max: 1000000, rate: 0.20 },
      { min: 1000000, max: Infinity, rate: 0.30 },
    ],
    standardDeduction: 50000,
    deductionLabel: "Total Deductions (80C, 80D, HRA)",
    deductionMax: 500000,
    deductionStep: 10000,
    rebateLimit: 500000,
    rebateAmount: 12500,
    surchargeThresholds: [
      { threshold: 5000000, rate: 0.10 },
      { threshold: 10000000, rate: 0.15 },
      { threshold: 20000000, rate: 0.25 },
      { threshold: 50000000, rate: 0.37 },
    ],
    cess: 0.04,
    seniorExemption: 50000,
    superSeniorExemption: 250000,
  },
  "usa": {
    name: "United States (Federal)",
    currency: "USD",
    brackets: [
      { min: 0, max: 11600, rate: 0.10 },
      { min: 11600, max: 47150, rate: 0.12 },
      { min: 47150, max: 100525, rate: 0.22 },
      { min: 100525, max: 191950, rate: 0.24 },
      { min: 191950, max: 243725, rate: 0.32 },
      { min: 243725, max: 609350, rate: 0.35 },
      { min: 609350, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 14600,
    deductionLabel: "Additional Deductions",
    deductionMax: 100000,
    deductionStep: 1000,
  },
  "uk": {
    name: "United Kingdom",
    currency: "GBP",
    brackets: [
      { min: 0, max: 12570, rate: 0 },
      { min: 12570, max: 50270, rate: 0.20 },
      { min: 50270, max: 125140, rate: 0.40 },
      { min: 125140, max: Infinity, rate: 0.45 },
    ],
    standardDeduction: 12570,
    deductionLabel: "Additional Allowances",
    deductionMax: 50000,
    deductionStep: 1000,
    personalAllowancePhaseout: 100000,
  },
  "canada": {
    name: "Canada (Federal)",
    currency: "CAD",
    brackets: [
      { min: 0, max: 55867, rate: 0.15 },
      { min: 55867, max: 111733, rate: 0.205 },
      { min: 111733, max: 173205, rate: 0.26 },
      { min: 173205, max: 246752, rate: 0.29 },
      { min: 246752, max: Infinity, rate: 0.33 },
    ],
    standardDeduction: 15705,
    deductionLabel: "Additional Deductions",
    deductionMax: 50000,
    deductionStep: 1000,
  },
  "australia": {
    name: "Australia",
    currency: "AUD",
    brackets: [
      { min: 0, max: 18200, rate: 0 },
      { min: 18200, max: 45000, rate: 0.16 },
      { min: 45000, max: 135000, rate: 0.30 },
      { min: 135000, max: 190000, rate: 0.37 },
      { min: 190000, max: Infinity, rate: 0.45 },
    ],
    standardDeduction: 0,
    deductionLabel: "Work-related Deductions",
    deductionMax: 30000,
    deductionStep: 1000,
  },
  "singapore": {
    name: "Singapore",
    currency: "SGD",
    brackets: [
      { min: 0, max: 20000, rate: 0 },
      { min: 20000, max: 30000, rate: 0.02 },
      { min: 30000, max: 40000, rate: 0.035 },
      { min: 40000, max: 80000, rate: 0.07 },
      { min: 80000, max: 120000, rate: 0.115 },
      { min: 120000, max: 160000, rate: 0.15 },
      { min: 160000, max: 200000, rate: 0.18 },
      { min: 200000, max: 240000, rate: 0.19 },
      { min: 240000, max: 280000, rate: 0.195 },
      { min: 280000, max: 320000, rate: 0.20 },
      { min: 320000, max: 500000, rate: 0.22 },
      { min: 500000, max: 1000000, rate: 0.23 },
      { min: 1000000, max: Infinity, rate: 0.24 },
    ],
    standardDeduction: 0,
    deductionLabel: "Personal Reliefs",
    deductionMax: 80000,
    deductionStep: 1000,
  },
  "uae": {
    name: "UAE",
    currency: "AED",
    brackets: [{ min: 0, max: Infinity, rate: 0 }],
    standardDeduction: 0,
    deductionLabel: "N/A",
    deductionMax: 0,
    deductionStep: 0,
  },
};

const AGE_GROUPS: { label: string; value: AgeGroup }[] = [
  { label: "Below 60 years", value: "below60" },
  { label: "60 to 80 years", value: "senior" },
  { label: "Above 80 years", value: "superSenior" },
];

const RELATED_TOOLS = [
  { name: "SIP Calculator", href: "/finance/sip-calculator", desc: "Plan systematic investments" },
  { name: "FD Calculator", href: "/finance/fd-calculator", desc: "Calculate fixed deposit returns" },
  { name: "EMI Calculator", href: "/finance/emi-calculator", desc: "Plan your loan payments" },
  { name: "Net Worth Calculator", href: "/finance/net-worth-calculator", desc: "Track your financial health" },
];

const PIE_COLORS = ["#ef4444", "#10b981"];
const SLAB_COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#06b6d4", "#10b981", "#f59e0b", "#f97316", "#ef4444", "#ec4899"];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

interface TaxResults {
  grossIncome: number;
  standardDeduction: number;
  additionalDeductions: number;
  ageExemption: number;
  totalDeductions: number;
  taxableIncome: number;
  taxOnIncome: number;
  rebate: number;
  surcharge: number;
  cess: number;
  totalTax: number;
  effectiveRate: number;
  marginalRate: number;
  marginalRateLabel: string;
  takeHome: number;
  slabData: { name: string; value: number; rate: string; color: string }[];
}

function calculateTax(
  income: number,
  country: TaxCountry,
  age: AgeGroup,
  additionalDeductions: number
): TaxResults {
  const config = COUNTRY_CONFIGS[country];
  const clampedIncome = clamp(income, 0, getMaxIncome(country));
  const clampedAdditional = clamp(additionalDeductions, 0, config.deductionMax);

  if (!Number.isFinite(clampedIncome) || clampedIncome <= 0) {
    const emptySlabs = config.brackets.map((b, i) => ({
      name: `${formatBracketLabel(b.min, b.max)} (${(b.rate * 100).toFixed(0)}%)`,
      value: 0,
      rate: `${(b.rate * 100).toFixed(0)}%`,
      color: SLAB_COLORS[i % SLAB_COLORS.length],
    }));
    return {
      grossIncome: 0, standardDeduction: 0, additionalDeductions: 0, ageExemption: 0,
      totalDeductions: 0, taxableIncome: 0, taxOnIncome: 0, rebate: 0, surcharge: 0,
      cess: 0, totalTax: 0, effectiveRate: 0, marginalRate: 0, marginalRateLabel: "0%",
      takeHome: 0, slabData: emptySlabs,
    };
  }

  let standardDeduction = config.standardDeduction;

  if (config.personalAllowancePhaseout && clampedIncome > config.personalAllowancePhaseout) {
    const excess = clampedIncome - config.personalAllowancePhaseout;
    const reduction = Math.min(standardDeduction, Math.floor(excess / 2));
    standardDeduction = Math.max(0, standardDeduction - reduction);
  }

  let ageExemption = 0;
  if (country === "india-old") {
    if (age === "senior" && config.seniorExemption) ageExemption = config.seniorExemption;
    if (age === "superSenior" && config.superSeniorExemption) ageExemption = config.superSeniorExemption;
  }

  const totalDeductions = standardDeduction + clampedAdditional + ageExemption;
  const taxableIncome = Math.max(0, clampedIncome - totalDeductions);

  let taxOnIncome = 0;
  const slabData: TaxResults["slabData"] = [];

  for (let i = 0; i < config.brackets.length; i++) {
    const b = config.brackets[i];
    const bracketSize = b.max === Infinity
      ? Math.max(0, taxableIncome - b.min)
      : clamp(taxableIncome - b.min, 0, b.max - b.min);
    const bracketTax = bracketSize * b.rate;
    taxOnIncome += bracketTax;
    slabData.push({
      name: `${formatBracketLabel(b.min, b.max)} (${(b.rate * 100).toFixed(0)}%)`,
      value: bracketTax,
      rate: `${(b.rate * 100).toFixed(0)}%`,
      color: SLAB_COLORS[i % SLAB_COLORS.length],
    });
  }

  let rebate = 0;
  if (config.rebateLimit && config.rebateAmount && taxableIncome <= config.rebateLimit && taxableIncome >= 0) {
    if (country === "india-new") {
      rebate = Math.min(config.rebateAmount, taxOnIncome);
    } else {
      rebate = Math.min(config.rebateAmount, taxOnIncome);
    }
  }

  let afterRebate = Math.max(0, taxOnIncome - rebate);

  let surcharge = 0;
  if (config.surchargeThresholds && taxableIncome > 0) {
    for (const st of config.surchargeThresholds) {
      if (taxableIncome > st.threshold) {
        surcharge = Math.round(afterRebate * st.rate);
        break;
      }
    }
  }

  let cess = 0;
  if (config.cess) {
    cess = Math.round((afterRebate + surcharge) * config.cess);
  }

  const totalTax = Math.round(afterRebate + surcharge + cess);
  const effectiveRate = clampedIncome > 0 ? totalTax / clampedIncome : 0;

  let marginalRate = 0;
  let marginalRateLabel = "0%";
  for (const b of config.brackets) {
    if (taxableIncome > b.min && taxableIncome <= b.max) {
      marginalRate = b.rate;
      marginalRateLabel = formatPercent(marginalRate);
      break;
    }
    if (b.max === Infinity && taxableIncome > b.min) {
      marginalRate = b.rate;
      marginalRateLabel = formatPercent(marginalRate);
      break;
    }
  }

  return {
    grossIncome: clampedIncome,
    standardDeduction,
    additionalDeductions: clampedAdditional,
    ageExemption,
    totalDeductions,
    taxableIncome,
    taxOnIncome: Math.round(taxOnIncome),
    rebate: Math.round(rebate),
    surcharge,
    cess,
    totalTax,
    effectiveRate,
    marginalRate,
    marginalRateLabel,
    takeHome: Math.round(clampedIncome - totalTax),
    slabData,
  };
}

function PieTooltip({ active, payload, currency }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-border rounded-xl shadow-xl p-3 text-sm">
      <p className="font-medium">{d.name}: {formatCurrency(d.value, currency)}</p>
    </div>
  );
}

function CustomTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white border border-border rounded-xl shadow-xl p-4 text-sm space-y-2">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{formatCurrency(entry.value, currency)}</span>
        </div>
      ))}
    </div>
  );
}

function SlabTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  const slab = entry?.payload;
  return (
    <div className="bg-white border border-border rounded-xl shadow-xl p-4 text-sm space-y-1.5 min-w-[160px]">
      <p className="font-medium text-foreground text-xs mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
        <span className="text-muted-foreground">Tax:</span>
        <span className="font-semibold">{formatCurrency(entry.value, currency)}</span>
      </div>
      {slab?.rate && (
        <p className="text-muted-foreground text-xs ml-4">Rate: <span className="font-medium text-foreground">{slab.rate}</span></p>
      )}
    </div>
  );
}

export default function IncomeTaxCalculator() {
  const [country, setCountry] = useState<TaxCountry>("india-new");
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [age, setAge] = useState<AgeGroup>("below60");
  const { value: income, displayValue: incomeDisplay, setValue: setIncome, handleChange: handleIncomeChange, handleFocus: handleIncomeFocus, handleBlur: handleIncomeBlur } = useNumericField(getDefaultIncome("india-new"));
  const { value: deductions, displayValue: deductionsDisplay, setValue: setDeductions, handleChange: handleDeductionsChange, handleFocus: handleDeductionsFocus, handleBlur: handleDeductionsBlur } = useNumericField(0);
  const [showSlabTable, setShowSlabTable] = useState(false);

  const config = COUNTRY_CONFIGS[country];

  const handleCountryChange = (value: string) => {
    const c = value as TaxCountry;
    setCountry(c);
    setCurrency(getCountryCurrency(c));
    setIncome(getDefaultIncome(c));
    setDeductions(0);
    setAge("below60");
  };

  const handleCurrencyChange = (value: string) => {
    setCurrency(value as CurrencyCode);
  };

  const results = useMemo(
    () => calculateTax(income, country, age, deductions),
    [income, country, age, deductions]
  );

  const pieData = useMemo(
    () => [
      { name: "Total Tax", value: results.totalTax },
      { name: "Take-Home Income", value: results.takeHome },
    ],
    [results.totalTax, results.takeHome]
  );

  const showAgeSelector = country === "india-old";
  const showDeductions = country !== "uae";
  const taxRate = results.grossIncome > 0 ? (results.totalTax / results.grossIncome) * 100 : 0;
  const isHighTax = taxRate > 25;
  const isLowTax = taxRate < 10;

  return (
    <ToolLayout
      title="Income Tax Calculator"
      description="Calculate your income tax across multiple countries and tax regimes. Supports India (New & Old), USA, UK, Canada, Australia, Singapore, and UAE with progressive tax brackets, deductions, and real-time charts."
      category="finance"
      faqContent={[
        {
          question: "What is an Income Tax Calculator?",
          answer: "An Income Tax Calculator estimates the amount of tax you owe based on your annual income, applicable deductions, and the tax laws of your country. It applies progressive tax brackets, standard deductions, surcharges, and cess to give you an accurate estimate of your tax liability and take-home income.",
        },
        {
          question: "How does the progressive tax system work?",
          answer: "In a progressive tax system, your income is taxed in slices (brackets) at increasing rates. For example, the first portion of your income may be tax-free, the next portion taxed at 10%, the next at 20%, and so on. Only the income within each bracket is taxed at that bracket's rate, not your entire income.",
        },
        {
          question: "What is the difference between New and Old tax regime in India?",
          answer: "The New Tax Regime (introduced in 2020) offers lower tax rates but eliminates most deductions and exemptions. The Old Tax Regime has higher rates but allows deductions under sections 80C (up to ₹1.5L), 80D (health insurance), HRA exemption, and more. Choose based on your investment patterns.",
        },
        {
          question: "What is the standard deduction in the US for 2024?",
          answer: "For the 2024 tax year, the US standard deduction is $14,600 for single filers, $29,200 for married couples filing jointly, and $21,900 for heads of household. This calculator uses the single filer standard deduction as the baseline.",
        },
        {
          question: "How does the UK personal allowance work?",
          answer: "The UK personal allowance is £12,570 for the 2024-25 tax year. You pay 0% tax on income up to this amount. However, the personal allowance is reduced by £1 for every £2 of income over £100,000, eventually reaching zero. This calculator handles this phase-out automatically.",
        },
        {
          question: "What is a tax rebate under section 87A in India?",
          answer: "Section 87A provides a tax rebate of up to ₹12,500 (Old Regime) or ₹25,000 (New Regime) if your total taxable income does not exceed ₹5,00,000 or ₹7,00,000 respectively. This means you effectively pay zero tax if your income is below the threshold after deductions.",
        },
        {
          question: "What is the difference between marginal and effective tax rate?",
          answer: "Your marginal tax rate is the rate you pay on your next dollar of income (the highest bracket you fall into). Your effective tax rate is the total tax you pay divided by your total income - a blended rate across all brackets. The effective rate is always lower than or equal to the marginal rate.",
        },
        {
          question: "What is health and education cess in India?",
          answer: "Health and Education Cess is an additional 4% tax levied on the total tax amount (including surcharge) in India. It was introduced to fund healthcare and education initiatives. It applies to both New and Old tax regimes.",
        },
        {
          question: "How can I reduce my taxable income legally?",
          answer: "Common legal tax reduction strategies include: contributing to retirement accounts (401k/IRA in US, PPF/NPS in India), claiming all eligible deductions (80C, 80D, HRA in India), using health savings accounts, claiming work-related expenses (where applicable), tax-loss harvesting investments, and utilizing tax-free investment options.",
        },
        {
          question: "Does this calculator account for state or provincial taxes?",
          answer: "This calculator currently estimates federal/national-level income tax only. Additional state, provincial, or local taxes may apply depending on your jurisdiction. For a complete tax picture, consult with a tax professional familiar with your location.",
        },
      ]}
      explanationContent={
        <div className="space-y-6 text-sm leading-relaxed">
          <h2 className="text-xl font-bold">What Is an Income Tax Calculator?</h2>
          <p>
            An <strong>Income Tax Calculator</strong> is a financial tool that estimates your annual tax liability
            based on your gross income, applicable tax brackets, deductions, and jurisdictional tax rules. It helps
            individuals plan their finances, compare tax regimes, and understand their effective tax burden.
          </p>

          <h3>How Income Tax Is Calculated</h3>
          <p>
            Most countries use a <strong>progressive tax system</strong> where income is divided into brackets, each
            taxed at a different rate. The formula is:
          </p>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm">
            <p>Tax = Î£ (Income in Bracket × Bracket Rate)</p>
            <p className="text-muted-foreground mt-1">Then: Tax - Rebate + Surcharge + Cess = Final Tax Payable</p>
          </div>

          <h3>Key Components</h3>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li><strong>Gross Income</strong> - Your total annual income before any deductions.</li>
            <li><strong>Standard Deduction</strong> - A fixed amount deducted from gross income (varies by country).</li>
            <li><strong>Additional Deductions</strong> - Allowable expenses like retirement contributions, insurance, or work-related costs.</li>
            <li><strong>Taxable Income</strong> - Gross income minus all deductions. This is what gets taxed.</li>
            <li><strong>Tax Brackets</strong> - Progressive slices of income taxed at increasing rates.</li>
            <li><strong>Rebate</strong> - A direct reduction in tax for low-income earners (e.g., India Section 87A).</li>
            <li><strong>Surcharge</strong> - An additional tax on high-income earners above certain thresholds.</li>
            <li><strong>Cess</strong> - A specific-purpose levy added to the total tax (e.g., India&apos;s 4% Health &amp; Education Cess).</li>
          </ul>

          <h3>Benefits of Using This Calculator</h3>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Compare tax regimes (India New vs Old) instantly.</li>
            <li>Understand your <strong>effective tax rate</strong> vs <strong>marginal tax rate</strong>.</li>
            <li>Plan tax-saving investments based on your deduction capacity.</li>
            <li>Visualize your tax breakdown by slab with interactive charts.</li>
            <li>Support for 8 countries and 12 currencies with locale-aware formatting.</li>
          </ul>

          <h3>Example Calculation</h3>
          <div className="bg-muted p-4 rounded-lg space-y-1 text-sm">
            <p className="font-medium">India New Regime - ₹12,00,000 Annual Income</p>
            <p className="text-muted-foreground">Standard Deduction: ₹50,000 | Additional Deductions: ₹0</p>
            <p className="text-muted-foreground">Taxable Income: ₹11,50,000</p>
            <p className="text-muted-foreground">₹0-3L: Nil | ₹3L-6L: ₹15,000 | ₹6L-9L: ₹30,000 | ₹9L-12L: ₹30,000</p>
            <p className="font-semibold text-primary">Total Tax (before cess): ₹75,000 | Cess (4%): ₹3,000 | Final: ₹78,000</p>
            <p className="text-muted-foreground">Effective Rate: 6.5% | Take-Home: ₹11,22,000</p>
          </div>

          <h3>Common Mistakes to Avoid</h3>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Forgetting that tax brackets are progressive - only the income within each bracket is taxed at that rate.</li>
            <li>Ignoring the difference between gross and taxable income (deductions matter).</li>
            <li>Overlooking surcharge and cess - they can add 10-40% to your tax bill.</li>
            <li>Assuming the marginal tax rate applies to your entire income.</li>
            <li>Not accounting for the UK personal allowance phase-out above £100,000.</li>
          </ul>
        </div>
      }
      relatedTools={RELATED_TOOLS}
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left: Inputs + Charts */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="tax-country" className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <Globe className="w-4 h-4 text-primary" />
              Country / Tax Regime
            </label>
            <select
              id="tax-country"
              value={country}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {Object.entries(COUNTRY_CONFIGS).map(([key, c]) => (
                <option key={key} value={key}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="tax-currency" className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <Banknote className="w-4 h-4 text-primary" />
              Currency
            </label>
            <select
              id="tax-currency"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
          </div>

          {showAgeSelector && (
            <div className="space-y-2">
              <label htmlFor="tax-age" className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <User className="w-4 h-4 text-primary" />
                Age Group
              </label>
              <select
                id="tax-age"
                value={age}
                onChange={(e) => setAge(e.target.value as AgeGroup)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {AGE_GROUPS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="tax-income" className="flex items-center gap-1.5 text-sm font-medium">
              <Wallet className="w-4 h-4 text-primary" />
              <span>Annual Gross Income</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(income, currency)}</span>
            </label>
            <input
              id="tax-income"
              type="range"
              min={0}
              max={getMaxIncome(country)}
              step={STEP}
              value={income}
              onChange={(e) => setIncome(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={getMaxIncome(country)}
              aria-valuenow={income}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCompact(getMaxIncome(country), currency)}</span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={incomeDisplay}
              onChange={(e) => handleIncomeChange(e.target.value)}
              onFocus={handleIncomeFocus}
              onBlur={handleIncomeBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter income"
            />
          </div>

          {showDeductions && config.deductionMax > 0 && (
            <div className="space-y-2">
              <label htmlFor="tax-deductions" className="flex items-center gap-1.5 text-sm font-medium">
                <Landmark className="w-4 h-4 text-primary" />
                <span>{config.deductionLabel}</span>
                <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(deductions, currency)}</span>
              </label>
              <input
                id="tax-deductions"
                type="range"
                min={0}
                max={config.deductionMax}
                step={config.deductionStep || STEP}
                value={deductions}
                onChange={(e) => setDeductions(parseFloat(e.target.value))}
                className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                aria-valuemin={0}
                aria-valuemax={config.deductionMax}
                aria-valuenow={deductions}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatCurrency(0, currency)}</span>
                <span>{formatCompact(config.deductionMax, currency)}</span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={deductionsDisplay}
                onChange={(e) => handleDeductionsChange(e.target.value)}
                onFocus={handleDeductionsFocus}
                onBlur={handleDeductionsBlur}
                className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
                placeholder="Enter deductions"
              />
            </div>
          )}

          {/* Pie Chart */}
          {results.totalTax > 0 && (
            <div className="bg-white border border-border rounded-xl p-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tax vs Take-Home</p>
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
                    <Tooltip content={<PieTooltip currency={currency} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 text-xs ml-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#ef4444]" />
                    <span className="text-muted-foreground">Tax ({taxRate.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#10b981]" />
                    <span className="text-muted-foreground">Take-Home ({(100 - taxRate).toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Gross Income</p>
                  <p className="text-sm font-semibold">{formatCurrency(results.grossIncome, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Tax Payable</p>
                  <p className="text-sm font-semibold text-red-500">{formatCurrency(results.totalTax, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Net Income</p>
                  <p className="text-sm font-semibold">{formatCurrency(results.takeHome, currency)}</p>
                </div>
              </div>
            </div>
          )}


        </div>

        {/* Right: Results Section */}
        <div className="space-y-4">
          {/* Hero Card */}
          <div className={`rounded-xl p-6 border ${results.totalTax === 0
            ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200"
            : isHighTax
              ? "bg-gradient-to-br from-red-50 to-red-100/50 border-red-200"
              : "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
            }`}>
            <div className="flex items-center gap-2 mb-3">
              <Calculator className={`w-5 h-5 ${results.totalTax === 0 ? "text-emerald-500" : isHighTax ? "text-red-500" : "text-primary"}`} />
              <p className="text-sm text-muted-foreground font-medium">Total Tax Payable</p>
            </div>
            <p className={`text-4xl font-extrabold break-words ${results.totalTax === 0 ? "text-emerald-500" : isHighTax ? "text-red-500" : "text-primary"}`}>
              {formatCurrency(results.totalTax, currency)}
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              {results.totalTax > 0 ? (
                <>
                  <ArrowUpRight className={`w-4 h-4 ${isHighTax ? "text-red-500" : "text-amber-500"}`} />
                  <span>{taxRate.toFixed(1)}% effective rate · Marginal: {results.marginalRateLabel}</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">No tax payable</span>
                </>
              )}
            </div>
          </div>

          {/* Mini Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Wallet className="w-3 h-3" />
                Taxable Income
              </p>
              <p className="text-lg font-bold break-words">{formatCurrency(results.taxableIncome, currency)}</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <PiggyBank className="w-3 h-3 text-emerald-500" />
                Take-Home Income
              </p>
              <p className="text-lg font-bold text-emerald-500 break-words">{formatCurrency(results.takeHome, currency)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <BadgePercent className="w-3 h-3 text-primary" />
                Effective Rate
              </p>
              <p className="text-lg font-bold text-primary break-words">{formatPercent(results.effectiveRate)}</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-amber-500" />
                Marginal Rate
              </p>
              <p className="text-lg font-bold text-amber-500 break-words">{results.marginalRateLabel}</p>
            </div>
          </div>

          {/* Tax Breakdown */}
          {results.totalTax > 0 && (
            <div className="bg-white border border-border rounded-xl p-4 text-sm space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Info className="w-3 h-3" />
                Tax Breakdown
              </p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Income</span>
                <span className="font-medium">{formatCurrency(results.grossIncome, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Deductions</span>
                <span className="font-medium text-emerald-500">-{formatCurrency(results.totalDeductions, currency)}</span>
              </div>
              <div className="flex justify-between border-t border-border/50 pt-2">
                <span className="font-medium">Taxable Income</span>
                <span className="font-semibold">{formatCurrency(results.taxableIncome, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax on Income</span>
                <span className="font-medium">{formatCurrency(results.taxOnIncome, currency)}</span>
              </div>
              {results.rebate > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rebate (Section 87A)</span>
                  <span className="font-medium text-emerald-500">-{formatCurrency(results.rebate, currency)}</span>
                </div>
              )}
              {results.surcharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Surcharge</span>
                  <span className="font-medium text-amber-500">+{formatCurrency(results.surcharge, currency)}</span>
                </div>
              )}
              {results.cess > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Health & Education Cess</span>
                  <span className="font-medium text-amber-500">+{formatCurrency(results.cess, currency)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border/50 pt-2 text-base">
                <span className="font-bold">Total Tax</span>
                <span className={`font-bold ${results.totalTax === 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {formatCurrency(results.totalTax, currency)}
                </span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Bar Chart - full width below grid */}
      {results.slabData.some((s) => s.value > 0) && (
        <div className="bg-white border border-border rounded-xl p-4 sm:p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tax by Slab</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={results.slabData.filter((s) => s.value > 0)} margin={{ top: 16, right: 16, left: 8, bottom: 8 }} barCategoryGap="25%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.12} vertical={false} />
              <XAxis type="category" dataKey="name" tickFormatter={(v: string) => v.split(" (")[0]} tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }} tickMargin={6} />
              <YAxis type="number" tickFormatter={(v: number) => formatCompact(v, currency)} fontSize={11} width={68} domain={[0, "dataMax"]} tickLine={false} axisLine={false} tickMargin={4} />
              <Tooltip content={<SlabTooltip currency={currency} />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={800} maxBarSize={40}>
                {results.slabData.filter((s) => s.value > 0).map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Slab Table - full width below grid */}
      {results.slabData.some((s) => s.value > 0) && (
        <div className="bg-white border border-border rounded-xl p-4 sm:p-6 mt-8">
          <button
            onClick={() => setShowSlabTable(!showSlabTable)}
            className="flex items-center gap-2 text-lg font-bold mb-2 hover:text-primary transition-colors"
            aria-expanded={showSlabTable}
          >
            <Table className="w-5 h-5 text-primary" />
            Tax Slab Breakdown
            <span className={`ml-auto text-sm font-normal text-muted-foreground transition-transform ${showSlabTable ? "rotate-180" : ""}`}>
              {showSlabTable ? "Hide" : "Show"}
            </span>
          </button>
          {showSlabTable && (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Income Slab</th>
                    <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Rate</th>
                    <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {results.slabData.map((row, idx) => (
                    <tr key={idx} className={`border-b border-border/50 hover:bg-gray-50 transition-colors ${row.value > 0 ? "" : "opacity-40"}`}>
                      <td className="py-3 px-2 font-medium">{row.name}</td>
                      <td className="text-center py-3 px-2">{row.rate}</td>
                      <td className="text-right py-3 px-2 font-semibold">
                        {row.value > 0 ? formatCurrency(row.value, currency) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </ToolLayout>
  );
}
