import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary-500 hover:bg-primary-600 text-white shadow-medium focus-visible:ring-primary-500",
        destructive:
          "bg-error-500 hover:bg-error-600 text-white shadow-medium focus-visible:ring-error-500",
        outline:
          "border border-primary-500 text-primary-500 hover:bg-gray-50 focus-visible:ring-primary-500",
        secondary:
          "bg-gray-100 hover:bg-gray-200 text-gray-900 shadow-sm focus-visible:ring-gray-300",
        ghost:
          "text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-300",
        link:
          "text-primary-500 underline-offset-4 hover:underline",
        success:
          "bg-success-500 hover:bg-success-600 text-white shadow-medium focus-visible:ring-success-500",
        warning:
          "bg-warning-500 hover:bg-warning-600 text-white shadow-medium focus-visible:ring-warning-500",
      },
      size: {
        default: "h-12 px-6 text-base",
        sm: "h-10 rounded-lg px-4 text-sm",
        lg: "h-14 rounded-lg px-8 text-lg",
        xl: "h-16 rounded-lg px-10 text-xl",
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
