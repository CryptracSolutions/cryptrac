import React from 'react';
import { cn } from '@/lib/utils';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconColor = 'default' | 'primary' | 'brand' | 'white' | 'disabled' | 'success' | 'error' | 'warning' | 'info' | 'inherit';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: IconSize;
  color?: IconColor;
  strokeWidth?: number;
  animate?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const sizeMap: Record<IconSize, string> = {
  xs: 'w-3 h-3', // 12px
  sm: 'w-4 h-4', // 16px
  md: 'w-5 h-5', // 20px
  lg: 'w-6 h-6', // 24px
  xl: 'w-8 h-8', // 32px
};

const colorMap: Record<IconColor, string> = {
  default: 'text-gray-600',
  primary: 'text-gray-900',
  brand: 'text-[#7f5efd]',
  white: 'text-white',
  disabled: 'text-gray-400',
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600',
  inherit: 'text-current',
};

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({
    size = 'md',
    color = 'default',
    strokeWidth = 2,
    animate = false,
    className,
    children,
    ...props
  }, ref) => {
    return (
      <svg
        ref={ref}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        className={cn(
          sizeMap[size],
          colorMap[color],
          'inline-block shrink-0',
          animate && 'transition-all duration-200 ease-in-out',
          animate && 'hover:scale-110 active:scale-95',
          className
        )}
        {...props}
      >
        {children}
      </svg>
    );
  }
);

Icon.displayName = 'Icon';

// Helper component for icons with fills instead of strokes
export const IconFilled = React.forwardRef<SVGSVGElement, IconProps>(
  ({ children, ...props }, ref) => {
    return (
      <Icon
        ref={ref}
        {...props}
        stroke="none"
        fill="currentColor"
      >
        {children}
      </Icon>
    );
  }
);

IconFilled.displayName = 'IconFilled';

// Loading spinner icon component
export const LoadingIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => {
    return (
      <Icon
        ref={ref}
        {...props}
        className={cn(props.className, 'animate-spin')}
      >
        <path d="M8 1.5A6.5 6.5 0 1 1 1.5 8" />
      </Icon>
    );
  }
);

LoadingIcon.displayName = 'LoadingIcon';