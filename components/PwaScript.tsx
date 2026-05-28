"use client";

import { useEffect } from "react";

export default function PwaScript() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        })
        .catch(() => {
        });
    }
  }, []);

  return null;
}
