import React from 'react';
import { Icon, IconProps, IconFilled } from './Icon';

// Success/Check Circle icon
export const SuccessIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props} color="success">
      <circle cx="8" cy="8" r="6" />
      <path d="M5 8l2 2 4-4" />
    </Icon>
  )
);
SuccessIcon.displayName = 'SuccessIcon';

// Success Filled variant
export const SuccessFilledIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <IconFilled ref={ref} {...props} color="success">
      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.5 5.5l-4 4a.75.75 0 01-1.06 0l-2-2a.75.75 0 111.06-1.06L7 8.94l3.47-3.47a.75.75 0 111.06 1.06z" />
    </IconFilled>
  )
);
SuccessFilledIcon.displayName = 'SuccessFilledIcon';

// Error/X Circle icon
export const ErrorIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props} color="error">
      <circle cx="8" cy="8" r="6" />
      <path d="M10 6L6 10M6 6l4 4" />
    </Icon>
  )
);
ErrorIcon.displayName = 'ErrorIcon';

// Error Filled variant
export const ErrorFilledIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <IconFilled ref={ref} {...props} color="error">
      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm2.5 9.5a.75.75 0 01-1.06 0L8 9.06 6.56 10.5a.75.75 0 01-1.06-1.06L6.94 8 5.5 6.56a.75.75 0 011.06-1.06L8 6.94 9.44 5.5a.75.75 0 011.06 1.06L9.06 8l1.44 1.44a.75.75 0 010 1.06z" />
    </IconFilled>
  )
);
ErrorFilledIcon.displayName = 'ErrorFilledIcon';

// Warning/Alert Triangle icon
export const WarningIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props} color="warning">
      <path d="M7.2 2.5L1.5 12.5a1 1 0 00.87 1.5h11.26a1 1 0 00.87-1.5L8.8 2.5a1 1 0 00-1.74 0z" />
      <path d="M8 6v3M8 11.5v.5" />
    </Icon>
  )
);
WarningIcon.displayName = 'WarningIcon';

// Warning Filled variant
export const WarningFilledIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <IconFilled ref={ref} {...props} color="warning">
      <path d="M7.2 2L1.5 12a1 1 0 00.87 1.5h11.26a1 1 0 00.87-1.5L8.8 2a1 1 0 00-1.74 0zM8 5.5a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 018 5.5zm0 6.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
    </IconFilled>
  )
);
WarningFilledIcon.displayName = 'WarningFilledIcon';

// Info/Information Circle icon
export const InfoIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props} color="info">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 7v4M8 5v.5" />
    </Icon>
  )
);
InfoIcon.displayName = 'InfoIcon';

// Info Filled variant
export const InfoFilledIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <IconFilled ref={ref} {...props} color="info">
      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 4.5a.75.75 0 100-1.5.75.75 0 000 1.5zM8.75 7a.75.75 0 00-1.5 0v4a.75.75 0 001.5 0V7z" />
    </IconFilled>
  )
);
InfoFilledIcon.displayName = 'InfoFilledIcon';

// Alert/Bell icon
export const AlertIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M8 2a3 3 0 00-3 3v2.5L3 11h10l-2-3.5V5a3 3 0 00-3-3z" />
      <path d="M6.5 13a1.5 1.5 0 003 0" />
    </Icon>
  )
);
AlertIcon.displayName = 'AlertIcon';

// Badge/Dot (for notifications)
export const BadgeDotIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <IconFilled ref={ref} {...props}>
      <circle cx="12" cy="4" r="3" />
    </IconFilled>
  )
);
BadgeDotIcon.displayName = 'BadgeDotIcon';

// Star icon
export const StarIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M8 2l1.8 3.7 4.2.6-3 3 .7 4.2L8 11.5l-3.7 2 .7-4.2-3-3 4.2-.6L8 2z" />
    </Icon>
  )
);
StarIcon.displayName = 'StarIcon';

// Star Filled
export const StarFilledIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <IconFilled ref={ref} {...props}>
      <path d="M8 2l1.8 3.7 4.2.6-3 3 .7 4.2L8 11.5l-3.7 2 .7-4.2-3-3 4.2-.6L8 2z" />
    </IconFilled>
  )
);
StarFilledIcon.displayName = 'StarFilledIcon';