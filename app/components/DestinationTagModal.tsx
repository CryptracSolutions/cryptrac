"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Button } from '@/app/components/ui/button'
import { Info, CheckCircle } from 'lucide-react'

interface DestinationTagModalProps {
  isOpen: boolean
  onClose: () => void
  currency: string
}

export default function DestinationTagModal({ isOpen, onClose, currency }: DestinationTagModalProps) {
  const getExtraIdLabel = (currency: string) => {
    switch (currency.toUpperCase()) {
      case 'XRP': return 'Destination Tag'
      case 'XLM': return 'Memo'
      case 'HBAR': return 'Memo'
      default: return 'Extra ID'
    }
  }

  const getExtraIdDescription = (currency: string) => {
    switch (currency.toUpperCase()) {
      case 'XRP': return 'Numeric destination tag (1-10 digits)'
      case 'XLM': return 'Memo (1-28 characters)'
      case 'HBAR': return 'Memo (1-100 characters)'
      default: return 'Extra ID'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-[#7f5efd]/20 shadow-2xl">
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#7f5efd]/10">
            <Info className="h-6 w-6 text-[#7f5efd]" />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">
            {getExtraIdLabel(currency)} Information
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base leading-relaxed">
            Important information about using {getExtraIdLabel(currency).toLowerCase()}s with {currency.toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-[#7f5efd]/5 to-purple-50 p-4 rounded-lg border border-[#7f5efd]/20">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-[#7f5efd] mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">When to Include</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Include your {getExtraIdLabel(currency).toLowerCase()} only if your wallet or exchange requires it
                  (e.g., Coinbase, Binance, Kraken, Crypto.com).
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Personal Wallets vs Exchanges</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Personal wallets typically don't need a {getExtraIdLabel(currency).toLowerCase()}. Exchanges often do.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-gray-300 flex items-center justify-center mt-0.5 flex-shrink-0">
                <span className="text-xs font-bold text-gray-700">?</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Format Requirements</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {getExtraIdDescription(currency)}. This helps ensure your payments are correctly attributed.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-yellow-400 flex items-center justify-center mt-0.5 flex-shrink-0">
                <span className="text-xs font-bold text-yellow-800">!</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Important Note</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  If you're unsure whether your wallet requires a {getExtraIdLabel(currency).toLowerCase()},
                  check your wallet's documentation or contact their support team.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button
            onClick={onClose}
            className="bg-[#7f5efd] hover:bg-[#6b4fd8] text-white px-8 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            I Understand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
