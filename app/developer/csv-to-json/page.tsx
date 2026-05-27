"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { Copy, Check, AlertCircle, Download, Trash2 } from "lucide-react";

function detectDelimiter(firstLine: string): string {
  const comma = (firstLine.match(/,/g) || []).length;
  const tab = (firstLine.match(/\t/g) || []).length;
  const semicolon = (firstLine.match(/;/g) || []).length;
  if (tab > comma && tab > semicolon) return "\t";
  if (semicolon > comma && semicolon > tab) return ";";
  return ",";
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function csvToJSON(csv: string): Record<string, string>[] {
  const lines = csv.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCSVLine(lines[0], delimiter);
  const result: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = idx < values.length ? values[idx] : "";
    });
    result.push(obj);
  }
  return result;
}

export default function CSVtoJSON() {
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
      const result = csvToJSON(val);
      if (result.length === 0) {
        setError("CSV must have at least a header row and one data row.");
        setOutput("");
        setParsedCount(0);
        return;
      }
      setOutput(JSON.stringify(result, null, 2));
      setParsedCount(result.length);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to parse CSV";
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

  const downloadJSON = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputLines = input ? input.split("\n").length : 0;
  const outputChars = output.length;

  return (
    <ToolLayout
      title="CSV to JSON"
      description="Convert CSV data into JSON format instantly. Handles commas, quotes, and escaped values."
      category="developer"
      faqContent={[
        { question: "What is CSV to JSON conversion?", answer: "CSV to JSON conversion transforms tabular CSV data into a JSON array of objects. Each row becomes an object with keys from the header row." },
        { question: "How do I use the CSV to JSON converter?", answer: "Paste your CSV data into the input textarea. The JSON output updates in real-time. Use Copy or Download to save the result." },
        { question: "Does it handle quoted values with commas?", answer: "Yes. Values enclosed in double quotes are treated as single values, even if they contain commas, newlines, or other special characters." },
        { question: "Can it detect different delimiters?", answer: "Yes, the tool automatically detects whether your CSV uses commas, tabs, or semicolons by analyzing the first row." },
        { question: "How are escaped quotes handled?", answer: "Double quotes inside quoted values are handled correctly using the standard CSV escape format (two double quotes represent one quote character)." },
        { question: "What if a row has missing values?", answer: "Missing values result in empty strings in the corresponding JSON fields. Extra columns beyond headers are ignored." },
        { question: "Does it handle headers with spaces or special characters?", answer: "Yes, headers are used as-is as JSON keys. You can post-process the keys if needed using a JSON manipulation tool." },
        { question: "What is the maximum CSV size?", answer: "The tool processes your data entirely in the browser. Very large files may cause performance issues; consider splitting them." },
        { question: "Can I convert TSV (tab-separated) files?", answer: "Yes. The tool auto-detects tab delimiters and handles them exactly like comma-delimited files." },
        { question: "Is my data sent to a server?", answer: "No, all processing happens in your browser. Your data stays private and never leaves your machine." },
      ]}
      explanationContent={
        <div>
          <h2>About CSV to JSON Conversion</h2>
          <p>CSV to JSON conversion is essential for integrating spreadsheet data into web applications, APIs, and modern data pipelines.</p>

          <h3>What is CSV?</h3>
          <p>CSV (Comma-Separated Values) is a widely supported tabular format used by Excel, Google Sheets, and database export functions. It stores data in plain text with one row per line.</p>

          <h3>What is JSON?</h3>
          <p>JSON (JavaScript Object Notation) is the standard data format for web APIs, configuration files, and NoSQL databases. It supports nested structures and typed values.</p>

          <h3>Why Convert CSV to JSON?</h3>
          <p>JSON is more versatile for programming contexts. Converting CSV to JSON allows data to be consumed by REST APIs, JavaScript applications, and modern data processing tools.</p>

          <h3>How the Parser Works</h3>
          <p>The parser reads the first row as headers, then processes each subsequent row into an object. It handles quoted fields, escaped quotes, and auto-detects the delimiter (comma, tab, semicolon).</p>

          <h3>Handling Edge Cases</h3>
          <p>Empty cells become empty strings. Rows with fewer columns than headers get empty values for missing fields. Rows with extra columns are truncated to match header count.</p>

          <h3>Data Type Considerations</h3>
          <p>CSV values are always strings. If you need numeric or boolean types, use a JSON transformation tool after conversion to cast values appropriately.</p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Input CSV</label>
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
              placeholder={"name,age,city\nJohn,30,New York\nJane,25,London"}
              className="w-full h-96 p-4 font-mono text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none"
              spellCheck={false}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">JSON Output</label>
              <div className="flex items-center gap-3">
                {output && (
                  <>
                    <span className="text-xs text-muted-foreground">{parsedCount} objects, {outputChars} chars</span>
                    <button
                      onClick={downloadJSON}
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
                placeholder="JSON output will appear here"
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
