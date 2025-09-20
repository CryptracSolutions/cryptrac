"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { GlobalSearch } from "@/app/components/search/GlobalSearch"
import { UserMenu } from "@/app/components/navigation/user-menu"
import { cn } from "@/lib/utils"
import { Button } from "@/app/components/ui/button"
import { createClient } from "@/lib/supabase-browser"

interface HeaderProps {
  user?: {
    id?: string
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
    const [localUser, setLocalUser] = React.useState(user)
    const [businessName, setBusinessName] = React.useState<string | null>(null)
    const supabase = createClient()
    
    // Fetch merchant business name
    const fetchBusinessName = React.useCallback(async (userId: string) => {
      try {
        const { data: merchant, error } = await supabase
          .from('merchants')
          .select('business_name')
          .eq('user_id', userId)
          .single()
          
        if (error) {
          console.error('Error fetching merchant business name:', error)
          return
        }
        
        if (merchant?.business_name) {
          setBusinessName(merchant.business_name)
        }
      } catch (error) {
        console.error('Error fetching business name:', error)
      }
    }, [supabase])
    
    // Make header resilient to missing user prop
    React.useEffect(() => {
      // If no user prop provided, try to get from auth
      if (!user) {
        supabase.auth.getUser().then(({ data }) => {
          if (data.user) {
            setLocalUser(data.user as unknown as Record<string, unknown>)
            fetchBusinessName(data.user.id)
          }
        })
      } else {
        setLocalUser(user)
        if (user?.id) {
          fetchBusinessName(user.id)
        }
      }
      
      // Subscribe to auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          setLocalUser(session.user as unknown as Record<string, unknown>)
          fetchBusinessName(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          setLocalUser(null)
          setBusinessName(null)
        }
      })
      
      return () => {
        subscription.unsubscribe()
      }
    }, [user, supabase.auth, fetchBusinessName])
    
    
    const navigation = localUser ? [] : [
      { name: 'Features', href: '/#features' },
      { name: 'Pricing', href: '/#pricing' },
      { name: 'About', href: '/about' },
    ]
    
    return (
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-50 w-full border-b border-[var(--color-border-subtle)] bg-white",
          className
        )}
      >
        <div className="flex h-[60px] items-center px-6">
          {/* Global Search (left-aligned) */}
          {localUser && (
            <div className="hidden md:block w-full max-w-md">
              <GlobalSearch />
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
          <div className="flex items-center gap-4 ml-auto">
            {localUser ? (
              <UserMenu
                user={localUser}
                businessName={businessName}
                align="end"
              />
            ) : (
              /* Auth Buttons */
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  asChild
                >
                  <Link href="/login">Log in</Link>
                </Button>
                <Button
                  size="sm"
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
                  asChild
                >
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            {onMobileMenuToggle && (
              <button
                onClick={() => {
                  onMobileMenuToggle()
                  setIsMenuOpen(!isMenuOpen)
                }}
                className="lg:hidden p-2 hover:bg-[var(--color-bg-subtle)] rounded-md transition-colors"
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5 text-[var(--color-text-secondary)]" />
                ) : (
                  <Menu className="h-5 w-5 text-[var(--color-text-secondary)]" />
                )}
              </button>
            )}
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

