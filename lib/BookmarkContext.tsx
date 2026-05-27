"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { toolsRegistry } from "@/data/registry";
import { Tool } from "@/data/registry";

const STORAGE_KEY = "calcoder_bookmarks";
const SEEN_KEY = "calcoder_bookmarks_seen";

interface BookmarkContextValue {
  bookmarks: string[];
  bookmarkedTools: Tool[];
  save: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => boolean;
  isBookmarked: (id: string) => boolean;
  count: number;
  isLoaded: boolean;
  hasNew: boolean;
  markSeen: () => void;
}

const BookmarkContext = createContext<BookmarkContextValue | null>(null);

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const prevCountRef = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed: string[] = saved ? safeParse(saved) : [];
    setBookmarks(parsed);
    prevCountRef.current = parsed.length;

    const seen = localStorage.getItem(SEEN_KEY);
    if (seen !== "true" && parsed.length > 0) {
      setHasNew(true);
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const currentCount = bookmarks.length;
    if (currentCount > prevCountRef.current) {
      const seen = localStorage.getItem(SEEN_KEY);
      if (seen !== "true") {
        setHasNew(true);
      }
    }
    prevCountRef.current = currentCount;
  }, [bookmarks, isLoaded]);

  const persist = useCallback((ids: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event("bookmarks_updated"));
  }, []);

  const save = useCallback((id: string) => {
    setBookmarks((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      persist(next);
      return next;
    });
  }, [persist]);

  const remove = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = prev.filter((b) => b !== id);
      persist(next);
      return next;
    });
  }, [persist]);

  const toggle = useCallback(
    (id: string) => {
      let result = false;
      setBookmarks((prev) => {
        if (prev.includes(id)) {
          result = false;
          const next = prev.filter((b) => b !== id);
          persist(next);
          return next;
        } else {
          result = true;
          const next = [...prev, id];
          persist(next);
          return next;
        }
      });
      return result;
    },
    [persist]
  );

  const isBookmarked = useCallback(
    (id: string) => bookmarks.includes(id),
    [bookmarks]
  );

  const markSeen = useCallback(() => {
    setHasNew(false);
    localStorage.setItem(SEEN_KEY, "true");
  }, []);

  const bookmarkedTools = bookmarks
    .map((id) => toolsRegistry.find((t) => t.id === id))
    .filter(Boolean)
    .map((t) => t!);

  const value: BookmarkContextValue = {
    bookmarks,
    bookmarkedTools,
    save,
    remove,
    toggle,
    isBookmarked,
    count: bookmarks.length,
    isLoaded,
    hasNew,
    markSeen,
  };

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarkContext() {
  const ctx = useContext(BookmarkContext);
  if (!ctx) {
    throw new Error("useBookmarkContext must be used within a BookmarkProvider");
  }
  return ctx;
}

function safeParse(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
