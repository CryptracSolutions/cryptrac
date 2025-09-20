'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GridContainerProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
}

export function GridContainer({
  children,
  className,
  columns = 12,
  gap = 'md',
  responsive = true
}: GridContainerProps) {
  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-2',    // 8px
    sm: 'gap-4',    // 16px
    md: 'gap-6',    // 24px
    lg: 'gap-8',    // 32px
    xl: 'gap-12'    // 48px
  };

  const columnClasses = {
    1: 'grid-cols-1',
    2: responsive ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2',
    3: responsive ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-3',
    4: responsive ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-4',
    6: responsive ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-6',
    12: responsive ? 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12' : 'grid-cols-12'
  };

  return (
    <div className={cn(
      'grid w-full',
      columnClasses[columns],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}

interface GridItemProps {
  children: React.ReactNode;
  className?: string;
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto' | 'full';
  start?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  order?: number;
}

export function GridItem({
  children,
  className,
  span = 'auto',
  start,
  order
}: GridItemProps) {
  const spanClasses = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
    5: 'col-span-5',
    6: 'col-span-6',
    7: 'col-span-7',
    8: 'col-span-8',
    9: 'col-span-9',
    10: 'col-span-10',
    11: 'col-span-11',
    12: 'col-span-12',
    auto: 'col-auto',
    full: 'col-span-full'
  };

  const startClasses = start ? {
    1: 'col-start-1',
    2: 'col-start-2',
    3: 'col-start-3',
    4: 'col-start-4',
    5: 'col-start-5',
    6: 'col-start-6',
    7: 'col-start-7',
    8: 'col-start-8',
    9: 'col-start-9',
    10: 'col-start-10',
    11: 'col-start-11',
    12: 'col-start-12'
  }[start] : '';

  return (
    <div
      className={cn(
        spanClasses[span],
        startClasses,
        className
      )}
      style={{ order }}
    >
      {children}
    </div>
  );
}