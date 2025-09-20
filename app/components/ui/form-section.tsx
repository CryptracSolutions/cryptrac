import * as React from "react"
import { cn } from "@/lib/utils"

interface FormSectionProps {
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
}

const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ children, title, description, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-4", className)}
      >
        {(title || description) && (
          <div className="space-y-1">
            {title && (
              <h3 className="text-base font-bold text-[#30313d] tracking-[-0.4px] leading-6">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-[#6a7383] tracking-[-0.154px] leading-5">
                {description}
              </p>
            )}
          </div>
        )}
        <div className="space-y-4">
          {children}
        </div>
      </div>
    )
  }
)
FormSection.displayName = "FormSection"

interface FormSubheadingProps {
  children: React.ReactNode
  className?: string
}

const FormSubheading = React.forwardRef<HTMLDivElement, FormSubheadingProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "text-[11px] font-semibold text-[#30313d] uppercase tracking-[-0.4px] leading-5 mb-3",
          className
        )}
      >
        {children}
      </div>
    )
  }
)
FormSubheading.displayName = "FormSubheading"

export { FormSection, FormSubheading }