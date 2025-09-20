"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

interface RadioGroupItemProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  error?: boolean
}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, error, disabled, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      disabled={disabled}
      className={cn(
        "aspect-square h-4 w-4 rounded-full bg-white transition-all duration-200",
        "border border-[#d5dbe1] shadow-[0px_2px_5px_0px_rgba(48,49,61,0.08),0px_1px_1px_0px_rgba(0,0,0,0.12)]",
        "hover:border-[#c1c9d5]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7f5efd] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#f6f9fc]",
        "data-[state=checked]:border-[#7f5efd]",
        error && "border-[#e85d75] hover:border-[#e85d75]",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        className="flex items-center justify-center"
        forceMount
      >
        <div
          className={cn(
            "h-2 w-2 rounded-full bg-[#7f5efd] transition-transform duration-150",
            "data-[state=unchecked]:scale-0 data-[state=checked]:scale-100"
          )}
        />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }