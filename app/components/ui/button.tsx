import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#7f5efd] to-[#a78bfa] text-white shadow-lg hover:from-[#7c3aed] hover:to-[#8b5cf6] hover:shadow-xl hover:-translate-y-0.5",
        destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:-translate-y-0.5",
        outline: "border-2 border-[#7f5efd] bg-white text-[#7f5efd] hover:bg-[#f5f3ff] hover:border-[#7c3aed] hover:-translate-y-0.5 shadow-sm hover:shadow-md",
        secondary: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 border border-gray-200 hover:from-gray-200 hover:to-gray-300 hover:border-gray-300 hover:-translate-y-0.5 shadow-sm hover:shadow-md",
        ghost: "text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:-translate-y-0.5",
        link: "text-[#7f5efd] underline-offset-4 hover:underline hover:text-[#7c3aed]",
        gradient: "bg-gradient-to-r from-[#7f5efd] to-[#a78bfa] text-white shadow-lg hover:from-[#7c3aed] hover:to-[#8b5cf6] hover:shadow-xl hover:-translate-y-0.5",
        success: "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:from-green-600 hover:to-green-700 hover:shadow-xl hover:-translate-y-0.5",
        warning: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg hover:from-yellow-600 hover:to-yellow-700 hover:shadow-xl hover:-translate-y-0.5",
        premium: "bg-gradient-to-r from-[#7f5efd] via-[#a78bfa] to-[#c4b5fd] text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 hover:scale-105",
      },
      size: {
        default: "h-12 px-8 py-3 text-base",
        sm: "h-10 rounded-lg px-6 py-2 text-sm",
        lg: "h-14 rounded-xl px-10 py-4 text-lg",
        xl: "h-16 rounded-xl px-12 py-5 text-xl",
        icon: "h-12 w-12",
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
