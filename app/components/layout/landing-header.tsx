"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Logo } from "@/app/components/ui/logo";
import { ChevronDown, Menu, X } from "lucide-react";
import { getCurrentUser, supabase } from "@/lib/supabase-browser";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [canAccessDashboard, setCanAccessDashboard] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    let isMounted = true;
    const evaluateAccess = async () => {
      const user = await getCurrentUser();
      if (!isMounted) return;
      setIsLoggedIn(!!user);

      if (!user) {
        setCanAccessDashboard(false);
        return;
      }

      const role = (user.user_metadata as any)?.role;
      if (role && role !== 'merchant') {
        setCanAccessDashboard(true);
        return;
      }

      try {
        const { data: merchant, error } = await supabase
          .from('merchants')
          .select('onboarding_completed, onboarded, user_id')
          .eq('user_id', user.id)
          .single();

        if (error) {
          setCanAccessDashboard(false);
          return;
        }
        const completed = !!(merchant?.onboarding_completed || merchant?.onboarded);
        setCanAccessDashboard(completed);
      } catch (_e) {
        setCanAccessDashboard(false);
      }
    };

    evaluateAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      evaluateAccess();
    });
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container-wide flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="lg" showText={false} emblemClassName="bg-transparent" />
          <span className="font-phonic text-xl leading-tight font-medium text-gray-900 tracking-tight">Cryptrac</span>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            href="#features" 
            className="font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors"
          >
            Features
          </Link>
          
          {/* What We Offer Dropdown */}
          <div className="relative">
            <button
              onClick={toggleDropdown}
              onMouseEnter={() => setIsDropdownOpen(true)}
              className="font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors flex items-center gap-1"
            >
              What We Offer
              <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            <div
              className={`absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-200 ${
                isDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
              }`}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <div className="py-2">
                <Link
                  href="/smart-terminal"
                  className="block px-4 py-2 text-sm text-gray-700 hover:text-[#7f5efd] hover:bg-[#f5f3ff] transition-colors"
                >
                  Smart Terminal
                </Link>
                <Link
                  href="/payment-links"
                  className="block px-4 py-2 text-sm text-gray-700 hover:text-[#7f5efd] hover:bg-[#f5f3ff] transition-colors"
                >
                  Payment Links
                </Link>
                <Link
                  href="/subscriptions"
                  className="block px-4 py-2 text-sm text-gray-700 hover:text-[#7f5efd] hover:bg-[#f5f3ff] transition-colors"
                >
                  Subscriptions
                </Link>
              </div>
            </div>
          </div>
          
          <Link 
            href="#pricing" 
            className="font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors"
          >
            Pricing
          </Link>
          <Link 
            href="#faq" 
            className="font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors"
          >
            FAQ
          </Link>
          <Link 
            href="/blog" 
            className="font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors"
          >
            Blog
          </Link>
          <Link 
            href="/about" 
            className="font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors"
          >
            About
          </Link>
          <Link 
            href="/help" 
            className="font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors"
          >
            Help
          </Link>
          <Link 
            href="/contact" 
            className="font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors"
          >
            Contact
          </Link>
        </nav>
        
        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center space-x-3">
          {isLoggedIn ? (
            canAccessDashboard ? (
              <Button 
                size="sm" 
                className="font-phonic text-sm font-normal bg-[#7f5efd] hover:bg-[#7c3aed] text-white" 
                asChild
              >
                <Link href="/merchant/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] hover:bg-[#f5f3ff]" 
                asChild
              >
                <Link href="/merchant/onboarding">Continue Onboarding</Link>
              </Button>
            )
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] hover:bg-[#f5f3ff]" 
                asChild
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button 
                size="sm" 
                className="font-phonic text-sm font-normal bg-[#7f5efd] hover:bg-[#7c3aed] text-white" 
                asChild
              >
                <Link href="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>
        
        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 text-gray-600 hover:text-[#7f5efd] transition-colors"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      
      {/* Mobile Navigation */}
      <div className={`md:hidden transition-all duration-300 ease-in-out ${
        isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
      }`}>
        <div className="container-wide py-4 border-t bg-white">
          <nav className="space-y-4">
            <Link 
              href="#features" 
              className="block font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors"
              onClick={closeMobileMenu}
            >
              Features
            </Link>
            
            {/* Mobile What We Offer Section */}
            <div className="space-y-2">
              <div className="font-phonic text-sm font-normal text-gray-600">What We Offer</div>
              <div className="pl-4 space-y-2">
                <Link
                  href="/smart-terminal"
                  className="block font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors"
                  onClick={closeMobileMenu}
                >
                  Smart Terminal
                </Link>
                <Link
                  href="/payment-links"
                  className="block font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors"
                  onClick={closeMobileMenu}
                >
                  Payment Links
                </Link>
                <Link
                  href="/subscriptions"
                  className="block font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors"
                  onClick={closeMobileMenu}
                >
                  Subscriptions
                </Link>
              </div>
            </div>
            
            <Link 
              href="#pricing" 
              className="block font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors"
              onClick={closeMobileMenu}
            >
              Pricing
            </Link>
            <Link 
              href="#faq" 
              className="block font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors"
              onClick={closeMobileMenu}
            >
              FAQ
            </Link>
            <Link 
              href="/blog" 
              className="block font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors"
              onClick={closeMobileMenu}
            >
              Blog
            </Link>
            <Link 
              href="/about" 
              className="block font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors"
              onClick={closeMobileMenu}
            >
              About
            </Link>
            <Link 
              href="/help" 
              className="block font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors"
              onClick={closeMobileMenu}
            >
              Help
            </Link>
            <Link 
              href="/contact" 
              className="block font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] transition-colors"
              onClick={closeMobileMenu}
            >
              Contact
            </Link>
          </nav>
          
          {/* Mobile Buttons */}
          <div className="mt-6 space-y-3">
            {isLoggedIn ? (
              canAccessDashboard ? (
                <Button 
                  size="sm" 
                  className="w-full font-phonic text-sm font-normal bg-[#7f5efd] hover:bg-[#7c3aed] text-white" 
                  asChild
                >
                  <Link href="/merchant/dashboard" onClick={closeMobileMenu}>Dashboard</Link>
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] hover:bg-[#f5f3ff]" 
                  asChild
                >
                  <Link href="/merchant/onboarding" onClick={closeMobileMenu}>Continue Onboarding</Link>
                </Button>
              )
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full font-phonic text-sm font-normal text-gray-600 hover:text-[#7f5efd] hover:bg-[#f5f3ff]" 
                  asChild
                >
                  <Link href="/login" onClick={closeMobileMenu}>Log in</Link>
                </Button>
                <Button 
                  size="sm" 
                  className="w-full font-phonic text-sm font-normal bg-[#7f5efd] hover:bg-[#7c3aed] text-white" 
                  asChild
                >
                  <Link href="/signup" onClick={closeMobileMenu}>Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
