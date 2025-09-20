'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'wide' | 'narrow' | 'fluid';
  padding?: 'none' | 'compact' | 'default' | 'spacious';
}

export function PageLayout({
  children,
  className,
  variant = 'default',
  padding = 'default'
}: PageLayoutProps) {
  const containerClasses = {
    default: 'max-w-[1200px]',
    wide: 'max-w-[1440px]',
    narrow: 'max-w-[960px]',
    fluid: 'max-w-full'
  };

  const paddingClasses = {
    none: 'p-0',
    compact: 'px-4 py-6 md:px-6 md:py-8',
    default: 'px-4 py-8 md:px-8 md:py-12 lg:px-12 lg:py-16',
    spacious: 'px-6 py-12 md:px-12 md:py-16 lg:px-16 lg:py-20 xl:py-24'
  };

  return (
    <div className={cn(
      'relative mx-auto w-full',
      containerClasses[variant],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}