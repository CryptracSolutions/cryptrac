"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "@/components/ui/icons"
import { cn } from "@/lib/utils"

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  error?: boolean
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, error, disabled, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    disabled={disabled}
    className={cn(
      "peer relative h-4 w-4 shrink-0 rounded-[4px] bg-white transition-all duration-200",
      "border border-[#d5dbe1] shadow-[0px_2px_5px_0px_rgba(48,49,61,0.08),0px_1px_1px_0px_rgba(0,0,0,0.12)]",
      "hover:border-[#c1c9d5]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7f5efd] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#f6f9fc]",
      "data-[state=checked]:bg-[#7f5efd] data-[state=checked]:border-[#7f5efd]",
      "data-[state=indeterminate]:bg-[#7f5efd] data-[state=indeterminate]:border-[#7f5efd]",
      error && "border-[#e85d75] hover:border-[#e85d75]",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn(
        "flex items-center justify-center text-white",
        "data-[state=checked]:animate-in data-[state=checked]:fade-in-0 data-[state=checked]:zoom-in-95",
        "data-[state=unchecked]:animate-out data-[state=unchecked]:fade-out-0 data-[state=unchecked]:zoom-out-95"
      )}
    >
      <CheckIcon className="h-2.5 w-2.5" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }

