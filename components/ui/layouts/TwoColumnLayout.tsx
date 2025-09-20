'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TwoColumnLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  leftWidth?: '1/4' | '1/3' | '2/5' | '1/2' | '3/5' | '2/3' | '3/4';
  responsive?: boolean;
  reverseOnMobile?: boolean;
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
}

export function TwoColumnLayout({
  left,
  right,
  className,
  gap = 'md',
  leftWidth = '1/2',
  responsive = true,
  reverseOnMobile = false,
  alignItems = 'start'
}: TwoColumnLayoutProps) {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-4',     // 16px
    md: 'gap-6',     // 24px
    lg: 'gap-8',     // 32px
    xl: 'gap-12'     // 48px
  };

  const leftWidthClasses = {
    '1/4': 'lg:w-1/4',
    '1/3': 'lg:w-1/3',
    '2/5': 'lg:w-2/5',
    '1/2': 'lg:w-1/2',
    '3/5': 'lg:w-3/5',
    '2/3': 'lg:w-2/3',
    '3/4': 'lg:w-3/4'
  };

  const rightWidthClasses = {
    '1/4': 'lg:w-3/4',
    '1/3': 'lg:w-2/3',
    '2/5': 'lg:w-3/5',
    '1/2': 'lg:w-1/2',
    '3/5': 'lg:w-2/5',
    '2/3': 'lg:w-1/3',
    '3/4': 'lg:w-1/4'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  return (
    <div
      className={cn(
        'flex w-full',
        responsive ? 'flex-col lg:flex-row' : 'flex-row',
        reverseOnMobile && responsive ? 'flex-col-reverse lg:flex-row' : '',
        gapClasses[gap],
        alignClasses[alignItems],
        className
      )}
    >
      <div
        className={cn(
          'w-full',
          responsive && leftWidthClasses[leftWidth]
        )}
      >
        {left}
      </div>
      <div
        className={cn(
          'w-full',
          responsive && rightWidthClasses[leftWidth]
        )}
      >
        {right}
      </div>
    </div>
  );
}

interface SplitLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  sidebarPosition?: 'left' | 'right';
  sidebarWidth?: 'narrow' | 'default' | 'wide';
  className?: string;
  gap?: 'none' | 'sm' | 'md' | 'lg';
}

export function SplitLayout({
  children,
  sidebar,
  sidebarPosition = 'left',
  sidebarWidth = 'default',
  className,
  gap = 'md'
}: SplitLayoutProps) {
  const widthClasses = {
    narrow: 'w-60',      // 240px
    default: 'w-80',     // 320px
    wide: 'w-96'         // 384px
  };

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-4',         // 16px
    md: 'gap-6',         // 24px
    lg: 'gap-8'          // 32px
  };

  return (
    <div
      className={cn(
        'flex w-full',
        gapClasses[gap],
        sidebarPosition === 'right' ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      <aside className={cn('shrink-0', widthClasses[sidebarWidth])}>
        {sidebar}
      </aside>
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}