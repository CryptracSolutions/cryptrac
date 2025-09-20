import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Stripe-Parity ButtonGroup Component
 * Groups multiple buttons together with proper spacing and visual connection
 */

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether buttons should be visually connected (no gap, shared borders)
   */
  connected?: boolean
  /**
   * Orientation of the button group
   */
  orientation?: "horizontal" | "vertical"
  /**
   * Size of gap between buttons (when not connected)
   */
  gap?: "xs" | "sm" | "md" | "lg"
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({
    className,
    connected = false,
    orientation = "horizontal",
    gap = "sm",
    children,
    ...props
  }, ref) => {
    const gapClass = {
      xs: orientation === "horizontal" ? "gap-x-[4px]" : "gap-y-[4px]",
      sm: orientation === "horizontal" ? "gap-x-[8px]" : "gap-y-[8px]",
      md: orientation === "horizontal" ? "gap-x-[12px]" : "gap-y-[12px]",
      lg: orientation === "horizontal" ? "gap-x-[16px]" : "gap-y-[16px]",
    }[gap]

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex",
          orientation === "horizontal" ? "flex-row" : "flex-col",
          !connected && gapClass,
          connected && orientation === "horizontal" && [
            // Connected horizontal buttons
            "[&>button]:rounded-none",
            "[&>button:first-child]:rounded-l-[4px]",
            "[&>button:last-child]:rounded-r-[4px]",
            "[&>button:not(:first-child)]:ml-[-1px]",
            "[&>button:not(:first-child)]:hover:z-10",
            "[&>button:focus-visible]:z-20",
          ].join(" "),
          connected && orientation === "vertical" && [
            // Connected vertical buttons
            "[&>button]:rounded-none",
            "[&>button:first-child]:rounded-t-[4px]",
            "[&>button:last-child]:rounded-b-[4px]",
            "[&>button:not(:first-child)]:mt-[-1px]",
            "[&>button:not(:first-child)]:hover:z-10",
            "[&>button:focus-visible]:z-20",
          ].join(" "),
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ButtonGroup.displayName = "ButtonGroup"

export { ButtonGroup }