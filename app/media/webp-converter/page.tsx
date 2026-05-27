"use client";

import { ToolLayout } from "@/components/layout/ToolLayout";
import { MediaTool } from "@/components/ui/MediaTool";
import { useState, useCallback, useEffect } from "react";

type ConversionDirection = "to-webp" | "from-webp";

export default function MediaToolPage() {
  const [quality, setQuality] = useState(80);
  const [direction, setDirection] = useState<ConversionDirection>("to-webp");
  const [webpNotSupported, setWebpNotSupported] = useState(false);

  useEffect(() => {
    setWebpNotSupported(typeof HTMLCanvasElement.prototype.toBlob !== "function" || !HTMLCanvasElement.prototype.toBlob);
  }, []);

  const processFile = useCallback(async (file: File): Promise<Blob | null> => {
    const isWebpInput = file.type === "image/webp";
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas context not available")); return; }
        ctx.drawImage(img, 0, 0);
        if (direction === "to-webp") {
          if (!canvas.toBlob) {
            reject(new Error("WebP conversion is not supported in this browser. Please use Chrome, Edge, or Firefox."));
            return;
          }
          canvas.toBlob((blob) => {
            if (!blob) { reject(new Error("WebP conversion failed")); return; }
            resolve(blob);
          }, "image/webp", quality / 100);
        } else {
          const mime = file.type === "image/webp" ? "image/png" : file.type;
          canvas.toBlob((blob) => {
            if (!blob) { reject(new Error("Conversion failed")); return; }
            resolve(blob);
          }, mime, 0.92);
        }
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error("Failed to load image. The file may be corrupted or in an unsupported format.")); };
      img.src = URL.createObjectURL(file);
    });
  }, [direction, quality]);

  const getOutputExtension = useCallback((name: string, dir: ConversionDirection, fileMime: string) => {
    if (dir === "to-webp") return name.replace(/\.[^.]+$/, "") + ".webp";
    if (fileMime === "image/webp") return name.replace(/\.[^.]+$/, "") + ".png";
    return name.replace(/\.[^.]+$/, "") + "." + (fileMime === "image/png" ? "png" : "jpg");
  }, []);

  const getOutputMime = useCallback((_file: File, dir: ConversionDirection) => {
    if (dir === "to-webp") return "image/webp";
    if (_file.type === "image/webp") return "image/png";
    return _file.type;
  }, []);

  return (
    <ToolLayout
      title="WebP Converter"
      description="Convert images to and from WebP format for web optimization."
      category="media"
      faqContent={[
        { question: "What is WebP format?", answer: "WebP is a modern image format developed by Google that provides superior lossless and lossy compression. It reduces file sizes by 25-35% compared to JPEG while maintaining similar visual quality." },
        { question: "Which browsers support WebP?", answer: "WebP is supported in Chrome, Firefox, Edge, and Opera. Safari added support in version 14. For older browsers, we suggest using JPEG or PNG as fallbacks." },
        { question: "What is the difference between WebP and JPEG?", answer: "WebP typically achieves 25-35% smaller file sizes than JPEG at the same quality level. WebP also supports transparency (alpha channel) unlike JPEG." },
        { question: "Can WebP handle animation?", answer: "Yes, WebP supports animated images similar to GIF, but with much better compression. Animated WebP files are typically much smaller than animated GIFs." },
        { question: "How do I convert WebP back to JPG or PNG?", answer: "Use the direction toggle to switch to &lsquo;From WebP&rsquo; mode. Upload a WebP file and it will be converted back to PNG or the original format." },
        { question: "Is WebP lossy or lossless?", answer: "WebP supports both lossy and lossless compression. Our tool uses lossy compression with adjustable quality. For web use, lossy WebP at 80% quality offers excellent results." },
        { question: "Are my files secure?", answer: "Yes, all processing is done client-side in your browser. Your images never leave your device." },
        { question: "Why use WebP for websites?", answer: "WebP images load faster due to smaller file sizes, improving page speed and user experience. They also reduce bandwidth costs for website owners." },
      ]}
      explanationContent={
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-3">What Is WebP Conversion?</h2>
            <p className="text-muted-foreground">WebP conversion transforms images to and from Google&apos;s WebP format. WebP provides superior compression with both lossy and lossless modes, supporting transparency and animation. It is designed to create smaller, faster-loading images for the web.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">How It Works</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Upload your image using the drag-and-drop area or file picker</li>
              <li>Select conversion direction: to WebP or from WebP</li>
              <li>Adjust the quality slider for lossy compression</li>
              <li>Click &ldquo;Convert&rdquo; to start processing</li>
              <li>Download your converted image instantly</li>
            </ol>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Features</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Bidirectional conversion (to and from WebP)</li>
              <li>Adjustable quality from 10% to 100%</li>
              <li>Client-side processing for privacy</li>
              <li>Smaller file sizes than JPEG at equivalent quality</li>
              <li>Supports PNG and JPEG input formats</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Use Cases</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Optimizing website images for faster page loads</li>
              <li>Reducing image storage requirements</li>
              <li>Preparing images for Google PageSpeed optimization</li>
              <li>Converting existing JPEG/PNG libraries to modern format</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Real-World Examples</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>A 500KB JPEG compressed to 350KB WebP at the same visual quality</li>
              <li>A 1.2MB PNG compressed to 200KB WebP with transparency preserved</li>
              <li>A website reducing its total image payload from 5MB to 3MB by switching to WebP</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Pro Tips</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Use quality 80% for an excellent balance between size and quality</li>
              <li>Always serve JPEG/PNG fallbacks for browsers that don&apos;t support WebP</li>
              <li>Use WebP for photographs and complex graphics, not for simple icons</li>
              <li>Test your WebP images across target browsers before deploying</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Common Mistakes</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Using WebP exclusively without fallback for older browsers</li>
              <li>Setting quality too low and introducing visible artifacts</li>
              <li>Not checking if the target platform supports WebP (e.g., some CMS platforms)</li>
              <li>Converting already optimized images expecting further significant gains</li>
            </ul>
          </section>
        </div>
      }
    >
      <MediaTool
        acceptedFileTypes=".jpg,.jpeg,.png,.webp"
        processLabel="Convert"
        processFile={processFile}
        getDownloadFileName={(name) => getOutputExtension(name, direction, "")}
        getMimeType={() => getOutputMime(null as unknown as File, direction)}
        showImagePreview
        extraOptions={
          <div className="space-y-4 p-4 bg-white border border-border rounded-xl">
            {webpNotSupported && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                WebP is not supported in your browser. Please use Chrome, Edge, or Firefox for WebP conversion.
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Conversion Direction</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDirection("to-webp")}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${direction === "to-webp" ? "bg-primary text-primary-foreground border-primary" : "bg-gray-50 border-border hover:bg-primary/10"}`}
                >
                  To WebP
                </button>
                <button
                  onClick={() => setDirection("from-webp")}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${direction === "from-webp" ? "bg-primary text-primary-foreground border-primary" : "bg-gray-50 border-border hover:bg-primary/10"}`}
                >
                  From WebP
                </button>
              </div>
            </div>
            {direction === "to-webp" && (
              <div>
                <label className="block text-sm font-medium mb-2">Quality: {quality}%</label>
                <input type="range" min="10" max="100" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Smaller file</span>
                  <span>Better quality</span>
                </div>
              </div>
            )}
            {direction === "from-webp" && (
              <p className="text-xs text-muted-foreground">WebP will be converted back to PNG (or original format). Output is lossless.</p>
            )}
          </div>
        }
      />
    </ToolLayout>
  );
}
