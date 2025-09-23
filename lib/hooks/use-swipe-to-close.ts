"use client"

import { useCallback, useEffect, useRef, type RefObject } from "react"
import { isMobileViewport, isTouchDevice } from "@/lib/utils/device"

export type SwipeDirection = "left" | "right" | "up" | "down"

export interface SwipeToCloseOptions {
  /** Called when a swipe that meets the configured criteria fires. */
  onClose: () => void
  /** Allowed swipe directions that should trigger the close callback. */
  directions?: SwipeDirection[]
  /** Minimum movement in pixels along the primary axis before closing. */
  threshold?: number
  /** Maximum movement allowed along the cross axis before cancelling the swipe. */
  restraint?: number
  /** Optional additional guard to toggle the hook on/off. */
  enabled?: boolean
}

/**
 * Provides consistent swipe-to-close behaviour for mobile overlays without affecting desktop.
 * Attach the returned ref to the element that should listen for touch gestures.
 */
export function useSwipeToClose<T extends HTMLElement>(
  ref: RefObject<T | null>,
  {
    onClose,
    directions = ["down"],
    threshold = 60,
    restraint = 80,
    enabled = true,
  }: SwipeToCloseOptions
) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const isActive = useCallback(() => {
    if (!enabled) return false
    if (typeof window === "undefined") return false
    if (!isTouchDevice()) return false
    const hasCoarsePointer =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches

    return hasCoarsePointer || isMobileViewport()
  }, [enabled])

  useEffect(() => {
    const element = ref.current
    if (!element || !isActive()) return

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      const touch = event.touches[0]
      touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    }

    const handleTouchMove = (event: TouchEvent) => {
      // Prevent scroll bounce for overlays once swipe is moving in primary axis
      if (!touchStartRef.current) return
      const touch = event.touches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y

      const horizontal = Math.abs(deltaX) > Math.abs(deltaY)
      if (horizontal && (directions.includes("left") || directions.includes("right"))) {
        if (Math.abs(deltaY) < restraint) {
          if (event.cancelable) {
            event.preventDefault()
          }
        }
      }

      if (!horizontal && (directions.includes("up") || directions.includes("down"))) {
        if (Math.abs(deltaX) < restraint) {
          if (event.cancelable) {
            event.preventDefault()
          }
        }
      }
    }

    const handleTouchEnd = (event: TouchEvent) => {
      if (!touchStartRef.current) return
      if (event.changedTouches.length === 0) return
      const touch = event.changedTouches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y

      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      if (absX < threshold && absY < threshold) {
        touchStartRef.current = null
        return
      }

      const withinHorizontalRestraint = absY <= restraint
      const withinVerticalRestraint = absX <= restraint

      if (absX >= threshold && withinHorizontalRestraint) {
        if (deltaX > 0 && directions.includes("right")) {
          onClose()
        } else if (deltaX < 0 && directions.includes("left")) {
          onClose()
        }
      } else if (absY >= threshold && withinVerticalRestraint) {
        if (deltaY > 0 && directions.includes("down")) {
          onClose()
        } else if (deltaY < 0 && directions.includes("up")) {
          onClose()
        }
      }

      touchStartRef.current = null
    }

    element.addEventListener("touchstart", handleTouchStart, { passive: false })
    element.addEventListener("touchmove", handleTouchMove, { passive: false })
    element.addEventListener("touchend", handleTouchEnd)

    return () => {
      element.removeEventListener("touchstart", handleTouchStart)
      element.removeEventListener("touchmove", handleTouchMove)
      element.removeEventListener("touchend", handleTouchEnd)
    }
  }, [ref, onClose, directions, threshold, restraint, isActive])
}
