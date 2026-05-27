"use client";

import { ToolLayout } from "@/components/layout/ToolLayout";
import { MediaTool } from "@/components/ui/MediaTool";
import { PDFDocument } from "pdf-lib";
import { useState, useRef } from "react";

export default function MediaToolPage() {
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const addExtraFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = 10 - extraFiles.length;
    const toAdd = Array.from(files).slice(0, remaining);
    setExtraFiles((prev) => [...prev, ...toAdd]);
    e.target.value = "";
  };

  const removeExtraFile = (index: number) => {
    setExtraFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <ToolLayout
      title="Merge PDF"
      description="Combine multiple PDF files into one unified document."
      category="media"
      faqContent={[
        { question: "How many PDFs can I merge?", answer: "You can merge up to 10 PDF files in a single operation." },
        { question: "Is this tool free?", answer: "Yes, merging PDFs is completely free with no limits." },
        { question: "Are my files secure?", answer: "All files stay on your device during processing." },
        { question: "What order are pages merged?", answer: "PDFs are merged in the order they are added. You can remove and re-add files to reorder them." },
        { question: "Will formatting be preserved?", answer: "Yes, each PDF retains its original formatting, fonts, and layout in the merged document." },
        { question: "What is the maximum file size?", answer: "Each individual PDF can be up to 50MB, with a total limit of 10 files." },
        { question: "Can I merge different page sizes?", answer: "Yes, PDFs with different page sizes are merged seamlessly. Each page retains its original dimensions." },
        { question: "Do the files need to be the same type?", answer: "Only PDF files are supported for merging." },
      ]}
      explanationContent={
        <div>
          <h2>What Is PDF Merging?</h2>
          <p>PDF merging combines multiple PDF documents into a single file. Each source document becomes a section of the output, preserving all content, formatting, and page sizes.</p>
          <h3>How It Works</h3>
          <p>The tool loads each PDF using the pdf-lib library and copies every page into a new document in the exact order specified. All embedded fonts, images, and vector graphics are preserved.</p>
          <h3>Merge Order</h3>
          <p>The first file uploaded is the primary file. Additional files are appended in the order they are added. The final merged PDF contains all pages from all files in sequence.</p>
          <h3>Use Cases</h3>
          <p>Combining multiple scanned documents into one file, merging report sections, consolidating invoice batches, creating compiled portfolios, and assembling e-book chapters.</p>
          <h3>Tips</h3>
          <p>To control page order, add files one at a time in your desired sequence. Remove and re-add files to change the order before processing.</p>
          <h3>Common Mistakes</h3>
          <p>Adding duplicate files accidentally. Check the file list before clicking merge. Merging very large files may take longer to process.</p>
        </div>
      }
    >
      <MediaTool
        acceptedFileTypes=".pdf"
        maxFileSize={50}
        processLabel="Merge PDFs"
        processFile={async (file) => {
          const allFiles = [file, ...extraFiles];
          if (allFiles.length < 2) throw new Error("Add at least 2 PDF files to merge");
          const mergedDoc = await PDFDocument.create();
          for (const f of allFiles) {
            const data = await f.arrayBuffer();
            const pdfDoc = await PDFDocument.load(data, { ignoreEncryption: true });
            const indices = pdfDoc.getPages().map((_, i) => i);
            const copiedPages = await mergedDoc.copyPages(pdfDoc, indices);
            for (const page of copiedPages) mergedDoc.addPage(page);
          }
          const bytes = await mergedDoc.save();
          return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
        }}
        getDownloadFileName={(name) => name.replace(/\.[^.]+$/, "") + "-merged.pdf"}
        getMimeType={() => "application/pdf"}
        extraOptions={
          <div className="space-y-3">
            <div className="p-4 bg-white border border-border rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">
                  Additional PDFs ({extraFiles.length}/10)
                </label>
                <button
                  onClick={() => inputRef.current?.click()}
                  disabled={extraFiles.length >= 10}
                  className="text-sm px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Add File
                </button>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={addExtraFile}
              />
              {extraFiles.length > 0 && (
                <ul className="space-y-1.5 mt-2">
                  {extraFiles.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                        {i + 2}
                      </span>
                      <span className="flex-1 truncate">{f.name}</span>
                      <button
                        onClick={() => removeExtraFile(i)}
                        className="text-destructive hover:text-destructive/80 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {extraFiles.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Add more PDF files to merge. You need at least 2 files total.
                </p>
              )}
            </div>
          </div>
        }
      />
    </ToolLayout>
  );
}
