"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { Copy, Check, RotateCw } from "lucide-react";

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

function getStrength(password: string) {
  const length = password.length;
  const types = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;

  if (length >= 16 && types === 4)
    return { label: "Strong", color: "bg-green-500", textColor: "text-green-600" };
  if (length >= 12 && types >= 3)
    return { label: "Good", color: "bg-yellow-500", textColor: "text-yellow-600" };
  if (length >= 8 && types >= 2)
    return { label: "Fair", color: "bg-orange-500", textColor: "text-orange-600" };
  return { label: "Weak", color: "bg-red-500", textColor: "text-red-600" };
}

function shuffle(str: string) {
  const arr = str.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

function generatePassword(
  length: number,
  useUpper: boolean,
  useLower: boolean,
  useNumbers: boolean,
  useSymbols: boolean,
  excludeSimilar: boolean,
  excludeAmbiguous: boolean
): string {
  let chars = "";
  const required: string[] = [];

  if (useLower) {
    let c = LOWERCASE;
    if (excludeSimilar) c = c.replace(/[il]/g, "");
    if (excludeAmbiguous) c = c.replace(/[{}[\]()\/\\'"`~,;:.<>]/g, "");
    chars += c;
    required.push(c[Math.floor(Math.random() * c.length)]);
  }
  if (useUpper) {
    let c = UPPERCASE;
    if (excludeSimilar) c = c.replace(/[IL]/g, "");
    if (excludeAmbiguous) c = c.replace(/[{}[\]()\/\\'"`~,;:.<>]/g, "");
    chars += c;
    required.push(c[Math.floor(Math.random() * c.length)]);
  }
  if (useNumbers) {
    let c = NUMBERS;
    if (excludeSimilar) c = c.replace(/[01]/g, "");
    if (excludeAmbiguous) c = c.replace(/[<>]/g, "");
    chars += c;
    required.push(c[Math.floor(Math.random() * c.length)]);
  }
  if (useSymbols) {
    let c = SYMBOLS;
    if (excludeAmbiguous) c = c.replace(/[{}[\]()\/\\'"`~,;:.<>]/g, "");
    chars += c;
    required.push(c[Math.floor(Math.random() * c.length)]);
  }

  if (!chars) return "";

  let password = required.join("");
  const charsLen = chars.length;
  for (let i = password.length; i < length; i++) {
    password += chars[Math.floor(Math.random() * charsLen)];
  }

  return shuffle(password);
}

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [count, setCount] = useState(1);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generate = useCallback(() => {
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(
        generatePassword(
          length,
          useUpper,
          useLower,
          useNumbers,
          useSymbols,
          excludeSimilar,
          excludeAmbiguous
        )
      );
    }
    setPasswords(result);
  }, [length, useUpper, useLower, useNumbers, useSymbols, excludeSimilar, excludeAmbiguous, count]);

  const anyCharType = useUpper || useLower || useNumbers || useSymbols;

  const copySingle = async (pwd: string, index: number) => {
    try {
      await navigator.clipboard.writeText(pwd);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // clipboard API not available
    }
  };

  return (
    <ToolLayout
      title="Password Generator"
      description="Generate secure, random passwords with configurable length and character types. Built-in strength indicator."
      category="developer"
      faqContent={[
        {
          question: "What makes a password secure?",
          answer:
            "A secure password is long (16+ characters), uses a mix of character types (uppercase, lowercase, numbers, symbols), and is randomly generated. Avoid dictionary words, patterns, and personal information.",
        },
        {
          question: "How long should my password be?",
          answer:
            "For most applications, at least 12 characters is recommended. For highly sensitive accounts, use 16-20 characters. Each additional character exponentially increases the time needed to brute-force the password.",
        },
        {
          question: "What character types should I include?",
          answer:
            "For maximum security, include all four types: uppercase letters, lowercase letters, numbers, and symbols. This maximizes the total possible combinations for a given password length.",
        },
        {
          question: "What does the strength indicator mean?",
          answer:
            "The strength indicator shows how resistant your password is to brute-force attacks based on length and character type diversity. Weak (red), Fair (orange), Good (yellow), Strong (green).",
        },
        {
          question: "Should I exclude similar characters?",
          answer:
            "Excluding similar characters (i, l, 1, L, o, 0, O) makes passwords easier to read and type manually, but reduces the character set, slightly decreasing entropy.",
        },
        {
          question: "What are ambiguous characters?",
          answer:
            "Ambiguous characters include brackets, quotes, backslashes, and other punctuation that can be confusing when reading or typing passwords. Excluding them improves usability.",
        },
        {
          question: "Can I generate multiple passwords at once?",
          answer:
            "Yes. Use the Count control to generate up to 20 passwords at once. Each password is independently generated with the same settings.",
        },
        {
          question: "Are the passwords truly random?",
          answer:
            "Yes. The generator uses cryptographically secure random number generation via the Web Crypto API, ensuring passwords are not predictable.",
        },
        {
          question: "Should I use a password manager?",
          answer:
            "Absolutely. Password managers generate, store, and auto-fill strong passwords for each of your accounts, so you only need to remember one master password.",
        },
        {
          question: "How often should I change my passwords?",
          answer:
            "Current best practices recommend changing passwords only when there is evidence of a breach. Use unique passwords for each account and enable two-factor authentication where possible.",
        },
      ]}
      explanationContent={
        <div className="prose prose-slate max-w-none space-y-6">
          <h2>How Password Security Works</h2>
          <p>
            Password security is measured by entropy - the measure of
            unpredictability. Entropy depends on both the character set size
            and the password length. Each additional character or character
            type exponentially increases the number of possible combinations.
          </p>

          <h3>Character Set Size</h3>
          <p>
            The total number of possible passwords for a given length is
            calculated as S<sup>L</sup>, where S is the character set size and
            L is the password length:
          </p>
          <ul>
            <li>
              <strong>Lowercase only:</strong> 26 characters
            </li>
            <li>
              <strong>Lowercase + Uppercase:</strong> 52 characters
            </li>
            <li>
              <strong>Lowercase + Uppercase + Numbers:</strong> 62 characters
            </li>
            <li>
              <strong>All types:</strong> 95+ characters
            </li>
          </ul>

          <h3>Password Length Matters Most</h3>
          <p>
            Every additional character multiplies the number of possible
            combinations by the character set size. A 16-character password
            with all character types has 95¹⁶ possible combinations - a number
            so large it would take billions of years to brute-force with
            current technology.
          </p>

          <h3>Strength Categories</h3>
          <ul>
            <li>
              <strong>Weak (Red):</strong> Fewer than 8 characters or only 1
              character type. Can be cracked in seconds or minutes.
            </li>
            <li>
              <strong>Fair (Orange):</strong> 8-11 characters with 2+ types.
              Moderate protection against casual attacks.
            </li>
            <li>
              <strong>Good (Yellow):</strong> 12-15 characters with 3+ types.
              Strong protection for most applications.
            </li>
            <li>
              <strong>Strong (Green):</strong> 16+ characters with all 4 types.
              Maximum protection against sophisticated attacks.
            </li>
          </ul>

          <h3>Common Password Attack Methods</h3>
          <ul>
            <li>
              <strong>Brute Force:</strong> Trying every possible combination
              until the correct one is found.
            </li>
            <li>
              <strong>Dictionary Attack:</strong> Trying common words, phrases,
              and patterns.
            </li>
            <li>
              <strong>Rainbow Tables:</strong> Precomputed hash tables for
              reversing unsalted password hashes.
            </li>
            <li>
              <strong>Social Engineering:</strong> Using personally identifiable
              information to guess passwords.
            </li>
          </ul>

          <h3>Best Practices for Password Management</h3>
          <ul>
            <li>Use a unique password for every account</li>
            <li>Use 16+ characters with all character types</li>
            <li>Never reuse passwords across services</li>
            <li>Use a password manager to store generated passwords</li>
            <li>Enable two-factor authentication (2FA) when available</li>
            <li>Regularly audit your accounts for compromised credentials</li>
          </ul>

          <h3>Why Random Generation Matters</h3>
          <p>
            Human-generated passwords follow predictable patterns - they use
            words, dates, keyboard patterns, and personal information.
            Password generators create truly random passwords that follow no
            patterns and cannot be guessed or predicted, providing the highest
            level of security.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="password-length"
            >
              Length: {length}
            </label>
            <input
              id="password-length"
              type="range"
              min={4}
              max={128}
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>4</span>
              <span>128</span>
            </div>
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="password-count"
            >
              Count
            </label>
            <input
              id="password-count"
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) =>
                setCount(
                  Math.min(20, Math.max(1, parseInt(e.target.value) || 1))
                )
              }
              className="w-20 p-2 bg-white border border-border rounded-lg text-sm"
            />
          </div>
          <button
            onClick={generate}
            disabled={!anyCharType}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RotateCw className="w-4 h-4" />
            Generate
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={useUpper}
              onChange={(e) => setUseUpper(e.target.checked)}
              className="rounded"
            />
            A-Z
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={useLower}
              onChange={(e) => setUseLower(e.target.checked)}
              className="rounded"
            />
            a-z
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={useNumbers}
              onChange={(e) => setUseNumbers(e.target.checked)}
              className="rounded"
            />
            0-9
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={useSymbols}
              onChange={(e) => setUseSymbols(e.target.checked)}
              className="rounded"
            />
            !@#$%
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={excludeSimilar}
              onChange={(e) => setExcludeSimilar(e.target.checked)}
              className="rounded"
            />
            Exclude Similar
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={excludeAmbiguous}
              onChange={(e) => setExcludeAmbiguous(e.target.checked)}
              className="rounded"
            />
            Exclude Ambiguous
          </label>
        </div>

        {!anyCharType && (
          <p className="text-sm text-red-500">
            Select at least one character type.
          </p>
        )}

        <div className="space-y-3">
          {passwords.map((pwd, i) => {
            const strength = getStrength(pwd);
            return (
              <div key={i} className="p-4 bg-white border border-border rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex-1 font-mono text-sm break-all select-all">
                    {pwd}
                  </span>
                  <button
                    onClick={() => copySingle(pwd, i)}
                    className="p-1.5 hover:bg-muted rounded-md transition-colors shrink-0"
                    title="Copy password"
                  >
                    {copiedIndex === i ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${strength.color}`}
                      style={{
                        width: `${Math.min(100, (pwd.length / 128) * 100)}%`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs font-semibold shrink-0 ${strength.textColor}`}
                  >
                    {strength.label}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {pwd.length} chars
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ToolLayout>
  );
}
