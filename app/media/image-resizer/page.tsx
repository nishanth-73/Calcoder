"use client";

import { ToolLayout } from "@/components/layout/ToolLayout";
import { MediaTool } from "@/components/ui/MediaTool";
import { useState, useCallback } from "react";

const PRESETS: { label: string; width: number; height: number }[] = [
  { label: "Icon", width: 64, height: 64 },
  { label: "Thumbnail", width: 150, height: 150 },
  { label: "SD (640x480)", width: 640, height: 480 },
  { label: "HD (1280x720)", width: 1280, height: 720 },
  { label: "Full HD (1920x1080)", width: 1920, height: 1080 },
  { label: "2K (2560x1440)", width: 2560, height: 1440 },
  { label: "4K (3840x2160)", width: 3840, height: 2160 },
];

export default function MediaToolPage() {
  const [width, setWidth] = useState("800");
  const [height, setHeight] = useState("600");
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(4 / 3);

  const handleWidthChange = useCallback((val: string, currentHeight: string, maintain: boolean, ratio: number) => {
    setWidth(val);
    if (maintain && val) {
      const w = parseInt(val, 10);
      if (!isNaN(w) && w > 0) {
        setHeight(String(Math.round(w / ratio)));
      }
    }
  }, []);

  const handleHeightChange = useCallback((val: string, currentWidth: string, maintain: boolean, ratio: number) => {
    setHeight(val);
    if (maintain && val) {
      const h = parseInt(val, 10);
      if (!isNaN(h) && h > 0) {
        setWidth(String(Math.round(h * ratio)));
      }
    }
  }, []);

  const applyPreset = useCallback((preset: { label: string; width: number; height: number }) => {
    setWidth(String(preset.width));
    setHeight(String(preset.height));
    setAspectRatio(preset.width / preset.height);
  }, []);

  const processFile = useCallback(async (file: File): Promise<Blob | null> => {
    const w = parseInt(width, 10);
    const h = parseInt(height, 10);
    if (isNaN(w) || isNaN(h) || w < 1 || h < 1) {
      throw new Error("Invalid dimensions. Please enter positive numbers for width and height.");
    }
    if (w > 10000 || h > 10000) {
      throw new Error("Maximum output dimensions are 10000x10000 pixels.");
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas context not available")); return; }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error("Resizing failed")); return; }
          resolve(blob);
        }, "image/jpeg", 0.92);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error("Failed to load image")); };
      img.src = URL.createObjectURL(file);
    });
  }, [width, height]);

  return (
    <ToolLayout
      title="Image Resizer"
      description="Resize images to exact dimensions with aspect ratio control."
      category="media"
      faqContent={[
        { question: "How do I resize an image?", answer: "Upload your image, enter the desired width and height in pixels, optionally lock the aspect ratio, choose a preset if needed, and download the resized version." },
        { question: "What is aspect ratio?", answer: "Aspect ratio is the proportional relationship between width and height. For example, 16:9 is the standard widescreen ratio. When &lsquo;Maintain aspect ratio&rsquo; is checked, changing one dimension automatically updates the other." },
        { question: "What are presets and how do I use them?", answer: "Presets are common size combinations like Icon (64x64), Thumbnail (150x150), HD (1280x720), and 4K (3840x2160). Click a preset button to automatically set width, height, and aspect ratio." },
        { question: "Will resizing reduce image quality?", answer: "Resizing to smaller dimensions reduces quality since pixels are removed. Enlarging (upscaling) can cause blurriness. For best results, start with a high-resolution source image." },
        { question: "What is the maximum output size?", answer: "The maximum output dimensions are 10000x10000 pixels. This covers most use cases including large format printing." },
        { question: "Can I resize to a custom aspect ratio?", answer: "Yes, uncheck &lsquo;Maintain aspect ratio&rsquo; to enter any width and height independently. This is useful when you need exact pixel dimensions for specific layouts." },
        { question: "Are my files secure?", answer: "All processing is done client-side in your browser. Your images are never uploaded to any server." },
        { question: "What file formats are supported?", answer: "We support JPEG, PNG, and WebP input formats. The output is JPEG by default with 92% quality for broad compatibility." },
      ]}
      explanationContent={
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-3">What Is Image Resizing?</h2>
            <p className="text-muted-foreground">Image resizing is the process of changing the dimensions of an image by scaling it up or down. This is essential for preparing images for different platforms, ensuring they fit specific layout requirements, and optimizing load times.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">How It Works</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Upload your image using the drag-and-drop area or file picker</li>
              <li>Enter the desired width and height in pixels</li>
              <li>Toggle &ldquo;Maintain aspect ratio&rdquo; to keep proportions or uncheck for free resize</li>
              <li>Optionally select a preset size from the available options</li>
              <li>Click &ldquo;Resize&rdquo; to process and download</li>
            </ol>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Features</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Client-side processing for complete privacy</li>
              <li>Aspect ratio lock to maintain proportions</li>
              <li>Preset sizes for common use cases</li>
              <li>High-quality image smoothing</li>
              <li>Supports up to 10000x10000 output dimensions</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Use Cases</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Preparing product images for e-commerce platforms</li>
              <li>Creating social media posts with platform-specific sizes</li>
              <li>Generating thumbnails for video galleries</li>
              <li>Resizing photos for email signatures</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Real-World Examples</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>A 4000x3000 camera photo resized to 1920x1440 for web display</li>
              <li>A 1080x1080 Instagram post created from a landscape photo</li>
              <li>A 150x150 thumbnail generated from a product image</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Pro Tips</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Always resize down rather than up for best quality</li>
              <li>Use presets for standard social media sizes</li>
              <li>Keep the original file backed up before resizing</li>
              <li>Compress after resizing for even smaller file sizes</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Common Mistakes</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Upscaling small images to large sizes results in pixelation</li>
              <li>Forgetting to lock aspect ratio and distorting the image</li>
              <li>Using excessively large output dimensions for web use</li>
              <li>Not considering the target platform&apos;s size requirements</li>
            </ul>
          </section>
        </div>
      }
    >
      <MediaTool
        acceptedFileTypes=".jpg,.jpeg,.png,.webp"
        processLabel="Resize"
        processFile={processFile}
        getDownloadFileName={(name) => name.replace(/\.[^.]+$/, "") + "-resized.jpg"}
        getMimeType={() => "image/jpeg"}
        showImagePreview
        extraOptions={
          <div className="space-y-4 p-4 bg-white border border-border rounded-xl">
            <div>
              <label className="block text-sm font-medium mb-2">Preset Sizes</label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => applyPreset(preset)}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-50 border border-border rounded-lg hover:bg-primary/10 hover:border-primary/50 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Width (px)</label>
                <input type="number" min="1" max="10000" value={width} onChange={(e) => handleWidthChange(e.target.value, height, maintainAspect, aspectRatio)} className="w-full p-2 bg-white border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Height (px)</label>
                <input type="number" min="1" max="10000" value={height} onChange={(e) => handleHeightChange(e.target.value, width, maintainAspect, aspectRatio)} className="w-full p-2 bg-white border border-border rounded-lg text-sm" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={maintainAspect} onChange={(e) => setMaintainAspect(e.target.checked)} className="rounded border-border accent-primary" />
              Maintain aspect ratio
            </label>
          </div>
        }
      />
    </ToolLayout>
  );
}
