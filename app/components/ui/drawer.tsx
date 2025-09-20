"use client"

import * as React from "react"
import { X, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFocusTrap } from "@/app/hooks/use-focus-trap"
import { useScrollLock } from "@/app/hooks/use-scroll-lock"
import { registerOverlay, unregisterOverlay, setOverlayAccessibility } from "@/app/lib/overlay-manager"

interface DrawerContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
  position: 'left' | 'right' | 'bottom'
  size: 'mobile' | 'standard' | 'wide' | 'full'
}

const DrawerContext = React.createContext<DrawerContextValue | undefined>(undefined)

const useDrawer = () => {
  const context = React.useContext(DrawerContext)
  if (!context) {
    throw new Error('useDrawer must be used within a DrawerProvider')
  }
  return context
}

interface DrawerProps {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  position?: 'left' | 'right' | 'bottom'
  size?: 'mobile' | 'standard' | 'wide' | 'full'
}

const Drawer: React.FC<DrawerProps> = ({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  position = 'right',
  size = 'standard',
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = controlledOpen ?? uncontrolledOpen

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    onOpenChange?.(newOpen)
    if (controlledOpen === undefined) {
      setUncontrolledOpen(newOpen)
    }
  }, [controlledOpen, onOpenChange])

  const contextValue = React.useMemo(
    () => ({
      open,
      onOpenChange: handleOpenChange,
      position,
      size,
    }),
    [open, handleOpenChange, position, size]
  )

  return (
    <DrawerContext.Provider value={contextValue}>
      {children}
    </DrawerContext.Provider>
  )
}

type DrawerTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>

const DrawerTrigger = React.forwardRef<HTMLButtonElement, DrawerTriggerProps>(
  ({ onClick, ...props }, ref) => {
    const { onOpenChange } = useDrawer()

    return (
      <button
        ref={ref}
        onClick={(e) => {
          onClick?.(e)
          onOpenChange(true)
        }}
        {...props}
      />
    )
  }
)
DrawerTrigger.displayName = "DrawerTrigger"

interface DrawerContentProps extends React.HTMLAttributes<HTMLDivElement> {
  showHandle?: boolean // For mobile bottom sheets
  showAppHeader?: boolean // Show app header like Figma example
  appName?: string
  appIcon?: React.ReactNode
}

const DrawerContent = React.forwardRef<HTMLDivElement, DrawerContentProps>(
  ({ className, children, showHandle = false, showAppHeader = false, appName = "App", appIcon, ...props }, ref) => {
    const { open, onOpenChange, position, size } = useDrawer()
    const contentRef = React.useRef<HTMLDivElement>(null)
    const drawerId = React.useId()
    const { containerRef } = useFocusTrap({ enabled: open, restoreFocus: true })

    // Use scroll lock when drawer is open
    useScrollLock({ enabled: open })

    // Register overlay with manager
    React.useEffect(() => {
      if (open) {
        registerOverlay({
          type: 'drawer',
          id: drawerId,
          lockScroll: true,
          trapFocus: true,
          closeOnEscape: true,
          closeOnClickOutside: false,
        })

        // Set accessibility attributes
        if (contentRef.current) {
          setOverlayAccessibility(contentRef.current, {
            role: 'dialog',
            modal: true,
          })
        }
      }

      return () => {
        if (open) {
          unregisterOverlay(drawerId)
        }
      }
    }, [open, drawerId])

    // Size classes matching Stripe's drawer widths
    const sizeClasses = {
      mobile: position === 'bottom' ? 'h-auto max-h-[90vh]' : 'w-[320px]',
      standard: position === 'bottom' ? 'h-auto max-h-[80vh]' : 'w-[344px]',
      wide: position === 'bottom' ? 'h-auto max-h-[70vh]' : 'w-[480px]',
      full: position === 'bottom' ? 'h-auto max-h-[95vh]' : 'w-[800px]',
    }

    // Position classes
    const positionClasses = {
      left: 'inset-y-0 left-0 rounded-r-lg',
      right: 'inset-y-0 right-0 rounded-l-lg',
      bottom: 'inset-x-0 bottom-0 rounded-t-lg',
    }

    // Animation classes
    const animationClasses = {
      left: open ? 'drawer-slide-in-left' : 'drawer-slide-out-left',
      right: open ? 'drawer-slide-in-right' : 'drawer-slide-out-right',
      bottom: open ? 'sheet-slide-in-bottom' : 'sheet-slide-out-bottom',
    }

    if (!open) return null

    return (
      <>
        {/* Backdrop */}
        <div
          className={cn(
            "fixed inset-0 z-[49]",
            "bg-black/50 backdrop-blur-[4px]",
            open ? "backdrop-fade-in" : "backdrop-fade-out"
          )}
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />

        {/* Drawer */}
        <div
          ref={(node) => {
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
            if (node) {
              contentRef.current = node
              containerRef.current = node
            }
          }}
          className={cn(
            "fixed z-[50]",
            "bg-white shadow-xl",
            "flex flex-col",
            "focus:outline-none",
            positionClasses[position],
            sizeClasses[size],
            animationClasses[position],
            className
          )}
          {...props}
        >
          {/* Mobile handle bar */}
          {showHandle && position === 'bottom' && (
            <div className="sheet-handle" />
          )}

          {/* App header (matching Figma example) */}
          {showAppHeader && (
            <div className="bg-[#063667] flex items-center justify-between px-4 py-2 border-b border-gray-300">
              <div className="flex items-center gap-2">
                {appIcon && <div className="w-6 h-6">{appIcon}</div>}
                <span className="text-sm font-semibold text-white">{appName}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  aria-label="More options"
                >
                  <MoreHorizontal className="w-4 h-4 text-white" />
                </button>
                <button
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  onClick={() => onOpenChange(false)}
                  aria-label="Close drawer"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          )}

          {children}
        </div>
      </>
    )
  }
)
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col gap-2",
      "px-4 py-4",
      "border-b border-gray-200",
      className
    )}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2
    className={cn(
      "text-xl font-bold text-gray-900",
      "tracking-[0.3px]",
      className
    )}
    {...props}
  />
)
DrawerTitle.displayName = "DrawerTitle"

const DrawerDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn(
      "text-sm text-gray-600",
      className
    )}
    {...props}
  />
)
DrawerDescription.displayName = "DrawerDescription"

const DrawerBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex-1 overflow-y-auto",
      "px-4 py-4",
      className
    )}
    {...props}
  />
)
DrawerBody.displayName = "DrawerBody"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex items-center justify-end gap-2",
      "px-4 py-4",
      "border-t border-gray-200",
      className
    )}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  const { onOpenChange } = useDrawer()

  return (
    <button
      ref={ref}
      onClick={(e) => {
        onClick?.(e)
        onOpenChange(false)
      }}
      {...props}
    />
  )
})
DrawerClose.displayName = "DrawerClose"

export {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
}