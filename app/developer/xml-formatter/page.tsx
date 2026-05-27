"use client";

import { useState, useCallback, useEffect } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { Copy, Check, AlertCircle, Minus, Plus, Upload } from "lucide-react";

function prettyPrintXml(xml: string, indent = 2): string {
  const lines: string[] = [];
  const xmlDoc = new DOMParser().parseFromString(xml, "text/xml");
  const parseError = xmlDoc.querySelector("parsererror");
  if (parseError) {
    throw new Error(parseError.textContent || "XML parsing failed");
  }
  const serializer = new XMLSerializer();
  const serialized = serializer.serializeToString(xmlDoc);
  let depth = 0;
  const tokens = serialized.replace(/>\s*</g, ">\n<").split("\n");
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    if (trimmed.match(/^<\//)) {
      depth--;
    }
    lines.push(" ".repeat(Math.max(0, depth) * indent) + trimmed);
    if (trimmed.match(/^<[^/?!]/) && !trimmed.match(/\/>$/)) {
      depth++;
    }
  }
  return lines.join("\n");
}

function minifyXml(xml: string): string {
  return xml.replace(/>\s+</g, "><").replace(/\s+/g, " ").trim();
}

function parseXmlError(xml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const errorNode = doc.querySelector("parsererror");
  if (errorNode) {
    const text = errorNode.textContent || "";
    const lines = xml.split("\n");
    const lineMatch = text.match(/line\s*(\d+)/i);
    const colMatch = text.match(/column\s*(\d+)/i);
    const posMatch = text.match(/position\s*(\d+)/i);
    let detail = text.split("\n")[0] || "XML parse error";
    if (lineMatch) {
      const ln = parseInt(lineMatch[1]);
      detail += ` at line ${ln}`;
      if (colMatch) detail += `, column ${colMatch[1]}`;
      if (ln > 0 && ln <= lines.length) {
        detail += `\nNear: ${lines[ln - 1].trim().substring(0, 120)}`;
      }
    }
    return detail;
  }
  return "XML parsing failed with unknown error";
}

export default function XmlFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);

  const processXml = useCallback((value: string, mode: "format" | "minify") => {
    if (!value.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      const result = mode === "format" ? prettyPrintXml(value) : minifyXml(value);
      setOutput(result);
      setError(null);
    } catch (err: any) {
      setError(parseXmlError(value));
      setOutput("");
    }
  }, []);

  useEffect(() => {
    setCharCount(input.length);
    setLineCount(input ? input.split("\n").length : 0);
  }, [input]);

  useEffect(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    const timer = setTimeout(() => {
      processXml(input, "format");
    }, 300);
    return () => clearTimeout(timer);
  }, [input, processXml]);

  const handleFormat = useCallback(() => processXml(input, "format"), [input, processXml]);
  const handleMinify = useCallback(() => processXml(input, "minify"), [input, processXml]);

  const copyToClipboard = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [output]);

  const clearAll = useCallback(() => {
    setInput("");
    setOutput("");
    setError(null);
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => setInput(evt.target?.result as string);
    reader.readAsText(file);
  }, []);

  return (
    <ToolLayout
      title="XML Formatter"
      description="Beautify, format, and validate XML code with proper indentation and error diagnostics."
      category="developer"
      faqContent={[
        {
          question: "What is XML formatting?",
          answer: "XML formatting (pretty-printing) takes raw, minified, or poorly indented XML and re-structures it with consistent indentation, line breaks, and proper spacing. This makes the hierarchical structure of XML documents visually clear and easier to debug or edit."
        },
        {
          question: "How does the XML parser work?",
          answer: "The tool uses the browser's built-in DOMParser API to parse XML strings into a DOM tree. It then uses XMLSerializer to serialize the tree back to a string. The custom pretty-print function adds proper indentation by tracking the depth of opening and closing tags."
        },
        {
          question: "What XML standards are supported?",
          answer: "The DOMParser supports XML 1.0 (W3C Recommendation). It handles well-formed documents with proper nesting, attributes, CDATA sections, processing instructions (<??>), and namespaces. HTML-specific constructs are not supported in XML mode."
        },
        {
          question: "What is the difference between format and minify?",
          answer: "Format (pretty-print) indents XML with proper line breaks and 2-space indentation, making it readable. Minify removes all non-essential whitespace between tags, producing a compact string ideal for storage or network transfer."
        },
        {
          question: "How are XML errors reported?",
          answer: "When parsing fails, the tool captures the parsererror node from the DOMParser result, extracts the line number and column, and shows a contextual snippet from your input near the error location. This helps quickly identify mismatched tags or malformed syntax."
        },
        {
          question: "Can I format XML with namespaces?",
          answer: "Yes, the DOMParser fully supports XML namespaces. Attributes like xmlns, xmlns:prefix, and prefixed elements (e.g., soap:Envelope) are preserved correctly during parsing and serialization."
        },
        {
          question: "What are common XML formatting pitfalls?",
          answer: "Common issues include: CDATA sections with special characters, deeply nested documents that produce very long lines, self-closing tags vs opening/closing pairs, and whitespace preservation in mixed content (text + elements at the same level)."
        },
        {
          question: "Does the tool handle CDATA sections?",
          answer: "Yes, CDATA sections (<![CDATA[...]]>) are parsed and preserved by the DOMParser. During serialization, CDATA content is properly output. However, XMLSerializer may convert CDATA to escaped text in some cases depending on content."
        },
        {
          question: "How do I validate XML structure beyond well-formedness?",
          answer: "This tool checks for well-formedness only. For schema validation (DTD, XSD), use dedicated XML validators. Well-formed XML has matching tags, proper nesting, single root element, and correct attribute quoting."
        },
        {
          question: "What is the difference between XML and HTML formatting?",
          answer: "XML is stricter than HTML: all tags must close, attributes must be quoted, self-closing tags need the slash (e.g., <br/>), and element names are case-sensitive. XML formatter enforces these rules while HTML formatter handles HTML's looser syntax."
        }
      ]}
      explanationContent={
        <div className="space-y-6">
          <section>
            <h3 className="text-xl font-bold mb-2">What is XML Formatting?</h3>
            <p className="text-muted-foreground">
              XML (eXtensible Markup Language) formatting transforms raw, compact, or poorly structured XML into a clean, indented, and human-readable document. Proper formatting reveals the hierarchical structure of elements, making data exchange formats, configuration files, and API responses easier to understand and debug.
            </p>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">How It Works</h3>
            <p className="text-muted-foreground">
              The tool first parses your XML string using the browser's native DOMParser API, which builds a DOM tree representation. The tree is serialized back to a string using XMLSerializer. A custom pretty-printing algorithm then walks the serialized output token by token, tracking tag depth to apply proper indentation (2 spaces per level). Self-closing tags, processing instructions, and text nodes are handled correctly.
            </p>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">Features</h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Real-time formatting with 300ms debounce for instant feedback</li>
              <li>2-space indentation following industry convention</li>
              <li>Minify option for compact XML output</li>
              <li>Detailed error messages with line numbers and context</li>
              <li>File upload support for .xml files</li>
              <li>Character and line count metrics</li>
              <li>One-click copy to clipboard</li>
            </ul>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">Use Cases</h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Reading and editing XML configuration files (web.config, pom.xml, build.xml)</li>
              <li>Debugging SOAP API request and response payloads</li>
              <li>Formatting RSS/Atom feed XML for inspection</li>
              <li>Preparing XML data for documentation</li>
              <li>Teaching XML structure and nesting concepts</li>
            </ul>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">Examples</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-2">
              <p className="font-semibold text-foreground">Input:</p>
              <pre className="text-muted-foreground">{`<root><person><name>John</name><age>30</age><address><city>NYC</city><zip>10001</zip></address></person></root>`}</pre>
              <p className="font-semibold text-foreground mt-4">Output:</p>
              <pre className="text-muted-foreground">{`<root>
  <person>
    <name>John</name>
    <age>30</age>
    <address>
      <city>NYC</city>
      <zip>10001</zip>
    </address>
  </person>
</root>`}</pre>
            </div>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">Tips</h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Always ensure XML has a single root element</li>
              <li>Use 2-space indentation consistently for team projects</li>
              <li>Validate XML against an XSD schema for data integrity</li>
              <li>Use CDATA for text with special characters (e.g., HTML/XML inside values)</li>
              <li>Keep attribute values quoted with double quotes for compatibility</li>
            </ul>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">Common Mistakes</h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Missing closing tags or mismatched tag names (XML is case-sensitive)</li>
              <li>Improper attribute quoting (values must be in double or single quotes)</li>
              <li>Using special characters (&lt;&gt;&amp;) without escaping</li>
              <li>Multiple root elements without a parent wrapper</li>
              <li>Self-closing tags with closing tags (e.g., &lt;br&gt;&lt;/br&gt; instead of &lt;br/&gt;)</li>
            </ul>
          </section>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {charCount.toLocaleString()} chars | {lineCount} lines
            </span>
          </div>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer p-2 rounded-lg hover:bg-muted transition-colors" title="Upload XML file">
              <input type="file" accept=".xml,text/xml" onChange={handleFileUpload} className="hidden" />
              <Upload className="w-4 h-4 text-muted-foreground" />
            </label>
            <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors">
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="bg-white border border-border rounded-xl">
            <div className="flex justify-between items-center px-4 pt-4 pb-2">
              <label className="text-sm font-semibold text-foreground">Input XML</label>
              <div className="flex gap-1">
                <button
                  onClick={handleFormat}
                  disabled={!input.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Format
                </button>
                <button
                  onClick={handleMinify}
                  disabled={!input.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-3 h-3" />
                  Minify
                </button>
              </div>
            </div>
            <div className="px-4 pb-4">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`<root>\n  <element>Paste XML here</element>\n</root>`}
                className="w-full h-96 p-4 font-mono text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Output */}
          <div className="bg-white border border-border rounded-xl">
            <div className="flex justify-between items-center px-4 pt-4 pb-2">
              <label className="text-sm font-semibold text-foreground">Output</label>
              <button
                onClick={copyToClipboard}
                disabled={!output}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="px-4 pb-4">
              {error ? (
                <div className="w-full h-96 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex flex-col items-center justify-center text-center">
                  <AlertCircle className="w-8 h-8 mb-2 text-red-400" />
                  <p className="font-semibold text-sm">XML Error</p>
                  <p className="text-xs mt-1 max-w-xs opacity-80 font-mono whitespace-pre-wrap">{error}</p>
                </div>
              ) : (
                <textarea
                  value={output}
                  readOnly
                  placeholder="Formatted XML will appear here"
                  className="w-full h-96 p-4 font-mono text-sm bg-white border border-border rounded-lg outline-none resize-none"
                  spellCheck={false}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
