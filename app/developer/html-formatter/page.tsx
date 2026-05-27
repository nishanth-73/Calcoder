"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import Link from "next/link";
import { Copy, Check, AlertCircle, Download, AlignLeft, AlignJustify, Trash2 } from "lucide-react";

const BLOCK_TAGS = new Set([
  "html","head","body","div","p","h1","h2","h3","h4","h5","h6","ul","ol","li",
  "table","tr","td","th","thead","tbody","tfoot","section","article","nav",
  "header","footer","main","aside","figure","figcaption","form","fieldset",
  "select","option","optgroup","details","summary","menu","dialog","template",
  "noscript","script","style","blockquote","dl","dt","dd","address","frameset",
  "frame","iframe","legend","label","button","output","video","audio","canvas",
]);

const VOID_TAGS = new Set([
  "area","base","br","col","embed","hr","img","input","link","meta","param",
  "source","track","wbr","command","keygen","menuitem",
]);

function extractTagName(tag: string): string | null {
  const m = tag.match(/^<\/?([a-zA-Z0-9]+)/);
  return m ? m[1].toLowerCase() : null;
}

function tokenizeHTML(html: string): string[] {
  const tokens: string[] = [];
  const re = /<[^>]*>/g;
  let last = 0, match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    if (match.index > last) tokens.push(html.slice(last, match.index));
    tokens.push(match[0]);
    last = match.index + match[0].length;
  }
  if (last < html.length) tokens.push(html.slice(last));
  return tokens;
}

function formatHTML(html: string): string {
  const preserved: [string, string][] = [];
  let pidx = 0;
  const pres = html.replace(/<(pre|code|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi, (m) => {
    const key = `\x00PRESERVE_${pidx}\x00`;
    preserved.push([key, m]);
    pidx++;
    return key;
  });

  const tokens = tokenizeHTML(pres);
  const stack: string[] = [];
  const out: string[] = [];
  const indent = "  ";

  for (const tok of tokens) {
    const isClose = /^<\//.test(tok);
    const isVoid = /\/>$/.test(tok);
    const tagName = extractTagName(tok);

    if (isClose && tagName) {
      const idx = stack.lastIndexOf(tagName);
      if (idx >= 0) stack.splice(idx, 1);
      const level = stack.length;
      out.push(`\n${indent.repeat(level)}${tok}`);
    } else if ((isVoid || (tagName && VOID_TAGS.has(tagName))) && tagName) {
      const level = stack.length;
      out.push(`\n${indent.repeat(level)}${tok}`);
    } else if (tagName && !tok.startsWith("</")) {
      const level = stack.length;
      out.push(`\n${indent.repeat(level)}${tok}`);
      if (BLOCK_TAGS.has(tagName)) stack.push(tagName);
    } else {
      const trimmed = tok.trim();
      if (trimmed) {
        const level = stack.length;
        out.push(`\n${indent.repeat(level)}${trimmed}`);
      }
    }
  }

  let result = out.join("").trim();
  for (const [key, val] of preserved) {
    result = result.replace(key, val);
  }
  return result;
}

function minifyHTML(html: string): string {
  const preserved: [string, string][] = [];
  let pidx = 0;
  const pres = html.replace(/<(pre|code|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi, (m) => {
    const key = `\x00PRESERVE_${pidx}\x00`;
    preserved.push([key, m]);
    pidx++;
    return key;
  });

  let result = pres
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/>\s+/g, ">")
    .replace(/\s+</g, "<")
    .replace(/\s{2,}/g, " ")
    .trim();

  for (const [key, val] of preserved) {
    result = result.replace(key, val);
  }
  return result;
}

const relatedTools = [
  { name: "CSS Beautifier", href: "/developer/css-beautifier", desc: "Format CSS stylesheets" },
  { name: "JS Beautifier", href: "/developer/js-beautifier", desc: "Format JavaScript code" },
  { name: "JSON Formatter", href: "/developer/json-formatter", desc: "Beautify and validate JSON" },
  { name: "XML Formatter", href: "/developer/xml-formatter", desc: "Beautify and format XML" },
  { name: "YAML Formatter", href: "/developer/yaml-formatter", desc: "Beautify YAML data" },
  { name: "SQL Formatter", href: "/developer/sql-formatter", desc: "Format SQL queries" },
  { name: "JSON Validator", href: "/developer/json-validator", desc: "Validate JSON structure" },
  { name: "Markdown to HTML", href: "/developer/markdown-to-html", desc: "Convert Markdown to HTML" },
];

export default function HtmlFormatter() {
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
      const result = m === "format" ? formatHTML(val) : minifyHTML(val);
      setOutput(result);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Error processing HTML");
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
    const blob = new Blob([output], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "format" ? "formatted.html" : "minified.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const lineCount = output ? output.split("\n").length : 0;
  const charCount = output ? output.length : 0;

  return (
    <ToolLayout
      title="HTML Formatter"
      description="Beautify, format, and minify HTML code instantly in your browser."
      category="developer"
      faqContent={[
        { question: "What is an HTML Formatter?", answer: "An HTML Formatter is a tool that takes raw, messy HTML code and reformats it with proper indentation, line breaks, and structure to make it readable and maintainable." },
        { question: "How does the HTML formatting work?", answer: "The tool parses your HTML and identifies block-level tags (div, p, table, etc.), void elements (br, img, input), and text content. It then rebuilds the HTML with consistent indentation based on nesting depth." },
        { question: "What HTML tags affect indentation?", answer: "Block-level tags like div, p, h1-h6, ul, ol, li, table, section, article, nav, header, footer, form, and others cause indentation changes. Inline tags like span, a, strong, em do not change the indent level." },
        { question: "Does the formatter handle self-closing tags?", answer: "Yes, void elements (br, hr, img, input, meta, link, etc.) and self-closing tags (/>) are automatically detected and rendered without affecting the indentation stack." },
        { question: "Can I minify HTML with this tool?", answer: "Yes. Toggle to Minify mode to strip all unnecessary whitespace, remove HTML comments, and compress your HTML into a compact string ideal for production deployment." },
        { question: "Does it preserve content inside pre, code, or textarea tags?", answer: "Yes. The tool intelligently preserves the exact content inside pre, code, and textarea tags so that whitespace-sensitive content like code snippets remain intact during formatting and minification." },
        { question: "What happens if my HTML has errors?", answer: "The tool will still attempt to format the HTML as best as possible. If there are unclosed tags or structural issues, the formatting may produce unexpected results. You should validate your HTML separately." },
        { question: "Can I download the formatted HTML?", answer: "Yes. Click the Download button to save the formatted or minified HTML as a .html file. You can also copy the output to your clipboard with the Copy button." },
        { question: "What is the difference between Format and Minify?", answer: "Format adds proper indentation and line breaks for readability. Minify removes all extra whitespace and comments to reduce file size for faster loading in production." },
        { question: "Is my HTML data sent to a server?", answer: "No. All processing happens entirely in your browser using client-side JavaScript. Your HTML code never leaves your computer, ensuring complete privacy and security." },
      ]}
      explanationContent={
        <div className="space-y-8">
          <section>
            <h2>What Is HTML Formatter?</h2>
            <p>HTML Formatter (also called HTML Beautifier or HTML Pretty Printer) is a developer tool that automatically formats raw HTML code into a clean, well-indented, and readable structure. It transforms minified or messy HTML markup into organized code that is easy to read, edit, and debug.</p>
            <p>Whether you are working with generated HTML from a CMS, scraping web pages, or dealing with legacy code, an HTML formatter saves time by instantly cleaning up the markup and making it human-readable.</p>
          </section>
          <section>
            <h2>How It Works</h2>
            <p>The HTML Formatter uses a tag-aware indentation algorithm. It tokenizes the HTML string into tags and text content, then processes each token sequentially:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Block-level opening tags push the indentation level deeper</li>
              <li>Closing tags pop the indentation stack and decrease the indent</li>
              <li>Self-closing and void tags are placed at the current indent level</li>
              <li>Text content is trimmed and placed at the current indent level</li>
              <li>Content inside pre, code, and textarea tags is preserved exactly as-is</li>
            </ol>
            <p>In Minify mode, the tool removes all unnecessary whitespace between tags, strips HTML comments, and produces the most compact representation possible.</p>
          </section>
          <section>
            <h2>Features</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>One-click formatting with proper tag-based indentation</li>
              <li>Minification mode for production-ready compact HTML</li>
              <li>Preservation of whitespace-sensitive tags (pre, code, textarea)</li>
              <li>Support for all HTML5 elements including semantic tags</li>
              <li>Handles void elements, self-closing tags, and custom elements</li>
              <li>Auto-format on input with 300ms debounce</li>
              <li>Copy to clipboard and download as .html file</li>
              <li>Line count and character count statistics</li>
            </ul>
          </section>
          <section>
            <h2>Use Cases</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Cleaning up HTML output from WYSIWYG editors and CMS platforms</li>
              <li>Formatting HTML emails for better readability during development</li>
              <li>Beautifying scraped HTML from web pages for analysis</li>
              <li>Preparing HTML code for code review and collaboration</li>
              <li>Minifying HTML templates before production deployment</li>
              <li>Teaching HTML structure to students with formatted examples</li>
            </ul>
          </section>
          <section>
            <h2>Examples</h2>
            <p><strong>Input (minified):</strong></p>
            <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">{'<div><p>Hello</p><ul><li>Item 1</li><li>Item 2</li></ul></div>'}</pre>
            <p className="mt-2"><strong>Output (formatted):</strong></p>
            <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">{`<div>
  <p>Hello</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
</div>`}</pre>
          </section>
          <section>
            <h2>Tips for Better HTML</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Always use consistent indentation (2 spaces is standard for HTML)</li>
              <li>Keep lines under 120 characters for better readability</li>
              <li>Close all tags properly - unclosed tags can cause layout issues</li>
              <li>Use semantic HTML5 elements (nav, main, section, article) for accessibility</li>
              <li>Run your formatted HTML through a validator to catch errors</li>
            </ul>
          </section>
          <section>
            <h2>Common Mistakes</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Mixing tabs and spaces for indentation - stick to one style</li>
              <li>Forgetting to close void tags in XHTML (use &lt;br /&gt; instead of &lt;br&gt;)</li>
              <li>Not preserving whitespace inside pre and code tags</li>
              <li>Over-nesting div elements instead of using semantic tags</li>
              <li>Omitting alt attributes on img tags</li>
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
            <label className="text-sm font-medium">Input HTML</label>
            <button onClick={clearInput} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="<div>&#10;  <p>Enter your HTML here...</p>&#10;</div>"
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
              placeholder="Formatted HTML will appear here"
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
