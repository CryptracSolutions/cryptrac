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
  <nav className={cn("flex items-center space-x-2 text-sm text-gray-600", className)} {...props}>
    {items.map((item, index) => (
      <React.Fragment key={item.href}>
        {index > 0 && <ChevronRight className="h-4 w-4" />}
        <Link href={item.href} className="hover:text-primary-500 transition-colors">
          {item.name}
        </Link>
      </React.Fragment>
    ))}
  </nav>
)

export { Breadcrumbs }
