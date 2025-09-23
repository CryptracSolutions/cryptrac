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
  /** Optional function returning the scrollable element that should gate downward dismissals. */
  getScrollElement?: () => HTMLElement | null
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
    getScrollElement,
  }: SwipeToCloseOptions
) {
  const gestureStartRef = useRef<{ x: number; y: number } | null>(null)
  const activeTouchIdRef = useRef<number | null>(null)
  const pointerIdRef = useRef<number | null>(null)
  const pointerCapturedRef = useRef(false)
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

    const supportsPointerEvents = typeof window !== "undefined" && "PointerEvent" in window

    const resolveScrollElement = () => getScrollElement?.() ?? element

    const releasePointerCapture = () => {
      if (!supportsPointerEvents) return
      if (!pointerCapturedRef.current) return
      if (pointerIdRef.current === null) return

      try {
        element.releasePointerCapture(pointerIdRef.current)
      } catch {
        // noop - element might already be detached
      }

      pointerCapturedRef.current = false
    }

    const resetGesture = () => {
      releasePointerCapture()
      gestureStartRef.current = null
      pointerIdRef.current = null
      activeTouchIdRef.current = null
    }

    const triggerClose = () => {
      const scrollElement = resolveScrollElement()
      // Release capture before invoking onClose to avoid acting on a detached node
      releasePointerCapture()
      gestureStartRef.current = null
      pointerIdRef.current = null
      activeTouchIdRef.current = null

      // Adjust scroll position to avoid stuck overscroll bounce on iOS
      if (scrollElement && typeof scrollElement.scrollTop === "number") {
        scrollElement.scrollTop = 0
      }

      onClose()
    }

    const isScrollAtStart = () => {
      const scrollElement = resolveScrollElement()
      if (!scrollElement) return true
      return scrollElement.scrollTop <= 2
    }

    const handleMovement = (
      deltaX: number,
      deltaY: number,
      preventDefault: () => void
    ) => {
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)
      const horizontal = absX > absY

      if (horizontal) {
        if ((directions.includes("left") || directions.includes("right")) && absY <= restraint) {
          preventDefault()
        }
        return
      }

      if (!(directions.includes("up") || directions.includes("down"))) {
        return
      }

      if (absX <= restraint) {
        if (deltaY > 0 && !isScrollAtStart()) {
          return
        }

        preventDefault()
      }
    }

    const handleCompletion = (deltaX: number, deltaY: number) => {
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      if (absX < threshold && absY < threshold) {
        return false
      }

      const withinHorizontalRestraint = absY <= restraint
      const withinVerticalRestraint = absX <= restraint

      if (absX >= threshold && withinHorizontalRestraint) {
        if (deltaX > 0 && directions.includes("right")) {
          triggerClose()
          return true
        }

        if (deltaX < 0 && directions.includes("left")) {
          triggerClose()
          return true
        }
      }

      if (absY >= threshold && withinVerticalRestraint) {
        if (deltaY > 0 && directions.includes("down")) {
          if (!isScrollAtStart()) {
            return false
          }

          triggerClose()
          return true
        }

        if (deltaY < 0 && directions.includes("up")) {
          triggerClose()
          return true
        }
      }

      return false
    }

    const ensureTouch = (list: TouchList, identifier: number | null) => {
      if (identifier === null) return null
      for (let index = 0; index < list.length; index += 1) {
        const candidate = list.item(index)
        if (candidate && candidate.identifier === identifier) {
          return candidate
        }
      }
      return null
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return
      if (gestureStartRef.current) return

      pointerIdRef.current = event.pointerId
      gestureStartRef.current = { x: event.clientX, y: event.clientY }
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return
      if (!gestureStartRef.current) return

      const deltaX = event.clientX - gestureStartRef.current.x
      const deltaY = event.clientY - gestureStartRef.current.y

      handleMovement(deltaX, deltaY, () => {
        if (event.cancelable) {
          event.preventDefault()
        }

        if (!pointerCapturedRef.current && pointerIdRef.current !== null) {
          try {
            element.setPointerCapture(pointerIdRef.current)
            pointerCapturedRef.current = true
          } catch {
            // ignore capture errors
          }
        }
      })
    }

    const handlePointerEnd = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return
      if (!gestureStartRef.current) return

      const deltaX = event.clientX - gestureStartRef.current.x
      const deltaY = event.clientY - gestureStartRef.current.y

      const closed = handleCompletion(deltaX, deltaY)
      if (!closed) {
        resetGesture()
      }
    }

    const handlePointerCancel = () => {
      resetGesture()
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 0) return
      if (gestureStartRef.current) return

      const touch = event.touches[0]
      gestureStartRef.current = { x: touch.clientX, y: touch.clientY }
      activeTouchIdRef.current = touch.identifier
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!gestureStartRef.current) return

      const touch = ensureTouch(event.touches, activeTouchIdRef.current) ??
        ensureTouch(event.changedTouches, activeTouchIdRef.current)

      if (!touch) return

      const deltaX = touch.clientX - gestureStartRef.current.x
      const deltaY = touch.clientY - gestureStartRef.current.y

      handleMovement(deltaX, deltaY, () => {
        if (event.cancelable) {
          event.preventDefault()
        }
      })
    }

    const handleTouchEnd = (event: TouchEvent) => {
      if (!gestureStartRef.current) return

      const touch = ensureTouch(event.changedTouches, activeTouchIdRef.current)
      if (!touch) {
        resetGesture()
        return
      }

      const deltaX = touch.clientX - gestureStartRef.current.x
      const deltaY = touch.clientY - gestureStartRef.current.y

      const closed = handleCompletion(deltaX, deltaY)
      if (!closed) {
        resetGesture()
      }
    }

    const handleTouchCancel = () => {
      resetGesture()
    }

    if (supportsPointerEvents) {
      element.addEventListener("pointerdown", handlePointerDown, { passive: true })
      element.addEventListener("pointermove", handlePointerMove, { passive: false })
      element.addEventListener("pointerup", handlePointerEnd)
      element.addEventListener("pointercancel", handlePointerCancel)
    }

    element.addEventListener("touchstart", handleTouchStart, { passive: true })
    window.addEventListener("touchmove", handleTouchMove, { passive: false })
    window.addEventListener("touchend", handleTouchEnd)
    window.addEventListener("touchcancel", handleTouchCancel)

    return () => {
      if (supportsPointerEvents) {
        element.removeEventListener("pointerdown", handlePointerDown)
        element.removeEventListener("pointermove", handlePointerMove)
        element.removeEventListener("pointerup", handlePointerEnd)
        element.removeEventListener("pointercancel", handlePointerCancel)
      }

      element.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
      window.removeEventListener("touchcancel", handleTouchCancel)

      resetGesture()
    }
  }, [ref, onClose, directions, threshold, restraint, isActive, getScrollElement])
}
