"use client";

import { ToolLayout } from "@/components/layout/ToolLayout";
import { MediaTool } from "@/components/ui/MediaTool";
import { useCallback } from "react";

export default function MediaToolPage() {
  const processFile = useCallback(async (file: File): Promise<Blob | null> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas context not available")); return; }
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error("Conversion failed")); return; }
          resolve(blob);
        }, "image/jpeg", 0.92);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error("Failed to load image. The file may be corrupted or in an unsupported format.")); };
      img.src = URL.createObjectURL(file);
    });
  }, []);

  return (
    <ToolLayout
      title="PNG to JPG"
      description="Convert PNG images to JPG format with white background fill."
      category="media"
      faqContent={[
        { question: "How do I convert PNG to JPG?", answer: "Upload your PNG image and click &ldquo;Convert to JPG&rdquo;. The tool draws your PNG onto a canvas with a white background and saves it as a high-quality JPEG file." },
        { question: "What happens to transparent areas?", answer: "Since JPG does not support transparency, transparent areas in your PNG are filled with a white background. If you need to preserve transparency, keep the PNG format instead." },
        { question: "Will I lose quality converting to JPG?", answer: "JPG uses lossy compression, so there is a slight quality reduction. Our tool uses 92% quality, which provides an excellent balance between file size and visual fidelity." },
        { question: "Why is the JPG file smaller than the PNG?", answer: "JPG compression is much more efficient than PNG for photographs and complex images. PNG is better for graphics with sharp edges or text, while JPG excels at natural images." },
        { question: "Can I convert multiple files at once?", answer: "Currently, each file is processed individually. You can use the tool multiple times for batch conversion." },
        { question: "Are my files secure?", answer: "Yes, all processing is done locally in your browser using the Canvas API. Your images are never uploaded to any server." },
        { question: "What quality is the output JPG?", answer: "The output uses 92% quality, which offers near-visual-lossless quality while significantly reducing file size compared to PNG." },
        { question: "What is the maximum file size?", answer: "The maximum file size is 50MB. Larger files will be rejected by the tool to ensure smooth browser processing." },
      ]}
      explanationContent={
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-3">What Is PNG to JPG Conversion?</h2>
            <p className="text-muted-foreground">PNG to JPG conversion transforms Portable Network Graphics files into Joint Photographic Experts Group format. PNG is best for graphics with sharp edges, text, and transparency, while JPG excels at photographs with smooth color transitions and smaller file sizes.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">How It Works</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Upload your PNG file using the drag-and-drop area or file picker</li>
              <li>The image is drawn onto a canvas with a white background</li>
              <li>Click &ldquo;Convert to JPG&rdquo; to start processing</li>
              <li>The canvas is exported as a JPEG at 92% quality</li>
              <li>Download your converted file instantly</li>
            </ol>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Features</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Client-side processing for privacy</li>
              <li>Automatically fills transparency with white</li>
              <li>High-quality 92% JPEG output</li>
              <li>Preserves original image dimensions</li>
              <li>Smaller file sizes compared to PNG</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Use Cases</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Uploading images to websites that don&apos;t support PNG</li>
              <li>Reducing file sizes for email attachments</li>
              <li>Preparing photographs for printing services</li>
              <li>Creating compatible images for older software</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Real-World Examples</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>A 5MB PNG screenshot converted to a 800KB JPG for web use</li>
              <li>A 3MB PNG photo converted to a 500KB JPG for email</li>
              <li>Converting transparent logo PNGs (with white fill) for Word documents</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Pro Tips</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Keep the PNG original if you need transparency later</li>
              <li>For images with text or sharp lines, PNG is usually better</li>
              <li>Use JPG for photographs and images with gradients</li>
              <li>Compress the JPG further with our Image Compressor if needed</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Common Mistakes</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Converting PNG images with text to JPG, causing text artifacts</li>
              <li>Not checking white background fill in transparent areas</li>
              <li>Converting images that will be edited again (PNG is better for editing)</li>
              <li>Using JPG for images that require pixel-perfect accuracy</li>
            </ul>
          </section>
        </div>
      }
    >
      <MediaTool
        acceptedFileTypes=".png"
        processLabel="Convert to JPG"
        processFile={processFile}
        getDownloadFileName={(name) => name.replace(/\.[^.]+$/, "") + ".jpg"}
        getMimeType={() => "image/jpeg"}
        showImagePreview
      />
    </ToolLayout>
  );
}
