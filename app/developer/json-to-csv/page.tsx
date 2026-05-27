"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { Copy, Check, AlertCircle, Download, Trash2 } from "lucide-react";

function flattenObject(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
    } else {
      result[newKey] = Array.isArray(value) ? JSON.stringify(value) : value;
    }
  }
  return result;
}

function escapeCSV(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function jsonToCSV(data: unknown[]): string {
  if (!data.length) return "";
  const headers = new Set<string>();
  const flattened = data.map((item) => {
    const flat = flattenObject(item as Record<string, unknown>);
    Object.keys(flat).forEach((k) => headers.add(k));
    return flat;
  });
  const headerArr = Array.from(headers);
  const rows = flattened.map((row) =>
    headerArr.map((h) => escapeCSV(row[h])).join(",")
  );
  return [headerArr.join(","), ...rows].join("\n");
}

export default function JSONtoCSV() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [parsedCount, setParsedCount] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const convert = useCallback((val: string) => {
    if (!val.trim()) {
      setOutput("");
      setError(null);
      setParsedCount(0);
      return;
    }
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) {
        setError("Input must be a JSON array (e.g., [{...}, {...}])");
        setOutput("");
        setParsedCount(0);
        return;
      }
      if (parsed.length === 0) {
        setOutput("");
        setParsedCount(0);
        setError("JSON array is empty. Provide at least one object.");
        return;
      }
      const csv = jsonToCSV(parsed);
      setOutput(csv);
      setParsedCount(parsed.length);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid JSON";
      setError(msg);
      setOutput("");
      setParsedCount(0);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => convert(input), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, convert]);

  const copyToClipboard = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCSV = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputLines = input ? input.split("\n").length : 0;
  const outputLines = output ? output.split("\n").length : 0;

  return (
    <ToolLayout
      title="JSON to CSV"
      description="Convert JSON arrays into CSV format instantly. Supports nested objects and arrays."
      category="developer"
      faqContent={[
        { question: "What is JSON to CSV conversion?", answer: "JSON to CSV conversion transforms a JSON array of objects into a tabular CSV format. Each object becomes a row, and keys become column headers." },
        { question: "How do I use the JSON to CSV converter?", answer: "Paste your JSON array into the input textarea. The CSV output updates in real-time. Use the Copy button to copy or Download to save as a .csv file." },
        { question: "What JSON format is expected?", answer: "The tool expects a JSON array of objects like [{ 'name': 'John', 'age': 30 }, { 'name': 'Jane', 'age': 25 }]. Single objects or non-array values will show an error." },
        { question: "Does it handle nested objects?", answer: "Yes, nested objects are flattened using dot notation. For example, { 'user': { 'name': 'John' } } becomes a 'user.name' column." },
        { question: "How are arrays in values handled?", answer: "Arrays inside objects are converted to JSON strings within the CSV cell. For example, { 'tags': ['a', 'b'] } becomes '[\"a\",\"b\"]'." },
        { question: "Does it handle special characters and commas?", answer: "Yes. Values containing commas, double quotes, or newlines are properly escaped with CSV-standard double-quoting." },
        { question: "What happens if my JSON has different keys per object?", answer: "All unique keys across all objects are collected as columns. Objects missing a key will have an empty cell for that column." },
        { question: "Can I convert very large JSON arrays?", answer: "Yes, but very large datasets may impact browser performance. The tool shows a preview with row counts to help you manage expectations." },
        { question: "What encoding does the CSV use?", answer: "The downloaded CSV uses UTF-8 encoding, ensuring proper handling of Unicode characters, emojis, and international text." },
        { question: "Is my data sent to a server?", answer: "No, all processing happens entirely in your browser. Your data never leaves your machine." },
      ]}
      explanationContent={
        <div>
          <h2>About JSON to CSV Conversion</h2>
          <p>JSON to CSV conversion is a fundamental data transformation used in data analysis, migration, and reporting workflows.</p>

          <h3>What is JSON?</h3>
          <p>JSON (JavaScript Object Notation) is a lightweight data-interchange format that uses key-value pairs and arrays. It is widely used in web APIs and configuration files.</p>

          <h3>What is CSV?</h3>
          <p>CSV (Comma-Separated Values) is a simple tabular format where each line represents a row and values are separated by commas. It is compatible with Excel, Google Sheets, and most database tools.</p>

          <h3>Why Convert JSON to CSV?</h3>
          <p>CSV files are easier to import into spreadsheet applications, database systems, and data analysis tools. Converting JSON to CSV enables non-technical users to work with structured data without specialized software.</p>

          <h3>How the Conversion Works</h3>
          <p>The tool parses the JSON array, extracts all unique keys across objects, flattens nested structures with dot notation, and formats each object as a CSV row with proper escaping.</p>

          <h3>Handling Complex Data</h3>
          <p>Nested objects are flattened with dot notation. Arrays within values are serialized as JSON strings. Special characters, commas, and quotes in values are properly escaped per RFC 4180.</p>

          <h3>Performance Considerations</h3>
          <p>The conversion runs entirely client-side with debounced updates for smooth performance. For extremely large datasets, consider splitting the data into smaller batches.</p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Input JSON Array</label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{inputLines} lines</span>
                <button
                  onClick={() => setInput("")}
                  className="flex items-center text-xs text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </button>
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='[{&quot;name&quot;: &quot;John&quot;, &quot;age&quot;: 30}]'
              className="w-full h-96 p-4 font-mono text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none"
              spellCheck={false}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">CSV Output</label>
              <div className="flex items-center gap-3">
                {output && (
                  <>
                    <span className="text-xs text-muted-foreground">{parsedCount} rows, {outputLines} lines</span>
                    <button
                      onClick={downloadCSV}
                      className="flex items-center text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </button>
                  </>
                )}
                <button
                  onClick={copyToClipboard}
                  disabled={!output}
                  className="flex items-center text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {error ? (
              <div className="w-full h-96 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                <p className="font-medium">Conversion Error</p>
                <p className="text-sm opacity-80 mt-1 max-w-xs">{error}</p>
              </div>
            ) : (
              <textarea
                value={output}
                readOnly
                placeholder="CSV output will appear here"
                className="w-full h-96 p-4 font-mono text-sm bg-white border border-border rounded-lg outline-none resize-none"
                spellCheck={false}
              />
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
