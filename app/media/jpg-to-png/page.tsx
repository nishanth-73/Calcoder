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
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error("Conversion failed")); return; }
          resolve(blob);
        }, "image/png");
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error("Failed to load image. The file may be corrupted or in an unsupported format.")); };
      img.src = URL.createObjectURL(file);
    });
  }, []);

  return (
    <ToolLayout
      title="JPG to PNG"
      description="Convert JPG images to PNG format with transparency support."
      category="media"
      faqContent={[
        { question: "How do I convert JPG to PNG?", answer: "Upload your JPG image and click &ldquo;Convert to PNG&rdquo;. The tool draws the image onto a canvas and exports it as a PNG file, which supports transparency." },
        { question: "Does PNG support transparency?", answer: "Yes, PNG supports alpha transparency, meaning pixels can be fully or partially transparent. However, converting a JPG (which has no transparency) to PNG will not add transparency - the image stays opaque." },
        { question: "Why is the PNG file larger than the JPG?", answer: "PNG uses lossless compression, which preserves every pixel perfectly but results in larger file sizes. JPG uses lossy compression that discards some data to achieve smaller sizes." },
        { question: "Will I lose quality converting JPG to PNG?", answer: "No, PNG is lossless. However, if the original JPG already had compression artifacts, those will be preserved in the PNG. PNG cannot reverse JPG quality loss." },
        { question: "When should I use PNG instead of JPG?", answer: "Use PNG for images with text, sharp edges, logos, screenshots, or when you need transparency. Use JPG for photographs and images with smooth gradients where file size matters." },
        { question: "Can I convert multiple files at once?", answer: "Currently, each file is processed individually. You can use the tool multiple times for batch conversion." },
        { question: "Are my files secure?", answer: "Yes, all processing is done locally in your browser using the Canvas API. Your images are never uploaded to any server." },
        { question: "What is the maximum file size?", answer: "The maximum file size is 50MB. Larger files will be rejected to ensure smooth browser processing." },
      ]}
      explanationContent={
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-3">What Is JPG to PNG Conversion?</h2>
            <p className="text-muted-foreground">JPG to PNG conversion transforms JPEG images into Portable Network Graphics format. While JPG is optimized for photographs with small file sizes, PNG preserves every pixel perfectly and supports transparency, making it ideal for graphics requiring precision.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">How It Works</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Upload your JPG image using the drag-and-drop area or file picker</li>
              <li>The image is drawn onto a canvas at full resolution</li>
              <li>Click &ldquo;Convert to PNG&rdquo; to start processing</li>
              <li>The canvas is exported as a lossless PNG file</li>
              <li>Download your converted file instantly</li>
            </ol>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Features</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Lossless conversion preserving all image data</li>
              <li>Client-side processing for complete privacy</li>
              <li>Supports transparent output (add alpha channel)</li>
              <li>Preserves original image dimensions</li>
              <li>Ideal for editing and further processing</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Use Cases</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Editing images that require pixel-perfect accuracy</li>
              <li>Converting photos for use in graphic design projects</li>
              <li>Creating images for applications that require PNG format</li>
              <li>Preserving image quality for archival purposes</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Real-World Examples</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>A JPG photo converted to PNG for editing in graphic design software</li>
              <li>A screenshot saved as JPG converted to PNG for better text clarity</li>
              <li>A product photo converted to PNG for use in a catalog with transparent backgrounds</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Pro Tips</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Use PNG for images that will undergo multiple edits to avoid generational quality loss</li>
              <li>Keep the original JPG for backup since it takes less space</li>
              <li>Use our Image Compressor if you need to reduce PNG file size</li>
              <li>PNG is best for screenshots and images with text or UI elements</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Common Mistakes</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Using PNG for photographs uploaded to the web, resulting in slow load times</li>
              <li>Expecting JPG-to-PNG conversion to remove JPG compression artifacts</li>
              <li>Not considering the significantly larger file size of PNG</li>
              <li>Converting all images to PNG when JPG would be more appropriate</li>
            </ul>
          </section>
        </div>
      }
    >
      <MediaTool
        acceptedFileTypes=".jpg,.jpeg"
        processLabel="Convert to PNG"
        processFile={processFile}
        getDownloadFileName={(name) => name.replace(/\.[^.]+$/, "") + ".png"}
        getMimeType={() => "image/png"}
        showImagePreview
      />
    </ToolLayout>
  );
}
