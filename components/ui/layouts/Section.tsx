'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'article' | 'main';
  spacing?: 'none' | 'compact' | 'default' | 'spacious' | 'hero';
  background?: 'default' | 'surface' | 'canvas' | 'subtle' | 'brand';
}

export function Section({
  children,
  className,
  as: Component = 'section',
  spacing = 'default',
  background = 'default'
}: SectionProps) {
  const spacingClasses = {
    none: 'py-0',
    compact: 'py-8 md:py-12',      // 32px / 48px
    default: 'py-12 md:py-16 lg:py-20',  // 48px / 64px / 80px
    spacious: 'py-16 md:py-20 lg:py-24', // 64px / 80px / 96px
    hero: 'py-20 md:py-24 lg:py-32'      // 80px / 96px / 128px
  };

  const backgroundClasses = {
    default: '',
    surface: 'bg-white',
    canvas: 'bg-[var(--color-bg-canvas)]',
    subtle: 'bg-[var(--color-bg-hover)]',
    brand: 'bg-[var(--color-brand)] text-white'
  };

  return (
    <Component
      className={cn(
        'relative w-full',
        spacingClasses[spacing],
        backgroundClasses[background],
        className
      )}
    >
      {children}
    </Component>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function SectionHeader({
  title,
  description,
  className,
  align = 'left'
}: SectionHeaderProps) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <div className={cn(
      'mb-8 md:mb-12',
      alignClasses[align],
      className
    )}>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
        {title}
      </h2>
      {description && (
        <p className="text-base md:text-lg text-[var(--color-text-secondary)] max-w-3xl mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}