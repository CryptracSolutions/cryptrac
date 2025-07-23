"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, X, LogOut, User, Settings, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/app/components/ui/button"
import { Logo } from "@/app/components/ui/logo"
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar"
import { createClient } from "@/lib/supabase-browser"
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
    const supabase = createClient()
    
    // Close profile dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element
        if (isProfileOpen && !target.closest('[data-profile-dropdown]')) {
          setIsProfileOpen(false)
        }
      }
      
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isProfileOpen])
    
    const handleLogout = async () => {
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Logged out successfully')
        router.push('/login')
      }
      setIsProfileOpen(false)
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
      { name: 'Payments', href: '/merchant/dashboard/payments' },
      { name: 'Settings', href: '/merchant/dashboard/settings' },
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
              <div className="relative" data-profile-dropdown>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative h-10 px-3 rounded-lg hover:bg-accent"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                        {getInitials(user.email || '', user.user_metadata?.business_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium leading-none">
                        {user.user_metadata?.business_name || 'Account'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {user.email}
                      </div>
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      isProfileOpen && "rotate-180"
                    )} />
                  </div>
                </Button>
                
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-lg border bg-popover shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="p-4 border-b">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                            {getInitials(user.email || '', user.user_metadata?.business_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {user.user_metadata?.business_name || 'Account'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {user.user_metadata?.role === 'admin' ? 'Administrator' : 'Merchant'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start px-4 py-2 text-sm"
                        onClick={() => {
                          router.push('/merchant/dashboard/profile')
                          setIsProfileOpen(false)
                        }}
                      >
                        <User className="mr-3 h-4 w-4" />
                        Profile
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start px-4 py-2 text-sm"
                        onClick={() => {
                          router.push('/merchant/dashboard/settings')
                          setIsProfileOpen(false)
                        }}
                      >
                        <Settings className="mr-3 h-4 w-4" />
                        Settings
                      </Button>
                    </div>
                    
                    <div className="border-t py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start px-4 py-2 text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        Log out
                      </Button>
                    </div>
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

