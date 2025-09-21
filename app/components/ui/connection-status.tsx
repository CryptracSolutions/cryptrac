"use client"

import { useEffect, useState } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator === "undefined" ? true : navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-4 flex justify-center md:hidden",
        isOnline ? "" : ""
      )}
      aria-live="polite"
    >
      <div
        className={cn(
          "pointer-events-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg transition-colors",
          isOnline
            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
            : "bg-amber-100 text-amber-700 border border-amber-200"
        )}
      >
        {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <span>{isOnline ? "Connected" : "Offline"}</span>
      </div>
    </div>
  )
}
