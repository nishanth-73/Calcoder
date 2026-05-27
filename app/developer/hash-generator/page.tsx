"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { Copy, Check, Upload } from "lucide-react";

function md5(input: string): string {
  function rotateLeft(x: number, n: number) {
    return ((x << n) | (x >>> (32 - n))) >>> 0;
  }

  function toHex(bytes: number[]): string {
    return bytes
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  const K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf,
    0x4787c62a, 0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af,
    0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e,
    0x49b40821, 0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
    0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8, 0x21e1cde6,
    0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8,
    0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122,
    0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039,
    0xe6db99e5, 0x1fa27cf8, 0xc4ac5665, 0xf4292244, 0x432aff97,
    0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d,
    0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ];

  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  const encoder = new TextEncoder();
  const bytes = Array.from(encoder.encode(input));
  const origLenBits = bytes.length * 8;

  bytes.push(0x80);
  while ((bytes.length * 8) % 512 !== 448) {
    bytes.push(0x00);
  }

  for (let i = 0; i < 8; i++) {
    bytes.push((origLenBits >>> (i * 8)) & 0xff);
  }

  const chunks: number[][] = [];
  for (let i = 0; i < bytes.length; i += 64) {
    chunks.push(bytes.slice(i, i + 64));
  }

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (const chunk of chunks) {
    const M: number[] = [];
    for (let i = 0; i < 16; i++) {
      M[i] =
        chunk[i * 4] |
        (chunk[i * 4 + 1] << 8) |
        (chunk[i * 4 + 2] << 16) |
        (chunk[i * 4 + 3] << 24);
    }

    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;

    for (let i = 0; i < 64; i++) {
      let F: number;
      let g: number;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }

      F = (F + A + K[i] + M[g]) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + rotateLeft(F, S[i])) >>> 0;
    }

    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  const result = new Uint8Array(16);
  for (let i = 0; i < 4; i++) {
    result[i] = (a0 >>> (i * 8)) & 0xff;
    result[i + 4] = (b0 >>> (i * 8)) & 0xff;
    result[i + 8] = (c0 >>> (i * 8)) & 0xff;
    result[i + 12] = (d0 >>> (i * 8)) & 0xff;
  }

  return toHex(Array.from(result));
}

async function shaHash(
  algorithm: string,
  input: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const ALGORITHMS = [
  { key: "md5", label: "MD5", color: "text-red-600" },
  { key: "sha1", label: "SHA-1", color: "text-orange-600" },
  { key: "sha256", label: "SHA-256", color: "text-yellow-600" },
  { key: "sha384", label: "SHA-384", color: "text-blue-600" },
  { key: "sha512", label: "SHA-512", color: "text-purple-600" },
] as const;

type HashResults = Record<string, string>;

export default function HashGenerator() {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<HashResults>({});
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [compareInput, setCompareInput] = useState("");
  const [compareResult, setCompareResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const computeHashes = useCallback(async (text: string) => {
    if (!text) {
      setHashes({});
      setCompareResult(null);
      return;
    }
    setLoading(true);
    try {
      const results: HashResults = {};
      results.md5 = md5(text);
      results.sha1 = await shaHash("SHA-1", text);
      results.sha256 = await shaHash("SHA-256", text);
      results.sha384 = await shaHash("SHA-384", text);
      results.sha512 = await shaHash("SHA-512", text);
      setHashes(results);
    } catch {
      setHashes({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      computeHashes(input);
    }, 300);
    return () => clearTimeout(timer);
  }, [input, computeHashes]);

  const copyHash = async (key: string, hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // clipboard API not available
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInput(text);
    };
    reader.readAsText(file);
  };

  const doCompare = () => {
    if (!compareInput || Object.keys(hashes).length === 0) {
      setCompareResult(null);
      return;
    }
    const matched = Object.entries(hashes).find(
      ([, hash]) => hash === compareInput.trim()
    );
    if (matched) {
      setCompareResult(`Match found: ${matched[0].toUpperCase()}`);
    } else {
      setCompareResult("No matching hash algorithm found");
    }
  };

  return (
    <ToolLayout
      title="Hash Generator"
      description="Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes for any text or file content. Real-time computation with copy-to-clipboard."
      category="developer"
      faqContent={[
        {
          question: "What is a hash function?",
          answer:
            "A hash function is a one-way mathematical algorithm that converts input data of any size into a fixed-length output (hash). It is deterministic - the same input always produces the same hash.",
        },
        {
          question: "What is the difference between MD5 and SHA?",
          answer:
            "MD5 produces 128-bit hashes and is considered cryptographically broken for security purposes. SHA algorithms produce longer hashes (160-512 bits) and are more secure. SHA-256 and above are recommended for security.",
        },
        {
          question: "Is MD5 still safe to use?",
          answer:
            "MD5 is not recommended for security applications due to collision vulnerabilities. However, it is still widely used for checksums, file integrity verification, and non-security applications.",
        },
        {
          question: "What is SHA-256 used for?",
          answer:
            "SHA-256 is widely used in blockchain, SSL/TLS certificates, digital signatures, password hashing, and data integrity verification. It is the current standard for secure hashing.",
        },
        {
          question: "Can hashes be reversed?",
          answer:
            "Hash functions are one-way by design. You cannot reverse a hash to get the original input. However, attackers use rainbow tables and brute force to find inputs that produce matching hashes.",
        },
        {
          question: "What is a hash collision?",
          answer:
            "A hash collision occurs when two different inputs produce the same hash output. MD5 has known collision vulnerabilities. SHA-256 and SHA-512 have no known practical collisions.",
        },
        {
          question: "How is hashing used for password storage?",
          answer:
            "Instead of storing plain-text passwords, systems store the hash of the password. When a user logs in, the input is hashed and compared to the stored hash. Salting adds random data before hashing for extra security.",
        },
        {
          question: "What is the difference between SHA-1 and SHA-256?",
          answer:
            "SHA-1 produces 160-bit hashes and is considered deprecated for security use. SHA-256 produces 256-bit hashes and is the current minimum standard for cryptographic security.",
        },
        {
          question: "Can I hash a file using this tool?",
          answer:
            "Yes. Click the 'Upload File' button to select a text file. The file contents will be read and hashed using all supported algorithms. For binary files, the text content will be extracted.",
        },
        {
          question: "How do I verify a hash?",
          answer:
            "Enter the hash value you want to verify in the 'Compare Hash' field. The tool will check against all generated hashes and tell you which algorithm (if any) produced a matching hash.",
        },
      ]}
      explanationContent={
        <div className="prose prose-slate max-w-none space-y-6">
          <h2>What is a Hash Function?</h2>
          <p>
            A cryptographic hash function is a mathematical algorithm that
            maps data of arbitrary size to a fixed-size string of bytes. The
            output, known as the hash value or digest, is unique to each
            unique input - a property called determinism.
          </p>

          <h3>Properties of Cryptographic Hash Functions</h3>
          <ul>
            <li>
              <strong>Deterministic:</strong> The same input always produces
              the same hash
            </li>
            <li>
              <strong>Fast Computation:</strong> The hash should be quick to
              compute for any input
            </li>
            <li>
              <strong>Preimage Resistance:</strong> Given a hash, it should be
              infeasible to find the original input
            </li>
            <li>
              <strong>Collision Resistance:</strong> It should be infeasible
              to find two different inputs that produce the same hash
            </li>
            <li>
              <strong>Avalanche Effect:</strong> A small change in input
              produces a completely different hash
            </li>
          </ul>

          <h3>Supported Hash Algorithms</h3>
          <ul>
            <li>
              <strong>MD5 (128-bit):</strong> Fast but broken for security.
              Use only for checksums and non-security applications.
            </li>
            <li>
              <strong>SHA-1 (160-bit):</strong> Deprecated for security.
              Replaced by SHA-256 in most applications.
            </li>
            <li>
              <strong>SHA-256 (256-bit):</strong> Current standard for secure
              hashing. Used in blockchain, certificates, and security.
            </li>
            <li>
              <strong>SHA-384 (384-bit):</strong> Stronger version of SHA-2
              with a 384-bit output. Used in high-security applications.
            </li>
            <li>
              <strong>SHA-512 (512-bit):</strong> The strongest SHA-2 variant.
              Maximum security with a 512-bit output.
            </li>
          </ul>

          <h3>Common Use Cases</h3>
          <ul>
            <li>
              <strong>Password Storage:</strong> Store password hashes instead
              of plain-text passwords
            </li>
            <li>
              <strong>File Integrity:</strong> Verify that files have not been
              tampered with using checksums
            </li>
            <li>
              <strong>Digital Signatures:</strong> Sign document hashes for
              authenticity verification
            </li>
            <li>
              <strong>Data Deduplication:</strong> Identify duplicate data by
              comparing hashes
            </li>
            <li>
              <strong>Version Control:</strong> Git uses SHA-1 hashes to
              identify commits and objects
            </li>
          </ul>

          <h3>Hash Verification with Compare</h3>
          <p>
            The Hash Generator includes a compare feature that lets you paste
            an existing hash value and check which algorithm produced it. This
            is useful for verifying file checksums or identifying the hash
            algorithm used by a system.
          </p>

          <h3>File Hashing</h3>
          <p>
            You can upload text files to generate hashes of their contents.
            This is useful for verifying file integrity after download or
            checking if files have been modified. The tool reads the file as
            text and hashes the content using all supported algorithms.
          </p>

          <h3>Why Multiple Algorithms?</h3>
          <p>
            Different applications and standards use different hash
            algorithms. By supporting MD5, SHA-1, SHA-256, SHA-384, and
            SHA-512, the Hash Generator can work with legacy systems,
            current applications, and future-proof high-security requirements.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium" htmlFor="hash-input">
              Input Text
            </label>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Upload className="w-3 h-3" />
              Upload File
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.json,.csv,.xml,.html,.js,.ts,.css,.sql,.yaml,.yml,.env,.cfg,.ini"
            onChange={handleFileUpload}
            className="hidden"
          />
          <textarea
            id="hash-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text to hash..."
            className="w-full h-32 p-3 font-mono text-sm bg-white border border-border rounded-lg outline-none resize-none"
            spellCheck={false}
          />
        </div>

        {loading && (
          <div className="text-sm text-muted-foreground animate-pulse">
            Computing hashes...
          </div>
        )}

        {!loading && Object.keys(hashes).length > 0 && (
          <div className="space-y-3">
            {ALGORITHMS.map(({ key, label, color }) => {
              const hash = hashes[key];
              if (!hash) return null;
              return (
                <div
                  key={key}
                  className="flex items-start gap-2 p-3 bg-white border border-border rounded-lg"
                >
                  <span
                    className={`text-xs font-bold mt-0.5 shrink-0 w-16 ${color}`}
                  >
                    {label}
                  </span>
                  <code className="flex-1 font-mono text-xs break-all select-all">
                    {hash}
                  </code>
                  <button
                    onClick={() => copyHash(key, hash)}
                    className="p-1 hover:bg-muted rounded-md transition-colors shrink-0"
                    title={`Copy ${label} hash`}
                  >
                    {copiedKey === key ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !input.trim() && (
          <div className="p-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
            Enter text above to generate hashes
          </div>
        )}

        <div className="border-t border-border pt-6">
          <label
            className="block text-sm font-medium mb-2"
            htmlFor="hash-compare"
          >
            Compare Hash
          </label>
          <div className="flex gap-2">
            <input
              id="hash-compare"
              type="text"
              value={compareInput}
              onChange={(e) => setCompareInput(e.target.value)}
              placeholder="Paste a hash to compare..."
              className="flex-1 p-2 bg-white border border-border rounded-lg text-sm font-mono"
            />
            <button
              onClick={doCompare}
              disabled={
                !compareInput.trim() || Object.keys(hashes).length === 0
              }
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Check
            </button>
          </div>
          {compareResult && (
            <p
              className={`mt-2 text-sm font-medium ${
                compareResult.startsWith("Match")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {compareResult}
            </p>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
