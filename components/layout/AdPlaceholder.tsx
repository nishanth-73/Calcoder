"use client";

import { AdSense } from "@/components/ads/AdSense";

interface AdPlaceholderProps {
  type?: "leaderboard" | "rectangle" | "mobile-banner" | "sticky-sidebar";
}

export function AdPlaceholder({ type = "rectangle" }: AdPlaceholderProps) {
  return <AdSense format={type} />;
}
