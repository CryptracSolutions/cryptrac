"use client"

import { useEffect, useRef, useState } from "react"

import { isTouchDevice } from "@/lib/utils/device"

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number
  maxDistance?: number
  enabled?: boolean
}

interface PullToRefreshResult {
  pullDistance: number
  isRefreshing: boolean
}

/**
 * Lightweight pull-to-refresh gesture for mobile web.
 * Attaches listeners at the window level so it works across pages without custom scroll containers.
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 60,
  maxDistance = 160,
  enabled = true,
}: PullToRefreshOptions): PullToRefreshResult {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const startYRef = useRef<number | null>(null)
  const activeRef = useRef(false)
  const refreshingRef = useRef(false)
  const pullDistanceRef = useRef(0)

  useEffect(() => {
    if (typeof window === "undefined" || !enabled || !isTouchDevice()) {
      return
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (window.scrollY > 0 || refreshingRef.current) return
      const touch = event.touches[0]
      startYRef.current = touch.clientY
      activeRef.current = true
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!activeRef.current || startYRef.current === null) return

      const currentY = event.touches[0].clientY
      const delta = currentY - startYRef.current

      if (delta <= 0) {
        setPullDistance(0)
        pullDistanceRef.current = 0
        return
      }

      if (window.scrollY > 0) {
        activeRef.current = false
        setPullDistance(0)
        pullDistanceRef.current = 0
        return
      }

      event.preventDefault()
      const constrained = Math.min(delta, maxDistance)
      setPullDistance(constrained)
      pullDistanceRef.current = constrained
    }

    const handleTouchEnd = async () => {
      if (!activeRef.current) return
      activeRef.current = false

      if (pullDistanceRef.current >= threshold && !refreshingRef.current) {
        try {
          refreshingRef.current = true
          setIsRefreshing(true)
          await onRefresh()
        } finally {
          refreshingRef.current = false
          setIsRefreshing(false)
        }
      }

      setPullDistance(0)
      pullDistanceRef.current = 0
      startYRef.current = null
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true })
    window.addEventListener("touchmove", handleTouchMove, { passive: false })
    window.addEventListener("touchend", handleTouchEnd)

    return () => {
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
    }
  }, [enabled, maxDistance, onRefresh, threshold])

  return { pullDistance, isRefreshing }
}
