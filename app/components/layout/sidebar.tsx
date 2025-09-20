"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
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
  FileText,
  Menu
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/app/components/ui/logo"

interface SidebarProps {
  userRole?: string
  className?: string
  collapsed?: boolean
  onToggleCollapse?: () => void
}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ userRole = "merchant", className, collapsed = false, onToggleCollapse }, ref) => {
    const pathname = usePathname()
    const [quickActionsExpanded, setQuickActionsExpanded] = React.useState(false)
    const [paymentsExpanded, setPaymentsExpanded] = React.useState(true)
    const [reportsExpanded, setReportsExpanded] = React.useState(false)
    
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
    ]

    const adminSections = [
      {
        title: "Management",
        expanded: true,
        setExpanded: () => {},
        items: [
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
        ]
      },
      {
        title: "System",
        expanded: true,
        setExpanded: () => {},
        items: [
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
      },
    ]

    const adminBottomNavigation: typeof merchantBottomNavigation = []
    
    const navigation = userRole === "admin" ? adminNavigation : merchantNavigation
    const sections = userRole === "admin" ? adminSections : merchantSections
    const bottomNavigation = userRole === "admin" ? adminBottomNavigation : merchantBottomNavigation
    
    // Determine single active item using longest matching prefix
    const activeHref = React.useMemo(() => {
      const matches = navigation
        .map((n) => n.href)
        .filter((href) => pathname === href || pathname.startsWith(href + "/"))
        .sort((a, b) => b.length - a.length)
      return matches[0]
    }, [pathname, navigation])
    
    return (
      <aside
        ref={ref}
        className={cn(
          "flex flex-col bg-white border-r border-[var(--color-border-subtle)] transition-all duration-200 h-screen",
          collapsed ? "w-16" : "w-64",
          className
        )}
      >
        {/* Brand */}
        <div className="h-[60px] px-6 flex items-center justify-between border-b border-[var(--color-border-subtle)]">
          <Link href="/" className={cn("flex items-center gap-3 hover:opacity-80 transition-opacity")}>
            <Logo size="sm" showText={false} emblemClassName="bg-transparent" />
            {!collapsed && (
              <span className="font-semibold text-[16px] text-[var(--color-text-primary)]">Cryptrac</span>
            )}
          </Link>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:bg-[var(--color-bg-subtle)] rounded-md transition-colors"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="h-4 w-4 text-[var(--color-text-secondary)]" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          {/* Main Navigation */}
          <div className="px-3 py-3">
            {navigation.map((item) => {
              const isActive = item.href === activeHref

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 h-9 rounded-md text-[14px] font-medium transition-all duration-150 relative",
                    isActive
                      ? "bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2px] before:bg-[var(--color-primary)] before:rounded-full"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                  {!collapsed && <span>{item.name}</span>}
                  {collapsed && (
                    <span className="sr-only">{item.name}</span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Collapsible Sections */}
          {!collapsed && sections.map((section) => (
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
                          "flex items-center gap-3 px-3 h-9 rounded-md text-[14px] font-medium transition-all duration-150 relative",
                          isActive
                            ? "bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2px] before:bg-[var(--color-primary)] before:rounded-full"
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
          {!collapsed && (
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
                  <Link
                    href="/smart-terminal"
                    className="flex items-center gap-3 px-3 h-9 rounded-md text-[14px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-all duration-150"
                  >
                    <Smartphone className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                    <span>Smart Terminal</span>
                  </Link>
                  <Link
                    href="/merchant/dashboard/payments/create"
                    className="flex items-center gap-3 px-3 h-9 rounded-md text-[14px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-all duration-150"
                  >
                    <CreditCard className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                    <span>Create Payment</span>
                  </Link>
                  <Link
                    href="/merchant/subscriptions/create"
                    className="flex items-center gap-3 px-3 h-9 rounded-md text-[14px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-all duration-150"
                  >
                    <RefreshCw className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                    <span>New Subscription</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Bottom Navigation */}
          {!collapsed && bottomNavigation.length > 0 && (
            <div className="mt-auto px-3 pb-3 pt-3 border-t border-[var(--color-border-subtle)]">
              {bottomNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 h-9 rounded-md text-[14px] font-medium transition-all duration-150 relative",
                      isActive
                        ? "bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2px] before:bg-[var(--color-primary)] before:rounded-full"
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
        </nav>
        {/* Footer - Help & Support */}
        <div className="border-t border-[var(--color-border-subtle)] px-3 py-3">
          <Link
            href="/help"
            className={cn(
              "flex items-center gap-3 px-3 h-9 rounded-md text-[14px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-all duration-150",
              collapsed && "justify-center px-0"
            )}
          >
            <HelpCircle className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
            {!collapsed && <span>Help & Support</span>}
            {collapsed && (
              <span className="sr-only">Help & Support</span>
            )}
          </Link>
        </div>
      </aside>
    )
  }
)
Sidebar.displayName = "Sidebar"

export { Sidebar }

