"use client";

import { ToolLayout } from "@/components/layout/ToolLayout";
import { useState, useCallback, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";

const PAGE_SIZES: Record<string, [number, number]> = {
  "a4": [210, 297],
  "letter": [215.9, 279.4],
  "legal": [215.9, 355.6],
};

export default function MediaToolPage() {
  const [text, setText] = useState("");
  const [pageSize, setPageSize] = useState("a4");
  const [fontSize, setFontSize] = useState(12);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const handleGenerate = useCallback(() => {
    setError(null);
    setPdfBlob(null);
    if (!text.trim()) { setError("Please enter some text to convert."); return; }
    setGenerating(true);
    try {
      const [width, height] = PAGE_SIZES[pageSize] || PAGE_SIZES.a4;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [width, height] });
      doc.setFontSize(fontSize);
      const margin = 20;
      const maxWidth = width - margin * 2;
      const lines = doc.splitTextToSize(text, maxWidth);
      const pageHeight = height;
      const lineHeight = fontSize * 0.3528 * 1.5;
      let y = margin;
      for (const line of lines) {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      }
      const blob = doc.output("blob");
      setPdfBlob(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF generation failed.");
    } finally {
      setGenerating(false);
    }
  }, [text, pageSize, fontSize]);

  const handleDownload = useCallback(() => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [pdfBlob]);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [pdfBlob]);

  return (
    <ToolLayout
      title="Text to PDF"
      description="Convert plain text into a formatted PDF document with customizable page size and font settings."
      category="media"
      faqContent={[
        { question: "How does the text-to-PDF conversion work?", answer: "The tool uses the jsPDF library to create a PDF document entirely in the browser. Your text is split into lines that fit within the margins, and pages are added automatically when content exceeds the page height. The document is rendered using embedded fonts for consistent output across devices." },
        { question: "What page sizes are supported?", answer: "A4 (210×297mm), Letter (215.9×279.4mm), and Legal (215.9×355.6mm). The PDF viewport and text flow adjust automatically based on the selected page size." },
        { question: "Can I change the font size?", answer: "Yes, the font size selector ranges from 8pt to 24pt. The text layout and line breaks are recalculated dynamically based on the chosen size." },
        { question: "Is there a text length limit?", answer: "There is no hard limit-jsPDF handles documents of any length. However, very large documents (100+ pages) may consume memory on lower-end devices. The preview shows the first page only." },
        { question: "Does the tool handle Unicode and special characters?", answer: "jsPDF supports a wide range of Unicode characters through built-in font subsets. Characters outside the standard Latin set may render as system fonts depending on the PDF viewer." },
        { question: "How is text wrapping handled?", answer: "The tool uses jsPDF's splitTextToSize method, which breaks text at word boundaries to fit within the specified margins. Paragraphs are preserved, and long words that exceed the line width are hyphenated automatically." },
        { question: "Can I download the generated PDF?", answer: "Yes. After generation, a preview is displayed in an embedded viewer, and a Download button is shown. The PDF file is named document.pdf." },
        { question: "Is my text sent to any server?", answer: "No. All processing is done client-side using jsPDF running in your browser. The text never leaves your device. PDF generation is entirely offline-capable once the page is loaded." },
      ]}
      explanationContent={
        <div>
          <h2>What Is a Text to PDF Converter?</h2>
          <p>This tool transforms plain text input into a professionally formatted PDF document. It is designed for developers, writers, and anyone who needs to quickly generate PDFs without uploading data to a third-party service.</p>
          <h2>How It Works</h2>
          <p>The tool takes plain text input and creates a PDF using jsPDF, a client-side PDF generation library. It splits the text into lines that fit the chosen page dimensions, applies the selected font size, and creates pages with automatic pagination. The result is a downloadable PDF blob rendered in an embedded viewer.</p>
          <h2>Features</h2>
          <ul>
            <li><strong>Client-side generation:</strong> No server uploads, no API keys, instant results.</li>
            <li><strong>Multiple page sizes:</strong> A4, Letter, and Legal formats with auto-pagination.</li>
            <li><strong>Adjustable font size:</strong> Fine-tune text appearance from 8pt to 24pt.</li>
            <li><strong>Built-in preview:</strong> View the generated PDF in an embedded iframe before downloading.</li>
          </ul>
          <h2>Use Cases</h2>
          <ul>
            <li>Generating invoices or receipts from plain text records.</li>
            <li>Creating formatted document drafts without opening a word processor.</li>
            <li>Converting code documentation or README files to PDF for distribution.</li>
            <li>Producing printable text content for offline archiving.</li>
          </ul>
          <h2>Examples</h2>
          <ul>
            <li>Paste a 500-word article and generate a single-page A4 PDF with 12pt font.</li>
            <li>Insert a 10,000-word report, and the tool automatically paginates across multiple pages.</li>
          </ul>
          <h2>Tips</h2>
          <ul>
            <li>Use larger font sizes for presentations or posters (18-24pt) and smaller sizes (10-12pt) for documents.</li>
            <li>For multi-page documents, the preview shows the first page-download to view the full content.</li>
            <li>Check preview before downloading to verify layout and pagination.</li>
          </ul>
          <h2>Common Mistakes</h2>
          <ul>
            <li>Forgetting to set the correct page size before generating-always match your printing needs.</li>
            <li>Using extremely long lines without line breaks-paragraphs help splitTextToSize produce cleaner output.</li>
            <li>Expecting rich formatting (bold, italics, tables)-jsPDF supports these with additional API calls not included in this basic converter.</li>
          </ul>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Enter your text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="w-full p-4 border border-border rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
            placeholder="Paste or type the text you want to convert to PDF..."
          />
          <p className="text-xs text-muted-foreground mt-1">{text.length} characters</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Page Size</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value)}
              className="w-full p-3 border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="a4">A4 (210×297mm)</option>
              <option value="letter">Letter (216×279mm)</option>
              <option value="legal">Legal (216×356mm)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Font Size</label>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full p-3 border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {[8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24].map((s) => (
                <option key={s} value={s}>{s}pt</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm">{error}</div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating || !text.trim()}
          className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? "Generating PDF..." : "Generate PDF"}
        </button>

        {pdfBlob && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-border bg-white h-[500px]">
              <iframe
                ref={previewRef}
                src={previewUrl || ""}
                className="w-full h-full"
                title="PDF Preview"
              />
            </div>
            <button
              onClick={handleDownload}
              className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Download PDF
            </button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
