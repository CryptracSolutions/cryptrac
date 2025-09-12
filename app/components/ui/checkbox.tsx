"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border-2 border-gray-200 bg-white ring-offset-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7f5efd]/20 focus-visible:ring-offset-0 focus-visible:border-[#7f5efd] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#7f5efd] data-[state=checked]:text-white data-[state=checked]:border-[#7f5efd] transition-all duration-200 ease-in-out",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }

