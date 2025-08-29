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
  ChevronLeft,
  ChevronRight,
  Calculator,
  Zap,
  Smartphone,
  RefreshCw,
  User
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/app/components/ui/button"
import { Logo } from "@/app/components/ui/logo"
import { Badge } from "@/app/components/ui/badge"

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
    
    // Routes under Quick Actions for active detection
    const quickActionsChildHrefs = [
      "/smart-terminal",
      "/merchant/dashboard/payments/create",
      "/merchant/subscriptions/create",
    ]
    
    const merchantNavigation = [
      {
        name: "Dashboard",
        href: "/merchant/dashboard",
        icon: LayoutDashboard,
      },
      {
        name: "Payments",
        href: "/merchant/dashboard/payments",
        icon: CreditCard,
      },
      {
        name: "Profile",
        href: "/merchant/dashboard/profile",
        icon: User,
      },
      {
        name: "Transactions",
        href: "/merchant/dashboard/tax-reports",
        icon: Calculator,
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
        name: "Dashboard",
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
          "flex flex-col bg-black border-r border-gray-800 transition-all duration-200 h-screen",
          collapsed ? "w-16" : "w-64",
          className
        )}
      >
        {/* Brand */}
        <div className="pt-3 pb-2 px-4">
          <div className={cn("flex items-center gap-3 justify-center")}> 
            <Logo size="lg" showText={false} emblemClassName="bg-transparent" />
            {!collapsed && (
              <span className="font-phonic text-xl leading-tight font-medium text-white tracking-tight">CRYPTRAC</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = item.href === activeHref
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg font-phonic text-sm font-normal transition-colors",
                  isActive
                    ? "bg-[#7f5efd] text-white"
                    : "text-gray-300 hover:text-white hover:bg-white/5",
                  collapsed && "justify-center"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
                {collapsed && (
                  <span className="sr-only">{item.name}</span>
                )}
              </Link>
            )
          })}
          
          {/* Quick Actions Expandable Menu */}
          <div className="space-y-1">
            {(() => {
              const isQuickActive =
                quickActionsExpanded ||
                quickActionsChildHrefs.some((href) => pathname === href || pathname.startsWith(href + "/"))
              return (
                <button
                  onClick={() => setQuickActionsExpanded(!quickActionsExpanded)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg font-phonic text-sm font-normal transition-colors w-full text-left",
                    isQuickActive ? "bg-[#7f5efd] text-white" : "text-gray-300 hover:text-white hover:bg-white/5",
                    collapsed && "justify-center"
                  )}
                >
                  <Zap className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span>Quick Actions</span>
                      <ChevronRight className={cn(
                        "h-4 w-4 ml-auto transition-transform",
                        quickActionsExpanded && "rotate-90"
                      )} />
                    </>
                  )}
                </button>
              )
            })()}
            
            {quickActionsExpanded && !collapsed && (
              <div className="ml-8 space-y-1">
                <Link
                  href="/smart-terminal"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg font-phonic text-sm font-normal text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Smartphone className="h-4 w-4 flex-shrink-0" />
                  <span>Smart Terminal</span>
                </Link>
                <Link
                  href="/merchant/dashboard/payments/create"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg font-phonic text-sm font-normal text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <CreditCard className="h-4 w-4 flex-shrink-0" />
                  <span>Create Payment Link</span>
                </Link>
                <Link
                  href="/merchant/subscriptions/create"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg font-phonic text-sm font-normal text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 flex-shrink-0" />
                  <span>Create Subscription</span>
                </Link>
              </div>
            )}
          </div>
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <Link
            href="/help"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg font-phonic text-sm font-normal text-gray-300 hover:text-white hover:bg-white/5 transition-colors",
              collapsed && "justify-center"
            )}
          >
            <HelpCircle className="h-5 w-5 flex-shrink-0" />
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

