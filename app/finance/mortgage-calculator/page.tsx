"use client";

import { useState, useMemo } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { ToolLayout } from "@/components/layout/ToolLayout";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Banknote, DollarSign, Percent, Calendar, PiggyBank, TrendingUp, ArrowUpRight, Table, Home } from "lucide-react";

type CurrencyCode = "USD" | "INR" | "EUR" | "GBP" | "AED" | "CAD" | "AUD" | "JPY" | "SGD" | "CNY" | "MYR" | "ZAR";

interface CurrencyConfig {
  code: CurrencyCode;
  label: string;
  symbol: string;
  locale: string;
}

const CURRENCIES: CurrencyConfig[] = [
  { code: "USD", label: "USD ($)", symbol: "$", locale: "en-US" },
  { code: "INR", label: "INR (₹)", symbol: "₹", locale: "en-IN" },
  { code: "EUR", label: "EUR (€)", symbol: "€", locale: "de-DE" },
  { code: "GBP", label: "GBP (Â£)", symbol: "Â£", locale: "en-GB" },
  { code: "AED", label: "AED (Ø¯.Ø¥)", symbol: "Ø¯.Ø¥", locale: "ar-AE" },
  { code: "CAD", label: "CAD (C$)", symbol: "C$", locale: "en-CA" },
  { code: "AUD", label: "AUD (A$)", symbol: "A$", locale: "en-AU" },
  { code: "JPY", label: "JPY (Â¥)", symbol: "Â¥", locale: "ja-JP" },
  { code: "SGD", label: "SGD (S$)", symbol: "S$", locale: "en-SG" },
  { code: "CNY", label: "CNY (Â¥)", symbol: "Â¥", locale: "zh-CN" },
  { code: "MYR", label: "MYR (RM)", symbol: "RM", locale: "ms-MY" },
  { code: "ZAR", label: "ZAR (R)", symbol: "R", locale: "en-ZA" },
];

const MIN_PRICE = 10000;
const MAX_PRICE = 10000000;
const MIN_DOWN_PCT = 0;
const MAX_DOWN_PCT = 50;
const MIN_RATE = 0.5;
const MAX_RATE = 15;
const MIN_TERM = 5;
const MAX_TERM = 40;
const MIN_TAX_RATE = 0;
const MAX_TAX_RATE = 4;
const MIN_INSURANCE = 0;
const MAX_INSURANCE = 6000;
const MIN_HOA = 0;
const MAX_HOA = 1000;

const PIE_COLORS_PAYMENT = ["#2563eb", "#f59e0b", "#10b981", "#8b5cf6"];

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
  const abs = Math.abs(value);
  const cfg = getCurrencyConfig(currency);
  const sym = cfg.symbol;

  if (currency === "INR") {
    if (abs >= 10000000) return `${sym}${(value / 10000000).toFixed(1)}Cr`;
    if (abs >= 100000) return `${sym}${(value / 100000).toFixed(1)}L`;
    if (abs >= 1000) return `${sym}${(value / 1000).toFixed(0)}K`;
    return formatCurrency(value, currency);
  }

  if (abs >= 1000000000) return `${sym}${(value / 1000000000).toFixed(1)}B`;
  if (abs >= 1000000) return `${sym}${(value / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${sym}${(value / 1000).toFixed(0)}K`;
  return formatCurrency(value, currency);
}

function formatPercent(value: number): string {
  return `${(Math.round(value * 1000) / 10).toFixed(1)}%`;
}

interface MortgageResults {
  monthlyPI: number;
  monthlyTax: number;
  monthlyInsurance: number;
  monthlyHOA: number;
  totalMonthly: number;
  downPayment: number;
  downPaymentPct: number;
  loanAmount: number;
  totalInterest: number;
  totalPayment: number;
  ltv: number;
  chartData: { year: string; Balance: number }[];
  yearlyData: { year: number; principalPaid: number; interestPaid: number; balance: number }[];
}

function calculateMortgage(
  homePrice: number,
  downPaymentPct: number,
  annualRate: number,
  termYears: number,
  taxRate: number,
  annualInsurance: number,
  monthlyHOA: number
): MortgageResults {
  if (!Number.isFinite(homePrice) || !Number.isFinite(downPaymentPct) || !Number.isFinite(annualRate) ||
      !Number.isFinite(termYears) || !Number.isFinite(taxRate) || !Number.isFinite(annualInsurance) || !Number.isFinite(monthlyHOA)) {
    return {
      monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyHOA: 0, totalMonthly: 0,
      downPayment: 0, downPaymentPct: 0, loanAmount: 0, totalInterest: 0, totalPayment: 0, ltv: 0,
      chartData: [], yearlyData: [],
    };
  }

  const clampedPrice = Math.max(0, Math.min(homePrice, MAX_PRICE));
  const clampedDP = Math.max(0, Math.min(downPaymentPct, MAX_DOWN_PCT));
  const clampedRate = Math.max(0, Math.min(annualRate, MAX_RATE));
  const clampedTerm = Math.max(0, Math.min(termYears, MAX_TERM));
  const clampedTax = Math.max(0, Math.min(taxRate, MAX_TAX_RATE));
  const clampedInsurance = Math.max(0, Math.min(annualInsurance, MAX_INSURANCE));
  const clampedHOA = Math.max(0, Math.min(monthlyHOA, MAX_HOA));

  if (clampedPrice <= 0 || clampedTerm <= 0) {
    return {
      monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyHOA: 0, totalMonthly: 0,
      downPayment: 0, downPaymentPct: 0, loanAmount: 0, totalInterest: 0, totalPayment: 0, ltv: 0,
      chartData: [], yearlyData: [],
    };
  }

  const downPayment = clampedPrice * (clampedDP / 100);
  const loanAmount = clampedPrice - downPayment;
  const ltv = clampedPrice > 0 ? (loanAmount / clampedPrice) * 100 : 0;

  const monthlyRate = clampedRate / 12 / 100;
  const months = clampedTerm * 12;

  let monthlyPI: number;
  if (clampedRate === 0) {
    monthlyPI = loanAmount > 0 ? loanAmount / months : 0;
  } else {
    monthlyPI = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
  }

  const monthlyTax = (clampedPrice * (clampedTax / 100)) / 12;
  const monthlyInsurance = clampedInsurance / 12;

  const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + clampedHOA;
  const totalPayment = monthlyPI * months;
  const totalInterest = Math.max(0, totalPayment - loanAmount);

  const chartData: MortgageResults["chartData"] = [];
  const yearlyData: MortgageResults["yearlyData"] = [];

  let balance = loanAmount;
  for (let y = 1; y <= clampedTerm; y++) {
    let yearPrincipal = 0;
    let yearInterest = 0;
    for (let m = 1; m <= 12; m++) {
      if (balance <= 0) break;
      const interest = balance * monthlyRate;
      const principal = Math.min(monthlyPI - interest, balance);
      yearInterest += interest;
      yearPrincipal += principal;
      balance -= principal;
    }
    chartData.push({ year: `Yr ${y}`, Balance: Math.round(Math.max(0, balance)) });
    yearlyData.push({
      year: y,
      principalPaid: Math.round(yearPrincipal),
      interestPaid: Math.round(yearInterest),
      balance: Math.round(Math.max(0, balance)),
    });
  }

  return {
    monthlyPI: Math.round(monthlyPI),
    monthlyTax: Math.round(monthlyTax),
    monthlyInsurance: Math.round(monthlyInsurance),
    monthlyHOA: Math.round(clampedHOA),
    totalMonthly: Math.round(totalMonthly),
    downPayment: Math.round(downPayment),
    downPaymentPct: clampedDP,
    loanAmount: Math.round(loanAmount),
    totalInterest: Math.round(totalInterest),
    totalPayment: Math.round(totalPayment),
    ltv,
    chartData,
    yearlyData,
  };
}

function ChartTooltip({ active, payload, label, currency }: any) {
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

function PieTooltip({ active, payload, currency }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0];
  return (
    <div className="bg-white border border-border rounded-xl shadow-xl p-3 text-sm">
      <p className="font-medium">{data.name}: {formatCurrency(data.value, currency)}</p>
    </div>
  );
}

export default function MortgageCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const { value: homePrice, displayValue: homePriceDisplay, setValue: setHomePrice, handleChange: handleHomePriceChange, handleFocus: handleHomePriceFocus, handleBlur: handleHomePriceBlur } = useNumericField(400000);
  const { value: downPct, displayValue: downPctInputDisplay, setValue: setDownPct, handleChange: handleDownPctChange, handleFocus: handleDownPctFocus, handleBlur: handleDownPctBlur } = useNumericField(20);
  const { value: rate, displayValue: rateDisplay, setValue: setRate, handleChange: handleRateChange, handleFocus: handleRateFocus, handleBlur: handleRateBlur } = useNumericField(6.5);
  const { value: term, displayValue: termDisplay, setValue: setTerm, handleChange: handleTermChange, handleFocus: handleTermFocus, handleBlur: handleTermBlur } = useNumericField(30);
  const { value: taxRate, displayValue: taxRateDisplay, setValue: setTaxRate, handleChange: handleTaxRateChange, handleFocus: handleTaxRateFocus, handleBlur: handleTaxRateBlur } = useNumericField(1.2);
  const { value: insurance, displayValue: insuranceDisplay, setValue: setInsurance, handleChange: handleInsuranceChange, handleFocus: handleInsuranceFocus, handleBlur: handleInsuranceBlur } = useNumericField(1200);
  const { value: hoa, displayValue: hoaDisplay, setValue: setHOA, handleChange: handleHOAChange, handleFocus: handleHOAFocus, handleBlur: handleHOABlur } = useNumericField(200);
  const [showTable, setShowTable] = useState(false);

  const results = useMemo(
    () => calculateMortgage(homePrice, downPct, rate, term, taxRate, insurance, hoa),
    [homePrice, downPct, rate, term, taxRate, insurance, hoa]
  );

  const {
    monthlyPI, monthlyTax, monthlyInsurance, monthlyHOA, totalMonthly,
    downPayment, loanAmount, totalInterest, totalPayment, ltv,
    chartData, yearlyData,
  } = results;

  const needsPMI = downPct < 20;

  const paymentPieData = useMemo(() => [
    { name: "Principal & Interest", value: monthlyPI },
    { name: "Property Tax", value: monthlyTax },
    { name: "Insurance", value: monthlyInsurance },
    { name: "HOA", value: monthlyHOA },
  ].filter(d => d.value > 0), [monthlyPI, monthlyTax, monthlyInsurance, monthlyHOA]);

  const totalCostPieData = useMemo(() => [
    { name: "Principal (Loan)", value: loanAmount },
    { name: "Total Interest", value: totalInterest },
  ], [loanAmount, totalInterest]);

  const downPctDisplay = `${downPct}%`;

  const inputRangeClass = "w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer";

  const rowClass = "flex items-center justify-between text-sm";
  const labelClass = "flex items-center gap-1.5 text-sm font-medium mb-2";
  const valueClass = "text-lg font-bold text-primary";

  return (
    <ToolLayout
      title="Mortgage Calculator"
      description="Estimate your monthly mortgage payments including principal, interest, property taxes, home insurance, and HOA fees. Get a complete picture of homeownership costs with detailed amortization charts."
      category="finance"
      faqContent={[
        {
          question: "What is included in a monthly mortgage payment?",
          answer: "A monthly mortgage payment typically includes four components, often called PITI: Principal (the loan amount), Interest (the cost of borrowing), Taxes (property taxes), and Insurance (homeowners insurance). Many payments also include PMI (Private Mortgage Insurance) if your down payment is less than 20%, and HOA fees if applicable. This calculator covers all these components.",
        },
        {
          question: "How much should my down payment be?",
          answer: "A 20% down payment is ideal because it eliminates the need for PMI (Private Mortgage Insurance), which can add $100-300/month to your payment. However, many loans allow as little as 3-5% down (FHA loans allow 3.5%, conventional loans 5%). A larger down payment means a lower loan amount, lower monthly payment, and less total interest over the life of the loan.",
        },
        {
          question: "How does property tax affect my payment?",
          answer: "Property tax is typically 0.5-2.5% of your home's value annually, paid as part of your monthly mortgage payment through an escrow account. For a $400,000 home at 1.2% tax rate, that is $4,800/year or $400/month. Property taxes vary significantly by location - some areas have rates below 0.5%, while others exceed 3%.",
        },
        {
          question: "What is PMI and when do I need it?",
          answer: "PMI (Private Mortgage Insurance) protects the lender if you default on your loan. It is required when your down payment is less than 20% of the home price. PMI typically costs 0.3-1.5% of the loan amount annually, or about $50-200/month for a typical loan. PMI can be removed once you reach 20% equity in your home.",
        },
        {
          question: "What is the difference between 15-year and 30-year mortgage?",
          answer: "A 15-year mortgage has higher monthly payments but much lower total interest. A 30-year mortgage has lower monthly payments but you pay significantly more interest over time. For example, a $300,000 loan at 6.5%: 15-year payment is ~$2,614 with ~$170K total interest; 30-year payment is ~$1,896 with ~$383K total interest. Choose based on your budget and financial goals.",
        },
        {
          question: "How does interest rate affect my monthly payment?",
          answer: "Interest rate has a dramatic effect on your monthly payment. For a $300,000 loan: at 4% the payment is ~$1,432; at 6% it is ~$1,799; at 8% it is ~$2,201. A 2% rate increase adds $400+ to your monthly payment and $100,000+ in total interest over 30 years. This is why shopping for the best rate and maintaining a good credit score is crucial.",
        },
        {
          question: "What is an escrow account?",
          answer: "An escrow account is a separate account your lender manages to pay your property taxes and insurance on your behalf. Each month, a portion of your mortgage payment (typically 1/12 of your annual tax and insurance costs) goes into escrow. When tax and insurance bills come due, the lender pays them from this account. Escrow ensures these critical expenses are never missed.",
        },
        {
          question: "Should I consider HOA fees when buying a home?",
          answer: "Yes, HOA fees are a critical factor in home affordability. They typically range from $100-500/month for single-family homes and $200-800/month for condos. HOA fees can increase over time and special assessments can add thousands in unexpected costs. Always factor HOA fees into your budget before committing to a mortgage.",
        },
        {
          question: "What is the debt-to-income ratio for a mortgage?",
          answer: "Lenders typically require a debt-to-income (DTI) ratio below 43%, with many preferring below 36%. DTI is your total monthly debt payments (including the proposed mortgage payment) divided by your gross monthly income. For a $2,500 total monthly payment, you would need approximately $7,000/month gross income ($84,000/year) to stay at a 36% DTI ratio.",
        },
        {
          question: "Can I make extra payments on my mortgage?",
          answer: "Yes, most mortgages allow extra payments without penalty (especially conventional loans). Extra payments directly reduce your principal, saving significant interest over time. Even one extra payment per year can reduce a 30-year mortgage by 4-5 years and save tens of thousands in interest. Check with your lender for any prepayment penalties before making extra payments.",
        },
      ]}
      explanationContent={
        <div className="prose prose-slate max-w-none">
          <h2>What is a Mortgage Calculator?</h2>
          <p>
            A <strong>mortgage calculator</strong> is a comprehensive homeownership planning tool that estimates your total monthly housing payment, including not just the loan payment but also property taxes, home insurance, and HOA fees. It helps you understand the true cost of buying a home and make informed decisions about down payment, loan terms, and property budgets.
          </p>

          <h3>How Mortgage Payments Are Calculated</h3>
          <p>The monthly mortgage payment (principal and interest) uses the standard amortization formula:</p>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
            M = P × [r(1+r)<sup>n</sup>] / [(1+r)<sup>n</sup> - 1]
          </pre>
          <p>The full monthly payment adds:</p>
          <ul>
            <li><strong>Principal & Interest (P&I):</strong> The loan payment calculated by the formula above</li>
            <li><strong>Property Taxes:</strong> Annual tax divided by 12, typically 0.5-2.5% of home value</li>
            <li><strong>Home Insurance:</strong> Annual premium divided by 12, protecting against damage and liability</li>
            <li><strong>HOA Fees:</strong> Monthly homeowners association dues, if applicable</li>
          </ul>

          <h3>Benefits of Using a Mortgage Calculator</h3>
          <ul>
            <li><strong>True Affordability:</strong> See the complete monthly payment including taxes, insurance, and HOA - not just the loan payment that lenders advertise.</li>
            <li><strong>Down Payment Planning:</strong> Experiment with different down payment percentages to see how they affect your monthly payment, PMI requirement, and total interest.</li>
            <li><strong>Rate Comparison:</strong> Quickly compare how different interest rates affect your monthly payment - even 0.5% can save or cost thousands.</li>
            <li><strong>Term Decision:</strong> Compare 15-year vs 20-year vs 30-year terms to find the right balance between monthly affordability and total interest cost.</li>
            <li><strong>Budget Integration:</strong> Use the total monthly payment to plan your household budget, ensuring you can comfortably afford homeownership alongside other expenses.</li>
          </ul>

          <h3>Example Calculation</h3>
          <p><strong>Scenario:</strong> You are buying a $400,000 home with 20% down, a 30-year mortgage at 6.5% interest, with 1.2% property tax rate, $1,200/year insurance, and $200/month HOA.</p>
          <ul>
            <li><strong>Down Payment (20%):</strong> $80,000</li>
            <li><strong>Loan Amount:</strong> $320,000</li>
            <li><strong>Monthly P&I:</strong> ~$2,023</li>
            <li><strong>Monthly Property Tax:</strong> $400</li>
            <li><strong>Monthly Insurance:</strong> $100</li>
            <li><strong>Monthly HOA:</strong> $200</li>
            <li><strong>Total Monthly Payment:</strong> ~$2,723</li>
            <li><strong>Total Interest (30 years):</strong> ~$408,291</li>
          </ul>
          <p>With a 20% down payment, you avoid PMI and save $50-200/month. The total monthly payment of $2,723 is significantly higher than just the P&I of $2,023 - emphasizing why this complete picture is essential for budgeting.</p>

          <h3>Understanding LTV (Loan-to-Value)</h3>
          <p>LTV is the ratio of your loan amount to your home's value, expressed as a percentage. An LTV of 80% or less (20%+ down payment) typically qualifies you for better rates and eliminates PMI. Higher LTV ratios may require PMI and result in higher interest rates.</p>

          <h3>Common Mistakes to Avoid</h3>
          <ul>
            <li><strong>Focusing only on the purchase price:</strong> A $350,000 home with high taxes and HOA can cost more per month than a $400,000 home with lower taxes. Always compare total monthly payment, not just price.</li>
            <li><strong>Ignoring PMI costs:</strong> Putting less than 20% down adds PMI, which can cost $100-300/month and provides no benefit to you - it only protects the lender.</li>
            <li><strong>Not shopping for insurance:</strong> Home insurance premiums vary significantly between providers. Shop around and bundle with auto insurance for potential discounts.</li>
            <li><strong>Underestimating HOA increases:</strong> HOA fees typically increase 3-5% annually. When budgeting, assume your HOA will be higher over time, not static.</li>
            <li><strong>Maxing out your budget:</strong> Lenders may approve you for a larger mortgage than you can comfortably afford. A general rule is that your total housing payment should not exceed 28-30% of your gross monthly income.</li>
          </ul>

          <h3>Tips for First-Time Home Buyers</h3>
          <ul>
            <li><strong>Save for 20% down:</strong> Aim for 20% down to avoid PMI. If 20% seems impossible, consider FHA loans (3.5% down) or conventional loans with 5% down and plan to refinance once you reach 20% equity.</li>
            <li><strong>Get pre-approved first:</strong> Before house hunting, get pre-approved for a mortgage. This shows sellers you are serious and helps you understand your price range.</li>
            <li><strong>Factor in closing costs:</strong> Closing costs typically add 2-5% of the home price to your upfront expenses. Include these in your savings goal alongside the down payment.</li>
            <li><strong>Consider all loan options:</strong> Compare conventional, FHA, VA, and USDA loans. Each has different down payment requirements, PMI rules, and eligibility criteria.</li>
            <li><strong>Think long-term:</strong> If you plan to stay less than 5-7 years, buying may not be better than renting due to transaction costs. Use this calculator to compare renting vs buying costs in your area.</li>
          </ul>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            {/* Currency */}
            <div>
              <label htmlFor="mort-currency" className={labelClass}>
                <Banknote className="w-4 h-4 text-primary" />
                Currency
              </label>
              <select id="mort-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>

            {/* Home Price */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Home className="w-4 h-4 text-primary" />
                <span>Home Price</span>
                <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(homePrice, currency)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={homePriceDisplay}
                  onChange={(e) => handleHomePriceChange(e.target.value)}
                  onFocus={handleHomePriceFocus}
                  onBlur={handleHomePriceBlur}
                  className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="Enter amount"
                />
              </div>
              <input id="mort-price" type="range" min={MIN_PRICE} max={MAX_PRICE} step={5000} value={homePrice}
                onChange={(e) => setHomePrice(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_PRICE} aria-valuemax={MAX_PRICE} aria-valuenow={homePrice} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(MIN_PRICE, currency)}</span>
                <span>{formatCurrency(MAX_PRICE, currency)}</span>
              </div>
            </div>

            {/* Down Payment */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Percent className="w-4 h-4 text-primary" />
                <span>Down Payment</span>
                <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(downPayment, currency)} ({downPctDisplay})</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={downPctInputDisplay}
                    onChange={(e) => handleDownPctChange(e.target.value)}
                    onFocus={handleDownPctFocus}
                    onBlur={handleDownPctBlur}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="Enter percentage"
                  />
                </div>
                <span className="text-muted-foreground font-medium text-sm">%</span>
              </div>
              <input id="mort-down" type="range" min={MIN_DOWN_PCT} max={MAX_DOWN_PCT} step={1} value={downPct}
                onChange={(e) => setDownPct(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_DOWN_PCT} aria-valuemax={MAX_DOWN_PCT} aria-valuenow={downPct} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MIN_DOWN_PCT}%</span>
                <span>{MAX_DOWN_PCT}%</span>
              </div>
              {needsPMI && (
                <p className="text-xs text-amber-500">Down payment below 20% - PMI may be required</p>
              )}
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Percent className="w-4 h-4 text-primary" />
                <span>Interest Rate</span>
                <span className="ml-auto text-lg font-bold text-primary">{rate}%</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={rateDisplay}
                    onChange={(e) => handleRateChange(e.target.value)}
                    onFocus={handleRateFocus}
                    onBlur={handleRateBlur}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="Enter rate"
                  />
                </div>
                <span className="text-muted-foreground font-medium text-sm">%</span>
              </div>
              <input id="mort-rate" type="range" min={MIN_RATE} max={MAX_RATE} step={0.1} value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_RATE} aria-valuemax={MAX_RATE} aria-valuenow={rate} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MIN_RATE}%</span>
                <span>{MAX_RATE}%</span>
              </div>
            </div>

            {/* Loan Term */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Calendar className="w-4 h-4 text-primary" />
                <span>Loan Term</span>
                <span className="ml-auto text-lg font-bold text-primary">{term} {term === 1 ? "Year" : "Years"}</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={termDisplay}
                  onChange={(e) => handleTermChange(e.target.value)}
                  onFocus={handleTermFocus}
                  onBlur={handleTermBlur}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="Enter years"
                />
              </div>
              <input id="mort-term" type="range" min={MIN_TERM} max={MAX_TERM} step={1} value={term}
                onChange={(e) => setTerm(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_TERM} aria-valuemax={MAX_TERM} aria-valuenow={term} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MIN_TERM} Years</span>
                <span>{MAX_TERM} Years</span>
              </div>
            </div>

            {/* Property Tax */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>Property Tax Rate</span>
                <span className="ml-auto text-lg font-bold text-primary">{taxRate}%</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={taxRateDisplay}
                    onChange={(e) => handleTaxRateChange(e.target.value)}
                    onFocus={handleTaxRateFocus}
                    onBlur={handleTaxRateBlur}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="Enter rate"
                  />
                </div>
                <span className="text-muted-foreground font-medium text-sm">%</span>
              </div>
              <input id="mort-tax" type="range" min={MIN_TAX_RATE} max={MAX_TAX_RATE} step={0.1} value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value))} className={inputRangeClass}
                aria-valuemin={MIN_TAX_RATE} aria-valuemax={MAX_TAX_RATE} aria-valuenow={taxRate} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MIN_TAX_RATE}%</span>
                <span>{MAX_TAX_RATE}%</span>
              </div>
            </div>

            {/* Insurance + HOA row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center justify-between text-sm font-medium">
                  <span className="text-xs text-muted-foreground">Insurance (yearly)</span>
                  <span className="text-base font-bold text-primary">{formatCurrency(insurance, currency)}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={insuranceDisplay}
                    onChange={(e) => handleInsuranceChange(e.target.value)}
                    onFocus={handleInsuranceFocus}
                    onBlur={handleInsuranceBlur}
                    className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="Enter amount"
                  />
                </div>
                <input id="mort-ins" type="range" min={MIN_INSURANCE} max={MAX_INSURANCE} step={100} value={insurance}
                  onChange={(e) => setInsurance(parseFloat(e.target.value))} className={inputRangeClass}
                  aria-valuemin={MIN_INSURANCE} aria-valuemax={MAX_INSURANCE} aria-valuenow={insurance} />
              </div>
              <div className="space-y-2">
                <label className="flex items-center justify-between text-sm font-medium">
                  <span className="text-xs text-muted-foreground">HOA (monthly)</span>
                  <span className="text-base font-bold text-primary">{formatCurrency(hoa, currency)}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={hoaDisplay}
                    onChange={(e) => handleHOAChange(e.target.value)}
                    onFocus={handleHOAFocus}
                    onBlur={handleHOABlur}
                    className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="Enter amount"
                  />
                </div>
                <input id="mort-hoa" type="range" min={MIN_HOA} max={MAX_HOA} step={25} value={hoa}
                  onChange={(e) => setHOA(parseFloat(e.target.value))} className={inputRangeClass}
                  aria-valuemin={MIN_HOA} aria-valuemax={MAX_HOA} aria-valuenow={hoa} />
              </div>
            </div>

            {/* LTV Indicator */}
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-sm flex items-center justify-between">
              <span className="text-muted-foreground">Loan-to-Value (LTV)</span>
              <span className="font-semibold text-primary">{ltv.toFixed(0)}%</span>
            </div>
          </div>

          {/* Results Cards */}
          <div className="space-y-4">
            {/* Total Monthly Hero Card */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <PiggyBank className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground font-medium">Total Monthly Payment</p>
              </div>
              <p className="text-4xl font-extrabold text-primary break-words">{formatCurrency(totalMonthly, currency)}</p>
              <div className="flex items-center gap-2 mt-2 text-sm">
                <span className="text-muted-foreground">P&amp;I: {formatCurrency(monthlyPI, currency)}</span>
                {monthlyTax > 0 && <span className="text-muted-foreground">·</span>}
                {monthlyTax > 0 && <span className="text-muted-foreground">Tax: {formatCurrency(monthlyTax, currency)}</span>}
              </div>
            </div>

            {/* Down Payment + Loan Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1">Down Payment</p>
                <p className="text-base font-bold break-words">{formatCurrency(downPayment, currency)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">({downPctDisplay})</p>
              </div>
              <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1">Loan Amount</p>
                <p className="text-base font-bold break-words">{formatCurrency(loanAmount, currency)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{ltv.toFixed(0)}% LTV</p>
              </div>
            </div>

            {/* Payment Breakdown Mini Cards */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white border border-border rounded-lg p-2 text-center min-w-0 overflow-hidden">
                <p className="text-[10px] text-muted-foreground">P&amp;I</p>
                <p className="text-xs font-bold text-primary break-words">{formatCurrency(monthlyPI, currency)}</p>
              </div>
              <div className="bg-white border border-border rounded-lg p-2 text-center min-w-0 overflow-hidden">
                <p className="text-[10px] text-muted-foreground">Tax</p>
                <p className="text-xs font-bold text-amber-500 break-words">{formatCurrency(monthlyTax, currency)}</p>
              </div>
              <div className="bg-white border border-border rounded-lg p-2 text-center min-w-0 overflow-hidden">
                <p className="text-[10px] text-muted-foreground">Ins.</p>
                <p className="text-xs font-bold text-emerald-500 break-words">{formatCurrency(monthlyInsurance, currency)}</p>
              </div>
              <div className="bg-white border border-border rounded-lg p-2 text-center min-w-0 overflow-hidden">
                <p className="text-[10px] text-muted-foreground">HOA</p>
                <p className="text-xs font-bold text-purple-500 break-words">{formatCurrency(monthlyHOA, currency)}</p>
              </div>
            </div>

            {/* Total Interest */}
            <div className="bg-white border border-border rounded-xl p-4 min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1">Total Interest (over {term} years)</p>
              <p className="text-xl font-bold text-amber-500 break-words">{formatCurrency(totalInterest, currency)}</p>
            </div>

            {/* Payment Breakdown Pie */}
            {paymentPieData.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-6">
                <p className="text-xs text-muted-foreground mb-3 text-center">Monthly Payment Breakdown</p>
                <div className="flex items-center justify-center h-36">
                  <ResponsiveContainer initialDimension={{width:100,height:100}} width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentPieData} cx="50%" cy="50%" innerRadius={38} outerRadius={62}
                        dataKey="value" animationBegin={100} animationDuration={800}>
                        {paymentPieData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS_PAYMENT[idx % PIE_COLORS_PAYMENT.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip currency={currency} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 text-xs ml-2">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#2563eb]" /><span className="text-muted-foreground">P&amp;I</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b]" /><span className="text-muted-foreground">Tax</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" /><span className="text-muted-foreground">Ins.</span></div>
                    {monthlyHOA > 0 && <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#8b5cf6]" /><span className="text-muted-foreground">HOA</span></div>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Monthly Payment</p>
                    <p className="text-sm font-semibold">{formatCurrency(totalMonthly, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Total Interest</p>
                    <p className="text-sm font-semibold text-amber-500">{formatCurrency(totalInterest, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Total Cost</p>
                    <p className="text-sm font-semibold">{formatCurrency(totalPayment, currency)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart: Balance Over Time */}
        {chartData.length > 0 && (
          <div className="bg-white border border-border rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Loan Balance Over Time
              </h3>
            </div>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer initialDimension={{width:100,height:100}} width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mortBalanceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="year" fontSize={11} tickMargin={8} />
                  <YAxis tickFormatter={(v: number) => formatCompact(v, currency)} fontSize={11} width={60} />
                  <Tooltip content={<ChartTooltip currency={currency} />} />
                  <Area type="monotone" dataKey="Balance" stroke="#2563eb" strokeWidth={2}
                    fill="url(#mortBalanceGrad)" dot={false} animationDuration={1200} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Yearly Amortization Table */}
        {yearlyData.length > 0 && (
          <div className="bg-white border border-border rounded-xl p-4 sm:p-6">
            <button
              onClick={() => setShowTable(!showTable)}
              className="flex items-center gap-2 text-lg font-bold mb-2 hover:text-primary transition-colors"
              aria-expanded={showTable}
            >
              <Table className="w-5 h-5 text-primary" />
              Amortization Schedule
              <span className={`ml-auto text-sm font-normal text-muted-foreground transition-transform ${showTable ? "rotate-180" : ""}`}>
                {showTable ? "Hide" : "Show"}
              </span>
            </button>
            {showTable && (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Year</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Principal Paid</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Interest Paid</th>
                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyData.map((row) => (
                      <tr key={row.year} className="border-b border-border/50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2 font-medium">Year {row.year}</td>
                        <td className="text-right py-3 px-2 text-primary">{formatCurrency(row.principalPaid, currency)}</td>
                        <td className="text-right py-3 px-2 text-amber-500">{formatCurrency(row.interestPaid, currency)}</td>
                        <td className="text-right py-3 px-2 font-semibold">{formatCurrency(row.balance, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
