"use client";

import { ToolLayout } from "@/components/layout/ToolLayout";
import { MediaTool } from "@/components/ui/MediaTool";
import { jsPDF } from "jspdf";
import JSZip from "jszip";

async function extractDocxText(file: File): Promise<string> {
  const data = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(data);
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw new Error("Invalid .docx file: missing word/document.xml");
  const xmlText = await docFile.async("string");
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  const paragraphs = xmlDoc.getElementsByTagNameNS(
    "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "p"
  );
  const textParts: string[] = [];
  for (const para of Array.from(paragraphs)) {
    const textRuns = para.getElementsByTagNameNS(
      "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
      "t"
    );
    const paraText = Array.from(textRuns)
      .map((t) => t.textContent || "")
      .join("");
    if (paraText.trim()) textParts.push(paraText);
  }
  return textParts.join("\n\n");
}

export default function MediaToolPage() {
  return (
    <ToolLayout
      title="Word to PDF"
      description="Convert Word documents to PDF format with preserved formatting."
      category="media"
      faqContent={[
        { question: "How to convert Word to PDF?", answer: "Upload your Word document (.docx) and click convert. The text is extracted and rendered as a clean PDF." },
        { question: "Is this tool free?", answer: "Yes, this tool is completely free." },
        { question: "Are my files secure?", answer: "All processing happens in your browser. Files never leave your device." },
        { question: "What Word formats are supported?", answer: "The tool supports .docx files (Word 2007 and later). Older .doc files may not be compatible." },
        { question: "Is formatting preserved?", answer: "Text content and paragraph structure are preserved. Advanced formatting like tables and images are not rendered." },
        { question: "What font is used?", answer: "The PDF uses a standard embedded font (Helvetica) for consistent rendering across devices." },
        { question: "What is the maximum file size?", answer: "Word documents up to 50MB are supported." },
        { question: "Can I convert password-protected files?", answer: "Password-protected .docx files are not supported at this time." },
      ]}
      explanationContent={
        <div>
          <h2>What Is Word to PDF?</h2>
          <p>Word to PDF converts Word documents into universally compatible PDF files. The tool extracts text from your .docx file and renders it as a clean, print-ready PDF.</p>
          <h3>How It Works</h3>
          <p>The .docx file is a ZIP archive containing XML. The tool extracts the main document XML, parses it to find all text paragraphs, and renders them in a PDF using jsPDF with automatic page breaks.</p>
          <h3>Text Extraction</h3>
          <p>All text content from the Word document is extracted, preserving paragraph breaks and text order. Each paragraph becomes a line in the PDF document.</p>
          <h3>Use Cases</h3>
          <p>Converting Word documents to PDF for universal sharing, preparing documents for printing, creating PDF archives of Word files, and submitting documents in the universally accepted PDF format.</p>
          <h3>Limitations</h3>
          <p>Images, tables, headers, footers, and complex formatting are not rendered. For full-fidelity conversion, consider using Microsoft Word or Google Docs built-in export.</p>
          <h3>Tips</h3>
          <p>For best results, ensure your Word document uses simple paragraph-based formatting. Review the output PDF to verify all text was captured correctly.</p>
          <h3>Common Mistakes</h3>
          <p>Uploading .doc files instead of .docx. Older Word formats are not ZIP-based and cannot be parsed. Convert your .doc to .docx first using Word or Google Docs.</p>
        </div>
      }
    >
      <MediaTool
        acceptedFileTypes=".docx"
        processLabel="Convert to PDF"
        processFile={async (file) => {
          const text = await extractDocxText(file);
          const pdf = new jsPDF({ unit: "pt", format: "a4" });
          const margin = 56;
          const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
          let y = margin;
          const lineHeight = 16;
          const fontSize = 12;
          pdf.setFontSize(fontSize);
          const lines = text.split("\n");
          for (const line of lines) {
            if (line.trim() === "") {
              y += lineHeight;
              continue;
            }
            const wrappedLines = pdf.splitTextToSize(line, pageWidth);
            for (const wrapped of wrappedLines) {
              if (y + lineHeight > pdf.internal.pageSize.getHeight() - margin) {
                pdf.addPage();
                y = margin;
              }
              pdf.text(wrapped, margin, y);
              y += lineHeight;
            }
          }
          return pdf.output("blob");
        }}
        getDownloadFileName={(name) => name.replace(/\.[^.]+$/, "") + ".pdf"}
        getMimeType={() => "application/pdf"}
      />
    </ToolLayout>
  );
}
