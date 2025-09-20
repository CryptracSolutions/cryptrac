"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "@/lib/utils"
import { useFocusScope } from "@/app/hooks/use-focus-trap"
import { registerOverlay, unregisterOverlay, setOverlayAccessibility } from "@/app/lib/overlay-manager"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverAnchor = PopoverPrimitive.Anchor

interface PopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  showArrow?: boolean
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(({ className, align = "center", sideOffset = 4, showArrow = true, ...props }, ref) => {
  const popoverId = React.useId()
  const contentRef = React.useRef<HTMLDivElement>(null)
  const focusScopeRef = useFocusScope({ loop: true, onEscape: () => {} })

  // Register overlay when popover opens
  React.useEffect(() => {
    const element = contentRef.current
    if (!element) return

    registerOverlay({
      type: 'popover',
      id: popoverId,
      lockScroll: false,
      trapFocus: false,
      closeOnEscape: true,
      closeOnClickOutside: true,
    })

    // Set accessibility attributes
    setOverlayAccessibility(element, {
      role: 'dialog',
      modal: false,
    })

    return () => {
      unregisterOverlay(popoverId)
    }
  }, [popoverId])

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={(node) => {
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
          if (node) {
            contentRef.current = node
            focusScopeRef.current = node
          }
        }}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-[50] min-w-[220px] max-w-[400px]",
          "rounded-lg bg-white p-4",
          "border border-gray-200",
          "shadow-xl",
          "outline-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2",
          "data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2",
          "data-[side=top]:slide-in-from-bottom-2",
          "popover-expand",
          className
        )}
        {...props}
      />
      {showArrow && (
        <PopoverPrimitive.Arrow className="fill-white stroke-gray-200 stroke-[1px]" />
      )}
    </PopoverPrimitive.Portal>
  )
})
PopoverContent.displayName = PopoverPrimitive.Content.displayName

const PopoverHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "mb-3 space-y-1",
      className
    )}
    {...props}
  />
)
PopoverHeader.displayName = "PopoverHeader"

const PopoverTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h4
    className={cn(
      "font-semibold text-sm text-gray-900",
      "leading-none tracking-tight",
      className
    )}
    {...props}
  />
)
PopoverTitle.displayName = "PopoverTitle"

const PopoverDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn(
      "text-xs text-gray-600",
      "mt-1",
      className
    )}
    {...props}
  />
)
PopoverDescription.displayName = "PopoverDescription"

const PopoverClose = PopoverPrimitive.Close

// Custom Popover with menu items (Stripe-style)
interface PopoverMenuProps {
  children: React.ReactNode
  className?: string
}

const PopoverMenu = ({
  className,
  children,
  ...props
}: PopoverMenuProps) => (
  <div
    className={cn(
      "flex flex-col",
      "-m-1",
      className
    )}
    role="menu"
    {...props}
  >
    {children}
  </div>
)
PopoverMenu.displayName = "PopoverMenu"

interface PopoverMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode
  destructive?: boolean
}

const PopoverMenuItem = React.forwardRef<HTMLButtonElement, PopoverMenuItemProps>(
  ({ className, icon, destructive = false, children, ...props }, ref) => (
    <button
      ref={ref}
      role="menuitem"
      className={cn(
        "flex items-center gap-2",
        "px-3 py-2 m-1",
        "text-sm",
        "rounded-md",
        "outline-none",
        "transition-colors duration-150",
        "hover:bg-gray-50",
        "focus-visible:bg-gray-50",
        "disabled:pointer-events-none disabled:opacity-50",
        destructive ? "text-red-600 hover:bg-red-50 focus-visible:bg-red-50" : "text-gray-700",
        className
      )}
      {...props}
    >
      {icon && (
        <span className="flex-shrink-0 w-4 h-4">
          {icon}
        </span>
      )}
      <span className="flex-1 text-left">{children}</span>
    </button>
  )
)
PopoverMenuItem.displayName = "PopoverMenuItem"

const PopoverMenuSeparator = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "h-px bg-gray-200",
      "my-1 mx-1",
      className
    )}
    role="separator"
    {...props}
  />
)
PopoverMenuSeparator.displayName = "PopoverMenuSeparator"

// Action Popover (for action menus)
interface ActionPopoverProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
}

const ActionPopover: React.FC<ActionPopoverProps> = ({
  trigger,
  children,
  align = "end",
  side = "bottom",
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        className="p-1 min-w-[180px]"
        showArrow={false}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}
ActionPopover.displayName = "ActionPopover"

// Info Popover (for information displays)
interface InfoPopoverProps {
  trigger: React.ReactNode
  title?: string
  description?: string
  content?: React.ReactNode
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
}

const InfoPopover: React.FC<InfoPopoverProps> = ({
  trigger,
  title,
  description,
  content,
  align = "center",
  side = "top",
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent align={align} side={side}>
        {(title || description) && (
          <PopoverHeader>
            {title && <PopoverTitle>{title}</PopoverTitle>}
            {description && <PopoverDescription>{description}</PopoverDescription>}
          </PopoverHeader>
        )}
        {content}
      </PopoverContent>
    </Popover>
  )
}
InfoPopover.displayName = "InfoPopover"

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverClose,
  PopoverMenu,
  PopoverMenuItem,
  PopoverMenuSeparator,
  ActionPopover,
  InfoPopover,
}