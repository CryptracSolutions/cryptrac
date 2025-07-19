"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, X, LogOut, User, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/app/components/ui/button"
import { Logo } from "@/app/components/ui/logo"
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar"
import { createBrowserClient } from "@/lib/supabase-browser"
import { toast } from "react-hot-toast"

interface HeaderProps {
  user?: {
    email?: string
    user_metadata?: {
      role?: string
      business_name?: string
    }
  } | null
  className?: string
  onMobileMenuToggle?: () => void
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ user, className, onMobileMenuToggle }, ref) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false)
    const [isProfileOpen, setIsProfileOpen] = React.useState(false)
    const router = useRouter()
    const supabase = createBrowserClient()
    
    const handleLogout = async () => {
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Logged out successfully')
        router.push('/login')
      }
    }
    
    const getInitials = (email: string, businessName?: string) => {
      if (businessName) {
        return businessName.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)
      }
      return email.split('@')[0].slice(0, 2).toUpperCase()
    }
    
    const getDashboardLink = (role?: string) => {
      switch (role) {
        case 'admin':
          return '/admin'
        case 'rep':
          return '/rep/dashboard'
        case 'partner':
          return '/partner/dashboard'
        default:
          return '/merchant/dashboard'
      }
    }
    
    const navigation = user ? [
      { name: 'Dashboard', href: getDashboardLink(user.user_metadata?.role) },
      { name: 'Payments', href: '/merchant/payments' },
      { name: 'Settings', href: '/merchant/settings' },
    ] : [
      { name: 'Features', href: '/#features' },
      { name: 'Pricing', href: '/#pricing' },
      { name: 'About', href: '/#about' },
    ]
    
    return (
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          className
        )}
      >
        <div className="container-wide flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo size="md" />
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.name}
              </Link>
            ))}
          </nav>
          
          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {user ? (
              /* User Menu */
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative h-8 w-8 rounded-full"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(user.email || '', user.user_metadata?.business_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
                
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md border bg-popover p-1 shadow-md">
                    <div className="px-2 py-1.5 text-sm">
                      <div className="font-medium">{user.user_metadata?.business_name || 'Account'}</div>
                      <div className="text-muted-foreground">{user.email}</div>
                    </div>
                    <div className="h-px bg-border my-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => router.push('/merchant/profile')}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => router.push('/merchant/settings')}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                    <div className="h-px bg-border my-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-destructive hover:text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* Auth Buttons */
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>
            )}
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => {
                if (onMobileMenuToggle) {
                  onMobileMenuToggle()
                } else {
                  setIsMenuOpen(!isMenuOpen)
                }
              }}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="container-wide py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {!user && (
                <div className="pt-4 space-y-2">
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button size="sm" className="w-full" asChild>
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    )
  }
)
Header.displayName = "Header"

export { Header }

