"use client"

import React from 'react'
import { formatAddressForQR } from '@/lib/simple-address-formatter'
import { cn } from '@/lib/utils'

interface QRCodeProps {
  // Preferred: currency/address/extraId for payment addresses
  currency?: string
  address?: string
  extraId?: string
  // Fallback: raw value to encode (e.g., payment URL)
  value?: string
  size?: number
  className?: string
  hideDetails?: boolean
}

export function QRCode({ currency, address, extraId, value, size = 256, className, hideDetails = false }: QRCodeProps) {
  const derived = currency && address ? formatAddressForQR(currency, address, extraId) : null
  const qrContent = value ?? derived?.qrContent ?? ''
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrContent)}`

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <img src={qrUrl} alt={`${currency} address QR`} width={size} height={size} className="rounded-lg" />
      {!hideDetails && (
        <div className="w-full text-center">
          {derived && (
            <>
            <div className="text-xs text-gray-500">Address</div>
            <code className="block text-sm break-all select-all">{derived.displayAddress}</code>
            </>
          )}
          {derived?.needsExtraId && extraId && (
            <>
              <div className="mt-2 text-xs text-gray-500">{derived.extraIdLabel}</div>
              <code className="block text-sm break-all select-all">{extraId}</code>
            </>
          )}
          <button
            className="mt-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            onClick={() => navigator.clipboard.writeText(qrContent)}
          >
            Copy Address
          </button>
        </div>
      )}
    </div>
  )
}
