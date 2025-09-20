import React from 'react';
import { Icon, IconProps } from './Icon';

// Generic Credit Card icon
export const CreditCardIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <rect x="2" y="4" width="12" height="8" rx="1" />
      <path d="M2 7h12" />
      <path d="M4 10h2" />
    </Icon>
  )
);
CreditCardIcon.displayName = 'CreditCardIcon';

// Bank icon
export const BankIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M2 6l6-3 6 3M2 6v7h12V6" />
      <path d="M4 8v3M8 8v3M12 8v3" />
      <path d="M2 13h12" />
    </Icon>
  )
);
BankIcon.displayName = 'BankIcon';

// Wallet icon
export const WalletIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M13 4H3a1 1 0 00-1 1v8a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1z" />
      <path d="M14 7h-3a1 1 0 000 2h3" />
      <circle cx="11" cy="8" r="0.5" fill="currentColor" />
      <path d="M4 4V3a1 1 0 011-1h6" />
    </Icon>
  )
);
WalletIcon.displayName = 'WalletIcon';

// Dollar sign icon
export const DollarIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M8 2v12M11 4H6a2 2 0 000 4h4a2 2 0 010 4H5" />
    </Icon>
  )
);
DollarIcon.displayName = 'DollarIcon';

// Bitcoin icon (simplified)
export const BitcoinIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M6 2v2M10 2v2M6 12v2M10 12v2" />
      <path d="M5 4h5a2.5 2.5 0 010 5H5h5a2.5 2.5 0 010 5H5V4z" />
    </Icon>
  )
);
BitcoinIcon.displayName = 'BitcoinIcon';

// Ethereum icon (simplified)
export const EthereumIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M8 2l-4 6 4 2 4-2-4-6z" />
      <path d="M4 8l4 6 4-6-4 2-4-2z" />
    </Icon>
  )
);
EthereumIcon.displayName = 'EthereumIcon';

// QR Code icon
export const QRCodeIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <rect x="2" y="2" width="5" height="5" />
      <rect x="9" y="2" width="5" height="5" />
      <rect x="2" y="9" width="5" height="5" />
      <rect x="3.5" y="3.5" width="2" height="2" fill="currentColor" />
      <rect x="10.5" y="3.5" width="2" height="2" fill="currentColor" />
      <rect x="3.5" y="10.5" width="2" height="2" fill="currentColor" />
      <rect x="9" y="9" width="1" height="1" fill="currentColor" />
      <rect x="11" y="9" width="1" height="1" fill="currentColor" />
      <rect x="13" y="9" width="1" height="1" fill="currentColor" />
      <rect x="9" y="11" width="1" height="1" fill="currentColor" />
      <rect x="11" y="11" width="1" height="1" fill="currentColor" />
      <rect x="13" y="11" width="1" height="1" fill="currentColor" />
      <rect x="9" y="13" width="1" height="1" fill="currentColor" />
      <rect x="11" y="13" width="1" height="1" fill="currentColor" />
      <rect x="13" y="13" width="1" height="1" fill="currentColor" />
    </Icon>
  )
);
QRCodeIcon.displayName = 'QRCodeIcon';

// Receipt icon
export const ReceiptIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M3 2h10v12l-2-1-1.5 1L8 13l-1.5 1L5 13l-2 1V2z" />
      <path d="M5 5h6M5 7h6M5 9h4" />
    </Icon>
  )
);
ReceiptIcon.displayName = 'ReceiptIcon';

// Shield Check (for security/verification)
export const ShieldCheckIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M8 2l5 2v5c0 3-2 5-5 6-3-1-5-3-5-6V4l5-2z" />
      <path d="M5 7l2 2 4-4" />
    </Icon>
  )
);
ShieldCheckIcon.displayName = 'ShieldCheckIcon';

// Lightning (for instant payments)
export const LightningIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M9 2L3 9h4l-1 5 6-7h-4l1-5z" />
    </Icon>
  )
);
LightningIcon.displayName = 'LightningIcon';

// Tag (for pricing)
export const TagIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M2 8L8 2h5v5l-6 6a1.41 1.41 0 01-2 0L2 10a1.41 1.41 0 010-2z" />
      <circle cx="10.5" cy="5.5" r="0.5" fill="currentColor" />
    </Icon>
  )
);
TagIcon.displayName = 'TagIcon';

// Trending Up (for growth/profit)
export const TrendingUpIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'children'>>(
  (props, ref) => (
    <Icon ref={ref} {...props}>
      <path d="M2 11l4-4 3 3 5-5" />
      <path d="M11 5h3v3" />
    </Icon>
  )
);
TrendingUpIcon.displayName = 'TrendingUpIcon';