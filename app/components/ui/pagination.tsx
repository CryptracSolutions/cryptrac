import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { Button } from "./button"

interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage?: number
  totalItems?: number
  showItemCount?: boolean
}

const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(
  ({
    className,
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    totalItems,
    showItemCount = true,
    ...props
  }, ref) => {
    const getPageNumbers = () => {
      const pages: (number | string)[] = []

      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i)
          }
          pages.push('...')
          pages.push(totalPages)
        } else if (currentPage >= totalPages - 2) {
          pages.push(1)
          pages.push('...')
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i)
          }
        } else {
          pages.push(1)
          pages.push('...')
          pages.push(currentPage - 1)
          pages.push(currentPage)
          pages.push(currentPage + 1)
          pages.push('...')
          pages.push(totalPages)
        }
      }

      return pages
    }

    const handlePageClick = (page: number | string) => {
      if (typeof page === 'number' && page !== currentPage) {
        onPageChange(page)
      }
    }

    const startItem = itemsPerPage && totalItems
      ? (currentPage - 1) * itemsPerPage + 1
      : undefined

    const endItem = itemsPerPage && totalItems
      ? Math.min(currentPage * itemsPerPage, totalItems)
      : undefined

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between px-[16px] py-[12px] border-t border-[#D5DBE1]",
          className
        )}
        {...props}
      >
        {showItemCount && startItem && endItem && totalItems && (
          <div className="text-[14px] text-[#6A7383]">
            Showing {startItem}-{endItem} of {totalItems} items
          </div>
        )}

        <div className="flex items-center gap-[4px]">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={cn(
              "inline-flex items-center justify-center w-[28px] h-[28px] rounded-[4px]",
              "text-[#30313D] transition-colors",
              "hover:bg-[#F6F8FA]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            )}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="inline-flex items-center justify-center w-[28px] h-[28px]">
                  <MoreHorizontal className="h-4 w-4 text-[#6A7383]" />
                </span>
              ) : (
                <button
                  onClick={() => handlePageClick(page)}
                  className={cn(
                    "inline-flex items-center justify-center min-w-[28px] h-[28px] px-[8px] rounded-[4px]",
                    "text-[14px] font-medium transition-colors",
                    page === currentPage
                      ? "bg-[#7f5efd] text-white"
                      : "text-[#30313D] hover:bg-[#F6F8FA]"
                  )}
                  aria-label={`Go to page ${page}`}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={cn(
              "inline-flex items-center justify-center w-[28px] h-[28px] rounded-[4px]",
              "text-[#30313D] transition-colors",
              "hover:bg-[#F6F8FA]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            )}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }
)
Pagination.displayName = "Pagination"

interface SimplePaginationProps {
  onPrevious: () => void
  onNext: () => void
  hasPrevious: boolean
  hasNext: boolean
  currentInfo?: string
}

const SimplePagination: React.FC<SimplePaginationProps> = ({
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  currentInfo
}) => (
  <div className="flex items-center justify-between px-[16px] py-[12px] border-t border-[#D5DBE1]">
    <Button
      variant="secondary"
      size="sm"
      onClick={onPrevious}
      disabled={!hasPrevious}
      className="flex items-center gap-[4px]"
    >
      <ChevronLeft className="h-3 w-3" />
      Previous
    </Button>

    {currentInfo && (
      <span className="text-[14px] text-[#6A7383]">
        {currentInfo}
      </span>
    )}

    <Button
      variant="secondary"
      size="sm"
      onClick={onNext}
      disabled={!hasNext}
      className="flex items-center gap-[4px]"
    >
      Next
      <ChevronRight className="h-3 w-3" />
    </Button>
  </div>
)

export { Pagination, SimplePagination }