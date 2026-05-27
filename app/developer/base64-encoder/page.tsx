"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { Copy, Check, AlertCircle, Trash2, ArrowLeftRight } from "lucide-react";

function encodeBase64(text: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decodeBase64(encoded: string): string {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decoder = new TextDecoder("utf-8", { fatal: true });
  return decoder.decode(bytes);
}

export default function Base64EncoderDecoder() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const convert = useCallback(
    (val: string) => {
      if (!val.trim()) {
        setOutput("");
        setError(null);
        return;
      }
      try {
        if (mode === "encode") {
          setOutput(encodeBase64(val));
        } else {
          setOutput(decodeBase64(val));
        }
        setError(null);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : mode === "decode"
            ? "Invalid Base64 input"
            : "Encoding failed";
        setError(msg);
        setOutput("");
      }
    },
    [mode]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => convert(input), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, convert]);

  const toggleMode = () => {
    setMode((m) => (m === "encode" ? "decode" : "encode"));
    setInput("");
    setOutput("");
    setError(null);
  };

  const copyToClipboard = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      setInput(btoa(binary));
      setMode("decode");
    };
    reader.readAsArrayBuffer(file);
  };

  const inputChars = input.length;
  const outputChars = output.length;

  return (
    <ToolLayout
      title="Base64 Encoder/Decoder"
      description="Encode text to Base64 or decode Base64 back to text. Supports Unicode and UTF-8 with file upload."
      category="developer"
      faqContent={[
        { question: "What is Base64 encoding?", answer: "Base64 is a binary-to-text encoding scheme that represents binary data in an ASCII string format. It is commonly used for data transfer in URLs, email attachments, and web APIs." },
        { question: "How do I encode text to Base64?", answer: "Select the Encode mode, type or paste your text in the input area, and the Base64-encoded output updates in real-time." },
        { question: "How do I decode Base64 to text?", answer: "Select the Decode mode, paste your Base64 string, and the decoded text appears instantly in the output area." },
        { question: "Does it support Unicode and UTF-8?", answer: "Yes. The tool uses TextEncoder/TextDecoder for proper UTF-8 handling, supporting emojis, CJK characters, and all Unicode glyphs." },
        { question: "What happens if I decode invalid Base64?", answer: "The tool shows a clear error message. Invalid characters, incorrect padding, or non-UTF8 data will trigger an error with details." },
        { question: "Can I encode binary files to Base64?", answer: "Yes, click the Upload File button to select a file. Its contents will be Base64-encoded and placed in the decode input for viewing." },
        { question: "What is Base64 used for?", answer: "Base64 is used for embedding images in HTML/CSS, data URIs, JWT tokens, API authentication headers, email attachments (MIME), and storing binary data in JSON." },
        { question: "Is Base64 encryption?", answer: "No, Base64 is an encoding scheme, not encryption. It can be decoded instantly without a key. Do not use it to protect sensitive data." },
        { question: "Why does Base64 output sometimes end with =?", answer: "The = character is padding added to make the Base64 output length a multiple of 4. It is a standard part of the Base64 specification." },
        { question: "Is my data sent to a server?", answer: "No, all encoding and decoding happens locally in your browser. Your data never leaves your machine." },
      ]}
      explanationContent={
        <div>
          <h2>About Base64 Encoding and Decoding</h2>
          <p>Base64 is a fundamental encoding scheme used across the web for safe data transmission and storage.</p>

          <h3>What is Base64?</h3>
          <p>Base64 represents binary data using 64 printable ASCII characters (A-Z, a-z, 0-9, +, /). It encodes 3 bytes of binary data into 4 ASCII characters, increasing size by approximately 33%.</p>

          <h3>Why Use Base64?</h3>
          <p>Base64 ensures binary data remains intact during transport through systems that only support ASCII. It is essential for email attachments (MIME), data URIs in HTML, and JSON web tokens (JWT).</p>

          <h3>Encoding Process</h3>
          <p>Text is converted to UTF-8 bytes via TextEncoder, then each group of 3 bytes is split into 4 six-bit values, mapped to the Base64 alphabet. Padding (=) is added when the input length is not a multiple of 3.</p>

          <h3>Decoding Process</h3>
          <p>Base64 characters are reverse-mapped to six-bit values, combined into bytes, and decoded as UTF-8 text using TextDecoder with strict validation.</p>

          <h3>UTF-8 Support</h3>
          <p>Unlike simple btoa/atob calls that fail on non-Latin characters, this tool properly handles Unicode by using TextEncoder and TextDecoder for complete UTF-8 support.</p>

          <h3>Common Use Cases</h3>
          <p>Embedding images in CSS/HTML as data URIs, encoding JWT payloads, storing binary data in JSON, email attachments with MIME Base64, and API authentication tokens.</p>

          <h3>Security Notes</h3>
          <p>Base64 is encoding, not encryption. Anyone can decode Base64 data without any key. Never use Base64 to protect sensitive or confidential information.</p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Mode:</span>
            <button
              onClick={toggleMode}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" />
              {mode === "encode" ? "Encode" : "Decode"}
            </button>
            <span className="text-sm text-muted-foreground">
              {mode === "encode" ? "Text → Base64" : "Base64 → Text"}
            </span>
          </div>
          <label className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
            />
            Upload File
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">
                {mode === "encode" ? "Input Text" : "Input Base64"}
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{inputChars} chars</span>
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
              placeholder={
                mode === "encode"
                  ? "Enter text to encode..."
                  : "Enter Base64 to decode..."
              }
              className="w-full h-72 p-4 font-mono text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none"
              spellCheck={false}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">
                {mode === "encode" ? "Base64 Output" : "Decoded Text"}
              </label>
              <div className="flex items-center gap-3">
                {output && (
                  <span className="text-xs text-muted-foreground">{outputChars} chars</span>
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
              <div className="w-full h-72 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                <p className="font-medium">
                  {mode === "decode" ? "Invalid Base64" : "Encoding Error"}
                </p>
                <p className="text-sm opacity-80 mt-1 max-w-xs">{error}</p>
              </div>
            ) : (
              <textarea
                value={output}
                readOnly
                placeholder={
                  mode === "encode"
                    ? "Base64 output will appear here"
                    : "Decoded text will appear here"
                }
                className="w-full h-72 p-4 font-mono text-sm bg-white border border-border rounded-lg outline-none resize-none"
                spellCheck={false}
              />
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
