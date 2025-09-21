"use client"

import { useEffect, useRef, type RefObject } from "react"

import { isTouchDevice } from "@/lib/utils/device"

interface SwipeActionsOptions {
  threshold?: number
  restraint?: number
  enabled?: boolean
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

/**
 * Detects horizontal swipe gestures on list items to surface contextual actions.
 */
export function useSwipeActions<T extends HTMLElement>(
  ref: RefObject<T | null>,
  {
    threshold = 80,
    restraint = 120,
    enabled = true,
    onSwipeLeft,
    onSwipeRight,
  }: SwipeActionsOptions
) {
  const startXRef = useRef<number | null>(null)
  const startYRef = useRef<number | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || !enabled || typeof window === "undefined" || !isTouchDevice()) {
      return
    }

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      startXRef.current = touch.clientX
      startYRef.current = touch.clientY
    }

    const handleTouchEnd = (event: TouchEvent) => {
      if (startXRef.current === null || startYRef.current === null) {
        return
      }

      const touch = event.changedTouches[0]
      const deltaX = touch.clientX - startXRef.current
      const deltaY = touch.clientY - startYRef.current

      startXRef.current = null
      startYRef.current = null

      if (Math.abs(deltaY) > restraint) {
        return
      }

      if (deltaX <= -threshold) {
        onSwipeLeft?.()
      } else if (deltaX >= threshold) {
        onSwipeRight?.()
      }
    }

    element.addEventListener("touchstart", handleTouchStart)
    element.addEventListener("touchend", handleTouchEnd)

    return () => {
      element.removeEventListener("touchstart", handleTouchStart)
      element.removeEventListener("touchend", handleTouchEnd)
    }
  }, [ref, enabled, threshold, restraint, onSwipeLeft, onSwipeRight])
}
