"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { ChevronDownIcon, ChevronUpIcon } from "@/components/ui/icons"
import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

interface SelectTriggerProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  error?: boolean
  size?: "small" | "medium" | "large"
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(({ className, children, error, size = "medium", disabled, ...props }, ref) => {
  const sizeClasses = {
    small: "h-6 text-xs px-2 py-1",
    medium: "h-7 text-sm px-2 py-1",
    large: "h-9 text-base px-3 py-1.5"
  }

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      disabled={disabled}
      className={cn(
        "flex w-full items-center justify-between rounded bg-white font-normal tracking-[-0.154px] transition-all duration-200",
        "border border-[#e3e8ee] shadow-[0px_2px_5px_0px_rgba(60,66,87,0.12),0px_1px_1px_0px_rgba(0,0,0,0.08)]",
        "hover:border-[#d5dbe1]",
        "focus:outline-none focus:ring-2 focus:ring-[#7f5efd] focus:ring-offset-0 focus:border-[#7f5efd] focus:shadow-[0px_2px_5px_0px_rgba(127,94,253,0.12),0px_1px_1px_0px_rgba(127,94,253,0.08)]",
        "disabled:bg-[#f6f9fc] disabled:border-[#e3e8ee] disabled:text-[#a3acba] disabled:cursor-not-allowed disabled:opacity-75",
        "data-[placeholder]:text-[#a3acba]",
        "[&>span]:line-clamp-1 [&>span]:text-left",
        sizeClasses[size],
        error && "border-[#e85d75] hover:border-[#e85d75] focus:ring-[#e85d75] focus:border-[#e85d75]",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className={cn(
          "ml-2",
          size === "small" && "h-3 w-3",
          size === "medium" && "h-3.5 w-3.5",
          size === "large" && "h-4 w-4",
          disabled ? "text-[#a3acba]" : "text-[#6a7383]"
        )} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
})
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUpIcon size="sm" color="primary" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDownIcon size="sm" color="primary" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded bg-white",
        "border border-[#d5dbe1] shadow-[0px_7px_14px_0px_rgba(48,49,61,0.08),0px_3px_6px_0px_rgba(0,0,0,0.12)]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        position === "popper" &&
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      data-radix-select-content
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1 max-h-60 overflow-y-auto",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-[11px] font-semibold text-[#6a7383] uppercase tracking-[-0.4px]",
      className
    )}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

type SelectItemProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
  // Text used for rendering the selected value in the trigger and for typeahead
  // When provided, this will be used as the plain string shown in the trigger
  // so that styled children (e.g. with `text-white`) don't bleed into the trigger.
  textValue?: string
}

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  SelectItemProps
>(({ className, children, textValue, ...props }, ref) => {
  // Convert arbitrary ReactNode children into a plain text string.
  // This ensures the trigger always shows readable text after selection.
  const getPlainText = (node: React.ReactNode): string => {
    if (node == null) return ""
    if (typeof node === "string" || typeof node === "number") return String(node)
    if (Array.isArray(node)) return node.map(getPlainText).join("")
    if (React.isValidElement(node)) {
      const element = node as React.ReactElement<{ children?: React.ReactNode }>
      return getPlainText(element.props?.children)
    }
    return ""
  }

  const computedText = (textValue ?? getPlainText(children)) || undefined

  const isPlainTextChild =
    typeof children === "string" || typeof children === "number"

  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded px-2 py-1 text-sm outline-none transition-colors duration-150",
        "text-[#30313d] tracking-[-0.154px]",
        "hover:bg-[#f7fafc] focus:bg-[#f7fafc]",
        "data-[state=checked]:bg-[#f7fafc] data-[state=checked]:font-semibold",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[disabled]:text-[#a3acba]",
        className
      )}
      // Provide a clean text label for typeahead and for the trigger display
      textValue={computedText}
      data-radix-select-item
      // Signal to CSS whether this item renders rich children so we can
      // selectively hide the internal plain text clone only in that case.
      data-has-rich-children={!isPlainTextChild ? "true" : "false"}
      {...props}
    >
      {/* Removed in-menu selection icon for a cleaner look */}
      {/* Provide plain text for trigger cloning; hidden inside dropdown only when rich content is present */}
      <SelectPrimitive.ItemText asChild>
        <span data-select-item-text>{computedText ?? ""}</span>
      </SelectPrimitive.ItemText>
      {/* Render the actual rich content for the list */}
      {!isPlainTextChild && children}
    </SelectPrimitive.Item>
  )
})
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-[#e3e8ee]", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
