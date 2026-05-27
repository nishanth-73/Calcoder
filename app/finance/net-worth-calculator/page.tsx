"use client";

import { useState, useMemo } from "react";
import { useNumericField } from "@/lib/useNumericField";
import { ToolLayout } from "@/components/layout/ToolLayout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { IndianRupee, TrendingUp, PiggyBank, Home, Car, CreditCard, BookOpen, Briefcase, Wallet, PlusCircle, MinusCircle, Banknote, Landmark, Gem, Table } from "lucide-react";

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

const MAX_ASSET = 100000000;
const MAX_VEHICLE = 50000000;
const MAX_LARGE = 50000000;
const MAX_DEBT = 20000000;
const MAX_CC = 5000000;

const ASSET_PIE_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"];
const LIAB_PIE_COLORS = ["#ef4444", "#f97316", "#e11d48", "#a855f7", "#6b7280", "#14b8a6"];

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

interface AssetLiabilityResults {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  netWorthRatio: number;
  isPositive: boolean;
  assetData: { name: string; value: number; color: string }[];
  liabData: { name: string; value: number; color: string }[];
  comparisonData: { name: string; value: number; fill: string }[];
}

function calculateNetWorth(
  cash: number, investments: number, realEstate: number, vehicles: number, otherAssets: number,
  homeLoan: number, carLoan: number, creditCard: number, studentLoan: number, personalLoan: number, otherDebts: number
): AssetLiabilityResults {
  const inputs = [cash, investments, realEstate, vehicles, otherAssets, homeLoan, carLoan, creditCard, studentLoan, personalLoan, otherDebts];
  if (!inputs.every(Number.isFinite)) {
    return {
      totalAssets: 0, totalLiabilities: 0, netWorth: 0, netWorthRatio: 0, isPositive: true,
      assetData: [], liabData: [], comparisonData: [],
    };
  }

  const clamped = (v: number, mx: number) => Math.max(0, Math.min(v, mx));

  const cCash = clamped(cash, MAX_ASSET);
  const cInvestments = clamped(investments, MAX_ASSET);
  const cRealEstate = clamped(realEstate, MAX_ASSET);
  const cVehicles = clamped(vehicles, MAX_VEHICLE);
  const cOtherAssets = clamped(otherAssets, MAX_ASSET);
  const cHomeLoan = clamped(homeLoan, MAX_LARGE);
  const cCarLoan = clamped(carLoan, MAX_DEBT);
  const cCreditCard = clamped(creditCard, MAX_CC);
  const cStudentLoan = clamped(studentLoan, MAX_DEBT);
  const cPersonalLoan = clamped(personalLoan, MAX_DEBT);
  const cOtherDebts = clamped(otherDebts, MAX_DEBT);

  const totalAssets = cCash + cInvestments + cRealEstate + cVehicles + cOtherAssets;
  const totalLiabilities = cHomeLoan + cCarLoan + cCreditCard + cStudentLoan + cPersonalLoan + cOtherDebts;
  const netWorth = totalAssets - totalLiabilities;
  const isPositive = netWorth >= 0;
  const netWorthRatio = totalLiabilities > 0 ? Math.round((totalAssets / totalLiabilities) * 100) / 100 : (totalAssets > 0 ? Infinity : 0);

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    netWorthRatio,
    isPositive,
    assetData: [
      { name: "Cash & Bank", value: cCash, color: ASSET_PIE_COLORS[0] },
      { name: "Investments", value: cInvestments, color: ASSET_PIE_COLORS[1] },
      { name: "Real Estate", value: cRealEstate, color: ASSET_PIE_COLORS[2] },
      { name: "Vehicles", value: cVehicles, color: ASSET_PIE_COLORS[3] },
      { name: "Other Assets", value: cOtherAssets, color: ASSET_PIE_COLORS[4] },
    ].filter((a) => a.value > 0),
    liabData: [
      { name: "Home Loan", value: cHomeLoan, color: LIAB_PIE_COLORS[0] },
      { name: "Car Loan", value: cCarLoan, color: LIAB_PIE_COLORS[1] },
      { name: "Credit Card", value: cCreditCard, color: LIAB_PIE_COLORS[2] },
      { name: "Student Loan", value: cStudentLoan, color: LIAB_PIE_COLORS[3] },
      { name: "Personal Loan", value: cPersonalLoan, color: LIAB_PIE_COLORS[4] },
      { name: "Other Debts", value: cOtherDebts, color: LIAB_PIE_COLORS[5] },
    ].filter((a) => a.value > 0),
    comparisonData: [
      { name: "Total Assets", value: totalAssets, fill: "#2563eb" },
      { name: "Total Liabilities", value: totalLiabilities, fill: "#ef4444" },
    ],
  };
}

function BarTooltip({ active, payload, currency }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0];
  return (
    <div className="bg-white border border-border rounded-xl shadow-xl p-3 text-sm">
      <p className="font-medium">{data.name}: {formatCurrency(data.value, currency)}</p>
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

export default function NetWorthCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const { value: cash, displayValue: cashDisplay, setValue: setCash, handleChange: handleCashChange, handleFocus: handleCashFocus, handleBlur: handleCashBlur } = useNumericField(200000);
  const { value: investments, displayValue: investmentsDisplay, setValue: setInvestments, handleChange: handleInvestmentsChange, handleFocus: handleInvestmentsFocus, handleBlur: handleInvestmentsBlur } = useNumericField(500000);
  const { value: realEstate, displayValue: realEstateDisplay, setValue: setRealEstate, handleChange: handleRealEstateChange, handleFocus: handleRealEstateFocus, handleBlur: handleRealEstateBlur } = useNumericField(5000000);
  const { value: vehicles, displayValue: vehiclesDisplay, setValue: setVehicles, handleChange: handleVehiclesChange, handleFocus: handleVehiclesFocus, handleBlur: handleVehiclesBlur } = useNumericField(500000);
  const { value: otherAssets, displayValue: otherAssetsDisplay, setValue: setOtherAssets, handleChange: handleOtherAssetsChange, handleFocus: handleOtherAssetsFocus, handleBlur: handleOtherAssetsBlur } = useNumericField(100000);
  const { value: homeLoan, displayValue: homeLoanDisplay, setValue: setHomeLoan, handleChange: handleHomeLoanChange, handleFocus: handleHomeLoanFocus, handleBlur: handleHomeLoanBlur } = useNumericField(2000000);
  const { value: carLoan, displayValue: carLoanDisplay, setValue: setCarLoan, handleChange: handleCarLoanChange, handleFocus: handleCarLoanFocus, handleBlur: handleCarLoanBlur } = useNumericField(300000);
  const { value: creditCard, displayValue: creditCardDisplay, setValue: setCreditCard, handleChange: handleCreditCardChange, handleFocus: handleCreditCardFocus, handleBlur: handleCreditCardBlur } = useNumericField(50000);
  const { value: studentLoan, displayValue: studentLoanDisplay, setValue: setStudentLoan, handleChange: handleStudentLoanChange, handleFocus: handleStudentLoanFocus, handleBlur: handleStudentLoanBlur } = useNumericField(0);
  const { value: personalLoan, displayValue: personalLoanDisplay, setValue: setPersonalLoan, handleChange: handlePersonalLoanChange, handleFocus: handlePersonalLoanFocus, handleBlur: handlePersonalLoanBlur } = useNumericField(0);
  const { value: otherDebts, displayValue: otherDebtsDisplay, setValue: setOtherDebts, handleChange: handleOtherDebtsChange, handleFocus: handleOtherDebtsFocus, handleBlur: handleOtherDebtsBlur } = useNumericField(0);

  const results = useMemo(
    () => calculateNetWorth(cash, investments, realEstate, vehicles, otherAssets, homeLoan, carLoan, creditCard, studentLoan, personalLoan, otherDebts),
    [cash, investments, realEstate, vehicles, otherAssets, homeLoan, carLoan, creditCard, studentLoan, personalLoan, otherDebts]
  );

  const { totalAssets, totalLiabilities, netWorth, netWorthRatio, isPositive, assetData, liabData, comparisonData } = results;

  const inputRangeClass = "w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer";

  return (
    <ToolLayout
      title="Net Worth Calculator"
      description="Calculate your total net worth by adding all your assets (cash, investments, property, vehicles) and subtracting your liabilities (loans, debts, credit cards). See a complete breakdown with interactive charts and financial health indicators."
      category="finance"
      faqContent={[
        {
          question: "What is net worth and why does it matter?",
          answer: "Net worth is the difference between what you own (assets) and what you owe (liabilities). It's the single best measure of your financial health. A positive and growing net worth indicates you're building wealth, while a declining or negative net worth signals financial stress. Tracking your net worth annually helps you measure progress toward financial goals.",
        },
        {
          question: "How is net worth calculated?",
          answer: "Net Worth = Total Assets - Total Liabilities. Total Assets include cash, bank accounts, investments (stocks, mutual funds, retirement accounts, real estate), vehicles, and valuable personal property. Total Liabilities include mortgages, car loans, credit card balances, student loans, personal loans, and any other debts. The result can be positive, zero, or negative.",
        },
        {
          question: "What assets should I include in my net worth?",
          answer: "Include all assets that have monetary value: cash and bank account balances, investment portfolios (stocks, bonds, mutual funds, ETFs, crypto), retirement accounts (401k, IRA, PPF, EPF, NPS), real estate (market value, not purchase price), vehicles (current resale value), and valuable personal property (jewelry, art, collectibles above ₹50,000). Use current market values, not what you paid.",
        },
        {
          question: "What is a good net worth by age?",
          answer: "A common benchmark is net worth = (annual income × age) / 10. For example, at 30 with ₹10L income: target ₹30L. By 40: 3× income. By 50: 6× income. By 60: 10× income. However, net worth varies hugely by location, profession, and life choices. The most important thing is that your net worth is trending upward over time.",
        },
        {
          question: "Should I include my home in net worth?",
          answer: "Yes, include your home's current market value as an asset and your mortgage balance as a liability. The difference is your home equity. Most financial experts recommend including primary residence in net worth calculations, though some exclude it because it's not a liquid asset you can easily spend in retirement.",
        },
        {
          question: "What is a good net worth ratio?",
          answer: "The net worth ratio (Assets ÷ Liabilities) measures financial stability. A ratio above 1 means you have more assets than debts. Above 2 is considered healthy. Above 5 is strong. Below 1 means you're technically insolvent (more debt than assets). For context, most financially healthy individuals have ratios between 2 and 10 depending on age and life stage.",
        },
        {
          question: "How often should I calculate my net worth?",
          answer: "Calculate your net worth at least annually, preferably quarterly. Regular tracking helps you spot trends, adjust savings strategies, and stay motivated. Many financial advisors recommend a monthly check-in during the first year of building wealth to establish the habit, then quarterly or annually once the habit is formed.",
        },
        {
          question: "What reduces net worth the fastest?",
          answer: "High-interest debt (credit cards at 30-42% APR), depreciating assets (new cars lose 20-40% in year one), poor investment choices, lifestyle inflation (spending increases matching income increases), and lack of emergency savings leading to high-interest borrowing all accelerate net worth decline.",
        },
        {
          question: "How can I increase my net worth?",
          answer: "Increase net worth by: (1) increasing income through career growth or side hustles, (2) saving 15-30% of income, (3) investing in diversified assets that appreciate, (4) paying down high-interest debt, (5) avoiding depreciating asset purchases, (6) owning a home that appreciates, and (7) avoiding lifestyle inflation as income grows.",
        },
        {
          question: "What is the difference between net worth and income?",
          answer: "Income is the money you earn over a period (monthly salary, business profits). Net worth is the total wealth you've accumulated over your lifetime. Two people with the same income can have vastly different net worth based on their savings rate, investment returns, and debt levels. High income doesn't guarantee high net worth - and vice versa.",
        },
      ]}
      explanationContent={
        <div className="prose prose-slate max-w-none">
          <h2>What is a Net Worth Calculator?</h2>
          <p>
            A <strong>Net Worth Calculator</strong> is a personal finance tool that computes your total financial position by subtracting all your debts and obligations from the total value of everything you own. It provides a clear snapshot of your financial health and helps you track wealth accumulation over time. Unlike income, which measures cash flow, net worth measures actual wealth.
          </p>

          <h3>The Net Worth Formula</h3>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
            Net Worth = Total Assets - Total Liabilities
          </pre>

          <h4>Assets (What You Own)</h4>
          <ul>
            <li><strong>Cash & Bank Accounts:</strong> Savings accounts, checking accounts, fixed deposits, cash on hand, emergency funds</li>
            <li><strong>Investments:</strong> Stocks, mutual funds, ETFs, bonds, retirement accounts (EPF, PPF, NPS, 401k, IRA), crypto, gold ETFs</li>
            <li><strong>Real Estate:</strong> Current market value of your home, rental properties, land - not the purchase price</li>
            <li><strong>Vehicles:</strong> Current resale value of cars, bikes, boats - vehicles depreciate 15-20% annually</li>
            <li><strong>Other Assets:</strong> Jewelry, art, antiques, collectibles, business ownership value, intellectual property</li>
          </ul>

          <h4>Liabilities (What You Owe)</h4>
          <ul>
            <li><strong>Home Loan:</strong> Outstanding mortgage balance on your primary residence and investment properties</li>
            <li><strong>Car Loan:</strong> Remaining balance on vehicle loans</li>
            <li><strong>Credit Card Debt:</strong> Outstanding credit card balances - typically the highest interest debt at 30-42% APR</li>
            <li><strong>Student Loan:</strong> Outstanding education loan balance</li>
            <li><strong>Personal Loan:</strong> Unsecured personal loans, loans from friends/family</li>
            <li><strong>Other Debts:</strong> Medical debt, tax liens, business loans, any other outstanding obligations</li>
          </ul>

          <h3>Benefits of Tracking Net Worth</h3>
          <ul>
            <li><strong>Financial Health Check:</strong> One number tells you whether you're building wealth or going into debt. A positive trend means your financial decisions are working.</li>
            <li><strong>Goal Tracking:</strong> Whether your goal is financial independence, early retirement, or a specific savings target, net worth is the ultimate progress metric.</li>
            <li><strong>Behavioral Awareness:</strong> Seeing your net worth regularly encourages better financial habits - higher savings, smarter investing, and reduced unnecessary spending.</li>
            <li><strong>Debt Management:</strong> Tracking liabilities alongside assets makes debt more visible and motivates faster repayment of high-interest obligations.</li>
            <li><strong>Big Picture Perspective:</strong> Net worth smooths out short-term market fluctuations and income changes, showing your true long-term financial trajectory.</li>
          </ul>

          <h3>Example Calculation</h3>
          <p><strong>Scenario:</strong> A typical Indian professional's financial snapshot:</p>
          <ul>
            <li><strong>Cash & Bank Accounts:</strong> ₹2,00,000</li>
            <li><strong>Investments (Mutual Funds, PPF, EPF, Stocks):</strong> ₹5,00,000</li>
            <li><strong>Real Estate (Home Market Value):</strong> ₹50,00,000</li>
            <li><strong>Vehicles (Car Resale Value):</strong> ₹5,00,000</li>
            <li><strong>Other Assets:</strong> ₹1,00,000</li>
            <li><strong>Total Assets:</strong> ₹63,00,000</li>
            <li><strong>Home Loan Outstanding:</strong> ₹20,00,000</li>
            <li><strong>Car Loan Outstanding:</strong> ₹3,00,000</li>
            <li><strong>Credit Card Debt:</strong> ₹50,000</li>
            <li><strong>Total Liabilities:</strong> ₹23,50,000</li>
            <li><strong>Net Worth:</strong> ₹63,00,000 - ₹23,50,000 = <strong>₹39,50,000</strong></li>
            <li><strong>Net Worth Ratio:</strong> 63,00,000 ÷ 23,50,000 = <strong>2.68</strong> (healthy)</li>
          </ul>

          <h3>Common Mistakes to Avoid</h3>
          <ul>
            <li><strong>Overvaluing assets:</strong> Use current market value, not purchase price. Your home may have been bought at ₹50L but might be worth ₹60L now - or only ₹45L in a downturn.</li>
            <li><strong>Ignoring small debts:</strong> Multiple small debts (credit cards, EMIs) add up. Include all debts, even small ones. Credit card debt at 30%+ interest is particularly damaging to wealth building.</li>
            <li><strong>Double counting:</strong> Don't include your home both as real estate and as an investment if it's your primary residence. Count it once at market value.</li>
            <li><strong>Not updating regularly:</strong> Assets (especially investments and real estate) change value constantly. An outdated net worth calculation can give false confidence or false concern.</li>
            <li><strong>Comparing to others:</strong> Net worth is deeply personal. A 30-year-old doctor with ₹10L net worth but ₹50L student loans is in a different position than a 30-year-old with ₹10L net worth and no debt. Focus on your own trajectory.</li>
          </ul>

          <h3>Tips for Building Net Worth</h3>
          <ul>
            <li><strong>Track consistently:</strong> Calculate your net worth on the same day each month or quarter. Use the same valuation methods each time for accurate trend comparison.</li>
            <li><strong>Prioritize high-interest debt:</strong> Credit card debt at 30-42% should be eliminated before focusing on investments. Paying off a 35% credit card is equivalent to earning a 35% guaranteed return.</li>
            <li><strong>Automate savings and investments:</strong> Set up automatic transfers to savings and investment accounts on payday. What you don't see, you won't spend.</li>
            <li><strong>Increase your earning potential:</strong> The best way to increase net worth is to earn more. Invest in skills, certifications, and career growth that increase your income over time.</li>
            <li><strong>Own appreciating assets:</strong> Prioritize assets that grow in value (real estate, index funds, retirement accounts) over depreciating assets (luxury cars, boats, expensive gadgets).</li>
          </ul>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs Column */}
          <div className="space-y-8">
            {/* Currency */}
            <div>
              <label htmlFor="nw-currency" className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <Banknote className="w-4 h-4 text-primary" />
                Currency
              </label>
              <select id="nw-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>

            {/* Assets Section */}
            <div className="bg-emerald-50/30 border border-emerald-200/30 rounded-xl p-5 space-y-5">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                <PlusCircle className="w-4 h-4" />
                Assets (What You Own)
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span>Cash & Bank Accounts</span>
                  <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(cash, currency)}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                  <input type="text" inputMode="decimal" value={cashDisplay} onChange={(e) => handleCashChange(e.target.value)} onFocus={handleCashFocus} onBlur={handleCashBlur} className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter amount" />
                </div>
                <input id="nw-cash" type="range" min={0} max={MAX_ASSET} step={10000} value={cash}
                  onChange={(e) => setCash(parseFloat(e.target.value))} className={inputRangeClass} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(0, currency)}</span>
                  <span>{formatCurrency(MAX_ASSET, currency)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Investments</span>
                  <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(investments, currency)}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                  <input type="text" inputMode="decimal" value={investmentsDisplay} onChange={(e) => handleInvestmentsChange(e.target.value)} onFocus={handleInvestmentsFocus} onBlur={handleInvestmentsBlur} className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter amount" />
                </div>
                <input id="nw-invest" type="range" min={0} max={MAX_ASSET} step={10000} value={investments}
                  onChange={(e) => setInvestments(parseFloat(e.target.value))} className={inputRangeClass} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(0, currency)}</span>
                  <span>{formatCurrency(MAX_ASSET, currency)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <Home className="w-4 h-4 text-emerald-600" />
                  <span>Real Estate</span>
                  <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(realEstate, currency)}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                  <input type="text" inputMode="decimal" value={realEstateDisplay} onChange={(e) => handleRealEstateChange(e.target.value)} onFocus={handleRealEstateFocus} onBlur={handleRealEstateBlur} className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter amount" />
                </div>
                <input id="nw-re" type="range" min={0} max={MAX_ASSET} step={50000} value={realEstate}
                  onChange={(e) => setRealEstate(parseFloat(e.target.value))} className={inputRangeClass} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(0, currency)}</span>
                  <span>{formatCurrency(MAX_ASSET, currency)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <Car className="w-4 h-4 text-emerald-600" />
                  <span>Vehicles</span>
                  <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(vehicles, currency)}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                  <input type="text" inputMode="decimal" value={vehiclesDisplay} onChange={(e) => handleVehiclesChange(e.target.value)} onFocus={handleVehiclesFocus} onBlur={handleVehiclesBlur} className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter amount" />
                </div>
                <input id="nw-vehicles" type="range" min={0} max={MAX_VEHICLE} step={10000} value={vehicles}
                  onChange={(e) => setVehicles(parseFloat(e.target.value))} className={inputRangeClass} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(0, currency)}</span>
                  <span>{formatCurrency(MAX_VEHICLE, currency)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <Gem className="w-4 h-4 text-emerald-600" />
                  <span>Other Assets</span>
                  <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(otherAssets, currency)}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                  <input type="text" inputMode="decimal" value={otherAssetsDisplay} onChange={(e) => handleOtherAssetsChange(e.target.value)} onFocus={handleOtherAssetsFocus} onBlur={handleOtherAssetsBlur} className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter amount" />
                </div>
                <input id="nw-other-a" type="range" min={0} max={MAX_ASSET} step={10000} value={otherAssets}
                  onChange={(e) => setOtherAssets(parseFloat(e.target.value))} className={inputRangeClass} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(0, currency)}</span>
                  <span>{formatCurrency(MAX_ASSET, currency)}</span>
                </div>
              </div>
            </div>

            {/* Liabilities Section */}
            <div className="bg-red-50/30 border border-red-200/30 rounded-xl p-5 space-y-5">
              <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
                <MinusCircle className="w-4 h-4" />
                Liabilities (What You Owe)
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <Landmark className="w-4 h-4 text-red-600" />
                  <span>Home Loan</span>
                  <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(homeLoan, currency)}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                  <input type="text" inputMode="decimal" value={homeLoanDisplay} onChange={(e) => handleHomeLoanChange(e.target.value)} onFocus={handleHomeLoanFocus} onBlur={handleHomeLoanBlur} className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter amount" />
                </div>
                <input id="nw-home" type="range" min={0} max={MAX_LARGE} step={50000} value={homeLoan}
                  onChange={(e) => setHomeLoan(parseFloat(e.target.value))} className={inputRangeClass} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(0, currency)}</span>
                  <span>{formatCurrency(MAX_LARGE, currency)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <Car className="w-4 h-4 text-red-600" />
                  <span>Car Loan</span>
                  <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(carLoan, currency)}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                  <input type="text" inputMode="decimal" value={carLoanDisplay} onChange={(e) => handleCarLoanChange(e.target.value)} onFocus={handleCarLoanFocus} onBlur={handleCarLoanBlur} className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter amount" />
                </div>
                <input id="nw-car" type="range" min={0} max={MAX_DEBT} step={10000} value={carLoan}
                  onChange={(e) => setCarLoan(parseFloat(e.target.value))} className={inputRangeClass} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(0, currency)}</span>
                  <span>{formatCurrency(MAX_DEBT, currency)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <CreditCard className="w-4 h-4 text-red-600" />
                  <span>Credit Card Debt</span>
                  <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(creditCard, currency)}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                  <input type="text" inputMode="decimal" value={creditCardDisplay} onChange={(e) => handleCreditCardChange(e.target.value)} onFocus={handleCreditCardFocus} onBlur={handleCreditCardBlur} className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter amount" />
                </div>
                <input id="nw-cc" type="range" min={0} max={MAX_CC} step={5000} value={creditCard}
                  onChange={(e) => setCreditCard(parseFloat(e.target.value))} className={inputRangeClass} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(0, currency)}</span>
                  <span>{formatCurrency(MAX_CC, currency)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <BookOpen className="w-4 h-4 text-red-600" />
                  <span>Student Loan</span>
                  <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(studentLoan, currency)}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                  <input type="text" inputMode="decimal" value={studentLoanDisplay} onChange={(e) => handleStudentLoanChange(e.target.value)} onFocus={handleStudentLoanFocus} onBlur={handleStudentLoanBlur} className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter amount" />
                </div>
                <input id="nw-student" type="range" min={0} max={MAX_DEBT} step={10000} value={studentLoan}
                  onChange={(e) => setStudentLoan(parseFloat(e.target.value))} className={inputRangeClass} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(0, currency)}</span>
                  <span>{formatCurrency(MAX_DEBT, currency)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <Briefcase className="w-4 h-4 text-red-600" />
                  <span>Personal Loan</span>
                  <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(personalLoan, currency)}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                  <input type="text" inputMode="decimal" value={personalLoanDisplay} onChange={(e) => handlePersonalLoanChange(e.target.value)} onFocus={handlePersonalLoanFocus} onBlur={handlePersonalLoanBlur} className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter amount" />
                </div>
                <input id="nw-personal" type="range" min={0} max={MAX_DEBT} step={10000} value={personalLoan}
                  onChange={(e) => setPersonalLoan(parseFloat(e.target.value))} className={inputRangeClass} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(0, currency)}</span>
                  <span>{formatCurrency(MAX_DEBT, currency)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <Banknote className="w-4 h-4 text-red-600" />
                  <span>Other Debts</span>
                  <span className="ml-auto text-lg font-bold text-primary">{formatCurrency(otherDebts, currency)}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">{getCurrencyConfig(currency).symbol}</span>
                  <input type="text" inputMode="decimal" value={otherDebtsDisplay} onChange={(e) => handleOtherDebtsChange(e.target.value)} onFocus={handleOtherDebtsFocus} onBlur={handleOtherDebtsBlur} className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Enter amount" />
                </div>
                <input id="nw-other-d" type="range" min={0} max={MAX_DEBT} step={10000} value={otherDebts}
                  onChange={(e) => setOtherDebts(parseFloat(e.target.value))} className={inputRangeClass} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(0, currency)}</span>
                  <span>{formatCurrency(MAX_DEBT, currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="space-y-4">
            {/* Net Worth Hero */}
            <div className={`rounded-xl p-6 border ${isPositive
              ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200"
              : "bg-gradient-to-br from-red-50 to-red-100/50 border-red-200"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <PiggyBank className={`w-5 h-5 ${isPositive ? "text-emerald-600" : "text-red-600"}`} />
                <p className="text-sm font-medium text-muted-foreground">Net Worth</p>
              </div>
              <p className={`text-4xl font-extrabold break-words ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                {isPositive ? "" : "-"}{formatCurrency(Math.abs(netWorth), currency)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  netWorthRatio === Infinity ? "bg-emerald-100 text-emerald-700" :
                  netWorthRatio >= 2 ? "bg-emerald-100 text-emerald-700" :
                  netWorthRatio >= 1 ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {netWorthRatio === Infinity ? "Debt-Free" :
                   netWorthRatio >= 2 ? "Healthy" :
                   netWorthRatio >= 1 ? "Fair" : "At Risk"}
                </span>
                {netWorthRatio !== Infinity && (
                  <span className="text-xs text-muted-foreground">
                    Assets are {netWorthRatio.toFixed(1)}× liabilities
                  </span>
                )}
              </div>
            </div>

            {/* Total Assets vs Total Liabilities */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50/50 border border-emerald-200/30 rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-emerald-700 mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Total Assets
                </p>
                <p className="text-lg font-bold text-emerald-700 break-words">{formatCurrency(totalAssets, currency)}</p>
              </div>
              <div className="bg-red-50/50 border border-red-200/30 rounded-xl p-4 min-w-0 overflow-hidden">
                <p className="text-xs text-red-700 mb-1 flex items-center gap-1">
                  <MinusCircle className="w-3 h-3" />
                  Total Liabilities
                </p>
                <p className="text-lg font-bold text-red-700 break-words">{formatCurrency(totalLiabilities, currency)}</p>
              </div>
            </div>

            {/* Assets vs Liabilities Bar Chart */}
            {comparisonData.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Assets vs Liabilities</p>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="name" fontSize={11} tickMargin={6} />
                      <YAxis tickFormatter={(v: number) => formatCompact(v, currency)} fontSize={11} width={55} />
                      <Tooltip content={<BarTooltip currency={currency} />} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={800} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Asset Allocation Pie */}
            {assetData.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Asset Allocation</p>
                <div className="flex items-center justify-center h-36">
                  <ResponsiveContainer width="60%" height="100%">
                    <PieChart>
                      <Pie data={assetData} cx="50%" cy="50%" innerRadius={38} outerRadius={62}
                        dataKey="value" animationBegin={100} animationDuration={800}>
                        {assetData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip currency={currency} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 text-xs w-2/5">
                    {assetData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground truncate">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Total Assets</p>
                    <p className="text-sm font-semibold">{formatCurrency(totalAssets, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Largest Holding</p>
                    <p className="text-sm font-semibold">{formatCurrency(Math.max(...assetData.map(d => d.value)), currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Categories</p>
                    <p className="text-sm font-semibold">{assetData.length}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Liability Composition Pie */}
            {liabData.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Liability Breakdown</p>
                <div className="flex items-center justify-center h-36">
                  <ResponsiveContainer width="60%" height="100%">
                    <PieChart>
                      <Pie data={liabData} cx="50%" cy="50%" innerRadius={38} outerRadius={62}
                        dataKey="value" animationBegin={200} animationDuration={800}>
                        {liabData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip currency={currency} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 text-xs w-2/5">
                    {liabData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground truncate">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Total Liabilities</p>
                    <p className="text-sm font-semibold">{formatCurrency(totalLiabilities, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Net Worth</p>
                    <p className="text-sm font-semibold text-emerald-500">{formatCurrency(netWorth, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Debt Ratio</p>
                    <p className="text-sm font-semibold">{totalAssets > 0 ? `${((totalLiabilities / totalAssets) * 100).toFixed(1)}%` : "N/A"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Block */}
            <div className="bg-white border border-border rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Financial Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Assets</span>
                <span className="font-medium text-emerald-600">{formatCurrency(totalAssets, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Liabilities</span>
                <span className="font-medium text-red-600">{formatCurrency(totalLiabilities, currency)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-sm">
                <span className="font-semibold">Net Worth</span>
                <span className={`font-bold ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                  {isPositive ? "" : "-"}{formatCurrency(Math.abs(netWorth), currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Net Worth Ratio</span>
                <span className="font-medium">
                  {netWorthRatio === Infinity ? "âˆž (Debt-Free)" : `${netWorthRatio.toFixed(1)}×`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Asset Categories</span>
                <span className="font-medium">{assetData.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Debt Categories</span>
                <span className="font-medium">{liabData.length}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
