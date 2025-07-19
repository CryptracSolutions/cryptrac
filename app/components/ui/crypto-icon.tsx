import * as React from "react"
import { cn } from "@/lib/utils"

interface CryptoIconProps extends React.HTMLAttributes<HTMLDivElement> {
  currency: string
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "default" | "minimal"
}

const CryptoIcon = React.forwardRef<HTMLDivElement, CryptoIconProps>(
  ({ className, currency, size = "md", variant = "default", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-6 w-6",
      md: "h-8 w-8",
      lg: "h-12 w-12", 
      xl: "h-16 w-16"
    }
    
    const textSizeClasses = {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
      xl: "text-lg"
    }
    
    const getCurrencyColor = (curr: string) => {
      switch (curr.toUpperCase()) {
        case 'BTC':
        case 'BITCOIN':
          return '#f7931a'
        case 'ETH':
        case 'ETHEREUM':
          return '#627eea'
        case 'LTC':
        case 'LITECOIN':
          return '#bfbbbb'
        case 'ADA':
        case 'CARDANO':
          return '#0033ad'
        case 'DOT':
        case 'POLKADOT':
          return '#e6007a'
        case 'USDT':
        case 'TETHER':
          return '#26a17b'
        case 'USDC':
          return '#2775ca'
        default:
          return '#7f5efd' // Cryptrac purple for unknown currencies
      }
    }
    
    const getCurrencySymbol = (curr: string) => {
      switch (curr.toUpperCase()) {
        case 'BTC':
        case 'BITCOIN':
          return '₿'
        case 'ETH':
        case 'ETHEREUM':
          return 'Ξ'
        case 'LTC':
        case 'LITECOIN':
          return 'Ł'
        case 'ADA':
        case 'CARDANO':
          return '₳'
        case 'DOT':
        case 'POLKADOT':
          return '●'
        case 'USDT':
        case 'TETHER':
          return '₮'
        case 'USDC':
          return '$'
        default:
          return curr.charAt(0).toUpperCase()
      }
    }
    
    const color = getCurrencyColor(currency)
    const symbol = getCurrencySymbol(currency)
    
    if (variant === "minimal") {
      return (
        <div
          ref={ref}
          className={cn(
            "flex items-center justify-center rounded-full font-bold",
            sizeClasses[size],
            textSizeClasses[size],
            className
          )}
          style={{ backgroundColor: color, color: 'white' }}
          {...props}
        >
          {symbol}
        </div>
      )
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center rounded-full border-2 font-bold shadow-sm",
          sizeClasses[size],
          textSizeClasses[size],
          className
        )}
        style={{ 
          backgroundColor: `${color}15`, 
          borderColor: color,
          color: color
        }}
        {...props}
      >
        {symbol}
      </div>
    )
  }
)
CryptoIcon.displayName = "CryptoIcon"

export { CryptoIcon }

