"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { ChevronUp, Star } from 'lucide-react'
import { CryptoIcon } from '@/app/components/ui/crypto-icon'

interface RecommendedCurrency {
  code: string
  name: string
}

interface TooltipProps {
  trigger: React.ReactNode
  title: string
  description: string
  recommendedCurrencies: RecommendedCurrency[]
  onCurrencyClick?: (currencyCode: string) => void
  className?: string
}

export default function Tooltip({ trigger, title, description, recommendedCurrencies, onCurrencyClick, className = "" }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close tooltip
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  // Handle escape key to close tooltip
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey)
      return () => {
        document.removeEventListener('keydown', handleEscapeKey)
      }
    }
  }, [isOpen])

  return (
    <div className={`relative ${className}`} ref={tooltipRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {isOpen && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 z-50 w-[560px] max-w-[90vw]">
          <Card className="border-[#7f5efd]/30 shadow-xl bg-white/95 backdrop-blur-sm rounded-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-[#7f5efd]" />
                  <CardTitle className="text-sm font-semibold text-[#7f5efd]">
                    {title}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0 hover:bg-[#7f5efd]/10"
                >
                  <ChevronUp className="h-4 w-4 text-[#7f5efd]" />
                </Button>
              </div>
              <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                {description}
              </p>
            </CardHeader>
            <CardContent className="pt-1 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recommendedCurrencies.map((currency) => (
                  <button
                    key={currency.code}
                    type="button"
                    onClick={() => {
                      if (onCurrencyClick) {
                        onCurrencyClick(currency.code)
                        setIsOpen(false)
                      }
                    }}
                    className="group w-full text-left flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#7f5efd]/40 bg-white hover:bg-[#7f5efd]/5 transition-colors"
                  >
                    <div className="flex items-center justify-center h-10 w-10 rounded-full ring-1 ring-[#7f5efd]/30 bg-white group-hover:ring-[#7f5efd]/60 flex-shrink-0">
                      <CryptoIcon currency={currency.code} className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 leading-tight">
                      <div className="text-sm font-medium text-gray-900 truncate">{currency.name}</div>
                      <div className="text-[11px] font-semibold tracking-wide text-[#7f5efd]">{currency.code}</div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
