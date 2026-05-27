"use client";

import { Bookmark } from "lucide-react";
import { useBookmarks } from "@/lib/useBookmarks";
import { useState } from "react";

export function SaveButton({
  toolId,
  toolName,
  showLabel,
  className,
}: {
  toolId: string;
  toolName?: string;
  showLabel?: boolean;
  className?: string;
}) {
  const { isBookmarked, toggle } = useBookmarks();
  const saved = isBookmarked(toolId);
  const [animating, setAnimating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggle(toolId);
    setAnimating(true);
    setToast(next ? `${toolName || "Tool"} saved` : `${toolName || "Tool"} unsaved`);
    setTimeout(() => setAnimating(false), 300);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 p-2 rounded-full transition-all duration-200 ${
          saved
            ? "text-primary"
            : "text-muted-foreground hover:text-primary hover:bg-primary/5"
        } ${animating ? "scale-110" : "scale-100"} ${className || ""}`}
        aria-label={saved ? "Remove from saved" : "Save tool"}
      >
        <Bookmark
          className="w-5 h-5 transition-all duration-200"
          fill={saved ? "currentColor" : "none"}
        />
        {showLabel && (
          <span className="text-sm font-medium">{saved ? "Saved" : "Save"}</span>
        )}
      </button>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-foreground text-background px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium animate-in slide-in-from-bottom-2 fade-in duration-200">
          {toast}
        </div>
      )}
    </>
  );
}
