import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  error?: string
  label?: string
  helpText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  size?: "small" | "medium" | "large"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, helpText, leftIcon, rightIcon, size = "medium", disabled, ...props }, ref) => {
    const inputId = React.useId()

    const sizeClasses = {
      small: "h-6 text-xs px-2 py-1",
      medium: "h-7 text-sm px-2 py-1",
      large: "h-9 text-base px-3 py-1.5"
    }

    const iconSizeClasses = {
      small: "w-3 h-3",
      medium: "w-3.5 h-3.5",
      large: "w-4 h-4"
    }

    const iconPositionClasses = {
      small: leftIcon ? "pl-6" : "",
      medium: leftIcon ? "pl-7" : "",
      large: leftIcon ? "pl-9" : ""
    }

    const rightIconPositionClasses = {
      small: rightIcon ? "pr-6" : "",
      medium: rightIcon ? "pr-7" : "",
      large: rightIcon ? "pr-9" : ""
    }

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-[#30313d] mb-1 tracking-[-0.154px]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none",
              iconSizeClasses[size],
              disabled ? "text-[#a3acba]" : "text-[#6a7383]"
            )}>
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            disabled={disabled}
            className={cn(
              "w-full rounded bg-white font-normal tracking-[-0.154px] placeholder:text-[#a3acba] transition-all duration-200",
              "border border-[#e3e8ee] shadow-[0px_2px_5px_0px_rgba(60,66,87,0.12),0px_1px_1px_0px_rgba(0,0,0,0.08)]",
              "hover:border-[#d5dbe1]",
              "focus:outline-none focus:ring-2 focus:ring-[#7f5efd] focus:ring-offset-0 focus:border-[#7f5efd] focus:shadow-[0px_2px_5px_0px_rgba(127,94,253,0.12),0px_1px_1px_0px_rgba(127,94,253,0.08)]",
              "disabled:bg-[#f6f9fc] disabled:border-[#e3e8ee] disabled:text-[#a3acba] disabled:cursor-not-allowed disabled:opacity-75",
              sizeClasses[size],
              iconPositionClasses[size],
              rightIconPositionClasses[size],
              error && "border-[#e85d75] hover:border-[#e85d75] focus:ring-[#e85d75] focus:border-[#e85d75]",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none",
              iconSizeClasses[size],
              disabled ? "text-[#a3acba]" : error ? "text-[#e85d75]" : "text-[#6a7383]"
            )}>
              {rightIcon}
            </div>
          )}
        </div>
        {helpText && !error && (
          <p className="mt-1 text-xs text-[#6a7383] tracking-[-0.154px]">{helpText}</p>
        )}
        {error && (
          <p className="mt-1 text-xs text-[#e85d75] tracking-[-0.154px]">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
