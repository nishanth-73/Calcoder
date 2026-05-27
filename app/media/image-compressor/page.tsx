"use client";

import { ToolLayout } from "@/components/layout/ToolLayout";
import { MediaTool } from "@/components/ui/MediaTool";
import { useState, useCallback } from "react";

type FormatType = "image/jpeg" | "image/png" | "image/webp";

const FORMAT_EXT: Record<FormatType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const FORMAT_LABEL: Record<FormatType, string> = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
};

export default function MediaToolPage() {
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<FormatType>("image/jpeg");
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);

  const processFile = useCallback(async (file: File): Promise<Blob | null> => {
    setOriginalSize(null);
    setCompressedSize(null);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas context not available")); return; }
        ctx.drawImage(img, 0, 0);
        const qualityVal = format === "image/png" ? undefined : quality / 100;
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error("Compression failed")); return; }
          setOriginalSize(file.size);
          setCompressedSize(blob.size);
          resolve(blob);
        }, format, qualityVal);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error("Failed to load image. The file may be corrupted or in an unsupported format.")); };
      img.src = URL.createObjectURL(file);
    });
  }, [format, quality]);

  return (
    <ToolLayout
      title="Image Compressor"
      description="Compress images to reduce file size without losing quality."
      category="media"
      faqContent={[
        { question: "How much can I compress an image?", answer: "Most images can be compressed by 40-80% with minimal quality loss. JPEG and WebP formats offer the best compression ratios, while PNG compression is lossless. The actual compression depends on the image content - photos with lots of detail compress better than simple graphics." },
        { question: "What is the best format for compression?", answer: "WebP offers the best compression-to-quality ratio, reducing file sizes by 25-35% compared to JPEG and by 80-90% compared to PNG. JPEG is best for photographs, while PNG is preferred for images with transparency or sharp text." },
        { question: "Does compression reduce image quality?", answer: "JPEG and WebP use lossy compression, meaning some quality is lost at lower quality settings. Our tool lets you adjust quality from 10% to 100%. For most use cases, 70-80% quality provides an excellent balance between file size and visual quality." },
        { question: "Are my files secure during compression?", answer: "Yes, all processing happens entirely in your browser using the Canvas API. Your images are never uploaded to any server. This ensures complete privacy and security for your files." },
        { question: "What image formats do you support?", answer: "We support JPEG, PNG, and WebP input and output formats. You can also convert between formats while compressing - for example, compress a PNG to a smaller JPEG or WebP file." },
        { question: "How is compressed file size calculated?", answer: "The compressed file size depends on the quality setting, image dimensions, and content complexity. Higher quality settings preserve more detail but result in larger files. We show both the original and compressed sizes for comparison." },
        { question: "Can I batch compress multiple images?", answer: "Currently, our tool processes one image at a time. For batch processing, you can use the tool repeatedly. We recommend compressing images before uploading them to websites to improve page load speed." },
        { question: "What quality setting should I use?", answer: "For web use, 70-80% quality is recommended for JPEG and WebP. For print, use 90-100%. For PNG, compression is lossless so quality is always preserved. Start with 80% and adjust based on your specific needs." },
      ]}
      explanationContent={
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-3">What Is Image Compression?</h2>
            <p className="text-muted-foreground">Image compression is the process of reducing the file size of an image without significantly affecting its visual quality. It works by removing redundant or less important data from the image file, making it smaller and faster to load while maintaining an acceptable level of quality.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">How It Works</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Upload your image using the drag-and-drop area or file picker</li>
              <li>Adjust the quality slider and select your preferred output format</li>
              <li>Click &ldquo;Compress Image&rdquo; to start the compression process</li>
              <li>Compare original and compressed file sizes</li>
              <li>Download your compressed image instantly</li>
            </ol>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Features</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Client-side processing - your files never leave your device</li>
              <li>Adjustable quality from 10% to 100%</li>
              <li>Multiple output formats: JPEG, PNG, WebP</li>
              <li>Original vs compressed size comparison</li>
              <li>Supports large files up to 50MB</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Use Cases</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Optimizing images for website loading speed</li>
              <li>Reducing image file sizes for email attachments</li>
              <li>Preparing images for social media uploads</li>
              <li>Compressing product photos for e-commerce</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Real-World Examples</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>A 5MB photo compressed to 1.2MB at 80% quality - perfect for web use</li>
              <li>A 2MB PNG graphic compressed to 200KB as WebP</li>
              <li>A 10MB high-res image compressed to 3MB for email attachment</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Pro Tips</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Use 70-80% quality for web images - the sweet spot between size and quality</li>
              <li>Choose WebP for the best compression when browser support allows</li>
              <li>Keep the original file as a backup before compressing</li>
              <li>Resize large images before compressing for even smaller files</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Common Mistakes</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Setting quality too low (below 50%) causes visible artifacts</li>
              <li>Using PNG for photographs when JPEG or WebP would be better</li>
              <li>Compressing already compressed images, leading to quality loss</li>
              <li>Not checking browser compatibility for WebP format</li>
            </ul>
          </section>
        </div>
      }
    >
      <MediaTool
        acceptedFileTypes=".jpg,.jpeg,.png,.webp"
        processLabel="Compress Image"
        processFile={processFile}
        getDownloadFileName={(name) => name.replace(/\.[^.]+$/, "") + "-compressed." + FORMAT_EXT[format]}
        getMimeType={() => format}
        showImagePreview
        extraOptions={
          <div className="space-y-4 p-4 bg-white border border-border rounded-xl">
            <div>
              <label className="block text-sm font-medium mb-2">Format: {FORMAT_LABEL[format]}</label>
              <select value={format} onChange={(e) => setFormat(e.target.value as FormatType)} className="w-full p-2 bg-white border border-border rounded-lg text-sm">
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WebP</option>
              </select>
            </div>
            {format !== "image/png" && (
              <div>
                <label className="block text-sm font-medium mb-2">Quality: {quality}%</label>
                <input type="range" min="10" max="100" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Smaller file</span>
                  <span>Better quality</span>
                </div>
              </div>
            )}
            {format === "image/png" && (
              <p className="text-xs text-muted-foreground">PNG uses lossless compression. File size is determined by image content.</p>
            )}
            {originalSize !== null && compressedSize !== null && (
              <div className="text-sm space-y-1 pt-2 border-t border-border">
                <p className="text-muted-foreground">Original: <span className="font-medium text-foreground">{(originalSize / 1024 / 1024).toFixed(2)} MB</span></p>
                <p className="text-muted-foreground">Compressed: <span className="font-medium text-green-600">{(compressedSize / 1024 / 1024).toFixed(2)} MB</span></p>
                <p className="text-muted-foreground">Saved: <span className="font-medium text-green-600">{((1 - compressedSize / originalSize) * 100).toFixed(1)}%</span></p>
              </div>
            )}
          </div>
        }
      />
    </ToolLayout>
  );
}
