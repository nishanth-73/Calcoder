"use client";

import { useCallback, useMemo, useState } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { ArrowUpRight, BadgePercent, Banknote, Briefcase, Calculator, CheckCircle, FileText, Globe, Wallet } from "lucide-react";
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
// FREELANCE COUNTRY CONFIGURATIONS
// ===================================================================

interface FreelanceCountry {
  name: string;
  code: string;
  brackets: { min: number; max: number; rate: number }[];
  standardDeduction: number;
  seBrackets: { min: number; max: number; rate: number }[];
  seEffectiveBase: number;
  seHalfDeductible: boolean;
  seLabel: string;
  description: string;
  defaultCurrency: CurrencyCode;
}

const FREELANCE_COUNTRIES: Record<string, FreelanceCountry> = {
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
    seBrackets: [
      { min: 0, max: 168600, rate: 0.153 },
      { min: 168600, max: Infinity, rate: 0.029 },
    ],
    seEffectiveBase: 92.35,
    seHalfDeductible: true,
    seLabel: "Self-Employment Tax",
    description: "Federal + SE tax (15.3%)",
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
    seBrackets: [{ min: 0, max: Infinity, rate: 0 }],
    seEffectiveBase: 100,
    seHalfDeductible: false,
    seLabel: "No SE Tax",
    description: "New regime + 4% cess",
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
    seBrackets: [
      { min: 0, max: 12570, rate: 0 },
      { min: 12570, max: 50270, rate: 0.06 },
      { min: 50270, max: Infinity, rate: 0.02 },
    ],
    seEffectiveBase: 100,
    seHalfDeductible: false,
    seLabel: "Class 4 NI",
    description: "Income Tax + Class 4 NI",
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
    seBrackets: [
      { min: 0, max: 68500, rate: 0.119 },
      { min: 68500, max: Infinity, rate: 0 },
    ],
    seEffectiveBase: 100,
    seHalfDeductible: false,
    seLabel: "CPP (self-employed)",
    description: "Federal tax + CPP (11.9%)",
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
    seBrackets: [{ min: 0, max: Infinity, rate: 0 }],
    seEffectiveBase: 100,
    seHalfDeductible: false,
    seLabel: "No SE Tax",
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
    seBrackets: [
      { min: 0, max: 90000, rate: 0.35 },
      { min: 90000, max: Infinity, rate: 0.20 },
    ],
    seEffectiveBase: 100,
    seHalfDeductible: false,
    seLabel: "Social (self-employed)",
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
    seBrackets: [
      { min: 0, max: Infinity, rate: 0.22 },
    ],
    seEffectiveBase: 100,
    seHalfDeductible: false,
    seLabel: "URSSAF (approx.)",
    description: "Income Tax + URSSAF (22%)",
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
    seBrackets: [{ min: 0, max: Infinity, rate: 0 }],
    seEffectiveBase: 100,
    seHalfDeductible: false,
    seLabel: "No SE Tax",
    description: "No self-employment tax",
    defaultCurrency: "SGD",
  },
  uae: {
    name: "UAE",
    code: "uae",
    brackets: [{ min: 0, max: Infinity, rate: 0 }],
    standardDeduction: 0,
    seBrackets: [{ min: 0, max: Infinity, rate: 0 }],
    seEffectiveBase: 100,
    seHalfDeductible: false,
    seLabel: "No Tax",
    description: "No income tax",
    defaultCurrency: "AED",
  },
};

// ===================================================================
// CONSTANTS
// ===================================================================

const PIE_COLORS = ["#10b981", "#ef4444", "#f59e0b"];

const RELATED_TOOLS = [
  { name: "Income Tax Calculator", href: "/finance/income-tax-calculator", desc: "Estimate your annual income tax with detailed bracket breakdowns." },
  { name: "Salary / Take Home Calculator", href: "/finance/salary-calculator", desc: "Calculate your net take-home salary after tax and social security." },
  { name: "GST Calculator", href: "/finance/gst-calculator", desc: "Calculate Goods and Services Tax for 15+ countries." },
  { name: "Profit Margin Calculator", href: "/finance/profit-margin-calculator", desc: "Calculate gross and net profit margins on products." },
];

// ===================================================================
// TYPES
// ===================================================================

interface FreelanceResults {
  grossIncome: number;
  expenses: number;
  netIncome: number;
  seEffectiveBaseAmount: number;
  seTax: number;
  seLabel: string;
  seDeduction: number;
  taxableIncome: number;
  incomeTax: number;
  cessAmount: number;
  standardDeduction: number;
  totalTax: number;
  netAfterTax: number;
  effectiveRate: number;
  monthlySetAside: number;
  quarterlySetAside: number;
  hasTax: boolean;
}

// ===================================================================
// CALCULATION ENGINE
// ===================================================================

const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

function calculateBracketTax(income: number, brackets: { min: number; max: number; rate: number }[]): number {
  let tax = 0;
  let remaining = income;
  for (const b of brackets) {
    if (remaining <= 0) break;
    const taxable = b.max === Infinity ? remaining : Math.min(remaining, b.max - b.min);
    tax += taxable * b.rate;
    remaining -= taxable;
  }
  return tax;
}

function calculateFreelance(grossIncome: number, expenses: number, country: FreelanceCountry): FreelanceResults {
  const g = clamp(Number.isFinite(grossIncome) ? Math.max(0, grossIncome) : 0, 0, 1e9);
  const e = clamp(Number.isFinite(expenses) ? Math.max(0, expenses) : 0, 0, g);
  const net = g - e;

  const seBase = net * (country.seEffectiveBase / 100);
  const seTax = calculateBracketTax(seBase, country.seBrackets);
  const seDeduction = country.seHalfDeductible ? seTax / 2 : 0;

  const taxableIncome = Math.max(0, net - country.standardDeduction - seDeduction);
  const incomeTax = calculateBracketTax(taxableIncome, country.brackets);

  const cess = incomeTax * (country.code === "india-new" ? 0.04 : 0);
  const totalIncomeTax = incomeTax + cess;
  const totalTax = totalIncomeTax + seTax;
  const netAfterTax = Math.max(0, net - totalTax);

  return {
    grossIncome: g,
    expenses: e,
    netIncome: net,
    seEffectiveBaseAmount: seBase,
    seTax,
    seLabel: country.seLabel,
    seDeduction,
    taxableIncome,
    incomeTax: totalIncomeTax,
    cessAmount: cess,
    standardDeduction: country.standardDeduction,
    totalTax,
    netAfterTax,
    effectiveRate: g > 0 ? (totalTax / g) * 100 : 0,
    monthlySetAside: totalTax / 12,
    quarterlySetAside: totalTax / 4,
    hasTax: totalTax > 0.005,
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

export default function FreelanceTaxEstimator() {
  const [countryCode, setCountryCode] = useState("usa");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const { value: grossIncome, displayValue: grossIncomeDisplay, setValue: setGrossIncome, handleChange: handleIncomeInput, handleFocus: handleIncomeFocus, handleBlur: handleIncomeBlur } = useNumericField(80000);
  const { value: expenses, displayValue: expensesDisplay, setValue: setExpenses, handleChange: handleExpensesInput, handleFocus: handleExpensesFocus, handleBlur: handleExpensesBlur } = useNumericField(15000);

  const country = FREELANCE_COUNTRIES[countryCode];
  const maxAmount = useMemo(() => getMaxAmount(currency), [currency]);
  const step = useMemo(() => getSliderStep(currency), [currency]);

  const results = useMemo<FreelanceResults>(
    () => calculateFreelance(grossIncome, expenses, country),
    [grossIncome, expenses, country],
  );

  const pieData = useMemo(() => {
    const data: { name: string; value: number }[] = [
      { name: "Net After Tax", value: Math.max(0, results.netAfterTax) },
      { name: "Income Tax", value: results.incomeTax },
    ];
    if (results.seTax > 0) data.push({ name: results.seLabel, value: results.seTax });
    return data;
  }, [results.netAfterTax, results.incomeTax, results.seTax, results.seLabel]);

  const showPie = results.grossIncome > 0;

  // --- Handlers ---

  const handleCountryChange = useCallback((val: string) => {
    setCountryCode(val);
    const c = FREELANCE_COUNTRIES[val];
    if (c) setCurrency(c.defaultCurrency);
  }, []);

  const handleCurrencyChange = useCallback((val: string) => {
    setCurrency(val as CurrencyCode);
  }, []);



  return (
    <ToolLayout
      title="Freelance Tax Estimator"
      description="Estimate taxes for freelance and self-employed income across 10+ countries with self-employment tax, business expenses, and real-time charts."
      category="finance"
      faqContent={[
        {
          question: "How is freelance tax calculated?",
          answer: "Freelance tax is calculated differently from employee tax because freelancers are both employer and employee. The formula is: Net Income = Gross Revenue - Business Expenses. Then: Self-Employment Tax is calculated on net income (in countries like the US and UK), followed by Income Tax on the remaining income after deductions. Total Tax = SE Tax + Income Tax. Net After Tax = Net Income - Total Tax.",
        },
        {
          question: "What is self-employment tax and how does it work?",
          answer: "Self-employment (SE) tax is the equivalent of the employer and employee portions of Social Security and Medicare that employed people have withheld from their paychecks. In the US, the SE tax rate is 15.3% (12.4% for Social Security + 2.9% for Medicare) on 92.35% of your net earnings. Half of the SE tax is deductible from your income for income tax purposes. In the UK, freelancers pay Class 4 National Insurance at 6% and 2% rates.",
        },
        {
          question: "What business expenses can I deduct as a freelancer?",
          answer: "Common deductible business expenses include: home office costs (portion of rent, utilities, internet), equipment (computers, software, phones), professional services (accountant, lawyer), marketing and advertising, travel and meals, education and training, health insurance premiums (in some countries), retirement contributions, and office supplies. Always keep detailed records and consult a tax professional for country-specific rules.",
        },
        {
          question: "How do quarterly estimated tax payments work?",
          answer: "In many countries (US, UK, Canada), freelancers must pay estimated taxes quarterly instead of having taxes withheld from each paycheck. In the US, estimated payments are due April 15, June 15, September 15, and January 15 of the following year. Each payment should be roughly 25-30% of your annual tax bill. This calculator shows your estimated quarterly and monthly set-aside amounts to help you plan.",
        },
        {
          question: "What is the difference between freelancer and employee taxation?",
          answer: "Employees have taxes withheld automatically from each paycheck - half of FICA (7.65%) is paid by the employer and half by the employee. Freelancers pay the full 15.3% SE tax themselves (though half is deductible). Freelancers also need to track and pay estimated quarterly taxes, manage their own retirement savings, and can deduct business expenses that employees cannot.",
        },
        {
          question: "How does 44ADA presumptive taxation work for Indian freelancers?",
          answer: "Section 44ADA of the Indian Income Tax Act allows freelancers in specified professions (legal, medical, engineering, architecture, accounting, technical consultancy, interior decoration) to declare only 50% of their gross receipts as income. This simplifies record-keeping. This calculator uses the actual income approach with deductions, but you may opt for presumptive taxation under 44ADA for simplicity.",
        },
        {
          question: "What is the UK Class 4 National Insurance for self-employed?",
          answer: "UK self-employed people pay Class 4 National Insurance on their profits. For the 2024-25 tax year, the rate is 6% on profits between Â£12,570 and Â£50,270, and 2% on profits above Â£50,270. Additionally, Class 2 NI (Â£3.45/week) may apply if profits exceed Â£12,570, though it was recently abolished for most self-employed people. This calculator handles Class 4 NI.",
        },
        {
          question: "How does the French micro-entrepreneur (auto-entrepreneur) regime work?",
          answer: "France's micro-entrepreneur regime offers simplified taxation for freelancers with revenue below certain thresholds. Social charges (URSSAF) are roughly 22% of gross revenue for service providers - this covers health insurance, pension, and other social benefits. Income tax is separate and can be paid via a withholding scheme (prÃ©lÃ¨vement libÃ©ratoire) or filed annually. This calculator models the standard URSSAF rate.",
        },
        {
          question: "What tax-free countries are best for freelancers?",
          answer: "The UAE and several Middle Eastern countries have no personal income tax, making them attractive for freelancers. Singapore has low income tax rates (capped at 20%) and no self-employment tax. These jurisdictions can significantly increase your net take-home pay. However, you'll need to consider visa requirements, cost of living, and the lack of social safety net benefits like state pensions.",
        },
        {
          question: "How should I save for taxes as a freelancer?",
          answer: "A good rule of thumb is to set aside 25-35% of each freelance payment in a separate savings account. This calculator shows your exact monthly and quarterly set-aside amounts. For US freelancers, the recommended approach is: open a separate high-yield savings account, transfer your set-aside amount after each payment, and pay estimated taxes quarterly using IRS Direct Pay or EFTPS.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a Freelance Tax Estimator?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A Freelance Tax Estimator helps self-employed professionals calculate their total tax liability,
              including both <strong>income tax</strong> and <strong>self-employment tax</strong> (Social Security,
              Medicare, National Insurance, or equivalent). It accounts for business expenses, standard deductions,
              and country-specific self-employment tax rules to show your true net income after taxes.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p>Net Business Income = Gross Revenue - Business Expenses</p>
              <p>SE Tax Base = Net Income × SE Effective Base %</p>
              <p>Self-Employment Tax = Î£(SE Base in each bracket × bracket rate)</p>
              <p>Taxable Income = Net Income - Standard Deduction - Â½ SE Tax (if deductible)</p>
              <p>Income Tax = Î£(Taxable Income in each bracket × bracket rate)</p>
              <p><strong>Total Tax = Income Tax + Self-Employment Tax</strong></p>
              <p><strong>Net After Tax = Net Income - Total Tax</strong></p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Benefits of Using This Calculator</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              <li><strong>Self-Employment Tax Support:</strong> Handles SE tax computation for US (15.3% with 92.35% base), UK (Class 4 NI), Canada (CPP), Germany, France, and more.</li>
              <li><strong>Business Expense Deductions:</strong> Subtract your deductible business expenses to calculate accurate net income and tax.</li>
              <li><strong>Global Currencies:</strong> Results in 29+ currencies with proper locale-aware formatting.</li>
              <li><strong>Quarterly Planning:</strong> Shows monthly and quarterly set-aside amounts to help you save for estimated tax payments.</li>
              <li><strong>Real-Time Pie Chart:</strong> Visual breakdown of your income into net after tax, income tax, and self-employment tax.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Scenario: US freelancer with $80,000 gross revenue and $15,000 in expenses.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Net Business Income = $80,000 - $15,000 = <strong>$65,000</strong></li>
                <li>SE Tax Base = $65,000 × 92.35% = <strong>$60,028</strong></li>
                <li>SE Tax = $60,028 × 15.3% = <strong>$9,184</strong></li>
                <li>SE Deduction (Â½) = $9,184 ÷ 2 = <strong>$4,592</strong></li>
                <li>Taxable Income = $65,000 - $14,600 - $4,592 = <strong>$45,808</strong></li>
                <li>Income Tax ≈ $1,160 + $4,105 = <strong>$5,265</strong></li>
                <li>Total Tax = $5,265 + $9,184 = <strong>$14,449</strong></li>
                <li>Net After Tax = $65,000 - $14,449 = <strong>$50,551</strong></li>
                <li>Set aside ≈ <strong>$1,204/month</strong> or <strong>$3,612/quarter</strong></li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Common Mistakes to Avoid</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed text-muted-foreground">
              <li>Forgetting to pay self-employment tax on top of income tax - many new freelancers underestimate their total tax bill.</li>
              <li>Not setting aside money for quarterly estimated taxes and facing a large lump-sum payment at tax time.</li>
              <li>Missing deductible business expenses - track everything from software subscriptions to home office costs.</li>
              <li>Confusing gross revenue with net income when estimating tax liability.</li>
              <li>Not understanding the difference between employee and freelancer taxation when transitioning from a salaried job.</li>
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
            <label htmlFor="freelance-country" className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <Globe className="w-4 h-4 text-primary" />
              Country / Tax Regime
            </label>
            <select
              id="freelance-country"
              value={countryCode}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {Object.entries(FREELANCE_COUNTRIES).map(([key, c]) => (
                <option key={key} value={key}>{c.name} - {c.description}</option>
              ))}
            </select>
          </div>

          {/* Currency Select */}
          <div className="space-y-2">
            <label htmlFor="freelance-currency" className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <Banknote className="w-4 h-4 text-primary" />
              Currency
            </label>
            <select
              id="freelance-currency"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} - {c.label} ({c.symbol})</option>
              ))}
            </select>
          </div>

          {/* Gross Income */}
          <div className="space-y-2">
            <label htmlFor="freelance-income" className="flex items-center gap-1.5 text-sm font-medium">
              <Wallet className="w-4 h-4 text-primary" />
              <span>Gross Freelance Revenue (Annual)</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(grossIncome, currency)}</span>
            </label>
            <input
              id="freelance-income"
              type="range"
              min={0}
              max={maxAmount}
              step={step}
              value={Math.min(grossIncome, maxAmount)}
              onChange={(e) => setGrossIncome(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={maxAmount}
              aria-valuenow={grossIncome}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCompact(maxAmount, currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={grossIncomeDisplay}
              onChange={(e) => handleIncomeInput(e.target.value)}
              onFocus={handleIncomeFocus}
              onBlur={handleIncomeBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter gross revenue"
            />
          </div>

          {/* Business Expenses */}
          <div className="space-y-2">
            <label htmlFor="freelance-expenses" className="flex items-center gap-1.5 text-sm font-medium">
              <Briefcase className="w-4 h-4 text-primary" />
              <span>Business Expenses (Annual)</span>
              <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(expenses, currency)}</span>
            </label>
            <input
              id="freelance-expenses"
              type="range"
              min={0}
              max={Math.max(grossIncome, step)}
              step={step}
              value={Math.min(expenses, grossIncome)}
              onChange={(e) => setExpenses(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0}
              aria-valuemax={grossIncome}
              aria-valuenow={expenses}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(0, currency)}</span>
              <span>{formatCurrency(grossIncome, currency)}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={expensesDisplay}
              onChange={(e) => handleExpensesInput(e.target.value)}
              onFocus={handleExpensesFocus}
              onBlur={handleExpensesBlur}
              className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-right font-medium"
              placeholder="Enter expenses"
            />
          </div>

          {/* Pie Chart */}
          {showPie && (
            <div className="bg-white border border-border rounded-xl p-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Income Breakdown
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
                        {d.name} ({results.grossIncome > 0 ? ((d.value / results.grossIncome) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Gross Income</p>
                  <p className="text-sm font-semibold">{formatCurrency(results.grossIncome, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Total Tax</p>
                  <p className="text-sm font-semibold text-red-500">{formatCurrency(results.totalTax, currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Net Income</p>
                  <p className="text-sm font-semibold">{formatCurrency(results.netAfterTax, currency)}</p>
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
              <p className="text-sm text-muted-foreground font-medium">Net Income After Tax</p>
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
              {formatCurrency(results.netAfterTax, currency)}
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              {results.hasTax ? (
                <>
                  <ArrowUpRight className={cn("w-4 h-4", results.effectiveRate >= 30 ? "text-amber-500" : "text-primary")} />
                  <span>{results.effectiveRate.toFixed(1)}% effective rate</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">No tax due</span>
                </>
              )}
            </div>
            {results.hasTax && (
              <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Monthly set-aside</span>
                  <p className="font-semibold text-foreground">{formatCurrency(results.monthlySetAside, currency)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Quarterly payment</span>
                  <p className="font-semibold text-foreground">{formatCurrency(results.quarterlySetAside, currency)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Mini Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Calculator className="w-3 h-3 text-red-500" />
                Income Tax
              </p>
              <p className="text-lg font-bold text-red-500 break-words">
                {formatCurrency(results.incomeTax, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <BadgePercent className="w-3 h-3 text-amber-500" />
                {results.seTax > 0 ? results.seLabel : "No SE Tax"}
              </p>
              <p className={cn("text-lg font-bold break-words", results.seTax > 0 ? "text-amber-500" : "text-muted-foreground")}>
                {results.seTax > 0 ? formatCurrency(results.seTax, currency) : "-"}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-blue-500" />
                Net Business Income
              </p>
              <p className="text-lg font-bold text-blue-500 break-words">
                {formatCurrency(results.netIncome, currency)}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <BadgePercent className="w-3 h-3 text-purple-500" />
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
              Annual Breakdown
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Gross Revenue</span>
                <span className="font-medium">{formatCurrency(results.grossIncome, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Business Expenses</span>
                <span className="font-medium">-{formatCurrency(results.expenses, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground font-medium">Net Business Income</span>
                <span className="font-medium">{formatCurrency(results.netIncome, currency)}</span>
              </div>
              {results.standardDeduction > 0 && (
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Standard Deduction</span>
                  <span className="font-medium">-{formatCurrency(results.standardDeduction, currency)}</span>
                </div>
              )}
              {results.seDeduction > 0 && (
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">SE Tax Deduction (Â½)</span>
                  <span className="font-medium">-{formatCurrency(results.seDeduction, currency)}</span>
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
              {results.seTax > 0 && (
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">{results.seLabel}</span>
                  <span className="font-medium text-amber-500">-{formatCurrency(results.seTax, currency)}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground font-medium">Total Tax</span>
                <span className="font-medium">-{formatCurrency(results.totalTax, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-medium">Net Income After Tax</span>
                <span className="font-bold text-primary">{formatCurrency(results.netAfterTax, currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </ToolLayout>
  );
}
