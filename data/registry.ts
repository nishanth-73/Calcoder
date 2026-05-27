export type ToolCategory = "finance" | "marketing" | "developer" | "media";

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  subCategory: string;
  href: string;
  icon: string;
}

export const toolsRegistry: Tool[] = [
  // ================= FINANCE =================
  // Investment Calculators
  { id: "f1", name: "SIP Calculator", description: "Calculate returns on your Systematic Investment Plan.", category: "finance", subCategory: "Investment Calculators", href: "/finance/sip-calculator", icon: "PiggyBank" },
  { id: "f2", name: "Compound Interest", description: "Calculate compound interest over time.", category: "finance", subCategory: "Investment Calculators", href: "/finance/compound-interest", icon: "TrendingUp" },
  { id: "f3", name: "SWP Calculator", description: "Calculate Systematic Withdrawal Plan outcomes.", category: "finance", subCategory: "Investment Calculators", href: "/finance/swp-calculator", icon: "ArrowDownToLine" },
  { id: "f4", name: "Lumpsum Calculator", description: "Calculate mutual fund lumpsum investment returns.", category: "finance", subCategory: "Investment Calculators", href: "/finance/lumpsum-calculator", icon: "Landmark" },
  { id: "f5", name: "CAGR Calculator", description: "Calculate Compound Annual Growth Rate.", category: "finance", subCategory: "Investment Calculators", href: "/finance/cagr-calculator", icon: "LineChart" },
  { id: "f6", name: "EMI Calculator", description: "Calculate equated monthly installments for loans.", category: "finance", subCategory: "Investment Calculators", href: "/finance/emi-calculator", icon: "Calculator" },
  { id: "f7", name: "Loan Repayment Calculator", description: "Calculate loan repayment schedules.", category: "finance", subCategory: "Investment Calculators", href: "/finance/loan-repayment-calculator", icon: "CreditCard" },
  { id: "f8", name: "Mortgage Calculator", description: "Estimate monthly mortgage payments.", category: "finance", subCategory: "Investment Calculators", href: "/finance/mortgage-calculator", icon: "Home" },
  { id: "f9", name: "Down Payment Calculator", description: "Determine required down payment for purchases.", category: "finance", subCategory: "Investment Calculators", href: "/finance/down-payment-calculator", icon: "Wallet" },
  { id: "f10", name: "FD Calculator", description: "Calculate Fixed Deposit returns.", category: "finance", subCategory: "Investment Calculators", href: "/finance/fd-calculator", icon: "Vault" },
  { id: "f11", name: "RD Calculator", description: "Calculate Recurring Deposit returns.", category: "finance", subCategory: "Investment Calculators", href: "/finance/rd-calculator", icon: "Repeat" },
  { id: "f12", name: "Retirement Calculator", description: "Plan your retirement corpus.", category: "finance", subCategory: "Investment Calculators", href: "/finance/retirement-calculator", icon: "Palmtree" },
  { id: "f13", name: "Inflation Calculator", description: "Calculate the future value of money based on inflation.", category: "finance", subCategory: "Investment Calculators", href: "/finance/inflation-calculator", icon: "TrendingDown" },
  { id: "f14", name: "Net Worth Calculator", description: "Calculate your total net worth.", category: "finance", subCategory: "Investment Calculators", href: "/finance/net-worth-calculator", icon: "Scale" },
  { id: "f15", name: "Savings Goal Calculator", description: "Plan monthly savings for a specific goal.", category: "finance", subCategory: "Investment Calculators", href: "/finance/savings-goal-calculator", icon: "Target" },

  // Tax Calculators
  { id: "t1", name: "Income Tax Calculator", description: "Estimate your annual income tax.", category: "finance", subCategory: "Tax Calculators", href: "/finance/income-tax-calculator", icon: "Receipt" },
  { id: "t2", name: "GST Calculator", description: "Calculate Goods and Services Tax.", category: "finance", subCategory: "Tax Calculators", href: "/finance/gst-calculator", icon: "Percent" },
  { id: "t3", name: "VAT Calculator", description: "Calculate Value Added Tax.", category: "finance", subCategory: "Tax Calculators", href: "/finance/vat-calculator", icon: "Percent" },
  { id: "t4", name: "Capital Gains Tax Calculator", description: "Estimate tax on investment profits.", category: "finance", subCategory: "Tax Calculators", href: "/finance/capital-gains-tax-calculator", icon: "FileText" },
  { id: "t5", name: "Salary / Take Home Calculator", description: "Calculate your net take-home salary.", category: "finance", subCategory: "Tax Calculators", href: "/finance/salary-calculator", icon: "Banknote" },
  { id: "t6", name: "Freelance Tax Estimator", description: "Estimate taxes for freelance income.", category: "finance", subCategory: "Tax Calculators", href: "/finance/freelance-tax-estimator", icon: "Briefcase" },

  // Crypto Calculators
  { id: "c1", name: "Crypto Profit Calculator", description: "Calculate cryptocurrency trading profits.", category: "finance", subCategory: "Crypto Calculators", href: "/finance/crypto-profit-calculator", icon: "Bitcoin" },
  { id: "c2", name: "Bitcoin ROI Calculator", description: "Calculate Return on Investment for Bitcoin.", category: "finance", subCategory: "Crypto Calculators", href: "/finance/bitcoin-roi-calculator", icon: "LineChart" },
  { id: "c3", name: "Mining Profit Calculator", description: "Estimate crypto mining profitability.", category: "finance", subCategory: "Crypto Calculators", href: "/finance/mining-profit-calculator", icon: "Cpu" },
  { id: "c4", name: "Staking Rewards Calculator", description: "Calculate crypto staking rewards.", category: "finance", subCategory: "Crypto Calculators", href: "/finance/staking-rewards-calculator", icon: "Coins" },

  // Business & ROI Calculators
  { id: "b1", name: "ROI Calculator", description: "Calculate Return on Investment percentage.", category: "finance", subCategory: "Business Calculators", href: "/finance/roi-calculator", icon: "PieChart" },
  { id: "b2", name: "Profit Margin Calculator", description: "Calculate gross and net profit margins.", category: "finance", subCategory: "Business Calculators", href: "/finance/profit-margin-calculator", icon: "PercentSquare" },
  { id: "b3", name: "Break-even Calculator", description: "Calculate break-even point for products.", category: "finance", subCategory: "Business Calculators", href: "/finance/break-even-calculator", icon: "Activity" },
  { id: "b4", name: "Revenue Growth Calculator", description: "Calculate period-over-period revenue growth.", category: "finance", subCategory: "Business Calculators", href: "/finance/revenue-growth-calculator", icon: "TrendingUp" },

  // ================= MARKETING =================
  // Social Media Tools
  { id: "m1", name: "Engagement Rate Calculator", description: "Calculate social media engagement rate.", category: "marketing", subCategory: "Social Media Tools", href: "/marketing/engagement-rate-calculator", icon: "Heart" },
  { id: "m2", name: "YouTube Money Calculator", description: "Estimate YouTube ad earnings.", category: "marketing", subCategory: "Social Media Tools", href: "/marketing/youtube-money-calculator", icon: "Youtube" },
  { id: "m3", name: "Instagram Reach Calculator", description: "Calculate Instagram account reach metrics.", category: "marketing", subCategory: "Social Media Tools", href: "/marketing/instagram-reach-calculator", icon: "Instagram" },
  { id: "m4", name: "TikTok Earnings Calculator", description: "Estimate TikTok creator fund earnings.", category: "marketing", subCategory: "Social Media Tools", href: "/marketing/tiktok-earnings-calculator", icon: "Smartphone" },

  // Ad & Revenue Tools
  { id: "m5", name: "AdSense Revenue Calculator", description: "Estimate AdSense earnings based on traffic.", category: "marketing", subCategory: "Ad & Revenue Tools", href: "/marketing/adsense-calculator", icon: "DollarSign" },
  { id: "m6", name: "ROAS Calculator", description: "Calculate Return on Ad Spend.", category: "marketing", subCategory: "Ad & Revenue Tools", href: "/marketing/roas-calculator", icon: "Megaphone" },
  { id: "m7", name: "CPC Calculator", description: "Calculate Cost Per Click.", category: "marketing", subCategory: "Ad & Revenue Tools", href: "/marketing/cpc-calculator", icon: "MousePointerClick" },
  { id: "m8", name: "CPM Calculator", description: "Calculate Cost Per Mille.", category: "marketing", subCategory: "Ad & Revenue Tools", href: "/marketing/cpm-calculator", icon: "Eye" },
  { id: "m9", name: "CTR Calculator", description: "Calculate Click-Through Rate.", category: "marketing", subCategory: "Ad & Revenue Tools", href: "/marketing/ctr-calculator", icon: "MousePointer2" },

  // SaaS Metrics Tools
  { id: "s1", name: "CAC Calculator", description: "Calculate Customer Acquisition Cost.", category: "marketing", subCategory: "SaaS Metrics Tools", href: "/marketing/cac-calculator", icon: "UserPlus" },
  { id: "s2", name: "LTV Calculator", description: "Calculate Customer Lifetime Value.", category: "marketing", subCategory: "SaaS Metrics Tools", href: "/marketing/ltv-calculator", icon: "Target" },
  { id: "s3", name: "Churn Rate Calculator", description: "Calculate customer or revenue churn.", category: "marketing", subCategory: "SaaS Metrics Tools", href: "/marketing/churn-rate-calculator", icon: "UserMinus" },
  { id: "s4", name: "MRR Calculator", description: "Calculate Monthly Recurring Revenue.", category: "marketing", subCategory: "SaaS Metrics Tools", href: "/marketing/mrr-calculator", icon: "CalendarDays" },
  { id: "s5", name: "ARR Calculator", description: "Calculate Annual Recurring Revenue.", category: "marketing", subCategory: "SaaS Metrics Tools", href: "/marketing/arr-calculator", icon: "CalendarRange" },
  { id: "s6", name: "Burn Rate Calculator", description: "Calculate startup monthly burn rate.", category: "marketing", subCategory: "SaaS Metrics Tools", href: "/marketing/burn-rate-calculator", icon: "Flame" },

  // SEO Tools
  { id: "se1", name: "Keyword Density Checker", description: "Analyze keyword frequency in text.", category: "marketing", subCategory: "SEO Tools", href: "/marketing/keyword-density-checker", icon: "Type" },
  { id: "se2", name: "Meta Tag Preview Tool", description: "Preview how meta tags look in search.", category: "marketing", subCategory: "SEO Tools", href: "/marketing/meta-tag-preview", icon: "Layout" },
  { id: "se3", name: "SERP Snippet Preview", description: "Preview Google search snippet.", category: "marketing", subCategory: "SEO Tools", href: "/marketing/serp-snippet-preview", icon: "Search" },
  { id: "se4", name: "Word Counter", description: "Count words, characters, and sentences.", category: "marketing", subCategory: "SEO Tools", href: "/marketing/word-counter", icon: "FileText" },

  // ================= DEVELOPER =================
  // Formatters
  { id: "d1", name: "JSON Formatter", description: "Beautify and validate JSON data.", category: "developer", subCategory: "Formatters", href: "/developer/json-formatter", icon: "FileJson" },
  { id: "d2", name: "JSON Validator", description: "Validate JSON structure.", category: "developer", subCategory: "Formatters", href: "/developer/json-validator", icon: "CheckSquare" },
  { id: "d3", name: "XML Formatter", description: "Beautify and format XML code.", category: "developer", subCategory: "Formatters", href: "/developer/xml-formatter", icon: "Code" },
  { id: "d4", name: "YAML Formatter", description: "Beautify YAML data.", category: "developer", subCategory: "Formatters", href: "/developer/yaml-formatter", icon: "AlignLeft" },
  { id: "d5", name: "SQL Formatter", description: "Format SQL queries.", category: "developer", subCategory: "Formatters", href: "/developer/sql-formatter", icon: "Database" },
  { id: "d6", name: "HTML Formatter", description: "Beautify HTML code.", category: "developer", subCategory: "Formatters", href: "/developer/html-formatter", icon: "FileCode" },
  { id: "d7", name: "CSS Beautifier", description: "Format CSS stylesheets.", category: "developer", subCategory: "Formatters", href: "/developer/css-beautifier", icon: "Paintbrush" },
  { id: "d8", name: "JS Beautifier", description: "Format JavaScript code.", category: "developer", subCategory: "Formatters", href: "/developer/js-beautifier", icon: "FileCode2" },

  // Converters
  { id: "d9", name: "JSON to CSV", description: "Convert JSON array to CSV format.", category: "developer", subCategory: "Converters", href: "/developer/json-to-csv", icon: "Table2" },
  { id: "d10", name: "CSV to JSON", description: "Convert CSV data to JSON format.", category: "developer", subCategory: "Converters", href: "/developer/csv-to-json", icon: "FileJson" },
  { id: "d11", name: "Markdown to HTML", description: "Convert Markdown to HTML.", category: "developer", subCategory: "Converters", href: "/developer/markdown-to-html", icon: "FileText" },
  { id: "d12", name: "Base64 Encoder/Decoder", description: "Encode or decode Base64 strings.", category: "developer", subCategory: "Converters", href: "/developer/base64-encoder", icon: "Hash" },
  { id: "d13", name: "Unix Timestamp Converter", description: "Convert timestamps to readable dates.", category: "developer", subCategory: "Converters", href: "/developer/unix-timestamp-converter", icon: "Clock" },

  // Generators
  { id: "d14", name: "UUID Generator", description: "Generate random v4 UUIDs.", category: "developer", subCategory: "Generators", href: "/developer/uuid-generator", icon: "Fingerprint" },
  { id: "d15", name: "Password Generator", description: "Generate secure, random passwords.", category: "developer", subCategory: "Generators", href: "/developer/password-generator", icon: "Key" },
  { id: "d16", name: "Lorem Ipsum Generator", description: "Generate placeholder text.", category: "developer", subCategory: "Generators", href: "/developer/lorem-ipsum-generator", icon: "AlignLeft" },
  { id: "d17", name: "QR Code Generator", description: "Generate QR codes from text.", category: "developer", subCategory: "Generators", href: "/developer/qr-code-generator", icon: "QrCode" },
  { id: "d18", name: "Hash Generator", description: "Generate MD5, SHA-1, SHA-256 hashes.", category: "developer", subCategory: "Generators", href: "/developer/hash-generator", icon: "Lock" },

  // Testing Tools
  { id: "d19", name: "Regex Tester", description: "Test regular expressions with live matching.", category: "developer", subCategory: "Testing Tools", href: "/developer/regex-tester", icon: "SearchCode" },
  { id: "d20", name: "API Request Tester", description: "Test REST API endpoints.", category: "developer", subCategory: "Testing Tools", href: "/developer/api-request-tester", icon: "Globe" },
  { id: "d21", name: "JWT Decoder", description: "Decode JSON Web Tokens.", category: "developer", subCategory: "Testing Tools", href: "/developer/jwt-decoder", icon: "Shield" },
  { id: "d22", name: "Color Picker", description: "Pick and convert colors (HEX/RGB/HSL).", category: "developer", subCategory: "Testing Tools", href: "/developer/color-picker", icon: "Palette" },

  // ================= MEDIA & FILE =================
  // PDF Tools
  { id: "mp1", name: "PDF to JPG", description: "Convert PDF pages to high-quality JPG images.", category: "media", subCategory: "PDF Tools", href: "/media/pdf-to-jpg", icon: "FileImage" },
  { id: "mp2", name: "JPG to PDF", description: "Convert JPG images to PDF documents.", category: "media", subCategory: "PDF Tools", href: "/media/jpg-to-pdf", icon: "FileImage" },
  { id: "mp3", name: "PDF Compressor", description: "Compress PDF files to reduce file size.", category: "media", subCategory: "PDF Tools", href: "/media/pdf-compressor", icon: "FileDown" },
  { id: "mp4", name: "Merge PDF", description: "Combine multiple PDF files into one document.", category: "media", subCategory: "PDF Tools", href: "/media/merge-pdf", icon: "Files" },
  { id: "mp5", name: "Split PDF", description: "Split a PDF into separate pages.", category: "media", subCategory: "PDF Tools", href: "/media/split-pdf", icon: "Scissors" },
  { id: "mp6", name: "PDF to Word", description: "Convert PDF documents to editable Word files.", category: "media", subCategory: "PDF Tools", href: "/media/pdf-to-word", icon: "FileText" },
  { id: "mp7", name: "Word to PDF", description: "Convert Word documents to PDF format.", category: "media", subCategory: "PDF Tools", href: "/media/word-to-pdf", icon: "FileText" },
  { id: "mp8", name: "Rotate PDF", description: "Rotate PDF pages to the correct orientation.", category: "media", subCategory: "PDF Tools", href: "/media/rotate-pdf", icon: "RotateCw" },
  { id: "mp9", name: "Unlock PDF", description: "Remove password protection from PDF files.", category: "media", subCategory: "PDF Tools", href: "/media/unlock-pdf", icon: "Unlock" },

  // Image Tools
  { id: "mi1", name: "Image Compressor", description: "Compress images to reduce file size without losing quality.", category: "media", subCategory: "Image Tools", href: "/media/image-compressor", icon: "ImageDown" },
  { id: "mi2", name: "Resize Image", description: "Resize images to exact dimensions.", category: "media", subCategory: "Image Tools", href: "/media/resize-image", icon: "Maximize" },
  { id: "mi3", name: "Crop Image", description: "Crop images to remove unwanted areas.", category: "media", subCategory: "Image Tools", href: "/media/crop-image", icon: "Crop" },
  { id: "mi4", name: "PNG to JPG", description: "Convert PNG images to JPG format.", category: "media", subCategory: "Image Tools", href: "/media/png-to-jpg", icon: "Image" },
  { id: "mi5", name: "JPG to PNG", description: "Convert JPG images to PNG format.", category: "media", subCategory: "Image Tools", href: "/media/jpg-to-png", icon: "Image" },
  { id: "mi6", name: "WebP Converter", description: "Convert images to WebP format for web optimization.", category: "media", subCategory: "Image Tools", href: "/media/webp-converter", icon: "Image" },
  { id: "mi7", name: "Image Resizer", description: "Batch resize images to multiple sizes at once.", category: "media", subCategory: "Image Tools", href: "/media/image-resizer", icon: "Shrink" },
  { id: "mi8", name: "Image to Base64", description: "Convert images to Base64 encoded strings.", category: "media", subCategory: "Image Tools", href: "/media/image-to-base64", icon: "Code" },
  { id: "mi9", name: "Background Remover", description: "Remove image backgrounds automatically.", category: "media", subCategory: "Image Tools", href: "/media/background-remover", icon: "Eraser" },
  { id: "mi10", name: "Watermark Image", description: "Add custom watermarks to your images.", category: "media", subCategory: "Image Tools", href: "/media/watermark-image", icon: "Droplets" },

  // File Conversion Tools
  { id: "mc1", name: "MP4 to MP3", description: "Extract audio from MP4 video files.", category: "media", subCategory: "File Conversion Tools", href: "/media/mp4-to-mp3", icon: "Music" },
  { id: "mc2", name: "Text to PDF", description: "Convert plain text files to PDF documents.", category: "media", subCategory: "File Conversion Tools", href: "/media/text-to-pdf", icon: "FilePlus" },
  { id: "mc3", name: "CSV to Excel", description: "Convert CSV data to Excel spreadsheet format.", category: "media", subCategory: "File Conversion Tools", href: "/media/csv-to-excel", icon: "Table" },
  { id: "mc4", name: "ZIP Extractor", description: "Extract files from ZIP archives online.", category: "media", subCategory: "File Conversion Tools", href: "/media/zip-extractor", icon: "Archive" },
  { id: "mc5", name: "File Size Converter", description: "Convert file size units (MB, GB, TB, etc.).", category: "media", subCategory: "File Conversion Tools", href: "/media/file-size-converter", icon: "Weight" },
];
