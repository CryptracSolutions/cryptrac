"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"

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

  if (isOnline) {
    return null
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 flex justify-center md:hidden"
      aria-live="polite"
    >
      <div
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg transition-colors bg-amber-100 text-amber-700 border border-amber-200"
      >
        <WifiOff className="h-4 w-4" />
        <span>Offline</span>
      </div>
    </div>
  )
}
