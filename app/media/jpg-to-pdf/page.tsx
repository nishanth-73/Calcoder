"use client";

import { ToolLayout } from "@/components/layout/ToolLayout";
import { MediaTool } from "@/components/ui/MediaTool";
import { jsPDF } from "jspdf";

export default function MediaToolPage() {
  return (
    <ToolLayout
      title="JPG to PDF"
      description="Convert JPG images to PDF documents instantly."
      category="media"
      faqContent={[
        { question: "How do I convert JPG to PDF?", answer: "Upload your JPG image and click the convert button. The tool instantly creates a PDF with your image embedded at full resolution." },
        { question: "Is JPG to PDF conversion free?", answer: "Yes, it is completely free with no limits on file size or number of conversions." },
        { question: "Are my images secure?", answer: "All processing happens in your browser. Your images never leave your device." },
        { question: "What image formats are supported?", answer: "The tool supports JPG, JPEG, PNG, and WebP formats for conversion to PDF." },
        { question: "Will the image quality be preserved?", answer: "Yes, the image is embedded at its original resolution in the PDF without recompression." },
        { question: "Can I convert multiple images at once?", answer: "Currently, you can convert one image at a time. Use the Merge PDF tool to combine multiple PDFs." },
        { question: "What is the maximum file size?", answer: "Files up to 50MB are supported for conversion." },
        { question: "Do I need to install anything?", answer: "No installation needed. Everything works directly in your web browser." },
      ]}
      explanationContent={
        <div>
          <h2>What Is JPG to PDF?</h2>
          <p>JPG to PDF is a free online tool that converts JPG images and other image formats into PDF documents. It runs entirely in your browser using client-side technology, ensuring your files remain private and secure.</p>
          <h3>How It Works</h3>
          <p>The tool reads your image file and creates a new PDF document with page dimensions matching your image&rsquo;s aspect ratio. The image is embedded at full resolution, preserving every pixel of the original.</p>
          <h3>Supported Formats</h3>
          <p>JPG, JPEG, PNG, and WebP images are all supported. The tool automatically detects the format and handles the conversion accordingly.</p>
          <h3>Quality</h3>
          <p>Images are embedded in the PDF at their original resolution with no compression applied. The resulting PDF retains the full quality of your source image.</p>
          <h3>Use Cases</h3>
          <p>Ideal for creating photo albums, archiving scanned documents, converting screenshots to PDF, preparing images for printing, and sharing images in a universally compatible format.</p>
          <h3>Tips</h3>
          <p>For best results, use high-resolution images. If your image is very large, consider resizing it first with our Image Resizer tool for smaller PDF file sizes.</p>
          <h3>Common Mistakes</h3>
          <p>Using low-resolution images will result in pixelated PDFs. Always start with the highest quality source image available.</p>
        </div>
      }
    >
      <MediaTool
        acceptedFileTypes=".jpg,.jpeg,.png,.webp"
        processLabel="Convert to PDF"
        processFile={async (file) => {
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = URL.createObjectURL(file);
          });
          const width = img.naturalWidth || img.width;
          const height = img.naturalHeight || img.height;
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(img.src);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
          const pdf = new jsPDF({
            orientation: width > height ? "landscape" : "portrait",
            unit: "px",
            format: [width, height],
          });
          pdf.addImage(dataUrl, "JPEG", 0, 0, width, height);
          return pdf.output("blob");
        }}
        getDownloadFileName={(name) => name.replace(/\.[^.]+$/, "") + ".pdf"}
        getMimeType={() => "application/pdf"}
        showImagePreview
      />
    </ToolLayout>
  );
}
