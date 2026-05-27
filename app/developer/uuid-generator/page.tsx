"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { Copy, Check, RotateCw } from "lucide-react";

function generateUUID(dashes: boolean, uppercase: boolean): string {
  let uuid: string;
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    uuid = crypto.randomUUID();
  } else {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) =>
      b.toString(16).padStart(2, "0")
    ).join("");
    uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
      12,
      16
    )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  if (!dashes) uuid = uuid.replace(/-/g, "");
  if (uppercase) uuid = uuid.toUpperCase();
  return uuid;
}

function generateUUIDs(count: number, dashes: boolean, uppercase: boolean): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(generateUUID(dashes, uppercase));
  }
  return result;
}

export default function UUIDGenerator() {
  const [count, setCount] = useState(5);
  const [dashes, setDashes] = useState(true);
  const [uppercase, setUppercase] = useState(false);
  const [uuids, setUuids] = useState<string[]>(() =>
    generateUUIDs(5, true, false)
  );
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const generate = useCallback(() => {
    setUuids(generateUUIDs(count, dashes, uppercase));
  }, [count, dashes, uppercase]);

  const copySingle = async (uuid: string, index: number) => {
    try {
      await navigator.clipboard.writeText(uuid);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // clipboard API not available
    }
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(uuids.join("\n"));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      // clipboard API not available
    }
  };

  return (
    <ToolLayout
      title="UUID Generator"
      description="Generate random UUID v4 identifiers instantly. Supports bulk generation with options for dashes and case."
      category="developer"
      faqContent={[
        {
          question: "What is a UUID?",
          answer:
            "A UUID (Universally Unique Identifier) is a 128-bit label standardized by RFC 4122. It is used to uniquely identify information in computer systems without requiring a central authority.",
        },
        {
          question: "What is UUID v4?",
          answer:
            "UUID v4 generates random UUIDs using cryptographically secure random number generators. It has approximately 5.3 × 10³⁶ possible values, making collisions astronomically unlikely.",
        },
        {
          question: "Are the generated UUIDs truly random?",
          answer:
            "Yes. The generator uses the Web Crypto API (crypto.getRandomValues) to ensure cryptographically strong random numbers conforming to the RFC 4122 v4 specification.",
        },
        {
          question: "Can I generate multiple UUIDs at once?",
          answer:
            "Yes. Use the Count control to generate between 1 and 100 UUIDs at once. You can copy them individually or copy all as a newline-separated list.",
        },
        {
          question: "Should I use dashes in UUIDs?",
          answer:
            "Dashes are part of the standard UUID format (8-4-4-4-12). Most systems expect dashes. Removing dashes results in a 32-character hex string that is still unique.",
        },
        {
          question: "What is the difference between uppercase and lowercase UUIDs?",
          answer:
            "The hex digits in a UUID can be uppercase (A-F) or lowercase (a-f). Both represent the same value. Convention typically uses lowercase, but some systems prefer uppercase.",
        },
        {
          question: "Can UUIDs be used as primary keys in databases?",
          answer:
            "Yes, UUIDs make excellent primary keys, especially in distributed systems. However, they take more storage space than auto-increment integers (16 bytes vs 4-8 bytes).",
        },
        {
          question: "What is the difference between UUID and GUID?",
          answer:
            "UUID and GUID (Globally Unique Identifier) are practically the same thing. GUID is Microsoft's implementation of the UUID standard. Both follow RFC 4122.",
        },
        {
          question: "How many UUIDs can I generate before a collision occurs?",
          answer:
            "With UUID v4, you would need to generate about 2.7 × 10¹⁸ UUIDs per second for 100 years to have a 50% chance of a collision. Collisions are effectively impossible in practice.",
        },
        {
          question: "Can UUIDs be traced back to the generating computer?",
          answer:
            "UUID v4 is purely random and contains no identifying information. Other versions like v1 (time-based) include MAC addresses and timestamps, which can be identifying.",
        },
      ]}
      explanationContent={
        <div className="prose prose-slate max-w-none space-y-6">
          <h2>What is a UUID?</h2>
          <p>
            A Universally Unique Identifier (UUID) is a 128-bit number used to
            identify information in computer systems. The standard is defined by
            RFC 4122 and provides a way to generate identifiers that are unique
            across space and time without requiring a central registration
            authority.
          </p>

          <h3>UUID v4 Format</h3>
          <p>
            UUID v4 generates random identifiers in the standard
            8-4-4-4-12 hexadecimal format:
            <code className="block mt-2 p-3 bg-muted rounded-lg text-sm">
              xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
            </code>
            The &quot;4&quot; indicates version 4, and &quot;y&quot; encodes
            the variant (8, 9, A, or B).
          </p>

          <h3>How UUID v4 Generation Works</h3>
          <p>
            The UUID generator uses the Web Crypto API to obtain
            cryptographically secure random bytes. It then applies bitwise
            operations to set the version (4) and variant bits according to RFC
            4122. This ensures every generated UUID is properly formatted and
            compliant with the standard.
          </p>

          <h3>Use Cases for UUIDs</h3>
          <ul>
            <li>
              <strong>Database Primary Keys:</strong> Especially in distributed
              systems where auto-increment IDs would conflict
            </li>
            <li>
              <strong>API Resource Identifiers:</strong> Uniquely identify API
              resources without exposing sequential IDs
            </li>
            <li>
              <strong>Session Identifiers:</strong> Generate unique session
              tokens for web applications
            </li>
            <li>
              <strong>File Names:</strong> Prevent naming collisions when
              storing user-uploaded files
            </li>
            <li>
              <strong>Transaction IDs:</strong> Track transactions across
              distributed systems
            </li>
          </ul>

          <h3>UUID Versions Compared</h3>
          <ul>
            <li>
              <strong>v1 (Time-based):</strong> Uses timestamp + MAC address.
              Can be traced back to the generating machine.
            </li>
            <li>
              <strong>v3 (Name-based, MD5):</strong> Derives UUID from a
              namespace and name using MD5 hashing.
            </li>
            <li>
              <strong>v4 (Random):</strong> Uses random bytes. No identifying
              information. Most commonly used.
            </li>
            <li>
              <strong>v5 (Name-based, SHA-1):</strong> Similar to v3 but uses
              SHA-1 instead of MD5.
            </li>
          </ul>

          <h3>Bulk UUID Generation</h3>
          <p>
            The UUID Generator supports generating up to 100 UUIDs at once.
            Each UUID is displayed in its own row with an individual copy
            button. Use the &quot;Copy All&quot; button to copy all generated
            UUIDs as a newline-separated list, ready for use in your
            application or data files.
          </p>

          <h3>Performance and Security</h3>
          <p>
            The generator uses the Web Crypto API (&quot;crypto.getRandomValues&quot;)
            which provides cryptographically secure random numbers. This ensures
            that the generated UUIDs are not predictable and are suitable for
            security-sensitive applications including authentication tokens and
            session identifiers.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="uuid-count"
            >
              Count
            </label>
            <input
              id="uuid-count"
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) =>
                setCount(
                  Math.min(100, Math.max(1, parseInt(e.target.value) || 1))
                )
              }
              className="w-20 p-2 bg-white border border-border rounded-lg text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={dashes}
              onChange={(e) => setDashes(e.target.checked)}
              className="rounded"
            />
            Dashes
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="rounded"
            />
            Uppercase
          </label>
          <button
            onClick={generate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
            Generate
          </button>
          <button
            onClick={copyAll}
            disabled={uuids.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            {copiedAll ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copiedAll ? "Copied!" : "Copy All"}
          </button>
        </div>
        <div className="space-y-2">
          {uuids.map((uuid, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-3 bg-white border border-border rounded-lg font-mono text-sm"
            >
              <span className="flex-1 break-all select-all">{uuid}</span>
              <button
                onClick={() => copySingle(uuid, i)}
                className="p-1.5 hover:bg-muted rounded-md transition-colors shrink-0"
                title="Copy UUID"
              >
                {copiedIndex === i ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
}
