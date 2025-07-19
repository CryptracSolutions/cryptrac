import * as React from "react"
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
    
    const iconColor = variant === "white" ? "#ffffff" : variant === "dark" ? "#1f2937" : "#7f5efd"
    
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        {/* Cryptrac Icon - Simplified version of the logo */}
        <div className={cn("flex items-center justify-center", sizeClasses[size])}>
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-full w-full"
          >
            {/* Simplified geometric representation of the Cryptrac logo */}
            <rect
              x="10"
              y="20"
              width="80"
              height="15"
              rx="7.5"
              fill={iconColor}
            />
            <rect
              x="10"
              y="42.5"
              width="60"
              height="15"
              rx="7.5"
              fill={iconColor}
            />
            <rect
              x="10"
              y="65"
              width="80"
              height="15"
              rx="7.5"
              fill={iconColor}
            />
            <circle
              cx="75"
              cy="50"
              r="8"
              fill={variant === "white" ? "#ffffff" : "#ffffff"}
            />
          </svg>
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

