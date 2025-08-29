"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, X, LogOut, User, Settings, ChevronDown } from "lucide-react"
import { GlobalSearch } from "@/app/components/search/GlobalSearch"
import { cn } from "@/lib/utils"
import { Button } from "@/app/components/ui/button"
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
  onCommandPaletteOpen?: () => void
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ user, className, onMobileMenuToggle, onCommandPaletteOpen }, ref) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false)
    const [isProfileOpen, setIsProfileOpen] = React.useState(false)
    const [localUser, setLocalUser] = React.useState(user)
    const router = useRouter()
    const supabase = createClient()
    
    // Make header resilient to missing user prop
    React.useEffect(() => {
      // If no user prop provided, try to get from auth
      if (!user) {
        supabase.auth.getUser().then(({ data }) => {
          if (data.user) {
            setLocalUser(data.user as unknown as Record<string, unknown>)
          }
        })
      } else {
        setLocalUser(user)
      }
      
      // Subscribe to auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          setLocalUser(session.user as unknown as Record<string, unknown>)
        } else if (event === 'SIGNED_OUT') {
          setLocalUser(null)
        }
      })
      
      return () => {
        subscription.unsubscribe()
      }
    }, [user, supabase.auth])
    
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
    
    const navigation = localUser ? [] : [
      { name: 'Features', href: '/#features' },
      { name: 'Pricing', href: '/#pricing' },
      { name: 'About', href: '/about' },
    ]
    
    return (
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-50 w-full border-b bg-white shadow-sm",
          className
        )}
      >
        <div className="container-wide flex h-16 items-center">
          {/* Global Search (left-aligned) */}
          {localUser && (
            <div className="hidden md:block w-full max-w-md">
              <GlobalSearch onCommandPaletteOpen={onCommandPaletteOpen} />
            </div>
          )}
          
          {/* Desktop Navigation - Only for non-authenticated users */}
          {!localUser && (
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
          )}
          
          {/* Right Side */}
          <div className="flex items-center space-x-4 ml-auto">
            {localUser ? (
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
                        {getInitials(localUser.email || '', localUser.user_metadata?.business_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium leading-none">
                        {localUser.user_metadata?.business_name || 'Account'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {localUser.email}
                      </div>
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      isProfileOpen && "rotate-180"
                    )} />
                  </div>
                </Button>
                
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-xl z-50">
                    <div className="p-4 border-b">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                            {getInitials(localUser.email || '', localUser.user_metadata?.business_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {localUser.user_metadata?.business_name || 'Account'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {localUser.email}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {localUser.user_metadata?.role === 'admin' ? 'Administrator' : 'Merchant'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Profile and Settings buttons removed - functionality moved to sidebar */}
                    
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
        
        {/* Mobile Menu - Only for non-authenticated users */}
        {isMenuOpen && !localUser && (
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
              
              <div className="pt-4 space-y-2">
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button size="sm" className="w-full" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
    )
  }
)
Header.displayName = "Header"

export { Header }

