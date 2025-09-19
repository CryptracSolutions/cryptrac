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
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="font-inter text-sm font-medium text-gray-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 font-inter text-sm font-normal placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-0 focus-visible:border-primary-500 hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-y",
            error && "border-error-500 focus-visible:ring-error-500 focus-visible:border-error-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="font-inter text-xs text-error-600 font-normal mt-1">{error}</p>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }

