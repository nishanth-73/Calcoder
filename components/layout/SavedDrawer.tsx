"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, X, Trash2, Calculator } from "lucide-react";
import * as Icons from "lucide-react";
import { useBookmarks } from "@/lib/useBookmarks";

const CATEGORY_LABELS: Record<string, string> = {
  finance: "Finance Hub",
  marketing: "Marketing Hub",
  developer: "Developer Hub",
};

const CATEGORY_ORDER = ["finance", "marketing", "developer"];

export function SavedDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { bookmarkedTools, remove, count } = useBookmarks();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!mounted) return null;

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat] || cat,
    tools: bookmarkedTools.filter((t) => t.category === cat),
  })).filter((g) => g.tools.length > 0);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed top-0 right-0 z-[70] h-full w-full sm:w-96 bg-white border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-primary" fill="currentColor" />
            <h2 className="font-bold text-lg">Saved Tools</h2>
            {count > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {count}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-4rem)]">
          {bookmarkedTools.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
              <div className="bg-muted/50 p-4 rounded-2xl mb-5">
                <Bookmark className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground font-semibold mb-1">
                No saved calculators yet
              </p>
              <p className="text-sm text-muted-foreground/60 max-w-[200px]">
                Save your favorite tools to access them quickly from anywhere.
              </p>
            </div>
          ) : (
            <div className="py-4">
              {grouped.map((group) => (
                <div key={group.category} className="mb-4">
                  <div className="flex items-center gap-2 px-6 py-2">
                    <Calculator className="w-4 h-4 text-muted-foreground/50" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                      {group.label}
                    </h3>
                  </div>
                  {group.tools.map((tool) => {
                    // @ts-ignore
                    const IconComponent = Icons[tool.icon] || Icons.Code;
                    return (
                      <div
                        key={tool.id}
                        className="group flex items-center gap-3 px-6 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <div className="bg-primary/10 text-primary p-2 rounded-lg shrink-0">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <Link
                          href={tool.href}
                          onClick={onClose}
                          className="flex-1 min-w-0"
                        >
                          <p className="text-sm font-medium truncate">
                            {tool.name}
                          </p>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            remove(tool.id);
                          }}
                          className="p-1.5 rounded-full text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                          aria-label={`Remove ${tool.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
