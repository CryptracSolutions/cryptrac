'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ContentAreaProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'compact' | 'default' | 'spacious';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function ContentArea({
  children,
  className,
  padding = 'default',
  maxWidth = 'lg'
}: ContentAreaProps) {
  const paddingClasses = {
    none: 'p-0',
    compact: 'p-4',      // 16px
    default: 'p-5',      // 20px
    spacious: 'p-8'      // 32px
  };

  const maxWidthClasses = {
    sm: 'max-w-2xl',    // 672px
    md: 'max-w-4xl',    // 896px
    lg: 'max-w-5xl',    // 1024px
    xl: 'max-w-7xl',    // 1280px
    full: 'max-w-full'
  };

  return (
    <div
      className={cn(
        'w-full mx-auto',
        paddingClasses[padding],
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
}

interface ContentSectionProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  spacing?: 'compact' | 'default' | 'spacious';
}

export function ContentSection({
  children,
  className,
  title,
  description,
  spacing = 'default'
}: ContentSectionProps) {
  const spacingClasses = {
    compact: 'mb-4',     // 16px
    default: 'mb-8',     // 32px
    spacious: 'mb-12'    // 48px
  };

  return (
    <div className={cn(spacingClasses[spacing], className)}>
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-base font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-2">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}