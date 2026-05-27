"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { Copy, Check, AlertCircle, Clock, Trash2 } from "lucide-react";

interface TimestampResult {
  seconds: string;
  milliseconds: string;
  utc: string;
  local: string;
  iso: string;
  relative: string;
}

function isTimestampInput(val: string): boolean {
  const trimmed = val.trim();
  if (!trimmed) return false;
  if (/^-?\d+$/.test(trimmed)) return true;
  return false;
}

function parseDateInput(val: string): Date | null {
  const trimmed = val.trim();
  if (!trimmed) return null;

  if (isTimestampInput(trimmed)) {
    const num = Number(trimmed);
    if (num > 1e15 || num < -1e15) return null;
    if (num > 9999999999999 || num < -9999999999999) return null;
    if (num > 1e11 || num < -1e11) {
      return new Date(Math.round(num));
    }
    return new Date(Math.round(num * 1000));
  }

  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d;

  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) return new Date(parsed);
  return null;
}

function getRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = date.getTime() - now;
  const abs = Math.abs(diff);
  const seconds = Math.floor(abs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const future = diff > 0;

  const format = (num: number, unit: string) => {
    if (future) return `in ${num} ${unit}${num !== 1 ? "s" : ""}`;
    return `${num} ${unit}${num !== 1 ? "s" : ""} ago`;
  };

  if (abs < 1000) return future ? "now" : "just now";
  if (seconds < 60) return format(seconds, "second");
  if (minutes < 60) return format(minutes, "minute");
  if (hours < 24) return format(hours, "hour");
  if (days < 30) return format(days, "day");
  if (months < 12) return format(months, "month");
  return format(years, "year");
}

function computeResults(val: string): TimestampResult | null {
  const date = parseDateInput(val);
  if (!date || isNaN(date.getTime())) return null;

  const ms = date.getTime();
  const s = Math.floor(ms / 1000);

  return {
    seconds: String(s),
    milliseconds: String(ms),
    utc: date.toUTCString(),
    local: date.toString(),
    iso: date.toISOString(),
    relative: getRelativeTime(date),
  };
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between py-2.5 px-4 bg-white border border-border rounded-lg hover:border-primary/30 transition-colors">
      <div className="min-w-0 flex-1">
        <span className="text-xs font-medium text-muted-foreground block mb-0.5">{label}</span>
        <span className="text-sm font-mono text-foreground break-all">{value}</span>
      </div>
      <button
        onClick={copy}
        className="ml-3 shrink-0 flex items-center text-xs text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

export default function UnixTimestampConverter() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<TimestampResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const convert = useCallback((val: string) => {
    if (!val.trim()) {
      setResults(null);
      setError(null);
      return;
    }
    const res = computeResults(val);
    if (!res) {
      setResults(null);
      setError("Invalid date or timestamp. Try a Unix timestamp (e.g., 1700000000) or a date string (e.g., 2024-01-15 or Jan 15, 2024).");
      return;
    }
    setResults(res);
    setError(null);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => convert(input), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, convert]);

  const insertNow = () => {
    setInput(String(Math.floor(Date.now() / 1000)));
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <ToolLayout
      title="Unix Timestamp Converter"
      description="Convert between Unix timestamps and human-readable dates. Supports seconds, milliseconds, and various date formats."
      category="developer"
      faqContent={[
        { question: "What is a Unix timestamp?", answer: "A Unix timestamp is the number of seconds (or milliseconds) that have elapsed since January 1, 1970 (UTC), excluding leap seconds." },
        { question: "How do I use the converter?", answer: "Enter a Unix timestamp (e.g., 1700000000) or a date string (e.g., '2024-01-15' or 'Jan 15, 2024'). All equivalent formats update in real-time." },
        { question: "Does it handle seconds and milliseconds?", answer: "Yes. The tool auto-detects whether the input is in seconds or milliseconds. Values over 10^11 are treated as milliseconds." },
        { question: "What date formats are supported?", answer: "ISO 8601 (2024-01-15), US format (Jan 15, 2024), RFC 2822 (15 Jan 2024), and many others. Any valid Date.parse() input works." },
        { question: "Does it handle negative timestamps (before 1970)?", answer: "Yes, negative timestamps for dates before January 1, 1970 are fully supported." },
        { question: "What about the Year 2038 problem?", answer: "The tool uses JavaScript dates which handle timestamps beyond 2038 using 64-bit floats internally, avoiding the 32-bit integer overflow issue." },
        { question: "How does relative time work?", answer: "Relative time shows how long ago or in the future the date is, e.g., '3 hours ago' or 'in 2 days'. It updates based on your current time." },
        { question: "Can I copy individual values?", answer: "Yes, each result field has a copy button for copying that specific value to your clipboard." },
        { question: "What is the 'Now' button?", answer: "The 'Now' button inserts the current Unix timestamp (in seconds) into the input, converting the current time to all formats." },
        { question: "Is my data sent to a server?", answer: "No, all conversions happen client-side in your browser. Your timestamps remain private." },
      ]}
      explanationContent={
        <div>
          <h2>About Unix Timestamp Conversion</h2>
          <p>Unix timestamps are the universal language of time in computing. This converter helps you translate between machine-readable timestamps and human-readable dates.</p>

          <h3>What is a Unix Timestamp?</h3>
          <p>The Unix epoch is January 1, 1970 00:00:00 UTC. A Unix timestamp counts the number of seconds (or milliseconds) since that moment. It is the standard time representation used by Linux, macOS, and most programming languages.</p>

          <h3>Seconds vs Milliseconds</h3>
          <p>Many systems use seconds (10 digits), while JavaScript and some APIs use milliseconds (13 digits). This tool auto-detects which you have entered. Values greater than 10^11 (100 billion) are treated as milliseconds.</p>

          <h3>Common Use Cases</h3>
          <p>Debugging server logs, reading API responses, converting database timestamps, scheduling with cron, and working with time-series data are all common scenarios requiring timestamp conversion.</p>

          <h3>Supported Input Formats</h3>
          <p>The tool accepts numeric timestamps (seconds or milliseconds) and date strings compatible with JavaScript Date parsing: ISO 8601, RFC 2822, US date format, and many natural language expressions.</p>

          <h3>Multiple Output Formats</h3>
          <p>Each conversion shows the Unix timestamp in seconds and milliseconds, UTC string, local time string, ISO 8601 format, and human-readable relative time for easy comprehension.</p>

          <h3>Edge Cases</h3>
          <p>Negative timestamps represent dates before 1970. The Year 2038 problem is avoided through JavaScript&apos;s 64-bit number support. Very old dates (year 1 to 1970) and far-future dates are handled gracefully.</p>

          <h3>Time Zone Handling</h3>
          <p>All conversions are based on the epoch definition (UTC). The UTC and ISO outputs are timezone-independent, while the local output reflects your browser&apos;s timezone settings.</p>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Enter Timestamp or Date</label>
            <div className="flex items-center gap-3">
              <button
                onClick={insertNow}
                className="flex items-center text-xs text-muted-foreground hover:text-foreground"
              >
                <Clock className="w-3 h-3 mr-1" />
                Now
              </button>
              <button
                onClick={() => { setInput(""); setResults(null); setError(null); }}
                className="flex items-center text-xs text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear
              </button>
            </div>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="1700000000 or 2024-01-15 or Jan 15, 2024"
            className="w-full p-4 font-mono text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>

        {error ? (
          <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex flex-col items-center justify-center text-center py-8">
            <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
            <p className="font-medium">Invalid Input</p>
            <p className="text-sm opacity-80 mt-1 max-w-md">{error}</p>
          </div>
        ) : results ? (
          <div className="space-y-2">
            <CopyField label="Unix Timestamp (seconds)" value={results.seconds} />
            <CopyField label="Unix Timestamp (milliseconds)" value={results.milliseconds} />
            <CopyField label="UTC Date String" value={results.utc} />
            <CopyField label="Local Date String" value={results.local} />
            <CopyField label="ISO 8601" value={results.iso} />
            <CopyField label="Relative Time" value={results.relative} />
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-lg">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Enter a timestamp or date to see all conversions</p>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
