import React from 'react';
import { Icon, IconProps } from './Icon';

// Edit/Pencil icon
export const EditIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M11 2l2 2L5 12l-3 1 1-3 8-8z" />
      <path d="M10 3l2 2" />
    </Icon>
  )
);
EditIcon.displayName = 'EditIcon';

// Delete/Trash icon
export const DeleteIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M3 4h10M5 4V2h6v2M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" />
      <path d="M7 7v4M9 7v4" />
    </Icon>
  )
);
DeleteIcon.displayName = 'DeleteIcon';

// Copy icon
export const CopyIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <rect x="5" y="5" width="8" height="10" rx="1" />
      <path d="M3 11V2a1 1 0 011-1h7" />
    </Icon>
  )
);
CopyIcon.displayName = 'CopyIcon';

// Share icon
export const ShareIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <circle cx="12" cy="3" r="2" />
      <circle cx="4" cy="8" r="2" />
      <circle cx="12" cy="13" r="2" />
      <path d="M5.5 7L10.5 4M5.5 9L10.5 12" />
    </Icon>
  )
);
ShareIcon.displayName = 'ShareIcon';

// Download icon
export const DownloadIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M8 3v7M8 10l3-3M8 10L5 7" />
      <path d="M2 13h12" />
    </Icon>
  )
);
DownloadIcon.displayName = 'DownloadIcon';

// Save icon
export const SaveIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M11 14H3a1 1 0 01-1-1V3a1 1 0 011-1h8l3 3v10a1 1 0 01-1 1h-2z" />
      <path d="M10 14v-4H6v4M4 2v4h8" />
    </Icon>
  )
);
SaveIcon.displayName = 'SaveIcon';

// Refresh icon
export const RefreshIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M2 8a6 6 0 016-6h3M13 8a6 6 0 01-6 6H4" />
      <path d="M11 2l2 2-2 2M5 14l-2-2 2-2" />
    </Icon>
  )
);
RefreshIcon.displayName = 'RefreshIcon';

// Print icon
export const PrintIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M4 6V2h8v4" />
      <rect x="2" y="6" width="12" height="6" rx="1" />
      <path d="M4 10v4h8v-4" />
    </Icon>
  )
);
PrintIcon.displayName = 'PrintIcon';

// Link icon
export const LinkIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M7 9L5 11a2.83 2.83 0 004 4l2-2M9 7l2-2a2.83 2.83 0 00-4-4L5 3" />
      <path d="M6 10l4-4" />
    </Icon>
  )
);
LinkIcon.displayName = 'LinkIcon';

// Duplicate icon
export const DuplicateIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <rect x="2" y="2" width="8" height="8" rx="1" />
      <path d="M6 6h7a1 1 0 011 1v7a1 1 0 01-1 1H6" />
    </Icon>
  )
);
DuplicateIcon.displayName = 'DuplicateIcon';

// Archive icon
export const ArchiveIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M2 3h12v3H2z" />
      <path d="M3 6v7a1 1 0 001 1h8a1 1 0 001-1V6" />
      <path d="M6 9h4" />
    </Icon>
  )
);
ArchiveIcon.displayName = 'ArchiveIcon';

// Mail/Email icon
export const MailIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <rect x="2" y="3" width="12" height="10" rx="1" />
      <path d="M2 3l6 4 6-4" />
    </Icon>
  )
);
MailIcon.displayName = 'MailIcon';

// User/Person icon
export const UserIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <circle cx="8" cy="5" r="3" />
      <path d="M3 14a5 5 0 0110 0" />
    </Icon>
  )
);
UserIcon.displayName = 'UserIcon';

// Lock icon
export const LockIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <rect x="3" y="7" width="10" height="7" rx="1" />
      <path d="M5 7V5a3 3 0 016 0v2" />
      <circle cx="8" cy="10" r="1" />
    </Icon>
  )
);
LockIcon.displayName = 'LockIcon';

// Unlock icon
export const UnlockIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <rect x="3" y="7" width="10" height="7" rx="1" />
      <path d="M5 7V5a3 3 0 014.5-2.6" />
      <circle cx="8" cy="10" r="1" />
    </Icon>
  )
);
UnlockIcon.displayName = 'UnlockIcon';