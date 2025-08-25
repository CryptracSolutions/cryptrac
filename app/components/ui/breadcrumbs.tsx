import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface Crumb {
  label: string
  href?: string
}

type BreadcrumbsProps = {
  crumbs: Crumb[]
  className?: string
}

export function Breadcrumbs({ crumbs, className }: BreadcrumbsProps) {
  if (!crumbs || crumbs.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center space-x-1 text-sm text-gray-500">
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1
          return (
            <li key={idx} className="flex items-center">
              {idx !== 0 && <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />}
              {isLast || !crumb.href ? (
                <span className="text-gray-700 font-medium truncate max-w-[150px]">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-gray-700 truncate max-w-[150px]">
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
