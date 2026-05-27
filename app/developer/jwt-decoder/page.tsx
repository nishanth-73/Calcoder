"use client";

import { useState, useEffect } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { Copy, Check, AlertCircle, RotateCcw } from "lucide-react";

interface JwtParts {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  raw: { header: string; payload: string; signature: string };
}

function base64UrlDecode(str: string): string {
  try {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) base64 += "=".repeat(4 - pad);
    return atob(base64);
  } catch {
    throw new Error("Invalid base64url encoding");
  }
}

function parseJwt(token: string): JwtParts {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT: token must have exactly 3 parts separated by dots");
  }

  const [headerB64, payloadB64, sigB64] = parts;

  let headerStr: string;
  let payloadStr: string;
  try {
    headerStr = base64UrlDecode(headerB64);
    payloadStr = base64UrlDecode(payloadB64);
  } catch {
    throw new Error("Invalid base64url encoding in JWT parts");
  }

  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(headerStr);
  } catch {
    throw new Error("Invalid JSON in JWT header");
  }
  try {
    payload = JSON.parse(payloadStr);
  } catch {
    throw new Error("Invalid JSON in JWT payload");
  }

  return {
    header,
    payload,
    signature: sigB64,
    raw: { header: headerStr, payload: payloadStr, signature: sigB64 },
  };
}

function formatDate(ts: number | undefined): string {
  if (ts === undefined || ts === null || typeof ts !== "number") return "N/A";
  try {
    return new Date(ts * 1000).toLocaleString();
  } catch {
    return "N/A";
  }
}

function timeAgo(ts: number | undefined): string {
  if (ts === undefined || ts === null || typeof ts !== "number") return "";
  const now = Math.floor(Date.now() / 1000);
  const diff = ts - now;
  const absDiff = Math.abs(diff);
  const mins = Math.floor(absDiff / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  let relative: string;
  if (days > 0) relative = `${days} day${days > 1 ? "s" : ""}`;
  else if (hours > 0) relative = `${hours} hour${hours > 1 ? "s" : ""}`;
  else relative = `${mins} minute${mins !== 1 ? "s" : ""}`;

  return diff > 0 ? `Expires in ${relative}` : `Expired ${relative} ago`;
}

export default function JwtDecoder() {
  const [token, setToken] = useState("");
  const [decoded, setDecoded] = useState<JwtParts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedHeader, setCopiedHeader] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedSignature, setCopiedSignature] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!token.trim()) {
        setDecoded(null);
        setError(null);
        return;
      }

      try {
        const result = parseJwt(token.trim());
        setDecoded(result);
        setError(null);
      } catch (err: unknown) {
        setDecoded(null);
        setError(err instanceof Error ? err.message : "Failed to decode JWT");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [token]);

  const copyJson = (
    json: Record<string, unknown>,
    setCopied: (v: boolean) => void
  ) => {
    navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyText = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearToken = () => {
    setToken("");
    setDecoded(null);
    setError(null);
  };

  const payload = decoded?.payload;
  const isExpired = payload?.exp
    ? Math.floor(Date.now() / 1000) > (payload.exp as number)
    : null;

  return (
    <ToolLayout
      title="JWT Decoder"
      description="Decode JSON Web Tokens without verification. Inspect header, payload, and signature."
      category="developer"
      faqContent={[
        {
          question: "What is a JWT token?",
          answer:
            "JSON Web Token (JWT) is a compact, URL-safe means of representing claims between parties. It consists of three parts: header, payload, and signature.",
        },
        {
          question: "How do I decode a JWT?",
          answer:
            "Paste your JWT token into the input field. The tool automatically decodes the base64-encoded header and payload sections.",
        },
        {
          question: "What is the difference between JWT and Base64?",
          answer:
            "JWT uses base64url encoding (URL-safe variant) for its parts, but the token also includes a cryptographic signature for verification.",
        },
        {
          question: "Is it safe to decode a JWT?",
          answer:
            "Yes, decoding just reads the base64-encoded data. Anyone with the token can decode it. DO NOT put sensitive data in a JWT payload.",
        },
        {
          question: "How do I verify a JWT signature?",
          answer:
            "This tool does NOT verify signatures. Verification requires the server's secret or public key to validate the cryptographic signature.",
        },
        {
          question: "What are JWT claims?",
          answer:
            "Claims are statements about an entity. Registered claims include iss (issuer), sub (subject), aud (audience), exp (expiration), iat (issued at).",
        },
        {
          question: "How do I know if a JWT is expired?",
          answer:
            "Check the 'exp' claim. This tool compares it against the current time to show whether the token is expired or still valid.",
        },
        {
          question: "What is the 'sub' claim?",
          answer:
            "The 'sub' (subject) claim identifies the principal that is the subject of the JWT, typically a user ID or identifier.",
        },
        {
          question: "What is the 'iss' claim?",
          answer:
            "The 'iss' (issuer) claim identifies the principal that issued the JWT, such as a service provider or authentication server.",
        },
        {
          question: "Can I modify a JWT token?",
          answer:
            "Modifying any part of a JWT will invalidate the signature. The server will reject tampered tokens during verification.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">About JWT Decoder</h2>
          <section>
            <h3 className="text-xl font-semibold mb-2">What is a JWT?</h3>
            <p>JSON Web Token (JWT) is an open standard (RFC 7519) for securely transmitting information between parties as a JSON object. The information is digitally signed.</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">JWT Structure: Header, Payload, Signature</h3>
            <p>A JWT has three base64url-encoded segments separated by dots. The header contains metadata (type, algorithm). The payload contains claims. The signature verifies integrity.</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">How JWT Authentication Works</h3>
            <p>The client receives a JWT from the server after login, then sends it in the Authorization header for subsequent requests. The server verifies the signature to authenticate.</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">JWT Claims</h3>
            <p>Registered claims (iss, sub, aud, exp, nbf, iat, jti) are predefined. Public claims are defined by users. Private claims are custom agreements between parties.</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">Base64 Encoding in JWT</h3>
            <p>JWT uses base64url encoding, which replaces + with -, / with _, and omits padding =. Each segment is independently decodable without the signature key.</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">Security Considerations</h3>
            <p>JWTs are signed, not encrypted. Sensitive data should never be placed in the payload. Always validate signatures server-side and use HTTPS.</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">When to Use JWT vs Sessions</h3>
            <p>JWT is stateless and ideal for distributed systems, mobile apps, and APIs. Sessions are stateful and simpler for traditional server-rendered web apps.</p>
          </section>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Token Input */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">JWT Token</label>
            <button
              onClick={clearToken}
              className="flex items-center text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3 h-3 mr-1" /> Clear
            </button>
          </div>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your JWT token here..."
            className="w-full h-28 p-4 font-mono text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none"
            spellCheck={false}
          />
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Decode Error</p>
              <p className="text-sm opacity-80 mt-1">{error}</p>
            </div>
          </div>
        )}

        {decoded && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Header</label>
                <button
                  onClick={() =>
                    copyJson(decoded.header, setCopiedHeader)
                  }
                  className="flex items-center text-xs text-muted-foreground hover:text-foreground"
                >
                  {copiedHeader ? (
                    <Check className="w-3 h-3 mr-1" />
                  ) : (
                    <Copy className="w-3 h-3 mr-1" />
                  )}
                  {copiedHeader ? "Copied!" : "Copy"}
                </button>
              </div>
              <textarea
                value={JSON.stringify(decoded.header, null, 2)}
                readOnly
                className="w-full h-44 p-4 font-mono text-sm bg-white border border-border rounded-lg outline-none resize-none"
                spellCheck={false}
              />
            </div>

            {/* Payload */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Payload</label>
                <button
                  onClick={() =>
                    copyJson(decoded.payload, setCopiedPayload)
                  }
                  className="flex items-center text-xs text-muted-foreground hover:text-foreground"
                >
                  {copiedPayload ? (
                    <Check className="w-3 h-3 mr-1" />
                  ) : (
                    <Copy className="w-3 h-3 mr-1" />
                  )}
                  {copiedPayload ? "Copied!" : "Copy"}
                </button>
              </div>
              <textarea
                value={JSON.stringify(decoded.payload, null, 2)}
                readOnly
                className="w-full h-44 p-4 font-mono text-sm bg-white border border-border rounded-lg outline-none resize-none"
                spellCheck={false}
              />
            </div>

            {/* Signature */}
            <div className="lg:col-span-2 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Signature (encoded)</label>
                <button
                  onClick={() =>
                    copyText(decoded.signature, setCopiedSignature)
                  }
                  className="flex items-center text-xs text-muted-foreground hover:text-foreground"
                >
                  {copiedSignature ? (
                    <Check className="w-3 h-3 mr-1" />
                  ) : (
                    <Copy className="w-3 h-3 mr-1" />
                  )}
                  {copiedSignature ? "Copied!" : "Copy"}
                </button>
              </div>
              <textarea
                value={decoded.signature}
                readOnly
                className="w-full h-20 p-4 font-mono text-sm bg-white border border-border rounded-lg outline-none resize-none"
                spellCheck={false}
              />
            </div>

            {/* Token Metadata */}
            <div className="lg:col-span-2">
              <label className="text-sm font-medium mb-3 block">
                Token Metadata
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground">Valid JWT</p>
                  <p className="font-semibold text-green-600">Yes (3 parts)</p>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p
                    className={`font-semibold ${
                      isExpired === null
                        ? "text-muted-foreground"
                        : isExpired
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {isExpired === null
                      ? "No exp claim"
                      : isExpired
                      ? "Expired"
                      : "Valid (not expired)"}
                  </p>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground">Issuer (iss)</p>
                  <p className="font-semibold font-mono text-sm truncate">
                    {String(payload?.iss ?? "N/A")}
                  </p>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    Subject (sub)
                  </p>
                  <p className="font-semibold font-mono text-sm truncate">
                    {String(payload?.sub ?? "N/A")}
                  </p>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground">Audience (aud)</p>
                  <p className="font-semibold font-mono text-sm truncate">
                    {Array.isArray(payload?.aud)
                      ? (payload.aud as string[]).join(", ")
                      : String(payload?.aud ?? "N/A")}
                  </p>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    Issued At (iat)
                  </p>
                  <p className="font-semibold text-sm">
                    {formatDate(payload?.iat as number | undefined)}
                  </p>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    Expiration (exp)
                  </p>
                  <p className="font-semibold text-sm">
                    {formatDate(payload?.exp as number | undefined)}
                  </p>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p
                    className={`font-semibold text-sm ${
                      payload?.exp
                        ? (payload.exp as number) <
                          Math.floor(Date.now() / 1000)
                          ? "text-red-600"
                          : "text-green-600"
                        : ""
                    }`}
                  >
                    {timeAgo(payload?.exp as number | undefined) || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!decoded && !error && !token.trim() && (
          <div className="flex flex-col items-center justify-center p-12 border border-border rounded-lg text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground text-sm">
              Paste a JWT token above to decode it
            </p>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
