"use client"

import * as React from "react"
import { Label } from "@/app/components/ui/label"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  children: React.ReactNode
  label?: string
  helpText?: string
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
  htmlFor?: string
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ children, label, helpText, error, required, disabled, className, htmlFor }, ref) => {
    return (
      <div ref={ref} className={cn("w-full", className)}>
        {label && (
          <Label
            htmlFor={htmlFor}
            required={required}
            disabled={disabled}
            className="mb-1"
          >
            {label}
          </Label>
        )}
        <div>{children}</div>
        {(helpText || error) && (
          <div className="mt-1">
            {helpText && !error && (
              <p className="text-xs text-[#6a7383] tracking-[-0.154px]">{helpText}</p>
            )}
            {error && (
              <p className="text-xs text-[#e85d75] tracking-[-0.154px]">{error}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)
FormField.displayName = "FormField"

interface FormFieldWithCheckboxProps extends Omit<FormFieldProps, 'children'> {
  children: React.ReactNode
  checkboxPosition?: "left" | "right"
  inline?: boolean
}

const FormFieldWithCheckbox = React.forwardRef<HTMLDivElement, FormFieldWithCheckboxProps>(
  ({ children, label, helpText, error, className, checkboxPosition = "left", inline = true }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start gap-3",
          inline ? "flex-row" : "flex-col",
          className
        )}
      >
        {checkboxPosition === "left" && (
          <div className="flex items-center h-5">{children}</div>
        )}
        <div className="flex-1">
          {label && (
            <label className="block text-sm font-semibold text-[#30313d] tracking-[-0.154px] leading-5 cursor-pointer">
              {label}
            </label>
          )}
          {helpText && (
            <p className="text-xs text-[#6a7383] tracking-[-0.154px] mt-0.5">{helpText}</p>
          )}
          {error && (
            <p className="text-xs text-[#e85d75] tracking-[-0.154px] mt-0.5">{error}</p>
          )}
        </div>
        {checkboxPosition === "right" && (
          <div className="flex items-center h-5">{children}</div>
        )}
      </div>
    )
  }
)
FormFieldWithCheckbox.displayName = "FormFieldWithCheckbox"

export { FormField, FormFieldWithCheckbox }