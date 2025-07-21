"use client"

import React, { useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface QRCodeProps {
  value: string
  size?: number
  className?: string
  backgroundColor?: string
  foregroundColor?: string
}

export function QRCode({ 
  value, 
  size = 200, 
  className,
  backgroundColor = '#ffffff',
  foregroundColor = '#000000'
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const generateMockQRPattern = useCallback((data: string, gridSize: number): boolean[][] => {
    const pattern: boolean[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false))
    
    // Simple hash-based pattern generation
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash + data.charCodeAt(i)) & 0xffffffff
    }

    // Fill pattern based on hash
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Skip finder pattern areas
        if (isFinderPatternArea(row, col, gridSize)) continue
        
        const cellHash = (hash + row * gridSize + col) & 0xffffffff
        pattern[row][col] = (cellHash % 3) === 0
      }
    }

    return pattern
  }, [])

  const isFinderPatternArea = useCallback((row: number, col: number, gridSize: number): boolean => {
    // Top-left finder pattern
    if (row < 9 && col < 9) return true
    // Top-right finder pattern
    if (row < 9 && col >= gridSize - 9) return true
    // Bottom-left finder pattern
    if (row >= gridSize - 9 && col < 9) return true
    
    return false
  }, [])

  const drawFinderPattern = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number) => {
    // Outer square (7x7)
    ctx.fillRect(x, y, cellSize * 7, cellSize * 7)
    
    // Inner white square (5x5)
    ctx.fillStyle = backgroundColor
    ctx.fillRect(x + cellSize, y + cellSize, cellSize * 5, cellSize * 5)
    
    // Center black square (3x3)
    ctx.fillStyle = foregroundColor
    ctx.fillRect(x + cellSize * 2, y + cellSize * 2, cellSize * 3, cellSize * 3)
  }, [backgroundColor, foregroundColor])

  useEffect(() => {
    if (!canvasRef.current || !value) return

    // Simple QR code generation (in production, use a proper QR library like qrcode)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    // Set canvas size
    canvas.width = size
    canvas.height = size

    // Clear canvas
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, size, size)

    // Generate a simple pattern (placeholder for real QR code)
    const gridSize = 25
    const cellSize = size / gridSize
    
    ctx.fillStyle = foregroundColor

    // Create a mock QR pattern based on the value
    const pattern = generateMockQRPattern(value, gridSize)
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (pattern[row][col]) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
        }
      }
    }

    // Add finder patterns (corners)
    drawFinderPattern(ctx, 0, 0, cellSize)
    drawFinderPattern(ctx, (gridSize - 7) * cellSize, 0, cellSize)
    drawFinderPattern(ctx, 0, (gridSize - 7) * cellSize, cellSize)

  }, [value, size, backgroundColor, foregroundColor, generateMockQRPattern, drawFinderPattern])

  if (!value) {
    return (
      <div 
        className={cn("flex items-center justify-center bg-gray-100 rounded-lg", className)}
        style={{ width: size, height: size }}
      >
        <div className="text-gray-400 text-center">
          <div className="w-8 h-8 mx-auto mb-2 opacity-50">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4z"/>
            </svg>
          </div>
          <span className="text-xs">QR Code</span>
        </div>
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn("rounded-lg", className)}
      style={{ width: size, height: size }}
    />
  )
}

// Hook for generating QR code data URL
export function useQRCodeDataURL(value: string, size: number = 200): string | null {
  const [dataURL, setDataURL] = React.useState<string | null>(null)

  useEffect(() => {
    if (!value) {
      setDataURL(null)
      return
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    canvas.width = size
    canvas.height = size

    // Generate QR code on canvas (same logic as above)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    const gridSize = 25
    const cellSize = size / gridSize
    
    ctx.fillStyle = '#000000'

    // Simple pattern generation
    let hash = 0
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash + value.charCodeAt(i)) & 0xffffffff
    }

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (row < 9 && col < 9) continue // Skip finder patterns
        if (row < 9 && col >= gridSize - 9) continue
        if (row >= gridSize - 9 && col < 9) continue
        
        const cellHash = (hash + row * gridSize + col) & 0xffffffff
        if ((cellHash % 3) === 0) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
        }
      }
    }

    // Add finder patterns
    const drawFinder = (x: number, y: number) => {
      ctx.fillRect(x, y, cellSize * 7, cellSize * 7)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x + cellSize, y + cellSize, cellSize * 5, cellSize * 5)
      ctx.fillStyle = '#000000'
      ctx.fillRect(x + cellSize * 2, y + cellSize * 2, cellSize * 3, cellSize * 3)
    }

    drawFinder(0, 0)
    drawFinder((gridSize - 7) * cellSize, 0)
    drawFinder(0, (gridSize - 7) * cellSize)

    setDataURL(canvas.toDataURL())
  }, [value, size])

  return dataURL
}

