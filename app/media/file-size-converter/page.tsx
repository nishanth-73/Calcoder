"use client";

import { ToolLayout } from "@/components/layout/ToolLayout";
import { useState, useCallback, useMemo } from "react";
import { Copy, Check } from "lucide-react";

const UNITS = ["Bytes", "KB", "MB", "GB", "TB"] as const;
type Unit = (typeof UNITS)[number];
const UNIT_MULTIPLIERS: Record<Unit, number> = {
  Bytes: 1,
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  TB: 1024 * 1024 * 1024 * 1024,
};

const PRESETS = [
  { label: "1 KB", bytes: 1024 },
  { label: "1 MB", bytes: 1024 * 1024 },
  { label: "10 MB", bytes: 10 * 1024 * 1024 },
  { label: "100 MB", bytes: 100 * 1024 * 1024 },
  { label: "500 MB", bytes: 500 * 1024 * 1024 },
  { label: "1 GB", bytes: 1024 * 1024 * 1024 },
  { label: "10 GB", bytes: 10 * 1024 * 1024 * 1024 },
  { label: "1 TB", bytes: 1024 * 1024 * 1024 * 1024 },
];

function formatValue(bytes: number, unit: Unit, decimals = 4): string {
  const multiplier = UNIT_MULTIPLIERS[unit];
  const value = bytes / multiplier;
  if (unit === "Bytes") return value.toFixed(0);
  if (value >= 1000) return value.toFixed(2);
  if (value >= 1) return value.toFixed(decimals);
  if (value >= 0.01) return value.toFixed(decimals);
  return value.toExponential(4);
}

export default function MediaToolPage() {
  const [inputValue, setInputValue] = useState("1024");
  const [inputUnit, setInputUnit] = useState<Unit>("KB");

  const bytes = useMemo(() => {
    const num = parseFloat(inputValue);
    if (isNaN(num) || num < 0) return 0;
    return num * UNIT_MULTIPLIERS[inputUnit];
  }, [inputValue, inputUnit]);

  const conversions = useMemo(() => {
    if (bytes <= 0) {
      return UNITS.map((unit) => ({ unit, value: "0", raw: 0 }));
    }
    return UNITS.map((unit) => {
      const raw = bytes / UNIT_MULTIPLIERS[unit];
      return { unit, value: formatValue(bytes, unit), raw };
    });
  }, [bytes]);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = useCallback((text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  }, []);

  const handlePreset = useCallback((bytes_: number) => {
    setInputValue(bytes_.toString());
    setInputUnit("Bytes");
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === "" || /^-?\d*\.?\d*$/.test(v)) setInputValue(v);
  }, []);

  return (
    <ToolLayout
      title="File Size Converter"
      description="Convert file sizes between Bytes, KB, MB, GB, and TB with instant multi-unit results."
      category="media"
      faqContent={[
        { question: "What units does the converter support?", answer: "Bytes (B), Kilobytes (KB), Megabytes (MB), Gigabytes (GB), and Terabytes (TB). All conversions use the binary standard (1 KB = 1024 bytes), which is the convention used by operating systems and file systems." },
        { question: "How is the conversion calculated?", answer: "Each unit is defined as a power of 1024. Bytes × 1024 = KB, KB × 1024 = MB, and so on. The input value is converted to bytes first, then divided by each unit's multiplier to produce the output values." },
        { question: "Why does 1 MB show as 1,048,576 bytes?", answer: "The binary definition (MiB) uses 1024² = 1,048,576 bytes, which is the standard used by Windows, macOS, and Linux for file sizes. The SI decimal definition (1 MB = 1,000,000 bytes) is less common in file system contexts." },
        { question: "How many decimal places does the output show?", answer: "Bytes are shown as integers. Larger units display 4 decimal places for values between 0.01 and 999. Values below 0.01 use scientific notation (exponential format) to show precision without trailing zeros." },
        { question: "Can I copy individual conversion results?", answer: "Yes, each row in the conversion table has a copy button that copies the formatted value to your clipboard with a confirmation indicator." },
        { question: "What happens if I enter a negative number?", answer: "Negative values are treated as zero. File sizes cannot be negative, so the converter safely clamps to zero and displays all units as 0." },
        { question: "What are the presets used for?", answer: "Presets are common file sizes (1 KB, 1 MB, 100 MB, 1 GB, etc.) that you can click to instantly populate the converter. They save time when checking approximate sizes for common file types." },
        { question: "Can I enter values in scientific notation?", answer: "The input field accepts decimal numbers only. For very large or small values, use the presets or enter a plain decimal number. The converter handles up to 900 TB before JavaScript number precision becomes a factor." },
      ]}
      explanationContent={
        <div>
          <h2>What Is a File Size Converter?</h2>
          <p>This tool converts file size values between different units (Bytes, KB, MB, GB, TB) using the binary (1024-based) standard. It shows the input value converted to all units simultaneously for quick comparison.</p>
          <h2>How It Works</h2>
          <p>Enter a numeric value and select its unit. The tool converts the input to bytes by multiplying by the appropriate power of 1024, then divides by each unit's multiplier to produce all output values simultaneously. The results are memoized for performance and update instantly as you type.</p>
          <h2>Features</h2>
          <ul>
            <li><strong>Instant conversion:</strong> Results update in real time as you type or change units.</li>
            <li><strong>All units at once:</strong> See the value in Bytes, KB, MB, GB, and TB simultaneously.</li>
            <li><strong>Copy to clipboard:</strong> One-click copy for any conversion result.</li>
            <li><strong>Preset buttons:</strong> Quick-fill with common file sizes for reference.</li>
            <li><strong>Client-side:</strong> No network requests, no latency.</li>
          </ul>
          <h2>Use Cases</h2>
          <ul>
            <li>Checking how many MB a GB-sized file actually is for bandwidth calculations.</li>
            <li>Converting storage specifications between units for capacity planning.</li>
            <li>Comparing file size limits across different platforms and services.</li>
            <li>Educational reference for understanding binary vs. decimal size conventions.</li>
          </ul>
          <h2>Examples</h2>
          <ul>
            <li>1 GB = 1,024 MB = 1,048,576 KB = 1,073,741,824 Bytes.</li>
            <li>500 MB = 0.4883 GB = 512,000 KB = 524,288,000 Bytes.</li>
          </ul>
          <h2>Tips</h2>
          <ul>
            <li>Use the presets to quickly see common file sizes in all units at once.</li>
            <li>Copy values directly from the table instead of re-typing them.</li>
            <li>Remember that hard drive manufacturers use decimal (1 GB = 1,000,000,000 bytes), which differs from this tool's binary calculations.</li>
          </ul>
          <h2>Common Mistakes</h2>
          <ul>
            <li>Confusing binary (GiB) with decimal (GB) units-operating systems use binary, drive manufacturers use decimal.</li>
            <li>Entering negative values-file sizes are always non-negative.</li>
            <li>Assuming 1 MB = 1,000,000 bytes-in file system contexts it is 1,048,576 bytes.</li>
          </ul>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-2">Value</label>
            <input
              type="text"
              inputMode="decimal"
              value={inputValue}
              onChange={handleInputChange}
              className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg font-mono"
              placeholder="Enter a number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Unit</label>
            <select
              value={inputUnit}
              onChange={(e) => setInputUnit(e.target.value as Unit)}
              className="w-full p-3 border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Presets</label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => handlePreset(p.bytes)}
                className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-gray-50 hover:border-primary/50 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-left p-3 font-medium">Unit</th>
                <th className="text-right p-3 font-medium">Value</th>
                <th className="text-right p-3 font-medium w-16">Copy</th>
              </tr>
            </thead>
            <tbody>
              {conversions.map((conv, i) => (
                <tr key={conv.unit} className="border-b border-border last:border-b-0 hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 font-medium">{conv.unit}</td>
                  <td className="p-3 text-right font-mono text-sm">{conv.value}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleCopy(conv.value, i)}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                      title="Copy value"
                    >
                      {copiedIndex === i ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-gray-50 border border-border rounded-xl text-sm text-muted-foreground">
          <strong>Equivalent in bytes:</strong>{" "}
          <span className="font-mono">{bytes.toLocaleString("en-US")}</span>
        </div>
      </div>
    </ToolLayout>
  );
}
