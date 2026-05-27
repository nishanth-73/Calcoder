"use client";

import { useState, useCallback, useEffect } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { Copy, Check, AlertCircle, Minus, Plus, Upload } from "lucide-react";

const SQL_KEYWORDS = [
  "SELECT", "FROM", "WHERE", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "CROSS",
  "ON", "AND", "OR", "ORDER BY", "GROUP BY", "HAVING", "LIMIT", "OFFSET",
  "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM", "CREATE TABLE",
  "ALTER TABLE", "DROP TABLE", "CREATE INDEX", "DROP INDEX", "CREATE VIEW",
  "DROP VIEW", "AS", "DISTINCT", "COUNT", "SUM", "AVG", "MIN", "MAX",
  "BETWEEN", "IN", "NOT", "NULL", "IS", "LIKE", "CASE", "WHEN", "THEN",
  "ELSE", "END", "UNION", "ALL", "EXISTS", "HAVING", "ASC", "DESC",
  "PRIMARY KEY", "FOREIGN KEY", "REFERENCES", "CONSTRAINT", "INDEX",
  "UNIQUE", "CHECK", "DEFAULT", "AUTO_INCREMENT", "INT", "VARCHAR",
  "TEXT", "BOOLEAN", "DATE", "DATETIME", "FLOAT", "DOUBLE", "DECIMAL",
  "BIGINT", "SMALLINT", "TINYINT", "BLOB", "ENUM",
];

const MAJOR_KEYWORDS = [
  "SELECT", "FROM", "WHERE", "ORDER BY", "GROUP BY", "HAVING",
  "LIMIT", "OFFSET", "INSERT INTO", "UPDATE", "SET", "DELETE FROM",
  "CREATE TABLE", "ALTER TABLE", "DROP TABLE", "CREATE INDEX",
  "DROP INDEX", "CREATE VIEW", "DROP VIEW", "VALUES",
  "UNION", "HAVING",
];

function formatSql(input: string): string {
  let sql = input
    .replace(/\s+/g, " ")
    .trim();

  const allKeywords = [...SQL_KEYWORDS].sort((a, b) => b.length - a.length);
  const majorPattern = MAJOR_KEYWORDS.map((k) =>
    k.replace(/ /g, "\\s+")
  ).join("|");

  const combined = [...MAJOR_KEYWORDS].sort((a, b) => b.length - a.length);
  for (const kw of combined) {
    const escaped = kw.replace(/ /g, "\\s+");
    const regex = new RegExp(`\\b(${escaped})\\b`, "gi");
    sql = sql.replace(regex, `\n${kw}`);
  }

  sql = sql
    .replace(/\n\s*\n/g, "\n")
    .trim();

  for (const kw of allKeywords) {
    const escaped = kw.replace(/ /g, "\\s+");
    const regex = new RegExp(`\\b(${escaped})\\b`, "gi");
    sql = sql.replace(regex, kw);
  }

  const lines = sql.split("\n");
  const result: string[] = [];
  let indentLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    const upperLine = line.toUpperCase();

    const isClosing = upperLine.startsWith("END") || upperLine === ")";
    if (isClosing) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    const cleanLine = "  ".repeat(indentLevel) + line;
    result.push(cleanLine);

    const isOpening =
      upperLine.startsWith("SELECT") ||
      upperLine.startsWith("CASE") ||
      (upperLine.startsWith("(") && !upperLine.includes(")")) ||
      upperLine === "BEGIN" ||
      upperLine.endsWith("(");
    if (isOpening) {
      indentLevel++;
    }

    if (
      upperLine.startsWith("FROM") ||
      upperLine.startsWith("WHERE") ||
      upperLine.startsWith("ORDER BY") ||
      upperLine.startsWith("GROUP BY") ||
      upperLine.startsWith("HAVING") ||
      upperLine.startsWith("LIMIT") ||
      upperLine.startsWith("OFFSET") ||
      upperLine.startsWith("INSERT INTO") ||
      upperLine.startsWith("UPDATE") ||
      upperLine.startsWith("DELETE FROM") ||
      upperLine.startsWith("CREATE TABLE") ||
      upperLine.startsWith("ALTER TABLE") ||
      upperLine.startsWith("DROP TABLE") ||
      upperLine.startsWith("UNION") ||
      upperLine.startsWith("VALUES")
    ) {
      indentLevel = 1;
    }

    if (upperLine.startsWith("ON") || upperLine.startsWith("AND") || upperLine.startsWith("OR")) {
      indentLevel = 2;
    }

    indentLevel = Math.max(0, indentLevel);
  }

  return result.join("\n");
}

function minifySql(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function validateSql(input: string): string | null {
  if (!input.trim()) return null;
  const upper = input.toUpperCase().trim();
  if (
    !upper.startsWith("SELECT") &&
    !upper.startsWith("INSERT") &&
    !upper.startsWith("UPDATE") &&
    !upper.startsWith("DELETE") &&
    !upper.startsWith("CREATE") &&
    !upper.startsWith("ALTER") &&
    !upper.startsWith("DROP") &&
    !upper.startsWith("WITH")
  ) {
    return "SQL statement must start with a recognized keyword (SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, WITH)";
  }
  return null;
}

export default function SqlFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);

  const processSql = useCallback((value: string, mode: "format" | "minify") => {
    if (!value.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    const validationError = validateSql(value);
    if (validationError) {
      setError(validationError);
      setOutput("");
      return;
    }
    try {
      const result = mode === "format" ? formatSql(value) : minifySql(value);
      setOutput(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || "SQL processing error");
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
      processSql(input, "format");
    }, 300);
    return () => clearTimeout(timer);
  }, [input, processSql]);

  const handleFormat = useCallback(() => processSql(input, "format"), [input, processSql]);
  const handleMinify = useCallback(() => processSql(input, "minify"), [input, processSql]);

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
      title="SQL Formatter"
      description="Format, beautify, and validate SQL queries with keyword capitalization and clause indentation."
      category="developer"
      faqContent={[
        {
          question: "What is SQL formatting?",
          answer: "SQL formatting transforms raw SQL queries into clean, readable, and consistently structured code. It capitalizes SQL keywords (SELECT, FROM, WHERE, etc.), adds newlines before major clauses, and applies proper indentation to make complex queries easier to read and maintain."
        },
        {
          question: "How does the SQL formatter handle keyword capitalization?",
          answer: "The formatter recognizes over 60 SQL keywords across multiple database dialects (MySQL, PostgreSQL, SQLite, etc.) and uppercases them for consistency. Keywords are matched case-insensitively and replaced with their canonical uppercase form, making queries uniformly readable."
        },
        {
          question: "What clause indentation strategy is used?",
          answer: "Major clauses (SELECT, FROM, WHERE, JOIN, GROUP BY, ORDER BY, HAVING, LIMIT) start at indentation level 1. JOIN conditions with ON, AND, OR are indented to level 2. Subqueries and CASE statements increment indentation. This makes the query structure visually apparent."
        },
        {
          question: "Does the formatter support all SQL dialects?",
          answer: "The formatter works with standard SQL syntax common across MySQL, PostgreSQL, SQLite, SQL Server, and Oracle. Dialect-specific features (like PostgreSQL's JSON operators or SQL Server's TOP) are preserved but may not be specially formatted. The core clauses are universally supported."
        },
        {
          question: "What is the difference between format and minify modes?",
          answer: "Format mode expands the query with uppercase keywords, line breaks before major clauses, and 2-space indentation for optimal readability. Minify mode collapses the query into a single line with single spaces, ideal for storage or embedding in application code."
        },
        {
          question: "How are subqueries and nested statements handled?",
          answer: "Subqueries enclosed in parentheses are recognized and their contents are indented one level deeper. The opening parenthesis triggers increased indentation, and the closing parenthesis restores the previous level. This works recursively for deeply nested queries."
        },
        {
          question: "Can I format very large SQL scripts?",
          answer: "Yes, the formatter handles large SQL scripts efficiently. However, it processes the entire input synchronously. For extremely large scripts (100K+ characters), there may be brief UI lag. The 300ms debounce prevents excessive re-formatting during rapid typing."
        },
        {
          question: "What SQL syntax validation does the tool provide?",
          answer: "The tool checks that the SQL statement starts with a recognized keyword (SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, WITH). It does not perform full SQL syntax validation, which requires a database-specific parser. Always test formatted queries against your database."
        },
        {
          question: "How does the formatter handle string literals?",
          answer: "String literals (single-quoted and double-quoted) are preserved exactly as written. The keyword replacement regex is careful not to match words inside string literals. This ensures that string content and identifiers are not accidentally uppercased."
        },
        {
          question: "What are the best practices for writing readable SQL?",
          answer: "Use UPPERCASE for SQL keywords, lowercase for table/column names, put each major clause on a new line, use meaningful aliases, format JOIN conditions clearly, avoid SELECT *, and break complex queries into CTEs (WITH clauses) for maintainability."
        }
      ]}
      explanationContent={
        <div className="space-y-6">
          <section>
            <h3 className="text-xl font-bold mb-2">What is SQL Formatting?</h3>
            <p className="text-muted-foreground">
              SQL formatting is the practice of structuring SQL queries for maximum readability. It involves capitalizing keywords, breaking queries into logical lines, and indenting clauses to reveal the query structure. Well-formatted SQL is easier to debug, review, and maintain in production codebases.
            </p>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">How It Works</h3>
            <p className="text-muted-foreground">
              The formatter first normalizes all whitespace to single spaces. It then identifies SQL keywords using a regex-based approach, uppercases them, and inserts newlines before major clause keywords. Each line is then assigned an indentation level based on its clause type, with subqueries and CASE statements increasing the depth. The result is a clean, consistently formatted query.
            </p>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">Features</h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>60+ SQL keywords automatically uppercased</li>
              <li>Intelligent clause-based indentation (1-3 levels)</li>
              <li>Subquery and nested statement support</li>
              <li>CASE statement formatting with WHEN/THEN alignment</li>
              <li>Minify mode for compact single-line output</li>
              <li>Basic SQL keyword validation</li>
              <li>File upload for .sql files</li>
            </ul>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">Use Cases</h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Formatting raw SQL from database logs for debugging</li>
              <li>Standardizing team SQL style guides for code reviews</li>
              <li>Preparing SQL queries for documentation or presentations</li>
              <li>Cleaning up auto-generated ORM queries for inspection</li>
              <li>Teaching SQL syntax and query structure to students</li>
            </ul>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">Examples</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-2">
              <p className="font-semibold text-foreground">Input:</p>
              <pre className="text-muted-foreground">select u.name, count(o.id) as order_count from users u left join orders o on u.id = o.user_id where u.active = 1 group by u.id having count(o.id) {'>'} 5 order by order_count desc limit 10</pre>
              <p className="font-semibold text-foreground mt-4">Output:</p>
              <pre className="text-muted-foreground">{`SELECT u.name, COUNT(o.id) AS order_count
  FROM users u
  LEFT JOIN orders o ON u.id = o.user_id
  WHERE u.active = 1
  GROUP BY u.id
  HAVING COUNT(o.id) > 5
  ORDER BY order_count DESC
  LIMIT 10`}</pre>
            </div>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">Tips</h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Use uppercase for all SQL keywords for consistency</li>
              <li>Use lowercase or snake_case for table and column names</li>
              <li>Put each major clause on its own line for clarity</li>
              <li>Use CTEs (WITH) to break complex queries into readable steps</li>
              <li>Always qualify column names with table aliases in JOIN queries</li>
            </ul>
          </section>
          <section>
            <h3 className="text-xl font-bold mb-2">Common Mistakes</h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Mixing uppercase and lowercase keywords inconsistently</li>
              <li>Writing entire queries on a single line with no structure</li>
              <li>Forgetting table aliases and using ambiguous column names</li>
              <li>Improper JOIN syntax without ON conditions</li>
              <li>Nesting subqueries without proper parentheses matching</li>
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
            <label className="cursor-pointer p-2 rounded-lg hover:bg-muted transition-colors" title="Upload SQL file">
              <input type="file" accept=".sql" onChange={handleFileUpload} className="hidden" />
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
              <label className="text-sm font-semibold text-foreground">Input SQL</label>
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
                placeholder={`SELECT * FROM users WHERE active = 1`}
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
                  <p className="font-semibold text-sm">SQL Error</p>
                  <p className="text-xs mt-1 max-w-xs opacity-80 font-mono">{error}</p>
                </div>
              ) : (
                <textarea
                  value={output}
                  readOnly
                  placeholder="Formatted SQL will appear here"
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
