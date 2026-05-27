"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import Link from "next/link";
import { Copy, Check, AlertCircle, Download, AlignLeft, AlignJustify, Trash2, ArrowUpDown } from "lucide-react";

function stripCSSComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function formatSelectors(sel: string): string {
  return sel.replace(/\s*,\s*/g, ", ").replace(/\s*{\s*/g, " {").replace(/\s+>/g, " >").replace(/>\s+/g, "> ").replace(/\s*\+\s*/g, " + ").replace(/\s*~\s*/g, " ~ ").replace(/\s+/g, " ").trim();
}

function formatPropertyValue(val: string): string {
  return val.replace(/\s*:\s*/g, ": ").replace(/\s*;\s*/g, ";").replace(/\s+/g, " ").trim();
}

function validateBraces(css: string): string | null {
  let stack = 0;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === "{") stack++;
    if (ch === "}") stack--;
    if (stack < 0) return "Unexpected closing brace '}'";
  }
  if (stack > 0) return `Missing ${stack} closing brace${stack > 1 ? "s" : ""} "}"`;
  return null;
}

function formatCSSBlock(css: string, indentLevel: number, sortProps: boolean, dedup: boolean, seenSelectors: Set<string>): { result: string; error: string | null } {
  const indent = "  ".repeat(indentLevel);
  const innerIndent = "  ".repeat(indentLevel + 1);
  const cleaned = stripCSSComments(css).trim();
  if (!cleaned) return { result: "", error: null };

  const validation = validateBraces(cleaned);
  if (validation) return { result: "", error: validation };

  const output: string[] = [];
  let i = 0;
  const len = cleaned.length;

  while (i < len) {
    const rest = cleaned.slice(i);
    if (!rest.trim()) break;

    // skip whitespace
    if (rest[0] === " " || rest[0] === "\n" || rest[0] === "\t" || rest[0] === "\r") {
      i++;
      continue;
    }

    // handle @-rule
    if (rest[0] === "@") {
      const atIndex = rest.indexOf("{");
      const semiIndex = rest.indexOf(";");
      if (atIndex >= 0 && (semiIndex < 0 || atIndex < semiIndex)) {
        // block @-rule like @media, @keyframes, @supports
        const preamble = rest.slice(0, atIndex).trim();
        const restAfter = rest.slice(atIndex + 1);
        // find matching closing brace
        let depth = 1;
        let blockEnd = -1;
        for (let j = 0; j < restAfter.length; j++) {
          if (restAfter[j] === "{") depth++;
          if (restAfter[j] === "}") {
            depth--;
            if (depth === 0) {
              blockEnd = j;
              break;
            }
          }
        }
        if (blockEnd < 0) return { result: "", error: "Unclosed @rule block" };

        const inner = restAfter.slice(0, blockEnd).trim();
        const { result: formattedInner, error: innerError } = formatCSSBlock(inner, indentLevel + 1, sortProps, dedup, seenSelectors);
        if (innerError) return { result: "", error: innerError };

        // Special handling for @keyframes where we want more compact formatting
        if (/^@keyframes\b/i.test(preamble)) {
          const innerLines = formattedInner.split("\n");
          const formattedKeyframes = innerLines.map((l) => innerIndent + l).join("\n");
          output.push(`${indent}${preamble} {`);
          output.push(formattedKeyframes);
          output.push(`${indent}}`);
        } else {
          output.push(`${indent}${preamble} {`);
          if (formattedInner) output.push(formattedInner);
          output.push(`${indent}}`);
        }
        i += atIndex + 1 + blockEnd + 1;
      } else if (semiIndex >= 0) {
        // value @-rule like @import, @charset, @namespace
        const val = rest.slice(0, semiIndex).trim();
        output.push(`${indent}${val};`);
        i += semiIndex + 1;
      } else {
        return { result: "", error: `Invalid @rule` };
      }
      continue;
    }

    // handle string/selector block
    const braceIdx = rest.indexOf("{");
    if (braceIdx >= 0) {
      let selector = rest.slice(0, braceIdx).trim();
      const restAfter = rest.slice(braceIdx + 1);

      // find matching closing brace
      let depth = 1;
      let blockEnd = -1;
      for (let j = 0; j < restAfter.length; j++) {
        if (restAfter[j] === "{") depth++;
        if (restAfter[j] === "}") {
          depth--;
          if (depth === 0) {
            blockEnd = j;
            break;
          }
        }
      }
      if (blockEnd < 0) return { result: "", error: "Unclosed rule block" };

      const inner = restAfter.slice(0, blockEnd).trim();
      selector = formatSelectors(selector);

      // Dedup check
      if (dedup) {
        const key = selector.replace(/\s+/g, " ");
        if (seenSelectors.has(key)) {
          i += braceIdx + 1 + blockEnd + 1;
          continue;
        }
        seenSelectors.add(key);
      }

      // Parse properties from inner content
      // Check if inner contains { } - if so, recurse (nested)
      if (inner.includes("{")) {
        // This is an @-rule or nested block (e.g., & nesting in future CSS)
        const { result: formattedInner, error: innerErr } = formatCSSBlock(inner, indentLevel + 1, sortProps, dedup, seenSelectors);
        if (innerErr) return { result: "", error: innerErr };
        output.push(`${indent}${selector} {`);
        if (formattedInner) {
          output.push(formattedInner.split("\n").map((l) => innerIndent + l).join("\n"));
        }
        output.push(`${indent}}`);
      } else if (inner) {
        // Simple property block
        const props = inner.split(";").map((p) => p.trim()).filter((p) => p.length > 0);
        let formattedProps = props;
        if (sortProps) {
          formattedProps = [...formattedProps].sort((a, b) => {
            const aName = a.split(":")[0].replace(/\s+/g, " ").trim();
            const bName = b.split(":")[0].replace(/\s+/g, " ").trim();
            return aName.localeCompare(bName);
          });
        }
        output.push(`${indent}${selector} {`);
        for (const p of formattedProps) {
          const propVal = formatPropertyValue(p);
          output.push(`${innerIndent}${propVal};`);
        }
        output.push(`${indent}}`);
      } else {
        // Empty block - keep selector but no props
        output.push(`${indent}${selector} {}`);
      }

      i += braceIdx + 1 + blockEnd + 1;
    } else {
      // dangling content - properties without selector
      const semiIdx = rest.indexOf(";");
      if (semiIdx >= 0) {
        output.push(`${indent}${rest.slice(0, semiIdx).trim()};`);
        i += semiIdx + 1;
      } else {
        // Just skip unrecognized content
        i++;
      }
    }
  }

  return { result: output.join("\n"), error: null };
}

function formatCSS(css: string, sortProps: boolean, dedup: boolean): string {
  if (!css.trim()) return "";
  const cleaned = stripCSSComments(css).trim();
  if (!cleaned) return "";

  const validation = validateBraces(cleaned);
  if (validation) throw new Error(validation);

  const seenSelectors = new Set<string>();
  const { result, error } = formatCSSBlock(cleaned, 0, sortProps, dedup, seenSelectors);
  if (error) throw new Error(error);
  return result + "\n";
}

function minifyCSS(css: string): string {
  return stripCSSComments(css)
    .replace(/\s*\/\*[\s\S]*?\*\/\s*/g, "")
    .replace(/}\s*{/g, "){")
    .replace(/;\s*/g, ";")
    .replace(/:\s*/g, ":")
    .replace(/\s*{\s*/g, "{")
    .replace(/\s*}\s*/g, "}")
    .replace(/,\s*/g, ",")
    .replace(/\s+/g, " ")
    .replace(/;\s*}/g, "}")
    .trim();
}

const relatedTools = [
  { name: "HTML Formatter", href: "/developer/html-formatter", desc: "Beautify HTML code" },
  { name: "JS Beautifier", href: "/developer/js-beautifier", desc: "Format JavaScript code" },
  { name: "JSON Formatter", href: "/developer/json-formatter", desc: "Beautify and validate JSON" },
  { name: "XML Formatter", href: "/developer/xml-formatter", desc: "Beautify and format XML" },
  { name: "YAML Formatter", href: "/developer/yaml-formatter", desc: "Beautify YAML data" },
  { name: "SQL Formatter", href: "/developer/sql-formatter", desc: "Format SQL queries" },
  { name: "Color Picker", href: "/developer/color-picker", desc: "Pick and convert colors" },
  { name: "Base64 Encoder/Decoder", href: "/developer/base64-encoder", desc: "Encode or decode Base64" },
];

export default function CssBeautifier() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"format" | "minify">("format");
  const [sortProps, setSortProps] = useState(false);
  const [dedup, setDedup] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const process = useCallback(
    (val: string, m: "format" | "minify") => {
      if (!val.trim()) {
        setOutput("");
        setError(null);
        return;
      }
      try {
        const result =
          m === "format" ? formatCSS(val, sortProps, dedup) : minifyCSS(val);
        setOutput(result);
        setError(null);
      } catch (e: any) {
        setError(e?.message || "Error processing CSS");
        setOutput("");
      }
    },
    [sortProps, dedup]
  );

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => process(input, mode), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [input, mode, sortProps, dedup, process]);

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
    const blob = new Blob([output], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "format" ? "formatted.css" : "minified.css";
    a.click();
    URL.revokeObjectURL(url);
  };

  const lineCount = output ? output.split("\n").length : 0;
  const charCount = output ? output.length : 0;

  return (
    <ToolLayout
      title="CSS Beautifier"
      description="Format, beautify, sort, and minify CSS stylesheets instantly."
      category="developer"
      faqContent={[
        { question: "What is CSS Beautifier?", answer: "A CSS Beautifier (also called CSS Formatter or CSS Pretty Printer) is a tool that reformats raw or minified CSS code with proper indentation, line breaks, and consistent styling for better readability." },
        { question: "How does the CSS formatting work?", answer: "The tool parses your CSS into rule blocks by splitting on opening and closing braces. Each rule is decomposed into its selector and properties. Properties are then indented with 2 spaces and placed on separate lines." },
        { question: "Can I sort CSS properties alphabetically?", answer: "Yes. Toggle the Sort Properties option to alphabetically order all CSS properties within each rule. This helps maintain consistent property ordering across your stylesheets." },
        { question: "Does it remove duplicate CSS selectors?", answer: "Yes. Toggle the Remove Duplicates option to detect and remove duplicate selector blocks. Only the first occurrence of each selector is kept, which helps eliminate redundant CSS." },
        { question: "Can I minify CSS with this tool?", answer: "Yes. Switch to Minify mode to collapse the entire stylesheet into a single line by removing all whitespace, comments, and unnecessary characters. This is ideal for production deployment." },
        { question: "What happens to CSS comments?", answer: "CSS comments (/* ... */) are removed during formatting and minification. If you need to preserve comments for documentation, you should keep a separate copy of your original CSS." },
        { question: "Does this tool support CSS preprocessors like SCSS?", answer: "This tool is designed for standard CSS. SCSS and Less syntax with nested rules may not format correctly. Use a preprocessor-specific tool for those languages." },
        { question: "Can I download the formatted CSS?", answer: "Yes. Click the Download button to save the formatted or minified CSS as a .css file. You can also copy the output to your clipboard." },
        { question: "What is the difference between Format and Minify?", answer: "Format adds indentation, line breaks, and organized structure for human readability. Minify removes all extra characters to create the smallest possible file size for faster loading." },
        { question: "Is my CSS data sent to a server?", answer: "No. All processing happens entirely in your browser. Your CSS code never leaves your computer, ensuring complete privacy." },
      ]}
      explanationContent={
        <div className="space-y-8">
          <section>
            <h2>What Is CSS Beautifier?</h2>
            <p>A CSS Beautifier is a developer tool that automatically formats raw, minified, or messy CSS code into a clean, well-organized, and readable structure. It applies consistent indentation, places each property on its own line, and can sort properties alphabetically and remove duplicate selectors.</p>
            <p>CSS files can quickly become unreadable, especially when generated by preprocessors, copied from online sources, or maintained by multiple developers over time. A CSS beautifier restores order and makes your stylesheets maintainable.</p>
          </section>
          <section>
            <h2>How It Works</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>Parse the CSS string into individual rule blocks by tracking brace depth</li>
              <li>Extract the selector and the list of property declarations for each rule</li>
              <li>If sorting is enabled, sort property names alphabetically (A-Z)</li>
              <li>If dedup is enabled, skip rules whose selector has already been seen</li>
              <li>Rebuild each rule with 2-space indentation on each property</li>
              <li>Separate rules with double newlines for visual grouping</li>
            </ol>
          </section>
          <section>
            <h2>Features</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Parse and format complex CSS with nested braces and @-rules</li>
              <li>Alphabetical property sorting for consistent stylesheets</li>
              <li>Duplicate selector detection and removal</li>
              <li>One-click minification for production</li>
              <li>Auto-format with 300ms debounce</li>
              <li>Copy to clipboard and download as .css file</li>
              <li>Line count and character count statistics</li>
            </ul>
          </section>
          <section>
            <h2>Use Cases</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Cleaning up legacy CSS files inherited from other developers</li>
              <li>Formatted reading of minified CSS from external libraries</li>
              <li>Maintaining consistent property ordering across a team</li>
              <li>Removing duplicate selectors to reduce file size</li>
              <li>Preparing CSS for code review with consistent formatting</li>
              <li>Minifying stylesheets before production deployment</li>
            </ul>
          </section>
          <section>
            <h2>Examples</h2>
            <p><strong>Input (minified):</strong></p>
            <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">{'body{margin:0;padding:0;color:#333;font-family:sans-serif}.container{max-width:1200px;margin:0 auto}.header{background:#f5f5f5;padding:20px}'}</pre>
            <p className="mt-2"><strong>Output (formatted, sorted):</strong></p>
            <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">{`body {
  color: #333;
  font-family: sans-serif;
  margin: 0;
  padding: 0;
}

.container {
  margin: 0 auto;
  max-width: 1200px;
}

.header {
  background: #f5f5f5;
  padding: 20px;
}`}</pre>
          </section>
          <section>
            <h2>Tips for Better CSS</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Use alphabetical ordering for properties to find them faster</li>
              <li>Group related selectors together and separate sections with comments</li>
              <li>Avoid deep selector nesting - keep specificity low</li>
              <li>Use CSS custom properties (variables) for reusable values</li>
              <li>Always run production CSS through a minifier for performance</li>
            </ul>
          </section>
          <section>
            <h2>Common Mistakes</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Missing semicolons after property values - always required</li>
              <li>Duplicate selectors that override each other unintentionally</li>
              <li>Using !important instead of increasing specificity properly</li>
              <li>Not grouping related properties for readability</li>
              <li>Forgetting to close braces on rule blocks</li>
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
            <label className="text-sm font-medium">Input CSS</label>
            <button onClick={clearInput} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="body { margin: 0; padding: 0; }"
            className="w-full h-72 p-4 font-mono text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none"
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
          {mode === "format" && (
            <div className="flex gap-3 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sortProps}
                  onChange={(e) => setSortProps(e.target.checked)}
                  className="rounded border-border"
                />
                <ArrowUpDown className="w-3 h-3" /> Sort properties
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dedup}
                  onChange={(e) => setDedup(e.target.checked)}
                  className="rounded border-border"
                />
                Remove duplicates
              </label>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Output</label>
            <div className="flex items-center gap-2">
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
            <div className="w-full h-72 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
              <p className="font-medium">Error</p>
              <p className="text-sm opacity-80 mt-1 max-w-xs">{error}</p>
            </div>
          ) : (
            <textarea
              value={output}
              readOnly
              placeholder="Formatted CSS will appear here"
              className="w-full h-72 p-4 font-mono text-sm bg-white border border-border rounded-lg outline-none resize-none"
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
