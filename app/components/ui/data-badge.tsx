import * as React from "react"
import { cn } from "@/lib/utils"
import { Check, X, AlertCircle, Clock, DollarSign, TrendingUp, TrendingDown } from "lucide-react"

type BadgeVariant =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'neutral'
  | 'primary'

type BadgeStatus =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'completed'
  | 'failed'
  | 'paid'
  | 'unpaid'
  | 'refunded'
  | 'cancelled'
  | 'expired'
  | 'paused'
  | 'draft'
  | 'published'
  | 'archived'

interface DataBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  status?: BadgeStatus
  icon?: React.ReactNode
  showIcon?: boolean
  size?: 'small' | 'medium' | 'large'
  dot?: boolean
}

const getStatusConfig = (status?: BadgeStatus) => {
  switch (status) {
    case 'active':
    case 'completed':
    case 'paid':
    case 'published':
      return {
        variant: 'success' as BadgeVariant,
        icon: <Check className="h-[12px] w-[12px]" />
      }
    case 'failed':
    case 'unpaid':
    case 'cancelled':
    case 'expired':
      return {
        variant: 'error' as BadgeVariant,
        icon: <X className="h-[12px] w-[12px]" />
      }
    case 'pending':
    case 'draft':
      return {
        variant: 'warning' as BadgeVariant,
        icon: <Clock className="h-[12px] w-[12px]" />
      }
    case 'refunded':
      return {
        variant: 'neutral' as BadgeVariant,
        icon: <DollarSign className="h-[12px] w-[12px]" />
      }
    case 'paused':
    case 'archived':
    case 'inactive':
      return {
        variant: 'neutral' as BadgeVariant,
        icon: <AlertCircle className="h-[12px] w-[12px]" />
      }
    default:
      return {
        variant: 'neutral' as BadgeVariant,
        icon: null
      }
  }
}

const getVariantClasses = (variant: BadgeVariant) => {
  switch (variant) {
    case 'success':
      return "bg-[#F1FDF6] text-[#41C064] border-[#C4F1D5]"
    case 'error':
      return "bg-[#FEF2F2] text-[#E35C5C] border-[#FECACA]"
    case 'warning':
      return "bg-[#FFFBEB] text-[#E9B949] border-[#FDE68A]"
    case 'info':
      return "bg-[#F5F3FF] text-[#7f5efd] border-[#DDD6FE]"
    case 'primary':
      return "bg-[#7f5efd] text-white border-[#7f5efd]"
    case 'neutral':
    default:
      return "bg-[#F6F8FA] text-[#6A7383] border-[#D5DBE1]"
  }
}

const getSizeClasses = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return "text-[10px] px-[6px] h-[18px]"
    case 'large':
      return "text-[14px] px-[12px] h-[28px]"
    case 'medium':
    default:
      return "text-[12px] px-[8px] h-[20px]"
  }
}

const DataBadge = React.forwardRef<HTMLSpanElement, DataBadgeProps>(
  ({
    className,
    variant = 'neutral',
    status,
    icon,
    showIcon = false,
    size = 'medium',
    dot = false,
    children,
    ...props
  }, ref) => {
    const statusConfig = status ? getStatusConfig(status) : null
    const finalVariant = statusConfig?.variant || variant
    const finalIcon = icon || (showIcon && statusConfig?.icon) || null

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-[4px] rounded-[4px] border",
          "font-semibold uppercase tracking-[-0.4px] whitespace-nowrap",
          getVariantClasses(finalVariant),
          getSizeClasses(size),
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              "h-[6px] w-[6px] rounded-full",
              finalVariant === 'primary' ? "bg-white" : "bg-current"
            )}
          />
        )}
        {finalIcon && !dot && finalIcon}
        {children || status}
      </span>
    )
  }
)
DataBadge.displayName = "DataBadge"

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'away' | 'idle'
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
  className?: string
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'medium',
  showLabel = false,
  className
}) => {
  const sizeClasses = {
    small: "h-[8px] w-[8px]",
    medium: "h-[10px] w-[10px]",
    large: "h-[12px] w-[12px]"
  }

  const statusColors = {
    online: "bg-[#41C064]",
    offline: "bg-[#6A7383]",
    busy: "bg-[#E35C5C]",
    away: "bg-[#E9B949]",
    idle: "bg-[#E9B949]"
  }

  const statusLabels = {
    online: "Online",
    offline: "Offline",
    busy: "Busy",
    away: "Away",
    idle: "Idle"
  }

  return (
    <div className={cn("flex items-center gap-[6px]", className)}>
      <span
        className={cn(
          "rounded-full",
          "ring-2 ring-white",
          sizeClasses[size],
          statusColors[status]
        )}
        aria-label={statusLabels[status]}
      />
      {showLabel && (
        <span className="text-[12px] text-[#6A7383]">
          {statusLabels[status]}
        </span>
      )}
    </div>
  )
}

interface TrendIndicatorProps {
  value: number
  showValue?: boolean
  showIcon?: boolean
  size?: 'small' | 'medium' | 'large'
  className?: string
}

const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  value,
  showValue = true,
  showIcon = true,
  size = 'medium',
  className
}) => {
  const isPositive = value > 0
  const isNegative = value < 0
  const isNeutral = value === 0

  const sizeClasses = {
    small: "text-[10px]",
    medium: "text-[12px]",
    large: "text-[14px]"
  }

  const iconSizes = {
    small: "h-[10px] w-[10px]",
    medium: "h-[12px] w-[12px]",
    large: "h-[14px] w-[14px]"
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[2px] font-medium",
        sizeClasses[size],
        isPositive && "text-[#41C064]",
        isNegative && "text-[#E35C5C]",
        isNeutral && "text-[#6A7383]",
        className
      )}
    >
      {showIcon && (
        <>
          {isPositive && <TrendingUp className={iconSizes[size]} />}
          {isNegative && <TrendingDown className={iconSizes[size]} />}
        </>
      )}
      {showValue && (
        <span>
          {isPositive && '+'}
          {value}%
        </span>
      )}
    </span>
  )
}

interface CountBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  count: number
  max?: number
  showZero?: boolean
  variant?: BadgeVariant
  size?: 'small' | 'medium' | 'large'
}

const CountBadge = React.forwardRef<HTMLSpanElement, CountBadgeProps>(
  ({
    className,
    count,
    max = 99,
    showZero = false,
    variant = 'primary',
    size = 'medium',
    ...props
  }, ref) => {
    if (!showZero && count === 0) return null

    const displayCount = count > max ? `${max}+` : count

    const sizeClasses = {
      small: "min-w-[16px] h-[16px] text-[10px]",
      medium: "min-w-[20px] h-[20px] text-[11px]",
      large: "min-w-[24px] h-[24px] text-[12px]"
    }

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center px-[4px] rounded-full",
          "font-semibold",
          getVariantClasses(variant),
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {displayCount}
      </span>
    )
  }
)
CountBadge.displayName = "CountBadge"

export {
  DataBadge,
  StatusIndicator,
  TrendIndicator,
  CountBadge
}
export type { DataBadgeProps, BadgeVariant, BadgeStatus }