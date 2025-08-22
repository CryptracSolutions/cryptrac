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
  QrCode,
  Users,
  Shield,
  Bell,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Zap
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
        name: "Quick Actions",
        href: "/merchant/dashboard#quick-actions",
        icon: Zap,
      },
      {
        name: "Tax Reports",
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
    
    return (
      <aside
        ref={ref}
        className={cn(
          "flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!collapsed && <Logo size="md" />}
          {collapsed && <Logo size="md" showText={false} />}
          
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-8 w-8 p-0"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
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
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          {userRole === "merchant" && !collapsed && (
            <div className="mb-4">
              <Badge variant="warning" className="w-full justify-center text-xs">
                Trial Active
              </Badge>
            </div>
          )}
          
          <Link
            href="/help"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors",
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

