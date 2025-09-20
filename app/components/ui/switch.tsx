"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  error?: boolean
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, error, disabled, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    disabled={disabled}
    className={cn(
      "peer inline-flex h-[18px] w-8 shrink-0 cursor-pointer items-center rounded-full transition-all duration-200",
      "border border-[#d5dbe1] bg-[#f6f9fc] shadow-[inset_0px_1px_1px_0px_rgba(0,0,0,0.06)]",
      "hover:border-[#c1c9d5]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7f5efd] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-[#7f5efd] data-[state=checked]:border-[#7f5efd]",
      error && "border-[#e85d75] hover:border-[#e85d75] data-[state=checked]:bg-[#e85d75] data-[state=checked]:border-[#e85d75]",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block h-[14px] w-[14px] rounded-full bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.12)] transition-transform duration-200",
        "data-[state=checked]:translate-x-[14px] data-[state=unchecked]:translate-x-[1px]"
      )}
    />
  </SwitchPrimitive.Root>
))
Switch.displayName = SwitchPrimitive.Root.displayName

export { Switch }