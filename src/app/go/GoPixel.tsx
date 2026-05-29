"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq: any;
  }
}

export function GoPixel() {
  useEffect(() => {
    window.fbq?.("track", "ViewContent", { content_name: "Ad Landing Page" });
  }, []);
  return null;
}
