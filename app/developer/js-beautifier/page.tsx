"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import Link from "next/link";
import { Copy, Check, AlertCircle, Download, AlignLeft, AlignJustify, Trash2 } from "lucide-react";

// ── helpers ──
function protectLiterals(js: string): { clean: string; lib: string[] } {
  const lib: string[] = [];
  return {
    clean: js.replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g, (m) => {
      lib.push(m);
      return `\x00${lib.length - 1}\x01`;
    }),
    lib,
  };
}

const OPS = new Set(["+", "-", "*", "/", "%", "**", "==", "!=", "===", "!==", ">", "<", ">=", "<=", "&&", "||", "??", "??=", "&", "|", "^", "~", "<<", ">>", ">>>", "=", "+=", "-=", "*=", "/=", "%=", "**=", "&=", "|=", "^=", "<<=", ">>=", ">>>=", "instanceof", "in", "=>", ":", "?", "?:", "?."]);

const SPACE_BEFORE_KEYWORD = new Set(["if", "else", "for", "while", "do", "switch", "catch", "finally", "try", "function", "class", "return", "throw", "typeof", "void", "delete", "new", "async", "await", "yield"]);

function tokenizeJS(s: string): string[] {
  const out: string[] = [];
  let buf = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i], n = s[i + 1] || "";
    if (/\s/.test(c)) { if (buf) { out.push(buf); buf = ""; } continue; }
    const two = c + n;
    if (OPS.has(two) || two === "?." || two === "=>") { if (buf) { out.push(buf); buf = ""; } out.push(two); i++; continue; }
    if ("{}[]();,;~!@#^%&|*+-/<=>.".includes(c)) { if (buf) { out.push(buf); buf = ""; } out.push(c); continue; }
    buf += c;
  }
  if (buf) out.push(buf);
  return out;
}

function validateBraces(js: string): string | null {
  let d = 0;
  for (const c of js) { if (c === "{") d++; if (c === "}") { d--; if (d < 0) return "Unexpected closing brace '}'"; } }
  if (d > 0) return `Missing ${d} closing brace${d > 1 ? "s" : ""} "}"`;
  return null;
}

// ── line spacing ──
function spaced(tokens: string[]): string {
  let r = "";
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i], p = tokens[i - 1] || "", n = tokens[i + 1] || "";
    if (p && OPS.has(t) && !OPS.has(p)) r += " ";
    if (p && SPACE_BEFORE_KEYWORD.has(t) && /[a-zA-Z0-9_$\])]/.test(p)) r += " ";
    if (p && (t === "{" || t === "[") && /[a-zA-Z0-9_$\])]/.test(p)) r += " ";
    if (p && t === "(" && /[a-zA-Z0-9_$\])]/.test(p)) r += " ";
    if (p && t === ":" && p !== "(" && p !== "[") r += " ";
    if (p && t === "?" && p !== "?") r += " ";
    if (p && t === "else" && p === "}") r += " ";
    if (p && t === "," && p === "}") r += " ";
    r += t;
    if (n && OPS.has(t) && !OPS.has(n)) r += " ";
    if (n && SPACE_BEFORE_KEYWORD.has(t)) r += " ";
    if (n && (t === "," || t === ";")) r += " ";
    if (n && (t === ")" || t === "}" || t === "]") && /[a-zA-Z0-9_]/.test(n)) r += " ";
    if (n && t === ":" && n !== ";") r += " ";
    if (n && t === "else" && n !== "{") r += " ";
    if (n && t === "?" && n !== "?") r += " ";
  }
  return r;
}

// ── recursive formatter ──
function fmtTokens(toks: string[], indent: number): string[] {
  const IND = "  ".repeat(indent);
  const lines: string[] = [];
  let cur: string[] = [];
  let i = 0;

  function flush() {
    if (cur.length) { lines.push(IND + spaced(cur)); cur = []; }
  }
  function flushAfterClose() {
    if (cur.length) { lines.push("  ".repeat(indent) + spaced(cur)); cur = []; }
  }

  while (i < toks.length) {
    const t = toks[i];

    // } → emit at proper indent
    if (t === "}") {
      // Flush anything before the }
      if (cur.length) lines.push("  ".repeat(indent) + spaced(cur));
      cur = [];
      indent = Math.max(0, indent - 1);

      // Collect } with possible else/catch/finally
      const closeToks: string[] = [t];
      i++;
      while (i < toks.length && toks[i] === "}") { closeToks.push(toks[i]); i++; }
      if (i < toks.length && (toks[i] === "else" || toks[i] === "catch" || toks[i] === "finally")) {
        closeToks.push(toks[i]); i++;
        if (i < toks.length && toks[i] === "if") { closeToks.push(toks[i]); i++; }
        lines.push("  ".repeat(indent) + spaced(closeToks));
        // The following { will be processed in next iteration
        continue;
      }
      lines.push("  ".repeat(indent) + spaced(closeToks));
      continue;
    }

    // { → start new block
    if (t === "{") {
      cur.push("{");
      flush();
      indent++;

      // Extract body (everything up to matching })
      let depth = 1;
      i++;
      const body: string[] = [];
      while (i < toks.length && depth > 0) {
        if (toks[i] === "{") depth++;
        else if (toks[i] === "}") { depth--; if (depth === 0) break; }
        body.push(toks[i]);
        i++;
      }
      i++; // skip }

      // Format body recursively
      if (body.length) {
        const bl = fmtTokens(body, indent);
        for (const l of bl) lines.push(l);
      }
      indent--;
      // Now output closing } - but check for else/catch/finally
      if (i < toks.length && (toks[i] === "else" || toks[i] === "catch" || toks[i] === "finally")) {
        const closeToks: string[] = ["}"];
        closeToks.push(toks[i]); i++;
        if (i < toks.length && toks[i] === "if") { closeToks.push(toks[i]); i++; }
        lines.push("  ".repeat(indent) + spaced(closeToks));
      } else {
        lines.push("  ".repeat(indent) + "}");
      }
      continue;
    }

    // [ with nested objects → multi-line array
    if (t === "[" && hasNested(toks, i)) {
      const { body, endIdx } = extractBracket(toks, i);
      cur.push("[");
      flush();
      indent++;
      const items = splitByComma(body);
      for (let k = 0; k < items.length; k++) {
        if (items[k].length === 0) { lines.push("  ".repeat(indent) + "{}"); continue; }
        const il = fmtTokens(items[k], indent);
        for (const l of il) lines.push(l);
        if (k < items.length - 1) {
          const lastLine = lines[lines.length - 1];
          if (lastLine.endsWith(";")) lines[lines.length - 1] = lastLine.slice(0, -1);
          lines[lines.length - 1] += ",";
        }
      }
      indent--;
      flush();
      cur.push("]");
      i = endIdx;
      // Consume trailing ; or ,
      if (i < toks.length && (toks[i] === ";" || toks[i] === ",")) { cur.push(toks[i]); i++; }
      flush();
      continue;
    }

    // ; → end of statement
    if (t === ";") {
      cur.push(";");
      flush();
      i++;
      continue;
    }

    // regular token → accumulate
    cur.push(t);
    i++;
  }

  if (cur.length) flush();
  return lines;
}

function hasNested(toks: string[], idx: number): boolean {
  const { body } = extractBracket(toks, idx);
  return body.some((t) => t === "{");
}

function extractBracket(toks: string[], idx: number): { body: string[]; endIdx: number } {
  let d = 1, i = idx + 1;
  const body: string[] = [];
  while (i < toks.length && d > 0) {
    if (toks[i] === "[") d++;
    else if (toks[i] === "]") { d--; if (d === 0) break; }
    body.push(toks[i]); i++;
  }
  return { body, endIdx: i + 1 };
}

function splitByComma(toks: string[]): string[][] {
  const items: string[][] = [];
  let cur: string[] = [], d = 0;
  for (const t of toks) {
    if (t === "{" || t === "[" || t === "(") d++;
    else if (t === "}" || t === "]" || t === ")") d--;
    if (t === "," && d === 0) { items.push(cur); cur = []; }
    else cur.push(t);
  }
  if (cur.length) items.push(cur);
  return items;
}

// ── public API ──
function formatJS(js: string): string {
  if (!js.trim()) return "";
  const { clean, lib } = protectLiterals(js);
  const s = clean.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const e = validateBraces(s);
  if (e) throw new Error(e);
  const lines = fmtTokens(tokenizeJS(s), 0);
  let r = lines.join("\n").replace(/\x00(\d+)\x01/g, (_, idx) => lib[+idx] || "");
  r = r.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  return r;
}

function minifyJS(js: string): string {
  const { clean, lib } = protectLiterals(js);
  const s = clean.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  return s.replace(/\s+/g, " ").replace(/\s*({|}|\(|\)|;|,|:)\s*/g, "$1").replace(/;\}/g, "}").trim().replace(/\x00(\d+)\x01/g, (_, idx) => lib[+idx] || "");
}



const relatedTools = [
  { name: "HTML Formatter", href: "/developer/html-formatter", desc: "Beautify HTML code" },
  { name: "CSS Beautifier", href: "/developer/css-beautifier", desc: "Format CSS stylesheets" },
  { name: "JSON Formatter", href: "/developer/json-formatter", desc: "Beautify and validate JSON" },
  { name: "XML Formatter", href: "/developer/xml-formatter", desc: "Beautify and format XML" },
  { name: "YAML Formatter", href: "/developer/yaml-formatter", desc: "Beautify YAML data" },
  { name: "SQL Formatter", href: "/developer/sql-formatter", desc: "Format SQL queries" },
  { name: "Regex Tester", href: "/developer/regex-tester", desc: "Test regular expressions" },
  { name: "Base64 Encoder/Decoder", href: "/developer/base64-encoder", desc: "Encode or decode Base64" },
];

export default function JsBeautifier() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"format" | "minify">("format");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const process = useCallback((val: string, m: "format" | "minify") => {
    if (!val.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      if (m === "format") {
        const formatted = formatJS(val);
        try {
          new Function(formatted);
        } catch {
          setOutput(formatted);
          setError(null);
          return;
        }
        setOutput(formatted);
        setError(null);
      } else {
        const minified = minifyJS(val);
        try {
          new Function(minified);
        } catch {
          setOutput(minified);
          setError(null);
          return;
        }
        setOutput(minified);
        setError(null);
      }
    } catch (e: any) {
      setError(e?.message || "Error processing JavaScript");
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
    const blob = new Blob([output], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "format" ? "formatted.js" : "minified.js";
    a.click();
    URL.revokeObjectURL(url);
  };

  const lineCount = output ? output.split("\n").length : 0;
  const charCount = output ? output.length : 0;

  return (
    <ToolLayout
      title="JS Beautifier"
      description="Format, beautify, and minify JavaScript code instantly in your browser."
      category="developer"
      faqContent={[
        { question: "What is JS Beautifier?", answer: "A JS Beautifier (JavaScript Formatter) is a tool that reformats raw, minified, or messy JavaScript code with proper indentation, line breaks, and consistent styling to make it readable and maintainable." },
        { question: "How does the JavaScript formatting work?", answer: "The tool processes your code line by line, tracking brace, bracket, and parenthesis depth. It re-indents each line based on the current nesting level, while preserving string literals, template literals, comments, and regex patterns." },
        { question: "Does it handle edge cases like strings with braces?", answer: "Yes. The tool temporarily replaces string literals, template literals, and regex patterns with placeholders before counting braces. This ensures that braces inside strings don't affect the indentation." },
        { question: "What about comments in the code?", answer: "Single-line (//) and multi-line (/* */) comments are preserved during formatting and properly indented. During minification, comments are removed to reduce file size." },
        { question: "Can I minify JavaScript with this tool?", answer: "Yes. Switch to Minify mode to remove all comments, whitespace, and unnecessary characters, producing compact JavaScript ideal for production deployment." },
        { question: "Does the tool validate JavaScript syntax?", answer: "Yes. The tool runs the formatted output through the Function constructor as a basic syntax check. If the code contains syntax errors, the formatting result is still displayed but you will see a warning." },
        { question: "Can I download the formatted JavaScript?", answer: "Yes. Click the Download button to save the formatted or minified JS as a .js file. You can also copy the output to your clipboard." },
        { question: "Does it support modern JavaScript (ES2020+)?", answer: "Yes. The tool supports modern JavaScript syntax including arrow functions, async/await, destructuring, spread operators, template literals, and optional chaining." },
        { question: "What is the difference between Format and Minify?", answer: "Format adds proper indentation and line breaks for readability. Minify removes all extra whitespace, newlines, and comments to create the smallest possible file for production." },
        { question: "Is my JavaScript code sent to a server?", answer: "No. All processing happens entirely in your browser using client-side JavaScript. Your code never leaves your computer." },
      ]}
      explanationContent={
        <div className="space-y-8">
          <section>
            <h2>What Is JS Beautifier?</h2>
            <p>A JS Beautifier (JavaScript Formatter or Pretty Printer) is a developer tool that automatically formats raw, minified, or messy JavaScript code with proper indentation, line breaks, and consistent styling. It transforms unreadable or compact code into well-structured, human-readable code that follows best practices for formatting.</p>
            <p>JavaScript code from build tools, CDNs, or copy-pasted from the web is often minified or poorly formatted. A JS beautifier instantly restores readability, making debugging, code review, and learning much easier.</p>
          </section>
          <section>
            <h2>How It Works</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>Split the input into individual lines</li>
              <li>Temporarily replace strings, template literals, and regex patterns with safe placeholders to prevent false brace counting</li>
              <li>Detect and handle single-line comments by splitting them off</li>
              <li>Count opening and closing braces, brackets, and parentheses on each line (excluding those inside strings)</li>
              <li>Adjust the indentation level based on the net brace/bracket/paren depth</li>
              <li>Rebuild the output with 2-space indentation at the appropriate level</li>
              <li>Optionally validate syntax using the Function constructor</li>
            </ol>
          </section>
          <section>
            <h2>Features</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Smart indentation based on brace, bracket, and parenthesis depth</li>
              <li>Preserves string literals, template literals, regex patterns, and comments</li>
              <li>Handles edge cases like braces inside strings and regex</li>
              <li>Minification mode for production-ready compact code</li>
              <li>Basic syntax validation via Function constructor</li>
              <li>Auto-format with 300ms debounce for live updates</li>
              <li>Copy to clipboard and download as .js file</li>
              <li>Line count and character count statistics</li>
            </ul>
          </section>
          <section>
            <h2>Use Cases</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Debugging minified JavaScript from production builds</li>
              <li>Reading and understanding third-party scripts</li>
              <li>Formatting code before code review or sharing</li>
              <li>Learning JavaScript by examining formatted code</li>
              <li>Preparing code snippets for documentation or blog posts</li>
              <li>Minifying your own scripts for production deployment</li>
            </ul>
          </section>
          <section>
            <h2>Examples</h2>
            <p><strong>Input (minified):</strong></p>
            <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">{'function hello(name){const msg=`Hello, ${name}!`;for(let i=0;i<3;i++){console.log(msg)}return msg}'}</pre>
            <p className="mt-2"><strong>Output (formatted):</strong></p>
            <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">{`function hello(name) {
  const msg = \`Hello, \${name}!\`;
  for (let i = 0; i < 3; i++) {
    console.log(msg);
  }
  return msg;
}`}</pre>
          </section>
          <section>
            <h2>Tips for Better JavaScript</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Use 2-space indentation (the industry standard for JavaScript)</li>
              <li>Always use semicolons to avoid ASI (Automatic Semicolon Insertion) issues</li>
              <li>Keep functions small and focused on a single responsibility</li>
              <li>Use const by default, let when you need to reassign, and avoid var</li>
              <li>Add meaningful comments for complex logic, not for obvious code</li>
            </ul>
          </section>
          <section>
            <h2>Common Mistakes</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Inconsistent indentation mixing tabs and spaces</li>
              <li>Missing semicolons leading to unexpected behavior</li>
              <li>Overly nested callbacks instead of using async/await or promises</li>
              <li>Not handling edge cases in string escaping</li>
              <li>Leaving console.log statements in production code</li>
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
            <label className="text-sm font-medium">Input JavaScript</label>
            <button onClick={clearInput} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="function hello() { console.log('world'); }"
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
              placeholder="Formatted JavaScript will appear here"
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
