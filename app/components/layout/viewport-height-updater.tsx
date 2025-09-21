"use client"

import { useViewportHeight } from "@/lib/hooks/use-mobile"

/**
 * Keeps the CSS `--vh` variable in sync with the actual viewport height on mobile devices.
 * Renders nothing, has no desktop impact.
 */
export function ViewportHeightUpdater() {
  useViewportHeight()
  return null
}
