import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "default" | "white" | "dark"
  showText?: boolean
}

const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ className, size = "md", variant = "default", showText = true, ...props }, ref) => {
    const sizeClasses = {
      sm: "h-6 w-6",
      md: "h-8 w-8", 
      lg: "h-12 w-12",
      xl: "h-16 w-16"
    }
    
    const textSizeClasses = {
      sm: "text-lg",
      md: "text-xl",
      lg: "text-2xl", 
      xl: "text-3xl"
    }
    
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-3", className)}
        {...props}
      >
        {/* Cryptrac Logo */}
        <div className={cn("flex items-center justify-center", sizeClasses[size])}>
          <Image
            src="/logo.png"
            alt="Cryptrac Logo"
            width={size === "sm" ? 24 : size === "md" ? 32 : size === "lg" ? 48 : 64}
            height={size === "sm" ? 24 : size === "md" ? 32 : size === "lg" ? 48 : 64}
            className="h-full w-full object-contain"
            priority
          />
        </div>
        
        {showText && (
          <span 
            className={cn(
              "font-bold tracking-tight",
              textSizeClasses[size],
              variant === "white" ? "text-white" : variant === "dark" ? "text-gray-900" : "text-gray-900"
            )}
          >
            Cryptrac
          </span>
        )}
      </div>
    )
  }
)
Logo.displayName = "Logo"

export { Logo }

