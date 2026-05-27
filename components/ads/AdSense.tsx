"use client";

import { useEffect, useRef } from "react";

const AD_CLIENT = "ca-pub-5094484375937981";

const AD_SLOTS: Record<string, string> = {
  leaderboard: "1234567890",
  rectangle: "1234567891",
  "mobile-banner": "1234567892",
  "sticky-sidebar": "1234567893",
};

const AD_DIMS: Record<string, { width: string; height: string }> = {
  leaderboard: { width: "728", height: "90" },
  rectangle: { width: "300", height: "250" },
  "mobile-banner": { width: "320", height: "50" },
  "sticky-sidebar": { width: "300", height: "600" },
};

const AD_FORMATS: Record<string, string> = {
  leaderboard: "horizontal",
  rectangle: "rectangle",
  "mobile-banner": "horizontal",
  "sticky-sidebar": "vertical",
};

const AD_MIN_DIMS: Record<string, { minWidth: string; minHeight: string }> = {
  leaderboard: { minWidth: "300px", minHeight: "90px" },
  rectangle: { minWidth: "300px", minHeight: "250px" },
  "mobile-banner": { minWidth: "300px", minHeight: "50px" },
  "sticky-sidebar": { minWidth: "300px", minHeight: "600px" },
};

interface AdSenseProps {
  slot?: string;
  format?: "leaderboard" | "rectangle" | "mobile-banner" | "sticky-sidebar";
  className?: string;
}

export function AdSense({ slot, format = "rectangle", className = "" }: AdSenseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const adSlot = slot || AD_SLOTS[format];
  const dims = AD_DIMS[format];
  const adFormat = AD_FORMATS[format];
  const minDims = AD_MIN_DIMS[format];

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let attempts = 0;
    const maxAttempts = 30;

    function tryPush() {
      if (containerRef.current && containerRef.current.offsetWidth > 0) {
        try {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        } catch {
          // Silently ignore — ad won't render but app stays stable
        }
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(tryPush, 100);
      }
    }

    tryPush();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`ad-container mx-auto ${className}`}
      style={{ width: "100%", minWidth: minDims.minWidth, minHeight: minDims.minHeight }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "inline-block", width: dims.width, height: dims.height }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
      />
    </div>
  );
}
