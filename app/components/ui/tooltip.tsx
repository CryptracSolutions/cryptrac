"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { ChevronDown, ChevronUp, Star, Info } from 'lucide-react'
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
  className?: string
}

export default function Tooltip({ trigger, title, description, recommendedCurrencies, className = "" }: TooltipProps) {
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
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 z-50 w-full max-w-md">
          <Card className="border-purple-200 shadow-lg bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-purple-600" />
                  <CardTitle className="text-sm font-semibold text-purple-900">
                    {title}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0 hover:bg-purple-50"
                >
                  <ChevronUp className="h-4 w-4 text-purple-600" />
                </Button>
              </div>
              <p className="text-xs text-purple-700 mt-1 leading-relaxed">
                {description}
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {recommendedCurrencies.map((currency) => (
                  <div
                    key={currency.code}
                    className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all duration-200 border border-purple-100"
                  >
                    <CryptoIcon currency={currency.code} className="h-6 w-6 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-purple-900 truncate leading-tight">
                        {currency.name}
                      </div>
                      <div className="text-xs text-purple-600 uppercase font-medium">
                        {currency.code}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
