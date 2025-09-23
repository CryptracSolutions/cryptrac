"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  name: string
  href: string
}

interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[]
}

const Breadcrumbs = ({ items, className, ...props }: BreadcrumbsProps) => (
  <nav
    className={cn(
      "flex items-center space-x-2 text-sm text-gray-600",
      "max-md:flex-wrap max-md:space-x-1 max-md:space-y-1 max-md:text-xs max-md:px-1",
      className
    )}
    {...props}
  >
    {items.map((item, index) => (
      <React.Fragment key={item.href}>
        {index > 0 && (
          <ChevronRight className="h-4 w-4 max-md:h-3.5 max-md:w-3.5" />
        )}
        <Link
          href={item.href}
          className={cn(
            "inline-flex items-center rounded-md px-1.5 py-1 transition-colors hover:text-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
            "max-md:min-h-[44px] max-md:px-3 max-md:py-2 max-md:text-sm max-md:rounded-lg max-md:-mx-1"
          )}
        >
          {item.name}
        </Link>
      </React.Fragment>
    ))}
  </nav>
)

export { Breadcrumbs }
