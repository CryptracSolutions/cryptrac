"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight, MoreHorizontal, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Button } from "@/app/components/ui/button"

interface BreadcrumbItem {
  name: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}

interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[]
  maxVisible?: number
  separator?: React.ReactNode
  homeIcon?: boolean
}

const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ items, maxVisible = 3, separator, homeIcon = true, className, ...props }, ref) => {
    const visibleItems = React.useMemo(() => {
      if (items.length <= maxVisible + 1) return null

      const firstItem = items[0]
      const lastItems = items.slice(-(maxVisible - 1))
      const hiddenItems = items.slice(1, -(maxVisible - 1))

      return {
        first: firstItem,
        hidden: hiddenItems,
        visible: lastItems,
      }
    }, [items, maxVisible])

    const SeparatorIcon = () => (
      separator || (
        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-[var(--color-text-tertiary)]" />
      )
    )

    if (items.length === 0) return null

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn("flex items-center text-[14px]", className)}
        {...props}
      >
        <ol className="flex items-center gap-2">
          {!visibleItems ? (
            // Show all items if within limit
            items.map((item, index) => {
              const Icon = item.icon
              const isLast = index === items.length - 1
              const isFirst = index === 0

              return (
                <React.Fragment key={item.href}>
                  {index > 0 && <SeparatorIcon />}
                  <li>
                    {isLast ? (
                      <span className="text-[var(--color-text-primary)] font-medium">
                        {isFirst && homeIcon && !Icon && (
                          <Home className="h-4 w-4 inline-block mr-1" />
                        )}
                        {Icon && <Icon className="h-4 w-4 inline-block mr-1" />}
                        {item.name}
                      </span>
                    ) : (
                      <Link
                        href={item.href}
                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors inline-flex items-center"
                      >
                        {isFirst && homeIcon && !Icon && (
                          <Home className="h-4 w-4 mr-1" />
                        )}
                        {Icon && <Icon className="h-4 w-4 mr-1" />}
                        {item.name}
                      </Link>
                    )}
                  </li>
                </React.Fragment>
              )
            })
          ) : (
            // Show collapsed breadcrumbs with dropdown
            <>
              <li>
                <Link
                  href={visibleItems.first.href}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors inline-flex items-center"
                >
                  {homeIcon && !visibleItems.first.icon && (
                    <Home className="h-4 w-4 mr-1" />
                  )}
                  {visibleItems.first.icon && (
                    <visibleItems.first.icon className="h-4 w-4 mr-1" />
                  )}
                  {visibleItems.first.name}
                </Link>
              </li>

              <SeparatorIcon />

              <li>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Show hidden breadcrumb items</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="min-w-[200px] bg-white border border-[var(--color-border-subtle)]"
                  >
                    {visibleItems.hidden.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link
                          href={item.href}
                          className="flex items-center gap-2 px-3 py-2 text-[14px] hover:bg-[var(--color-bg-subtle)]"
                        >
                          {item.icon && <item.icon className="h-4 w-4" />}
                          {item.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>

              {visibleItems.visible.map((item, index) => {
                const isLast = index === visibleItems.visible.length - 1
                return (
                  <React.Fragment key={item.href}>
                    <SeparatorIcon />
                    <li>
                      {isLast ? (
                        <span className="text-[var(--color-text-primary)] font-medium inline-flex items-center">
                          {item.icon && <item.icon className="h-4 w-4 mr-1" />}
                          {item.name}
                        </span>
                      ) : (
                        <Link
                          href={item.href}
                          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors inline-flex items-center"
                        >
                          {item.icon && <item.icon className="h-4 w-4 mr-1" />}
                          {item.name}
                        </Link>
                      )}
                    </li>
                  </React.Fragment>
                )
              })}
            </>
          )}
        </ol>
      </nav>
    )
  }
)

Breadcrumbs.displayName = "Breadcrumbs"

export { Breadcrumbs, type BreadcrumbItem }
