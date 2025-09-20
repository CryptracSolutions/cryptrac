import React from 'react';
import { Icon, IconProps } from './Icon';

// More icon (horizontal ellipsis)
export const MoreIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <circle cx="2" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="14" cy="8" r="1" fill="currentColor" stroke="none" />
    </Icon>
  )
);
MoreIcon.displayName = 'MoreIcon';

// Cancel/Close icon (X)
export const CancelIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M12 4L4 12M4 4l8 8" />
    </Icon>
  )
);
CancelIcon.displayName = 'CancelIcon';

// Close icon alias
export const CloseIcon = CancelIcon;

// Menu/Hamburger icon
export const MenuIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M2 4h12M2 8h12M2 12h12" />
    </Icon>
  )
);
MenuIcon.displayName = 'MenuIcon';

// Chevron Down
export const ChevronDownIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M4 6l4 4 4-4" />
    </Icon>
  )
);
ChevronDownIcon.displayName = 'ChevronDownIcon';

// Chevron Up
export const ChevronUpIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M4 10l4-4 4 4" />
    </Icon>
  )
);
ChevronUpIcon.displayName = 'ChevronUpIcon';

// Chevron Left
export const ChevronLeftIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M10 4L6 8l4 4" />
    </Icon>
  )
);
ChevronLeftIcon.displayName = 'ChevronLeftIcon';

// Chevron Right
export const ChevronRightIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M6 4l4 4-4 4" />
    </Icon>
  )
);
ChevronRightIcon.displayName = 'ChevronRightIcon';

// Arrow Left
export const ArrowLeftIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M12 8H4M4 8l4-4M4 8l4 4" />
    </Icon>
  )
);
ArrowLeftIcon.displayName = 'ArrowLeftIcon';

// Arrow Right
export const ArrowRightIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M4 8h8M12 8l-4-4M12 8l-4 4" />
    </Icon>
  )
);
ArrowRightIcon.displayName = 'ArrowRightIcon';

// External Link
export const ExternalLinkIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M10 2h4v4M14 2L8 8M12 14H3a1 1 0 01-1-1V4a1 1 0 011-1h5" />
    </Icon>
  )
);
ExternalLinkIcon.displayName = 'ExternalLinkIcon';

// Home
export const HomeIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M2 7l6-5 6 5M3 6v7a1 1 0 001 1h8a1 1 0 001-1V6" />
    </Icon>
  )
);
HomeIcon.displayName = 'HomeIcon';

// Search
export const SearchIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <circle cx="7" cy="7" r="5" />
      <path d="M10.5 10.5L14 14" />
    </Icon>
  )
);
SearchIcon.displayName = 'SearchIcon';

// Settings
export const SettingsIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1v2M8 13v2M15 8h-2M3 8H1M13.7 2.3l-1.4 1.4M3.7 12.3l-1.4 1.4M13.7 13.7l-1.4-1.4M3.7 3.7L2.3 2.3" />
    </Icon>
  )
);
SettingsIcon.displayName = 'SettingsIcon';