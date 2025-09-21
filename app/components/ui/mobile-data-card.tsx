"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const MobileDataCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "max-md:rounded-2xl max-md:border max-md:border-gray-200 max-md:bg-white max-md:shadow-sm",
        "max-md:p-4 max-md:space-y-4 max-md:focus-visible:outline-none max-md:focus-visible:ring-2",
        "max-md:focus-visible:ring-[#7f5efd] max-md:focus-visible:ring-offset-2 max-md:focus-visible:ring-offset-white",
        "transition-shadow duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
MobileDataCard.displayName = "MobileDataCard"

const MobileDataCardHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col gap-2",
      "max-md:flex-row max-md:items-start max-md:justify-between",
      className
    )}
    {...props}
  />
)

const MobileDataCardTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn(
      "text-base font-semibold text-gray-900",
      "max-md:text-sm",
      className
    )}
    {...props}
  />
)

const MobileDataCardSubtitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn("text-xs text-gray-600", className)}
    {...props}
  />
)

const MobileDataCardSection = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-3", className)} {...props} />
)

const MobileDataCardMeta = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid grid-cols-2 gap-3", className)}
    {...props}
  />
)

interface MobileDataCardMetaItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode
  value: React.ReactNode
  helper?: React.ReactNode
  accent?: boolean
}

const MobileDataCardMetaItem = ({
  label,
  value,
  helper,
  accent = false,
  className,
  ...props
}: MobileDataCardMetaItemProps) => (
  <div className={cn("space-y-1", className)} {...props}>
    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
      {label}
    </p>
    <p
      className={cn(
        "text-sm font-semibold text-gray-900",
        accent && "text-[#7f5efd]"
      )}
    >
      {value}
    </p>
    {helper ? (
      <p className="text-[11px] text-gray-500">{helper}</p>
    ) : null}
  </div>
)

const MobileDataCardActions = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex w-full flex-col gap-2", className)}
    {...props}
  />
)

export {
  MobileDataCard,
  MobileDataCardHeader,
  MobileDataCardTitle,
  MobileDataCardSubtitle,
  MobileDataCardSection,
  MobileDataCardMeta,
  MobileDataCardMetaItem,
  MobileDataCardActions,
}
