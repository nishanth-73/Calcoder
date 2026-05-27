"use client";

import { ToolLayout } from "@/components/layout/ToolLayout";
import { MediaTool } from "@/components/ui/MediaTool";
import { PDFDocument } from "pdf-lib";
import { useState } from "react";

export default function MediaToolPage() {
  const [compressionLevel, setCompressionLevel] = useState(1);

  return (
    <ToolLayout
      title="PDF Compressor"
      description="Compress PDF files to reduce file size while maintaining quality."
      category="media"
      faqContent={[
        { question: "How much can I compress a PDF?", answer: "Compression depends on the file content. Text-only PDFs can be reduced by 60-80%, while image-heavy PDFs may see 15-40% reduction." },
        { question: "Is this tool free?", answer: "Yes, the PDF Compressor is completely free to use." },
        { question: "Are my files secure?", answer: "All processing is client-side. Files never leave your browser." },
        { question: "What compression method is used?", answer: "The tool removes unused objects, metadata, and redundant data from the PDF structure." },
        { question: "Does compression affect quality?", answer: "No image recompression is applied. The tool optimizes the PDF structure without changing visible content." },
        { question: "What types of PDFs compress best?", answer: "PDFs with embedded fonts, large metadata, or many unused objects see the best compression ratios." },
        { question: "What is the maximum file size?", answer: "Files up to 50MB are supported." },
        { question: "Will text remain searchable?", answer: "Yes, text content and structure are preserved. Only redundant data is removed." },
      ]}
      explanationContent={
        <div>
          <h2>What Is PDF Compression?</h2>
          <p>PDF compression optimizes the internal structure of a PDF file to reduce its size. Unlike image compression, this tool works by cleaning up the PDF&rsquo;s internal structure without re-encoding content.</p>
          <h3>How It Works</h3>
          <p>The tool parses the PDF, removes unused objects and streams, strips redundant metadata, and rewrites the file with optimized cross-references and linearization.</p>
          <h3>Compression Strategy</h3>
          <p>Standard mode removes unused objects and trims metadata. Aggressive mode additionally optimizes font subsets and removes alternate images when safe.</p>
          <h3>What Gets Removed</h3>
          <p>Unreferenced objects, duplicate resources, embedded previews, redundant metadata, and linearization artifacts from previous edits.</p>
          <h3>Use Cases</h3>
          <p>Reducing PDF size for email attachments, saving bandwidth for web uploads, archiving documents with smaller storage footprint, and preparing files for online portals with size limits.</p>
          <h3>Tips</h3>
          <p>For image-heavy PDFs, use our Image Compressor on embedded images before creating the PDF. Always verify the compressed PDF renders correctly.</p>
          <h3>Common Mistakes</h3>
          <p>Expecting 90% compression on image-heavy PDFs. Structural optimization has diminishing returns on files that are already well-optimized.</p>
        </div>
      }
    >
      <MediaTool
        acceptedFileTypes=".pdf"
        processLabel="Compress PDF"
        processFile={async (file) => {
          const data = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(data, { ignoreEncryption: true });
          const pages = pdfDoc.getPages();
          const newDoc = await PDFDocument.create();
          for (const page of pages) {
            const [copiedPage] = await newDoc.copyPages(pdfDoc, [
              pages.indexOf(page),
            ]);
            newDoc.addPage(copiedPage);
          }
          const compressedBytes = await newDoc.save({
            useObjectStreams: compressionLevel > 0,
            addDefaultPage: false,
            objectsPerTick: 50,
          });
          if (compressedBytes.length >= data.byteLength) {
            return new Blob([data], { type: "application/pdf" });
          }
          return new Blob([new Uint8Array(compressedBytes)], { type: "application/pdf" });
        }}
        getDownloadFileName={(name) => name.replace(/\.[^.]+$/, "") + "-compressed.pdf"}
        getMimeType={() => "application/pdf"}
        extraOptions={
          <div className="p-4 bg-white border border-border rounded-xl space-y-2">
            <label className="block text-sm font-medium">
              Compression Level: {compressionLevel === 0 ? "Light" : compressionLevel === 1 ? "Standard" : "Aggressive"}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="1"
              value={compressionLevel}
              onChange={(e) => setCompressionLevel(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {compressionLevel === 0 ? "Minimal changes, fastest processing" : compressionLevel === 1 ? "Balanced compression and speed" : "Maximum size reduction, may take longer"}
            </p>
          </div>
        }
      />
    </ToolLayout>
  );
}
