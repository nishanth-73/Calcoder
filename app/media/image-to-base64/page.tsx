"use client";

import { ToolLayout } from "@/components/layout/ToolLayout";
import { MediaTool } from "@/components/ui/MediaTool";
import { useState, useCallback } from "react";

export default function MediaToolPage() {
  const [base64Result, setBase64Result] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const processFile = useCallback(async (file: File): Promise<Blob | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setBase64Result(dataUrl);
        resolve(new Blob([dataUrl], { type: "text/plain" }));
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }, []);

  const copyToClipboard = useCallback(async () => {
    if (!base64Result) return;
    try {
      await navigator.clipboard.writeText(base64Result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = base64Result;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [base64Result]);

  const truncateBase64 = (str: string, maxLen = 200) => {
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen) + "...";
  };

  return (
    <ToolLayout
      title="Image to Base64"
      description="Convert images to Base64 encoded strings for embedding in HTML, CSS, or JavaScript."
      category="media"
      faqContent={[
        { question: "What is Base64 encoding?", answer: "Base64 is a binary-to-text encoding scheme that represents binary data in an ASCII string format. It is commonly used to embed images directly in HTML, CSS, or JavaScript files without needing separate image files." },
        { question: "How do I use a Base64 image in HTML?", answer: "Use the data URL as the src attribute: &lt;img src=&quot;data:image/png;base64,iVBOR...&quot; /&gt;. The output from our tool is already formatted as a complete data URL ready to use." },
        { question: "Does Base64 increase file size?", answer: "Yes, Base64 encoding increases file size by approximately 33% compared to the original binary file. It is best used for small images like icons, logos, or sprites." },
        { question: "When should I use Base64 images?", answer: "Use Base64 for small images (under 10KB) that are critical for initial page load, such as logos, icons, or inline SVG. For larger images, use regular image files for better performance." },
        { question: "Are there performance downsides to Base64?", answer: "Base64 images cannot be cached separately, increase HTML/CSS file size, and delay content rendering. They also don&apos;t load asynchronously like regular image files." },
        { question: "Can I encode any image format?", answer: "Yes, we support JPEG, PNG, GIF, WebP, and SVG. The data URL will include the correct MIME type based on the image format." },
        { question: "Are my files secure?", answer: "Yes, all processing is done locally in your browser using the FileReader API. Your images never leave your device." },
        { question: "How do I decode a Base64 string back to an image?", answer: "Paste the data URL into your browser&apos;s address bar and press Enter. Your browser will display the image, which you can then save. Alternatively, use our Base64 Decoder tool." },
      ]}
      explanationContent={
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-3">What Is Base64 Encoding for Images?</h2>
            <p className="text-muted-foreground">Base64 encoding converts binary image data into a text string that can be embedded directly in HTML, CSS, or JavaScript. The encoded string starts with a data URL prefix (e.g., data:image/png;base64,) followed by the encoded content.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">How It Works</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Upload your image using the drag-and-drop area or file picker</li>
              <li>Click &ldquo;Convert to Base64&rdquo; to read the file and encode it</li>
              <li>The Base64 data URL is displayed in the text area below</li>
              <li>Use the copy button to copy the encoded string to your clipboard</li>
              <li>Paste it directly into your HTML, CSS, or JavaScript</li>
            </ol>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Features</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Client-side processing for privacy</li>
              <li>One-click copy to clipboard</li>
              <li>Automatic MIME type detection</li>
              <li>Read-only text area with scrollable content</li>
              <li>Download encoded string as text file</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Use Cases</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Embedding small icons in CSS as background images</li>
              <li>Inlining images in HTML emails for reliability</li>
              <li>Creating self-contained HTML documents with embedded images</li>
              <li>Including images in JavaScript without external files</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Real-World Examples</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>A 2KB logo icon encoded as Base64 and inlined in CSS background-image</li>
              <li>A small PNG graphic embedded in an HTML email for consistent display</li>
              <li>A single HTML file containing all images for offline documentation</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Pro Tips</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Only use Base64 for images under 10KB to avoid bloating HTML/CSS</li>
              <li>Keep Base64-encoded images to a minimum to maintain page performance</li>
              <li>Use SVG icons directly (without Base64) for even smaller inline sizes</li>
              <li>Consider using icon fonts or SVG sprites as alternatives for many small icons</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">Common Mistakes</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Encoding large images (over 100KB) as Base64, slowing down page loads</li>
              <li>Not compressing images before encoding to Base64</li>
              <li>Forgetting that Base64 images can&apos;t be cached separately by browsers</li>
              <li>Using Base64 for images that change frequently, requiring HTML/CSS updates</li>
            </ul>
          </section>
        </div>
      }
    >
      <MediaTool
        acceptedFileTypes=".jpg,.jpeg,.png,.gif,.webp,.svg"
        processLabel="Convert to Base64"
        processFile={processFile}
        getDownloadFileName={(name) => name.replace(/\.[^.]+$/, "") + ".txt"}
        getMimeType={() => "text/plain"}
        showImagePreview
        extraOptions={
          <div className="space-y-3 p-4 bg-white border border-border rounded-xl">
            {base64Result ? (
              <>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Base64 Data URL</label>
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={truncateBase64(base64Result)}
                  className="w-full h-32 p-3 bg-gray-50 border border-border rounded-lg text-xs font-mono break-all resize-none"
                />
                <p className="text-xs text-muted-foreground">Full string: {base64Result.length.toLocaleString()} characters</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Process an image to see its Base64 encoded string here.</p>
            )}
          </div>
        }
      />
    </ToolLayout>
  );
}
