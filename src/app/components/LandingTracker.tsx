"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export function LandingTracker() {
  useEffect(() => {
    posthog.capture("landing_viewed");
  }, []);
  return null;
}
