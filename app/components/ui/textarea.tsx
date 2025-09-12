import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  label?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, ...props }, ref) => {
    const textareaId = React.useId()
    
    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={textareaId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-base font-normal placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7f5efd]/20 focus-visible:ring-offset-0 focus-visible:border-[#7f5efd] hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 ease-in-out resize-none",
            error && "border-error-500 focus-visible:ring-error-500/20 focus-visible:border-error-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }

