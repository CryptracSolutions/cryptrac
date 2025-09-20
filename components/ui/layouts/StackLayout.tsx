'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface StackLayoutProps {
  children: React.ReactNode;
  className?: string;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  direction?: 'vertical' | 'horizontal';
  wrap?: boolean;
}

export function StackLayout({
  children,
  className,
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  direction = 'vertical',
  wrap = false
}: StackLayoutProps) {
  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-1',     // 4px
    sm: 'gap-4',     // 16px
    md: 'gap-6',     // 24px
    lg: 'gap-8',     // 32px
    xl: 'gap-12'     // 48px
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const directionClasses = {
    vertical: 'flex-col',
    horizontal: 'flex-row'
  };

  return (
    <div
      className={cn(
        'flex w-full',
        directionClasses[direction],
        gapClasses[gap],
        alignClasses[align],
        justifyClasses[justify],
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </div>
  );
}

interface ListLayoutProps {
  children: React.ReactNode;
  className?: string;
  divided?: boolean;
  spacing?: 'none' | 'compact' | 'default' | 'spacious';
}

export function ListLayout({
  children,
  className,
  divided = false,
  spacing = 'default'
}: ListLayoutProps) {
  const spacingClasses = {
    none: '',
    compact: '[&>*]:py-2',    // 8px
    default: '[&>*]:py-3',    // 12px
    spacious: '[&>*]:py-4'    // 16px
  };

  return (
    <div
      className={cn(
        'w-full',
        divided && 'divide-y divide-[var(--color-border-default)]',
        spacingClasses[spacing],
        className
      )}
    >
      {children}
    </div>
  );
}

interface ListItemProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'compact' | 'default' | 'spacious';
  hoverable?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export function ListItem({
  children,
  className,
  padding = 'default',
  hoverable = false,
  selected = false,
  onClick
}: ListItemProps) {
  const paddingClasses = {
    none: '',
    compact: 'p-2',      // 8px
    default: 'p-3',      // 12px
    spacious: 'p-4'      // 16px
  };

  return (
    <div
      className={cn(
        'w-full',
        paddingClasses[padding],
        hoverable && 'hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors',
        selected && 'bg-[var(--color-bg-active)]',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}