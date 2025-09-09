"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/app/components/ui/dialog'
import { Button } from '@/app/components/ui/button'
import { CheckCircle } from 'lucide-react'

interface DestinationTagModalProps {
  isOpen: boolean
  onClose: () => void
  currency: string
}

export default function DestinationTagModal({ isOpen, onClose, currency }: DestinationTagModalProps) {
  const getTitle = (currency: string) => {
    switch (currency.toUpperCase()) {
      case 'XRP': return 'About Destination Tags'
      case 'XLM': return 'About Memos'
      default: return 'About Extra IDs'
    }
  }

  const getExtraIdLabel = (currency: string) => {
    switch (currency.toUpperCase()) {
      case 'XRP': return 'destination tag'
      case 'XLM': return 'memo'
      default: return 'extra ID'
    }
  }

  const getExtraIdDescription = (currency: string) => {
    switch (currency.toUpperCase()) {
      case 'XRP': return 'Numeric destination tag (1-10 digits)'
      case 'XLM': return 'Memo (1-28 characters)'
      default: return 'Extra ID'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm bg-white border-[#7f5efd] shadow-xl">
        <DialogHeader className="text-center pb-3">
          <DialogTitle className="text-lg font-bold text-gray-900">
            {getTitle(currency)}
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-sm leading-relaxed">
            Important information for {currency.toUpperCase()} payments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="bg-[#7f5efd]/5 p-3 rounded-lg border border-[#7f5efd]/20">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-[#7f5efd] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Include your {getExtraIdLabel(currency)} only if your wallet or exchange requires it
                  (e.g., Coinbase, Binance, Kraken, Crypto.com).
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#7f5efd]/5 p-3 rounded-lg border border-[#7f5efd]/20">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-[#7f5efd] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Personal wallets typically don&apos;t need a {getExtraIdLabel(currency)}. Exchanges often do.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500 mt-2">
            {getExtraIdDescription(currency)}
          </div>
        </div>

        <div className="flex justify-center pt-3">
          <DialogClose asChild>
            <Button
              onClick={onClose}
              className="bg-[#7f5efd] hover:bg-[#6b4fd8] text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors duration-200"
            >
              I Understand
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
