"use client"

import { RefreshCw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/app/components/ui/button"

export function ReconnectActions() {
  return (
    <div className="space-y-3">
      <Button
        size="lg"
        className="w-full bg-[#7f5efd] hover:bg-[#6b4fd8] text-white"
        onClick={() => window.location.reload()}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Retry Connection
      </Button>
      <Button
        variant="outline"
        size="lg"
        className="w-full border-[#7f5efd]/40 text-[#7f5efd] hover:bg-[#7f5efd]/10"
        asChild
      >
        <Link href="/">Back to Dashboard</Link>
      </Button>
    </div>
  )
}
