"use client"

import Image, { type ImageProps } from "next/image"

const DEFAULT_SIZES = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
const FALLBACK_BLUR = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAACEN3D/AAAAD0lEQVR42mP8z/C/HwMDAwMjAHertMsox1AAAAAASUVORK5CYII="

type OptimizedImageVariant = "photo" | "qr" | "icon"

type BaseProps = Omit<ImageProps, "placeholder" | "quality" | "sizes">

export interface OptimizedImageProps extends BaseProps {
  variant?: OptimizedImageVariant
  quality?: number
  sizes?: string
  placeholder?: "blur" | "empty"
  blurDataURL?: string
}

/**
 * Centralised wrapper for `next/image` enforcing consistent mobile sizing,
 * blur placeholders, and quality defaults without touching desktop layouts.
 */
export function OptimizedImage({
  alt,
  variant = "photo",
  sizes = DEFAULT_SIZES,
  quality,
  placeholder = "blur",
  blurDataURL,
  ...rest
}: OptimizedImageProps) {
  const resolvedQuality = quality ?? (variant === "qr" ? 100 : 85)
  const resolvedBlur = placeholder === "blur" ? (blurDataURL || FALLBACK_BLUR) : undefined

  return (
    <Image
      alt={alt}
      sizes={sizes}
      quality={resolvedQuality}
      placeholder={placeholder}
      blurDataURL={resolvedBlur}
      {...rest}
    />
  )
}
