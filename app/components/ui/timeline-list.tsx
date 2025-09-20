import * as React from "react"
import { cn } from "@/lib/utils"
import { List, ListItem, ListItemIcon, ListItemContent } from "./list"
import {
  CreditCard,
  RefreshCcw,
  Plus,
  X,
  ArrowUp,
  AlertCircle,
  Check,
  Clock,
  FileText
} from "lucide-react"

interface TimelineEvent {
  id: string
  type: 'payment' | 'refund' | 'add' | 'remove' | 'update' | 'error' | 'success' | 'pending' | 'custom'
  title: string
  subtitle?: string
  timestamp: string
  icon?: React.ReactNode
  iconColor?: string
  iconBg?: string
}

interface TimelineListProps extends React.HTMLAttributes<HTMLDivElement> {
  events: TimelineEvent[]
  showConnector?: boolean
  dense?: boolean
}

const getEventIcon = (type: TimelineEvent['type']) => {
  const iconClass = "h-[16px] w-[16px]"

  switch (type) {
    case 'payment':
      return <CreditCard className={iconClass} />
    case 'refund':
      return <RefreshCcw className={iconClass} />
    case 'add':
      return <Plus className={iconClass} />
    case 'remove':
      return <X className={iconClass} />
    case 'update':
      return <ArrowUp className={iconClass} />
    case 'error':
      return <AlertCircle className={iconClass} />
    case 'success':
      return <Check className={iconClass} />
    case 'pending':
      return <Clock className={iconClass} />
    default:
      return <FileText className={iconClass} />
  }
}

const getEventColors = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'payment':
      return { color: '#30313D', bg: '#F6F8FA' }
    case 'refund':
      return { color: '#E9B949', bg: '#FFFBEB' }
    case 'add':
      return { color: '#41C064', bg: '#F1FDF6' }
    case 'remove':
      return { color: '#E35C5C', bg: '#FEF2F2' }
    case 'update':
      return { color: '#7f5efd', bg: '#F5F3FF' }
    case 'error':
      return { color: '#E35C5C', bg: '#FEF2F2' }
    case 'success':
      return { color: '#41C064', bg: '#F1FDF6' }
    case 'pending':
      return { color: '#6A7383', bg: '#F6F8FA' }
    default:
      return { color: '#6A7383', bg: '#F6F8FA' }
  }
}

const TimelineList = React.forwardRef<HTMLDivElement, TimelineListProps>(
  ({ className, events, showConnector = false, dense = false, ...props }, ref) => {
    return (
      <List
        ref={ref}
        className={cn("relative", className)}
        spacing={dense ? 'compact' : 'normal'}
        {...props}
      >
        {events.map((event, index) => {
          const colors = getEventColors(event.type)
          const icon = event.icon || getEventIcon(event.type)

          return (
            <ListItem
              key={event.id}
              className={cn(
                showConnector && index < events.length - 1 && "pb-[24px]",
                "relative"
              )}
            >
              {showConnector && index < events.length - 1 && (
                <div
                  className="absolute left-[19px] top-[32px] bottom-0 w-px bg-[#D5DBE1]"
                  aria-hidden="true"
                />
              )}

              <ListItemIcon>
                <div
                  className={cn(
                    "h-[24px] w-[24px] rounded-full flex items-center justify-center",
                    "relative z-10"
                  )}
                  style={{
                    backgroundColor: event.iconBg || colors.bg,
                    color: event.iconColor || colors.color
                  }}
                >
                  {icon}
                </div>
              </ListItemIcon>

              <ListItemContent
                primary={event.title}
                secondary={event.timestamp}
              />

              {event.subtitle && (
                <div className="text-[12px] text-[#6A7383] ml-[8px]">
                  {event.subtitle}
                </div>
              )}
            </ListItem>
          )
        })}
      </List>
    )
  }
)
TimelineList.displayName = "TimelineList"

interface TimelineItemProps {
  type?: TimelineEvent['type']
  icon?: React.ReactNode
  iconColor?: string
  iconBg?: string
  title: string
  timestamp: string
  subtitle?: string
  showConnector?: boolean
  isLast?: boolean
  children?: React.ReactNode
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  type = 'custom',
  icon,
  iconColor,
  iconBg,
  title,
  timestamp,
  subtitle,
  showConnector = false,
  isLast = false,
  children
}) => {
  const colors = getEventColors(type)
  const itemIcon = icon || getEventIcon(type)

  return (
    <div className="relative flex items-start p-[8px]">
      {showConnector && !isLast && (
        <div
          className="absolute left-[27px] top-[40px] bottom-[-8px] w-px bg-[#D5DBE1]"
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "h-[24px] w-[24px] rounded-full flex items-center justify-center",
          "shrink-0 relative z-10 mr-[16px]"
        )}
        style={{
          backgroundColor: iconBg || colors.bg,
          color: iconColor || colors.color
        }}
      >
        {itemIcon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between">
          <h4 className="text-[14px] font-semibold text-[#30313D] leading-[20px]">
            {title}
          </h4>
          {subtitle && (
            <span className="text-[12px] text-[#6A7383] ml-[8px]">
              {subtitle}
            </span>
          )}
        </div>
        <p className="text-[12px] text-[#6A7383] leading-[16px] mt-[2px]">
          {timestamp}
        </p>
        {children && (
          <div className="mt-[8px]">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

export { TimelineList, TimelineItem }
export type { TimelineEvent, TimelineListProps, TimelineItemProps }