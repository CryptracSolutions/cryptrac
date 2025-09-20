import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ListProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean
  hoverable?: boolean
  spacing?: 'compact' | 'normal' | 'spacious'
  divided?: boolean
}

const List = React.forwardRef<HTMLDivElement, ListProps>(
  ({ className, bordered = false, hoverable = false, spacing = 'normal', divided = true, children, ...props }, ref) => {
    const spacingClasses = {
      compact: '',
      normal: '',
      spacious: ''
    }

    return (
      <div
        ref={ref}
        className={cn(
          "bg-white",
          bordered && "border border-[#D5DBE1] rounded-[8px] overflow-hidden",
          bordered && "shadow-[0px_2px_5px_0px_rgba(60,66,87,0.08),0px_1px_1px_0px_rgba(0,0,0,0.12)]",
          spacingClasses[spacing],
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child) && child.type === ListItem) {
            return React.cloneElement(child as React.ReactElement<ListItemProps>, {
              hoverable,
              divided: divided && index !== React.Children.count(children) - 1,
              spacing
            })
          }
          return child
        })}
      </div>
    )
  }
)
List.displayName = "List"

interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  divided?: boolean
  spacing?: 'compact' | 'normal' | 'spacious'
  selected?: boolean
  interactive?: boolean
}

const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>(
  ({
    className,
    hoverable = false,
    divided = true,
    spacing = 'normal',
    selected = false,
    interactive = false,
    children,
    ...props
  }, ref) => {
    const spacingClasses = {
      compact: 'p-[8px]',
      normal: 'p-[8px]',
      spacious: 'p-[16px]'
    }

    return (
      <>
        <div
          ref={ref}
          className={cn(
            "relative flex items-center",
            spacingClasses[spacing],
            hoverable && "hover:bg-[#F6F8FA] transition-colors cursor-pointer",
            selected && "bg-[#F6F8FA]",
            interactive && "cursor-pointer",
            className
          )}
          {...props}
        >
          {children}
        </div>
        {divided && (
          <div className="h-px bg-[#D5DBE1]" />
        )}
      </>
    )
  }
)
ListItem.displayName = "ListItem"

interface ListItemIconProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: 'start' | 'end'
}

const ListItemIcon = React.forwardRef<HTMLDivElement, ListItemIconProps>(
  ({ className, position = 'start', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "shrink-0 flex items-center justify-center",
        position === 'start' ? "mr-[16px]" : "ml-[16px]",
        className
      )}
      {...props}
    />
  )
)
ListItemIcon.displayName = "ListItemIcon"

interface ListItemContentProps extends React.HTMLAttributes<HTMLDivElement> {
  primary?: React.ReactNode
  secondary?: React.ReactNode
}

const ListItemContent = React.forwardRef<HTMLDivElement, ListItemContentProps>(
  ({ className, primary, secondary, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex-1 min-w-0",
        className
      )}
      {...props}
    >
      {children || (
        <>
          {primary && (
            <div className="text-[14px] font-semibold text-[#30313D] leading-[20px]">
              {primary}
            </div>
          )}
          {secondary && (
            <div className="text-[12px] text-[#6A7383] leading-[16px]">
              {secondary}
            </div>
          )}
        </>
      )}
    </div>
  )
)
ListItemContent.displayName = "ListItemContent"

interface ListItemActionProps extends React.HTMLAttributes<HTMLDivElement> {
  edge?: 'start' | 'end'
}

const ListItemAction = React.forwardRef<HTMLDivElement, ListItemActionProps>(
  ({ className, edge = 'end', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "shrink-0 flex items-center",
        edge === 'start' ? "mr-[8px]" : "ml-[8px]",
        className
      )}
      {...props}
    />
  )
)
ListItemAction.displayName = "ListItemAction"

interface ListItemImageProps {
  src: string
  alt?: string
  size?: 'small' | 'medium' | 'large'
  className?: string
}

const ListItemImage: React.FC<ListItemImageProps> = ({
  src,
  alt = "",
  size = 'medium',
  className
}) => {
  const sizeMap = {
    small: { width: 32, height: 32, className: "h-[32px] w-[32px]" },
    medium: { width: 48, height: 48, className: "h-[48px] w-[48px]" },
    large: { width: 64, height: 64, className: "h-[64px] w-[64px]" }
  }

  const { width, height, className: sizeClass } = sizeMap[size]

  return (
    <div className={cn("shrink-0 mr-[16px] relative", sizeClass)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "object-cover rounded-[8px]",
          "border border-[#F6F8FA]",
          className
        )}
      />
    </div>
  )
}
ListItemImage.displayName = "ListItemImage"

interface ListHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  sticky?: boolean
}

const ListHeader = React.forwardRef<HTMLDivElement, ListHeaderProps>(
  ({ className, sticky = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "px-[16px] py-[12px] bg-white border-b border-[#D5DBE1]",
        "text-[11px] font-semibold text-[#30313D] uppercase tracking-[-0.4px]",
        sticky && "sticky top-0 z-10",
        className
      )}
      {...props}
    />
  )
)
ListHeader.displayName = "ListHeader"

const ListDivider: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn("h-px bg-[#D5DBE1] my-[8px]", className)}
    {...props}
  />
)

export {
  List,
  ListItem,
  ListItemIcon,
  ListItemContent,
  ListItemAction,
  ListItemImage,
  ListHeader,
  ListDivider
}