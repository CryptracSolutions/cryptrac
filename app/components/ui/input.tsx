import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, leftIcon, rightIcon, ...props }, ref) => {
    const inputId = React.useId()
    
    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className="font-phonic text-sm font-normal text-gray-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              "flex h-12 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 font-phonic text-base font-normal placeholder:text-gray-400 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-normal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7f5efd]/20 focus-visible:ring-offset-0 focus-visible:border-[#7f5efd] hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 ease-in-out",
              leftIcon && "pl-12",
              rightIcon && "pr-12",
              error && "border-error-500 focus-visible:ring-error-500/20 focus-visible:border-error-500",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="font-phonic text-sm text-error-600 font-normal">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }

