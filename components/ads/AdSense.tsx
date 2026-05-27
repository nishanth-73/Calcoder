"use client";

import { useEffect, useRef } from "react";

const AD_CLIENT = "ca-pub-5094484375937981";

const AD_SLOTS: Record<string, string> = {
  leaderboard: "1234567890",
  rectangle: "1234567891",
  "mobile-banner": "1234567892",
  "sticky-sidebar": "1234567893",
};

const AD_DIMENSIONS: Record<string, { width: string; height: string }> = {
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

interface AdSenseProps {
  slot?: string;
  format?: "leaderboard" | "rectangle" | "mobile-banner" | "sticky-sidebar";
  className?: string;
}

export function AdSense({ slot, format = "rectangle", className = "" }: AdSenseProps) {
  const initialized = useRef(false);
  const dims = AD_DIMENSIONS[format];
  const adFormat = AD_FORMATS[format];
  const adSlot = slot || AD_SLOTS[format];

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const timer = setTimeout(() => {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }, 0);
      return () => clearTimeout(timer);
    } catch {
      // Silently ignore — ad won't render but app stays stable
    }
  }, []);

  return (
    <div className={`ad-container mx-auto ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: dims.width, height: dims.height }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
}
