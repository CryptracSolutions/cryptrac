import * as React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react"

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** When true, applies hover/transition effects. Defaults to true. */
  interactive?: boolean
  variant?: 'default' | 'metric' | 'chart' | 'activity' | 'summary'
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = true, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-white rounded-[8px] border border-[#D5DBE1]",
        "shadow-[0px_2px_5px_0px_rgba(60,66,87,0.08),0px_1px_1px_0px_rgba(0,0,0,0.12)]",
        interactive && "hover:shadow-[0px_7px_14px_0px_rgba(48,49,61,0.08),0px_3px_6px_0px_rgba(0,0,0,0.12)] transition-shadow duration-200",
        variant === 'metric' && "p-[16px]",
        variant === 'chart' && "p-[16px]",
        variant === 'activity' && "p-0 overflow-hidden",
        variant === 'summary' && "p-[16px]",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-inter text-lg font-semibold leading-tight text-gray-900",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("font-inter text-sm text-gray-600 font-normal", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

interface MetricCardProps {
  title: string
  value: string | number
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  info?: string
  subtitle?: string
  icon?: React.ReactNode
  loading?: boolean
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  info,
  subtitle,
  icon,
  loading = false
}) => {
  if (loading) {
    return (
      <Card variant="metric">
        <div className="animate-pulse">
          <div className="h-[16px] w-[100px] bg-[#F6F8FA] rounded mb-[8px]" />
          <div className="h-[28px] w-[120px] bg-[#F6F8FA] rounded mb-[4px]" />
          <div className="h-[14px] w-[80px] bg-[#F6F8FA] rounded" />
        </div>
      </Card>
    )
  }

  return (
    <Card variant="metric">
      <div className="flex items-start justify-between mb-[8px]">
        <div className="flex items-center gap-[4px]">
          <span className="text-[14px] font-semibold text-[#30313D]">
            {title}
          </span>
          {info && (
            <Info className="h-[12px] w-[12px] text-[#6A7383]" />
          )}
        </div>
        {icon && (
          <div className="text-[#6A7383]">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-[8px]">
        <span className="text-[20px] font-bold text-[#30313D]">
          {value}
        </span>
        {trend && (
          <div className={cn(
            "flex items-center gap-[2px] text-[12px] font-medium",
            trend.direction === 'up' && "text-[#41C064]",
            trend.direction === 'down' && "text-[#E35C5C]",
            trend.direction === 'neutral' && "text-[#6A7383]"
          )}>
            {trend.direction === 'up' && <TrendingUp className="h-[12px] w-[12px]" />}
            {trend.direction === 'down' && <TrendingDown className="h-[12px] w-[12px]" />}
            {trend.direction === 'neutral' && <Minus className="h-[12px] w-[12px]" />}
            {trend.value}%
          </div>
        )}
      </div>

      {subtitle && (
        <p className="text-[14px] text-[#6A7383] mt-[4px]">
          {subtitle}
        </p>
      )}
    </Card>
  )
}

interface ActivityCardProps {
  children: React.ReactNode
  title?: string
}

const ActivityCard: React.FC<ActivityCardProps> = ({ children, title }) => (
  <Card variant="activity">
    {title && (
      <div className="px-[16px] py-[12px] border-b border-[#D5DBE1]">
        <h3 className="text-[14px] font-semibold text-[#30313D] uppercase tracking-[-0.4px]">
          {title}
        </h3>
      </div>
    )}
    {children}
  </Card>
)

interface SummaryCardProps {
  title: string
  items: Array<{
    label: string
    value: string | number
    highlight?: boolean
  }>
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, items }) => (
  <Card variant="summary">
    <h3 className="text-[11px] font-semibold text-[#30313D] uppercase tracking-[-0.4px] mb-[12px]">
      {title}
    </h3>
    <div className="space-y-[8px]">
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center justify-between py-[8px]",
            index !== items.length - 1 && "border-b border-[#D5DBE1]"
          )}
        >
          <span className="text-[12px] text-[#30313D]">
            {item.label}
          </span>
          <span className={cn(
            "text-[12px]",
            item.highlight ? "font-semibold text-[#30313D]" : "text-[#30313D]"
          )}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  </Card>
)

const ChartCard: React.FC<React.PropsWithChildren<{ title?: string; subtitle?: string }>> = ({
  title,
  subtitle,
  children
}) => (
  <Card variant="chart">
    {(title || subtitle) && (
      <div className="mb-[16px]">
        {title && (
          <h3 className="text-[14px] font-semibold text-[#30313D]">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-[14px] text-[#6A7383]">
            {subtitle}
          </p>
        )}
      </div>
    )}
    {children}
  </Card>
)

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  MetricCard,
  ActivityCard,
  SummaryCard,
  ChartCard
}
