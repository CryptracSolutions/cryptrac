import * as React from "react"
import { Button, ButtonProps } from "./button"
import { cn } from "@/lib/utils"

/**
 * Stripe-Parity IconButton Component
 * Specialized button for icon-only actions with perfect square dimensions
 */

export interface IconButtonProps extends Omit<ButtonProps, "leftIcon" | "rightIcon" | "iconOnly" | "fullWidth"> {
  /**
   * The icon to display
   */
  icon: React.ReactNode
  /**
   * Accessible label for screen readers
   */
  "aria-label": string
  /**
   * Visual style of the icon button
   */
  variant?: ButtonProps["variant"]
  /**
   * Size of the icon button
   */
  size?: ButtonProps["size"]
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({
    className,
    icon,
    variant = "ghost",
    size = "md",
    ...props
  }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        iconOnly
        className={cn(
          // Ensure perfect square dimensions
          size === "xs" && "!h-[24px] !w-[24px]",
          size === "sm" && "!h-[28px] !w-[28px]",
          size === "md" && "!h-[32px] !w-[32px]",
          size === "lg" && "!h-[40px] !w-[40px]",
          "!p-0", // Remove padding for icon centering
          className
        )}
        {...props}
      >
        {icon}
      </Button>
    )
  }
)
IconButton.displayName = "IconButton"

export { IconButton }