"use client";

import { ToolLayout } from "@/components/layout/ToolLayout";
import { MediaTool } from "@/components/ui/MediaTool";
import { PDFDocument } from "pdf-lib";
import { useState } from "react";

export default function MediaToolPage() {
  const [password, setPassword] = useState("");

  return (
    <ToolLayout
      title="Unlock PDF"
      description="Remove password protection from PDF files."
      category="media"
      faqContent={[
        { question: "How to unlock a PDF?", answer: "Upload the password-protected PDF, enter the document password, and the tool will save an unlocked copy." },
        { question: "Is this tool free?", answer: "Yes, unlocking PDFs is completely free." },
        { question: "Are my files secure?", answer: "Files are never uploaded to any server. All processing is done client-side." },
        { question: "What types of PDF protection can be removed?", answer: "The tool can remove owner-level restrictions (printing, editing, copying) and user-open passwords when the correct password is provided." },
        { question: "Can I unlock without a password?", answer: "No, the document password is required to remove protection. The tool cannot bypass encryption without the correct password." },
        { question: "Is the password stored anywhere?", answer: "No, the password is only used in memory during processing and is never stored or transmitted." },
        { question: "What is the maximum file size?", answer: "PDFs up to 50MB are supported." },
        { question: "What happens to the original file?", answer: "The original file is not modified. A new unlocked copy is created for download." },
      ]}
      explanationContent={
        <div>
          <h2>What Is PDF Unlocking?</h2>
          <p>PDF unlocking removes password protection and usage restrictions from PDF documents. The tool creates a new copy of the PDF without any security settings, allowing you to freely view, print, and edit the document.</p>
          <h3>How It Works</h3>
          <p>The tool loads the encrypted PDF and decrypts it using the provided password. It then saves a new PDF file without any encryption or restriction flags, effectively creating an unlocked copy.</p>
          <h3>Types of Protection</h3>
          <p>User passwords require a password to open the document. Owner passwords restrict printing, editing, and copying. The tool can remove both types when the correct password is provided.</p>
          <h3>Use Cases</h3>
          <p>Removing restrictions from PDFs you own, accessing locked documents you have the password for, removing print restrictions from purchased documents, and creating unrestricted copies of your own files.</p>
          <h3>Legal Note</h3>
          <p>Only unlock PDFs that you own or have explicit permission to modify. Unlocking copyrighted or confidential documents without authorization may violate laws or terms of service.</p>
          <h3>Tips</h3>
          <p>Ensure you enter the exact password, including capital letters and special characters. Passwords are case-sensitive. If the PDF opens without a password prompt, protection may already be removed.</p>
          <h3>Common Mistakes</h3>
          <p>Entering the wrong password. If the PDF is encrypted with a certificate-based policy instead of a password, this tool cannot unlock it. Some enterprise-grade PDF encryption may not be supported.</p>
        </div>
      }
    >
      <MediaTool
        acceptedFileTypes=".pdf"
        processLabel="Unlock PDF"
        processFile={async (file) => {
          if (!password) throw new Error("Please enter the document password");
          const data = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(data, { password } as any);
          const bytes = await pdfDoc.save();
          return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
        }}
        getDownloadFileName={(name) => name.replace(/\.[^.]+$/, "") + "-unlocked.pdf"}
        getMimeType={() => "application/pdf"}
        extraOptions={
          <div className="p-4 bg-white border border-border rounded-xl">
            <label className="block text-sm font-medium mb-2">Document Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter PDF password"
              className="w-full p-2 bg-white border border-border rounded-lg text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Enter the password required to open this PDF document.
            </p>
          </div>
        }
      />
    </ToolLayout>
  );
}
