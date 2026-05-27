"use client";

import { ToolLayout } from "@/components/layout/ToolLayout";
import { MediaTool } from "@/components/ui/MediaTool";
import { useState, useCallback } from "react";

interface AspectRatioPreset {
  label: string;
  ratio: number | null;
}

const PRESETS: AspectRatioPreset[] = [
  { label: "Free", ratio: null },
  { label: "1:1 Square", ratio: 1 },
  { label: "4:3", ratio: 4 / 3 },
  { label: "16:9", ratio: 16 / 9 },
  { label: "3:2", ratio: 3 / 2 },
  { label: "2:3", ratio: 2 / 3 },
  { label: "9:16", ratio: 9 / 16 },
];

export default function MediaToolPage() {
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropW, setCropW] = useState(500);
  const [cropH, setCropH] = useState(500);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ w: number; h: number } | null>(null);

  const applyPreset = useCallback((preset: AspectRatioPreset, idx: number, imgW: number, imgH: number) => {
    setSelectedPreset(idx);
    if (preset.ratio === null) return;
    if (preset.ratio >= 1) {
      const w = Math.min(imgW, Math.round(imgH * preset.ratio));
      const h = Math.round(w / preset.ratio);
      setCropW(w);
      setCropH(h);
    } else {
      const h = Math.min(imgH, Math.round(imgW / preset.ratio));
      const w = Math.round(h * preset.ratio);
      setCropW(w);
      setCropH(h);
    }
  }, []);

  const processFile = useCallback(async (file: File): Promise<Blob | null> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ w: img.width, h: img.height });
        const x = Math.max(0, Math.min(cropX, img.width - 1));
        const y = Math.max(0, Math.min(cropY, img.height - 1));
        const w = Math.max(1, Math.min(cropW, img.width - x));
        const h = Math.max(1, Math.min(cropH, img.height - y));
        if (x + w > img.width || y + h > img.height) {
          reject(new Error("Crop area exceeds image boundaries"));
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas context not available")); return; }
        ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error("Cropping failed")); return; }
          resolve(blob);
        }, "image/png");
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error("Failed to load image")); };
      img.src = URL.createObjectURL(file);
    });
  }, [cropX, cropY, cropW, cropH]);

  return (
    <ToolLayout
      title="Crop Image"
      description="Crop images to remove unwanted areas with preset aspect ratios."
      category="media"
      faqContent={[
        { question: "How do I crop an image?", answer: "Upload your image, set the crop region coordinates (X, Y, Width, Height), optionally choose an aspect ratio preset, and click &ldquo;Crop Image&rdquo; to extract the selected area." },
        { question: "What does X and Y mean?", answer: "X is the horizontal starting position from the left edge of the image (in pixels). Y is the vertical starting position from the top edge. Together they define the top-left corner of your crop region." },
        { question: "What is aspect ratio?", answer: "Aspect ratio is the proportional relationship between width and height. Common presets include 1:1 (square), 4:3 (standard), 16:9 (widescreen), and 3:2 (classic photo). Select a preset to automatically lock the proportions." },
        { question: "Can I crop to a specific size?", answer: "Yes, set Width and Height to exact pixel values. The &lsquo;Free&rsquo; option allows any dimensions. Keep the crop area within the image boundaries to avoid errors." },
        { question: "Will cropping reduce image quality?", answer: "No, cropping extracts a portion of the image without changing pixel density or compression. The cropped area retains the full quality of the original." },
        { question: "What is the maximum crop area?", answer: "The crop area must fit within the original image dimensions. Width + X cannot exceed the image width, and Height + Y cannot exceed the image height." },
        { question: "Are my files secure?", answer: "Yes, all processing is done client-side in your browser. Your images never leave your device." },
        { question: "What format is the output?", answer: "The cropped image is output as PNG to preserve maximum quality. You can use the Image Compressor tool to convert it to JPEG or WebP if needed." },
      ]}
      explanationContent={
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-3">What Is Image Cropping?</h2>
            <p className="text-muted-foreground">Image cropping is the process of removing unwanted outer areas from an image to improve framing, change aspect ratio, or focus on a specific subject. Unlike resizing, cropping removes pixels rather than scaling them.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">How It Works</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Upload your image using the drag-and-drop area or file picker</li>
              <li>Choose an aspect ratio preset or use Free mode</li>
              <li>Set the X, Y, Width, and Height coordinates for the crop region</li>
              <li>The output will contain only the selected area of the image</li>
              <li>Download your cropped image instantly</li>
            </ol>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Features</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Preset aspect ratios for common formats</li>
              <li>Pixel-precise coordinate control</li>
              <li>Client-side processing for privacy</li>
              <li>PNG output for maximum quality</li>
              <li>No server uploads required</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Use Cases</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Removing distracting elements from the edges of a photo</li>
              <li>Creating square profile pictures from rectangular photos</li>
              <li>Extracting a specific subject from a larger scene</li>
              <li>Formatting images for social media platform requirements</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Real-World Examples</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Cropping a group photo to focus on one person</li>
              <li>Converting a landscape photo to a 1:1 Instagram post</li>
              <li>Removing a cluttered background by cropping tightly around the subject</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Pro Tips</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Use the rule of thirds as a guide for composition</li>
              <li>Choose the aspect ratio that matches your output platform first</li>
              <li>Crop as tightly as possible to remove unnecessary empty space</li>
              <li>Leave some breathing room around the subject for a natural look</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Common Mistakes</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Cropping too tightly and cutting off important parts of the subject</li>
              <li>Using an incorrect aspect ratio that causes awkward framing</li>
              <li>Setting crop coordinates outside the image boundaries</li>
              <li>Forgetting to account for the target platform&apos;s dimensions</li>
            </ul>
          </section>
        </div>
      }
    >
      <MediaTool
        acceptedFileTypes=".jpg,.jpeg,.png,.webp"
        processLabel="Crop Image"
        processFile={processFile}
        getDownloadFileName={(name) => name.replace(/\.[^.]+$/, "") + "-cropped.png"}
        getMimeType={() => "image/png"}
        showImagePreview
        extraOptions={
          <div className="space-y-4 p-4 bg-white border border-border rounded-xl">
            <div>
              <label className="block text-sm font-medium mb-2">Aspect Ratio Presets</label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={preset.label}
                    onClick={() => applyPreset(preset, idx, imageDimensions?.w ?? 1000, imageDimensions?.h ?? 1000)}
                    className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${selectedPreset === idx ? "bg-primary text-primary-foreground border-primary" : "bg-gray-50 border-border hover:bg-primary/10 hover:border-primary/50"}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">X (px)</label>
                <input type="number" min="0" value={cropX} onChange={(e) => setCropX(Math.max(0, Number(e.target.value)))} className="w-full p-2 bg-white border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Y (px)</label>
                <input type="number" min="0" value={cropY} onChange={(e) => setCropY(Math.max(0, Number(e.target.value)))} className="w-full p-2 bg-white border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Width (px)</label>
                <input type="number" min="1" value={cropW} onChange={(e) => setCropW(Math.max(1, Number(e.target.value)))} className="w-full p-2 bg-white border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Height (px)</label>
                <input type="number" min="1" value={cropH} onChange={(e) => setCropH(Math.max(1, Number(e.target.value)))} className="w-full p-2 bg-white border border-border rounded-lg text-sm" />
              </div>
            </div>
            {imageDimensions && (
              <p className="text-xs text-muted-foreground">Image size: {imageDimensions.w} x {imageDimensions.h} px &mdash; Max crop: {imageDimensions.w - Math.min(cropX, imageDimensions.w - 1)} x {imageDimensions.h - Math.min(cropY, imageDimensions.h - 1)} px</p>
            )}
          </div>
        }
      />
    </ToolLayout>
  );
}
