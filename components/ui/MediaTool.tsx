"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, File, Download, Loader2, X, ImageIcon } from "lucide-react";

interface MediaToolProps {
  acceptedFileTypes: string;
  maxFileSize?: number;
  processLabel?: string;
  processFile: (file: File) => Promise<Blob | null>;
  getDownloadFileName: (originalName: string) => string;
  getMimeType: () => string;
  renderPreview?: (file: File, url: string) => React.ReactNode;
  extraOptions?: React.ReactNode;
  showImagePreview?: boolean;
}

export function MediaTool({
  acceptedFileTypes,
  maxFileSize = 50,
  processLabel = "Process",
  processFile,
  getDownloadFileName,
  extraOptions,
  showImagePreview,
}: MediaToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setError(null);
    setResult(null);
    setProgress(0);
    const maxBytes = maxFileSize * 1024 * 1024;
    if (f.size > maxBytes) {
      setError(`File too large. Maximum size is ${maxFileSize}MB.`);
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, [maxFileSize]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleProcess = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);
    try {
      const blob = await processFile(file);
      clearInterval(progressInterval);
      setProgress(100);
      if (blob) setResult(blob);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : "Processing failed");
    } finally {
      setProcessing(false);
    }
  }, [file, processFile]);

  const handleDownload = useCallback(() => {
    if (!result || !file) return;
    const url = URL.createObjectURL(result);
    const a = document.createElement("a");
    a.href = url;
    a.download = getDownloadFileName(file.name);
    a.click();
    URL.revokeObjectURL(url);
  }, [result, file, getDownloadFileName]);

  const handleReset = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setResult(null);
    setProgress(0);
    setError(null);
  }, [preview]);

  return (
    <div className="space-y-6">
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-gray-50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <p className="text-lg font-semibold mb-1">Drop file here or click to upload</p>
          <p className="text-sm text-muted-foreground">Accepted: {acceptedFileTypes} (max {maxFileSize}MB)</p>
          <input
            ref={inputRef}
            type="file"
            accept={acceptedFileTypes}
            className="hidden"
            onChange={handleInput}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-white border border-border rounded-xl">
            <div className="bg-primary/10 text-primary p-3 rounded-lg shrink-0">
              <File className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{file.name}</p>
              <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            {!processing && (
              <button onClick={handleReset} className="p-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Remove file">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {showImagePreview && preview && (
            <div className="rounded-xl overflow-hidden border border-border bg-white">
              <img src={preview} alt="Preview" className="max-h-64 w-full object-contain" />
            </div>
          )}

          {extraOptions}

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm">{error}</div>
          )}

          {processing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Processing...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                <Download className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-green-800">Ready to download</p>
                <p className="text-sm text-green-600">{getDownloadFileName(file?.name || "file")}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {!processing && !result && (
              <button
                onClick={handleProcess}
                className="flex-1 bg-primary text-primary-foreground py-3 px-6 rounded-xl font-medium hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Loader2 className="w-4 h-4" />
                {processLabel}
              </button>
            )}
            {result && (
              <button
                onClick={handleDownload}
                className="flex-1 bg-primary text-primary-foreground py-3 px-6 rounded-xl font-medium hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}
            {result && (
              <button
                onClick={handleReset}
                className="py-3 px-6 rounded-xl font-medium border border-border hover:bg-gray-50 transition-colors"
              >
                Start Over
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
