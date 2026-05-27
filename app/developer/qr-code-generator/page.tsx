"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { Copy, Check, Download, RotateCw } from "lucide-react";

interface QRCodeModule {
  toCanvas: (
    canvas: HTMLCanvasElement,
    text: string,
    opts?: {
      width?: number;
      margin?: number;
      color?: { dark?: string; light?: string };
      errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    }
  ) => Promise<void>;
  toDataURL: (
    text: string,
    opts?: {
      width?: number;
      margin?: number;
      color?: { dark?: string; light?: string };
      errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    }
  ) => Promise<string>;
}

let QRCode: QRCodeModule | null = null;

async function loadQRCode(): Promise<QRCodeModule> {
  if (QRCode) return QRCode;
  try {
    const mod = await import("qrcode");
    QRCode = mod.default as unknown as QRCodeModule;
    return QRCode;
  } catch {
    throw new Error("QRCode library failed to load");
  }
}

export default function QRCodeGenerator() {
  const [input, setInput] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState(256);
  const [ecc, setEcc] = useState<"L" | "M" | "Q" | "H">("M");
  const [copiedDataUrl, setCopiedDataUrl] = useState(false);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrLoadedRef = useRef(false);

  const generate = useCallback(async () => {
    if (!input.trim()) {
      setQrDataUrl(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (!qrLoadedRef.current) {
        await loadQRCode();
        qrLoadedRef.current = true;
      }
      const url = await QRCode!.toDataURL(input.trim(), {
        width: size,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
        errorCorrectionLevel: ecc,
      });
      setQrDataUrl(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate QR code");
      setQrDataUrl(null);
    } finally {
      setLoading(false);
    }
  }, [input, size, ecc]);

  useEffect(() => {
    if (input.trim()) {
      const timer = setTimeout(() => generate(), 300);
      return () => clearTimeout(timer);
    }
  }, [input, size, ecc, generate]);

  const download = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `qrcode-${Date.now()}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const copyDataUrl = async () => {
    if (!qrDataUrl) return;
    try {
      await navigator.clipboard.writeText(qrDataUrl);
      setCopiedDataUrl(true);
      setTimeout(() => setCopiedDataUrl(false), 2000);
    } catch {
      // clipboard API not available
    }
  };

  return (
    <ToolLayout
      title="QR Code Generator"
      description="Generate QR codes from text, URLs, and any other data. Customize size, error correction, and download as PNG."
      category="developer"
      faqContent={[
        {
          question: "What is a QR Code?",
          answer:
            "A QR Code (Quick Response Code) is a two-dimensional barcode that can store data such as URLs, text, contact information, and more. It can be scanned using smartphone cameras and QR readers.",
        },
        {
          question: "How much data can a QR Code store?",
          answer:
            "A QR Code can store up to 7,089 numeric characters, 4,296 alphanumeric characters, or 2,953 bytes of binary data. The exact capacity depends on the version and error correction level.",
        },
        {
          question: "What do the error correction levels mean?",
          answer:
            "L (Low) recovers 7% of data, M (Medium) recovers 15%, Q (Quartile) recovers 25%, and H (High) recovers 30%. Higher levels allow scanning even if the code is damaged or partially obscured.",
        },
        {
          question: "What size should I use for my QR Code?",
          answer:
            "The minimum size depends on the scanning distance. For printed materials, 2-3 cm is typical. For digital display, 128-256 pixels is usually sufficient. Higher resolution ensures better scanning.",
        },
        {
          question: "Can I scan QR Codes from images?",
          answer:
            "This tool generates QR codes. To scan QR codes from images, you need a QR reader app on your smartphone or a browser extension that supports QR scanning.",
        },
        {
          question: "What can I encode in a QR Code?",
          answer:
            "You can encode URLs, plain text, email addresses, phone numbers, SMS messages, Wi-Fi credentials, vCard contacts, calendar events, and geographic locations.",
        },
        {
          question: "Are QR Codes free to use?",
          answer:
            "Yes, QR Codes are an open standard and are free to generate and use. There are no licensing fees or restrictions on creating or scanning QR codes.",
        },
        {
          question: "How do I download the QR Code?",
          answer:
            "Click the 'Download PNG' button below the generated QR code to save it as a PNG image. The image is generated at the size you selected.",
        },
        {
          question: "Why is my QR Code not scanning?",
          answer:
            "Common issues include: low contrast between dark and light modules, insufficient size, wrong error correction level, or damaged code. Ensure the code is large enough with good contrast.",
        },
        {
          question: "What is the difference between static and dynamic QR Codes?",
          answer:
            "Static QR codes encode data directly and cannot be changed. Dynamic QR codes use a short URL that redirects to your content, allowing you to update the destination without changing the code.",
        },
      ]}
      explanationContent={
        <div className="prose prose-slate max-w-none space-y-6">
          <h2>What is a QR Code?</h2>
          <p>
            A QR Code (Quick Response Code) is a type of matrix barcode first
            designed in 1994 by Denso Wave, a subsidiary of Toyota. It
            consists of black squares arranged on a white background that can
            be read by camera-equipped devices such as smartphones.
          </p>

          <h3>How QR Codes Work</h3>
          <p>
            QR codes encode data using four standardized encoding modes:
            numeric, alphanumeric, byte/binary, and Kanji. The encoded data is
            structured with error correction keys, position detection patterns,
            timing patterns, and alignment patterns to ensure reliable
            scanning.
          </p>

          <h3>Error Correction Levels</h3>
          <p>
            QR codes include Reed-Solomon error correction, which allows
            successful scanning even when the code is partially damaged or
            obscured:
          </p>
          <ul>
            <li>
              <strong>L (Low):</strong> Recovers 7% of data. Best for
              controlled environments.
            </li>
            <li>
              <strong>M (Medium):</strong> Recovers 15% of data. Good balance
              for general use.
            </li>
            <li>
              <strong>Q (Quartile):</strong> Recovers 25% of data. Suitable
              for harsher environments.
            </li>
            <li>
              <strong>H (High):</strong> Recovers 30% of data. Best for codes
              that may be damaged or covered.
            </li>
          </ul>

          <h3>QR Code Structure</h3>
          <p>
            A QR code contains several structural elements: finder patterns
            (the three large squares in corners), timing patterns (alternating
            dark/light modules), alignment patterns (smaller squares), and the
            data area (the remaining modules containing encoded data and error
            correction).
          </p>

          <h3>Common Applications</h3>
          <ul>
            <li>
              <strong>URL Linking:</strong> Direct users to websites or app
              download pages
            </li>
            <li>
              <strong>Contact Sharing:</strong> Encode vCard data for quick
              contact saving
            </li>
            <li>
              <strong>Wi-Fi Configuration:</strong> Share Wi-Fi credentials
              without typing passwords
            </li>
            <li>
              <strong>Payment Systems:</strong> Enable mobile payments and
              transactions
            </li>
            <li>
              <strong>Product Authentication:</strong> Verify product
              authenticity and track inventory
            </li>
          </ul>

          <h3>Best Practices for QR Code Design</h3>
          <ul>
            <li>
              Ensure sufficient contrast between modules (dark on light
              background)
            </li>
            <li>
              Include a quiet zone (white border) of at least 4 modules wide
            </li>
            <li>
              Test the code with multiple scanning apps before printing
            </li>
            <li>
              Consider adding a logo in the center (using high error
              correction)
            </li>
            <li>
              Use a URL shortener to reduce the amount of encoded data
            </li>
          </ul>

          <h3>QR Code Versions</h3>
          <p>
            QR codes range from Version 1 (21x21 modules) to Version 40
            (177x177 modules). Each higher version adds 4 modules per side and
            increases data capacity. The generator automatically selects the
            appropriate version based on your input data and error correction
            level.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <label
            className="block text-sm font-medium mb-2"
            htmlFor="qr-input"
          >
            Text or URL to encode
          </label>
          <textarea
            id="qr-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text or URL..."
            className="w-full h-24 p-3 font-mono text-sm bg-white border border-border rounded-lg outline-none resize-none"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="qr-size"
            >
              Size: {size}px
            </label>
            <input
              id="qr-size"
              type="range"
              min={128}
              max={512}
              step={16}
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value))}
              className="w-32"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="qr-ecc"
            >
              Error Correction
            </label>
            <select
              id="qr-ecc"
              value={ecc}
              onChange={(e) =>
                setEcc(e.target.value as "L" | "M" | "Q" | "H")
              }
              className="p-2 bg-white border border-border rounded-lg text-sm"
            >
              <option value="L">L (Low 7%)</option>
              <option value="M">M (Medium 15%)</option>
              <option value="Q">Q (Quartile 25%)</option>
              <option value="H">H (High 30%)</option>
            </select>
          </div>
          <button
            onClick={generate}
            disabled={!input.trim() || loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        {qrDataUrl && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                style={{ display: "none" }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="Generated QR Code"
                className="border border-border rounded-lg"
                style={{ width: size, height: size, maxWidth: "100%" }}
              />
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={download}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </button>
              <button
                onClick={copyDataUrl}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                {copiedDataUrl ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copiedDataUrl ? "Copied!" : "Copy Data URL"}
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
