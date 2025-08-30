"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Header } from "./header"
import { Sidebar } from "./sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
  user?: {
    email?: string
    user_metadata?: {
      role?: string
      business_name?: string
    }
  } | null
  className?: string
  showSidebar?: boolean
  showHeader?: boolean
}

const DashboardLayout = React.forwardRef<HTMLDivElement, DashboardLayoutProps>(
  ({ children, user, className, showSidebar = true, showHeader = true }, ref) => {
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
    
    const userRole = user?.user_metadata?.role || "merchant"
    
    // Close mobile menu when screen size changes
    React.useEffect(() => {
      const handleResize = () => {
        if (window.innerWidth >= 768) {
          setMobileMenuOpen(false)
        }
      }
      
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [])
    
    return (
      <div ref={ref} className={cn("min-h-screen bg-gray-50 flex", className)}>
        {/* Full-height sidebar */}
        {showSidebar && (
          <>
            {/* Desktop Sidebar */}
            <div className="hidden md:block fixed left-0 top-0 h-full z-40">
              <Sidebar
                userRole={userRole}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
            </div>
            
            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
              <div className="fixed inset-0 z-50 md:hidden">
                <div 
                  className="fixed inset-0 bg-black/50" 
                  onClick={() => setMobileMenuOpen(false)}
                />
                <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl">
                  <Sidebar
                    userRole={userRole}
                    collapsed={false}
                    onToggleCollapse={() => setMobileMenuOpen(false)}
                  />
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Main content area with header */}
        <div className={cn(
          "flex-1 flex flex-col",
          showSidebar && !sidebarCollapsed && "md:ml-64",
          showSidebar && sidebarCollapsed && "md:ml-16"
        )}>
          {showHeader && (
            <Header 
              user={user} 
              onMobileMenuToggle={showSidebar ? () => setMobileMenuOpen(!mobileMenuOpen) : undefined}
            />
          )}
          
          <main className="flex-1 overflow-hidden">
            <div className={cn(
              "h-full",
              showHeader ? "p-6 md:p-8" : "p-0"
            )}>
              {children}
            </div>
          </main>
        </div>
      </div>
    )
  }
)
DashboardLayout.displayName = "DashboardLayout"

export { DashboardLayout }

