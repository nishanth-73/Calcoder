"use client";

import { useState, useEffect, useRef } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { Copy, Check, AlertCircle, RotateCcw } from "lucide-react";

interface MatchResult {
  text: string;
  index: number;
}

type FlagKey = "g" | "i" | "m" | "s" | "u";

const FLAG_LABELS: Record<FlagKey, string> = {
  g: "global",
  i: "ignore case",
  m: "multiline",
  s: "dotall",
  u: "unicode",
};

const COMMON_PATTERNS = [
  { label: "Email", pattern: "^[\\w.-]+@[\\w.-]+\\.\\w{2,}$" },
  { label: "URL", pattern: "https?:\\/\\/[\\w.-]+(?:\\/[\\w\\/.-]*)*" },
  { label: "Phone (US)", pattern: "^\\+?1?\\d{10}$" },
  { label: "IPv4 Address", pattern: "^(?:\\d{1,3}\\.){3}\\d{1,3}$" },
  { label: "Date (YYYY-MM-DD)", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
  { label: "Time (HH:MM)", pattern: "^\\d{2}:\\d{2}$" },
  { label: "Postal Code (US)", pattern: "^\\d{5}(-\\d{4})?$" },
  { label: "Alpha Only", pattern: "^[A-Za-z]+$" },
  { label: "Alphanumeric", pattern: "^[A-Za-z0-9]+$" },
  { label: "Hex Color", pattern: "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$" },
];

export default function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [testString, setTestString] = useState("");
  const [flags, setFlags] = useState<Record<FlagKey, boolean>>({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
  });
  const [replacement, setReplacement] = useState("");
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [matchCount, setMatchCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [replacedText, setReplacedText] = useState("");

  const getFlagsString = () =>
    (Object.entries(flags) as [FlagKey, boolean][])
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join("");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!pattern.trim()) {
        setMatches([]);
        setMatchCount(0);
        setError(null);
        setReplacedText("");
        return;
      }

      try {
        const flagsStr = getFlagsString();
        const regex = new RegExp(pattern, flagsStr);
        const results: MatchResult[] = [];
        let count = 0;

        if (flagsStr.includes("g")) {
          let match: RegExpExecArray | null;
          while ((match = regex.exec(testString)) !== null) {
            results.push({ text: match[0], index: match.index });
            count++;
            if (match.index === regex.lastIndex) regex.lastIndex++;
          }
        } else {
          const match = regex.exec(testString);
          if (match) {
            results.push({ text: match[0], index: match.index });
            count = 1;
          }
        }

        setMatches(results);
        setMatchCount(count);
        setError(null);

        if (replacement.trim()) {
          const repRegex = new RegExp(pattern, flagsStr);
          setReplacedText(testString.replace(repRegex, replacement));
        } else {
          setReplacedText("");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Invalid regex pattern");
        setMatches([]);
        setMatchCount(0);
        setReplacedText("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [pattern, testString, flags, replacement]);

  const copyMatches = () => {
    const text = matches.map((m) => m.text).join("\n");
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const clearAll = () => {
    setPattern("");
    setTestString("");
    setReplacement("");
    setMatches([]);
    setMatchCount(0);
    setError(null);
    setReplacedText("");
  };

  const toggleFlag = (flag: FlagKey) => {
    setFlags((prev) => ({ ...prev, [flag]: !prev[flag] }));
  };

  const renderHighlighted = () => {
    if (!testString)
      return <span className="text-muted-foreground">No test string entered</span>;
    if (matches.length === 0)
      return <span>{testString}</span>;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((m, i) => {
      if (m.index > lastIndex) {
        parts.push(
          <span key={`t${i}`}>{testString.slice(lastIndex, m.index)}</span>
        );
      }
      parts.push(
        <mark
          key={`m${i}`}
          className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5"
        >
          {m.text}
        </mark>
      );
      lastIndex = m.index + m.text.length;
    });

    if (lastIndex < testString.length) {
      parts.push(<span key="end">{testString.slice(lastIndex)}</span>);
    }

    return parts;
  };

  return (
    <ToolLayout
      title="Regex Tester"
      description="Test regular expressions with live matching, highlighting, and replacement."
      category="developer"
      faqContent={[
        {
          question: "What is a regular expression?",
          answer:
            "A regular expression (regex) is a sequence of characters that defines a search pattern for pattern matching within strings.",
        },
        {
          question: "How do I test a regex pattern?",
          answer:
            "Enter your regex in the Pattern field and your test string below. Matches highlight in real-time with position details.",
        },
        {
          question: "What do the flags (g, i, m, s, u) mean?",
          answer:
            "g = global (find all matches), i = case-insensitive, m = multiline (^ and $ match line boundaries), s = dotall (. matches newlines), u = unicode.",
        },
        {
          question: "How do I use regex groups and captures?",
          answer:
            "Use parentheses () for capturing groups, (?:) for non-capturing, and (?<name>) for named groups.",
        },
        {
          question: "What's the difference between test() and exec()?",
          answer:
            "test() returns true/false; exec() returns match details including index and captured groups.",
        },
        {
          question: "How do I match special characters?",
          answer:
            "Escape special characters like ., *, +, ?, ^, $, {, [, (, |, ) with a backslash.",
        },
        {
          question: "What is a greedy vs lazy match?",
          answer:
            "Greedy (*, +, {}) match as much as possible; lazy (*?, +?, {}?) match as little as possible.",
        },
        {
          question: "How do I validate email with regex?",
          answer:
            "A basic email pattern: ^[\\w.-]+@[\\w.-]+\\.\\w{2,}$",
        },
        {
          question: "Why is my regex not matching?",
          answer:
            "Check for typos, unescaped special characters, flag settings, and whether your pattern anchors properly.",
        },
        {
          question: "What does the 's' (dotall) flag do?",
          answer:
            "The dotall flag makes the '.' character match newline characters as well.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">About Regex Tester</h2>
          <section>
            <h3 className="text-xl font-semibold mb-2">What is a Regular Expression?</h3>
            <p>A regular expression defines a search pattern for matching, validation, text extraction, and string manipulation.</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">Common Use Cases for Regex</h3>
            <p>Regex powers input validation (email, phone, URLs), search-and-replace, log parsing, data extraction, and syntax highlighting.</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">Understanding Regex Flags</h3>
            <p>Flags modify regex behavior: global (g) finds all matches, case-insensitive (i) ignores case, multiline (m) changes anchor behavior, dotall (s) matches newlines with ., unicode (u) enables full Unicode.</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">How to Build a Regex Pattern</h3>
            <p>Start with literals, add metacharacters for flexibility. Use character classes like [0-9]/\d for digits, quantifiers like */+ for repetition, anchors like ^/$ for position.</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">Using Regex for Data Validation</h3>
            <p>Use ^ and $ anchors to ensure the entire string matches, preventing partial match false positives.</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">Regex Performance Tips</h3>
            <p>Avoid catastrophic backtracking by using atomic groups, possessive quantifiers, and non-capturing groups (?:) when captures aren't needed.</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">Common Regex Pitfalls</h3>
            <p>Forgotten escapes, unanchored patterns, greedy when lazy is needed, and missing edge cases in input strings are frequent mistakes.</p>
          </section>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Inputs */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Pattern</label>
              <button
                onClick={clearAll}
                className="flex items-center text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Clear
              </button>
            </div>
            <textarea
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Enter regex pattern..."
              className="w-full h-24 p-4 font-mono text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none"
              spellCheck={false}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Common Patterns</label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  setPattern(e.target.value);
                  e.target.value = "";
                }
              }}
              className="w-full p-2 border border-border rounded-lg text-sm bg-white"
            >
              <option value="">Select a pattern...</option>
              {COMMON_PATTERNS.map((p) => (
                <option key={p.label} value={p.pattern}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Flags</label>
            <div className="flex flex-wrap gap-4">
              {(["g", "i", "m", "s", "u"] as FlagKey[]).map((flag) => (
                <label
                  key={flag}
                  className="flex items-center gap-1.5 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={flags[flag]}
                    onChange={() => toggleFlag(flag)}
                    className="rounded border-border"
                  />
                  <span className="font-mono font-semibold">{flag}</span>
                  <span className="text-xs text-muted-foreground">
                    {FLAG_LABELS[flag]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Test String</label>
            <textarea
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="Enter test string to match against..."
              className="w-full h-32 p-4 font-mono text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none"
              spellCheck={false}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Replacement (optional)
            </label>
            <input
              type="text"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              placeholder="Enter replacement text..."
              className="w-full p-3 font-mono text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
        </div>

        {/* Right: Results */}
        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Invalid Pattern</p>
                <p className="text-sm opacity-80 mt-1">{error}</p>
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">
                Matches ({matchCount})
              </label>
              <button
                onClick={copyMatches}
                disabled={matches.length === 0}
                className="flex items-center text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {copied ? (
                  <Check className="w-3 h-3 mr-1" />
                ) : (
                  <Copy className="w-3 h-3 mr-1" />
                )}
                {copied ? "Copied!" : "Copy Matches"}
              </button>
            </div>

            {matches.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto p-3 bg-muted/30 border border-border rounded-lg">
                {matches.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm font-mono"
                  >
                    <span className="text-muted-foreground shrink-0 w-6">
                      #{i + 1}
                    </span>
                    <span className="bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded truncate max-w-[200px]">
                      {m.text}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      at index {m.index}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              !error && (
                <div className="p-4 border border-border rounded-lg text-sm text-muted-foreground text-center">
                  {pattern
                    ? "No matches found"
                    : "Enter a pattern and test string"}
                </div>
              )
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Highlighted Matches
            </label>
            <div className="w-full min-h-[100px] p-4 font-mono text-sm bg-white border border-border rounded-lg whitespace-pre-wrap break-all">
              {renderHighlighted()}
            </div>
          </div>

          {replacement.trim() && replacedText !== undefined && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Replaced Result
              </label>
              <textarea
                value={replacedText}
                readOnly
                className="w-full h-24 p-4 font-mono text-sm bg-white border border-border rounded-lg outline-none resize-none"
                spellCheck={false}
              />
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
