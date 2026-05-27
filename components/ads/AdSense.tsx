"use client";

import { useEffect, useState } from "react";

const AD_CLIENT = "ca-pub-5094484375937981";

interface AdSenseProps {
  slot?: string;
  format?: "leaderboard" | "rectangle" | "mobile-banner" | "sticky-sidebar";
  className?: string;
}

const DIMS: Record<string, { w: number; h: number }> = {
  leaderboard: { w: 728, h: 90 },
  rectangle: { w: 300, h: 250 },
  "mobile-banner": { w: 320, h: 50 },
  "sticky-sidebar": { w: 300, h: 600 },
};

const FORMAT_NAMES: Record<string, string> = {
  leaderboard: "Leaderboard Ad",
  rectangle: "Rectangle Ad",
  "mobile-banner": "Mobile Banner Ad",
  "sticky-sidebar": "Skyscraper Ad",
};

export function AdSense({ format = "rectangle", className = "" }: AdSenseProps) {
  const [mounted, setMounted] = useState(false);
  const dims = DIMS[format];

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={`mx-auto flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 ${className}`}
      style={{
        width: "100%",
        minWidth: "300px",
        minHeight: `${dims.h}px`,
        maxWidth: dims.w === 728 ? "728px" : "100%",
      }}
    >
      {mounted && (
        <p className="text-xs text-muted-foreground text-center px-4">
          {FORMAT_NAMES[format]}
        </p>
      )}
    </div>
  );
}
