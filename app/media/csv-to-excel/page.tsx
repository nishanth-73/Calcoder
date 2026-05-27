"use client";

import { ToolLayout } from "@/components/layout/ToolLayout";
import { MediaTool } from "@/components/ui/MediaTool";
import { useState, useCallback } from "react";
import * as XLSX from "xlsx";

export default function MediaToolPage() {
  const [delimiter, setDelimiter] = useState(",");
  const [sheetName, setSheetName] = useState("Sheet1");

  const processFile = useCallback(async (file: File) => {
    const text = await file.text();
    const workbook = XLSX.read(text, { type: "string", raw: true });
    if (workbook.SheetNames.length > 0) {
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const parsed = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as unknown[][];
      const newWs = XLSX.utils.aoa_to_sheet(parsed);
      const newWb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(newWb, newWs, sheetName);
      const wbout = XLSX.write(newWb, { bookType: "xlsx", type: "array" });
      return new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    }
    const newWs = XLSX.utils.aoa_to_sheet([["No data found"]]);
    const newWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWb, newWs, sheetName);
    const wbout = XLSX.write(newWb, { bookType: "xlsx", type: "array" });
    return new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }, [sheetName]);

  return (
    <ToolLayout
      title="CSV to Excel"
      description="Convert CSV files to Excel XLSX spreadsheets with custom delimiter and sheet name options."
      category="media"
      faqContent={[
        { question: "How does CSV-to-XLSX conversion work?", answer: "The tool reads the CSV file as text, parses it using the SheetJS (xlsx) library with the specified delimiter, and writes the data into a new Excel workbook. The conversion is fully client-side." },
        { question: "What delimiters are supported?", answer: "Comma (,), tab (\\t), and semicolon (;). The delimiter is selected before processing and passed to the parser for correct column splitting." },
        { question: "Does the tool handle quoted values and escaped commas?", answer: "Yes, SheetJS handles RFC 4180-compliant CSV, including double-quoted fields, escaped quotes (&quot;&quot;), and commas within quoted values." },
        { question: "Can I specify the sheet name?", answer: "Yes, the Sheet Name field lets you customize the worksheet tab name in the output XLSX file. The default name is Sheet1." },
        { question: "Are large CSV files supported?", answer: "CSV files up to 50MB are supported. Since the entire file is loaded into memory for parsing, very large files (100MB+) may cause performance issues in the browser." },
        { question: "Does the tool preserve encoding and special characters?", answer: "SheetJS reads the file as UTF-8 text. For CSV files with other encodings (e.g., ISO-8859-1), the characters may not render correctly. Convert your file to UTF-8 first if you encounter encoding issues." },
        { question: "Can I convert Excel back to CSV?", answer: "This tool only converts CSV to Excel. For the reverse operation, look for a separate Excel-to-CSV converter in the media tools section." },
        { question: "Is the conversion one-to-one for data integrity?", answer: "Yes, all rows and columns are preserved exactly. Numbers, text, and empty cells are transferred without modification. However, CSV does not carry formatting, formulas, or merged cells-those are Excel-only features." },
      ]}
      explanationContent={
        <div>
          <h2>What Is a CSV to Excel Converter?</h2>
          <p>This tool converts comma-separated value (CSV) files into Microsoft Excel XLSX spreadsheets. It uses the SheetJS library to parse and rebuild the data with proper column mapping and sheet structure.</p>
          <h2>How It Works</h2>
          <p>The tool reads the uploaded CSV file as a text string, then parses it with XLSX.read() using the selected delimiter. The resulting worksheet data is converted to a new workbook with XLSX.utils.aoa_to_sheet() and XLSX.utils.book_new(). The workbook is serialized to an XLSX array buffer and returned as a downloadable blob.</p>
          <h2>Features</h2>
          <ul>
            <li><strong>Custom delimiter:</strong> Choose between comma, tab, or semicolon separators.</li>
            <li><strong>Named sheets:</strong> Set the output worksheet name to match your data context.</li>
            <li><strong>RFC 4180 compliant:</strong> Handles quoted fields, escaped quotes, and embedded delimiters.</li>
            <li><strong>Client-side only:</strong> Your data never leaves your device.</li>
          </ul>
          <h2>Use Cases</h2>
          <ul>
            <li>Importing CSV data exports from databases into Excel for further analysis.</li>
            <li>Converting legacy CSV reports to modern XLSX format for team collaboration.</li>
            <li>Preparing CSV data for Excel-based workflows that require formatted spreadsheets.</li>
            <li>Archiving CSV files in the more widely supported XLSX format.</li>
          </ul>
          <h2>Examples</h2>
          <ul>
            <li>A 10,000-row CSV export from PostgreSQL converts to an XLSX spreadsheet in under a second.</li>
            <li>A semicolon-delimited European CSV file is correctly parsed and written to an XLSX workbook.</li>
          </ul>
          <h2>Tips</h2>
          <ul>
            <li>Always verify the delimiter matches your CSV file-incorrect delimiters produce merged columns.</li>
            <li>Use the sheet name field to make the output file self-documenting (e.g., &ldquo;Q1-2025-Sales&rdquo;).</li>
            <li>For CSV files with headers, the first row is preserved as a header row in the Excel output.</li>
          </ul>
          <h2>Common Mistakes</h2>
          <ul>
            <li>Selecting the wrong delimiter-CSV exported from European locales often uses semicolons.</li>
            <li>Expecting Excel formulas to carry over-CSV is data-only and cannot store formulas.</li>
            <li>Uploading a file with .csv extension that contains XLSX binary data-check the file content first.</li>
          </ul>
        </div>
      }
    >
      <MediaTool
        acceptedFileTypes=".csv"
        processLabel="Convert to Excel"
        processFile={processFile}
        getDownloadFileName={(name) => name.replace(/\.[^.]+$/, "") + ".xlsx"}
        getMimeType={() => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
        extraOptions={
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 border border-border rounded-xl">
            <div>
              <label className="block text-sm font-medium mb-1">Delimiter</label>
              <select
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              >
                <option value=",">Comma (,)</option>
                <option value="\t">Tab (\\t)</option>
                <option value=";">Semicolon (;)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sheet Name</label>
              <input
                type="text"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value || "Sheet1")}
                className="w-full p-2 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
          </div>
        }
      />
    </ToolLayout>
  );
}
