"use client"

import * as React from "react"
import { useInViewport } from "@/lib/hooks/use-in-viewport"

interface LazyMountProps {
  children: React.ReactNode
  placeholder?: React.ReactNode
  className?: string
  rootMargin?: string
  threshold?: number | number[]
  once?: boolean
}

/**
 * Defers rendering of heavy UI until it enters the viewport (mobile-first, desktop unaffected).
 */
export function LazyMount({
  children,
  placeholder = null,
  className,
  rootMargin,
  threshold,
  once = true,
}: LazyMountProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const isVisible = useInViewport(containerRef, { rootMargin, threshold, once })

  return (
    <div ref={containerRef} className={className}>
      {isVisible ? children : placeholder}
    </div>
  )
}
