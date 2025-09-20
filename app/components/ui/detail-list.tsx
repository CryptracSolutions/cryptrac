import * as React from "react"
import { cn } from "@/lib/utils"
import { Info, Copy, ExternalLink } from "lucide-react"

interface DetailItem {
  label: string
  value: React.ReactNode
  info?: string
  copyable?: boolean
  link?: string
  highlight?: boolean
  fullWidth?: boolean
}

interface DetailListProps extends React.HTMLAttributes<HTMLDivElement> {
  items: DetailItem[]
  columns?: 1 | 2
  bordered?: boolean
  striped?: boolean
  spacing?: 'compact' | 'normal' | 'spacious'
  labelWidth?: 'auto' | 'fixed' | 'balanced'
}

const DetailList = React.forwardRef<HTMLDivElement, DetailListProps>(
  ({
    className,
    items,
    columns = 1,
    bordered = true,
    striped = false,
    spacing = 'normal',
    labelWidth = 'auto',
    ...props
  }, ref) => {
    const spacingClasses = {
      compact: 'py-[6px]',
      normal: 'py-[8px]',
      spacious: 'py-[12px]'
    }

    const handleCopy = async (value: React.ReactNode) => {
      if (typeof value === 'string' || typeof value === 'number') {
        await navigator.clipboard.writeText(String(value))
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "bg-white",
          bordered && "border border-[#D5DBE1] rounded-[8px] overflow-hidden",
          bordered && "shadow-[0px_2px_5px_0px_rgba(60,66,87,0.08),0px_1px_1px_0px_rgba(0,0,0,0.12)]",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            columns === 2 && "grid grid-cols-2 gap-x-[16px]"
          )}
        >
          {items.map((item, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between",
                spacingClasses[spacing],
                "px-[16px]",
                index !== items.length - 1 && "border-b border-[#D5DBE1]",
                striped && index % 2 === 1 && "bg-[#F6F8FA]",
                item.fullWidth && columns === 2 && "col-span-2"
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-[4px]",
                  labelWidth === 'fixed' && "w-[140px]",
                  labelWidth === 'balanced' && "flex-1"
                )}
              >
                <span
                  className={cn(
                    "text-[12px] text-[#30313D]",
                    item.highlight && "font-semibold"
                  )}
                >
                  {item.label}
                </span>
                {item.info && (
                  <button
                    type="button"
                    className="text-[#6A7383] hover:text-[#30313D] transition-colors"
                    title={item.info}
                  >
                    <Info className="h-[12px] w-[12px]" />
                  </button>
                )}
              </div>

              <div
                className={cn(
                  "flex items-center gap-[4px]",
                  labelWidth === 'balanced' && "flex-1 justify-end",
                  "text-[12px]",
                  item.highlight ? "font-semibold text-[#30313D]" : "text-[#30313D]"
                )}
              >
                <span>{item.value}</span>
                {item.copyable && (
                  <button
                    type="button"
                    onClick={() => handleCopy(item.value)}
                    className="text-[#6A7383] hover:text-[#30313D] transition-colors ml-[4px]"
                    title="Copy to clipboard"
                  >
                    <Copy className="h-[12px] w-[12px]" />
                  </button>
                )}
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#7f5efd] hover:text-[#6d4fdd] transition-colors ml-[4px]"
                  >
                    <ExternalLink className="h-[12px] w-[12px]" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
)
DetailList.displayName = "DetailList"

interface DetailSectionProps {
  title: string
  items: DetailItem[]
  columns?: 1 | 2
  collapsible?: boolean
  defaultExpanded?: boolean
}

const DetailSection: React.FC<DetailSectionProps> = ({
  title,
  items,
  columns = 1,
  collapsible = false,
  defaultExpanded = true
}) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded)

  return (
    <div className="mb-[24px]">
      <div
        className={cn(
          "mb-[12px]",
          collapsible && "cursor-pointer select-none"
        )}
        onClick={() => collapsible && setExpanded(!expanded)}
      >
        <h3 className="text-[11px] font-semibold text-[#30313D] uppercase tracking-[-0.4px]">
          {title}
        </h3>
      </div>
      {expanded && (
        <DetailList items={items} columns={columns} />
      )}
    </div>
  )
}

interface KeyValuePairProps {
  label: string
  value: React.ReactNode
  inline?: boolean
  className?: string
}

const KeyValuePair: React.FC<KeyValuePairProps> = ({
  label,
  value,
  inline = true,
  className
}) => {
  if (inline) {
    return (
      <div className={cn("flex items-center justify-between", className)}>
        <span className="text-[12px] text-[#30313D]">{label}</span>
        <span className="text-[12px] text-[#30313D]">{value}</span>
      </div>
    )
  }

  return (
    <div className={cn("space-y-[4px]", className)}>
      <div className="text-[12px] text-[#6A7383]">{label}</div>
      <div className="text-[14px] text-[#30313D]">{value}</div>
    </div>
  )
}

interface PropertyListProps {
  properties: Array<{
    label: string
    value: React.ReactNode
  }>
  showDividers?: boolean
  className?: string
}

const PropertyList: React.FC<PropertyListProps> = ({
  properties,
  showDividers = true,
  className
}) => (
  <div className={cn("space-y-[8px]", className)}>
    {properties.map((prop, index) => (
      <React.Fragment key={index}>
        <KeyValuePair label={prop.label} value={prop.value} />
        {showDividers && index < properties.length - 1 && (
          <div className="h-px bg-[#D5DBE1]" />
        )}
      </React.Fragment>
    ))}
  </div>
)

export {
  DetailList,
  DetailSection,
  KeyValuePair,
  PropertyList
}
export type { DetailItem, DetailListProps }