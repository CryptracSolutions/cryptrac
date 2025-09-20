import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronUp, ChevronDown, ChevronsUpDown, Check } from "lucide-react"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-[14px]", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "border-b border-[#D5DBE1] bg-white",
      className
    )}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean
  hoverable?: boolean
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, selected, hoverable = true, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-[#D5DBE1] transition-colors",
        hoverable && "hover:bg-[#F6F8FA]",
        selected && "bg-[#F6F8FA]",
        className
      )}
      {...props}
    />
  )
)
TableRow.displayName = "TableRow"

interface TableHeaderCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean
  sorted?: 'asc' | 'desc' | false
  onSort?: () => void
}

const TableHeaderCell = React.forwardRef<
  HTMLTableCellElement,
  TableHeaderCellProps
>(({ className, children, sortable, sorted, onSort, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-[36px] px-[8px] text-left align-middle font-semibold text-[11px] uppercase tracking-[-0.4px] text-[#30313D]",
      sortable && "cursor-pointer select-none hover:bg-[#F6F8FA]",
      className
    )}
    onClick={sortable ? onSort : undefined}
    {...props}
  >
    <div className="flex items-center gap-[4px]">
      <span>{children}</span>
      {sortable && (
        <span className="inline-flex shrink-0">
          {sorted === 'asc' && <ChevronUp className="h-3 w-3 text-[#6A7383]" />}
          {sorted === 'desc' && <ChevronDown className="h-3 w-3 text-[#6A7383]" />}
          {!sorted && <ChevronsUpDown className="h-3 w-3 text-[#D5DBE1]" />}
        </span>
      )}
    </div>
  </th>
))
TableHeaderCell.displayName = "TableHeaderCell"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("bg-white", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right'
  wrap?: boolean
}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, align = 'left', wrap = false, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "px-[8px] py-[8px] align-middle text-[14px] text-[#30313D]",
        align === 'center' && "text-center",
        align === 'right' && "text-right",
        !wrap && "truncate",
        className
      )}
      {...props}
    />
  )
)
TableCell.displayName = "TableCell"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "bg-white font-medium text-[#30313D] border-t border-[#D5DBE1]",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-[12px] text-[#6A7383]", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

interface TableCheckboxCellProps {
  checked: boolean
  indeterminate?: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  "aria-label"?: string
}

const TableCheckboxCell = React.forwardRef<
  HTMLTableCellElement,
  TableCheckboxCellProps
>(({ checked, indeterminate, onCheckedChange, disabled, "aria-label": ariaLabel, ...props }, ref) => {
  const checkboxRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = !!indeterminate
    }
  }, [indeterminate])

  return (
    <td ref={ref} className="w-[40px] px-[8px] py-[8px]" {...props}>
      <label className="flex items-center justify-center">
        <input
          ref={checkboxRef}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          disabled={disabled}
          aria-label={ariaLabel}
        />
        <div
          className={cn(
            "h-[14px] w-[14px] rounded-[4px] border transition-all",
            "shadow-[0px_2px_5px_0px_rgba(60,66,87,0.08),0px_1px_1px_0px_rgba(0,0,0,0.12)]",
            checked || indeterminate
              ? "border-[#7f5efd] bg-[#7f5efd]"
              : "border-[#D5DBE1] bg-white hover:border-[#C9D1DB]",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {(checked || indeterminate) && (
            <Check className="h-full w-full p-[1px] text-white" strokeWidth={3} />
          )}
        </div>
      </label>
    </td>
  )
})
TableCheckboxCell.displayName = "TableCheckboxCell"

interface TableBulkActionsProps {
  selectedCount: number
  onCancel: () => void
  children?: React.ReactNode
}

const TableBulkActions: React.FC<TableBulkActionsProps> = ({
  selectedCount,
  onCancel,
  children
}) => {
  if (selectedCount === 0) return null

  return (
    <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-[#7f5efd] px-[16px] py-[8px] text-white">
      <div className="flex items-center gap-[8px]">
        <button
          onClick={onCancel}
          className="text-white hover:text-white/80 transition-colors"
          aria-label="Cancel selection"
        >
          <span className="text-[14px] font-semibold">
            {selectedCount} selected
          </span>
        </button>
      </div>
      <div className="flex items-center gap-[8px]">
        {children}
      </div>
    </div>
  )
}

interface TableEmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  icon,
  title,
  description,
  action
}) => (
  <div className="flex flex-col items-center justify-center py-[48px] px-[16px] text-center">
    {icon && (
      <div className="mb-[16px] text-[#6A7383]">
        {icon}
      </div>
    )}
    <h3 className="text-[16px] font-semibold text-[#30313D] mb-[4px]">
      {title}
    </h3>
    {description && (
      <p className="text-[14px] text-[#6A7383] mb-[16px] max-w-[400px]">
        {description}
      </p>
    )}
    {action}
  </div>
)

interface TableSkeletonProps {
  rows?: number
  columns?: number
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4
}) => (
  <div className="w-full">
    <div className="border-b border-[#D5DBE1] bg-white">
      <div className="flex h-[36px] items-center px-[8px] gap-[16px]">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="h-[12px] bg-[#F6F8FA] rounded animate-pulse"
            style={{ width: `${Math.random() * 40 + 60}px` }}
          />
        ))}
      </div>
    </div>
    <div className="bg-white">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center px-[8px] py-[12px] border-b border-[#D5DBE1] gap-[16px]"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-[16px] bg-[#F6F8FA] rounded animate-pulse"
              style={{ width: `${Math.random() * 60 + 80}px` }}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
)

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHeaderCell,
  TableCell,
  TableCaption,
  TableCheckboxCell,
  TableBulkActions,
  TableEmptyState,
  TableSkeleton
}