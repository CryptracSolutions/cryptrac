'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X, ChevronLeft } from 'lucide-react';

interface DrawerLayoutProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  width?: 'compact' | 'default' | 'wide' | 'extra-wide';
  side?: 'left' | 'right';
  showCloseButton?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  footer?: React.ReactNode;
}

export function DrawerLayout({
  children,
  isOpen,
  onClose,
  title,
  description,
  width = 'default',
  side = 'right',
  showCloseButton = true,
  showBackButton = false,
  onBack,
  footer
}: DrawerLayoutProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  const widthClasses = {
    compact: 'w-[320px]',
    default: 'w-[344px]',
    wide: 'w-[480px]',
    'extra-wide': 'w-[600px]'
  };

  const sideClasses = {
    left: 'left-0',
    right: 'right-0'
  };

  const translateClasses = {
    left: isOpen ? 'translate-x-0' : '-translate-x-full',
    right: isOpen ? 'translate-x-0' : 'translate-x-full'
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed top-0 bottom-0 z-50 bg-white shadow-xl transition-transform duration-300 ease-out',
          'border-l border-[var(--color-border-default)]',
          widthClasses[width],
          sideClasses[side],
          translateClasses[side],
          side === 'left' ? 'rounded-r-lg' : 'rounded-l-lg'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'drawer-title' : undefined}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          {(title || showCloseButton || showBackButton) && (
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-default)]">
              <div className="flex items-center gap-3">
                {showBackButton && onBack && (
                  <button
                    onClick={onBack}
                    className="p-1 hover:bg-[var(--color-bg-hover)] rounded-md transition-colors"
                    aria-label="Go back"
                  >
                    <ChevronLeft className="w-5 h-5 text-[var(--color-text-secondary)]" />
                  </button>
                )}
                {title && (
                  <div>
                    <h2
                      id="drawer-title"
                      className="text-xl font-bold text-[var(--color-text-primary)]"
                    >
                      {title}
                    </h2>
                    {description && (
                      <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                        {description}
                      </p>
                    )}
                  </div>
                )}
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-[var(--color-bg-hover)] rounded-md transition-colors"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-[var(--color-border-default)] p-5">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}