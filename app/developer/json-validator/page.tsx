"use client";

import { useState, useCallback, useEffect } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { Copy, Check, AlertCircle, RotateCw, Minus, Plus, Upload } from "lucide-react";

export default function JsonValidator() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const validateAndFormat = useCallback((value: string, mode: "format" | "minify") => {
    if (!value.trim()) {
      setOutput("");
      setError(null);
      setIsValid(null);
      return;
    }
    try {
      const parsed = JSON.parse(value);
      setOutput(mode === "format" ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed));
      setError(null);
      setIsValid(true);
    } catch (err: any) {
      const msg = err.message || "Invalid JSON";
      const match = msg.match(/position\s+(\d+)/i);
      let detailed = msg;
      if (match) {
        const pos = parseInt(match[1]);
        const line = value.substring(0, pos).split("\n").length;
        const col = pos - value.substring(0, pos).lastIndexOf("\n");
        detailed = `${msg} at line ${line}, column ${col}`;
      }
      setError(detailed);
      setOutput("");
      setIsValid(false);
    }
  }, []);

  useEffect(() => {
    setCharCount(input.length);
    setLineCount(input ? input.split("\n").length : 0);
  }, [input]);

  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (!input.trim()) {
      setOutput("");
      setError(null);
      setIsValid(null);
      return;
    }
    const timer = setTimeout(() => {
      validateAndFormat(input, "format");
    }, 300);
    setDebounceTimer(timer);
    return () => clearTimeout(timer);
  }, [input, validateAndFormat]);

  const handleFormat = useCallback(() => {
    validateAndFormat(input, "format");
  }, [input, validateAndFormat]);

  const handleMinify = useCallback(() => {
    validateAndFormat(input, "minify");
  }, [input, validateAndFormat]);

  const copyToClipboard = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [output]);

  const clearAll = useCallback(() => {
    setInput("");
    setOutput("");
    setError(null);
    setIsValid(null);
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setInput(text);
    };
    reader.readAsText(file);
  }, []);

  return (
    <ToolLayout
      title="JSON Validator"
      description="Validate, format, and beautify JSON data with detailed error messages and line-level precision."
      category="developer"
      faqContent={[
        {
          question: "What makes a JSON document valid?",
          answer: "A valid JSON document must follow strict syntax rules: data must be in key-value pairs using double quotes, strings use double quotes (not single), numbers are unquoted, objects use curly braces, arrays use square brackets, and a trailing comma is not allowed. The document must parse completely without syntax errors."
        },
        {
          question: "How does the validator detect error positions?",
          answer: "The tool parses your input with JSON.parse() and catches SyntaxError exceptions. It extracts the character position from the error message, then calculates the exact line and column number by counting newline characters before that position, giving you precise debugging coordinates."
        },
        {
          question: "What is the difference between formatting and minifying?",
          answer: "Formatting (beautification) adds 2-space indentation, newlines, and whitespace to make JSON human-readable. Minifying removes all non-essential whitespace, producing a compact string ideal for storage or transmission where bandwidth matters."
        },
        {
          question: "Can I validate very large JSON files?",
          answer: "Yes, the tool handles large inputs efficiently using native JSON.parse which is highly optimized in JavaScript engines. Files up to several megabytes work well, though extremely large files may cause browser UI lag since parsing happens synchronously."
        },
        {
          question: "Does this validator support JSON5 or JSON with comments?",
          answer: "No, this tool strictly validates standard JSON per the ECMA-404 specification. JSON5, comments, trailing commas, single-quoted strings, and unquoted keys are not valid standard JSON. Use JSON5 libraries for extended syntax support."
        },
        {
          question: "What edge cases should I watch for in JSON?",
          answer: "Common edge cases include: floating point precision (0.1 + 0.2 !== 0.3), deeply nested objects causing stack overflow, duplicate keys (last one wins per spec), unicode escape sequences, and extremely long strings that may cause memory issues."
        },
        {
          question: "How do I validate JSON from a file?",
          answer: "Use the Upload button to select a .json file from your computer. The tool reads the file using the FileReader API and validates the content. This is particularly useful for validating configuration files, API responses, or data exports."
        },
        {
          question: "What is the maximum safe integer in JSON?",
          answer: "JSON does not specify integer bounds, but JavaScript's Number.MAX_SAFE_INTEGER is 9007199254740991 (2^53 - 1). Integers beyond this range may lose precision when parsed. Use string encoding for large numbers like API IDs or financial values."
        },
        {
          question: "Can this tool detect duplicate keys?",
          answer: "Standard JSON.parse() does not throw on duplicate keys - it silently uses the last value. To detect duplicates, you would need a custom parser. This tool reports the validation result per the spec but does not flag duplicate keys as errors."
        },
        {
          question: "Why does my JSON show 'Unexpected token' error?",
          answer: "This error typically means there is a syntax character in an unexpected position. Common causes: using single quotes instead of double, trailing commas in objects/arrays, missing commas between properties, unescaped control characters, or stray whitespace characters."
        }
      ]}
      explanationContent={
        <div className="space-y-6">
          <section>
            <h3 className="text-xl font-bold mb-2">What is JSON Validation?</h3>
            <p className="text-muted-foreground">
              JSON (JavaScript Object Notation) validation is the process of verifying that a given string conforms to the JSON specification (ECMA-404 / RFC 8259). A valid JSON document must be syntactically correct with properly matched brackets, quoted strings, and correct data type formatting.
            </p>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">How It Works</h3>
            <p className="text-muted-foreground">
              The tool uses JavaScript's native JSON.parse() method which is a deterministic, spec-compliant parser. When the input parses successfully, the result is a valid JavaScript object. If parsing fails, a SyntaxError is thrown containing the character position of the error, which the tool translates into a human-readable line:column format.
            </p>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">Features</h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Real-time validation with 300ms debounce for responsive feedback</li>
              <li>Precise error reporting with line and column numbers</li>
              <li>Format (beautify) and minify (compress) valid JSON</li>
              <li>File upload support for .json files</li>
              <li>Character and line count metrics</li>
              <li>Copy to clipboard with visual confirmation</li>
              <li>Visual valid/invalid status badge</li>
            </ul>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">Use Cases</h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Debugging API responses during development</li>
              <li>Validating configuration files before deployment</li>
              <li>Formatting JSON data for readability in documentation</li>
              <li>Minifying JSON to reduce payload size for production</li>
              <li>Teaching JSON syntax to students and junior developers</li>
            </ul>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">Examples</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-2">
              <p className="font-semibold text-foreground">Valid JSON:</p>
              <pre className="text-muted-foreground">{`{
  "name": "Product API",
  "version": "2.0.0",
  "endpoints": ["/users", "/products"]
}`}</pre>
              <p className="font-semibold text-foreground mt-4">Invalid JSON:</p>
              <pre className="text-muted-foreground">{`{
  name: "Product API",  // Error: unquoted key
  'version': "2.0.0",  // Error: single quotes
}`}</pre>
            </div>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">Tips</h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Always validate JSON before parsing in production code</li>
              <li>Use 2-space indentation as the industry standard for readability</li>
              <li>Validate JSON schema against your data structure, not just syntax</li>
              <li>For large files, validate in chunks or use streaming parsers</li>
              <li>Remember that JSON keys must be unique per object per the spec</li>
            </ul>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">Common Mistakes</h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Using single quotes instead of double quotes for strings and keys</li>
              <li>Adding trailing commas after the last element in objects or arrays</li>
              <li>Using comments (JSON does not support // or /* */ comments)</li>
              <li>Leaving a trailing comma after the last key-value pair</li>
              <li>Forgetting to escape special characters like quotes or backslashes in strings</li>
            </ul>
          </section>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Status badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isValid === null ? "bg-muted text-muted-foreground" :
              isValid ? "bg-green-100 text-green-700" :
              "bg-red-100 text-red-700"
            }`}>
              {isValid === null ? "Waiting" : isValid ? "Valid JSON" : "Invalid JSON"}
            </div>
            <span className="text-xs text-muted-foreground">
              {charCount.toLocaleString()} chars | {lineCount} lines
            </span>
          </div>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer p-2 rounded-lg hover:bg-muted transition-colors" title="Upload JSON file">
              <input type="file" accept=".json,application/json" onChange={handleFileUpload} className="hidden" />
              <Upload className="w-4 h-4 text-muted-foreground" />
            </label>
            <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors">
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input panel */}
          <div className="bg-white border border-border rounded-xl">
            <div className="flex justify-between items-center px-4 pt-4 pb-2">
              <label className="text-sm font-semibold text-foreground">Input JSON</label>
              <div className="flex gap-1">
                <button
                  onClick={handleFormat}
                  disabled={!input.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Format
                </button>
                <button
                  onClick={handleMinify}
                  disabled={!input.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-3 h-3" />
                  Minify
                </button>
              </div>
            </div>
            <div className="px-4 pb-4">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`{\n  "example": "Paste your JSON here"\n}`}
                className="w-full h-96 p-4 font-mono text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Output panel */}
          <div className="bg-white border border-border rounded-xl">
            <div className="flex justify-between items-center px-4 pt-4 pb-2">
              <label className="text-sm font-semibold text-foreground">Output</label>
              <button
                onClick={copyToClipboard}
                disabled={!output}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="px-4 pb-4">
              {error ? (
                <div className="w-full h-96 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex flex-col items-center justify-center text-center">
                  <AlertCircle className="w-8 h-8 mb-2 text-red-400" />
                  <p className="font-semibold text-sm">Parse Error</p>
                  <p className="text-xs mt-1 max-w-xs opacity-80 font-mono">{error}</p>
                </div>
              ) : (
                <textarea
                  value={output}
                  readOnly
                  placeholder="Validated & formatted JSON will appear here"
                  className="w-full h-96 p-4 font-mono text-sm bg-white border border-border rounded-lg outline-none resize-none"
                  spellCheck={false}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
