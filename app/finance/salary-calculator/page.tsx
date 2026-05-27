"use client";

import { useCallback, useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { ArrowUpRight, BadgePercent, Banknote, Building, Calculator, CheckCircle, FileText, Globe, Wallet } from "lucide-react";
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
// SALARY COUNTRY CONFIGURATIONS
// ===================================================================

interface SalaryCountry {
  name: string;
  code: string;
  brackets: { min: number; max: number; rate: number }[];
  standardDeduction: number;
  employeeSsRate: number;
  employeeSsMax: number;
  employeeSsLabel: string;
  employeeOtherRate: number;
  employeeOtherLabel: string;
  employeeOtherMax: number;
  employerRate: number;
  employerLabel: string;
  cessRate: number;
  description: string;
  defaultCurrency: CurrencyCode;
}

const SALARY_COUNTRIES: Record<string, SalaryCountry> = {
  usa: {
    name: "United States",
    code: "usa",
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
    employeeSsRate: 6.2,
    employeeSsMax: 168600,
    employeeSsLabel: "Social Security",
    employeeOtherRate: 1.45,
    employeeOtherLabel: "Medicare",
    employeeOtherMax: 0,
    employerRate: 7.65,
    employerLabel: "FICA (employer)",
    cessRate: 0,
    description: "Federal tax + FICA (simplified)",
    defaultCurrency: "USD",
  },
  "india-new": {
    name: "India (New Regime)",
    code: "india-new",
    brackets: [
      { min: 0, max: 300000, rate: 0 },
      { min: 300000, max: 600000, rate: 0.05 },
      { min: 600000, max: 900000, rate: 0.10 },
      { min: 900000, max: 1200000, rate: 0.15 },
      { min: 1200000, max: 1500000, rate: 0.20 },
      { min: 1500000, max: Infinity, rate: 0.30 },
    ],
    standardDeduction: 50000,
    employeeSsRate: 0,
    employeeSsMax: 0,
    employeeSsLabel: "EPF (optional)",
    employeeOtherRate: 0,
    employeeOtherLabel: "Other",
    employeeOtherMax: 0,
    employerRate: 0,
    employerLabel: "Employer PF",
    cessRate: 4,
    description: "New tax regime + 4% cess",
    defaultCurrency: "INR",
  },
  uk: {
    name: "United Kingdom",
    code: "uk",
    brackets: [
      { min: 0, max: 12570, rate: 0 },
      { min: 12570, max: 50270, rate: 0.20 },
      { min: 50270, max: 125140, rate: 0.40 },
      { min: 125140, max: Infinity, rate: 0.45 },
    ],
    standardDeduction: 0,
    employeeSsRate: 8,
    employeeSsMax: 50270,
    employeeSsLabel: "National Insurance",
    employeeOtherRate: 2,
    employeeOtherLabel: "NI (higher)",
    employeeOtherMax: 0,
    employerRate: 13.8,
    employerLabel: "Employer NI",
    cessRate: 0,
    description: "Income Tax + NI (simplified)",
    defaultCurrency: "GBP",
  },
  canada: {
    name: "Canada",
    code: "canada",
    brackets: [
      { min: 0, max: 55867, rate: 0.15 },
      { min: 55867, max: 111733, rate: 0.205 },
      { min: 111733, max: 173205, rate: 0.26 },
      { min: 173205, max: 246752, rate: 0.29 },
      { min: 246752, max: Infinity, rate: 0.33 },
    ],
    standardDeduction: 15705,
    employeeSsRate: 5.95,
    employeeSsMax: 68500,
    employeeSsLabel: "CPP",
    employeeOtherRate: 1.63,
    employeeOtherLabel: "EI",
    employeeOtherMax: 63200,
    employerRate: 8.23,
    employerLabel: "CPP + EI (employer)",
    cessRate: 0,
    description: "Federal tax + CPP + EI",
    defaultCurrency: "CAD",
  },
  australia: {
    name: "Australia",
    code: "australia",
    brackets: [
      { min: 0, max: 18200, rate: 0 },
      { min: 18200, max: 45000, rate: 0.16 },
      { min: 45000, max: 135000, rate: 0.30 },
      { min: 135000, max: 190000, rate: 0.37 },
      { min: 190000, max: Infinity, rate: 0.45 },
    ],
    standardDeduction: 0,
    employeeSsRate: 0,
    employeeSsMax: 0,
    employeeSsLabel: "Super (employer)",
    employeeOtherRate: 2,
    employeeOtherLabel: "Medicare Levy",
    employeeOtherMax: 0,
    employerRate: 11.5,
    employerLabel: "Super Guarantee",
    cessRate: 0,
    description: "Income Tax + Medicare Levy",
    defaultCurrency: "AUD",
  },
  germany: {
    name: "Germany",
    code: "germany",
    brackets: [
      { min: 0, max: 11784, rate: 0 },
      { min: 11784, max: 66761, rate: 0.30 },
      { min: 66761, max: 277826, rate: 0.42 },
      { min: 277826, max: Infinity, rate: 0.45 },
    ],
    standardDeduction: 0,
    employeeSsRate: 19.7,
    employeeSsMax: 90000,
    employeeSsLabel: "Social (health/pension/etc.)",
    employeeOtherRate: 0,
    employeeOtherLabel: "",
    employeeOtherMax: 0,
    employerRate: 19.7,
    employerLabel: "Social (employer share)",
    cessRate: 0,
    description: "Income Tax + Social (approx.)",
    defaultCurrency: "EUR",
  },
  france: {
    name: "France",
    code: "france",
    brackets: [
      { min: 0, max: 11294, rate: 0 },
      { min: 11294, max: 28797, rate: 0.11 },
      { min: 28797, max: 82341, rate: 0.30 },
      { min: 82341, max: 177106, rate: 0.41 },
      { min: 177106, max: Infinity, rate: 0.45 },
    ],
    standardDeduction: 0,
    employeeSsRate: 9.7,
    employeeSsMax: 0,
    employeeSsLabel: "CSG / CRDS",
    employeeOtherRate: 0,
    employeeOtherLabel: "",
    employeeOtherMax: 0,
    employerRate: 42,
    employerLabel: "Employer charges (approx.)",
    cessRate: 0,
    description: "Income Tax + CSG/CRDS (simplified)",
    defaultCurrency: "EUR",
  },
  singapore: {
    name: "Singapore",
    code: "singapore",
    brackets: [
      { min: 0, max: 20000, rate: 0 },
      { min: 20000, max: 30000, rate: 0.02 },
      { min: 30000, max: 40000, rate: 0.035 },
      { min: 40000, max: 80000, rate: 0.07 },
      { min: 80000, max: 120000, rate: 0.115 },
      { min: 120000, max: 160000, rate: 0.15 },
      { min: 160000, max: 200000, rate: 0.18 },
      { min: 200000, max: 240000, rate: 0.19 },
      { min: 240000, max: 320000, rate: 0.195 },
      { min: 320000, max: Infinity, rate: 0.20 },
    ],
    standardDeduction: 0,
    employeeSsRate: 20,
    employeeSsMax: 6000,
    employeeSsLabel: "CPF (employee)",
    employeeOtherRate: 0,
    employeeOtherLabel: "",
    employeeOtherMax: 0,
    employerRate: 17,
    employerLabel: "CPF (employer)",
    cessRate: 0,
    description: "Income Tax + CPF (simplified)",
    defaultCurrency: "SGD",
  },
  uae: {
    name: "UAE",
    code: "uae",
    brackets: [{ min: 0, max: Infinity, rate: 0 }],
    standardDeduction: 0,
    employeeSsRate: 0,
    employeeSsMax: 0,
    employeeSsLabel: "No SS",
    employeeOtherRate: 0,
    employeeOtherLabel: "",
    employeeOtherMax: 0,
    employerRate: 0,
    employerLabel: "No employer tax",
    cessRate: 0,
    description: "No income tax",
    defaultCurrency: "AED",
  },
};

// ===================================================================
// CONSTANTS
// ===================================================================

const PIE_COLORS = ["#10b981", "#ef4444", "#f59e0b", "#6366f1"];

const RELATED_TOOLS = [
  { name: "Income Tax Calculator", href: "/finance/income-tax-calculator", desc: "Estimate your annual income tax with detailed bracket breakdowns." },
  { name: "Freelance Tax Estimator", href: "/finance/freelance-tax-estimator", desc: "Estimate taxes for freelance and self-employed income." },
  { name: "GST Calculator", href: "/finance/gst-calculator", desc: "Calculate Goods and Services Tax for 15+ countries." },
  { name: "Net Worth Calculator", href: "/finance/net-worth-calculator", desc: "Calculate your total net worth including assets and liabilities." },
];

// ===================================================================
// TYPES
// ===================================================================

interface SalaryResults {
  grossAnnual: number;
  standardDeduction: number;
  taxableIncome: number;
  incomeTax: number;
  cessAmount: number;
  ssDeduction: number;
  ssLabel: string;
  otherDeduction: number;
  otherLabel: string;
  totalDeductions: number;
  netAnnual: number;
  netMonthly: number;
  netBiweekly: number;
  netWeekly: number;
  effectiveRate: number;
  employerContribution: number;
  employerLabel: string;
  totalEmployerCost: number;
  hasTax: boolean;
}

// ===================================================================
// CALCULATION ENGINE
// ===================================================================

const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

function calculateSalary(grossAnnual: number, country: SalaryCountry): SalaryResults {
  const g = clamp(Number.isFinite(grossAnnual) ? Math.max(0, grossAnnual) : 0, 0, 1e9);

  const taxableIncome = Math.max(0, g - country.standardDeduction);
  let incomeTax = 0;
  let remaining = taxableIncome;

  for (const b of country.brackets) {
    if (remaining <= 0) break;
    const width = b.max === Infinity ? remaining : Math.min(remaining, b.max - b.min);
    incomeTax += width * b.rate;
    remaining -= width;
  }

  const cessAmount = incomeTax * (country.cessRate / 100);
  const totalIncomeTax = incomeTax + cessAmount;

  const ssMax = country.employeeSsMax > 0 ? country.employeeSsMax : Infinity;
  const ssIncome = Math.min(g, ssMax);
  const ssDeduction = ssIncome * (country.employeeSsRate / 100);

  const otherMax = country.employeeOtherMax > 0 ? country.employeeOtherMax : Infinity;
  const otherIncome = Math.min(g, otherMax);
  const otherDeduction = otherIncome * (country.employeeOtherRate / 100);

  const totalDeductions = totalIncomeTax + ssDeduction + otherDeduction;
  const netAnnual = Math.max(0, g - totalDeductions);
  const netMonthly = netAnnual / 12;
  const netBiweekly = netAnnual / 26;
  const netWeekly = netAnnual / 52;

  const employerContribution = g * (country.employerRate / 100);
  const totalEmployerCost = g + employerContribution;

  return {
    grossAnnual: g,
    standardDeduction: country.standardDeduction,
    taxableIncome,
    incomeTax: totalIncomeTax,
    cessAmount,
    ssDeduction,
    ssLabel: country.employeeSsLabel,
    otherDeduction,
    otherLabel: country.employeeOtherLabel,
    totalDeductions,
    netAnnual,
    netMonthly,
    netBiweekly,
    netWeekly,
    effectiveRate: g > 0 ? (totalDeductions / g) * 100 : 0,
    employerContribution,
    employerLabel: country.employerLabel,
    totalEmployerCost,
    hasTax: totalDeductions > 0.005,
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

export default function SalaryCalculator() {
  const [countryCode, setCountryCode] = useState("usa");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const { value: grossSalary, displayValue: grossSalaryDisplay, setValue: setGrossSalary, handleChange: handleSalaryInput, handleFocus: handleSalaryFocus, handleBlur: handleSalaryBlur } = useNumericField(75000);

  const country = SALARY_COUNTRIES[countryCode];
  const maxAmount = useMemo(() => getMaxAmount(currency), [currency]);
  const step = useMemo(() => getSliderStep(currency), [currency]);

  const results = useMemo<SalaryResults>(
    () => calculateSalary(grossSalary, country),
    [grossSalary, country],
  );

  const pieData = useMemo(() => {
    const data: { name: string; value: number }[] = [
      { name: "Net Take-Home", value: Math.max(0, results.netAnnual) },
      { name: "Income Tax", value: results.incomeTax },
    ];
    if (results.ssDeduction > 0) data.push({ name: results.ssLabel, value: results.ssDeduction });
    if (results.otherDeduction > 0) {
      data.push({
        name: results.otherLabel || "Other Deductions",
        value: results.otherDeduction,
      });
    }
    return data;
  }, [results.netAnnual, results.incomeTax, results.ssDeduction, results.otherDeduction, results.ssLabel, results.otherLabel]);

  const showPie = results.hasTax || results.grossAnnual > 0;

  // --- Handlers ---

  const handleCountryChange = useCallback((val: string) => {
    setCountryCode(val);
    const c = SALARY_COUNTRIES[val];
    if (c) setCurrency(c.defaultCurrency);
  }, []);

  const handleCurrencyChange = useCallback((val: string) => {
    setCurrency(val as CurrencyCode);
  }, []);



  return (
    <ToolLayout
      title="Salary / Take Home Calculator"
      description="Calculate your net take-home salary after income tax and social security deductions for 10+ countries with real-time charts and multi-currency support."
      category="finance"
      faqContent={[
        {
          question: "How is my take-home salary calculated?",
          answer: "Your take-home salary (net pay) is your gross annual salary minus all deductions: income tax, social security contributions, and any other mandatory deductions. The formula is: Net Pay = Gross Salary - Income Tax - Social Security - Other Deductions. This calculator also shows your monthly, bi-weekly, and weekly take-home amounts.",
        },
        {
          question: "What is the difference between gross salary and net salary?",
          answer: "Gross salary is the total compensation offered by your employer before any deductions. Net salary (take-home pay) is the amount that actually reaches your bank account after all deductions. The difference includes: income tax (national/federal and state/provincial), social security contributions (pension, healthcare, unemployment insurance), and other mandatory charges.",
        },
        {
          question: "What is the difference between a salary calculator and an income tax calculator?",
          answer: "An income tax calculator focuses specifically on computing your tax liability based on progressive tax brackets. A salary calculator is more comprehensive - it starts with your gross salary and deducts income tax PLUS social security, Medicare, pension contributions, and other mandatory charges to show your true take-home pay. A salary calculator also shows pay breakdowns by month, bi-week, and week.",
        },
        {
          question: "How do employer costs affect my salary?",
          answer: "Employer costs are the total amount your employer pays beyond your gross salary. This includes employer-side social security, pension contributions, health insurance, and payroll taxes. In France, employer charges can add 42% on top of your gross salary. In Singapore, employer CPF adds 17%. This calculator shows your total employer cost to give you the full picture of your compensation.",
        },
        {
          question: "How does Social Security work in the US?",
          answer: "In the US, FICA taxes fund Social Security and Medicare. Employees pay 6.2% for Social Security (up to $168,600 in 2024) and 1.45% for Medicare (no cap). Employers match these contributions with an additional 7.65%. Self-employed individuals pay the full 15.3%. This calculator uses these standard rates to compute your US take-home pay.",
        },
        {
          question: "How does the UK National Insurance system work?",
          answer: "In the UK, National Insurance (NI) is paid alongside income tax. For employees (Class 1), the rate is 8% on earnings between Â£12,570 and Â£50,270 per year, and 2% on earnings above Â£50,270. Employers also pay 13.8% NI on earnings above Â£9,100. NI contributions count toward your state pension and certain benefits.",
        },
        {
          question: "What is the difference between the old and new tax regime in India?",
          answer: "India's new tax regime (introduced in 2020 and revised in 2023) offers lower tax rates but removes most deductions and exemptions. The old regime has higher rates but allows deductions under 80C (up to ₹1.5L), 80D (health insurance), and HRA exemption. This calculator uses the new regime rates with the standard deduction of ₹50,000 and 4% cess.",
        },
        {
          question: "How is CPF calculated in Singapore?",
          answer: "Singapore's Central Provident Fund (CPF) is a mandatory social security savings scheme. For employees aged 55 and below, the employee contribution rate is 20% of wages up to $6,000/month ($74,400/year). The employer contributes an additional 17%. CPF contributions go into Ordinary, Special, and MediSave accounts for housing, retirement, and healthcare.",
        },
        {
          question: "What deductions apply in countries with no income tax?",
          answer: "In countries like the UAE and Saudi Arabia, there is no personal income tax for most employees. However, some social security contributions may still apply for GCC nationals. For expats in the UAE, there are typically no deductions from salary, meaning your gross salary equals your take-home pay (100% net). This makes these countries attractive for high earners.",
        },
        {
          question: "How do German social contributions work?",
          answer: "Germany has a comprehensive social security system with contributions split between employee and employer. The employee share is approximately 19.7% of gross salary (capped at around €90,000/year), covering: pension insurance (9.3%), health insurance (~7.3% average), unemployment insurance (1.3%), and long-term care insurance (~1.8%). Employers match most of these contributions.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a Salary / Take Home Calculator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A Salary / Take Home Calculator helps employees understand their true net income by computing all
              mandatory deductions from their gross salary. It factors in <strong>progressive income tax</strong>,
              <strong> social security contributions</strong>, and other country-specific deductions to show exactly
              how much you take home each month, bi-week, and week. It also reveals the total cost to your employer.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p>Taxable Income = Gross Salary - Standard Deduction</p>
              <p>Income Tax = Î£(Taxable Income in Bracket × Bracket Rate)</p>
              <p>Social Security = min(Gross, SS Max) × (SS Rate ÷ 100)</p>
              <p>Total Deductions = Income Tax + Social Security + Other Deductions</p>
              <p><strong>Net Annual Pay = Gross Salary - Total Deductions</strong></p>
              <br />
              <p>Monthly Pay = Net Annual ÷ 12</p>
              <p>Bi-Weekly Pay = Net Annual ÷ 26</p>
              <p>Weekly Pay = Net Annual ÷ 52</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Benefits of Using This Calculator</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              <li><strong>10+ Country Support:</strong> Pre-configured tax brackets and social security rates for USA, India, UK, Canada, Australia, Germany, France, Singapore, UAE, and more.</li>
              <li><strong>Global Currencies:</strong> Results in 29+ currencies with proper locale-aware formatting.</li>
              <li><strong>Multiple Pay Frequencies:</strong> View your take-home pay annually, monthly, bi-weekly, and weekly.</li>
              <li><strong>Employer Cost View:</strong> See the total cost to your employer including employer-side contributions.</li>
              <li><strong>Real-Time Visuals:</strong> Pie chart shows the breakdown of your salary into take-home, tax, and deductions.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Scenario: US employee with a $75,000 annual gross salary (2024).</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Standard Deduction: $14,600 → Taxable Income: <strong>$60,400</strong></li>
                <li>Income Tax: $1,160 (10% of $11,600) + $4,266 (12% of $35,550) + $2,915 (22% of $13,250) = <strong>$8,341</strong></li>
                <li>Social Security: $75,000 × 6.2% = <strong>$4,650</strong></li>
                <li>Medicare: $75,000 × 1.45% = <strong>$1,088</strong></li>
                <li><strong>Net Annual = $75,000 - $8,341 - $4,650 - $1,088 = $60,921</strong></li>
                <li>Monthly Net = $60,921 ÷ 12 ≈ <strong>$5,077</strong></li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Common Mistakes to Avoid</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed text-muted-foreground">
              <li>Confusing gross salary with take-home pay - always budget based on your net income.</li>
              <li>Forgetting about employer-side contributions when negotiating salary or comparing offers.</li>
              <li>Not accounting for social security caps - contributions stop once you exceed the annual maximum.</li>
              <li>Assuming the same tax rules apply across all countries when relocating for work.</li>
              <li>Ignoring state, provincial, or cantonal taxes that may apply on top of federal/national taxes.</li>
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
            <label htmlFor="salary-country" className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <Globe className="w-4 h-4 text-primary" />
              Country / Tax Regime
            </label>
            <select
              id="salary-country"
              value={countryCode}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {Object.entries(SALARY_COUNTRIES).map(([key, c]) => (
                <option key={key} value={key}>{c.name} - {c.description}</option>
              ))}
            </select>
          </div>

          {/* Currency Select */}
          <div className="space-y-2">
            <label htmlFor="salary-currency" className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <Banknote className="w-4 h-4 text-primary" />
              Currency
            </label>
            <select
              id="salary-currency"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} - {c.label} ({c.symbol})</option>
              ))}
            </select>
          </div>

          {/* Gross Salary Input */}
          <div className="space-y-2">
            <label htmlFor="salary-gross" className="flex items-center gap-1.5 text-sm font-medium">
              <Wallet className="w-4 h-4 text-primary" />
              <span>Gross Annual Salary</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(grossSalary, currency)}</span>
            </label>
            <input
              id="salary-gross"
              type="range"
              min={0}
              max={maxAmount}
              step={step}
              value={Math.min(grossSalary, maxAmount)}
              onChange={(e) => setGrossSalary(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={maxAmount}
              aria-valuenow={grossSalary}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCompact(maxAmount, currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={grossSalaryDisplay}
              onChange={(e) => handleSalaryInput(e.target.value)}
              onFocus={handleSalaryFocus}
              onBlur={handleSalaryBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter gross salary"
            />
          </div>

          {/* Pie Chart */}
          {showPie && (
            <div className="bg-white border border-border rounded-xl p-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Salary Breakdown
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
                        {d.name} ({results.grossAnnual > 0 ? ((d.value / results.grossAnnual) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Gross Salary</p>
                  <p className="text-sm font-semibold">{formatCurrency(results.grossAnnual, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Total Tax</p>
                  <p className="text-sm font-semibold text-red-500">{formatCurrency(results.incomeTax, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Take-Home</p>
                  <p className="text-sm font-semibold">{formatCurrency(results.netAnnual, currency)}</p>
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
              !results.hasTax
                ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200"
                : results.effectiveRate >= 30
                  ? "bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200"
                  : "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20",
            )}
          >
            <div className="flex items-center gap-2 mb-3">
              <Wallet
                className={cn(
                  "w-5 h-5",
                  !results.hasTax ? "text-emerald-500" : results.effectiveRate >= 30 ? "text-amber-500" : "text-primary",
                )}
              />
              <p className="text-sm text-muted-foreground font-medium">Net Annual Take-Home Pay</p>
            </div>
            <p
              className={cn(
                "text-4xl font-extrabold break-words",
                !results.hasTax
                  ? "text-emerald-500"
                  : results.effectiveRate >= 30
                    ? "text-amber-500"
                    : "text-primary",
              )}
            >
              {formatCurrency(results.netAnnual, currency)}
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              {results.hasTax ? (
                <>
                  <ArrowUpRight className={cn("w-4 h-4", results.effectiveRate >= 30 ? "text-amber-500" : "text-primary")} />
                  <span>{results.effectiveRate.toFixed(1)}% effective deduction rate</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">No deductions - full take-home</span>
                </>
              )}
            </div>
          </div>

          {/* Mini Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Calculator className="w-3 h-3 text-emerald-500" />
                Monthly Take-Home
              </p>
              <p className="text-lg font-bold text-emerald-500 break-words">
                {formatCurrency(results.netMonthly, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Calculator className="w-3 h-3 text-blue-500" />
                Bi-Weekly Take-Home
              </p>
              <p className="text-lg font-bold text-blue-500 break-words">
                {formatCurrency(results.netBiweekly, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Calculator className="w-3 h-3 text-purple-500" />
                Weekly Take-Home
              </p>
              <p className="text-lg font-bold text-purple-500 break-words">
                {formatCurrency(results.netWeekly, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <BadgePercent className="w-3 h-3 text-primary" />
                Total Deductions
              </p>
              <p className="text-lg font-bold text-primary break-words">
                {formatCurrency(results.totalDeductions, currency)}
              </p>
            </div>
          </div>

          {/* Summary Breakdown */}
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Annual Breakdown
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Gross Annual Salary</span>
                <span className="font-medium">{formatCurrency(results.grossAnnual, currency)}</span>
              </div>
              {results.standardDeduction > 0 && (
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Standard Deduction</span>
                  <span className="font-medium">-{formatCurrency(results.standardDeduction, currency)}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Taxable Income</span>
                <span className="font-medium">{formatCurrency(results.taxableIncome, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Income Tax</span>
                <span className="font-medium text-red-500">-{formatCurrency(results.incomeTax, currency)}</span>
              </div>
              {results.ssDeduction > 0 && (
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">{results.ssLabel}</span>
                  <span className="font-medium text-amber-500">-{formatCurrency(results.ssDeduction, currency)}</span>
                </div>
              )}
              {results.otherDeduction > 0 && (
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">{results.otherLabel}</span>
                  <span className="font-medium text-indigo-500">-{formatCurrency(results.otherDeduction, currency)}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground font-medium">Total Deductions</span>
                <span className="font-medium">-{formatCurrency(results.totalDeductions, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-medium">Net Annual Take-Home</span>
                <span className="font-bold text-primary">{formatCurrency(results.netAnnual, currency)}</span>
              </div>
            </div>
          </div>

          {/* Employer Cost */}
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <Building className="w-3 h-3" />
              Employer Cost Breakdown
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Gross Salary</span>
                <span className="font-medium">{formatCurrency(results.grossAnnual, currency)}</span>
              </div>
              {results.employerContribution > 0 && (
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">{results.employerLabel}</span>
                  <span className="font-medium text-amber-500">+{formatCurrency(results.employerContribution, currency)}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5">
                <span className="font-medium">Total Employer Cost</span>
                <span className="font-bold text-primary">{formatCurrency(results.totalEmployerCost, currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </ToolLayout>
  );
}
