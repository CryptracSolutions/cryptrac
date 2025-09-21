import { WifiOff } from "lucide-react"
import { ReconnectActions } from "./reconnect-actions"

export const metadata = {
  title: "Offline | Cryptrac",
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7f5efd]/10">
          <WifiOff className="h-8 w-8 text-[#7f5efd]" />
        </div>
        <div className="space-y-4">
          <h1 className="font-phonic text-3xl font-semibold text-gray-900">You&apos;re offline</h1>
          <p className="font-capsule text-base text-gray-600">
            Cryptrac is still available when you reconnect. Check your connection and try again, or keep exploring cached pages.
          </p>
        </div>
        <ReconnectActions />
        <p className="text-xs text-gray-400 font-capsule">
          Offline mode caches recent pages, payment links, and smart terminal screens so you can keep serving customers.
        </p>
      </div>
    </div>
  )
}
