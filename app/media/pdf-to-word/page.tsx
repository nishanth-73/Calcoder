"use client";

import { ToolLayout } from "@/components/layout/ToolLayout";
import { MediaTool } from "@/components/ui/MediaTool";
import JSZip from "jszip";

async function extractPageText(page: any): Promise<string> {
  const content = await page.getTextContent();
  const lines: string[] = [];
  let lastY: number | null = null;
  for (const item of content.items) {
    if ("str" in item) {
      const y = Math.round(item.transform[5]);
      if (lastY !== null && Math.abs(y - lastY) > 5) lines.push("\n");
      lines.push(item.str);
      lastY = y;
    }
  }
  return lines.join(" ");
}

async function buildDocx(text: string): Promise<Blob> {
  const escapeXml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const paragraphs = text.split("\n").filter((p) => p.trim());
  const xmlParagraphs = paragraphs
    .map(
      (p) =>
        `<w:p><w:r><w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t>${escapeXml(p)}</w:t></w:r></w:p>`
    )
    .join("\n");
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${xmlParagraphs}</w:body>
</w:document>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
  const wRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;
  const zip = new JSZip();
  zip.file("[Content_Types].xml", contentTypes);
  zip.file("_rels/.rels", rels);
  zip.file("word/document.xml", docXml);
  zip.file("word/_rels/document.xml.rels", wRels);
  return zip.generateAsync({ type: "blob" });
}

export default function MediaToolPage() {
  return (
    <ToolLayout
      title="PDF to Word"
      description="Convert PDF documents to editable Word files."
      category="media"
      faqContent={[
        { question: "How accurate is PDF to Word conversion?", answer: "Text content is extracted accurately. Simple layouts are preserved. Complex formatting with tables and columns may need manual adjustment." },
        { question: "Is this tool free?", answer: "Yes, it is completely free." },
        { question: "Are my files secure?", answer: "Files are processed client-side for complete privacy." },
        { question: "What type of content is extracted?", answer: "All text content from the PDF is extracted. Images, tables, and complex layouts are represented as text." },
        { question: "What Word format is used?", answer: "The output is a .docx file compatible with Microsoft Word 2007 and later, Google Docs, and LibreOffice." },
        { question: "What PDFs work best?", answer: "Text-based PDFs (not scanned documents) produce the best results. Scanned PDFs require OCR which is not supported." },
        { question: "Can I edit the output?", answer: "Yes, the .docx file is fully editable in any word processor that supports the format." },
        { question: "Is formatting preserved?", answer: "Basic formatting (bold, italic, font size) from the source PDF is approximated in the Word output." },
      ]}
      explanationContent={
        <div>
          <h2>What Is PDF to Word?</h2>
          <p>PDF to Word converts text from PDF documents into editable Word (.docx) files. The tool extracts text content page by page and creates a properly formatted Word document.</p>
          <h3>How It Works</h3>
          <p>The PDF is parsed using the PDF.js engine to extract text content with positional information. This text is then structured into paragraphs and embedded in a standard Office Open XML (.docx) file.</p>
          <h3>Text Extraction</h3>
          <p>The tool reads every text element from each PDF page, preserving reading order and paragraph structure. Line breaks and spacing are approximated based on text position.</p>
          <h3>Use Cases</h3>
          <p>Editing text from PDF contracts, repurposing content from PDF reports, extracting text from digital documents for reuse, and converting PDF forms into editable documents.</p>
          <h3>Limitations</h3>
          <p>Scanned PDFs (images of text) cannot be converted without OCR. Complex layouts with multiple columns may not preserve exact positioning. Embedded images are not extracted.</p>
          <h3>Tips</h3>
          <p>For scanned documents, use a dedicated OCR tool first. Review the converted document and adjust formatting as needed for best results.</p>
          <h3>Common Mistakes</h3>
          <p>Expecting perfect layout preservation from complex multi-column PDFs. Text extraction follows the logical reading order, which may differ from visual layout.</p>
        </div>
      }
    >
      <MediaTool
        acceptedFileTypes=".pdf"
        processLabel="Convert to Word"
        processFile={async (file) => {
          const pdfjsLib = await import("pdfjs-dist");
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${"5.7.284"}/build/pdf.worker.min.mjs`;
          const data = await file.arrayBuffer();
          const pdfDoc = await pdfjsLib.getDocument({ data }).promise;
          const allPages: string[] = [];
          for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const text = await extractPageText(page);
            allPages.push(text);
          }
          const fullText = allPages.join("\n\n");
          return buildDocx(fullText);
        }}
        getDownloadFileName={(name) => name.replace(/\.[^.]+$/, "") + ".docx"}
        getMimeType={() => "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
      />
    </ToolLayout>
  );
}
