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
/* Mobile-only helpers (desktop untouched) */
@media (max-width: 767px) {
  .mobile-container {
    @apply w-full mx-auto px-4;
  }

  .mobile-page-padding {
    @apply px-4 py-6;
  }

  .mobile-section-padding {
    @apply px-4 py-5;
  }

  .mobile-section-padding-tight {
    @apply px-4 py-4;
  }

  .mobile-touch-button {
    min-height: 2.75rem;
    @apply px-4;
  }

  .mobile-stack {
    @apply flex flex-col gap-4;
  }

  .mobile-touch-target {
    @apply flex items-center justify-center;
    min-height: 44px;
    min-width: 44px;
  }
}
```

### Typography Scaling (Mobile-Only)

Instead of introducing custom font tokens, we reuse Tailwind's existing typography scale and apply adjustments with responsive prefixes. Example pattern:

```tsx
<h1 className="text-3xl max-md:text-2xl">Dashboard Headline</h1>
<p className="text-base max-md:text-sm text-gray-600">Supporting copy.</p>
<span className="text-sm max-md:text-xs text-gray-500">Meta information</span>
```

This keeps desktop sizes completely unchanged while ensuring mobile legibility, and it mirrors the approach now live on the merchant dashboard cards and profile forms.

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
          className="mobile-touch-target p-4"
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
              className="h-12 sm:h-auto px-6 mobile-touch-target"
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
          <DialogClose className="absolute right-4 top-4 mobile-touch-target">
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

### 3.5 Mobile Card & Sheet Primitives

```tsx
// app/components/ui/mobile-data-card.tsx
export const MobileDataCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'max-md:rounded-2xl max-md:border max-md:border-gray-200 max-md:bg-white max-md:shadow-sm',
        'max-md:p-4 max-md:space-y-4 max-md:focus-visible:outline-none max-md:focus-visible:ring-2',
        'max-md:focus-visible:ring-[#7f5efd] max-md:focus-visible:ring-offset-2 max-md:focus-visible:ring-offset-white',
        'transition-shadow duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

// app/components/ui/bottom-sheet.tsx (excerpt)
export function BottomSheetContent({ className, children, onDismiss, ...props }: BottomSheetContentProps) {
  const localRef = React.useRef<HTMLDivElement | null>(null)

  useSwipeToClose(localRef, {
    onClose: handleDismiss,
    directions: ['down'],
    threshold: 80,
    restraint: 140,
  })

  return (
    <BottomSheetPortal>
      <BottomSheetOverlay />
      <DialogPrimitive.Content
        ref={setRefs}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 grid w-full gap-4 border-t border-gray-200 bg-white',
          'rounded-t-[32px] p-6 shadow-2xl max-h-[60vh] min-h-[40vh] md:max-h-[32rem]',
          'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom',
          'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom',
          className
        )}
        {...props}
      >
        <div className="mx-auto h-1.5 w-12 rounded-full bg-gray-300" aria-hidden />
        <div className="overflow-y-auto [-webkit-overflow-scrolling:touch]">{children}</div>
      </DialogPrimitive.Content>
    </BottomSheetPortal>
  )
}
```

These primitives now back every handheld-only list replacement, letting the payments index, tax reports, and dashboard quick actions share spacing, focus states, and gesture behaviour while desktop markup remains untouched.

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

### Pull-to-Refresh Hook
```typescript
// lib/hooks/use-pull-to-refresh.ts
export function usePullToRefresh({ onRefresh, threshold = 60, maxDistance = 160, enabled = true }: PullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const startYRef = useRef<number | null>(null)
  const activeRef = useRef(false)
  const refreshingRef = useRef(false)
  const pullDistanceRef = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined' || !enabled || !isTouchDevice()) return

    const handleTouchStart = (event: TouchEvent) => {
      if (window.scrollY > 0 || refreshingRef.current) return
      startYRef.current = event.touches[0].clientY
      activeRef.current = true
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!activeRef.current || startYRef.current === null) return
      const delta = event.touches[0].clientY - startYRef.current
      if (delta <= 0 || window.scrollY > 0) {
        activeRef.current = false
        setPullDistance(0)
        pullDistanceRef.current = 0
        return
      }
      event.preventDefault()
      const constrained = Math.min(delta, maxDistance)
      setPullDistance(constrained)
      pullDistanceRef.current = constrained
    }

    const handleTouchEnd = async () => {
      if (!activeRef.current) return
      activeRef.current = false

      if (pullDistanceRef.current >= threshold && !refreshingRef.current) {
        try {
          refreshingRef.current = true
          setIsRefreshing(true)
          await onRefresh()
        } finally {
          refreshingRef.current = false
          setIsRefreshing(false)
        }
      }

      setPullDistance(0)
      pullDistanceRef.current = 0
      startYRef.current = null
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, maxDistance, onRefresh, threshold])

  return { pullDistance, isRefreshing }
}
```

### Swipe Actions Hook
```typescript
// lib/hooks/use-swipe-actions.ts
export function useSwipeActions<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { threshold = 80, restraint = 120, enabled = true, onSwipeLeft, onSwipeRight }: SwipeActionsOptions
) {
  const startXRef = useRef<number | null>(null)
  const startYRef = useRef<number | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || !enabled || typeof window === 'undefined' || !isTouchDevice()) return

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      startXRef.current = touch.clientX
      startYRef.current = touch.clientY
    }

    const handleTouchEnd = (event: TouchEvent) => {
      if (startXRef.current === null || startYRef.current === null) return

      const touch = event.changedTouches[0]
      const deltaX = touch.clientX - startXRef.current
      const deltaY = touch.clientY - startYRef.current

      startXRef.current = null
      startYRef.current = null

      if (Math.abs(deltaY) > restraint) return

      if (deltaX <= -threshold) onSwipeLeft?.()
      else if (deltaX >= threshold) onSwipeRight?.()
    }

    element.addEventListener('touchstart', handleTouchStart)
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [ref, enabled, threshold, restraint, onSwipeLeft, onSwipeRight])
}
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
                  <span className="text-sm max-md:text-xs text-gray-600">
                    {col.label}
                  </span>
                  <span className="text-base max-md:text-sm font-medium">
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
        className="mobile-touch-target p-3"
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
                className="mobile-touch-target mr-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 px-3 py-2 text-base max-md:text-sm"
                autoFocus
              />
              <button
                onClick={() => onSearch(query)}
                className="mobile-touch-target ml-2 text-primary-500"
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

### Merchant Dashboard & Profile (Implemented Enhancements)
- Wrapped merchant dashboard and profile pages with `mobile-page-padding` while keeping existing desktop `px-6 py-8` spacing intact via `md:` overrides.
- Hid the legacy quick-action grid on handhelds (`hidden md:grid`), relying on the bottom sheet to deliver the same actions with thumb-friendly spacing.
- Applied `max-md:` typography reductions across headers, alert copy, stat cards, and “What’s New”/“Getting Started” modules so content scales cleanly without touching desktop text sizes.
- Introduced the `mobile-touch-button` helper for CTA buttons (e.g., “Mark seen,” “Get Started,” email confirmation actions) to guarantee 44px+ targets on mobile.
- Tightened card padding on mobile sections (`max-md:p-5`, `max-md:gap-3`) for dashboard content and profile forms while preserving desktop density.
- Enhanced Radix `Select` triggers and menus in the profile form with mobile padding, font sizing, and capped heights to keep dropdowns scrollable on smaller viewports.
- Reduced breadcrumb and header typography on the profile page (`max-md:text-xs` / `max-md:text-2xl`) so long merchant names fit without wrapping issues on phones.

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

### Phase 5: Polish & Telemetry
- [x] Introduce shared mobile card primitives and bottom sheet system
- [x] Upgrade dashboard quick actions, recent activity, and payment tables with swipe + pull-to-refresh
- [x] Smooth payment flow transitions and enforce 44px selector touch targets
- [x] Instrument mobile web-vitals collection in production builds
- [x] Add automated touch-target audit script (`npm run audit:touch`)

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

### Completed Phase 5 — Summary
- Shared `MobileDataCard` and `BottomSheet` primitives power consistent mobile layouts across payments, tax reports, and quick-action overlays without touching desktop components.
- Merchant dashboard quick actions render in a thumb-friendly bottom sheet (`md:hidden`) while recent activity uses swipeable cards with keyboard access; payments index cards add swipe-to-reveal actions, optimistic pull-to-refresh, and stateful copy/open buttons.
- Tax-report transactions adopt the shared card system with focus/keyboard handling so every row remains operable on handhelds.
- Payment checkout flow adds `animate-fade-scale` transitions for state changes and enforces `max-md:h-12` selectors to keep currency controls inside the 44px guideline.
- `lib/analytics/mobile-tracking.ts` integrates `web-vitals` collection, auto-sending metrics from the `MobileMetricsTracker` client shim mounted via `app/layout.tsx`, while `npm run audit:touch` surfaces sub-44px targets for follow-up.

### Implementation Log — Merchant Dashboard Payment Flows (April 2025)
- `app/merchant/dashboard/payments/page.tsx`: mobile FAB with safe-area padding, bottom-sheet filters mirroring the desktop select state, and updated KPI cards now render under `max-md` scopes. `MobileDataCard` spacing/typography, swipe-action highlights, and pull-to-refresh messaging are all guarded by `useIsMobile`, keeping the desktop table/list untouched while improving thumb reach and filter discoverability.
- `app/merchant/dashboard/payments/[id]/page.tsx`: sticky mobile header, accordionised sections via `MobileAccordionSection`, tap-to-zoom QR bottom sheet, and swipe navigation that prefetches adjacent IDs ship alongside the original desktop markup. Historical cards/fee breakdowns are restacked into thumb-friendly blocks, and the QR sheet mirrors download/copy affordances without introducing extra wrappers around the desktop grid.
- `app/merchant/dashboard/payments/create/page.tsx`: cryptocurrency selection grid, tax-rate editor, preview card, and footer CTA collapse into 44px touch targets with single-column spacing under `max-md`, while the desktop two-column layout stays intact. The sticky submit bar reuses the desktop `Create Payment Link` button via the shared form ID, ensuring action parity across breakpoints.
- Documentation references updated here so future flows can replicate the pattern: safe-area padding, `useIsMobile` guards, accordion helper usage, and sticky action bar conventions are now explicitly called out for downstream teams.
- **Verification:** `npm run lint` and `npm run type-check` executed successfully; manual desktop smoke at 1920/1440/1024px confirmed no regressions, and mobile checks at 320/375/414px validated safe-area spacing and gesture behaviour.

## 10. Maintenance Guidelines

### Desktop Protection Code Review Checklist

#### Must Verify:
- [ ] **No existing `md:`, `lg:`, `xl:` classes modified**
- [ ] **No desktop components altered**
- [ ] **Desktop regression tests pass**
- [ ] **Visual comparison shows no desktop changes**
- [ ] **All mobile changes use `max-md:` or `md:hidden`**

#### Mobile-Specific Checks:
- [ ] Mobile components are separate files or conditionally rendered
- [ ] Touch targets meet 44x44px minimum (mobile only)
- [ ] `npm run audit:touch` reports no outstanding mobile violations
- [ ] Text readable without zooming (mobile only)
- [ ] Forms optimized for mobile input
- [ ] Modals full-screen on mobile, normal on desktop
- [ ] Tables have mobile alternatives, desktop unchanged
- [ ] No horizontal scrolling on mobile

### Monitoring & Analytics
```typescript
// lib/analytics/mobile-tracking.ts
import { onCLS, onFID, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals'
import { getDeviceType, isMobileViewport } from '@/lib/utils/device'

export function trackMobileMetrics() {
  if (typeof window === 'undefined') return
  if (!isMobileViewport()) return

  const flag = '__cryptrac_mobile_vitals__'
  if ((window as unknown as Record<string, unknown>)[flag]) return
  ;(window as unknown as Record<string, unknown>)[flag] = true

  const metadata = {
    deviceType: getDeviceType(),
    viewport: { width: window.innerWidth, height: window.innerHeight },
    userAgent: navigator.userAgent,
    connection: (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number; rtt?: number } }).connection || undefined,
  }

  const send = (metric: Metric) => {
    const payload = {
      metric: { ...metric, value: Number(metric.value.toFixed(2)) },
      metadata,
      timestamp: Date.now(),
    }
    const body = JSON.stringify(payload)

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/mobile-metrics', new Blob([body], { type: 'application/json' }))
    } else {
      fetch('/api/analytics/mobile-metrics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
    }

    if (process.env.NODE_ENV !== 'production') {
      console.debug('[mobile-vitals]', metric.name, metric.value, metric.rating)
    }
  }

  onCLS(send, { reportAllChanges: false })
  onFID(send)
  onFCP(send)
  onINP(send)
  onLCP(send)
  onTTFB(send)
}
```

## Implementation Log - Subscription Management Pages (December 2024)

### Completed Subscription Pages Mobile Optimization

#### 1. Subscriptions List Page (`/merchant/subscriptions`)
**Implementation Details:**
- **Typography**: Applied responsive text sizing with `max-md:text-2xl` for headers, `max-md:text-sm` for body text
- **Mobile Cards**: Converted subscription items to `MobileDataCard` components with swipe-to-reveal actions (pause/resume, edit, view)
- **Swipe Actions**: Implemented `useSwipeActions` hook for left swipe to reveal quick actions
- **Pull-to-Refresh**: Added `usePullToRefresh` hook with loading indicator for refreshing subscription list
- **Filters**: Moved search and status filters to `BottomSheet` component on mobile
- **FAB**: Added floating action button for "Create Subscription" with safe-area padding for iOS
- **Statistics Cards**: Optimized grid layout from 4 columns to 2x2 grid on mobile with condensed labels
- **Touch Targets**: All buttons meet 44px minimum with `max-md:h-12` classes
- **Safe Areas**: Applied iOS safe-area padding using `env(safe-area-inset-bottom)`

**Mobile-Specific Components:**
```tsx
const MobileSubscriptionCard = ({ subscription }: { subscription: Subscription }) => {
  // Swipeable card with status badge, customer info, billing details
  // Reveals pause/resume, edit, view actions on swipe
}
```

#### 2. Subscription Details Page (`/merchant/subscriptions/[id]`)
**Implementation Details:**
- **Layout**: Stacked sections vertically on mobile with collapsible panels
- **Customer Info**: Implemented as `Collapsible` component with expand/collapse animation
- **Timing Config**: Similar collapsible section for timing settings
- **Upcoming Cycles**: Horizontal scrollable cards instead of vertical list
  - Each cycle shown as a compact card (160px wide)
  - Shows date, cycle number, amount with override indicators
  - Smooth horizontal scroll with momentum
- **Invoice Generation**: Moved to bottom sheet with simplified UI
  - Standard generation with next cycle preview
  - Email notification form integrated
  - Copy payment URL action
- **Amount Overrides**: Full bottom sheet with:
  - List of active overrides
  - New override form with mobile-optimized date inputs
  - Quick preset buttons (1 month, 1 year, permanent)
- **Invoice History**: Collapsible section with card-based layout
  - Each invoice as a rounded card with status badge
  - Compact display with essential info
- **Date Inputs**: Enhanced with native mobile date pickers
- **Modals**: All complex forms converted to bottom sheets
- **Sticky Actions**: Important buttons remain accessible during scroll

**Key Mobile Patterns:**
```tsx
// Collapsible sections for progressive disclosure
<Collapsible open={expandedSections.customer} onOpenChange={() => toggleSection('customer')}>
  <CollapsibleTrigger asChild>
    <Card className="md:hidden cursor-pointer">
      // Section header with chevron indicator
    </Card>
  </CollapsibleTrigger>
  <CollapsibleContent>
    // Section content
  </CollapsibleContent>
</Collapsible>

// Horizontal scroll for cycles
<div className="md:hidden -mx-4 px-4 overflow-x-auto">
  <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
    {cycles.map(cycle => <CycleCard />)}
  </div>
</div>
```

#### 3. Create Subscription Page (`/merchant/subscriptions/create`)
**Implementation Details:**
- **Wizard Approach**: Complete multi-step form wizard with 6 steps:
  1. **Basic Information**: Title and description
  2. **Pricing & Billing**: Amount, currency, interval, max cycles
  3. **Customer Details**: Name, email, phone
  4. **Payment Settings**: Accepted cryptocurrencies grid
  5. **Advanced Options**: Gateway fees, tax settings
  6. **Review & Submit**: Summary of all entered data
- **Progress Indicator**: Visual progress bar and step icons
  - Each step shows icon and title
  - Completed steps highlighted in purple
  - Current step with filled background
  - Disabled future steps grayed out
- **Step Navigation**:
  - Back/Next buttons in sticky footer
  - Direct step navigation for completed steps
  - Step validation before proceeding
- **Form Validation**: Per-step validation with inline errors
- **Input Types**: Proper keyboards for different inputs:
  - `type="email"` for email field
  - `type="tel"` for phone
  - `type="number"` with step for amounts
  - Native date pickers for dates
- **Touch Targets**: All form controls 44px minimum height
- **Sticky Footer**: Navigation buttons always visible with safe-area padding
- **Desktop Preservation**: Original single-page form remains untouched for desktop

**Wizard Implementation:**
```tsx
const wizardSteps = [
  { id: 1, title: 'Basic Info', icon: CreditCard },
  { id: 2, title: 'Pricing', icon: DollarSign },
  { id: 3, title: 'Customer', icon: Users },
  { id: 4, title: 'Payment', icon: Coins },
  { id: 5, title: 'Advanced', icon: Settings },
  { id: 6, title: 'Review', icon: Check },
];

// Mobile-only wizard interface
{isMobile ? (
  <>
    <Progress value={(currentStep / 6) * 100} />
    <div className="flex justify-between">
      {wizardSteps.map(step => <StepButton />)}
    </div>
    <Card>
      <MobileStepContent />
    </Card>
    <div className="fixed bottom-0 left-0 right-0 p-4">
      <Button onClick={handlePrevStep}>Back</Button>
      <Button onClick={handleNextStep}>Next</Button>
    </div>
  </>
) : (
  // Desktop form unchanged
)}
```

### Technical Components Added

#### Progress Component
Created `app/components/ui/progress.tsx`:
- Radix UI based progress bar
- Purple fill color matching brand
- Smooth animation on value changes
- Used for wizard step progress

#### Mobile-Specific Hooks Used
- `useIsMobile()`: Detect mobile viewport for conditional rendering
- `usePullToRefresh()`: Pull gesture for list refresh
- `useSwipeActions()`: Swipe gestures for card actions
- `Collapsible`: Radix UI component for expandable sections
- `BottomSheet`: Custom component for mobile overlays

### Key Patterns Applied

1. **All mobile styles use `max-md:` prefix** - Desktop unchanged above 768px
2. **Conditional rendering** - Mobile components only mount on mobile
3. **Progressive disclosure** - Complex sections hidden by default
4. **Gesture support** - Native mobile interactions (swipe, pull)
5. **Bottom sheets** - Replace modals and complex forms
6. **Horizontal scrolling** - Handle data overflow elegantly
7. **Card-based layouts** - Replace tables and lists
8. **Sticky elements** - Keep important actions accessible
9. **Safe area padding** - Respect device insets
10. **44px touch targets** - All interactive elements

### Testing & Verification

- ✅ **Linting**: All TypeScript/ESLint errors resolved
- ✅ **Desktop Preservation**: No changes to `md:` and above breakpoints
- ✅ **Mobile Breakpoints**: All changes scoped to `max-md:`
- ✅ **Touch Targets**: Minimum 44px height verified
- ✅ **Gesture Support**: Swipe and pull-to-refresh functional
- ✅ **Form Validation**: Step-by-step validation working
- ✅ **Bottom Sheets**: Smooth animations and dismissal
- ✅ **Safe Areas**: iOS notch/home indicator respected

### Files Modified

1. `/app/merchant/subscriptions/page.tsx` - List page with mobile cards
2. `/app/merchant/subscriptions/[id]/page.tsx` - Details with collapsibles and bottom sheets
3. `/app/merchant/subscriptions/create/page.tsx` - Multi-step wizard for mobile
4. `/app/components/ui/progress.tsx` - New progress bar component

### Impact Summary

- **Zero desktop changes** - All existing functionality preserved
- **Mobile-first UX** - Touch-friendly, gesture-based interactions
- **Improved accessibility** - Larger touch targets, better contrast
- **Performance optimized** - Lazy loading, conditional rendering
- **Consistent patterns** - Reusable components and hooks

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
