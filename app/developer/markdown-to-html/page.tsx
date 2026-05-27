"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { Copy, Check, AlertCircle, Download, Trash2, Eye, Code } from "lucide-react";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseInline(text: string): string {
  let result = escapeHtml(text);
  result = result.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  result = result.replace(/~~(.+?)~~/g, "<del>$1</del>");
  result = result.replace(/`([^`]+)`/g, "<code>$1</code>");
  result = result.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" style="max-width:100%" />'
  );
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  return result;
}

function markdownToHTML(md: string): string {
  const lines = md.split("\n");
  const html: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = "";
  let inList: "ul" | "ol" | null = null;

  const closeList = () => {
    if (inList === "ul") { html.push("</ul>"); inList = null; }
    else if (inList === "ol") { html.push("</ol>"); inList = null; }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        const lang = codeBlockLang ? ` class="language-${escapeHtml(codeBlockLang)}"` : "";
        html.push(`<pre><code${lang}>${escapeHtml(codeBlockContent.join("\n"))}</code></pre>\n`);
        codeBlockContent = [];
        codeBlockLang = "";
        inCodeBlock = false;
      } else {
        closeList();
        codeBlockLang = line.slice(3).trim();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      html.push("\n");
      continue;
    }

    if (trimmed.startsWith("---") || trimmed.startsWith("***")) {
      closeList();
      html.push("<hr />\n");
      continue;
    }

    if (trimmed.startsWith("###### ")) {
      closeList();
      html.push(`<h6>${parseInline(trimmed.slice(7))}</h6>\n`);
      continue;
    }
    if (trimmed.startsWith("##### ")) {
      closeList();
      html.push(`<h5>${parseInline(trimmed.slice(6))}</h5>\n`);
      continue;
    }
    if (trimmed.startsWith("#### ")) {
      closeList();
      html.push(`<h4>${parseInline(trimmed.slice(5))}</h4>\n`);
      continue;
    }
    if (trimmed.startsWith("### ")) {
      closeList();
      html.push(`<h3>${parseInline(trimmed.slice(4))}</h3>\n`);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      closeList();
      html.push(`<h2>${parseInline(trimmed.slice(3))}</h2>\n`);
      continue;
    }
    if (trimmed.startsWith("# ")) {
      closeList();
      html.push(`<h1>${parseInline(trimmed.slice(2))}</h1>\n`);
      continue;
    }

    if (trimmed.startsWith("> ")) {
      closeList();
      const quoteContent = parseInline(trimmed.slice(2));
      html.push(`<blockquote><p>${quoteContent}</p></blockquote>\n`);
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (inList !== "ul") { closeList(); inList = "ul"; html.push("<ul>\n"); }
      html.push(`  <li>${parseInline(trimmed.slice(2))}</li>\n`);
      continue;
    }

    if (/^\d+[.)]\s/.test(trimmed)) {
      if (inList !== "ol") { closeList(); inList = "ol"; html.push("<ol>\n"); }
      const content = trimmed.replace(/^\d+[.)]\s/, "");
      html.push(`  <li>${parseInline(content)}</li>\n`);
      continue;
    }

    closeList();
    html.push(`<p>${parseInline(trimmed)}</p>\n`);
  }

  closeList();
  if (inCodeBlock) {
    const lang = codeBlockLang ? ` class="language-${escapeHtml(codeBlockLang)}"` : "";
    html.push(`<pre><code${lang}>${escapeHtml(codeBlockContent.join("\n"))}</code></pre>\n`);
  }

  return html.join("");
}

export default function MarkdownToHTML() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "source">("preview");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const convert = useCallback((val: string) => {
    try {
      if (!val.trim()) {
        setOutput("");
        setError(null);
        return;
      }
      const html = markdownToHTML(val);
      setOutput(html);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Conversion failed";
      setError(msg);
      setOutput("");
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

  const downloadHTML = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputLines = input ? input.split("\n").length : 0;
  const outputChars = output.length;

  return (
    <ToolLayout
      title="Markdown to HTML"
      description="Convert Markdown to HTML with live preview. Supports headers, lists, code blocks, links, and more."
      category="developer"
      faqContent={[
        { question: "What is Markdown to HTML conversion?", answer: "Markdown to HTML conversion transforms plain Markdown text into structured HTML markup for web publishing." },
        { question: "What Markdown syntax is supported?", answer: "Headers (h1-h6), bold, italic, strikethrough, inline code, code blocks, links, images, ordered/unordered lists, blockquotes, and horizontal rules." },
        { question: "How do I use the tool?", answer: "Type or paste Markdown in the input area. The HTML output updates in real-time. Toggle between Preview and Source view to see rendered HTML or raw markup." },
        { question: "Does it support GitHub Flavored Markdown?", answer: "This converter focuses on standard Markdown syntax. Extended GFM features like tables and task lists are not supported." },
        { question: "Can I download the HTML output?", answer: "Yes, click the Download button to save the HTML output as a .html file for use on your website." },
        { question: "How are code blocks handled?", answer: "Triple backtick code blocks are rendered as &lt;pre&gt;&lt;code&gt; elements. The language identifier (if provided) is added as a CSS class." },
        { question: "Are images and links rendered?", answer: "Yes. Images use the &lt;img&gt; tag with alt text. Links open in a new tab with proper security attributes." },
        { question: "Is the HTML output sanitized?", answer: "The HTML is generated from your Markdown input. Inline HTML in the Markdown is escaped for security." },
        { question: "What if my Markdown has syntax errors?", answer: "The parser is forgiving and will produce reasonable output for most input. Preview the result and adjust your Markdown if needed." },
        { question: "Is my data sent to a server?", answer: "No, all processing is done in your browser. Your Markdown stays private." },
      ]}
      explanationContent={
        <div>
          <h2>About Markdown to HTML Conversion</h2>
          <p>Markdown is a lightweight markup language that converts to clean HTML. This tool helps you write content in Markdown and see the HTML output instantly.</p>

          <h3>What is Markdown?</h3>
          <p>Markdown is a plain text formatting syntax designed to be readable as-is while also converting to HTML. It is used extensively on GitHub, in documentation, and in static site generators.</p>

          <h3>Why Convert Markdown to HTML?</h3>
          <p>Websites and applications require HTML for rendering. Converting Markdown to HTML allows you to write content in a human-friendly format while publishing it as web-ready code.</p>

          <h3>Headers</h3>
          <p>Use 1-6 hash symbols for headers: # h1, ## h2, ### h3, etc. Each header maps to the corresponding &lt;h1&gt; through &lt;h6&gt; HTML element.</p>

          <h3>Text Formatting</h3>
          <p>Bold uses **double asterisks**, italic uses *single asterisks*, strikethrough uses ~~double tildes~~, and inline code uses `backticks`. All are converted to their semantic HTML equivalents.</p>

          <h3>Links and Images</h3>
          <p>Links use [text](url) syntax and render as &lt;a&gt; tags. Images use ![alt](url) and render as &lt;img&gt; tags. Both open in new tabs by default.</p>

          <h3>Lists and Code Blocks</h3>
          <p>Unordered lists use - or *, ordered lists use numbers. Code blocks use triple backticks ``` with optional language identifiers for syntax highlighting classes.</p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Input Markdown</label>
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
              placeholder="# Hello World\n\nThis is **bold** and *italic* text."
              className="w-full h-96 p-4 font-mono text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none"
              spellCheck={false}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">HTML Output</label>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => setViewMode("preview")}
                    className={`px-3 py-1 text-xs flex items-center gap-1 ${
                      viewMode === "preview"
                        ? "bg-primary text-primary-foreground"
                        : "bg-white text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </button>
                  <button
                    onClick={() => setViewMode("source")}
                    className={`px-3 py-1 text-xs flex items-center gap-1 ${
                      viewMode === "source"
                        ? "bg-primary text-primary-foreground"
                        : "bg-white text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Code className="w-3 h-3" />
                    Source
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {output && (
                  <button
                    onClick={downloadHTML}
                    className="flex items-center text-xs text-muted-foreground hover:text-foreground"
                  >
                    Download
                  </button>
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
            <div className="text-xs text-muted-foreground mb-2">{outputChars} characters</div>

            {error ? (
              <div className="w-full h-96 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                <p className="font-medium">Conversion Error</p>
                <p className="text-sm opacity-80 mt-1 max-w-xs">{error}</p>
              </div>
            ) : viewMode === "source" ? (
              <textarea
                value={output}
                readOnly
                placeholder="HTML output will appear here"
                className="w-full h-96 p-4 font-mono text-sm bg-white border border-border rounded-lg outline-none resize-none"
                spellCheck={false}
              />
            ) : (
              <div
                className="w-full h-96 p-4 bg-white border border-border rounded-lg overflow-auto prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: output || "<p class='text-muted-foreground'>HTML preview will appear here</p>" }}
              />
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
