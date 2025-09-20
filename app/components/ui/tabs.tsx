"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

// Stripe-style tabs with underline indicator
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    variant?: "default" | "pills" | "underline"
  }
>(({ className, variant = "underline", ...props }, ref) => {
  if (variant === "underline") {
    return (
      <TabsPrimitive.List
        ref={ref}
        className={cn(
          "inline-flex items-center justify-start border-b border-[var(--color-border-subtle)] w-full",
          className
        )}
        {...props}
      />
    )
  }

  if (variant === "pills") {
    return (
      <TabsPrimitive.List
        ref={ref}
        className={cn(
          "inline-flex h-9 items-center justify-center rounded-lg bg-[var(--color-bg-subtle)] p-1",
          className
        )}
        {...props}
      />
    )
  }

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    variant?: "default" | "pills" | "underline"
  }
>(({ className, variant = "underline", ...props }, ref) => {
  if (variant === "underline") {
    return (
      <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center whitespace-nowrap px-4 pb-3 pt-2.5 text-[14px] font-medium text-[var(--color-text-secondary)] transition-all",
          "hover:text-[var(--color-text-primary)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "data-[state=active]:text-[var(--color-text-primary)]",
          "after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2px]",
          "after:bg-[var(--color-primary)] after:scale-x-0 after:transition-transform after:duration-200",
          "data-[state=active]:after:scale-x-100",
          className
        )}
        {...props}
      />
    )
  }

  if (variant === "pills") {
    return (
      <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-[14px] font-medium",
          "text-[var(--color-text-secondary)] transition-all",
          "hover:text-[var(--color-text-primary)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "data-[state=active]:bg-white data-[state=active]:text-[var(--color-text-primary)] data-[state=active]:shadow-sm",
          className
        )}
        {...props}
      />
    )
  }

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
      "data-[state=active]:animate-in data-[state=active]:fade-in-0",
      "data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

// Scrollable tabs container for mobile
const ScrollableTabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-full overflow-x-auto scrollbar-hide",
      "-mx-4 px-4 md:mx-0 md:px-0",
      className
    )}
    {...props}
  >
    <div className="inline-flex min-w-full">{children}</div>
  </div>
))
ScrollableTabs.displayName = "ScrollableTabs"

export { Tabs, TabsList, TabsTrigger, TabsContent, ScrollableTabs }

