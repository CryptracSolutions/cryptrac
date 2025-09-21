"use client"

import { useEffect, useState, type RefObject } from "react"

export interface UseInViewportOptions {
  rootMargin?: string
  threshold?: number | number[]
  once?: boolean
}

/**
 * Observes when an element enters the viewport using IntersectionObserver.
 */
export function useInViewport<T extends Element>(
  ref: RefObject<T | null>,
  { rootMargin = "120px", threshold = 0.1, once = true }: UseInViewportOptions = {}
) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      if (element) {
        // Without IntersectionObserver (older browsers), render immediately.
        setIsVisible(true)
      }
      return
    }

    let observer: IntersectionObserver | null = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            if (once && observer) {
              observer.disconnect()
            }
          } else if (!once) {
            setIsVisible(false)
          }
        })
      },
      { rootMargin, threshold }
    )

    observer.observe(element)

    return () => {
      observer?.disconnect()
      observer = null
    }
  }, [ref, rootMargin, threshold, once])

  return isVisible
}
