"use client";

import { useState, useRef } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { Copy, Check, AlertCircle, Send, Plus, X, Loader2 } from "lucide-react";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const CONTENT_TYPES = [
  { label: "application/json", value: "application/json" },
  { label: "application/x-www-form-urlencoded", value: "application/x-www-form-urlencoded" },
  { label: "multipart/form-data", value: "multipart/form-data" },
  { label: "text/plain", value: "text/plain" },
  { label: "application/xml", value: "application/xml" },
];

interface HeaderEntry {
  id: number;
  key: string;
  value: string;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  timeMs: number;
  sizeBytes: number;
}

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return "text-green-600 bg-green-50 dark:bg-green-950/30 border-green-200";
  if (status >= 300 && status < 400) return "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200";
  if (status >= 400 && status < 500) return "text-orange-600 bg-orange-50 dark:bg-orange-950/30 border-orange-200";
  if (status >= 500) return "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200";
  return "";
}

function formatHeaders(headers: Record<string, string>): string {
  return Object.entries(headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

function buildCurl(
  url: string,
  method: string,
  headers: HeaderEntry[],
  body: string,
  contentType: string
): string {
  let curl = `curl -X ${method} "${url}"`;
  const hasContentType = headers.some((h) => h.key.toLowerCase() === "content-type");
  if (body && method !== "GET" && method !== "HEAD") {
    if (!hasContentType) {
      curl += ` \\\n  -H "Content-Type: ${contentType}"`;
    }
  }
  headers.forEach((h) => {
    if (h.key.trim()) {
      curl += ` \\\n  -H "${h.key}: ${h.value}"`;
    }
  });
  if (body && method !== "GET" && method !== "HEAD") {
    const escaped = body.replace(/"/g, '\\"');
    curl += ` \\\n  -d "${escaped}"`;
  }
  return curl;
}

export default function ApiRequestTester() {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [headers, setHeaders] = useState<HeaderEntry[]>([
    { id: 1, key: "", value: "" },
  ]);
  const [body, setBody] = useState("");
  const [contentType, setContentType] = useState("application/json");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedBody, setCopiedBody] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const nextHeaderId = useRef(2);

  const showBody = method === "POST" || method === "PUT" || method === "PATCH";

  const addHeader = () => {
    setHeaders((prev) => [...prev, { id: nextHeaderId.current++, key: "", value: "" }]);
  };

  const removeHeader = (id: number) => {
    setHeaders((prev) => prev.filter((h) => h.id !== id));
  };

  const updateHeader = (id: number, field: "key" | "value", val: string) => {
    setHeaders((prev) =>
      prev.map((h) => (h.id === id ? { ...h, [field]: val } : h))
    );
  };

  const getMergedHeaders = (): Record<string, string> => {
    const merged: Record<string, string> = {};
    headers.forEach((h) => {
      if (h.key.trim()) merged[h.key.trim()] = h.value;
    });
    const hasContentType = Object.keys(merged).some(
      (k) => k.toLowerCase() === "content-type"
    );
    if (showBody && body && !hasContentType) {
      merged["Content-Type"] = contentType;
    }
    return merged;
  };

  const sendRequest = async () => {
    if (!url.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    let parsedUrl: string;
    try {
      parsedUrl = url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
      new URL(parsedUrl);
    } catch {
      setError("Invalid URL format");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    const mergedHeaders = getMergedHeaders();
    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: mergedHeaders,
        signal: controller.signal,
      };

      if (showBody && body) {
        fetchOptions.body = body;
      }

      if (method === "HEAD") {
        fetchOptions.method = "HEAD";
      }

      const res = await fetch(parsedUrl, fetchOptions);
      clearTimeout(timeoutId);

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        resHeaders[key] = value;
      });

      let responseBody = "";
      try {
        responseBody = await res.text();
      } catch {
        responseBody = "[Unable to read response body]";
      }

      const sizeBytes = new TextEncoder().encode(responseBody).length;

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        body: responseBody,
        timeMs: responseTime,
        sizeBytes,
      });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Request timed out after 10 seconds");
      } else if (err instanceof TypeError) {
        setError(
          "Network error or CORS issue. The browser may have blocked the request."
        );
      } else {
        setError(err instanceof Error ? err.message : "Request failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyResponseBody = () => {
    if (response?.body) {
      navigator.clipboard.writeText(response.body);
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    }
  };

  const copyAsCurl = () => {
    const curl = buildCurl(url, method, headers, body, contentType);
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <ToolLayout
      title="API Request Tester"
      description="Test REST API endpoints with custom methods, headers, and body."
      category="developer"
      faqContent={[
        {
          question: "What is an API request?",
          answer:
            "An API request sends a message to a server asking it to perform an operation. The server responds with data or a status code.",
        },
        {
          question: "What are HTTP methods?",
          answer:
            "GET retrieves data, POST creates resources, PUT/PATCH update resources, DELETE removes, HEAD gets headers only, OPTIONS checks allowed methods.",
        },
        {
          question: "How do I set request headers?",
          answer:
            "Add headers as key-value pairs. Common headers include Authorization, Content-Type, and Accept.",
        },
        {
          question: "What is a request body?",
          answer:
            "The body contains data sent to the server, typically used with POST, PUT, and PATCH methods. Common formats include JSON and form data.",
        },
        {
          question: "What do different status codes mean?",
          answer:
            "2xx = success, 3xx = redirection, 4xx = client error, 5xx = server error. Each code has specific meaning (200 OK, 404 Not Found, 500 Internal Server Error).",
        },
        {
          question: "How do I handle CORS errors?",
          answer:
            "CORS errors occur when a web app requests resources from a different domain. The server must include appropriate CORS headers to allow the request.",
        },
        {
          question: "What is the difference between GET and POST?",
          answer:
            "GET requests data from a server (no body), while POST sends data to create resources (has body). GET is idempotent, POST is not.",
        },
        {
          question: "How do I authenticate API requests?",
          answer:
            "Add an Authorization header with credentials: Bearer tokens, Basic auth, or API keys depending on the API's requirements.",
        },
        {
          question: "What is JSON vs form data?",
          answer:
            "JSON (application/json) is structured key-value data. Form data (application/x-www-form-urlencoded) encodes data like URL parameters.",
        },
        {
          question: "Why did my request timeout?",
          answer:
            "Requests may time out due to slow servers, network issues, firewall blocks, or the server taking too long to respond. This tool uses a 10-second timeout.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">About API Request Tester</h2>
          <section>
            <h3 className="text-xl font-semibold mb-2">What is a REST API?</h3>
            <p>REST APIs follow architectural constraints for building web services. They use HTTP methods to perform CRUD operations on resources identified by URLs.</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">Understanding HTTP Methods</h3>
            <p>GET retrieves, POST creates, PUT replaces, PATCH partially updates, DELETE removes, HEAD gets headers, OPTIONS checks allowed methods.</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">HTTP Status Codes</h3>
            <p>2xx success, 3xx redirection, 4xx client errors, 5xx server errors. Each family communicates a different class of outcome.</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">Request Headers and Body</h3>
            <p>Headers provide metadata (auth tokens, content types). The body carries data payload for mutations (POST/PUT/PATCH).</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">Content Types Explained</h3>
            <p>JSON is the most common API format. Form-urlencoded mirrors HTML forms. Multipart is for file uploads. Text/plain is raw text.</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">Authentication and Authorization</h3>
            <p>Most APIs require auth via headers. Common schemes: Bearer tokens (JWT), Basic auth (base64-encoded credentials), API key headers.</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">Best Practices for API Testing</h3>
            <p>Start with simple GET requests, gradually add complexity. Check status codes, validate response structure, handle errors gracefully.</p>
          </section>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Request Builder */}
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/endpoint"
              className="w-full p-3 font-mono text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as HttpMethod)}
                className="w-full p-2.5 border border-border rounded-lg text-sm bg-white font-mono"
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            {showBody && (
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Content-Type
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full p-2.5 border border-border rounded-lg text-sm bg-white"
                >
                  {CONTENT_TYPES.map((ct) => (
                    <option key={ct.value} value={ct.value}>
                      {ct.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Headers</label>
              <button
                onClick={addHeader}
                className="flex items-center text-xs text-muted-foreground hover:text-foreground"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Header
              </button>
            </div>
            <div className="space-y-2">
              {headers.map((h) => (
                <div key={h.id} className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={h.key}
                    onChange={(e) => updateHeader(h.id, "key", e.target.value)}
                    placeholder="Key"
                    className="flex-1 p-2 text-sm font-mono bg-white border border-border rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    value={h.value}
                    onChange={(e) =>
                      updateHeader(h.id, "value", e.target.value)
                    }
                    placeholder="Value"
                    className="flex-[2] p-2 text-sm font-mono bg-white border border-border rounded-lg outline-none"
                  />
                  <button
                    onClick={() => removeHeader(h.id)}
                    className="p-2 text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {showBody && (
            <div>
              <label className="text-sm font-medium mb-2 block">Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"key": "value"}'
                className="w-full h-40 p-4 font-mono text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                spellCheck={false}
              />
            </div>
          )}

          <button
            onClick={sendRequest}
            disabled={loading || !url.trim()}
            className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Request
              </>
            )}
          </button>

          <div className="flex gap-2">
            <button
              onClick={copyAsCurl}
              disabled={!url.trim()}
              className="flex-1 py-2 border border-border text-sm font-medium rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {copiedCurl ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {copiedCurl ? "Copied!" : "Copy as cURL"}
            </button>
          </div>
        </div>

        {/* Right: Response */}
        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm opacity-80 mt-1">{error}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center p-12 border border-border rounded-lg">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {response && !loading && (
            <>
              {/* Status + Meta */}
              <div className="flex flex-wrap gap-3 items-center">
                <span
                  className={`px-3 py-1.5 rounded-lg border text-sm font-bold font-mono ${getStatusColor(
                    response.status
                  )}`}
                >
                  {response.status} {response.statusText}
                </span>
                <span className="text-xs text-muted-foreground">
                  {response.timeMs}ms
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatSize(response.sizeBytes)}
                </span>
              </div>

              {/* Response Headers */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Response Headers
                </label>
                <textarea
                  value={formatHeaders(response.headers)}
                  readOnly
                  className="w-full h-32 p-3 font-mono text-xs bg-white border border-border rounded-lg outline-none resize-none"
                  spellCheck={false}
                />
              </div>

              {/* Response Body */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">
                    Response Body ({formatSize(response.sizeBytes)})
                  </label>
                  <button
                    onClick={copyResponseBody}
                    className="flex items-center text-xs text-muted-foreground hover:text-foreground"
                  >
                    {copiedBody ? (
                      <Check className="w-3 h-3 mr-1" />
                    ) : (
                      <Copy className="w-3 h-3 mr-1" />
                    )}
                    {copiedBody ? "Copied!" : "Copy Body"}
                  </button>
                </div>
                <textarea
                  value={response.body}
                  readOnly
                  className="w-full h-80 p-4 font-mono text-sm bg-white border border-border rounded-lg outline-none resize-none"
                  spellCheck={false}
                />
              </div>
            </>
          )}

          {!response && !loading && !error && (
            <div className="flex flex-col items-center justify-center p-12 border border-border rounded-lg text-center">
              <Send className="w-8 h-8 text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground text-sm">
                Enter a URL and send a request to see the response
              </p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
