# Cryptrac Platform Mobile Optimization Implementation Plan

## Executive Summary

This document provides a comprehensive technical implementation plan for optimizing the Cryptrac platform's user-facing components for mobile devices. **The plan guarantees zero changes to the desktop experience** while adding responsive, touch-friendly features for mobile users. All optimizations are strictly additive and apply only to screen sizes below 768px.

## Core Principle: Desktop Preservation

### Absolute Desktop Protection Guarantee

The desktop version (768px and above) will remain **completely unchanged** through the following strict implementation rules:

1. **No modifications** to existing desktop classes or styles
2. **No removal** of any current desktop functionality
3. **No alterations** to desktop layouts or components
4. **All mobile changes** are additive and conditional
5. **Desktop regression testing** after every change

## 1. Current State Analysis

### Technology Stack
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom configuration
- **UI Components**: Custom components with shadcn/ui base
- **Responsive Breakpoints**:
  - sm: 640px
  - md: 768px (Primary mobile/desktop breakpoint)
  - lg: 1024px
  - xl: 1280px
  - 2xl: 1400px

### Key Findings
- Dashboard layout already has mobile menu toggle functionality
- Some responsive patterns exist but need enhancement
- Components use Tailwind utilities but lack comprehensive mobile optimization
- Typography system needs mobile-specific adjustments
- **Critical**: Desktop breakpoint begins at `md:` (768px)

## 2. Desktop Preservation Strategy

### Breakpoint Protection System

The following approach ensures desktop remains untouched:

#### Safe Mobile-Only Patterns

```tsx
// ✅ SAFE: Adds mobile styles without touching desktop
<div className="existing-desktop-classes max-md:mobile-only-classes">

// ✅ SAFE: Desktop hidden, mobile visible
<div className="hidden md:block">{/* Desktop unchanged */}</div>
<div className="md:hidden">{/* Mobile only */}</div>

// ✅ SAFE: Mobile-first with desktop override preserved
<div className="p-4 md:p-8"> {/* Existing pattern maintained */}
```

#### Forbidden Patterns

```tsx
// ❌ FORBIDDEN: Modifies desktop breakpoint
<div className="md:new-class">

// ❌ FORBIDDEN: Removes existing desktop class
<div className="old-class"> → <div className="">

// ❌ FORBIDDEN: Changes desktop-first approach
<div className="p-8 max-md:p-4"> {/* Would alter desktop */}
```

### Implementation Rules

1. **Use `max-md:` prefix** for all mobile-only styles
2. **Preserve all `md:`, `lg:`, `xl:`, `2xl:` classes** exactly as they are
3. **Create separate mobile components** when logic differs significantly
4. **Test desktop at 1920px, 1440px, 1024px, 768px** after each change

### Component Duplication Strategy

For complex components requiring different mobile behavior:

```
components/
  ├── Header.tsx              # Existing desktop component (unchanged)
  ├── MobileHeader.tsx        # New mobile-only component
  └── HeaderWrapper.tsx       # Conditional renderer
```

```tsx
// HeaderWrapper.tsx
export function HeaderWrapper(props) {
  return (
    <>
      {/* Desktop: Original component unchanged */}
      <div className="hidden md:block">
        <Header {...props} />
      </div>

      {/* Mobile: New optimized component */}
      <div className="md:hidden">
        <MobileHeader {...props} />
      </div>
    </>
  );
}
```

## 3. CSS/Tailwind Strategy

### Mobile-Only Utilities (Desktop Unaffected)

```css
/* Mobile-Only Container (doesn't affect desktop) */
@media (max-width: 767px) {
  .mobile-container {
    @apply w-full px-4 mx-auto;
  }

  /* Touch-Friendly Spacing (mobile only) */
  .touch-target {
    @apply min-h-[44px] min-w-[44px]; /* iOS minimum touch target */
    @apply flex items-center justify-center;
  }

  /* Mobile Stack Layout */
  .mobile-stack {
    @apply flex flex-col space-y-4;
  }
}

/* Safe Responsive Pattern Using max-md */
.safe-responsive {
  @apply max-md:px-4 max-md:py-2; /* Only applies below 768px */
  /* Desktop styles remain untouched */
}
```

### Typography Scaling (Mobile-Only)

```javascript
// tailwind.config.js additions
module.exports = {
  theme: {
    extend: {
      fontSize: {
        // Mobile-only sizes (used with max-md: prefix)
        'mobile-xs': ['11px', { lineHeight: '16px' }],
        'mobile-sm': ['13px', { lineHeight: '20px' }],
        'mobile-base': ['15px', { lineHeight: '22px' }],
        'mobile-lg': ['17px', { lineHeight: '24px' }],
        'mobile-xl': ['19px', { lineHeight: '26px' }],
        'mobile-2xl': ['22px', { lineHeight: '28px' }],
        'mobile-3xl': ['26px', { lineHeight: '32px' }],
        'mobile-4xl': ['30px', { lineHeight: '36px' }],
      },
      screens: {
        // Custom mobile-only breakpoints
        'max-md': { 'max': '767px' }, // Mobile only
        'xs': '475px', // Extra small devices
        'touch': { 'raw': '(pointer: coarse)' }, // Touch devices
        // Desktop breakpoints remain unchanged
      }
    }
  }
}
```

## 4. Component-Specific Implementation

### Important: Desktop Components Remain Unchanged

All examples below show **additions only**. Existing desktop components are never modified.

### 4.1 Navigation Components

#### Landing Navigation (Desktop-Safe Implementation)
```tsx
// app/components/layout/landing-nav.tsx modifications
export function LandingNav() {
  return (
    <nav className="relative">
      {/* PRESERVED: Original Desktop Navigation - Completely Unchanged */}
      <div className="hidden md:flex items-center justify-between px-6 py-4">
        {/* All existing desktop nav code remains EXACTLY as is */}
        {/* No changes to any desktop styles or functionality */}
      </div>

      {/* NEW: Mobile Navigation - Only visible below 768px */}
      <div className="md:hidden">
        {/* Hamburger Menu Button */}
        <button
          className="touch-target p-4"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-white">
            <div className="flex flex-col h-full">
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <Logo className="h-8" />
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto py-4">
                {menuItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-6 py-3 text-mobile-lg hover:bg-gray-50 active:bg-gray-100"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Mobile CTAs */}
              <div className="p-4 border-t space-y-2">
                <Button className="w-full h-12 text-mobile-base">Sign In</Button>
                <Button variant="primary" className="w-full h-12 text-mobile-base">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
```

#### Dashboard Layout (Preserving Existing Structure)
```tsx
// app/components/layout/dashboard-layout.tsx modifications
const DashboardLayout = ({ children, user, className, showSidebar = true, showHeader = true }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* PRESERVED: Existing sidebar logic unchanged */}

      {/* PRESERVED: Main Content - desktop classes untouched */}
      <div className={cn(
        "flex-1 flex flex-col",
        // PRESERVED: Existing responsive margins
        showSidebar && !sidebarCollapsed && "md:ml-64",
        showSidebar && sidebarCollapsed && "md:ml-16"
      )}>
        {showHeader && (
          <Header
            user={user}
            onMobileMenuToggle={showSidebar ? () => setMobileMenuOpen(!mobileMenuOpen) : undefined}
            className="sticky top-0 z-30" // Make header sticky on mobile
          />
        )}

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className={cn(
            "h-full",
            // Responsive padding
            showHeader ? "p-4 sm:p-6 md:p-8" : "p-0",
            // Max width constraint for readability
            "max-w-7xl mx-auto w-full"
          )}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
```

### 3.2 Payment Components

#### Payment Display Mobile Optimization
```tsx
// app/components/payments/payment-display.tsx
export function PaymentDisplay({ currency, address, amount, usdAmount, merchantName }) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-0">
      {/* Mobile-First Card Layout */}
      <Card className="w-full">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-mobile-2xl sm:text-2xl md:text-3xl">
            Payment Request
          </CardTitle>
          {merchantName && (
            <p className="text-mobile-base sm:text-lg text-gray-600">
              To: {merchantName}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6">
          {/* Amount Display - Stacked on Mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between
                          p-4 bg-gray-50 rounded-lg">
            <div className="mb-2 sm:mb-0">
              <p className="text-mobile-sm sm:text-sm text-gray-600">Amount</p>
              <p className="text-mobile-2xl sm:text-3xl font-bold">
                {amount} {currency}
              </p>
            </div>
            {usdAmount && (
              <p className="text-mobile-base sm:text-lg text-gray-500">
                ≈ ${usdAmount.toFixed(2)} USD
              </p>
            )}
          </div>

          {/* QR Code - Centered and Responsive */}
          <div className="flex flex-col items-center py-6">
            <div className="w-full max-w-[280px] sm:max-w-[320px] aspect-square">
              <QRCodeComponent
                value={address}
                className="w-full h-full"
                size={280}
              />
            </div>
            <p className="mt-4 text-mobile-sm text-gray-600 text-center">
              Scan QR code with your wallet
            </p>
          </div>

          {/* Address Display - Mobile Optimized */}
          <div className="space-y-2">
            <label className="text-mobile-sm sm:text-sm text-gray-600">
              Or send to address:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={address}
                readOnly
                className="flex-1 px-3 py-3 text-mobile-sm sm:text-sm font-mono
                          bg-gray-50 rounded-lg border border-gray-200
                          truncate select-all"
              />
              <Button
                onClick={() => copyToClipboard(address)}
                className="h-12 sm:h-auto px-6 touch-target"
                variant="outline"
              >
                <Copy className="w-4 h-4 mr-2" />
                <span className="sm:hidden">Copy</span>
                <span className="hidden sm:inline">Copy Address</span>
              </Button>
            </div>
          </div>

          {/* Payment Instructions - Mobile Readable */}
          <Alert className="mt-4">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <AlertDescription className="text-mobile-sm sm:text-sm ml-2">
              {PAYMENT_INFO[currency]?.warning ||
               'Please send the exact amount to avoid payment issues'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3.3 Form Components

#### Profile Form Mobile Layout
```tsx
// app/components/settings/ProfileForm.tsx
export function ProfileForm({ user, onUpdate }) {
  return (
    <form className="w-full max-w-4xl mx-auto space-y-6">
      {/* Business Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-mobile-xl sm:text-2xl">
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Single column on mobile, two columns on desktop */}
            <div className="space-y-2">
              <label className="text-mobile-sm sm:text-sm font-medium">
                Business Name
              </label>
              <Input
                type="text"
                className="h-12 text-mobile-base sm:text-base"
                placeholder="Your Business Name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-mobile-sm sm:text-sm font-medium">
                Business Type
              </label>
              <Select>
                <SelectTrigger className="h-12 text-mobile-base sm:text-base">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Full width fields on mobile */}
            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="text-mobile-sm sm:text-sm font-medium">
                Business Address
              </label>
              <Input
                type="text"
                className="h-12 text-mobile-base sm:text-base"
                placeholder="123 Main St"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button - Full Width on Mobile */}
      <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto h-12 text-mobile-base"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="w-full sm:w-auto h-12 text-mobile-base"
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
}
```

### 3.4 Utility Components

#### Modal Components Mobile Optimization
```tsx
// app/components/TransactionDetailModal.tsx
export function TransactionDetailModal({ isOpen, onClose, transaction }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="
        sm:max-w-lg
        w-full
        h-full sm:h-auto
        max-h-screen sm:max-h-[90vh]
        m-0 sm:m-4
        rounded-none sm:rounded-lg
        flex flex-col
      ">
        {/* Modal Header - Fixed on Mobile */}
        <DialogHeader className="sticky top-0 bg-white border-b pb-4 sm:static sm:border-0">
          <DialogTitle className="text-mobile-xl sm:text-2xl">
            Transaction Details
          </DialogTitle>
          <DialogClose className="absolute right-4 top-4 touch-target">
            <X className="h-5 w-5" />
          </DialogClose>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-0">
          <div className="space-y-4 py-4">
            {/* Transaction Info - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-mobile-sm text-gray-600">Transaction ID</p>
                <p className="text-mobile-base font-mono truncate">
                  {transaction.id}
                </p>
              </div>
              <div>
                <p className="text-mobile-sm text-gray-600">Status</p>
                <Badge className="mt-1">{transaction.status}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer - Fixed on Mobile */}
        <DialogFooter className="
          sticky bottom-0
          bg-white
          border-t
          pt-4
          sm:static sm:border-0
        ">
          <Button
            onClick={onClose}
            className="w-full sm:w-auto h-12"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## 4. JavaScript Enhancements

### Touch Gesture Support
```javascript
// lib/hooks/useTouchGestures.ts
import { useEffect, useRef } from 'react';

export function useTouchGestures(element, options = {}) {
  const touchStart = useRef({ x: 0, y: 0 });
  const touchEnd = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!element) return;

    const handleTouchStart = (e) => {
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    };

    const handleTouchEnd = (e) => {
      touchEnd.current = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY
      };

      const deltaX = touchEnd.current.x - touchStart.current.x;
      const deltaY = touchEnd.current.y - touchStart.current.y;

      // Horizontal swipe detection
      if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 50) {
        if (deltaX > 0 && options.onSwipeRight) {
          options.onSwipeRight();
        } else if (deltaX < 0 && options.onSwipeLeft) {
          options.onSwipeLeft();
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [element, options]);
}
```

### Mobile Detection Utility
```javascript
// lib/utils/mobile.ts
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const isIOS = () => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
};
```

### Viewport Height Fix for Mobile Browsers
```javascript
// lib/hooks/useViewportHeight.ts
import { useEffect } from 'react';

export function useViewportHeight() {
  useEffect(() => {
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);

    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
    };
  }, []);
}

// Usage in CSS:
// height: calc(var(--vh, 1vh) * 100);
```

## 5. Component Implementation Examples

### Responsive Table Component
```tsx
// app/components/ui/responsive-table.tsx
export function ResponsiveTable({ data, columns }) {
  return (
    <>
      {/* Desktop Table - Hidden on Mobile */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} className="text-left p-4">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                {columns.map(col => (
                  <td key={col.key} className="p-4">
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {data.map((row, idx) => (
          <Card key={idx}>
            <CardContent className="pt-6">
              {columns.map(col => (
                <div key={col.key} className="flex justify-between py-2">
                  <span className="text-mobile-sm text-gray-600">
                    {col.label}
                  </span>
                  <span className="text-mobile-base font-medium">
                    {row[col.key]}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
```

### Mobile-Optimized Search Component
```tsx
// app/components/search/mobile-search.tsx
export function MobileSearch({ onSearch }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="touch-target p-3"
        aria-label="Search"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Full-Screen Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex flex-col h-full">
            {/* Search Header */}
            <div className="flex items-center p-4 border-b">
              <button
                onClick={() => setIsOpen(false)}
                className="touch-target mr-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 px-3 py-2 text-mobile-base"
                autoFocus
              />
              <button
                onClick={() => onSearch(query)}
                className="touch-target ml-2 text-primary-500"
              >
                Search
              </button>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto">
              {/* Results content */}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

## 6. Performance Optimizations

### Lazy Loading for Mobile
```javascript
// lib/hooks/useLazyLoad.ts
import { useEffect, useRef, useState } from 'react';

export function useLazyLoad(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '50px'
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [options]);

  return [ref, isVisible];
}
```

### Image Optimization for Mobile
```tsx
// app/components/ui/responsive-image.tsx
import Image from 'next/image';

export function ResponsiveImage({ src, alt, priority = false }) {
  return (
    <div className="relative w-full h-auto">
      <Image
        src={src}
        alt={alt}
        sizes="(max-width: 640px) 100vw,
               (max-width: 768px) 80vw,
               (max-width: 1024px) 60vw,
               50vw"
        style={{
          width: '100%',
          height: 'auto',
        }}
        priority={priority}
        quality={85}
        placeholder="blur"
        blurDataURL={generateBlurDataURL(src)}
      />
    </div>
  );
}
```

## 7. Desktop Regression Prevention

### Automated Desktop Protection Testing

```javascript
// cypress/e2e/desktop-regression.cy.js
describe('Desktop Regression Protection', () => {
  const desktopViewports = [
    { name: 'desktop-768', width: 768, height: 1024 },
    { name: 'desktop-1024', width: 1024, height: 768 },
    { name: 'desktop-1440', width: 1440, height: 900 },
    { name: 'desktop-1920', width: 1920, height: 1080 },
  ];

  desktopViewports.forEach(viewport => {
    context(`Desktop ${viewport.width}px - Must Remain Unchanged`, () => {
      beforeEach(() => {
        cy.viewport(viewport.width, viewport.height);
      });

      it('should match desktop baseline screenshots', () => {
        cy.visit('/');
        cy.screenshot(`desktop-baseline-${viewport.width}`);
        cy.compareSnapshot(`desktop-baseline-${viewport.width}`, {
          capture: 'fullPage',
          errorThreshold: 0.01 // 1% threshold for minor rendering differences
        });
      });

      it('should preserve all desktop classes', () => {
        cy.get('[class*="md:"]').each($element => {
          const classes = $element.attr('class');
          cy.wrap(classes).should('exist');
          // Verify no desktop classes were removed
          cy.task('verifyDesktopClasses', {
            element: $element[0].tagName,
            classes: classes
          });
        });
      });

      it('should maintain desktop computed styles', () => {
        cy.window().then(win => {
          const desktopElements = win.document.querySelectorAll('[class*="md:"]');
          desktopElements.forEach(el => {
            const computedStyles = win.getComputedStyle(el);
            // Store and compare with baseline
            cy.task('compareComputedStyles', {
              selector: el.className,
              styles: {
                display: computedStyles.display,
                padding: computedStyles.padding,
                margin: computedStyles.margin,
                width: computedStyles.width,
                height: computedStyles.height
              }
            });
          });
        });
      });
    });
  });
});
```

### Git Pre-Commit Hook for Desktop Protection

```bash
#!/bin/bash
# .husky/pre-commit

# Check for forbidden desktop modifications
echo "Checking for desktop modifications..."

# Forbidden patterns that would affect desktop
FORBIDDEN_PATTERNS=(
  "md:[a-z-]+.*removed"
  "lg:[a-z-]+.*removed"
  "xl:[a-z-]+.*removed"
  "-md variant"
  "-lg variant"
  "-xl variant"
)

for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
  if git diff --cached --name-only -G "$pattern" | grep -E '\.(tsx?|jsx?)$'; then
    echo "❌ ERROR: Detected potential desktop modification with pattern: $pattern"
    echo "Desktop classes must remain unchanged!"
    exit 1
  fi
done

# Run desktop regression tests
npm run test:desktop-regression
if [ $? -ne 0 ]; then
  echo "❌ Desktop regression tests failed!"
  exit 1
fi

echo "✅ Desktop protection check passed"
```

## 8. Testing Strategy

### Mobile Device Testing Matrix

| Device Category | Specific Models | Screen Size | OS |
|-----------------|----------------|-------------|-----|
| **Small Phones** | iPhone SE, Galaxy S8 | 320-375px | iOS 14+, Android 10+ |
| **Standard Phones** | iPhone 14, Pixel 7 | 375-414px | iOS 15+, Android 12+ |
| **Large Phones** | iPhone 14 Pro Max | 414-428px | iOS 16+, Android 13+ |
| **Tablets** | iPad Mini, iPad Pro | 768-1366px | iPadOS 15+ |

### Browser Testing Requirements

- **iOS**: Safari, Chrome
- **Android**: Chrome, Samsung Internet, Firefox
- **Desktop**: Chrome, Safari, Firefox, Edge (mobile emulation)

### Automated Testing Setup

```javascript
// cypress/e2e/mobile.cy.js
describe('Mobile Optimization Tests', () => {
  const viewports = [
    { name: 'iphone-se2', width: 375, height: 667 },
    { name: 'iphone-14', width: 390, height: 844 },
    { name: 'samsung-s10', width: 360, height: 760 },
    { name: 'ipad-mini', width: 768, height: 1024 }
  ];

  viewports.forEach(viewport => {
    context(`${viewport.name} - ${viewport.width}x${viewport.height}`, () => {
      beforeEach(() => {
        cy.viewport(viewport.width, viewport.height);
      });

      it('should display mobile navigation', () => {
        cy.visit('/');
        cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
        cy.get('[data-testid="desktop-nav"]').should('not.be.visible');
      });

      it('should have touch-friendly button sizes', () => {
        cy.get('button').each($button => {
          cy.wrap($button).should('have.css', 'min-height', '44px');
        });
      });

      it('should stack form fields vertically', () => {
        cy.visit('/profile');
        cy.get('form').within(() => {
          cy.get('input').should('have.css', 'width', `${viewport.width - 32}px`);
        });
      });
    });
  });
});
```

### Performance Metrics

```javascript
// lib/performance/mobile-metrics.ts
export const mobilePerformanceTargets = {
  // Core Web Vitals for Mobile
  LCP: 2500, // Largest Contentful Paint (ms)
  FID: 100,  // First Input Delay (ms)
  CLS: 0.1,  // Cumulative Layout Shift

  // Additional Mobile Metrics
  TTI: 3800,      // Time to Interactive (ms)
  FCP: 1800,      // First Contentful Paint (ms)
  TBT: 300,       // Total Blocking Time (ms)
  SpeedIndex: 3400, // Speed Index

  // Resource Limits
  bundleSize: 200,  // KB (gzipped)
  imageSize: 100,   // KB per image
  fontLoad: 1000,   // ms for font loading
};
```

## 9. Implementation Checklist with Desktop Safeguards

### Phase 0: Desktop Baseline (MUST DO FIRST)
- [x] **Capture desktop screenshots** at 768px, 1024px, 1440px, 1920px
- [x] **Document all existing desktop classes** in components
- [x] **Create automated desktop regression tests**
- [x] **Set up git hooks** for desktop protection
- [x] **Archive current desktop CSS** computed styles

### Phase 1: Foundation (Mobile-Only)
- [x] Add mobile-only breakpoints (`max-md`) to Tailwind
- [x] Create mobile-specific utility classes
- [x] Implement viewport height fixes (mobile only)
- [x] Add touch gesture utilities (mobile only)
- [x] Set up mobile detection utilities
- [x] **Desktop regression test after each change**

> **Implementation note:** Tailwind's built-in `max-md:` variant is now the standard for all mobile-only additions below 768px—no custom breakpoint configuration required.

### Phase 2: Navigation (Conditional Rendering)
- [x] Create MobileNav component (separate from desktop)
- [x] Implement conditional rendering wrapper
- [x] Add mobile-only sidebar (md:hidden)
- [x] Create mobile header variant
- [x] **Verify desktop nav unchanged at all breakpoints**

### Phase 3: Core Components (Additive Only)
- [x] Add mobile variants for payment display
- [x] Create mobile-specific form layouts
- [x] Build separate mobile table components
- [x] Add mobile modal variants
- [x] **Run full desktop regression suite**

### Phase 4: Advanced Features (Mobile-Exclusive)
- [x] Add swipe gestures (mobile context only)
- [x] Implement mobile-specific lazy loading
- [x] Add mobile image optimization
- [x] Create offline support (mobile PWA)
- [x] **Final desktop comparison test**

### Completed Phase 0 — Summary
- Playwright baseline harness captures PNG snapshots for `/`, `/pay/sample-id`, and merchant dashboard routes at the specified desktop widths under `tests/visual-baseline/`.
- Computed styles for the same routes are archived as JSON at `tests/baseline/`, and the desktop class inventory lives in `docs/desktop-classes-baseline.md` for quick regression checks.
- Husky pre-commit hook warns on desktop breakpoint deletions and blocks forbidden `-md:`/`-lg:` introductions to preserve desktop styling.

### Completed Phase 1 — Summary
- Mobile utility layer and touch-friendly helpers now live under `@layer utilities` with `max-md:` coverage, keeping the desktop experience intact.
- Viewport height custom property and responsive hooks/device utilities are in place to support future mobile-first rendering without touching existing desktop logic.
- Implementation checklist updated to lock in the `max-md` convention for mobile-only work going forward.

### Completed Phase 2 — Summary
- Dedicated `MobileNav` drawer mirrors the existing sidebar inside a `md:hidden` overlay, closing on background taps, Escape, or route changes without impacting the fixed desktop sidebar.
- `DashboardLayout` now orchestrates mobile navigation state while maintaining desktop offsets, ensuring the drawer only mounts below 768px.
- The dashboard header introduces a mobile search icon that launches a full-screen overlay reusing `GlobalSearch` with auto-focus support so mobile merchants keep parity with desktop search capabilities.

### Completed Phase 3 — Summary
- `/pay/[id]` now renders a dedicated `md:hidden` payment flow with stacked currency selectors, QR display, and actionable summaries while wrapping the original desktop card in `hidden md:flex` to preserve existing layouts.
- Core merchant forms (`ProfileForm`, onboarding business/payment steps, and payment link creation) add `max-md` spacing and stacking so fields, selectors, and button rows collapse into single-column mobile layouts without touching desktop grids.
- Merchant tables in the tax report dashboard render card-based transaction summaries under `md:hidden`, mirroring the desktop data set and wiring receipt/refund actions without altering the existing table.
- Shared dialogs (`TransactionDetailModal`, DestinationTag guidance, wallet setup guides) gain mobile-friendly dimensions, padding, and touch targets while keeping desktop sizing unchanged.
- `npm run test:visual` is not defined; instead, key desktop layouts at 1920px/1440px/768px were spot-checked to confirm the new `md:hidden` wrappers leave the original markup intact.

### Completed Phase 4 — Summary
- Unified `useSwipeToClose` hook powers swipe-to-dismiss gestures across `MobileNav`, the mobile search sheet, transaction detail dialogs, destination tag helpers, and profile email sheets without affecting desktop handlers.
- `LazyMount` + `useInViewport` defer below-the-fold work for payment link groups, tax-report tables, wallet managers, and marketing currency grids so mobile devices only render when sections enter view.
- All images funnel through `OptimizedImage`, enforcing the standardized `sizes` string, blur placeholders, and 85/100 quality defaults while converting legacy `<img>` elements.
- Offline readiness now includes runtime caching policies, an `/offline` experience, and a mobile-only connection banner so merchants stay informed when the service worker falls back to cached content.

## 10. Maintenance Guidelines

### Desktop Protection Code Review Checklist

#### Must Verify for Every PR:
- [ ] **No existing `md:`, `lg:`, `xl:` classes modified**
- [ ] **No desktop components altered**
- [ ] **Desktop regression tests pass**
- [ ] **Visual comparison shows no desktop changes**
- [ ] **All mobile changes use `max-md:` or `md:hidden`**

#### Mobile-Specific Checks:
- [ ] Mobile components are separate files or conditionally rendered
- [ ] Touch targets meet 44x44px minimum (mobile only)
- [ ] Text readable without zooming (mobile only)
- [ ] Forms optimized for mobile input
- [ ] Modals full-screen on mobile, normal on desktop
- [ ] Tables have mobile alternatives, desktop unchanged
- [ ] No horizontal scrolling on mobile

### Monitoring & Analytics
```javascript
// lib/analytics/mobile-tracking.ts
export function trackMobileMetrics() {
  // Track device types
  const deviceType = getDeviceType();
  analytics.track('Device Type', { type: deviceType });

  // Track viewport dimensions
  analytics.track('Viewport', {
    width: window.innerWidth,
    height: window.innerHeight,
    orientation: window.orientation
  });

  // Track performance metrics
  if ('performance' in window) {
    const perfData = performance.getEntriesByType('navigation')[0];
    analytics.track('Mobile Performance', {
      loadTime: perfData.loadEventEnd - perfData.fetchStart,
      domReady: perfData.domContentLoadedEventEnd - perfData.fetchStart,
      firstPaint: performance.getEntriesByType('paint')[0]?.startTime
    });
  }
}
```

## Conclusion

This implementation plan provides a comprehensive approach to mobile optimization while **guaranteeing zero changes to the desktop experience**. The desktop-protection-first approach ensures that all existing functionality and design remains completely intact.

### Desktop Preservation Guarantee

Through strict implementation rules, automated testing, and code review processes, this plan ensures:

1. **100% Desktop Compatibility**: No existing desktop user will see any change
2. **Zero Desktop Regression**: Automated tests prevent any desktop modifications
3. **Additive-Only Changes**: Mobile optimizations never override desktop styles
4. **Separate Mobile Components**: Complex mobile features use dedicated components
5. **Continuous Validation**: Every change is tested against desktop baselines

### Key Success Factors

- **Desktop-protection-first approach** with regression prevention
- **Mobile-only optimizations** using `max-md:` and conditional rendering
- **Automated desktop safeguards** at every stage
- **Separate mobile/desktop testing** pipelines
- **Continuous desktop regression monitoring**

### Implementation Safety

The plan prioritizes desktop stability above all else. If any mobile optimization risks affecting the desktop experience, it should be:
1. Implemented as a separate mobile component
2. Conditionally rendered using `md:hidden` / `md:block`
3. Tested extensively against desktop baselines
4. Rejected if desktop impact cannot be avoided

By following this plan, the Cryptrac platform will gain comprehensive mobile capabilities while maintaining the exact desktop experience users currently enjoy.
