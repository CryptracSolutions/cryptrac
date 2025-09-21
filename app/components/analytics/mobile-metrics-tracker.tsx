"use client"

import { useEffect } from "react"

import { trackMobileMetrics } from "@/lib/analytics/mobile-tracking"

export function MobileMetricsTracker() {
  useEffect(() => {
    trackMobileMetrics()
  }, [])

  return null
}
