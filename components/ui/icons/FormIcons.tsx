import React from 'react';
import { Icon, IconProps, IconFilled } from './Icon';

// Check/Checkmark icon
export const CheckIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M3 8l3 3L13 4" />
    </Icon>
  )
);
CheckIcon.displayName = 'CheckIcon';

// Radio dot (filled circle for selected radio)
export const RadioDotIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <IconFilled ref={ref} {...props}>
      <circle cx="8" cy="8" r="3" />
    </IconFilled>
  )
);
RadioDotIcon.displayName = 'RadioDotIcon';

// Arrow Up Down (for select/dropdown)
export const ArrowUpDownIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M8 3L5 6h6L8 3zM8 13l3-3H5l3 3z" fill="currentColor" stroke="none" />
    </Icon>
  )
);
ArrowUpDownIcon.displayName = 'ArrowUpDownIcon';

// Minus icon (for indeterminate checkbox)
export const MinusIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M4 8h8" />
    </Icon>
  )
);
MinusIcon.displayName = 'MinusIcon';

// Plus icon
export const PlusIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M8 4v8M4 8h8" />
    </Icon>
  )
);
PlusIcon.displayName = 'PlusIcon';

// Calendar icon
export const CalendarIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <rect x="2" y="3" width="12" height="11" rx="1" />
      <path d="M5 1v4M11 1v4M2 7h12" />
    </Icon>
  )
);
CalendarIcon.displayName = 'CalendarIcon';

// Clock/Time icon
export const ClockIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4v4l3 2" />
    </Icon>
  )
);
ClockIcon.displayName = 'ClockIcon';

// Eye (show password)
export const EyeIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M1 8s2-5 7-5 7 5 7 5-2 5-7 5-7-5-7-5z" />
      <circle cx="8" cy="8" r="2" />
    </Icon>
  )
);
EyeIcon.displayName = 'EyeIcon';

// Eye Off (hide password)
export const EyeOffIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M1 8s2-5 7-5 7 5 7 5-2 5-7 5-7-5-7-5z" />
      <path d="M6 6l4 4M2 2l12 12" />
    </Icon>
  )
);
EyeOffIcon.displayName = 'EyeOffIcon';

// Upload icon
export const UploadIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M8 10V3M8 3L5 6M8 3l3 3" />
      <path d="M2 13h12" />
    </Icon>
  )
);
UploadIcon.displayName = 'UploadIcon';

// Filter icon
export const FilterIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M2 2h12v2.5L9 10v4l-2 1v-5L2 4.5V2z" />
    </Icon>
  )
);
FilterIcon.displayName = 'FilterIcon';

// Sort icon
export const SortIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M3 6h10M5 2h6M7 10h2" />
    </Icon>
  )
);
SortIcon.displayName = 'SortIcon';