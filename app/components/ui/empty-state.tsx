import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Search,
  AlertCircle,
  CheckCircle,
  Inbox,
  Database,
  Users,
  Package,
  Receipt,
  CreditCard,
  ShoppingCart,
  FolderOpen,
  WifiOff
} from "lucide-react"
import { Button } from "./button"

type EmptyStateVariant =
  | 'no-data'
  | 'no-results'
  | 'error'
  | 'success'
  | 'loading'
  | 'offline'
  | 'no-permission'
  | 'custom'

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: EmptyStateVariant
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  secondaryAction?: React.ReactNode
  compact?: boolean
}

const getDefaultIcon = (variant: EmptyStateVariant) => {
  const iconClass = "h-[48px] w-[48px]"

  switch (variant) {
    case 'no-data':
      return <Inbox className={iconClass} />
    case 'no-results':
      return <Search className={iconClass} />
    case 'error':
      return <AlertCircle className={iconClass} />
    case 'success':
      return <CheckCircle className={iconClass} />
    case 'offline':
      return <WifiOff className={iconClass} />
    case 'no-permission':
      return <AlertCircle className={iconClass} />
    default:
      return <FolderOpen className={iconClass} />
  }
}

const getIconColor = (variant: EmptyStateVariant) => {
  switch (variant) {
    case 'error':
      return 'text-[#E35C5C]'
    case 'success':
      return 'text-[#41C064]'
    default:
      return 'text-[#6A7383]'
  }
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({
    className,
    variant = 'no-data',
    icon,
    title,
    description,
    action,
    secondaryAction,
    compact = false,
    ...props
  }, ref) => {
    const displayIcon = icon || getDefaultIcon(variant)
    const iconColor = getIconColor(variant)

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center",
          compact ? "py-[24px] px-[16px]" : "py-[48px] px-[16px]",
          className
        )}
        {...props}
      >
        {displayIcon && (
          <div className={cn("mb-[16px]", iconColor)}>
            {displayIcon}
          </div>
        )}

        <h3 className={cn(
          "font-semibold text-[#30313D] mb-[4px]",
          compact ? "text-[14px]" : "text-[16px]"
        )}>
          {title}
        </h3>

        {description && (
          <p className={cn(
            "text-[#6A7383] mb-[16px] max-w-[400px]",
            compact ? "text-[12px]" : "text-[14px]"
          )}>
            {description}
          </p>
        )}

        {(action || secondaryAction) && (
          <div className="flex items-center gap-[8px]">
            {action}
            {secondaryAction}
          </div>
        )}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

interface EmptyStateCardProps extends EmptyStateProps {
  bordered?: boolean
}

const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  bordered = true,
  ...props
}) => (
  <div
    className={cn(
      "bg-white rounded-[8px]",
      bordered && "border border-[#D5DBE1] shadow-[0px_2px_5px_0px_rgba(60,66,87,0.08),0px_1px_1px_0px_rgba(0,0,0,0.12)]"
    )}
  >
    <EmptyState {...props} />
  </div>
)

const LoadingState: React.FC<{ message?: string; compact?: boolean }> = ({
  message = "Loading...",
  compact = false
}) => (
  <div className={cn(
    "flex flex-col items-center justify-center",
    compact ? "py-[24px]" : "py-[48px]"
  )}>
    <div className="animate-spin rounded-full h-[32px] w-[32px] border-b-2 border-[#7f5efd] mb-[16px]" />
    <p className="text-[14px] text-[#6A7383]">{message}</p>
  </div>
)

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  compact?: boolean
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  description = "An error occurred while loading this content. Please try again.",
  onRetry,
  compact = false
}) => (
  <EmptyState
    variant="error"
    title={title}
    description={description}
    action={
      onRetry && (
        <Button onClick={onRetry} variant="primary" size="sm">
          Try again
        </Button>
      )
    }
    compact={compact}
  />
)

interface NoResultsStateProps {
  searchTerm?: string
  onClearSearch?: () => void
  suggestions?: string[]
  compact?: boolean
}

const NoResultsState: React.FC<NoResultsStateProps> = ({
  searchTerm,
  onClearSearch,
  suggestions,
  compact = false
}) => {
  const description = searchTerm
    ? `No results found for "${searchTerm}". Try adjusting your search.`
    : "No results found. Try adjusting your filters."

  return (
    <EmptyState
      variant="no-results"
      title="No results found"
      description={description}
      action={
        onClearSearch && (
          <Button onClick={onClearSearch} variant="secondary" size="sm">
            Clear search
          </Button>
        )
      }
      compact={compact}
    >
      {suggestions && suggestions.length > 0 && (
        <div className="mt-[16px]">
          <p className="text-[12px] text-[#6A7383] mb-[8px]">
            Try searching for:
          </p>
          <div className="flex flex-wrap gap-[8px] justify-center">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="px-[8px] py-[4px] bg-[#F6F8FA] rounded-[4px] text-[12px] text-[#30313D] hover:bg-[#E3E8EE] transition-colors"
                onClick={() => onClearSearch && onClearSearch()}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </EmptyState>
  )
}

interface SuccessStateProps {
  title?: string
  description?: string
  action?: React.ReactNode
  compact?: boolean
}

const SuccessState: React.FC<SuccessStateProps> = ({
  title = "Success!",
  description = "Your action has been completed successfully.",
  action,
  compact = false
}) => (
  <EmptyState
    variant="success"
    title={title}
    description={description}
    action={action}
    compact={compact}
  />
)

const commonEmptyStates = {
  noPayments: {
    icon: <CreditCard className="h-[48px] w-[48px]" />,
    title: "No payments yet",
    description: "When you receive your first payment, it will appear here."
  },
  noCustomers: {
    icon: <Users className="h-[48px] w-[48px]" />,
    title: "No customers yet",
    description: "Your customers will appear here once they make their first payment."
  },
  noProducts: {
    icon: <Package className="h-[48px] w-[48px]" />,
    title: "No products",
    description: "Add your first product to get started."
  },
  noInvoices: {
    icon: <Receipt className="h-[48px] w-[48px]" />,
    title: "No invoices",
    description: "Your invoices will appear here once you create them."
  },
  noOrders: {
    icon: <ShoppingCart className="h-[48px] w-[48px]" />,
    title: "No orders",
    description: "Your orders will appear here once customers make purchases."
  },
  noData: {
    icon: <Database className="h-[48px] w-[48px]" />,
    title: "No data available",
    description: "There's no data to display at the moment."
  }
}

export {
  EmptyState,
  EmptyStateCard,
  LoadingState,
  ErrorState,
  NoResultsState,
  SuccessState,
  commonEmptyStates
}
export type { EmptyStateProps, EmptyStateVariant }