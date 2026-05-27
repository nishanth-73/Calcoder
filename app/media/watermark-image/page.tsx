"use client";

import { ToolLayout } from "@/components/layout/ToolLayout";
import { MediaTool } from "@/components/ui/MediaTool";
import { useState, useCallback } from "react";

type WatermarkPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

const POSITION_LABELS: Record<WatermarkPosition, string> = {
  "top-left": "Top Left",
  "top-right": "Top Right",
  "bottom-left": "Bottom Left",
  "bottom-right": "Bottom Right",
  "center": "Center",
};

function getPositionCoords(
  position: WatermarkPosition,
  imgW: number,
  imgH: number,
  textW: number,
  textH: number,
  padding: number
): { x: number; y: number } {
  switch (position) {
    case "top-left": return { x: padding, y: padding + textH };
    case "top-right": return { x: imgW - textW - padding, y: padding + textH };
    case "bottom-left": return { x: padding, y: imgH - padding };
    case "bottom-right": return { x: imgW - textW - padding, y: imgH - padding };
    case "center": return { x: (imgW - textW) / 2, y: (imgH + textH) / 2 };
  }
}

export default function MediaToolPage() {
  const [watermarkText, setWatermarkText] = useState("Calcoder");
  const [position, setPosition] = useState<WatermarkPosition>("bottom-right");
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(50);
  const [color, setColor] = useState("#FFFFFF");

  const processFile = useCallback(async (file: File): Promise<Blob | null> => {
    const text = watermarkText.trim();
    if (!text) {
      throw new Error("Please enter watermark text.");
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas context not available")); return; }
        ctx.drawImage(img, 0, 0);
        const alpha = opacity / 100;
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
        ctx.fillStyle = color;
        ctx.textBaseline = "bottom";
        const metrics = ctx.measureText(text);
        const textW = metrics.width;
        const textH = fontSize * 0.8;
        const padding = Math.max(20, fontSize * 0.5);
        const { x, y } = getPositionCoords(position, img.width, img.height, textW, textH, padding);
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(text, x, y);
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error("Watermarking failed")); return; }
          resolve(blob);
        }, file.type || "image/png", 0.95);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error("Failed to load image")); };
      img.src = URL.createObjectURL(file);
    });
  }, [watermarkText, position, fontSize, opacity, color]);

  return (
    <ToolLayout
      title="Watermark Image"
      description="Add custom text watermarks to your images with full control over style and position."
      category="media"
      faqContent={[
        { question: "How do I add a watermark to my image?", answer: "Upload your image, enter the watermark text, choose a position (top-left, center, bottom-right, etc.), adjust the font size, opacity, and color, then click &ldquo;Add Watermark&rdquo; to process." },
        { question: "What watermark positions are available?", answer: "You can place your watermark in five positions: Top Left, Top Right, Center, Bottom Left, and Bottom Right. Bottom Right is the most common choice as it is less intrusive." },
        { question: "Can I adjust the watermark opacity?", answer: "Yes, the opacity slider ranges from 10% (barely visible) to 100% (fully opaque). A 40-60% opacity is recommended for a professional look that doesn&apos;t distract from the image." },
        { question: "What font is used for the watermark?", answer: "The watermark uses a bold Arial font, which is clean, readable, and available on all systems. It includes a subtle text shadow for better visibility against light and dark backgrounds." },
        { question: "Will the original image be modified?", answer: "The watermark is applied to a copy of the image. The original file remains untouched on your device. You download only the watermarked version." },
        { question: "Can I change the watermark color?", answer: "Yes, use the color picker to choose any color for your watermark text. White is the most common choice as it contrasts well with most images." },
        { question: "Are my files secure?", answer: "Yes, all processing is done client-side in your browser. Your images and watermark text never leave your device." },
        { question: "What image formats are supported?", answer: "We support JPEG, PNG, and WebP input formats. The output format matches the input format to preserve quality." },
      ]}
      explanationContent={
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-3">What Is Image Watermarking?</h2>
            <p className="text-muted-foreground">Image watermarking is the process of overlaying text or a logo onto an image to protect copyright, establish ownership, or promote a brand. A good watermark is visible enough to deter unauthorized use without distracting from the image content.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">How It Works</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Upload your image using the drag-and-drop area or file picker</li>
              <li>Enter the watermark text you want to display</li>
              <li>Choose the position where the watermark should appear</li>
              <li>Adjust font size, opacity, and color to match your brand</li>
              <li>Click &ldquo;Add Watermark&rdquo; to overlay the text and download</li>
            </ol>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Features</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Customizable text watermark with full style control</li>
              <li>Five position options for flexible placement</li>
              <li>Adjustable opacity from subtle to prominent</li>
              <li>Color picker for brand-matched watermark text</li>
              <li>Text shadow for better readability on any background</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Use Cases</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Protecting photography portfolios from unauthorized use</li>
              <li>Branding product images for e-commerce</li>
              <li>Adding copyright notices to published images</li>
              <li>Promoting social media handles on shared images</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Real-World Examples</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>A photographer adding &ldquo;&copy; John Doe Photography&rdquo; to portfolio images</li>
              <li>An artist placing their Instagram handle as a subtle bottom-right watermark</li>
              <li>A business adding a transparent company logo watermark to product photos</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Pro Tips</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Use 40-60% opacity for a professional, non-intrusive watermark</li>
              <li>Place watermarks in a corner rather than center to minimize visual impact</li>
              <li>Use white text with the shadow effect for visibility on any background</li>
              <li>Keep watermark text short - a name or brand is better than a long sentence</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Common Mistakes</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Using watermarks that are too large and overpower the image</li>
              <li>Placing watermarks in a position that can be easily cropped out</li>
              <li>Using 100% opacity that makes the watermark harsh and distracting</li>
              <li>Using a color that blends into the background and becomes invisible</li>
            </ul>
          </section>
        </div>
      }
    >
      <MediaTool
        acceptedFileTypes=".jpg,.jpeg,.png,.webp"
        processLabel="Add Watermark"
        processFile={processFile}
        getDownloadFileName={(name) => name.replace(/\.[^.]+$/, "") + "-watermarked." + (name.match(/\.(png|webp)$/i)?.[1] ?? "jpg")}
        getMimeType={() => ""}
        showImagePreview
        extraOptions={
          <div className="space-y-4 p-4 bg-white border border-border rounded-xl">
            <div>
              <label className="block text-sm font-medium mb-1">Watermark Text</label>
              <input type="text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} placeholder="Enter watermark text" className="w-full p-2 bg-white border border-border rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Position</label>
                <select value={position} onChange={(e) => setPosition(e.target.value as WatermarkPosition)} className="w-full p-2 bg-white border border-border rounded-lg text-sm">
                  {(Object.keys(POSITION_LABELS) as WatermarkPosition[]).map((key) => (
                    <option key={key} value={key}>{POSITION_LABELS[key]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Font Size: {fontSize}px</label>
                <input type="range" min="12" max="200" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-primary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Opacity: {opacity}%</label>
                <input type="range" min="10" max="100" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full accent-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 p-0.5 border border-border rounded cursor-pointer" />
                  <span className="text-sm font-mono text-muted-foreground">{color}</span>
                </div>
              </div>
            </div>
          </div>
        }
      />
    </ToolLayout>
  );
}
