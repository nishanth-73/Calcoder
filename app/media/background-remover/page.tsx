"use client";

import { ToolLayout } from "@/components/layout/ToolLayout";
import { MediaTool } from "@/components/ui/MediaTool";
import { useState, useCallback } from "react";

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

function detectDominantColor(imageData: ImageData): RgbColor {
  const { data, width, height } = imageData;
  const corners = [
    { r: data[0], g: data[1], b: data[2] },
    { r: data[(width - 1) * 4], g: data[(width - 1) * 4 + 1], b: data[(width - 1) * 4 + 2] },
    { r: data[(height - 1) * width * 4], g: data[(height - 1) * width * 4 + 1], b: data[(height - 1) * width * 4 + 2] },
    { r: data[(height * width - 1) * 4], g: data[(height * width - 1) * 4 + 1], b: data[(height * width - 1) * 4 + 2] },
  ];
  const sum = corners.reduce((acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }), { r: 0, g: 0, b: 0 });
  return { r: Math.round(sum.r / corners.length), g: Math.round(sum.g / corners.length), b: Math.round(sum.b / corners.length) };
}

function colorDistance(a: RgbColor, b: RgbColor): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function removeBackground(imageData: ImageData, bgColor: RgbColor, tolerance: number): ImageData {
  const { data } = imageData;
  const maxDist = (tolerance / 100) * 441.67;
  for (let i = 0; i < data.length; i += 4) {
    const pixelColor: RgbColor = { r: data[i], g: data[i + 1], b: data[i + 2] };
    if (colorDistance(pixelColor, bgColor) <= maxDist) {
      data[i + 3] = 0;
    }
  }
  return imageData;
}

export default function MediaToolPage() {
  const [tolerance, setTolerance] = useState(30);
  const [colorToRemove, setColorToRemove] = useState("#FFFFFF");
  const [useAutoDetect, setUseAutoDetect] = useState(true);

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
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        let bgColor: RgbColor;
        if (useAutoDetect) {
          bgColor = detectDominantColor(imageData);
        } else {
          const hex = colorToRemove.replace("#", "");
          bgColor = {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16),
          };
        }
        ctx.imageSmoothingEnabled = true;
        const processed = removeBackground(imageData, bgColor, tolerance);
        ctx.putImageData(processed, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error("Background removal failed")); return; }
          resolve(blob);
        }, "image/png");
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error("Failed to load image. The file may be corrupted or in an unsupported format.")); };
      img.src = URL.createObjectURL(file);
    });
  }, [tolerance, colorToRemove, useAutoDetect]);

  return (
    <ToolLayout
      title="Background Remover"
      description="Remove image backgrounds using canvas-based chroma key detection."
      category="media"
      faqContent={[
        { question: "How does the background remover work?", answer: "Our tool uses chroma key technology to detect and remove the background color. It analyzes the dominant color from the image corners or uses a color you specify, then removes all pixels within a similarity tolerance." },
        { question: "Is this AI-powered like remove.bg?", answer: "No, this is a simplified chroma-key approach, not AI-powered. It works best for images with a solid, uniform background color. For complex backgrounds with multiple colors, dedicated AI tools will give better results." },
        { question: "What is the tolerance setting?", answer: "Tolerance controls how similar a pixel must be to the target color to be removed. Higher tolerance removes more similar colors (useful for shadows and gradients), but may also remove parts of your subject." },
        { question: "Can I choose which color to remove?", answer: "Yes, you can either use auto-detect (analyzes corner colors) or manually pick a color using the color picker. Auto-detect works well for images with solid backgrounds like white or green screens." },
        { question: "Why is the output in PNG format?", answer: "PNG is required to support transparency (alpha channel). JPG does not support transparent pixels, so the removed background area would appear as white or black instead." },
        { question: "Does this work on all images?", answer: "It works best on images with a single, solid background color. Photos with complex backgrounds, gradients, or backgrounds similar to the subject may not produce clean results." },
        { question: "Are my files secure?", answer: "Yes, all processing is done locally in your browser using the Canvas API and pixel manipulation. Your images are never uploaded to any server." },
        { question: "What is the maximum file size?", answer: "The maximum file size is 50MB. Larger files will be rejected to ensure smooth processing in the browser." },
      ]}
      explanationContent={
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-3">What Is Background Removal?</h2>
            <p className="text-muted-foreground">Background removal is the process of isolating the main subject of an image by making the background transparent. Our implementation uses chroma key technology, which detects and removes pixels matching a specific color range.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">How It Works</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Upload your image using the drag-and-drop area or file picker</li>
              <li>The tool detects the dominant background color from image corners</li>
              <li>Adjust the tolerance slider to control the removal sensitivity</li>
              <li>Optionally pick a specific color to remove instead of auto-detect</li>
              <li>Click &ldquo;Remove Background&rdquo; to process and download as PNG</li>
            </ol>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Features</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Client-side pixel manipulation for privacy</li>
              <li>Auto-detect or manual color selection</li>
              <li>Adjustable tolerance for fine-tuning</li>
              <li>Outputs PNG with transparency</li>
              <li>No server uploads required</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Use Cases</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Removing white backgrounds from product photos</li>
              <li>Extracting subjects from green screen images</li>
              <li>Creating transparent PNGs for graphic design</li>
              <li>Preparing images for composite photo editing</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Real-World Examples</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>A product photo with white background converted to transparent PNG for a website</li>
              <li>An ID photo with solid background extracted for headshot composite</li>
              <li>A logo with white background isolated for use on colored website backgrounds</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Pro Tips</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Use images with solid, uniform backgrounds for best results</li>
              <li>Start with a low tolerance (10-20) and increase gradually</li>
              <li>White and green screens work best with this chroma key approach</li>
              <li>For complex backgrounds, consider using our Crop tool first to isolate the area</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Common Mistakes</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Using images with backgrounds similar in color to the subject</li>
              <li>Setting tolerance too high, removing parts of the subject</li>
              <li>Expecting professional AI-level results from chroma key technology</li>
              <li>Not reviewing the output carefully for leftover background pixels</li>
            </ul>
          </section>
        </div>
      }
    >
      <MediaTool
        acceptedFileTypes=".jpg,.jpeg,.png"
        processLabel="Remove Background"
        processFile={processFile}
        getDownloadFileName={(name) => name.replace(/\.[^.]+$/, "") + "-no-bg.png"}
        getMimeType={() => "image/png"}
        showImagePreview
        extraOptions={
          <div className="space-y-4 p-4 bg-white border border-border rounded-xl">
            <div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={useAutoDetect} onChange={(e) => setUseAutoDetect(e.target.checked)} className="rounded border-border accent-primary" />
                Auto-detect background color
              </label>
            </div>
            {!useAutoDetect && (
              <div>
                <label className="block text-sm font-medium mb-2">Color to Remove</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={colorToRemove} onChange={(e) => setColorToRemove(e.target.value)} className="w-10 h-10 p-0.5 border border-border rounded cursor-pointer" />
                  <span className="text-sm font-mono text-muted-foreground">{colorToRemove}</span>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Tolerance: {tolerance}%</label>
              <input type="range" min="0" max="100" value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} className="w-full accent-primary" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Strict</span>
                <span>Aggressive</span>
              </div>
            </div>
          </div>
        }
      />
    </ToolLayout>
  );
}
