"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDown, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/app/components/ui/button"
import { Logo } from "@/app/components/ui/logo"
import { supabase } from "@/lib/supabase-browser"

export function LandingNav() {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)
  const [canAccessDashboard, setCanAccessDashboard] = React.useState(false)
  const [isAuthChecked, setIsAuthChecked] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isDropdownOpen && !target.closest('[data-dropdown]')) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDropdownOpen])

  // Detect and subscribe to auth state, and determine dashboard visibility
  React.useEffect(() => {
    let isMounted = true
    const ric = (cb: () => void) => {
      // Defer to idle time to avoid blocking navigation/UI thread
      if (typeof window !== 'undefined' && (window as any).requestIdleCallback) {
        ;(window as any).requestIdleCallback(cb)
      } else {
        setTimeout(cb, 0)
      }
    }

    const evaluateAccess = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!isMounted) return

      startTransition(() => {
        setIsLoggedIn(!!user)
      })

      if (!user) {
        startTransition(() => {
          setCanAccessDashboard(false)
          setIsAuthChecked(true)
        })
        return
      }

      const role = (user.user_metadata as Record<string, unknown>)?.role

      // Non-merchant roles can access their dashboards
      if (role && role !== 'merchant') {
        startTransition(() => {
          setCanAccessDashboard(true)
          setIsAuthChecked(true)
        })
        return
      }

      // Merchant: check onboarding status
      try {
        const { data: merchant, error } = await supabase
          .from('merchants')
          .select('onboarding_completed, onboarded, user_id')
          .eq('user_id', user.id)
          .single()

        if (error) {
          // If there's an error or no merchant yet, treat as not completed
          startTransition(() => {
            setCanAccessDashboard(false)
            setIsAuthChecked(true)
          })
          return
        }

        const completed = !!(merchant?.onboarding_completed || merchant?.onboarded)
        startTransition(() => {
          setCanAccessDashboard(completed)
          setIsAuthChecked(true)
        })
      } catch {
        startTransition(() => {
          setCanAccessDashboard(false)
          setIsAuthChecked(true)
        })
      }
    }

    ric(evaluateAccess)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      ric(() => {
        evaluateAccess()
      })
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const whatWeOfferItems = React.useMemo(() => [
    { 
      name: "Smart Terminal", 
      href: "/smart-terminal-info",
      description: "Point-of-sale crypto payment terminal"
    },
    { 
      name: "Payment Links", 
      href: "/payment-links-info",
      description: "Generate shareable payment links instantly"
    },
    { 
      name: "Subscriptions", 
      href: "/subscriptions-info",
      description: "Automated recurring crypto payments"
    }
  ], [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container-wide flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="lg" showText={false} emblemClassName="bg-transparent" />
          <span className="font-phonic text-xl leading-tight font-medium text-gray-900 tracking-tight">Cryptrac</span>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {/* What We Offer Dropdown */}
          <div className="relative" data-dropdown>
            <button
              className="font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors flex items-center gap-1"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              What We Offer
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform duration-200",
                isDropdownOpen && "rotate-180"
              )} />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 rounded-lg border bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-2">
                  {whatWeOfferItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-4 py-3 text-sm hover:bg-gray-50 hover:text-[#7f5efd] transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link href="/#features" className="font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors">
            Features
          </Link>
          <Link href="/#pricing" className="font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors">
            Pricing
          </Link>
          <Link href="/#faq" className="font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors">
            FAQ
          </Link>
          <Link href="/blog" className="font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors">
            Blog
          </Link>
          <Link href="/about" className="font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors">
            About
          </Link>
          <Link href="/help" className="font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors">
            Help
          </Link>
          <Link href="/contact" className="font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors">
            Contact
          </Link>
        </nav>
        
        {/* Auth Buttons */}
        <div className="flex items-center space-x-3">
          {isAuthChecked && (
            isLoggedIn ? (
              canAccessDashboard ? (
                <Button size="sm" className="font-phonic text-sm font-normal bg-[#7f5efd] hover:bg-[#7c3aed] text-white" asChild>
                  <Link href="/merchant/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <Button size="sm" className="font-phonic text-sm font-normal bg-[#7f5efd] hover:bg-[#7c3aed] text-white" asChild>
                  <Link href="/merchant/onboarding">Continue Onboarding</Link>
                </Button>
              )
            ) : (
              <>
                <Button variant="ghost" size="sm" className="font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] hover:bg-gray-100" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button size="sm" className="font-phonic text-sm font-normal bg-[#7f5efd] hover:bg-[#7c3aed] text-white" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )
          )}
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container-wide py-4 space-y-2">
            {/* What We Offer Mobile Section */}
            <div className="space-y-2">
              <div className="px-3 py-2 text-sm font-medium text-gray-900">What We Offer</div>
              {whatWeOfferItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-6 py-2 text-sm font-normal text-gray-600 hover:text-[#7f5efd] hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            
            <Link
              href="/#features"
              className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-[#7f5efd] transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-[#7f5efd] transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/#faq"
              className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-[#7f5efd] transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              FAQ
            </Link>
            <Link
              href="/blog"
              className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-[#7f5efd] transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              href="/about"
              className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-[#7f5efd] transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/help"
              className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-[#7f5efd] transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Help
            </Link>
            <Link
              href="/contact"
              className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-[#7f5efd] transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>
            
            <div className="pt-4 space-y-2 border-t">
              {isAuthChecked && (
                isLoggedIn ? (
                  canAccessDashboard ? (
                    <Button size="sm" className="w-full font-phonic text-sm font-normal bg-[#7f5efd] hover:bg-[#7c3aed] text-white" asChild>
                      <Link href="/merchant/dashboard" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
                    </Button>
                  ) : (
                    <Button size="sm" className="w-full font-phonic text-sm font-normal bg-[#7f5efd] hover:bg-[#7c3aed] text-white" asChild>
                      <Link href="/merchant/onboarding" onClick={() => setIsMobileMenuOpen(false)}>Continue Onboarding</Link>
                    </Button>
                  )
                ) : (
                  <>
                    <Button variant="ghost" size="sm" className="w-full font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] hover:bg-gray-100" asChild>
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Log in</Link>
                    </Button>
                    <Button size="sm" className="w-full font-phonic text-sm font-normal bg-[#7f5efd] hover:bg-[#7c3aed] text-white" asChild>
                      <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
                    </Button>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
