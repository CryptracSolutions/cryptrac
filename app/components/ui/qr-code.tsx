"use client"
import React, { useEffect, useRef, useState } from 'react'
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
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!value) {
      setIsLoading(false)
      return
    }

    const generateQRCode = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Use a different approach - dynamic import with explicit default access
        const QRCodeLib = await import('qrcode')
        
        // Generate QR code as data URL instead of canvas
        const dataUrl = await QRCodeLib.default.toDataURL(value, {
          width: size,
          margin: 2,
          color: {
            dark: foregroundColor,
            light: backgroundColor
          },
          errorCorrectionLevel: 'M'
        })
        
        setQrDataUrl(dataUrl)
        setIsLoading(false)
      } catch (err) {
        console.error('QR Code generation error:', err)
        setError('Failed to generate QR code')
        setIsLoading(false)
      }
    }

    // Add a small delay to ensure component is mounted
    const timer = setTimeout(generateQRCode, 100)
    return () => clearTimeout(timer)
  }, [value, size, backgroundColor, foregroundColor])

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

  if (error) {
    return (
      <div 
        className={cn("flex items-center justify-center bg-red-50 border border-red-200 rounded-lg", className)}
        style={{ width: size, height: size }}
      >
        <div className="text-red-500 text-center">
          <div className="w-8 h-8 mx-auto mb-2">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <span className="text-xs">Error</span>
        </div>
      </div>
    )
  }

  if (isLoading || !qrDataUrl) {
    return (
      <div 
        className={cn("flex items-center justify-center bg-gray-100 rounded-lg animate-pulse", className)}
        style={{ width: size, height: size }}
      >
        <div className="text-gray-400 text-center">
          <div className="w-8 h-8 mx-auto mb-2 opacity-50">
            <svg viewBox="0 0 24 24" fill="currentColor" className="animate-spin">
              <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/>
            </svg>
          </div>
          <span className="text-xs">Generating QR...</span>
        </div>
      </div>
    )
  }

  return (
    <img
      src={qrDataUrl}
      alt="QR Code"
      className={cn("rounded-lg", className)}
      style={{ width: size, height: size }}
    />
  )
}

// Hook for generating QR code data URL
export function useQRCodeDataURL(value: string, size: number = 200): string | null {
  const [dataURL, setDataURL] = useState<string | null>(null)

  useEffect(() => {
    if (!value) {
      setDataURL(null)
      return
    }

    const generateDataURL = async () => {
      try {
        const QRCodeLib = await import('qrcode')
        const url = await QRCodeLib.default.toDataURL(value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'M'
        })
        setDataURL(url)
      } catch (error) {
        console.error('QR Code data URL generation error:', error)
        setDataURL(null)
      }
    }

    generateDataURL()
  }, [value, size])

  return dataURL
}

// Utility function to download QR code as image
export async function downloadQRCode(value: string, filename: string = 'qr-code.png', size: number = 400) {
  try {
    const QRCodeLib = await import('qrcode')
    const dataURL = await QRCodeLib.default.toDataURL(value, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })

    // Create download link
    const link = document.createElement('a')
    link.href = dataURL
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('QR Code download error:', error)
    throw new Error('Failed to download QR code')
  }
}

