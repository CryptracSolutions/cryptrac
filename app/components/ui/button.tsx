import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#7f5efd] text-white shadow-lg hover:bg-[#7c3aed] hover:shadow-xl active:scale-[0.98]",
        destructive: "bg-red-500 text-white shadow-lg hover:bg-red-600 hover:shadow-xl active:scale-[0.98]",
        outline: "border-2 border-[#7f5efd] bg-white text-[#7f5efd] hover:bg-[#f5f3ff] hover:border-[#7c3aed] active:scale-[0.98]",
        secondary: "bg-gray-100 text-gray-900 border border-gray-200 hover:bg-gray-200 hover:border-gray-300 active:scale-[0.98]",
        ghost: "text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:scale-[0.98]",
        link: "text-[#7f5efd] underline-offset-4 hover:underline hover:text-[#7c3aed]",
        gradient: "bg-gradient-to-r from-[#7f5efd] to-[#a78bfa] text-white shadow-lg hover:from-[#7c3aed] hover:to-[#8b5cf6] hover:shadow-xl active:scale-[0.98]",
        success: "bg-green-500 text-white shadow-lg hover:bg-green-600 hover:shadow-xl active:scale-[0.98]",
      },
      size: {
        default: "h-11 px-6 py-3 text-base",
        sm: "h-9 rounded-md px-4 py-2 text-sm",
        lg: "h-12 rounded-lg px-8 py-3 text-lg",
        xl: "h-14 rounded-lg px-10 py-4 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
