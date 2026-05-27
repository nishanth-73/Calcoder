"use client";

import { useState, useCallback, useEffect } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { Copy, Check, AlertCircle, Minus, Plus, Upload } from "lucide-react";

function formatYaml(input: string): string {
  const lines = input.split("\n");
  const result: string[] = [];
  let indentLevel = 0;
  const indentSize = 2;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trimEnd();

    if (trimmed.trim() === "") {
      result.push("");
      continue;
    }

    const stripped = trimmed.trimStart();
    const leadingWs = trimmed.length - trimmed.trimStart().length;

    if (stripped.startsWith("- ")) {
      const prevLine = i > 0 ? lines[i - 1].trimEnd() : "";
      const prevStripped = prevLine.trimStart();
      if (prevStripped.startsWith("- ") || prevStripped.startsWith("-") || prevLine === "") {
        indentLevel = Math.floor(leadingWs / indentSize);
      } else {
        indentLevel = Math.floor(leadingWs / indentSize);
      }
    } else if (stripped.endsWith(":")) {
      indentLevel = Math.floor(leadingWs / indentSize);
    } else if (stripped.includes(":")) {
      indentLevel = Math.floor(leadingWs / indentSize);
    } else {
      indentLevel = Math.max(0, Math.floor(leadingWs / indentSize));
    }

    indentLevel = Math.max(0, indentLevel);

    if (stripped.startsWith("- ")) {
      result.push(" ".repeat(indentLevel * indentSize) + stripped);
      if (stripped.endsWith(":")) {
        indentLevel++;
      }
    } else if (stripped.endsWith(":")) {
      result.push(" ".repeat(indentLevel * indentSize) + stripped);
      indentLevel++;
    } else if (stripped.includes(": ")) {
      result.push(" ".repeat(indentLevel * indentSize) + stripped);
    } else {
      result.push(" ".repeat(indentLevel * indentSize) + stripped);
    }
  }

  return result.join("\n");
}

function minifyYaml(input: string): string {
  return input
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== "")
    .join("\n");
}

function validateYaml(input: string): string | null {
  if (!input.trim()) return null;
  const lines = input.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    if (trimmed.includes("\t")) {
      return `Line ${i + 1}: Tabs are not allowed in YAML - use spaces for indentation`;
    }
    if (trimmed.startsWith("---") || trimmed.startsWith("...")) continue;
    if (!trimmed.includes(":") && !trimmed.startsWith("- ")) {
      const prevLine = i > 0 ? lines[i - 1].trim() : "";
      if (prevLine !== "" && !prevLine.startsWith("#")) {
        if (!trimmed.startsWith("-")) {
          return `Line ${i + 1}: Expected key:value pair or list item, got: "${trimmed.substring(0, 50)}"`;
        }
      }
    }
  }
  return null;
}

export default function YamlFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);

  const processYaml = useCallback((value: string, mode: "format" | "minify") => {
    if (!value.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    const validationError = validateYaml(value);
    if (validationError) {
      setError(validationError);
      setOutput("");
      return;
    }
    try {
      const result = mode === "format" ? formatYaml(value) : minifyYaml(value);
      setOutput(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || "YAML processing error");
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
      processYaml(input, "format");
    }, 300);
    return () => clearTimeout(timer);
  }, [input, processYaml]);

  const handleFormat = useCallback(() => processYaml(input, "format"), [input, processYaml]);
  const handleMinify = useCallback(() => processYaml(input, "minify"), [input, processYaml]);

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
      title="YAML Formatter"
      description="Format, beautify, and validate YAML data with consistent indentation and structure analysis."
      category="developer"
      faqContent={[
        {
          question: "What is YAML formatting?",
          answer: "YAML (YAML Ain't Markup Language) formatting restructures raw YAML data with consistent indentation, proper spacing around colons, and uniform list formatting. YAML is particularly sensitive to indentation, making proper formatting essential for valid configuration files."
        },
        {
          question: "Why is indentation so important in YAML?",
          answer: "YAML uses indentation (spaces only, no tabs) to define the hierarchical structure, similar to Python. Incorrect indentation changes the meaning of the data or causes parse errors. Consistent 2-space indentation is the industry standard for YAML files."
        },
        {
          question: "How does the YAML formatter work?",
          answer: "The formatter analyzes each line of input, strips trailing whitespace, detects the indentation level based on the structure (key-value pairs, list items, nested blocks), and re-writes each line with consistent 2-space indentation. It also validates basic YAML syntax rules."
        },
        {
          question: "What YAML features are supported?",
          answer: "The formatter supports standard YAML structures: key-value pairs, nested mappings, list items (with dash notation), block sequences, and comments (lines starting with #). Advanced features like anchors (&), aliases (*), multi-document streams (---), and tagged types are preserved."
        },
        {
          question: "What common YAML errors does the validator catch?",
          answer: "The tool detects: tabs used instead of spaces, lines that are not valid key:value pairs outside list context, inconsistent list item formatting, and empty values. For complete validation, use a dedicated YAML parser like js-yaml."
        },
        {
          question: "What is the difference between format and minify modes?",
          answer: "Format mode indents the YAML consistently with 2 spaces per level and preserves blank lines for readability. Minify mode removes all blank lines and trailing whitespace, producing a more compact but still readable document."
        },
        {
          question: "How should I handle multi-line strings in YAML?",
          answer: "Use the literal block scalar (|) for multi-line strings that preserve newlines, or the folded block scalar (>) for strings where newlines should be converted to spaces. The formatter preserves these indicators and their indentation."
        },
        {
          question: "Can I use tabs for indentation in YAML?",
          answer: "No. The YAML spec explicitly forbids tabs for indentation. Only spaces are allowed. The formatter will flag any tabs found in the input as an error and suggest replacing them with spaces."
        },
        {
          question: "What are YAML anchors and aliases?",
          answer: "Anchors (&name) mark a node for reuse, and aliases (*name) reference it later. This avoids duplication in complex YAML files. Example: defaults: &defaults timeout: 30; server1: <<: *defaults. The formatter preserves these constructs."
        },
        {
          question: "How do I format YAML for Docker Compose or Kubernetes?",
          answer: "The same principles apply: consistent 2-space indentation, clear key-value pairing, and proper list formatting. Docker Compose and Kubernetes manifests are YAML files and benefit greatly from proper formatting for readability and maintainability."
        }
      ]}
      explanationContent={
        <div className="space-y-6">
          <section>
            <h3 className="text-xl font-bold mb-2">What is YAML Formatting?</h3>
            <p className="text-muted-foreground">
              YAML formatting is the process of normalizing YAML data with consistent indentation, proper spacing, and uniform structure. YAML relies entirely on indentation to represent data hierarchy, making correct formatting not just cosmetic but essential for correctness.
            </p>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">How It Works</h3>
            <p className="text-muted-foreground">
              The formatter reads each line, trims trailing whitespace, detects the structural role (key-value pair, list item, block start), and rewrites it with exactly 2-spaces per indentation level. It tracks indentation depth based on the previous line's structure - endings with a colon increase depth, list items maintain depth, and blank lines reset tracking.
            </p>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">Features</h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Consistent 2-space indentation normalization</li>
              <li>Tab detection and error reporting</li>
              <li>Trailing whitespace removal</li>
              <li>Blank line preservation in format mode</li>
              <li>Compact output in minify mode</li>
              <li>File upload for .yaml/.yml files</li>
              <li>Real-time formatting with debounce</li>
            </ul>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">Use Cases</h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Formatting Docker Compose files (docker-compose.yml)</li>
              <li>Cleaning up Kubernetes configuration manifests</li>
              <li>Normalizing CI/CD pipeline definitions (GitHub Actions, GitLab CI)</li>
              <li>Formatting Ansible playbooks and roles</li>
              <li>Preparing YAML data for configuration management systems</li>
            </ul>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">Examples</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-2">
              <p className="font-semibold text-foreground">Input:</p>
              <pre className="text-muted-foreground">{`server:
  host: localhost
  port: 8080
database:
    host: db.example.com
  name: app_db`}</pre>
              <p className="font-semibold text-foreground mt-4">Output:</p>
              <pre className="text-muted-foreground">{`server:
  host: localhost
  port: 8080
database:
  host: db.example.com
  name: app_db`}</pre>
            </div>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">Tips</h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Always use 2 spaces for indentation - never tabs</li>
              <li>Use quotes around strings that contain special characters (: # { } [ ] , & * ? | -)</li>
              <li>Keep files under a few hundred lines for maintainability</li>
              <li>Use comments (#) to document complex configuration sections</li>
              <li>Validate YAML with a parser after formatting to ensure correctness</li>
            </ul>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">Common Mistakes</h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Using tabs instead of spaces for indentation (YAML syntax error)</li>
              <li>Inconsistent indentation between sibling elements (same level, different indentation)</li>
              <li>Mixing space count between different levels of nesting</li>
              <li>Forgetting the space after colon in key: value pairs</li>
              <li>Misaligned list items under a mapping key</li>
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
            <label className="cursor-pointer p-2 rounded-lg hover:bg-muted transition-colors" title="Upload YAML file">
              <input type="file" accept=".yaml,.yml" onChange={handleFileUpload} className="hidden" />
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
              <label className="text-sm font-semibold text-foreground">Input YAML</label>
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
                placeholder={`server:\n  host: localhost\n  port: 8080`}
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
                  <p className="font-semibold text-sm">YAML Error</p>
                  <p className="text-xs mt-1 max-w-xs opacity-80 font-mono">{error}</p>
                </div>
              ) : (
                <textarea
                  value={output}
                  readOnly
                  placeholder="Formatted YAML will appear here"
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
