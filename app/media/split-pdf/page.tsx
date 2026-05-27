"use client";

import { ToolLayout } from "@/components/layout/ToolLayout";
import { MediaTool } from "@/components/ui/MediaTool";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

export default function MediaToolPage() {
  return (
    <ToolLayout
      title="Split PDF"
      description="Split a PDF into separate pages, each saved as an individual PDF."
      category="media"
      faqContent={[
        { question: "How does PDF splitting work?", answer: "Each page of your PDF becomes a separate PDF file. All pages are packaged into a ZIP archive for easy download." },
        { question: "Is this tool free?", answer: "Yes, splitting PDFs is completely free." },
        { question: "Are my files secure?", answer: "Processing is done entirely in your browser." },
        { question: "How many pages can I split?", answer: "PDFs with up to 200 pages are supported." },
        { question: "What format are the output files?", answer: "Each page is saved as a separate PDF file, preserving all original formatting and content." },
        { question: "How are the files delivered?", answer: "All split pages are packaged into a single ZIP file for convenient download." },
        { question: "Can I select specific pages?", answer: "Currently, all pages are extracted. Page range selection is coming soon." },
        { question: "Will the quality be preserved?", answer: "Yes, each page PDF is an exact copy of the original page with no quality loss." },
      ]}
      explanationContent={
        <div>
          <h2>What Is PDF Splitting?</h2>
          <p>PDF splitting extracts each page from a PDF document and saves it as an individual PDF file. This is useful when you need to separate a multi-page document into single-page files.</p>
          <h3>How It Works</h3>
          <p>The tool loads your PDF using pdf-lib, iterates through every page, and creates a new PDF document containing only that single page. All pages are then packaged into a ZIP file for download.</p>
          <h3>Page Preservation</h3>
          <p>Each extracted page retains its original formatting, fonts, images, vector graphics, and page dimensions. Nothing is lost in the splitting process.</p>
          <h3>Use Cases</h3>
          <p>Extracting individual pages from a scanned document, separating invoice pages for individual filing, dividing a large report into single-page handouts, and splitting a portfolio into separate works.</p>
          <h3>File Naming</h3>
          <p>Each split page is named using the original filename with a page number suffix (e.g., document-page-1.pdf, document-page-2.pdf).</p>
          <h3>Tips</h3>
          <p>To split only specific pages, use our Rotate PDF tool to rearrange pages first, then split. For large documents, be aware that a 200-page PDF will produce 200 individual files.</p>
          <h3>Common Mistakes</h3>
          <p>Opening a split file directly from the ZIP without extracting it first. Always extract the ZIP contents to access the individual PDFs.</p>
        </div>
      }
    >
      <MediaTool
        acceptedFileTypes=".pdf"
        processLabel="Split PDF"
        processFile={async (file) => {
          const data = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(data, { ignoreEncryption: true });
          const pages = pdfDoc.getPages();
          if (pages.length > 200) throw new Error("PDF exceeds maximum of 200 pages");
          if (pages.length === 1) throw new Error("PDF has only one page, nothing to split");
          const zip = new JSZip();
          for (let i = 0; i < pages.length; i++) {
            const newDoc = await PDFDocument.create();
            const [copiedPage] = await newDoc.copyPages(pdfDoc, [i]);
            newDoc.addPage(copiedPage);
            const pageBytes = await newDoc.save();
            const baseName = file.name.replace(/\.[^.]+$/, "");
            zip.file(`${baseName}-page-${i + 1}.pdf`, pageBytes);
          }
          return zip.generateAsync({ type: "blob" });
        }}
        getDownloadFileName={(name) => name.replace(/\.[^.]+$/, "") + "-split.zip"}
        getMimeType={() => "application/zip"}
      />
    </ToolLayout>
  );
}
