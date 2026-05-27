"use client";

import { ToolLayout } from "@/components/layout/ToolLayout";
import { MediaTool } from "@/components/ui/MediaTool";
import { useState, useCallback } from "react";
import JSZip from "jszip";
import { Download, Folder, File, FileText, Image, Archive, Loader2 } from "lucide-react";

interface ExtractedFile {
  name: string;
  blob: Blob;
  size: number;
  isFolder: boolean;
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext || "")) return <Image className="w-4 h-4" />;
  if (["txt", "md", "csv", "json", "xml", "html", "css", "js", "ts"].includes(ext || "")) return <FileText className="w-4 h-4" />;
  if (["zip", "rar", "7z", "gz", "tar"].includes(ext || "")) return <Archive className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function MediaToolPage() {
  const [extractedFiles, setExtractedFiles] = useState<ExtractedFile[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());

  const processFile = useCallback(async (file: File) => {
    setExtracting(true);
    setExtractError(null);
    setSelectedFiles(new Set());
    try {
      const zip = await JSZip.loadAsync(file);
      const files: ExtractedFile[] = [];
      const promises: Promise<void>[] = [];
      zip.forEach((relativePath, entry) => {
        if (entry.dir) {
          files.push({ name: relativePath, blob: new Blob(), size: 0, isFolder: true });
          return;
        }
        promises.push(
          entry.async("blob").then((blob) => {
            files.push({ name: relativePath, blob, size: blob.size, isFolder: false });
          })
        );
      });
      await Promise.all(promises);
      if (files.length === 0) {
        setExtractError("The ZIP file appears to be empty.");
        setExtractedFiles([]);
        return null;
      }
      files.sort((a, b) => a.name.localeCompare(b.name));
      setExtractedFiles(files);
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to extract ZIP";
      if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("encrypted")) {
        setExtractError("This ZIP file is password-protected or encrypted. JSZip does not support encrypted archives in the browser.");
      } else {
        setExtractError(msg);
      }
      setExtractedFiles([]);
      return null;
    } finally {
      setExtracting(false);
    }
  }, []);

  const handleDownloadFile = useCallback((index: number) => {
    const ef = extractedFiles[index];
    if (!ef || ef.isFolder) return;
    const url = URL.createObjectURL(ef.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ef.name.split("/").pop() || ef.name;
    a.click();
    URL.revokeObjectURL(url);
  }, [extractedFiles]);

  const handleDownloadAll = useCallback(async () => {
    const filesToZip = extractedFiles.filter((f) => !f.isFolder);
    if (filesToZip.length === 0) return;
    const zip = new JSZip();
    for (const f of filesToZip) {
      zip.file(f.name, f.blob);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "extracted-files.zip";
    a.click();
    URL.revokeObjectURL(url);
  }, [extractedFiles]);

  const handleDownloadSelected = useCallback(async () => {
    const filesToZip = extractedFiles.filter((_, i) => selectedFiles.has(i) && !extractedFiles[i].isFolder);
    if (filesToZip.length === 0) return;
    if (filesToZip.length === 1) {
      const url = URL.createObjectURL(filesToZip[0].blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filesToZip[0].name.split("/").pop() || filesToZip[0].name;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const zip = new JSZip();
    for (const f of filesToZip) {
      zip.file(f.name, f.blob);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "selected-files.zip";
    a.click();
    URL.revokeObjectURL(url);
  }, [extractedFiles, selectedFiles]);

  const toggleSelect = useCallback((index: number) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedFiles(new Set(extractedFiles.map((_, i) => i)));
  }, [extractedFiles]);

  const deselectAll = useCallback(() => {
    setSelectedFiles(new Set());
  }, []);

  return (
    <ToolLayout
      title="ZIP Extractor"
      description="Extract files from ZIP archives online. View, select, and download individual files or bulk-download all contents."
      category="media"
      faqContent={[
        { question: "How does ZIP extraction work in the browser?", answer: "The tool uses the JSZip library to read ZIP archives entirely in the browser. It parses the ZIP file structure, decompresses entries, and presents the file list for individual or bulk download. No server uploads are involved." },
        { question: "What ZIP features are supported?", answer: "Standard ZIP archives with DEFLATE and STORE compression methods. Nested folders are preserved in the file list. Files are extracted individually into memory as Blobs for immediate download." },
        { question: "Are password-protected ZIP files supported?", answer: "No. JSZip does not support encrypted ZIP archives in the browser environment. If a password-protected ZIP is uploaded, the tool displays a clear error message explaining this limitation." },
        { question: "Is there a file size limit?", answer: "The default limit is 50MB for the uploaded ZIP. Individual extracted files can be any size, but all files are held in memory simultaneously, which limits total usable size to roughly 200-500MB depending on the device." },
        { question: "Can I download individual files from the archive?", answer: "Yes. Each file in the extraction list has its own download button. You can also select multiple files using checkboxes and download them together as a new ZIP, or use the Download All button for everything." },
        { question: "Does the tool preserve folder structure?", answer: "Yes. Nested folders within the ZIP are shown in the file list with their full relative paths. When downloading all files, the original folder structure is preserved in the output ZIP." },
        { question: "What file types can be extracted?", answer: "Any file type stored in a ZIP archive can be extracted, including documents, images, videos, executables, and archives within archives (nested ZIPs). The tool shows appropriate file type icons." },
        { question: "Are my files secure during extraction?", answer: "All extraction happens client-side in your browser. The ZIP file is never uploaded to any server. Once you leave the page, all extracted data is garbage collected." },
      ]}
      explanationContent={
        <div>
          <h2>What Is a ZIP Extractor?</h2>
          <p>This tool extracts and displays the contents of ZIP archives directly in your browser. You can view file names and sizes, download individual files or groups of files, and re-zip selected contents.</p>
          <h2>How It Works</h2>
          <p>The uploaded ZIP file is read as an ArrayBuffer and passed to JSZip.loadAsync(), which parses the central directory and decompresses each entry. The tool iterates over all entries, checks for directories, extracts non-folder files as Blobs, and presents them in a sortable file list with size information and file type icons.</p>
          <h2>Features</h2>
          <ul>
            <li><strong>Full file listing:</strong> Shows all files and folders with names, sizes, and type icons.</li>
            <li><strong>Individual download:</strong> Download any single file with one click.</li>
            <li><strong>Batch download:</strong> Select multiple files with checkboxes and download as a new ZIP.</li>
            <li><strong>Download All:</strong> Re-zip all extracted files preserving folder structure.</li>
            <li><strong>Client-side:</strong> Files never leave your device.</li>
          </ul>
          <h2>Use Cases</h2>
          <ul>
            <li>Inspecting ZIP archives before deciding what to extract.</li>
            <li>Extracting specific files from large archives without extracting everything.</li>
            <li>Selecting and downloading only the files you need from a project archive.</li>
            <li>Previewing archive contents on devices without a native extraction tool.</li>
          </ul>
          <h2>Examples</h2>
          <ul>
            <li>A 200MB ZIP containing 50 high-resolution photos extracts with individual download buttons for each image.</li>
            <li>A code project archive with nested folders is fully traversed and files are downloadable one by one.</li>
          </ul>
          <h2>Tips</h2>
          <ul>
            <li>Use Download All for smaller archives and individual downloads for larger files.</li>
            <li>Check individual file sizes before downloading to avoid unexpected large transfers.</li>
            <li>For archives with many small files, batch select them using the checkbox select-all feature.</li>
          </ul>
          <h2>Common Mistakes</h2>
          <ul>
            <li>Uploading a password-protected ZIP-these are not supported by JSZip in the browser.</li>
            <li>Expecting extraction of very large archives (500MB+)-browser memory limits apply.</li>
            <li>Forgetting that file names with special characters may appear differently in the listing.</li>
          </ul>
        </div>
      }
    >
      <MediaTool
        acceptedFileTypes=".zip"
        processLabel="Extract ZIP"
        maxFileSize={100}
        processFile={processFile}
        getDownloadFileName={(name) => name.replace(/\.[^.]+$/, "") + "-extracted"}
        getMimeType={() => "application/zip"}
        extraOptions={
          <>
            {extractError && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm">{extractError}</div>
            )}
            {extracting && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
                <Loader2 className="w-5 h-5 animate-spin" />
                Extracting files...
              </div>
            )}
            {extractedFiles.length > 0 && !extracting && (
              <div className="space-y-4 border border-border rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{extractedFiles.length} file{(extractedFiles.length !== 1) ? "s" : ""} found</p>
                  <div className="flex gap-2">
                    <button onClick={selectAll} className="text-xs text-primary hover:underline">Select All</button>
                    <button onClick={deselectAll} className="text-xs text-muted-foreground hover:underline">Deselect</button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {extractedFiles.map((ef, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(i)}
                        onChange={() => toggleSelect(i)}
                        disabled={ef.isFolder}
                        className="rounded border-gray-300 text-primary focus:ring-primary shrink-0"
                      />
                      <span className="text-muted-foreground shrink-0">
                        {ef.isFolder ? <Folder className="w-4 h-4" /> : getFileIcon(ef.name)}
                      </span>
                      <span className={`flex-1 text-sm truncate ${ef.isFolder ? "text-muted-foreground" : ""}`}>
                        {ef.name}
                      </span>
                      {!ef.isFolder && (
                        <span className="text-xs text-muted-foreground shrink-0">{formatSize(ef.size)}</span>
                      )}
                      {!ef.isFolder && (
                        <button
                          onClick={() => handleDownloadFile(i)}
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <button
                    onClick={handleDownloadAll}
                    className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download All
                  </button>
                  {selectedFiles.size > 0 && (
                    <button
                      onClick={handleDownloadSelected}
                      className="py-2 px-4 rounded-lg text-sm font-medium border border-border hover:bg-gray-50 transition-colors"
                    >
                      Download Selected ({selectedFiles.size})
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        }
      />
    </ToolLayout>
  );
}
