"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Sidebar } from "./sidebar"
import { cn } from "@/lib/utils"
import { useSwipeToClose } from "@/lib/hooks/use-swipe-to-close"

interface MobileNavProps {
  open: boolean
  onClose: () => void
  userRole?: string
}

export function MobileNav({ open, onClose, userRole }: MobileNavProps) {
  const panelRef = React.useRef<HTMLDivElement>(null)

  const closeOnEscape = React.useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    },
    [onClose]
  )

  useSwipeToClose(panelRef, {
    onClose,
    directions: ["left"],
    threshold: 65,
    restraint: 90,
    enabled: open,
  })

  React.useEffect(() => {
    if (!open) return

    document.addEventListener("keydown", closeOnEscape)
    return () => document.removeEventListener("keydown", closeOnEscape)
  }, [open, closeOnEscape])

  if (!open) return null

  return (
    <div className="md:hidden">
      <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
        <button
          type="button"
          aria-label="Close mobile navigation"
          onClick={onClose}
          className="flex-1 bg-black/70 backdrop-blur-sm"
        />

        <div ref={panelRef} className="relative w-[85vw] max-w-xs h-full shadow-2xl">
          <Sidebar
            userRole={userRole}
            collapsed={false}
            className={cn(
              "max-md:w-full max-md:max-w-xs",
              "bg-black"
            )}
          />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="absolute right-3 top-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
