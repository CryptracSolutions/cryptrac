"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useScrollLock } from "@/app/hooks/use-scroll-lock"
import { registerOverlay, unregisterOverlay, setOverlayAccessibility } from "@/app/lib/overlay-manager"


interface ModalContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: 'small' | 'medium' | 'large' | 'full'
  showCloseButton?: boolean
  onInteractOutside?: (event: Event) => void
  onEscapeKeyDown?: (event: KeyboardEvent) => void
}

const Modal = DialogPrimitive.Root

const ModalTrigger = DialogPrimitive.Trigger

const ModalPortal = DialogPrimitive.Portal

const ModalClose = DialogPrimitive.Close

const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[50]",
      "bg-black/50 backdrop-blur-[4px]",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "data-[state=closed]:duration-200 data-[state=open]:duration-200",
      className
    )}
    {...props}
  />
))
ModalOverlay.displayName = DialogPrimitive.Overlay.displayName

const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ModalContentProps
>(({ className, children, size = 'medium', showCloseButton = true, onInteractOutside, onEscapeKeyDown, ...props }, ref) => {
  const contentRef = React.useRef<HTMLDivElement>(null)
  const modalId = React.useId()

  // Use scroll lock when modal is open
  useScrollLock({ enabled: true })

  // Register overlay with manager
  React.useEffect(() => {
    registerOverlay({
      type: 'modal',
      id: modalId,
      lockScroll: true,
      trapFocus: true,
      closeOnEscape: true,
      closeOnClickOutside: true,
    })

    // Set accessibility attributes
    if (contentRef.current) {
      setOverlayAccessibility(contentRef.current, {
        role: 'dialog',
        modal: true,
      })
    }

    return () => {
      unregisterOverlay(modalId)
    }
  }, [modalId])

  // Size classes mapping Stripe's modal sizes
  const sizeClasses = {
    small: "max-w-[400px]",
    medium: "max-w-[560px]",
    large: "max-w-[720px]",
    full: "max-w-[calc(100vw-64px)]"
  }

  return (
    <ModalPortal>
      <ModalOverlay />
      <DialogPrimitive.Content
        ref={(node) => {
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
          if (node) {
            contentRef.current = node
          }
        }}
        onInteractOutside={onInteractOutside}
        onEscapeKeyDown={onEscapeKeyDown}
        className={cn(
          "fixed left-[50%] top-[50%] z-[50]",
          "w-full translate-x-[-50%] translate-y-[-50%]",
          "bg-white rounded-lg shadow-xl",
          "border border-gray-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-[0.97] data-[state=open]:zoom-in-[0.97]",
          "data-[state=closed]:slide-out-to-top-[2px] data-[state=open]:slide-in-from-top-[2px]",
          "duration-200",
          "focus:outline-none",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close className={cn(
            "absolute right-4 top-4",
            "rounded-md p-1.5",
            "text-gray-500 hover:text-gray-700",
            "hover:bg-gray-100",
            "focus:outline-none focus:ring-2 focus:ring-brand/20",
            "transition-colors duration-150",
            "disabled:pointer-events-none"
          )}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </ModalPortal>
  )
})
ModalContent.displayName = DialogPrimitive.Content.displayName

const ModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5",
      "px-6 pt-6",
      className
    )}
    {...props}
  />
)
ModalHeader.displayName = "ModalHeader"

const ModalBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "px-6 py-4",
      "max-h-[calc(100vh-200px)] overflow-y-auto",
      className
    )}
    {...props}
  />
)
ModalBody.displayName = "ModalBody"

const ModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex items-center justify-end gap-2",
      "px-6 pb-6 pt-4",
      "border-t border-gray-200",
      className
    )}
    {...props}
  />
)
ModalFooter.displayName = "ModalFooter"

const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-xl font-bold text-gray-900",
      "tracking-[0.3px]",
      className
    )}
    {...props}
  />
))
ModalTitle.displayName = DialogPrimitive.Title.displayName

const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      "text-sm text-gray-600",
      "mt-1",
      className
    )}
    {...props}
  />
))
ModalDescription.displayName = DialogPrimitive.Description.displayName

export {
  Modal,
  ModalPortal,
  ModalOverlay,
  ModalClose,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalDescription,
}