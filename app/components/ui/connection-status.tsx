"use client"

import { useEffect } from "react"

// Minimal placeholder that keeps prior API surface but renders nothing by default.
// Desktop and mobile visuals remain unchanged.
export function ConnectionStatus() {
  useEffect(() => {
    const handleOnline = () => {}
    const handleOffline = () => {}
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Intentionally render nothing; reserved for future subtle indicators.
  return null
}
