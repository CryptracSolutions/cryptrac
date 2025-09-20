"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  X,
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Settings,
  Wallet,
  Users,
  Shield,
  Bell,
  HelpCircle,
  ChevronDown,
  Calculator,
  Smartphone,
  RefreshCw,
  User,
  FileText
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/app/components/ui/logo"

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  user?: {
    email?: string
    user_metadata?: {
      role?: string
      business_name?: string
    }
  } | null
}

export function MobileNav({ isOpen, onClose, user }: MobileNavProps) {
  const pathname = usePathname()
  const userRole = user?.user_metadata?.role || "merchant"
  const [paymentsExpanded, setPaymentsExpanded] = React.useState(false)
  const [reportsExpanded, setReportsExpanded] = React.useState(false)
  const [quickActionsExpanded, setQuickActionsExpanded] = React.useState(false)

  // Close on route change
  React.useEffect(() => {
    onClose()
  }, [pathname, onClose])

  // Prevent body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
    }
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  const merchantNavigation = [
    {
      name: "Home",
      href: "/merchant/dashboard",
      icon: LayoutDashboard,
    },
  ]

  const merchantSections = [
    {
      title: "Payments",
      expanded: paymentsExpanded,
      setExpanded: setPaymentsExpanded,
      items: [
        {
          name: "All payments",
          href: "/merchant/dashboard/payments",
          icon: CreditCard,
        },
        {
          name: "Payment links",
          href: "/merchant/dashboard/payments/create",
          icon: FileText,
        },
        {
          name: "Subscriptions",
          href: "/merchant/subscriptions",
          icon: RefreshCw,
        },
      ]
    },
    {
      title: "Reports",
      expanded: reportsExpanded,
      setExpanded: setReportsExpanded,
      items: [
        {
          name: "Transactions",
          href: "/merchant/dashboard/tax-reports",
          icon: Calculator,
        },
        {
          name: "Analytics",
          href: "/merchant/dashboard/analytics",
          icon: BarChart3,
        },
      ]
    },
  ]

  const quickActions = [
    {
      name: "Smart Terminal",
      href: "/smart-terminal",
      icon: Smartphone,
    },
    {
      name: "Create Payment",
      href: "/merchant/dashboard/payments/create",
      icon: CreditCard,
    },
    {
      name: "New Subscription",
      href: "/merchant/subscriptions/create",
      icon: RefreshCw,
    },
  ]

  const merchantBottomNavigation = [
    {
      name: "Profile",
      href: "/merchant/dashboard/profile",
      icon: User,
    },
    {
      name: "Wallets",
      href: "/merchant/wallets",
      icon: Wallet,
    },
    {
      name: "Settings",
      href: "/merchant/settings",
      icon: Settings,
    },
  ]

  const adminNavigation = [
    {
      name: "Home",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      name: "Merchants",
      href: "/admin/merchants",
      icon: Users,
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
    },
    {
      name: "Security",
      href: "/admin/security",
      icon: Shield,
    },
    {
      name: "Support",
      href: "/admin/support",
      icon: Bell,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ]

  const navigation = userRole === "admin" ? adminNavigation : merchantNavigation
  const sections = userRole === "admin" ? [] : merchantSections
  const bottomNavigation = userRole === "admin" ? [] : merchantBottomNavigation

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <nav
        className={cn(
          "fixed left-0 top-0 h-full w-[280px] bg-white shadow-xl z-50 lg:hidden transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Mobile navigation"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-[60px] px-6 flex items-center justify-between border-b border-[var(--color-border-subtle)]">
            <Link href="/" className="flex items-center gap-3">
              <Logo size="sm" showText={false} />
              <span className="font-semibold text-[16px] text-[var(--color-text-primary)]">Cryptrac</span>
            </Link>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--color-bg-subtle)] rounded-md transition-colors"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5 text-[var(--color-text-secondary)]" />
            </button>
          </div>

          {/* Navigation Content */}
          <div className="flex-1 overflow-y-auto py-3">
            {/* Main Navigation */}
            <div className="px-3 pb-3">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 h-10 rounded-md text-[14px] font-medium transition-all duration-150 relative",
                      isActive
                        ? "bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-[var(--color-primary)] before:rounded-full"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]"
                    )}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* Collapsible Sections */}
            {sections.map((section) => (
              <div key={section.title} className="mb-2">
                <button
                  onClick={() => section.setExpanded(!section.expanded)}
                  className="w-full px-6 py-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  <span>{section.title}</span>
                  <ChevronDown className={cn(
                    "h-3 w-3 transition-transform duration-200",
                    !section.expanded && "-rotate-90"
                  )} />
                </button>
                {section.expanded && (
                  <div className="px-3 pb-2 space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 h-10 rounded-md text-[14px] font-medium transition-all duration-150 relative",
                            isActive
                              ? "bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-[var(--color-primary)] before:rounded-full"
                              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]"
                          )}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                          <span>{item.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* Quick Actions */}
            {quickActions.length > 0 && (
              <div className="mb-2">
                <button
                  onClick={() => setQuickActionsExpanded(!quickActionsExpanded)}
                  className="w-full px-6 py-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  <span>Quick Actions</span>
                  <ChevronDown className={cn(
                    "h-3 w-3 transition-transform duration-200",
                    !quickActionsExpanded && "-rotate-90"
                  )} />
                </button>
                {quickActionsExpanded && (
                  <div className="px-3 pb-2 space-y-1">
                    {quickActions.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-3 px-3 h-10 rounded-md text-[14px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-all duration-150"
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Navigation */}
            {bottomNavigation.length > 0 && (
              <div className="mt-4 pt-4 px-3 border-t border-[var(--color-border-subtle)]">
                {bottomNavigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 h-10 rounded-md text-[14px] font-medium transition-all duration-150 relative",
                        isActive
                          ? "bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-[var(--color-primary)] before:rounded-full"
                          : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]"
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--color-border-subtle)] px-3 py-3">
            <Link
              href="/help"
              className="flex items-center gap-3 px-3 h-10 rounded-md text-[14px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-all duration-150"
            >
              <HelpCircle className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
              <span>Help & Support</span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}