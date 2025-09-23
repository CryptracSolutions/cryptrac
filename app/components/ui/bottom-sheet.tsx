"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { cn } from "@/lib/utils"
import { useSwipeToClose } from "@/lib/hooks/use-swipe-to-close"

const BottomSheet = DialogPrimitive.Root

const BottomSheetTrigger = DialogPrimitive.Trigger

const BottomSheetClose = DialogPrimitive.Close

const BottomSheetPortal = DialogPrimitive.Portal

const BottomSheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=open]:fade-in-0",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
      className
    )}
    {...props}
  />
))
BottomSheetOverlay.displayName = DialogPrimitive.Overlay.displayName

interface BottomSheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  onDismiss?: () => void
}

const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  BottomSheetContentProps
>(({ className, children, onDismiss, style, ...props }, ref) => {
  const localRef = React.useRef<HTMLDivElement | null>(null)
  const closeRef = React.useRef<HTMLButtonElement | null>(null)
  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const dragHandleRef = React.useRef<HTMLDivElement | null>(null)

  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      localRef.current = node
      if (typeof ref === "function") {
        ref(node)
      } else if (ref) {
        ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      }
    },
    [ref]
  )

  const handleDismiss = React.useCallback(() => {
    onDismiss?.()
    closeRef.current?.click()
  }, [onDismiss])

  useSwipeToClose(scrollRef, {
    onClose: handleDismiss,
    directions: ["down"],
    threshold: 80,
    restraint: 140,
    getScrollElement: () => scrollRef.current,
  })

  useSwipeToClose(dragHandleRef, {
    onClose: handleDismiss,
    directions: ["down"],
    threshold: 60,
    restraint: 120,
    requireScrollStart: false,
  })

  return (
    <BottomSheetPortal>
      <BottomSheetOverlay />
      <DialogPrimitive.Content
        ref={setRefs}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex flex-col w-full border-t border-gray-200 bg-white",
          "rounded-t-[32px] shadow-2xl",
          "max-h-[90vh]",
          "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom",
          "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom",
          className
        )}
        style={{
          ...style,
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)",
        }}
        {...props}
      >
        <div ref={dragHandleRef} className="px-6 pt-4">
          <div
            className="mx-auto mb-4 h-1.5 w-12 select-none rounded-full bg-gray-300"
            aria-hidden="true"
          />
        </div>
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 [-webkit-overflow-scrolling:touch] touch-pan-y"
        >
          {children}
        </div>
        <BottomSheetClose ref={closeRef} className="sr-only">
          Close
        </BottomSheetClose>
      </DialogPrimitive.Content>
    </BottomSheetPortal>
  )
})
BottomSheetContent.displayName = "BottomSheetContent"

const BottomSheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-1 text-center", className)} {...props} />
)

const BottomSheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-gray-900", className)}
    {...props}
  />
))
BottomSheetTitle.displayName = DialogPrimitive.Title.displayName

const BottomSheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-gray-600", className)}
    {...props}
  />
))
BottomSheetDescription.displayName = DialogPrimitive.Description.displayName

const BottomSheetFooter = ({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-4 flex flex-col gap-2 sticky bottom-0 bg-white", className)}
    style={{
      ...style,
      paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
    }}
    {...props}
  />
)

export {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
  BottomSheetFooter,
}
