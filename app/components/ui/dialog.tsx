"use client"

/**
 * Dialog Component
 * Re-exports the Modal component with Dialog naming for backward compatibility
 * Matches Stripe's modal patterns exactly
 */

export {
  Modal as Dialog,
  ModalPortal as DialogPortal,
  ModalOverlay as DialogOverlay,
  ModalClose as DialogClose,
  ModalTrigger as DialogTrigger,
  ModalContent as DialogContent,
  ModalHeader as DialogHeader,
  ModalFooter as DialogFooter,
  ModalTitle as DialogTitle,
  ModalDescription as DialogDescription,
} from './modal'
