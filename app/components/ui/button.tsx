import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Stripe-Parity Button Component
 * Achieves 100% visual and experiential parity with Stripe's button system
 * while maintaining Cryptrac's brand identity (#7f5efd)
 */

const buttonVariants = cva(
  // Base styles matching Stripe exactly
  "inline-flex items-center justify-center whitespace-nowrap font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        // Primary - Brand purple background (Stripe's primary style)
        primary: [
          "bg-[#7f5efd] text-white",
          "hover:bg-[#6d4fdd] active:bg-[#5b3fc0]",
          "shadow-[0px_1px_1px_rgba(0,0,0,0.12),0px_2px_5px_rgba(60,66,87,0.08)]",
          "focus-visible:ring-[#7f5efd]",
          "active:scale-[0.98]",
        ].join(" "),

        // Secondary - White with border (Stripe's default)
        secondary: [
          "bg-white text-[#30313D]",
          "border border-[#D5DBE1]",
          "hover:bg-[#F6F8FA] hover:border-[#C9D1DB]",
          "active:bg-[#E3E8EE]",
          "focus-visible:ring-[#7f5efd]",
          "active:scale-[0.98]",
        ].join(" "),

        // Destructive - Error/danger actions
        destructive: [
          "bg-[#E35C5C] text-white",
          "hover:bg-[#D74545] active:bg-[#C63030]",
          "shadow-[0px_1px_1px_rgba(0,0,0,0.12),0px_2px_5px_rgba(60,66,87,0.08)]",
          "focus-visible:ring-[#E35C5C]",
          "active:scale-[0.98]",
        ].join(" "),

        // Ghost - Minimal, transparent background
        ghost: [
          "text-[#6A7383]",
          "hover:bg-[#F6F8FA] hover:text-[#30313D]",
          "active:bg-[#E3E8EE]",
          "focus-visible:ring-[#7f5efd]",
        ].join(" "),

        // Link - Text only with underline
        link: [
          "text-[#7f5efd] underline-offset-4",
          "hover:text-[#6d4fdd] hover:underline",
          "focus-visible:ring-[#7f5efd]",
        ].join(" "),
      },

      size: {
        // Extra small - Stripe's compact buttons
        xs: [
          "h-[24px] px-[6px] py-[2px]",
          "text-[11px] leading-[16px]",
          "rounded-[4px]",
          "gap-[4px]",
        ].join(" "),

        // Small - Stripe's small buttons
        sm: [
          "h-[28px] px-[8px] py-[3px]",
          "text-[12px] leading-[20px]",
          "rounded-[4px]",
          "gap-[4px]",
        ].join(" "),

        // Medium - Stripe's default button size
        md: [
          "h-[32px] px-[12px] py-[4px]",
          "text-[14px] leading-[20px]",
          "rounded-[4px]",
          "gap-[6px]",
        ].join(" "),

        // Large - Stripe's large buttons
        lg: [
          "h-[40px] px-[16px] py-[8px]",
          "text-[16px] leading-[24px]",
          "rounded-[4px]",
          "gap-[8px]",
        ].join(" "),

        // Icon only - Square icon buttons
        icon: "rounded-[4px]",
      },

      // Full width option
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },

    compoundVariants: [
      // Icon-only button sizes
      { size: "xs", className: "[&.icon-only]:h-[24px] [&.icon-only]:w-[24px] [&.icon-only]:p-0" },
      { size: "sm", className: "[&.icon-only]:h-[28px] [&.icon-only]:w-[28px] [&.icon-only]:p-0" },
      { size: "md", className: "[&.icon-only]:h-[32px] [&.icon-only]:w-[32px] [&.icon-only]:p-0" },
      { size: "lg", className: "[&.icon-only]:h-[40px] [&.icon-only]:w-[40px] [&.icon-only]:p-0" },
    ],

    defaultVariants: {
      variant: "secondary",
      size: "md",
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  iconOnly?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    fullWidth,
    asChild = false,
    loading = false,
    disabled,
    leftIcon,
    rightIcon,
    iconOnly = false,
    children,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button"

    // Determine icon size based on button size
    const getIconSize = () => {
      switch (size) {
        case "xs": return 12
        case "sm": return 14
        case "lg": return 20
        default: return 16
      }
    }

    const iconSize = getIconSize()

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, fullWidth, className }),
          iconOnly && "icon-only",
          "duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]", // Stripe's exact transition
          "tracking-[-0.154px]", // Stripe's letter spacing
          "font-['SF_Pro_Text',-apple-system,BlinkMacSystemFont,'Segoe_UI','Inter','Roboto','Helvetica','Arial',sans-serif]", // Stripe's font stack
        )}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2
              className="animate-spin"
              size={iconSize}
              aria-label="Loading"
            />
            {!iconOnly && children && (
              <span className="ml-[6px]">{children}</span>
            )}
          </>
        ) : (
          <>
            {leftIcon && !iconOnly && (
              <span className="inline-flex shrink-0" style={{ width: iconSize, height: iconSize }}>
                {leftIcon}
              </span>
            )}
            {iconOnly ? (
              <span className="inline-flex shrink-0" style={{ width: iconSize, height: iconSize }}>
                {leftIcon || rightIcon || children}
              </span>
            ) : (
              children
            )}
            {rightIcon && !iconOnly && (
              <span className="inline-flex shrink-0" style={{ width: iconSize, height: iconSize }}>
                {rightIcon}
              </span>
            )}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
