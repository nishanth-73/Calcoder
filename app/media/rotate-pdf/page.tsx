"use client";

import { ToolLayout } from "@/components/layout/ToolLayout";
import { MediaTool } from "@/components/ui/MediaTool";
import { PDFDocument, degrees } from "pdf-lib";
import { useState } from "react";

export default function MediaToolPage() {
  const [rotation, setRotation] = useState(90);

  return (
    <ToolLayout
      title="Rotate PDF"
      description="Rotate PDF pages to the correct orientation."
      category="media"
      faqContent={[
        { question: "Can I rotate PDF pages?", answer: "Yes, upload your PDF and choose a rotation angle. All pages will be rotated instantly." },
        { question: "Is this tool free?", answer: "Yes, rotating PDF pages is completely free." },
        { question: "Are my files secure?", answer: "Files are processed locally in your browser." },
        { question: "What rotation angles are supported?", answer: "You can rotate pages 90 degrees clockwise, 180 degrees, or 90 degrees counter-clockwise." },
        { question: "Can I rotate specific pages?", answer: "Currently, all pages are rotated. Per-page rotation selection is coming soon." },
        { question: "Will the content be affected?", answer: "No, only the page orientation changes. All content, text, and images remain intact." },
        { question: "What is the maximum file size?", answer: "PDFs up to 50MB are supported." },
        { question: "Can I undo a rotation?", answer: "Simply rotate the PDF again in the opposite direction to return to the original orientation." },
      ]}
      explanationContent={
        <div>
          <h2>What Is PDF Rotation?</h2>
          <p>PDF rotation changes the orientation of pages in a PDF document. This is useful for correcting scanned pages that were uploaded upside down or in the wrong orientation.</p>
          <h3>How It Works</h3>
          <p>The tool loads your PDF using pdf-lib and applies a rotation transformation to each page. The rotation is applied as a page-level transformation, so all content on the page rotates together.</p>
          <h3>Rotation Angles</h3>
          <p>90 degrees clockwise rotates pages to the right. 180 degrees flips pages upside down. 90 degrees counter-clockwise rotates pages to the left.</p>
          <h3>Use Cases</h3>
          <p>Correcting scanned documents that were loaded upside down, rotating landscape pages in a portrait document, fixing smartphone-scanned receipts, and preparing pages for consistent reading orientation.</p>
          <h3>Preservation</h3>
          <p>All content, including text, images, annotations, and form fields, is preserved during rotation. No data is lost or modified beyond the page orientation.</p>
          <h3>Tips</h3>
          <p>View the preview before processing to confirm the current orientation. For mixed-orientation documents, process them in multiple passes if needed.</p>
          <h3>Common Mistakes</h3>
          <p>Rotating the wrong direction. Use 90 degrees clockwise for correcting pages that appear rotated to the left, and 90 degrees counter-clockwise for pages rotated to the right.</p>
        </div>
      }
    >
      <MediaTool
        acceptedFileTypes=".pdf"
        processLabel="Rotate PDF"
        processFile={async (file) => {
          const data = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(data, { ignoreEncryption: true });
          const pages = pdfDoc.getPages();
          for (const page of pages) {
            page.setRotation(degrees(page.getRotation().angle + rotation));
          }
          const bytes = await pdfDoc.save();
          return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
        }}
        getDownloadFileName={(name) => name.replace(/\.[^.]+$/, "") + "-rotated.pdf"}
        getMimeType={() => "application/pdf"}
        extraOptions={
          <div className="p-4 bg-white border border-border rounded-xl">
            <label className="block text-sm font-medium mb-2">Rotation Angle</label>
            <select
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full p-2 bg-white border border-border rounded-lg text-sm"
            >
              <option value={90}>90° Clockwise</option>
              <option value={180}>180°</option>
              <option value={270}>90° Counter-Clockwise</option>
            </select>
          </div>
        }
      />
    </ToolLayout>
  );
}
