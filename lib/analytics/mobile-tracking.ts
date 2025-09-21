"use client"

import {
  onCLS,
  onFID,
  onFCP,
  onINP,
  onLCP,
  onTTFB,
  type Metric,
} from "web-vitals"

import { getDeviceType, isMobileViewport } from "@/lib/utils/device"

interface MetricPayload {
  metric: Metric & { value: number }
  metadata: {
    deviceType: string
    viewport: { width: number; height: number }
    connection?: {
      effectiveType?: string
      downlink?: number
      rtt?: number
    }
    userAgent: string
  }
  timestamp: number
}

const METRIC_ENDPOINT = "/api/analytics/mobile-metrics"
const GLOBAL_FLAG = "__cryptrac_mobile_vitals__"

function sendMetric(payload: MetricPayload) {
  const body = JSON.stringify(payload)

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" })
      navigator.sendBeacon(METRIC_ENDPOINT, blob)
    } else if (typeof fetch !== "undefined") {
      fetch(METRIC_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // swallow transport errors
  }

  if (process.env.NODE_ENV !== "production") {
    console.debug("[mobile-vitals]", payload.metric.name, payload.metric.value, payload.metric.rating)
  }
}

export function trackMobileMetrics(): void {
  if (typeof window === "undefined") return
  if (!isMobileViewport()) return

  if ((window as unknown as Record<string, unknown>)[GLOBAL_FLAG]) {
    return
  }
  ;(window as unknown as Record<string, unknown>)[GLOBAL_FLAG] = true

  const metadata: MetricPayload["metadata"] = {
    deviceType: getDeviceType(),
    viewport: { width: window.innerWidth, height: window.innerHeight },
    userAgent: navigator.userAgent,
  }

  const connection = (navigator as Navigator & {
    connection?: {
      effectiveType?: string
      downlink?: number
      rtt?: number
    }
  }).connection
  if (connection) {
    metadata.connection = {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
    }
  }

  const report = (metric: Metric) => {
    sendMetric({
      metric: { ...metric, value: Number(metric.value.toFixed(2)) },
      metadata,
      timestamp: Date.now(),
    })
  }

  try {
    onCLS(report, { reportAllChanges: false })
    onFID(report)
    onFCP(report)
    onINP(report)
    onLCP(report)
    onTTFB(report)
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[mobile-vitals] subscription error", error)
    }
  }
}
