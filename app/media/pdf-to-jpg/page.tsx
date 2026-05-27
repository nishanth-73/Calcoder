"use client";

import { ToolLayout } from "@/components/layout/ToolLayout";
import { MediaTool } from "@/components/ui/MediaTool";
import JSZip from "jszip";

function getPageFilename(name: string, pageIndex: number): string {
  const base = name.replace(/\.[^.]+$/, "");
  return `${base}-page-${pageIndex}.jpg`;
}

export default function MediaToolPage() {
  return (
    <ToolLayout
      title="PDF to JPG"
      description="Convert PDF pages to high-quality JPG images."
      category="media"
      faqContent={[
        { question: "How do I convert PDF to JPG?", answer: "Upload your PDF and click convert. Each page is rendered as a separate high-quality JPG image." },
        { question: "Is this tool free?", answer: "Yes, it is completely free with no limits on pages or file size." },
        { question: "Are my files secure?", answer: "All processing is client-side. Your files never leave your browser." },
        { question: "What is the output quality?", answer: "Pages are rendered at 2x resolution (144 DPI) for sharp, high-quality JPG images." },
        { question: "How are the files delivered?", answer: "All page images are packaged into a single ZIP file for easy download." },
        { question: "What PDFs can be converted?", answer: "Any standard PDF document works. Scanned PDFs and text-based PDFs are both supported." },
        { question: "What is the maximum page count?", answer: "PDFs with up to 100 pages are supported to ensure reasonable processing time." },
        { question: "Do I need any software?", answer: "No software needed. Everything runs in your browser." },
      ]}
      explanationContent={
        <div>
          <h2>What Is PDF to JPG?</h2>
          <p>PDF to JPG converts each page of your PDF document into a separate JPG image. It uses the PDF.js rendering engine to produce crisp, high-resolution images directly in your browser.</p>
          <h3>How It Works</h3>
          <p>Each page is rendered to a canvas at 2x scale for retina-quality output. The canvas is then exported as a JPG with 92% quality, balancing file size and image fidelity.</p>
          <h3>Image Quality</h3>
          <p>The tool renders at 144 DPI (2x standard screen resolution), producing print-worthy images. The JPG quality setting of 92% preserves fine details while keeping file sizes manageable.</p>
          <h3>Use Cases</h3>
          <p>Extracting pages as images for presentations, sharing document pages on social media, creating thumbnails, archiving document pages as photos, and extracting graphics from PDFs.</p>
          <h3>Batch Processing</h3>
          <p>All pages are processed and packaged into a single ZIP archive automatically. Each image is named with the original filename and page number.</p>
          <h3>Tips</h3>
          <p>For text-heavy PDFs, consider using PDF to Word instead for editable text output. For best image quality, use source PDFs with at least 150 DPI content.</p>
          <h3>Common Mistakes</h3>
          <p>Very large PDFs with many pages may take time to process. The scale factor can be adjusted for faster processing at lower quality if needed.</p>
        </div>
      }
    >
      <MediaTool
        acceptedFileTypes=".pdf"
        processLabel="Convert to JPG"
        processFile={async (file) => {
          const pdfjsLib = await import("pdfjs-dist");
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${"5.7.284"}/build/pdf.worker.min.mjs`;
          const data = await file.arrayBuffer();
          const pdfDoc = await pdfjsLib.getDocument({ data }).promise;
          if (pdfDoc.numPages > 100) throw new Error("PDF exceeds maximum of 100 pages");
          const zip = new JSZip();
          for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext("2d")!;
            const fill = ctx.createLinearGradient(0, 0, 0, viewport.height);
            fill.addColorStop(0, "#ffffff");
            fill.addColorStop(1, "#ffffff");
            ctx.fillStyle = fill;
            ctx.fillRect(0, 0, viewport.width, viewport.height);
            await page.render({ canvas: canvas, canvasContext: ctx, viewport }).promise;
            const blob = await new Promise<Blob | null>((resolve) =>
              canvas.toBlob(resolve, "image/jpeg", 0.92)
            );
            if (blob) zip.file(getPageFilename(file.name, i), blob);
          }
          return zip.generateAsync({ type: "blob" });
        }}
        getDownloadFileName={(name) => name.replace(/\.[^.]+$/, "") + "-images.zip"}
        getMimeType={() => "application/zip"}
      />
    </ToolLayout>
  );
}
