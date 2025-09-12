"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Star } from 'lucide-react'
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

type Position = 'top' | 'bottom' | 'left' | 'right'

export default function Tooltip({ trigger, title, description, recommendedCurrencies, onCurrencyClick, className = "" }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<Position>('right')
  const [chevronIcon, setChevronIcon] = useState<React.ReactNode>(<ChevronRight className="h-4 w-4 text-[#7f5efd]" />)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  // Calculate the best position for the tooltip
  const calculateBestPosition = (): Position => {
    if (!triggerRef.current) return 'right'

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const isMobile = viewportWidth < 768

    // Tooltip dimensions (responsive)
    const tooltipWidth = isMobile ? Math.min(560, viewportWidth - 32) : 560
    const tooltipHeight = 300 // Approximate height

    // Calculate available space in each direction
    const spaceRight = viewportWidth - triggerRect.right
    const spaceLeft = triggerRect.left
    const spaceTop = triggerRect.top
    const spaceBottom = viewportHeight - triggerRect.bottom

    // Required margins (smaller on mobile)
    const margin = isMobile ? 16 : 20

    // Check if each direction has enough space
    const canFitRight = spaceRight >= tooltipWidth + margin
    const canFitLeft = spaceLeft >= tooltipWidth + margin
    const canFitTop = spaceTop >= tooltipHeight + margin
    const canFitBottom = spaceBottom >= tooltipHeight + margin

    // Priority order: right, bottom, left, top (adjusted for mobile)
    if (canFitRight) return 'right'
    if (canFitBottom) return 'bottom'
    if (canFitLeft) return 'left'
    if (canFitTop) return 'top'

    // On mobile, prefer bottom if possible, otherwise fallback to top
    if (isMobile) {
      if (spaceBottom >= tooltipHeight * 0.8) return 'bottom'
      if (spaceTop >= tooltipHeight * 0.8) return 'top'
    }

    // Final fallback
    return 'right'
  }

  // Update position when tooltip opens or window resizes
  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && triggerRef.current) {
        const bestPosition = calculateBestPosition()
        setPosition(bestPosition)

        // Set appropriate chevron icon
        switch (bestPosition) {
          case 'top':
            setChevronIcon(<ChevronUp className="h-4 w-4 text-[#7f5efd]" />)
            break
          case 'bottom':
            setChevronIcon(<ChevronDown className="h-4 w-4 text-[#7f5efd]" />)
            break
          case 'left':
            setChevronIcon(<ChevronLeft className="h-4 w-4 text-[#7f5efd]" />)
            break
          case 'right':
          default:
            setChevronIcon(<ChevronRight className="h-4 w-4 text-[#7f5efd]" />)
            break
        }
      }
    }

    if (isOpen) {
      updatePosition()
      window.addEventListener('resize', updatePosition)
      return () => window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen])

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

  // Get positioning classes based on calculated position
  const getPositionClasses = () => {
    const baseClasses = "absolute z-50 w-[560px] max-w-[calc(100vw-2rem)] sm:max-w-[90vw]"

    switch (position) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-3`
      case 'bottom':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-3`
      case 'left':
        return `${baseClasses} top-1/2 right-full transform translate-y-[-50%] mr-3`
      case 'right':
      default:
        return `${baseClasses} top-1/2 left-full transform -translate-y-1/2 ml-3`
    }
  }

  return (
    <div className={`relative ${className}`} ref={tooltipRef}>
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {isOpen && (
        <div className={getPositionClasses()}>
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
                  {chevronIcon}
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
