import * as React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({
    className,
    variant = 'text',
    width,
    height,
    animation = 'pulse',
    style,
    ...props
  }, ref) => {
    const variantClasses = {
      text: "rounded-[4px]",
      circular: "rounded-full",
      rectangular: "",
      rounded: "rounded-[8px]"
    }

    const animationClasses = {
      pulse: "animate-pulse",
      wave: "animate-shimmer",
      none: ""
    }

    return (
      <div
        ref={ref}
        className={cn(
          "bg-[#F6F8FA]",
          variantClasses[variant],
          animationClasses[animation],
          className
        )}
        style={{
          width: width || (variant === 'text' ? '100%' : undefined),
          height: height || (variant === 'text' ? '16px' : undefined),
          ...style
        }}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

interface SkeletonTextProps {
  lines?: number
  width?: string | number | Array<string | number>
  spacing?: number
  className?: string
}

const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 1,
  width = '100%',
  spacing = 8,
  className
}) => {
  const widths = Array.isArray(width) ? width : Array(lines).fill(width)

  return (
    <div className={cn("space-y-2", className)} style={{ gap: spacing }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={widths[index] || width}
          height={16}
        />
      ))}
    </div>
  )
}

interface SkeletonCardProps {
  showImage?: boolean
  showTitle?: boolean
  showDescription?: boolean
  showActions?: boolean
  className?: string
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showImage = false,
  showTitle = true,
  showDescription = true,
  showActions = false,
  className
}) => (
  <div className={cn(
    "bg-white border border-[#D5DBE1] rounded-[8px] p-[16px]",
    "shadow-[0px_2px_5px_0px_rgba(60,66,87,0.08),0px_1px_1px_0px_rgba(0,0,0,0.12)]",
    className
  )}>
    <div className="flex gap-[16px]">
      {showImage && (
        <Skeleton variant="rounded" width={64} height={64} />
      )}
      <div className="flex-1">
        {showTitle && (
          <Skeleton variant="text" width="60%" height={20} className="mb-[8px]" />
        )}
        {showDescription && (
          <SkeletonText lines={2} width={['100%', '80%']} />
        )}
        {showActions && (
          <div className="flex gap-[8px] mt-[12px]">
            <Skeleton variant="rounded" width={80} height={28} />
            <Skeleton variant="rounded" width={80} height={28} />
          </div>
        )}
      </div>
    </div>
  </div>
)

interface SkeletonListItemProps {
  showAvatar?: boolean
  showIcon?: boolean
  showSecondaryAction?: boolean
  className?: string
}

const SkeletonListItem: React.FC<SkeletonListItemProps> = ({
  showAvatar = false,
  showIcon = false,
  showSecondaryAction = false,
  className
}) => (
  <div className={cn("flex items-center p-[8px] gap-[16px]", className)}>
    {showAvatar && (
      <Skeleton variant="circular" width={40} height={40} />
    )}
    {showIcon && !showAvatar && (
      <Skeleton variant="rounded" width={24} height={24} />
    )}
    <div className="flex-1">
      <Skeleton variant="text" width="40%" height={16} className="mb-[4px]" />
      <Skeleton variant="text" width="60%" height={14} />
    </div>
    {showSecondaryAction && (
      <Skeleton variant="rounded" width={60} height={28} />
    )}
  </div>
)

interface SkeletonTableProps {
  rows?: number
  columns?: number
  showHeader?: boolean
  className?: string
}

const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  className
}) => (
  <div className={cn("w-full", className)}>
    {showHeader && (
      <div className="flex gap-[16px] p-[8px] border-b border-[#D5DBE1] bg-white">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            variant="text"
            width={`${100 / columns}%`}
            height={12}
          />
        ))}
      </div>
    )}
    <div className="bg-white">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-[16px] p-[12px] border-b border-[#D5DBE1]"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              width={`${100 / columns}%`}
              height={16}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
)

interface SkeletonMetricCardProps {
  showIcon?: boolean
  showTrend?: boolean
  className?: string
}

const SkeletonMetricCard: React.FC<SkeletonMetricCardProps> = ({
  showIcon = true,
  showTrend = true,
  className
}) => (
  <div className={cn(
    "bg-white border border-[#D5DBE1] rounded-[8px] p-[16px]",
    "shadow-[0px_2px_5px_0px_rgba(60,66,87,0.08),0px_1px_1px_0px_rgba(0,0,0,0.12)]",
    className
  )}>
    <div className="flex items-start justify-between mb-[8px]">
      <Skeleton variant="text" width={100} height={16} />
      {showIcon && (
        <Skeleton variant="rounded" width={20} height={20} />
      )}
    </div>
    <div className="flex items-baseline gap-[8px]">
      <Skeleton variant="text" width={120} height={28} />
      {showTrend && (
        <Skeleton variant="text" width={40} height={14} />
      )}
    </div>
    <Skeleton variant="text" width={80} height={14} className="mt-[4px]" />
  </div>
)

interface SkeletonFormProps {
  fields?: number
  showLabels?: boolean
  showButton?: boolean
  className?: string
}

const SkeletonForm: React.FC<SkeletonFormProps> = ({
  fields = 3,
  showLabels = true,
  showButton = true,
  className
}) => (
  <div className={cn("space-y-[16px]", className)}>
    {Array.from({ length: fields }).map((_, index) => (
      <div key={index} className="space-y-[4px]">
        {showLabels && (
          <Skeleton variant="text" width={80} height={14} />
        )}
        <Skeleton variant="rounded" width="100%" height={32} />
      </div>
    ))}
    {showButton && (
      <Skeleton variant="rounded" width={100} height={32} />
    )}
  </div>
)

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonListItem,
  SkeletonTable,
  SkeletonMetricCard,
  SkeletonForm
}