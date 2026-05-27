"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import Link from "next/link";
import { Copy, Check, AlertCircle, Download, AlignLeft, AlignJustify, Trash2, ArrowLeftRight } from "lucide-react";

function formatJSON(val: string): string {
  const parsed = JSON.parse(val);
  return JSON.stringify(parsed, null, 2);
}

function minifyJSON(val: string): string {
  const parsed = JSON.parse(val);
  return JSON.stringify(parsed);
}

const relatedTools = [
  { name: "HTML Formatter", href: "/developer/html-formatter", desc: "Beautify HTML code" },
  { name: "CSS Beautifier", href: "/developer/css-beautifier", desc: "Format CSS stylesheets" },
  { name: "JS Beautifier", href: "/developer/js-beautifier", desc: "Format JavaScript code" },
  { name: "XML Formatter", href: "/developer/xml-formatter", desc: "Beautify and format XML" },
  { name: "YAML Formatter", href: "/developer/yaml-formatter", desc: "Beautify YAML data" },
  { name: "SQL Formatter", href: "/developer/sql-formatter", desc: "Format SQL queries" },
  { name: "JSON Validator", href: "/developer/json-validator", desc: "Validate JSON structure" },
  { name: "JSON to CSV", href: "/developer/json-to-csv", desc: "Convert JSON array to CSV" },
];

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"format" | "minify">("format");
  const [swapped, setSwapped] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const process = useCallback((val: string, m: "format" | "minify") => {
    if (!val.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      const result = m === "format" ? formatJSON(val) : minifyJSON(val);
      setOutput(result);
      setError(null);
    } catch (err: any) {
      const msg = err?.message || "Invalid JSON";
      if (msg.includes("position")) {
        const posMatch = msg.match(/position\s+(\d+)/);
        if (posMatch) {
          const pos = parseInt(posMatch[1], 10);
          const line = val.slice(0, pos).split("\n").length;
          const col = pos - val.slice(0, pos).lastIndexOf("\n");
          setError(`Syntax error at line ${line}, column ${col}: ${msg}`);
          return;
        }
      }
      setError(msg);
      setOutput("");
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => process(input, mode), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [input, mode, process]);

  const copyToClipboard = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  const clearInput = () => {
    setInput("");
    setOutput("");
    setError(null);
  };

  const downloadOutput = () => {
    if (!output) return;
    const mime = "application/json";
    const blob = new Blob([output], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "format" ? "formatted.json" : "minified.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const swapPanes = () => {
    if (!output) return;
    setInput(output);
    setSwapped(!swapped);
  };

  const lineCount = output ? output.split("\n").length : 0;
  const charCount = output ? output.length : 0;

  return (
    <ToolLayout
      title="JSON Formatter & Validator"
      description="Format, beautify, validate, and minify JSON data instantly in your browser."
      category="developer"
      faqContent={[
        { question: "What is JSON Formatter?", answer: "A JSON Formatter is a tool that takes raw JSON data and formats it with proper indentation, line breaks, and sorting for human readability. It also validates JSON syntax and can minify JSON for production use." },
        { question: "How does JSON formatting work?", answer: "The tool parses your JSON string using JavaScript's built-in JSON.parse() to validate it, then serializes it back with JSON.stringify() using a 2-space indentation for the formatted output, or without spaces for minified output." },
        { question: "Can I minify JSON with this tool?", answer: "Yes. Switch to Minify mode to remove all whitespace and produce compact JSON. This is useful for reducing payload size in API requests and responses." },
        { question: "What happens if my JSON is invalid?", answer: "The tool catches JSON.parse errors and displays a detailed error message including the line and column where the syntax error occurred. Common issues include trailing commas, missing quotes, and mismatched brackets." },
        { question: "Can I download the formatted JSON?", answer: "Yes. Click the Download button to save the formatted or minified JSON as a .json file. You can also copy the output to your clipboard." },
        { question: "How do I swap input and output?", answer: "Click the Swap button between the panes to move the output back to the input for further editing. This is useful for iterative formatting and testing." },
        { question: "Does it handle large JSON files?", answer: "Yes, the tool can handle JSON inputs of 100KB or more. For extremely large files, browser performance may vary. The 300ms debounce ensures the browser is not overloaded during typing." },
        { question: "What is the character limit?", answer: "There is no hard limit. The tool processes your entire input regardless of size. However, performance may degrade with very large files (1MB+)." },
        { question: "Does it support JSON5 or comments in JSON?", answer: "No. This tool follows the strict JSON specification (RFC 8259). JSON5, comments, trailing commas, and single-quoted strings are not valid JSON and will trigger an error." },
        { question: "Is my JSON data sent to a server?", answer: "No. All processing happens entirely in your browser using client-side JavaScript. Your JSON data never leaves your computer." },
      ]}
      explanationContent={
        <div className="space-y-8">
          <section>
            <h2>What Is JSON Formatter?</h2>
            <p>A JSON Formatter (also called JSON Beautifier or JSON Pretty Printer) is a tool that takes raw, compact JSON data and reformats it with proper indentation, line breaks, and structure for human readability. It simultaneously validates the JSON syntax and provides detailed error messages when the JSON is malformed.</p>
            <p>JSON (JavaScript Object Notation) is the most widely used data interchange format on the web. While JSON is designed to be lightweight, compact JSON is difficult for humans to read and debug. A JSON formatter bridges this gap by transforming compact data into an organized, hierarchical view.</p>
          </section>
          <section>
            <h2>How It Works</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>Your input is passed to JavaScript's built-in JSON.parse() for validation</li>
              <li>If parsing succeeds, the parsed object is passed to JSON.stringify() with formatting options</li>
              <li>For formatted output, JSON.stringify uses 2-space indentation and line breaks</li>
              <li>For minified output, JSON.stringify produces compact output without whitespace</li>
              <li>If parsing fails, the error is caught and displayed with position details (line/column)</li>
              <li>Processing is debounced at 300ms for smooth, real-time updates as you type</li>
            </ol>
          </section>
          <section>
            <h2>Features</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>One-click formatting with 2-space indentation</li>
              <li>Minification mode for compact JSON output</li>
              <li>Real-time validation with detailed syntax error reporting (line + column)</li>
              <li>Swap panes to move output back to input for iterative editing</li>
              <li>Copy to clipboard and download as .json file</li>
              <li>Auto-format with 300ms debounce for live updates</li>
              <li>Line count and character count statistics</li>
              <li>Handles all valid JSON types: objects, arrays, strings, numbers, booleans, null</li>
            </ul>
          </section>
          <section>
            <h2>Use Cases</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Debugging API responses during development</li>
              <li>Reading and understanding complex nested JSON structures</li>
              <li>Validating JSON configuration files (package.json, tsconfig.json, etc.)</li>
              <li>Preparing JSON data for documentation or sharing</li>
              <li>Minifying JSON payloads for production API requests</li>
              <li>Teaching JSON structure with formatted examples</li>
            </ul>
          </section>
          <section>
            <h2>Examples</h2>
            <p><strong>Input (minified):</strong></p>
            <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">{'{"name":"Alice","age":30,"address":{"city":"New York","zip":"10001"},"hobbies":["reading","cycling"]}'}</pre>
            <p className="mt-2"><strong>Output (formatted):</strong></p>
            <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">{`{
  "name": "Alice",
  "age": 30,
  "address": {
    "city": "New York",
    "zip": "10001"
  },
  "hobbies": [
    "reading",
    "cycling"
  ]
}`}</pre>
          </section>
          <section>
            <h2>Tips for Better JSON</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Always use double quotes for keys and string values (required by JSON spec)</li>
              <li>Remove trailing commas after the last item in objects and arrays</li>
              <li>Use JSON formatter to validate before committing configuration files</li>
              <li>Minify JSON before sending in API requests to reduce bandwidth</li>
              <li>Use consistent key naming conventions (camelCase is most common)</li>
            </ul>
          </section>
          <section>
            <h2>Common Mistakes</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Trailing commas after the last element in an object or array</li>
              <li>Using single quotes instead of double quotes for strings</li>
              <li>Missing quotes around object keys</li>
              <li>Comments in JSON (JSON does not support comments)</li>
              <li>Mismatched brackets or braces in nested structures</li>
            </ul>
          </section>
          <section>
            <h2>Related Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedTools.map((t) => (
                <Link key={t.name} href={t.href} className="block p-3 border border-border rounded-lg hover:bg-accent transition-colors">
                  <h4 className="font-medium text-sm">{t.name}</h4>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Input JSON</label>
            <button onClick={clearInput} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"key": "value"}'
            className="w-full h-96 p-4 font-mono text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none"
            spellCheck={false}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setMode("format")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg border transition-colors ${
                mode === "format"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              <AlignLeft className="w-4 h-4" /> Format
            </button>
            <button
              onClick={() => setMode("minify")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg border transition-colors ${
                mode === "minify"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              <AlignJustify className="w-4 h-4" /> Minify
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Output</label>
            <div className="flex items-center gap-2">
              <button
                onClick={swapPanes}
                disabled={!output}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                title="Swap input and output"
              >
                <ArrowLeftRight className="w-3 h-3" /> Swap
              </button>
              <button
                onClick={copyToClipboard}
                disabled={!output}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={downloadOutput}
                disabled={!output}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
              >
                <Download className="w-3 h-3" /> Download
              </button>
            </div>
          </div>
          {error ? (
            <div className="w-full h-96 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
              <p className="font-medium">Invalid JSON</p>
              <p className="text-sm opacity-80 mt-1 max-w-xs">{error}</p>
            </div>
          ) : (
            <textarea
              value={output}
              readOnly
              placeholder="Formatted JSON will appear here"
              className="w-full h-96 p-4 font-mono text-sm bg-white border border-border rounded-lg outline-none resize-none"
              spellCheck={false}
            />
          )}
          {output && (
            <div className="text-xs text-muted-foreground text-right">
              {lineCount} line{lineCount !== 1 ? "s" : ""} · {charCount.toLocaleString()} char{charCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
